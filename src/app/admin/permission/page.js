"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Download,
  RefreshCw,
  Search,
  UserCheck,
  UserRoundCog,
  Users,
  X,
} from "lucide-react"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import {
  adminUsers,
  approvalTypes,
  organizationTree,
  permissionOrganizationName,
  permissionOrganizationTree,
  platformRoles,
} from "@/data/demo/admin"

function flattenOrganizations(nodes, depth = 0, ancestorIds = [], ancestorNames = []) {
  return nodes.flatMap((node) => [
    {
      ...node,
      depth,
      ancestorIds,
      path: [...ancestorNames, node.name].join(" / "),
      rootId: ancestorIds[0] || node.id,
    },
    ...flattenOrganizations(
      node.children || [],
      depth + 1,
      [...ancestorIds, node.id],
      [...ancestorNames, node.name],
    ),
  ])
}

const organizationRows = flattenOrganizations(organizationTree)
const organizationMap = Object.fromEntries(organizationRows.map((organization) => [organization.id, organization]))
const permissionOrganizationRows = flattenOrganizations(permissionOrganizationTree)
const permissionOrganizationMap = Object.fromEntries(permissionOrganizationRows.map((organization) => [organization.id, organization]))
const roleMap = Object.fromEntries(platformRoles.map((role) => [role.id, role]))
const roleOrder = Object.fromEntries(platformRoles.map((role, index) => [role.id, index]))
const approvalTypeMap = Object.fromEntries(approvalTypes.map((type) => [type.id, type]))
const assignableApprovalTypeIds = approvalTypes.filter((type) => !type.systemAdminOnly).map((type) => type.id)
const configurableRoles = platformRoles.filter((role) => role.id !== "member")
const permissionMatrixRows = [
  { roleId: "system_admin", data: "全部数据", approval: "全部审批事项", resource: "管理全部平台资源", pages: "全部管理页面", source: "平台指定" },
  { roleId: "department_admin", data: "指定组织数据", approval: "素材、提示词入库审批", resource: "编辑、删除指定组织团体资源", pages: "无", source: "主管默认 / 按需配置" },
  { roleId: "approval_admin", data: "指定组织数据", approval: "所选资源审批事项", resource: "仅查看，不能编辑或删除", pages: "无", source: "主管默认 / 按需配置" },
  { roleId: "member", data: "本人数据及组织可见资源", approval: "无", resource: "管理本人个人资源", pages: "无", source: "所有有效账号" },
]

function collectDescendantIds(organizationId) {
  return permissionOrganizationRows
    .filter((organization) => organization.ancestorIds.includes(organizationId))
    .map((organization) => organization.id)
}

function getInitialExpandedOrganizationIds(user) {
  const expanded = new Set()
  ;[user.departmentId, ...user.extraOrgIds].forEach((organizationId) => {
    const organization = permissionOrganizationMap[organizationId]
    organization?.ancestorIds.forEach((ancestorId) => expanded.add(ancestorId))
    if (organization?.children.length) expanded.add(organizationId)
  })
  return [...expanded]
}

function getRoleIds(user) {
  return [...new Set([
    "member",
    ...(user.isSupervisor && user.supervisorDepartmentAdminEnabled !== false ? ["department_admin"] : []),
    ...(user.isSupervisor && user.supervisorApprovalEnabled !== false ? ["approval_admin"] : []),
    ...user.manualRoleIds,
  ])].sort((left, right) => (roleOrder[left] ?? 99) - (roleOrder[right] ?? 99))
}

function hasRole(user, roleId) {
  return getRoleIds(user).includes(roleId)
}

function getBaseOrgIds(user) {
  return user.isSupervisor && permissionOrganizationMap[user.departmentId] ? [user.departmentId] : []
}

function compactOrganizationIds(organizationIds) {
  const uniqueIds = [...new Set(organizationIds)]
  return uniqueIds.filter((id) => !organizationMap[id]?.ancestorIds.some((ancestorId) => uniqueIds.includes(ancestorId)))
}

function getScopeOrgIds(user) {
  return compactOrganizationIds([...getBaseOrgIds(user), ...user.extraOrgIds])
}

function getScopeText(user) {
  if (hasRole(user, "system_admin")) return "全部数据"
  if (!user.isSupervisor && !hasRole(user, "department_admin") && !hasRole(user, "approval_admin")) return "个人记录；组织可见资源按资源范围展示"
  return getScopeOrgIds(user)
    .map((id) => `${organizationMap[id]?.path || "未知组织"}（含下级）`)
    .join("、") || "未设置"
}

function getApprovalText(user) {
  if (hasRole(user, "system_admin")) return "全部审批"
  const managesResources = hasRole(user, "department_admin")
  const additionalApprovalNames = (hasRole(user, "approval_admin") ? user.approvalTypeIds || [] : [])
    .filter((id) => !approvalTypeMap[id]?.systemAdminOnly)
    .filter((id) => !managesResources || !["material_publish", "prompt_publish"].includes(id))
    .map((id) => approvalTypeMap[id]?.name || "未知审批")
  const approvalNames = [
    ...(managesResources ? ["素材、提示词入库（自动）"] : []),
    ...additionalApprovalNames,
  ].join("；")
  if (!approvalNames) return hasRole(user, "approval_admin") ? "未设置" : "无"
  return user.isSupervisor ? `主管默认 · ${approvalNames}` : approvalNames
}

function matchesOrganization(user, organizationId) {
  if (organizationId === "all") return true
  const organization = organizationMap[user.departmentId]
  return user.departmentId === organizationId || organization?.ancestorIds.includes(organizationId)
}

export default function PermissionPage() {
  const [users, setUsers] = useState(adminUsers)
  const [keyword, setKeyword] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [organizationFilter, setOrganizationFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [draft, setDraft] = useState(null)
  const [modalMessage, setModalMessage] = useState("")
  const [message, setMessage] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState("今日 09:30")
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)
  const [roleMatrixOpen, setRoleMatrixOpen] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [approvalMenuOpen, setApprovalMenuOpen] = useState(false)
  const [organizationQuery, setOrganizationQuery] = useState("")
  const [expandedOrganizationIds, setExpandedOrganizationIds] = useState([])
  const roleMenuRef = useRef(null)
  const approvalMenuRef = useRef(null)

  useEffect(() => {
    if (!draft && !roleMatrixOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return
      if (roleMenuOpen || approvalMenuOpen) {
        setRoleMenuOpen(false)
        setApprovalMenuOpen(false)
        return
      }
      if (draft) {
        setDraft(null)
        return
      }
      setRoleMatrixOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [approvalMenuOpen, draft, roleMatrixOpen, roleMenuOpen])

  useEffect(() => {
    if (!draft || (!roleMenuOpen && !approvalMenuOpen)) return undefined
    const closeOnOutsideClick = (event) => {
      if (roleMenuOpen && !roleMenuRef.current?.contains(event.target)) setRoleMenuOpen(false)
      if (approvalMenuOpen && !approvalMenuRef.current?.contains(event.target)) setApprovalMenuOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick, true)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick, true)
  }, [approvalMenuOpen, draft, roleMenuOpen])

  const filteredUsers = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    return users
      .filter((user) => {
        const matchesRole = roleFilter === "all"
          || (roleFilter === "member" ? getRoleIds(user).length === 1 : hasRole(user, roleFilter))
        const matchesDepartment = matchesOrganization(user, organizationFilter)
        const matchesKeyword = !query || [user.name, user.account, user.department, user.id]
          .some((value) => value.toLowerCase().includes(query))
        return matchesRole && matchesDepartment && matchesKeyword
      })
      .sort((left, right) => Number(hasRole(right, "system_admin")) - Number(hasRole(left, "system_admin")))
  }, [keyword, organizationFilter, roleFilter, users])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedUsers = filteredUsers.slice((activePage - 1) * pageSize, activePage * pageSize)
  const rangeStart = filteredUsers.length ? (activePage - 1) * pageSize + 1 : 0
  const rangeEnd = Math.min(activePage * pageSize, filteredUsers.length)

  const counts = useMemo(() => ({
    active: users.filter((user) => user.status === "active").length,
    supervisors: users.filter((user) => user.status === "active" && user.isSupervisor).length,
    approvers: users.filter((user) => user.status === "active" && (
      hasRole(user, "system_admin") || hasRole(user, "department_admin") || hasRole(user, "approval_admin")
    )).length,
  }), [users])

  const draftUser = useMemo(
    () => draft ? users.find((user) => user.id === draft.userId) : null,
    [draft, users],
  )
  const draftRoleIds = draftUser && draft
    ? [...new Set([
      "member",
        ...(draftUser.isSupervisor && draft.supervisorDepartmentAdminEnabled ? ["department_admin"] : []),
        ...(draftUser.isSupervisor && draft.supervisorApprovalEnabled ? ["approval_admin"] : []),
        ...draft.manualRoleIds,
      ])]
      .sort((left, right) => (roleOrder[left] ?? 99) - (roleOrder[right] ?? 99))
    : []
  const draftHasRole = (roleId) => draftRoleIds.includes(roleId)
  const draftBaseOrgIds = draftUser && draftUser.isSupervisor && permissionOrganizationMap[draftUser.departmentId]
    ? [draftUser.departmentId]
    : []
  const draftScopeOrgIds = draft
    ? compactOrganizationIds([...draftBaseOrgIds, ...draft.extraOrgIds])
    : []
  const normalizedOrganizationQuery = organizationQuery.trim().toLowerCase()
  const visibleOrganizationIds = useMemo(() => {
    if (!normalizedOrganizationQuery) return null
    const visibleIds = new Set()
    permissionOrganizationRows.forEach((organization) => {
      if (!organization.path.toLowerCase().includes(normalizedOrganizationQuery)) return
      visibleIds.add(organization.id)
      organization.ancestorIds.forEach((ancestorId) => visibleIds.add(ancestorId))
    })
    return visibleIds
  }, [normalizedOrganizationQuery])
  const visibleOrganizationRows = permissionOrganizationRows.filter((organization) => {
    if (visibleOrganizationIds) return visibleOrganizationIds.has(organization.id)
    return organization.depth === 0
      || organization.ancestorIds.every((ancestorId) => expandedOrganizationIds.includes(ancestorId))
  })

  function openEditor(user) {
    setMessage(null)
    setModalMessage("")
    setConfirmingRemoval(false)
    setRoleMenuOpen(false)
    setApprovalMenuOpen(false)
    setOrganizationQuery("")
    setExpandedOrganizationIds(getInitialExpandedOrganizationIds(user))
    setDraft({
      userId: user.id,
      supervisorDepartmentAdminEnabled: user.isSupervisor && user.supervisorDepartmentAdminEnabled !== false,
      supervisorApprovalEnabled: user.isSupervisor && user.supervisorApprovalEnabled !== false,
      manualRoleIds: [...user.manualRoleIds],
      approvalTypeIds: (user.approvalTypeIds || []).filter((id) => assignableApprovalTypeIds.includes(id)),
      extraOrgIds: [...user.extraOrgIds],
    })
  }

  function toggleOrganizationExpanded(organizationId) {
    setExpandedOrganizationIds((current) => current.includes(organizationId)
      ? current.filter((id) => id !== organizationId)
      : [...current, organizationId])
  }

  function toggleRole(roleId) {
    setModalMessage("")
    setConfirmingRemoval(false)
    setDraft((current) => {
      const user = users.find((item) => item.id === current.userId)
      if (roleId === "department_admin" && user?.isSupervisor) {
        return {
          ...current,
          supervisorDepartmentAdminEnabled: !current.supervisorDepartmentAdminEnabled,
        }
      }
      if (roleId === "approval_admin" && user?.isSupervisor) {
        const supervisorApprovalEnabled = !current.supervisorApprovalEnabled
        return {
          ...current,
          supervisorApprovalEnabled,
          approvalTypeIds: supervisorApprovalEnabled
            ? (current.approvalTypeIds.filter((id) => assignableApprovalTypeIds.includes(id)).length
                ? current.approvalTypeIds.filter((id) => assignableApprovalTypeIds.includes(id))
                : assignableApprovalTypeIds)
            : [],
        }
      }
      const selected = new Set(current.manualRoleIds)
      if (selected.has(roleId)) selected.delete(roleId)
      else selected.add(roleId)
      const needsOrganizationScope = selected.has("department_admin") || selected.has("approval_admin")
      const extraOrgIds = needsOrganizationScope && current.extraOrgIds.length === 0
        ? [permissionOrganizationMap[user.departmentId] ? user.departmentId : permissionOrganizationTree[0]?.id].filter(Boolean)
        : current.extraOrgIds
      const approvalTypeIds = selected.has("approval_admin")
        ? (current.approvalTypeIds.filter((id) => assignableApprovalTypeIds.includes(id)).length
            ? current.approvalTypeIds.filter((id) => assignableApprovalTypeIds.includes(id))
            : assignableApprovalTypeIds)
        : []
      return { ...current, manualRoleIds: [...selected], approvalTypeIds, extraOrgIds }
    })
  }

  function toggleApprovalType(approvalTypeId) {
    if (approvalTypeMap[approvalTypeId]?.systemAdminOnly) return
    setModalMessage("")
    setConfirmingRemoval(false)
    setDraft((current) => {
      const selected = new Set(current.approvalTypeIds)
      if (selected.has(approvalTypeId)) selected.delete(approvalTypeId)
      else selected.add(approvalTypeId)
      return { ...current, approvalTypeIds: [...selected] }
    })
  }

  function toggleOrganization(organizationId) {
    setModalMessage("")
    setConfirmingRemoval(false)
    setDraft((current) => {
      const selected = new Set(current.extraOrgIds)
      if (selected.has(organizationId)) {
        selected.delete(organizationId)
      } else {
        selected.add(organizationId)
        collectDescendantIds(organizationId).forEach((id) => selected.delete(id))
      }
      return { ...current, extraOrgIds: [...selected] }
    })
  }

  function savePermission() {
    if (!draftUser || draftUser.status !== "active") {
      setModalMessage("停用账号不能配置平台权限")
      return
    }
    if (draftHasRole("department_admin") && draftScopeOrgIds.length === 0) {
      setModalMessage("部门管理员至少需要一个授权组织")
      return
    }
    if (draftHasRole("approval_admin") && draft.approvalTypeIds.length === 0) {
      setModalMessage("审批员至少需要选择一个审批事项")
      return
    }
    if (draftHasRole("approval_admin") && draftScopeOrgIds.length === 0) {
      setModalMessage("审批员至少需要一个负责组织")
      return
    }

    const systemAdminCount = users.filter((user) => user.status === "active" && hasRole(user, "system_admin")).length
    if (hasRole(draftUser, "system_admin") && !draftHasRole("system_admin") && systemAdminCount <= 1) {
      setModalMessage("至少需要保留一名有效的系统管理员")
      return
    }

    setUsers((current) => current.map((user) => user.id === draftUser.id
      ? {
          ...user,
          supervisorDepartmentAdminEnabled: draftUser.isSupervisor ? draft.supervisorDepartmentAdminEnabled : false,
          supervisorApprovalEnabled: draftUser.isSupervisor ? draft.supervisorApprovalEnabled : false,
          manualRoleIds: draft.manualRoleIds,
          approvalTypeIds: draftHasRole("approval_admin")
            ? draft.approvalTypeIds.filter((id) => assignableApprovalTypeIds.includes(id))
            : [],
          extraOrgIds: draftUser.isSupervisor || draftHasRole("department_admin") || draftHasRole("approval_admin")
            ? draft.extraOrgIds
            : [],
        }
      : user))
    setMessage({ tone: "success", text: `已保存 ${draftUser.name} 的平台权限` })
    setDraft(null)
  }

  function removeAuthorization() {
    if (!draftUser) return
    const systemAdminCount = users.filter((user) => user.status === "active" && hasRole(user, "system_admin")).length
    if (hasRole(draftUser, "system_admin") && systemAdminCount <= 1) {
      setModalMessage("至少需要保留一名有效的系统管理员")
      setConfirmingRemoval(false)
      return
    }
    setUsers((current) => current.map((user) => user.id === draftUser.id
      ? {
          ...user,
          supervisorDepartmentAdminEnabled: user.isSupervisor,
          supervisorApprovalEnabled: user.isSupervisor,
          manualRoleIds: [],
          approvalTypeIds: user.isSupervisor ? assignableApprovalTypeIds : [],
          extraOrgIds: [],
        }
      : user))
    setMessage({
      tone: "success",
      text: draftUser.isSupervisor
        ? `已清除 ${draftUser.name} 的手动配置，恢复主管默认角色`
        : `已清除 ${draftUser.name} 的手动配置`,
    })
    setDraft(null)
  }

  function syncAccounts() {
    setSyncing(true)
    setMessage(null)
    window.setTimeout(() => {
      const validOrganizationIds = new Set(permissionOrganizationRows.map((organization) => organization.id))
      setUsers((current) => current.map((user) => ({
        ...user,
        extraOrgIds: user.extraOrgIds.filter((id) => validOrganizationIds.has(id)),
      })))
      const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
      setLastSyncedAt(`今日 ${time}`)
      setSyncing(false)
      setMessage({ tone: "success", text: "钉钉同步完成，账号、主管标识和所属部门已自动校准" })
    }, 650)
  }

  const canRemoveAuthorization = draftUser
    && (
      draftUser.manualRoleIds.length > 0
      || draftUser.extraOrgIds.length > 0
      || (draftUser.isSupervisor && draftUser.supervisorDepartmentAdminEnabled === false)
      || (draftUser.isSupervisor && draftUser.supervisorApprovalEnabled === false)
    )

  return (
    <PageShell
      pathname="/admin/permission"
      description="同步钉钉账号、组织和主管标识，配置平台角色、审批事项与组织数据范围"
      actions={(
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          <a
            href="/api/permission-prd"
            download
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-medium text-[var(--brand-on-primary)] transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand-primary-soft)] sm:w-auto"
          >
            <Download size={16} />
            导出 PRD
          </a>
          <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto" onClick={syncAccounts} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "同步中" : "同步钉钉"}
          </Button>
        </div>
      )}
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Summary icon={Users} label="有效同步账号" value={counts.active} />
        <Summary icon={UserCheck} label="钉钉主管" value={counts.supervisors} />
        <Summary icon={ClipboardCheck} label="可审批人员" value={counts.approvers} />
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.tone === "warning" ? "bg-[var(--warning-bg)] text-[var(--warning)]" : "bg-[var(--success-bg)] text-[var(--success)]"}`} role="status">
          {message.text}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }}>
        <div className="flex flex-col gap-4 border-b p-4" style={{ borderColor: "var(--border-base)" }}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-semibold text-[var(--text-title)]">管理权限人员</h2>
                <button
                  type="button"
                  aria-label="查看角色权限说明"
                  title="查看角色权限说明"
                  onClick={() => setRoleMatrixOpen(true)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                >
                  <CircleHelp size={17} />
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">主管默认叠加部门管理员和审批员；两项可分别调整，组织授权仅限众创事业群及下级。</p>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">最近同步：{lastSyncedAt}</span>
          </div>

          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <label className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search size={16} className="absolute left-3 top-3 text-[var(--text-secondary)]" />
              <input
                value={keyword}
                onChange={(event) => { setKeyword(event.target.value); setCurrentPage(1) }}
                placeholder="搜索人员、账号或部门"
                aria-label="搜索权限人员"
                className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none"
                style={{ borderColor: "var(--border-base)" }}
              />
            </label>
            <select
              value={organizationFilter}
              onChange={(event) => { setOrganizationFilter(event.target.value); setCurrentPage(1) }}
              aria-label="筛选所属部门"
              className="h-10 rounded-lg border bg-white px-3 text-sm outline-none"
              style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}
            >
              <option value="all">全部部门</option>
              {organizationRows.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {`${"　".repeat(organization.depth)}${organization.name}`}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(event) => { setRoleFilter(event.target.value); setCurrentPage(1) }}
              aria-label="筛选平台角色"
              className="h-10 rounded-lg border bg-white px-3 text-sm outline-none"
              style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}
            >
              <option value="all">全部角色</option>
              {platformRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-[1.4fr_0.8fr_1.2fr_1.45fr_1.35fr_52px] gap-3 border-b bg-[var(--gray-50)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
            <span>人员 / 部门</span><span>身份 / 状态</span><span>平台角色</span><span>组织数据范围</span><span>审批权限</span><span className="text-right">操作</span>
          </div>
          {paginatedUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-[1.4fr_0.8fr_1.2fr_1.45fr_1.35fr_52px] items-center gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--border-light)" }}>
              <div className="min-w-0">
                <strong className="block truncate text-sm text-[var(--text-title)]">{user.name}</strong>
                <span className="block truncate text-xs text-[var(--text-secondary)]">{user.id} · {user.account}</span>
                <span className="mt-1 block truncate text-xs text-[var(--text-secondary)]" title={user.department}>{user.department}</span>
              </div>
              <div className="flex min-w-0 flex-col items-start gap-1.5">
                <SupervisorBadge isSupervisor={user.isSupervisor} />
                <StatusBadge status={user.status} />
              </div>
              <RoleBadges roleIds={getRoleIds(user)} />
              <span className="truncate text-sm text-[var(--text-body)]" title={getScopeText(user)}>{getScopeText(user)}</span>
              <span className="truncate text-sm text-[var(--text-body)]" title={getApprovalText(user)}>{getApprovalText(user)}</span>
              <div className="text-right">
                <button
                  type="button"
                  aria-label={`配置${user.name}权限`}
                  onClick={() => openEditor(user)}
                  disabled={user.status !== "active"}
                  className="text-sm font-medium text-[var(--brand-primary)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--text-disabled)] disabled:no-underline"
                >
                  配置
                </button>
              </div>
            </div>
          ))}
          {!filteredUsers.length && (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-6 text-center">
              <UserRoundCog size={32} className="text-[var(--text-disabled)]" />
              <p className="text-sm text-[var(--text-secondary)]">没有符合当前条件的权限人员</p>
              <button type="button" className="text-sm font-medium text-[var(--brand-primary)] hover:underline" onClick={() => { setKeyword(""); setRoleFilter("all"); setOrganizationFilter("all") }}>清除筛选</button>
            </div>
          )}
        </div>
        {filteredUsers.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-base)" }}>
            <span>共 {filteredUsers.length} 条，当前 {rangeStart}-{rangeEnd} 条</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <span>每页</span>
                <select
                  value={pageSize}
                  onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1) }}
                  aria-label="每页显示数量"
                  className="h-8 rounded-md border bg-white px-2 text-sm outline-none"
                  style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}
                >
                  <option value={5}>5 条</option>
                  <option value={10}>10 条</option>
                  <option value={20}>20 条</option>
                </select>
              </label>
              <button
                type="button"
                aria-label="上一页"
                title="上一页"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="flex size-8 items-center justify-center rounded-md border hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"
                style={{ borderColor: "var(--border-base)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-20 text-center tabular-nums">第 {activePage} / {totalPages} 页</span>
              <button
                type="button"
                aria-label="下一页"
                title="下一页"
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="flex size-8 items-center justify-center rounded-md border hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"
                style={{ borderColor: "var(--border-base)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {draft && draftUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--overlay-scrim)] p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDraft(null)}>
          <section
            className="flex max-h-[calc(100vh-32px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-dialog-title"
            onClickCapture={(event) => {
              if (roleMenuOpen && !roleMenuRef.current?.contains(event.target)) setRoleMenuOpen(false)
              if (approvalMenuOpen && !approvalMenuRef.current?.contains(event.target)) setApprovalMenuOpen(false)
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border-base)" }}>
              <div>
                <h2 id="permission-dialog-title" className="text-lg font-semibold text-[var(--text-title)]">配置平台权限</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">普通用户是基础权限，可叠加多个平台角色。</p>
              </div>
              <button type="button" onClick={() => setDraft(null)} aria-label="关闭权限配置" className="flex size-8 items-center justify-center rounded-md hover:bg-[var(--bg-hover)]"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--gray-50)] px-4 py-3">
                <div>
                  <strong className="block text-sm text-[var(--text-title)]">{draftUser.name}</strong>
                  <span className="text-xs text-[var(--text-secondary)]">{draftUser.department} · {draftUser.account}</span>
                </div>
                <SupervisorBadge isSupervisor={draftUser.isSupervisor} />
              </div>

              <fieldset className="mt-5">
                <legend className="mb-3 text-sm font-semibold text-[var(--text-title)]">平台角色</legend>
                <div className="flex flex-wrap gap-2">
                  {draftRoleIds.map((roleId) => <RoleBadge key={roleId} roleId={roleId} />)}
                </div>
                <div ref={roleMenuRef} className="relative mt-3">
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={roleMenuOpen}
                    onClick={() => { setRoleMenuOpen((open) => !open); setApprovalMenuOpen(false) }}
                    className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                    style={{ borderColor: "var(--border-base)" }}
                  >
                    <span className="truncate text-[var(--text-body)]">
                      {draftRoleIds.length > 1
                        ? draftRoleIds.filter((roleId) => roleId !== "member").map((roleId) => roleMap[roleId]?.name).join("、")
                        : "选择附加角色"}
                    </span>
                    <ChevronDown size={16} className={`shrink-0 text-[var(--text-secondary)] transition-transform ${roleMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {roleMenuOpen && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-white p-1 shadow-lg" role="group" aria-label="选择附加角色" style={{ borderColor: "var(--border-base)" }}>
                      {configurableRoles.map((role) => {
                        const selected = draftHasRole(role.id)
                        const supervisorDefault = draftUser.isSupervisor && ["department_admin", "approval_admin"].includes(role.id)
                        return (
                          <label key={role.id} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-md px-3 py-2 hover:bg-[var(--bg-hover)]">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleRole(role.id)}
                              className="mt-0.5 size-4 accent-[var(--brand-primary)]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <strong className="text-sm text-[var(--text-title)]">{role.name}</strong>
                                {supervisorDefault && (
                                  <span className="text-xs text-[var(--success)]">
                                    主管默认，可取消
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 block text-xs leading-5 text-[var(--text-secondary)]">{role.description}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">当前角色来自内置配置；后续角色管理新增角色后，这里自动读取并支持多选。</p>
              </fieldset>

              <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border-base)" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-title)]">审批配置</h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">部门管理员自动处理授权组织的素材、提示词入库；积分审批一期仅系统管理员拥有。</p>
                  </div>
                  <span className="rounded-md bg-[var(--gray-100)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                    {draftHasRole("system_admin")
                      ? "全部审批"
                      : draftHasRole("department_admin") && draftHasRole("approval_admin")
                        ? `资源入库 + 审批员 ${draft.approvalTypeIds.length} 项`
                        : draftHasRole("department_admin")
                          ? "资源入库"
                          : draftHasRole("approval_admin")
                            ? `${draft.approvalTypeIds.length} 项`
                            : "未开通"}
                  </span>
                </div>

                {draftHasRole("system_admin") ? (
                  <div className="mt-3 rounded-lg bg-[var(--gray-50)] px-4 py-3 text-sm text-[var(--text-body)]">
                    系统管理员固定拥有全部审批事项和全公司审批范围，无需单独配置。
                  </div>
                ) : draftHasRole("approval_admin") ? (
                  <div className="mt-3">
                    {draftHasRole("department_admin") && (
                      <div className="mb-3 rounded-lg bg-[var(--gray-50)] px-4 py-3 text-sm text-[var(--text-body)]">
                        部门管理员已自动包含素材入库和提示词入库审批；下方仍按审批员配置所选事项，重复命中时只计算一份权限。
                      </div>
                    )}
                    <div ref={approvalMenuRef} className="relative">
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={approvalMenuOpen}
                      onClick={() => { setApprovalMenuOpen((open) => !open); setRoleMenuOpen(false) }}
                      className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                      style={{ borderColor: "var(--border-base)" }}
                    >
                      <span className="truncate text-[var(--text-body)]">
                        {draft.approvalTypeIds.length
                          ? draft.approvalTypeIds.map((id) => approvalTypeMap[id]?.name).join("、")
                          : "选择审批事项"}
                      </span>
                      <ChevronDown size={16} className={`shrink-0 text-[var(--text-secondary)] transition-transform ${approvalMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {approvalMenuOpen && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border bg-white p-1 shadow-lg" role="group" aria-label="选择审批事项" style={{ borderColor: "var(--border-base)" }}>
                        {approvalTypes.map((approvalType) => (
                          <label key={approvalType.id} className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 ${approvalType.systemAdminOnly ? "cursor-not-allowed bg-[var(--gray-50)]" : "cursor-pointer hover:bg-[var(--bg-hover)]"}`}>
                            <input
                              type="checkbox"
                              checked={draft.approvalTypeIds.includes(approvalType.id)}
                              onChange={() => toggleApprovalType(approvalType.id)}
                              disabled={approvalType.systemAdminOnly}
                              className="size-4 accent-[var(--brand-primary)]"
                            />
                            <span className={`min-w-0 flex-1 text-sm ${approvalType.systemAdminOnly ? "text-[var(--text-disabled)]" : "text-[var(--text-title)]"}`}>{approvalType.name}</span>
                            {approvalType.systemAdminOnly && <span className="shrink-0 text-xs text-[var(--text-secondary)]">仅系统管理员</span>}
                          </label>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>
                ) : draftHasRole("department_admin") ? (
                  <div className="mt-3 rounded-lg bg-[var(--gray-50)] px-4 py-3 text-sm text-[var(--text-body)]">
                    部门管理员自动拥有授权组织内的素材入库和提示词入库审批，无需另选审批事项。
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg bg-[var(--gray-50)] px-4 py-3 text-sm text-[var(--text-body)]">
                    当前无审批权限；需要处理审批时，选择审批员角色并配置事项与组织范围。
                  </div>
                )}
              </div>

              <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border-base)" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-title)]">组织数据范围</h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {draftHasRole("system_admin")
                        ? "系统管理员固定覆盖全平台数据，无需选择组织。"
                        : "决定可查看、管理和审批哪些组织；仅可选择众创事业群及下级，父部门自动包含全部下级。"}
                    </p>
                  </div>
                  <span className="rounded-md bg-[var(--gray-100)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                    {draftHasRole("system_admin") ? "全部数据" : `${draftScopeOrgIds.length} 个部门入口`}
                  </span>
                </div>

                {draftHasRole("system_admin") ? (
                  <div className="mt-3 rounded-lg bg-[var(--gray-50)] px-4 py-3 text-sm text-[var(--text-body)]">
                    系统管理员固定拥有全部数据，无需单独选择部门。
                  </div>
                ) : draftUser.isSupervisor || draftHasRole("department_admin") || draftHasRole("approval_admin") ? (
                  <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
                    <div className="border-b p-3" style={{ borderColor: "var(--border-base)" }}>
                      <label className="relative block">
                        <Search size={16} className="absolute left-3 top-2.5 text-[var(--text-secondary)]" />
                        <input
                          value={organizationQuery}
                          onChange={(event) => setOrganizationQuery(event.target.value)}
                          placeholder="搜索组织名称"
                          aria-label="搜索授权组织"
                          className="h-9 w-full rounded-md border bg-white pl-9 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                          style={{ borderColor: "var(--border-base)" }}
                        />
                        {organizationQuery && (
                          <button
                            type="button"
                            aria-label="清除组织搜索"
                            title="清除搜索"
                            onClick={() => setOrganizationQuery("")}
                            className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b bg-[var(--gray-50)] px-3 py-2.5" style={{ borderColor: "var(--border-base)" }}>
                      <strong className="text-sm text-[var(--text-title)]">{permissionOrganizationName}</strong>
                      <span className="shrink-0 text-xs text-[var(--text-secondary)]">平台可授权范围</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {visibleOrganizationRows.map((organization) => {
                              const selectedBase = draftBaseOrgIds.includes(organization.id)
                              const selectedExtra = draft.extraOrgIds.includes(organization.id)
                              const inherited = organization.ancestorIds.some((id) => draftScopeOrgIds.includes(id))
                              const checked = selectedBase || selectedExtra || inherited
                              const disabled = selectedBase || inherited
                              const partiallySelected = !checked && collectDescendantIds(organization.id)
                                .some((id) => draftScopeOrgIds.includes(id))
                              const hasChildren = organization.children.length > 0
                              const expanded = Boolean(normalizedOrganizationQuery)
                                || expandedOrganizationIds.includes(organization.id)
                              return (
                                <div
                                  key={organization.id}
                                  className="flex min-h-11 items-center gap-2 border-b pr-3 last:border-b-0"
                                  style={{ borderColor: "var(--border-light)", paddingLeft: `${12 + organization.depth * 22}px` }}
                                >
                                  {hasChildren ? (
                                    <button
                                      type="button"
                                      aria-label={`${expanded ? "收起" : "展开"}${organization.name}`}
                                      title={expanded ? "收起下级组织" : "展开下级组织"}
                                      aria-expanded={expanded}
                                      disabled={Boolean(normalizedOrganizationQuery)}
                                      onClick={() => toggleOrganizationExpanded(organization.id)}
                                      className="flex size-6 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:cursor-default"
                                    >
                                      <ChevronRight size={15} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
                                    </button>
                                  ) : (
                                    <span className="size-6 shrink-0" aria-hidden="true" />
                                  )}
                                  <label className={`flex min-w-0 flex-1 items-center gap-3 py-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                                    <OrganizationCheckbox
                                      checked={checked}
                                      indeterminate={partiallySelected}
                                      disabled={disabled}
                                      onChange={() => toggleOrganization(organization.id)}
                                      aria-label={`授权${organization.path}`}
                                    />
                                    <span className={`min-w-0 flex-1 truncate text-sm ${disabled ? "text-[var(--text-secondary)]" : "text-[var(--text-body)]"}`} title={organization.path}>
                                      {organization.name}
                                    </span>
                                    {selectedBase && !inherited && <span className="shrink-0 text-xs text-[var(--success)]">主管所属部门</span>}
                                    {selectedExtra && <span className="shrink-0 text-xs text-[var(--brand-primary)]">额外范围</span>}
                                    {inherited && <span className="shrink-0 text-xs text-[var(--text-secondary)]">随父部门包含</span>}
                                    {partiallySelected && <span className="shrink-0 text-xs text-[var(--text-secondary)]">部分下级</span>}
                                  </label>
                                </div>
                              )
                      })}
                      {!visibleOrganizationRows.length && (
                        <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-4 text-center">
                          <Search size={22} className="text-[var(--text-disabled)]" />
                          <span className="text-sm text-[var(--text-secondary)]">没有匹配的组织</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg bg-[var(--gray-50)] px-4 py-3 text-sm text-[var(--text-body)]">
                    普通用户没有组织数据范围；选择部门管理员或审批员角色后，可在众创事业群内配置。
                  </div>
                )}
              </div>

              {confirmingRemoval && (
                <div className="mt-5 rounded-lg bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning)]" role="alert">
                  <strong className="block">确认清除手动配置？</strong>
                  <span className="mt-1 block text-xs leading-5">
                    {draftUser.isSupervisor ? "清除后保留普通用户和主管数据范围，并恢复主管默认的部门管理员与审批员。" : "清除后仅保留普通用户基础权限。"}
                  </span>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirmingRemoval(false)}>返回</Button>
                    <Button size="sm" className="text-[var(--brand-on-primary)]" onClick={removeAuthorization}>确认取消</Button>
                  </div>
                </div>
              )}

              {modalMessage && (
                <div className="mt-5 rounded-lg bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning)]" role="alert">
                  {modalMessage}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4" style={{ borderColor: "var(--border-base)" }}>
              <div>
                {canRemoveAuthorization && !confirmingRemoval && (
                  <button type="button" className="text-sm font-medium text-[var(--warning)] hover:underline" onClick={() => setConfirmingRemoval(true)}>
                    清除手动配置
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setDraft(null)}>取消</Button>
                <Button size="lg" className="gap-2 text-[var(--brand-on-primary)]" onClick={savePermission}><Check size={16} />保存权限</Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {roleMatrixOpen && <RolePermissionDialog onClose={() => setRoleMatrixOpen(false)} />}
    </PageShell>
  )
}

function Summary({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-4" style={{ borderColor: "var(--border-base)" }}>
      <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><Icon size={19} /></span>
      <div><strong className="block text-xl tabular-nums text-[var(--text-title)]">{value}</strong><span className="text-xs text-[var(--text-secondary)]">{label}</span></div>
    </div>
  )
}

function RolePermissionDialog({ onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--overlay-scrim)] p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[calc(100vh-32px)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="role-permission-dialog-title">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border-base)" }}>
          <div>
            <h2 id="role-permission-dialog-title" className="text-lg font-semibold text-[var(--text-title)]">角色权限说明</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">角色决定能做什么，组织范围决定能对哪些部门操作；多个角色可以叠加。</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭角色权限说明" className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"><X size={18} /></button>
        </div>
        <div className="overflow-auto">
          <div className="grid min-w-[980px] grid-cols-[140px_1.2fr_1.2fr_1.45fr_1fr_120px] gap-4 border-b bg-[var(--gray-50)] px-5 py-2.5 text-xs font-semibold text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
            <span>平台角色</span><span>可查看数据</span><span>审批权限</span><span>资源操作</span><span>管理页面</span><span>获得方式</span>
          </div>
          {permissionMatrixRows.map((row) => (
            <div key={row.roleId} className="grid min-w-[980px] grid-cols-[140px_1.2fr_1.2fr_1.45fr_1fr_120px] items-center gap-4 border-b px-5 py-3 text-sm last:border-b-0" style={{ borderColor: "var(--border-light)" }}>
              <RoleBadge roleId={row.roleId} />
              <span className="text-[var(--text-body)]">{row.data}</span>
              <span className="text-[var(--text-body)]">{row.approval}</span>
              <span className="text-[var(--text-body)]">{row.resource}</span>
              <span className="text-[var(--text-body)]">{row.pages}</span>
              <span className="text-[var(--text-secondary)]">{row.source}</span>
            </div>
          ))}
        </div>
        <div className="border-t bg-[var(--gray-50)] px-5 py-3 text-xs leading-5 text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
          钉钉主管是同步标识，不是平台角色：一期默认叠加部门管理员和审批员，并获得所属及下级组织数据范围；取消任一默认角色后仍保留主管数据范围。除系统管理员外，平台授权范围仅限众创事业群及下级。
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }) {
  const active = status === "active"
  return <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-medium ${active ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--gray-100)] text-[var(--text-secondary)]"}`}>{active ? "正常" : "已停用"}</span>
}

function SupervisorBadge({ isSupervisor }) {
  return <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-medium ${isSupervisor ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--gray-100)] text-[var(--text-secondary)]"}`}>{isSupervisor ? "主管" : "员工"}</span>
}

function RoleBadge({ roleId }) {
  const base = roleId === "member"
  return <span className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-medium ${base ? "bg-[var(--gray-100)] text-[var(--text-secondary)]" : "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"}`}>{roleMap[roleId]?.name || "未设置"}</span>
}

function RoleBadges({ roleIds }) {
  return <div className="flex flex-wrap gap-1.5">{roleIds.map((roleId) => <RoleBadge key={roleId} roleId={roleId} />)}</div>
}

function OrganizationCheckbox({ indeterminate, ...props }) {
  const checkboxRef = useRef(null)

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className="size-4 shrink-0 accent-[var(--brand-primary)]"
      {...props}
    />
  )
}
