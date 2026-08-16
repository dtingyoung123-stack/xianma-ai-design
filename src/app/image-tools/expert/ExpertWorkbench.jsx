"use client"

import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  Download,
  ImageIcon,
  LoaderCircle,
  RotateCcw,
  Type,
  WandSparkles,
} from "lucide-react"
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
  expertDefaultPrompts,
  expertHistory,
  expertModels,
  expertPersonalAssets,
  expertPublicAssets,
  expertResultImages,
  expertTeamAssets,
} from "@/data/demo/expert"
import { initialPrompts } from "@/data/demo/prompts"
import { formatImageSize, hasValidImageSize } from "@/lib/image-size"

const MAX_REFERENCE_IMAGES = 14
const ratioOptions = ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"]

export default function ExpertWorkbench() {
  const [mode, setMode] = useState("reference")
  const [images, setImages] = useState([])
  const [prompt, setPrompt] = useState(expertDefaultPrompts.reference)
  const [model, setModel] = useState(expertModels[0].name)
  const [resolution, setResolution] = useState("1K")
  const [ratio, setRatio] = useState("智能比例")
  const [customSize, setCustomSize] = useState({ width: "", height: "" })
  const [count, setCount] = useState("1")
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [replaceIndex, setReplaceIndex] = useState(null)
  const [task, setTask] = useState({ status: "idle", progress: 0, requestId: "", results: [] })
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)

  const canSubmit = prompt.trim() && (mode === "text" || images.length > 0) && task.status !== "processing"
  const imageSize = formatImageSize(ratio, customSize)

  useEffect(() => () => clearInterval(timerRef.current), [])

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(""), 1800)
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setPrompt(expertDefaultPrompts[nextMode])
    setTask({ status: "idle", progress: 0, requestId: "", results: [] })
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
      return [...current, ...normalized].slice(0, MAX_REFERENCE_IMAGES)
    })
    setReplaceIndex(null)
    setAssetPickerOpen(false)
  }

  function handleLocalImages(event) {
    const remaining = MAX_REFERENCE_IMAGES - images.length
    const nextImages = Array.from(event.target.files || []).slice(0, remaining).map((file, index) => ({
      id: `local-${file.name}-${file.lastModified}-${index}`,
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
    setImages((current) => [...current, ...nextImages].slice(0, MAX_REFERENCE_IMAGES))
    event.target.value = ""
  }

  function polishPrompt() {
    const base = prompt.trim() || expertDefaultPrompts[mode]
    const suffix = "请进一步明确主体层级、构图关系、光线方向和材质细节，并保持商业画面干净、准确、无多余文字。"
    setPrompt(base.includes(suffix) ? base : `${base}\n\n${suffix}`)
    notify("提示词已润色")
  }

  function resetWorkbench() {
    clearInterval(timerRef.current)
    setImages([])
    setPrompt(expertDefaultPrompts[mode])
    setResolution("1K")
    setRatio("智能比例")
    setCustomSize({ width: "", height: "" })
    setCount("1")
    setTask({ status: "idle", progress: 0, requestId: "", results: [] })
  }

  function submitTask() {
    if (!canSubmit) return
    if (!hasValidImageSize(ratio, customSize)) {
      notify("请输入大于 0 的整数宽度")
      return
    }
    clearInterval(timerRef.current)
    const requestId = Math.random().toString(16).slice(2, 10)
    setTask({ status: "processing", progress: 12, requestId, results: [] })
    let progress = 12
    timerRef.current = window.setInterval(() => {
      progress = Math.min(progress + 22, 100)
      if (progress >= 100) {
        clearInterval(timerRef.current)
        const results = expertResultImages.slice(0, Number(count)).map((src, index) => ({ id: `${requestId}-${index}`, src, name: `专家模式结果 ${index + 1}` }))
        setTask({ status: "completed", progress: 100, requestId, results })
        notify("专家模式任务已完成")
      } else {
        setTask((current) => ({ ...current, progress }))
      }
    }, 420)
  }

  function continueHistory(item) {
    setPrompt(item.prompt)
    setMode("reference")
    notify("历史提示词已回填")
  }

  return (
    <>
      <WorkbenchShell
        crumbs={[{ label: "生图工具" }, { label: "专家模式" }]}
        title="专家模式"
        description="支持 0～14 张参考图，也支持纯文生图，适合复杂商业视觉生成与组合编辑"
        columns="minmax(340px, 3fr) minmax(560px, 7fr)"
        contentClassName="xm-expert-grid"
      >
        <WorkbenchPanel>
          <WorkbenchPanelHead title="创作输入" description="组合参考素材、指令与生成参数。" meta={<StatusBadge status={task.status} />} />
          <WorkbenchScroll>
            <ModeSwitch value={mode} onChange={changeMode} />

            {mode === "reference" && (
              <ImageQueueModule
                title="参考图片"
                images={images}
                max={MAX_REFERENCE_IMAGES}
                limitText="可拖拽排序"
                emptyText="尚未添加参考图，请从素材库选择或本地上传。"
                primaryTitle="图一"
                onOpenAssetPicker={() => { setReplaceIndex(null); setAssetPickerOpen(true) }}
                onLocalImages={handleLocalImages}
                onRemove={(index) => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                onRefresh={(index) => { setReplaceIndex(index); setAssetPickerOpen(true) }}
                onReorder={setImages}
                onEditRegion={(index, regionEdit) => setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, regionEdit } : image))}
                onUnavailable={(message) => notify(message || "当前图片暂不支持区域编辑")}
                onPreviewNotify={notify}
              />
            )}

            <WorkbenchPromptEditor
              title="专家级创作指令"
              value={prompt}
              onChange={setPrompt}
              onTemplate={() => setPromptPickerOpen(true)}
              onClear={() => setPrompt("")}
              onPolish={polishPrompt}
              placeholder="请写清楚主体、风格、构图和不可更改的部分"
              helperText="建议先写保留项，再写修改项，最后补充风格要求。"
              ariaLabel="专家级创作指令"
            />

            <WorkbenchModule title="生成设置">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <WorkbenchModelSelect value={model} onChange={setModel} options={expertModels} label="模型选择" />
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
          <div className="grid shrink-0 grid-cols-1 gap-2 border-t bg-white p-3 sm:grid-cols-[1fr_auto]" style={{ borderColor: "var(--border-light)" }}>
            <WorkbenchButton type="button" disabled={!canSubmit} onClick={submitTask}>
              {task.status === "processing" ? <LoaderCircle className="animate-spin" size={16} /> : <WandSparkles size={16} />}
              {task.status === "processing" ? "正在生成" : mode === "reference" ? "提交专家编辑任务" : "提交文生图任务"}
            </WorkbenchButton>
            <WorkbenchButton type="button" variant="ghost" onClick={resetWorkbench}><RotateCcw size={15} />清空重来</WorkbenchButton>
          </div>
        </WorkbenchPanel>

        <WorkbenchPanel>
          <WorkbenchPanelHead title="结果工作台" description="查看任务结果并继续处理历史创作。" meta={<StatusBadge status={task.status} />} />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
            <ResultWorkspace task={task} mode={mode} onDownload={() => notify("结果图片已开始下载")} />
            <WorkbenchRecentHistory
              items={expertHistory.slice(0, 7)}
              source="expert"
              sourceLabel="专家模式"
              onRefresh={() => notify("历史记录已刷新")}
              onCopy={(text) => { navigator.clipboard?.writeText(text); notify("提示词已复制") }}
              onContinue={continueHistory}
            />
          </div>
        </WorkbenchPanel>
      </WorkbenchShell>

      {assetPickerOpen && (
        <AssetPickerModal
          title={replaceIndex === null ? "选择参考图片" : "替换参考图片"}
          description={replaceIndex === null ? "可从个人、团体、公共素材或本地文件中选择。" : "选择一张图片替换当前参考图。"}
          max={replaceIndex === null ? Math.max(1, MAX_REFERENCE_IMAGES - images.length) : 1}
          personalAssets={expertPersonalAssets}
          teamAssets={expertTeamAssets}
          publicAssets={expertPublicAssets}
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

function ModeSwitch({ value, onChange }) {
  const options = [
    { id: "reference", label: "参考图生成", description: "使用 1～14 张参考图组合编辑", icon: ImageIcon },
    { id: "text", label: "纯文生图", description: "直接生成全新商业画面", icon: Type },
  ]
  return (
    <WorkbenchModule title="创作模式" hint={value === "reference" ? "参考图编辑中" : "纯文生图中"}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="创作模式">
        {options.map((option) => {
          const Icon = option.icon
          const selected = value === option.id
          return (
            <button key={option.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option.id)} className="flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={selected ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)" }}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: selected ? "var(--white)" : "var(--gray-100)", color: selected ? "var(--brand-primary)" : "var(--text-secondary)" }}><Icon size={17} /></span>
              <span className="min-w-0"><strong className="block text-sm text-[var(--text-title)]">{option.label}</strong><span className="mt-1 block text-xs leading-4 text-[var(--text-secondary)]">{option.description}</span></span>
            </button>
          )
        })}
      </div>
    </WorkbenchModule>
  )
}

function ResultWorkspace({ task, mode, onDownload }) {
  return (
    <div className="min-h-0 overflow-y-auto p-4">
      {task.status === "processing" ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center" style={{ borderColor: "var(--border-base)" }}>
          <LoaderCircle className="animate-spin text-[var(--brand-primary)]" size={30} />
          <strong className="mt-3 text-sm text-[var(--text-title)]">正在生成专家模式结果</strong>
          <span className="mt-1 text-xs text-[var(--text-secondary)]">任务进度 {task.progress}%</span>
          <div className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)] transition-[width]" style={{ width: `${task.progress}%` }} /></div>
        </div>
      ) : task.results.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {task.results.map((result) => (
            <article key={result.id} className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }}>
              <SafeImage src={result.src} alt={result.name} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2.5"><strong className="truncate text-xs text-[var(--text-title)]">{result.name}</strong><a href={result.src} download onClick={onDownload} className="grid size-8 shrink-0 place-items-center rounded-full border text-[var(--brand-primary)]" style={{ borderColor: "var(--brand-primary-border)" }} title="下载结果" aria-label={`下载${result.name}`}><Download size={14} /></a></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--border-base)" }}>
          <WandSparkles size={28} className="text-[var(--text-disabled)]" />
          <strong className="mt-3 text-sm text-[var(--text-title)]">等待专家模式结果</strong>
          <span className="mt-1 max-w-md text-xs leading-5 text-[var(--text-secondary)]">{mode === "reference" ? "添加参考图并提交任务后，结果会在这里展示。" : "填写提示词并提交任务后，可生成全新的商业视觉画面。"}</span>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const meta = status === "processing" ? { label: "生成中", bg: "var(--warning-bg)", color: "var(--warning)" } : status === "completed" ? { label: "已完成", bg: "var(--success-bg)", color: "var(--success)" } : { label: "未开始", bg: "var(--gray-100)", color: "var(--text-secondary)" }
  return <span className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold" style={{ background: meta.bg, color: meta.color }}>{status === "completed" && <CheckCircle2 size={13} />}{meta.label}</span>
}
