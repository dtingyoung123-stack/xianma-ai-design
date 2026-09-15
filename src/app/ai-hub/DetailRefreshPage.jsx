"use client"

import { useEffect, useRef, useState } from "react"
import { Check, CircleAlert, Download, Eye, FolderOpen, ImagePlus, LoaderCircle, RefreshCw, Sparkles, ThumbsDown, ThumbsUp, Trash2, Upload, WandSparkles, X } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import ResultLocalEditDialog from "@/components/workbench/ResultLocalEditDialog"
import ProductPickerModal, { getProductReferenceImage } from "@/components/workbench/ProductPickerModal"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import WorkbenchPromptEditor from "@/components/workbench/WorkbenchPromptEditor"
import { downloadImage, downloadImageZip } from "@/lib/image-download"
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
import { getBreadcrumbs } from "@/config/navigation"
import {
  detailRefreshDirections,
  detailRefreshImages,
  detailRefreshProductLibrary,
  detailRefreshResultPool,
  detailRefreshReplacementAssets,
} from "@/data/demo/detail-refresh"
import { initialPrompts } from "@/data/demo/prompts"

const statusMeta = {
  IDLE: { label: "待提交", tone: "neutral" },
  QUEUED: { label: "排队中", tone: "info" },
  PROCESSING: { label: "处理中", tone: "info" },
  PARTIAL_SUCCESS: { label: "部分成功", tone: "warning" },
  SUCCESS: { label: "全部成功", tone: "success" },
  FAILED: { label: "全部失败", tone: "danger" },
  CANCELLED: { label: "已取消", tone: "neutral" },
  RETRYING: { label: "单张重试中", tone: "info" },
}

const toneStyles = {
  neutral: { background: "var(--gray-100)", color: "var(--text-secondary)" },
  info: { background: "var(--info-bg)", color: "var(--info)" },
  warning: { background: "var(--warning-bg)", color: "var(--warning)" },
  success: { background: "var(--success-bg)", color: "var(--success)" },
  danger: { background: "var(--danger-bg)", color: "var(--danger)" },
}

export default function DetailRefreshPage() {
  const crumbs = getBreadcrumbs(["AI 能力中心", "AI 商详焕新"])
  const [images, setImages] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [replacementImages, setReplacementImages] = useState([])
  const [prompt, setPrompt] = useState("整体换成更清爽的浅色视觉，保持商品结构和详情页信息不变。")
  const [task, setTask] = useState({ status: "IDLE", progress: 0, results: [] })
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [assetPickerMode, setAssetPickerMode] = useState("detail")
  const [previewIndex, setPreviewIndex] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [polishOpen, setPolishOpen] = useState(false)
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)
  const toastRef = useRef(null)

  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearTimeout(toastRef.current)
  }, [])

  const editResult = editTarget ? task.results.find((result) => result.id === editTarget) : null
  const canSubmit = images.length >= 1 && images.length <= 9 && task.status !== "PROCESSING" && task.status !== "QUEUED" && task.status !== "RETRYING"

  function notify(message) {
    setToast(message)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(""), 2600)
  }

  async function downloadAll() {
    const items = task.results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === "SUCCESS" && result.src)
      .map(({ result, index }) => ({
        src: result.src,
        name: result.name || `${result.shot}-${result.role}`,
        index,
      }))
    if (!items.length) return notify("当前没有可下载的成功结果")
    try {
      await downloadImageZip({ items, zipName: "AI商详焕新-结果图片", featureName: "AI商详焕新" })
      const failedCount = task.results.filter((result) => result.status === "FAILED").length
      notify(failedCount ? `已打包下载 ${items.length} 张，失败图片未包含` : `已打包下载 ${items.length} 张图片`)
    } catch {
      notify("图片打包失败，请稍后重试")
    }
  }

  function addLocalImages(event) {
    const files = Array.from(event.target.files || [])
    const available = Math.max(0, 9 - images.length)
    const next = files.slice(0, available).map((file, index) => ({
      id: `local-${file.name}-${file.lastModified}-${index}`,
      shot: String(images.length + index + 1).padStart(2, "0"),
      role: "待识别详情页角色",
      name: file.name,
      src: URL.createObjectURL(file),
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    }))
    if (next.length) setImages((current) => [...current, ...next])
    if (files.length > available) notify("一组详情图最多上传 9 张")
    event.target.value = ""
  }

  function selectProduct(nextProduct) {
    setSelectedProduct(nextProduct)
    setProductPickerOpen(false)
    notify(`已选择商品：${nextProduct.name}`)
  }

  function handleAssetConfirm(selected) {
    if (assetPickerMode === "detail") {
      const available = Math.max(0, 9 - images.length)
      const next = selected.slice(0, available).map((asset, index) => ({
        id: asset.id || `asset-detail-${Date.now()}-${index}`,
        shot: String(images.length + index + 1).padStart(2, "0"),
        role: "待识别详情页角色",
        name: asset.title || asset.name || "素材库图片",
        src: asset.src || asset.img,
        size: asset.size || "演示素材",
      }))
      if (next.length) setImages((current) => [...current, ...next])
      if (selected.length > available) notify("一组详情图最多上传 9 张")
    } else {
      setReplacementImages(selected.slice(0, 6))
    }
    setAssetPickerOpen(false)
    notify(assetPickerMode === "detail" ? `已添加 ${Math.min(selected.length, Math.max(0, 9 - images.length))} 张详情图` : `已添加 ${selected.length} 张替换商品图片`)
  }

  function buildResults() {
    return images.map((image, index) => ({
      ...image,
      id: `result-${image.id}`,
      src: detailRefreshResultPool[index % detailRefreshResultPool.length],
      originalSrc: image.src,
      status: "PROCESSING",
      note: "正在按组级视觉系统生成",
      versions: [{ id: `version-${image.id}-original`, src: image.src, label: "原始图片", note: "输入详情图" }],
      currentVersionId: `version-${image.id}-original`,
      feedback: null,
    }))
  }

  function beginTask(targetIds = null) {
    if (!images.length) return notify("请先上传 1–9 张详情页图片")
    if (!canSubmit && !targetIds) return notify("当前任务正在处理中，请稍候")
    const initialResults = targetIds
      ? task.results.map((result) => targetIds.includes(result.id) ? { ...result, status: "PROCESSING", feedback: null, note: "正在重新生成" } : result)
      : buildResults()
    const total = initialResults.length
    const alreadyDone = initialResults.filter((result) => result.status === "SUCCESS").length
    setTask((current) => ({ ...current, status: targetIds ? "RETRYING" : "QUEUED", progress: Math.round(alreadyDone / total * 100), results: initialResults }))
    notify(targetIds ? "已提交单张重试任务" : `已提交 ${total} 张商详焕新任务`)
    clearInterval(timerRef.current)
    let cursor = 0
    timerRef.current = setInterval(() => {
      setTask((current) => {
        const next = current.results.map((result) => {
          if (result.status !== "PROCESSING") return result
          if (!targetIds && result.id.endsWith("detail-03") && current.results.length > 2) {
            return { ...result, status: "FAILED", note: "当前图片生成失败，可单独重试" }
          }
          return { ...result, status: "SUCCESS", note: "已完成，请人工确认商品与文案事实" }
        })
        cursor += 1
        const done = next.filter((result) => result.status !== "PROCESSING").length
        const hasFailed = next.some((result) => result.status === "FAILED")
        const doneStatus = done >= next.length ? (hasFailed && done === next.length ? (done === 1 ? "FAILED" : "PARTIAL_SUCCESS") : "SUCCESS") : current.status
        if (done >= next.length) clearInterval(timerRef.current)
        return { ...current, status: done >= next.length ? doneStatus : "PROCESSING", progress: Math.round(done / next.length * 100), results: next }
      })
    }, 520)
  }

  function retryResult(resultId) {
    beginTask([resultId])
  }

  function applyEdit({ candidate, direction, instruction }) {
    const versionId = `version-${editTarget}-${editResult?.versions?.length || 0}`
    setTask((current) => ({
      ...current,
      results: current.results.map((result) => result.id === editTarget ? {
        ...result,
        src: candidate.src,
        status: "SUCCESS",
        note: `已应用：${direction.title}`,
        versions: [...result.versions, { id: versionId, src: candidate.src, label: "微调版本", note: instruction }],
        currentVersionId: versionId,
        feedback: null,
      } : result),
    }))
    notify("已更新当前图片，其他结果保持不变")
    setEditTarget(null)
  }

  function removeImage(index) {
    setImages((current) => current.filter((_, imageIndex) => imageIndex !== index).map((image, imageIndex) => ({ ...image, shot: String(imageIndex + 1).padStart(2, "0") })))
  }

  function reorderImage(from, to) {
    setImages((current) => {
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next.map((image, index) => ({ ...image, shot: String(index + 1).padStart(2, "0") }))
    })
  }

  return (
    <WorkbenchShell
      crumbs={crumbs}
      status="原型验证中"
      title="AI 商详焕新"
      description="基于原详情组图，统一换新视觉风格，并支持商品、人物与场景调整。"
      actions={<>
        <a href="/api/detail-refresh-prd" download className="inline-flex h-10 min-h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-extrabold transition-opacity hover:opacity-90" style={{ color: "var(--text-body)", borderColor: "var(--border-base)", background: "var(--white)", boxShadow: "var(--shadow-control)" }} title="下载 AI 商详焕新 PRD">
          <Download size={16} />导出 PRD
        </a>
        <WorkbenchHistoryAction source="detail-refresh" sourceLabel="AI 商详焕新" params={{ count: images.length, product: selectedProduct?.name || "", status: task.status }} />
      </>}
      columns="minmax(380px, 4fr) minmax(0, 6fr)"
    >
      <WorkbenchPanel>
        <WorkbenchPanelHead title="焕新配置" description="先整理详情组图，再生成一套统一的新视觉系统。" />
        <WorkbenchScroll>
          <ImageQueue
            images={images}
            onLocalImages={addLocalImages}
            onRemove={removeImage}
            onPreview={(index) => setPreviewIndex(index)}
            onReorder={reorderImage}
            onOpenAssetPicker={() => { setAssetPickerMode("detail"); setAssetPickerOpen(true) }}
          />

          <WorkbenchModule title="替换商品" hint="可选">
            <div className="grid gap-3 lg:grid-cols-2">
              <ReplacementProductSource product={selectedProduct} onOpen={() => setProductPickerOpen(true)} onClear={() => setSelectedProduct(null)} />
              <ReplacementImageSource images={replacementImages} onOpen={() => { setAssetPickerMode("replacement"); setAssetPickerOpen(true) }} onClear={() => setReplacementImages([])} />
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--info-bg)] px-3 py-2 text-xs leading-5 text-[var(--text-body)]"><CircleAlert size={14} className="mt-0.5 shrink-0 text-[var(--info)]" />{selectedProduct ? "商品智库已确认信息优先，上传商品图片作为额外参考。" : replacementImages.length ? "将按上传商品图片替换原商品。" : "未选择替换来源，将保持原商品，仅焕新视觉、人物、背景与场景。"}</div>
          </WorkbenchModule>

          <WorkbenchPromptEditor title="补充提示词" value={prompt} onChange={setPrompt} onTemplate={() => setPromptPickerOpen(true)} onClear={() => setPrompt("")} onPolish={() => setPolishOpen(true)} maxLength={500} rows={5} placeholder="例如：整体更清爽，保留详情页信息层级。" helperText="仅影响人物、背景、场景、氛围、构图和版式，不新增未提供的商品事实。" />
        </WorkbenchScroll>
        <WorkbenchFooter>
          <WorkbenchButton variant="ghost" onClick={() => { setImages([]); setSelectedProduct(null); setReplacementImages([]); setPrompt(""); setTask({ status: "IDLE", progress: 0, results: [] }); notify("已清空当前配置") }}><Trash2 size={15} />清空</WorkbenchButton>
          <WorkbenchButton disabled={!canSubmit} onClick={() => beginTask()}><WandSparkles size={15} />开始生成商详组图{images.length ? `（${images.length} 张）` : ""}</WorkbenchButton>
        </WorkbenchFooter>
      </WorkbenchPanel>

      <WorkbenchPanel className="min-w-0">
        <WorkbenchPanelHead title="生成结果" description="按原顺序查看结果；失败或不满意时只处理当前图片。" meta={<StatusBadge label={statusMeta[task.status].label} tone={statusMeta[task.status].tone} />}>
          <button type="button" className="inline-flex min-h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} onClick={downloadAll} disabled={!task.results.some((result) => result.status === "SUCCESS" && result.src)} title="下载整组图片"><Download size={13} />下载整组图片</button>
        </WorkbenchPanelHead>
        <WorkbenchScroll>
          {task.results.length ? <div className="grid gap-3 xl:grid-cols-2">{task.results.map((result, index) => <ResultCard key={result.id} result={result} index={index} onPreview={() => setPreviewIndex(index)} onRetry={() => retryResult(result.id)} onEdit={() => setEditTarget(result.id)} onFeedback={(feedback) => { setTask((current) => ({ ...current, results: current.results.map((item) => item.id === result.id ? { ...item, feedback: item.feedback === feedback ? null : feedback } : item) })); notify(feedback === "approved" ? "已记录认可反馈" : "已记录待改进反馈") }} onDownload={async () => { try { const filename = await downloadImage({ src: result.src, name: result.name || `${result.shot}-${result.role}`, featureName: "AI商详焕新", index }); notify(`已下载 ${filename}`) } catch { notify("图片下载失败，请稍后重试") } }} />)}</div> : <WorkbenchEmpty title="等待商详焕新结果" description="上传 1–9 张详情页图片后开始生成。" />}
        </WorkbenchScroll>
      </WorkbenchPanel>

      {productPickerOpen && <ProductPickerModal title="选择替换商品" description="选择已确认且当前账号可见的商品；商品选择与上传商品图片相互独立。" onClose={() => setProductPickerOpen(false)} onSelect={selectProduct} products={detailRefreshProductLibrary} />}
      {assetPickerOpen && <AssetPickerModal title={assetPickerMode === "detail" ? "选择详情页图片" : "选择替换商品图片"} description={assetPickerMode === "detail" ? "从素材库或本地选择 1–9 张详情页图片。" : "从素材库或本地选择替换商品图片，最多保留 6 张。"} max={assetPickerMode === "detail" ? Math.max(1, 9 - images.length) : 6} defaultSource="mine" personalAssets={assetPickerMode === "detail" ? detailRefreshImages : detailRefreshReplacementAssets} teamAssets={assetPickerMode === "detail" ? detailRefreshImages : detailRefreshReplacementAssets} publicAssets={assetPickerMode === "detail" ? detailRefreshImages : detailRefreshReplacementAssets} onClose={() => setAssetPickerOpen(false)} onConfirm={handleAssetConfirm} />}
      {promptPickerOpen && <PromptPickerModal prompts={initialPrompts} defaultLibrary="team" onClear={() => { setPrompt(""); setPromptPickerOpen(false) }} onClose={() => setPromptPickerOpen(false)} onConfirm={(selectedPrompt) => { setPrompt(selectedPrompt.content); setPromptPickerOpen(false); notify("提示词模板已回填") }} />}
      {polishOpen && <PromptPolishModal prompt={prompt} onApply={(value) => { setPrompt(value); setPolishOpen(false); notify("已应用润色结果") }} onClose={() => setPolishOpen(false)} />}
      {previewIndex !== null && <ImagePreviewModal images={task.results.length ? task.results : images} index={previewIndex} setIndex={setPreviewIndex} getSrc={(image) => image.src} getName={(image) => image.role || image.name} onClose={() => setPreviewIndex(null)} />}
      {editResult && <ResultLocalEditDialog result={editResult} context={{ taskName: "AI 商详焕新", spec: `${editResult.role} · 按原图尺寸保持` }} directions={detailRefreshDirections} candidateImages={detailRefreshResultPool} onApply={applyEdit} onClose={() => setEditTarget(null)} onNotify={notify} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-[1300] -translate-x-1/2 rounded-md bg-[var(--gray-900)] px-4 py-3 text-sm text-white shadow-xl" role="status">{toast}</div>}
    </WorkbenchShell>
  )
}

function ImageQueue({ images, onLocalImages, onRemove, onPreview, onReorder, onOpenAssetPicker }) {
  const [dragIndex, setDragIndex] = useState(null)
  return (
    <WorkbenchModule title="详情图输入" hint={`${images.length} / 9 张`}>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="flex h-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} onClick={onOpenAssetPicker}><FolderOpen size={18} className="text-[var(--brand-primary)]" /><strong className="text-xs text-[var(--text-title)]">素材库选择</strong><span className="text-[11px] text-[var(--text-secondary)]">个人/团体/公共素材</span></button>
        <label className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }}><Upload size={18} className="text-[var(--brand-primary)]" /><strong className="text-xs text-[var(--text-title)]">本地上传</strong><span className="text-[11px] text-[var(--text-secondary)]">支持 JPG、PNG</span><input type="file" multiple accept="image/jpeg,image/png" className="sr-only" onChange={onLocalImages} disabled={images.length >= 9} /></label>
      </div>
      {images.length ? <div className="mt-3 grid gap-2">{images.map((image, index) => <div key={image.id} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) onReorder(dragIndex, index); setDragIndex(null) }} className="flex items-center gap-3 rounded-lg border bg-[var(--gray-50)] p-2.5" style={{ borderColor: "var(--border-base)" }}><SafeImage src={image.src} alt={image.role || image.name} className="size-12 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-[var(--text-title)]">图 {image.shot} · {image.role}</div><div className="truncate text-xs text-[var(--text-secondary)]">{image.name} · {image.size}</div></div><div className="flex shrink-0 items-center gap-1"><IconButton title="预览" onClick={() => onPreview(index)}><Eye size={14} /></IconButton><IconButton title="删除" onClick={() => onRemove(index)} danger><Trash2 size={14} /></IconButton></div></div>)}</div> : <div className="mt-3 rounded-lg border border-dashed px-3 py-7 text-center text-sm text-[var(--text-disabled)]" style={{ borderColor: "var(--border-base)" }}>上传 1–9 张详情页图片后开始生成。</div>}
      <p className="mt-2 text-[11px] text-[var(--text-disabled)]">拖拽图片行可调整顺序，顺序将对应生成结果。</p>
    </WorkbenchModule>
  )
}

function ReplacementProductSource({ product, onOpen, onClear }) {
  const image = getProductReferenceImage(product)
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: product ? "var(--brand-primary-border)" : "var(--border-base)", background: product ? "var(--brand-primary-soft)" : "var(--white)" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div><strong className="text-xs text-[var(--text-title)]">商品智库商品</strong><span className="ml-2 text-[11px] text-[var(--text-secondary)]">可选</span></div>
        {product && <button type="button" title="清除商品智库商品" aria-label="清除商品智库商品" className="grid size-7 place-items-center rounded-md border bg-white text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }} onClick={onClear}><X size={13} /></button>}
      </div>
      {product ? (
        <div className="flex items-start gap-2.5">
          <SafeImage src={image?.src} alt={product.name} className="size-14 shrink-0 rounded-md bg-white object-contain" />
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><strong className="truncate text-sm text-[var(--text-title)]">{product.name}</strong><StatusBadge label="已确认" tone="success" /></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{product.category} · {product.factSummary}</p><button type="button" onClick={onOpen} className="mt-2 text-xs font-semibold text-[var(--brand-primary)]">更换商品</button></div>
        </div>
      ) : <button type="button" onClick={onOpen} className="flex min-h-16 w-full items-center justify-center gap-2 rounded-md border border-dashed text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-primary)]"><ImagePlus size={17} className="text-[var(--brand-primary)]" />选择商品智库商品</button>}
    </div>
  )
}

function ReplacementImageSource({ images, onOpen, onClear }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: images.length ? "var(--brand-primary-border)" : "var(--border-base)", background: images.length ? "var(--brand-primary-soft)" : "var(--white)" }}>
      <div className="mb-2 flex items-center justify-between gap-2"><div><strong className="text-xs text-[var(--text-title)]">上传商品图片</strong><span className="ml-2 text-[11px] text-[var(--text-secondary)]">可选 · 最多 6 张</span></div>{images.length > 0 && <button type="button" title="清除上传商品图片" aria-label="清除上传商品图片" className="grid size-7 place-items-center rounded-md border bg-white text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }} onClick={onClear}><X size={13} /></button>}</div>
      {images.length ? <div className="flex items-center gap-2"><div className="flex min-w-0 flex-1 gap-2 overflow-hidden">{images.map((image) => <div key={image.id} className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-white" style={{ borderColor: "var(--border-base)" }}><SafeImage src={image.src} alt={image.title || image.name} className="h-full w-full object-cover" /></div>)}</div><button type="button" onClick={onOpen} className="shrink-0 text-xs font-semibold text-[var(--brand-primary)]">重新选择</button></div> : <button type="button" onClick={onOpen} className="flex min-h-16 w-full items-center justify-center gap-2 rounded-md border border-dashed text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-primary)]"><Upload size={17} className="text-[var(--brand-primary)]" />选择或上传商品图片</button>}
    </div>
  )
}

function ResultCard({ result, index, onPreview, onRetry, onEdit, onDownload, onFeedback }) {
  const isProcessing = result.status === "PROCESSING"
  const isFailed = result.status === "FAILED"
  return <article className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }}><div className="relative aspect-[4/3] bg-[var(--gray-50)]">{isProcessing ? <div className="grid h-full place-items-center text-center text-sm text-[var(--text-secondary)]"><LoaderCircle size={25} className="mb-2 animate-spin text-[var(--brand-primary)]" /><span>正在生成第 {result.shot} 张</span></div> : <button type="button" className="absolute inset-0 cursor-zoom-in disabled:cursor-default" onClick={onPreview} disabled={isProcessing} aria-label={`查看图${result.shot}大图`}><SafeImage src={result.src} alt={`${result.shot} ${result.role}`} className="h-full w-full object-contain" /></button>}<span className="absolute left-3 top-3"><StatusBadge label={isProcessing ? "处理中" : isFailed ? "生成失败" : "待人工确认"} tone={isProcessing ? "info" : isFailed ? "danger" : "warning"} /></span><button type="button" className="absolute right-3 top-3 grid size-8 place-items-center rounded-md border bg-white/95" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} title="查看大图" aria-label="查看大图" onClick={onPreview} disabled={isProcessing}><Eye size={15} /></button></div><div className="p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block text-sm text-[var(--text-title)]">图 {result.shot} · {result.role}</strong><span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{result.note}</span></div><span className="shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">{String(index + 1).padStart(2, "0")}</span></div>{!isProcessing && !isFailed && <div className="mt-3 flex items-center gap-1 border-t pt-3" style={{ borderColor: "var(--border-light)" }}><span className="mr-1 text-xs text-[var(--text-secondary)]">图片反馈</span><button type="button" title="认可" aria-label={`认可图${result.shot}`} className="grid size-8 place-items-center rounded-md border transition-colors" style={{ borderColor: result.feedback === "approved" ? "var(--success)" : "var(--border-base)", color: result.feedback === "approved" ? "var(--success)" : "var(--text-secondary)", background: result.feedback === "approved" ? "var(--success-bg)" : "var(--white)" }} onClick={() => onFeedback("approved")}><ThumbsUp size={14} /></button><button type="button" title="待改进" aria-label={`待改进图${result.shot}`} className="grid size-8 place-items-center rounded-md border transition-colors" style={{ borderColor: result.feedback === "rejected" ? "var(--danger)" : "var(--border-base)", color: result.feedback === "rejected" ? "var(--danger)" : "var(--text-secondary)", background: result.feedback === "rejected" ? "var(--danger-bg)" : "var(--white)" }} onClick={() => onFeedback("rejected")}><ThumbsDown size={14} /></button><span className="ml-1 text-xs text-[var(--text-secondary)]">{result.feedback === "approved" ? "已认可" : result.feedback === "rejected" ? "待调整" : "未反馈"}</span></div>}<div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--border-light)" }}><button type="button" className="inline-flex min-h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} disabled={isProcessing} onClick={onDownload}><Download size={13} />下载</button>{isFailed && <button type="button" className="inline-flex min-h-8 items-center gap-1 rounded-md bg-[var(--brand-primary)] px-2.5 text-xs font-semibold text-white" onClick={onRetry}><RefreshCw size={13} />重新生成</button>}{!isProcessing && !isFailed && <button type="button" className="inline-flex min-h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-semibold" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} onClick={onEdit}><Sparkles size={13} />继续微调</button>}</div></div></article>
}

function PromptPolishModal({ prompt, onApply, onClose }) {
  const result = `${String(prompt || "").trim().replace(/\s+/g, " ")}；统一画面层级与视觉语言，保持商品事实、详情角色和原图尺寸不变。`.slice(0, 500)
  return <WorkbenchPickerDialog eyebrow="提示词" title="AI 润色" description="优化表达结构，不改变商品事实与已确认约束。" width="560px" onClose={onClose} footer={<><WorkbenchButton variant="ghost" onClick={onClose}>取消</WorkbenchButton><WorkbenchButton onClick={() => onApply(result)}><Check size={15} />确认替换</WorkbenchButton></>}><div className="rounded-lg border bg-[var(--gray-50)] p-4 text-sm leading-6 text-[var(--text-body)]">{result || "请先输入提示词，再使用 AI 润色。"}</div></WorkbenchPickerDialog>
}

function StatusBadge({ label, tone = "neutral" }) { return <span className="inline-flex min-h-6 items-center rounded-full px-2 text-xs font-semibold" style={toneStyles[tone]}>{label}</span> }
function IconButton({ title, danger = false, onClick, children }) { return <button type="button" title={title} aria-label={title} onClick={onClick} className="grid size-8 place-items-center rounded-md border bg-white transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: "var(--border-base)", color: danger ? "var(--danger)" : "var(--text-secondary)" }}>{children}</button> }
