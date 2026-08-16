"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clipboard, ExternalLink, PencilLine, RefreshCw } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { cn } from "@/lib/utils"

export default function WorkbenchRecentHistory({
  items = [],
  source,
  sourceLabel,
  onRefresh,
  onCopy,
  onContinue,
  className = "",
}) {
  const [expanded, setExpanded] = useState(false)
  const historyHref = `/history?${new URLSearchParams({ source, sourceLabel }).toString()}`

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-t bg-[var(--gray-50)] lg:border-l lg:border-t-0",
        className,
      )}
      style={{ borderColor: "var(--border-light)" }}
      aria-label={`${sourceLabel}最近三天历史`}
    >
      <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border-light)" }}>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex min-h-9 min-w-0 items-center gap-1.5 text-left lg:pointer-events-none"
          aria-expanded={expanded}
        >
          <strong className="truncate text-sm text-[var(--text-title)]">最近 3 天</strong>
          <span className="text-xs text-[var(--text-secondary)]">{items.length} 条</span>
          {expanded ? <ChevronUp className="lg:hidden" size={14} /> : <ChevronDown className="lg:hidden" size={14} />}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <HistoryIconButton title="刷新历史" onClick={onRefresh}><RefreshCw size={14} /></HistoryIconButton>
          <a
            href={historyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]"
          >
            全部<ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className={cn("min-h-0 flex-1 overflow-y-auto p-2.5", expanded ? "block" : "hidden lg:block")}>
        {items.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {items.map((item) => {
              const status = getHistoryStatus(item.status)
              return (
                <article key={item.id} className="flex min-w-0 gap-2.5 rounded-lg border bg-[var(--white)] p-2.5" style={{ borderColor: "var(--border-light)" }}>
                  <SafeImage src={item.image} alt={`${sourceLabel}历史结果`} className="size-14 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-[var(--text-secondary)]">{item.time}</span>
                      <span className="shrink-0 text-[10px] font-bold" style={{ color: status.color }}>{status.label}</span>
                    </div>
                    <p className="my-1 line-clamp-2 text-[11px] leading-4 text-[var(--text-body)]">{item.prompt}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] text-[var(--text-disabled)]">{item.count || 1} 张 · {item.id}</span>
                      <span className="flex shrink-0 gap-1">
                        <HistoryIconButton title="复制提示词" onClick={() => onCopy?.(item.prompt)}><Clipboard size={12} /></HistoryIconButton>
                        <HistoryIconButton title="继续编辑" onClick={() => onContinue?.(item)}><PencilLine size={12} /></HistoryIconButton>
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center px-4 text-center text-xs leading-5 text-[var(--text-secondary)]">
            最近 3 天暂无历史记录
          </div>
        )}
      </div>
    </aside>
  )
}

function getHistoryStatus(status) {
  if (["processing", "生成中", "处理中"].includes(status)) return { label: "处理中", color: "var(--warning)" }
  if (["failed", "失败"].includes(status)) return { label: "失败", color: "var(--danger)" }
  return { label: status || "已完成", color: "var(--success)" }
}

function HistoryIconButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md border bg-[var(--white)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
      style={{ borderColor: "var(--border-base)" }}
    >
      {children}
    </button>
  )
}
