"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Ban, CheckCircle2, Download, LoaderCircle, RotateCcw, WandSparkles } from "lucide-react"
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
  productRefineDefaultPrompt,
  productRefineHistory,
  productRefineModels,
  productRefinePersonalAssets,
  productRefinePublicAssets,
  productRefineResultImages,
  productRefineTeamAssets,
} from "@/data/demo/product-refine"
import { initialPrompts } from "@/data/demo/prompts"
import { formatImageSize, hasValidImageSize } from "@/lib/image-size"

const ratioOptions = ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"]

export default function ProductRefineWorkbench() {
  const [image, setImage] = useState(null)
  const [prompt, setPrompt] = useState(productRefineDefaultPrompt)
  const [model, setModel] = useState(productRefineModels[0].name)
  const [resolution, setResolution] = useState("1K")
  const [ratio, setRatio] = useState("智能比例")
  const [customSize, setCustomSize] = useState({ width: "", height: "" })
  const [count, setCount] = useState("1")
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)
  const [task, setTask] = useState({ status: "idle", progress: 0, results: [], error: "" })
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)
  const toastRef = useRef(null)

  const canSubmit = Boolean(image && prompt.trim() && task.status !== "processing")
  const imageSize = formatImageSize(ratio, customSize)

  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    window.clearTimeout(toastRef.current)
  }, [])

  function notify(message) {
    setToast(message)
    window.clearTimeout(toastRef.current)
    toastRef.current = window.setTimeout(() => setToast(""), 1800)
  }

  function loadImage(nextImage) {
    setImage(nextImage)
    setTask({ status: "idle", progress: 0, results: [], error: "" })
  }

  function handleLocalImage(event) {
    const file = event.target.files?.[0]
    if (file) {
      loadImage({
        id: `product-refine-local-${file.name}-${file.lastModified}`,
        name: file.name,
        title: file.name.replace(/\.[^.]+$/, "") || file.name,
        filename: file.name,
        src: URL.createObjectURL(file),
        size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
        source: "本地上传",
        category: "未分类",
        tags: [],
        file,
      })
    }
    event.target.value = ""
  }

  function polishPrompt() {
    const base = prompt.trim() || productRefineDefaultPrompt
    const suffix = image?.regionEdit
      ? "仅优化已选择区域，未选择区域保持完全不变；处理边缘需自然过渡。"
      : "请进一步校准材质纹理、边缘、高光、阴影和细节层次，保持商品信息准确。"
    setPrompt(base.includes(suffix) ? base : `${base}\n\n${suffix}`)
    notify("提示词已润色")
  }

  function clearWorkbench() {
    window.clearInterval(timerRef.current)
    setImage(null)
    setPrompt(productRefineDefaultPrompt)
    setModel(productRefineModels[0].name)
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
    setTask({ status: "processing", progress: 10, results: [], error: "" })
    let progress = 10
    timerRef.current = window.setInterval(() => {
      progress = Math.min(progress + 18, 100)
      if (progress >= 100) {
        window.clearInterval(timerRef.current)
        const results = productRefineResultImages.slice(0, Number(count)).map((src, index) => ({
          id: `product-refine-result-${Date.now()}-${index}`,
          src,
          name: `产品微调结果 ${index + 1}`,
        }))
        setTask({ status: "completed", progress: 100, results, error: "" })
        notify("产品微调任务已完成")
      } else {
        setTask((current) => ({ ...current, progress }))
      }
    }, 360)
  }

  function stopTask() {
    window.clearInterval(timerRef.current)
    setTask({ status: "cancelled", progress: 0, results: [], error: "" })
    notify("任务已终止，当前输入已保留")
  }

  function continueHistory(item) {
    setPrompt(item.prompt)
    notify("历史提示词已回填")
  }

  return (
    <>
      <WorkbenchShell
        crumbs={[{ label: "生图工具" }, { label: "产品微调" }]}
        title="产品微调"
        description="针对单张产品图做细节增强、材质修正和商业质感优化。"
        columns="minmax(340px, 3fr) minmax(560px, 7fr)"
        contentClassName="xm-expert-grid"
      >
        <WorkbenchPanel>
          <WorkbenchPanelHead title="微调输入" description="添加一张商品图，可选择整图优化或圈选局部区域。" meta={<StatusBadge status={task.status} />} />
          <WorkbenchScroll>
            <ImageQueueModule
              title="商品原图"
              images={image ? [image] : []}
              max={1}
              limitText="JPG / PNG / WEBP · 单张 20MB 内"
              assetTitle="素材库选择"
              assetSub="个人/团体/公共素材库"
              uploadTitle="本地上传"
              uploadSub="电脑单图上传"
              emptyText="尚未添加待微调图片，请从素材库选择或本地上传。"
              primaryTitle="待微调图片"
              accept="image/jpeg,image/png,image/webp"
              onOpenAssetPicker={() => setAssetPickerOpen(true)}
              onLocalImages={handleLocalImage}
              onRemove={() => loadImage(null)}
              onRefresh={() => setAssetPickerOpen(true)}
              onEditRegion={(index, regionEdit) => setImage((current) => current ? { ...current, regionEdit } : current)}
              onUnavailable={(message) => notify(message || "当前图片暂不支持区域编辑")}
              onPreviewNotify={notify}
            />

            <WorkbenchPromptEditor
              title="微调提示词"
              value={prompt}
              onChange={setPrompt}
              onTemplate={() => setPromptPickerOpen(true)}
              onClear={() => setPrompt("")}
              onPolish={polishPrompt}
              placeholder="描述需要优化的材质、边缘、光影、细节和必须保留的内容"
              helperText={image?.regionEdit ? "已设置局部区域，本次任务只处理选择区域。" : "未设置局部区域时，系统会对整张商品图进行轻量精修。"}
              ariaLabel="产品微调提示词"
            />

            <WorkbenchModule title="生成设置">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <WorkbenchModelSelect value={model} onChange={setModel} options={productRefineModels} label="模型选择" />
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
            {task.status === "processing" ? (
              <WorkbenchButton type="button" variant="ghost" onClick={stopTask} style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                <Ban size={16} />终止任务
              </WorkbenchButton>
            ) : (
              <WorkbenchButton type="button" disabled={!canSubmit} onClick={submitTask}>
                <WandSparkles size={16} />开始微调
              </WorkbenchButton>
            )}
            <WorkbenchButton type="button" variant="ghost" onClick={clearWorkbench}><RotateCcw size={15} />清空重来</WorkbenchButton>
          </div>
        </WorkbenchPanel>

        <WorkbenchPanel>
          <WorkbenchPanelHead title="结果工作台" description="对照原图查看 AI 精修结果，并继续处理最近任务。" meta={<StatusBadge status={task.status} />} />
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
            <ProductRefineResult image={image} task={task} onDownload={() => notify("结果图片已开始下载")} onRetry={submitTask} />
            <WorkbenchRecentHistory
              items={productRefineHistory}
              source="product-refine"
              sourceLabel="产品微调"
              onRefresh={() => notify("历史记录已刷新")}
              onCopy={(text) => { navigator.clipboard?.writeText(text); notify("提示词已复制") }}
              onContinue={continueHistory}
            />
          </div>
        </WorkbenchPanel>
      </WorkbenchShell>

      {assetPickerOpen && (
        <AssetPickerModal
          title={image ? "替换待微调图片" : "选择待微调图片"}
          description="当前一次处理一张商品图。"
          max={1}
          personalAssets={productRefinePersonalAssets}
          teamAssets={productRefineTeamAssets}
          publicAssets={productRefinePublicAssets}
          onClose={() => setAssetPickerOpen(false)}
          onConfirm={(assets) => { if (assets[0]) loadImage(assets[0]); setAssetPickerOpen(false) }}
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

function ProductRefineResult({ image, task, onDownload, onRetry }) {
  return (
    <div className="min-h-0 overflow-y-auto p-4">
      <div className="grid min-h-[300px] gap-3 xl:grid-cols-2">
        <ComparePane title="原图" status={image ? (image.regionEdit ? "已圈选区域" : "整图优化") : "等待上传"}>
          {image ? (
            <SafeImage src={image.src || image.img} alt="产品微调原图" className="h-full max-h-[440px] w-full object-contain" />
          ) : (
            <EmptyCompareState title="请先添加商品图" />
          )}
        </ComparePane>

        <ComparePane title="AI 输出" status={resultStatusText(task)}>
          {task.status === "processing" ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
              <LoaderCircle className="animate-spin text-[var(--brand-primary)]" size={30} />
              <strong className="mt-3 text-sm text-[var(--text-title)]">正在优化商品细节</strong>
              <span className="mt-1 text-xs text-[var(--text-secondary)]">任务进度 {task.progress}%</span>
              <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)] transition-[width]" style={{ width: `${task.progress}%` }} /></div>
            </div>
          ) : task.status === "failed" ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center px-3 text-center">
              <AlertCircle size={30} className="text-[var(--danger)]" />
              <strong className="mt-3 text-sm text-[var(--text-title)]">产品微调失败</strong>
              <span className="mt-1 text-xs text-[var(--text-secondary)]">{task.error || "任务处理异常，请保留当前输入后重试。"}</span>
              <WorkbenchButton type="button" variant="ghost" className="mt-4" onClick={onRetry}>重新提交</WorkbenchButton>
            </div>
          ) : task.status === "cancelled" ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center px-3 text-center">
              <Ban size={28} className="text-[var(--text-disabled)]" />
              <strong className="mt-3 text-sm text-[var(--text-title)]">任务已终止</strong>
              <span className="mt-1 text-xs text-[var(--text-secondary)]">图片、区域和提示词已保留，可调整后再次提交。</span>
              <WorkbenchButton type="button" variant="ghost" className="mt-4" onClick={onRetry}>再次提交</WorkbenchButton>
            </div>
          ) : task.results.length ? (
            <div className="grid h-full gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {task.results.map((result) => (
                <article key={result.id} className="overflow-hidden rounded-lg border bg-[var(--white)]" style={{ borderColor: "var(--border-base)" }}>
                  <SafeImage src={result.src} alt={result.name} className="aspect-square w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <strong className="truncate text-xs text-[var(--text-title)]">{result.name}</strong>
                    <a href={result.src} download onClick={onDownload} className="grid size-8 shrink-0 place-items-center rounded-full border text-[var(--brand-primary)]" style={{ borderColor: "var(--brand-primary-border)" }} title="下载结果" aria-label={`下载${result.name}`}><Download size={14} /></a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyCompareState title="等待生成结果" />
          )}
        </ComparePane>
      </div>
    </div>
  )
}

function ComparePane({ title, status, children }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-[var(--gray-50)]" style={{ borderColor: "var(--border-base)" }}>
      <div className="flex min-h-10 shrink-0 items-center justify-between gap-2 border-b bg-[var(--white)] px-3" style={{ borderColor: "var(--border-light)" }}>
        <strong className="text-sm text-[var(--text-title)]">{title}</strong>
        <span className="text-xs text-[var(--text-secondary)]">{status}</span>
      </div>
      <div className="min-h-0 flex-1 p-2">{children}</div>
    </section>
  )
}

function EmptyCompareState({ title }) {
  return (
    <div className="grid h-full min-h-56 place-items-center rounded-md border border-dashed px-4 text-center text-sm text-[var(--text-disabled)]" style={{ borderColor: "var(--border-base)" }}>
      {title}
    </div>
  )
}

function resultStatusText(task) {
  if (task.status === "processing") return `${task.progress}%`
  if (task.status === "completed") return `${task.results.length} 个结果`
  if (task.status === "failed") return "失败"
  if (task.status === "cancelled") return "已终止"
  return "暂无结果"
}

function StatusBadge({ status }) {
  const meta = status === "processing"
    ? { label: "生成中", bg: "var(--warning-bg)", color: "var(--warning)" }
    : status === "completed"
      ? { label: "已完成", bg: "var(--success-bg)", color: "var(--success)" }
      : status === "failed"
        ? { label: "失败", bg: "var(--danger-bg)", color: "var(--danger)" }
        : status === "cancelled"
          ? { label: "已终止", bg: "var(--gray-100)", color: "var(--text-secondary)" }
          : { label: "未开始", bg: "var(--gray-100)", color: "var(--text-secondary)" }
  return <span className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold" style={{ background: meta.bg, color: meta.color }}>{status === "completed" && <CheckCircle2 size={13} />}{meta.label}</span>
}
