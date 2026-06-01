# Local Development Setup

## Prerequisites

- Node.js 18+ and pnpm
- Git

The site is currently a static community/event hub with no backend services, database, or external integrations, so no Docker, Python, or environment variables are required to run it locally.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Access the app at http://localhost:3000

---

## Common Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Run the production build locally
pnpm lint     # Run ESLint
```

---

## Docker (optional)

A production `Dockerfile` is included (Next.js standalone output) for container deployments:

```bash
# Build the image
docker build -t all-the-vibes-site .

# Run it
docker run -p 3000:3000 all-the-vibes-site
```

`docker-compose.yml` runs the same app container locally:

```bash
docker-compose up -d
```

---

## Common Issues

### Port Already in Use

```bash
# Find and kill the process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9
```

### Next.js Build/Cache Error

```bash
# Delete the .next folder and restart
rm -rf .next
pnpm dev
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |

---

## Stopping Services

```bash
# Stop Next.js: Ctrl+C in the terminal

# Stop Docker (if used)
docker-compose down
```
