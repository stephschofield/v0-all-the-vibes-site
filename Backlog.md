# Backlog

> *"I don't have time to explain things twice. Read this."*

Last updated: January 25, 2026

---

## Completed

| Task | Notes |
|------|-------|
| Initial setup | Beth agent system installed |
| Project assessment | Empty shell identified — infrastructure ready, no app code |

---

## In Progress

*Nothing currently in progress.*

---

## Backlog (Prioritized)

### High Priority (P1) — Foundation

- [ ] **Create app structure** — Add `app/` directory with layout.tsx, page.tsx, globals.css. This is blocking everything else.
- [ ] **Add lib utilities** — Create `lib/utils.ts` with cn() helper for tailwind class merging (required by shadcn/ui)
- [ ] **Define the product** — What IS "Futuristic IDE Design"? We need a PRD before building. Use @product-manager.
- [ ] **Install core UI components** — Add Button, Card, Input via shadcn/ui CLI once app structure exists
- [ ] **Configure ESLint** — Add proper linting rules (currently package.json has lint script but no eslint config)

### Medium Priority (P2) — Build Out

- [ ] **Design system definition** — Design tokens, color palette, typography for "futuristic IDE" aesthetic. Use @ux-designer.
- [ ] **Create homepage** — Landing page showcasing whatever this IDE design is supposed to be
- [ ] **Add theme provider** — Dark/light mode support with next-themes (already in dependencies)
- [ ] **Set up testing** — Add Vitest or Jest for unit/integration tests
- [ ] **Fix TypeScript strictness** — Remove `ignoreBuildErrors: true` from next.config.mjs (this is hiding problems)

### Low Priority (P3) — Polish

- [ ] **Add error boundaries** — Global error handling with error.tsx
- [ ] **Performance optimization** — Bundle analysis, Code splitting strategy
- [ ] **SEO setup** — Metadata, OG images, sitemap
- [ ] **CI/CD improvements** — GitHub Actions for testing, linting on PR

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Use Beth orchestrator | Coordinated multi-agent workflows | Jan 25, 2026 |
| shadcn/ui new-york style | Already configured in components.json | Jan 25, 2026 |
| Need PRD before building | Can't build "Futuristic IDE Design" without defining what that means | Jan 25, 2026 |

---

## Status Summary

**For Leadership:**

Project has full infrastructure (agents, skills, dependencies) but **zero application code**. It's a Next.js 16 / React 19 project with nothing to show.

**What's Working:**

- Beth agent (orchestrator) — Ready
- Full agent roster (7 agents) — Ready
- All skills (6 skills) — Loaded
- Dependencies — Next.js 16, React 19, shadcn/ui configured
- Vercel deployment — Connected to v0.app

**What's Missing:**

- No `app/` directory — can't even start the dev server
- No components — despite having all Radix dependencies installed
- No product definition — "Futuristic IDE Design" is just a name
- No lib utilities — cn() helper needed for shadcn/ui

**What's Coming:**

1. App structure scaffolding
2. Product definition (PRD)
3. Core UI implementation



**Blockers:** Can't build until someone defines what we're building.

---

## How We Track Work

This file is the single source of truth. When you start work:

1. Move the task to **In Progress**
2. Do the work
3. Move to **Completed** when done
4. Commit changes

No external tools. No databases. Just this markdown file.

---

*"Now you know what's happening. Questions? I'll answer them. Complaints? Keep them to yourself."*
