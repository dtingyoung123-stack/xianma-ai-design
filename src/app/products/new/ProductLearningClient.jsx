"use client"

import { useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  CloudDownload,
  ExternalLink,
  FileCheck2,
  ImagePlus,
  LoaderCircle,
  Save,
  Sparkles,
  SquareStack,
  StopCircle,
  Upload,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import {
  WorkbenchButton,
  WorkbenchFooter,
  WorkbenchModule,
  WorkbenchPanel,
  WorkbenchPanelHead,
  WorkbenchScroll,
  WorkbenchShell,
} from "@/components/workbench/Workbench"
import { demoProductAssets, productCategoryOptions } from "@/data/demo/products"
import { addStoredProduct, getServerProductState, readProductState, subscribeProductState, updateStoredProduct } from "@/lib/product-demo-store"
import { transitionProduct } from "@/lib/product-prototype.mjs"
import { CandidateGrid, CoveragePanel, CoverageSummary, ProductCorrectionDialog } from "@/app/products/_components/ProductPrototypeUi"

const steps = [
  { id: 1, label: "添加商品资料", icon: ImagePlus },
  { id: 2, label: "确认商品信息", icon: FileCheck2 },
  { id: 3, label: "商品还原", icon: Sparkles },
  { id: 4, label: "运营确认", icon: CheckCircle2 },
]

const emptyFacts = [
  { id: "shape", group: "外观", label: "整体外形", value: "环抱式主体，前窄后宽", state: "confirmed", evidenceIds: ["asset-product-full"] },
  { id: "ratio", group: "外观", label: "比例关系", value: "主体宽高约 2.8:1", state: "confirmed", evidenceIds: ["asset-product-full"] },
  { id: "color", group: "视觉", label: "主色", value: "深灰主体配浅灰边缘", state: "confirmed", evidenceIds: ["asset-product-full"] },
  { id: "material", group: "视觉", label: "材质", value: "弹性织物与透气网布", state: "inferred", evidenceIds: ["asset-product-detail"] },
  { id: "parts", group: "结构", label: "部件数量", value: "主体 1 件、固定带 2 条", state: "inferred", evidenceIds: ["asset-product-full"] },
  { id: "back", group: "结构", label: "背面结构", value: "当前资料未展示", state: "missing", evidenceIds: [] },
]

export default function ProductLearningClient() {
  const searchParams = useSearchParams()
  const resumeId = searchParams.get("resume")
  const products = useSyncExternalStore(subscribeProductState, readProductState, getServerProductState)
  const initialProduct = useMemo(() => products.find((product) => product.id === resumeId), [products, resumeId])
  const snapshotKind = products === getServerProductState() ? "server" : "client"

  return <ProductLearningSession key={`${resumeId || "new"}-${snapshotKind}`} resumeId={resumeId} initialProduct={initialProduct} />
}

function ProductLearningSession({ resumeId, initialProduct }) {
  const router = useRouter()
  const [step, setStep] = useState(() => getResumeStep(initialProduct?.status))
  const [maxStep, setMaxStep] = useState(() => getResumeStep(initialProduct?.status))
  const [inputMode, setInputMode] = useState(initialProduct?.source === "商品链接" ? "link" : "upload")
  const [name, setName] = useState(initialProduct?.name || "")
  const [category, setCategory] = useState(initialProduct?.category || "护具类")
  const [notes, setNotes] = useState(initialProduct?.notes || "")
  const [sourceUrl, setSourceUrl] = useState(initialProduct?.sourceUrl || "")
  const [linkStatus, setLinkStatus] = useState(initialProduct?.status === "import_failed" ? "error" : "idle")
  const [images, setImages] = useState(initialProduct?.images || [])
  const [facts, setFacts] = useState(initialProduct?.facts || emptyFacts)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [taskStatus, setTaskStatus] = useState(initialProduct?.status === "restoring" ? "running" : initialProduct?.candidates?.length ? "success" : "idle")
  const [taskProgress, setTaskProgress] = useState(initialProduct?.taskProgress || 0)
  const [candidates, setCandidates] = useState(initialProduct?.candidates || [])
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialProduct?.candidates?.find((candidate) => candidate.selected)?.id || "")
  const [correctionCandidate, setCorrectionCandidate] = useState(null)
  const [toast, setToast] = useState("")
  const generatedId = useId()
  const productId = resumeId || initialProduct?.id || `product-draft-${generatedId.replace(/[^a-z0-9-]/gi, "")}`
  const inputLocked = taskStatus === "running" || candidates.length > 0

  const coverage = useMemo(() => ({
    confirmed: facts.filter((fact) => fact.state === "confirmed").length,
    inferred: facts.filter((fact) => fact.state === "inferred").length,
    missing: facts.filter((fact) => fact.state === "missing").length,
  }), [facts])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(""), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const handleImageFiles = useCallback((files, source = "本地上传") => {
    if (!files.length) return
    const available = Math.max(0, 16 - images.length)
    if (!available) return setToast("商品图片已达到 16 张上限。")
    const accepted = files.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 20 * 1024 * 1024).slice(0, available)
    if (!accepted.length) return setToast("请添加 20MB 内的 JPG、PNG 或 WEBP 图片。")
    const addedImages = accepted.map((file, index) => ({ id: `${source === "剪贴板" ? "paste" : "local"}-${Date.now()}-${index}`, title: source === "剪贴板" ? `粘贴图片 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : file.name, name: file.name, src: URL.createObjectURL(file), size: `${Math.max(1, Math.round(file.size / 1024))} KB`, type: "待分类", source }))
    setImages((current) => [...current, ...addedImages].slice(0, 16))
    if (accepted.length < files.length) setToast("部分图片未添加：仅支持 20MB 内的 JPG、PNG 或 WEBP。")
  }, [images.length])

  useEffect(() => {
    if (step !== 1 || inputLocked) return undefined
    function handlePaste(event) {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return
      const imageItem = [...(event.clipboardData?.items || [])].find((item) => item.kind === "file" && item.type.startsWith("image/"))
      if (!imageItem) return
      const file = imageItem.getAsFile()
      if (!file) return
      event.preventDefault()
      handleImageFiles([file], "剪贴板")
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [handleImageFiles, inputLocked, step])

  const buildProduct = useCallback((overrides = {}) => {
    return {
      id: productId,
      name: name.trim() || "未命名商品草稿",
      category,
      notes,
      scope: "mine",
      status: "draft",
      ownerId: "demo-member",
      ownerName: "商品运营示例账号",
      orgId: "org-product",
      orgName: "商品运营组",
      visibleOrgIds: [],
      source: inputMode === "link" ? "商品链接" : "自主上传",
      sourceUrl: inputMode === "link" ? sourceUrl : "",
      updatedAt: "2026-09-02 16:20",
      coverage,
      images,
      facts,
      candidates,
      versions: initialProduct?.versions || [],
      corrections: initialProduct?.corrections || [],
      ...overrides,
    }
  }, [candidates, category, coverage, facts, images, initialProduct?.corrections, initialProduct?.versions, inputMode, name, notes, productId, sourceUrl])

  const persistProduct = useCallback((overrides = {}) => {
    const product = buildProduct(overrides)
    const exists = readProductState().some((item) => item.id === product.id)
    if (exists) updateStoredProduct(product.id, () => product)
    else addStoredProduct(product)
    return product
  }, [buildProduct])

  const productSnapshot = useMemo(() => buildProduct(), [buildProduct])

  useEffect(() => {
    if (taskStatus !== "running") return undefined
    const interval = window.setInterval(() => setTaskProgress((current) => Math.min(current + 8, 92)), 180)
    const timer = window.setTimeout(() => {
      window.clearInterval(interval)
      const nextCandidates = [
        { id: `candidate-a-${Date.now()}`, label: "还原候选 A", src: "/assets/layout-square-1.png", status: "success" },
        { id: `candidate-b-${Date.now()}`, label: "还原候选 B", src: "/assets/layout-square-2.png", status: "success" },
      ]
      setCandidates(nextCandidates)
      setTaskProgress(100)
      setTaskStatus("success")
      setStep(4)
      setMaxStep(4)
      persistProduct({ status: "pending_confirmation", candidates: nextCandidates, taskProgress: 100 })
    }, 2200)
    return () => { window.clearInterval(interval); window.clearTimeout(timer) }
  }, [persistProduct, taskStatus])

  function saveDraft() {
    persistProduct({ status: step === 1 ? "draft" : step === 2 ? "information_review" : taskStatus === "running" ? "restoring" : "pending_confirmation", taskProgress })
    setToast("草稿已保存，可以从“我创建的”继续处理。")
  }

  function nextStep() {
    if (step === 1) {
      if (!images.length) return setToast("请至少添加一张能够看清商品完整外形的图片。")
      if (!name.trim()) return setToast("请填写商品名称。")
      persistProduct({ status: "information_review" })
      setStep(2)
      setMaxStep((current) => Math.max(current, 2))
      return
    }
    if (step === 2) {
      persistProduct({ status: "restoring", taskProgress: 0 })
      setStep(3)
      setMaxStep((current) => Math.max(current, 3))
      setTaskProgress(0)
      setTaskStatus("running")
    }
  }

  function importLink() {
    if (!sourceUrl.trim()) return setLinkStatus("error")
    if (!/^https?:\/\//i.test(sourceUrl.trim()) || sourceUrl.includes("invalid")) return setLinkStatus("error")
    setLinkStatus("loading")
    window.setTimeout(() => {
      const importedImages = demoProductAssets.slice(0, 3).map((image) => ({ ...image, source: "商品链接" }))
      setImages((current) => [...current, ...importedImages].filter((image, index, all) => all.findIndex((item) => item.id === image.id) === index).slice(0, 16))
      const importedInfo = { name: "链接导入商品草稿", category: "护具类", notes: "正面：链接商品正面材质与外观\n背面：链接商品背面结构\n尺寸：以链接商品详情参数为准" }
      if (name.trim() || notes.trim()) setPendingImport(importedInfo)
      else {
        setName(importedInfo.name)
        setCategory(importedInfo.category)
        setNotes(importedInfo.notes)
      }
      setLinkStatus("success")
    }, 700)
  }

  function handleLocalFiles(event) {
    handleImageFiles([...event.target.files])
    event.target.value = ""
  }

  function replaceImportedInfo() {
    if (!pendingImport) return
    setName(pendingImport.name)
    setCategory(pendingImport.category)
    setNotes(pendingImport.notes)
    setPendingImport(null)
  }

  function updateFact(factId, values) {
    setFacts((current) => current.map((fact) => fact.id === factId ? { ...fact, ...values } : fact))
  }

  function confirmProduct() {
    if (!selectedCandidateId) return setToast("请先选择一张还原候选图。")
    const product = persistProduct({ status: "pending_confirmation", candidates })
    updateStoredProduct(product.id, (current) => transitionProduct(current, "confirm", { candidateId: selectedCandidateId, at: "2026-09-02 16:35" }))
    router.push(`/products/${product.id}?confirmed=1`)
  }

  function submitCorrection(correction) {
    const product = persistProduct({ status: "restoring", taskKind: "correction", candidates })
    updateStoredProduct(product.id, (current) => transitionProduct(current, "correction", { correction: { id: `correction-${Date.now()}`, candidateId: correctionCandidate.id, ...correction, createdAt: "2026-09-02 16:32" }, at: "2026-09-02 16:32" }))
    setCorrectionCandidate(null)
    setTaskProgress(0)
    setTaskStatus("running")
    setStep(3)
    setToast("纠错信息已提交，正在重新生成两张候选图。")
  }

  return (
    <WorkbenchShell
      crumbs={[{ label: "AI 商品智库" }, { label: "商品学习" }]}
      status="原型验证中"
      title={name.trim() || "学习新商品"}
      description="通过图片证据建立可核验的商品视觉档案"
      contentClassName="xm-product-flow-grid"
      columns={step === 1 ? "minmax(0, 1.1fr) minmax(320px, 0.9fr)" : "minmax(0, 1fr)"}
      actions={<button type="button" onClick={saveDraft} className="inline-flex h-10 items-center gap-2 rounded-full border bg-white px-4 text-sm font-semibold text-[var(--text-body)] shadow-[var(--shadow-control)]" style={{ borderColor: "var(--border-base)" }}><Save size={15} />保存草稿</button>}
    >
      <WorkbenchPanel>
        <StepHeader step={step} maxStep={maxStep} onChange={setStep} />
        <WorkbenchScroll>
          {step === 1 && <SourceStep inputMode={inputMode} setInputMode={setInputMode} name={name} setName={setName} category={category} setCategory={setCategory} notes={notes} setNotes={setNotes} sourceUrl={sourceUrl} setSourceUrl={setSourceUrl} linkStatus={linkStatus} importLink={importLink} images={images} setImages={setImages} onOpenPicker={() => setPickerOpen(true)} onLocalFiles={handleLocalFiles} locked={inputLocked} />}
          {step === 2 && <InformationStep name={name} category={category} notes={notes} setNotes={setNotes} facts={facts} coverage={coverage} onChange={updateFact} onEvidence={(fact) => setPreviewIndex(Math.max(0, images.findIndex((image) => fact.evidenceIds.includes(image.id))))} locked={inputLocked} />}
          {step === 3 && <RestoreSettings images={images} coverage={coverage} />}
          {step === 4 && <ConfirmationSummary productName={name} coverage={coverage} />}
          {step === 3 && <WorkbenchModule title={getOutputTitle(step)} hint={`步骤 ${step} / 4`}><p className="mb-3 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{getOutputDescription(step)}</p><RestoreOutput status={taskStatus} progress={taskProgress} candidates={candidates} /></WorkbenchModule>}
          {step === 4 && <WorkbenchModule title={getOutputTitle(step)} hint={`步骤 ${step} / 4`}><p className="mb-3 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{getOutputDescription(step)}</p><div className="rounded-lg bg-[var(--info-bg)] p-3 text-sm leading-6 text-[var(--text-body)]"><strong className="text-[var(--text-title)]">确认标准：</strong>商品类型、整体形态、比例、结构、主色和关键标识必须仍是同一个可售视觉 SKU。</div><div className="mt-3"><CandidateGrid candidates={candidates} selectedId={selectedCandidateId} onSelect={setSelectedCandidateId} onPreview={(candidate) => setPreviewIndex(images.length + candidates.indexOf(candidate))} /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: "var(--border-base)" }}><span className="text-sm text-[var(--text-secondary)]">两张候选都不合格时，可圈选具体差异并补充佐证。</span><WorkbenchButton variant="soft" disabled={!selectedCandidateId} onClick={() => setCorrectionCandidate(candidates.find((candidate) => candidate.id === selectedCandidateId))}>圈选纠错</WorkbenchButton></div></WorkbenchModule>}
        </WorkbenchScroll>
        <WorkbenchFooter className="justify-between">
          <WorkbenchButton variant="ghost" disabled={step === 1 || taskStatus === "running"} onClick={() => setStep((current) => current - 1)}><ChevronLeft size={15} />上一步</WorkbenchButton>
          {step < 3 && <WorkbenchButton onClick={nextStep}>{step === 1 ? "确认资料" : "开始还原"}<ChevronRight size={15} /></WorkbenchButton>}
          {step === 3 && taskStatus === "running" && <WorkbenchButton variant="ghost" onClick={() => { setTaskStatus("cancelled"); persistProduct({ status: "information_review", taskProgress }) }}><StopCircle size={15} />终止任务</WorkbenchButton>}
          {step === 3 && taskStatus === "cancelled" && <WorkbenchButton onClick={() => setTaskStatus("running")}><Sparkles size={15} />再次还原</WorkbenchButton>}
          {step === 4 && <WorkbenchButton disabled={!selectedCandidateId} onClick={confirmProduct}><Check size={15} />确认商品</WorkbenchButton>}
        </WorkbenchFooter>
      </WorkbenchPanel>

      {step === 1 && <WorkbenchPanel>
        <WorkbenchPanelHead title="图片证据与资料覆盖" description="根据左侧已上传图片实时查看预览和资料校验" meta={<span className="text-xs font-semibold text-[var(--text-secondary)]">步骤 1 / 4</span>} />
        <WorkbenchScroll>
          <EvidencePreview images={images} onPreview={setPreviewIndex} />
        </WorkbenchScroll>
      </WorkbenchPanel>}

      {pickerOpen && <AssetPickerModal title="选择商品图片" description="选择完整外观、多角度、结构细节或材质特写。" max={16} personalAssets={demoProductAssets} teamAssets={demoProductAssets.slice(1)} publicAssets={demoProductAssets.slice(2)} onClose={() => setPickerOpen(false)} onConfirm={(assets) => { setImages((current) => [...current, ...assets].filter((image, index, all) => all.findIndex((item) => item.id === image.id) === index).slice(0, 16)); setPickerOpen(false) }} />}
      {previewIndex !== null && <ImagePreviewModal images={[...images, ...candidates.filter((candidate) => candidate.src)]} index={previewIndex} setIndex={setPreviewIndex} getSrc={(image) => image.src} getName={(image) => image.title || image.label || image.name} onClose={() => setPreviewIndex(null)} />}
      {pendingImport && <ImportReplaceDialog onKeep={() => setPendingImport(null)} onReplace={replaceImportedInfo} />}
      {correctionCandidate && <ProductCorrectionDialog product={productSnapshot} candidate={correctionCandidate} onClose={() => setCorrectionCandidate(null)} onSubmit={submitCorrection} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-[1400] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-md bg-[var(--gray-900)] px-4 py-3 text-sm text-white shadow-xl" role="status">{toast}</div>}
    </WorkbenchShell>
  )
}

function ImportReplaceDialog({ onKeep, onReplace }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onKeep()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onKeep])

  return <div className="fixed inset-0 z-[1500] grid place-items-center bg-[var(--overlay-scrim)] p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onKeep() }}><div role="dialog" aria-modal="true" aria-labelledby="import-replace-title" className="w-full max-w-md rounded-xl bg-white p-5 shadow-[var(--shadow-card-hover)]"><div className="flex items-start justify-between gap-4"><div><h2 id="import-replace-title" className="text-base font-semibold text-[var(--text-title)]">链接资料已导入</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">检测到当前页面已有商品文字资料，是否使用链接识别结果替换？图片已追加到商品图片队列。</p></div><button type="button" aria-label="关闭" title="关闭" onClick={onKeep} className="grid size-8 shrink-0 place-items-center rounded-md text-lg text-[var(--text-secondary)] hover:bg-[var(--gray-100)]">×</button></div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onKeep} className="h-10 rounded-md border px-4 text-sm font-semibold text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}>不替换，保留当前内容</button><button type="button" onClick={onReplace} className="h-10 rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white">替换当前内容</button></div></div></div>
}

function StepHeader({ step, maxStep, onChange }) {
  return <div className="shrink-0 border-b px-3 py-3" style={{ borderColor: "var(--border-light)" }}><ol className="grid grid-cols-4 gap-1">{steps.map(({ id, label, icon: Icon }) => { const active = step === id; const complete = id < step || id < maxStep; return <li key={id}><button type="button" disabled={id > maxStep} onClick={() => onChange(id)} className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-md px-1 text-center disabled:cursor-not-allowed" style={active ? { color: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { color: complete ? "var(--text-body)" : "var(--text-disabled)" }}><span className="grid size-6 place-items-center rounded-full" style={complete ? { color: "var(--white)", background: "var(--success)" } : active ? { color: "var(--white)", background: "var(--brand-primary)" } : { background: "var(--gray-100)" }}>{complete ? <Check size={13} /> : <Icon size={13} />}</span><span className="text-[10px] font-semibold sm:text-xs">{label}</span></button></li> })}</ol></div>
}

function SourceStep({ inputMode, setInputMode, name, setName, category, setCategory, notes, setNotes, sourceUrl, setSourceUrl, linkStatus, importLink, images, setImages, onOpenPicker, onLocalFiles, locked = false }) {
  return (
    <WorkbenchModule title="添加商品资料">
      <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-[var(--gray-100)] p-1">
        <button type="button" disabled={locked} onClick={() => setInputMode("upload")} className="inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60" style={inputMode === "upload" ? { color: "var(--brand-primary)", background: "var(--white)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}><Upload size={15} />上传商品图片</button>
        <button type="button" disabled={locked} onClick={() => setInputMode("link")} className="inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60" style={inputMode === "link" ? { color: "var(--brand-primary)", background: "var(--white)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}><ExternalLink size={15} />粘贴商品链接</button>
      </div>
      <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <label className="block"><span className="mb-1 block text-xs font-semibold text-[var(--text-title)]">商品名称</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="填写便于识别的商品名称" disabled={locked} className="h-10 w-full rounded-md border px-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }} /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-[var(--text-title)]">商品品类</span><select value={category} onChange={(event) => setCategory(event.target.value)} disabled={locked} className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }}>{productCategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
      </div>
      {inputMode === "link" && <div className="mb-3 grid gap-2">
        <div className="flex gap-2">
          <input value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); if (linkStatus === "error") setLinkStatus("idle") }} placeholder="粘贴商品链接" disabled={locked} className="h-10 min-w-0 flex-1 rounded-md border px-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-[var(--gray-50)]" style={{ borderColor: linkStatus === "error" ? "var(--danger)" : "var(--border-base)" }} />
          <button type="button" disabled={locked || linkStatus === "loading"} onClick={importLink} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-3 text-sm font-semibold text-white disabled:opacity-60">{linkStatus === "loading" ? <LoaderCircle size={15} className="animate-spin" /> : <CloudDownload size={15} />}导入</button>
        </div>
        {linkStatus === "error" && <div className="flex items-start gap-2 rounded-md bg-[var(--danger-bg)] p-2.5 text-xs leading-5 text-[var(--danger)]"><AlertTriangle size={14} className="mt-0.5 shrink-0" />链接暂时无法导入，已保留输入。可以重试或切换为上传商品图片。</div>}
        {linkStatus === "success" && <div className="flex items-center gap-2 rounded-md bg-[var(--success-bg)] p-2.5 text-xs text-[var(--success)]"><CheckCircle2 size={14} />图片已导入，请确认本次使用的视觉 SKU。</div>}
      </div>}
      <div className="mb-3 rounded-lg border bg-[var(--gray-50)] p-3" style={{ borderColor: "var(--border-base)" }}>
        <strong className="block text-xs font-semibold text-[var(--text-title)]">图片上传建议（选填）</strong>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">建议包含：正面 / 背面 / 侧面 / 展开图 / 结构细节 / 材质花纹特写；缺少某个角度也可以继续。</p>
      </div>
      <ImageQueueModule title="商品图片" images={images} max={16} accept="image/jpeg,image/png,image/webp" assetTitle="从素材库选择" assetSub="个人/团体/公共图片" uploadTitle="本地上传" uploadSub="点击选择或 Ctrl+V 粘贴" primaryTitle="标准锚点" getSrc={(image) => image.src} getName={(image) => image.title || image.name} readOnly={locked} onOpenAssetPicker={onOpenPicker} onLocalImages={onLocalFiles} onRemove={(index) => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} onRefresh={onOpenPicker} onReorder={setImages} />
      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-semibold text-[var(--text-title)]">商品参数与补充描述</span>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder={"正面：新中式丝质款面料（有丝质的光泽感）\n背面：珊瑚绒亲肤面料\n尺寸：120cm*28cm(厚度为5cm)，其中盐袋部分（65cm*28cm)，两侧绑带分别长27.5cm"} disabled={locked} className="mt-2 w-full resize-y rounded-lg border p-3 text-sm leading-6 text-[var(--text-body)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }} />
      </label>
    </WorkbenchModule>
  )
}

function InformationStep({ name, category, notes, setNotes, facts, coverage, onChange, onEvidence, locked = false }) {
  return <><WorkbenchModule title="商品信息覆盖情况"><CoverageSummary coverage={coverage} /></WorkbenchModule><WorkbenchModule title="当前商品"><dl className="grid grid-cols-[72px_1fr] gap-2 text-sm"><dt className="text-[var(--text-secondary)]">名称</dt><dd className="font-semibold text-[var(--text-title)]">{name}</dd><dt className="text-[var(--text-secondary)]">品类</dt><dd className="text-[var(--text-body)]">{category}</dd></dl></WorkbenchModule><WorkbenchModule title="商品参数与补充描述"><label><span className="mb-1 block text-xs text-[var(--text-secondary)]">可选，补充图片中不易确认的面料、尺寸、厚度或结构信息</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder={"正面：新中式丝质款面料（有丝质的光泽感）\n背面：珊瑚绒亲肤面料\n尺寸：120cm*28cm(厚度为5cm)，其中盐袋部分（65cm*28cm)，两侧绑带分别长27.5cm"} disabled={locked} className="w-full resize-y rounded-lg border p-3 text-sm leading-6 text-[var(--text-body)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }} /></label></WorkbenchModule><WorkbenchModule title="确认原则"><div className="grid gap-2 text-xs leading-5 text-[var(--text-body)]"><p className="rounded-md bg-[var(--success-bg)] p-2.5">已确认信息有明确图片或运营确认，可作为商品身份约束。</p><p className="rounded-md bg-[var(--info-bg)] p-2.5">AI 推断信息需要人工复核，确认后转为已确认。</p><p className="rounded-md bg-[var(--warning-bg)] p-2.5">待补充信息不会阻断还原，但不会被擅自补全。</p></div></WorkbenchModule><CoveragePanel facts={facts} editable={!locked} onChange={onChange} onEvidence={onEvidence} /></>
}

function RestoreSettings({ images, coverage }) {
  return <><WorkbenchModule title="还原设置"><dl className="grid grid-cols-[86px_1fr] gap-2 text-sm"><dt className="text-[var(--text-secondary)]">候选数量</dt><dd className="font-semibold text-[var(--text-title)]">每轮 2 张</dd><dt className="text-[var(--text-secondary)]">还原角度</dt><dd className="text-[var(--text-body)]">沿用证据最完整的原始角度</dd><dt className="text-[var(--text-secondary)]">背景</dt><dd className="text-[var(--text-body)]">白色或中性背景</dd><dt className="text-[var(--text-secondary)]">约束</dt><dd className="text-[var(--text-body)]">不生成缺少证据的隐藏结构</dd></dl></WorkbenchModule><WorkbenchModule title="任务输入" hint={`${images.length} 张图片`}><CoverageSummary coverage={coverage} /></WorkbenchModule></>
}

function ConfirmationSummary({ productName, coverage }) {
  return <><WorkbenchModule title="待确认商品"><strong className="block text-sm text-[var(--text-title)]">{productName}</strong><div className="mt-3"><CoverageSummary coverage={coverage} /></div></WorkbenchModule><WorkbenchModule title="确认后"><p className="text-sm leading-6 text-[var(--text-body)]">选中图将成为商品确认图，商品直接进入创建人所属团队。当前“我创建的”记录继续保留。</p></WorkbenchModule></>
}

function EvidencePreview({ images, onPreview }) {
  if (!images.length) return <div className="grid min-h-80 place-items-center rounded-lg border border-dashed text-center" style={{ borderColor: "var(--border-base)" }}><div><SquareStack size={34} className="mx-auto text-[var(--text-disabled)]" /><strong className="mt-3 block text-base text-[var(--text-title)]">等待添加商品图片</strong><p className="mt-1 text-sm text-[var(--text-secondary)]">至少添加一张能够看清商品完整外形的图片。</p></div></div>
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{images.map((image, index) => <button key={image.id || image.src} type="button" onClick={() => onPreview(index)} className="overflow-hidden rounded-lg border bg-white text-left" style={{ borderColor: index === 0 ? "var(--brand-primary)" : "var(--border-base)" }}><div className="aspect-square bg-[var(--gray-100)]"><SafeImage src={image.src} alt={image.title || image.name} className="h-full w-full object-contain" /></div><div className="border-t p-2.5" style={{ borderColor: "var(--border-light)" }}><strong className="block truncate text-xs text-[var(--text-title)]">{image.title || image.name}</strong><span className="mt-1 block text-[11px] text-[var(--text-secondary)]">{index === 0 ? "标准还原锚点" : image.type || "待 AI 分类"}</span></div></button>)}</div><div className="rounded-lg bg-[var(--warning-bg)] p-3 text-sm leading-6 text-[var(--text-body)]"><strong className="text-[var(--warning)]">资料提示：</strong>当前未看到商品背面，无法确认背面结构；仍可继续商品还原。</div></>
}

function RestoreOutput({ status, progress, candidates }) {
  if (status === "success" && candidates.length) return <><div className="flex items-center gap-2 rounded-lg bg-[var(--success-bg)] p-3 text-sm font-semibold text-[var(--success)]"><CheckCircle2 size={16} />两张候选图已完成，正在进入运营确认。</div><CandidateGrid candidates={candidates} /></>
  if (status === "cancelled") return <div className="grid min-h-80 place-items-center rounded-lg border border-dashed text-center" style={{ borderColor: "var(--border-base)" }}><div><StopCircle size={34} className="mx-auto text-[var(--warning)]" /><strong className="mt-3 block text-base text-[var(--text-title)]">任务已终止</strong><p className="mt-1 text-sm text-[var(--text-secondary)]">输入和商品信息已保留，可以再次提交。</p></div></div>
  return <div className="grid min-h-80 place-items-center rounded-lg border bg-white p-6 text-center" style={{ borderColor: "var(--border-base)" }}><div className="w-full max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><LoaderCircle size={26} className="animate-spin" /></span><strong className="mt-4 block text-base text-[var(--text-title)]">正在还原商品</strong><p className="mt-1 text-sm text-[var(--text-secondary)]">任务会继续执行，可以离开页面后从“我创建的”查看。</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-200" style={{ width: `${progress}%` }} /></div><span className="mt-2 block text-xs tabular-nums text-[var(--text-secondary)]">{progress}%</span></div></div>
}

function getResumeStep(status) {
  if (["information_review", "needs_information"].includes(status)) return 2
  if (status === "restoring") return 3
  if (["pending_confirmation", "partial_success"].includes(status)) return 4
  return 1
}

function getOutputTitle(step) {
  return ["", "图片证据与资料覆盖", "商品信息覆盖情况", "还原任务", "标准商品还原候选"][step]
}

function getOutputDescription(step) {
  return ["", "AI 将整理图片、识别类型并指出资料缺口", "逐项核对事实、推断和待补充信息", "基于同一商品事实与证据生成两张候选图", "选择可代表同一视觉 SKU 的商品还原图"][step]
}
