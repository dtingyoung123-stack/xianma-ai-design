export const PRODUCT_STATE_EVENT = "xianma-product-prototype-change"

export const productDisplayStatusMeta = {
  needs_completion: { label: "待完善", tone: "warning" },
  processing: { label: "处理中", tone: "info" },
  pending_confirmation: { label: "待确认", tone: "warning" },
  available: { label: "可用", tone: "success" },
  revising: { label: "修订中", tone: "info" },
  archived: { label: "已归档", tone: "neutral" },
}

const productDisplayStatusMap = {
  draft: "needs_completion",
  import_failed: "needs_completion",
  information_review: "needs_completion",
  needs_information: "needs_completion",
  recognizing: "processing",
  restoring: "processing",
  pending_confirmation: "pending_confirmation",
  partial_success: "pending_confirmation",
  confirmed: "available",
  revising: "revising",
  archived: "archived",
}

export function getProductDisplayStatusKey(status) {
  return productDisplayStatusMap[status] || "needs_completion"
}

export function getProductDisplayStatus(status) {
  return productDisplayStatusMeta[getProductDisplayStatusKey(status)]
}

export function canViewProduct(product, role, userId = "demo-member") {
  if (role === "system_admin") return true
  if (product.scope === "public") return product.status !== "archived"
  if (product.scope === "team") return product.visibleOrgIds?.includes("org-product") || product.ownerId === userId
  return product.ownerId === userId
}

export function canContinueProduct(product, role, userId = "demo-member") {
  if (role === "system_admin") return product.status !== "archived"
  return product.ownerId === userId && [
    "draft",
    "information_review",
    "needs_information",
    "restoring",
    "pending_confirmation",
    "import_failed",
    "partial_success",
  ].includes(product.status)
}

export function hasDownstreamUsage(product) {
  return Array.isArray(product.usageRefs) && product.usageRefs.length > 0
}

export function canDeleteProduct(product, role, userId = "demo-member") {
  if (role !== "system_admin" && product.ownerId !== userId) return false
  if (product.scope !== "mine" || hasDownstreamUsage(product)) return false
  return [
    "draft",
    "import_failed",
    "information_review",
    "needs_information",
    "pending_confirmation",
    "partial_success",
  ].includes(product.status)
}

export function canConfirmProduct(product, role, userId = "demo-member") {
  return ["pending_confirmation", "partial_success"].includes(product.status)
    && (role === "system_admin" || product.ownerId === userId)
}

export function canReviseProduct(product, role, userId = "demo-member") {
  return product.status === "confirmed" && (role === "system_admin" || product.ownerId === userId)
}

export function canAdjustProductScope(product, role) {
  return product.scope === "team" && ["department_admin", "system_admin"].includes(role)
}

export function canArchiveProduct(product, role) {
  if (product.status === "archived") return false
  if (product.scope === "public") return role === "system_admin"
  return product.scope === "team" && ["department_admin", "system_admin"].includes(role)
}

export function transitionProduct(product, event, payload = {}) {
  const now = payload.at || "2026-09-02 16:00"
  if (event === "confirm") {
    if (!payload.candidateId) throw new Error("确认商品前必须选择一张还原候选图")
    return {
      ...product,
      scope: "team",
      status: "confirmed",
      confirmedAt: now,
      updatedAt: now,
      visibleOrgIds: product.visibleOrgIds?.length ? product.visibleOrgIds : [product.orgId],
      candidates: product.candidates.map((candidate) => ({ ...candidate, selected: candidate.id === payload.candidateId })),
      versions: [
        ...(product.versions || []),
        { id: `version-${Date.now()}`, label: "已确认版本", note: "运营确认标准商品还原图", createdAt: now },
      ],
    }
  }

  if (event === "revise") {
    return { ...product, status: "revising", updatedAt: now }
  }

  if (event === "archive") {
    return { ...product, status: "archived", updatedAt: now }
  }

  if (event === "correction") {
    return {
      ...product,
      status: "restoring",
      updatedAt: now,
      corrections: [...(product.corrections || []), payload.correction],
    }
  }

  if (event === "retry_candidate") {
    return {
      ...product,
      status: "pending_confirmation",
      updatedAt: now,
      candidates: product.candidates.map((candidate) => candidate.id === payload.candidateId
        ? { ...candidate, status: "success", error: null, src: payload.src || "/assets/layout-square-5.jpg" }
        : candidate),
    }
  }

  throw new Error(`不支持的商品状态事件：${event}`)
}

export function filterProducts(products, { scope, role, userId = "demo-member", query = "", category = "all", status = "all" }) {
  const normalizedQuery = query.trim().toLowerCase()
  return products.filter((product) => {
    if (!canViewProduct(product, role, userId)) return false
    if (scope === "mine" && product.ownerId !== userId) return false
    if (scope === "team" && product.scope !== "team") return false
    if (scope === "public" && product.scope !== "public") return false
    if (category !== "all" && product.category !== category) return false
    if (status !== "all" && getProductDisplayStatusKey(product.status) !== status) return false
    if (normalizedQuery && !`${product.name} ${product.category} ${product.source}`.toLowerCase().includes(normalizedQuery)) return false
    return true
  })
}
