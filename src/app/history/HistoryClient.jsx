"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Clock3, History, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
import PageShell from "@/components/PageShell"
import { historyRecords, historySources } from "@/data/demo/history"

const parameterLabels = {
  model: "模型",
  resolution: "清晰度",
  ratio: "比例",
  quality: "画质",
  count: "张数",
  language: "语言",
  category: "品类",
  scene: "场景",
}

export default function HistoryClient() {
  const searchParams = useSearchParams()
  const sourceFromUrl = searchParams.get("source") || "all"
  const [source, setSource] = useState(historySources.some((item) => item.value === sourceFromUrl) ? sourceFromUrl : "all")
  const [keyword, setKeyword] = useState("")
  const activeParams = [...searchParams.entries()].filter(([key, value]) => parameterLabels[key] && value)
  const filtered = useMemo(() => historyRecords.filter((record) => {
    const matchesSource = source === "all" || record.source === source
    const text = `${record.id} ${record.title} ${record.summary} ${record.model}`.toLowerCase()
    return matchesSource && (!keyword.trim() || text.includes(keyword.trim().toLowerCase()))
  }), [keyword, source])

  return (
    <PageShell pathname="/history" description="集中查询各工作流的生成任务、参数与结果状态。">
      {sourceFromUrl !== "all" && (
        <section className="mb-4 border px-4 py-3" style={{ borderColor: "var(--border-light)", background: "var(--brand-primary-soft)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm" style={{ color: "var(--text-title)" }}>来自 {searchParams.get("sourceLabel") || "工作流页面"}</strong>
            {activeParams.map(([key, value]) => <span key={key} className="rounded-full border bg-white px-2.5 py-1 text-xs" style={{ borderColor: "var(--border-base)", color: "var(--text-secondary)" }}>{parameterLabels[key]}：{value}</span>)}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="历史记录工具筛选">
          {historySources.map((item) => <button key={item.value} type="button" role="tab" aria-selected={source === item.value} onClick={() => setSource(item.value)} className="h-9 rounded-md border px-3 text-sm font-semibold" style={source === item.value ? { borderColor: "var(--brand-primary)", color: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", color: "var(--text-body)", background: "var(--white)" }}>{item.label}</button>)}
        </div>
        <label className="flex h-9 w-[min(300px,100%)] items-center gap-2 rounded-md border bg-white px-3" style={{ borderColor: "var(--border-base)" }}><Search size={15} style={{ color: "var(--text-disabled)" }} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索任务名称 / ID / 模型" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" /></label>
      </div>

      <section className="mt-4 overflow-x-auto border" style={{ borderColor: "var(--border-light)", background: "var(--white)" }}>
        <div className="grid min-w-[760px] grid-cols-[minmax(0,1.5fr)_minmax(160px,.8fr)_120px_100px] gap-4 border-b px-4 py-2.5 text-xs font-semibold" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)", background: "var(--gray-50)" }}><span>任务</span><span>生成参数</span><span>状态</span><span>时间</span></div>
        {filtered.map((record) => {
          const sourceLabel = historySources.find((item) => item.value === record.source)?.label
          return <article key={record.id} className="grid min-w-[760px] grid-cols-[minmax(0,1.5fr)_minmax(160px,.8fr)_120px_100px] items-center gap-4 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--border-light)" }}><div className="min-w-0"><div className="flex items-center gap-2"><History size={15} style={{ color: "var(--brand-primary)" }} /><strong className="truncate text-sm" style={{ color: "var(--text-title)" }}>{record.title}</strong><span className="shrink-0 text-[11px]" style={{ color: "var(--text-disabled)" }}>{sourceLabel}</span></div><p className="mb-0 mt-1 truncate text-xs" style={{ color: "var(--text-secondary)" }}>{record.id} · {record.summary}</p></div><div className="text-xs"><strong className="block" style={{ color: "var(--text-title)" }}>{record.model}</strong><span style={{ color: "var(--text-secondary)" }}>{record.spec} · {record.count} 张</span></div><span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: record.status === "已完成" ? "var(--success)" : "var(--warning)" }}>{record.status === "已完成" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}{record.status}</span><span className="text-xs" style={{ color: "var(--text-secondary)" }}>{record.time}</span></article>
        })}
        {!filtered.length && <div className="px-6 py-16 text-center text-sm" style={{ color: "var(--text-disabled)" }}>没有符合当前条件的历史任务</div>}
      </section>
    </PageShell>
  )
}
