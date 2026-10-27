"use client"

import { useRef, useState } from "react"
import { Check, Copy, Pipette, X } from "lucide-react"
import { cn } from "@/lib/utils"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import SafeImage from "@/components/SafeImage"
import { backgroundColorFamilies, defaultBackgroundColors } from "@/data/demo/background-colors"

const backgroundColorsKey = "xianma-background-colors-prototype-v1"

export function BackgroundColorPicker({ onSelect, onClose }) {
  const [colors, setColors] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(backgroundColorsKey) || "[]")
      return Array.isArray(stored) ? stored.filter((item) => typeof item?.name === "string" && /^#[0-9a-f]{6}$/i.test(item?.hex)) : []
    } catch { return [] }
  })
  const [hex, setHex] = useState(defaultBackgroundColors[0].hex)
  const [name, setName] = useState(defaultBackgroundColors[0].name)
  const [error, setError] = useState("")
  const [source, setSource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const uploadVersion = useRef(0)
  const buttonClass = "rounded-md border border-[var(--border-base)] px-3 py-2 text-xs font-semibold hover:bg-[var(--bg-hover)] aria-pressed:border-[var(--brand-primary)] aria-pressed:bg-[var(--brand-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-40"

  function upload(event) {
    const file = event.target.files?.[0]
    const version = ++uploadVersion.current
    setLoading(false)
    setSource(null)
    setError("")
    if (!file) return
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("请上传 10MB 以内的 PNG、JPG 或 WebP 图片")
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      if (version !== uploadVersion.current) return
      setSource(String(reader.result))
      setLoading(false)
    }
    reader.onerror = () => { if (version === uploadVersion.current) { setError("图片读取失败，请重新上传"); setLoading(false) } }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  function sampleImage(event) {
    const image = event.currentTarget
    const bounds = image.getBoundingClientRect()
    const canvas = document.createElement("canvas")
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext("2d")
    if (!context) { setError("图片取色失败，请使用吸色或重新上传"); return }
    context.drawImage(image, 0, 0)
    const x = Math.min(canvas.width - 1, Math.floor((event.clientX - bounds.left) / bounds.width * canvas.width))
    const y = Math.min(canvas.height - 1, Math.floor((event.clientY - bounds.top) / bounds.height * canvas.height))
    const [r, g, b, alpha] = context.getImageData(x, y, 1, 1).data
    if (alpha < 255) { setError("请选择不透明的颜色区域"); return }
    setHex(`#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase())
    setName("")
    setError("")
  }

  function save() {
    if (!name.trim()) { setError("请先填写颜色名称"); return }
    const color = { name: name.trim(), hex }
    const next = [...colors.filter((item) => item.hex !== hex), color]
    try {
      localStorage.setItem(backgroundColorsKey, JSON.stringify(next))
      setColors(next)
      setAdding(false)
      setSource(null)
      setLoading(false)
      uploadVersion.current += 1
      setError("")
    } catch { setError("颜色保存失败，请检查浏览器存储空间；仍可直接插入颜色") }
  }

  function toggleAdd() {
    if (!adding) {
      uploadVersion.current += 1
      setSource(null)
      setLoading(false)
      setHex(defaultBackgroundColors[0].hex)
      setName("")
    }
    setAdding(!adding)
    setError("")
  }

  function removeColor(hexToRemove) {
    const next = colors.filter((color) => color.hex !== hexToRemove)
    try {
      localStorage.setItem(backgroundColorsKey, JSON.stringify(next))
      setColors(next)
      setError("")
    } catch { setError("删除失败，请检查浏览器存储权限后重试") }
  }

  function renderSwatch(color) {
    const selected = hex === color.hex
    return <button key={color.hex} type="button" title={`${color.name} ${color.hex}`} aria-label={`${color.name} ${color.hex}`} aria-pressed={selected} onClick={() => { setHex(color.hex); setName(color.name); setError("") }} className="relative flex aspect-square min-w-0 items-center justify-center rounded-sm border border-[var(--border-base)] transition-transform hover:scale-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ backgroundColor: color.hex }}>{selected && <span className="grid size-4 place-items-center rounded-full bg-[var(--white)] text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--brand-primary)]"><Check size={12} strokeWidth={3} /></span>}</button>
  }

  return (
    <WorkbenchPickerDialog title="更改背景色" description="选择颜色后插入提示词，可继续修改文字。" width="560px" onClose={onClose} footer={<><span className="text-xs text-[var(--text-secondary)]">颜色库保存在当前浏览器</span><button type="button" className={buttonClass} onClick={() => { const message = onSelect({ name: name.trim() || "指定颜色", hex }); if (message) setError(message) }}>插入提示词</button></>}>
      <h3 className="mb-3 text-sm font-semibold">常规颜色</h3>
      <div className="mb-4 grid grid-cols-10 gap-1 sm:gap-2" aria-label="按色系由浅到深排列的颜色">
        {backgroundColorFamilies.map((family) => <div key={family.name} className="flex min-w-0 flex-col gap-1 sm:gap-1.5">{family.colors.map((color) => renderSwatch(color))}</div>)}
      </div>
      <h3 className="mb-2 text-sm font-semibold">标准色</h3>
      <div className="mb-5 grid grid-cols-7 gap-2 sm:grid-cols-14" aria-label="标准色">{defaultBackgroundColors.map((color) => renderSwatch(color))}</div>
      <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">我的颜色</h3><button type="button" className={buttonClass} aria-expanded={adding} onClick={toggleAdd}>添加颜色</button></div>
      {colors.length ? <div className="mb-4 flex flex-wrap gap-2">{colors.map((color) => <span key={color.hex} className="relative inline-flex max-w-full"><button type="button" aria-pressed={hex === color.hex && name === color.name} className={`${buttonClass} min-w-0 break-all`} onClick={() => { setHex(color.hex); setName(color.name); setError("") }}><span className="mr-2 inline-block size-3 rounded-full border border-[var(--border-base)]" style={{ backgroundColor: color.hex }} />{color.name} {color.hex}</button><button type="button" aria-label={`删除颜色 ${color.name}`} title={`删除颜色 ${color.name}`} onClick={() => removeColor(color.hex)} className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border border-[var(--border-base)] bg-[var(--white)] text-[var(--text-secondary)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"><X size={10} /></button></span>)}</div> : <p className="mb-4 text-xs text-[var(--text-secondary)]">暂无自定义颜色，点击添加颜色即可吸色或上传素材。</p>}
      <p className="mb-3 flex items-center gap-2 text-xs"><span className="inline-block size-5 rounded border border-[var(--border-base)]" style={{ backgroundColor: hex }} />当前颜色：{name || "指定颜色"} {hex}</p>
      {adding && <div className="rounded-lg border border-[var(--border-base)] p-3"><div className="flex flex-wrap items-center gap-2">
        <code className="text-sm">{hex}</code>
        <ColorSamplerButton onPick={(value) => { setHex(value); setName(""); setError("") }} onUnavailable={() => setError("当前浏览器不支持屏幕吸色，请上传颜色素材并点击取色")} showLabel title="吸管吸色" />
        <label className={`${buttonClass} cursor-pointer`}>上传颜色素材<input type="file" aria-label="上传颜色素材" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={upload} /></label>
      </div>
      {loading && <p role="status" className="mt-3 text-xs">正在读取颜色素材…</p>}
      {source && <div className="mt-3"><p className="mb-2 text-xs text-[var(--text-secondary)]">点击素材上的颜色取色，也可使用吸管吸色。</p><SafeImage src={source} alt="上传的颜色素材，点击取色" onClick={sampleImage} className="h-auto max-h-56 max-w-full cursor-crosshair rounded-md" /></div>}
      <div className="mt-4 flex flex-wrap gap-2"><input aria-label="颜色名称" maxLength={30} placeholder="自定义颜色名称" value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 rounded-md border border-[var(--border-base)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" /><button type="button" className={buttonClass} onClick={save}>存入颜色库</button></div></div>}
      {error && <p role="alert" className="mt-3 text-xs text-[var(--danger)]">{error}</p>}
    </WorkbenchPickerDialog>
  )
}

export function ColorSamplerButton({ onPick, onUnavailable, className, title = "吸色", showLabel = false }) {
  const inputRef = useRef(null)
  const [picking, setPicking] = useState(false)

  async function pickColor(event) {
    event.stopPropagation()
    if (!window.EyeDropper) {
      if (onUnavailable) { onUnavailable(); return }
      inputRef.current?.click()
      return
    }
    setPicking(true)
    try {
      const result = await new window.EyeDropper().open()
      if (result?.sRGBHex) onPick?.(result.sRGBHex.toUpperCase())
    } catch (error) {
      if (error?.name !== "AbortError") {
        if (onUnavailable) onUnavailable()
        else inputRef.current?.click()
      }
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
