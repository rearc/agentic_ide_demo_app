---
paths:
  - "frontend/**/*.jsx"
  - "frontend/**/*.tsx"
---

# Tailwind CSS for Component Styling

> **Authoritative source:** [`docs/coding_standards.md`](../../docs/coding_standards.md),
> section 7 (`CSS`). This file is the always-on excerpt agents see while editing;
> the standards doc is what code review checks against. If the two disagree, the
> standards doc wins - fix this file.

Style React components with Tailwind utility classes by default. Inline styles and custom CSS are allowed **only** for the narrow cases below, where Tailwind genuinely cannot express the value.

## Rules

- Use Tailwind utility classes on elements via `className` for all **static** styling.
- Never create or import custom **per-component** CSS/SCSS files.
- Never use CSS-in-JS libraries (styled-components, emotion, etc.).
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) and state variants (`hover:`, `focus:`, `disabled:`) instead of custom pseudo-class CSS.
- When class lists get long, extract them into a variable or use `clsx`/`cn` — not into a CSS file.

## Allowed exceptions (narrow — do not abuse)

- **Inline `style={{}}` for DYNAMIC/runtime values Tailwind can't express statically** — e.g. per-card accent CSS custom properties (`--color-card-*`), computed `linear-gradient` / `color-mix(...)`, or an index-driven `animationDelay`. Never use inline styles for static values Tailwind already covers.
- **Global CSS in `frontend/src/index.css` only** — `@theme` design tokens, keyframe animations, and `react-grid-layout` overrides. Not per-component styling.

## Examples

```jsx
// GOOD — utilities for static styling
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>

// GOOD — inline style ONLY to pass a dynamic CSS var Tailwind can't express
<div style={{ '--color-card-accent': card.accent }} className="bg-[var(--color-card-accent)]">…</div>

// BAD — inline style for a STATIC value (use utilities)
<button style={{ backgroundColor: 'blue', color: 'white' }}>Save</button>

// BAD — custom per-component CSS class
<button className="save-button">Save</button>
```
