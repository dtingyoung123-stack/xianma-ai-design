"use client"

import { useMemo, useState } from "react"
import { AlertCircle, Check, FileText, Lightbulb, LoaderCircle, Search, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import WorkbenchPickerDialog from "@/components/workbench/WorkbenchPickerDialog"
import { promptSceneOptions } from "@/data/demo/prompts"

const libraries = [
  { id: "personal", label: "个人提示词", description: "自己创建或收藏", icon: UserRound },
  { id: "team", label: "团队提示词", description: "当前组织内部验证", icon: Users },
  { id: "public", label: "公共提示词", description: "公司内部验证共享", icon: ShieldCheck },
  { id: "inspiration", label: "灵感广场", description: "外部灵感，未经验证", icon: Sparkles },
]

export default function PromptPickerModal({
  title = "选择提示词模板",
  description = "选择一条模板回填到提示词编辑区。",
  prompts = [],
  personalPrompts,
  teamPrompts,
  publicPrompts,
  inspirationPrompts,
  purposeOptions = promptSceneOptions,
  defaultLibrary = "personal",
  sourceStatus = {},
  sourcePermissions = {},
  initialSelectedId,
  onRetry,
  onClear,
  onClose,
  onConfirm,
}) {
  const safeDefaultLibrary = sourcePermissions[defaultLibrary] === false ? firstAllowedLibrary(sourcePermissions) : defaultLibrary
  const [library, setLibrary] = useState(safeDefaultLibrary)
  const [query, setQuery] = useState("")
  const [purpose, setPurpose] = useState("all")
  const [selectedId, setSelectedId] = useState(initialSelectedId || "")

  const pools = useMemo(() => ({
    personal: personalPrompts || prompts.filter((prompt) => prompt.library === "personal" && prompt.status === "active"),
    team: teamPrompts || prompts.filter((prompt) => prompt.library === "team" && prompt.status === "active"),
    public: publicPrompts || prompts.filter((prompt) => prompt.library === "public" && prompt.status === "active"),
    inspiration: inspirationPrompts || prompts.filter((prompt) => prompt.library === "inspiration" && prompt.status === "active"),
  }), [inspirationPrompts, personalPrompts, prompts, publicPrompts, teamPrompts])

  const normalizedPrompts = useMemo(() => (pools[library] || []).map((prompt, index) => normalizePrompt(prompt, `${library}-${index}`, library)), [library, pools])
  const visiblePrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return normalizedPrompts.filter((prompt) => {
      const purposeMatch = purpose === "all" || prompt.sceneId === purpose
      const haystack = `${prompt.title} ${prompt.summary} ${prompt.content} ${prompt.source} ${prompt.tags.join(" ")}`.toLowerCase()
      return purposeMatch && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [normalizedPrompts, purpose, query])

  const allPrompts = useMemo(() => Object.entries(pools).flatMap(([source, items]) => items.map((prompt, index) => normalizePrompt(prompt, `${source}-${index}`, source))), [pools])
  const selectedPrompt = allPrompts.find((prompt) => prompt.id === selectedId)
  const currentState = sourceStatus[library]?.status || "ready"

  function changeLibrary(nextLibrary) {
    if (sourcePermissions[nextLibrary] === false) return
    setLibrary(nextLibrary)
    setQuery("")
    setPurpose("all")
    setSelectedId("")
  }

  return (
    <WorkbenchPickerDialog
      eyebrow="提示词模板"
      title={title}
      description={description}
      width="1040px"
      onClose={onClose}
      footer={(
        <>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            {onClear && <Button type="button" variant="ghost" onClick={onClear}>清空模板</Button>}
          </div>
          <Button type="button" className="text-white" disabled={!selectedPrompt} onClick={() => onConfirm(selectedPrompt)}>使用此模板</Button>
        </>
      )}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="tablist" aria-label="提示词来源">
        {libraries.map((item) => {
          const Icon = item.icon
          const active = library === item.id
          const disabled = sourcePermissions[item.id] === false
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => changeLibrary(item.id)}
              className="flex min-h-16 items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={active ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}
            >
              <Icon size={18} className={active ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"} />
              <span className="min-w-0">
                <strong className="block text-sm text-[var(--text-title)]">{item.label}</strong>
                <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]">{disabled ? "当前账号暂无权限" : item.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(240px,1fr)_200px]">
        <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、正文或标签" aria-label="搜索提示词" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-body)] outline-none" />
        </label>
        <select value={purpose} onChange={(event) => setPurpose(event.target.value)} aria-label="按用途分类筛选" className="h-10 rounded-lg border bg-white px-3 text-sm text-[var(--text-body)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)" }}>
          {purposeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </div>

      <PromptSourceState status={currentState} message={sourceStatus[library]?.message} onRetry={() => onRetry?.(library)}>
        <div className="mt-3 grid min-h-[360px] gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <PromptList prompts={visiblePrompts} selectedId={selectedId} onSelect={setSelectedId} />
          <PromptPreview prompt={selectedPrompt} />
        </div>
      </PromptSourceState>
    </WorkbenchPickerDialog>
  )
}

function PromptList({ prompts, selectedId, onSelect }) {
  if (!prompts.length) {
    return <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed px-5 text-center" style={{ borderColor: "var(--border-base)" }}><FileText size={26} className="text-[var(--text-disabled)]" /><strong className="mt-2 text-sm text-[var(--text-title)]">暂无符合条件的提示词</strong><span className="mt-1 text-xs text-[var(--text-secondary)]">调整关键词或用途分类后重试。</span></div>
  }
  return (
    <div className="space-y-2">
      {prompts.map((prompt) => {
        const selected = selectedId === prompt.id
        return (
          <button
            key={prompt.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(prompt.id)}
            className="w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            style={selected ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)", background: "var(--white)" }}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <strong className="block truncate text-sm text-[var(--text-title)]">{prompt.title}</strong>
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{prompt.summary || prompt.content}</span>
              </span>
              {selected && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--brand-primary)] text-white"><Check size={14} /></span>}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              <span className="rounded-md bg-[var(--gray-100)] px-1.5 py-1">{prompt.sceneLabel}</span>
              {prompt.library === "inspiration" ? <span className="rounded-md bg-[var(--warning-bg)] px-1.5 py-1 text-[var(--warning)]">外部来源 · 未验证</span> : prompt.verified && <span className="rounded-md bg-[var(--success-bg)] px-1.5 py-1 text-[var(--success)]">内部已验证</span>}
              <span className="truncate">{prompt.source}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function PromptPreview({ prompt }) {
  if (!prompt) {
    return <aside className="flex min-h-64 flex-col items-center justify-center rounded-lg border bg-[var(--gray-50)] px-5 text-center" style={{ borderColor: "var(--border-base)" }}><Lightbulb size={26} className="text-[var(--text-disabled)]" /><strong className="mt-2 text-sm text-[var(--text-title)]">选择一条提示词</strong><span className="mt-1 text-xs text-[var(--text-secondary)]">完整正文将在这里预览。</span></aside>
  }
  return (
    <aside className="self-start rounded-lg border bg-[var(--gray-50)] p-4 lg:sticky lg:top-0" style={{ borderColor: "var(--border-base)" }}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-[var(--brand-primary-soft)] px-2 py-1 text-xs text-[var(--brand-primary)]">{prompt.sceneLabel}</span>
        {prompt.library === "inspiration" ? <span className="rounded-md bg-[var(--warning-bg)] px-2 py-1 text-xs text-[var(--warning)]">未验证</span> : prompt.verified && <span className="rounded-md bg-[var(--success-bg)] px-2 py-1 text-xs text-[var(--success)]">内部已验证</span>}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-[var(--text-title)]">{prompt.title}</h3>
      {prompt.summary && <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{prompt.summary}</p>}
      <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-white p-3 text-sm leading-6 text-[var(--text-body)]" style={{ borderColor: "var(--border-light)" }}>{prompt.content}</div>
      <dl className="mt-3 grid grid-cols-[64px_1fr] gap-x-2 gap-y-2 text-xs">
        <dt className="text-[var(--text-secondary)]">来源</dt><dd className="truncate text-[var(--text-body)]" title={prompt.source}>{prompt.source}</dd>
        <dt className="text-[var(--text-secondary)]">参考图</dt><dd className="text-[var(--text-body)]">{prompt.needsReference ? "需要" : "不需要"}</dd>
      </dl>
    </aside>
  )
}

function PromptSourceState({ status, message, onRetry, children }) {
  if (status === "loading") {
    return <div className="mt-3 flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}><LoaderCircle size={24} className="mb-2 animate-spin" />正在加载提示词</div>
  }
  if (status === "error") {
    return <div className="mt-3 flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center" style={{ borderColor: "var(--border-base)" }}><AlertCircle size={24} className="text-[var(--danger)]" /><strong className="mt-2 text-sm text-[var(--text-title)]">提示词加载失败</strong><span className="mt-1 text-xs text-[var(--text-secondary)]">{message || "请稍后重试。"}</span>{onRetry && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>重新加载</Button>}</div>
  }
  return children
}

function normalizePrompt(prompt, fallbackId, library) {
  return {
    ...prompt,
    id: prompt.id || fallbackId,
    library,
    title: prompt.title || "未命名提示词",
    summary: prompt.summary || "",
    content: prompt.content || "",
    sceneId: prompt.sceneId || "general",
    sceneLabel: prompt.sceneLabel || "通用",
    source: prompt.source || libraryLabel(library),
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    verified: library === "inspiration" ? false : Boolean(prompt.verified),
  }
}

function libraryLabel(library) {
  return libraries.find((item) => item.id === library)?.label || "提示词库"
}

function firstAllowedLibrary(sourcePermissions) {
  return libraries.find((library) => sourcePermissions[library.id] !== false)?.id || "personal"
}
