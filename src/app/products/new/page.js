import { Suspense } from "react"
import ProductLearningClient from "@/app/products/new/ProductLearningClient"

export default function NewProductPage() {
  return <Suspense fallback={<div className="h-[calc(100vh-112px)] animate-pulse rounded-lg bg-[var(--gray-100)]" />}><ProductLearningClient /></Suspense>
}
