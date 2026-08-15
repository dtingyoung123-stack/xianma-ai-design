"use client"

import { Clipboard, Sparkles, Trash2 } from "lucide-react"
import { WorkbenchModule } from "@/components/workbench/Workbench"
import { cn } from "@/lib/utils"

export default function WorkbenchPromptEditor({
  title = "创作指令",
  value,
  view,
  onViewChange,
  onChange,
  onTemplate,
  onClear,
  onPolish,
  placeholder = "请输入提示词",
  helperText,
  rows = 8,
  ariaLabel = title,
}) {
  const hasContent = Boolean(value.trim())

  return (
    <WorkbenchModule title={title} hint={`${value.length} 字`}>
      <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5">
        <div className="flex rounded-lg bg-[var(--gray-100)] p-1" aria-label="提示词显示模式">
          {[
            { id: "edit", label: "编辑" },
            { id: "preview", label: "预览" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={view === item.id}
              onClick={() => onViewChange(item.id)}
              className="h-8 rounded-md px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              style={view === item.id
                ? { background: "var(--white)", color: "var(--brand-primary)", boxShadow: "var(--shadow-control)" }
                : { color: "var(--text-secondary)" }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <PromptAction icon={Clipboard} label="提示词模板" onClick={onTemplate} />
        <PromptAction icon={Sparkles} label="AI 润色" onClick={onPolish} primary />
      </div>

      {view === "edit" ? (
        <div className="relative">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={rows}
            aria-label={ariaLabel}
            placeholder={placeholder}
            className="w-full resize-none rounded-lg border p-3 pb-12 text-sm leading-6 text-[var(--text-body)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            style={{ borderColor: "var(--border-base)" }}
          />
          <button
            type="button"
            disabled={!hasContent}
            onClick={onClear}
            className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ borderColor: "var(--border-base)" }}
          >
            <Trash2 size={13} />
            清空
          </button>
        </div>
      ) : (
        <div className="min-h-48 whitespace-pre-wrap rounded-lg border bg-[var(--gray-50)] p-3 text-sm leading-6 text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}>
          {value || "暂无提示词内容"}
        </div>
      )}

      {helperText && <p className="mb-0 mt-2 text-xs text-[var(--text-secondary)]">{helperText}</p>}
    </WorkbenchModule>
  )
}

function PromptAction({ icon: Icon, label, onClick, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        primary && "text-[var(--brand-primary)]",
      )}
      style={primary
        ? { borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }
        : { color: "var(--text-body)", borderColor: "var(--border-base)", background: "var(--white)" }}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
