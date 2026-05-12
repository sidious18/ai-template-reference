AI CSS / Tailwind Guidelines (Claude / LLM)
Tailwind CSS 3.x+ | Semantic Extraction | Responsive | Dark Mode | Animation

These guidelines are loaded by an AI when generating or refactoring CSS and
Tailwind-based styling.
Goal: consistent utility usage, semantic extraction, maintainable responsive and
dark mode implementations.

---

0. Defaults

- Tailwind CSS 3.x+ with PostCSS
- `@layer components` for semantic classes
- Mobile-first responsive design
- Dark mode via `dark:` variant (class strategy)
- Max 3 Tailwind utilities per `className`
- Semantic class names describe purpose, not appearance

---

1. Utility Budget

Every `className` attribute must contain at most 3 Tailwind utility classes.

If more are needed, extract a semantic class in the main CSS file using `@apply`
inside `@layer components`.

Wrong:

    <div className="flex items-center justify-between h-12 px-4 bg-white dark:bg-gray-900 border-b">

Correct:

    <div className="toolbar-bar">

    @layer components {
      .toolbar-bar {
        @apply flex items-center justify-between h-12 px-4
               bg-white dark:bg-gray-900 border-b;
      }
    }

---

2. Semantic Naming

- Name by purpose: `card-header`, `nav-primary`, `btn-destructive`
- Never by appearance: `blue-box`, `big-text`, `rounded-shadow`
- Use BEM-like nesting for sub-elements: `card-header__title`, `card-header__actions`
- State variants use double-dash: `btn--disabled`, `card--highlighted`
- Group related semantic classes under a comment header in the CSS file

---

3. Responsive Design

- Base styles are mobile — breakpoints add complexity
- Use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`) for Tier 1 adjustments
- For complex responsive changes, include responsive variants inside `@apply`:

      @layer components {
        .hero-grid {
          @apply grid grid-cols-1 gap-4
                 md:grid-cols-2 md:gap-6
                 lg:grid-cols-3;
        }
      }

- Do not duplicate a semantic class per breakpoint — one class handles all sizes
- Test at mobile (320px), tablet (768px), and desktop (1280px) at minimum

---

4. Dark Mode

- Tailwind `dark:` variant for Tier 1 utility adjustments
- For Tier 2 semantic classes, include dark variants inside the `@apply` block:

      .surface-primary {
        @apply bg-white text-gray-900
               dark:bg-gray-900 dark:text-gray-100;
      }

- Co-locate dark and light variants — never separate dark styles into a different file
- For complex theming beyond Tailwind's palette, use CSS custom properties:

      :root { --surface: #ffffff; --text: #1a1a2e; }
      .dark { --surface: #111827; --text: #f3f4f6; }

- Apply custom properties via Tailwind `bg-[var(--surface)]` or semantic classes

---

5. Layout Patterns

- Use Flexbox for one-dimensional layouts (rows or columns)
- Use CSS Grid for two-dimensional layouts (rows AND columns)
- Do not approximate Grid layouts with nested Flexbox
- Use `gap` instead of margins between flex/grid children
- Avoid fixed widths — use `max-w-*`, `min-w-*`, and fluid units
- Use `container` class with `mx-auto` for centered page content

---

6. Typography

- Use Tailwind's type scale (`text-sm`, `text-base`, `text-lg`) — do not invent sizes
- Line height is set by Tailwind's text utilities — override only when the scale does not fit
- Truncation: use `truncate` for single-line, `line-clamp-*` for multi-line
- Font weight: use `font-medium` and `font-semibold` — avoid `font-bold` for body text

---

7. Spacing and Sizing

- Use Tailwind's spacing scale (`p-4`, `m-6`, `gap-2`) — do not use arbitrary values
- If an arbitrary value is needed, use Tailwind's bracket syntax: `p-[13px]` — and add a comment explaining why
- Consistent spacing: pick 4px or 8px base and stick to it
- Component padding: outer containers use larger spacing, inner elements use smaller

---

8. Animation and Transitions

- Prefer `transition-*` utilities for hover/focus effects
- Use `animate-*` for predefined animations (spin, bounce, pulse, ping)
- Custom animations go in the CSS file with `@keyframes` — not inline
- Keep UI feedback animations under 200ms
- Keep page transitions under 400ms
- Animate `transform` and `opacity` only — avoid animating layout properties

---

9. Self-check before finishing

1. No `className` with more than 3 Tailwind utilities
2. Semantic class names describe purpose, not appearance
3. Dark mode works for all new styles
4. Responsive behavior verified at mobile, tablet, desktop
5. No layout approximations (Grid used for 2D, Flexbox for 1D)
6. Consistent spacing from Tailwind's scale
7. Animations target `transform`/`opacity` only
8. No duplicate semantic classes
