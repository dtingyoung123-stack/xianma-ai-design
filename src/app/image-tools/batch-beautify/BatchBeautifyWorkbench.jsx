"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Ban, CheckCircle2, ChevronDown, ChevronRight, Download, Images, LoaderCircle, RotateCcw, WandSparkles } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import WorkbenchPromptEditor from "@/components/workbench/WorkbenchPromptEditor"
import WorkbenchRecentHistory from "@/components/workbench/WorkbenchRecentHistory"
import { WorkbenchModelSelect, WorkbenchParameterSelect, WorkbenchToast } from "@/components/workbench/WorkbenchControls"
import { WorkbenchButton, WorkbenchModule, WorkbenchPanel, WorkbenchPanelHead, WorkbenchScroll, WorkbenchShell } from "@/components/workbench/Workbench"
import {
  batchBeautifyHistory,
  batchBeautifyModels,
  batchBeautifyPersonalAssets,
  batchBeautifyPresets,
  batchBeautifyPublicAssets,
  batchBeautifyResultImages,
  batchBeautifyTeamAssets,
} from "@/data/demo/batch-beautify"
import { initialPrompts } from "@/data/demo/prompts"
import { formatImageSize, hasValidImageSize } from "@/lib/image-size"

const MAX_IMAGES = 14
const ratioOptions = ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"]

export default function BatchBeautifyWorkbench() {
  const [images, setImages] = useState([])
  const [preset, setPreset] = useState("standard")
  const [prompt, setPrompt] = useState(batchBeautifyPresets[1].prompt)
  const [model, setModel] = useState(batchBeautifyModels[0].name)
  const [resolution, setResolution] = useState("1K")
  const [ratio, setRatio] = useState("智能比例")
  const [customSize, setCustomSize] = useState({ width: "", height: "" })
  const [count, setCount] = useState("1")
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [replaceIndex, setReplaceIndex] = useState(null)
  const [task, setTask] = useState({ status: "idle", progress: 0, groups: [] })
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)
  const toastRef = useRef(null)
  const taskRunRef = useRef(0)

  const canSubmit = Boolean(images.length && prompt.trim() && task.status !== "processing")
  const imageSize = formatImageSize(ratio, customSize)
  const totalOutputs = images.length * Number(count)

  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    window.clearTimeout(toastRef.current)
  }, [])

  function notify(message) {
    setToast(message)
    window.clearTimeout(toastRef.current)
    toastRef.current = window.setTimeout(() => setToast(""), 1800)
  }

  function resetTask() {
    taskRunRef.current += 1
    window.clearInterval(timerRef.current)
    setTask({ status: "idle", progress: 0, groups: [] })
  }

  function addAssets(selectedAssets) {
    const normalized = selectedAssets.map((asset, index) => ({ ...asset, id: `${asset.id || asset.key || "asset"}-${Date.now()}-${index}` }))
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
      id: `beautify-local-${file.name}-${file.lastModified}-${index}`,
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

  function choosePreset(nextPreset) {
    const selected = batchBeautifyPresets.find((item) => item.id === nextPreset)
    setPreset(nextPreset)
    if (selected) setPrompt(selected.prompt)
  }

  function polishPrompt() {
    const base = prompt.trim() || batchBeautifyPresets.find((item) => item.id === preset)?.prompt
    const suffix = "请确保整批图片的美颜标准一致，并根据不同人物和光线自适应调整，避免五官变形和肤色失真。"
    setPrompt(base.includes(suffix) ? base : `${base}\n\n${suffix}`)
    notify("提示词已润色")
  }

  function clearWorkbench() {
    resetTask()
    setImages([])
    setPreset("standard")
    setPrompt(batchBeautifyPresets[1].prompt)
    setModel(batchBeautifyModels[0].name)
    setResolution("1K")
    setRatio("智能比例")
    setCustomSize({ width: "", height: "" })
    setCount("1")
  }

  function createGroups() {
    const outputCount = Number(count)
    return images.map((image, imageIndex) => ({
      id: `beautify-group-${Date.now()}-${imageIndex}`,
      inputImage: image,
      status: "pending",
      expanded: imageIndex === 0,
      results: Array.from({ length: outputCount }, (_, resultIndex) => ({
        id: `beautify-result-${Date.now()}-${imageIndex}-${resultIndex}`,
        name: `${image.title || image.name || `图片 ${imageIndex + 1}`} · 结果 ${resultIndex + 1}`,
        src: batchBeautifyResultImages[(imageIndex + resultIndex) % batchBeautifyResultImages.length],
        status: "pending",
      })),
    }))
  }

  function submitTask() {
    if (!canSubmit) return
    if (!hasValidImageSize(ratio, customSize)) {
      notify("请输入大于 0 的整数宽度")
      return
    }
    window.clearInterval(timerRef.current)
    const runId = taskRunRef.current + 1
    taskRunRef.current = runId
    const groups = createGroups()
    setTask({ status: "processing", progress: 8, groups })
    let progress = 8
    timerRef.current = window.setInterval(() => {
      if (taskRunRef.current !== runId) return
      progress = Math.min(progress + 13, 100)
      setTask((current) => ({ ...current, progress, groups: updateProgress(current.groups, progress) }))
      if (progress >= 100) {
        window.clearInterval(timerRef.current)
        setTask((current) => {
          const completedGroups = finishGroups(current.groups)
          const hasFailure = completedGroups.some((group) => group.status === "failed" || group.status === "partial")
          return { status: hasFailure ? "partial" : "completed", progress: 100, groups: completedGroups }
        })
        notify("批量美颜任务处理完成")
      }
    }, 2500)
  }

  function stopTask() {
    taskRunRef.current += 1
    window.clearInterval(timerRef.current)
    setTask((current) => ({
      ...current,
      status: "cancelled",
      groups: current.groups.map((group) => ({
        ...group,
        status: group.status === "completed" ? "completed" : "cancelled",
        results: group.results.map((result) => result.status === "completed" ? result : { ...result, status: "cancelled" }),
      })),
    }))
    notify("任务已终止，输入图片和当前结果已保留")
  }

  function retryResult(groupId, resultId) {
    const runId = taskRunRef.current + 1
    taskRunRef.current = runId
    setTask((current) => ({
      ...current,
      status: "processing",
      groups: current.groups.map((group) => group.id !== groupId ? group : {
        ...group,
        status: "processing",
        results: group.results.map((result) => result.id === resultId ? { ...result, status: "processing" } : result),
      }),
    }))
    window.setTimeout(() => {
      if (taskRunRef.current !== runId) return
      setTask((current) => {
        const groups = current.groups.map((group) => group.id !== groupId ? group : {
          ...group,
          status: "completed",
          results: group.results.map((result) => result.id === resultId ? { ...result, status: "completed" } : result),
        })
        const hasFailure = groups.some((group) => group.results.some((result) => result.status === "failed"))
        return { ...current, status: hasFailure ? "partial" : "completed", groups }
      })
      notify("失败项已重新生成")
    }, 900)
  }

  function toggleGroup(groupId) {
    setTask((current) => ({ ...current, groups: current.groups.map((group) => group.id === groupId ? { ...group, expanded: !group.expanded } : group) }))
  }

  return (
    <>
      <WorkbenchShell
        crumbs={[{ label: "生图工具" }, { label: "批量美颜" }]}
        title="批量美颜"
        description="一次处理最多 14 张人像图，统一美颜标准并保留每张图片的独立结果。"
        columns="minmax(340px, 3fr) minmax(560px, 7fr)"
        contentClassName="xm-expert-grid"
      >
        <WorkbenchPanel>
          <WorkbenchPanelHead title="美颜输入" description="添加人像图并设置整批图片共用的美颜要求。" meta={<StatusBadge status={task.status} />} />
          <WorkbenchScroll>
            <ImageQueueModule
              title="人像图片"
              images={images}
              max={MAX_IMAGES}
              limitText={`还剩 ${MAX_IMAGES - images.length} 个位置 · 可拖拽排序`}
              assetSub="个人/团体/公共素材"
              uploadSub="电脑多图上传"
              emptyText="尚未添加待处理图片，请从素材库选择或本地上传，最多 14 张。"
              primaryTitle="图片 1"
              accept="image/jpeg,image/png,image/webp"
              onOpenAssetPicker={() => { setReplaceIndex(null); setAssetPickerOpen(true) }}
              onLocalImages={handleLocalImages}
              onRemove={(index) => { setImages((current) => current.filter((_, imageIndex) => imageIndex !== index)); resetTask() }}
              onRefresh={(index) => { setReplaceIndex(index); setAssetPickerOpen(true) }}
              onReorder={(nextImages) => { setImages(nextImages); resetTask() }}
              onPreviewNotify={notify}
            />

            <BeautyPresetSelector value={preset} onChange={choosePreset} />

            <WorkbenchPromptEditor
              title="美颜提示词"
              value={prompt}
              onChange={setPrompt}
              onTemplate={() => setPromptPickerOpen(true)}
              onClear={() => setPrompt("")}
              onPolish={polishPrompt}
              placeholder="描述整批人像需要统一优化的肤色、肤质、细节和必须保留的内容"
              helperText="预设会填入推荐提示词，你可以继续补充要求；最终以当前提示词为准。"
              ariaLabel="批量美颜提示词"
            />

            <WorkbenchModule title="生成设置">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <WorkbenchModelSelect value={model} onChange={setModel} options={batchBeautifyModels} label="模型选择" />
                <WorkbenchParameterSelect
                  label="参数调节"
                  summary={`${resolution} · ${imageSize} · 每张 ${count} 张`}
                  note={images.length ? `预计生成 ${totalOutputs} 张结果` : "添加图片后计算预计结果数"}
                  sections={[
                    { key: "resolution", label: "清晰度", value: resolution, options: ["1K", "2K", "4K"], onChange: setResolution },
                    { key: "ratio", label: "图片尺寸", value: ratio, options: ratioOptions, onChange: setRatio, visual: "ratio", dimensions: { size: customSize, onChange: setCustomSize } },
                    { key: "count", label: "每张图片生成", value: count, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], onChange: setCount },
                  ]}
                />
              </div>
            </WorkbenchModule>
          </WorkbenchScroll>
          <div className="grid shrink-0 grid-cols-1 gap-2 border-t bg-[var(--white)] p-3 sm:grid-cols-[1fr_auto]" style={{ borderColor: "var(--border-light)" }}>
            {task.status === "processing" ? (
              <WorkbenchButton type="button" variant="ghost" onClick={stopTask} style={{ color: "var(--danger)", borderColor: "var(--danger)" }}><Ban size={16} />终止任务</WorkbenchButton>
            ) : (
              <WorkbenchButton type="button" disabled={!canSubmit} onClick={submitTask}><WandSparkles size={16} />开始批量美颜{totalOutputs ? `（${totalOutputs} 张）` : ""}</WorkbenchButton>
            )}
            <WorkbenchButton type="button" variant="ghost" onClick={clearWorkbench}><RotateCcw size={15} />清空重来</WorkbenchButton>
          </div>
        </WorkbenchPanel>

        <WorkbenchPanel>
          <WorkbenchPanelHead title="批量结果" description="按输入图片查看处理状态和独立结果，失败项可单独重试。" meta={<StatusBadge status={task.status} />} />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
            <BatchResultWorkspace task={task} onToggle={toggleGroup} onRetry={retryResult} onDownload={() => notify("结果图片已开始下载")} onBatchDownload={() => notify("已开始打包下载成功结果")} />
            <WorkbenchRecentHistory
              items={batchBeautifyHistory}
              source="batch-beautify"
              sourceLabel="批量美颜"
              onRefresh={() => notify("历史记录已刷新")}
              onCopy={(text) => { navigator.clipboard?.writeText(text); notify("提示词已复制") }}
              onContinue={(item) => { setPrompt(item.prompt); notify("历史提示词已回填") }}
            />
          </div>
        </WorkbenchPanel>
      </WorkbenchShell>

      {assetPickerOpen && (
        <AssetPickerModal
          title={replaceIndex === null ? "选择待美颜图片" : "替换当前图片"}
          description={replaceIndex === null ? "一次最多选择 14 张，已选图片会按当前顺序加入处理队列。" : "选择一张图片替换当前位置，队列顺序保持不变。"}
          max={replaceIndex === null ? Math.max(1, MAX_IMAGES - images.length) : 1}
          personalAssets={batchBeautifyPersonalAssets}
          teamAssets={batchBeautifyTeamAssets}
          publicAssets={batchBeautifyPublicAssets}
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
      <WorkbenchToast message={toast} />
    </>
  )
}

function BeautyPresetSelector({ value, onChange }) {
  return (
    <WorkbenchModule title="美颜预设" hint="选择后同步推荐提示词">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {batchBeautifyPresets.map((item) => {
          const selected = item.id === value
          return (
            <button key={item.id} type="button" aria-pressed={selected} onClick={() => onChange(item.id)} className="min-h-20 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={selected ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}>
              <strong className="block text-sm text-[var(--text-title)]">{item.name}</strong>
              <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{item.description}</span>
            </button>
          )
        })}
      </div>
    </WorkbenchModule>
  )
}

function BatchResultWorkspace({ task, onToggle, onRetry, onDownload, onBatchDownload }) {
  const stats = useMemo(() => summarizeTask(task.groups), [task.groups])

  if (!task.groups.length) {
    return (
      <div className="min-h-0 overflow-y-auto p-4">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--border-base)" }}>
          <Images size={28} className="text-[var(--text-disabled)]" />
          <strong className="mt-3 text-sm text-[var(--text-title)]">等待批量美颜结果</strong>
          <span className="mt-1 max-w-md text-xs leading-5 text-[var(--text-secondary)]">添加图片并提交后，这里会按输入图分组展示待处理、处理中、成功、失败和已终止状态。</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 overflow-y-auto p-4">
      <div className="mb-3 rounded-lg border p-3" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            <span>共 {stats.total} 张</span><span className="text-[var(--success)]">成功 {stats.completed}</span><span className="text-[var(--danger)]">失败 {stats.failed}</span><span>待处理 {stats.pending}</span>
          </div>
          {stats.completed > 0 && <WorkbenchButton type="button" variant="soft" className="min-h-8 px-3 text-xs" onClick={onBatchDownload}><Download size={14} />下载成功结果</WorkbenchButton>}
        </div>
        {task.status === "processing" && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--gray-200)]"><span className="block h-full rounded-full bg-[var(--brand-primary)] transition-[width]" style={{ width: `${task.progress}%` }} /></div>}
      </div>

      <div className="space-y-2">
        {task.groups.map((group, index) => <BatchResultGroup key={group.id} group={group} index={index} onToggle={() => onToggle(group.id)} onRetry={(resultId) => onRetry(group.id, resultId)} onDownload={onDownload} />)}
      </div>
    </div>
  )
}

function BatchResultGroup({ group, index, onToggle, onRetry, onDownload }) {
  const stats = summarizeResults(group.results)
  return (
    <article className="overflow-hidden rounded-lg border bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }}>
      <button type="button" aria-expanded={group.expanded} onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]">
        <SafeImage src={group.inputImage.src} alt={group.inputImage.title || `输入图片 ${index + 1}`} className="size-12 shrink-0 rounded-lg object-cover" />
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm text-[var(--text-title)]">{group.inputImage.title || group.inputImage.name || `输入图片 ${index + 1}`}</strong>
          <span className="mt-1 block text-xs text-[var(--text-secondary)]">成功 {stats.completed} · 失败 {stats.failed} · 共 {stats.total} 张</span>
        </span>
        <StatusBadge status={group.status} />
        {group.expanded ? <ChevronDown size={16} className="shrink-0 text-[var(--text-secondary)]" /> : <ChevronRight size={16} className="shrink-0 text-[var(--text-secondary)]" />}
      </button>
      {group.expanded && (
        <div className="grid grid-cols-1 gap-2 border-t p-3 sm:grid-cols-2 xl:grid-cols-3" style={{ borderColor: "var(--border-light)" }}>
          {group.results.map((result) => <ResultCard key={result.id} result={result} onRetry={() => onRetry(result.id)} onDownload={onDownload} />)}
        </div>
      )}
    </article>
  )
}

function ResultCard({ result, onRetry, onDownload }) {
  const waiting = result.status === "pending" || result.status === "processing"
  const failed = result.status === "failed"
  const cancelled = result.status === "cancelled"
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: failed ? "var(--danger)" : "var(--border-light)", background: "var(--gray-50)" }}>
      <div className="relative aspect-square">
        <SafeImage src={result.src} alt={result.name} className={`h-full w-full object-cover ${waiting || failed || cancelled ? "opacity-25" : ""}`} />
        {(waiting || failed || cancelled) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
            {result.status === "processing" && <LoaderCircle size={22} className="animate-spin text-[var(--brand-primary)]" />}
            {result.status === "pending" && <span className="text-xs font-semibold text-[var(--text-secondary)]">待处理</span>}
            {failed && <><AlertCircle size={22} className="text-[var(--danger)]" /><span className="mt-1 text-xs font-semibold text-[var(--danger)]">生成失败</span></>}
            {cancelled && <span className="text-xs font-semibold text-[var(--text-secondary)]">已终止</span>}
          </div>
        )}
      </div>
      <div className="flex min-h-11 items-center justify-between gap-2 p-2">
        <strong className="truncate text-xs text-[var(--text-title)]">{result.name}</strong>
        {failed && <button type="button" onClick={onRetry} className="shrink-0 text-xs font-bold text-[var(--brand-primary)]">重试</button>}
        {result.status === "completed" && <a href={result.src} download onClick={onDownload} className="grid size-8 shrink-0 place-items-center rounded-full border text-[var(--brand-primary)]" style={{ borderColor: "var(--brand-primary-border)" }} title="下载结果" aria-label={`下载${result.name}`}><Download size={14} /></a>}
      </div>
    </div>
  )
}

function updateProgress(groups, progress) {
  if (!groups.length) return groups
  const activeIndex = Math.min(groups.length - 1, Math.floor((progress / 100) * groups.length))
  return groups.map((group, groupIndex) => ({
    ...group,
    status: groupIndex < activeIndex ? "completed" : groupIndex === activeIndex ? "processing" : "pending",
    results: group.results.map((result, resultIndex) => ({ ...result, status: groupIndex < activeIndex ? "completed" : groupIndex === activeIndex && resultIndex === 0 ? "processing" : "pending" })),
  }))
}

function finishGroups(groups) {
  const total = groups.reduce((sum, group) => sum + group.results.length, 0)
  return groups.map((group, groupIndex) => {
    const results = group.results.map((result, resultIndex) => ({ ...result, status: total > 2 && groupIndex === 0 && resultIndex === group.results.length - 1 ? "failed" : "completed" }))
    const hasFailure = results.some((result) => result.status === "failed")
    return { ...group, status: hasFailure && results.length > 1 ? "partial" : hasFailure ? "failed" : "completed", results }
  })
}

function summarizeResults(results) {
  return results.reduce((summary, result) => ({ ...summary, total: summary.total + 1, [result.status]: (summary[result.status] || 0) + 1 }), { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 })
}

function summarizeTask(groups) {
  return summarizeResults(groups.flatMap((group) => group.results))
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
