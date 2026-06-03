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
# Stage 2b: Azure SDK runtime closure (flat, self-contained)
# ============================================
# Next 16 + Turbopack's standalone tracer does not reliably bundle the
# @azure/* SDKs (dynamic requires through pnpm's symlinked store), so the
# maintainer form's Azure Table write path is MISSING from .next/standalone
# and the server action throws ERR_MODULE_NOT_FOUND at runtime. Install the
# exact runtime closure FLAT here (npm hoists to a self-contained, symlink-free
# node_modules) and copy it into the standalone bundle in the runner stage.
#
# The two top-level versions below MUST match the exact (caret-free) versions in
# package.json — they are the single source of truth; bump in both places on
# upgrade. Transitive @azure/core-*/msal-* deps are resolved by npm here (not
# from pnpm-lock.yaml), so keep the top-level pins exact to bound that drift.
FROM node:20-alpine AS azure-deps
WORKDIR /azure
RUN npm init -y >/dev/null 2>&1 \
 && npm install --omit=dev --no-audit --no-fund --loglevel=error \
      @azure/identity@4.13.1 \
      @azure/data-tables@13.3.2

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

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
