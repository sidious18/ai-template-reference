# CSS Refactoring

## Max 3 Tailwind Utilities per `className`

**Problem:** AI generates 8-14 utility classes per element. JSX becomes unreadable. Styling
can't be found during code review. Dark-mode variants multiply the count further.

**Rule:** If a `className` needs more than 3 utility classes, extract it to a semantic class
in `index.css` using `@apply` inside `@layer components`.

---

### Before (violation — 8+ utilities)

```tsx
<div className="flex items-center justify-between h-12 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
  <button className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
```

### After (semantic class in `index.css`)

```tsx
<div className="toolbar-bar">
  <button className="btn-icon">
```

```css
/* src/index.css */
@layer components {
  .toolbar-bar {
    @apply flex items-center justify-between h-12 px-4
      bg-white dark:bg-gray-900 border-b border-gray-200
      dark:border-gray-700 shadow-sm;
  }
  .btn-icon {
    @apply flex items-center justify-center w-8 h-8 rounded-md
      hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
      text-gray-600 dark:text-gray-400;
  }
}
```

---

## Two-Tier Strategy

| Utilities count | Where to put it |
|---|---|
| 1-3 | Inline `className` — fine as-is |
| 4+ | Extract to `@layer components` with a semantic name |
| Repeated pattern | Always extract regardless of count |

## Naming Rules

- Describe **purpose**, not appearance: `toolbar-bar` not `flex-h-12-bg-white`
- Use BEM-like structure for sub-elements: `sidebar-header`, `sidebar-header__title`
- Group related classes together in `index.css` under a comment block

---

## How to Find Violations

Search for `className="` and count spaces — more than 3 tokens is a likely violation:

```bash
grep -rn 'className="' src/ | awk 'length($0) > 80'
```

Or in the editor, look for `className` lines that wrap to a second line.

---

## Refactoring Checklist

- Dense utility chains were extracted
- Semantic names describe purpose
- Repeated patterns were centralized
- JSX is easier to read after the change
