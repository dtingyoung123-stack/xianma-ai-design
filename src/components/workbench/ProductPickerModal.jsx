"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Search } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import { WorkbenchButton } from "@/components/workbench/Workbench"
import { initialProducts, productCategoryOptions } from "@/data/demo/products"
import { canViewProduct, getProductDisplayStatus } from "@/lib/product-prototype.mjs"

export function getProductReferenceImage(product) {
  const confirmed = product?.candidates?.find((candidate) => candidate.selected && candidate.status === "success" && candidate.src)
  const image = confirmed?.src || product?.images?.[0]?.src
  if (!image) return null
  return {
    id: `product-${product.id}-${product.versions?.at(-1)?.id || "confirmed"}`,
    src: image,
    name: `${product.name} · 商品确认图`,
    size: "商品智库确认版本",
    source: "商品智库",
    sourceType: "product-library",
    productId: product.id,
    versionId: product.versions?.at(-1)?.id || "confirmed",
  }
}

export function hasValidProductConfirmation(product) {
  return product?.status === "confirmed"
    && (product.candidates?.some((candidate) => candidate.status === "success" && candidate.selected && candidate.src)
      || product.versions?.some((version) => /确认/.test(version.label || "")))
}

function isInLibrary(product, library, userId) {
  if (library === "personal") return product.ownerId === userId
  if (library === "team") return ["team", "public"].includes(product.scope)
  return product.scope === "public" && product.publicReviewStatus === "approved"
}

const statusToneStyles = {
  neutral: { background: "var(--gray-100)", color: "var(--text-secondary)" },
  info: { background: "var(--info-bg)", color: "var(--info)" },
  warning: { background: "var(--warning-bg)", color: "var(--warning)" },
  success: { background: "var(--success-bg)", color: "var(--success)" },
  danger: { background: "var(--danger-bg)", color: "var(--danger)" },
}

export default function ProductPickerModal({
  products = initialProducts,
  onClose,
  onSelect,
  title = "选择商品",
  description = "选择已确认且当前账号可见的商品。",
  emptyText = "当前商品库暂无符合条件的已确认商品",
  userId = "demo-member",
  role = "member",
  width = "820px",
}) {
  const [library, setLibrary] = useState("personal")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products.filter((product) => {
      if (!hasValidProductConfirmation(product) || !canViewProduct(product, role, userId)) return false
      if (!isInLibrary(product, library, userId)) return false
      const matchesQuery = !normalizedQuery || `${product.name} ${product.category} ${product.source || ""}`.toLowerCase().includes(normalizedQuery)
      return matchesQuery && (category === "all" || product.category === category)
    })
  }, [category, library, products, query, role, userId])

  return (
    <WorkbenchPickerDialog
      eyebrow="商品智库"
      title={title}
      description={description}
      width={width}
      onClose={onClose}
      footer={<WorkbenchButton variant="ghost" onClick={onClose}>取消</WorkbenchButton>}
    >
      <div className="flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: "var(--border-light)" }}>
        {[{ key: "personal", label: "个人商品库" }, { key: "team", label: "团队商品库" }, { key: "public", label: "公共商品库" }].map((item) => (
          <button key={item.key} type="button" onClick={() => setLibrary(item.key)} className="min-h-8 rounded-md px-3 text-xs font-semibold" style={{ background: library === item.key ? "var(--brand-primary-soft)" : "var(--gray-50)", color: library === item.key ? "var(--brand-primary)" : "var(--text-secondary)" }} aria-pressed={library === item.key}>{item.label}</button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px]">
        <label className="flex min-h-9 items-center gap-2 rounded-md border px-3" style={{ borderColor: "var(--border-base)" }}>
          <Search size={14} className="text-[var(--text-disabled)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索商品名称或来源" aria-label="搜索商品名称或来源" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="按商品品类筛选" className="min-h-9 rounded-md border bg-white px-3 text-sm text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}>
          <option value="all">全部品类</option>
          {productCategoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      {filteredProducts.length ? (
        <div className="mt-3 grid max-h-[48vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {filteredProducts.map((product) => {
            const image = getProductReferenceImage(product)
            const displayStatus = getProductDisplayStatus(product.status, product.teamReviewStatus, product.publicReviewStatus, product.scope)
            return (
              <button key={product.id} type="button" onClick={() => onSelect(product)} className="flex gap-3 rounded-lg border p-3 text-left transition-colors hover:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)" }}>
                <SafeImage src={image?.src} alt={product.name} className="size-20 shrink-0 rounded-lg bg-[var(--gray-50)] object-contain" />
                <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5"><strong className="block truncate text-sm text-[var(--text-title)]">{product.name}</strong><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={statusToneStyles[displayStatus.tone] || statusToneStyles.neutral}>{displayStatus.tone === "success" && <CheckCircle2 size={12} />}{displayStatus.label}</span></span>
                  <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{product.category} · {product.source || "商品智库"}</span>
                  <span className="mt-2 block line-clamp-2 text-xs leading-5 text-[var(--text-body)]">{product.factSummary || product.description || "已完成商品事实确认，可用于生成与替换。"}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : <div className="mt-3 rounded-lg border border-dashed px-4 py-10 text-center text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>{emptyText}</div>}
    </WorkbenchPickerDialog>
  )
}
