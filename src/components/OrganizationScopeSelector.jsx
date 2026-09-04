"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Search } from "lucide-react"
import { permissionOrganizationName, permissionOrganizationTree } from "@/data/demo/admin"

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

function organizationInScope(organizationId, scopeIds, organizationMap) {
  const organization = organizationMap[organizationId]
  return Boolean(organization && scopeIds.some((scopeId) => (
    organizationId === scopeId || organization.ancestorIds.includes(scopeId)
  )))
}

function compactOrganizationIds(organizationIds, organizationMap) {
  const selected = new Set(organizationIds)
  return [...new Set(organizationIds)].filter((organizationId) => {
    const organization = organizationMap[organizationId]
    return organization && !organization.ancestorIds.some((ancestorId) => selected.has(ancestorId))
  })
}

export default function OrganizationScopeSelector({
  value = [],
  onChange,
  allowedScopeIds = null,
  organizations = permissionOrganizationTree,
  organizationLabel = permissionOrganizationName,
}) {
  const rows = useMemo(() => flattenOrganizations(organizations), [organizations])
  const organizationMap = useMemo(() => Object.fromEntries(rows.map((organization) => [organization.id, organization])), [rows])
  const [query, setQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState(() => compactOrganizationIds(value, organizationMap).flatMap((id) => organizationMap[id]?.ancestorIds || []))
  const normalizedQuery = query.trim().toLowerCase()
  const matchingIds = useMemo(() => {
    if (!normalizedQuery) return null
    const ids = new Set()
    rows.forEach((organization) => {
      if (`${organization.name} ${organization.path}`.toLowerCase().includes(normalizedQuery)) {
        ids.add(organization.id)
        organization.ancestorIds.forEach((id) => ids.add(id))
      }
    })
    return ids
  }, [normalizedQuery, rows])
  const visibleRows = rows.filter((organization) => {
    const allowed = !allowedScopeIds || organizationInScope(organization.id, allowedScopeIds, organizationMap)
    const ancestorAllowed = allowedScopeIds?.some((scopeId) => organizationMap[scopeId]?.ancestorIds.includes(organization.id))
    if (!allowed && !ancestorAllowed) return false
    if (matchingIds) return matchingIds.has(organization.id)
    return organization.ancestorIds.every((ancestorId) => expandedIds.includes(ancestorId))
  })

  function toggleOrganization(organizationId) {
    if (allowedScopeIds && !organizationInScope(organizationId, allowedScopeIds, organizationMap)) return
    const next = new Set(value)
    if (next.has(organizationId)) next.delete(organizationId)
    else next.add(organizationId)
    onChange(compactOrganizationIds([...next], organizationMap))
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-base)" }}>
      <div className="border-b p-3" style={{ borderColor: "var(--border-base)" }}>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--text-title)]">可见组织</span>
          <span className="text-[11px] text-[var(--text-secondary)]">已选 {value.length} 个根组织</span>
        </div>
        <label className="relative block">
          <Search size={15} className="absolute left-3 top-2.5 text-[var(--text-secondary)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索组织名称"
            aria-label="搜索组织名称"
            className="h-9 w-full rounded-md border pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--border-base)" }}
          />
        </label>
      </div>
      <div className="flex items-center justify-between gap-2 border-b bg-[var(--gray-50)] px-3 py-2" style={{ borderColor: "var(--border-base)" }}>
        <strong className="truncate text-xs text-[var(--text-title)]">{organizationLabel}</strong>
        <span className="shrink-0 text-[11px] text-[var(--text-secondary)]">父组织包含下级</span>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {visibleRows.map((organization) => {
          const selected = value.includes(organization.id)
          const inherited = organization.ancestorIds.some((ancestorId) => value.includes(ancestorId))
          const disabled = inherited || Boolean(allowedScopeIds && !organizationInScope(organization.id, allowedScopeIds, organizationMap))
          const expanded = Boolean(normalizedQuery) || expandedIds.includes(organization.id)
          return (
            <div key={organization.id} className="flex min-h-10 items-center gap-1 border-b pr-3 last:border-b-0" style={{ borderColor: "var(--border-light)", paddingLeft: `${8 + organization.depth * 18}px` }}>
              {organization.children.length ? (
                <button
                  type="button"
                  aria-label={`${expanded ? "收起" : "展开"}${organization.name}`}
                  title={expanded ? "收起" : "展开"}
                  disabled={Boolean(normalizedQuery)}
                  onClick={() => setExpandedIds((current) => current.includes(organization.id) ? current.filter((id) => id !== organization.id) : [...current, organization.id])}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  <ChevronRight size={14} className={expanded ? "rotate-90" : ""} />
                </button>
              ) : <span className="size-7 shrink-0" />}
              <label className={`flex min-w-0 flex-1 items-center gap-2 py-2 text-xs ${disabled ? "cursor-not-allowed text-[var(--text-secondary)]" : "cursor-pointer text-[var(--text-body)]"}`}>
                <input type="checkbox" checked={selected || inherited} disabled={disabled} onChange={() => toggleOrganization(organization.id)} className="size-4 accent-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-50" />
                <span className="truncate" title={organization.path}>{organization.name}</span>
                {inherited && <span className="ml-auto shrink-0 text-[11px] text-[var(--text-secondary)]">随父组织包含</span>}
              </label>
            </div>
          )
        })}
        {!visibleRows.length && <div className="flex min-h-24 items-center justify-center text-sm text-[var(--text-secondary)]">没有匹配的组织</div>}
      </div>
    </div>
  )
}
