# AI Agent Skills Demo Repository

This repository demonstrates GitHub Copilot's multi-agent system with custom agents, skills, and handoffs for building IDEO-style digital products.

## Architecture Overview

```
.github/
├── agents/        # Agent definitions (*.agent.md frontmatter + instructions)
├── skills/        # Domain knowledge for specific capabilities (SKILL.md files)
└── appmod/        # App modernization configurations
```

**Key insight**: Agents are role-based specialists (PM, Developer, Designer, etc.) while skills are domain-specific knowledge modules that agents load on-demand.

## Agent System

### Agent Definition Format
Agents use `.agent.md` files with YAML frontmatter defining:
- `name`, `description`, `model` - Identity
- `tools` - Available capabilities (codebase, readFile, editFiles, runSubagent, etc.)
- `handoffs` - Other agents this agent can transfer control to
- `infer: true` - Enables the agent to be invoked as a subagent

### The Seven Agents
| Agent | Purpose | Primary Tools |
|-------|---------|---------------|
| `Beth` | Orchestrator - Routes work, spawns subagents | `runSubagent`, search tools |
| `product-manager` | WHAT to build: PRDs, user stories, priorities, success metrics | PRD skill |
| `researcher` | User/market research, competitive analysis | Research synthesis |
| `ux-designer` | HOW it works: component specs, design tokens, accessibility | Framer skill |
| `developer` | React/TypeScript/Next.js - UI and full-stack | shadcn-ui skill, shadcn MCP, all editing tools |
| `security-reviewer` | Security audits, threat modeling, compliance | security-analysis skill |
| `tester` | QA, accessibility, performance testing | Testing tools |

### Product Manager vs UX Designer

These agents serve distinct purposes in the IDEO workflow:

| | Product Manager | UX Designer |
|---|---|---|
| **Focus** | WHAT to build, WHY, WHEN | HOW it looks, feels, behaves |
| **Outputs** | PRDs, user stories, RICE scores, roadmaps | Component specs, wireframes, design tokens, accessibility requirements |
| **Key Question** | "Is this worth building?" | "How should this work?" |
| **Example** | "Users need date filtering" (acceptance criteria) | "The date picker has these variants, states, and ARIA attributes" (spec) |

**Use Product Manager** when defining requirements, prioritizing features, or making build/no-build decisions.
**Use UX Designer** when specifying component behavior, design systems, or accessibility compliance.

### Subagent vs Handoff Pattern
- **Handoffs**: User clicks button → context transferred → user reviews
- **Subagents**: Autonomous execution → results returned → continue workflow

```typescript
// Subagent invocation pattern
runSubagent({
  agentName: "researcher",
  prompt: "Detailed task with expected output format...",
  description: "3-5 word description"
})
```

## Skills System

Skills are domain-knowledge modules in `.github/skills/<name>/SKILL.md`. Agents load skills when triggered by specific phrases.

| Skill | Location | Triggers |
|-------|----------|----------|
| PRD Generation | `skills/prd/` | "create a prd", "product requirements" |
| Framer Components | `skills/framer-components/` | "framer component", "property controls" |
| Vercel React Best Practices | `skills/vercel-react-best-practices/` | React/Next.js performance work |
| Web Design Guidelines | `skills/web-design-guidelines/` | "review my UI", "check accessibility" |
| shadcn/ui Components | `skills/shadcn-ui/` | "shadcn", "ui component", component installation |
| Security Analysis | `skills/security-analysis/` | "security review", "OWASP", "threat model", "compliance" |

## Development Conventions

### Tech Stack
- **React 19** with Server Components, Server Actions, `use`, `useOptimistic`
- **Next.js App Router** with streaming, Suspense, parallel routes
- **TypeScript** in strict mode, Zod for runtime validation
- **Styling**: Tailwind CSS with `class-variance-authority` (cva)

### Code Patterns

**Server Components as default** - Only add `'use client'` when needed for interactivity:
```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <Display data={data} />;
}

// Client Component (when needed)
'use client';
export function InteractiveWidget() { ... }
```

**Server Actions for mutations**:
```typescript
'use server';
export async function updateItem(formData: FormData) {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Invalid input' };
  // mutation logic
  revalidatePath('/path');
}
```

### Quality Standards
- WCAG 2.1 AA accessibility compliance
- Core Web Vitals in green (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Full TypeScript coverage, no `any`
- Unit tests for utilities, integration tests for features

## IDEO Design Thinking Integration

Apply human-centered design methodology across agent workflows:

| Phase | Agent | Activities |
|-------|-------|------------|
| **Empathize** | `@researcher` | User interviews, observation, pain point discovery |
| **Define** | `@product-manager` | Problem framing, requirements, success criteria |
| **Ideate** | `@ux-designer` | Solution exploration, design patterns, prototypes |
| **Prototype** | `@developer` | Build to learn, rapid iteration, feature spikes |
| **Test** | `@tester` | Validate assumptions, accessibility audits, performance |

Balance the three lenses: **Desirability** (user wants), **Feasibility** (technically possible), **Viability** (sustainable for business).

## React/Next.js Performance Patterns

Critical optimizations from [.github/skills/vercel-react-best-practices/AGENTS.md](.github/skills/vercel-react-best-practices/AGENTS.md):

### Eliminate Waterfalls (CRITICAL)
```typescript
// ❌ Sequential: 3 round trips
const user = await fetchUser();
const posts = await fetchPosts();
const comments = await fetchComments();

// ✅ Parallel: 1 round trip
const [user, posts, comments] = await Promise.all([
  fetchUser(), fetchPosts(), fetchComments()
]);
```

### Strategic Suspense Boundaries
```tsx
// Wrapper renders immediately, data streams in
function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <DataDisplay />  {/* Only this awaits data */}
      </Suspense>
      <Footer />
    </div>
  );
}
```

### Bundle Size Optimization
- **Avoid barrel imports**: `import { Check } from 'lucide-react'` → `import Check from 'lucide-react/dist/esm/icons/check'`
- **Dynamic imports**: Use `next/dynamic` for heavy components (Monaco, charts)
- **Defer non-critical**: Load analytics/tracking after hydration with `ssr: false`

### Server Action Security
Always authenticate inside Server Actions—they're public endpoints:
```typescript
'use server';
export async function deleteUser(userId: string) {
  const session = await verifySession();
  if (!session || session.user.id !== userId) throw unauthorized();
  // proceed with mutation
}
```

## Workflow Patterns

### New Feature Flow
1. `@Beth` → analyzes request, proposes workflow
2. `@product-manager` → defines requirements (uses PRD skill)
3. `@researcher` → validates user needs (optional)
4. `@ux-designer` → designs interface
5. `@developer` → implements in React/TypeScript
6. `@security-reviewer` → audits for vulnerabilities
7. `@tester` → verifies quality

### Quick Commands
```
@IDEO-Orchestrator Plan a feature for [description]
@product-manager Create a PRD for [feature]
@developer Implement [component/feature]
@tester Write tests for [component]
```

## File Naming Conventions

- Agents: `.github/agents/<name>.agent.md`
- Skills: `.github/skills/<skill-name>/SKILL.md`
- Components: `components/<Name>/<Name>.tsx` with `index.tsx` barrel
- Server Actions: `lib/actions/<domain>.ts`
- Data fetching: `lib/data/<domain>.ts`
