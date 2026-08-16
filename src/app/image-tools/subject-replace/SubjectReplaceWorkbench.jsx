"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Download, LoaderCircle, RotateCcw, WandSparkles } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import WorkbenchPromptEditor from "@/components/workbench/WorkbenchPromptEditor"
import WorkbenchRecentHistory from "@/components/workbench/WorkbenchRecentHistory"
import {
  WorkbenchModelSelect,
  WorkbenchParameterSelect,
  WorkbenchToast,
} from "@/components/workbench/WorkbenchControls"
import {
  WorkbenchButton,
  WorkbenchModule,
  WorkbenchPanel,
  WorkbenchPanelHead,
  WorkbenchScroll,
  WorkbenchShell,
} from "@/components/workbench/Workbench"
import {
  subjectReplaceDefaultPrompt,
  subjectReplaceHistory,
  subjectReplaceModels,
  subjectReplacePersonalAssets,
  subjectReplacePublicAssets,
  subjectReplaceResultImages,
  subjectReplaceTeamAssets,
} from "@/data/demo/subject-replace"
import { initialPrompts } from "@/data/demo/prompts"
import { formatImageSize, hasValidImageSize } from "@/lib/image-size"

const MAX_IMAGES = 14
const ratioOptions = ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"]

export default function SubjectReplaceWorkbench() {
  const [images, setImages] = useState([])
  const [prompt, setPrompt] = useState(subjectReplaceDefaultPrompt)
  const [model, setModel] = useState(subjectReplaceModels[0].name)
  const [resolution, setResolution] = useState("1K")
  const [ratio, setRatio] = useState("智能比例")
  const [customSize, setCustomSize] = useState({ width: "", height: "" })
  const [count, setCount] = useState("1")
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [replaceIndex, setReplaceIndex] = useState(null)
  const [task, setTask] = useState({ status: "idle", progress: 0, results: [], error: "" })
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)

  const canSubmit = images.length >= 2 && prompt.trim() && task.status !== "processing"
  const imageSize = formatImageSize(ratio, customSize)

  useEffect(() => () => window.clearInterval(timerRef.current), [])

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(""), 1800)
  }

  function addAssets(selectedAssets) {
    const normalized = selectedAssets.map((asset, index) => ({
      ...asset,
      id: `${asset.id || asset.key || "asset"}-${Date.now()}-${index}`,
    }))
    setImages((current) => {
      if (replaceIndex !== null && normalized[0]) {
        return current.map((image, index) => index === replaceIndex ? normalized[0] : image)
      }
      return [...current, ...normalized].slice(0, MAX_IMAGES)
    })
    setReplaceIndex(null)
    setAssetPickerOpen(false)
  }

  function handleLocalImages(event) {
    const remaining = MAX_IMAGES - images.length
    const localImages = Array.from(event.target.files || []).slice(0, remaining).map((file, index) => ({
      id: `subject-local-${file.name}-${file.lastModified}-${index}`,
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
  }

  function polishPrompt() {
    const base = prompt.trim() || subjectReplaceDefaultPrompt
    const suffix = "请重点校准主体比例、透视、遮挡边缘、接触关系和光影方向，使替换结果自然可信。"
    setPrompt(base.includes(suffix) ? base : `${base}\n\n${suffix}`)
    notify("提示词已润色")
  }

  function clearWorkbench() {
    window.clearInterval(timerRef.current)
    setImages([])
    setPrompt(subjectReplaceDefaultPrompt)
    setModel(subjectReplaceModels[0].name)
    setResolution("1K")
    setRatio("智能比例")
    setCustomSize({ width: "", height: "" })
    setCount("1")
    setTask({ status: "idle", progress: 0, results: [], error: "" })
  }

  function submitTask() {
    if (!canSubmit) return
    if (!hasValidImageSize(ratio, customSize)) {
      notify("请输入大于 0 的整数宽度")
      return
    }
    window.clearInterval(timerRef.current)
    setTask({ status: "processing", progress: 12, results: [], error: "" })
    let progress = 12
    timerRef.current = window.setInterval(() => {
      progress = Math.min(progress + 22, 100)
      if (progress >= 100) {
        window.clearInterval(timerRef.current)
        const results = subjectReplaceResultImages.slice(0, Number(count)).map((src, index) => ({ id: `subject-result-${Date.now()}-${index}`, src, name: `主体替换结果 ${index + 1}` }))
        setTask({ status: "completed", progress: 100, results, error: "" })
        notify("主体替换任务已完成")
      } else {
        setTask((current) => ({ ...current, progress }))
      }
    }, 420)
  }

  function continueHistory(item) {
    setPrompt(item.prompt)
    notify("历史提示词已回填")
  }

  return (
    <>
      <WorkbenchShell
        crumbs={[{ label: "生图工具" }, { label: "主体替换" }]}
        title="主体替换"
        description="基于多图输入替换背景、模特、产品等主体，保留原图场景关系与参考主体细节。"
        columns="minmax(340px, 3fr) minmax(560px, 7fr)"
        contentClassName="xm-expert-grid"
      >
        <WorkbenchPanel>
          <WorkbenchPanelHead title="替换输入" description="图一为原图，图二及后续图片为主体参考。" meta={<StatusBadge status={task.status} />} />
          <WorkbenchScroll>
            <ImageQueueModule
              title="原图与主体参考"
              images={images}
              max={MAX_IMAGES}
              limitText="至少 2 张 · 可拖拽排序"
              emptyText="请添加原图和至少一张主体参考图。图一为原图，其余图片作为主体参考。"
              primaryTitle="原图"
              assetSub="个人/团体/公共素材库"
              onOpenAssetPicker={() => { setReplaceIndex(null); setAssetPickerOpen(true) }}
              onLocalImages={handleLocalImages}
              onRemove={(index) => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
              onRefresh={(index) => { setReplaceIndex(index); setAssetPickerOpen(true) }}
              onReorder={setImages}
              onPreviewNotify={notify}
            />

            <WorkbenchPromptEditor
              title="替换指令"
              value={prompt}
              onChange={setPrompt}
              onTemplate={() => setPromptPickerOpen(true)}
              onClear={() => setPrompt("")}
              onPolish={polishPrompt}
              placeholder="描述需要替换的主体、必须保留的内容和结果要求"
              helperText="建议明确主体来源、保留项，以及比例、遮挡、边缘和光影要求。"
              ariaLabel="主体替换指令"
            />

            <WorkbenchModule title="生成设置">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <WorkbenchModelSelect value={model} onChange={setModel} options={subjectReplaceModels} label="模型选择" />
                <WorkbenchParameterSelect
                  label="参数调节"
                  summary={`${resolution} · ${imageSize} · ${count} 张`}
                  sections={[
                    { key: "resolution", label: "清晰度", value: resolution, options: ["1K", "2K", "4K"], onChange: setResolution },
                    { key: "ratio", label: "图片尺寸", value: ratio, options: ratioOptions, onChange: setRatio, visual: "ratio", dimensions: { size: customSize, onChange: setCustomSize } },
                    { key: "count", label: "图片张数", value: count, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], onChange: setCount },
                  ]}
                />
              </div>
            </WorkbenchModule>
          </WorkbenchScroll>
          <div className="grid shrink-0 grid-cols-1 gap-2 border-t bg-[var(--white)] p-3 sm:grid-cols-[1fr_auto]" style={{ borderColor: "var(--border-light)" }}>
            <WorkbenchButton type="button" disabled={!canSubmit} onClick={submitTask}>
              {task.status === "processing" ? <LoaderCircle className="animate-spin" size={16} /> : <WandSparkles size={16} />}
              {task.status === "processing" ? "正在替换" : "提交主体替换任务"}
            </WorkbenchButton>
            <WorkbenchButton type="button" variant="ghost" onClick={clearWorkbench}><RotateCcw size={15} />清空重来</WorkbenchButton>
          </div>
        </WorkbenchPanel>

        <WorkbenchPanel>
          <WorkbenchPanelHead title="结果工作台" description="查看替换结果并继续处理最近任务。" meta={<StatusBadge status={task.status} />} />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
            <SubjectReplaceResult task={task} onDownload={() => notify("结果图片已开始下载")} onRetry={submitTask} />
            <WorkbenchRecentHistory
              items={subjectReplaceHistory}
              source="subject-replace"
              sourceLabel="主体替换"
              onRefresh={() => notify("历史记录已刷新")}
              onCopy={(text) => { navigator.clipboard?.writeText(text); notify("提示词已复制") }}
              onContinue={continueHistory}
            />
          </div>
        </WorkbenchPanel>
      </WorkbenchShell>

      {assetPickerOpen && (
        <AssetPickerModal
          title={replaceIndex === null ? "选择原图或主体参考" : "替换当前图片"}
          description={replaceIndex === null ? "请按顺序选择图片，图一作为原图，其余图片作为主体参考。" : "选择一张图片替换当前位置，队列顺序保持不变。"}
          max={replaceIndex === null ? Math.max(1, MAX_IMAGES - images.length) : 1}
          personalAssets={subjectReplacePersonalAssets}
          teamAssets={subjectReplaceTeamAssets}
          publicAssets={subjectReplacePublicAssets}
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

function SubjectReplaceResult({ task, onDownload, onRetry }) {
  if (task.status === "processing") {
    return (
      <div className="min-h-0 overflow-y-auto p-4">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center" style={{ borderColor: "var(--border-base)" }}>
          <LoaderCircle className="animate-spin text-[var(--brand-primary)]" size={30} />
          <strong className="mt-3 text-sm text-[var(--text-title)]">正在融合主体与原图场景</strong>
          <span className="mt-1 text-xs text-[var(--text-secondary)]">任务进度 {task.progress}%</span>
          <div className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)] transition-[width]" style={{ width: `${task.progress}%` }} /></div>
        </div>
      </div>
    )
  }

  if (task.status === "failed") {
    return (
      <div className="min-h-0 overflow-y-auto p-4">
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--danger)" }}>
          <AlertCircle size={30} className="text-[var(--danger)]" />
          <strong className="mt-3 text-sm text-[var(--text-title)]">主体替换失败</strong>
          <span className="mt-1 text-xs text-[var(--text-secondary)]">{task.error || "任务处理异常，请保留当前输入后重试。"}</span>
          <WorkbenchButton type="button" variant="ghost" className="mt-4" onClick={onRetry}>重新提交</WorkbenchButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 overflow-y-auto p-4">
      {task.results.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {task.results.map((result) => (
            <article key={result.id} className="overflow-hidden rounded-lg border bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }}>
              <SafeImage src={result.src} alt={result.name} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2.5">
                <strong className="truncate text-xs text-[var(--text-title)]">{result.name}</strong>
                <a href={result.src} download onClick={onDownload} className="grid size-8 shrink-0 place-items-center rounded-full border text-[var(--brand-primary)]" style={{ borderColor: "var(--brand-primary-border)" }} title="下载结果" aria-label={`下载${result.name}`}><Download size={14} /></a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--border-base)" }}>
          <WandSparkles size={28} className="text-[var(--text-disabled)]" />
          <strong className="mt-3 text-sm text-[var(--text-title)]">等待主体替换结果</strong>
          <span className="mt-1 max-w-md text-xs leading-5 text-[var(--text-secondary)]">添加原图和主体参考图，填写替换指令并提交任务后，结果会在这里展示。</span>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const meta = status === "processing"
    ? { label: "生成中", bg: "var(--warning-bg)", color: "var(--warning)" }
    : status === "completed"
      ? { label: "已完成", bg: "var(--success-bg)", color: "var(--success)" }
      : status === "failed"
        ? { label: "失败", bg: "var(--danger-bg)", color: "var(--danger)" }
        : { label: "未开始", bg: "var(--gray-100)", color: "var(--text-secondary)" }
  return <span className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold" style={{ background: meta.bg, color: meta.color }}>{status === "completed" && <CheckCircle2 size={13} />}{meta.label}</span>
}
