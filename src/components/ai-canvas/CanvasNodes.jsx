"use client"

import { useState } from "react"
import { BookOpenText, Download, FileText, Image as ImageIcon, RotateCcw, Search, SlidersHorizontal, WandSparkles } from "lucide-react"
import { Handle, Position } from "@xyflow/react"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"

function NodeFrame({ icon: Icon, title, type, selected, action, children, width = "w-[250px]" }) {
  return (
    <div
      className={`${width} overflow-hidden rounded-[var(--radius-md)] border bg-[var(--gray-800)] text-[var(--brand-on-primary)] shadow-[var(--shadow-card)] transition-colors`}
      style={{ borderColor: selected ? "var(--brand-primary)" : "var(--gray-600)" }}
    >
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-[var(--gray-700)] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={16} className="shrink-0 text-[var(--gray-300)]" />
          <strong className="truncate text-sm font-semibold">{title}</strong>
        </div>
        <div className="flex shrink-0 items-center gap-2">{action}{type && <span className="text-xs text-[var(--gray-400)]">{type}</span>}</div>
      </div>
      {children}
    </div>
  )
}

export function CanvasImageNode({ data, selected }) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeFrame icon={ImageIcon} title={data.title} type="图片" selected={selected}>
        <div className="aspect-[4/3] overflow-hidden bg-[var(--gray-900)]">
          <SafeImage src={data.src} alt={data.title} className="h-full w-full object-cover" />
        </div>
      </NodeFrame>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

export function CanvasTextNode({ id, data, selected }) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeFrame
        icon={FileText}
        title={data.title}
        selected={selected}
        action={(
          <label className="nodrag">
            <span className="sr-only">文本用途</span>
            <select
              value={data.textRole || "reference"}
              onChange={(event) => data.onRoleChange(id, event.target.value)}
              className="h-7 rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-700)] px-2 text-[11px] text-white outline-none focus:border-[var(--brand-primary)]"
            >
              <option value="request">需求</option>
              <option value="reference">补充资料</option>
            </select>
          </label>
        )}
      >
        <label className="sr-only" htmlFor={`canvas-text-${id}`}>文本内容</label>
        <textarea
          id={`canvas-text-${id}`}
          value={data.text}
          onChange={(event) => data.onTextChange(id, event.target.value)}
          maxLength={500}
          rows={5}
          className="nodrag nowheel block w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-[var(--brand-on-primary)] outline-none placeholder:text-[var(--gray-400)] focus-visible:shadow-[inset_0_0_0_2px_var(--brand-primary)]"
          placeholder={data.textRole === "request" ? "输入创作需求" : "输入补充资料"}
        />
      </NodeFrame>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

const fieldClass = "nodrag nowheel min-h-8 w-full rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-900)] px-2 text-xs text-white outline-none focus:border-[var(--brand-primary)] disabled:opacity-50"
const chipSelectClass = "nodrag h-9 min-w-0 appearance-none rounded-full border border-[var(--gray-600)] bg-[var(--gray-700)] px-3 text-xs font-medium text-white outline-none focus:border-[var(--brand-primary)] disabled:opacity-50"

export function CanvasSplitterNode({ id, data, selected }) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const { config, tasks = [], phase = "idle", error, sourceItems = [] } = data
  const planning = phase === "planning"
  const generating = phase === "generating"
  const busy = planning || generating
  const generateLabel = planning ? "正在准备生成" : generating ? "正在生成" : "开始生成"
  const candidates = tasks.flatMap((task) => task.candidates || [])
  const done = candidates.filter((candidate) => candidate.status === "success").length
  const failed = candidates.filter((candidate) => candidate.status === "failed").length
  const configuredDirectionCount = config.directions === "smart" ? null : config.directions
  const directionCount = tasks.length || configuredDirectionCount
  const outputCount = candidates.length || (directionCount ? directionCount * config.perDirection : null)
  const directionSummary = directionCount ? `${directionCount} 个方向 · ${outputCount} 张图` : `智能方向 · 每方向 ${config.perDirection} 张`
  const parameterSummary = config.directions === "smart" ? `智能 · ${config.perDirection}张/方向` : `${config.directions}×${config.perDirection}`
  const set = (key, value) => data.onConfigChange(id, { [key]: value })
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div
        className="relative w-[430px] overflow-hidden rounded-[var(--radius-md)] border bg-[var(--gray-800)] text-[var(--brand-on-primary)] shadow-[var(--shadow-card)] transition-colors"
        style={{ borderColor: selected ? "var(--brand-primary)" : "var(--gray-600)" }}
      >
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--gray-700)] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <WandSparkles size={16} className="shrink-0 text-[var(--brand-primary)]" />
            <strong className="truncate text-sm font-semibold">智能拆分器</strong>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--gray-700)] px-2.5 py-1 text-[11px] text-[var(--gray-300)]">{directionSummary}</span>
        </div>

        <div className="space-y-4 p-4 text-xs">
          <section className="space-y-2" aria-label="参考素材">
            <div className="flex items-center justify-between gap-2"><span className="font-medium">参考素材</span><span className="text-[var(--gray-400)]">{sourceItems.length} 项</span></div>
            <div className="flex min-h-14 flex-wrap gap-2">
              {sourceItems.length > 0 ? sourceItems.map((source) => (
                <div key={source.id} title={source.title} className="flex h-14 max-w-[150px] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-900)] p-1.5">
                  <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--gray-700)] text-[var(--gray-300)]">
                    {source.type === "image" && source.src ? <SafeImage src={source.src} alt="" className="h-full w-full object-cover" /> : <FileText size={16} />}
                  </div>
                  <span className="line-clamp-2 text-[11px] leading-4 text-[var(--gray-300)]">{source.title}</span>
                </div>
              )) : <div className="grid min-h-14 w-full place-items-center rounded-[var(--radius-sm)] border border-dashed border-[var(--gray-600)] text-[var(--gray-400)]">从图片或文本节点拉线接入</div>}
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`splitter-brief-${id}`} className="font-medium">本次拆分要求</label>
              <button type="button" disabled={busy} onClick={() => data.onOpenPromptPicker(id)} className="nodrag inline-flex min-h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2 font-medium text-[var(--brand-primary)] hover:bg-[var(--gray-700)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50"><BookOpenText size={14} />提示词模板</button>
            </div>
            <textarea id={`splitter-brief-${id}`} value={config.brief} onChange={(event) => set("brief", event.target.value)} disabled={busy} rows={4} maxLength={500} placeholder="描述希望拆分并生成的图片内容" className={`${fieldClass} min-h-24 resize-none py-2.5 leading-5`} />
          </section>

          <label className="block space-y-2"><span className="font-medium">全局负面提示词</span><textarea value={config.negative} onChange={(event) => set("negative", event.target.value)} disabled={busy} rows={3} placeholder="不希望出现的内容" className={`${fieldClass} resize-none py-2.5 leading-5`} /></label>

          {advancedOpen && <div className="absolute bottom-[68px] left-4 right-4 z-10 grid grid-cols-2 gap-2 rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-900)] p-3 shadow-[var(--shadow-control)]">
            <label className="space-y-1"><span className="text-[var(--gray-300)]">方向数</span><select value={config.directions} onChange={(event) => set("directions", event.target.value === "smart" ? "smart" : Number(event.target.value))} disabled={busy} className={fieldClass}><option value="smart">智能</option>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} 个</option>)}</select></label>
            <label className="space-y-1"><span className="text-[var(--gray-300)]">每方向张数</span><select value={config.perDirection} onChange={(event) => set("perDirection", Number(event.target.value))} disabled={busy} className={fieldClass}>{[1, 2, 4].map((value) => <option key={value} value={value}>{value} 张</option>)}</select></label>
            <label className="space-y-1"><span className="text-[var(--gray-300)]">比例</span><select value={config.ratio} onChange={(event) => set("ratio", event.target.value)} disabled={busy} className={fieldClass}>{["1:1", "2:3", "4:3", "3:4", "16:9", "9:16", "auto"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="space-y-1"><span className="text-[var(--gray-300)]">分辨率</span><select value={config.resolution} onChange={(event) => set("resolution", event.target.value)} disabled={busy} className={fieldClass}>{["1K", "2K", "4K"].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>}

          {error && <p role="alert" className="text-[var(--danger)]">{error}</p>}
          {phase === "planning" && <p role="status" className="text-[var(--gray-300)]">正在准备方向提示词并生成图片...</p>}
          {["generating", "complete"].includes(phase) && <div className="flex items-center justify-between gap-2"><p role="status" className="text-[var(--gray-300)]">{generating ? "生成中" : "本轮完成"} · 成功 {done}/{candidates.length} · 失败 {failed}</p>{phase === "complete" && done > 0 && <button type="button" onClick={() => data.onDownloadBatch(id)} className="nodrag inline-flex min-h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2 font-medium text-[var(--gray-300)] hover:bg-[var(--gray-700)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"><Download size={14} />下载全部</button>}</div>}

          <div className="flex items-center justify-between gap-2 border-t border-[var(--gray-700)] pt-3">
            <div className="flex min-w-0 flex-wrap gap-2">
              <label><span className="sr-only">生成模型</span><select value={config.model} onChange={(event) => set("model", event.target.value)} disabled={busy} className={`${chipSelectClass} max-w-[145px]`}>{["GPT Image 2", "GPT Image 2.5", "Nano Banana", "Seedream"].map((value) => <option key={value}>{value}</option>)}</select></label>
              <button type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)} className="nodrag inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--gray-600)] bg-[var(--gray-700)] px-3 font-medium text-[var(--gray-200)] hover:bg-[var(--gray-600)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"><SlidersHorizontal size={14} />{config.resolution} · {config.ratio} · {parameterSummary}</button>
            </div>
            <Button className="nodrag nopan size-11 shrink-0 rounded-full p-0" size="icon" title={generateLabel} aria-label={generateLabel} disabled={busy} onClick={(event) => { event.stopPropagation(); data.onGenerate(id) }}><WandSparkles size={18} /></Button>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

export function CanvasResultNode({ id, data, selected }) {
  const task = data.task
  if (!task) return null
  const candidates = task.candidates || []
  const candidate = candidates.find((item) => item.slotIndex === data.activeSlotIndex) || candidates[0]
  if (!candidate) return null
  const version = candidate.versions?.at(-1)
  const src = version?.src || candidate.src
  const candidateControl = candidates.length > 1 ? (
    <label className="nodrag">
      <span className="sr-only">切换候选图</span>
      <select
        value={candidate.slotIndex}
        onChange={(event) => data.onCandidateChange(id, Number(event.target.value))}
        className="h-7 max-w-[118px] rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-700)] px-2 text-[11px] text-white outline-none focus:border-[var(--brand-primary)]"
      >
        {candidates.map((item) => <option key={item.id} value={item.slotIndex}>第 {item.slotIndex + 1} 张 {item.status === "failed" ? "· 失败" : ""}</option>)}
      </select>
    </label>
  ) : <span className="max-w-[110px] truncate text-[11px] text-[var(--gray-300)]">第 1 张</span>
  return (
    <div className="relative w-[240px]">
      <Handle type="target" position={Position.Left} />
      <NodeFrame icon={ImageIcon} title={task.direction} selected={selected} width="w-[240px]" action={candidateControl}>
        <div className="aspect-[4/3] bg-[var(--gray-900)]">
          {candidate.status === "success" && src ? <SafeImage src={src} alt={`${task.title}候选图${candidate.slotIndex + 1}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-3 text-center text-xs text-[var(--gray-300)]">{{ queued: "等待生成", running: "正在生成", failed: "生成失败", planned: "等待确认" }[candidate.status]}</div>}
        </div>
        <div className="nodrag flex items-center justify-between gap-1 p-2 text-xs text-[var(--gray-300)]">
          <span className="min-w-0 truncate">第 {candidate.slotIndex + 1}/{candidates.length} 张 · {task.ratio}{candidate.versions?.length > 1 ? ` · ${candidate.versions.length} 版本` : ""}</span>
          <div className="flex shrink-0 gap-1">
            <button type="button" title="查看与编辑" aria-label="查看与编辑当前候选图" onClick={() => data.onView(id)} className="grid size-8 place-items-center rounded hover:bg-[var(--gray-700)]"><Search size={15} /></button>
            <button type="button" title={candidate.status === "failed" ? "重跑当前候选图" : "重新生成当前候选图"} aria-label={candidate.status === "failed" ? "重跑当前候选图" : "重新生成当前候选图"} disabled={candidate.status === "running" || candidate.status === "queued"} onClick={() => data.onRetry(id, candidate.slotIndex)} className="grid size-8 place-items-center rounded hover:bg-[var(--gray-700)] disabled:opacity-40"><RotateCcw size={15} /></button>
            {candidate.status === "success" && src && <a href={src} download={`${candidate.id}.png`} title="下载当前候选图" aria-label="下载当前候选图" className="grid size-8 place-items-center rounded hover:bg-[var(--gray-700)]"><Download size={15} /></a>}
          </div>
        </div>
      </NodeFrame>
      {data.promptPanel}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
