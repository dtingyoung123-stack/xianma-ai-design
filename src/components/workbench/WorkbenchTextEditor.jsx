"use client"

import { Trash2 } from "lucide-react"
import { WorkbenchModule } from "@/components/workbench/Workbench"
import { cn } from "@/lib/utils"

export default function WorkbenchTextEditor({
  title = "创作内容",
  value,
  onChange,
  onClear,
  toolbar,
  beforeInput,
  afterInput,
  placeholder = "请输入内容",
  helperText,
  rows = 6,
  maxLength,
  ariaLabel = title,
  resize = "none",
}) {
  const textValue = String(value || "")
  const hasContent = Boolean(textValue.trim())
  const countLabel = maxLength ? `${textValue.length} / ${maxLength}` : `${textValue.length} 字`

  return (
    <WorkbenchModule title={title} hint={countLabel}>
      {toolbar && <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5">{toolbar}</div>}
      {beforeInput && <div className="mb-2">{beforeInput}</div>}

      <div className="relative">
        <textarea
          value={textValue}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          maxLength={maxLength}
          aria-label={ariaLabel}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border p-3 pb-12 text-sm leading-6 text-[var(--text-body)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
            resize === "vertical" ? "resize-y" : "resize-none",
          )}
          style={{ borderColor: "var(--border-base)" }}
        />
        <button
          type="button"
          disabled={!hasContent}
          onClick={onClear}
          className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-md border bg-[var(--white)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: "var(--border-base)" }}
        >
          <Trash2 size={13} />
          清空
        </button>
      </div>

      {afterInput && <div className="mt-2">{afterInput}</div>}
      {helperText && <p className="mb-0 mt-2 text-xs leading-5 text-[var(--text-secondary)]">{helperText}</p>}
    </WorkbenchModule>
  )
}

export function WorkbenchTextEditorAction({ icon: Icon, label, onClick, primary = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40",
        primary && "text-[var(--brand-primary)]",
      )}
      style={primary
        ? { borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }
        : { color: "var(--text-body)", borderColor: "var(--border-base)", background: "var(--white)" }}
    >
      {Icon && <Icon size={13} />}
      {label}
    </button>
  )
}
