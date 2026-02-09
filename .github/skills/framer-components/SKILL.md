---
name: framer-components
description: 'Build custom React code components and overrides for Framer. Use when creating Framer components, adding property controls, writing code overrides, or extending Framer functionality. Triggers on: framer component, code component, property controls, addPropertyControls, ControlType, code override, withXXX override, framer motion in framer.'
---

# Framer Code Components

Build custom React components with visual property controls for Framer sites. This skill covers code components, property controls, code overrides, auto-sizing, and Framer Motion integration.

## When to Use This Skill

- Creating custom code components for Framer
- Adding property controls to make components configurable in the Framer UI
- Writing code overrides to modify layer properties and behavior
- Implementing auto-sizing for responsive components
- Using Framer Motion animations within components
- Building reusable component libraries for Framer

## Prerequisites

- React 18 knowledge (components must use React 18 compatible code)
- Access to Framer's built-in code editor
- Understanding of TypeScript (optional but recommended)

## Code Components

Code components are React components that render directly on the Framer canvas, in preview, and on published sites.

### Basic Component Structure

```tsx
export default function MyComponent(props) {
  return <div>Hello World</div>
}
```

### Component with Styling

```tsx
export default function Button(props) {
  const style = {
    display: "inline-block",
    backgroundColor: "orange",
    padding: 8,
    borderRadius: 4,
  }

  return <div style={style}>{props.text}</div>
}

Button.defaultProps = {
  text: "Click me",
}
```

## Property Controls

Property controls allow users to configure component props through the Framer UI.

### Adding Property Controls

```tsx
import { addPropertyControls, ControlType } from "framer"

export default function Button(props) {
  return (
    <button style={{ backgroundColor: props.tint, padding: 12 }}>
      {props.text}
    </button>
  )
}

Button.defaultProps = {
  text: "Button",
  tint: "#09F",
}

addPropertyControls(Button, {
  text: {
    type: ControlType.String,
    title: "Label",
    defaultValue: "Button",
  },
  tint: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#09F",
  },
})
```

### Available Control Types

| ControlType | Description | Value Type |
|-------------|-------------|------------|
| `String` | Text input (single or multi-line) | `string` |
| `Number` | Numeric input with optional range/stepper | `number` |
| `Boolean` | On/off checkbox | `boolean` |
| `Enum` | Dropdown or segmented control | `string` |
| `Color` | Color picker | `string` (rgb/rgba) |
| `ResponsiveImage` | Image picker with srcSet | `{ src, srcSet, alt }` |
| `File` | File picker | `string` (URL) |
| `Date` | Date picker | `string` (ISO 8601) |
| `Link` | URL input | `string` |
| `ComponentInstance` | Reference to another component | React node |
| `Array` | Repeatable values | `array` |
| `Object` | Grouped properties | `object` |
| `Transition` | Framer Motion transition editor | `object` |
| `EventHandler` | Exposes events in Interactions panel | `function` |
| `Font` | Font picker | `object` |
| `Padding` | CSS padding input | `string` |
| `BorderRadius` | CSS border-radius input | `string` |
| `Border` | Border style editor | `object` |
| `BoxShadow` | Shadow editor | `string` |
| `Cursor` | Cursor picker | `string` |

### Control Type Examples

#### String Control

```tsx
addPropertyControls(MyComponent, {
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "Hello",
    placeholder: "Enter title...",
    displayTextArea: true, // Multi-line input
    maxLength: 100,
  },
})
```

#### Number Control

```tsx
addPropertyControls(MyComponent, {
  rotation: {
    type: ControlType.Number,
    title: "Rotation",
    defaultValue: 0,
    min: 0,
    max: 360,
    step: 1,
    unit: "deg",
    displayStepper: true,
  },
})
```

#### Enum Control

```tsx
addPropertyControls(MyComponent, {
  size: {
    type: ControlType.Enum,
    title: "Size",
    defaultValue: "medium",
    options: ["small", "medium", "large"],
    optionTitles: ["Small", "Medium", "Large"],
    displaySegmentedControl: true,
  },
})
```

#### ResponsiveImage Control

```tsx
addPropertyControls(MyComponent, {
  image: {
    type: ControlType.ResponsiveImage,
    title: "Image",
  },
})

// Usage in component:
function MyComponent(props) {
  return (
    <img 
      src={props.image?.src}
      srcSet={props.image?.srcSet}
      alt={props.image?.alt}
    />
  )
}
```

#### Array Control

```tsx
addPropertyControls(MyComponent, {
  items: {
    type: ControlType.Array,
    title: "Items",
    maxCount: 10,
    control: {
      type: ControlType.Object,
      controls: {
        title: { type: ControlType.String, defaultValue: "Item" },
        icon: { type: ControlType.ResponsiveImage },
      },
    },
  },
})
```

#### EventHandler Control

```tsx
import { motion } from "framer-motion"

export function MyButton(props) {
  return <motion.div onTap={props.onTap}>Click me</motion.div>
}

addPropertyControls(MyButton, {
  onTap: {
    type: ControlType.EventHandler,
  },
})
```

### Hiding Controls Conditionally

```tsx
addPropertyControls(MyComponent, {
  showIcon: {
    type: ControlType.Boolean,
    title: "Show Icon",
    defaultValue: false,
  },
  icon: {
    type: ControlType.ResponsiveImage,
    title: "Icon",
    hidden(props) {
      return props.showIcon === false
    },
  },
})
```

### Adding Control Descriptions

```tsx
addPropertyControls(MyComponent, {
  apiKey: {
    type: ControlType.String,
    title: "API Key",
    description: "Get your key from [dashboard](https://example.com/api)",
  },
})
```

## Auto-Sizing

Control how your component sizes itself on the canvas.

### Layout Annotations

```tsx
/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight fixed
 */
export function MyComponent(props) {
  return <div style={{ width: "fit-content", height: 50 }}>Content</div>
}
```

**Layout Options:**
- `auto` — Component dictates its own size based on content
- `fixed` — Component fills 100% of its container
- `any` — Users can switch between auto and fixed (default)
- `any-prefer-fixed` — Same as `any`, but defaults to fixed

### Intrinsic Size (Default Insert Size)

```tsx
/**
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 100
 */
export function Card(props) {
  return <div style={{ width: "100%", height: "100%" }}>Card</div>
}
```

### Supporting Fixed Sizing

Spread the `style` prop to allow Framer to control dimensions:

```tsx
export function MyComponent(props) {
  const { style, ...rest } = props
  
  return (
    <div style={{ 
      backgroundColor: "blue",
      ...style  // Framer passes { width: "100%", height: "100%" } when fixed
    }}>
      Content
    </div>
  )
}
```

## Code Overrides

Code overrides are Higher Order Components that modify layer properties. They only run in preview and on published sites.

### Basic Override Structure

```tsx
import { forwardRef, type ComponentType } from "react"

export const withLowerOpacity = (Component): ComponentType => {
  return forwardRef((props, ref) => {
    return (
      <Component 
        ref={ref} 
        {...props} 
        style={{ ...props?.style, opacity: 0.5 }} 
      />
    )
  })
}
```

**Important:** Always:
1. Use `forwardRef` for React 18 compatibility
2. Spread `{...props}` to preserve existing functionality
3. Pass `ref` to the component

### Override Examples

#### Custom Attributes

```tsx
import { forwardRef, type ComponentType } from "react"

export function withDataAttributes(Component): ComponentType {
  return forwardRef((props, ref) => {
    return (
      <Component 
        ref={ref} 
        {...props} 
        id="my-element" 
        data-tracking="button-cta" 
      />
    )
  })
}
```

#### Click Tracking

```tsx
import { forwardRef, type ComponentType } from "react"

export function withClickTracking(Component): ComponentType {
  return forwardRef((props, ref) => {
    const handleClick = () => {
      // Track the click
      fetch("https://api.example.com/track", {
        method: "POST",
        body: JSON.stringify({ event: "click" }),
      })
      // Call original onClick if exists
      props?.onClick?.()
    }
    
    return <Component ref={ref} {...props} onClick={handleClick} />
  })
}
```

#### Dynamic Text

```tsx
import { forwardRef, type ComponentType } from "react"

export function withDynamicText(Component): ComponentType {
  return forwardRef((props, ref) => {
    const text = new Date().toLocaleDateString()
    return <Component ref={ref} {...props} text={text} />
  })
}
```

### Shared State Between Overrides

Use `createStore` for state that multiple overrides need to access:

```tsx
import { forwardRef, type ComponentType } from "react"
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"

const useStore = createStore({ count: 0 })

export const withCount = (Component): ComponentType => {
  return forwardRef((props, ref) => {
    const [store] = useStore()
    return <Component ref={ref} {...props} text={`Count: ${store.count}`} />
  })
}

export const withIncrement = (Component): ComponentType => {
  return forwardRef((props, ref) => {
    const [store, setStore] = useStore()
    const onTap = () => setStore({ count: store.count + 1 })
    return <Component ref={ref} {...props} onTap={onTap} />
  })
}
```

## Framer Motion Integration

Framer Motion is available in all code components:

```tsx
import { motion } from "framer-motion"

export function AnimatedBox(props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ width: 100, height: 100, backgroundColor: props.color }}
    />
  )
}
```

### Transition Property Control

```tsx
import { motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

export function AnimatedElement(props) {
  return (
    <motion.div
      animate={{ scale: props.scale }}
      transition={props.transition}
      style={{ width: 100, height: 100, backgroundColor: "#09F" }}
    />
  )
}

addPropertyControls(AnimatedElement, {
  scale: {
    type: ControlType.Number,
    defaultValue: 1,
    min: 0.5,
    max: 2,
    step: 0.1,
  },
  transition: {
    type: ControlType.Transition,
    defaultValue: { type: "spring", stiffness: 800, damping: 60 },
  },
})
```

## Detecting Render Context

Use `RenderTarget` to detect where your component is being rendered:

```tsx
import { RenderTarget } from "framer"

export function MyComponent(props) {
  const isCanvas = RenderTarget.current() === RenderTarget.canvas
  const isPreview = RenderTarget.current() === RenderTarget.preview
  
  if (isCanvas) {
    return <div>Canvas placeholder</div>
  }
  
  return <div>Live content</div>
}
```

**RenderTarget values:**
- `RenderTarget.canvas` — The Framer canvas
- `RenderTarget.preview` — Preview or live site
- `RenderTarget.export` — Export canvas
- `RenderTarget.thumbnail` — Project thumbnails

### Static Renderer Hook (for animations)

```tsx
import { useIsStaticRenderer } from "framer"

export function AnimatedComponent(props) {
  const isStatic = useIsStaticRenderer()
  
  if (isStatic) {
    return <div>Static preview</div>
  }
  
  return <motion.div animate={{ rotate: 360 }}>Animated</motion.div>
}
```

## Localization

Access locale info for multi-language sites:

```tsx
import { useLocaleInfo } from "framer"

export function LocalePicker(props) {
  const { activeLocale, locales, setLocale } = useLocaleInfo()
  
  return (
    <select
      value={activeLocale?.id ?? "default"}
      onChange={(e) => {
        const locale = locales.find((l) => l.id === e.target.value)
        if (locale) setLocale(locale)
      }}
    >
      {locales.map((locale) => (
        <option key={locale.id} value={locale.id}>
          {locale.name}
        </option>
      ))}
    </select>
  )
}
```

## Best Practices

1. **Always use defaultProps** — Prevents errors during development and when instances are created
2. **Spread props and style** — Preserve Framer's built-in functionality
3. **Use forwardRef in overrides** — Required for React 18 compatibility
4. **Avoid overriding `class`/`className`** — Framer relies on these for styling
5. **Use RenderTarget wisely** — Show placeholders on canvas for performance
6. **Keep components performant** — Avoid expensive operations that run on every render
7. **Use useLayoutEffect for dynamic sizing** — Works best with Framer's measuring system

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Component not showing | Check for React errors in console, ensure `export default` |
| Property controls not appearing | Verify `addPropertyControls` is called after component definition |
| Styling breaks on fixed size | Spread `{...props.style}` in your root element |
| Override breaks layer | Ensure you spread `{...props}` and pass `ref` |
| Animation stutters on canvas | Use `useIsStaticRenderer()` to disable animations on canvas |
| Auto-sizing not working | Add `@framerSupportedLayoutWidth/Height` annotations |

## References

- [Framer Developers Documentation](https://www.framer.com/developers/)
- [Property Controls Reference](https://www.framer.com/developers/property-controls)
- [Code Components Introduction](https://www.framer.com/developers/components-introduction)
- [Code Overrides Introduction](https://www.framer.com/developers/overrides-introduction)
- [Framer Motion](https://motion.dev/docs/framer)
