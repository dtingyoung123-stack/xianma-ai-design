"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  Brush, Eraser, Eye, EyeOff, Frame, Hand, MousePointer2, Redo2,
  Sparkles, Square, Trash2, Type, Undo2, X,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"

const EMPTY_DOCUMENT = { maskActions: [], annotations: [] }
const MASK_COLOR = "37, 99, 235"

export default function RegionMaskEditor({ image, value, onApply, onClose, onUnavailable }) {
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)
  const pointerRef = useRef(null)
  const dragTextRef = useRef(null)
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 })
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 })
  const [editorDoc, setEditorDoc] = useState(() => normalizeDocument(value))
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [tool, setTool] = useState("brush")
  const [operation, setOperation] = useState("remove")
  const [brushSize, setBrushSize] = useState(34)
  const [opacity, setOpacity] = useState(0.42)
  const [draft, setDraft] = useState(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [textDialog, setTextDialog] = useState(null)
  const [annotationsVisible, setAnnotationsVisible] = useState(true)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null)

  const imageSrc = image?.src || image?.img
  const imageName = image?.name || image?.title || image?.filename || "参考图片"

  function commit(next) {
    setPast((items) => [...items.slice(-39), cloneDocument(editorDoc)])
    setEditorDoc(next)
    setFuture([])
  }

  function undo() {
    if (!past.length) return
    const previous = past[past.length - 1]
    setFuture((items) => [cloneDocument(editorDoc), ...items].slice(0, 40))
    setPast((items) => items.slice(0, -1))
    setEditorDoc(previous)
  }

  function redo() {
    if (!future.length) return
    const next = future[0]
    setPast((items) => [...items, cloneDocument(editorDoc)].slice(-40))
    setFuture((items) => items.slice(1))
    setEditorDoc(next)
  }

  const fitStage = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !imageSize.width || !imageSize.height) return
    const availableWidth = Math.max(1, viewport.clientWidth - 48)
    const availableHeight = Math.max(1, viewport.clientHeight - 32)
    const scale = Math.min(availableWidth / imageSize.width, availableHeight / imageSize.height)
    setStageSize({ width: Math.round(imageSize.width * scale), height: Math.round(imageSize.height * scale) })
    setPan({ x: 0, y: 0 })
  }, [imageSize.height, imageSize.width])

  useEffect(() => {
    fitStage()
    const observer = new ResizeObserver(fitStage)
    if (viewportRef.current) observer.observe(viewportRef.current)
    return () => observer.disconnect()
  }, [fitStage])

  useEffect(() => {
    const scale = stageSize.width / imageSize.width
    const annotationColor = getComputedStyle(window.document.documentElement).getPropertyValue("--annotation-accent").trim()
    drawOverlay(canvasRef.current, imageSize, editorDoc, draft, {
      annotationColor,
      annotationsVisible,
      scale,
      selectedId: selectedAnnotationId,
    })
  }, [annotationsVisible, editorDoc, draft, imageSize, selectedAnnotationId, stageSize.width])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Escape") return
      if (textDialog) setTextDialog(null)
      else onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, textDialog])

  function pointFromEvent(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: clamp((event.clientX - rect.left) * imageSize.width / rect.width, 0, imageSize.width),
      y: clamp((event.clientY - rect.top) * imageSize.height / rect.height, 0, imageSize.height),
    }
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = pointFromEvent(event)

    if (tool === "move") {
      pointerRef.current = { kind: "pan", x: event.clientX, y: event.clientY, origin: pan }
      return
    }

    if (tool === "text") {
      const scale = stageSize.width / imageSize.width
      const hit = findAnnotation(canvasRef.current, editorDoc.annotations, point, scale)
      if (hit) {
        setSelectedAnnotationId(hit.item.id)
        event.currentTarget.style.cursor = "grabbing"
        dragTextRef.current = {
          id: hit.item.id,
          part: hit.part,
          start: point,
          original: hit.part === "anchor"
            ? { x: hit.item.anchorX, y: hit.item.anchorY }
            : { x: hit.item.x, y: hit.item.y },
          before: cloneDocument(editorDoc),
          moved: false,
        }
      } else {
        setSelectedAnnotationId(null)
        setTextDialog({
          anchorX: point.x,
          anchorY: point.y,
          x: point.x + 28 / scale,
          y: point.y - 14 / scale,
          text: "",
          id: null,
        })
      }
      return
    }

    if (["brush", "eraser"].includes(tool)) {
      const nextDraft = { type: "stroke", erase: tool === "eraser", size: brushSize, opacity, points: [point] }
      pointerRef.current = { kind: "stroke" }
      setDraft(nextDraft)
      return
    }

    if (tool === "rect") {
      pointerRef.current = { kind: "rect", start: point }
      setDraft({ type: "rect", erase: false, opacity, x: point.x, y: point.y, width: 0, height: 0 })
    }
  }

  function handlePointerMove(event) {
    const pointer = pointerRef.current
    if (pointer?.kind === "pan") {
      setPan({ x: pointer.origin.x + event.clientX - pointer.x, y: pointer.origin.y + event.clientY - pointer.y })
      return
    }

    const point = pointFromEvent(event)
    if (dragTextRef.current) {
      const drag = dragTextRef.current
      const dx = point.x - drag.start.x
      const dy = point.y - drag.start.y
      drag.moved = drag.moved || Math.hypot(dx, dy) > 4 * imageSize.width / stageSize.width
      if (!drag.moved) return
      setEditorDoc((current) => ({
        ...current,
        annotations: current.annotations.map((item) => item.id === drag.id
          ? drag.part === "anchor"
            ? { ...item, anchorX: drag.original.x + dx, anchorY: drag.original.y + dy }
            : { ...item, x: drag.original.x + dx, y: drag.original.y + dy }
          : item),
      }))
      return
    }

    if (pointer?.kind === "stroke") {
      setDraft((current) => current ? { ...current, points: [...current.points, point] } : current)
    } else if (pointer?.kind === "rect") {
      setDraft((current) => current ? {
        ...current,
        x: Math.min(pointer.start.x, point.x),
        y: Math.min(pointer.start.y, point.y),
        width: Math.abs(point.x - pointer.start.x),
        height: Math.abs(point.y - pointer.start.y),
      } : current)
    }
  }

  function handlePointerUp(event) {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (dragTextRef.current) {
      const drag = dragTextRef.current
      const item = editorDoc.annotations.find((annotation) => annotation.id === drag.id)
      event.currentTarget.style.cursor = "grab"
      if (drag.moved) {
        setPast((items) => [...items.slice(-39), drag.before])
        setFuture([])
      } else if (item && drag.part === "bubble") {
        setTextDialog({ ...item })
      }
      dragTextRef.current = null
    } else if (draft && isUsefulAction(draft)) {
      commit({ ...editorDoc, maskActions: [...editorDoc.maskActions, draft] })
    }
    pointerRef.current = null
    setDraft(null)
  }

  function saveText() {
    const text = textDialog.text.trim()
    if (!text) return
    const annotationId = textDialog.id || `annotation-${Date.now()}`
    const annotations = textDialog.id
      ? editorDoc.annotations.map((item) => item.id === textDialog.id ? { ...item, text } : item)
      : [...editorDoc.annotations, { id: annotationId, anchorX: textDialog.anchorX, anchorY: textDialog.anchorY, x: textDialog.x, y: textDialog.y, text }]
    commit({ ...editorDoc, annotations })
    setSelectedAnnotationId(annotationId)
    setTextDialog(null)
  }

  function deleteText() {
    if (!textDialog?.id) return
    commit({ ...editorDoc, annotations: editorDoc.annotations.filter((item) => item.id !== textDialog.id) })
    setSelectedAnnotationId(null)
    setTextDialog(null)
  }

  function clearDocument() {
    if (!editorDoc.maskActions.length && !editorDoc.annotations.length) return
    commit(cloneDocument(EMPTY_DOCUMENT))
    setSelectedAnnotationId(null)
  }

  function applyDocument() {
    const maskCanvas = window.document.createElement("canvas")
    maskCanvas.width = imageSize.width
    maskCanvas.height = imageSize.height
    drawMask(maskCanvas.getContext("2d"), editorDoc.maskActions, null)
    const coverage = calculateCoverage(maskCanvas)
    onApply({
      maskActions: editorDoc.maskActions,
      annotations: editorDoc.annotations,
      maskDataUrl: maskCanvas.toDataURL("image/png"),
      coverage,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      updatedAt: Date.now(),
    })
  }

  const toolItems = useMemo(() => [
    { key: "smart", label: "智能选区", icon: Sparkles, unavailable: true },
    { key: "move", label: "移动", icon: Hand },
    { key: "brush", label: "画笔", icon: Brush },
    { key: "eraser", label: "橡皮", icon: Eraser },
    { key: "rect", label: "矩形", icon: Square },
    { key: "text", label: "文本标注", icon: Type },
  ], [])

  const content = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--overlay-scrim)" }}>
      <section className="flex h-[min(88vh,760px)] w-[min(1100px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex h-[66px] shrink-0 items-center justify-between px-4" style={{ background: "var(--gray-900)" }}>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold" style={{ color: "var(--info)" }}>区域编辑</span>
            <strong className="mt-1 block truncate text-sm text-white">{imageName}</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭编辑器" className="grid h-8 w-8 place-items-center rounded-md border text-white" style={{ borderColor: "var(--gray-700)" }}><X size={16} /></button>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[148px] shrink-0 flex-col gap-2 p-3" style={{ background: "var(--gray-900)" }}>
            <div className="grid grid-cols-2 gap-1.5">
              {[{ key: "remove", label: "局部移除" }, { key: "replace", label: "局部替换" }].map((item) => (
                <button key={item.key} type="button" onClick={() => { setOperation(item.key); onUnavailable?.(`${item.label}需接入图像处理 API`) }} className="h-8 rounded-md border text-[11px] font-bold" style={operation === item.key ? { borderColor: "var(--brand-primary)", color: "var(--brand-primary)", background: "var(--info-bg)" } : { borderColor: "var(--gray-700)", color: "var(--gray-200)" }}>{item.label}</button>
              ))}
            </div>

            {toolItems.map(({ key, label, icon: Icon, unavailable }) => (
              <button key={key} type="button" onClick={() => unavailable ? onUnavailable?.("智能选区需接入主体分割 API") : setTool(key)} className="flex h-9 items-center gap-2 rounded-md border px-2.5 text-xs font-medium" style={tool === key ? { borderColor: "var(--brand-primary)", color: "var(--white)", background: "var(--brand-primary)" } : { borderColor: "var(--gray-700)", color: "var(--gray-200)", background: "var(--gray-800)" }}>
                <Icon size={14} /> <span>{label}</span>{unavailable && <span className="ml-auto text-[9px]" style={{ color: "var(--gray-400)" }}>API</span>}
              </button>
            ))}

            <Control label="画笔" value={brushSize} min={8} max={96} onChange={setBrushSize} />
            <Control label="透明度" value={opacity} display={opacity.toFixed(2)} min={0.12} max={0.8} step={0.01} onChange={setOpacity} />

            <div className="grid grid-cols-2 gap-1.5">
              <SmallButton label="撤销" icon={Undo2} disabled={!past.length} onClick={undo} />
              <SmallButton label="重做" icon={Redo2} disabled={!future.length} onClick={redo} />
              <SmallButton label="清空" icon={Trash2} onClick={clearDocument} />
              <SmallButton label="适配" icon={Frame} onClick={fitStage} />
            </div>

            <div className="mt-auto rounded-md border p-2 text-[10px] leading-relaxed" style={{ borderColor: "var(--gray-700)", color: "var(--gray-400)" }}>
              智能选区、局部移除和局部替换将在接入 API 后启用。
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col bg-white">
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b px-3" style={{ borderColor: "var(--border-base)", background: "var(--gray-50)" }}>
              <div className="min-w-0">
                <strong className="block truncate text-sm" style={{ color: "var(--text-title)" }}>{imageName}</strong>
                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{imageSize.width} × {imageSize.height} / mask {calculateActionCoverage(editorDoc.maskActions, imageSize)}% / 羽化 4px</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setAnnotationsVisible((visible) => !visible)} className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium" style={{ borderColor: "var(--border-base)", color: "var(--text-body)", background: "var(--white)" }}>
                  {annotationsVisible ? <Eye size={13} /> : <EyeOff size={13} />}{annotationsVisible ? "隐藏标注" : "显示标注"}
                </button>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}><MousePointer2 size={13} /> 当前：{toolItems.find((item) => item.key === tool)?.label}</span>
              </div>
            </div>

            <div ref={viewportRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden" style={{ background: "var(--gray-100)" }}>
              <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(var(--border-base) 1px, transparent 1px), linear-gradient(90deg, var(--border-base) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              <div className="relative shrink-0 touch-none select-none shadow-lg" style={{ width: stageSize.width, height: stageSize.height, transform: `translate(${pan.x}px, ${pan.y}px)` }}>
                <SafeImage src={imageSrc} alt={imageName} draggable={false} className="absolute inset-0 h-full w-full object-fill" onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth || 1, height: event.currentTarget.naturalHeight || 1 })} />
                <canvas ref={canvasRef} width={imageSize.width} height={imageSize.height} className="absolute inset-0 h-full w-full" style={{ cursor: ["move", "text"].includes(tool) ? "grab" : "crosshair" }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
              </div>
            </div>
          </main>
        </div>

        <footer className="flex h-[60px] shrink-0 items-center justify-between px-4" style={{ background: "var(--gray-900)" }}>
          <div><span className="block text-[10px] font-bold uppercase" style={{ color: "var(--info)" }}>Mask 覆盖</span><strong className="text-sm text-white">{calculateActionCoverage(editorDoc.maskActions, imageSize)}%</strong><span className="ml-3 text-xs" style={{ color: "var(--gray-400)" }}>{editorDoc.annotations.length} 条文本标注</span></div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border px-4 text-sm font-medium text-white" style={{ borderColor: "var(--gray-700)" }}>取消</button>
            <button type="button" onClick={applyDocument} className="h-9 rounded-md px-4 text-sm font-bold text-white" style={{ background: "var(--brand-primary)" }}>应用选区</button>
          </div>
        </footer>
      </section>

      {textDialog && <TextDialog value={textDialog.text} editing={Boolean(textDialog.id)} onChange={(text) => setTextDialog((current) => ({ ...current, text }))} onSave={saveText} onDelete={deleteText} onClose={() => setTextDialog(null)} />}
    </div>
  )

  return typeof document !== "undefined" ? createPortal(content, document.body) : null
}

function Control({ label, value, display = value, min, max, step = 1, onChange }) {
  return <label className="rounded-md border p-2" style={{ borderColor: "var(--gray-700)", background: "var(--gray-800)" }}><span className="mb-1 flex justify-between text-[10px] text-white"><span>{label}</span><strong>{display}</strong></span><input className="w-full accent-[var(--brand-primary)]" type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></label>
}

function SmallButton({ label, icon: Icon, disabled, onClick }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex h-8 items-center justify-center gap-1 rounded-md border text-[10px] text-white disabled:opacity-40" style={{ borderColor: "var(--gray-700)", background: "var(--gray-800)" }}><Icon size={11} />{label}</button>
}

function TextDialog({ value, editing, onChange, onSave, onDelete, onClose }) {
  return <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "var(--black-alpha-30)" }}><div className="w-[min(420px,calc(100vw-32px))] rounded-lg border bg-white p-4 shadow-2xl" style={{ borderColor: "var(--border-base)" }}><div className="mb-3 flex items-center justify-between"><strong style={{ color: "var(--text-title)" }}>{editing ? "编辑文本标注" : "添加文本标注"}</strong><button type="button" onClick={onClose} aria-label="关闭" className="grid h-7 w-7 place-items-center rounded-md hover:bg-[var(--bg-hover)]"><X size={15} /></button></div><input autoFocus value={value} maxLength={80} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && value.trim()) onSave() }} placeholder="输入区域说明" className="h-10 w-full rounded-md border px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /><div className="mt-4 flex justify-between"><div>{editing && <button type="button" onClick={onDelete} className="h-9 rounded-md px-3 text-sm" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>删除标注</button>}</div><div className="flex gap-2"><button type="button" onClick={onClose} className="h-9 rounded-md border px-3 text-sm" style={{ borderColor: "var(--border-base)" }}>取消</button><button type="button" disabled={!value.trim()} onClick={onSave} className="h-9 rounded-md px-4 text-sm font-bold text-white disabled:opacity-40" style={{ background: "var(--brand-primary)" }}>确定</button></div></div></div></div>
}

function normalizeDocument(value) {
  return {
    maskActions: Array.isArray(value?.maskActions) ? value.maskActions : [],
    annotations: Array.isArray(value?.annotations) ? value.annotations.map((item) => ({
      ...item,
      anchorX: item.anchorX ?? item.x,
      anchorY: item.anchorY ?? item.y,
    })) : [],
  }
}

function cloneDocument(value) {
  return { maskActions: value.maskActions.map((item) => ({ ...item, points: item.points?.map((point) => ({ ...point })) })), annotations: value.annotations.map((item) => ({ ...item })) }
}

function drawOverlay(canvas, imageSize, documentValue, draft, annotationOptions) {
  if (!canvas) return
  canvas.width = imageSize.width
  canvas.height = imageSize.height
  const context = canvas.getContext("2d")
  context.clearRect(0, 0, canvas.width, canvas.height)
  drawMask(context, documentValue.maskActions, draft)
  context.globalCompositeOperation = "source-over"
  if (annotationOptions.annotationsVisible) {
    documentValue.annotations.forEach((item) => drawAnnotation(context, item, annotationOptions, imageSize))
  }
}

function drawMask(context, actions, draft) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height)
  ;[...actions, ...(draft ? [draft] : [])].forEach((action) => {
    context.save()
    context.globalCompositeOperation = action.erase ? "destination-out" : "source-over"
    context.globalAlpha = action.erase ? 1 : action.opacity
    context.fillStyle = `rgb(${MASK_COLOR})`
    context.strokeStyle = `rgb(${MASK_COLOR})`
    if (action.type === "stroke") {
      context.lineWidth = action.size
      context.lineCap = "round"
      context.lineJoin = "round"
      context.beginPath()
      action.points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y))
      if (action.points.length === 1) { context.arc(action.points[0].x, action.points[0].y, action.size / 2, 0, Math.PI * 2); context.fill() } else context.stroke()
    } else if (action.type === "rect") context.fillRect(action.x, action.y, action.width, action.height)
    context.restore()
  })
}

function drawAnnotation(context, item, options, imageSize) {
  const layout = getAnnotationLayout(context, item, options.scale, imageSize)
  const lineEndX = clamp(item.anchorX, layout.x, layout.x + layout.width)
  const lineEndY = clamp(item.anchorY, layout.y, layout.y + layout.height)

  context.save()
  context.lineCap = "round"
  context.beginPath()
  context.moveTo(item.anchorX, item.anchorY)
  context.lineTo(lineEndX, lineEndY)
  context.strokeStyle = "#FFFFFF"
  context.lineWidth = 5 / options.scale
  context.stroke()
  context.strokeStyle = options.annotationColor
  context.lineWidth = 2.5 / options.scale
  context.stroke()

  context.beginPath()
  context.arc(item.anchorX, item.anchorY, 6 / options.scale, 0, Math.PI * 2)
  context.fillStyle = "#FFFFFF"
  context.fill()
  context.beginPath()
  context.arc(item.anchorX, item.anchorY, 4 / options.scale, 0, Math.PI * 2)
  context.fillStyle = options.annotationColor
  context.fill()

  context.shadowColor = "rgba(16, 24, 40, 0.28)"
  context.shadowBlur = 8 / options.scale
  context.shadowOffsetY = 2 / options.scale
  context.fillStyle = options.annotationColor
  roundRect(context, layout.x, layout.y, layout.width, layout.height, 7 / options.scale)
  context.fill()
  context.shadowColor = "transparent"
  context.strokeStyle = "#FFFFFF"
  context.lineWidth = (options.selectedId === item.id ? 3 : 2) / options.scale
  context.stroke()

  context.fillStyle = "#FFFFFF"
  context.font = `700 ${layout.fontSize}px sans-serif`
  layout.lines.forEach((line, index) => context.fillText(line, layout.x + layout.paddingX, layout.y + layout.paddingY + layout.fontSize * (index + 0.9)))
  context.restore()
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath(); context.roundRect(x, y, width, height, radius)
}

function getAnnotationLayout(context, item, scale, imageSize) {
  const safeScale = Math.max(scale, 0.01)
  const fontSize = 14 / safeScale
  const paddingX = 10 / safeScale
  const paddingY = 6 / safeScale
  const maxTextWidth = 220 / safeScale
  context.font = `700 ${fontSize}px sans-serif`
  const lines = wrapAnnotationText(context, item.text, maxTextWidth)
  const textWidth = Math.max(...lines.map((line) => context.measureText(line).width))
  const width = Math.max(42 / safeScale, textWidth + paddingX * 2)
  const height = Math.max(28 / safeScale, lines.length * fontSize * 1.2 + paddingY * 2)
  const edge = 6 / safeScale
  const calloutGap = 28 / safeScale
  const preferredX = item.x + width > imageSize.width - edge && item.anchorX - width - calloutGap >= edge
    ? item.anchorX - width - calloutGap
    : item.x
  return {
    x: clamp(preferredX, edge, Math.max(edge, imageSize.width - width - edge)),
    y: clamp(item.y, edge, Math.max(edge, imageSize.height - height - edge)),
    width,
    height,
    fontSize,
    paddingX,
    paddingY,
    lines,
  }
}

function wrapAnnotationText(context, text, maxWidth) {
  const chars = Array.from(String(text || ""))
  const lines = [""]
  chars.forEach((char) => {
    const lineIndex = lines.length - 1
    const candidate = lines[lineIndex] + char
    if (context.measureText(candidate).width <= maxWidth || !lines[lineIndex]) lines[lineIndex] = candidate
    else if (lines.length < 2) lines.push(char)
    else if (!lines[1].endsWith("…")) lines[1] = `${lines[1].slice(0, -1)}…`
  })
  return lines
}

function findAnnotation(canvas, annotations, point, scale) {
  if (!canvas) return null
  const context = canvas.getContext("2d")
  const imageSize = { width: canvas.width, height: canvas.height }
  for (const item of [...annotations].reverse()) {
    const anchorRadius = 11 / Math.max(scale, 0.01)
    if (Math.hypot(point.x - item.anchorX, point.y - item.anchorY) <= anchorRadius) return { item, part: "anchor" }
    const layout = getAnnotationLayout(context, item, scale, imageSize)
    if (point.x >= layout.x && point.x <= layout.x + layout.width && point.y >= layout.y && point.y <= layout.y + layout.height) return { item, part: "bubble" }
  }
  return null
}

function isUsefulAction(action) {
  return action.type === "stroke" ? action.points.length > 0 : action.width > 2 && action.height > 2
}

function calculateCoverage(canvas) {
  const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
  let covered = 0
  for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 12) covered++
  return Number((covered / (canvas.width * canvas.height) * 100).toFixed(1))
}

function calculateActionCoverage(actions, imageSize) {
  if (!actions.length || !imageSize.width || !imageSize.height) return "0"
  let area = 0
  actions.forEach((action) => {
    let nextArea = action.type === "rect" ? action.width * action.height : 0
    if (action.type === "stroke" && action.points?.length) {
      const pathLength = action.points.slice(1).reduce((total, point, index) => {
        const previous = action.points[index]
        return total + Math.hypot(point.x - previous.x, point.y - previous.y)
      }, 0)
      nextArea = pathLength * action.size + Math.PI * (action.size / 2) ** 2
    }
    area += action.erase ? -nextArea : nextArea
  })
  return clamp(area / (imageSize.width * imageSize.height) * 100, 0, 100).toFixed(1)
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }
