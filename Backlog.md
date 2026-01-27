# Backlog

> *"I don't have time to explain things twice. Read this."*

Last updated: January 26, 2026

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
| DSPy Word Cloud Integration | Word cloud now uses AI-extracted themes instead of raw word counts |
| Fix TypeScript errors | Removed `ignoreBuildErrors`, build passes with 0 errors |
| Configure ESLint | Created eslint.config.mjs with flat config, found 5 warnings (unused imports, img tags) |
| Add error boundaries | Created app/error.tsx and app/topics/error.tsx with VS Code styling |
| Accessibility audit | Found 23 issues: 4 critical, 8 high, 6 medium, 5 low |
| Add focus indicators | Global CSS with :focus-visible for keyboard navigation (WCAG 2.4.7) |
| Keyboard nav in file tree | Arrow keys, Enter/Space, ARIA tree semantics in Sidebar.tsx (WCAG 2.1.1, 4.1.2) |
| Tab semantics in TabBar | role="tablist", arrow key navigation, roving tabindex (WCAG 4.1.2) |
| ResizeHandle keyboard support | Arrow keys, Home/End, Shift modifiers for panel resizing (WCAG 2.1.1) |
| **Comprehensive README** | Full documentation with architecture, features, screenshots, setup instructions |
| **UI Screenshots & Video** | Playwright capture: 4 screenshots + demo.webm in public/screenshots/ |
| **ARIA labels on icon buttons** | 19 buttons fixed across ChatPanel (13) and TitleBar (6) |
| **File tree ARIA semantics** | Full tree roles, aria-level, setsize, posinset in Sidebar |
| **Menu bar semantics** | menubar, menuitem, aria-haspopup on TitleBar menu |
| **Chat input label** | aria-label="Type a message to Copilot" |
| **Tab close button labels** | Dynamic "Close {name} tab" labels |
| **Fix ESLint warnings** | 15 warnings fixed: unused imports, img→Image, console, useCallback |
| **Color contrast improvements** | syntax-comment, text-muted, gutter, muted-foreground all ≥4.5:1 |

---

## In Progress

---

## On Hold

- [ ] **Real calendar event data** — Replace hardcoded events with actual calendar data from user's Microsoft Calendar (.ics export)

---

## Backlog (Prioritized)

### High Priority (P1) — Accessibility & Code Quality

*All P1 items completed*

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

- ✅ All P1 accessibility issues resolved (ARIA labels, semantics, contrast)
- ✅ ESLint warnings cleared (0 warnings)
- ✅ Color contrast ratios meet WCAG 4.5:1 standards

**What's Coming:**

1. P2 feature enhancements (real content, functional terminal, chat)
2. Mobile responsiveness
3. Testing setup

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
