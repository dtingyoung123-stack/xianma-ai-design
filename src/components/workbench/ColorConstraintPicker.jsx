"use client"

import { useRef, useState } from "react"
import { Check, Copy, Pipette, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function ColorSamplerButton({ onPick, className, title = "吸色", showLabel = false }) {
  const inputRef = useRef(null)
  const [picking, setPicking] = useState(false)

  async function pickColor(event) {
    event.stopPropagation()
    if (!window.EyeDropper) {
      inputRef.current?.click()
      return
    }
    setPicking(true)
    try {
      const result = await new window.EyeDropper().open()
      if (result?.sRGBHex) onPick?.(result.sRGBHex.toUpperCase())
    } catch (error) {
      if (error?.name !== "AbortError") inputRef.current?.click()
    } finally {
      setPicking(false)
    }
  }

  return (
    <>
      <button type="button" title={title} aria-label={title} onClick={pickColor} className={cn("inline-flex h-7 items-center justify-center gap-1 rounded-md border bg-white transition-colors hover:bg-[var(--brand-primary-soft)] disabled:opacity-50", showLabel ? "px-2.5 text-xs font-semibold" : "w-7", className)} style={{ borderColor: "var(--border-base)", color: "var(--brand-primary)" }} disabled={picking}>
        <Pipette size={14} />
        {showLabel && <span>{picking ? "取色中" : title}</span>}
      </button>
      <input ref={inputRef} type="color" aria-label="手动选择颜色" className="sr-only" onChange={(event) => onPick?.(event.target.value.toUpperCase())} />
    </>
  )
}

export function ColorConstraintChips({ colors, onRemove, onNotify }) {
  const [copiedHex, setCopiedHex] = useState(null)

  async function copyHex(hex) {
    try {
      await navigator.clipboard.writeText(hex)
      setCopiedHex(hex)
      onNotify?.(`已复制 ${hex}`)
      window.setTimeout(() => setCopiedHex((value) => value === hex ? null : value), 1600)
    } catch {
      onNotify?.("复制失败，请手动复制色值")
    }
  }

  if (!colors.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2" aria-label="颜色约束">
      {colors.map((color) => (
        <span key={color.hex} className="inline-flex h-8 items-center gap-2 rounded-full border bg-white pl-1.5 pr-1 text-xs font-semibold" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>
          <span className="h-5 w-5 rounded-full border" style={{ background: color.hex, borderColor: "var(--border-base)" }} aria-label={`颜色 ${color.hex}`} />
          <code>{color.hex}</code>
          <button type="button" onClick={() => copyHex(color.hex)} aria-label={`复制颜色 ${color.hex}`} title="复制色值" className="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--gray-100)]" style={{ color: copiedHex === color.hex ? "var(--success)" : "var(--text-secondary)" }}>
            {copiedHex === color.hex ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <button type="button" onClick={() => onRemove?.(color.hex)} aria-label={`删除颜色 ${color.hex}`} className="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--gray-100)]"><X size={12} /></button>
        </span>
      ))}
    </div>
  )
}
