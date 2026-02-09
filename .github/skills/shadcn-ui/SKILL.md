````skill
---
name: shadcn-ui
description: shadcn/ui component library patterns, best practices, and MCP integration. Use when building UI with shadcn/ui components, customizing components, or using the shadcn MCP server. Triggers on tasks involving component installation, UI composition, theming, or when explicitly asked about shadcn patterns.
license: MIT
metadata:
  author: beth-team
  version: "1.0.0"
  registry: https://ui.shadcn.com
---

# shadcn/ui Component Skill

This skill covers shadcn/ui component patterns, installation, customization, and MCP server integration for AI-assisted development.

## What is shadcn/ui?

shadcn/ui is **not a component library**—it's a code distribution system. You own the code. Components are copied into your project where you can customize them freely.

Key principles:
- **Open Code**: You get the actual component source code
- **Composition**: Components share a consistent, composable API
- **Beautiful Defaults**: Carefully designed defaults that work together
- **AI-Ready**: Open code for LLMs to read, understand, and modify

## MCP Server Integration

The shadcn MCP server enables AI assistants to interact directly with component registries.

### Configuration

**VS Code (GitHub Copilot):**
```bash
npx shadcn@latest mcp init --client vscode
```

Creates `.vscode/mcp.json`:
```json
{
  "servers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

**Other Clients:**
- Claude Code: `npx shadcn@latest mcp init --client claude`
- Cursor: `npx shadcn@latest mcp init --client cursor`
- Codex: Manual config in `~/.codex/config.toml`

### MCP Tools

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `get_project_registries` | List configured registries | Verify setup |
| `search_items_in_registries` | Search by name/function | "Find data table component" |
| `list_items_in_registries` | Browse all components | Explore options |
| `get_item_details_from_registries` | Get full source code | Understand implementation |
| `get_item_examples_from_registries` | Get usage examples | Learn patterns |
| `add_items_to_project` | Install components | "Add button and card" |

### Example MCP Prompts

```
# Discovery
"Show me all available components in the shadcn registry"
"What form components are available?"
"Find me a date picker"

# Details
"Show me the code for the dialog component"
"Get examples of the data-table component"
"What are the variants for the button component?"

# Installation
"Add button, card, and dialog to this project"
"Install all the form components"
"Add the chart component"
```

## Project Setup

### Initialize a new project

```bash
npx shadcn@latest init
```

This creates:
- `components.json` - Configuration
- `lib/utils.ts` - Utility functions (cn helper)
- `tailwind.config.ts` - Tailwind configuration
- `globals.css` - CSS variables for theming

### Configuration (components.json)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  },
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json"
  }
}
```

### Add components

```bash
# Single component
npx shadcn@latest add button

# Multiple components
npx shadcn@latest add button card dialog

# All components
npx shadcn@latest add --all
```

## Component Patterns

### Basic Usage

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click Me</Button>
      </CardContent>
    </Card>
  );
}
```

### Composition Pattern

shadcn/ui components are composable by design:

```tsx
// Dialog with custom trigger
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Settings</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
      <DialogDescription>Configure your preferences.</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### The cn() Utility

The `cn()` helper merges Tailwind classes intelligently:

```tsx
import { cn } from "@/lib/utils";

function MyComponent({ className, ...props }) {
  return (
    <div className={cn("base-styles", className)} {...props} />
  );
}
```

Implementation (uses clsx + tailwind-merge):
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Component Variants with cva

Use `class-variance-authority` for component variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
```

## Theming

### CSS Variables

shadcn/ui uses CSS variables for theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... more variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

### Using Theme Colors

```tsx
// In Tailwind classes
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
</div>

// Accessing in JS
const styles = {
  backgroundColor: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
};
```

### Dark Mode

Configure dark mode in `tailwind.config.ts`:

```ts
module.exports = {
  darkMode: ["class"],
  // ...
}
```

Toggle with a theme provider:

```tsx
'use client';

import { ThemeProvider } from "next-themes";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

## Form Patterns

### With React Hook Form + Zod

```tsx
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    // Handle submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Login</Button>
      </form>
    </Form>
  );
}
```

## Data Display

### DataTable Pattern

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function DataTable<T extends { id: string }>({ 
  columns, 
  data 
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => (
            <TableHead key={i}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            {columns.map((col, i) => (
              <TableCell key={i}>
                {typeof col.accessor === 'function' 
                  ? col.accessor(row) 
                  : String(row[col.accessor])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Accessibility

shadcn/ui components are built on Radix UI primitives which handle:

- Keyboard navigation
- Focus management
- ARIA attributes
- Screen reader announcements

### Ensure Accessibility in Custom Code

```tsx
// Always provide accessible labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Use sr-only for screen reader text
<span className="sr-only">Loading</span>

// Handle focus management
<Dialog onOpenChange={(open) => {
  if (!open) {
    // Return focus to trigger
    triggerRef.current?.focus();
  }
}}>
```

## Best Practices

### DO

- ✅ Accept `className` prop for composition
- ✅ Use `cn()` to merge classes
- ✅ Forward refs when needed
- ✅ Keep components focused and composable
- ✅ Use TypeScript for props
- ✅ Add loading/disabled states

### DON'T

- ❌ Modify components in `ui/` directly for one-off changes
- ❌ Override styles with `!important`
- ❌ Create wrapper components when composition works
- ❌ Skip accessibility testing
- ❌ Use deprecated patterns

### When to Customize vs Compose

**Compose** (use as-is with props):
```tsx
<Button size="lg" variant="outline">Large Outline</Button>
```

**Extend** (create specialized version):
```tsx
// components/IconButton.tsx
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
}

export function IconButton({ icon, className, ...props }: IconButtonProps) {
  return (
    <Button className={cn("p-2", className)} {...props}>
      {icon}
    </Button>
  );
}
```

**Customize** (modify source when pattern doesn't exist):
- Fork `ui/button.tsx` only for project-wide changes
- Document the customization

## Common Components Reference

| Component | Use For |
|-----------|---------|
| `Button` | Actions, form submissions |
| `Card` | Content containers |
| `Dialog` | Modal interactions |
| `Sheet` | Side panels |
| `Form` | Form containers with validation |
| `Input`, `Textarea` | Text inputs |
| `Select` | Dropdowns |
| `Checkbox`, `Radio`, `Switch` | Toggles |
| `Table` | Data display |
| `Tabs` | Content organization |
| `Toast` | Notifications |
| `Tooltip` | Contextual info |
| `Command` | Command palettes |
| `DropdownMenu` | Action menus |
| `NavigationMenu` | Site navigation |
| `Avatar` | User images |
| `Badge` | Status indicators |
| `Skeleton` | Loading placeholders |

## Troubleshooting

### Component not found
```bash
# Check available components
npx shadcn@latest add --help

# Search via MCP
"List all components in the shadcn registry"
```

### Styling conflicts
- Ensure Tailwind is properly configured
- Check CSS variable definitions
- Use `cn()` for class merging

### Dark mode not working
- Verify `darkMode: ["class"]` in tailwind.config
- Check ThemeProvider is wrapping your app
- Ensure CSS variables have dark mode overrides

### TypeScript errors
- Run `npx shadcn@latest add [component]` to get latest types
- Check component is exported from `ui/` index

````