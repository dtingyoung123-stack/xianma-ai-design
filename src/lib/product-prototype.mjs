export const PRODUCT_STATE_EVENT = "xianma-product-prototype-change"

export const productDisplayStatusMeta = {
  needs_completion: { label: "待完善", tone: "warning" },
  processing: { label: "处理中", tone: "info" },
  pending_confirmation: { label: "待确认", tone: "warning" },
  confirmed_personal: { label: "已确认待提交", tone: "success" },
  team_pending: { label: "团队审核中", tone: "warning" },
  team_rejected: { label: "团队已驳回", tone: "danger" },
  available: { label: "可用", tone: "success" },
  public_pending: { label: "公共审核中", tone: "warning" },
  public_rejected: { label: "公共已驳回", tone: "danger" },
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

export function getProductDisplayStatusKey(status, teamReviewStatus = "", publicReviewStatus = "", scope = "") {
  if (publicReviewStatus === "pending") return "public_pending"
  if (publicReviewStatus === "rejected") return "public_rejected"
  if (teamReviewStatus === "pending") return "team_pending"
  if (teamReviewStatus === "rejected") return "team_rejected"
  if (status === "confirmed" && scope === "mine") return "confirmed_personal"
  return productDisplayStatusMap[status] || "needs_completion"
}

export function getProductDisplayStatus(status, teamReviewStatus = "", publicReviewStatus = "", scope = "") {
  return productDisplayStatusMeta[getProductDisplayStatusKey(status, teamReviewStatus, publicReviewStatus, scope)]
}

export function canViewProduct(product, role, userId = "demo-member") {
  if (role === "system_admin") return true
  if (product.teamReviewStatus === "pending" || product.teamReviewStatus === "rejected") {
    return product.ownerId === userId || canReviewProduct(product, role)
  }
  if (product.publicReviewStatus === "approved") return product.status !== "archived"
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
  if (product.teamReviewStatus === "pending" || product.publicReviewStatus === "pending") return false
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

export function canSubmitProductForTeam(product, role, userId = "demo-member") {
  return product.scope === "mine"
    && product.status === "confirmed"
    && (role === "system_admin" || product.ownerId === userId)
    && product.teamReviewStatus !== "pending"
}

export function canCancelTeamProductSubmission(product, role, userId = "demo-member") {
  return product.teamReviewStatus === "pending"
    && (role === "system_admin" || product.ownerId === userId)
}

export function canReviewProduct(product, role) {
  return product.teamReviewStatus === "pending"
    && ["department_admin", "approval_admin", "system_admin"].includes(role)
    && (role === "system_admin" || product.orgId === "org-product")
}

export function canApproveProduct(product, role) {
  return canReviewProduct(product, role)
}

export function canRequestPublicProduct(product, role, userId = "demo-member") {
  return product.scope === "team"
    && product.status === "confirmed"
    && product.publicReviewStatus !== "pending"
    && product.publicReviewStatus !== "approved"
    && (role === "system_admin" || product.ownerId === userId || role === "department_admin")
}

export function canCancelPublicProductSubmission(product, role, userId = "demo-member") {
  return product.publicReviewStatus === "pending"
    && (role === "system_admin" || product.ownerId === userId)
}

export function canReviewPublicProduct(product, role) {
  return product.publicReviewStatus === "pending" && role === "system_admin"
}

export function canReviseProduct(product, role, userId = "demo-member") {
  return product.status === "confirmed" && (role === "system_admin" || product.ownerId === userId)
}

export function canAdjustProductScope(product, role) {
  return product.scope === "team"
    && product.publicReviewStatus !== "approved"
    && ["department_admin", "system_admin"].includes(role)
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
      scope: "mine",
      status: "confirmed",
      teamReviewStatus: "",
      teamRejectionReason: "",
      confirmedAt: now,
      updatedAt: now,
      visibleOrgIds: [],
      candidates: product.candidates.map((candidate) => ({ ...candidate, selected: candidate.id === payload.candidateId })),
      versions: [
        ...(product.versions || []),
        { id: `version-${Date.now()}`, label: "已确认版本", note: "运营确认标准商品还原图", createdAt: now },
      ],
    }
  }

  if (event === "submit_team") {
    return {
      ...product,
      teamReviewStatus: "pending",
      teamRejectionReason: "",
      submittedAt: now,
      updatedAt: now,
    }
  }

  if (event === "cancel_team") {
    return {
      ...product,
      teamReviewStatus: "",
      submittedAt: "",
      updatedAt: now,
    }
  }

  if (event === "approve_team") {
    if (!payload.visibleOrgIds?.length) throw new Error("团队商品审批至少需要一个可见组织")
    return {
      ...product,
      scope: "team",
      status: "confirmed",
      teamReviewStatus: "approved",
      source: "团队审核",
      visibleOrgIds: payload.visibleOrgIds,
      reviewedAt: now,
      updatedAt: now,
    }
  }

  if (event === "reject_team") {
    return {
      ...product,
      scope: "mine",
      teamReviewStatus: "rejected",
      teamRejectionReason: payload.reason || "",
      visibleOrgIds: [],
      reviewedAt: now,
      updatedAt: now,
    }
  }

  if (event === "submit_public") {
    return {
      ...product,
      publicReviewStatus: "pending",
      publicRejectionReason: "",
      publicSubmittedAt: now,
      publicSubmitterId: payload.submitterId || product.ownerId,
      updatedAt: now,
    }
  }

  if (event === "cancel_public") {
    return {
      ...product,
      publicReviewStatus: "",
      publicSubmittedAt: "",
      updatedAt: now,
    }
  }

  if (event === "approve_public") {
    return {
      ...product,
      publicReviewStatus: "approved",
      publicReviewedAt: now,
      updatedAt: now,
    }
  }

  if (event === "reject_public") {
    return {
      ...product,
      publicReviewStatus: "rejected",
      publicRejectionReason: payload.reason || "",
      publicReviewedAt: now,
      updatedAt: now,
    }
  }

  if (event === "set_scope") {
    if (!payload.visibleOrgIds?.length) throw new Error("团队商品至少需要一个可见组织")
    return { ...product, visibleOrgIds: payload.visibleOrgIds, updatedAt: now }
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

export function filterProducts(products, { scope, role, userId = "demo-member", query = "", category = "all", status = "all", review = "" }) {
  const normalizedQuery = query.trim().toLowerCase()
  return products.filter((product) => {
    if (!canViewProduct(product, role, userId)) return false
    if (scope === "mine" && product.ownerId !== userId) return false
    if (scope === "team") {
      if (review === "team") {
        if (!canReviewProduct(product, role)) return false
      } else if (review === "public") {
        if (!canReviewPublicProduct(product, role)) return false
      } else if (product.scope !== "team") return false
    }
    if (scope === "public" && product.scope !== "public" && product.publicReviewStatus !== "approved") return false
    if (category !== "all" && product.category !== category) return false
    if (status !== "all" && getProductDisplayStatusKey(product.status, product.teamReviewStatus, product.publicReviewStatus, product.scope) !== status) return false
    if (normalizedQuery && !`${product.name} ${product.category} ${product.source}`.toLowerCase().includes(normalizedQuery)) return false
    return true
  })
}
