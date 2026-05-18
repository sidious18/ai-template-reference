# Frontend Guide: Next.js (App Router)

Use this guide for Next.js projects using the App Router (13.4+).

## Stack Assumptions

- Next.js 14+ with App Router
- React 18+ Server Components by default
- TypeScript strict mode
- Tailwind CSS or CSS Modules for styling
- Server Actions or Route Handlers for mutations

## Server vs Client Rules

- Components are Server Components by default — do not add `'use client'` unless required
- Add `'use client'` only when the component uses: hooks, event handlers, browser APIs, or Context
- Never import a Server Component into a Client Component — pass as children instead
- Keep the `'use client'` boundary as deep in the tree as possible
- Data fetching belongs in Server Components — pass data down as props to Client Components

## Routing Rules

- One `page.tsx` per route segment — keep it thin (composition only)
- Use `layout.tsx` for shared UI that persists across child routes
- Use `loading.tsx` and `error.tsx` for built-in Suspense and error boundaries
- Dynamic routes use `[param]` folders — validate params before use
- Parallel routes (`@slot`) and intercepting routes `(.)` only when the UX requires them
- Route groups `(group)` for organizing without affecting the URL

## Data Fetching Rules

- Fetch data in Server Components using `async` functions — no `useEffect` for initial data
- Use `fetch` with Next.js caching or direct database/ORM calls in Server Components
- Deduplicate requests with React `cache()` for the same render pass
- Revalidate with `revalidatePath` or `revalidateTag` — avoid time-based revalidation unless appropriate
- For client-side data: use SWR or React Query, not raw `useEffect` + `useState`

## Server Actions Rules

- Define Server Actions with `'use server'` at the top of the function or file
- Keep actions in separate files (`actions.ts`) — do not inline in component files
- Validate all inputs inside the action — the client is untrusted
- Return structured results `{ success, data, error }` — do not throw for expected failures
- Use `revalidatePath` or `revalidateTag` after mutations to refresh cached data
- Prefer Server Actions over API Route Handlers for form submissions and mutations

## File Organization Rules

- Group by feature or domain, not by file type
- Co-locate components, actions, and types with their route segment
- Shared components go in `components/` at the app root
- Shared utilities in `lib/`, shared types in `types/`
- Keep `app/` clean — business logic belongs in `lib/` or feature modules

## Performance Rules

- Use `<Image>` from `next/image` for all images — never raw `<img>`
- Use `<Link>` from `next/link` for all internal navigation — never raw `<a>`
- Lazy-load heavy Client Components with `dynamic()` and `ssr: false` when appropriate
- Avoid importing large libraries in Server Components that ship to the client bundle
- Use `generateStaticParams` for static generation of dynamic routes when data is known at build time

## Workflow

1. Determine if the page needs client interactivity or can stay a Server Component
2. Fetch data in the Server Component layer
3. Build the UI — push `'use client'` boundaries down
4. Add Server Actions for mutations
5. Handle loading and error states via `loading.tsx` and `error.tsx`
6. Verify server/client split is correct — no unnecessary client bundles

## Self-Check

1. No `'use client'` on components that only render data
2. No `useEffect` for initial data fetching — data comes from Server Components
3. All Server Actions validate their inputs
4. `<Image>` and `<Link>` used instead of raw HTML elements
5. Business logic is not in `page.tsx` — pages compose, they don't compute
6. Loading and error states are handled for every async boundary
