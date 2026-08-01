"use client"

import { useState } from "react"
import { Eye, FolderOpen, PenLine, RefreshCw, Trash2, Upload } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { WorkbenchModule } from "@/components/workbench/Workbench"
import RegionMaskEditor from "@/components/workbench/RegionMaskEditor"
import ImagePreviewModal from "@/components/workbench/ImagePreviewModal"

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
  onEditRegion,
  onUnavailable,
  onPreviewColorPick,
  onPreviewNotify,
}) {
  const count = images.length
  const full = count >= max
  const [previewIndex, setPreviewIndex] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [editorIndex, setEditorIndex] = useState(null)

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
                {image.regionEdit && (
                  <div className="mt-1 text-[10px] font-semibold" style={{ color: "var(--success)" }}>
                    已设置区域 · mask {image.regionEdit.coverage || 0}% · {image.regionEdit.annotations?.length || 0} 条标注
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <IconButton title="查看大图" onClick={() => setPreviewIndex(index)}>
                  <Eye size={14} />
                </IconButton>
                <IconButton title="替换图片" onClick={() => onRefresh ? onRefresh(index) : onOpenAssetPicker?.()}>
                  <RefreshCw size={14} />
                </IconButton>
                {onEditRegion && (
                  <IconButton title="区域编辑" active={Boolean(image.regionEdit)} onClick={() => setEditorIndex(index)}>
                    <PenLine size={14} />
                  </IconButton>
                )}
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
          onColorPick={onPreviewColorPick}
          onNotify={onPreviewNotify}
          onClose={() => setPreviewIndex(null)}
        />
      )}
      {editorIndex !== null && images[editorIndex] && (
        <RegionMaskEditor
          image={images[editorIndex]}
          value={images[editorIndex].regionEdit}
          onUnavailable={onUnavailable}
          onClose={() => setEditorIndex(null)}
          onApply={(regionEdit) => {
            onEditRegion(editorIndex, regionEdit)
            setEditorIndex(null)
          }}
        />
      )}
    </WorkbenchModule>
  )
}

function IconButton({ title, danger = false, active = false, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      className="grid h-8 w-8 place-items-center rounded-md border bg-white transition-colors hover:bg-[var(--bg-hover)]"
      style={active ? { borderColor: "var(--brand-primary)", color: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", color: danger ? "var(--danger)" : "var(--text-secondary)" }}
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
