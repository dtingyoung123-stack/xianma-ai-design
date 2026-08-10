"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  Check,
  ClipboardCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileAudio,
  FileText,
  FileVideo,
  FolderOpen,
  Image as ImageIcon,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react"
import SafeImage from "@/components/SafeImage"
import { Button } from "@/components/ui/button"
import {
  permissionOrganizationName,
  permissionOrganizationTree,
} from "@/data/demo/admin"
import { demoCurrentUser, initialMaterials } from "@/data/demo/materials"

const scopeOptions = [
  { id: "personal", label: "个人素材", shortLabel: "个人", description: "仅自己可见" },
  { id: "team", label: "团体素材", shortLabel: "团体", description: "指定组织可见" },
  { id: "public", label: "公共素材", shortLabel: "公共", description: "全公司可见" },
]

const typeOptions = [
  { id: "all", label: "全部类型" },
  { id: "image", label: "图片" },
  { id: "video", label: "视频" },
  { id: "audio", label: "音频" },
]

const typeMeta = {
  image: { label: "图片", icon: ImageIcon },
  video: { label: "视频", icon: FileVideo },
  audio: { label: "音频", icon: FileAudio },
}

function flattenOrganizations(nodes, depth = 0, ancestorIds = [], ancestorNames = []) {
  return nodes.flatMap((node) => [
    {
      ...node,
      depth,
      ancestorIds,
      path: [...ancestorNames, node.name].join(" / "),
    },
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

function formatScope(material) {
  if (material.scope === "personal") return "仅本人"
  if (material.scope === "public") return "全公司"
  const names = material.visibleOrgIds
    .map((organizationId) => organizationMap[organizationId]?.name)
    .filter(Boolean)
  return names.length ? `${names.join("、")}（含下级）` : "未配置组织"
}

function isSystemAdmin(user) {
  return user.roleIds.includes("system_admin")
}

function canReviewTeamMaterials(user) {
  return isSystemAdmin(user)
    || user.roleIds.includes("department_admin")
    || (
      user.roleIds.includes("approval_admin")
      && user.approvalTypeIds?.includes("material_publish")
    )
}

function isOrganizationInScope(organizationId, scopeIds = []) {
  const organization = organizationMap[organizationId]
  return Boolean(organization && scopeIds.some((scopeId) => (
    organizationId === scopeId || organization.ancestorIds.includes(scopeId)
  )))
}

function canReviewMaterial(user, material) {
  return canReviewTeamMaterials(user)
    && (isSystemAdmin(user) || isOrganizationInScope(material.ownerDepartmentId, user.organizationScopeIds))
}

function canManageMaterial(user, material) {
  if (isSystemAdmin(user)) return true
  if (material.scope === "personal") return material.ownerId === user.id
  return material.scope === "team"
    && user.roleIds.includes("department_admin")
    && isOrganizationInScope(material.ownerDepartmentId, user.organizationScopeIds)
}

function fileType(file) {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("audio/")) return "audio"
  return "prompt"
}

function fileSize(size) {
  if (!size) return "0 KB"
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

export default function MaterialsClient() {
  const [materials, setMaterials] = useState(initialMaterials)
  const [scope, setScope] = useState("personal")
  const [teamView, setTeamView] = useState("all")
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState("")

  const pendingCount = materials.filter((material) => material.status === "pending" && canReviewMaterial(demoCurrentUser, material)).length
  const scopeCounts = useMemo(() => ({
    personal: materials.filter((material) => material.scope === "personal" && material.ownerId === demoCurrentUser.id).length,
    team: materials.filter((material) => material.scope === "team" && material.status === "active").length,
    public: materials.filter((material) => material.scope === "public" && material.status === "active").length,
  }), [materials])

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return materials.filter((material) => {
      const scopeMatch = scope === "personal"
        ? material.scope === "personal" && material.ownerId === demoCurrentUser.id
        : scope === "team"
          ? teamView === "pending"
            ? material.status === "pending" && canReviewMaterial(demoCurrentUser, material)
            : material.scope === "team" && material.status === "active"
          : material.scope === "public" && material.status === "active"
      const typeMatch = typeFilter === "all" || material.type === typeFilter
      const queryMatch = !normalizedQuery || [
        material.title,
        material.filename,
        material.source,
        material.ownerDepartment,
        ...material.tags,
      ].join(" ").toLowerCase().includes(normalizedQuery)
      return scopeMatch && typeMatch && queryMatch
    })
  }, [materials, query, scope, teamView, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize))
  const activePage = Math.min(page, totalPages)
  const visibleMaterials = filteredMaterials.slice((activePage - 1) * pageSize, activePage * pageSize)

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(""), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  function changeScope(nextScope) {
    setScope(nextScope)
    setTeamView("all")
    setQuery("")
    setTypeFilter("all")
    setPage(1)
  }

  function openPendingApprovals() {
    setScope("team")
    setTeamView("pending")
    setQuery("")
    setTypeFilter("all")
    setPage(1)
  }

  function updateMaterial(materialId, updater) {
    setMaterials((current) => current.map((material) => (
      material.id === materialId ? updater(material) : material
    )))
  }

  function submitToTeam(material, note) {
    updateMaterial(material.id, (current) => ({
      ...current,
      status: "pending",
      rejectionReason: "",
      remark: note || current.remark,
      submittedAt: "刚刚",
    }))
    setDialog(null)
    setToast("已提交给所属部门审核")
  }

  function cancelSubmission(material) {
    updateMaterial(material.id, (current) => ({ ...current, status: "active", submittedAt: "" }))
    setToast("已取消团队提交")
  }

  function approveMaterial(material, organizationIds) {
    updateMaterial(material.id, (current) => ({
      ...current,
      scope: "team",
      status: "active",
      source: "团队审核",
      visibleOrgIds: compactOrganizationIds(organizationIds),
      reviewedAt: "刚刚",
    }))
    setDialog(null)
    setToast("素材已发布到团体素材库")
  }

  function rejectMaterial(material, reason) {
    updateMaterial(material.id, (current) => ({
      ...current,
      scope: "personal",
      status: "rejected",
      rejectionReason: reason,
      reviewedAt: "刚刚",
    }))
    setDialog(null)
    setToast("已驳回，素材继续保留在提交人的个人素材中")
  }

  function saveMaterial(materialId, values) {
    updateMaterial(materialId, (current) => ({
      ...current,
      ...values,
      visibleOrgIds: values.scope === "team" ? compactOrganizationIds(values.visibleOrgIds) : [],
    }))
    setDialog(null)
    setToast("素材信息已保存")
  }

  function addMaterials(files, values) {
    const nextMaterials = files.map((file, index) => {
      const type = fileType(file)
      return {
        id: `material-upload-${Date.now()}-${index}`,
        title: file.name.replace(/\.[^.]+$/, "") || file.name,
        filename: file.name,
        src: type === "image" ? URL.createObjectURL(file) : null,
        type,
        mime: file.type || "application/octet-stream",
        size: fileSize(file.size),
        dimensions: "待识别",
        source: "手动上传",
        tags: values.tags,
        remark: values.remark,
        scope: values.scope,
        status: "active",
        visibleOrgIds: values.scope === "team" ? compactOrganizationIds(values.visibleOrgIds) : [],
        ownerId: demoCurrentUser.id,
        ownerName: demoCurrentUser.name,
        ownerDepartmentId: demoCurrentUser.departmentId,
        ownerDepartment: demoCurrentUser.department,
        createdAt: "刚刚",
      }
    })
    setMaterials((current) => [...nextMaterials, ...current])
    setScope(values.scope)
    setTeamView("all")
    setPage(1)
    setDialog(null)
    setToast(`已上传 ${nextMaterials.length} 个素材`)
  }

  function deleteMaterial(material) {
    setMaterials((current) => current.filter((item) => item.id !== material.id))
    setDialog(null)
    setToast("素材已删除")
  }

  function downloadMaterial(material) {
    const link = document.createElement("a")
    if (material.src) {
      link.href = material.src
    } else {
      link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(material.remark || material.title)}`
    }
    link.download = material.filename
    link.click()
    setToast("已开始下载")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-[var(--gray-100)] p-1" role="tablist" aria-label="素材范围">
          {scopeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={scope === option.id}
              onClick={() => changeScope(option.id)}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${scope === option.id ? "bg-white text-[var(--brand-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-title)]"}`}
            >
              {option.id === "personal" ? <FolderOpen size={16} /> : option.id === "team" ? <Users size={16} /> : <ShieldCheck size={16} />}
              {option.label}
              <span className="rounded-md bg-[var(--brand-primary-soft)] px-1.5 py-0.5 text-xs tabular-nums text-[var(--brand-primary)]">{scopeCounts[option.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canReviewTeamMaterials(demoCurrentUser) && (
            <Button variant="outline" size="lg" className="gap-2" onClick={openPendingApprovals}>
              <ClipboardCheck size={16} />
              待我审批
              <span className="rounded-md bg-[var(--warning-bg)] px-1.5 py-0.5 text-xs text-[var(--warning)]">{pendingCount}</span>
            </Button>
          )}
          <Button size="lg" className="gap-2 text-white" onClick={() => setDialog({ type: "upload", defaultScope: scope })}>
            <Upload size={16} />
            上传素材
          </Button>
        </div>
      </div>

      {scope === "team" && (
        <div className="flex items-center gap-1 border-b" style={{ borderColor: "var(--border-base)" }}>
          {[{ id: "all", label: "全部团体素材" }, { id: "pending", label: `待审核 ${pendingCount}` }].map((view) => (
            <button key={view.id} type="button" onClick={() => { setTeamView(view.id); setPage(1) }} className={`border-b-2 px-3 py-2 text-sm font-medium ${teamView === view.id ? "border-[var(--brand-primary)] text-[var(--brand-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}>{view.label}</button>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[minmax(260px,1fr)_180px_auto]">
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-3 text-[var(--text-secondary)]" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1) }}
            placeholder="搜索标题、标签、来源或部门"
            aria-label="搜索素材"
            className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]"
            style={{ borderColor: "var(--border-base)" }}
          />
        </label>
        <FilterSelect value={typeFilter} onChange={(value) => { setTypeFilter(value); setPage(1) }} options={typeOptions} ariaLabel="按素材类型筛选" />
        <div className="flex h-10 items-center justify-end text-xs text-[var(--text-secondary)]">
          找到 {filteredMaterials.length} 个
        </div>
      </div>

      {visibleMaterials.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(230px,100%),1fr))] gap-4">
          {visibleMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              currentUser={demoCurrentUser}
              reviewMode={scope === "team" && teamView === "pending"}
              onView={() => setDialog({ type: "detail", material })}
              onEdit={() => setDialog({ type: "edit", material })}
              onDownload={() => downloadMaterial(material)}
              onDelete={() => setDialog({ type: "delete", material })}
              onSubmit={() => setDialog({ type: "submit", material })}
              onCancelSubmission={() => cancelSubmission(material)}
              onReview={() => setDialog({ type: "review", material })}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 text-center" style={{ borderColor: "var(--border-base)" }}>
          <FolderOpen size={36} className="text-[var(--text-disabled)]" />
          <strong className="mt-3 text-sm text-[var(--text-title)]">暂无符合条件的素材</strong>
          <span className="mt-1 text-xs text-[var(--text-secondary)]">调整筛选条件，或上传新的素材。</span>
          <Button className="mt-4 gap-2 text-white" onClick={() => setDialog({ type: "upload", defaultScope: scope })}><Upload size={15} />上传素材</Button>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-base)" }}>
        <span className="text-sm text-[var(--text-secondary)]">共 {filteredMaterials.length} 个素材</span>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} className="h-8 rounded-md border bg-white px-2 text-sm" style={{ borderColor: "var(--border-base)" }} aria-label="每页素材数量">
            <option value={8}>8 个/页</option>
            <option value={12}>12 个/页</option>
            <option value={20}>20 个/页</option>
          </select>
          <Button variant="outline" size="icon" aria-label="上一页" title="上一页" disabled={activePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} /></Button>
          <span className="min-w-16 text-center text-sm text-[var(--text-body)]">{activePage} / {totalPages}</span>
          <Button variant="outline" size="icon" aria-label="下一页" title="下一页" disabled={activePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={16} /></Button>
        </div>
      </div>

      {dialog?.type === "upload" && <UploadMaterialDialog defaultScope={dialog.defaultScope} currentUser={demoCurrentUser} onClose={() => setDialog(null)} onSubmit={addMaterials} />}
      {dialog?.type === "detail" && <MaterialDetailDialog material={dialog.material} onClose={() => setDialog(null)} onDownload={() => downloadMaterial(dialog.material)} />}
      {dialog?.type === "edit" && <EditMaterialDialog material={dialog.material} onClose={() => setDialog(null)} onSave={(values) => saveMaterial(dialog.material.id, values)} />}
      {dialog?.type === "submit" && <SubmitMaterialDialog material={dialog.material} currentUser={demoCurrentUser} onClose={() => setDialog(null)} onSubmit={(note) => submitToTeam(dialog.material, note)} />}
      {dialog?.type === "review" && <ReviewMaterialDialog material={dialog.material} onClose={() => setDialog(null)} onApprove={(organizationIds) => approveMaterial(dialog.material, organizationIds)} onReject={(reason) => rejectMaterial(dialog.material, reason)} />}
      {dialog?.type === "delete" && <ConfirmDeleteDialog material={dialog.material} onClose={() => setDialog(null)} onConfirm={() => deleteMaterial(dialog.material)} />}

      {toast && <div className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-lg bg-[var(--gray-900)] px-4 py-3 text-sm text-white shadow-xl" role="status">{toast}</div>}
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

function MaterialCard({ material, currentUser, reviewMode, onView, onEdit, onDownload, onDelete, onSubmit, onCancelSubmission, onReview }) {
  const TypeIcon = typeMeta[material.type]?.icon || FileText
  const canManage = canManageMaterial(currentUser, material)
  const isOwnPersonal = material.scope === "personal" && material.ownerId === currentUser.id
  return (
    <article className="group flex min-h-[360px] flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-[var(--shadow-card-hover)]" style={{ borderColor: "var(--border-base)" }}>
      <button type="button" onClick={onView} className="relative block aspect-[4/3] w-full overflow-hidden bg-[var(--gray-100)] text-left" aria-label={`查看${material.title}`}>
        {material.src && material.type === "image" ? (
          <SafeImage src={material.src} alt={material.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-secondary)]"><TypeIcon size={34} /><span className="text-xs">{typeMeta[material.type]?.label}</span></span>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-[var(--gray-900)]/80 px-2 py-1 text-xs text-white">{scopeOptions.find((option) => option.id === material.scope)?.shortLabel}</span>
        {material.status !== "active" && (
          <span className={`absolute right-2 top-2 rounded-md px-2 py-1 text-xs ${material.status === "pending" ? "bg-[var(--warning-bg)] text-[var(--warning)]" : "bg-[var(--danger-bg)] text-[var(--danger)]"}`}>{material.status === "pending" ? "审核中" : "已驳回"}</span>
        )}
      </button>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <strong className="min-w-0 flex-1 truncate text-sm text-[var(--text-title)]" title={material.title}>{material.title}</strong>
          <span className="shrink-0 rounded-md bg-[var(--gray-100)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]">{typeMeta[material.type]?.label}</span>
        </div>
        <span className="mt-1 truncate text-xs text-[var(--text-secondary)]" title={formatScope(material)}>{formatScope(material)}</span>
        <div className="mt-2 flex min-h-6 flex-wrap gap-1">
          {material.tags.length ? material.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-[var(--gray-100)] px-1.5 py-1 text-[11px] text-[var(--text-secondary)]">{tag}</span>) : <span className="text-xs text-[var(--text-disabled)]">无标签</span>}
        </div>
        {reviewMode && <span className="mt-2 truncate text-xs text-[var(--text-secondary)]" title={material.ownerDepartment}>{material.ownerDepartment}</span>}
        {material.status === "rejected" && <span className="mt-2 line-clamp-2 text-xs text-[var(--danger)]">{material.rejectionReason}</span>}
        <div className="mt-auto border-t pt-3" style={{ borderColor: "var(--border-light)" }}>
          {reviewMode ? (
            <Button size="sm" className="w-full gap-1 text-white" onClick={onReview}><Check size={14} />审核</Button>
          ) : isOwnPersonal ? (
            material.status === "pending" ? (
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={onCancelSubmission}><XCircle size={14} />取消提交</Button>
            ) : (
              <Button size="sm" className="w-full gap-1 text-white" onClick={onSubmit}><Send size={14} />{material.status === "rejected" ? "重新提交" : "提交到团队"}</Button>
            )
          ) : null}
          <div className={`flex min-w-0 items-center gap-1 ${reviewMode || isOwnPersonal ? "mt-2 justify-end" : ""}`}>
            {!reviewMode && !isOwnPersonal && <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-secondary)]">{material.createdAt}</span>}
            <IconAction label="查看" icon={Eye} onClick={onView} />
            <IconAction label="下载" icon={Download} onClick={onDownload} />
            {canManage && material.status !== "pending" && <IconAction label="编辑" icon={Pencil} onClick={onEdit} />}
            {canManage && material.status !== "pending" && <IconAction label="删除" icon={Trash2} tone="danger" onClick={onDelete} />}
          </div>
        </div>
      </div>
    </article>
  )
}

function IconAction({ label, icon: Icon, tone, onClick }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className={`grid size-8 shrink-0 place-items-center rounded-md border transition-colors ${tone === "danger" ? "text-[var(--danger)] hover:bg-[var(--danger-bg)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`} style={{ borderColor: "var(--border-base)" }}><Icon size={14} /></button>
}

function Modal({ title, description, onClose, children, footer, width = "760px" }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  if (typeof document === "undefined") return null
  const content = (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--overlay-scrim)] p-3 sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[calc(100vh-24px)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-h-[calc(100vh-40px)]" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5" style={{ borderColor: "var(--border-base)" }}>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--text-title)]">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={`关闭${title}`} className="grid size-8 shrink-0 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><X size={17} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border-base)" }}>{footer}</div>}
      </section>
    </div>
  )
  return createPortal(content, document.body)
}

function UploadMaterialDialog({ defaultScope, currentUser, onClose, onSubmit }) {
  const allowedDefault = defaultScope === "public" && !isSystemAdmin(currentUser) ? "personal" : defaultScope
  const [files, setFiles] = useState([])
  const [scope, setScope] = useState(allowedDefault)
  const [tags, setTags] = useState("")
  const [remark, setRemark] = useState("")
  const [visibleOrgIds, setVisibleOrgIds] = useState(scope === "team" ? [currentUser.departmentId] : [])
  const canSubmit = files.length > 0 && (scope !== "team" || visibleOrgIds.length > 0)

  function changeScope(nextScope) {
    setScope(nextScope)
    if (nextScope === "team" && !visibleOrgIds.length) setVisibleOrgIds([currentUser.departmentId])
  }

  return (
    <Modal
      title="上传素材"
      description="批量文件使用同一素材范围和标签，上传后仍可逐个编辑。"
      onClose={onClose}
      width="820px"
      footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button className="text-white" disabled={!canSubmit} onClick={() => onSubmit(files, { scope, tags: tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean), remark, visibleOrgIds })}>上传 {files.length || ""}</Button></>}
    >
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-[var(--gray-50)] px-4 text-center hover:bg-[var(--bg-hover)]" style={{ borderColor: "var(--border-base)" }}>
        <Upload size={24} className="text-[var(--brand-primary)]" />
        <strong className="mt-2 text-sm text-[var(--text-title)]">选择图片、视频或音频文件</strong>
        <span className="mt-1 text-xs text-[var(--text-secondary)]">支持一次选择多个文件</span>
        <input type="file" multiple accept="image/*,video/*,audio/*" className="sr-only" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
      </label>
      {files.length > 0 && (
        <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border px-3" style={{ borderColor: "var(--border-base)" }}>
          {files.map((file) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 border-b py-2 text-xs last:border-b-0" style={{ borderColor: "var(--border-light)" }}><span className="truncate text-[var(--text-body)]">{file.name}</span><span className="shrink-0 text-[var(--text-secondary)]">{fileSize(file.size)}</span></div>)}
        </div>
      )}
      <FieldLabel>素材范围</FieldLabel>
      <div className="grid gap-2 sm:grid-cols-3">
        {scopeOptions.map((option) => {
          const disabled = option.id === "public" && !isSystemAdmin(currentUser)
          return (
            <button key={option.id} type="button" disabled={disabled} onClick={() => changeScope(option.id)} className="rounded-lg border p-3 text-left disabled:cursor-not-allowed disabled:opacity-50" style={scope === option.id ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)" }}>
              <strong className="block text-sm text-[var(--text-title)]">{option.label}</strong>
              <span className="mt-1 block text-xs text-[var(--text-secondary)]">{option.description}</span>
            </button>
          )
        })}
      </div>
      {scope === "team" && <OrganizationScopeSelector value={visibleOrgIds} onChange={setVisibleOrgIds} />}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label><FieldLabel inline>统一标签</FieldLabel><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="多个标签用逗号分隔" className="h-9 w-full rounded-lg border px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
        <label><FieldLabel inline>统一备注</FieldLabel><input value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="选填" className="h-9 w-full rounded-lg border px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
      </div>
    </Modal>
  )
}

function SubmitMaterialDialog({ material, currentUser, onClose, onSubmit }) {
  const [note, setNote] = useState(material.remark || "")
  return (
    <Modal title="提交到团队" description="提交后仍保留在个人素材中，审核通过后自动进入团体素材库。" onClose={onClose} width="520px" footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button className="gap-2 text-white" onClick={() => onSubmit(note)}><Send size={15} />确认提交</Button></>}>
      <div className="rounded-lg bg-[var(--gray-50)] px-4 py-3">
        <strong className="block text-sm text-[var(--text-title)]">{material.title}</strong>
        <span className="mt-1 block text-xs text-[var(--text-secondary)]">默认提交给：{currentUser.department}</span>
      </div>
      <label className="mt-4 block"><FieldLabel inline>推荐说明</FieldLabel><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="选填，简单说明适用场景" rows={3} className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
    </Modal>
  )
}

function ReviewMaterialDialog({ material, onClose, onApprove, onReject }) {
  const [visibleOrgIds, setVisibleOrgIds] = useState([material.ownerDepartmentId])
  const [reason, setReason] = useState("")
  const [showReject, setShowReject] = useState(false)
  return (
    <Modal
      title="审核团队素材"
      description={`${material.ownerDepartment} 提交`}
      onClose={onClose}
      width="760px"
      footer={showReject ? <><Button variant="outline" onClick={() => setShowReject(false)}>返回</Button><Button variant="destructive" disabled={!reason.trim()} onClick={() => onReject(reason.trim())}>确认驳回</Button></> : <><Button variant="outline" onClick={() => setShowReject(true)}>驳回</Button><Button className="gap-2 text-white" disabled={!visibleOrgIds.length} onClick={() => onApprove(visibleOrgIds)}><Check size={15} />通过并发布</Button></>}
    >
      <MaterialReviewSummary material={material} />
      {showReject ? (
        <label className="mt-4 block"><FieldLabel inline>驳回原因</FieldLabel><textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} placeholder="填写后提交人可以据此修改" rows={4} className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
      ) : (
        <OrganizationScopeSelector value={visibleOrgIds} onChange={setVisibleOrgIds} />
      )}
    </Modal>
  )
}

function MaterialReviewSummary({ material }) {
  return <div className="flex gap-3 rounded-lg bg-[var(--gray-50)] p-3">{material.src ? <SafeImage src={material.src} alt={material.title} className="size-16 shrink-0 rounded-md object-cover" /> : <span className="grid size-16 shrink-0 place-items-center rounded-md bg-white"><FileText size={24} /></span>}<div className="min-w-0"><strong className="block truncate text-sm text-[var(--text-title)]">{material.title}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{material.tags.join("、") || "无标签"}</span><span className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{material.remark || "未填写推荐说明"}</span></div></div>
}

function EditMaterialDialog({ material, onClose, onSave }) {
  const [title, setTitle] = useState(material.title)
  const [tags, setTags] = useState(material.tags.join("，"))
  const [remark, setRemark] = useState(material.remark || "")
  const [scope, setScope] = useState(material.scope)
  const [visibleOrgIds, setVisibleOrgIds] = useState(material.visibleOrgIds)
  const canSave = title.trim() && (scope !== "team" || visibleOrgIds.length > 0)
  return (
    <Modal title="编辑素材" onClose={onClose} width="720px" footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button className="text-white" disabled={!canSave} onClick={() => onSave({ title: title.trim(), tags: tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean), remark, scope, visibleOrgIds })}>保存</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><FieldLabel inline>标题</FieldLabel><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-9 w-full rounded-lg border px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
        <label><FieldLabel inline>标签</FieldLabel><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="多个标签用逗号分隔" className="h-9 w-full rounded-lg border px-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
      </div>
      <label className="mt-3 block"><FieldLabel inline>备注</FieldLabel><textarea value={remark} onChange={(event) => setRemark(event.target.value)} rows={3} className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
      <FieldLabel>素材范围</FieldLabel>
      <div className="grid gap-2 sm:grid-cols-3">
        {scopeOptions.map((option) => <button key={option.id} type="button" onClick={() => setScope(option.id)} className="rounded-lg border p-3 text-left" style={scope === option.id ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" } : { borderColor: "var(--border-base)" }}><strong className="block text-sm text-[var(--text-title)]">{option.label}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{option.description}</span></button>)}
      </div>
      {scope === "team" && <OrganizationScopeSelector value={visibleOrgIds} onChange={setVisibleOrgIds} />}
    </Modal>
  )
}

function MaterialDetailDialog({ material, onClose, onDownload }) {
  const TypeIcon = typeMeta[material.type]?.icon || FileText
  return (
    <Modal title="素材详情" onClose={onClose} width="760px" footer={<Button className="gap-2 text-white" onClick={onDownload}><Download size={15} />下载素材</Button>}>
      <div className="grid gap-4 sm:grid-cols-[minmax(220px,320px)_1fr]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[var(--gray-100)]">{material.src && material.type === "image" ? <SafeImage src={material.src} alt={material.title} className="h-full w-full object-contain" /> : <TypeIcon size={42} className="text-[var(--text-secondary)]" />}</div>
        <dl className="grid content-start grid-cols-[80px_1fr] gap-x-3 gap-y-3 text-sm">
          <DetailTerm>标题</DetailTerm><DetailValue>{material.title}</DetailValue>
          <DetailTerm>类型</DetailTerm><DetailValue>{typeMeta[material.type]?.label}</DetailValue>
          <DetailTerm>素材范围</DetailTerm><DetailValue>{formatScope(material)}</DetailValue>
          <DetailTerm>上传人</DetailTerm><DetailValue>{material.ownerName}</DetailValue>
          <DetailTerm>所属部门</DetailTerm><DetailValue>{material.ownerDepartment}</DetailValue>
          <DetailTerm>文件信息</DetailTerm><DetailValue>{material.dimensions} · {material.size}</DetailValue>
          <DetailTerm>标签</DetailTerm><DetailValue>{material.tags.join("、") || "无标签"}</DetailValue>
          <DetailTerm>创建时间</DetailTerm><DetailValue>{material.createdAt}</DetailValue>
          <DetailTerm>备注</DetailTerm><DetailValue>{material.remark || "无"}</DetailValue>
        </dl>
      </div>
    </Modal>
  )
}

function ConfirmDeleteDialog({ material, onClose, onConfirm }) {
  return <Modal title="删除素材" description="删除后将从所有素材选择入口中移除，原型中不提供恢复。" onClose={onClose} width="460px" footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button variant="destructive" onClick={onConfirm}>确认删除</Button></>}><strong className="block text-sm text-[var(--text-title)]">{material.title}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{formatScope(material)}</span></Modal>
}

function OrganizationScopeSelector({ value, onChange }) {
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
    if (visibleIds) return visibleIds.has(organization.id)
    return organization.ancestorIds.every((ancestorId) => expandedIds.includes(ancestorId))
  })

  function toggleOrganization(organizationId) {
    const selected = new Set(value)
    if (selected.has(organizationId)) selected.delete(organizationId)
    else selected.add(organizationId)
    onChange(compactOrganizationIds([...selected]))
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
      <div className="border-b p-3" style={{ borderColor: "var(--border-base)" }}>
        <FieldLabel inline>可见组织</FieldLabel>
        <label className="relative block"><Search size={15} className="absolute left-3 top-2.5 text-[var(--text-secondary)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索组织名称" className="h-9 w-full rounded-lg border pl-9 pr-3 text-sm outline-none" style={{ borderColor: "var(--border-base)" }} /></label>
      </div>
      <div className="flex items-center justify-between gap-2 border-b bg-[var(--gray-50)] px-3 py-2" style={{ borderColor: "var(--border-base)" }}><strong className="truncate text-sm text-[var(--text-title)]">{permissionOrganizationName}</strong><span className="shrink-0 text-xs text-[var(--text-secondary)]">选择父组织自动包含下级</span></div>
      <div className="max-h-56 overflow-y-auto">
        {rows.map((organization) => {
          const selected = value.includes(organization.id)
          const inherited = organization.ancestorIds.some((ancestorId) => value.includes(ancestorId))
          const hasChildren = organization.children.length > 0
          const expanded = Boolean(normalizedQuery) || expandedIds.includes(organization.id)
          return (
            <div key={organization.id} className="flex min-h-10 items-center gap-1 border-b pr-3 last:border-b-0" style={{ borderColor: "var(--border-light)", paddingLeft: `${8 + organization.depth * 20}px` }}>
              {hasChildren ? <button type="button" aria-label={`${expanded ? "收起" : "展开"}${organization.name}`} title={expanded ? "收起" : "展开"} disabled={Boolean(normalizedQuery)} onClick={() => setExpandedIds((current) => current.includes(organization.id) ? current.filter((id) => id !== organization.id) : [...current, organization.id])} className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><ChevronRight size={14} className={expanded ? "rotate-90" : ""} /></button> : <span className="size-7 shrink-0" />}
              <label className={`flex min-w-0 flex-1 items-center gap-2 py-2 text-sm ${inherited ? "cursor-not-allowed text-[var(--text-secondary)]" : "cursor-pointer text-[var(--text-body)]"}`}>
                <input type="checkbox" checked={selected || inherited} disabled={inherited} onChange={() => toggleOrganization(organization.id)} className="size-4 accent-[var(--brand-primary)]" />
                <span className="truncate" title={organization.path}>{organization.name}</span>
                {inherited && <span className="ml-auto shrink-0 text-xs text-[var(--text-secondary)]">随父组织包含</span>}
              </label>
            </div>
          )
        })}
        {!rows.length && <div className="flex min-h-24 items-center justify-center text-sm text-[var(--text-secondary)]">没有匹配的组织</div>}
      </div>
    </div>
  )
}

function FieldLabel({ children, inline = false }) {
  return <span className={`${inline ? "mb-1" : "mb-2 mt-4"} block text-xs font-semibold text-[var(--text-title)]`}>{children}</span>
}

function DetailTerm({ children }) {
  return <dt className="text-[var(--text-secondary)]">{children}</dt>
}

function DetailValue({ children }) {
  return <dd className="min-w-0 break-words text-[var(--text-body)]">{children}</dd>
}
