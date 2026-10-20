"use client"

import { useMemo, useState } from "react"
import { AlertCircle, Check, FolderOpen, LoaderCircle, Search, Upload } from "lucide-react"
import { useMaterialFolderState } from "@/lib/material-folder-store"
import { folderPath } from "@/lib/material-folders.mjs"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import { materialCategoryOptions, prepareDemoAutoNamedMaterialDrafts } from "@/data/demo/materials"

const sources = [
  { key: "mine", title: "个人素材", desc: "仅查看自己的素材" },
  { key: "team", title: "团体素材", desc: "查看当前组织可用素材" },
  { key: "public", title: "公共素材", desc: "查看全公司共享素材" },
  { key: "local", title: "本地上传", desc: "从电脑选择图片" },
]

export default function AssetPickerModal({
  title = "选择图片",
  description = "从个人、团体、公共素材或本地文件中选择图片。",
  max = 16,
  defaultSource = "mine",
  personalAssets = [],
  teamAssets = [],
  publicAssets = [],
  categories = materialCategoryOptions,
  tags,
  sourceStatus = {},
  sourcePermissions = {},
  onRetry,
  onClose,
  onConfirm,
}) {
  const safeDefaultSource = sourcePermissions[defaultSource] === false ? firstAllowedSource(sourcePermissions) : defaultSource
  const [source, setSource] = useState(safeDefaultSource)
  const [query, setQuery] = useState("")
  const [selectedKeys, setSelectedKeys] = useState([])
  const [selectedAssetsByKey, setSelectedAssetsByKey] = useState({})
  const [localAssets, setLocalAssets] = useState([])
  const [saveToMine, setSaveToMine] = useState(false)
  const [visibleCategory, setVisibleCategory] = useState("全部类目")
  const [visibleTag, setVisibleTag] = useState("全部标签")
  const [visibleDepartment, setVisibleDepartment] = useState("")
  const [visibleFolder, setVisibleFolder] = useState("")
  const [folderSearch, setFolderSearch] = useState("")
  const [visiblePersonalGroup, setVisiblePersonalGroup] = useState("全部个人分组")

  const [folderState] = useMaterialFolderState()
  const rawPool = getSourcePool(source, personalAssets, teamAssets, publicAssets)
  const activePool = useMemo(() => rawPool.filter((asset) => source !== "team" || !folderState.removedTeamIds.includes(asset.id)).map((asset) => {
    const material = folderState.materials.find((item) => item.id === asset.id)
    const personalGroup = folderState.personalGroupAssignments[asset.id] ?? asset.personalGroup ?? ""
    const folderId = folderState.folderAssignments[`${source === "mine" ? "personal" : source}:${asset.id}`]
    return { ...asset, personalGroup, ownerDepartment: material?.ownerDepartment || asset.ownerDepartment, folderPath: folderId !== undefined ? folderPath(folderState.folders, folderId) : asset.folderPath || "" }
  }), [rawPool, source, folderState])
  const categoryOptions = useMemo(() => ["全部类目", ...categories, "未分类"], [categories])
  const tagOptions = useMemo(() => tags?.length ? tags : deriveTagOptions(activePool), [activePool, tags])
  const personalGroupOptions = useMemo(() => derivePersonalGroupOptions(activePool), [activePool])

  const departmentOptions = [...new Set(activePool.map((asset) => asset.ownerDepartment || asset.departmentName).filter(Boolean))]
  const folderPaths = [...new Set(activePool.filter((asset) => !visibleDepartment || (asset.ownerDepartment || asset.departmentName) === visibleDepartment).flatMap((asset) => {
    const path = source === "mine" ? asset.personalGroup : source === "team" && asset.folderPath ? `${asset.ownerDepartment || asset.departmentName || "所属部门"} / ${asset.folderPath}` : asset.folderPath
    return path ? path.split(" / ").map((_, index, parts) => parts.slice(0, index + 1).join(" / ")) : []
  }))]
  const libraryAssets = useMemo(() => activePool
    .map((asset, index) => normalizeAsset(asset, `${source}-${index}`, source))
    .filter((asset) => {
      const haystack = `${asset.title} ${asset.filename} ${asset.category} ${asset.tags.join(" ")} ${asset.folderPath || ""} ${asset.ownerDepartment || ""}`.toLowerCase()
      const queryOk = !query || haystack.includes(query.toLowerCase())
      const categoryOk = visibleCategory === "全部类目" || asset.category === visibleCategory
      const tagOk = visibleTag === "全部标签" || asset.tags.includes(visibleTag)
      const personalGroupOk = visiblePersonalGroup === "全部个人分组"
        || (visiblePersonalGroup === "未分组" ? !asset.personalGroup : (asset.personalGroup === visiblePersonalGroup || asset.personalGroup.startsWith(`${visiblePersonalGroup} / `)))
      const departmentOk = !visibleDepartment || (asset.ownerDepartment || asset.departmentName) === visibleDepartment
      const path = source === "mine" ? asset.personalGroup : source === "team" && asset.folderPath ? `${asset.ownerDepartment || asset.departmentName || "所属部门"} / ${asset.folderPath}` : asset.folderPath || ""
      const folderOk = !visibleFolder || (visibleFolder === "ungrouped" ? !path : path === visibleFolder || path.startsWith(`${visibleFolder} / `))
      return queryOk && categoryOk && tagOk && personalGroupOk && departmentOk && folderOk
    }), [activePool, query, source, visibleCategory, visiblePersonalGroup, visibleTag, visibleDepartment, visibleFolder])

  const visibleAssets = source === "local" ? localAssets : libraryAssets
  const selectedAssets = selectedKeys.map((key) => selectedAssetsByKey[key]).filter(Boolean)
  const currentState = sourceStatus[source]?.status || "ready"
  const existingMaterialTitles = useMemo(() => [...personalAssets, ...teamAssets, ...publicAssets]
    .map((asset) => asset.title)
    .filter(Boolean), [personalAssets, publicAssets, teamAssets])

  function toggleAsset(asset) {
    setSelectedKeys((currentKeys) => {
      if (currentKeys.includes(asset.key)) {
        setSelectedAssetsByKey((currentAssets) => {
          const nextAssets = { ...currentAssets }
          delete nextAssets[asset.key]
          return nextAssets
        })
        return currentKeys.filter((key) => key !== asset.key)
      }
      if (currentKeys.length >= max) return currentKeys
      setSelectedAssetsByKey((currentAssets) => ({ ...currentAssets, [asset.key]: asset }))
      return [...currentKeys, asset.key]
    })
  }

  function handleSourceChange(nextSource) {
    if (sourcePermissions[nextSource] === false) return
    setSource(nextSource)
    setVisibleCategory("全部类目")
    setVisibleTag("全部标签")
    setVisiblePersonalGroup("全部个人分组")
    setVisibleDepartment("")
    setVisibleFolder("")
    setFolderSearch("")
    // Library sources share resource identities; local uploads remain a separate flow.
    if (source === "local" || nextSource === "local") {
      setSelectedKeys([])
      setSelectedAssetsByKey({})
    }
    setQuery("")
  }

  function handleLocalFiles(event) {
    const files = Array.from(event.target.files || [])
    const nextAssets = files.slice(0, max).map((file, index) => {
      const src = URL.createObjectURL(file)
      return {
        key: `local-${file.name}-${file.lastModified}-${index}`,
        id: `local-${file.name}-${file.lastModified}-${index}`,
        src,
        img: src,
        title: file.name.replace(/\.[^.]+$/, "") || file.name,
        name: file.name,
        filename: file.name,
        size: file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : "未提供尺寸",
        source: "本地上传",
        sourceType: "local",
        category: "未分类",
        tags: [],
        file,
      }
    })
    setLocalAssets(nextAssets)
    setSelectedKeys(nextAssets.map((asset) => asset.key))
    setSelectedAssetsByKey(Object.fromEntries(nextAssets.map((asset) => [asset.key, asset])))
    event.target.value = ""
  }

  function confirmSelection() {
    const confirmedAssets = selectedAssets.map((asset) => ({ ...asset, saveToMine }))
    onConfirm(source === "local" && saveToMine
      ? prepareDemoAutoNamedMaterialDrafts(confirmedAssets, existingMaterialTitles)
      : confirmedAssets)
  }

  return (
    <WorkbenchPickerDialog
      eyebrow="素材选择"
      title={title}
      description={description}
      width="980px"
      onClose={onClose}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          <Button type="button" className="text-white" disabled={!selectedKeys.length} onClick={confirmSelection}>
            确认选择{selectedKeys.length ? `（${selectedKeys.length}）` : ""}
          </Button>
        </>
      )}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label="素材来源">
        {sources.map((item) => {
          const active = source === item.key
          const disabled = sourcePermissions[item.key] === false
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => handleSourceChange(item.key)}
              className="min-h-16 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={active ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}
            >
              <strong className="block text-sm text-[var(--text-title)]">{item.title}</strong>
              <span className="mt-1 block text-xs text-[var(--text-secondary)]">{disabled ? "当前账号暂无权限" : item.desc}</span>
            </button>
          )
        })}
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
          <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_170px_170px_170px]">
            <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、文件名或标签" aria-label="搜索素材" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-body)] outline-none" />
            </label>
            <PickerSelect value={visibleCategory} onChange={setVisibleCategory} options={categoryOptions} ariaLabel="按素材类目筛选" />
            <PickerSelect value={visibleTag} onChange={setVisibleTag} options={tagOptions} ariaLabel="按素材标签筛选" />
            <PickerSelect value={visiblePersonalGroup} onChange={setVisiblePersonalGroup} options={personalGroupOptions} ariaLabel="按个人分组筛选" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {source === "team" && departmentOptions.length > 1 && <PickerSelect value={visibleDepartment || "全部可见部门"} onChange={(value) => { setVisibleDepartment(value === "全部可见部门" ? "" : value); setVisibleFolder(""); setFolderSearch("") }} options={["全部可见部门", ...departmentOptions]} ariaLabel="按部门筛选素材" />}
            {source !== "mine" && folderPaths.length > 0 && <>
              <input aria-label="搜索文件夹路径" value={folderSearch} onChange={(event) => setFolderSearch(event.target.value)} placeholder="搜索文件夹，直接选完整路径" className="h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm" style={{ borderColor: "var(--border-base)" }} />
              <select aria-label="按文件夹筛选素材" value={visibleFolder} onChange={(event) => setVisibleFolder(event.target.value)} className="h-10 min-w-0 max-w-full flex-1 rounded-lg border bg-[var(--bg-card)] px-3 text-sm" style={{ borderColor: "var(--border-base)" }}>
                <option value="">全部文件夹</option><option value="ungrouped">未分组</option>
                {folderPaths.filter((path) => path === visibleFolder || path.toLowerCase().includes(folderSearch.trim().toLowerCase())).map((path) => <option key={path} value={path}>{path}</option>)}
              </select>
            </>}
          </div>
          <SourceContentState
            status={currentState}
            message={sourceStatus[source]?.message}
            onRetry={() => onRetry?.(source)}
          >
            <AssetGrid assets={visibleAssets} selectedKeys={selectedKeys} onToggle={toggleAsset} emptyText="暂无符合条件的素材。" />
          </SourceContentState>
        </>
      )}

      <div className="mt-3 flex flex-col gap-1 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }}>
        <strong className="text-sm text-[var(--text-title)]">已选择 {selectedKeys.length} / {max} 张</strong>
        <span className="text-xs text-[var(--text-secondary)]">当前来源：{sources.find((item) => item.key === source)?.title}</span>
      </div>
    </WorkbenchPickerDialog>
  )
}

function LocalUploadArea({ localAssets, selectedKeys, saveToMine, setSaveToMine, onFiles, onToggle }) {
  return (
    <div className="mt-3">
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-[var(--gray-50)] px-4 text-center transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: "var(--border-base)" }}>
        <Upload size={22} className="text-[var(--brand-primary)]" />
        <strong className="mt-2 text-sm text-[var(--text-title)]">选择本地图片</strong>
        <span className="mt-1 text-xs text-[var(--text-secondary)]">支持 JPG、PNG，可一次选择多张</span>
        <input type="file" accept="image/jpeg,image/png" multiple onChange={onFiles} className="sr-only" />
      </label>
      <div className="my-3">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
          <input type="checkbox" checked={saveToMine} onChange={(event) => setSaveToMine(event.target.checked)} aria-describedby={saveToMine ? "quick-save-auto-naming" : undefined} className="size-4 accent-[var(--brand-primary)]" />
          同时加入个人素材
        </label>
        {saveToMine && <p id="quick-save-auto-naming" className="mt-1 pl-6 text-xs leading-5 text-[var(--text-secondary)]">确认选择后自动识别名称、类目和标签，不影响当前任务。</p>}
      </div>
      <AssetGrid assets={localAssets} selectedKeys={selectedKeys} onToggle={onToggle} emptyText="尚未选择本地图片。" />
    </div>
  )
}

function SourceContentState({ status, message, onRetry, children }) {
  if (status === "loading") {
    return <div className="mt-3 flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}><LoaderCircle size={24} className="mb-2 animate-spin" />正在加载素材</div>
  }
  if (status === "error") {
    return (
      <div className="mt-3 flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--border-base)" }}>
        <AlertCircle size={24} className="text-[var(--danger)]" />
        <strong className="mt-2 text-sm text-[var(--text-title)]">素材加载失败</strong>
        <span className="mt-1 text-xs text-[var(--text-secondary)]">{message || "请稍后重试。"}</span>
        {onRetry && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>重新加载</Button>}
      </div>
    )
  }
  return children
}

function AssetGrid({ assets, selectedKeys, onToggle, emptyText }) {
  if (!assets.length) {
    return <div className="mt-3 flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-[var(--text-disabled)]" style={{ borderColor: "var(--border-base)" }}><FolderOpen size={24} className="mb-2" />{emptyText}</div>
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {assets.map((asset) => {
        const selected = selectedKeys.includes(asset.key)
        return (
          <button
            key={asset.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(asset)}
            className="relative overflow-hidden rounded-lg border bg-white text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            style={selected ? { borderColor: "var(--brand-primary)", boxShadow: "0 0 0 1px var(--brand-primary)" } : { borderColor: "var(--border-base)" }}
          >
            <SafeImage src={asset.src} alt={asset.title} className="aspect-square w-full object-cover" />
            {selected && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[var(--brand-primary)] text-white"><Check size={14} /></span>}
            <div className="p-2">
              <strong className="block truncate text-xs text-[var(--text-title)]">{asset.title}</strong>
              <span className="mt-1 block truncate text-[11px] text-[var(--text-secondary)]">{asset.category}</span>
              {asset.folderPath && <span className="mt-1 block truncate text-[11px] text-[var(--text-secondary)]" title={`${asset.ownerDepartment || asset.departmentName || ""} / ${asset.folderPath}`}>{asset.ownerDepartment || asset.departmentName ? `${asset.ownerDepartment || asset.departmentName} · ` : ""}{asset.folderPath}</span>}
              {asset.personalGroup && <span className="mt-1 block truncate text-[11px] text-[var(--text-secondary)]">{asset.personalGroup}</span>}
              <span className="mt-1 block truncate text-[11px] text-[var(--text-disabled)]">{asset.source}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function PickerSelect({ value, onChange, options, ariaLabel }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel} className="h-10 rounded-lg border bg-white px-3 text-sm text-[var(--text-body)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)" }}>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  )
}

function getSourcePool(source, personalAssets, teamAssets, publicAssets) {
  if (source === "team") return teamAssets
  if (source === "public") return publicAssets
  return personalAssets
}

function deriveTagOptions(assets) {
  const derived = Array.from(new Set(assets.flatMap((asset) => asset.tags || []).filter(Boolean)))
  return ["全部标签", ...derived]
}

function derivePersonalGroupOptions(assets) {
  const derived = Array.from(new Set(assets.map((asset) => asset.personalGroup).filter(Boolean)))
  return ["全部个人分组", ...derived, "未分组"]
}

function normalizeAsset(asset, fallbackKey, sourceType) {
  const src = asset.src || asset.img || asset.url
  return {
    ...asset,
    key: asset.id || asset.key || fallbackKey,
    id: asset.id || asset.key || fallbackKey,
    src,
    img: src,
    title: asset.title || asset.name || asset.filename || "未命名素材",
    name: asset.name || asset.title || asset.filename || "未命名素材",
    filename: asset.filename || asset.name || asset.title || "image.png",
    size: asset.size || "",
    source: asset.source || (sourceType === "public" ? "公共素材库" : sourceType === "team" ? "团体素材库" : "个人素材库"),
    sourceType,
    category: asset.category || "未分类",
    personalGroup: asset.personalGroup || "",
    tags: Array.isArray(asset.tags) ? asset.tags : [],
  }
}

function firstAllowedSource(sourcePermissions) {
  return sources.find((source) => sourcePermissions[source.key] !== false)?.key || "local"
}
