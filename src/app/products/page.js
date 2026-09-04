import Link from "next/link"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import PageShell from "@/components/PageShell"
import ProductLibraryClient from "@/app/products/ProductLibraryClient"

export default function ProductsPage() {
  return (
    <PageShell
      pathname="/products"
      description="建立准确、可核验、可复用的商品视觉档案"
      actions={<Link href="/products/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)]"><Plus size={16} />学习新商品</Link>}
    >
      <Suspense fallback={<ProductLibrarySkeleton />}>
        <ProductLibraryClient />
      </Suspense>
    </PageShell>
  )
}

function ProductLibrarySkeleton() {
  return <div className="grid gap-4"><div className="h-20 animate-pulse rounded-lg bg-[var(--gray-100)]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-lg bg-[var(--gray-100)]" />)}</div></div>
}
