"use client"

import { useMemo, useRef, useState } from "react"
import {
  ArrowRight, ChevronDown, ChevronUp, Eye, EyeOff,
  Image as ImageIcon, LoaderCircle, MousePointer2, PencilLine, Plus,
  Redo2, ScanText, Sparkles, Trash2, Type, Undo2,
} from "lucide-react"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import SafeImage from "@/components/SafeImage"
import {
  formatImageSize,
  hasValidImageSize,
  WorkbenchIconButton,
  WorkbenchModelSelect,
  WorkbenchParameterSelect,
  WorkbenchToast,
} from "@/components/workbench/WorkbenchControls"
import {
  WorkbenchButton, WorkbenchEmpty, WorkbenchFooter, WorkbenchModule,
  WorkbenchHistoryAction, WorkbenchPanel, WorkbenchPanelHead, WorkbenchScroll, WorkbenchShell,
} from "@/components/workbench/Workbench"
import {
  textEditModels,
  textEditPersonalAssets, textEditPublicAssets, textEditTeamAssets,
} from "@/data/demo/text-edit"

const DEFAULT_PROMPT = "只修改已选择文字区域中的内容，保持商品、背景、版式、Logo、装饰、光影和其他未选区域不变。新文字贴合原字体、字号、颜色、透视与阴影，不增加无关文字或水印。"

export default function TextEditWorkbench() {
  const [image, setImage] = useState(null)
  const [imageRatio, setImageRatio] = useState(1)
  const [layers, setLayers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [recognizing, setRecognizing] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [model, setModel] = useState("GPT Image 2")
  const [resolution, setResolution] = useState("2K")
  const [quality, setQuality] = useState("标准画质")
  const [ratio, setRatio] = useState("智能比例")
  const [customSize, setCustomSize] = useState({ width: "800", height: "800" })
  const [count, setCount] = useState("1")
  const [toast, setToast] = useState("")
  const [showBoxes, setShowBoxes] = useState(true)
  const [generationStatus, setGenerationStatus] = useState("idle")

  const selectedLayer = layers.find((item) => item.id === selectedId) || null
  const changedLayers = layers.filter((item) => item.replacement.trim() && item.replacement.trim() !== item.sourceText.trim())
  const imageSize = formatImageSize(ratio, customSize)
  const generatedPrompt = useMemo(() => {
    const changes = changedLayers.map((item, index) => `${index + 1}. 将“${item.sourceText || "所选区域文字"}”替换为“${item.replacement}”。`)
    return changes.length ? `${DEFAULT_PROMPT}\n\n具体修改：\n${changes.join("\n")}` : DEFAULT_PROMPT
  }, [changedLayers])

  function notify(message) {
    setToast(message)
    window.clearTimeout(notify.timer)
    notify.timer = window.setTimeout(() => setToast(""), 2600)
  }

  function loadImage(nextImage) {
    setImage(nextImage)
    setLayers([])
    setSelectedId(null)
    setHistory([])
    setFuture([])
    setManualMode(false)
    setGenerationStatus("idle")
  }

  function recognizeText(target = image) {
    if (!target) return
    setRecognizing(true)
    window.setTimeout(() => {
      if (target.demoTextLayers?.length) {
        const detected = target.demoTextLayers.map((item) => ({ ...item, visible: true, manual: false }))
        setLayers(detected)
        setSelectedId(detected[0]?.id || null)
        notify(`已识别 ${detected.length} 处文字`)
      } else {
        notify("暂未识别到文字，可使用手动框选补充文字区域")
      }
      setRecognizing(false)
    }, 700)
  }

  function commit(nextLayers, nextSelectedId = selectedId, previousLayers = layers) {
    setHistory((items) => [...items.slice(-29), previousLayers.map((item) => ({ ...item }))])
    setLayers(nextLayers)
    setSelectedId(nextSelectedId)
    setFuture([])
  }

  function updateLayer(id, patch, saveHistory = true) {
    const next = layers.map((item) => item.id === id ? { ...item, ...patch } : item)
    if (saveHistory) commit(next, id)
    else setLayers(next)
  }

  function undo() {
    if (!history.length) return
    const previous = history[history.length - 1]
    setFuture((items) => [layers.map((item) => ({ ...item })), ...items].slice(0, 30))
    setHistory((items) => items.slice(0, -1))
    setLayers(previous)
    if (selectedId && !previous.some((item) => item.id === selectedId)) setSelectedId(previous[0]?.id || null)
  }

  function redo() {
    if (!future.length) return
    const next = future[0]
    setHistory((items) => [...items, layers.map((item) => ({ ...item }))].slice(-30))
    setFuture((items) => items.slice(1))
    setLayers(next)
  }

  function clearAll() {
    setImage(null)
    setLayers([])
    setSelectedId(null)
    setHistory([])
    setFuture([])
    setManualMode(false)
    setGenerationStatus("idle")
  }

  function submitTask() {
    if (!image || !changedLayers.length || generationStatus === "processing") return
    if (!hasValidImageSize(ratio, customSize)) { notify("请填写完整的自定义宽高"); return }
    setGenerationStatus("processing")
    notify("改字任务已提交")
    window.setTimeout(() => {
      setGenerationStatus("completed")
      notify("改字完成，可查看对比结果")
    }, 1200)
  }

  return (
    <>
      <WorkbenchShell
        crumbs={[{ label: "首页" }, { label: "生图工具" }, { label: "一键改字" }]}
        status="原型验证中"
        title="一键改字"
        description="选择图片中的文字逐项替换，未选区域保持不变。"
        columns="minmax(360px, 3fr) minmax(0, 7fr)"
        actions={<><TopActions history={history} future={future} onUndo={undo} onRedo={redo} /><WorkbenchHistoryAction source="text-edit" sourceLabel="一键改字" params={{ model, resolution, quality, ratio: imageSize, count }} /></>}
      >
        <WorkbenchPanel>
          <WorkbenchScroll gap={12}>
            <ImageQueueModule
              title="图片队列"
              images={image ? [image] : []}
              max={1}
              limitText="单张 20MB 内"
              assetTitle="素材库选择"
              assetSub="个人/团体/公共素材库"
              uploadTitle="本地上传"
              uploadSub="电脑单图上传"
              emptyText="尚未添加待改字图片，请先从素材库选择或本地上传。"
              primaryTitle="待改字图片"
              accept="image/jpeg,image/png,image/webp"
              getSrc={(item) => item?.src || item?.img}
              getName={(item) => item?.name || item?.title || item?.filename}
              getSize={(item) => item?.size}
              onOpenAssetPicker={() => setAssetPickerOpen(true)}
              onLocalImages={(event) => {
                const file = event.target.files?.[0]
                if (file) loadImage({ id: `local-${file.lastModified}`, title: file.name, name: file.name, src: URL.createObjectURL(file) })
                event.target.value = ""
              }}
              onRemove={clearAll}
              onRefresh={() => setAssetPickerOpen(true)}
              onPreviewNotify={notify}
            />
            <WorkbenchModule title="文字识别" hint={image ? `${layers.length} 处文字` : "等待图片"}>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={!image || recognizing} onClick={() => recognizeText()} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-bold disabled:opacity-50" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}>
                  {recognizing ? <LoaderCircle className="animate-spin" size={15} /> : <ScanText size={15} />}
                  {recognizing ? "识别中" : "识别全部文字"}
                </button>
                <button type="button" disabled={!image} onClick={() => setManualMode((value) => !value)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-bold disabled:opacity-50" style={manualMode ? { borderColor: "var(--brand-primary)", color: "var(--brand-on-primary)", background: "var(--brand-primary)" } : { borderColor: "var(--border-base)", color: "var(--text-body)", background: "var(--white)" }}>
                  <Plus size={15} />手动框选
                </button>
              </div>
              <p className="mb-0 mt-2 text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                识别遗漏时，可在图片上拖出文字区域进行补充。
              </p>
            </WorkbenchModule>

            <WorkbenchModule title="文字列表" hint={`${changedLayers.length} 项已修改`}>
              {layers.length ? (
                <div className="space-y-2">
                  {layers.map((item, index) => (
                    <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors" style={selectedId === item.id ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-light)", background: "var(--white)" }}>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-black" style={{ background: selectedId === item.id ? "var(--brand-primary)" : "var(--gray-100)", color: selectedId === item.id ? "var(--white)" : "var(--text-secondary)" }}>{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-xs" style={{ color: "var(--text-title)" }}>{item.sourceText || "手动选择区域"}</strong>
                        <span className="block truncate text-[11px]" style={{ color: item.replacement ? "var(--brand-primary)" : "var(--text-disabled)" }}>{item.replacement || "等待输入替换文字"}</span>
                      </span>
                      {!item.visible && <EyeOff size={14} style={{ color: "var(--text-disabled)" }} />}
                    </button>
                  ))}
                </div>
              ) : <div className="rounded-md border border-dashed px-3 py-5 text-center text-xs" style={{ borderColor: "var(--border-base)", color: "var(--text-disabled)" }}>{image ? "识别或手动框选后，文字会显示在这里" : "请先添加一张图片"}</div>}
            </WorkbenchModule>

            <GenerationSettings model={model} setModel={setModel} resolution={resolution} setResolution={setResolution} quality={quality} setQuality={setQuality} ratio={ratio} setRatio={setRatio} customSize={customSize} setCustomSize={setCustomSize} imageSize={imageSize} count={count} setCount={setCount} advancedOpen={advancedOpen} setAdvancedOpen={setAdvancedOpen} prompt={generatedPrompt} />
          </WorkbenchScroll>
          <WorkbenchFooter>
            <WorkbenchButton disabled={!image || !changedLayers.length || generationStatus === "processing"} onClick={submitTask} className="h-[46px] flex-1 rounded-xl">{generationStatus === "processing" ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}{generationStatus === "processing" ? "改字处理中" : "开始改字"}</WorkbenchButton>
            <WorkbenchButton variant="ghost" onClick={clearAll} className="h-[46px] w-[88px] rounded-xl">清空</WorkbenchButton>
          </WorkbenchFooter>
        </WorkbenchPanel>

        <WorkbenchPanel className="min-w-0">
          <WorkbenchPanelHead
            title="文字定位与替换"
            description={manualMode ? "在图片上按住并拖动，补充一个文字区域。" : "点击文字框进行编辑；按住文字框可直接调整位置。"}
            meta={image && <button type="button" onClick={() => setShowBoxes((value) => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold" style={{ borderColor: "var(--border-base)", color: "var(--text-body)", background: "var(--white)" }}>{showBoxes ? <Eye size={14} /> : <EyeOff size={14} />}{showBoxes ? "隐藏选框" : "显示选框"}</button>}
          />
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_286px] xl:overflow-hidden">
            <div className="flex min-h-[360px] min-w-0 items-center justify-center overflow-auto p-4" style={{ background: "var(--gray-100)" }}>
              {image ? (
                <TextCanvas image={image} imageRatio={imageRatio} setImageRatio={setImageRatio} layers={layers} setLayers={setLayers} selectedId={selectedId} setSelectedId={setSelectedId} manualMode={manualMode} setManualMode={setManualMode} showBoxes={showBoxes} commit={commit} notify={notify} />
              ) : (
                <WorkbenchEmpty title="添加图片后开始改字" description="选择素材或加载示例，识别到的文字会在画布上显示为可操作选框。" className="w-[min(420px,90%)]" />
              )}
            </div>
            <Inspector layer={selectedLayer} onChange={updateLayer} onDelete={(id) => commit(layers.filter((item) => item.id !== id), null)} />
          </div>
          <ResultStrip image={image} changedCount={changedLayers.length} status={generationStatus} />
        </WorkbenchPanel>
      </WorkbenchShell>

      {assetPickerOpen && <AssetPickerModal title="选择待改字图片" description="当前一次处理一张图片。" max={1} personalAssets={textEditPersonalAssets} teamAssets={textEditTeamAssets} publicAssets={textEditPublicAssets} onClose={() => setAssetPickerOpen(false)} onConfirm={(assets) => { if (assets[0]) loadImage(assets[0]); setAssetPickerOpen(false) }} />}
      <WorkbenchToast message={toast} />
    </>
  )
}

function TopActions({ history, future, onUndo, onRedo }) {
  return <><WorkbenchIconButton title="撤销" disabled={!history.length} onClick={onUndo}><Undo2 size={15} /></WorkbenchIconButton><WorkbenchIconButton title="恢复" disabled={!future.length} onClick={onRedo}><Redo2 size={15} /></WorkbenchIconButton></>
}

function TextCanvas({ image, imageRatio, setImageRatio, layers, setLayers, selectedId, setSelectedId, manualMode, setManualMode, showBoxes, commit, notify }) {
  const stageRef = useRef(null)
  const pointerRef = useRef(null)
  const [draft, setDraft] = useState(null)

  function getPoint(event) {
    const rect = stageRef.current.getBoundingClientRect()
    return { x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)) }
  }

  function pointerDown(event) {
    if (event.button !== 0) return
    const point = getPoint(event)
    const layerId = event.target.closest("[data-layer-id]")?.dataset.layerId
    event.currentTarget.setPointerCapture?.(event.pointerId)
    if (layerId && !manualMode) {
      const layer = layers.find((item) => item.id === layerId)
      setSelectedId(layerId)
      pointerRef.current = { type: "move", id: layerId, start: point, original: { x: layer.x, y: layer.y }, before: layers.map((item) => ({ ...item })), moved: false }
      return
    }
    if (manualMode) {
      pointerRef.current = { type: "create", start: point }
      setDraft({ x: point.x, y: point.y, width: 0, height: 0 })
    }
  }

  function pointerMove(event) {
    const pointer = pointerRef.current
    if (!pointer) return
    const point = getPoint(event)
    if (pointer.type === "move") {
      const dx = point.x - pointer.start.x
      const dy = point.y - pointer.start.y
      pointer.moved = pointer.moved || Math.hypot(dx, dy) > 0.5
      setLayers((items) => items.map((item) => item.id === pointer.id ? { ...item, x: Math.max(0, Math.min(100 - item.width, pointer.original.x + dx)), y: Math.max(0, Math.min(100 - item.height, pointer.original.y + dy)) } : item))
    } else {
      setDraft({ x: Math.min(pointer.start.x, point.x), y: Math.min(pointer.start.y, point.y), width: Math.abs(point.x - pointer.start.x), height: Math.abs(point.y - pointer.start.y) })
    }
  }

  function pointerUp(event) {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    const pointer = pointerRef.current
    if (pointer?.type === "move" && pointer.moved) {
      const current = layers.map((item) => ({ ...item }))
      commit(current, pointer.id, pointer.before)
    } else if (pointer?.type === "create" && draft?.width > 2 && draft?.height > 2) {
      const id = `manual-${Date.now()}`
      commit([...layers, { id, sourceText: "", replacement: "", visible: true, manual: true, ...draft }], id)
      setManualMode(false)
      notify("已添加文字区域，请填写替换内容")
    }
    pointerRef.current = null
    setDraft(null)
  }

  return <div className="relative max-h-full max-w-full select-none shadow-lg" ref={stageRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} style={{ width: imageRatio >= 1 ? "min(100%, 660px)" : "auto", height: imageRatio < 1 ? "min(100%, 660px)" : "auto", aspectRatio: imageRatio, cursor: manualMode ? "crosshair" : "default", touchAction: "none", background: "var(--white)" }}>
    <SafeImage src={image.src || image.img} alt={image.title || image.name || "待改字图片"} draggable={false} onLoad={(event) => { const node = event.currentTarget; if (node.naturalWidth && node.naturalHeight) setImageRatio(node.naturalWidth / node.naturalHeight) }} className="absolute inset-0 h-full w-full object-fill" />
    {showBoxes && layers.filter((item) => item.visible).map((item, index) => <div key={item.id} data-layer-id={item.id} className="absolute flex items-center justify-center border-2" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, borderColor: selectedId === item.id ? "var(--annotation-accent)" : "var(--brand-primary)", background: selectedId === item.id ? "var(--annotation-accent-soft)" : "var(--brand-primary-soft)", boxShadow: selectedId === item.id ? "0 0 0 2px var(--white), 0 0 0 4px var(--annotation-accent)" : "none", cursor: "move" }}>
      <span className="absolute -left-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black text-white" style={{ background: selectedId === item.id ? "var(--annotation-accent)" : "var(--brand-primary)" }}>{index + 1}</span>
      {item.replacement && <span className="max-w-full truncate rounded-sm px-1 text-[10px] font-black text-white" style={{ background: "var(--annotation-accent)" }}>{item.replacement}</span>}
    </div>)}
    {draft && <div className="absolute border-2 border-dashed" style={{ left: `${draft.x}%`, top: `${draft.y}%`, width: `${draft.width}%`, height: `${draft.height}%`, borderColor: "var(--annotation-accent)", background: "var(--annotation-accent-soft)" }} />}
  </div>
}

function Inspector({ layer, onChange, onDelete }) {
  return <aside className="min-h-0 border-t bg-white p-4 xl:overflow-y-auto xl:border-l xl:border-t-0" style={{ borderColor: "var(--border-light)" }}>
    <div className="mb-4 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-md" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}><Type size={16} /></span><div><strong className="block text-sm" style={{ color: "var(--text-title)" }}>文字属性</strong><span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>逐项确认替换内容</span></div></div>
    {layer ? <div className="space-y-4">
      <Field label="识别到的原文字" hint={layer.manual ? "手动补选" : "OCR 结果"}><input value={layer.sourceText} onChange={(event) => onChange(layer.id, { sourceText: event.target.value })} placeholder="输入该区域原文字" className="h-10 w-full rounded-md border px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /></Field>
      <Field label="替换为" hint="必填"><textarea value={layer.replacement} onChange={(event) => onChange(layer.id, { replacement: event.target.value })} rows={3} placeholder="输入新的文字内容" className="w-full resize-none rounded-md border p-3 text-sm outline-none" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /></Field>
      <div className="rounded-md border p-3 text-xs leading-relaxed" style={{ borderColor: "var(--border-light)", background: "var(--gray-50)", color: "var(--text-secondary)" }}><strong className="mb-1 block" style={{ color: "var(--text-title)" }}>位置</strong>X {layer.x.toFixed(1)}% · Y {layer.y.toFixed(1)}%<br />按住画布中的文字框即可移动。</div>
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => onChange(layer.id, { visible: !layer.visible })} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-bold" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>{layer.visible ? <EyeOff size={14} /> : <Eye size={14} />}{layer.visible ? "隐藏选框" : "显示选框"}</button><button type="button" onClick={() => onDelete(layer.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-xs font-bold" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}><Trash2 size={14} />删除区域</button></div>
    </div> : <div className="rounded-md border border-dashed px-3 py-8 text-center" style={{ borderColor: "var(--border-base)", color: "var(--text-disabled)" }}><MousePointer2 className="mx-auto mb-2" size={24} /><strong className="block text-xs">请选择一个文字框</strong><span className="mt-1 block text-[11px]">选择后可填写替换内容</span></div>}
  </aside>
}

function GenerationSettings({ model, setModel, resolution, setResolution, quality, setQuality, ratio, setRatio, customSize, setCustomSize, imageSize, count, setCount, advancedOpen, setAdvancedOpen, prompt }) {
  return <WorkbenchModule title="生成设置">
    <button type="button" onClick={() => setAdvancedOpen((value) => !value)} className="flex h-9 w-full items-center justify-between rounded-md px-2 text-xs font-bold" style={{ background: "var(--gray-50)", color: "var(--text-body)" }}><span className="inline-flex items-center gap-2"><PencilLine size={14} />高级提示词</span>{advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
    {advancedOpen && <textarea value={prompt} readOnly rows={6} className="mt-2 w-full resize-none rounded-md border p-2.5 text-[11px] leading-relaxed" style={{ borderColor: "var(--border-base)", color: "var(--text-secondary)", background: "var(--gray-50)" }} />}
    <div className="mt-2 grid grid-cols-2 gap-2">
      <WorkbenchModelSelect value={model} onChange={setModel} options={textEditModels} />
      <WorkbenchParameterSelect
        summary={`${resolution} · ${imageSize} · ${quality} · ${count} 张`}
        sections={[
          { key: "resolution", label: "清晰度", value: resolution, options: ["1K", "2K", "4K"], onChange: setResolution },
          { key: "quality", label: "画质", value: quality, options: ["标准画质", "高画质"], onChange: setQuality },
          { key: "ratio", label: "图片尺寸", value: ratio, options: ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16", { value: "custom", label: "自定义" }], onChange: setRatio, visual: "ratio", custom: { value: "custom", size: customSize, onChange: setCustomSize } },
          { key: "count", label: "图片张数", value: count, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], onChange: setCount },
        ]}
      />
    </div>
  </WorkbenchModule>
}

function ResultStrip({ image, changedCount, status }) {
  const outputText = status === "processing" ? "正在生成演示结果" : status === "completed" ? "改字完成" : "等待开始改字"
  return <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-t bg-white px-4 py-3" style={{ borderColor: "var(--border-light)" }}><div className="flex min-w-0 items-center gap-2">{image ? <SafeImage src={image.src || image.img} alt="原图" className="h-11 w-11 rounded-md object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded-md" style={{ background: "var(--gray-100)", color: "var(--text-disabled)" }}><ImageIcon size={18} /></span>}<span className="min-w-0"><strong className="block text-xs" style={{ color: "var(--text-title)" }}>原图</strong><span className="block truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>{image ? `${changedCount} 项文字修改` : "等待上传"}</span></span></div><ArrowRight size={16} style={{ color: "var(--text-disabled)" }} /><div className="flex min-w-0 items-center gap-2">{status === "completed" && image ? <SafeImage src={image.src || image.img} alt="改字结果" className="h-11 w-11 rounded-md object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded-md border border-dashed" style={{ borderColor: "var(--border-base)", color: status === "processing" ? "var(--brand-primary)" : "var(--text-disabled)" }}>{status === "processing" ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}</span>}<span><strong className="block text-xs" style={{ color: "var(--text-title)" }}>AI 输出</strong><span className="text-[11px]" style={{ color: status === "completed" ? "var(--success)" : "var(--text-secondary)" }}>{outputText}</span></span></div></div>
}

function Field({ label, hint, children }) {
  return <label className="block"><span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold" style={{ color: "var(--text-title)" }}>{label}{hint && <em className="not-italic font-normal" style={{ color: "var(--text-secondary)" }}>{hint}</em>}</span>{children}</label>
}
