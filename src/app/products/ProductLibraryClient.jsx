"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Archive,
  Box,
  Building2,
  Check,
  CircleAlert,
  ClipboardCheck,
  Eye,
  FilePenLine,
  FolderSearch,
  Globe2,
  LoaderCircle,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import OrganizationScopeSelector from "@/components/OrganizationScopeSelector"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import { WorkbenchButton } from "@/components/workbench/Workbench"
import { organizationTree } from "@/data/demo/admin"
import { productCategoryOptions } from "@/data/demo/products"
import { deleteStoredProduct, getServerProductState, readProductState, subscribeProductState, updateStoredProduct } from "@/lib/product-demo-store"
import {
  canAdjustProductScope,
  canArchiveProduct,
  canCancelPublicProductSubmission,
  canCancelTeamProductSubmission,
  canDeleteProduct,
  canContinueProduct,
  canRequestPublicProduct,
  canReviewPublicProduct,
  canReviewProduct,
  canReviseProduct,
  canSubmitProductForTeam,
  filterProducts,
  productDisplayStatusMeta,
  transitionProduct,
} from "@/lib/product-prototype.mjs"
import { CoverageSummary, ProductReviewDialog, ProductRoleSwitch, ProductStatusBadge } from "@/app/products/_components/ProductPrototypeUi"

const scopeOptions = [
  { id: "mine", label: "我创建的", icon: UserRound },
  { id: "team", label: "团队商品", icon: Building2 },
  { id: "public", label: "公共商品", icon: Globe2 },
]

export default function ProductLibraryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = ["member", "department_admin", "approval_admin", "system_admin"].includes(searchParams.get("role")) ? searchParams.get("role") : "member"
  const products = useSyncExternalStore(subscribeProductState, readProductState, getServerProductState)
  const [role, setRole] = useState(initialRole)
  const [scope, setScope] = useState(searchParams.get("scope") || "mine")
  const [reviewTab, setReviewTab] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [status, setStatus] = useState("all")
  const [scopeProduct, setScopeProduct] = useState(null)
  const [reviewProduct, setReviewProduct] = useState(null)
  const [deleteProduct, setDeleteProduct] = useState(null)
  const [toast, setToast] = useState("")
  const scenario = searchParams.get("state") || "ready"

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(""), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleProducts = useMemo(() => filterProducts(products, { scope, role, query, category, status, review: reviewTab }), [category, products, query, reviewTab, role, scope, status])
  const counts = useMemo(() => Object.fromEntries(scopeOptions.map((option) => [option.id, filterProducts(products, { scope: option.id, role }).length])), [products, role])
  const teamPendingCount = products.filter((product) => canReviewProduct(product, role)).length
  const publicPendingCount = products.filter((product) => canReviewPublicProduct(product, role)).length

  function changeRole(nextRole) {
    setRole(nextRole)
    const params = new URLSearchParams(searchParams.toString())
    params.set("role", nextRole)
    router.replace(`/products?${params.toString()}`, { scroll: false })
  }

  function openPendingApprovals() {
    setScope("team")
    setReviewTab("team")
    setQuery("")
    setCategory("all")
    setStatus("all")
  }

  function openPublicApprovals() {
    setScope("team")
    setReviewTab("public")
    setQuery("")
    setCategory("all")
    setStatus("all")
  }

  function applyTransition(product, event, message) {
    updateStoredProduct(product.id, (current) => transitionProduct(current, event))
    setToast(message)
  }

  if (scenario === "loading") return <LibraryLoading />
  if (scenario === "error") return <LibraryError onRetry={() => router.replace("/products")} />
  if (scenario === "forbidden") return <LibraryForbidden />

  return (
    <div className="grid gap-4">
      <section className="rounded-lg border bg-white p-3 shadow-[var(--shadow-card)]" style={{ borderColor: "var(--border-base)" }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-[var(--gray-100)] p-1" role="tablist" aria-label="商品范围">
            {scopeOptions.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={scope === id} onClick={() => { setScope(id); setReviewTab("") }} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors" style={scope === id ? { color: "var(--brand-primary)", background: "var(--white)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}><Icon size={15} />{label}<span className="rounded bg-[var(--gray-100)] px-1.5 py-0.5 text-[10px] tabular-nums">{counts[id]}</span></button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2"><ProductRoleSwitch role={role} onChange={changeRole} />{teamPendingCount > 0 && <button type="button" onClick={openPendingApprovals} className="inline-flex h-9 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}><ClipboardCheck size={14} />团队审批 {teamPendingCount}</button>}{publicPendingCount > 0 && <button type="button" onClick={openPublicApprovals} className="inline-flex h-9 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}><ClipboardCheck size={14} />公共审批 {publicPendingCount}</button>}</div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_160px_auto]">
          <label className="relative min-w-0"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-[var(--text-secondary)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索商品名称、品类或来源" className="h-10 w-full rounded-md border pl-9 pr-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm text-[var(--text-body)] outline-none" style={{ borderColor: "var(--border-base)" }}><option value="all">全部品类</option>{productCategoryOptions.map((option) => <option key={option}>{option}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm text-[var(--text-body)] outline-none" style={{ borderColor: "var(--border-base)" }}><option value="all">全部状态</option>{Object.entries(productDisplayStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>
          <button type="button" onClick={() => { setQuery(""); setCategory("all"); setStatus("all") }} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]" style={{ borderColor: "var(--border-base)" }}><RotateCcw size={15} />重置</button>
        </div>
      </section>

      {visibleProducts.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="商品列表">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              role={role}
              onAdjust={() => setScopeProduct(product)}
              onSubmitTeam={() => applyTransition(product, "submit_team", "已提交入团队审批")}
              onCancelTeam={() => applyTransition(product, "cancel_team", "已取消团队审批")}
              onReviewTeam={() => setReviewProduct({ product, type: "team" })}
              onSubmitPublic={() => applyTransition(product, "submit_public", "已提交公共商品审核")}
              onCancelPublic={() => applyTransition(product, "cancel_public", "已取消公共商品申请")}
              onReviewPublic={() => setReviewProduct({ product, type: "public" })}
              onDelete={() => setDeleteProduct(product)}
              onArchive={() => applyTransition(product, "archive", "商品已归档，历史证据和版本记录继续保留。")}
              onRevise={() => applyTransition(product, "revise", "已创建修订草稿，当前确认版本继续团队可用。")}
            />
          ))}
        </section>
      ) : <LibraryEmpty filtered={Boolean(query || category !== "all" || status !== "all" || reviewTab)} onClear={() => { setQuery(""); setCategory("all"); setStatus("all"); setReviewTab("") }} />}

      {scopeProduct && <ScopeDialog product={scopeProduct} role={role} onClose={() => setScopeProduct(null)} onSave={(visibleOrgIds) => {
        updateStoredProduct(scopeProduct.id, (product) => transitionProduct(product, "set_scope", { visibleOrgIds, at: "2026-09-02 16:10" }))
        setScopeProduct(null)
        setToast("团队可见组织已更新。")
      }} />}
      {reviewProduct && <ProductReviewDialog product={reviewProduct.product} reviewType={reviewProduct.type} role={role} onClose={() => setReviewProduct(null)} onApprove={(visibleOrgIds) => {
        const event = reviewProduct.type === "team" ? "approve_team" : "approve_public"
        updateStoredProduct(reviewProduct.product.id, (product) => transitionProduct(product, event, { visibleOrgIds, at: "2026-09-02 16:20" }))
        setReviewProduct(null)
        setToast(reviewProduct.type === "team" ? "商品已发布到团队商品库" : "商品已发布到公共商品库")
      }} onReject={(reason) => {
        const event = reviewProduct.type === "team" ? "reject_team" : "reject_public"
        updateStoredProduct(reviewProduct.product.id, (product) => transitionProduct(product, event, { reason, at: "2026-09-02 16:20" }))
        setReviewProduct(null)
        setToast("已驳回，商品保留在原范围并可继续修改")
      }} />}
      {deleteProduct && <DeleteDialog product={deleteProduct} onClose={() => setDeleteProduct(null)} onConfirm={() => {
        deleteStoredProduct(deleteProduct.id)
        setDeleteProduct(null)
        setToast("商品草稿已删除。")
      }} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-[1300] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-md bg-[var(--gray-900)] px-4 py-3 text-sm text-white shadow-xl" role="status">{toast}</div>}
    </div>
  )
}

function ProductCard({ product, role, onAdjust, onSubmitTeam, onCancelTeam, onReviewTeam, onSubmitPublic, onCancelPublic, onReviewPublic, onDelete, onArchive, onRevise }) {
  const cover = product.candidates?.find((candidate) => candidate.selected && candidate.src)?.src || product.candidates?.find((candidate) => candidate.status === "success" && candidate.src)?.src || product.images?.[0]?.src
  const continueAllowed = canContinueProduct(product, role)
  const submitTeamAllowed = canSubmitProductForTeam(product, role)
  const cancelTeamAllowed = canCancelTeamProductSubmission(product, role)
  const reviewTeamAllowed = canReviewProduct(product, role)
  const requestPublicAllowed = canRequestPublicProduct(product, role)
  const cancelPublicAllowed = canCancelPublicProductSubmission(product, role)
  const reviewPublicAllowed = canReviewPublicProduct(product, role)
  const reviseAllowed = canReviseProduct(product, role)
  const adjustAllowed = canAdjustProductScope(product, role)
  const archiveAllowed = canArchiveProduct(product, role)
  const deleteAllowed = canDeleteProduct(product, role)
  const continueHref = ["draft", "information_review", "needs_information", "import_failed"].includes(product.status) ? `/products/new?resume=${product.id}` : `/products/${product.id}?role=${role}`

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-white shadow-[var(--shadow-card)]" style={{ borderColor: "var(--border-base)" }}>
      <Link href={`/products/${product.id}?role=${role}`} className="group relative block aspect-[4/3] overflow-hidden bg-[var(--gray-100)]">
        {cover ? <SafeImage src={cover} alt={product.name} className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]" /> : <div className="grid h-full place-items-center text-[var(--text-disabled)]"><Box size={34} /></div>}
        <span className="absolute left-3 top-3"><ProductStatusBadge status={product.status} product={product} /></span>
        {product.taskProgress && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--gray-200)]"><span className="block h-full bg-[var(--brand-primary)]" style={{ width: `${product.taskProgress}%` }} /></div>}
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <Link href={`/products/${product.id}?role=${role}`} className="min-w-0"><h2 className="truncate text-[15px] font-semibold text-[var(--text-title)]" title={product.name}>{product.name}</h2></Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]"><span>{product.category}</span><span aria-hidden="true">·</span><span>{product.source}</span></div>
        <div className="mt-3"><CoverageSummary coverage={product.coverage} compact /></div>
        <dl className="mt-3 grid grid-cols-[64px_1fr] gap-x-2 gap-y-1.5 text-xs"><dt className="text-[var(--text-secondary)]">归属</dt><dd className="truncate text-[var(--text-body)]">{product.orgName}</dd><dt className="text-[var(--text-secondary)]">更新</dt><dd className="text-[var(--text-body)]">{product.updatedAt}</dd></dl>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--border-light)" }}>
          {continueAllowed && <Link href={continueHref} className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--brand-primary)] px-2.5 text-xs font-semibold text-white">继续处理</Link>}
          {submitTeamAllowed && <button type="button" onClick={onSubmitTeam} className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--brand-primary)] px-2 text-xs font-semibold text-white"><Send size={13} />提交入团队</button>}
          {cancelTeamAllowed && <button type="button" onClick={onCancelTeam} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--text-body)] hover:bg-[var(--bg-hover)]"><XCircle size={13} />取消提交</button>}
          {reviewTeamAllowed && <button type="button" onClick={onReviewTeam} className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--brand-primary)] px-2 text-xs font-semibold text-white"><ClipboardCheck size={13} />审核入团队</button>}
          <Link href={`/products/${product.id}?role=${role}`} className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}><Eye size={13} />详情</Link>
          {reviseAllowed && <button type="button" onClick={onRevise} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--text-body)] hover:bg-[var(--bg-hover)]"><FilePenLine size={13} />发起修订</button>}
          {adjustAllowed && <button type="button" onClick={onAdjust} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--text-body)] hover:bg-[var(--bg-hover)]"><Settings2 size={13} />调整范围</button>}
          {requestPublicAllowed && <button type="button" onClick={onSubmitPublic} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--text-body)] hover:bg-[var(--bg-hover)]"><Globe2 size={13} />申请公共</button>}
          {cancelPublicAllowed && <button type="button" onClick={onCancelPublic} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--text-body)] hover:bg-[var(--bg-hover)]"><XCircle size={13} />取消公共申请</button>}
          {reviewPublicAllowed && <button type="button" onClick={onReviewPublic} className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--brand-primary)] px-2 text-xs font-semibold text-white"><ClipboardCheck size={13} />审核公共</button>}
          {deleteAllowed && <button type="button" onClick={onDelete} className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-[var(--danger)] hover:bg-[var(--danger-bg)]" aria-label={`删除${product.name}`} title="删除"><Trash2 size={14} /></button>}
          {archiveAllowed && <button type="button" onClick={onArchive} className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-[var(--danger)] hover:bg-[var(--danger-bg)]" aria-label={`归档${product.name}`} title="归档"><Archive size={14} /></button>}
        </div>
      </div>
    </article>
  )
}

function ScopeDialog({ product, role, onClose, onSave }) {
  const [visibleOrgIds, setVisibleOrgIds] = useState(product.visibleOrgIds || [])
  return <WorkbenchPickerDialog eyebrow="团队商品" title="调整可见组织" description="选择父组织时，实际权限会包含其全部下级组织。" width="560px" onClose={onClose} footer={<><WorkbenchButton variant="ghost" onClick={onClose}>取消</WorkbenchButton><WorkbenchButton disabled={!visibleOrgIds.length} onClick={() => onSave(visibleOrgIds)}>保存范围</WorkbenchButton></>}><OrganizationScopeSelector value={visibleOrgIds} onChange={setVisibleOrgIds} organizations={organizationTree} allowedScopeIds={role === "system_admin" ? null : [product.orgId]} /></WorkbenchPickerDialog>
}

function DeleteDialog({ product, onClose, onConfirm }) {
  return <WorkbenchPickerDialog eyebrow="删除商品" title={`删除“${product.name}”？`} description="仅删除未发布且未被下游任务使用的个人商品；删除后无法在商品库中继续处理。" width="520px" footer={<><WorkbenchButton variant="ghost" onClick={onClose}>取消</WorkbenchButton><WorkbenchButton onClick={onConfirm} style={{ color: "var(--white)", borderColor: "var(--danger)", background: "var(--danger)" }}><Trash2 size={15} />确认删除</WorkbenchButton></>}><div className="flex items-start gap-3 rounded-lg bg-[var(--warning-bg)] p-3 text-sm leading-6 text-[var(--text-body)]"><CircleAlert size={17} className="mt-1 shrink-0 text-[var(--warning)]" /><span>商品图片、商品信息和当前候选会一并移除；已被下游任务使用的商品不会显示此操作。</span></div></WorkbenchPickerDialog>
}

function LibraryLoading() {
  return <div className="grid gap-4" aria-busy="true"><div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}><LoaderCircle size={16} className="animate-spin" />正在加载商品档案</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-lg bg-[var(--gray-100)]" />)}</div></div>
}

function LibraryError({ onRetry }) {
  return <div className="grid min-h-72 place-items-center rounded-lg border bg-white p-8 text-center shadow-[var(--shadow-card)]" style={{ borderColor: "var(--border-base)" }}><div><CircleAlert size={34} className="mx-auto text-[var(--danger)]" /><h2 className="mt-3 text-base font-semibold text-[var(--text-title)]">商品档案加载失败</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">已保留当前筛选条件，可以重新加载。</p><button type="button" onClick={onRetry} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white"><RotateCcw size={15} />重新加载</button></div></div>
}

function LibraryForbidden() {
  return <div className="grid min-h-72 place-items-center rounded-lg border bg-white p-8 text-center shadow-[var(--shadow-card)]" style={{ borderColor: "var(--border-base)" }}><div><FolderSearch size={34} className="mx-auto text-[var(--text-disabled)]" /><h2 className="mt-3 text-base font-semibold text-[var(--text-title)]">当前账号无权查看此商品范围</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">请返回有权限的商品视图。</p><Link href="/products" className="mt-4 inline-flex h-10 items-center rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white">返回商品智库</Link></div></div>
}

function LibraryEmpty({ filtered, onClear }) {
  return <div className="grid min-h-72 place-items-center rounded-lg border border-dashed bg-white p-8 text-center" style={{ borderColor: "var(--border-base)" }}><div><FolderSearch size={34} className="mx-auto text-[var(--text-disabled)]" /><h2 className="mt-3 text-base font-semibold text-[var(--text-title)]">{filtered ? "没有匹配的商品" : "当前视图还没有商品"}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{filtered ? "可以调整关键词、品类或状态筛选。" : "学习并确认商品后，会在对应范围中展示。"}</p>{filtered && <button type="button" onClick={onClear} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}><RotateCcw size={15} />清除筛选</button>}</div></div>
}
