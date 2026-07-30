"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, Download, Eye, FlipHorizontal, FlipVertical, FolderOpen, RefreshCw, Trash2, Upload, X, ZoomIn, ZoomOut } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { WorkbenchModule } from "@/components/workbench/Workbench"

export default function ImageQueueModule({
  title = "图片队列",
  images = [],
  max = 16,
  limitText = "单张 20MB 内",
  assetTitle = "素材库选择",
  assetSub = "个人/公共素材库",
  uploadTitle = "本地上传",
  uploadSub = "电脑多图上传",
  emptyText = "尚未添加商品图片，请先从素材库选择或本地上传。",
  primaryTitle = "图一",
  accept = "image/jpeg,image/png",
  getSrc = (image) => image?.src,
  getName = (image) => image?.name || image?.title || image?.filename || "商品图",
  getSize = (image) => image?.size,
  getKey = (image, index) => image?.id || image?.src || image?.img || image?.filename || index,
  onOpenAssetPicker,
  onLocalImages,
  onRemove,
  onRefresh,
  onReorder,
}) {
  const count = images.length
  const full = count >= max
  const [previewIndex, setPreviewIndex] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)

  function moveImage(fromIndex, toIndex) {
    if (fromIndex === null || fromIndex === toIndex || !onReorder) return
    const nextImages = [...images]
    const [moved] = nextImages.splice(fromIndex, 1)
    nextImages.splice(toIndex, 0, moved)
    onReorder(nextImages)
  }

  return (
    <WorkbenchModule title={title} hint={`${count} / ${max} · ${limitText}`}>
      <div className="grid grid-cols-2 gap-3">
        <UploadAction
          icon={<FolderOpen size={18} />}
          title={assetTitle}
          sub={full ? `已达 ${max} 张上限` : assetSub}
          disabled={full}
          onClick={onOpenAssetPicker}
        />
        <label
          className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:border-[var(--brand-primary)]"
          style={{ borderColor: "var(--border-base)", opacity: full ? 0.6 : 1, pointerEvents: full ? "none" : "auto" }}
        >
          <Upload size={18} style={{ color: "var(--brand-primary)" }} />
          <strong className="text-xs" style={{ color: "var(--text-title)" }}>{uploadTitle}</strong>
          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{full ? `已达 ${max} 张上限` : uploadSub}</span>
          <input type="file" accept={accept} multiple className="sr-only" onChange={onLocalImages} disabled={full} />
        </label>
      </div>

      {images.length ? (
        <div className="mt-3 flex flex-col gap-2">
          {images.map((image, index) => (
            <div
              key={getKey(image, index)}
              draggable={Boolean(onReorder)}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                moveImage(dragIndex, index)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
              className="flex cursor-grab items-center gap-3 rounded-lg border p-2.5 active:cursor-grabbing"
              style={{
                borderColor: dragIndex === index ? "var(--brand-primary)" : "var(--border-light)",
                background: dragIndex === index ? "var(--brand-primary-soft)" : "var(--gray-50)",
              }}
              title={onReorder ? "按住拖拽可调整顺序" : undefined}
            >
              <SafeImage src={getSrc(image)} alt={getName(image)} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold" style={{ color: "var(--text-title)" }}>{index === 0 ? primaryTitle : `图${index + 1}`}</div>
                <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                  {getName(image)}{getSize(image) ? ` · ${getSize(image)}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <IconButton title="查看大图" onClick={() => setPreviewIndex(index)}>
                  <Eye size={14} />
                </IconButton>
                <IconButton title="替换图片" onClick={() => onRefresh ? onRefresh(index) : onOpenAssetPicker?.()}>
                  <RefreshCw size={14} />
                </IconButton>
                <IconButton title="删除" danger onClick={() => onRemove?.(index)}>
                  <Trash2 size={14} />
                </IconButton>
              </div>
            </div>
          ))}
          <div className="text-[11px]" style={{ color: "var(--text-disabled)" }}>
            按住图片行可拖拽调整顺序。
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed px-3 py-6 text-center text-sm" style={{ color: "var(--text-disabled)", borderColor: "var(--border-base)" }}>
          {emptyText}
        </div>
      )}
      {previewIndex !== null && (
        <ImagePreviewModal
          images={images}
          index={previewIndex}
          setIndex={setPreviewIndex}
          getSrc={getSrc}
          getName={getName}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </WorkbenchModule>
  )
}

function IconButton({ title, danger = false, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      className="grid h-8 w-8 place-items-center rounded-md border bg-white transition-colors hover:bg-[var(--bg-hover)]"
      style={{ borderColor: "var(--border-base)", color: danger ? "var(--danger)" : "var(--text-secondary)" }}
    >
      {children}
    </button>
  )
}

function UploadAction({ icon, title, sub, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors hover:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ borderColor: "var(--border-base)" }}
    >
      <span style={{ color: "var(--brand-primary)" }}>{icon}</span>
      <strong className="text-xs" style={{ color: "var(--text-title)" }}>{title}</strong>
      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{sub}</span>
    </button>
  )
}

function ImagePreviewModal({ images, index, setIndex, getSrc, getName, onClose }) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragState, setDragState] = useState(null)
  const [flipX, setFlipX] = useState(false)
  const [flipY, setFlipY] = useState(false)
  const image = images[index]
  const total = images.length

  function go(nextIndex) {
    setScale(1)
    setPan({ x: 0, y: 0 })
    setDragState(null)
    setFlipX(false)
    setFlipY(false)
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
    const delta = event.deltaY > 0 ? -0.12 : 0.12
    updateScale((value) => value + delta)
  }

  function handlePointerDown(event) {
    if (event.target instanceof Element && event.target.closest("button")) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    })
  }

  function handlePointerMove(event) {
    if (!dragState || dragState.pointerId !== event.pointerId) return
    setPan({
      x: dragState.originX + event.clientX - dragState.startX,
      y: dragState.originY + event.clientY - dragState.startY,
    })
  }

  function handlePointerUp(event) {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setDragState(null)
  }

  function downloadCurrentImage() {
    const src = getSrc(image)
    const filename = buildDownloadFilename(getName(image), src, index)
    const link = document.createElement("a")
    link.href = src
    link.download = filename
    link.target = "_blank"
    link.click()
  }

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--overlay-scrim)" }} onClick={onClose}>
      <div className="flex h-[min(86vh,760px)] w-[min(1040px,calc(100vw-40px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border-light)" }}>
          <div className="min-w-0">
            <strong className="block truncate text-sm" style={{ color: "var(--text-title)" }}>{getName(image)}</strong>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{index + 1} / {total} · 滚轮缩放</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PreviewButton title="缩小" onClick={() => updateScale((value) => value - 0.2)}><ZoomOut size={15} /></PreviewButton>
            <span className="w-12 text-center text-xs" style={{ color: "var(--text-secondary)" }}>{Math.round(scale * 100)}%</span>
            <PreviewButton title="放大" onClick={() => updateScale((value) => value + 0.2)}><ZoomIn size={15} /></PreviewButton>
            <PreviewButton title="左右翻转" onClick={() => setFlipX((value) => !value)}><FlipHorizontal size={15} /></PreviewButton>
            <PreviewButton title="上下翻转" onClick={() => setFlipY((value) => !value)}><FlipVertical size={15} /></PreviewButton>
            <PreviewButton title="下载当前图片" onClick={downloadCurrentImage}><Download size={15} /></PreviewButton>
            <PreviewButton title="关闭" onClick={onClose}><X size={16} /></PreviewButton>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden" style={{ background: "var(--gray-900)" }} onWheel={handleWheel}>
          {total > 1 && (
            <>
              <button type="button" onClick={() => go(index - 1)} className="absolute left-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow">
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={() => go(index + 1)} className="absolute right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <div
            className="flex h-full w-full touch-none select-none items-center justify-center overflow-hidden p-8"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: dragState ? "grabbing" : "grab" }}
          >
            <div
              className="grid h-full w-full place-items-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: "center",
              }}
            >
              <SafeImage
                src={getSrc(image)}
                alt={getName(image)}
                className="max-h-full max-w-full object-contain transition-transform"
                style={{
                  transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1}) scale(${scale})`,
                  transformOrigin: "center",
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== "undefined" ? createPortal(content, document.body) : null
}

function buildDownloadFilename(name, src, index) {
  const cleanName = String(name || "")
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim()
  const extension = getImageExtension(src)
  return `${cleanName || `image-${index + 1}`}.${extension}`
}

function getImageExtension(src) {
  const match = String(src || "").split("?")[0].match(/\.([a-zA-Z0-9]+)$/)
  const ext = match?.[1]?.toLowerCase()
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "png"
}

function PreviewButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md border bg-white transition-colors hover:bg-[var(--bg-hover)]"
      style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}
    >
      {children}
    </button>
  )
}
