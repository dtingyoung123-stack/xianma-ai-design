// Material-library prototype only; production must revalidate each resource on the server.
export function canBatchSubmitMaterial(user, material) {
  return material.scope === "personal" && material.ownerId === user.id
    && ["active", "rejected"].includes(material.status)
}

export function applyMaterialBatch(materials, ids, { action, user, canReview, organizationIds = [], reason = "" }) {
  const byId = new Map(materials.map((material) => [material.id, material]))
  const updates = new Map()
  const failures = []
  for (const id of new Set(ids)) {
    const material = byId.get(id)
    let error = ""
    if (!material) error = "素材已不存在"
    else if (action === "submit") {
      if (!canBatchSubmitMaterial(user, material)) error = "素材状态已变化或无提交权限"
      else updates.set(id, { ...material, status: "pending", rejectionReason: "", submittedAt: "刚刚" })
    } else if (["approve", "reject"].includes(action)) {
      if (material.scope !== "personal" || material.status !== "pending") error = "素材已不在团队待审批状态"
      else if (!canReview(user, material)) error = "无该素材的审批权限"
      else if (action === "approve" && !organizationIds.length) error = "请选择可见组织"
      else if (action === "reject" && !reason.trim()) error = "请填写驳回原因"
      else updates.set(id, action === "approve"
        ? { ...material, scope: "team", status: "active", source: "团队审核", visibleOrgIds: [...organizationIds], reviewedAt: "刚刚" }
        : { ...material, scope: "personal", status: "rejected", rejectionReason: reason.trim(), reviewedAt: "刚刚" })
    } else error = "不支持的批量操作"
    if (error) failures.push({ id, title: material?.title || id, reason: error })
  }
  return { materials: materials.map((material) => updates.get(material.id) || material), successCount: updates.size, failures }
}
