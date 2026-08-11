"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { cn } from "@/lib/utils"

const ratioShapes = {
  "智能比例": { width: 19, height: 26 },
  "1:1": { width: 22, height: 22 },
  "3:2": { width: 27, height: 19 },
  "2:3": { width: 19, height: 27 },
  "16:9": { width: 30, height: 19 },
  "4:3": { width: 27, height: 22 },
  "3:4": { width: 22, height: 27 },
  "9:16": { width: 19, height: 30 },
  "自定义": { width: 24, height: 24 },
}

export function formatImageSize(value, customSize) {
  if (value !== "custom") return value
  const width = Number(customSize?.width)
  const height = Number(customSize?.height)
  return Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0
    ? `${width}×${height}px`
    : "自定义尺寸"
}

export function hasValidImageSize(value, customSize) {
  if (value !== "custom") return true
  const width = Number(customSize?.width)
  const height = Number(customSize?.height)
  return Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0
}

function getPopoverPosition(trigger, preferredWidth, preferredHeight) {
  const rect = trigger?.getBoundingClientRect()
  if (!rect) return null
  const gutter = 16
  const width = Math.min(preferredWidth, window.innerWidth - gutter * 2)
  const preferredMaxHeight = Math.min(preferredHeight, window.innerHeight - gutter * 2)
  const left = Math.min(Math.max(gutter, rect.left), window.innerWidth - width - gutter)
  const below = rect.bottom + 8
  const availableBelow = Math.max(0, window.innerHeight - gutter - below)
  const availableAbove = Math.max(0, rect.top - gutter - 8)
  const placeBelow = availableBelow >= preferredMaxHeight || availableBelow >= availableAbove
  const maxHeight = Math.min(preferredMaxHeight, placeBelow ? availableBelow : availableAbove)
  const verticalAnchor = placeBelow
    ? { top: below }
    : { bottom: window.innerHeight - rect.top + 8 }
  return { ...verticalAnchor, left, width, maxHeight }
}

function useWorkbenchPopover(open, preferredWidth, preferredHeight, onClose) {
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [position, setPosition] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    const update = () => setPosition(getPopoverPosition(triggerRef.current, preferredWidth, preferredHeight))
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [open, preferredHeight, preferredWidth])

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsideClick = (event) => {
      if (triggerRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return
      onClose()
    }
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("click", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("click", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [onClose, open])

  return { triggerRef, panelRef, position: open ? position : null }
}

function ControlTrigger({ label, value, open, onClick, triggerRef, icon }) {
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="flex h-[58px] w-full items-center gap-2 rounded-xl border bg-white px-3 text-left transition-colors hover:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      style={{ borderColor: open ? "var(--brand-primary)" : "var(--border-base)" }}
    >
      {icon}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <strong className="truncate text-[13px]" style={{ color: "var(--text-title)" }}>{value}</strong>
      </span>
      <ChevronDown size={15} className={cn("shrink-0 transition-transform", open && "rotate-180")} style={{ color: "var(--text-disabled)" }} />
    </button>
  )
}

function Popover({ position, panelRef, children }) {
  if (!position || typeof document === "undefined") return null
  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[60] overflow-y-auto rounded-2xl border bg-white p-2.5"
      style={{ ...position, borderColor: "var(--border-base)", boxShadow: "var(--shadow-card-hover)" }}
    >
      {children}
    </div>,
    document.body,
  )
}

export function WorkbenchModelSelect({ value, onChange, options, label = "模型" }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { triggerRef, panelRef, position } = useWorkbenchPopover(open, 416, 416, close)
  const current = options.find((option) => option.name === value) || options[0]

  return (
    <div className="relative min-w-0">
      <ControlTrigger
        triggerRef={triggerRef}
        open={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        label={label}
        value={current?.name || value}
        icon={current?.icon ? <SafeImage src={current.icon} alt="" className="h-7 w-7 shrink-0 rounded-md border bg-white object-contain p-0.5" style={{ borderColor: "var(--border-light)" }} /> : null}
      />
      <Popover position={position} panelRef={panelRef}>
        <div className="mb-1.5 flex justify-between px-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-title)" }}>选择模型</strong>
          <span>{options.length} 个选项</span>
        </div>
        <div className="grid gap-1.5">
          {options.map((option) => {
            const selected = option.name === value
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => { onChange(option.name); setOpen(false) }}
                className="flex w-full items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                style={selected ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)" }}
              >
                {option.icon && <SafeImage src={option.icon} alt="" className="h-[26px] w-[26px] shrink-0 rounded-md border bg-white object-contain p-0.5" style={{ borderColor: "var(--border-light)" }} />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm" style={{ color: "var(--text-title)" }}>{option.name}</strong>
                    {option.eta && <span className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>{option.eta}</span>}
                  </span>
                  {option.desc && <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--text-secondary)" }}>{option.desc}</span>}
                </span>
                {selected && <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>已选</span>}
              </button>
            )
          })}
        </div>
      </Popover>
    </div>
  )
}

export function WorkbenchParameterSelect({ summary, sections, label = "参数", note }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { triggerRef, panelRef, position } = useWorkbenchPopover(open, 416, 576, close)

  return (
    <div className="relative min-w-0">
      <ControlTrigger triggerRef={triggerRef} open={open} onClick={() => setOpen((currentOpen) => !currentOpen)} label={label} value={summary} />
      <Popover position={position} panelRef={panelRef}>
        <div className="space-y-3">
          {sections.map((section) => {
            const customActive = section.custom && section.value === section.custom.value
            const updateCustomDimension = (field, value) => section.custom?.onChange({
              ...section.custom.size,
              [field]: value.replace(/\D/g, ""),
            })

            return (
              <section key={section.key}>
                <h4 className="mb-1.5 text-[13px] font-semibold" style={{ color: "var(--text-title)" }}>{section.label}</h4>
                <div className="grid gap-1 rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${Math.min(section.options.length, section.visual === "ratio" ? 4 : 9)}, minmax(0, 1fr))`, background: "var(--gray-100)" }}>
                  {section.options.map((option) => {
                    const optionValue = typeof option === "object" ? option.value ?? option.label : option
                    const optionLabel = typeof option === "object" ? option.label : option
                    const selected = section.value === optionValue
                    const shape = ratioShapes[optionLabel]
                    return (
                      <button
                        key={optionValue}
                        type="button"
                        onClick={() => section.onChange(optionValue)}
                        className={cn("flex min-h-9 items-center justify-center rounded-lg px-1 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]", section.visual === "ratio" && "min-h-16 flex-col gap-1.5")}
                        style={selected ? { background: "var(--white)", color: "var(--brand-primary)", boxShadow: "var(--shadow-control)" } : { color: "var(--text-secondary)" }}
                      >
                        {section.visual === "ratio" && <span className="block rounded border-2" style={{ width: shape?.width || 28, height: shape?.height || 28, borderColor: selected ? "var(--brand-primary)" : "var(--gray-300)" }} />}
                        <span>{optionLabel}</span>
                      </button>
                    )
                  })}
                </div>
                {customActive && (
                  <div className="mt-2 rounded-xl border p-2.5" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>宽度</span>
                        <input aria-label="自定义宽度" inputMode="numeric" value={section.custom.size.width} onChange={(event) => updateCustomDimension("width", event.target.value)} placeholder="宽" className="h-9 w-full rounded-lg border bg-white px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)", color: "var(--text-title)" }} />
                      </label>
                      <span className="mb-2 text-sm font-semibold" style={{ color: "var(--text-disabled)" }}>×</span>
                      <label className="block">
                        <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>高度</span>
                        <input aria-label="自定义高度" inputMode="numeric" value={section.custom.size.height} onChange={(event) => updateCustomDimension("height", event.target.value)} placeholder="高" className="h-9 w-full rounded-lg border bg-white px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)", color: "var(--text-title)" }} />
                      </label>
                    </div>
                    <p className="mb-0 mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>按平台要求输入像素尺寸</p>
                  </div>
                )}
              </section>
            )
          })}
          {note && <p className="m-0 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{note}</p>}
        </div>
      </Popover>
    </div>
  )
}

export function WorkbenchToast({ message }) {
  if (!message || typeof document === "undefined") return null
  return createPortal(
    <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[130] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full px-4 py-2.5 text-center text-sm font-bold text-white shadow-lg" style={{ background: "var(--gray-900)" }}>
      {message}
    </div>,
    document.body,
  )
}

export function WorkbenchIconButton({ title, active = false, danger = false, className, children, ...props }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-white transition-colors hover:bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-40", className)}
      style={{ borderColor: active ? "var(--brand-primary)" : danger ? "var(--danger)" : "var(--border-base)", color: active ? "var(--brand-primary)" : danger ? "var(--danger)" : "var(--text-body)" }}
      {...props}
    >
      {children}
    </button>
  )
}
