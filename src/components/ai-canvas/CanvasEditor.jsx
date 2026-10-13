"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUp, BookOpenText, Download, Image as ImageIcon, ImagePlus, Music2, Plus, Scan, Scissors, SlidersHorizontal, SquareStack, Trash2, Type, Video, WandSparkles, X } from "lucide-react"
import { addEdge, Background, Controls, MarkerType, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from "@xyflow/react"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import { canvasDemoAssets, createCanvasDemoGraph } from "@/data/demo/ai-canvas-splitter"
import { initialPrompts } from "@/data/demo/prompts"
import { createStoredZip, sanitizeImageName } from "@/lib/image-download"
import {
  buildDownloadManifest,
  buildSplitTasks,
  collectSplitterInputs,
  defaultSplitterConfig,
  groupTasksByDirection,
  mergeNegativePrompts,
} from "@/lib/ai-canvas-splitter-prototype.mjs"
import { CanvasImageNode, CanvasResultNode, CanvasSplitterNode, CanvasTextNode } from "./CanvasNodes"

const nodeTypes = { image: CanvasImageNode, text: CanvasTextNode, splitter: CanvasSplitterNode, result: CanvasResultNode }
const edgeStyle = { stroke: "var(--brand-primary)", strokeWidth: 2 }
const markerEnd = { type: MarkerType.ArrowClosed, color: "var(--brand-primary)" }
const referenceNodeEntries = [
  { key: "text", label: "文本节点", description: "补充提示词和创作说明", icon: Type },
  { key: "image", label: "图片生成", description: "创建图片生成节点", icon: ImageIcon },
  { key: "video", label: "视频生成", description: "创建视频生成节点", icon: Video },
  { key: "audio", label: "音频参考", description: "添加音频参考节点", icon: Music2 },
  { key: "config", label: "配置节点", description: "模型、尺寸、数量等输入调节", icon: SlidersHorizontal },
  { key: "splitter", label: "智能拆分器", description: "拆解需求并批量生成多个方向", icon: Scissors },
]

export default function CanvasEditor(props) {
  return <ReactFlowProvider><CanvasEditorSurface {...props} /></ReactFlowProvider>
}

function CanvasEditorSurface({ projectId, projectName = "未命名项目" }) {
  const nextId = useRef(1)
  const timers = useRef(new Map())
  const demoFailureUsed = useRef(false)
  const canvasShellRef = useRef(null)
  const initialGraph = useRef(createCanvasDemoGraph(projectId)).current
  const nodesRef = useRef(initialGraph.nodes)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges)
  const [selectedId, setSelectedId] = useState(null)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [viewId, setViewId] = useState(null)
  const [viewVersionIndex, setViewVersionIndex] = useState(0)
  const [promptPickerId, setPromptPickerId] = useState(null)
  const [resultPromptPickerOpen, setResultPromptPickerOpen] = useState(false)
  const [resultParamsOpen, setResultParamsOpen] = useState(false)
  const [nodeMenu, setNodeMenu] = useState(null)
  const [mobileResultIndex, setMobileResultIndex] = useState(0)
  const [editedPrompt, setEditedPrompt] = useState("")
  const [editedModel, setEditedModel] = useState(defaultSplitterConfig.model)
  const [editedRatio, setEditedRatio] = useState(defaultSplitterConfig.ratio)
  const [editedResolution, setEditedResolution] = useState(defaultSplitterConfig.resolution)
  const { fitView, getZoom, screenToFlowPosition, setCenter } = useReactFlow()
  nodesRef.current = nodes

  const selectedNode = nodes.find((node) => node.id === selectedId)
  const viewedNode = nodes.find((node) => node.id === viewId && node.type === "result")
  const viewedTask = getActiveTask(viewedNode)
  const viewedCandidate = getActiveCandidate(viewedNode)
  const viewedVersions = viewedCandidate?.versions || []
  const viewedVersion = viewedVersions[viewVersionIndex] || viewedVersions.at(-1)
  const currentSplitter = nodes.find((node) => node.id === selectedId && node.type === "splitter")
    || nodes.find((node) => node.id === selectedNode?.data.parentSplitter)
    || nodes.find((node) => node.type === "splitter")
  const currentResults = nodes.filter((node) => node.type === "result" && node.data.parentSplitter === currentSplitter?.id)
  const selectedResults = nodes.filter((node) => node.type === "result" && node.selected)

  useEffect(() => () => {
    for (const pending of timers.current.values()) pending.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!viewId) return
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return
      setViewId(null)
      setResultParamsOpen(false)
      setResultPromptPickerOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [viewId])

  useEffect(() => {
    if (!nodeMenu) return
    const onKeyDown = (event) => { if (event.key === "Escape") setNodeMenu(null) }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [nodeMenu])

  useEffect(() => {
    if (!viewedTask || !viewedCandidate) return
    const latestIndex = Math.max(0, viewedCandidate.versions.length - 1)
    const latest = viewedCandidate.versions[latestIndex]
    setViewVersionIndex(latestIndex)
    setEditedPrompt(latest?.prompt || viewedTask.prompt)
    setEditedModel(latest?.model || viewedTask.model)
    setEditedRatio(latest?.ratio || viewedTask.ratio)
    setEditedResolution(latest?.resolution || viewedTask.resolution)
    setResultParamsOpen(false)
  }, [viewedCandidate, viewedTask])

  useEffect(() => {
    let pending
    const refit = () => {
      clearTimeout(pending)
      pending = setTimeout(() => fitView({ nodes: nodesRef.current.filter((node) => node.type !== "result"), padding: 0.12, duration: 0 }), 140)
    }
    window.addEventListener("resize", refit)
    return () => { window.removeEventListener("resize", refit); clearTimeout(pending) }
  }, [fitView])

  const onConnect = useCallback((connection) => {
    if (connection.source !== connection.target) setEdges((current) => addEdge({ ...connection, style: edgeStyle, markerEnd }, current))
  }, [setEdges])

  const onTextChange = useCallback((id, text) => setNodes((current) => current.map((node) =>
    node.id === id ? { ...node, data: { ...node.data, text } } : node)), [setNodes])

  const onTextRoleChange = useCallback((id, textRole) => setNodes((current) => current.map((node) =>
    node.id === id ? { ...node, data: { ...node.data, textRole } } : node)), [setNodes])

  const onConfigChange = useCallback((id, patch) => {
    setNodes((current) => current.map((node) => node.id === id
      ? { ...node, data: { ...node.data, config: { ...node.data.config, ...patch }, error: "" } } : node))
  }, [setNodes])

  const createSplitter = useCallback((sourceId, position) => {
    const source = nodesRef.current.find((node) => node.id === sourceId)
    if (!source || !["image", "text"].includes(source.type)) return
    const id = `splitter-${nextId.current++}`
    setNodes((current) => [...current, {
      id,
      type: "splitter",
      position: position || { x: source.position.x + 330, y: source.position.y },
      data: { config: { ...defaultSplitterConfig }, tasks: [], phase: "idle", error: "" },
    }])
    setEdges((current) => addEdge({ id: `${sourceId}-${id}`, source: sourceId, target: id, style: edgeStyle, markerEnd }, current))
    setSelectedId(id)
    setTimeout(() => {
      if (window.innerWidth < 640) {
        const target = position || { x: source.position.x + 330, y: source.position.y }
        setCenter(target.x + 215, target.y + 330, { zoom: 0.78, duration: 250 })
      } else fitView({ padding: 0.12, duration: 250 })
    }, 120)
  }, [fitView, setCenter, setEdges, setNodes])

  const onConnectEnd = useCallback((event, connectionState) => {
    if (connectionState.isValid || !connectionState.fromNode || !["image", "text"].includes(connectionState.fromNode.type)) return
    const point = "changedTouches" in event ? event.changedTouches[0] : event
    if (!point) return
    const bounds = canvasShellRef.current?.getBoundingClientRect()
    const left = bounds ? point.clientX - bounds.left : point.clientX
    const top = bounds ? point.clientY - bounds.top : point.clientY
    setNodeMenu({
      sourceId: connectionState.fromNode.id,
      flowPosition: screenToFlowPosition({ x: point.clientX, y: point.clientY }),
      left: bounds ? Math.max(12, Math.min(left, bounds.width - 248)) : left,
      top: bounds ? Math.max(12, Math.min(top, bounds.height - 360)) : top,
    })
  }, [screenToFlowPosition])

  function clearTimers(splitterId) {
    timers.current.get(splitterId)?.forEach(clearTimeout)
    timers.current.delete(splitterId)
  }

  function addTimer(splitterId, callback, delay) {
    const list = timers.current.get(splitterId) || []
    list.push(setTimeout(callback, delay))
    timers.current.set(splitterId, list)
  }

  function focusNode(node, zoom = 1) {
    if (!node) return
    setCenter(node.position.x + (node.type === "splitter" ? 215 : 120), node.position.y + (node.type === "splitter" ? 330 : 120), { zoom, duration: 250 })
  }

  function focusNextResult() {
    if (!currentResults.length) return
    focusNode(currentResults[mobileResultIndex % currentResults.length], 1.1)
    setMobileResultIndex((current) => (current + 1) % currentResults.length)
  }

  function updateTask(splitterId, taskId, change) {
    setNodes((current) => current.map((node) => {
      if (node.id === splitterId) return { ...node, data: { ...node.data, tasks: node.data.tasks.map((task) => task.id === taskId ? change(task) : task) } }
      if (node.type === "result" && node.data.parentSplitter === splitterId && node.data.task.id === taskId) {
        return { ...node, data: { ...node.data, task: change(node.data.task) } }
      }
      return node
    }))
  }

  function updateCandidate(splitterId, taskId, slotIndex, change) {
    updateTask(splitterId, taskId, (task) => ({
      ...task,
      candidates: task.candidates.map((candidate) => candidate.slotIndex === slotIndex ? change(candidate, task) : candidate),
    }))
  }

  function requestGeneration(splitterId) {
    const splitter = nodesRef.current.find((node) => node.id === splitterId)
    if (!splitter || ["planning", "generating"].includes(splitter.data.phase)) return
    clearTimers(splitterId)
    setNodes((current) => current.map((node) => node.id === splitterId ? { ...node, data: { ...node.data, phase: "planning", error: "" } } : node))
    addTimer(splitterId, () => {
      const currentSplitterNode = nodesRef.current.find((node) => node.id === splitterId)
      if (!currentSplitterNode) return
      const linked = edges.filter((edge) => edge.target === splitterId)
        .map((edge) => nodesRef.current.find((node) => node.id === edge.source))
        .filter(Boolean)
      try {
        const inputs = collectSplitterInputs({
          config: currentSplitterNode.data.config,
          textSources: linked.filter((node) => node.type === "text"),
          imageSources: linked.filter((node) => node.type === "image"),
        })
        const tasks = buildSplitTasks({ config: currentSplitterNode.data.config, ...inputs, batchId: `batch-${nextId.current++}` })
        startGeneration(splitterId, tasks, inputs)
      } catch (error) {
        setNodes((current) => current.map((node) => node.id === splitterId ? { ...node, data: { ...node.data, phase: node.data.tasks.length ? "complete" : "idle", error: error.message } } : node))
      }
    }, 520)
  }

  function scheduleCandidate(splitterId, task, candidate, delay, fail, onLast, resultSrc) {
    addTimer(splitterId, () => updateCandidate(splitterId, task.id, candidate.slotIndex, (item) => ({ ...item, status: "running" })), delay)
    addTimer(splitterId, () => {
      updateCandidate(splitterId, task.id, candidate.slotIndex, (item) => {
        const attempt = item.attempts + 1
        const status = fail ? "failed" : "success"
        return {
          ...item,
          status,
          attempts: attempt,
          ...(fail ? {} : { src: resultSrc }),
          history: [...item.history, { attempt, status, prompt: task.prompt }],
          versions: fail ? item.versions : [...item.versions, createVersion(task, item, attempt, resultSrc)],
        }
      })
      if (onLast) setNodes((current) => current.map((node) => node.id === splitterId ? { ...node, data: { ...node.data, phase: "complete" } } : node))
    }, delay + 360)
  }

  function startGeneration(splitterId, tasks, inputSnapshot) {
    const splitter = nodesRef.current.find((node) => node.id === splitterId)
    if (!splitter || !tasks.length) return
    clearTimers(splitterId)
    const queuedTasks = tasks.map((task) => ({
      ...task,
      candidates: task.candidates.map((candidate) => ({ ...candidate, status: "queued" })),
    }))
    const groups = groupTasksByDirection(queuedTasks)
    const previousResultCount = nodesRef.current.filter((node) => node.type === "result" && node.data.parentSplitter === splitterId).length
    const resultNodes = groups.map((group, index) => ({
      id: `result-${queuedTasks[0].batchId}-direction-${group.directionIndex}`,
      type: "result",
      position: { x: splitter.position.x + 515 + ((previousResultCount + index) % 4) * 270, y: splitter.position.y + Math.floor((previousResultCount + index) / 4) * 285 },
      data: { task: group.task, activeSlotIndex: 0, parentSplitter: splitterId, batchId: queuedTasks[0].batchId },
    }))
    setNodes((current) => [
      ...current.map((node) => node.id === splitterId ? { ...node, data: { ...node.data, tasks: queuedTasks, inputSnapshot, phase: "generating", error: "" } } : node),
      ...resultNodes,
    ])
    setEdges((current) => [...current, ...resultNodes.map((node) => ({ id: `output-${splitterId}-${node.id}`, source: splitterId, target: node.id, style: edgeStyle, markerEnd }))])

    const queuedCandidates = queuedTasks.flatMap((task) => task.candidates.map((candidate) => ({ task, candidate })))
    const shouldFailOne = !demoFailureUsed.current && queuedCandidates.length >= 6
    demoFailureUsed.current = demoFailureUsed.current || shouldFailOne
    queuedCandidates.forEach(({ task, candidate }, index) => scheduleCandidate(
      splitterId,
      task,
      candidate,
      index * 260 + 120,
      shouldFailOne && index === queuedCandidates.length - 1,
      index === queuedCandidates.length - 1,
      canvasDemoAssets[(task.directionIndex + candidate.slotIndex) % canvasDemoAssets.length].src,
    ))
    setTimeout(() => fitView({ padding: 0.14, duration: 250 }), 140)
  }

  function retry(resultId, slotIndex, overrides = {}) {
    const result = nodesRef.current.find((node) => node.id === resultId && node.type === "result")
    const task = result?.data.task
    const candidate = task?.candidates.find((item) => item.slotIndex === slotIndex)
    if (!result || !task || !candidate || !["success", "failed"].includes(candidate.status)) return
    const options = typeof overrides === "string" ? { prompt: overrides } : overrides
    const latestVersion = candidate.versions.at(-1)
    const params = {
      prompt: options.prompt?.trim() || latestVersion?.prompt || task.prompt,
      model: options.model || latestVersion?.model || task.model,
      ratio: options.ratio || latestVersion?.ratio || task.ratio,
      resolution: options.resolution || latestVersion?.resolution || task.resolution,
    }
    updateCandidate(result.data.parentSplitter, task.id, candidate.slotIndex, (item) => ({
      ...item,
      status: "running",
    }))
    const nextSrc = canvasDemoAssets[(task.directionIndex + candidate.slotIndex + candidate.attempts + 1) % canvasDemoAssets.length].src
    addTimer(result.data.parentSplitter, () => updateCandidate(result.data.parentSplitter, task.id, candidate.slotIndex, (item) => {
      const attempt = item.attempts + 1
      return {
        ...item,
        status: "success",
        attempts: attempt,
        src: nextSrc,
        history: [...item.history, { attempt, status: "success", prompt: params.prompt }],
        versions: [...item.versions, createVersion(task, item, attempt, nextSrc, params)],
      }
    }), 650)
  }

  function changeResultCandidate(resultId, slotIndex) {
    setNodes((current) => current.map((node) => node.id === resultId ? { ...node, data: { ...node.data, activeSlotIndex: slotIndex } } : node))
  }

  function openResult(id) {
    const result = nodesRef.current.find((node) => node.id === id && node.type === "result")
    if (!result) return
    setViewId(id)
    setResultParamsOpen(false)
    const zoom = window.innerWidth < 640 ? 0.68 : Math.min(Math.max(getZoom(), 0.78), 1)
    setTimeout(() => setCenter(result.position.x + 240, result.position.y + 420, { zoom, duration: 250 }), 0)
  }

  function selectResultVersion(version, index) {
    if (!viewedTask) return
    setResultParamsOpen(false)
    setViewVersionIndex(index)
    setEditedPrompt(version.prompt)
    setEditedModel(version.model || viewedTask.model)
    setEditedRatio(version.ratio || viewedTask.ratio)
    setEditedResolution(version.resolution || viewedTask.resolution)
  }

  async function downloadCandidateBundle(outputs, fileName) {
    const successful = outputs.filter((output) => output.status === "success" && (output.versions.at(-1)?.src || output.src))
    const files = await Promise.all(successful.map(async (output) => {
      const src = output.versions.at(-1)?.src || output.src
      const response = await fetch(src)
      if (!response.ok) throw new Error(`图片下载失败：${output.title}`)
      return {
        name: `${output.directionIndex + 1}-${output.slotIndex + 1}-${sanitizeImageName(output.title) || output.id}.png`,
        buffer: await response.arrayBuffer(),
      }
    }))
    const manifest = JSON.stringify(buildDownloadManifest(outputs), null, 2)
    files.push({ name: "manifest.json", buffer: new TextEncoder().encode(manifest).buffer })
    const url = URL.createObjectURL(createStoredZip(files))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${sanitizeImageName(fileName) || "智能拆分结果"}.zip`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function downloadBatch(splitterId) {
    const splitter = nodesRef.current.find((node) => node.id === splitterId)
    if (splitter) downloadCandidateBundle(flattenCandidateOutputs(splitter.data.tasks), `智能拆分-${splitter.data.tasks[0]?.batchId || splitterId}`)
  }

  function downloadSelectedResults() {
    const outputs = selectedResults.map((result) => toCandidateOutput(getActiveTask(result), getActiveCandidate(result))).filter(Boolean)
    if (outputs.length) downloadCandidateBundle(outputs, "画布选中结果")
  }

  function selectNodeMenuEntry(key) {
    if (!nodeMenu) return
    if (key === "splitter") createSplitter(nodeMenu.sourceId, nodeMenu.flowPosition)
    setNodeMenu(null)
  }

  const resultPromptPanel = viewedNode && viewedTask && viewedCandidate ? <div role="dialog" aria-label="图片提示词" onClick={(event) => event.stopPropagation()} className="nodrag nopan nowheel absolute left-0 top-[calc(100%+10px)] z-20 w-[480px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--gray-600)] bg-[var(--gray-800)] text-[var(--brand-on-primary)] shadow-[var(--shadow-control)]">
    <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
      <div className="min-w-0"><strong className="block truncate text-sm font-semibold">图片提示词</strong><span className="block truncate text-[11px] text-[var(--gray-400)]">{viewedTask.direction} · 第 {viewedCandidate.slotIndex + 1}/{viewedTask.candidates.length} 张候选图</span></div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setResultPromptPickerOpen(true)} className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-xs font-medium text-[var(--gray-200)] hover:bg-[var(--gray-700)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"><BookOpenText size={14} />提示词模板</button>
        <button type="button" title="关闭" aria-label="关闭图片提示词" onClick={() => { setViewId(null); setResultParamsOpen(false); setResultPromptPickerOpen(false) }} className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--gray-300)] hover:bg-[var(--gray-700)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"><X size={15} /></button>
      </div>
    </div>
    <div className="max-h-[520px] space-y-3 overflow-y-auto px-4 pb-4 text-xs">
      <section className="space-y-2" aria-label="生成输入">
        <span className="font-medium">生成输入</span>
        <div className="flex items-center gap-2">
          <div className="size-12 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-900)]">{(viewedVersion?.src || viewedCandidate.src) ? <SafeImage src={viewedVersion?.src || viewedCandidate.src} alt="当前候选图" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-[var(--danger)]">失败</span>}</div>
          <div className="min-w-0 flex-1"><span className="block truncate text-[var(--gray-200)]">{viewedTask.copyText || "无文案"}</span><span className="mt-0.5 block text-[11px] text-[var(--gray-400)]">{viewedTask.copyInImage ? "文案入图" : "文案不入图"} · {viewedTask.referenceImages.length ? `引用 ${viewedTask.referenceImages.length} 张图片` : "无参考图"}</span></div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${viewedCandidate.status === "failed" ? "bg-[var(--danger-bg)] text-[var(--danger)]" : "bg-[var(--gray-700)] text-[var(--gray-300)]"}`}>{viewedCandidate.status === "failed" ? "生成失败" : "生成成功"}</span>
        </div>
      </section>
      <label className="block"><span className="sr-only">图片生成提示词</span><textarea value={editedPrompt} onChange={(event) => setEditedPrompt(event.target.value)} rows={5} maxLength={1200} placeholder="描述要生成的图片内容" className="nowheel min-h-28 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-900)] px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-[var(--gray-400)] focus:border-[var(--brand-primary)]" /></label>
      {viewedTask.referenceImages.length > 0 && <div className="flex flex-wrap gap-1.5">{viewedTask.referenceImages.map((image) => <div key={image.index} className="flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--gray-700)] px-1.5"><SafeImage src={image.src} alt={image.mention} className="size-6 rounded object-cover" /><span className="text-[11px] text-[var(--gray-300)]">@{image.mention}</span></div>)}</div>}
      {viewedVersions.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-[var(--gray-400)]">版本</span>{viewedVersions.map((version, index) => <button key={version.id} type="button" aria-pressed={viewVersionIndex === index} onClick={() => selectResultVersion(version, index)} className={`min-h-7 rounded-full border px-2.5 text-[11px] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${viewVersionIndex === index ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-[var(--gray-600)] text-[var(--gray-300)] hover:bg-[var(--gray-700)]"}`}>版本 {version.attempt}</button>)}</div>}
      {resultParamsOpen && <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-900)] p-3 shadow-[var(--shadow-control)]">
        <label className="space-y-1"><span className="text-[var(--gray-300)]">比例</span><select value={editedRatio} onChange={(event) => setEditedRatio(event.target.value)} className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-800)] px-2 text-xs text-white outline-none focus:border-[var(--brand-primary)]">{["1:1", "2:3", "4:3", "3:4", "16:9", "9:16", "auto"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="space-y-1"><span className="text-[var(--gray-300)]">分辨率</span><select value={editedResolution} onChange={(event) => setEditedResolution(event.target.value)} className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--gray-600)] bg-[var(--gray-800)] px-2 text-xs text-white outline-none focus:border-[var(--brand-primary)]">{["1K", "2K", "4K"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <div className="col-span-2 rounded-[var(--radius-sm)] border border-[var(--gray-700)] px-2 py-2 text-[var(--gray-300)]">生成张数：1 张</div>
      </div>}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--gray-700)] pt-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          <label><span className="sr-only">结果生成模型</span><select value={editedModel} onChange={(event) => setEditedModel(event.target.value)} className="h-9 max-w-[160px] appearance-none rounded-full border border-[var(--gray-600)] bg-[var(--gray-700)] px-3 text-xs font-medium text-white outline-none focus:border-[var(--brand-primary)]">{["GPT Image 2", "GPT Image 2.5", "Nano Banana", "Seedream"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <button type="button" aria-expanded={resultParamsOpen} onClick={() => setResultParamsOpen((value) => !value)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--gray-600)] bg-[var(--gray-700)] px-3 font-medium text-[var(--gray-200)] hover:bg-[var(--gray-600)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"><SlidersHorizontal size={14} />{editedResolution} · {editedRatio} · 1 张</button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {viewedCandidate.status === "success" && (viewedVersion?.src || viewedCandidate.src) && <a href={viewedVersion?.src || viewedCandidate.src} download={`${viewedCandidate.id}-v${viewedVersion?.attempt || viewedCandidate.attempts}.png`} title="下载当前候选图版本" aria-label="下载当前候选图版本" className="grid size-10 place-items-center rounded-full text-[var(--gray-300)] hover:bg-[var(--gray-700)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"><Download size={16} /></a>}
          <button type="button" title={viewedCandidate.status === "failed" ? "重跑当前候选图" : "按当前设置重新生成"} aria-label={viewedCandidate.status === "failed" ? "重跑当前候选图" : "按当前设置重新生成"} disabled={!editedPrompt.trim() || !["success", "failed"].includes(viewedCandidate.status)} onClick={() => { setResultParamsOpen(false); retry(viewId, viewedCandidate.slotIndex, { prompt: editedPrompt, model: editedModel, ratio: editedRatio, resolution: editedResolution }) }} className="grid size-11 place-items-center rounded-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50"><ArrowUp size={18} /></button>
        </div>
      </div>
    </div>
  </div> : null

  const renderedNodes = nodes.map((node) => {
    if (node.type === "text") return { ...node, data: { ...node.data, onTextChange, onRoleChange: onTextRoleChange } }
    if (node.type === "image") return node
    if (node.type === "splitter") return { ...node, data: {
      ...node.data,
      onConfigChange,
      onGenerate: requestGeneration,
      onOpenPromptPicker: setPromptPickerId,
      onDownloadBatch: downloadBatch,
      sourceItems: edges.filter((edge) => edge.target === node.id)
        .map((edge) => nodes.find((source) => source.id === edge.source))
        .filter(Boolean)
        .map((source) => ({ id: source.id, type: source.type, title: source.data.title, src: source.data.src, textRole: source.data.textRole })),
    } }
    if (node.type === "result") return { ...node, zIndex: node.id === viewId ? 1000 : node.zIndex, data: { ...node.data, promptPanel: node.id === viewId ? resultPromptPanel : null, onView: openResult, onRetry: retry, onCandidateChange: changeResultCandidate } }
    return node
  })

  function addTextNode() {
    const number = nextId.current++
    const id = `text-${number}`
    setNodes((current) => [...current, { id, type: "text", position: { x: 120 + number * 45, y: 460 + number * 30 }, data: { title: `文本 ${number}`, text: "", textRole: "reference" } }])
    setSelectedId(id)
  }

  function addImageNodes(assets) {
    setNodes((current) => [...current, ...assets.map((asset, index) => {
      const number = nextId.current++
      return { id: `image-${number}`, type: "image", position: { x: 120 + index * 285, y: 470 + number * 28 }, data: { title: asset.title, src: asset.src, assetId: asset.id } }
    })])
    setAssetPickerOpen(false)
  }

  function deleteSelected() {
    if (!selectedId) return
    if (selectedNode?.type === "splitter") clearTimers(selectedId)
    const removed = new Set([selectedId, ...nodes.filter((node) => node.data.parentSplitter === selectedId).map((node) => node.id)])
    setNodes((current) => current.filter((node) => !removed.has(node.id)))
    setEdges((current) => current.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target)))
    setSelectedId(null)
  }

  return (
    <section className="min-w-0" aria-label="新版无限画布">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="icon" render={<Link href="/ai-canvas" aria-label="返回项目列表" title="返回项目列表" />}><ArrowLeft /></Button>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--text-title)]">{projectName}</p><p className="text-xs text-[var(--text-secondary)]">{nodes.length} 个节点 · {edges.length} 条连线</p></div>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2">
          {currentSplitter && <Button variant="outline" size="sm" className="sm:hidden" title="聚焦拆分器" onClick={() => focusNode(currentSplitter, 0.78)}><Scissors />配置</Button>}
          {currentResults.length > 0 && <Button variant="outline" size="sm" className="sm:hidden" title="逐张查看结果" onClick={focusNextResult}><SquareStack />结果 {mobileResultIndex + 1}/{currentResults.length}</Button>}
          {currentSplitter && <Button size="sm" className="sm:hidden" disabled={["planning", "generating"].includes(currentSplitter.data.phase)} onClick={() => requestGeneration(currentSplitter.id)}><WandSparkles />开始生成</Button>}
          {selectedResults.length > 0 && <Button variant="outline" size="sm" onClick={downloadSelectedResults}><Download />下载已选 {selectedResults.length}</Button>}
          <Button variant="outline" size="icon-sm" className="sm:hidden" title="全览画布" aria-label="全览画布" onClick={() => fitView({ padding: 0.12, duration: 250 })}><Scan /></Button>
          <Button variant="outline" size="icon-sm" className="sm:hidden" title="添加文本" aria-label="添加文本" onClick={addTextNode}><Type /></Button>
          <Button variant="outline" size="sm" disabled={!selectedNode} onClick={deleteSelected}><Trash2 />删除选中</Button>
          <Button size="sm" onClick={() => setAssetPickerOpen(true)}><Plus />添加图片</Button>
        </div>
      </div>

      <div ref={canvasShellRef} className="canvas-editor-shell relative h-[min(72vh,790px)] min-h-[510px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--gray-700)] bg-[var(--gray-900)]">
        <ReactFlow
          nodes={renderedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeClick={(_, node) => { setNodeMenu(null); setSelectedId(node.id); if (node.type === "result") openResult(node.id) }}
          onPaneClick={() => { setNodeMenu(null); setViewId(null); setResultParamsOpen(false); setSelectedId(null) }}
          onNodesDelete={() => setSelectedId(null)}
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.1}
          maxZoom={1.8}
          defaultEdgeOptions={{ type: "smoothstep" }}
          deleteKeyCode={["Backspace", "Delete"]}
          selectionOnDrag
          panOnDrag={[1, 2]}
          className="canvas-editor-flow"
        >
          <Background color="var(--gray-700)" gap={22} size={1} />
          <Controls showInteractive={false} className="!hidden sm:!flex" />
        </ReactFlow>

        {nodeMenu && <div role="menu" aria-label="引用节点生成" className="absolute z-20 w-[236px] rounded-[var(--radius-md)] border border-[var(--gray-600)] bg-[var(--gray-800)] p-2 text-[var(--brand-on-primary)] shadow-[var(--shadow-control)]" style={{ left: nodeMenu.left, top: nodeMenu.top }}>
          <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-1"><strong className="text-xs font-semibold">引用节点生成</strong><button type="button" title="关闭" aria-label="关闭节点菜单" onClick={() => setNodeMenu(null)} className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[var(--gray-300)] hover:bg-[var(--gray-700)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"><X size={14} /></button></div>
          <div className="space-y-0.5">
            {referenceNodeEntries.map(({ key, label, description, icon: Icon }) => <button key={key} type="button" role="menuitem" onClick={() => selectNodeMenuEntry(key)} className="flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] px-2 text-left transition-colors hover:bg-[var(--gray-700)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]">
              <span className={`grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--gray-700)] ${key === "splitter" ? "text-[var(--brand-primary)]" : "text-[var(--gray-300)]"}`}><Icon size={16} /></span>
              <span className="min-w-0"><span className="block text-xs font-semibold">{label}</span><span className="mt-0.5 block text-[11px] leading-4 text-[var(--gray-400)]">{description}</span></span>
            </button>)}
          </div>
        </div>}

        <div className="absolute left-3 top-3 z-10 hidden flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--gray-600)] bg-[var(--gray-800)] p-1 shadow-[var(--shadow-control)] sm:flex">
          <button type="button" onClick={() => setAssetPickerOpen(true)} title="添加图片" aria-label="添加图片节点" className="grid size-10 place-items-center rounded-[var(--radius-sm)] text-[var(--brand-on-primary)] hover:bg-[var(--gray-700)] focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none"><ImagePlus size={18} /></button>
          <button type="button" onClick={addTextNode} title="添加文本" aria-label="添加文本节点" className="grid size-10 place-items-center rounded-[var(--radius-sm)] text-[var(--brand-on-primary)] hover:bg-[var(--gray-700)] focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none"><Type size={18} /></button>
        </div>

        {nodes.length === 0 && <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-[var(--gray-300)]">画布暂无节点</div>}
      </div>

      {assetPickerOpen && <AssetPickerModal title="添加图片节点" max={4} personalAssets={canvasDemoAssets} sourcePermissions={{ team: false, public: false }} onClose={() => setAssetPickerOpen(false)} onConfirm={addImageNodes} />}
      {promptPickerId && <PromptPickerModal title="选择拆分需求模板" description="模板将回填到拆分需求，可继续编辑后生成图片。" prompts={initialPrompts} initialSelectedId="" onClear={() => { onConfigChange(promptPickerId, { brief: "" }); setPromptPickerId(null) }} onClose={() => setPromptPickerId(null)} onConfirm={(prompt) => { onConfigChange(promptPickerId, { brief: prompt.content }); setPromptPickerId(null) }} />}
      {resultPromptPickerOpen && viewedTask && <PromptPickerModal title="选择图片提示词模板" description="模板将回填到当前方向提示词，可继续编辑后重新生成。" prompts={initialPrompts} initialSelectedId="" onClear={() => { setEditedPrompt(""); setResultPromptPickerOpen(false) }} onClose={() => setResultPromptPickerOpen(false)} onConfirm={(prompt) => { setEditedPrompt(prompt.content); setResultPromptPickerOpen(false) }} />}
    </section>
  )
}

function getActiveTask(resultNode) {
  if (!resultNode) return null
  return resultNode.data.task || null
}

function getActiveCandidate(resultNode) {
  const task = getActiveTask(resultNode)
  if (!task) return null
  return task.candidates.find((candidate) => candidate.slotIndex === resultNode.data.activeSlotIndex) || task.candidates[0] || null
}

function toCandidateOutput(task, candidate) {
  if (!task || !candidate) return null
  return {
    ...candidate,
    taskId: task.id,
    direction: task.direction,
    directionIndex: task.directionIndex,
    title: `${task.title} 候选图 ${candidate.slotIndex + 1}`,
  }
}

function flattenCandidateOutputs(tasks) {
  return tasks.flatMap((task) => task.candidates.map((candidate) => toCandidateOutput(task, candidate)))
}

function createVersion(task, candidate, attempt, src, params = {}) {
  return {
    id: `${candidate.id}-v${attempt}`,
    attempt,
    title: task.title,
    copyText: task.copyText,
    copyInImage: task.copyInImage,
    prompt: params.prompt || task.prompt,
    model: params.model || task.model,
    ratio: params.ratio || task.ratio,
    resolution: params.resolution || task.resolution,
    referenceImages: task.referenceImages,
    src,
  }
}
