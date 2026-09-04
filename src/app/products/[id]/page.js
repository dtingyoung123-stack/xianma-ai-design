import { Suspense } from "react"
import ProductDetailClient from "@/app/products/[id]/ProductDetailClient"

export default async function ProductDetailPage({ params }) {
  const { id } = await params
  return <Suspense fallback={<div className="h-[calc(100vh-112px)] animate-pulse rounded-lg bg-[var(--gray-100)]" />}><ProductDetailClient productId={id} /></Suspense>
}
