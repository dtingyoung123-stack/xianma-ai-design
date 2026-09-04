"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Images,
  LoaderCircle,
  PencilLine,
  RefreshCw,
  RotateCcw,
  WandSparkles,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import ResultLocalEditDialog from "@/components/workbench/ResultLocalEditDialog"
import WorkbenchPromptEditor from "@/components/workbench/WorkbenchPromptEditor"
import WorkbenchRecentHistory from "@/components/workbench/WorkbenchRecentHistory"
import { WorkbenchModelSelect, WorkbenchParameterSelect, WorkbenchToast } from "@/components/workbench/WorkbenchControls"
import { WorkbenchButton, WorkbenchModule, WorkbenchPanel, WorkbenchPanelHead, WorkbenchScroll, WorkbenchShell } from "@/components/workbench/Workbench"
import {
  batchEditDefaultPrompt,
  batchEditDirections,
  batchEditHistory,
  batchEditModels,
  batchEditPersonalAssets,
  batchEditPublicAssets,
  batchEditResultImages,
  batchEditTeamAssets,
} from "@/data/demo/batch-edit"
import { initialPrompts } from "@/data/demo/prompts"
import { downloadImage, downloadImageZip } from "@/lib/image-download"
import { formatImageSize, hasValidImageSize } from "@/lib/image-size"

const MAX_IMAGES = 10
const ratioOptions = ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"]

export default function BatchEditWorkbench() {
  const [images, setImages] = useState([])
  const [prompt, setPrompt] = useState(batchEditDefaultPrompt)
  const [model, setModel] = useState(batchEditModels[0].name)
  const [resolution, setResolution] = useState("1K")
  const [ratio, setRatio] = useState("智能比例")
  const [customSize, setCustomSize] = useState({ width: "", height: "" })
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [replaceIndex, setReplaceIndex] = useState(null)
  const [task, setTask] = useState({ id: "", status: "idle", progress: 0, groups: [] })
  const [previewIndex, setPreviewIndex] = useState(null)
  const [editResultId, setEditResultId] = useState(null)
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)
  const toastRef = useRef(null)
  const runRef = useRef(0)

  const canSubmit = Boolean(images.length && prompt.trim() && task.status !== "processing")
  const imageSize = formatImageSize(ratio, customSize)
  const completedResults = useMemo(() => task.groups
    .map((group) => group.result)
    .filter((result) => result.status === "completed"), [task.groups])
  const editResult = task.groups.map((group) => group.result).find((result) => result.id === editResultId) || null

  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    window.clearTimeout(toastRef.current)
  }, [])

  function notify(message) {
    setToast(message)
    window.clearTimeout(toastRef.current)
    toastRef.current = window.setTimeout(() => setToast(""), 2200)
  }

  function resetTask() {
    runRef.current += 1
    window.clearInterval(timerRef.current)
    setTask({ id: "", status: "idle", progress: 0, groups: [] })
    setPreviewIndex(null)
    setEditResultId(null)
  }

  function addAssets(selectedAssets) {
    const normalized = selectedAssets.map((asset, index) => ({
      ...asset,
      id: `${asset.id || asset.key || "asset"}-${Date.now()}-${index}`,
    }))
    setImages((current) => replaceIndex !== null && normalized[0]
      ? current.map((image, index) => index === replaceIndex ? normalized[0] : image)
      : [...current, ...normalized].slice(0, MAX_IMAGES))
    setReplaceIndex(null)
    setAssetPickerOpen(false)
    resetTask()
  }

  function handleLocalImages(event) {
    const remaining = MAX_IMAGES - images.length
    const localImages = Array.from(event.target.files || []).slice(0, remaining).map((file, index) => ({
      id: `batch-edit-local-${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      title: file.name.replace(/\.[^.]+$/, "") || file.name,
      filename: file.name,
      src: URL.createObjectURL(file),
      size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
      source: "本地上传",
      category: "未分类",
      tags: [],
      file,
    }))
    setImages((current) => [...current, ...localImages].slice(0, MAX_IMAGES))
    event.target.value = ""
    resetTask()
  }

  function polishPrompt() {
    const base = prompt.trim() || batchEditDefaultPrompt
    const suffix = "请确保整批图片的修改标准一致，同时根据每张原图的构图、光线和主体关系自适应处理，避免主体变形、文字错乱和明显生成痕迹。"
    setPrompt(base.includes(suffix) ? base : `${base}\n\n${suffix}`)
    notify("提示词已润色")
  }

  function clearWorkbench() {
    resetTask()
    setImages([])
    setPrompt(batchEditDefaultPrompt)
    setModel(batchEditModels[0].name)
    setResolution("1K")
    setRatio("智能比例")
    setCustomSize({ width: "", height: "" })
  }

  function createGroups() {
    const taskTime = Date.now()
    return images.map((image, index) => {
      const resultId = `batch-edit-result-${taskTime}-${index}`
      const resultSrc = batchEditResultImages[index % batchEditResultImages.length]
      const originalVersion = {
        id: `${resultId}-original`,
        src: resultSrc,
        label: "原始结果",
        note: "任务首次生成结果",
      }
      return {
        id: `batch-edit-group-${taskTime}-${index}`,
        inputImage: image,
        status: "pending",
        expanded: index === 0,
        result: {
          id: resultId,
          name: `${image.title || image.name || `图片 ${index + 1}`} · 改图结果`,
          src: resultSrc,
          originalSrc: resultSrc,
          status: "pending",
          versions: [originalVersion],
          currentVersionId: originalVersion.id,
        },
      }
    })
  }

  function submitTask() {
    if (!canSubmit) return
    if (!hasValidImageSize(ratio, customSize)) {
      notify("请输入大于 0 的整数宽度")
      return
    }
    window.clearInterval(timerRef.current)
    const runId = runRef.current + 1
    runRef.current = runId
    const groups = createGroups()
    setTask({ id: `BE-${String(Date.now()).slice(-8)}`, status: "processing", progress: 8, groups })
    let progress = 8
    timerRef.current = window.setInterval(() => {
      if (runRef.current !== runId) return
      progress = Math.min(progress + 14, 100)
      if (progress >= 100) {
        window.clearInterval(timerRef.current)
        setTask((current) => {
          const finishedGroups = finishGroups(current.groups)
          const hasFailure = finishedGroups.some((group) => group.status === "failed")
          return { ...current, status: hasFailure ? "partial" : "completed", progress: 100, groups: finishedGroups }
        })
        notify("批量改图任务处理完成")
        return
      }
      setTask((current) => ({ ...current, progress, groups: updateProgress(current.groups, progress) }))
    }, 480)
  }

  function stopTask() {
    runRef.current += 1
    window.clearInterval(timerRef.current)
    setTask((current) => ({
      ...current,
      status: "cancelled",
      groups: current.groups.map((group) => group.result.status === "completed" ? group : {
        ...group,
        status: "cancelled",
        result: { ...group.result, status: "cancelled" },
      }),
    }))
    notify("任务已终止，输入图片和已完成结果已保留")
  }

  function toggleGroup(groupId) {
    setTask((current) => ({
      ...current,
      groups: current.groups.map((group) => group.id === groupId ? { ...group, expanded: !group.expanded } : group),
    }))
  }

  function updateResult(resultId, updater) {
    setTask((current) => ({
      ...current,
      groups: current.groups.map((group) => group.result.id === resultId
        ? { ...group, result: updater(group.result) }
        : group),
    }))
  }

  function retryResult(resultId) {
    updateResult(resultId, (result) => ({ ...result, status: "processing" }))
    setTask((current) => ({
      ...current,
      status: "processing",
      groups: current.groups.map((group) => group.result.id === resultId ? { ...group, status: "processing" } : group),
    }))
    window.setTimeout(() => {
      setTask((current) => {
        const groups = current.groups.map((group) => group.result.id === resultId
          ? { ...group, status: "completed", result: { ...group.result, status: "completed" } }
          : group)
        const hasFailure = groups.some((group) => group.result.status === "failed")
        return { ...current, status: hasFailure ? "partial" : "completed", groups }
      })
      notify("失败图片已重新生成")
    }, 900)
  }

  async function downloadResult(result) {
    try {
      await downloadImage({ src: result.src, name: result.name, featureName: "批量改图" })
      notify("结果图片已开始下载")
    } catch {
      notify("图片下载失败，请重试")
    }
  }

  async function downloadCompletedResults() {
    try {
      await downloadImageZip({ items: completedResults, zipName: "批量改图-成功结果", featureName: "批量改图" })
      notify(`已打包下载 ${completedResults.length} 张成功结果`)
    } catch {
      notify("批量下载失败，请重试")
    }
  }

  function openPreview(resultId) {
    const index = completedResults.findIndex((result) => result.id === resultId)
    if (index >= 0) setPreviewIndex(index)
  }

  function openFineTune(resultId) {
    const result = completedResults.find((item) => item.id === resultId)
    if (!result) return
    setPreviewIndex(null)
    setEditResultId(resultId)
  }

  function continueHistory(item) {
    setPrompt(item.prompt)
    if (item.model) setModel(item.model)
    if (item.resolution) setResolution(item.resolution)
    if (item.ratio) setRatio(item.ratio)
    notify("历史任务参数已回填")
  }

  return (
    <>
      <WorkbenchShell
        crumbs={[{ label: "生图工具" }, { label: "批量改图" }]}
        title="批量改图"
        description="批量上传图片，用同一提示词逐张完成统一修改，并保留每张图片的独立结果。"
        columns="minmax(340px, 3fr) minmax(560px, 7fr)"
        contentClassName="xm-expert-grid"
      >
        <WorkbenchPanel>
          <WorkbenchPanelHead title="改图输入" description="添加待修改图片，并设置整批图片共用的修改要求。" meta={<StatusBadge status={task.status} />} />
          <WorkbenchScroll>
            <ImageQueueModule
              title="待修改图片"
              images={images}
              max={MAX_IMAGES}
              limitText={`还剩 ${MAX_IMAGES - images.length} 个位置 · 可拖拽排序`}
              assetSub="个人/团体/公共素材库"
              uploadSub="电脑多图上传"
              emptyText="尚未添加待修改图片，请从素材库选择或本地上传，最多 10 张。"
              primaryTitle="图一"
              accept="image/jpeg,image/png,image/webp"
              onOpenAssetPicker={() => { setReplaceIndex(null); setAssetPickerOpen(true) }}
              onLocalImages={handleLocalImages}
              onRemove={(index) => { setImages((current) => current.filter((_, imageIndex) => imageIndex !== index)); resetTask() }}
              onRefresh={(index) => { setReplaceIndex(index); setAssetPickerOpen(true) }}
              onReorder={(nextImages) => { setImages(nextImages); resetTask() }}
              onPreviewNotify={notify}
            />

            <WorkbenchPromptEditor
              title="统一修改提示词"
              value={prompt}
              onChange={setPrompt}
              onTemplate={() => setPromptPickerOpen(true)}
              onClear={() => setPrompt("")}
              onPolish={polishPrompt}
              placeholder="描述整批图片需要统一修改的内容和必须保留的部分"
              helperText="建议先写保留项，再写修改项，最后补充风格和质量要求。"
              ariaLabel="批量改图提示词"
            />

            <WorkbenchModule title="生成设置">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <WorkbenchModelSelect value={model} onChange={setModel} options={batchEditModels} label="模型选择" />
                <WorkbenchParameterSelect
                  label="参数调节"
                  summary={`${resolution} · ${imageSize}`}
                  note={images.length ? `本次将逐张处理 ${images.length} 张图片` : "添加图片后显示本次处理数量"}
                  sections={[
                    { key: "resolution", label: "清晰度", value: resolution, options: ["1K", "2K", "4K"], onChange: setResolution },
                    { key: "ratio", label: "图片尺寸", value: ratio, options: ratioOptions, onChange: setRatio, visual: "ratio", dimensions: { size: customSize, onChange: setCustomSize } },
                  ]}
                />
              </div>
            </WorkbenchModule>
          </WorkbenchScroll>
          <div className="grid shrink-0 grid-cols-1 gap-2 border-t bg-[var(--white)] p-3 sm:grid-cols-[1fr_auto]" style={{ borderColor: "var(--border-light)" }}>
            {task.status === "processing" ? (
              <WorkbenchButton type="button" variant="ghost" onClick={stopTask} style={{ color: "var(--danger)", borderColor: "var(--danger)" }}><Ban size={16} />终止任务</WorkbenchButton>
            ) : (
              <WorkbenchButton type="button" disabled={!canSubmit} onClick={submitTask}><WandSparkles size={16} />开始批量改图{images.length ? `（${images.length} 张）` : ""}</WorkbenchButton>
            )}
            <WorkbenchButton type="button" variant="ghost" onClick={clearWorkbench}><RotateCcw size={15} />清空重来</WorkbenchButton>
          </div>
        </WorkbenchPanel>

        <WorkbenchPanel>
          <WorkbenchPanelHead title="批量改图结果" description="按输入顺序查看结果，失败项可单独重试。" meta={<StatusBadge status={task.status} />} />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
            <BatchEditResultWorkspace
              task={task}
              onToggle={toggleGroup}
              onRetry={retryResult}
              onPreview={openPreview}
              onFineTune={openFineTune}
              onDownload={downloadResult}
              onBatchDownload={downloadCompletedResults}
            />
            <WorkbenchRecentHistory
              items={batchEditHistory}
              source="batch-edit"
              sourceLabel="批量改图"
              onRefresh={() => notify("历史记录已刷新")}
              onCopy={(text) => { navigator.clipboard?.writeText(text); notify("提示词已复制") }}
              onContinue={continueHistory}
            />
          </div>
        </WorkbenchPanel>
      </WorkbenchShell>

      {assetPickerOpen && (
        <AssetPickerModal
          title={replaceIndex === null ? "选择待修改图片" : "替换当前图片"}
          description={replaceIndex === null ? "一次最多选择 10 张，确认后按当前顺序加入处理队列。" : "选择一张图片替换当前位置，队列顺序保持不变。"}
          max={replaceIndex === null ? Math.max(1, MAX_IMAGES - images.length) : 1}
          personalAssets={batchEditPersonalAssets}
          teamAssets={batchEditTeamAssets}
          publicAssets={batchEditPublicAssets}
          onClose={() => { setAssetPickerOpen(false); setReplaceIndex(null) }}
          onConfirm={addAssets}
        />
      )}
      {promptPickerOpen && (
        <PromptPickerModal
          prompts={initialPrompts}
          initialSelectedId=""
          onClear={() => { setPrompt(""); setPromptPickerOpen(false) }}
          onClose={() => setPromptPickerOpen(false)}
          onConfirm={(selectedPrompt) => { setPrompt(selectedPrompt.content); setPromptPickerOpen(false) }}
        />
      )}
      {previewIndex !== null && completedResults[previewIndex] && (
        <ImagePreviewModal
          images={completedResults}
          index={previewIndex}
          setIndex={setPreviewIndex}
          getSrc={(result) => result.src}
          getName={(result) => result.name}
          featureName="批量改图"
          onClose={() => setPreviewIndex(null)}
          onNotify={notify}
          renderHeaderAction={(result) => (
            <button type="button" onClick={() => openFineTune(result.id)} className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-xs font-semibold text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }} title="继续微调" aria-label={`继续微调${result.name}`}><PencilLine size={14} />继续微调</button>
          )}
        />
      )}
      {editResult && (
        <ResultLocalEditDialog
          result={editResult}
          context={{ taskName: "批量改图", model, spec: `${resolution} · ${imageSize}` }}
          directions={batchEditDirections}
          candidateImages={batchEditResultImages}
          onNotify={notify}
          onClose={() => setEditResultId(null)}
          onApply={async ({ candidate, direction }) => {
            updateResult(editResult.id, (result) => {
              const versions = result.versions || []
              const version = { id: `${result.id}-edit-${Date.now()}`, src: candidate.src, label: `微调版本 v${versions.length}`, note: direction.title }
              return { ...result, src: candidate.src, currentVersionId: version.id, versions: [...versions, version], status: "completed" }
            })
            notify("当前结果已更新，原始版本已保留")
          }}
        />
      )}
      <WorkbenchToast message={toast} />
    </>
  )
}

function BatchEditResultWorkspace({ task, onToggle, onRetry, onPreview, onFineTune, onDownload, onBatchDownload }) {
  const stats = useMemo(() => summarizeTask(task.groups), [task.groups])

  if (!task.groups.length) {
    return (
      <div className="min-h-0 overflow-y-auto p-4">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--border-base)" }}>
          <Images size={30} className="text-[var(--text-disabled)]" />
          <strong className="mt-3 text-sm text-[var(--text-title)]">等待批量改图结果</strong>
          <span className="mt-1 max-w-md text-xs leading-5 text-[var(--text-secondary)]">添加图片并提交后，这里会按输入顺序展示待处理、处理中、成功、失败和已终止状态。</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 overflow-y-auto p-4">
      <div className="mb-3 rounded-lg border p-3" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            <span>共 {stats.total} 张</span>
            <span className="text-[var(--success)]">成功 {stats.completed}</span>
            <span className="text-[var(--danger)]">失败 {stats.failed}</span>
            <span>待处理 {stats.pending + stats.processing}</span>
          </div>
          {stats.completed > 0 && <WorkbenchButton type="button" variant="soft" className="min-h-8 px-3 text-xs" onClick={onBatchDownload}><Download size={14} />下载成功结果</WorkbenchButton>}
        </div>
        {task.status === "processing" && (
          <div className="mt-3" role="status" aria-label={`批量改图进度 ${task.progress}%`}>
            <div className="mb-1 flex justify-between text-[11px] text-[var(--text-secondary)]"><span>正在逐张处理</span><span>{task.progress}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--gray-200)]"><span className="block h-full rounded-full bg-[var(--brand-primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${task.progress}%` }} /></div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {task.groups.map((group, index) => (
          <BatchEditResultGroup
            key={group.id}
            group={group}
            index={index}
            onToggle={() => onToggle(group.id)}
            onRetry={() => onRetry(group.result.id)}
            onPreview={() => onPreview(group.result.id)}
            onFineTune={() => onFineTune(group.result.id)}
            onDownload={() => onDownload(group.result)}
          />
        ))}
      </div>
    </div>
  )
}

function BatchEditResultGroup({ group, index, onToggle, onRetry, onPreview, onFineTune, onDownload }) {
  const result = group.result
  return (
    <article className="overflow-hidden rounded-lg border bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }}>
      <button type="button" aria-expanded={group.expanded} onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]">
        <SafeImage src={group.inputImage.src} alt={group.inputImage.title || `输入图片 ${index + 1}`} className="size-12 shrink-0 rounded-lg object-cover" />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm text-[var(--text-title)]">{group.inputImage.title || group.inputImage.name || `输入图片 ${index + 1}`}</strong>
          <span className="mt-1 block text-xs text-[var(--text-secondary)]">第 {index + 1} 张 · {result.versions?.at(-1)?.label || "等待生成"}</span>
        </span>
        <StatusBadge status={group.status} />
        {group.expanded ? <ChevronDown size={16} className="shrink-0 text-[var(--text-secondary)]" /> : <ChevronRight size={16} className="shrink-0 text-[var(--text-secondary)]" />}
      </button>
      {group.expanded && (
        <div className="border-t p-3" style={{ borderColor: "var(--border-light)" }}>
          <ResultCard result={result} onRetry={onRetry} onPreview={onPreview} onFineTune={onFineTune} onDownload={onDownload} />
        </div>
      )}
    </article>
  )
}

function ResultCard({ result, onRetry, onPreview, onFineTune, onDownload }) {
  const waiting = result.status === "pending" || result.status === "processing"
  const failed = result.status === "failed"
  const cancelled = result.status === "cancelled"
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(160px,220px)_minmax(0,1fr)]">
      <button type="button" disabled={result.status !== "completed"} onClick={onPreview} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-[var(--gray-50)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-default" style={{ borderColor: failed ? "var(--danger)" : "var(--border-light)" }} aria-label={result.status === "completed" ? `预览${result.name}` : `${result.name}${statusLabel(result.status)}`}>
        <SafeImage src={result.src} alt={result.name} className={`h-full w-full object-cover ${waiting || failed || cancelled ? "opacity-25" : ""}`} />
        {result.status === "completed" && <span className="absolute inset-0 grid place-items-center bg-[var(--overlay-scrim)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"><Eye size={20} className="text-white" /></span>}
        {(waiting || failed || cancelled) && (
          <span className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
            {result.status === "processing" && <LoaderCircle size={22} className="animate-spin text-[var(--brand-primary)] motion-reduce:animate-none" />}
            {result.status === "pending" && <span className="text-xs font-semibold text-[var(--text-secondary)]">待处理</span>}
            {failed && <><AlertCircle size={22} className="text-[var(--danger)]" /><span className="mt-1 text-xs font-semibold text-[var(--danger)]">生成失败</span></>}
            {cancelled && <span className="text-xs font-semibold text-[var(--text-secondary)]">已终止</span>}
          </span>
        )}
      </button>
      <div className="flex min-w-0 flex-col justify-between gap-3 py-1">
        <div className="min-w-0">
          <strong className="block break-words text-sm text-[var(--text-title)]">{result.name}</strong>
          <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{result.status === "completed" ? "已按统一提示词完成修改，可继续微调或下载。" : statusDescription(result.status)}</span>
        </div>
        {failed ? (
          <WorkbenchButton type="button" variant="ghost" className="self-start" onClick={onRetry}><RefreshCw size={14} />重新生成</WorkbenchButton>
        ) : result.status === "completed" ? (
          <div className="flex flex-wrap items-center gap-2">
            <WorkbenchButton type="button" variant="soft" className="min-h-9 px-3 text-xs" onClick={onFineTune}><PencilLine size={14} />继续微调</WorkbenchButton>
            <button type="button" onClick={onPreview} title="查看大图" aria-label={`查看${result.name}大图`} className="grid size-9 place-items-center rounded-md border bg-white text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)" }}><Eye size={15} /></button>
            <button type="button" onClick={onDownload} title="下载结果" aria-label={`下载${result.name}`} className="grid size-9 place-items-center rounded-md border bg-white text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--brand-primary-border)" }}><Download size={15} /></button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function updateProgress(groups, progress) {
  if (!groups.length) return groups
  const activeIndex = Math.min(groups.length - 1, Math.floor((progress / 100) * groups.length))
  return groups.map((group, index) => {
    const status = index < activeIndex ? "completed" : index === activeIndex ? "processing" : "pending"
    return { ...group, status, result: { ...group.result, status } }
  })
}

function finishGroups(groups) {
  return groups.map((group, index) => {
    const status = groups.length > 2 && index === 2 ? "failed" : "completed"
    return { ...group, status, result: { ...group.result, status } }
  })
}

function summarizeTask(groups) {
  return groups.reduce((summary, group) => {
    const status = group.result.status
    return { ...summary, total: summary.total + 1, [status]: (summary[status] || 0) + 1 }
  }, { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 })
}

function statusLabel(status) {
  return { pending: "待处理", processing: "处理中", completed: "成功", failed: "失败", cancelled: "已终止" }[status] || "未开始"
}

function statusDescription(status) {
  return {
    pending: "等待前序图片处理完成。",
    processing: "正在按统一提示词修改当前图片。",
    failed: "当前图片生成失败，其他成功结果不受影响。",
    cancelled: "任务已终止，当前输入仍然保留。",
  }[status] || "等待提交任务。"
}

function StatusBadge({ status }) {
  const states = {
    idle: { label: "未开始", bg: "var(--gray-100)", color: "var(--text-secondary)" },
    pending: { label: "待处理", bg: "var(--gray-100)", color: "var(--text-secondary)" },
    processing: { label: "处理中", bg: "var(--warning-bg)", color: "var(--warning)" },
    completed: { label: "成功", bg: "var(--success-bg)", color: "var(--success)" },
    partial: { label: "部分成功", bg: "var(--warning-bg)", color: "var(--warning)" },
    failed: { label: "失败", bg: "var(--danger-bg)", color: "var(--danger)" },
    cancelled: { label: "已终止", bg: "var(--gray-100)", color: "var(--text-secondary)" },
  }
  const meta = states[status] || states.idle
  return <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold" style={{ background: meta.bg, color: meta.color }}>{status === "completed" && <CheckCircle2 size={13} />}{meta.label}</span>
}
