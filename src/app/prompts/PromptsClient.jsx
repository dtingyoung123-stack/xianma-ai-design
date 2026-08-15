"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  FilePlus2,
  FolderHeart,
  Globe2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  permissionOrganizationName,
  permissionOrganizationTree,
} from "@/data/demo/admin"
import {
  demoPromptCurrentUser,
  initialPrompts,
  initialPromptSources,
  promptLibraryMeta,
  promptSceneOptions,
} from "@/data/demo/prompts"

const libraryTabs = [
  { id: "personal", label: "个人提示词", icon: FolderHeart },
  { id: "team", label: "团队提示词", icon: Users },
  { id: "public", label: "公共提示词", icon: ShieldCheck },
  { id: "inspiration", label: "灵感广场", icon: Sparkles },
]

const personalStatusOptions = [
  { id: "all", label: "全部状态" },
  { id: "personal-active", label: "可用" },
  { id: "team-pending", label: "团队审核中" },
  { id: "team-rejected", label: "团队已驳回" },
]

const teamStatusOptions = [
  { id: "all", label: "全部状态" },
  { id: "team-active", label: "团队可用" },
  { id: "public-pending", label: "公共审核中" },
  { id: "public-rejected", label: "公共已驳回" },
  { id: "public-approved", label: "公共已发布" },
]

function getPromptStatus(prompt, viewLibrary = prompt.library) {
  if (viewLibrary === "public" && (prompt.library === "public" || prompt.publicReviewStatus === "approved")) {
    return { id: "public-active", label: "公共可用", tone: "success" }
  }
  if (prompt.library === "personal") {
    if (prompt.status === "pending") return { id: "team-pending", label: "团队审核中", tone: "warning" }
    if (prompt.status === "rejected") return { id: "team-rejected", label: "团队已驳回", tone: "danger" }
    return { id: "personal-active", label: "可用", tone: "success" }
  }
  if (prompt.library === "team") {
    if (prompt.publicReviewStatus === "pending") return { id: "public-pending", label: "公共审核中", tone: "warning" }
    if (prompt.publicReviewStatus === "rejected") return { id: "public-rejected", label: "公共已驳回", tone: "danger" }
    if (prompt.publicReviewStatus === "approved") return { id: "public-approved", label: "公共已发布", tone: "success" }
    return { id: "team-active", label: "团队可用", tone: "success" }
  }
  if (prompt.library === "public") return { id: "public-active", label: "公共可用", tone: "success" }
  return { id: "inspiration-active", label: "灵感内容", tone: "warning" }
}

function flattenOrganizations(nodes, depth = 0, ancestorIds = [], ancestorNames = []) {
  return nodes.flatMap((node) => [
    { ...node, depth, ancestorIds, path: [...ancestorNames, node.name].join(" / ") },
    ...flattenOrganizations(
      node.children || [],
      depth + 1,
      [...ancestorIds, node.id],
      [...ancestorNames, node.name],
    ),
  ])
}

const organizationRows = flattenOrganizations(permissionOrganizationTree)
const organizationMap = Object.fromEntries(organizationRows.map((organization) => [organization.id, organization]))

function compactOrganizationIds(organizationIds) {
  const selected = new Set(organizationIds)
  return organizationIds.filter((organizationId) => {
    const organization = organizationMap[organizationId]
    return organization && !organization.ancestorIds.some((ancestorId) => selected.has(ancestorId))
  })
}

function isSystemAdmin(user) {
  return user.roleIds.includes("system_admin")
}

function canReviewPrompts(user) {
  return isSystemAdmin(user)
    || user.roleIds.includes("department_admin")
    || (
    user.roleIds.includes("approval_admin") && user.approvalTypeIds?.includes("prompt_publish")
  )
}

function isOrganizationInScope(organizationId, scopeIds = []) {
  const organization = organizationMap[organizationId]
  return Boolean(organization && scopeIds.some((scopeId) => (
    organizationId === scopeId || organization.ancestorIds.includes(scopeId)
  )))
}

function canReviewPrompt(user, prompt) {
  return canReviewPrompts(user) && (
    isSystemAdmin(user) || isOrganizationInScope(prompt.ownerDepartmentId, user.organizationScopeIds)
  )
}

function canManageTeamPrompt(user, prompt) {
  if (prompt.library === "public" || prompt.library === "inspiration") return isSystemAdmin(user)
  if (prompt.library !== "team") return false
  if (prompt.publicReviewStatus === "approved") return isSystemAdmin(user)
  return isSystemAdmin(user) || (
    user.roleIds.includes("department_admin")
    && prompt.visibleOrgIds.some((organizationId) => isOrganizationInScope(organizationId, user.organizationScopeIds))
  )
}

function canRequestPublicPrompt(user, prompt) {
  if (prompt.library !== "team" || prompt.status !== "active") return false
  if (prompt.publicReviewStatus === "approved") return false
  return isSystemAdmin(user)
    || prompt.ownerId === user.id
    || (
      user.roleIds.includes("department_admin")
      && prompt.visibleOrgIds.some((organizationId) => isOrganizationInScope(organizationId, user.organizationScopeIds))
    )
}

function canCancelPublicPrompt(user, prompt) {
  return isSystemAdmin(user) || prompt.publicSubmitterId === user.id
}

function formatVisibleOrganizations(prompt, viewLibrary = prompt.library) {
  if (viewLibrary === "public") return "全公司"
  if (prompt.library === "personal") return "仅本人"
  if (prompt.library === "public") return "全公司"
  if (prompt.library === "inspiration") return "灵感广场"
  const names = prompt.visibleOrgIds.map((id) => organizationMap[id]?.name).filter(Boolean)
  return names.length ? `${names.join("、")}（含下级）` : "未配置组织"
}

export default function PromptsClient() {
  const [prompts, setPrompts] = useState(initialPrompts)
  const [sources, setSources] = useState(initialPromptSources)
  const [activeLibrary, setActiveLibrary] = useState("personal")
  const [teamView, setTeamView] = useState("all")
  const [query, setQuery] = useState("")
  const [sceneFilter, setSceneFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [visibleCount, setVisibleCount] = useState(8)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState("")

  const teamPendingCount = prompts.filter((prompt) => prompt.status === "pending" && canReviewPrompt(demoPromptCurrentUser, prompt)).length
  const publicPendingCount = isSystemAdmin(demoPromptCurrentUser)
    ? prompts.filter((prompt) => prompt.library === "team" && prompt.status === "active" && prompt.publicReviewStatus === "pending").length
    : 0
  const pendingCount = teamPendingCount + publicPendingCount
  const counts = useMemo(() => ({
    team: prompts.filter((prompt) => prompt.library === "team" && prompt.status === "active").length,
    personal: prompts.filter((prompt) => prompt.library === "personal" && prompt.ownerId === demoPromptCurrentUser.id).length,
    public: prompts.filter((prompt) => prompt.status === "active" && (prompt.library === "public" || prompt.publicReviewStatus === "approved")).length,
    inspiration: promptLibraryMeta.externalTotal,
  }), [prompts])

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return prompts.filter((prompt) => {
      const libraryMatch = activeLibrary === "team"
          ? teamView === "pending"
            ? prompt.status === "pending" && canReviewPrompt(demoPromptCurrentUser, prompt)
            : teamView === "public-pending"
              ? isSystemAdmin(demoPromptCurrentUser) && prompt.library === "team" && prompt.status === "active" && prompt.publicReviewStatus === "pending"
          : prompt.library === "team" && prompt.status === "active"
        : activeLibrary === "personal"
          ? prompt.library === "personal" && prompt.ownerId === demoPromptCurrentUser.id
          : activeLibrary === "public"
            ? prompt.status === "active" && (prompt.library === "public" || prompt.publicReviewStatus === "approved")
            : prompt.library === "inspiration"
      const sceneMatch = sceneFilter === "all" || prompt.sceneId === sceneFilter
      const statusMatch = statusFilter === "all" || getPromptStatus(prompt).id === statusFilter
      const queryMatch = !normalizedQuery || [
        prompt.title,
        prompt.summary,
        prompt.content,
        prompt.sceneLabel,
        prompt.source,
        ...prompt.tags,
      ].join(" ").toLowerCase().includes(normalizedQuery)
      return libraryMatch && sceneMatch && statusMatch && queryMatch
    })
  }, [activeLibrary, prompts, query, sceneFilter, statusFilter, teamView])

  const statusOptions = activeLibrary === "personal" ? personalStatusOptions : teamStatusOptions
  const showStatusFilter = teamView === "all" && (activeLibrary === "personal" || activeLibrary === "team")

  const visiblePrompts = filteredPrompts.slice(0, visibleCount)

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(""), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  function changeLibrary(libraryId) {
    setActiveLibrary(libraryId)
    setTeamView("all")
    setQuery("")
    setSceneFilter("all")
    setStatusFilter("all")
    setVisibleCount(8)
  }

  function openPending() {
    setActiveLibrary("team")
    setTeamView(teamPendingCount === 0 && publicPendingCount > 0 ? "public-pending" : "pending")
    setQuery("")
    setSceneFilter("all")
    setStatusFilter("all")
    setVisibleCount(8)
  }

  function updatePrompt(promptId, updater) {
    setPrompts((current) => current.map((prompt) => (
      prompt.id === promptId ? updater(prompt) : prompt
    )))
  }

  async function copyText(content, message = "提示词已复制") {
    let copied = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content)
        copied = true
      }
    } catch {
      copied = false
    }

    if (!copied) {
      const textarea = document.createElement("textarea")
      textarea.value = content
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      copied = document.execCommand("copy")
      textarea.remove()
    }

    setToast(copied ? message : "复制失败，请在详情中手动复制")
  }

  function savePrompt(values, target) {
    if (target) {
      updatePrompt(target.id, (current) => ({
        ...current,
        ...values,
        sceneLabel: promptSceneOptions.find((option) => option.id === values.sceneId)?.label || current.sceneLabel,
        tags: values.tags,
      }))
      setToast("提示词已保存")
    } else {
      const scene = promptSceneOptions.find((option) => option.id === values.sceneId)
      const targetLibrary = values.library === "public" && isSystemAdmin(demoPromptCurrentUser) ? "public" : "personal"
      setPrompts((current) => [{
        id: `prompt-${targetLibrary}-${Date.now()}`,
        ...values,
        library: targetLibrary,
        status: "active",
        sceneLabel: scene?.label || "未分类",
        source: targetLibrary === "public" ? "系统管理员直接发布" : "手动创建",
        ownerId: demoPromptCurrentUser.id,
        ownerName: demoPromptCurrentUser.name,
        ownerDepartmentId: demoPromptCurrentUser.departmentId,
        ownerDepartment: demoPromptCurrentUser.department,
        visibleOrgIds: [],
        verified: targetLibrary === "public",
        usageCount: 0,
        createdAt: "刚刚",
      }, ...current])
      setActiveLibrary(targetLibrary)
      setToast(targetLibrary === "public" ? "已发布到公共提示词" : "已保存到我的提示词")
    }
    setDialog(null)
  }

  function collectPrompt(prompt) {
    const existing = prompts.some((item) => item.library === "personal" && item.collectedFromId === prompt.id)
    if (existing) {
      setToast("这条灵感已经收藏过了")
      return
    }
    setPrompts((current) => [{
      ...prompt,
      id: `prompt-collected-${Date.now()}`,
      library: "personal",
      status: "active",
      source: `灵感收藏 · ${prompt.source}`,
      ownerId: demoPromptCurrentUser.id,
      ownerName: demoPromptCurrentUser.name,
      ownerDepartmentId: demoPromptCurrentUser.departmentId,
      ownerDepartment: demoPromptCurrentUser.department,
      visibleOrgIds: [],
      verified: false,
      collectedFromId: prompt.id,
      createdAt: "刚刚",
    }, ...current])
    setToast("已收藏到我的提示词")
  }

  function submitToTeam(prompt) {
    updatePrompt(prompt.id, (current) => ({
      ...current,
      status: "pending",
      rejectionReason: "",
      submittedAt: "刚刚",
    }))
    setDialog(null)
    setToast("已提交给所属部门审核")
  }

  function cancelSubmission(prompt) {
    updatePrompt(prompt.id, (current) => ({ ...current, status: "active", submittedAt: "" }))
    setToast("已取消团队提交")
  }

  function approvePrompt(prompt, organizationIds) {
    updatePrompt(prompt.id, (current) => ({
      ...current,
      library: "team",
      status: "active",
      source: "团队审核",
      visibleOrgIds: compactOrganizationIds(organizationIds),
      verified: true,
      reviewedAt: "刚刚",
    }))
    setDialog(null)
    setToast("提示词已发布到团队提示词库")
  }

  function rejectPrompt(prompt, reason) {
    updatePrompt(prompt.id, (current) => ({
      ...current,
      library: "personal",
      status: "rejected",
      rejectionReason: reason,
      reviewedAt: "刚刚",
    }))
    setDialog(null)
    setToast("已驳回，提示词继续保留在提交人的个人库")
  }

  function submitPromptToPublic(prompt) {
    updatePrompt(prompt.id, (current) => ({
      ...current,
      publicReviewStatus: "pending",
      publicRejectionReason: "",
      publicSubmittedAt: "刚刚",
      publicSubmitterId: demoPromptCurrentUser.id,
    }))
    setDialog(null)
    setToast("已提交公共提示词审核，团队提示词可继续使用")
  }

  function cancelPublicPromptSubmission(prompt) {
    updatePrompt(prompt.id, (current) => ({
      ...current,
      publicReviewStatus: "",
      publicSubmittedAt: "",
    }))
    setToast("已取消公共提示词申请")
  }

  function approvePublicPrompt(prompt) {
    updatePrompt(prompt.id, (current) => ({
      ...current,
      verified: true,
      publicReviewStatus: "approved",
      publicReviewedAt: "刚刚",
    }))
    setDialog(null)
    setToast("提示词已发布到公共提示词")
  }

  function rejectPublicPrompt(prompt, reason) {
    updatePrompt(prompt.id, (current) => ({
      ...current,
      publicReviewStatus: "rejected",
      publicRejectionReason: reason,
      publicReviewedAt: "刚刚",
    }))
    setDialog(null)
    setToast("公共申请已驳回，团队提示词可继续使用")
  }

  function deletePrompt(prompt) {
    setPrompts((current) => current.filter((item) => item.id !== prompt.id))
    setDialog(null)
    setToast("提示词已删除")
  }

  function toggleSource(sourceId) {
    setSources((current) => current.map((source) => (
      source.id === sourceId ? { ...source, enabled: !source.enabled } : source
    )))
  }

  function refreshSource(sourceId) {
    setSources((current) => current.map((source) => (
      source.id === sourceId ? { ...source, lastSuccess: "刚刚" } : source
    )))
    setToast("来源内容已更新")
  }

  function addSource(values) {
    setSources((current) => [...current, {
      id: `source-${Date.now()}`,
      name: values.name,
      count: 0,
      enabled: true,
      sync: values.sync,
      lastSuccess: "等待首次同步",
    }])
    setToast("来源已添加")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-[var(--gray-100)] p-1">
          {libraryTabs.map((tab) => {
            const Icon = tab.icon
            const active = activeLibrary === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeLibrary(tab.id)}
                className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${active ? "bg-white text-[var(--brand-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-title)]"}`}
              >
                <Icon size={16} />
                {tab.label}
                <span className="rounded-md bg-[var(--brand-primary-soft)] px-1.5 py-0.5 text-xs tabular-nums text-[var(--brand-primary)]">{counts[tab.id].toLocaleString()}</span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canReviewPrompts(demoPromptCurrentUser) && (
            <Button variant="outline" size="lg" className="gap-2" onClick={openPending}>
              <ClipboardCheck size={16} />待我审批
              <span className="rounded-md bg-[var(--warning-bg)] px-1.5 py-0.5 text-xs text-[var(--warning)]">{pendingCount}</span>
            </Button>
          )}
          {isSystemAdmin(demoPromptCurrentUser) && (
            <Button variant="outline" size="lg" className="gap-2" onClick={() => setDialog({ type: "sources" })}>
              <Settings2 size={16} />来源管理
            </Button>
          )}
          <Button size="lg" className="gap-2 text-white" onClick={() => setDialog({ type: "edit", prompt: null })}>
            <Plus size={16} />新建提示词
          </Button>
        </div>
      </div>

      {activeLibrary === "team" && canReviewPrompts(demoPromptCurrentUser) && (
        <div className="flex items-center gap-1 border-b" style={{ borderColor: "var(--border-base)" }}>
          {[
            { id: "all", label: "全部团队提示词" },
            { id: "pending", label: `团队入库 ${teamPendingCount}` },
            ...(isSystemAdmin(demoPromptCurrentUser) ? [{ id: "public-pending", label: `公共发布 ${publicPendingCount}` }] : []),
          ].map((view) => (
            <button key={view.id} type="button" onClick={() => { setTeamView(view.id); setStatusFilter("all"); setVisibleCount(8) }} className={`border-b-2 px-3 py-2 text-sm font-medium ${teamView === view.id ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}>{view.label}</button>
          ))}
        </div>
      )}

      <div className={`grid gap-2 ${showStatusFilter ? "sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_180px_auto]" : "sm:grid-cols-[minmax(260px,1fr)_180px_auto]"}`}>
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-3 text-[var(--text-secondary)]" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(8) }} placeholder="搜索标题、内容或标签" className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} />
        </label>
        <FilterSelect value={sceneFilter} onChange={(value) => { setSceneFilter(value); setVisibleCount(8) }} options={promptSceneOptions} ariaLabel="按用途分类筛选" />
        {showStatusFilter && <FilterSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setVisibleCount(8) }} options={statusOptions} ariaLabel="按提示词状态筛选" />}
        <div className="flex h-10 items-center justify-end text-xs text-[var(--text-secondary)]">
          {activeLibrary === "inspiration" ? `已同步 ${promptLibraryMeta.externalTotal.toLocaleString()} 条 · 未经验证 · ${promptLibraryMeta.lastSyncedAt}` : `找到 ${filteredPrompts.length} 条`}
        </div>
      </div>

      {visiblePrompts.length ? (
        <div className="space-y-3">
          {visiblePrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              activeLibrary={activeLibrary}
              canManage={canManageTeamPrompt(demoPromptCurrentUser, prompt)}
              canRequestPublic={canRequestPublicPrompt(demoPromptCurrentUser, prompt)}
              canCancelPublic={canCancelPublicPrompt(demoPromptCurrentUser, prompt)}
              reviewMode={activeLibrary === "team" && teamView === "pending" ? "team" : activeLibrary === "team" && teamView === "public-pending" ? "public" : null}
              onCopy={() => copyText(prompt.content)}
              onDetail={() => setDialog({ type: "detail", prompt, viewLibrary: activeLibrary })}
              onCollect={() => collectPrompt(prompt)}
              onEdit={() => setDialog({ type: "edit", prompt })}
              onSubmit={() => setDialog({ type: "submit", prompt })}
              onCancel={() => cancelSubmission(prompt)}
              onReview={() => setDialog({ type: "review", prompt })}
              onSubmitPublic={() => setDialog({ type: "submit-public", prompt })}
              onCancelPublic={() => cancelPublicPromptSubmission(prompt)}
              onReviewPublic={() => setDialog({ type: "review-public", prompt })}
              onDelete={() => setDialog({ type: "delete", prompt })}
            />
          ))}
        </div>
      ) : (
        <EmptyState activeLibrary={activeLibrary} teamView={teamView} onCreate={() => setDialog({ type: "edit", prompt: null })} />
      )}

      {visiblePrompts.length < filteredPrompts.length && (
        <div className="flex justify-center pt-1">
          <Button variant="outline" size="lg" onClick={() => setVisibleCount((count) => count + 8)}>加载更多</Button>
        </div>
      )}

      {dialog?.type === "detail" && <PromptDetailDialog prompt={dialog.prompt} viewLibrary={dialog.viewLibrary} onClose={() => setDialog(null)} onCopy={() => copyText(dialog.prompt.content)} onCollect={() => { collectPrompt(dialog.prompt); setDialog(null) }} />}
      {dialog?.type === "edit" && <EditPromptDialog prompt={dialog.prompt} currentUser={demoPromptCurrentUser} defaultLibrary={activeLibrary === "public" ? "public" : "personal"} onClose={() => setDialog(null)} onSave={(values) => savePrompt(values, dialog.prompt)} />}
      {dialog?.type === "submit" && <SubmitPromptDialog prompt={dialog.prompt} onClose={() => setDialog(null)} onConfirm={() => submitToTeam(dialog.prompt)} />}
      {dialog?.type === "review" && <ReviewPromptDialog prompt={dialog.prompt} currentUser={demoPromptCurrentUser} onClose={() => setDialog(null)} onApprove={(organizationIds) => approvePrompt(dialog.prompt, organizationIds)} onReject={(reason) => rejectPrompt(dialog.prompt, reason)} />}
      {dialog?.type === "submit-public" && <SubmitPublicPromptDialog prompt={dialog.prompt} onClose={() => setDialog(null)} onConfirm={() => submitPromptToPublic(dialog.prompt)} />}
      {dialog?.type === "review-public" && <ReviewPublicPromptDialog prompt={dialog.prompt} onClose={() => setDialog(null)} onApprove={() => approvePublicPrompt(dialog.prompt)} onReject={(reason) => rejectPublicPrompt(dialog.prompt, reason)} />}
      {dialog?.type === "delete" && <ConfirmDeleteDialog prompt={dialog.prompt} onClose={() => setDialog(null)} onConfirm={() => deletePrompt(dialog.prompt)} />}
      {dialog?.type === "sources" && <SourceManagementDialog sources={sources} onClose={() => setDialog(null)} onToggle={toggleSource} onRefresh={refreshSource} onAdd={addSource} onToast={setToast} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-[var(--gray-900)] px-4 py-2.5 text-sm text-white shadow-lg" role="status">{toast}</div>}
    </div>
  )
}

function FilterSelect({ value, onChange, options, ariaLabel }) {
  return (
    <label className="relative block">
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel} className="h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-[var(--text-body)] outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-[var(--text-secondary)]" />
    </label>
  )
}

function PromptCard({ prompt, activeLibrary, canManage, canRequestPublic, canCancelPublic, reviewMode, onCopy, onDetail, onCollect, onEdit, onSubmit, onCancel, onReview, onDelete, onSubmitPublic, onCancelPublic, onReviewPublic }) {
  const promptStatus = getPromptStatus(prompt, activeLibrary)
  return (
    <article className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-[var(--shadow-card-hover)]" style={{ borderColor: "var(--border-base)" }}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[var(--brand-primary-soft)] px-2 py-1 text-xs font-medium text-[var(--brand-primary)]">{prompt.sceneLabel}</span>
            {prompt.verified && <span className="flex items-center gap-1 rounded-md bg-[var(--success-bg)] px-2 py-1 text-xs font-medium text-[var(--success)]"><ShieldCheck size={13} />{activeLibrary === "public" ? "公司已验证" : "团队已验证"}</span>}
            {prompt.library === "inspiration" && <span className="rounded-md bg-[var(--warning-bg)] px-2 py-1 text-xs font-medium text-[var(--warning)]">未经验证</span>}
            <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${promptStatus.tone === "warning" ? "bg-[var(--warning-bg)] text-[var(--warning)]" : promptStatus.tone === "danger" ? "bg-[var(--danger-bg)] text-[var(--danger)]" : "bg-[var(--success-bg)] text-[var(--success)]"}`}>{prompt.status === "pending" && <RefreshCw size={13} />}{promptStatus.label}</span>
          </div>
          <button type="button" onClick={onDetail} className="mt-3 block max-w-full text-left">
            <h2 className="text-[15px] font-semibold text-[var(--text-title)] hover:text-[var(--brand-primary)]">{prompt.title}</h2>
            {prompt.summary && <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{prompt.summary}</p>}
          </button>
          <button type="button" onClick={onDetail} className="mt-3 block w-full rounded-lg border bg-[var(--gray-50)] px-3 py-2.5 text-left" style={{ borderColor: "var(--border-light)" }}>
            <p className="line-clamp-3 text-sm leading-6 text-[var(--text-body)]">{prompt.content}</p>
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--text-secondary)]">
            <span>{prompt.source}</span>
            {prompt.needsReference && <span>需要参考图</span>}
            {(prompt.library === "team" || prompt.library === "public") && <span>{formatVisibleOrganizations(prompt, activeLibrary)}</span>}
            {prompt.tags.map((tag) => <span key={tag} className="rounded-md bg-[var(--gray-100)] px-2 py-1">{tag}</span>)}
          </div>
          {prompt.status === "pending" && <p className="mt-3 text-xs text-[var(--warning)]">提交时间：{prompt.submittedAt}</p>}
          {prompt.status === "rejected" && <p className="mt-3 rounded-md bg-[var(--danger-bg)] px-2.5 py-2 text-xs leading-5 text-[var(--danger)]">驳回原因：{prompt.rejectionReason}</p>}
          {prompt.publicReviewStatus === "rejected" && <p className="mt-3 rounded-md bg-[var(--danger-bg)] px-2.5 py-2 text-xs leading-5 text-[var(--danger)]">公共驳回：{prompt.publicRejectionReason}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t pt-3 xl:w-[270px] xl:justify-end xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0" style={{ borderColor: "var(--border-light)" }}>
          {reviewMode === "team" ? (
            <><Button size="lg" className="gap-2 text-white" onClick={onReview}><ClipboardCheck size={15} />审核</Button><Button variant="outline" size="lg" onClick={onDetail}>查看详情</Button></>
          ) : reviewMode === "public" ? (
            <><Button size="lg" className="gap-2 text-white" onClick={onReviewPublic}><Globe2 size={15} />审核公共发布</Button><Button variant="outline" size="lg" onClick={onDetail}>查看详情</Button></>
          ) : (
            <>
              <Button size="lg" className="gap-2 text-white" onClick={onCopy}><Clipboard size={15} />复制</Button>
              {activeLibrary === "inspiration" && <Button variant="outline" size="lg" className="gap-2" onClick={onCollect}><FolderHeart size={15} />收藏</Button>}
              {prompt.status === "pending" && activeLibrary === "personal" && <Button variant="outline" size="lg" onClick={onCancel}>取消提交</Button>}
              {activeLibrary === "personal" && prompt.status !== "pending" && <Button variant="outline" size="lg" className="gap-1.5" onClick={onSubmit}><Send size={15} />{prompt.status === "rejected" ? "重新提交" : "提交团队"}</Button>}
              {canRequestPublic && (prompt.publicReviewStatus === "pending" ? canCancelPublic && <Button variant="outline" size="lg" onClick={onCancelPublic}>取消公共申请</Button> : <Button variant="outline" size="lg" className="gap-1.5" onClick={onSubmitPublic}><Globe2 size={15} />{prompt.publicReviewStatus === "rejected" ? "再次申请公共" : "申请公共发布"}</Button>)}
              {(activeLibrary === "personal" || canManage) && prompt.status !== "pending" && prompt.publicReviewStatus !== "pending" && <Button variant="outline" size="icon-lg" aria-label={`编辑${prompt.title}`} title="编辑" onClick={onEdit}><Pencil size={15} /></Button>}
              {(activeLibrary === "personal" || canManage) && prompt.status !== "pending" && prompt.publicReviewStatus !== "pending" && <Button variant="outline" size="icon-lg" aria-label={`删除${prompt.title}`} title="删除" className="text-[var(--danger)]" onClick={onDelete}><Trash2 size={15} /></Button>}
              <Button variant="outline" size="lg" onClick={onDetail}>详情</Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyState({ activeLibrary, teamView, onCreate }) {
  const copy = teamView === "pending"
    ? { title: "暂无团队入库申请", description: "新的个人提示词提交会出现在这里。" }
    : teamView === "public-pending"
      ? { title: "暂无公共发布申请", description: "新的团队提示词公共申请会出现在这里。" }
    : activeLibrary === "personal"
      ? { title: "暂无个人提示词", description: "创建或收藏提示词后会出现在这里。" }
      : { title: "没有匹配的提示词", description: "尝试调整关键词或筛选条件。" }
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 text-center" style={{ borderColor: "var(--border-base)" }}>
      <FilePlus2 size={34} className="text-[var(--text-disabled)]" />
      <h2 className="mt-3 text-sm font-semibold text-[var(--text-title)]">{copy.title}</h2>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{copy.description}</p>
      {activeLibrary === "personal" && <Button variant="outline" size="lg" className="mt-4" onClick={onCreate}>新建提示词</Button>}
    </div>
  )
}

function Modal({ title, description, onClose, width = "720px", footer, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  if (typeof document === "undefined") return null
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--overlay-scrim)] p-3 sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[calc(100vh-24px)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-h-[calc(100vh-40px)]" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5" style={{ borderColor: "var(--border-base)" }}>
          <div className="min-w-0"><h2 className="text-base font-semibold text-[var(--text-title)]">{title}</h2>{description && <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>}</div>
          <button type="button" onClick={onClose} aria-label={`关闭${title}`} className="grid size-8 shrink-0 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><X size={17} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border-base)" }}>{footer}</div>}
      </section>
    </div>,
    document.body,
  )
}

function PromptDetailDialog({ prompt, viewLibrary, onClose, onCopy, onCollect }) {
  const promptStatus = getPromptStatus(prompt, viewLibrary)
  return (
    <Modal title={prompt.title} description={`${prompt.sceneLabel} · ${prompt.source}`} onClose={onClose} width="820px" footer={<><Button variant="outline" size="lg" className="gap-2" onClick={onCopy}><Clipboard size={15} />复制提示词</Button>{prompt.library === "inspiration" && <Button size="lg" className="gap-2 text-white" onClick={onCollect}><FolderHeart size={15} />收藏到我的</Button>}</>}>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md bg-[var(--brand-primary-soft)] px-2 py-1 text-xs text-[var(--brand-primary)]">{prompt.sceneLabel}</span>
        {prompt.verified && <span className="flex items-center gap-1 rounded-md bg-[var(--success-bg)] px-2 py-1 text-xs text-[var(--success)]"><ShieldCheck size={13} />{viewLibrary === "public" ? "公司已验证" : "团队已验证"}</span>}
        {prompt.library === "inspiration" && <span className="rounded-md bg-[var(--warning-bg)] px-2 py-1 text-xs text-[var(--warning)]">未经验证</span>}
      </div>
      {prompt.summary && <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{prompt.summary}</p>}
      <h3 className="mt-5 text-sm font-semibold text-[var(--text-title)]">提示词内容</h3>
      <div className="mt-2 whitespace-pre-wrap rounded-lg border bg-[var(--gray-50)] p-4 text-sm leading-7 text-[var(--text-body)]" style={{ borderColor: "var(--border-base)" }}>{prompt.content}</div>
      <dl className="mt-5 grid gap-x-6 gap-y-3 rounded-lg border p-4 text-xs sm:grid-cols-[76px_1fr_76px_1fr]" style={{ borderColor: "var(--border-base)" }}>
        <dt className="text-[var(--text-secondary)]">参考图片</dt><dd className="text-[var(--text-body)]">{prompt.needsReference ? "需要" : "不需要"}</dd>
        <dt className="text-[var(--text-secondary)]">可见范围</dt><dd className="text-[var(--text-body)]">{formatVisibleOrganizations(prompt, viewLibrary)}</dd>
        <dt className="text-[var(--text-secondary)]">当前状态</dt><dd className="text-[var(--text-body)]">{promptStatus.label}</dd>
        <dt className="text-[var(--text-secondary)]">使用次数</dt><dd className="text-[var(--text-body)]">{prompt.usageCount ?? "--"}</dd>
      </dl>
      <h3 className="mt-5 text-sm font-semibold text-[var(--text-title)]">标签</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">{prompt.tags.map((tag) => <span key={tag} className="rounded-md bg-[var(--gray-100)] px-2 py-1 text-xs text-[var(--text-secondary)]">{tag}</span>)}</div>
      {prompt.status === "rejected" && <p className="mt-5 rounded-lg bg-[var(--danger-bg)] p-3 text-xs leading-5 text-[var(--danger)]">驳回原因：{prompt.rejectionReason}</p>}
      {prompt.publicReviewStatus === "rejected" && <p className="mt-5 rounded-lg bg-[var(--danger-bg)] p-3 text-xs leading-5 text-[var(--danger)]">公共驳回原因：{prompt.publicRejectionReason}</p>}
    </Modal>
  )
}

function EditPromptDialog({ prompt, currentUser, defaultLibrary, onClose, onSave }) {
  const [title, setTitle] = useState(prompt?.title || "")
  const [summary, setSummary] = useState(prompt?.summary || "")
  const [content, setContent] = useState(prompt?.content || "")
  const [sceneId, setSceneId] = useState(prompt?.sceneId || "general")
  const [needsReference, setNeedsReference] = useState(prompt?.needsReference ?? true)
  const [tags, setTags] = useState((prompt?.tags || []).join("、"))
  const [library, setLibrary] = useState(prompt?.library || defaultLibrary)
  const valid = title.trim() && content.trim()
  return (
    <Modal title={prompt ? "编辑提示词" : "新建提示词"} description={library === "public" ? "保存后立即作为公司内部已验证提示词对全公司可见。" : prompt?.library === "team" ? "修改后继续保留当前团队可见范围。" : "先保存到个人库，验证后再提交团队。"} onClose={onClose} width="760px" footer={<><Button variant="outline" size="lg" onClick={onClose}>取消</Button><Button size="lg" className="gap-2 text-white" disabled={!valid} onClick={() => onSave({ title: title.trim(), summary: summary.trim(), content: content.trim(), sceneId, needsReference, tags: tags.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean), library })}><Check size={15} />{!prompt && library === "public" ? "直接发布" : "保存提示词"}</Button></>}>
      {!prompt && isSystemAdmin(currentUser) && (
        <div className="mt-4">
          <FieldLabel>保存位置</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: "personal", label: "个人提示词" }, { id: "public", label: "公共提示词" }].map((option) => (
              <button key={option.id} type="button" onClick={() => setLibrary(option.id)} className="rounded-lg border p-3 text-left text-sm font-medium" style={library === option.id ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)", color: "var(--brand-primary)" } : { borderColor: "var(--border-base)", color: "var(--text-body)" }}>{option.label}</button>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="提示词名称"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="请输入便于查找的名称" className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></Field>
        <Field label="用途分类"><FilterSelect value={sceneId} onChange={setSceneId} options={promptSceneOptions.filter((option) => option.id !== "all")} ariaLabel="选择用途分类" /></Field>
        <Field label="标签" className="sm:col-span-2"><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="多个标签用逗号分隔" className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></Field>
      </div>
      <Field label="用途说明"><input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="一句话说明适用商品或使用场景" className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></Field>
      <Field label="提示词内容"><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={9} placeholder="请输入完整提示词" className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm leading-6 outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></Field>
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--text-body)]"><input type="checkbox" checked={needsReference} onChange={(event) => setNeedsReference(event.target.checked)} className="size-4 accent-[var(--brand-primary)]" />使用时需要上传商品或场景参考图</label>
    </Modal>
  )
}

function SubmitPromptDialog({ prompt, onClose, onConfirm }) {
  return (
    <Modal title="提交到团队" description="系统默认提交到本人所属钉钉部门，不需要手动选择组织。" onClose={onClose} width="520px" footer={<><Button variant="outline" size="lg" onClick={onClose}>取消</Button><Button size="lg" className="gap-2 text-white" onClick={onConfirm}><Send size={15} />确认提交</Button></>}>
      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}>
        <strong className="block text-sm text-[var(--text-title)]">{prompt.title}</strong>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{prompt.summary}</p>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-lg bg-[var(--brand-primary-soft)] p-3 text-sm text-[var(--text-body)]"><Users size={17} className="mt-0.5 shrink-0 text-[var(--brand-primary)]" /><div><strong className="block text-xs text-[var(--text-title)]">提交部门</strong><span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{demoPromptCurrentUser.department}</span></div></div>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--warning-bg)] p-3 text-xs leading-5 text-[var(--text-body)]"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" /><span>审批通过后，该提示词将成为团队资产，发布人将无法自行删除。如需删除，请联系团队负责人处理。</span></div>
    </Modal>
  )
}

function ReviewPromptDialog({ prompt, currentUser, onClose, onApprove, onReject }) {
  const [mode, setMode] = useState("approve")
  const [organizationIds, setOrganizationIds] = useState([prompt.ownerDepartmentId])
  const [reason, setReason] = useState("")
  return (
    <Modal title="审核团队提示词" description={`${prompt.ownerName} · ${prompt.ownerDepartment}`} onClose={onClose} width="820px" footer={<><Button variant="outline" size="lg" onClick={onClose}>取消</Button>{mode === "approve" ? <Button size="lg" className="gap-2 text-white" disabled={!organizationIds.length} onClick={() => onApprove(organizationIds)}><Check size={15} />通过并发布</Button> : <Button variant="destructive" size="lg" className="gap-2" disabled={!reason.trim()} onClick={() => onReject(reason.trim())}><XCircle size={15} />确认驳回</Button>}</>}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-title)]">{prompt.title}</h3>
          {prompt.summary && <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{prompt.summary}</p>}
          <p className="mt-2 rounded-lg bg-[var(--gray-50)] p-3 text-xs leading-6 text-[var(--text-body)]">{prompt.content}</p>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--gray-100)] p-1">
            <button type="button" onClick={() => setMode("approve")} className={`h-9 rounded-md text-sm font-medium ${mode === "approve" ? "bg-white text-[var(--success)] shadow-sm" : "text-[var(--text-secondary)]"}`}>通过</button>
            <button type="button" onClick={() => setMode("reject")} className={`h-9 rounded-md text-sm font-medium ${mode === "reject" ? "bg-white text-[var(--danger)] shadow-sm" : "text-[var(--text-secondary)]"}`}>驳回</button>
          </div>
          {mode === "approve" ? <OrganizationScopeSelector value={organizationIds} onChange={setOrganizationIds} allowedScopeIds={isSystemAdmin(currentUser) ? null : currentUser.organizationScopeIds} /> : <Field label="驳回原因"><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={6} placeholder="请输入明确的修改建议" className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></Field>}
        </div>
      </div>
    </Modal>
  )
}

function SubmitPublicPromptDialog({ prompt, onClose, onConfirm }) {
  return (
    <Modal title="申请公共发布" description="提交后由系统管理员审核，审核期间团队提示词继续可用。" onClose={onClose} width="560px" footer={<><Button variant="outline" size="lg" onClick={onClose}>取消</Button><Button size="lg" className="gap-2 text-white" onClick={onConfirm}><Globe2 size={15} />确认申请</Button></>}>
      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}>
        <strong className="block text-sm text-[var(--text-title)]">{prompt.title}</strong>
        <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{prompt.summary}</p>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--warning-bg)] p-3 text-xs leading-5 text-[var(--text-body)]"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" /><span>审批通过后，该提示词将成为公司公共资产，发布人及团队负责人将无法自行删除。如需删除，请联系系统管理员处理。</span></div>
    </Modal>
  )
}

function ReviewPublicPromptDialog({ prompt, onClose, onApprove, onReject }) {
  const [mode, setMode] = useState("approve")
  const [reason, setReason] = useState("")
  return (
    <Modal title="审核公共提示词" description="公共发布仅由系统管理员处理。" onClose={onClose} width="760px" footer={<><Button variant="outline" size="lg" onClick={onClose}>取消</Button>{mode === "approve" ? <Button size="lg" className="gap-2 text-white" onClick={onApprove}><Check size={15} />通过并发布</Button> : <Button variant="destructive" size="lg" disabled={!reason.trim()} onClick={() => onReject(reason.trim())}><XCircle size={15} />确认驳回</Button>}</>}>
      <div className="rounded-lg border bg-[var(--gray-50)] p-4" style={{ borderColor: "var(--border-base)" }}>
        <strong className="block text-sm text-[var(--text-title)]">{prompt.title}</strong>
        <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[var(--text-body)]">{prompt.content}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-[var(--gray-100)] p-1">
        <button type="button" onClick={() => setMode("approve")} className={`h-9 rounded-md text-sm font-medium ${mode === "approve" ? "bg-white text-[var(--success)] shadow-sm" : "text-[var(--text-secondary)]"}`}>通过</button>
        <button type="button" onClick={() => setMode("reject")} className={`h-9 rounded-md text-sm font-medium ${mode === "reject" ? "bg-white text-[var(--danger)] shadow-sm" : "text-[var(--text-secondary)]"}`}>驳回</button>
      </div>
      {mode === "approve" ? <p className="mt-4 rounded-lg bg-[var(--success-bg)] p-3 text-xs leading-5 text-[var(--text-body)]">通过后提示词进入公共提示词并标记为公司内部已验证。</p> : <Field label="驳回原因"><textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="请输入明确的修改建议" className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></Field>}
    </Modal>
  )
}

function ConfirmDeleteDialog({ prompt, onClose, onConfirm }) {
  const isPublicPrompt = prompt.library === "public" || prompt.publicReviewStatus === "approved"
  const description = isPublicPrompt
    ? "删除后全公司将无法继续查看、复制或选择，历史任务不受影响。"
    : prompt.library === "team"
      ? "删除后可见团队将无法继续查看、复制或选择，历史任务不受影响。"
      : "删除后将从个人提示词及所有选择入口中移除。"
  return <Modal title="删除提示词" description={description} onClose={onClose} width="460px" footer={<><Button variant="outline" size="lg" onClick={onClose}>取消</Button><Button variant="destructive" size="lg" onClick={onConfirm}>确认删除</Button></>}><strong className="block text-sm text-[var(--text-title)]">{prompt.title}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{formatVisibleOrganizations(prompt, isPublicPrompt ? "public" : prompt.library)}</p></Modal>
}

function SourceManagementDialog({ sources, onClose, onToggle, onRefresh, onAdd, onToast }) {
  const [blockedTags, setBlockedTags] = useState("NSFW、作者账号、无关来源")
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [sync, setSync] = useState("每 1 小时")
  function submitSource() {
    if (!name.trim()) return
    onAdd({ name: name.trim(), sync })
    setName("")
    setAdding(false)
  }
  return (
    <Modal title="外部来源管理" description="外部内容只进入灵感广场，不会自动成为团队已验证提示词。" onClose={onClose} width="900px" footer={<Button variant="outline" size="lg" onClick={onClose}>完成</Button>}>
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end" style={{ borderColor: "var(--border-base)" }}>
        <Field label="屏蔽标签" className="flex-1"><input value={blockedTags} onChange={(event) => setBlockedTags(event.target.value)} className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[var(--brand-primary)]" style={{ borderColor: "var(--border-base)" }} /></Field>
        <Button variant="outline" size="lg" className="gap-2" onClick={() => onToast("屏蔽标签已保存")}><Check size={15} />保存</Button>
        <Button size="lg" className="gap-2 text-white" onClick={() => setAdding((value) => !value)}><Plus size={15} />新增来源</Button>
      </div>
      {adding && (
        <div className="mt-4 grid gap-3 rounded-lg border bg-[var(--gray-50)] p-3 sm:grid-cols-[1fr_180px_auto]" style={{ borderColor: "var(--border-base)" }}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="来源名称" className="h-10 rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} />
          <select value={sync} onChange={(event) => setSync(event.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }}><option>每 1 小时</option><option>每天</option><option>手动更新</option></select>
          <Button size="lg" className="text-white" disabled={!name.trim()} onClick={submitSource}>添加</Button>
        </div>
      )}
      <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
        {sources.map((source) => (
          <div key={source.id} className="flex flex-col gap-3 border-b p-3 last:border-b-0 sm:flex-row sm:items-center" style={{ borderColor: "var(--border-light)" }}>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={source.enabled} onChange={() => onToggle(source.id)} className="size-4 accent-[var(--brand-primary)]" />
              <div className="min-w-0"><strong className="block truncate text-sm text-[var(--text-title)]">{source.name}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{source.count} 条 · {source.sync} · {source.lastSuccess}</span></div>
            </label>
            <span className={`w-fit rounded-md px-2 py-1 text-xs ${source.enabled ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--gray-100)] text-[var(--text-secondary)]"}`}>{source.enabled ? "正常同步" : "已停用"}</span>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!source.enabled} onClick={() => onRefresh(source.id)}><RefreshCw size={13} />立即更新</Button>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function OrganizationScopeSelector({ value, onChange, allowedScopeIds = null }) {
  const [query, setQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState(() => compactOrganizationIds(value).flatMap((organizationId) => organizationMap[organizationId]?.ancestorIds || []))
  const normalizedQuery = query.trim().toLowerCase()
  const visibleIds = useMemo(() => {
    if (!normalizedQuery) return null
    const ids = new Set()
    organizationRows.forEach((organization) => {
      if (`${organization.name} ${organization.path}`.toLowerCase().includes(normalizedQuery)) {
        ids.add(organization.id)
        organization.ancestorIds.forEach((id) => ids.add(id))
      }
    })
    return ids
  }, [normalizedQuery])
  const rows = organizationRows.filter((organization) => {
    const isAllowed = !allowedScopeIds || isOrganizationInScope(organization.id, allowedScopeIds)
    const isAllowedAncestor = allowedScopeIds?.some((scopeId) => organizationMap[scopeId]?.ancestorIds.includes(organization.id))
    if (!isAllowed && !isAllowedAncestor) return false
    if (visibleIds) return visibleIds.has(organization.id)
    return organization.ancestorIds.every((ancestorId) => expandedIds.includes(ancestorId))
  })

  function toggleOrganization(organizationId) {
    if (allowedScopeIds && !isOrganizationInScope(organizationId, allowedScopeIds)) return
    const selected = new Set(value)
    if (selected.has(organizationId)) selected.delete(organizationId)
    else selected.add(organizationId)
    onChange(compactOrganizationIds([...selected]))
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
      <div className="border-b p-3" style={{ borderColor: "var(--border-base)" }}>
        <FieldLabel>可见组织</FieldLabel>
        <label className="relative block"><Search size={15} className="absolute left-3 top-2.5 text-[var(--text-secondary)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索组织名称" className="h-9 w-full rounded-lg border pl-9 pr-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
      </div>
      <div className="flex items-center justify-between gap-2 border-b bg-[var(--gray-50)] px-3 py-2" style={{ borderColor: "var(--border-base)" }}><strong className="truncate text-sm text-[var(--text-title)]">{permissionOrganizationName}</strong><span className="shrink-0 text-[11px] text-[var(--text-secondary)]">父组织包含全部下级</span></div>
      <div className="max-h-56 overflow-y-auto">
        {rows.map((organization) => {
          const selected = value.includes(organization.id)
          const inherited = organization.ancestorIds.some((ancestorId) => value.includes(ancestorId))
          const disabled = inherited || Boolean(allowedScopeIds && !isOrganizationInScope(organization.id, allowedScopeIds))
          const hasChildren = organization.children.length > 0
          const expanded = Boolean(normalizedQuery) || expandedIds.includes(organization.id)
          return (
            <div key={organization.id} className="flex min-h-10 items-center gap-1 border-b pr-3 last:border-b-0" style={{ borderColor: "var(--border-light)", paddingLeft: `${8 + organization.depth * 18}px` }}>
              {hasChildren ? <button type="button" aria-label={`${expanded ? "收起" : "展开"}${organization.name}`} disabled={Boolean(normalizedQuery)} onClick={() => setExpandedIds((current) => current.includes(organization.id) ? current.filter((id) => id !== organization.id) : [...current, organization.id])} className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><ChevronRight size={14} className={expanded ? "rotate-90" : ""} /></button> : <span className="size-7 shrink-0" />}
              <label className={`flex min-w-0 flex-1 items-center gap-2 py-2 text-xs ${disabled ? "cursor-not-allowed text-[var(--text-secondary)]" : "cursor-pointer text-[var(--text-body)]"}`}><input type="checkbox" checked={selected || inherited} disabled={disabled} onChange={() => toggleOrganization(organization.id)} className="size-4 accent-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50" /><span className="truncate" title={organization.path}>{organization.name}</span>{inherited && <span className="ml-auto shrink-0 text-[11px]">随父组织</span>}</label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children, className = "" }) {
  return <label className={`mt-4 block ${className}`}><FieldLabel>{label}</FieldLabel>{children}</label>
}

function FieldLabel({ children }) {
  return <span className="mb-1.5 block text-xs font-semibold text-[var(--text-title)]">{children}</span>
}
