"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileClock,
  FilePenLine,
  FolderSearch,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import {
  WorkbenchButton,
  WorkbenchPanel,
  WorkbenchPanelHead,
  WorkbenchScroll,
  WorkbenchShell,
} from "@/components/workbench/Workbench"
import { getServerProductState, readProductState, subscribeProductState, updateStoredProduct } from "@/lib/product-demo-store"
import {
  canArchiveProduct,
  canCancelPublicProductSubmission,
  canCancelTeamProductSubmission,
  canConfirmProduct,
  canContinueProduct,
  canRequestPublicProduct,
  canReviewPublicProduct,
  canReviewProduct,
  canReviseProduct,
  canViewProduct,
  canSubmitProductForTeam,
  transitionProduct,
} from "@/lib/product-prototype.mjs"
import {
  CandidateGrid,
  CoveragePanel,
  CoverageSummary,
  ProductCorrectionDialog,
  ProductReviewDialog,
  ProductRoleSwitch,
  ProductStatusBadge,
} from "@/app/products/_components/ProductPrototypeUi"

export default function ProductDetailClient({ productId }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = ["member", "department_admin", "approval_admin", "system_admin"].includes(searchParams.get("role")) ? searchParams.get("role") : "member"
  const [role, setRole] = useState(initialRole)
  const products = useSyncExternalStore(subscribeProductState, readProductState, getServerProductState)
  const product = useMemo(() => products.find((item) => item.id === productId), [productId, products])
  const [selectedCandidateId, setSelectedCandidateId] = useState("")
  const [previewIndex, setPreviewIndex] = useState(null)
  const [correctionCandidate, setCorrectionCandidate] = useState(null)
  const [toast, setToast] = useState(searchParams.get("confirmed") ? "商品已确认，保留在个人库，可提交团队审批。" : "")
  const [regenerating, setRegenerating] = useState(() => product?.status === "restoring" && product?.taskKind === "correction")
  const [reviewDialog, setReviewDialog] = useState(null)

  const previewImages = useMemo(() => [...(product?.images || []), ...(product?.candidates || []).filter((candidate) => candidate.src)], [product])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(""), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!regenerating || !product) return undefined
    const timer = window.setTimeout(() => {
      const nextCandidates = [
        { id: `candidate-corrected-a-${Date.now()}`, label: "纠错候选 A", src: "/assets/layout-square-3.jpg", status: "success" },
        { id: `candidate-corrected-b-${Date.now()}`, label: "纠错候选 B", src: "/assets/layout-square-4.jpg", status: "success" },
      ]
      updateStoredProduct(product.id, (current) => ({ ...current, status: "pending_confirmation", candidates: nextCandidates, taskProgress: 100, updatedAt: "2026-09-02 16:45" }))
      setSelectedCandidateId(nextCandidates[0].id)
      setRegenerating(false)
      setToast("新一轮两张候选图已完成。")
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [product, regenerating])

  if (!product) return <DetailMissing />
  if (!canViewProduct(product, role)) return <DetailForbidden role={role} onRoleChange={changeRole} />

  function changeRole(nextRole) {
    setRole(nextRole)
    const params = new URLSearchParams(searchParams.toString())
    params.set("role", nextRole)
    router.replace(`/products/${productId}?${params.toString()}`, { scroll: false })
  }

  function updateProduct(event, payload, message) {
    updateStoredProduct(product.id, (current) => transitionProduct(current, event, payload))
    setToast(message)
  }

  function confirmProduct() {
    if (!activeCandidateId) return setToast("请先选择一张还原候选图。")
    updateProduct("confirm", { candidateId: activeCandidateId, at: "2026-09-02 16:42" }, "商品已确认，保留在个人库，可提交团队审批。")
  }

  function submitCorrection(correction) {
    const correctionRecord = { id: `correction-${Date.now()}`, candidateId: correctionCandidate.id, ...correction, createdAt: "2026-09-02 16:43" }
    updateStoredProduct(product.id, (current) => transitionProduct(current, "correction", { correction: correctionRecord, at: "2026-09-02 16:43" }))
    setCorrectionCandidate(null)
    setRegenerating(true)
    setToast("纠错信息已保留，正在重新还原。")
  }

  const canContinue = canContinueProduct(product, role)
  const canConfirm = canConfirmProduct(product, role)
  const canSubmitTeam = canSubmitProductForTeam(product, role)
  const canCancelTeam = canCancelTeamProductSubmission(product, role)
  const canReviewTeam = canReviewProduct(product, role)
  const canSubmitPublic = canRequestPublicProduct(product, role)
  const canCancelPublic = canCancelPublicProductSubmission(product, role)
  const canReviewPublic = canReviewPublicProduct(product, role)
  const canRevise = canReviseProduct(product, role)
  const canArchive = canArchiveProduct(product, role)
  const defaultCandidateId = product.candidates?.find((candidate) => candidate.selected)?.id || product.candidates?.find((candidate) => candidate.status === "success")?.id || ""
  const activeCandidateId = product.candidates?.some((candidate) => candidate.id === selectedCandidateId) ? selectedCandidateId : defaultCandidateId
  const selectedCandidate = product.candidates?.find((candidate) => candidate.id === activeCandidateId)

  return (
    <WorkbenchShell
      crumbs={[{ label: "商品智库" }, { label: "商品详情" }]}
      status="原型验证中"
      title={product.name}
      description="商品档案、证据、还原候选与修订记录"
      contentClassName="xm-product-detail-grid"
      actions={<ProductRoleSwitch role={role} onChange={changeRole} compact />}
    >
      <WorkbenchPanel>
        <WorkbenchPanelHead title="商品档案" description={`${product.category} · ${product.source}`} meta={<ProductStatusBadge status={product.status} product={product} />} />
        <WorkbenchScroll>
          <section className="overflow-hidden rounded-lg border bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }}>
            <div className="aspect-[4/3] bg-[var(--gray-100)]">
              {previewImages[0]?.src ? <button type="button" onClick={() => setPreviewIndex(0)} className="h-full w-full"><SafeImage src={previewImages[0].src} alt={product.name} className="h-full w-full object-contain" /></button> : <div className="grid h-full place-items-center text-[var(--text-disabled)]"><ImagePlus size={34} /></div>}
            </div>
            <div className="border-t p-3" style={{ borderColor: "var(--border-base)" }}><CoverageSummary coverage={product.coverage} /></div>
          </section>
          <section className="rounded-lg border p-3" style={{ borderColor: "var(--border-base)" }}>
            <h3 className="text-sm font-semibold text-[var(--text-title)]">基础信息</h3>
            <dl className="mt-3 grid grid-cols-[80px_1fr] gap-x-3 gap-y-2 text-sm"><dt className="text-[var(--text-secondary)]">视觉 SKU</dt><dd className="break-all text-[var(--text-body)]">{product.id}</dd><dt className="text-[var(--text-secondary)]">创建人</dt><dd className="text-[var(--text-body)]">{product.ownerName}</dd><dt className="text-[var(--text-secondary)]">所属组织</dt><dd className="text-[var(--text-body)]">{product.orgName}</dd><dt className="text-[var(--text-secondary)]">团队范围</dt><dd className="text-[var(--text-body)]">{product.visibleOrgIds?.length ? `${product.visibleOrgIds.length} 个组织根节点（含下级）` : "尚未发布到团队"}</dd><dt className="text-[var(--text-secondary)]">更新时间</dt><dd className="text-[var(--text-body)]">{product.updatedAt}</dd></dl>
          </section>
          <section className="rounded-lg border p-3" style={{ borderColor: "var(--border-base)" }}>
            <h3 className="text-sm font-semibold text-[var(--text-title)]">原始图片证据</h3>
            {product.images?.length ? <div className="mt-3 grid grid-cols-3 gap-2">{product.images.map((image, index) => <button key={image.id || image.src} type="button" onClick={() => setPreviewIndex(index)} className="overflow-hidden rounded-md border bg-[var(--gray-100)]" style={{ borderColor: "var(--border-base)" }}><SafeImage src={image.src} alt={image.title || image.name} className="aspect-square w-full object-cover" /><span className="block truncate px-2 py-1.5 text-[10px] text-[var(--text-secondary)]">{image.type || "商品图片"}</span></button>)}</div> : <p className="mt-2 text-sm text-[var(--text-secondary)]">尚未添加图片证据。</p>}
          </section>
          <div className="flex flex-wrap gap-2">
            {canContinue && <Link href={`/products/new?resume=${product.id}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white"><Sparkles size={15} />继续处理</Link>}
            {canSubmitTeam && <WorkbenchButton onClick={() => updateProduct("submit_team", { at: "2026-09-02 16:46" }, "已提交入团队审批。") }><Check size={15} />提交入团队</WorkbenchButton>}
            {canCancelTeam && <WorkbenchButton variant="ghost" onClick={() => updateProduct("cancel_team", { at: "2026-09-02 16:46" }, "已取消团队审批。") }><RotateCcw size={15} />取消提交</WorkbenchButton>}
            {canReviewTeam && <WorkbenchButton onClick={() => setReviewDialog({ type: "team" })}><CheckCircle2 size={15} />审核入团队</WorkbenchButton>}
            {canSubmitPublic && <WorkbenchButton variant="ghost" onClick={() => updateProduct("submit_public", { submitterId: product.ownerId, at: "2026-09-02 16:46" }, "已提交公共商品审核。") }><Sparkles size={15} />申请公共发布</WorkbenchButton>}
            {canCancelPublic && <WorkbenchButton variant="ghost" onClick={() => updateProduct("cancel_public", { at: "2026-09-02 16:46" }, "已取消公共商品申请。") }><RotateCcw size={15} />取消公共申请</WorkbenchButton>}
            {canReviewPublic && <WorkbenchButton onClick={() => setReviewDialog({ type: "public" })}><CheckCircle2 size={15} />审核公共发布</WorkbenchButton>}
            {canRevise && <WorkbenchButton variant="ghost" onClick={() => updateProduct("revise", { at: "2026-09-02 16:44" }, "已发起修订，当前确认版本继续有效。") }><FilePenLine size={15} />发起修订</WorkbenchButton>}
            {canArchive && <WorkbenchButton variant="ghost" onClick={() => updateProduct("archive", { at: "2026-09-02 16:44" }, "商品已归档，证据与审计记录继续保留。") }><Archive size={15} />归档</WorkbenchButton>}
          </div>
        </WorkbenchScroll>
      </WorkbenchPanel>

      <WorkbenchPanel>
        <WorkbenchPanelHead title="商品认知与还原" description="事实状态与图片证据保持关联" meta={regenerating ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]"><LoaderCircle size={13} className="animate-spin" />重新还原中</span> : null} />
        <WorkbenchScroll>
          {product.status === "archived" && <div className="flex items-start gap-2 rounded-lg bg-[var(--gray-100)] p-3 text-sm leading-6 text-[var(--text-body)]"><Archive size={16} className="mt-1 shrink-0" />该商品已归档，不再出现在正常商品选择入口；历史证据、版本和纠错记录仍保留。</div>}
          {regenerating && <RegeneratingState />}
          {!regenerating && <>
            <CoveragePanel facts={product.facts || []} onEvidence={(fact) => setPreviewIndex(Math.max(0, product.images.findIndex((image) => fact.evidenceIds.includes(image.id))))} />
            {product.candidates?.length ? <section><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-[var(--text-title)]">标准商品还原候选</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">两张候选使用同一商品事实与证据约束。</p></div>{canConfirm && <WorkbenchButton disabled={!activeCandidateId} onClick={confirmProduct}><Check size={15} />确认商品</WorkbenchButton>}</div><CandidateGrid candidates={product.candidates} selectedId={activeCandidateId} onSelect={setSelectedCandidateId} onPreview={(candidate) => setPreviewIndex(product.images.length + product.candidates.filter((item) => item.src).findIndex((item) => item.id === candidate.id))} onRetry={(candidate) => updateProduct("retry_candidate", { candidateId: candidate.id, at: "2026-09-02 16:41" }, "失败候选已重新生成。")}/>{canConfirm && selectedCandidate && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: "var(--border-base)" }}><span className="text-sm text-[var(--text-secondary)]">候选存在具体差异时，可以圈选错误区域继续纠正。</span><WorkbenchButton variant="soft" onClick={() => setCorrectionCandidate(selectedCandidate)}>圈选纠错</WorkbenchButton></div>}</section> : <NoCandidate product={product} />}
            <HistorySection product={product} />
          </>}
        </WorkbenchScroll>
      </WorkbenchPanel>

      {previewIndex !== null && <ImagePreviewModal images={previewImages} index={previewIndex} setIndex={setPreviewIndex} getSrc={(image) => image.src} getName={(image) => image.title || image.label || image.name} onClose={() => setPreviewIndex(null)} />}
      {correctionCandidate && <ProductCorrectionDialog product={product} candidate={correctionCandidate} onClose={() => setCorrectionCandidate(null)} onSubmit={submitCorrection} />}
      {reviewDialog && <ProductReviewDialog product={product} reviewType={reviewDialog.type} role={role} onClose={() => setReviewDialog(null)} onApprove={(visibleOrgIds) => { updateProduct(reviewDialog.type === "team" ? "approve_team" : "approve_public", { visibleOrgIds, at: "2026-09-02 16:48" }, reviewDialog.type === "team" ? "商品已发布到团队商品库。" : "商品已发布到公共商品库。"); setReviewDialog(null) }} onReject={(reason) => { updateProduct(reviewDialog.type === "team" ? "reject_team" : "reject_public", { reason, at: "2026-09-02 16:48" }, "已驳回，商品保留在原范围并可继续修改。"); setReviewDialog(null) }} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-[1400] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-md bg-[var(--gray-900)] px-4 py-3 text-sm text-white shadow-xl" role="status">{toast}</div>}
    </WorkbenchShell>
  )
}

function HistorySection({ product }) {
  const records = [
    ...(product.versions || []).map((version) => ({ ...version, type: "version" })),
    ...(product.corrections || []).map((correction) => ({ id: correction.id, label: `纠错：${correction.types?.join("、") || "商品差异"}`, note: correction.note, createdAt: correction.createdAt, type: "correction" })),
  ]
  return <section><div className="mb-3 flex items-center gap-2"><FileClock size={15} className="text-[var(--text-secondary)]" /><h3 className="text-sm font-semibold text-[var(--text-title)]">版本与纠错记录</h3></div>{records.length ? <ol className="grid gap-2">{records.map((record, index) => <li key={record.id} className="flex gap-3 rounded-lg border p-3" style={{ borderColor: "var(--border-base)" }}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--gray-100)] text-xs font-semibold text-[var(--text-secondary)]">{index + 1}</span><div className="min-w-0"><strong className="block text-sm text-[var(--text-title)]">{record.label}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{record.note}</p><span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[var(--text-disabled)]"><Clock3 size={11} />{record.createdAt}</span></div></li>)}</ol> : <p className="rounded-lg border border-dashed p-4 text-center text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>尚无版本或纠错记录。</p>}</section>
}

function NoCandidate({ product }) {
  const message = product.status === "restoring" ? "商品还原任务处理中，完成后会展示两张候选图。" : product.status === "import_failed" ? "链接图片尚未导入，可以切换为自主上传继续。" : "完成商品信息确认后即可开始还原。"
  return <div className="grid min-h-48 place-items-center rounded-lg border border-dashed text-center" style={{ borderColor: "var(--border-base)" }}><div><Sparkles size={30} className="mx-auto text-[var(--text-disabled)]" /><strong className="mt-3 block text-sm text-[var(--text-title)]">暂无还原候选</strong><p className="mt-1 text-xs text-[var(--text-secondary)]">{message}</p></div></div>
}

function RegeneratingState() {
  return <div className="grid min-h-60 place-items-center rounded-lg border bg-white text-center" style={{ borderColor: "var(--border-base)" }}><div><LoaderCircle size={30} className="mx-auto animate-spin text-[var(--brand-primary)]" /><strong className="mt-3 block text-sm text-[var(--text-title)]">正在根据纠错重新还原</strong><p className="mt-1 text-xs text-[var(--text-secondary)]">原始证据、历史候选和本轮纠错均已保留。</p></div></div>
}

function DetailMissing() {
}

function DetailForbidden({ role, onRoleChange }) {
  return <div className="grid min-h-[calc(100vh-112px)] place-items-center rounded-lg border bg-white p-8 text-center shadow-[var(--shadow-card)]" style={{ borderColor: "var(--border-base)" }}><div><FolderSearch size={34} className="mx-auto text-[var(--text-disabled)]" /><h1 className="mt-3 text-lg font-semibold text-[var(--text-title)]">当前身份无权访问该商品</h1><p className="mt-1 text-sm text-[var(--text-secondary)]">列表、详情和图片均不会展示额外资源信息。</p><div className="mt-4"><ProductRoleSwitch role={role} onChange={onRoleChange} /></div><Link href="/products" className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}><ArrowLeft size={15} />返回商品智库</Link></div></div>
}
