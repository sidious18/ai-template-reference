# Next.js Refactoring

## Unnecessary Client Components

**Problem:** Components marked `'use client'` when they only render data. This
bloats the client bundle and prevents server-side rendering benefits.

**Rule:** Remove `'use client'` from components that do not use hooks, event handlers,
browser APIs, or Context.

### Before (violation)

    'use client'; // unnecessary — no hooks or interactivity

    export function ProductCard({ product }: { product: Product }) {
      return (
        <div className="card">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <span>${product.price}</span>
        </div>
      );
    }

### After

    // No 'use client' — this is a Server Component
    export function ProductCard({ product }: { product: Product }) {
      return (
        <div className="card">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <span>${product.price}</span>
        </div>
      );
    }

---

## useEffect for Data Fetching

**Problem:** Using `useEffect` + `useState` to fetch data in components that could
be Server Components. This causes waterfalls, loading spinners, and layout shift.

**Rule:** Fetch data in **Server Components** using `async/await`. Use `useEffect`
only for client-side-only data (real-time, user-triggered).

### Before (violation)

    'use client';

    export function ProductList() {
      const [products, setProducts] = useState<Product[]>([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        fetch('/api/products')
          .then(res => res.json())
          .then(data => { setProducts(data); setLoading(false); });
      }, []);

      if (loading) return <Spinner />;
      return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
    }

### After

    // Server Component — no hooks, no loading state needed
    export default async function ProductList() {
      const products = await getProducts();
      return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
    }

---

## High Client Boundary

**Problem:** `'use client'` is declared on a parent component that wraps many
children, forcing them all into the client bundle.

**Rule:** Push the `'use client'` boundary **as deep as possible**. Only the
interactive leaf should be a Client Component.

### Before (violation)

    'use client'; // entire page is client — everything below is bundled

    export default function ProductPage({ product }: Props) {
      const [quantity, setQuantity] = useState(1);
      return (
        <div>
          <ProductHeader product={product} />     {/* static — doesn't need client */}
          <ProductDetails product={product} />    {/* static */}
          <QuantityPicker value={quantity} onChange={setQuantity} />  {/* interactive */}
          <RelatedProducts />                     {/* static */}
        </div>
      );
    }

### After

    // Server Component — no 'use client'
    export default function ProductPage({ product }: Props) {
      return (
        <div>
          <ProductHeader product={product} />
          <ProductDetails product={product} />
          <QuantityPicker defaultQuantity={1} />   {/* only this is 'use client' */}
          <RelatedProducts />
        </div>
      );
    }

    // QuantityPicker.tsx
    'use client';
    export function QuantityPicker({ defaultQuantity }: Props) {
      const [quantity, setQuantity] = useState(defaultQuantity);
      return <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} />;
    }

---

## Refactoring Checklist

- No `'use client'` on components that only render data
- No `useEffect` for initial data fetching — data comes from Server Components
- `'use client'` boundary pushed to the smallest interactive leaf
- Server Actions used for mutations instead of API Route Handlers
- `loading.tsx` and `error.tsx` present for async route segments
