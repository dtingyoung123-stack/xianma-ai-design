"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  Eye,
  ImageIcon,
  Images,
  LoaderCircle,
  PackagePlus,
  RefreshCw,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Upload,
  WandSparkles,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import WorkbenchTextEditor, { WorkbenchTextEditorAction } from "@/components/workbench/WorkbenchTextEditor"
import { WorkbenchModelSelect, WorkbenchToast, WorkbenchIconButton } from "@/components/workbench/WorkbenchControls"
import {
  WorkbenchButton,
  WorkbenchHistoryAction,
  WorkbenchModule,
  WorkbenchPanel,
  WorkbenchPanelHead,
  WorkbenchScroll,
  WorkbenchShell,
} from "@/components/workbench/Workbench"
import {
  multiAngleDefaultPrompt,
  multiAngleDefinitions,
  multiAngleHistory,
  multiAngleModels,
  multiAnglePersonalAssets,
  multiAnglePublicAssets,
  multiAngleQualityLevels,
  multiAngleResultImages,
  multiAngleTeamAssets,
  multiAngleThinkingModes,
} from "@/data/demo/multi-angle"
import { initialPrompts } from "@/data/demo/prompts"
import { downloadImage, downloadImageZip } from "@/lib/image-download"
import { cn } from "@/lib/utils"

const DEFAULT_ANGLES = ["front", "back", "left", "right"]
const HISTORY_PAGE_SIZE = 5
const clone = (value) => JSON.parse(JSON.stringify(value))

export default function MultiAnglePage() {
  const [sourceImage, setSourceImage] = useState(null)
  const [model, setModel] = useState(multiAngleModels[0].name)
  const [thinking, setThinking] = useState("自动")
  const [quality, setQuality] = useState("均衡")
  const [selectedAngles, setSelectedAngles] = useState(DEFAULT_ANGLES)
  const [prompt, setPrompt] = useState(multiAngleDefaultPrompt)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [sourcePreviewOpen, setSourcePreviewOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [taskHistory, setTaskHistory] = useState(() => clone(multiAngleHistory))
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [previewTaskId, setPreviewTaskId] = useState(null)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)
  const toastRef = useRef(null)
  const runRef = useRef(0)
  const taskSequenceRef = useRef(multiAngleHistory.length)

  const canSubmit = Boolean(sourceImage && selectedAngles.length >= 2 && currentTask?.status !== "processing")
  const detailTask = getTask(detailTaskId, currentTask, taskHistory)
  const previewTask = getTask(previewTaskId, currentTask, taskHistory)
  const previewResults = useMemo(
    () => (previewTask?.results || []).filter((result) => result.status === "completed" && result.src),
    [previewTask],
  )

  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    window.clearTimeout(toastRef.current)
  }, [])

  function notify(message) {
    setToast(message)
    window.clearTimeout(toastRef.current)
    toastRef.current = window.setTimeout(() => setToast(""), 2300)
  }

  function resetCurrentTask() {
    runRef.current += 1
    window.clearInterval(timerRef.current)
    setCurrentTask(null)
    setPreviewTaskId(null)
    setDetailTaskId(null)
  }

  function useAsset(selectedAssets) {
    const asset = selectedAssets[0]
    if (!asset) return
    setSourceImage({ ...asset, title: asset.title || asset.name || "主体参考图" })
    setAssetPickerOpen(false)
    resetCurrentTask()
    notify("主体参考图已更新")
  }

  function useLocalFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setSourceImage({
      id: `multi-angle-local-${file.name}-${file.lastModified}`,
      title: file.name.replace(/\.[^.]+$/, "") || file.name,
      name: file.name,
      filename: file.name,
      src: URL.createObjectURL(file),
      source: "本地上传",
      size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
      file,
    })
    event.target.value = ""
    resetCurrentTask()
    notify("本地图片已添加")
  }

  function toggleAngle(angleId) {
    setSelectedAngles((current) => {
      if (!current.includes(angleId)) return multiAngleDefinitions.filter((angle) => [...current, angleId].includes(angle.id)).map((angle) => angle.id)
      if (current.length <= 2) {
        notify("至少选择 2 个角度")
        return current
      }
      return current.filter((id) => id !== angleId)
    })
    resetCurrentTask()
  }

  function createTask(taskSequence) {
    const taskSuffix = String(taskSequence).padStart(4, "0")
    return {
      id: `MA-DEMO-${taskSuffix}`,
      status: "processing",
      progress: 6,
      createdAt: "刚刚",
      completedAt: "",
      model,
      thinking,
      quality,
      prompt: prompt.trim() || "未填写补充提示词",
      sourceImage: { ...sourceImage },
      results: selectedAngles.map((angleId, index) => {
        const angle = multiAngleDefinitions.find((item) => item.id === angleId)
        return {
          id: `multi-angle-result-${taskSuffix}-${index}`,
          angleId,
          angle: angle.label,
          name: `${sourceImage.title || "主体"}-${angle.label}`,
          instruction: angle.instruction,
          src: multiAngleResultImages[index % multiAngleResultImages.length],
          status: "pending",
          feedback: "",
          error: "",
          requestId: `MA-R${taskSuffix}-${index + 1}`,
        }
      }),
    }
  }

  function submitTask() {
    if (!canSubmit) return
    taskSequenceRef.current += 1
    const task = createTask(taskSequenceRef.current)
    const runId = runRef.current + 1
    runRef.current = runId
    setCurrentTask(task)
    window.clearInterval(timerRef.current)
    let progress = task.progress
    timerRef.current = window.setInterval(() => {
      if (runRef.current !== runId) return
      progress = Math.min(100, progress + 15)
      if (progress >= 100) {
        window.clearInterval(timerRef.current)
        setCurrentTask((current) => {
          if (!current || current.id !== task.id) return current
          const results = current.results.map((result, index) => {
            const shouldFail = current.results.length > 4 && index === 4
            return shouldFail
              ? { ...result, status: "failed", error: "当前角度生成失败，请重试。" }
              : { ...result, status: "completed" }
          })
          const finished = { ...current, progress: 100, status: results.some((result) => result.status === "failed") ? "partial" : "completed", completedAt: "刚刚", results }
          setTaskHistory((history) => [clone(finished), ...history.filter((item) => item.id !== finished.id)])
          return finished
        })
        notify("多角度任务处理完成")
        return
      }
      setCurrentTask((current) => current?.id === task.id
        ? { ...current, progress, results: updateProgress(current.results, progress) }
        : current)
    }, 480)
    notify(`已提交 ${task.results.length} 个角度`)
  }

  function stopTask() {
    if (currentTask?.status !== "processing") return
    runRef.current += 1
    window.clearInterval(timerRef.current)
    setCurrentTask((current) => {
      const cancelled = {
        ...current,
        status: "cancelled",
        completedAt: "刚刚",
        results: current.results.map((result) => result.status === "completed" ? result : { ...result, status: "cancelled" }),
      }
      setTaskHistory((history) => [clone(cancelled), ...history.filter((item) => item.id !== cancelled.id)])
      return cancelled
    })
    notify("任务已终止，已完成结果仍然保留")
  }

  function clearWorkbench() {
    resetCurrentTask()
    setSourceImage(null)
    setModel(multiAngleModels[0].name)
    setThinking("自动")
    setQuality("均衡")
    setSelectedAngles(DEFAULT_ANGLES)
    setPrompt(multiAngleDefaultPrompt)
  }

  function updateTaskResult(taskId, resultId, updater) {
    setCurrentTask((task) => task?.id === taskId
      ? { ...task, results: task.results.map((result) => result.id === resultId ? updater(result) : result) }
      : task)
    setTaskHistory((history) => history.map((task) => task.id === taskId
      ? { ...task, results: task.results.map((result) => result.id === resultId ? updater(result) : result) }
      : task))
  }

  function retryResult(taskId, resultId) {
    updateTaskResult(taskId, resultId, (result) => ({ ...result, status: "processing", error: "" }))
    window.setTimeout(() => {
      updateTaskResult(taskId, resultId, (result) => ({ ...result, status: "completed", src: result.src || multiAngleResultImages[0] }))
      setCurrentTask((task) => task?.id === taskId ? normalizeTaskStatus(task) : task)
      setTaskHistory((history) => history.map((task) => task.id === taskId ? normalizeTaskStatus(task) : task))
      notify("当前角度已重新生成")
    }, 900)
  }

  function setFeedback(taskId, resultId, feedback) {
    updateTaskResult(taskId, resultId, (result) => ({ ...result, feedback: result.feedback === feedback ? "" : feedback }))
    notify(feedback === "approved" ? "已记录认可反馈" : "已记录待改进反馈")
  }

  async function downloadResult(result) {
    try {
      await downloadImage({ src: result.src, name: result.name, featureName: "AI多角度" })
      notify("结果图片已开始下载")
    } catch {
      notify("图片下载失败，请重试")
    }
  }

  async function downloadTask(task) {
    const results = task.results.filter((result) => result.status === "completed" && result.src)
    if (!results.length) return
    try {
      await downloadImageZip({ items: results, zipName: `${task.id}-多角度结果`, featureName: "AI多角度" })
      notify(`已打包下载 ${results.length} 张图片`)
    } catch {
      notify("批量下载失败，请重试")
    }
  }

  function openPreview(taskId, resultId) {
    const task = getTask(taskId, currentTask, taskHistory)
    const results = task?.results.filter((result) => result.status === "completed" && result.src) || []
    const index = results.findIndex((result) => result.id === resultId)
    if (index < 0) return
    setPreviewTaskId(taskId)
    setPreviewIndex(index)
  }

  function continueTask(task) {
    setSourceImage({ ...task.sourceImage })
    setModel(task.model)
    setThinking(task.thinking)
    setQuality(task.quality)
    setPrompt(task.prompt === "未填写补充提示词" ? "" : task.prompt)
    setSelectedAngles(task.results.map((result) => result.angleId))
    setDetailTaskId(null)
    setCurrentTask(null)
    notify("历史任务参数已回填")
  }

  return (
    <>
      <WorkbenchShell
        crumbs={[{ label: "AI 能力中心" }, { label: "AI 多角度" }]}
        title="AI 多角度"
        description="围绕同一主体生成固定顺序的多视角结果，并按角度独立查看和交付。"
        columns="minmax(340px, 3fr) minmax(620px, 7fr)"
        contentClassName="xm-expert-grid"
        actions={<WorkbenchHistoryAction source="multi-angle" sourceLabel="AI多角度" params={{ model, quality }} />}
      >
        <WorkbenchPanel>
          <WorkbenchPanelHead title="能力参数" description="添加单张主体参考图，并选择需要生成的角度。" meta={<StatusBadge status={currentTask?.status || "idle"} />} />
          <WorkbenchScroll>
            <SourceImageModule
              image={sourceImage}
              onOpenPicker={() => setAssetPickerOpen(true)}
              onLocalFile={useLocalFile}
              onPreview={() => setSourcePreviewOpen(true)}
              onRemove={() => { setSourceImage(null); resetCurrentTask() }}
            />

            <WorkbenchModule title="生成设置">
              <WorkbenchModelSelect value={model} onChange={(value) => { setModel(value); resetCurrentTask() }} options={multiAngleModels} label="模型通道" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <SegmentedField label="思考模式" value={thinking} options={multiAngleThinkingModes} onChange={(value) => { setThinking(value); resetCurrentTask() }} />
                <SegmentedField label="质量档位" value={quality} options={multiAngleQualityLevels} onChange={(value) => { setQuality(value); resetCurrentTask() }} />
              </div>
            </WorkbenchModule>

            <WorkbenchModule title="角度选择" hint={`${selectedAngles.length}/8，至少选择 2 个`}>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="多角度选择">
                {multiAngleDefinitions.map((angle) => {
                  const selected = selectedAngles.includes(angle.id)
                  return (
                    <button
                      key={angle.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleAngle(angle.id)}
                      className="min-h-9 rounded-lg border px-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      style={selected
                        ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }
                        : { borderColor: "var(--border-base)", background: "var(--white)", color: "var(--text-body)" }}
                    >
                      {angle.label}
                    </button>
                  )
                })}
              </div>
            </WorkbenchModule>

            <WorkbenchTextEditor
              title="补充提示词"
              value={prompt}
              onChange={(value) => { setPrompt(value); resetCurrentTask() }}
              onClear={() => setPrompt("")}
              rows={5}
              placeholder="例如：保持红色包装、金色 Logo、磨砂材质和干净白底"
              ariaLabel="AI 多角度补充提示词"
              toolbar={<WorkbenchTextEditorAction icon={Clipboard} label="提示词模板" onClick={() => setPromptPickerOpen(true)} />}
              helperText="生成顺序固定按正面、背面、左侧、右侧、四个 45° 角依次执行。"
            />
          </WorkbenchScroll>
          <div className="grid shrink-0 grid-cols-1 gap-2 border-t bg-[var(--white)] p-3 sm:grid-cols-[1fr_auto]" style={{ borderColor: "var(--border-light)" }}>
            {currentTask?.status === "processing" ? (
              <WorkbenchButton type="button" variant="ghost" onClick={stopTask} style={{ color: "var(--danger)", borderColor: "var(--danger)" }}><Ban size={16} />终止任务</WorkbenchButton>
            ) : (
              <WorkbenchButton type="button" disabled={!canSubmit} onClick={submitTask}><WandSparkles size={16} />生成角度套图{sourceImage ? `（${selectedAngles.length} 张）` : ""}</WorkbenchButton>
            )}
            <WorkbenchButton type="button" variant="ghost" onClick={clearWorkbench}><RotateCcw size={15} />清空重来</WorkbenchButton>
          </div>
        </WorkbenchPanel>

        <WorkbenchPanel>
          <WorkbenchPanelHead title="角度结果" description="按固定顺序查看当前任务结果，失败角度可单独重试。" meta={<StatusBadge status={currentTask?.status || "idle"} />} />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_300px]">
            <ResultWorkspace
              task={currentTask}
              selectedAngles={selectedAngles}
              onPreview={openPreview}
              onRetry={retryResult}
              onFeedback={setFeedback}
              onDownload={downloadResult}
              onDownloadTask={downloadTask}
              onNotify={notify}
            />
            <TaskHistoryPanel
              tasks={taskHistory}
              page={historyPage}
              pageSize={HISTORY_PAGE_SIZE}
              onPageChange={setHistoryPage}
              onOpen={setDetailTaskId}
              onRefresh={() => notify("任务历史已刷新")}
            />
          </div>
        </WorkbenchPanel>
      </WorkbenchShell>

      {assetPickerOpen && (
        <AssetPickerModal
          title="选择主体参考图"
          description="从个人、团体、公共素材或本地文件中选择一张主体参考图。"
          max={1}
          personalAssets={multiAnglePersonalAssets}
          teamAssets={multiAngleTeamAssets}
          publicAssets={multiAnglePublicAssets}
          onClose={() => setAssetPickerOpen(false)}
          onConfirm={useAsset}
        />
      )}
      {promptPickerOpen && (
        <PromptPickerModal
          prompts={initialPrompts}
          initialSelectedId=""
          onClear={() => { setPrompt(""); setPromptPickerOpen(false) }}
          onClose={() => setPromptPickerOpen(false)}
          onConfirm={(selectedPrompt) => { setPrompt(selectedPrompt.content); setPromptPickerOpen(false); resetCurrentTask(); notify("提示词模板已替换当前内容") }}
        />
      )}
      {sourcePreviewOpen && sourceImage && (
        <ImagePreviewModal
          images={[sourceImage]}
          index={0}
          setIndex={() => {}}
          getSrc={(image) => image.src}
          getName={(image) => image.title || image.name || "主体参考图"}
          featureName="AI多角度"
          onClose={() => setSourcePreviewOpen(false)}
          onNotify={notify}
        />
      )}
      {detailTask && (
        <TaskDetailDialog
          task={detailTask}
          onClose={() => setDetailTaskId(null)}
          onPreview={openPreview}
          onRetry={retryResult}
          onFeedback={setFeedback}
          onDownload={downloadResult}
          onDownloadTask={downloadTask}
          onContinue={continueTask}
          onNotify={notify}
        />
      )}
      {previewTask && previewResults[previewIndex] && (
        <ImagePreviewModal
          images={previewResults}
          index={previewIndex}
          setIndex={setPreviewIndex}
          getSrc={(result) => result.src}
          getName={(result) => result.name}
          featureName="AI多角度"
          onClose={() => setPreviewTaskId(null)}
          onNotify={notify}
        />
      )}
      <WorkbenchToast message={toast} />
    </>
  )
}

function SourceImageModule({ image, onOpenPicker, onLocalFile, onPreview, onRemove }) {
  return (
    <WorkbenchModule title="主体参考图" hint="单张图片">
      {image ? (
        <div className="flex min-w-0 items-center gap-3 rounded-lg border p-2.5" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}>
          <button type="button" onClick={onPreview} className="group relative size-20 shrink-0 overflow-hidden rounded-lg border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-light)" }} aria-label={`预览${image.title || image.name || "主体参考图"}`}>
            <SafeImage src={image.src} alt={image.title || "主体参考图"} className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-[var(--overlay-scrim)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Eye size={18} className="text-white" /></span>
          </button>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm text-[var(--text-title)]">{image.title || image.name || "主体参考图"}</strong>
            <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{image.source || "素材库"}{image.size ? ` · ${image.size}` : ""}</span>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <WorkbenchIconButton title="替换主体参考图" onClick={onOpenPicker}><RefreshCw size={14} /></WorkbenchIconButton>
            <WorkbenchIconButton title="移除主体参考图" danger onClick={onRemove}><Ban size={14} /></WorkbenchIconButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={onOpenPicker} className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed px-3 text-center transition-colors hover:bg-[var(--brand-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--brand-primary-border)" }}>
            <Images size={21} className="text-[var(--brand-primary)]" />
            <strong className="mt-2 text-sm text-[var(--text-title)]">素材库选择</strong>
            <span className="mt-1 text-xs text-[var(--text-secondary)]">个人、团体或公共素材</span>
          </button>
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-3 text-center transition-colors hover:bg-[var(--brand-primary-soft)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]" style={{ borderColor: "var(--brand-primary-border)" }}>
            <Upload size={21} className="text-[var(--brand-primary)]" />
            <strong className="mt-2 text-sm text-[var(--text-title)]">本地上传</strong>
            <span className="mt-1 text-xs text-[var(--text-secondary)]">JPG、PNG 或 WebP</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onLocalFile} className="sr-only" />
          </label>
        </div>
      )}
    </WorkbenchModule>
  )
}

function SegmentedField({ label, value, options, onChange }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">{label}</legend>
      <div className="grid gap-1 rounded-lg bg-[var(--gray-100)] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const selected = value === option
          return (
            <button key={option} type="button" aria-pressed={selected} onClick={() => onChange(option)} className="min-h-8 rounded-md px-1 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={selected ? { color: "var(--brand-primary)", background: "var(--white)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}>
              {option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ResultWorkspace({ task, selectedAngles, onPreview, onRetry, onFeedback, onDownload, onDownloadTask, onNotify }) {
  const angles = task?.results || selectedAngles.map((angleId, index) => {
    const angle = multiAngleDefinitions.find((item) => item.id === angleId)
    return { id: `waiting-${angleId}-${index}`, angleId, angle: angle.label, name: `${angle.label}视角`, status: "idle" }
  })
  const stats = task ? summarizeTask(task) : { total: angles.length, completed: 0 }

  return (
    <div className="min-h-0 overflow-y-auto p-4">
      <div className="mb-3 rounded-lg border p-3" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-normal text-[var(--brand-primary)]">Angle Set</span>
            <strong className="mt-0.5 block text-sm text-[var(--text-title)]">自选 {angles.length} 视角</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>{stats.completed}/{stats.total} 已完成</span>
            {task?.id && <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px]">{task.id}</span>}
            {stats.completed > 0 && <WorkbenchButton type="button" variant="soft" className="min-h-8 px-3 text-xs" onClick={() => onDownloadTask(task)}><Download size={13} />下载 ZIP</WorkbenchButton>}
          </div>
        </div>
        {task?.status === "processing" && (
          <div className="mt-3" role="status" aria-label={`多角度任务进度 ${task.progress}%`}>
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]"><span>正在按固定顺序生成</span><strong>{task.progress}%</strong></div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--gray-200)]"><div className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${task.progress}%` }} /></div>
          </div>
        )}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {angles.map((result) => (
          <ResultCard
            key={result.id}
            taskId={task?.id}
            result={result}
            onPreview={onPreview}
            onRetry={onRetry}
            onFeedback={onFeedback}
            onDownload={onDownload}
            onNotify={onNotify}
          />
        ))}
      </div>
    </div>
  )
}

function ResultCard({ taskId, result, onPreview, onRetry, onFeedback, onDownload, onNotify }) {
  const completed = result.status === "completed"
  const failed = result.status === "failed"
  const processing = result.status === "processing"
  const cancelled = result.status === "cancelled"

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border bg-[var(--white)]" style={{ borderColor: failed ? "var(--danger)" : "var(--border-light)" }}>
      <button type="button" disabled={!completed} onClick={() => onPreview(taskId, result.id)} className="group relative block aspect-[4/3] w-full overflow-hidden bg-[var(--gray-50)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-default" aria-label={completed ? `预览${result.name}` : `${result.angle}${statusLabel(result.status)}`}>
        {completed ? (
          <>
            <SafeImage src={result.src} alt={result.name} className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-[var(--overlay-scrim)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Eye size={20} className="text-white" /></span>
          </>
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            {processing && <LoaderCircle size={23} className="animate-spin text-[var(--brand-primary)] motion-reduce:animate-none" />}
            {failed && <AlertCircle size={23} className="text-[var(--danger)]" />}
            {cancelled && <Ban size={23} className="text-[var(--text-disabled)]" />}
            {!processing && !failed && !cancelled && <ImageIcon size={23} className="text-[var(--text-disabled)]" />}
            <span className="text-xs font-semibold text-[var(--text-secondary)]">{statusDescription(result.status)}</span>
          </span>
        )}
      </button>
      <div className="p-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0"><strong className="block truncate text-sm text-[var(--text-title)]">{result.angle}</strong><span className="mt-0.5 block text-[11px] text-[var(--text-secondary)]">{statusLabel(result.status)}</span></div>
          <StatusBadge status={result.status} compact />
        </div>
        {failed && <p className="mb-0 mt-2 text-xs leading-5 text-[var(--danger)]">{result.error || "当前角度生成失败。"}</p>}
        <div className="mt-3 flex min-h-8 flex-wrap items-center gap-1.5">
          {completed && (
            <>
              <FeedbackButton title="认可" active={result.feedback === "approved"} onClick={() => onFeedback(taskId, result.id, "approved")}><ThumbsUp size={13} /></FeedbackButton>
              <FeedbackButton title="不行" active={result.feedback === "rejected"} onClick={() => onFeedback(taskId, result.id, "rejected")}><ThumbsDown size={13} /></FeedbackButton>
              <ActionButton title="加入素材库" onClick={() => onNotify("当前结果已加入素材库")}><PackagePlus size={13} /></ActionButton>
              <ActionButton title="下载" onClick={() => onDownload(result)}><Download size={13} /></ActionButton>
            </>
          )}
          {failed && <ActionButton title="重试" onClick={() => onRetry(taskId, result.id)}><RefreshCw size={13} /></ActionButton>}
        </div>
      </div>
    </article>
  )
}

function TaskHistoryPanel({ tasks, page, pageSize, onPageChange, onOpen, onRefresh }) {
  const pageCount = Math.max(1, Math.ceil(tasks.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleTasks = tasks.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <aside className="flex min-h-0 flex-col border-t bg-[var(--gray-50)] lg:border-l lg:border-t-0" style={{ borderColor: "var(--border-light)" }} aria-label="多角度任务历史">
      <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border-light)" }}>
        <div><strong className="text-sm text-[var(--text-title)]">多角度任务</strong><span className="ml-1.5 text-xs text-[var(--text-secondary)]">{tasks.length} 个</span></div>
        <WorkbenchIconButton title="刷新任务历史" onClick={onRefresh}><RefreshCw size={14} /></WorkbenchIconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {visibleTasks.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {visibleTasks.map((task) => {
              const completed = task.results.filter((result) => result.status === "completed")
              return (
                <button key={task.id} type="button" onClick={() => onOpen(task.id)} className="min-w-0 rounded-lg border bg-white p-2.5 text-left transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-light)" }}>
                  <div className="flex items-center justify-between gap-2"><StatusBadge status={task.status} compact /><span className="text-[10px] text-[var(--text-secondary)]">{task.createdAt}</span></div>
                  <p className="my-1.5 truncate text-[11px] text-[var(--text-body)]">{completed.length}/{task.results.length} · {task.model} · {task.quality}</p>
                  <div className="flex h-8 gap-1 overflow-hidden">
                    {completed.length ? completed.slice(0, 4).map((result) => <SafeImage key={result.id} src={result.src} alt={result.angle} className="size-8 rounded-md border object-cover" style={{ borderColor: "var(--border-light)" }} />) : task.results.slice(0, 4).map((result) => <span key={result.id} className="size-8 rounded-md bg-[var(--gray-200)]" />)}
                  </div>
                  <span className="mt-1.5 block truncate font-mono text-[9px] text-[var(--text-disabled)]">{task.id}</span>
                </button>
              )
            })}
          </div>
        ) : <div className="grid min-h-40 place-items-center text-xs text-[var(--text-secondary)]">暂无任务历史</div>}
      </div>
      <div className="flex shrink-0 items-center justify-center gap-2 border-t p-2" style={{ borderColor: "var(--border-light)" }}>
        <HistoryPageButton title="上一页" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}><ChevronLeft size={14} /></HistoryPageButton>
        <span className="min-w-10 text-center text-xs text-[var(--text-secondary)]">{safePage}/{pageCount}</span>
        <HistoryPageButton title="下一页" disabled={safePage >= pageCount} onClick={() => onPageChange(safePage + 1)}><ChevronRight size={14} /></HistoryPageButton>
      </div>
    </aside>
  )
}

function TaskDetailDialog({ task, onClose, onPreview, onRetry, onFeedback, onDownload, onDownloadTask, onContinue, onNotify }) {
  const completed = task.results.filter((result) => result.status === "completed" && result.src)
  return (
    <WorkbenchPickerDialog
      eyebrow="Multi Angle Task"
      title={`多角度任务 ${task.id}`}
      description={`${statusLabel(task.status)} · ${completed.length}/${task.results.length} 张 · ${task.model} · ${task.quality}`}
      width="1040px"
      onClose={onClose}
      footer={(
        <>
          <WorkbenchButton type="button" variant="ghost" onClick={() => onContinue(task)}>继续编辑</WorkbenchButton>
          <div className="flex flex-wrap gap-2">
            <WorkbenchButton type="button" variant="ghost" disabled={!completed.length} onClick={() => onNotify(`已将 ${completed.length} 张结果加入素材库`)}><PackagePlus size={14} />全部加入素材库</WorkbenchButton>
            <WorkbenchButton type="button" disabled={!completed.length} onClick={() => onDownloadTask(task)}><Download size={14} />全部下载 ZIP</WorkbenchButton>
          </div>
        </>
      )}
    >
      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}>
          <SafeImage src={task.sourceImage.src} alt="源图" className="aspect-[4/3] w-full rounded-lg bg-white object-contain" />
          <strong className="mt-2 block truncate text-sm text-[var(--text-title)]">{task.sourceImage.title || "源图"}</strong>
          <span className="mt-1 block text-xs text-[var(--text-secondary)]">{task.sourceImage.source || "素材库"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TaskMeta label="角度数" value={task.results.length} />
          <TaskMeta label="成功" value={completed.length} />
          <TaskMeta label="创建时间" value={task.createdAt} />
          <TaskMeta label="完成时间" value={task.completedAt || "处理中"} />
          <div className="col-span-2 rounded-lg border p-3 sm:col-span-4" style={{ borderColor: "var(--border-base)" }}>
            <strong className="text-xs text-[var(--text-title)]">用户补充提示词</strong>
            <p className="mb-0 mt-1 text-xs leading-5 text-[var(--text-secondary)]">{task.prompt || "未填写补充提示词"}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {task.results.map((result) => (
          <article key={result.id} className="min-w-0 rounded-lg border p-3" style={{ borderColor: result.status === "failed" ? "var(--danger)" : "var(--border-base)" }}>
            <div className="grid gap-3 sm:grid-cols-[132px_minmax(0,1fr)]">
              {result.status === "completed" ? (
                <button type="button" onClick={() => onPreview(task.id, result.id)} className="group relative aspect-square overflow-hidden rounded-lg bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" aria-label={`查看${result.name}`}>
                  <SafeImage src={result.src} alt={result.name} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-[var(--overlay-scrim)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Eye size={20} className="text-white" /></span>
                </button>
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-[var(--gray-50)] text-center text-xs text-[var(--text-secondary)]">
                  {result.status === "failed" ? <AlertCircle size={23} className="text-[var(--danger)]" /> : result.status === "processing" ? <LoaderCircle size={23} className="animate-spin text-[var(--brand-primary)]" /> : <ImageIcon size={23} />}
                  {statusDescription(result.status)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-sm text-[var(--text-title)]">{result.angle}</strong><span className="mt-0.5 block text-[11px] text-[var(--text-secondary)]">{task.model} · {task.quality}</span></div><StatusBadge status={result.status} compact /></div>
                {result.status === "failed" ? <p className="mb-0 mt-2 text-xs leading-5 text-[var(--danger)]">{result.error}</p> : <p className="mb-0 mt-2 line-clamp-3 text-xs leading-5 text-[var(--text-secondary)]">{result.instruction}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.status === "completed" && (
                    <>
                      <FeedbackButton title="认可" active={result.feedback === "approved"} onClick={() => onFeedback(task.id, result.id, "approved")}><ThumbsUp size={13} /></FeedbackButton>
                      <FeedbackButton title="不行" active={result.feedback === "rejected"} onClick={() => onFeedback(task.id, result.id, "rejected")}><ThumbsDown size={13} /></FeedbackButton>
                      <ActionButton title="下载" onClick={() => onDownload(result)}><Download size={13} /></ActionButton>
                      <ActionButton title="加入素材库" onClick={() => onNotify("当前结果已加入素材库")}><PackagePlus size={13} /></ActionButton>
                    </>
                  )}
                  {result.status === "failed" && <ActionButton title="重试" onClick={() => onRetry(task.id, result.id)}><RefreshCw size={13} /></ActionButton>}
                </div>
                {result.requestId && <span className="mt-2 block truncate font-mono text-[9px] text-[var(--text-disabled)]">Request: {result.requestId}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </WorkbenchPickerDialog>
  )
}

function TaskMeta({ label, value }) {
  return <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}><span className="block text-[11px] text-[var(--text-secondary)]">{label}</span><strong className="mt-1 block truncate text-sm text-[var(--text-title)]">{value}</strong></div>
}

function FeedbackButton({ title, active, onClick, children }) {
  return <button type="button" title={title} aria-label={title} aria-pressed={active} onClick={onClick} className="inline-flex min-h-8 items-center gap-1 rounded-md border px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={active ? { color: "var(--brand-primary)", borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { color: "var(--text-body)", borderColor: "var(--border-base)" }}>{children}{title}</button>
}

function ActionButton({ title, onClick, children }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-8 items-center gap-1 rounded-md border px-2 text-xs font-semibold text-[var(--text-body)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)" }}>{children}{title}</button>
}

function HistoryPageButton({ title, disabled, onClick, children }) {
  return <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} className="grid size-8 place-items-center rounded-md border bg-white text-[var(--text-body)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-40" style={{ borderColor: "var(--border-base)" }}>{children}</button>
}

function StatusBadge({ status, compact = false }) {
  const states = {
    idle: { label: "等待提交", color: "var(--text-secondary)", bg: "var(--gray-100)" },
    pending: { label: "等待生成", color: "var(--text-secondary)", bg: "var(--gray-100)" },
    processing: { label: "生成中", color: "var(--info)", bg: "var(--info-bg)" },
    completed: { label: "已完成", color: "var(--success)", bg: "var(--success-bg)" },
    partial: { label: "部分成功", color: "var(--warning)", bg: "var(--warning-bg)" },
    failed: { label: "失败", color: "var(--danger)", bg: "var(--danger-bg)" },
    cancelled: { label: "已终止", color: "var(--text-secondary)", bg: "var(--gray-100)" },
  }
  const state = states[status] || states.idle
  return <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full font-bold", compact ? "min-h-6 px-2 text-[10px]" : "min-h-7 px-2.5 text-xs")} style={{ color: state.color, background: state.bg }}>{status === "completed" && <CheckCircle2 size={compact ? 11 : 13} />}{state.label}</span>
}

function getTask(taskId, currentTask, history) {
  if (!taskId) return null
  if (currentTask?.id === taskId) return currentTask
  return history.find((task) => task.id === taskId) || null
}

function updateProgress(results, progress) {
  const completedCount = Math.min(results.length, Math.floor((progress / 100) * results.length))
  return results.map((result, index) => ({
    ...result,
    status: index < completedCount ? "completed" : index === completedCount ? "processing" : "pending",
  }))
}

function normalizeTaskStatus(task) {
  const hasFailure = task.results.some((result) => result.status === "failed")
  const hasProcessing = task.results.some((result) => ["processing", "pending"].includes(result.status))
  return { ...task, status: hasProcessing ? "processing" : hasFailure ? "partial" : "completed" }
}

function summarizeTask(task) {
  const results = task?.results || []
  return {
    total: results.length,
    completed: results.filter((result) => result.status === "completed").length,
  }
}

function statusLabel(status) {
  return {
    idle: "等待生成",
    pending: "等待生成",
    processing: "生成中",
    completed: "已完成",
    partial: "部分成功",
    failed: "失败",
    cancelled: "已终止",
  }[status] || "等待生成"
}

function statusDescription(status) {
  return {
    idle: "等待生成",
    pending: "等待处理",
    processing: "正在生成",
    failed: "生成失败",
    cancelled: "任务已终止",
  }[status] || "等待结果"
}
