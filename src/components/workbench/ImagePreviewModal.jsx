"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronLeft, ChevronRight, Copy, Download, FlipHorizontal, FlipVertical, X, ZoomIn, ZoomOut } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { ColorSamplerButton } from "@/components/workbench/ColorConstraintPicker"
import { downloadImage } from "@/lib/image-download"

export default function ImagePreviewModal(props) {
  const image = props.images[props.index]
  return <ImagePreviewContent key={`${props.index}-${props.getSrc(image)}`} {...props} />
}

function ImagePreviewContent({ images, index, setIndex, getSrc, getName, getMime, featureName = "图片", renderHeaderAction, onClose, onColorPick, onNotify }) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragState, setDragState] = useState(null)
  const [flipX, setFlipX] = useState(false)
  const [flipY, setFlipY] = useState(false)
  const [pickedColor, setPickedColor] = useState(null)
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageRetryKey, setImageRetryKey] = useState(0)
  const image = images[index]
  const total = images.length

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
      if (total < 2 || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault()
        setIndex((current) => (current + (event.key === "ArrowLeft" ? -1 : 1) + total) % total)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, setIndex, total])

  function go(nextIndex) {
    setIndex((nextIndex + total) % total)
  }

  function updateScale(updater) {
    setScale((value) => {
      const next = Math.max(0.5, Math.min(4, Number(updater(value).toFixed(2))))
      if (next <= 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  function handleWheel(event) {
    event.preventDefault()
    updateScale((value) => value + (event.deltaY > 0 ? -0.12 : 0.12))
  }

  function handlePointerDown(event) {
    if (event.target instanceof Element && event.target.closest("button")) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragState({ pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y })
  }

  function handlePointerMove(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return
    setPan({ x: dragState.originX + event.clientX - dragState.startX, y: dragState.originY + event.clientY - dragState.startY })
  }

  function handlePointerUp(event) {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setDragState(null)
  }

  async function downloadCurrentImage() {
    try {
      await downloadImage({ src: getSrc(image), name: getName(image), mime: getMime?.(image), featureName, index })
      onNotify?.("图片已开始下载")
    } catch {
      onNotify?.("图片下载失败，请重试")
    }
  }

  async function copyColor(hex, notify = true) {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      if (notify) onNotify?.(`已复制 ${hex}，可直接粘贴`)
      return true
    } catch {
      if (notify) onNotify?.(`已吸取 ${hex}，复制失败，请手动复制`)
      return false
    }
  }

  async function handleColorPick(hex) {
    setPickedColor(hex)
    const colorCopied = await copyColor(hex, !onColorPick)
    onColorPick?.(hex, { copied: colorCopied })
  }

  const content = (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--overlay-scrim)" }} onClick={onClose}>
      <div className="flex h-[min(86vh,760px)] w-[min(1040px,calc(100vw-40px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-light)" }}>
          <div className="min-w-0">
            <strong className="block truncate text-sm" style={{ color: "var(--text-title)" }}>{getName(image)}</strong>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{index + 1} / {total} · 滚轮缩放</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:justify-end">
            {renderHeaderAction?.(image, index)}
            {pickedColor && (
              <button type="button" onClick={() => copyColor(pickedColor)} title="复制色值" aria-label={`复制颜色 ${pickedColor}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2 text-xs font-semibold" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>
                <span className="h-4 w-4 rounded border" style={{ background: pickedColor, borderColor: "var(--border-base)" }} />
                <code>{pickedColor}</code>
                {copied ? <Check size={13} style={{ color: "var(--success)" }} /> : <Copy size={13} />}
              </button>
            )}
            <PreviewButton title="缩小" onClick={() => updateScale((value) => value - 0.2)}><ZoomOut size={15} /></PreviewButton>
            <span className="w-12 text-center text-xs" style={{ color: "var(--text-secondary)" }}>{Math.round(scale * 100)}%</span>
            <PreviewButton title="放大" onClick={() => updateScale((value) => value + 0.2)}><ZoomIn size={15} /></PreviewButton>
            <PreviewButton title="左右翻转" onClick={() => setFlipX((value) => !value)}><FlipHorizontal size={15} /></PreviewButton>
            <PreviewButton title="上下翻转" onClick={() => setFlipY((value) => !value)}><FlipVertical size={15} /></PreviewButton>
            <ColorSamplerButton onPick={handleColorPick} title="吸取图片颜色" className="h-8 w-8" />
            <PreviewButton title="下载当前图片" onClick={downloadCurrentImage}><Download size={15} /></PreviewButton>
            <PreviewButton title="关闭" onClick={onClose}><X size={16} /></PreviewButton>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: "var(--gray-900)" }} onWheel={handleWheel}>
          {total > 1 && (
            <>
              <button type="button" onClick={() => go(index - 1)} title="上一张图片" aria-label="上一张图片" className="absolute left-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:left-4"><ChevronLeft size={20} /></button>
              <button type="button" onClick={() => go(index + 1)} title="下一张图片" aria-label="下一张图片" className="absolute right-3 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:right-4"><ChevronRight size={20} /></button>
            </>
          )}
          <div className="flex h-full w-full touch-none select-none items-center justify-center overflow-hidden p-8" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} style={{ cursor: dragState ? "grabbing" : "grab" }}>
            <div className="grid h-full w-full place-items-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, transformOrigin: "center" }}>
              {!imageError && <SafeImage key={`${getSrc(image)}-${imageRetryKey}`} src={getSrc(image)} alt={getName(image)} onError={() => setImageError(true)} className="max-h-full max-w-full object-contain transition-transform motion-reduce:transition-none" style={{ transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1}) scale(${scale})`, transformOrigin: "center" }} draggable={false} />}
              {imageError && (
                <div className="flex max-w-sm flex-col items-center rounded-lg bg-white p-5 text-center shadow-[var(--shadow-card)]">
                  <strong className="text-sm text-[var(--text-title)]">图片加载失败</strong>
                  <span className="mt-1 text-xs text-[var(--text-secondary)]">可以重试当前图片，或继续切换其他图片。</span>
                  <button type="button" onClick={() => { setImageError(false); setImageRetryKey((value) => value + 1) }} className="mt-3 h-9 rounded-md border px-4 text-xs font-semibold text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--brand-primary-border)" }}>重新加载</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== "undefined" ? createPortal(content, document.body) : null
}

function PreviewButton({ title, onClick, children }) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} className="grid size-9 place-items-center rounded-md border bg-white transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>{children}</button>
}
