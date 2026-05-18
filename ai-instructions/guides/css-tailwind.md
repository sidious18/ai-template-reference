# CSS Guide: Tailwind CSS + Semantic Layers

Use this guide for styling work in any project that uses Tailwind CSS.

## Stack Assumptions

- Tailwind CSS 3.x+
- PostCSS pipeline configured
- `@layer components` and `@layer utilities` available
- Project uses a main CSS file (e.g., `index.css` or `globals.css`)

## Two-Tier Strategy

- **Tier 1 — Tailwind utilities**: max 3 utilities per `className`. For truly one-off, non-repeated styles.
- **Tier 2 — Semantic classes**: via `@apply` inside `@layer components`. For any element with more than 3 utilities or any pattern that appears more than once.
- Never mix Tier 1 and Tier 2 in the same `className` attribute.
- Group related semantic classes in the CSS file with a comment header.

## Naming Rules

- Describe purpose, not appearance: `btn-primary` not `blue-rounded-button`
- Use BEM-like structure for sub-elements: `sidebar-header`, `sidebar-header__title`
- Prefix component-scoped classes with the component name
- State variants use double-dash: `card--active`, `card--disabled`

## Responsive Rules

- Use Tailwind breakpoints (`sm:`, `md:`, `lg:`) for Tier 1 adjustments
- For complex responsive layouts, extract to semantic classes with media queries inside `@apply`
- Mobile-first: base styles are mobile, breakpoints add complexity
- Avoid mixing `@media` with `@apply` when Tailwind breakpoints suffice

## Dark Mode Rules

- Use Tailwind `dark:` variant for Tier 1 utility adjustments
- For Tier 2 semantic classes, include dark mode inside the `@apply` block
- Keep all dark mode overrides co-located with their light mode counterparts
- Use CSS custom properties for theme tokens when the palette exceeds Tailwind's config

## Animation Rules

- Prefer Tailwind `transition-*` and `animate-*` utilities for simple effects
- Extract complex keyframe animations to the CSS file, not inline
- Keep animation durations under 300ms for UI feedback, under 500ms for transitions
- Avoid animating `width`, `height`, or `top`/`left` — use `transform` and `opacity`

## Workflow

1. Identify the element to style
2. If 3 or fewer utilities suffice → use Tier 1 inline
3. If more → create a semantic class in `@layer components`
4. Check if a similar class already exists — reuse before creating
5. Verify dark mode and responsive behavior
6. Run visual check in browser

## Self-Check

1. No `className` with more than 3 Tailwind utilities
2. Semantic classes describe purpose, not appearance
3. Dark mode works for all new styles
4. No duplicate semantic classes
5. Responsive behavior verified at mobile, tablet, and desktop breakpoints
