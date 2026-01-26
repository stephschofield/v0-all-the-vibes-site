# Backlog

> *"I don't have time to explain things twice. Read this."*

Last updated: January 25, 2026

---

## Completed

| Task | Notes |
|------|-------|
| Initial setup | Beth agent system installed |
| Project assessment | CORRECTED: Full VS Code-style IDE UI exists for "All The Vibes Community" |
| Fix sparse checkout | Disabled git sparse-checkout that was hiding code |
| Add to Calendar feature | .ics download, Google Calendar, Outlook integration for events |
| Topic Requests Feature | Renamed speaker-signup.py to topic-requests.py, word cloud display, Supabase integration, removed AI/semantic search |
| DSPy Topic Modeling | Python service + scripts using Ollama llama3.2 for topic analysis |

---

## In Progress

---

## On Hold

- [ ] **Real calendar event data** — Replace hardcoded events with actual calendar data from user's Microsoft Calendar (.ics export)

---

## Backlog (Prioritized)

### High Priority (P1) — Technical Debt

- [ ] **Fix TypeScript errors** — `ignoreBuildErrors: true` is hiding problems. Audit and fix all TS issues.
- [ ] **Configure ESLint** — package.json has lint script but no eslint config exists
- [ ] **Add error boundaries** — No error.tsx for graceful error handling
- [ ] **Accessibility audit** — VS Code-style UI needs keyboard navigation, ARIA labels, screen reader support

### Medium Priority (P2) — Feature Enhancement

- [ ] **Additional real content integration** — CMS or API for non-calendar content
- [ ] **Working terminal** — TerminalStrip.tsx exists but may need real functionality
- [ ] **Functional file navigation** — Sidebar clicks should update editor content
- [ ] **Chat panel functionality** — ChatPanel.tsx needs actual AI integration or mock
- [ ] **Mobile responsiveness** — IDE metaphor on small screens needs consideration
- [ ] **Set up testing** — Add Vitest or Jest for component testing

### Low Priority (P3) — Polish

- [ ] **Performance optimization** — Bundle analysis, code splitting for heavy components
- [ ] **SEO setup** — Metadata, OG images, sitemap for the community site
- [ ] **CI/CD improvements** — GitHub Actions for testing, linting on PR
- [ ] **Documentation** — README should describe the actual project, not just v0.app boilerplate

---

## Architecture Overview

**"All The Vibes Community"** — A VS Code-themed community site for AI-assisted development

```
app/
├── page.tsx          # OSBackground + IDEContainer
├── layout.tsx
└── globals.css

types/
└── event.ts          # CalendarEvent type definition

lib/
├── utils.ts          # Tailwind class merging
├── ics-generator.ts  # ICS file generation
└── download.ts       # Browser file download

hooks/
└── useCalendarDownload.ts  # Calendar download hook

components/
├── AddToCalendarButton.tsx  # Calendar dropdown component
├── ide/              # VS Code shell (11 components)
│   ├── IDEContainer, IDEWindow, IDEContext
│   ├── Sidebar, TabBar, StatusBar, TitleBar
│   ├── EditorPane, ChatPanel, TerminalStrip
│   └── ResizeHandle
├── editor/           # Content display (4 components)
│   ├── MarkdownSection, EventCard
│   ├── CountdownWidget, SimpleBrowser
└── os/               # Desktop metaphor (3 components)
    ├── OSBackground, DesktopIcon, FloatingApps
```

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Use Beth orchestrator | Coordinated multi-agent workflows | Jan 25, 2026 |
| VS Code-style UI | IDE metaphor for developer community site | Pre-existing |
| shadcn/ui new-york style | Configured in components.json | Pre-existing |

---

## Status Summary

**For Leadership:**

Fully functional VS Code-themed community site for "All The Vibes Community" — a global community focused on AI-assisted development tools (GitHub Copilot, Claude Code, Codex, Replit, v0, Lovable).

**What's Working:**

- Full VS Code-style UI — 18 custom components
- IDE shell — Sidebar, tabs, status bar, title bar
- Content display — Events, markdown, countdown
- Desktop metaphor — OS background, floating apps
- Beth agent system — All 7 agents ready
- All 6 skills loaded
- Vercel deployment — Connected to v0.app

**Technical Debt:**

- TypeScript errors hidden by `ignoreBuildErrors: true`
- No ESLint configuration
- No error boundaries
- Accessibility not audited

**What's Coming:**

1. Fix TypeScript strictness
2. Accessibility audit
3. Real content integration

**Blockers:** None.

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
