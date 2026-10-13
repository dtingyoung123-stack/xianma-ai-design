"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowLeft, Plus, MousePointer2, Hand, Undo2, Redo2, Image as ImageIcon, Video, Music, Type, Upload, FolderOpen, Clock3, Maximize2, Minus, X, Copy, Trash2, Search, Play, Download, Check, Workflow } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { resolveCanvasPointerIntent, resolveCanvasSelectionStrategy, applyCanvasSelectionStrategy, createCanvasSelectionBounds, canvasSelectionHitsBounds, worldPoint, wheelViewport } from "./beef-operations.mjs"
import styles from "./beef-canvas.module.css"
import WorkflowPublishDialog from "./WorkflowPublishDialog"
import { useWorkflowStore } from "./workflow-store"

// Page-local candidate, not a new shared canvas framework. Creation menu order,
// empty/list variants and V/H routing adapted from BeefTV v1.5.5 (MIT).
const commands = [
  { id: "text", label: "文本", icon: Type, section: "创作节点" },
  { id: "image", label: "图片", icon: ImageIcon, section: "创作节点" },
  { id: "video", label: "视频", icon: Video, section: "创作节点" },
  { id: "audio", label: "音频", icon: Music, section: "创作节点" },
  { id: "workflow", label: "工作流", icon: Workflow, section: "工作流", disabled: true },
  { id: "upload", label: "上传", icon: Upload, section: "导入资源" },
  { id: "history", label: "从生成历史选择", icon: Clock3, section: "导入资源" },
  { id: "assets", label: "素材库", icon: FolderOpen, section: "导入资源" },
]
const nodeTypes = Object.fromEntries(commands.map((c) => [c.id, c]))
const nodeHeight = 300
const emptyDocument = { nodes: [], edges: [] }
const newId = () => crypto.randomUUID()
const editable = (target) => target.closest("input,textarea,select,[contenteditable=true]")

export default function BeefCanvasPrototype({ project, onExit, onRename }) {
  const workflowStore = useWorkflowStore()
  const linkedTemplate = workflowStore.templates.find(t => t.projectId === project.id)
  const [nodeEditing, setNodeEditing] = useState(null)
  const [nodeName, setNodeName] = useState("")
  const nodeNameCanceled = useRef(false)
  const [publishing, setPublishing] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState("")
  const nameCanceled = useRef(false)
  const [document, setDocument] = useState(emptyDocument)
  const [viewport, setViewport] = useState({ x: 0, y: 0, k: 1 })
  const [selected, setSelected] = useState(new Set())
  const [tool, setTool] = useState("box-select")
  const [menu, setMenu] = useState(null)
  const [query, setQuery] = useState("")
  const [box, setBox] = useState(null)
  const [wire, setWire] = useState(null)
  const [panel, setPanel] = useState(null)
  const [message, setMessage] = useState("")
  const [history, setHistory] = useState({ past: [], future: [] })
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState(true)
  const root = useRef(null)
  const gesture = useRef(null)
  const space = useRef(false)
  const clipboard = useRef(null)
  const fileInput = useRef(null)
  const latest = useRef({})
  const storageKey = `xianma-beef-prototype-v3:${project.id}`
  useLayoutEffect(() => { latest.current = { document, viewport, selected, tool, menu, history, panel, publishing } })

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
    if (!active) return
    try {
      const data = JSON.parse(localStorage.getItem(storageKey))
      if (data?.nodes && data?.edges && data.nodes.every((n) => nodeTypes[n.type] && Number.isFinite(n.x) && Number.isFinite(n.y))) {
        setDocument({ nodes: data.nodes, edges: data.edges })
        if (data.viewport && Number.isFinite(data.viewport.k) && data.viewport.k >= .05 && data.viewport.k <= 2) setViewport(data.viewport)
      }
    } catch { /* Ignore an invalid local demonstration snapshot. */ }
    setReady(true)
    })
    return () => { active = false }
  }, [storageKey])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify({ ...document, viewport })); setSaved(true) }
      catch { setSaved(false) }
    }, 200)
    return () => clearTimeout(timer)
  }, [document, viewport, storageKey, ready])

  useEffect(() => {
    if (!panel) return
    const previous = window.document.activeElement
    const frame = requestAnimationFrame(() => {
      const dialog = root.current?.querySelector("[role=dialog]")
      if (dialog && !dialog.contains(window.document.activeElement)) dialog.querySelector("textarea,button")?.focus()
    })
    return () => { cancelAnimationFrame(frame); if (previous?.isConnected) previous.focus() }
  }, [panel])

  function commit(next, before = latest.current.document) {
    setHistory((h) => ({ past: [...h.past.slice(-49), before], future: [] }))
    setDocument(next)
  }
  function undo(redo = false) {
    const { history: h, document: d } = latest.current
    const stack = redo ? h.future : h.past
    if (!stack.length) return
    setDocument(stack.at(-1))
    setHistory(redo ? { past: [...h.past, d], future: h.future.slice(0, -1) } : { past: h.past.slice(0, -1), future: [...h.future, d] })
    setSelected(new Set())
  }
  function point(event) {
    const rect = root.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }
  function showMenu(at, from = null, nodeId = null) {
    setQuery("")
    const rect = root.current.getBoundingClientRect()
    setMenu({ ...at, left: Math.max(12, Math.min(at.x, rect.width - 260)), top: Math.max(72, Math.min(at.y, rect.height - 530)), world: worldPoint(at, latest.current.viewport), from, nodeId })
  }
  function addNode(type, at = null, from = null, extra = {}) {
    const rect = root.current.getBoundingClientRect()
    const pos = at || worldPoint({ x: rect.width / 2 - 140, y: rect.height / 2 - 150 }, latest.current.viewport)
    const node = { id: newId(), type, x: pos.x, y: pos.y, width: 280, title: nodeTypes[type].label, prompt: "", ...extra }
    const current = latest.current.document
    commit({ nodes: [...current.nodes, node], edges: from ? [...current.edges, { id: newId(), source: from, target: node.id }] : current.edges })
    setSelected(new Set([node.id]))
    setMenu(null)
    return node
  }
  function runCommand(command, position = menu?.world, from = menu?.from) {
    if (command.disabled) return
    if (command.id === "upload") { fileInput.current.click(); setMenu(null); return }
    if (["history", "assets"].includes(command.id)) { setPanel(command.id); setMenu(null); return }
    addNode(command.id, position, from)
  }
  function removeSelection() {
    const { document: d, selected: ids } = latest.current
    if (!ids.size) return
    commit({ nodes: d.nodes.filter((n) => !ids.has(n.id)), edges: d.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)) })
    setSelected(new Set())
  }
  function copySelection() {
    const { document: d, selected: ids } = latest.current
    clipboard.current = { nodes: d.nodes.filter((n) => ids.has(n.id)), edges: d.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) }
  }
  function pasteSelection() {
    const clip = clipboard.current
    if (!clip?.nodes.length) return
    const ids = new Map(clip.nodes.map((n) => [n.id, newId()]))
    const nodes = clip.nodes.map((n) => ({ ...n, id: ids.get(n.id), x: n.x + 40, y: n.y + 40 }))
    const edges = clip.edges.map((e) => ({ ...e, id: newId(), source: ids.get(e.source), target: ids.get(e.target) }))
    const d = latest.current.document
    commit({ nodes: [...d.nodes, ...nodes], edges: [...d.edges, ...edges] })
    setSelected(new Set(nodes.map((n) => n.id)))
  }
  function fit() {
    const nodes = latest.current.document.nodes
    if (!nodes.length) { setViewport({ x: 0, y: 0, k: 1 }); return }
    const rect = root.current.getBoundingClientRect()
    const left = Math.min(...nodes.map((n) => n.x)), top = Math.min(...nodes.map((n) => n.y))
    const w = Math.max(...nodes.map((n) => n.x + n.width)) - left
    const h = Math.max(...nodes.map((n) => n.y + nodeHeight)) - top
    const k = Math.max(.05, Math.min(1, (rect.width - 90) / w, (rect.height - 190) / h))
    setViewport({ k, x: (rect.width - w * k) / 2 - left * k, y: (rect.height - h * k) / 2 - top * k })
  }
  function zoom(factor) {
    const rect = root.current.getBoundingClientRect(), v = latest.current.viewport
    const p = { x: rect.width / 2, y: rect.height / 2 }, world = worldPoint(p, v)
    const k = Math.min(2, Math.max(.05, v.k * factor))
    setViewport({ k, x: p.x - world.x * k, y: p.y - world.y * k })
  }
  // BeefTV's pointer routing: V/blank drag selects; H, Space and middle button pan.
  function pointerDown(event) {
    if (latest.current.publishing) return
    if (event.target.closest("[data-canvas-ui],input,textarea,button,select")) return
    const at = point(event), world = worldPoint(at, viewport)
    const node = event.target.closest("[data-node-id]")
    const intent = resolveCanvasPointerIntent({ ...event, button: event.button, pointerType: event.pointerType, background: !node, boxSelectEnabled: tool === "box-select", spacePressed: space.current, altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey })
    setMenu(null)
    if (intent === "pan") gesture.current = { type: "pan", at, viewport }
    else if (node && event.button === 0) {
      const id = node.dataset.nodeId
      const strategy = resolveCanvasSelectionStrategy(event)
      const ids = strategy === "replace" && selected.has(id) ? selected : applyCanvasSelectionStrategy(selected, [id], strategy)
      setSelected(ids)
      gesture.current = { type: "nodes", at: world, before: document, ids, moved: false }
    } else if (intent === "select") {
      gesture.current = { type: "box", at: world, initial: selected, strategy: resolveCanvasSelectionStrategy(event) }
      setBox(createCanvasSelectionBounds(world.x, world.y, world.x, world.y))
    } else return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event) {
    const g = gesture.current
    if (!g) return
    const p = point(event), v = latest.current.viewport, world = worldPoint(p, v)
    if (g.type === "pan") setViewport({ ...g.viewport, x: g.viewport.x + p.x - g.at.x, y: g.viewport.y + p.y - g.at.y })
    if (g.type === "nodes") {
      const dx = world.x - g.at.x, dy = world.y - g.at.y
      if (Math.abs(dx) + Math.abs(dy) > 2) g.moved = true
      setDocument({ ...g.before, nodes: g.before.nodes.map((n) => g.ids.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n) })
    }
    if (g.type === "resize") setDocument({ ...g.before, nodes: g.before.nodes.map((n) => n.id === g.id ? { ...n, width: Math.max(240, Math.min(600, g.width + world.x - g.at.x)) } : n) })
    if (g.type === "box") {
      const bounds = createCanvasSelectionBounds(g.at.x, g.at.y, world.x, world.y)
      setBox(bounds)
      const hits = latest.current.document.nodes.filter((n) => canvasSelectionHitsBounds(bounds, { left: n.x, top: n.y, right: n.x + n.width, bottom: n.y + nodeHeight }))
      setSelected(applyCanvasSelectionStrategy(g.initial, hits.map((n) => n.id), g.strategy))
    }
    if (g.type === "wire") setWire({ source: g.id, point: world })
  }
  function pointerUp(event) {
    const g = gesture.current
    if (!g) return
    gesture.current = null
    if (g.type === "nodes" && g.moved || g.type === "resize") commit(latest.current.document, g.before)
    if (g.type === "wire") {
      const p = point(event), w = worldPoint(p, latest.current.viewport)
      const target = latest.current.document.nodes.findLast((n) => n.id !== g.id && w.x >= n.x && w.x <= n.x + n.width && w.y >= n.y && w.y <= n.y + nodeHeight)
      if (target) {
        const d = latest.current.document
        if (!d.edges.some((e) => e.source === g.id && e.target === target.id)) commit({ ...d, edges: [...d.edges, { id: newId(), source: g.id, target: target.id }] })
      } else showMenu(p, g.id)
    }
    setBox(null); setWire(null)
  }
  useEffect(() => {
    const element = root.current
    function wheel(event) {
      if (latest.current.publishing) return
      if (event.target.closest("[data-canvas-ui],textarea,select")) return
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      setViewport(wheelViewport(latest.current.viewport, event, { x: event.clientX - rect.left, y: event.clientY - rect.top }))
    }
    function key(event) {
      if (latest.current.publishing) return
      const k = event.key.toLowerCase()
      if (k === "escape") { setMenu(null); setPanel(null); setSelected(new Set()); gesture.current = null; setBox(null); setWire(null); return }
      if (latest.current.panel) {
        if (k === "tab") {
          const items = [...element.querySelectorAll("[role=dialog] button,[role=dialog] textarea,[role=dialog] select")].filter((el) => !el.disabled)
          const first = items[0], last = items.at(-1)
          if (event.shiftKey && window.document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && window.document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
        return
      }
      if (editable(event.target)) return
      if (k === " ") { event.preventDefault(); space.current = true }
      if (k === "escape") { setMenu(null); setPanel(null); setSelected(new Set()); gesture.current = null; setBox(null); setWire(null) }
      if (!event.ctrlKey && !event.metaKey && k === "v") setTool("box-select")
      if (!event.ctrlKey && !event.metaKey && k === "h") setTool("move")
      if (k === "delete" || k === "backspace") { event.preventDefault(); removeSelection() }
      if (event.ctrlKey || event.metaKey) {
        if (["z", "y", "c", "v", "a"].includes(k)) event.preventDefault()
        if (k === "z") undo(event.shiftKey)
        if (k === "y") undo(true)
        if (k === "c") copySelection()
        if (k === "v") pasteSelection()
        if (k === "a") setSelected(new Set(latest.current.document.nodes.map((n) => n.id)))
      }
    }
    function release(event) { if (event.key === " ") space.current = false }
    function blur() { space.current = false; gesture.current = null; setBox(null); setWire(null) }
    element.addEventListener("wheel", wheel, { passive: false })
    window.addEventListener("keydown", key); window.addEventListener("keyup", release); window.addEventListener("blur", blur)
    return () => { element.removeEventListener("wheel", wheel); window.removeEventListener("keydown", key); window.removeEventListener("keyup", release); window.removeEventListener("blur", blur) }
    // Handlers read current state through latest, so subscriptions stay stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateNode(id, patch) {
    const d = latest.current.document
    commit({ ...d, nodes: d.nodes.map((n) => n.id === id ? { ...n, ...patch } : n) })
  }
  function saveNodeName() {
    if (nodeNameCanceled.current) return
    if (!nodeName.trim()) { setMessage("节点名称不能为空"); return }
    nodeNameCanceled.current = true; updateNode(nodeEditing, { title: nodeName.trim() }); setNodeEditing(null)
  }
  function startNameEdit() {
    nameCanceled.current = false
    setNameDraft(project.name)
    setEditingName(true)
  }
  function saveName() {
    if (!nameCanceled.current && nameDraft.trim()) onRename?.(nameDraft.trim())
    setEditingName(false)
  }
  function generate(node) {
    // Deliberately synchronous local result; no backend task or billing.
    updateNode(node.id, { result: node.type === "text" ? node.prompt || "一段新的创作内容" : "/assets/layout-horizontal-5.jpg", generated: true })
  }
  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) { setMessage("请选择 8MB 以内的图片"); return }
    const reader = new FileReader()
    reader.onload = () => addNode("image", null, null, { result: reader.result, title: file.name })
    reader.readAsDataURL(file)
  }
  const selectedNodes = document.nodes.filter((n) => selected.has(n.id))
  const activeNode = document.nodes.find((n) => n.id === panel)
  const visibleCommands = commands.filter((c) => c.label.includes(query.trim()))
  function createMenu(grid = false) {
    return <div className={grid ? styles.emptyMenu : styles.createMenu} data-canvas-ui>
      <header><strong>添加节点</strong>{!grid && <button aria-label="关闭新增菜单" onClick={() => setMenu(null)}><X size={16} /></button>}</header>
      {!grid && <label className={styles.search}><Search size={14} /><input aria-label="搜索节点" placeholder="搜索节点" value={query} onChange={(e) => setQuery(e.target.value)} /></label>}
      {menu?.nodeId && <section><small>节点操作</small><button onClick={() => { copySelection(); pasteSelection(); setMenu(null) }}><Copy size={16} />创建副本</button><button onClick={() => { removeSelection(); setMenu(null) }}><Trash2 size={16} />删除节点</button></section>}
      {["创作节点", "工作流", "导入资源"].map((section) => <section key={section}><small>{section}</small><div className={grid ? styles.commandGrid : ""}>{visibleCommands.filter((c) => c.section === section).map((c) => <button key={c.id} disabled={c.disabled} onClick={() => runCommand(c)}><c.icon size={18} /><span>{c.label}</span>{c.disabled && <small>规划中</small>}</button>)}</div></section>)}
      {!visibleCommands.length && <p>没有匹配的节点</p>}
    </div>
  }
  function path(a, b) {
    const bend = Math.max(60, Math.abs(b.x - a.x) / 2)
    return `M${a.x},${a.y} C${a.x + bend},${a.y} ${b.x - bend},${b.y} ${b.x},${b.y}`
  }
  return <div ref={root} className={styles.canvas} data-tool={tool} data-prototype="beef-v3" onPointerDownCapture={e => { if (nodeEditing !== null && !e.target.closest("[data-node-name-editor]")) saveNodeName() }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = null; setBox(null); setWire(null) }} onDoubleClick={(e) => { if (publishing) return; if (!e.target.closest("[data-node-id],[data-canvas-ui]")) showMenu(point(e)) }} onContextMenu={(e) => { if (publishing) return; if (editable(e.target)) return; e.preventDefault(); if (!e.target.closest("[data-canvas-ui]")) { const id = e.target.closest("[data-node-id]")?.dataset.nodeId; if (id) setSelected(new Set([id])); showMenu(point(e), null, id) } }}>
    <header className={styles.topbar} data-canvas-ui><button onClick={onExit}><ArrowLeft size={16} />返回项目</button>{editingName ? <input className={styles.nameInput} autoFocus maxLength={80} aria-label="项目名称" value={nameDraft} onFocus={(event) => event.target.select()} onChange={(event) => setNameDraft(event.target.value)} onBlur={saveName} onKeyDown={(event) => {
      event.stopPropagation()
      if (event.key === "Enter" && nameDraft.trim()) { event.preventDefault(); saveName() }
      if (event.key === "Escape") { nameCanceled.current = true; setEditingName(false) }
    }} /> : <button className={styles.projectName} aria-label={`修改项目名称：${project.name}`} title="点击修改项目名称" onClick={startNameEdit}><span className={styles.nameText}>{project.name}</span><span className={styles.editNameIcon} aria-hidden>✎</span></button>}<span className={styles.badge}>无限画布 · 原型</span><button onClick={() => setPublishing(true)}><Workflow size={16} />{linkedTemplate ? "更新模板" : "封装为模板"}</button><span className={styles.saved}>{saved ? linkedTemplate ? "画布已保存，已发布模板未更新" : "本地保留" : "仅当前会话"}</span></header>
    {publishing && <WorkflowPublishDialog graph={document} project={project} onClose={() => setPublishing(false)} />}
    <div className={styles.world} style={{ transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.k})` }}>
      <svg className={styles.edges} aria-label="节点连线">{document.edges.map((edge) => {
        const a = document.nodes.find((n) => n.id === edge.source), b = document.nodes.find((n) => n.id === edge.target)
        return a && b ? <path key={edge.id} d={path({ x: a.x + a.width, y: a.y + 150 }, { x: b.x, y: b.y + 150 })} onDoubleClick={(e) => { e.stopPropagation(); commit({ ...document, edges: document.edges.filter((item) => item.id !== edge.id) }) }} /> : null
      })}{wire && (() => { const n = document.nodes.find((n) => n.id === wire.source); return n ? <path d={path({ x: n.x + n.width, y: n.y + 150 }, wire.point)} /> : null })()}</svg>
      {document.nodes.map((node) => {
        const Icon = nodeTypes[node.type].icon
        return <article key={node.id} className={`${styles.node} ${selected.has(node.id) ? styles.selected : ""}`} data-node-id={node.id} style={{ left: node.x, top: node.y, width: node.width }}>
          <div className={styles.nodeTitle}><Icon size={16} />{nodeEditing === node.id ? <input data-node-name-editor className={styles.nameInput} autoFocus aria-label="节点名称" value={nodeName} onPointerDown={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()} onChange={e => setNodeName(e.target.value)} onBlur={saveNodeName} onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); saveNodeName() } if (e.key === "Escape") { nodeNameCanceled.current = true; setNodeEditing(null) } }} /> : <span role="button" tabIndex={0} title="双击修改节点名称" onPointerDown={e => e.stopPropagation()} aria-label={`修改节点名称：${node.title}`} onDoubleClick={e => { e.stopPropagation(); nodeNameCanceled.current = false; setNodeName(node.title); setNodeEditing(node.id) }} onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); nodeNameCanceled.current = false; setNodeName(node.title); setNodeEditing(node.id) } }}>{node.title}</span>}<small>{selected.has(node.id) ? "已选择" : nodeTypes[node.type].label}</small></div>
          <div className={styles.nodeBody}>
            {node.result && node.type === "image" ? <SafeImage src={node.result} alt={node.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className={styles.placeholder}>{node.type === "text" ? <textarea aria-label="文本内容" value={node.prompt} placeholder="输入文本，或编写创作提示词…" onChange={(e) => updateNode(node.id, { prompt: e.target.value })} /> : <><Icon size={36} /><span>{node.generated ? "创作结果已生成" : `开始${nodeTypes[node.type].label}创作`}</span></>}</div>}
          </div>
          <div className={styles.nodeFooter} data-canvas-ui><button onClick={() => { setSelected(new Set([node.id])); setPanel(node.id) }}><Type size={14} />{node.prompt ? "编辑提示词" : "添加提示词"}</button><button className={styles.primary} onClick={() => generate(node)}><Play size={13} />生成</button></div>
          <button className={styles.inputPort} aria-label={`${node.title}输入连接点`} title="拖入连线" />
          <button className={styles.outputPort} aria-label={`${node.title}输出连接点`} title="拖动连线到节点或空白处" onPointerDown={(e) => { e.stopPropagation(); gesture.current = { type: "wire", id: node.id }; setWire({ source: node.id, point: worldPoint(point(e), viewport) }); root.current.setPointerCapture(e.pointerId) }}><Plus size={14} /></button>
          <button className={styles.resize} aria-label={`调整${node.title}宽度`} onPointerDown={(e) => { e.stopPropagation(); gesture.current = { type: "resize", id: node.id, at: worldPoint(point(e), viewport), before: document, width: node.width }; root.current.setPointerCapture(e.pointerId) }} />
        </article>
      })}
      {box && <div className={styles.selectionBox} style={{ left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top }} />}
    </div>
    {ready && !document.nodes.length && <div className={styles.empty} data-canvas-ui><h1>从一个想法开始</h1><p>添加节点，连接内容，开始创作</p>{createMenu(true)}</div>}
    {menu && <div className={styles.menuPosition} style={{ left: menu.left, top: menu.top, maxHeight: `calc(100dvh - ${menu.top + 90}px)` }}>{createMenu()}</div>}
    {selected.size > 0 && <div className={styles.selectionTools} data-canvas-ui><span>已选 {selected.size} 项</span><button title="复制" aria-label="复制选中节点" onClick={() => { copySelection(); pasteSelection() }}><Copy size={16} /></button><button title="删除" aria-label="删除选中节点" onClick={removeSelection}><Trash2 size={16} /></button>{selectedNodes.some((n) => n.result && n.type === "image") && <button aria-label="下载选中图片" onClick={() => { const n = selectedNodes.find((n) => n.result && n.type === "image"); const a = window.document.createElement("a"); a.href = n.result; a.download = `${n.title}.jpg`; a.click() }}><Download size={16} /></button>}</div>}
    <div className={styles.dock} role="toolbar" aria-label="画布主工具栏" data-canvas-ui>
      <button aria-label="移动选择 V" title="移动选择 V" className={tool === "box-select" ? styles.active : ""} onClick={() => setTool("box-select")}><MousePointer2 size={20} /></button>
      <button aria-label="抓手 H" title="抓手 H / 空格拖动" className={tool === "move" ? styles.active : ""} onClick={() => setTool("move")}><Hand size={20} /></button><i />
      <button aria-label="新增节点" title="新增节点" onClick={() => { if (menu) setMenu(null); else { const rect = root.current.getBoundingClientRect(); showMenu({ x: rect.width / 2 - 120, y: rect.height - 490 }) } }}><Plus size={24} /></button>
      <button aria-label="上传图片" title="上传" onClick={() => fileInput.current.click()}><Upload size={20} /></button><button aria-label="素材库" title="素材库" onClick={() => setPanel("assets")}><FolderOpen size={20} /></button><button aria-label="生成历史" title="生成历史" onClick={() => setPanel("history")}><Clock3 size={20} /></button><i />
      <button aria-label="撤销" title="撤销 Ctrl+Z" disabled={!history.past.length} onClick={() => undo()}><Undo2 size={20} /></button><button aria-label="重做" title="重做 Ctrl+Shift+Z" disabled={!history.future.length} onClick={() => undo(true)}><Redo2 size={20} /></button>
    </div>
    <div className={styles.zoom} data-canvas-ui><button aria-label="缩小" onClick={() => zoom(1 / 1.2)}><Minus size={16} /></button><button aria-label="重置缩放" onClick={() => zoom(1 / viewport.k)}>{Math.round(viewport.k * 100)}%</button><button aria-label="放大" onClick={() => zoom(1.2)}><Plus size={16} /></button><button aria-label="适应画布" onClick={fit}><Maximize2 size={16} /></button></div>
    <span className={styles.hint}>双击添加 · 空格拖动画布 · 滚轮缩放 · Shift 多选</span>
    <input ref={fileInput} hidden type="file" accept="image/*" onChange={upload} />
    {panel && <div className={styles.scrim} data-canvas-ui onClick={() => setPanel(null)}><section className={styles.panel} role="dialog" aria-modal="true" aria-label="节点与资源面板" onClick={(e) => e.stopPropagation()}><header><strong>{panel === "assets" ? "素材库" : panel === "history" ? "生成历史" : "创作设置"}</strong><button aria-label="关闭面板" onClick={() => setPanel(null)}><X size={18} /></button></header>
      {["assets", "history"].includes(panel) ? <div className={styles.resourceList}>{panel === "assets" ? <button onClick={() => { addNode("image", null, null, { result: "/assets/layout-horizontal-5.jpg", title: "构图参考" }); setPanel(null) }}><div className={styles.resourceImage}><SafeImage src="/assets/layout-horizontal-5.jpg" alt="构图参考" className="absolute inset-0 h-full w-full object-cover" /></div>构图参考 · 加入画布</button> : document.nodes.filter((n) => n.generated).map((n) => <button key={n.id} onClick={() => { addNode(n.type, null, null, { result: n.result, prompt: n.prompt }); setPanel(null) }}>{n.title} · 加入画布</button>)}{panel === "history" && !document.nodes.some((n) => n.generated) && <p>还没有创作记录，先选择节点生成内容</p>}</div> : activeNode && <><label>提示词<textarea autoFocus aria-label="创作提示词" value={activeNode.prompt} onChange={(e) => updateNode(activeNode.id, { prompt: e.target.value })} placeholder="描述想要的内容和效果…" /></label><label>输出比例<select value={activeNode.ratio || "1:1"} onChange={(e) => updateNode(activeNode.id, { ratio: e.target.value })}><option>1:1</option><option>16:9</option><option>9:16</option></select></label><button className={styles.primary} onClick={() => { generate(activeNode); setPanel(null) }}><Play size={16} />生成内容</button></>}
    </section></div>}
    {message && <button className={styles.toast} onClick={() => setMessage("")} data-canvas-ui><Check size={16} />{message}<X size={14} /></button>}
  </div>
}
