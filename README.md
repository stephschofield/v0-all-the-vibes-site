# 🎨 All The Vibes Community

> A VS Code-themed community site for AI-assisted development—built entirely with AI-assisted development.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://v0-atv-site.vercel.app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/vV4dxqgDVWY)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

![Demo](public/screenshots/demo.gif)

## ✨ What is this?

**All The Vibes Community** is an immersive, VS Code-themed community hub for developers exploring AI-assisted coding tools. The entire UI recreates the IDE experience—complete with sidebar navigation, tabbed editors, terminal strips, and status bars—while serving as an event platform and community forum.

The site covers the emerging ecosystem of AI pair-programming tools:
- **GitHub Copilot** — Your AI pair programmer
- **Claude Code** — Anthropic's coding assistant  
- **OpenAI Codex** — GPT-powered code generation
- **Replit** — AI-native development environment
- **v0** — Vercel's generative UI platform
- **Lovable** — AI-first app builder

## 🖼️ Screenshots

| IDE Overview | Topics Page |
|:---:|:---:|
| ![IDE](public/screenshots/01-ide-overview.png) | ![Topics](public/screenshots/04-topics-page.png) |

| Tab Navigation | Sidebar |
|:---:|:---:|
| ![Tabs](public/screenshots/03-tabs-view.png) | ![Sidebar](public/screenshots/02-sidebar-interaction.png) |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    VS Code IDE Shell                         ││
│  │  ┌──────────┬────────────────────────────┬────────────────┐ ││
│  │  │          │         TabBar             │                │ ││
│  │  │          ├────────────────────────────┤                │ ││
│  │  │ Sidebar  │                            │   ChatPanel    │ ││
│  │  │          │        EditorPane          │                │ ││
│  │  │          │   (MarkdownSection,        │   (AI Chat)    │ ││
│  │  │          │    EventCard,              │                │ ││
│  │  │          │    CountdownWidget)        │                │ ││
│  │  │          │                            │                │ ││
│  │  ├──────────┴────────────────────────────┴────────────────┤ ││
│  │  │                   TerminalStrip                         │ ││
│  │  ├─────────────────────────────────────────────────────────┤ ││
│  │  │                     StatusBar                           │ ││
│  │  └─────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.0.10 with App Router |
| **UI** | React 19.2.0 + Tailwind CSS 4.1.9 |
| **Components** | shadcn/ui (new-york style) |
| **Deployment** | Vercel + Docker |

## 🎯 Features

The site is currently a static community/event hub with no backend integrations.

### 🖥️ Immersive IDE Experience
The entire site is wrapped in a pixel-perfect VS Code recreation:
- **TitleBar** — Window controls and branding
- **Sidebar** — Explorer-style navigation with collapsible sections
- **TabBar** — File-tab style navigation between content areas
- **EditorPane** — Main content rendering area
- **ChatPanel** — AI chat interface (cosmetic)
- **TerminalStrip** — Collapsible terminal-style panel
- **StatusBar** — Git info, language indicators, line counts

### 📅 Event Management
- **Countdown timers** to upcoming community events
- **One-click calendar downloads** — .ics, Google Calendar, Outlook
- **Event cards** with speaker info, times, and descriptions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/all-the-vibes-community.git
cd all-the-vibes-community

# Install dependencies
pnpm install
```

### Running Locally

```bash
# Start the Next.js dev server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main page (OS background + IDE)
│   ├── layout.tsx         # Root layout with providers
│   └── globals.css        # Global styles
├── components/
│   ├── ide/               # IDE shell components (11 files)
│   │   ├── IDEContainer   # Main IDE wrapper
│   │   ├── IDEWindow      # Window chrome
│   │   ├── Sidebar        # File explorer
│   │   ├── TabBar         # Editor tabs
│   │   ├── EditorPane     # Content area
│   │   ├── ChatPanel      # AI chat sidebar
│   │   ├── StatusBar      # Bottom status bar
│   │   └── ...more
│   ├── editor/            # Content components
│   │   ├── MarkdownSection
│   │   ├── EventCard
│   │   └── CountdownWidget
│   └── os/                # Desktop metaphor
│       ├── OSBackground
│       ├── DesktopIcon
│       └── FloatingApps
├── lib/
│   └── ics-generator.ts   # Calendar file generation
└── scripts/
    └── capture-ui.mjs     # Playwright screenshot script
```

## 🧪 Development

### Key Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript type checking
```

### UI Capture Script

Capture screenshots and video of the running UI:

```bash
# Install Playwright
pnpm add -D playwright
npx playwright install chromium

# Run capture (requires dev server running)
node scripts/capture-ui.mjs

# Convert to GIF (requires ffmpeg)
ffmpeg -i public/screenshots/demo.webm -vf "fps=10,scale=960:-1" demo.gif
```

## 🎨 Design System

Built on shadcn/ui with the **new-york** style variant:

| Token | Value |
|-------|-------|
| `--primary` | VS Code blue accent |
| `--background` | `#1e1e1e` (editor dark) |
| `--foreground` | `#d4d4d4` (editor text) |
| `--muted` | `#252526` (sidebar) |
| `--border` | `#3c3c3c` (subtle) |

Font stack: `var(--font-geist-mono)` for code, `var(--font-geist-sans)` for UI.

## 🤝 Contributing

We welcome contributions! This project follows the Beth-style workflow:

1. Check `Backlog.md` for available work
2. Move task to "In Progress" before starting
3. Complete work with full test coverage
4. Move task to "Completed"
5. Open PR with clear description

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for the full IDEO-style agent system.

## 📝 License

MIT — Use it, fork it, vibe with it.

## 🔗 Links

- **Live Site**: [v0-atv-site.vercel.app](https://v0-atv-site.vercel.app)
- **Build with v0**: [v0.app Chat](https://v0.app/chat/vV4dxqgDVWY)

---

<p align="center">
  <sub>Built with ❤️ and a whole lot of AI assistance</sub>
</p>