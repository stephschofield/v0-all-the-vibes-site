# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN pnpm build

# ============================================
# Stage 2b: Azure SDK runtime closure (flat, self-contained, fully pinned)
# ============================================
# Next 16 + Turbopack's standalone tracer does not reliably bundle the
# @azure/* SDKs (dynamic requires through pnpm's symlinked store), so the
# maintainer form's Azure Table write path is MISSING from .next/standalone
# and the server action throws ERR_MODULE_NOT_FOUND at runtime. Install the
# runtime closure FLAT here (npm hoists to a self-contained, symlink-free
# node_modules) and copy it into the standalone bundle in the runner stage.
#
# Reproducibility: we `npm ci` against a COMMITTED package.json + package-lock.json
# (docker/azure-runtime/) instead of a floating `npm install`. The lockfile pins
# the ENTIRE transitive closure (@azure/core-*, @azure/msal-*, etc.) to the exact
# versions pnpm resolved for the root build — so the container runs the same SDK
# graph that was built and typechecked, not whatever npm resolves fresh at image
# build time. To bump: edit docker/azure-runtime/package.json to match the root
# package.json, then `npm install --package-lock-only` in that dir and commit both.
FROM node:20-alpine AS azure-deps
WORKDIR /azure
COPY docker/azure-runtime/package.json docker/azure-runtime/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=error

# ============================================
# Stage 3: Production runner
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Overlay the flat Azure SDK closure into the standalone node_modules so the
# maintainer form's server action can require('@azure/identity' | '@azure/data-tables')
# at runtime (see Dockerfile "azure-deps" stage + next.config.mjs comment).
COPY --from=azure-deps --chown=nextjs:nodejs /azure/node_modules ./node_modules

# Build-time smoke test: fail the image build (and therefore CI / `az acr build`)
# if the exact runtime import path the server action uses is not satisfiable.
# This is the regression guard for the original ERR_MODULE_NOT_FOUND bug: if a
# future Next/Turbopack upgrade or an overlay change ever drops these modules (or
# the overlay clobbers next/react), the build breaks HERE instead of shipping a
# container that 200s with a silent RSC digest and writes nothing to the table.
# Uses ESM `import` (not require) to mirror lib/maintainers-db.ts's actual import
# semantics — ESM resolution is the exact mode the original failure occurred under
# — and asserts the real named exports (TableClient / DefaultAzureCredential).
RUN node --input-type=module -e "import { TableClient } from '@azure/data-tables'; import { DefaultAzureCredential } from '@azure/identity'; await import('next'); await import('react'); if (typeof TableClient !== 'function') throw new Error('@azure/data-tables: TableClient missing'); if (typeof DefaultAzureCredential !== 'function') throw new Error('@azure/identity: DefaultAzureCredential missing'); console.log('[smoke] azure SDK + next/react ESM import OK');"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
