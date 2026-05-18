AI Next.js Guidelines (Claude / LLM)
Next.js 14+ | App Router | Server Components | TypeScript strict | Server Actions

These guidelines are loaded by an AI when generating or refactoring Next.js code.
Goal: correct server/client boundaries, minimal client bundles, type-safe data
flow, and idiomatic App Router patterns.

---

0. Defaults

- Next.js 14+ with App Router
- React 18+ Server Components by default
- TypeScript strict mode
- Server Actions for mutations
- Tailwind CSS or CSS Modules
- No `pages/` directory — App Router only

---

1. Server vs Client Component Model

Every component is a Server Component unless it declares `'use client'`.

When to add `'use client'`:
- Component uses `useState`, `useEffect`, `useRef`, or other hooks
- Component uses event handlers (`onClick`, `onChange`, `onSubmit`)
- Component uses browser APIs (`window`, `document`, `localStorage`)
- Component uses React Context (`useContext`)

Rules:
- Push the `'use client'` boundary as deep as possible — wrap the interactive
  part, not the whole page
- A Client Component cannot import a Server Component. Pass Server Components as
  `children` or via slots instead.
- Server Components can import and render Client Components
- Shared type imports do not create a boundary — only runtime imports matter

---

2. Data Fetching

Server Components fetch data directly — no hooks, no `useEffect`:

    async function ProductPage({ params }: { params: { id: string } }) {
      const product = await getProduct(params.id);
      return <ProductView product={product} />;
    }

Rules:
- Fetch in Server Components, pass data as props to Client Components
- Use React `cache()` to deduplicate the same fetch across a render tree
- Use `unstable_cache` or `fetch` cache for cross-request caching
- Revalidate with `revalidatePath` / `revalidateTag` after mutations
- For client-side dynamic data (polling, real-time), use SWR or React Query
  inside a `'use client'` component

---

3. Server Actions

Actions run on the server and can be called from Client Components.

    'use server';

    export async function createOrder(data: FormData) {
      const parsed = orderSchema.safeParse(Object.fromEntries(data));
      if (!parsed.success) return { error: parsed.error.flatten() };
      await db.orders.create({ data: parsed.data });
      revalidatePath('/orders');
      return { success: true };
    }

Rules:
- Define actions in dedicated files (`actions.ts`), not inline in components
- Always validate inputs inside the action — the client is untrusted
- Return structured results `{ success, data?, error? }` — do not throw for
  expected failures
- Call `revalidatePath` or `revalidateTag` after mutations
- Use `useActionState` or `useFormStatus` for pending states in the UI
- Prefer Server Actions over Route Handlers for form submissions

---

4. Route Organization

    app/
      (marketing)/          # Route group — no URL impact
        page.tsx            # Landing page
        about/page.tsx
      (app)/
        layout.tsx          # Authenticated layout
        dashboard/
          page.tsx
          loading.tsx
          error.tsx
        settings/
          page.tsx

Rules:
- `page.tsx` is thin — composition only, max 50 lines
- `layout.tsx` for persistent UI across child routes
- `loading.tsx` for Suspense fallback per route segment
- `error.tsx` for error boundaries per route segment
- `not-found.tsx` for custom 404 per segment
- Route groups `(name)` organize without affecting URLs
- Dynamic segments `[param]` validate params before use

---

5. Rendering Strategies

- **Static (default)**: pages without dynamic data are statically generated
- **Dynamic**: pages that use `cookies()`, `headers()`, `searchParams`, or
  uncached fetches render dynamically
- **ISR**: use `revalidate` option on fetch or `export const revalidate = N`
- **Streaming**: use `loading.tsx` or `<Suspense>` to stream parts of the page

Rules:
- Prefer static generation when data does not change per request
- Use `generateStaticParams` for dynamic routes with known params
- Do not force dynamic rendering unnecessarily — check if the data can be cached
- Use `<Suspense>` boundaries to stream slow parts without blocking the page

---

6. Component Patterns

- Pages compose widgets — no business logic in pages
- Interactive widgets are Client Components with minimal scope
- Data display widgets are Server Components that fetch their own data
- Forms use Server Actions with `useActionState` for progressive enhancement
- Modals and drawers use parallel routes (`@modal`) or client-side state

Common pattern — interactive island:

    // ServerPage.tsx (Server Component)
    export default async function Page() {
      const data = await getData();
      return (
        <div>
          <StaticHeader />
          <InteractiveFilter data={data} />  {/* Client Component */}
          <StaticFooter />
        </div>
      );
    }

---

7. Performance

- Use `next/image` for all images — automatic optimization, lazy loading
- Use `next/link` for all internal navigation — client-side transitions
- Use `next/font` for fonts — automatic optimization, no layout shift
- `dynamic()` with `ssr: false` for heavy client-only components
- Avoid importing server-only libraries in Client Components — they bloat the bundle
- Use `'server-only'` package to prevent accidental client imports of sensitive code

---

8. Metadata and SEO

- Export `metadata` or `generateMetadata` from `page.tsx` and `layout.tsx`
- Dynamic metadata uses `generateMetadata` with async data fetching
- Set `title`, `description`, and `openGraph` at minimum
- Use `robots.ts` and `sitemap.ts` for crawl control
- Structured data via JSON-LD in a `<script>` tag inside the page

---

9. Self-check before finishing

1. No `'use client'` on components that only render data
2. No `useEffect` for initial data fetching
3. Server Actions validate all inputs
4. `next/image`, `next/link`, `next/font` used everywhere applicable
5. Pages are thin composers — no business logic
6. Loading and error states handled per route segment
7. Client bundle does not include server-only code
8. Metadata exported for every public page
