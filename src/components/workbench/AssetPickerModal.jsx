"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Check, Search, X } from "lucide-react"
import SafeImage from "@/components/SafeImage"

const sources = [
  { key: "mine", title: "个人素材库", desc: "只看你自己的素材" },
  { key: "team", title: "团体素材库", desc: "查看对你所在组织开放的素材" },
  { key: "public", title: "公共素材库", desc: "查看全公司共享素材" },
  { key: "local", title: "本地上传", desc: "从电脑选择文件" },
]

export default function AssetPickerModal({
  title = "选择图片",
  description = "从素材库、本地文件中选择一张或多张图片。",
  max = 16,
  defaultSource = "mine",
  personalAssets = [],
  teamAssets = [],
  publicAssets = [],
  categories = ["全部类目"],
  tags = ["全部标签"],
  onClose,
  onConfirm,
}) {
  const [source, setSource] = useState(defaultSource)
  const [query, setQuery] = useState("")
  const [selectedKeys, setSelectedKeys] = useState([])
  const [selectedAssetsByKey, setSelectedAssetsByKey] = useState({})
  const [localAssets, setLocalAssets] = useState([])
  const [saveToMine, setSaveToMine] = useState(false)

  const activePool = getSourcePool(source, personalAssets, teamAssets, publicAssets)

  const categoryOptions = useMemo(() => {
    if (categories.length > 1) return categories
    return deriveCategoryOptions(activePool)
  }, [activePool, categories])

  const tagOptions = useMemo(() => {
    if (tags.length > 1) return tags
    return deriveTagOptions(activePool)
  }, [activePool, tags])

  const [visibleCategory, setVisibleCategory] = useState(categoryOptions[0] || "全部类目")
  const [visibleTag, setVisibleTag] = useState(tagOptions[0] || "全部标签")

  const libraryAssets = useMemo(() => {
    const pool = activePool
    return pool
      .map((asset, index) => normalizeAsset(asset, `${source}-${index}`, source))
      .filter((asset) => {
        const haystack = `${asset.title} ${asset.filename} ${asset.category} ${asset.tags.join(" ")}`.toLowerCase()
        const queryOk = !query || haystack.includes(query.toLowerCase())
        const categoryOk = visibleCategory === "全部类目" || asset.category === visibleCategory
        const tagOk = visibleTag === "全部标签" || asset.tags.includes(visibleTag)
        return queryOk && categoryOk && tagOk
      })
  }, [activePool, query, source, visibleCategory, visibleTag])

  const visibleAssets = source === "local" ? localAssets : libraryAssets
  const selectedAssets = selectedKeys.map((key) => selectedAssetsByKey[key]).filter(Boolean)

  function toggleAsset(asset) {
    setSelectedKeys((prev) => {
      if (prev.includes(asset.key)) {
        setSelectedAssetsByKey((current) => {
          const next = { ...current }
          delete next[asset.key]
          return next
        })
        return prev.filter((key) => key !== asset.key)
      }
      if (prev.length >= max) return prev
      setSelectedAssetsByKey((current) => ({ ...current, [asset.key]: asset }))
      return [...prev, asset.key]
    })
  }

  function handleSourceChange(nextSource) {
    const nextPool = getSourcePool(nextSource, personalAssets, teamAssets, publicAssets)
    const nextCategoryOptions = categories.length > 1
      ? categories
      : deriveCategoryOptions(nextPool)
    const nextTagOptions = tags.length > 1
      ? tags
      : deriveTagOptions(nextPool)

    setSource(nextSource)
    setVisibleCategory(nextCategoryOptions[0] || "全部类目")
    setVisibleTag(nextTagOptions[0] || "全部标签")
    setSelectedKeys([])
    setSelectedAssetsByKey({})
    setQuery("")
  }

  function handleLocalFiles(event) {
    const files = Array.from(event.target.files || [])
    const next = files.slice(0, max).map((file, index) => ({
      key: `local-${file.name}-${file.lastModified}-${index}`,
      src: URL.createObjectURL(file),
      img: null,
      title: file.name.replace(/\.[^.]+$/, "") || file.name,
      name: file.name,
      filename: file.name,
      size: file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : "未提供尺寸",
      source: "本地上传",
      sourceType: "local",
      category: "本地图片",
      tags: [],
      file,
      saveToMine,
    }))
    next.forEach((asset) => { asset.img = asset.src })
    setLocalAssets(next)
    setSelectedKeys(next.map((asset) => asset.key))
    setSelectedAssetsByKey(Object.fromEntries(next.map((asset) => [asset.key, asset])))
    event.target.value = ""
  }

  function confirmSelection() {
    onConfirm(selectedAssets.map((asset) => ({ ...asset, saveToMine })))
  }

  const content = (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--overlay-scrim)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="flex h-[min(78vh,680px)] w-[min(920px,calc(100vw-48px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <span className="inline-flex h-6 items-center rounded-full px-2 text-[11px] font-bold" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>选择图片</span>
            <h3 className="m-0 mt-2 text-lg font-black" style={{ color: "var(--text-title)" }}>{title}</h3>
            <p className="m-0 mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{description}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border hover:bg-[var(--bg-hover)]" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {sources.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSourceChange(item.key)}
                className="rounded-lg border p-3 text-left transition-colors"
                style={source === item.key
                  ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" }
                  : { borderColor: "var(--border-base)", background: "var(--white)" }}
              >
                <strong className="block text-sm" style={{ color: "var(--text-title)" }}>{item.title}</strong>
                <span className="mt-1 block text-xs" style={{ color: "var(--text-secondary)" }}>{item.desc}</span>
              </button>
            ))}
          </div>

          {source === "local" ? (
            <LocalUploadArea
              localAssets={localAssets}
              selectedKeys={selectedKeys}
              saveToMine={saveToMine}
              setSaveToMine={setSaveToMine}
              onFiles={handleLocalFiles}
              onToggle={toggleAsset}
            />
          ) : (
            <>
              <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_200px_200px]">
                <label className="flex h-9 items-center gap-2 rounded-md border px-3" style={{ borderColor: "var(--border-base)", color: "var(--text-secondary)" }}>
                  <Search size={15} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="标题或描述" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </label>
                <Select value={visibleCategory} onChange={setVisibleCategory} options={categoryOptions} />
                <Select value={visibleTag} onChange={setVisibleTag} options={tagOptions} />
              </div>
              <AssetGrid assets={visibleAssets} selectedKeys={selectedKeys} onToggle={toggleAsset} emptyText="暂无符合条件的素材。" />
            </>
          )}

          <div className="mt-3 flex items-center justify-between rounded-lg border px-3 py-3" style={{ borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }}>
            <div>
              <strong className="block text-sm" style={{ color: "var(--text-title)" }}>已选择 {selectedKeys.length} 张</strong>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>请选择图片后再继续</span>
            </div>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {source === "local" ? "确认后返回本地文件" : `当前来自${source === "public" ? "公共素材库" : source === "team" ? "团体素材库" : "个人素材库"}`}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border-light)" }}>
          <button type="button" onClick={onClose} className="h-9 rounded-md border px-3 text-sm" style={{ borderColor: "var(--border-base)", color: "var(--text-body)", background: "var(--white)" }}>取消</button>
          <button type="button" onClick={confirmSelection} disabled={!selectedKeys.length} className="h-9 rounded-md px-4 text-sm font-bold text-white disabled:opacity-50" style={{ background: "var(--brand-primary)" }}>确认选择</button>
        </div>
      </div>
    </div>
  )

  return typeof document !== "undefined" ? createPortal(content, document.body) : null
}

function LocalUploadArea({ localAssets, selectedKeys, saveToMine, setSaveToMine, onFiles, onToggle }) {
  return (
    <div className="mt-3">
      <label className="mb-1 block text-xs font-bold" style={{ color: "var(--text-title)" }}>本地图片</label>
      <input type="file" accept="image/jpeg,image/png" multiple onChange={onFiles} className="block h-9 w-full rounded-md border px-2 text-sm" style={{ borderColor: "var(--border-base)" }} />
      <p className="mb-3 mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>选择一张或多张图片</p>
      <label className="mb-3 inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-body)" }}>
        <input type="checkbox" checked={saveToMine} onChange={(e) => setSaveToMine(e.target.checked)} />
        同时加入个人素材库
      </label>
      <AssetGrid assets={localAssets} selectedKeys={selectedKeys} onToggle={onToggle} emptyText="请选择图片后继续。" />
    </div>
  )
}

function AssetGrid({ assets, selectedKeys, onToggle, emptyText }) {
  if (!assets.length) {
    return <div className="mt-3 rounded-lg border border-dashed px-4 py-10 text-center text-sm" style={{ borderColor: "var(--border-base)", color: "var(--text-disabled)" }}>{emptyText}</div>
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {assets.map((asset) => {
        const selected = selectedKeys.includes(asset.key)
        return (
          <button
            key={asset.key}
            type="button"
            onClick={() => onToggle(asset)}
            className="relative overflow-hidden rounded-lg border bg-white text-left transition-colors"
            style={selected ? { borderColor: "var(--brand-primary)", boxShadow: "0 0 0 1px var(--brand-primary)" } : { borderColor: "var(--border-base)" }}
          >
            <SafeImage src={asset.src} alt={asset.title} className="aspect-square w-full object-cover" />
            {selected && (
              <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: "var(--brand-primary)" }}>
                <Check size={14} />
              </span>
            )}
            <div className="p-2">
              <strong className="block truncate text-xs" style={{ color: "var(--text-title)" }}>{asset.title}</strong>
              <span className="mt-1 block truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>{asset.filename}</span>
              <span className="mt-1 block truncate text-[11px]" style={{ color: "var(--text-disabled)" }}>{asset.source}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-md border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  )
}

function deriveCategoryOptions(assets) {
  const derived = Array.from(new Set(assets.map((asset) => asset.category).filter(Boolean)))
  return derived.length ? ["全部类目", ...derived] : ["全部类目"]
}

function deriveTagOptions(assets) {
  const derived = Array.from(new Set(assets.flatMap((asset) => asset.tags || []).filter(Boolean)))
  return derived.length ? ["全部标签", ...derived] : ["全部标签"]
}

function normalizeAsset(asset, fallbackKey, sourceType) {
  const src = asset.src || asset.img
  const filename = asset.filename || asset.name || asset.title || `素材-${fallbackKey}.png`
  return {
    ...asset,
    key: asset.id || src || filename || fallbackKey,
    src,
    img: asset.img || src,
    title: asset.title || asset.name || filename,
    name: asset.name || filename,
    filename,
    size: asset.size || "演示素材",
    source: asset.source || (sourceType === "public" ? "公共素材库" : sourceType === "team" ? "团体素材库" : "个人素材库"),
    sourceType,
    category: asset.category || "全部类目",
    tags: asset.tags || [],
  }
}

function getSourcePool(source, personalAssets, teamAssets, publicAssets) {
  if (source === "team") return teamAssets
  if (source === "public") return publicAssets
  return personalAssets
}
