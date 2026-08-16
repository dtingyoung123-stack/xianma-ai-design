"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Settings, Sparkles, Search, ChevronDown, RefreshCw, Download, ThumbsUp, ThumbsDown, Pencil, Plus, Trash2, Send, Lightbulb, ArrowLeft, Copy } from "lucide-react"
import SafeImage from "@/components/SafeImage"
import ImageQueueModule from "@/components/workbench/ImageQueueModule"
import AssetPickerModal from "@/components/workbench/AssetPickerModal"
import PromptPickerModal from "@/components/workbench/PromptPickerModal"
import WorkbenchPromptEditor from "@/components/workbench/WorkbenchPromptEditor"
import { ColorConstraintChips } from "@/components/workbench/ColorConstraintPicker"
import {
  WorkbenchModelSelect,
  WorkbenchParameterSelect,
  WorkbenchToast,
} from "@/components/workbench/WorkbenchControls"
import { formatImageSize, hasValidImageSize } from "@/lib/image-size"
import {
  WorkbenchButton,
  WorkbenchEmpty,
  WorkbenchFooter,
  WorkbenchHistoryAction,
  WorkbenchModule,
  WorkbenchPanel,
  WorkbenchPanelHead,
  WorkbenchScroll,
  WorkbenchShell,
} from "@/components/workbench/Workbench"
import { getBreadcrumbs } from "@/config/navigation"
import {
  RULE_DIMENSIONS, modelOptions, resolutionOptions, ratioOptions, countOptions,
  quickEditTemplates, assetPool, defaultLibrary, seedTasks, buildReviewText, buildQuickInstruction,
} from "@/data/demo/buyer-show"
import { buyerShowPersonalAssets, buyerShowPublicAssets, buyerShowTeamAssets } from "@/data/demo/asset-picker"
import { initialPrompts } from "@/data/demo/prompts"

const labelStyles = {
  认可: { bg: "var(--success-bg)", color: "var(--success)" },
  待调整: { bg: "var(--warning-bg)", color: "var(--warning)" },
  待确认: { bg: "var(--info-bg)", color: "var(--info)" },
  处理中: { bg: "var(--info-bg)", color: "var(--info)" },
}
const statusStyles = {
  已完成: { bg: "var(--success-bg)", color: "var(--success)" },
  生成中: { bg: "var(--info-bg)", color: "var(--info)" },
  失败: { bg: "var(--danger-bg)", color: "var(--danger)" },
  部分成功: { bg: "var(--warning-bg)", color: "var(--warning)" },
  已终止: { bg: "var(--danger-bg)", color: "var(--danger)" },
}

const clone = (x) => JSON.parse(JSON.stringify(x))
let idCounter = 0
const newId = (prefix) => `${prefix}-${Date.now()}-${idCounter++}`
function downloadTextFile(content, filename, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadImage(src, filename) {
  const link = document.createElement("a")
  link.href = src
  link.download = filename
  link.target = "_blank"
  link.click()
}

async function downloadTaskImagesZip(task, showToast) {
  const files = await Promise.all(task.results
    .filter((result) => result.src && result.label !== "处理中")
    .map(async (result, index) => {
      const response = await fetch(result.src)
      if (!response.ok) throw new Error(`download failed: ${result.src}`)
      const buffer = await response.arrayBuffer()
      return {
        name: `${String(index + 1).padStart(2, "0")}-${sanitizeFilename(result.shot)}-${sanitizeFilename(result.title)}.${getImageExtension(result.src)}`,
        buffer,
      }
    }))

  if (!files.length) {
    showToast("当前任务暂无可下载图片")
    return
  }

  const zipBlob = createStoredZip(files)
  downloadBlob(zipBlob, `${sanitizeFilename(task.title)}-结果图片.zip`)
  showToast(`已打包下载 ${files.length} 张图片`)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function sanitizeFilename(value) {
  return String(value || "未命名")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
}

function getImageExtension(src) {
  const ext = String(src || "").split("?")[0].match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase()
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "png"
}

function createStoredZip(files) {
  const encoder = new TextEncoder()
  const localParts = []
  const centralParts = []
  let offset = 0

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name)
    const data = new Uint8Array(file.buffer)
    const crc = crc32(data)
    const localHeader = zipHeader([
      0x04034b50, 20, 0, 0, 0, 0, crc, data.length, data.length, nameBytes.length, 0,
    ], [4, 2, 2, 2, 2, 2, 4, 4, 4, 2, 2])
    localParts.push(localHeader, nameBytes, data)

    const centralHeader = zipHeader([
      0x02014b50, 20, 20, 0, 0, 0, 0, crc, data.length, data.length, nameBytes.length, 0, 0, 0, 0, 0, offset,
    ], [4, 2, 2, 2, 2, 2, 2, 4, 4, 4, 2, 2, 2, 2, 2, 4, 4])
    centralParts.push(centralHeader, nameBytes)
    offset += localHeader.length + nameBytes.length + data.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const endRecord = zipHeader([
    0x06054b50, 0, 0, files.length, files.length, centralSize, offset, 0,
  ], [4, 2, 2, 2, 2, 4, 4, 2])

  return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" })
}

function zipHeader(values, sizes) {
  const length = sizes.reduce((sum, size) => sum + size, 0)
  const bytes = new Uint8Array(length)
  const view = new DataView(bytes.buffer)
  let offset = 0
  values.forEach((value, index) => {
    if (sizes[index] === 2) view.setUint16(offset, value, true)
    else view.setUint32(offset, value, true)
    offset += sizes[index]
  })
  return bytes
}

function crc32(data) {
  let crc = -1
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function buildRuleSummary(cat, scene) {
  if (!cat) return ""
  const lines = [`【品类基础】${cat.baseRules}`]
  if (scene?.dims) RULE_DIMENSIONS.forEach((d) => { if (scene.dims[d.key]) lines.push(`【${d.label}】${scene.dims[d.key]}`) })
  return lines.join("\n")
}

const emptyDims = () => RULE_DIMENSIONS.reduce((o, d) => ({ ...o, [d.key]: "" }), {})

export default function BuyerShowPage() {
  const crumbs = getBreadcrumbs(["AI 能力中心", "AI 买家秀"])

  const [library, setLibrary] = useState(() => clone(defaultLibrary))
  const [activeLib, setActiveLib] = useState("public")
  const [categoryName, setCategoryName] = useState(null)
  const [sceneId, setSceneId] = useState(null)
  const [prompt, setPrompt] = useState("画面像手机随手拍，人物穿深色开衫，整体干净可信。")
  const [colorConstraints, setColorConstraints] = useState([])
  const [model, setModel] = useState("Nano Banana 2")
  const [resolution, setResolution] = useState("2K")
  const [ratio, setRatio] = useState("4:3")
  const [customSize, setCustomSize] = useState({ width: "", height: "" })
  const [quality, setQuality] = useState("高画质")
  const [count, setCount] = useState("4")
  const [productImages, setProductImages] = useState([])
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [assetReplaceIndex, setAssetReplaceIndex] = useState(null)
  const [promptPickerOpen, setPromptPickerOpen] = useState(false)

  const [tasks, setTasks] = useState(() => clone(seedTasks))
  const [taskSearch, setTaskSearch] = useState("")
  const [detailId, setDetailId] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [genLabel, setGenLabel] = useState("")

  const [manageOpen, setManageOpen] = useState(false)
  const [polishOpen, setPolishOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // {taskId, resultId}
  const [confirm, setConfirm] = useState(null) // {text, onOk}
  const [toast, setToast] = useState("")
  const timerRef = useRef(null)
  const toastRef = useRef(null)

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(""), 2400)
  }
  useEffect(() => () => { clearInterval(timerRef.current); clearTimeout(toastRef.current) }, [])

  const cats = (lib) => library[lib] || []
  const allCatNames = useMemo(() => {
    const names = []
    ;["public", "mine"].forEach((lib) => (library[lib] || []).forEach((c) => { if (!names.includes(c.name)) names.push(c.name) }))
    return names
  }, [library])
  const category = useMemo(() => (library[activeLib] || []).find((c) => c.name === categoryName) || null, [library, activeLib, categoryName])
  const scene = useMemo(() => category?.scenes.find((s) => s.id === sceneId) || null, [category, sceneId])
  const ruleSummary = useMemo(() => buildRuleSummary(category, scene), [category, scene])
  const imageSize = formatImageSize(ratio, customSize)

  function pickCategory(name) {
    setCategoryName(name)
    const cat = cats(activeLib).find((c) => c.name === name)
    setSceneId(cat?.scenes.length ? cat.scenes[0].id : null)
  }
  function switchLib(lib) {
    setActiveLib(lib)
    const cat = cats(lib).find((c) => c.name === categoryName)
    setSceneId(cat?.scenes.length ? cat.scenes[0].id : null)
  }
  function pickScene(id) { setSceneId(id); showToast(`已带出「${category.scenes.find((s) => s.id === id)?.name}」的场景规则`) }

  function addColorConstraint(hex, meta = {}) {
    const copySuffix = meta.copied ? "，色值已复制" : ""
    if (colorConstraints.some((item) => item.hex === hex)) {
      showToast(`颜色 ${hex} 已添加${copySuffix}`)
      return
    }
    if (colorConstraints.length >= 4) {
      showToast(`最多添加 4 个颜色约束${copySuffix}`)
      return
    }
    setColorConstraints((items) => [...items, { hex }])
    showToast(`已吸取 ${hex}${copySuffix}`)
  }

  function removeColorConstraint(hex) {
    setColorConstraints((items) => items.filter((item) => item.hex !== hex))
  }

  function handleSubmit() {
    if (!hasValidImageSize(ratio, customSize)) { showToast("请输入大于 0 的整数宽度"); return }
    if (!productImages.length) { showToast("请先添加商品图片"); return }
    if (!category || !scene) { showToast("请先选择产品品类和场景"); return }
    if (generating) { showToast("正在生成中，请等待完成"); return }
    const n = parseInt(count, 10) || 4
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, "0"), mm = String(now.getMinutes()).padStart(2, "0")
    const storyboard = [
      { index: "01", title: "主视角场景展示", desc: "系统按场景规则自动生成首张结果。" },
      { index: "02", title: "侧向细节视角", desc: "展示护具贴合与细节结构。" },
      { index: "03", title: "使用动作场景", desc: "强调日常可信感与场景氛围。" },
      { index: "04", title: "补充材质特写", desc: "补充商品面料与结构细节。" },
      { index: "05", title: "生活化环境补充", desc: "补充环境与人物自然互动。" },
      { index: "06", title: "佩戴关系近景", desc: "突出商品与身体的贴合关系。" },
      { index: "07", title: "人物侧面抓拍", desc: "补充自然侧面视角和真实感。" },
      { index: "08", title: "局部使用细节", desc: "补充操作、绑带或材质细节。" },
      { index: "09", title: "完整场景收尾", desc: "形成整组内容的场景收尾图。" },
    ]
    const results = Array.from({ length: n }, (_, i) => {
      const sb = storyboard[i % storyboard.length]
      return { id: newId("result"), shot: sb.index, title: sb.title, label: "处理中", note: "正在生成中…", src: assetPool[i % assetPool.length], version: "原始结果", editHistory: [] }
    })
    const task = {
      id: newId("demo"), title: `${n} 张买家秀 · ${hh}:${mm}`, time: "刚刚", status: "生成中", progress: 0, doneText: `0/${n}`,
      scene: scene.name, productType: category.name, model, resolution, ratio: imageSize, quality, count: `${n} 张`,
      prompt: prompt || "未填写补充提示词", sellingPoints: category.sellingPoints || "", rules: buildRuleSummary(category, scene),
      storyboard: storyboard.slice(0, n), results, reviews: [],
    }
    setTasks((prev) => [task, ...prev])
    setGenerating(true)
    setGenLabel(`生成中… 0/${n}`)
    showToast(`已提交任务，开始生成 ${n} 张…`)
    let done = 0
    timerRef.current = setInterval(() => {
      done++
      setTasks((prev) => prev.map((t) => {
        if (t.id !== task.id) return t
        const results2 = t.results.map((r, i) => i < done ? { ...r, label: "待确认", note: "已生成完成，请确认图片后再生成评价。" } : r)
        return { ...t, results: results2, doneText: `${done}/${n}`, progress: Math.round(done / n * 100), status: done >= n ? "已完成" : "生成中" }
      }))
      setGenLabel(`生成中… ${done}/${n}`)
      if (done >= n) {
        clearInterval(timerRef.current)
        setGenerating(false)
        setGenLabel("")
        showToast(`全部 ${n} 张生成完成`)
      }
    }, 600)
  }

  function cancelGeneration() {
    if (!generating) return
    clearInterval(timerRef.current)
    setGenerating(false)
    setGenLabel("")
    setTasks((prev) => prev.map((t) => t.status === "生成中"
      ? { ...t, status: "已终止", results: t.results.map((r) => r.label === "处理中" ? { ...r, note: "任务已终止，未完成。" } : r) }
      : t))
    showToast("任务已终止，已完成图片仍可查看")
  }

  function retryTask(taskId) {
    const target = tasks.find((t) => t.id === taskId)
    if (!target || generating) return
    const results = target.results.map((r) => ({ ...r, label: "处理中", note: "正在重新生成中…" }))
    const nextTask = { ...target, status: "生成中", progress: 0, doneText: `0/${results.length}`, results }
    setTasks((prev) => prev.map((t) => t.id === taskId ? nextTask : t))
    setGenerating(true)
    setGenLabel(`重新生成中… 0/${results.length}`)
    let done = 0
    timerRef.current = setInterval(() => {
      done += 1
      setTasks((prev) => prev.map((t) => t.id === taskId
        ? { ...t, results: t.results.map((r, i) => i < done ? { ...r, label: "待确认", note: "已生成完成，请确认图片后再生成评价。" } : r), progress: Math.round(done / results.length * 100), doneText: `${done}/${results.length}`, status: done >= results.length ? "已完成" : "生成中" }
        : t))
      setGenLabel(`重新生成中… ${done}/${results.length}`)
      if (done >= results.length) {
        clearInterval(timerRef.current)
        setGenerating(false)
        setGenLabel("")
        showToast("任务重新生成完成，请确认结果图片")
      }
    }, 600)
  }

  function addLocalImages(event) {
    const files = Array.from(event.target.files || [])
    const available = Math.max(0, 16 - productImages.length)
    const next = files.slice(0, available).map((file) => ({ id: newId("upload"), src: URL.createObjectURL(file), name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)}MB` }))
    if (next.length) setProductImages((prev) => [...prev, ...next])
    if (files.length > available) showToast("最多添加 16 张商品图片")
    event.target.value = ""
  }

  function handleAssetConfirm(selectedAssets) {
    if (assetReplaceIndex !== null) {
      const asset = selectedAssets[0]
      if (asset) {
        const nextImage = {
          id: asset.id || newId("asset"),
          src: asset.src || asset.img,
          name: asset.title || asset.name || asset.filename || "素材库图片",
          size: asset.size || "演示素材",
        }
        setProductImages((prev) => prev.map((image, index) => index === assetReplaceIndex ? nextImage : image))
      }
      setAssetReplaceIndex(null)
      setAssetPickerOpen(false)
      return
    }
    const available = Math.max(0, 16 - productImages.length)
    const next = selectedAssets.slice(0, available).map((asset, index) => ({
      id: asset.id || newId(`asset-${index}`),
      src: asset.src || asset.img,
      name: asset.title || asset.name || asset.filename || "素材库图片",
      size: asset.size || "演示素材",
    }))
    if (next.length) setProductImages((prev) => [...prev, ...next])
    if (selectedAssets.length > available) showToast("最多添加 16 张商品图片")
    setAssetReplaceIndex(null)
    setAssetPickerOpen(false)
  }

  function handleClear() {
    setConfirm({
      text: "清空后当前配置和选择将重置，是否继续？",
      onOk: () => {
        clearInterval(timerRef.current)
        setGenerating(false); setGenLabel("")
        setProductImages([]); setCategoryName(null); setSceneId(null); setPrompt(""); setColorConstraints([])
        setModel("Nano Banana 2"); setResolution("2K"); setRatio("4:3"); setCustomSize({ width: "800", height: "800" }); setQuality("高画质"); setCount("4")
        setConfirm(null)
        showToast("已清空当前配置和选择")
      },
    })
  }

  function updateTask(taskId, updater) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? updater(t) : t))
  }
  function setResultLabel(taskId, resultId, label) {
    updateTask(taskId, (t) => ({ ...t, results: t.results.map((r) => r.id === resultId ? { ...r, label } : r) }))
  }

  const filteredTasks = tasks.filter((t) => !taskSearch || t.time.includes(taskSearch) || t.scene.includes(taskSearch) || t.id.includes(taskSearch))
  const detailTask = tasks.find((t) => t.id === detailId) || null
  const editContext = editTarget ? tasks.find((t) => t.id === editTarget.taskId) : null
  const editResult = editContext?.results.find((r) => r.id === editTarget.resultId) || null

  return (
    <BuyerShowView
      crumbs={crumbs} library={library} activeLib={activeLib} switchLib={switchLib}
      allCatNames={allCatNames} cats={cats} category={category} categoryName={categoryName} pickCategory={pickCategory}
      scene={scene} sceneId={sceneId} pickScene={pickScene} ruleSummary={ruleSummary}
      prompt={prompt} setPrompt={setPrompt} onPolish={() => setPolishOpen(true)} onOpenPromptPicker={() => setPromptPickerOpen(true)}
      colorConstraints={colorConstraints} onPickColor={addColorConstraint} onRemoveColor={removeColorConstraint}
      productImages={productImages} setProductImages={setProductImages} onLocalImages={addLocalImages}
      onEditRegion={(index, regionEdit) => {
        setProductImages((prev) => prev.map((image, imageIndex) => imageIndex === index ? { ...image, regionEdit } : image))
        showToast("区域和文本标注已保存")
      }}
      model={model} setModel={setModel} resolution={resolution} setResolution={setResolution}
      ratio={ratio} setRatio={setRatio} customSize={customSize} setCustomSize={setCustomSize} imageSize={imageSize} quality={quality} setQuality={setQuality} count={count} setCount={setCount}
      onSubmit={handleSubmit} onClear={handleClear} onCancelGeneration={cancelGeneration} onManage={() => setManageOpen(true)}
      generating={generating} genLabel={genLabel}
      filteredTasks={filteredTasks} taskSearch={taskSearch} setTaskSearch={setTaskSearch} onOpenTask={setDetailId}
      detailTask={detailTask} closeDetail={() => setDetailId(null)} onRetryTask={retryTask}
      onApprove={(tid, rid) => setResultLabel(tid, rid, "认可")}
      onReject={(tid, rid) => setResultLabel(tid, rid, "待调整")}
      onEditResult={(tid, rid) => setEditTarget({ taskId: tid, resultId: rid })}
      updateTask={updateTask} showToast={showToast}
      manageOpen={manageOpen} closeManage={() => setManageOpen(false)} setLibrary={setLibrary}
      polishOpen={polishOpen} closePolish={() => setPolishOpen(false)}
      editContext={editContext} editResult={editResult} closeEdit={() => setEditTarget(null)}
      confirm={confirm} setConfirm={setConfirm} toast={toast}
      assetPickerOpen={assetPickerOpen}
      assetReplaceIndex={assetReplaceIndex}
      closeAssetPicker={() => { setAssetPickerOpen(false); setAssetReplaceIndex(null) }}
      openAssetPicker={() => { setAssetReplaceIndex(null); setAssetPickerOpen(true) }}
      replaceAsset={(index) => { setAssetReplaceIndex(index); setAssetPickerOpen(true) }}
      onChooseAsset={handleAssetConfirm}
      promptPickerOpen={promptPickerOpen}
      closePromptPicker={() => setPromptPickerOpen(false)}
    />
  )
}
function BuyerShowView(p) {
  return (
    <WorkbenchShell
      crumbs={p.crumbs}
      status="已上线"
      title="AI 买家秀"
      description="选商品、选场景，自动带出规则后直接生成一组买家秀图。"
      actions={<WorkbenchHistoryAction source="buyer-show" sourceLabel="AI 买家秀" params={{ model: p.model, resolution: p.resolution, ratio: p.imageSize, quality: p.quality, count: p.count, category: p.categoryName || "", scene: p.scene?.name || "" }} />}
      columns="minmax(360px, 3fr) minmax(0, 7fr)"
    >
        <ConfigPanel {...p} />
        <ResultsPanel {...p} />

      {p.detailTask && <TaskDetailModal task={p.detailTask} onClose={p.closeDetail}
        onApprove={p.onApprove} onReject={p.onReject} onEditResult={p.onEditResult}
        updateTask={p.updateTask} showToast={p.showToast} setConfirm={p.setConfirm} onRetryTask={p.onRetryTask} />}
      {p.manageOpen && <ManageModal library={p.library} setLibrary={p.setLibrary} onClose={p.closeManage} showToast={p.showToast} setConfirm={p.setConfirm} />}
      {p.assetPickerOpen && (
        <AssetPickerModal
          title={p.assetReplaceIndex !== null ? `替换图${p.assetReplaceIndex + 1}` : "选择图片"}
          description={p.assetReplaceIndex !== null ? "选择 1 张图片替换当前队列图片。" : "从素材库、本地文件中选择一张或多张图片。"}
          max={p.assetReplaceIndex !== null ? 1 : Math.max(1, 16 - p.productImages.length)}
          defaultSource="mine"
          personalAssets={buyerShowPersonalAssets}
          teamAssets={buyerShowTeamAssets}
          publicAssets={buyerShowPublicAssets}
          onClose={p.closeAssetPicker}
          onConfirm={p.onChooseAsset}
        />
      )}
      {p.polishOpen && <PolishModal prompt={p.prompt} onApply={(v) => { p.setPrompt(v); p.closePolish(); p.showToast("已应用润色结果") }} onClose={p.closePolish} />}
      {p.promptPickerOpen && (
        <PromptPickerModal
          prompts={initialPrompts}
          defaultLibrary="team"
          initialSelectedId=""
          onClear={() => { p.setPrompt(""); p.closePromptPicker() }}
          onClose={p.closePromptPicker}
          onConfirm={(selectedPrompt) => { p.setPrompt(selectedPrompt.content); p.closePromptPicker(); p.showToast("提示词模板已回填") }}
        />
      )}
      {p.editContext && p.editResult && <ImageEditModal task={p.editContext} result={p.editResult} updateTask={p.updateTask} showToast={p.showToast} onClose={p.closeEdit} />}
      {p.confirm && <ConfirmModal text={p.confirm.text} onOk={p.confirm.onOk} onClose={() => p.setConfirm(null)} />}
      <WorkbenchToast message={p.toast} />
    </WorkbenchShell>
  )
}

/* ── 左：配置面板 ── */
function ConfigPanel(p) {
  const [catOpen, setCatOpen] = useState(false)
  const [catSearch, setCatSearch] = useState("")
  const [showRule, setShowRule] = useState(false)

  const listCats = p.cats(p.activeLib).filter((c) => c.name.includes(catSearch))
  const paramSummary = `${p.resolution} · ${p.imageSize} · ${p.quality} · ${p.count} 张`

  return (
    <WorkbenchPanel>
      <WorkbenchScroll gap={10}>
        <ImageQueueModule
          title="图片队列"
          images={p.productImages}
          onOpenAssetPicker={p.openAssetPicker}
          onLocalImages={p.onLocalImages}
          onRemove={(index) => p.setProductImages((prev) => prev.filter((_, i) => i !== index))}
          onRefresh={p.replaceAsset}
          onReorder={p.setProductImages}
          onEditRegion={p.onEditRegion}
          onUnavailable={p.showToast}
          onPreviewColorPick={p.onPickColor}
          onPreviewNotify={p.showToast}
        />

        <Module title="场景" action={<button onClick={p.onManage} className="inline-flex items-center gap-1 text-xs px-2.5 h-7 rounded-md border transition-colors hover:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}><Settings size={13} /> 管理</button>}>
          <SubLabel text="产品品类" hint={p.category ? "已选品类 · 已带出场景" : "选品类 · 带出该品类场景"} />
          <div className="relative">
            <button onClick={() => setCatOpen((v) => !v)} className="w-full flex items-center justify-between h-11 px-3 rounded-lg border text-sm" style={{ borderColor: catOpen ? "var(--brand-primary)" : "var(--border-base)" }}>
              <span style={{ color: "var(--text-secondary)" }}>品类</span>
              <span className="flex items-center gap-1 font-semibold" style={{ color: p.category ? "var(--text-title)" : "var(--text-disabled)" }}>
                {p.category ? p.category.name : "未选择"} <ChevronDown size={14} />
              </span>
            </button>
            {catOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCatOpen(false)} />
                <div className="absolute z-40 mt-1 w-full rounded-lg border bg-white p-2 shadow-[var(--shadow-card-hover)]" style={{ borderColor: "var(--border-base)" }}>
                  <div className="flex items-center gap-2 px-2 h-9 rounded-md border mb-2" style={{ borderColor: "var(--border-light)" }}>
                    <Search size={14} style={{ color: "var(--text-secondary)" }} />
                    <input value={catSearch} onChange={(e) => setCatSearch(e.target.value)} placeholder="搜索品类名称" className="flex-1 text-sm outline-none bg-transparent" style={{ color: "var(--text-body)" }} />
                  </div>
                  <div className="max-h-60 overflow-auto flex flex-col gap-1">
                    {listCats.map((c) => (
                      <button key={c.id} onClick={() => { p.pickCategory(c.name); setCatOpen(false); setCatSearch("") }}
                        className="text-left px-3 py-2 rounded-md hover:bg-[var(--bg-hover)] flex items-start gap-2.5"
                        style={{ background: c.name === p.categoryName ? "var(--brand-primary-soft)" : "transparent" }}>
                        <span className="w-8 h-8 rounded-md grid place-items-center text-sm font-bold shrink-0" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>{c.name[0]}</span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center justify-between gap-2">
                            <strong className="text-sm truncate" style={{ color: "var(--text-title)" }}>{c.name}</strong>
                            <span className="text-[11px] shrink-0" style={{ color: "var(--text-secondary)" }}>{c.scenes.length} 场景</span>
                          </span>
                          <span className="block text-[11px] mt-0.5 leading-snug line-clamp-2" style={{ color: "var(--text-secondary)" }}>{c.baseRules}</span>
                        </span>
                      </button>
                    ))}
                    {listCats.length === 0 && <div className="px-3 py-4 text-sm text-center" style={{ color: "var(--text-disabled)" }}>无匹配品类</div>}
                  </div>
                </div>
              </>
            )}
          </div>

          <SubLabel text="场景预设" hint="选场景 · 自动带规则" className="mt-4" />
          <div className="flex gap-2 mb-3">
            {[["public", "公共场景库"], ["mine", "我的场景库"]].map(([lib, label]) => (
              <button key={lib} onClick={() => p.switchLib(lib)} className="flex-1 h-8 rounded-lg text-xs font-medium border"
                style={p.activeLib === lib ? { background: "var(--brand-primary)", color: "var(--white)", borderColor: "var(--brand-primary)" } : { color: "var(--text-body)", borderColor: "var(--border-base)" }}>
                {label} {p.cats(lib).find((c) => c.name === p.categoryName)?.scenes.length || 0}
              </button>
            ))}
          </div>
          <SceneGrid category={p.category} categoryName={p.categoryName} activeLib={p.activeLib} sceneId={p.sceneId} pickScene={p.pickScene} />

          <SubLabel text="场景规则" hint="内置 · 生成时自动生效" className="mt-4" />
          <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>{p.scene ? `已带出「${p.scene.name}」场景规则` : "选择场景后自动带出规则"}</p>
          {p.scene && (
            <>
              <button onClick={() => setShowRule((v) => !v)} className="text-xs px-2.5 h-7 rounded-md border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>{showRule ? "收起规则" : "查看规则"}</button>
              {showRule && <pre className="mt-2 p-3 rounded-lg text-xs whitespace-pre-wrap leading-relaxed font-sans" style={{ background: "var(--gray-50)", color: "var(--text-body)" }}>{p.ruleSummary}</pre>}
            </>
          )}
        </Module>

        <WorkbenchPromptEditor
          title="综合提示词"
          value={p.prompt}
          onChange={p.setPrompt}
          onTemplate={p.onOpenPromptPicker}
          onClear={() => p.setPrompt("")}
          onPolish={p.onPolish}
          rows={4}
          placeholder="例如：画面像手机随手拍，人物穿深色开衫，整体干净可信。"
          ariaLabel="综合提示词"
          afterInput={<ColorConstraintChips colors={p.colorConstraints} onRemove={p.onRemoveColor} onNotify={p.showToast} />}
        />

        <Module title="生成参数">
          <div className="grid grid-cols-2 gap-3">
            <WorkbenchModelSelect value={p.model} onChange={p.setModel} options={modelOptions} />
            <WorkbenchParameterSelect
              summary={paramSummary}
              sections={[
                { key: "resolution", label: "清晰度", value: p.resolution, options: resolutionOptions, onChange: p.setResolution },
                { key: "quality", label: "画质", value: p.quality, options: ["标准画质", "高画质"], onChange: p.setQuality },
                { key: "ratio", label: "图片尺寸", value: p.ratio, options: ratioOptions, onChange: p.setRatio, visual: "ratio", dimensions: { size: p.customSize, onChange: p.setCustomSize } },
                { key: "count", label: "图片张数", value: p.count, options: countOptions, onChange: p.setCount },
              ]}
            />
          </div>
        </Module>
      </WorkbenchScroll>

      <WorkbenchFooter>
        <WorkbenchButton onClick={p.onSubmit} disabled={p.generating} className="h-[46px] flex-1 rounded-xl text-[15px]">
          {p.generating ? p.genLabel : <><Send size={15} /> 提交任务</>}
        </WorkbenchButton>
        {p.generating
          ? <WorkbenchButton variant="ghost" onClick={p.onCancelGeneration} className="h-[46px] w-[92px] rounded-xl" style={{ color: "var(--danger)" }}>终止</WorkbenchButton>
          : <WorkbenchButton variant="ghost" onClick={p.onClear} className="h-[46px] w-[92px] rounded-xl">清空</WorkbenchButton>}
      </WorkbenchFooter>
    </WorkbenchPanel>
  )
}
/* ── 右：结果面板 ── */
function ResultsPanel(p) {
  return (
    <WorkbenchPanel className="min-w-0">
      <WorkbenchPanelHead title="结果任务" meta={<span className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.filteredTasks.length} 个任务</span>} />
      <div className="shrink-0 px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
            <Search size={14} style={{ color: "var(--text-secondary)" }} />
            <input value={p.taskSearch} onChange={(e) => p.setTaskSearch(e.target.value)} placeholder="搜索任务时间 / 场景 / 请求 ID" className="flex-1 text-sm outline-none bg-transparent" style={{ color: "var(--text-body)" }} />
          </div>
          <button onClick={() => p.setTaskSearch("")} className="inline-flex items-center gap-1 text-xs px-3 h-9 rounded-lg border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}><RefreshCw size={13} /> 重置</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
        {p.filteredTasks.map((t) => <TaskCard key={t.id} task={t} onOpen={() => p.onOpenTask(t.id)} onRetry={() => p.onRetryTask(t.id)} />)}
        {p.filteredTasks.length === 0 && <WorkbenchEmpty title="没有匹配的任务" description="调整搜索条件后再试。" />}
      </div>
    </WorkbenchPanel>
  )
}

function SceneGrid({ category, categoryName, activeLib, sceneId, pickScene }) {
  if (!categoryName) return <Empty text="先选一个品类。" />
  if (!category) return <Empty text={`「${activeLib === "mine" ? "我的场景库" : "公共场景库"}」暂无「${categoryName}」的场景，切到另一个库或去「管理」新增。`} />
  if (!category.scenes.length) return <Empty text="该品类暂无场景，去右上角「管理」新增。" />
  return (
    <div className="grid grid-cols-2 gap-2">
      {category.scenes.map((s) => {
        const filled = RULE_DIMENSIONS.filter((d) => (s.dims?.[d.key] || "").trim()).length
        return (
          <button key={s.id} onClick={() => pickScene(s.id)} className="text-left p-3 rounded-lg border transition-colors"
            style={sceneId === s.id ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)" }}>
            <div className="flex items-center justify-between gap-2">
              <strong className="text-sm" style={{ color: "var(--text-title)" }}>{s.name}</strong>
              <em className="text-[11px] not-italic" style={{ color: "var(--success)" }}>{filled}/6 维度</em>
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.desc || "未填写场景描述"}</div>
          </button>
        )
      })}
    </div>
  )
}

function Empty({ text }) {
  return <div className="py-6 px-3 text-center text-sm rounded-lg border border-dashed" style={{ color: "var(--text-disabled)", borderColor: "var(--border-base)" }}>{text}</div>
}

function Module({ title, hint, action, children }) {
  return <WorkbenchModule title={title} hint={hint} action={action}>{children}</WorkbenchModule>
}

function SubLabel({ text, hint, className = "" }) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <span className="text-xs font-semibold" style={{ color: "var(--text-title)" }}>{text}</span>
      {hint && <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{hint}</span>}
    </div>
  )
}

function TaskCard({ task, onOpen, onRetry }) {
  const s = statusStyles[task.status] || statusStyles["已完成"]
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen() }} className="text-left p-4 rounded-xl border transition-all hover:shadow-[var(--shadow-card-hover)] cursor-pointer" style={{ borderColor: "var(--border-base)" }}>
      <div className="flex items-center justify-between mb-1">
        <strong className="text-sm" style={{ color: "var(--text-title)" }}>{task.title}</strong>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{task.status}</span>
      </div>
      <div className="text-[11px] mb-2" style={{ color: "var(--text-disabled)" }}>ID {task.id} · {task.storyboard[0]?.title}等 {task.storyboard.length} 镜</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
        <span>{task.productType} · {task.scene}</span><span>{task.model}</span><span>{task.resolution} · {task.ratio}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gray-200)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${task.progress}%`, background: task.status === "已终止" ? "var(--danger)" : "var(--brand-primary)" }} />
        </div>
        <span className="text-[11px] shrink-0" style={{ color: "var(--text-secondary)" }}>{task.doneText}</span>
      </div>
      <div className="flex gap-1.5">
        {task.results.map((r) => <SafeImage key={r.id} src={r.src} alt={r.title} className="w-12 h-12 rounded-md object-cover" />)}
      </div>
      {(task.status === "失败" || task.status === "已终止") && <button onClick={(e) => { e.stopPropagation(); onRetry() }} className="mt-3 h-8 px-3 rounded-md border text-xs font-medium" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}>重新生成</button>}
    </div>
  )
}

function Scrim({ children, onClose }) {
  const content = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-6" style={{ background: "var(--overlay-scrim)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>{children}</div>
  )
  return typeof document !== "undefined" ? createPortal(content, document.body) : null
}

function ConfirmModal({ text, onOk, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6" style={{ background: "var(--overlay-scrim)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-[420px] space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-title)" }}>请确认</h3>
        <p className="text-sm" style={{ color: "var(--text-body)" }}>{text}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-5 rounded-lg text-sm font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>取消</button>
          <button onClick={onOk} className="h-9 px-5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--brand-primary)" }}>确认</button>
        </div>
      </div>
    </div>
  )
}

function PolishModal({ prompt, onApply, onClose }) {
  const result = (String(prompt || "").trim().replace(/\s+/g, " ") + "；画面强调真实佩戴状态、生活化随手拍质感，突出商品可信度与使用体验。").slice(0, 500)
  return (
    <Scrim onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-[520px] space-y-4" style={{ boxShadow: "var(--shadow-card-hover)", border: "1px solid var(--border-light)" }}>
        <div className="flex justify-between items-center">
          <strong className="text-base inline-flex items-center gap-2" style={{ color: "var(--text-title)" }}><Sparkles size={16} style={{ color: "var(--brand-primary)" }} /> AI 润色</strong>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--success-bg)", color: "var(--success)" }}>已完成</span>
        </div>
        <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ background: "var(--gray-50)", color: "var(--text-body)" }}>{result}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-5 rounded-lg text-sm font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>取消</button>
          <button onClick={() => onApply(result)} className="h-9 px-5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--brand-primary)" }}>确认替换</button>
        </div>
      </div>
    </Scrim>
  )
}

function TaskDetailModal({ task, onClose, onApprove, onReject, onEditResult, updateTask, showToast, setConfirm, onRetryTask }) {
  const [view, setView] = useState("images")
  const [showRule, setShowRule] = useState(false)
  const [countMode, setCountMode] = useState("5")
  const [customCount, setCustomCount] = useState(5)
  const [sellingPoints, setSellingPoints] = useState(task.sellingPoints || "支撑稳、佩戴贴合、日常活动方便")
  const s = statusStyles[task.status] || statusStyles["已完成"]
  const reviews = task.reviews || []
  const approvedResults = task.results.filter((r) => r.label === "认可")

  function reviewCount() {
    if (countMode !== "custom") return Number(countMode)
    return Math.max(1, Math.min(20, Math.floor(Number(customCount) || 1)))
  }
  function doGenerate() {
    if (!approvedResults.length) { showToast("当前任务还没有已认可的结果图，请先确认图片"); return }
    const run = () => {
      const n = reviewCount()
      const list = Array.from({ length: n }, (_, i) => {
        const r = approvedResults[i % approvedResults.length]
        return { id: newId("review"), resultId: r.id, resultVersion: r.version, imageSrc: r.src, text: buildReviewText(sellingPoints, r.title, i) }
      })
      updateTask(task.id, (t) => ({ ...t, reviews: list }))
      setView("reviews")
      showToast(`已生成 ${n} 条评价，并完成逐条图片关联`)
    }
    if (reviews.length) setConfirm({ text: `重新批量生成会替换当前 ${reviews.length} 条评价，已编辑内容也会被覆盖。是否继续？`, onOk: () => { run(); setConfirm(null) } })
    else run()
  }
  function copyAll() {
    const text = reviews.map((r, i) => `${i + 1}. ${r.text}`).join("\n")
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {})
    showToast("已复制全部评价到剪贴板")
  }

  return (
    <Scrim onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[920px] max-w-full max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "var(--border-light)" }}>
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--brand-primary)" }}>BUYER SHOW TASK</div>
            <h3 className="text-lg font-semibold mt-0.5" style={{ color: "var(--text-title)" }}>{task.title}</h3>
            <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>ID {task.id} · {task.productType} · {task.scene} · {task.model} · {task.time}</div>
          </div>
          <div className="flex items-center gap-2">
            {(task.status === "失败" || task.status === "已终止") && <button onClick={() => onRetryTask(task.id)} className="text-xs px-3 h-8 rounded-md border transition-colors hover:border-[var(--brand-primary)]" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}>重新生成</button>}
            <button onClick={doGenerate} className="text-xs px-3 h-8 rounded-md border transition-colors hover:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>生成整套评价</button>
            <button onClick={() => downloadTaskImagesZip(task, showToast).catch(() => showToast("图片打包失败，请稍后重试"))} className="inline-flex items-center gap-1 text-xs px-3 h-8 rounded-md border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}><Download size={13} /> 下载图片</button>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>{task.status}</span>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
          </div>
        </div>

        <div className="p-5 overflow-auto space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--gray-50)" }}>
            <div className="text-xs" style={{ color: "var(--text-body)" }}><strong style={{ color: "var(--text-title)" }}>{task.scene}</strong><span className="ml-2" style={{ color: "var(--text-secondary)" }}>规则在提交前可编辑，历史任务内默认只读。</span></div>
            <button onClick={() => setShowRule((v) => !v)} className="text-xs px-2.5 h-7 rounded-md border shrink-0" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>{showRule ? "收起规则" : "查看规则"}</button>
          </div>
          {showRule && <pre className="p-3 rounded-lg text-xs whitespace-pre-wrap leading-relaxed font-sans" style={{ background: "var(--gray-50)", color: "var(--text-body)" }}>{task.rules}</pre>}

          <div className="flex gap-2 border-b" style={{ borderColor: "var(--border-light)" }}>
            {[["images", "结果图片"], ["reviews", `评价文案 ${reviews.length}`]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} className="pb-2 text-sm font-medium border-b-2 -mb-px"
                style={view === v ? { color: "var(--brand-primary)", borderColor: "var(--brand-primary)" } : { color: "var(--text-secondary)", borderColor: "transparent" }}>{label}</button>
            ))}
          </div>

          {view === "images"
            ? <ImagesView task={task} onApprove={onApprove} onReject={onReject} onEditResult={onEditResult} showToast={showToast} />
            : <ReviewsView task={task} reviews={reviews} countMode={countMode} setCountMode={setCountMode} customCount={customCount} setCustomCount={setCustomCount}
                sellingPoints={sellingPoints} setSellingPoints={setSellingPoints} onGenerate={doGenerate} onCopyAll={copyAll} showToast={showToast} updateTask={updateTask} />}
        </div>
      </div>
    </Scrim>
  )
}

function ImagesView({ task, onApprove, onReject, onEditResult, showToast }) {
  const actionable = (r) => task.status !== "已终止" && task.status !== "失败" && r.label !== "处理中"
  return (
    <>
      <div>
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>分镜记录 <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{task.storyboard.length} 镜</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {task.storyboard.map((b) => (
            <div key={b.index} className="p-2.5 rounded-lg border" style={{ borderColor: "var(--border-light)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>{b.index}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "var(--text-title)" }}>{b.title}</div>
              <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>结果图 <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>{task.results.length} 张</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {task.results.map((r) => {
            const ls = labelStyles[r.label] || labelStyles["认可"]
            const canAct = actionable(r)
            return (
              <div key={r.id} className="rounded-lg border overflow-hidden flex flex-col" style={{ borderColor: "var(--border-light)" }}>
                <div className="relative aspect-square" style={{ background: "var(--gray-100)" }}>
                  <SafeImage src={r.src} alt={r.title} className="w-full h-full object-cover" />
                  <span className="absolute left-2 top-2 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ls.bg, color: ls.color }}>{r.label}</span>
                </div>
                <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                  <div className="text-xs font-semibold" style={{ color: "var(--text-title)" }}>{r.shot} · {r.title}</div>
                  <div className="text-[11px] leading-snug flex-1" style={{ color: "var(--text-secondary)" }}>{r.note}</div>
                  <div className="flex items-center gap-1">
                    <IconBtn active={r.label === "认可"} disabled={!canAct} onClick={() => onApprove(task.id, r.id)} activeColor="var(--success)"><ThumbsUp size={14} /></IconBtn>
                    <IconBtn active={r.label === "待调整"} disabled={!canAct} onClick={() => onReject(task.id, r.id)} activeColor="var(--danger)"><ThumbsDown size={14} /></IconBtn>
                    <div className="flex-1" />
                    <button disabled={!canAct} onClick={() => onEditResult(task.id, r.id)} className="p-1.5 rounded-md border disabled:opacity-40" style={{ borderColor: "var(--border-base)", color: "var(--text-secondary)" }}><Pencil size={13} /></button>
                    <button disabled={!canAct} onClick={() => downloadImage(r.src, `${r.shot}-${r.title}.png`)} className="p-1.5 rounded-md border disabled:opacity-40" style={{ borderColor: "var(--border-base)", color: "var(--text-secondary)" }}><Download size={13} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function IconBtn({ active, disabled, onClick, activeColor, children }) {
  return (
    <button disabled={disabled} onClick={onClick} className="p-1.5 rounded-md border disabled:opacity-40"
      style={active ? { borderColor: activeColor, color: activeColor, background: "var(--gray-50)" } : { borderColor: "var(--border-base)", color: "var(--text-secondary)" }}>{children}</button>
  )
}

/* __IMAGEEDIT__ */
function ReviewsView({ task, reviews, countMode, setCountMode, customCount, setCustomCount, sellingPoints, setSellingPoints, onGenerate, onCopyAll, showToast, updateTask }) {
  function editReview(id, text) { updateTask(task.id, (t) => ({ ...t, reviews: t.reviews.map((r) => r.id === id ? { ...r, text } : r) })) }
  function deleteReview(id) { updateTask(task.id, (t) => ({ ...t, reviews: t.reviews.filter((r) => r.id !== id) })) }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.9fr] gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border-light)", background: "var(--gray-25)" }}>
        <div className="space-y-2">
          <label className="text-[13px] font-bold" style={{ color: "var(--text-title)" }}>商品卖点</label>
          <textarea value={sellingPoints} onChange={(e) => setSellingPoints(e.target.value)} rows={2} className="w-full rounded-lg border p-2.5 text-sm outline-none resize-y" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>系统同时参考任务场景、图片内容和运营评价标准；每条评价覆盖 1-3 个卖点。</p>
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-bold" style={{ color: "var(--text-title)" }}>生成数量</label>
          <div className="flex flex-wrap gap-1.5">
            {["5", "10", "15", "20", "custom"].map((v) => (
              <button key={v} onClick={() => setCountMode(v)} className="h-8 px-3 rounded-md text-xs font-medium border"
                style={countMode === v ? { background: "var(--brand-primary)", color: "var(--white)", borderColor: "var(--brand-primary)" } : { color: "var(--text-body)", borderColor: "var(--border-base)" }}>{v === "custom" ? "自定义" : v}</button>
            ))}
          </div>
          {countMode === "custom" && (
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={20} value={customCount} onChange={(e) => setCustomCount(e.target.value)} className="w-24 h-9 px-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>最多 20 条</span>
            </div>
          )}
          <button onClick={onGenerate} className="w-full h-9 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--brand-primary)" }}>批量生成评价</button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <strong className="text-sm" style={{ color: "var(--text-title)" }}>{reviews.length} 条评价</strong>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>每条评价已关联具体结果图，内容由 AI 生成需人工审核后使用。</span>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={!reviews.length} onClick={onCopyAll} className="inline-flex items-center gap-1 text-xs px-3 h-8 rounded-md border disabled:opacity-40" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}><Copy size={13} /> 复制全部</button>
          <button disabled={!reviews.length} onClick={() => downloadTextFile(["序号\t关联分镜\t关联图片\t评价正文", ...reviews.map((r, i) => `${i + 1}\t${r.resultId}\t${r.imageSrc}\t${r.text}`)].join("\n"), `${task.title}-评价.tsv`, "text/tab-separated-values;charset=utf-8")} className="text-xs px-3 h-8 rounded-md border disabled:opacity-40" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>导出表格</button>
        </div>
      </div>

      {reviews.length ? (
        <div className="space-y-3">
          {reviews.map((rv, i) => {
            const result = task.results.find((r) => r.id === rv.resultId) || task.results[0]
            return (
              <div key={rv.id} className="grid grid-cols-[64px_1fr_auto] gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border-base)" }}>
                <SafeImage src={rv.imageSrc || result.src} alt={result.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}><b style={{ color: "var(--brand-primary)" }}>评价 {String(i + 1).padStart(2, "0")}</b> · 关联图 {result.shot} · {result.title}</div>
                  <textarea value={rv.text} onChange={(e) => editReview(rv.id, e.target.value)} rows={2} className="w-full rounded-lg border p-2 text-[13px] outline-none resize-y" style={{ borderColor: "var(--border-light)", color: "var(--text-body)" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => { if (navigator.clipboard?.writeText) navigator.clipboard.writeText(rv.text).catch(() => {}); showToast("已复制该条评价") }} className="p-1.5 rounded-md border" style={{ borderColor: "var(--border-base)", color: "var(--text-secondary)" }}><Copy size={13} /></button>
                  <button onClick={() => deleteReview(rv.id)} className="p-1.5 rounded-md border" style={{ borderColor: "var(--border-base)", color: "var(--danger)" }}><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-10 text-center rounded-xl border border-dashed" style={{ borderColor: "var(--border-base)" }}>
          <strong className="block text-sm mb-1" style={{ color: "var(--text-title)" }}>还没有评价文案</strong>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>选择数量后批量生成，系统会让每条评价关联具体结果图。</span>
        </div>
      )}
    </div>
  )
}

function ImageEditModal({ task, result, updateTask, showToast, onClose }) {
  const [quickKey, setQuickKey] = useState("pose")
  const [instruction, setInstruction] = useState(() => buildQuickInstruction(task.productType, task.scene, "pose", result.title))
  const [selected, setSelected] = useState("c1")
  const [candidateSeed, setCandidateSeed] = useState(0)

  function pickQuick(key) {
    setQuickKey(key)
    setInstruction(buildQuickInstruction(task.productType, task.scene, key, result.title))
  }
  const idx = assetPool.indexOf(result.src)
  const candidates = [
    { id: "c1", src: assetPool[(idx + 1 + candidateSeed) % assetPool.length], title: "候选 A", note: "保留原构图，按返修方向轻量调整。" },
    { id: "c2", src: assetPool[(idx + 2 + candidateSeed) % assetPool.length], title: "候选 B", note: "画面更像手机抓拍，人物状态更自然。" },
  ]
  function applyCandidate() {
    const cand = candidates.find((c) => c.id === selected)
    updateTask(task.id, (t) => ({
      ...t,
      results: t.results.map((r) => r.id === result.id
        ? { ...r, src: cand.src, version: "返修 v" + ((r.editHistory?.length || 0) + 1), editHistory: [...(r.editHistory || []), { quickKey, instruction }] }
        : r),
    }))
    showToast("已用所选候选替换当前结果")
    onClose()
  }

  return (
    <Scrim onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[880px] max-w-full max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "var(--border-light)" }}>
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--brand-primary)" }}>SINGLE IMAGE EDIT</div>
            <h3 className="text-lg font-semibold mt-0.5" style={{ color: "var(--text-title)" }}>单图返修 · {result.shot} {result.title}</h3>
            <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>只改当前这一张，其他结果不受影响；默认继承原任务场景规则和参数。</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
        </div>
        <div className="p-5 overflow-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <div>
            <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "var(--border-light)" }}>
              <SafeImage src={result.src} alt={result.title} className="w-full aspect-square object-cover" />
            </div>
            <div className="p-3 rounded-lg text-xs space-y-1" style={{ background: "var(--gray-50)", color: "var(--text-body)" }}>
              <div><b style={{ color: "var(--text-secondary)" }}>场景：</b>{task.scene}</div>
              <div><b style={{ color: "var(--text-secondary)" }}>模型：</b>{task.model} · {task.resolution} · {task.ratio}</div>
              <div><b style={{ color: "var(--text-secondary)" }}>当前版本：</b>{result.version}</div>
            </div>
            <div className="mt-2 p-2.5 rounded-lg text-[11px] flex items-start gap-1.5" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
              <Lightbulb size={13} className="shrink-0 mt-0.5" /> 开发注意：点「替换当前结果」需调用图像模型重新生成（传入当前结果图 + 返修方向 + 补充要求），当前原型为静态演示占位。
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>快速返修 <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>推荐先选一个方向</span></div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {quickEditTemplates.map((q) => (
                <button key={q.key} onClick={() => pickQuick(q.key)} className="text-left p-2.5 rounded-lg border"
                  style={quickKey === q.key ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)" }}>
                  <strong className="block text-xs" style={{ color: "var(--text-title)" }}>{q.title}</strong>
                  <span className="block text-[11px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{q.desc}</span>
                </button>
              ))}
            </div>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>补充要求 <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>只写这次差异</span></div>
            <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={2} className="w-full rounded-lg border p-2.5 text-sm outline-none resize-y mb-3" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} />
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>返修候选 <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>选一个替换</span></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {candidates.map((c) => (
                <button key={c.id} onClick={() => setSelected(c.id)} className="text-left rounded-lg border overflow-hidden"
                  style={selected === c.id ? { borderColor: "var(--brand-primary)", boxShadow: "var(--shadow-card)" } : { borderColor: "var(--border-base)" }}>
                  <SafeImage src={c.src} alt={c.title} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-2"><strong className="block text-xs" style={{ color: "var(--text-title)" }}>{c.title}</strong><span className="block text-[11px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{c.note}</span></div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={applyCandidate} className="flex-1 h-9 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--brand-primary)" }}>替换当前结果</button>
              <button onClick={() => { setCandidateSeed((v) => (v + 1) % assetPool.length); setSelected("c1"); showToast("已刷新 2 张返修候选") }} className="h-9 px-4 rounded-lg text-sm font-medium border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>重新生成</button>
            </div>
          </div>
        </div>
      </div>
    </Scrim>
  )
}

function ManageModal({ library, setLibrary, onClose, showToast, setConfirm }) {
  const [tab, setTab] = useState("mine")
  const [selCatId, setSelCatId] = useState(null)
  const [view, setView] = useState("list") // list | cat-form | scene-form
  const [editingCat, setEditingCat] = useState(null)
  const [editingScene, setEditingScene] = useState(null)

  const readOnly = tab === "public"
  const cats = library[tab] || []
  const selCat = cats.find((c) => c.id === selCatId) || cats[0] || null

  function mutate(fn) { setLibrary((prev) => { const next = clone(prev); fn(next); return next }) }

  function openCatForm(cat) { setEditingCat(cat); setView("cat-form") }
  function openSceneForm(cat, scene) { setSelCatId(cat.id); setEditingScene(scene); setView("scene-form") }
  function backToList() { setView("list"); setEditingCat(null); setEditingScene(null) }

  function saveCat(form) {
    if (!form.name.trim()) { showToast("请填写品类名称"); return }
    mutate((next) => {
      if (editingCat) {
        const c = next.mine.find((x) => x.id === editingCat.id)
        if (c) Object.assign(c, { name: form.name.trim(), sellingPoints: form.sellingPoints, baseRules: form.baseRules })
      } else {
        next.mine.push({ id: newId("cat"), name: form.name.trim(), sellingPoints: form.sellingPoints, baseRules: form.baseRules, scenes: [] })
      }
    })
    showToast(editingCat ? "已更新品类" : "已新增品类")
    backToList()
  }
  function delCat(cat) {
    setConfirm({ text: `删除品类「${cat.name}」及其所有场景？`, onOk: () => { mutate((next) => { next.mine = next.mine.filter((c) => c.id !== cat.id) }); if (selCatId === cat.id) setSelCatId(null); setConfirm(null); showToast("已删除品类") } })
  }
  function saveScene(catId, form) {
    if (!form.name.trim()) { showToast("请填写场景名称"); return }
    mutate((next) => {
      const c = next.mine.find((x) => x.id === catId)
      if (!c) return
      if (editingScene) {
        const sc = c.scenes.find((s) => s.id === editingScene.id)
        if (sc) Object.assign(sc, { name: form.name.trim(), desc: form.desc, dims: form.dims })
      } else {
        c.scenes.push({ id: newId("sc"), name: form.name.trim(), desc: form.desc, dims: form.dims })
      }
    })
    showToast(editingScene ? "已更新场景" : "已新增场景")
    backToList()
  }
  function delScene(catId, sceneId) {
    mutate((next) => { const c = next.mine.find((x) => x.id === catId); if (c) c.scenes = c.scenes.filter((s) => s.id !== sceneId) })
    showToast("已删除场景")
  }
  function publishScene(cat, scene) {
    setConfirm({
      text: `把「${cat.name} · ${scene.name}」发布到公共场景库？全组织都能用到。`,
      onOk: () => {
        mutate((next) => {
          let target = next.public.find((c) => c.name === cat.name)
          if (!target) { target = { id: newId("cat"), name: cat.name, baseRules: cat.baseRules, sellingPoints: cat.sellingPoints || "", scenes: [] }; next.public.push(target) }
          else if (cat.sellingPoints && !target.sellingPoints) target.sellingPoints = cat.sellingPoints
          const dup = target.scenes.find((s) => s.name === scene.name)
          if (dup) { dup.desc = scene.desc; dup.dims = clone(scene.dims) }
          else target.scenes.push({ ...clone(scene), id: newId("sc") })
        })
        setConfirm(null); showToast("已发布到公共场景库")
      },
    })
  }

  const titles = { list: "管理场景库", "cat-form": editingCat ? "编辑品类" : "新增品类", "scene-form": readOnly ? "查看场景" : (editingScene ? "编辑场景" : "新增场景") }

  return (
    <Scrim onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[min(900px,calc(100vw-32px))] h-[min(720px,calc(100vh-32px))] max-w-full max-h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "var(--border-light)" }}>
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--brand-primary)" }}>SCENE LIBRARY</div>
            <h3 className="text-lg font-semibold mt-0.5" style={{ color: "var(--text-title)" }}>{titles[view]}</h3>
            <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>公共场景库只读；新增、编辑、删除只作用于「我的场景库」，改好后可发布到公共。</div>
          </div>
          <div className="flex items-center gap-2">
            {view !== "list" && <button onClick={backToList} className="inline-flex items-center gap-1 text-xs px-3 h-8 rounded-md border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}><ArrowLeft size={13} /> 返回列表</button>}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 min-h-0 p-5 overflow-y-auto">
          {view === "list" && <ManageList tab={tab} setTab={(t) => { setTab(t); setSelCatId(null); backToList() }} cats={cats} selCat={selCat} setSelCatId={setSelCatId}
            readOnly={readOnly} onAddCat={() => openCatForm(null)} onEditCat={openCatForm} onDelCat={delCat}
            onAddScene={(c) => openSceneForm(c, null)} onEditScene={openSceneForm} onDelScene={delScene} onPublish={publishScene} />}
          {view === "cat-form" && <CategoryForm cat={editingCat} onSave={saveCat} onCancel={backToList} />}
          {view === "scene-form" && <SceneForm cat={selCat} scene={editingScene} readOnly={readOnly} onSave={(form) => saveScene(selCat.id, form)} onCancel={backToList} />}
        </div>
      </div>
    </Scrim>
  )
}

function ManageList({ tab, setTab, cats, selCat, setSelCatId, readOnly, onAddCat, onEditCat, onDelCat, onAddScene, onEditScene, onDelScene, onPublish }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[["public", "公共场景库"], ["mine", "我的场景库"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className="h-8 px-4 rounded-lg text-xs font-medium border"
            style={tab === t ? { background: "var(--brand-primary)", color: "var(--white)", borderColor: "var(--brand-primary)" } : { color: "var(--text-body)", borderColor: "var(--border-base)" }}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[280px_minmax(0,1fr)] gap-4 min-w-0">
        <div className="rounded-xl border p-3 min-w-0" style={{ borderColor: "var(--border-light)", background: "var(--gray-25)" }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>品类</h4>
            {!readOnly && <button onClick={onAddCat} className="inline-flex items-center gap-1 text-xs px-2 h-7 rounded-md" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}><Plus size={12} /> 新增品类</button>}
          </div>
          <div className="flex flex-col gap-1.5">
            {cats.map((c) => (
              <div key={c.id} onClick={() => setSelCatId(c.id)} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border cursor-pointer"
                style={selCat?.id === c.id ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}>
                <span className="text-sm font-medium truncate" style={{ color: "var(--text-title)" }}>{c.name} <em className="not-italic text-[11px]" style={{ color: "var(--text-secondary)" }}>({c.scenes.length})</em></span>
                {!readOnly && (
                  <span className="flex gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEditCat(c) }} className="p-1 rounded" style={{ color: "var(--text-secondary)" }}><Pencil size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelCat(c) }} className="p-1 rounded" style={{ color: "var(--danger)" }}><Trash2 size={12} /></button>
                  </span>
                )}
              </div>
            ))}
            {cats.length === 0 && <div className="py-4 text-center text-xs" style={{ color: "var(--text-disabled)" }}>暂无品类{!readOnly && "，点上方新增"}</div>}
          </div>
        </div>
        <div className="rounded-xl border p-3 min-w-0" style={{ borderColor: "var(--border-light)" }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{selCat ? `${selCat.name} · 场景` : "场景"}</h4>
            {!readOnly && selCat && <button onClick={() => onAddScene(selCat)} className="inline-flex items-center gap-1 text-xs px-2 h-7 rounded-md" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}><Plus size={12} /> 新增场景</button>}
          </div>
          <div className="flex flex-col gap-2">
            {(selCat?.scenes || []).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
                <span className="min-w-0"><strong className="block text-sm truncate" style={{ color: "var(--text-title)" }}>{s.name}</strong><span className="block text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{s.desc || "未填写描述"}</span></span>
                <span className="flex gap-1 shrink-0">
                  <button onClick={() => onEditScene(selCat, s)} className="text-[11px] px-2 h-6 rounded border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>{readOnly ? "查看" : "编辑"}</button>
                  {!readOnly && <>
                    <button onClick={() => onPublish(selCat, s)} className="text-[11px] px-2 h-6 rounded border" style={{ borderColor: "var(--border-base)", color: "var(--brand-primary)" }}>发布</button>
                    <button onClick={() => onDelScene(selCat.id, s.id)} className="p-1 rounded" style={{ color: "var(--danger)" }}><Trash2 size={12} /></button>
                  </>}
                </span>
              </div>
            ))}
            {selCat && selCat.scenes.length === 0 && <div className="py-4 text-center text-xs" style={{ color: "var(--text-disabled)" }}>该品类暂无场景</div>}
            {!selCat && <div className="py-4 text-center text-xs" style={{ color: "var(--text-disabled)" }}>先选择左侧品类</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryForm({ cat, onSave, onCancel }) {
  const [name, setName] = useState(cat?.name || "")
  const [sellingPoints, setSellingPoints] = useState(cat?.sellingPoints || "")
  const [baseRules, setBaseRules] = useState(cat?.baseRules || "")
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Field label="品类名称"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：护腰带" className="w-full h-10 px-3 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /></Field>
      <Field label="品类卖点" hint="评价生成时的默认卖点"><input value={sellingPoints} onChange={(e) => setSellingPoints(e.target.value)} placeholder="例如：支撑稳、佩戴贴合" className="w-full h-10 px-3 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /></Field>
      <Field label="品类基础规则" hint="该品类所有场景都遵守的硬约束"><textarea value={baseRules} onChange={(e) => setBaseRules(e.target.value)} rows={4} className="w-full rounded-lg border p-3 text-sm outline-none resize-y" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /></Field>
      <div className="flex gap-2">
        <button onClick={() => onSave({ name, sellingPoints, baseRules })} className="h-9 px-5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--brand-primary)" }}>保存品类</button>
        <button onClick={onCancel} className="h-9 px-5 rounded-lg text-sm font-medium border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>返回</button>
      </div>
    </div>
  )
}

function SceneForm({ cat, scene, readOnly, onSave, onCancel }) {
  const [name, setName] = useState(scene?.name || "")
  const [desc, setDesc] = useState(scene?.desc || "")
  const [dims, setDims] = useState(() => ({ ...emptyDims(), ...(scene?.dims || {}) }))
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="场景名称"><input value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} placeholder="例如：冬季户外" className="w-full h-10 px-3 rounded-lg border text-sm outline-none disabled:opacity-60" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /></Field>
        <Field label="场景简述"><input value={desc} disabled={readOnly} onChange={(e) => setDesc(e.target.value)} placeholder="例如：公园、小区、轻松走动" className="w-full h-10 px-3 rounded-lg border text-sm outline-none disabled:opacity-60" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} /></Field>
      </div>
      <div className="flex items-center justify-between">
        <strong className="text-sm" style={{ color: "var(--text-title)" }}>场景差异规则 · 6 维度</strong>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>所属品类：{cat?.name}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RULE_DIMENSIONS.map((d) => (
          <Field key={d.key} label={d.label} hint={d.hint}>
            <textarea value={dims[d.key]} disabled={readOnly} onChange={(e) => setDims((prev) => ({ ...prev, [d.key]: e.target.value }))} rows={2} className="w-full rounded-lg border p-2.5 text-sm outline-none resize-y disabled:opacity-60" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }} />
          </Field>
        ))}
      </div>
      <div className="flex gap-2">
        {!readOnly && <button onClick={() => onSave({ name, desc, dims })} className="h-9 px-5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--brand-primary)" }}>保存场景</button>}
        <button onClick={onCancel} className="h-9 px-5 rounded-lg text-sm font-medium border" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>返回</button>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-bold flex items-center gap-2" style={{ color: "var(--text-title)" }}>{label}{hint && <i className="not-italic text-[11px] font-normal" style={{ color: "var(--text-secondary)" }}>{hint}</i>}</label>
      {children}
    </div>
  )
}
