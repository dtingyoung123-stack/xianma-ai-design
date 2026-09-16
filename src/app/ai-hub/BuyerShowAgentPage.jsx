"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  ImagePlus,
  LoaderCircle,
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  SlidersHorizontal,
  StopCircle,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  XCircle,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import ProductPickerModal, { getProductReferenceImage } from "@/components/workbench/ProductPickerModal"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import RegionMaskEditor from "@/components/workbench/RegionMaskEditor"
import ResultLocalEditDialog from "@/components/workbench/ResultLocalEditDialog"
import WorkbenchPromptEditor from "@/components/workbench/WorkbenchPromptEditor"
import {
  WorkbenchButton,
  WorkbenchEmpty,
  WorkbenchFooter,
  WorkbenchHistoryAction,
  WorkbenchModule,
  WorkbenchPanel,
  WorkbenchPanelHead,
  WorkbenchScroll,
  WorkbenchShell,
} from "@/components/workbench/Workbench"
import { WorkbenchModelSelect, WorkbenchParameterSelect, WorkbenchToast } from "@/components/workbench/WorkbenchControls"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import { buyerShowPersonalAssets, buyerShowPublicAssets, buyerShowTeamAssets } from "@/data/demo/asset-picker"
import { buildReviewText } from "@/data/demo/buyer-show"
import {
  agentResultSources,
  agentStageDefinitions,
  buyerShowAgentModels,
  buyerShowAgentProducts,
  defaultBuyerShowAgentDraft,
  evidenceRoleOptions,
  feedbackTypes,
  localEditDirections,
} from "@/data/demo/buyer-show-agent"
import { initialPrompts } from "@/data/demo/prompts"
import {
  adoptBuyerShowAgentVersion,
  advanceBuyerShowAgentTask,
  analyzeBuyerShowAgentDraft,
  applyBuyerShowAgentLocalEdit,
  approveBuyerShowAgentResult,
  completeBuyerShowAgentFeedbackRepair,
  createBuyerShowAgentTask,
  getBuyerShowAgentCurrentVersion,
  getEligibleBuyerShowReviewResults,
  inferBuyerShowEvidenceRole,
  restoreBuyerShowAgentVersion,
  retryBuyerShowAgentResult,
  retryBuyerShowAgentTask,
  stopBuyerShowAgentTask,
  submitBuyerShowAgentFeedback,
  validateBuyerShowAgentDraft,
} from "@/lib/buyer-show-agent-prototype.mjs"
import { downloadImage, downloadImageZip } from "@/lib/image-download"

const STORAGE_KEY = "xianma-buyer-show-agent-prototype-v2"
const ACTIVE_PHASES = new Set(["understanding", "planning", "generating", "checking", "repairing", "feedback_repairing"])

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function downloadTextFile(content, filename, type = "text/tab-separated-values;charset=utf-8") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

async function normalizeEvidence(asset) {
  const src = asset.file ? await fileToDataUrl(asset.file) : asset.src || asset.img
  return {
    id: asset.id || asset.key || `local-${asset.file?.name}-${asset.file?.lastModified}`,
    name: asset.name || asset.title || asset.filename || "补充图片",
    src,
    size: asset.size || "",
    source: asset.source || "素材库",
    sourceType: asset.sourceType || "mine",
    role: inferBuyerShowEvidenceRole(asset),
    roleSource: "agent",
  }
}

export default function BuyerShowAgentPage() {
  const [draft, setDraft] = useState(() => clone(defaultBuyerShowAgentDraft))
  const [task, setTask] = useState(null)
  const [activeTab, setActiveTab] = useState("results")
  const [errors, setErrors] = useState({})
  const [analysis, setAnalysis] = useState(null)
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [assetReplaceIndex, setAssetReplaceIndex] = useState(null)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [polishOpen, setPolishOpen] = useState(false)
  const [feedbackResultId, setFeedbackResultId] = useState(null)
  const [previewIndex, setPreviewIndex] = useState(null)
  const [editResultId, setEditResultId] = useState(null)
  const [toast, setToast] = useState("")
  const [hydrated, setHydrated] = useState(false)

  const running = Boolean(task && ACTIVE_PHASES.has(task.phase))
  const currentResults = task?.results || []
  const editResult = task?.results.find((result) => result.id === editResultId)
  const selectedModel = buyerShowAgentModels.find((model) => model.id === draft.modelId) || buyerShowAgentModels[0]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null")
        if (saved?.draft) setDraft({ ...clone(defaultBuyerShowAgentDraft), ...saved.draft })
        if (saved?.task) setTask(saved.task)
        if (saved?.activeTab) setActiveTab(saved.activeTab)
      } catch {
        // Corrupt or oversized prototype snapshots fall back to the empty draft.
      }
      setHydrated(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, task, activeTab }))
    } catch {
      // In-memory behavior remains available when local storage is unavailable.
    }
  }, [activeTab, draft, hydrated, task])

  useEffect(() => {
    if (!task || !ACTIVE_PHASES.has(task.phase) || task.phase === "feedback_repairing") return
    const timer = window.setTimeout(() => setTask((current) => advanceBuyerShowAgentTask(current)), 850)
    return () => window.clearTimeout(timer)
  }, [task])

  useEffect(() => {
    if (task?.phase !== "feedback_repairing") return
    const timer = window.setTimeout(() => {
      setTask((current) => completeBuyerShowAgentFeedbackRepair(current))
      setToast("定向修复完成，已生成新版本")
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [task?.phase])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  function updateDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  async function selectAssets(items) {
    const normalized = await Promise.all(items.map(normalizeEvidence))
    setDraft((current) => {
      if (assetReplaceIndex !== null && normalized[0]) {
        return { ...current, evidence: current.evidence.map((item, index) => index === assetReplaceIndex ? normalized[0] : item) }
      }
      const existing = new Set(current.evidence.map((item) => item.id))
      return { ...current, evidence: [...current.evidence, ...normalized.filter((item) => !existing.has(item.id))].slice(0, 8) }
    })
    setAssetPickerOpen(false)
    setAssetReplaceIndex(null)
  }

  async function selectLocalImages(event) {
    const files = Array.from(event.target.files || []).slice(0, Math.max(0, 8 - draft.evidence.length))
    event.target.value = ""
    if (!files.length) return
    const normalized = await Promise.all(files.map((file) => normalizeEvidence({
      file,
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))}KB`,
      source: "本地上传",
      sourceType: "local",
    })))
    setDraft((current) => ({ ...current, evidence: [...current.evidence, ...normalized].slice(0, 8) }))
  }

  function beginGeneration() {
    const nextErrors = validateBuyerShowAgentDraft(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const nextAnalysis = analyzeBuyerShowAgentDraft(draft)
    setAnalysis(nextAnalysis)
    if (nextAnalysis.kind === "ready") startTask(nextAnalysis, false)
  }

  function startTask(nextAnalysis, gapOverrideConfirmed) {
    setTask(createBuyerShowAgentTask(draft, { analysis: nextAnalysis, gapOverrideConfirmed }))
    setActiveTab("results")
    setAnalysis(null)
    setToast("已开始生成")
  }

  function retryTask() {
    if (!task) return
    setTask(retryBuyerShowAgentTask(task))
    setDraft(clone(task.draft))
    setActiveTab("results")
    setToast("已按原任务重新开始")
  }

  function submitFeedback(payload) {
    setTask((current) => submitBuyerShowAgentFeedback(current, payload))
    setFeedbackResultId(null)
    setToast("反馈已提交，正在定向修复")
  }

  async function downloadResult(result) {
    const version = getBuyerShowAgentCurrentVersion(result)
    try {
      await downloadImage({ src: version.src, name: `AI买家秀Agent-结果${result.sequence}-${version.label}`, featureName: "AI买家秀Agent" })
      setToast("图片已开始下载")
    } catch {
      setToast("图片下载失败，请重试")
    }
  }

  async function downloadAllResults() {
    const items = currentResults
      .filter((result) => result.technicalStatus !== "生成失败")
      .map((result, index) => ({ src: getBuyerShowAgentCurrentVersion(result).src, name: `结果-${result.sequence}`, index }))
    if (!items.length) return setToast("暂无可下载图片")
    try {
      await downloadImageZip({ items, zipName: `${task.title}-结果图片`, featureName: "AI买家秀Agent" })
      setToast(`已打包下载 ${items.length} 张图片`)
    } catch {
      setToast("批量下载失败，请重试")
    }
  }

  function generateReviews() {
    const eligible = getEligibleBuyerShowReviewResults(task)
    if (!eligible.length) return setToast("请先认可或采用至少一张结果图片")
    const count = Math.min(20, Math.max(1, Number(task.reviewSettings?.count) || 5))
    const sellingPoints = task.reviewSettings?.sellingPoints || task.productSnapshot?.facts?.join("、") || ""
    const reviews = Array.from({ length: count }, (_, index) => {
      const result = eligible[index % eligible.length]
      const version = getBuyerShowAgentCurrentVersion(result)
      return {
        id: `review-${Date.now()}-${index}`,
        resultId: result.id,
        resultVersionId: version.id,
        imageSrc: version.src,
        text: buildReviewText(sellingPoints, `结果 ${result.sequence}`, index),
      }
    })
    setTask((current) => ({ ...current, reviews }))
    setToast(`已生成 ${reviews.length} 条评价文案`)
  }

  async function copyAllReviews() {
    if (!task?.reviews?.length) return
    await navigator.clipboard.writeText(task.reviews.map((review, index) => `${index + 1}. ${review.text}`).join("\n"))
    setToast("已复制全部评价文案")
  }

  const historyParams = {
    product: draft.product?.name || "",
    count: draft.count,
    ratio: draft.ratio,
    resolution: draft.resolution,
    quality: draft.quality,
    model: task?.modelPlan?.actualModel?.name || selectedModel.name,
    status: task?.status || "",
  }

  return (
    <WorkbenchShell
      crumbs={[{ label: "能力中心" }, { label: "AI 买家秀 Agent" }]}
      status="原型验证中"
      title="AI 买家秀 Agent"
      description="商品学习、创作判断、模型匹配、生成质检与修复由 Agent 自动完成。"
      columns="minmax(360px, 40fr) minmax(0, 60fr)"
      contentClassName="xm-product-flow-grid"
      actions={<WorkbenchHistoryAction source="buyer-show-agent" sourceLabel="AI 买家秀 Agent" params={historyParams} />}
    >
      <WorkbenchPanel>
        <WorkbenchPanelHead title="创作输入" description="按顺序完成商品、补充图片、提示词和输出设置。" />
        <WorkbenchScroll gap={12}>
          <WorkbenchModule title="1. 选择商品" hint="必填">
            <ProductSelection product={draft.product} error={errors.product} onOpen={() => setProductPickerOpen(true)} />
          </WorkbenchModule>

          <div className="buyer-show-agent-evidence">
            <ImageQueueModule
              title="2. 补充图片"
              images={draft.evidence}
              max={8}
              limitText="可选 · 仅用于当前任务"
              assetTitle="素材选择"
              assetSub="个人/团体/公共素材库"
              uploadTitle="本地上传"
              uploadSub="电脑多图上传"
              emptyText="可补充商品实拍、结构细节、目标场景或风格参考，不上传也可以继续。补充图片仅用于当前任务，不会同步至商品智库。"
              primaryTitle="补充图片 01"
              accept="image/jpeg,image/png,image/webp"
              onOpenAssetPicker={() => { setAssetReplaceIndex(null); setAssetPickerOpen(true) }}
              onLocalImages={selectLocalImages}
              onRemove={(index) => updateDraft({ evidence: draft.evidence.filter((_, itemIndex) => itemIndex !== index) })}
              onRefresh={(index) => { setAssetReplaceIndex(index); setAssetPickerOpen(true) }}
              onReorder={(evidence) => updateDraft({ evidence })}
              onEditRegion={(index, regionEdit) => updateDraft({ evidence: draft.evidence.map((item, itemIndex) => itemIndex === index ? { ...item, regionEdit } : item) })}
              onUnavailable={(message) => setToast(message)}
              renderItemExtra={(image, index) => (
                <label className="mt-2 flex max-w-[220px] items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                  <span className="shrink-0">图片角色</span>
                  <select
                    aria-label={`补充图片 ${index + 1} 的图片角色`}
                    value={image.role}
                    onChange={(event) => updateDraft({ evidence: draft.evidence.map((item, itemIndex) => itemIndex === index ? { ...item, role: event.target.value, roleSource: "user" } : item) })}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="h-8 min-w-0 flex-1 rounded-md border bg-white px-2 text-xs text-[var(--text-body)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    style={{ borderColor: "var(--border-base)" }}
                  >
                    {evidenceRoleOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              )}
            />
          </div>

          <WorkbenchModule title="3. 创作提示词" hint="必填">
            <WorkbenchPromptEditor
              title=""
              value={draft.prompt}
              onChange={(prompt) => { updateDraft({ prompt }); setErrors((current) => ({ ...current, prompt: "" })) }}
              onTemplate={() => setPromptPickerOpen(true)}
              onClear={() => updateDraft({ prompt: "" })}
              onPolish={() => setPolishOpen(true)}
              rows={5}
              maxLength={800}
              placeholder="描述人物、使用场景、构图、氛围，以及必须保留或禁止修改的内容。"
              ariaLabel="创作提示词"
            />
            {errors.prompt && <span role="alert" className="mt-1.5 block text-xs text-[var(--danger)]">{errors.prompt}</span>}
          </WorkbenchModule>

          <WorkbenchModule title="4. 输出设置">
            <WorkbenchParameterSelect
              label="输出参数"
              summary={`${draft.resolution} · ${draft.ratio} · ${draft.quality} · ${draft.count} 张`}
              sections={[
                { key: "resolution", label: "清晰度", value: draft.resolution, options: ["1K", "2K", "4K"], onChange: (resolution) => updateDraft({ resolution }) },
                { key: "quality", label: "画质", value: draft.quality, options: ["标准画质", "高画质"], onChange: (quality) => updateDraft({ quality }) },
                { key: "ratio", label: "图片尺寸", value: draft.ratio, options: ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"], onChange: (ratio) => updateDraft({ ratio }), visual: "ratio" },
                { key: "count", label: "图片张数", value: draft.count, options: [1, 2, 3, 4, 5, 6, 7, 8, 9], onChange: (count) => updateDraft({ count }) },
              ]}
              note="默认采用质量优先策略。"
            />
            <details className="mt-3 rounded-lg border bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }}>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-semibold text-[var(--text-body)]">
                <span className="inline-flex items-center gap-2"><SlidersHorizontal size={14} />高级设置</span>
                <span className="inline-flex min-w-0 items-center gap-1 text-[var(--text-secondary)]"><span className="truncate">{selectedModel.name}</span><ChevronDown size={14} /></span>
              </summary>
              <div className="border-t p-3" style={{ borderColor: "var(--border-light)" }}>
                <WorkbenchModelSelect value={selectedModel.name} onChange={(name) => updateDraft({ modelId: buyerShowAgentModels.find((model) => model.name === name)?.id || "auto" })} options={buyerShowAgentModels} label="指定主要生成模型" />
                <p className="mb-0 mt-2 text-xs leading-5 text-[var(--text-secondary)]">仅约束主要生成模型；分析、质检和修复仍由系统自动匹配。</p>
              </div>
            </details>
          </WorkbenchModule>
        </WorkbenchScroll>
        <WorkbenchFooter>
          <WorkbenchButton onClick={beginGeneration} disabled={running} className="h-[46px] flex-1 rounded-xl text-[15px]">
            {running ? <><LoaderCircle size={16} className="animate-spin" />{task.status}</> : <><Send size={16} />开始生成</>}
          </WorkbenchButton>
          {running && <WorkbenchButton variant="ghost" onClick={() => setTask((current) => stopBuyerShowAgentTask(current))} className="h-[46px] rounded-xl text-[var(--danger)]"><StopCircle size={15} />停止</WorkbenchButton>}
        </WorkbenchFooter>
      </WorkbenchPanel>

      <ResultPanel
        task={task}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPreview={setPreviewIndex}
        onDownload={downloadResult}
        onDownloadAll={downloadAllResults}
        onApprove={(result) => { setTask((current) => approveBuyerShowAgentResult(current, result.id)); setToast("已认可该结果") }}
        onFeedback={setFeedbackResultId}
        onEdit={setEditResultId}
        onAdopt={(result) => { setTask((current) => adoptBuyerShowAgentVersion(current, result.id, result.currentVersionId)); setToast("已采用当前版本") }}
        onRestore={(resultId, versionId) => setTask((current) => restoreBuyerShowAgentVersion(current, resultId, versionId))}
        onRetryResult={(resultId) => { setTask((current) => retryBuyerShowAgentResult(current, resultId)); setToast("失败结果已重新生成") }}
        onRetryTask={retryTask}
        onGenerateReviews={generateReviews}
        onCopyReviews={copyAllReviews}
        onExportReviews={() => downloadTextFile(["序号\t关联图片\t关联版本\t评价正文", ...(task?.reviews || []).map((review, index) => `${index + 1}\t${review.resultId}\t${review.resultVersionId}\t${review.text}`)].join("\n"), `${task?.title || "AI买家秀Agent"}-评价.tsv`)}
        onReviewSettings={(patch) => setTask((current) => ({ ...current, reviewSettings: { ...current.reviewSettings, ...patch } }))}
        onEditReview={(id, text) => setTask((current) => ({ ...current, reviews: current.reviews.map((review) => review.id === id ? { ...review, text } : review) }))}
        onDeleteReview={(id) => setTask((current) => ({ ...current, reviews: current.reviews.filter((review) => review.id !== id) }))}
      />

      {productPickerOpen && <ProductPickerModal products={buyerShowAgentProducts} onClose={() => setProductPickerOpen(false)} onSelect={(product) => { updateDraft({ product }); setErrors((current) => ({ ...current, product: "" })); setProductPickerOpen(false) }} description="选择当前账号可见且已确认的商品。" />}
      {assetPickerOpen && <AssetPickerModal title={assetReplaceIndex === null ? "选择补充图片" : "替换补充图片"} description="从个人、团体或公共素材中选择，Agent 将自动识别图片角色。" max={assetReplaceIndex === null ? Math.max(1, 8 - draft.evidence.length) : 1} personalAssets={buyerShowPersonalAssets} teamAssets={buyerShowTeamAssets} publicAssets={buyerShowPublicAssets} onClose={() => { setAssetPickerOpen(false); setAssetReplaceIndex(null) }} onConfirm={selectAssets} />}
      {promptPickerOpen && <PromptPickerModal prompts={initialPrompts} defaultLibrary="public" initialSelectedId="" onClose={() => setPromptPickerOpen(false)} onConfirm={(prompt) => { updateDraft({ prompt: prompt.content }); setErrors((current) => ({ ...current, prompt: "" })); setPromptPickerOpen(false); setToast("已应用提示词模板") }} />}
      {polishOpen && <PolishDialog prompt={draft.prompt} onClose={() => setPolishOpen(false)} onApply={(prompt) => { updateDraft({ prompt }); setPolishOpen(false); setToast("已应用润色结果") }} />}
      {analysis && analysis.kind !== "ready" && <AnalysisDialog analysis={analysis} onClose={() => setAnalysis(null)} onContinue={analysis.kind === "gap" ? () => startTask(analysis, true) : undefined} />}
      {feedbackResultId && task && <FeedbackDialog task={task} resultId={feedbackResultId} onClose={() => setFeedbackResultId(null)} onSubmit={submitFeedback} />}
      {previewIndex !== null && currentResults[previewIndex] && <ImagePreviewModal images={currentResults} index={previewIndex} setIndex={setPreviewIndex} getSrc={(result) => getBuyerShowAgentCurrentVersion(result)?.src} getName={(result) => `结果 ${String(result.sequence).padStart(2, "0")} · ${getBuyerShowAgentCurrentVersion(result)?.label}`} featureName="AI买家秀Agent" onClose={() => setPreviewIndex(null)} onNotify={setToast} />}
      {editResult && <ResultLocalEditDialog result={{ ...editResult, src: getBuyerShowAgentCurrentVersion(editResult)?.src, name: `结果 ${String(editResult.sequence).padStart(2, "0")}` }} context={{ taskName: task.title, model: task.modelPlan.actualModel.name, spec: `${task.draft.ratio} · ${task.draft.resolution}` }} directions={localEditDirections} candidateImages={agentResultSources} onApply={async (payload) => { setTask((current) => applyBuyerShowAgentLocalEdit(current, editResult.id, payload)); setToast("已生成新的微调版本") }} onClose={() => setEditResultId(null)} onNotify={setToast} />}
      <WorkbenchToast message={toast} />
      <style jsx global>{`
        @media (max-width: 1280px) {
          .buyer-show-agent-evidence [draggable="true"] {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .buyer-show-agent-evidence [draggable="true"] > div:last-child {
            flex-basis: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </WorkbenchShell>
  )
}

function ProductSelection({ product, error, onOpen }) {
  if (!product) {
    return <div><button type="button" onClick={onOpen} className="flex min-h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-semibold transition-colors hover:border-[var(--brand-primary)]" style={{ borderColor: error ? "var(--danger)" : "var(--border-base)", color: "var(--text-secondary)" }}><ImagePlus size={18} className="text-[var(--brand-primary)]" />选择已确认商品</button>{error && <span role="alert" className="mt-1.5 block text-xs text-[var(--danger)]">{error}</span>}</div>
  }
  const image = getProductReferenceImage(product)
  return <div className="flex gap-3 rounded-lg border p-3" style={{ borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }}><SafeImage src={image?.src} alt={product.name} className="size-20 shrink-0 rounded-lg bg-white object-contain" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[var(--text-title)]">{product.name}</strong><span className="rounded-full bg-[var(--success-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--success)]">已确认</span></div><div className="mt-1 text-xs text-[var(--text-secondary)]">SKU：{product.sku}{product.variant ? ` · ${product.variant}` : ""}</div><p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--text-body)]">{product.factSummary}</p><button type="button" onClick={onOpen} className="mt-2 min-h-8 text-xs font-semibold text-[var(--brand-primary)]">更换商品</button></div></div>
}

function ResultPanel(props) {
  const { task, activeTab, setActiveTab, onDownloadAll } = props
  return <WorkbenchPanel className="min-w-0"><WorkbenchPanelHead title="生成结果" description={task ? task.title : "结果图片和评价文案会显示在这里。"} meta={task && <StatusBadge label={task.status} />} />
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4" style={{ borderColor: "var(--border-light)" }}><div className="flex items-center gap-5">{[["results", "结果图片"], ["reviews", `评价文案${task?.reviews?.length ? ` ${task.reviews.length}` : ""}`]].map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className="relative h-11 text-sm font-semibold" style={{ color: activeTab === id ? "var(--brand-primary)" : "var(--text-secondary)" }}>{label}{activeTab === id && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--brand-primary)]" />}</button>)}</div>{activeTab === "results" && task?.results?.some((result) => result.technicalStatus !== "生成失败") && <button type="button" onClick={onDownloadAll} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[var(--text-body)] hover:bg-[var(--gray-50)]"><Download size={14} />批量下载</button>}</div>
    {task && <TaskDetails task={task} />}
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      {activeTab === "reviews" ? <ReviewsView {...props} /> : <ResultsView {...props} />}
    </div>
  </WorkbenchPanel>
}

function ResultsView({ task, onPreview, onDownload, onApprove, onFeedback, onEdit, onAdopt, onRestore, onRetryResult, onRetryTask }) {
  if (!task) return <WorkbenchEmpty className="mt-[12vh]" title="选择商品并描述想要的买家秀" description="Agent 将自动完成分析、生成和图片质量检查。" />
  if (!task.results?.length) return <div><WorkbenchEmpty className="mt-[10vh]" title={task.status} description={ACTIVE_PHASES.has(task.phase) ? "请稍候，Agent 正在处理当前任务。" : "当前任务没有可展示的结果图片。"} />{["已停止", "全部失败"].includes(task.status) && <div className="mt-4 flex justify-center"><WorkbenchButton variant="ghost" onClick={onRetryTask}><RefreshCw size={14} />按原任务重试</WorkbenchButton></div>}</div>
  return <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{task.results.map((result, index) => <ResultCard key={result.id} task={task} result={result} onPreview={() => onPreview(index)} onDownload={() => onDownload(result)} onApprove={() => onApprove(result)} onFeedback={() => onFeedback(result.id)} onEdit={() => onEdit(result.id)} onAdopt={() => onAdopt(result)} onRestore={(versionId) => onRestore(result.id, versionId)} onRetry={() => onRetryResult(result.id)} />)}</div>
}

function ResultCard({ task, result, onPreview, onDownload, onApprove, onFeedback, onEdit, onAdopt, onRestore, onRetry }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const version = getBuyerShowAgentCurrentVersion(result)
  const adopted = task.adoptedVersions?.[result.id] === result.currentVersionId
  const failed = result.technicalStatus === "生成失败"
  return <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-white" style={{ borderColor: adopted ? "var(--brand-primary)" : "var(--border-base)", boxShadow: "var(--shadow-control)" }}><div className="relative aspect-[3/4] overflow-hidden bg-[var(--gray-100)]">{failed ? <div className="grid h-full place-items-center px-5 text-center"><div><XCircle size={34} className="mx-auto text-[var(--danger)]" /><strong className="mt-3 block text-sm text-[var(--text-title)]">生成未完成</strong><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{result.error}</p><WorkbenchButton variant="ghost" onClick={onRetry} className="mt-3"><RefreshCw size={14} />重新生成</WorkbenchButton></div></div> : <SafeImage src={version?.src} alt={`结果 ${result.sequence}`} className="h-full w-full object-cover" />}{adopted && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)] px-2 py-1 text-[11px] font-bold text-white"><Check size={12} />已采用</span>}</div><div className="flex flex-1 flex-col p-3"><div className="flex items-start justify-between gap-2"><div><strong className="text-sm text-[var(--text-title)]">结果 {String(result.sequence).padStart(2, "0")}</strong><span className="ml-2 text-xs text-[var(--text-secondary)]">{version?.label}</span></div><StatusBadge label={result.userStatus} compact /></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-body)]">{result.summary}</p>{!failed && <div className="mt-3 grid grid-cols-3 gap-1.5"><ResultAction icon={Eye} label="查看大图" onClick={onPreview} /><ResultAction icon={Download} label="下载" onClick={onDownload} /><ResultAction icon={ThumbsUp} label="认可" active={result.userStatus === "认可"} onClick={onApprove} /><ResultAction icon={ThumbsDown} label="待调整" active={result.userStatus === "待调整"} onClick={onFeedback} /><ResultAction icon={Pencil} label="继续微调" onClick={onEdit} /><ResultAction icon={CheckCircle2} label="采用结果" active={adopted} onClick={onAdopt} /></div>}{result.versions.length > 1 && <div className="mt-3 border-t pt-2" style={{ borderColor: "var(--border-light)" }}><button type="button" onClick={() => setHistoryOpen((open) => !open)} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]">当前 {version.label} · 查看历史版本<ChevronDown size={13} className={historyOpen ? "rotate-180" : ""} /></button>{historyOpen && <div className="mt-1 space-y-1">{result.versions.map((item) => <button key={item.id} type="button" onClick={() => onRestore(item.id)} className="flex min-h-9 w-full items-center justify-between rounded-md px-2 text-left text-xs hover:bg-[var(--gray-50)]"><span>{item.label} · {item.source}</span>{item.id === result.currentVersionId && <Check size={13} className="text-[var(--brand-primary)]" />}</button>)}</div>}</div>}</div></article>
}

function ResultAction({ icon: Icon, label, onClick, active = false }) {
  return <button type="button" onClick={onClick} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-md border px-1 text-[11px] font-semibold transition-colors hover:bg-[var(--gray-50)]" style={{ borderColor: active ? "var(--brand-primary)" : "var(--border-base)", color: active ? "var(--brand-primary)" : "var(--text-secondary)", background: active ? "var(--brand-primary-soft)" : "var(--white)" }}><Icon size={14} /><span>{label}</span></button>
}

function TaskDetails({ task }) {
  return <details className="shrink-0 border-b bg-[var(--gray-50)]" style={{ borderColor: "var(--border-light)" }}><summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-4 text-xs font-semibold text-[var(--text-body)]"><span>查看处理详情</span><ChevronDown size={14} /></summary><div className="grid gap-4 border-t px-4 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]" style={{ borderColor: "var(--border-light)" }}><div><div className="grid gap-2 sm:grid-cols-2"><DetailFact label="创作方式" value={task.creationBranch} /><DetailFact label="实际模型" value={task.modelPlan.actualModel.name} /><DetailFact label="普通缺口" value={task.gaps.length ? `${task.gaps.length} 项${task.gapOverrideConfirmed ? " · 已确认继续" : ""}` : "无"} /><DetailFact label="关键冲突" value={task.conflicts.length ? `${task.conflicts.length} 项` : "无"} /></div><div className="mt-3 space-y-1.5">{task.methodPlan.map((item, index) => <div key={item} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-soft)] text-[10px] font-bold text-[var(--brand-primary)]">{index + 1}</span><span>{item}</span></div>)}</div></div><div className="space-y-2">{task.stages.map((stage) => <div key={stage.id} className="flex items-center justify-between gap-3 text-xs"><span className="text-[var(--text-body)]">{stage.label}</span><StatusBadge label={stage.status} compact /></div>)}</div></div></details>
}

function DetailFact({ label, value }) {
  return <div className="rounded-md bg-white p-2.5"><span className="block text-[11px] text-[var(--text-secondary)]">{label}</span><strong className="mt-1 block text-xs text-[var(--text-title)]">{value}</strong></div>
}

function ReviewsView({ task, onGenerateReviews, onCopyReviews, onExportReviews, onReviewSettings, onEditReview, onDeleteReview }) {
  if (!task) return <WorkbenchEmpty className="mt-[12vh]" title="暂无评价文案" description="生成并认可结果图片后，可批量生成评价文案。" />
  const eligible = getEligibleBuyerShowReviewResults(task)
  const reviews = task.reviews || []
  return <div className="mx-auto max-w-4xl"><div className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><div className="flex flex-wrap items-end gap-3"><label className="min-w-[220px] flex-1"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-title)]">商品卖点</span><input value={task.reviewSettings?.sellingPoints || ""} onChange={(event) => onReviewSettings({ sellingPoints: event.target.value })} placeholder="输入希望覆盖的商品卖点" className="h-10 w-full rounded-lg border px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label><label className="w-28"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-title)]">评价数量</span><select value={task.reviewSettings?.count || 5} onChange={(event) => onReviewSettings({ count: Number(event.target.value) })} className="h-10 w-full rounded-lg border bg-white px-3 text-sm" style={{ borderColor: "var(--border-base)" }}>{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} 条</option>)}</select></label><WorkbenchButton onClick={onGenerateReviews} disabled={!eligible.length} className="h-10 rounded-lg">批量生成</WorkbenchButton></div><p className="mb-0 mt-2 text-xs text-[var(--text-secondary)]">可用图片 {eligible.length} 张，仅使用已认可或已采用的结果。</p></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[var(--text-title)]">{reviews.length} 条评价</strong><div className="flex gap-2"><button type="button" disabled={!reviews.length} onClick={onCopyReviews} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold disabled:opacity-40" style={{ borderColor: "var(--border-base)" }}><Copy size={13} />复制全部</button><button type="button" disabled={!reviews.length} onClick={onExportReviews} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold disabled:opacity-40" style={{ borderColor: "var(--border-base)" }}><Download size={13} />导出表格</button></div></div>{reviews.length ? <div className="mt-3 space-y-3">{reviews.map((review, index) => <article key={review.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[72px_minmax(0,1fr)_36px]" style={{ borderColor: "var(--border-base)" }}><SafeImage src={review.imageSrc} alt={`评价 ${index + 1} 关联图片`} className="aspect-[3/4] w-[72px] rounded-md object-cover" /><div><div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">评价 {index + 1} · 关联结果 {review.resultId.replace("result-", "")}</div><textarea value={review.text} onChange={(event) => onEditReview(review.id, event.target.value)} rows={3} className="w-full resize-y rounded-md border p-2 text-sm leading-6 outline-none" style={{ borderColor: "var(--border-base)" }} /></div><button type="button" onClick={() => onDeleteReview(review.id)} title="删除评价" aria-label={`删除评价 ${index + 1}`} className="grid size-9 place-items-center rounded-md text-[var(--danger)] hover:bg-[var(--danger-bg)]"><Trash2 size={15} /></button></article>)}</div> : <WorkbenchEmpty className="mt-3" title="还没有评价文案" description={eligible.length ? "设置卖点和数量后批量生成。" : "先认可或采用至少一张结果图片。"} />}<p className="mt-3 text-xs font-semibold text-[var(--warning)]">AI 生成内容需人工审核后使用。</p></div>
}

function PolishDialog({ prompt, onClose, onApply }) {
  const polished = `${String(prompt || "").trim().replace(/\s+/g, " ")}；人物状态自然，画面像真实买家随手拍；严格保持商品颜色、结构、材质与标识，不新增或改写无法确认的商品事实。`.slice(0, 800)
  return <WorkbenchPickerDialog eyebrow="AI 润色" title="优化创作提示词" description="补充真实感和商品保护约束，原意保持不变。" width="680px" onClose={onClose} footer={<><WorkbenchButton variant="ghost" onClick={onClose}>取消</WorkbenchButton><WorkbenchButton onClick={() => onApply(polished)}>应用润色结果</WorkbenchButton></>}><div className="rounded-lg border bg-[var(--gray-50)] p-4 text-sm leading-7 text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}>{polished || "请先填写创作提示词。"}</div></WorkbenchPickerDialog>
}

function AnalysisDialog({ analysis, onClose, onContinue }) {
  const conflict = analysis.kind === "conflict"
  const modelConflict = analysis.kind === "model_conflict"
  const title = conflict ? "关键商品信息冲突" : modelConflict ? "指定模型不支持当前任务" : "存在普通资料缺口"
  const items = conflict ? analysis.conflicts : modelConflict ? [analysis.modelMatch.reason] : analysis.gaps
  return <WorkbenchPickerDialog eyebrow="提交后判断" title={title} description="Agent 已读取商品快照、补充图片、提示词和输出参数。" width="620px" onClose={onClose} footer={<><WorkbenchButton variant="ghost" onClick={onClose}>{modelConflict ? "返回调整设置" : "返回补充图片"}</WorkbenchButton>{onContinue && <WorkbenchButton onClick={onContinue}>带着缺口继续生成</WorkbenchButton>}</>}><div role={conflict || modelConflict ? "alert" : "status"} className="rounded-lg border p-4" style={{ borderColor: conflict || modelConflict ? "var(--danger)" : "var(--warning)", background: conflict || modelConflict ? "var(--danger-bg)" : "var(--warning-bg)" }}><div className="flex gap-3">{conflict || modelConflict ? <XCircle className="shrink-0 text-[var(--danger)]" size={20} /> : <AlertTriangle className="shrink-0 text-[var(--warning)]" size={20} />}<div><strong className="text-sm text-[var(--text-title)]">{conflict ? "请确认正确资料后再生成。" : modelConflict ? "系统不会静默忽略你的模型选择。" : "这些缺口可能影响商品还原效果，你仍可继续。"}</strong><ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--text-body)]">{items.map((item) => <li key={item}>· {item}</li>)}</ul></div></div></div></WorkbenchPickerDialog>
}

function FeedbackDialog({ task, resultId, onClose, onSubmit }) {
  const [types, setTypes] = useState([])
  const [note, setNote] = useState("")
  const [regionEdit, setRegionEdit] = useState(null)
  const [marking, setMarking] = useState(false)
  const result = task.results.find((item) => item.id === resultId)
  const version = getBuyerShowAgentCurrentVersion(result)
  if (marking) return <RegionMaskEditor image={{ src: version.src, name: `结果 ${result.sequence} ${version.label}` }} value={regionEdit} eyebrow="圈选问题区域" helpText="圈选需要定向修复的位置，并可添加文字说明。" applyLabel="保存问题区域" coverageLabel="圈选覆盖" annotationLabel="条问题标注" annotationPlaceholder="说明该区域的问题" showOperations={false} showUnavailableTools={false} onClose={() => setMarking(false)} onApply={(value) => { setRegionEdit(value); setMarking(false) }} />
  return <WorkbenchPickerDialog eyebrow="待调整" title={`反馈结果 ${String(result.sequence).padStart(2, "0")}`} description="选择问题类型、补充修改要求并按需圈选问题区域。" width="720px" onClose={onClose} footer={<><WorkbenchButton variant="ghost" onClick={onClose}>取消</WorkbenchButton><WorkbenchButton disabled={!types.length} onClick={() => onSubmit({ resultId, types, note: note.trim(), regionEdit })}>提交并定向修复</WorkbenchButton></>}><div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]"><SafeImage src={version.src} alt={`结果 ${result.sequence}`} className="aspect-[3/4] w-full rounded-lg object-cover" /><div><div className="flex flex-wrap gap-2">{feedbackTypes.map((type) => { const active = types.includes(type); return <button key={type} type="button" onClick={() => setTypes((current) => active ? current.filter((item) => item !== type) : [...current, type])} className="min-h-9 rounded-full border px-3 text-xs font-semibold" style={{ borderColor: active ? "var(--brand-primary)" : "var(--border-base)", background: active ? "var(--brand-primary-soft)" : "var(--white)", color: active ? "var(--brand-primary)" : "var(--text-body)" }}>{type}</button> })}</div><label className="mt-4 block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-title)]">修改要求</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={400} placeholder="说明错误位置、期望效果和必须保留的内容。" className="w-full resize-y rounded-lg border p-3 text-sm leading-6 outline-none" style={{ borderColor: "var(--border-base)" }} /></label><button type="button" onClick={() => setMarking(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs font-semibold" style={{ borderColor: regionEdit ? "var(--brand-primary)" : "var(--border-base)", color: regionEdit ? "var(--brand-primary)" : "var(--text-body)" }}><MessageSquare size={14} />{regionEdit ? `已圈选 ${regionEdit.coverage || 0}% 区域` : "圈选问题区域"}</button></div></div></WorkbenchPickerDialog>
}

function StatusBadge({ label, compact = false }) {
  const danger = /失败|冲突|停止/.test(label)
  const warning = /缺口|待|修复|无法判断/.test(label)
  const success = /认可|采用|完成|通过/.test(label)
  const style = danger ? { background: "var(--danger-bg)", color: "var(--danger)" } : warning ? { background: "var(--warning-bg)", color: "var(--warning)" } : success ? { background: "var(--success-bg)", color: "var(--success)" } : { background: "var(--info-bg)", color: "var(--info)" }
  return <span className={`inline-flex shrink-0 items-center rounded-full font-semibold ${compact ? "min-h-6 px-2 text-[11px]" : "min-h-7 px-2.5 text-xs"}`} style={style}>{label}</span>
}
