// Folder membership is independent of resource publication and visibility.
export function folderPath(folders, id) {
  const parts = []
  const visited = new Set()
  let node = folders.find((item) => item.id === id)
  while (node && !visited.has(node.id)) {
    visited.add(node.id)
    parts.unshift(node.name)
    node = folders.find((item) => item.id === node.parentId)
  }
  return parts.join(" / ")
}

export function descendantIds(folders, id) {
  const ids = new Set([id])
  let previousSize
  do {
    previousSize = ids.size
    folders.forEach((folder) => { if (ids.has(folder.parentId)) ids.add(folder.id) })
  } while (ids.size !== previousSize)
  return [...ids]
}

export function validateFolder(folders, candidate) {
  const name = candidate.name.trim()
  if (!name || name.length > 30 || name.includes("/")) return "名称需为1～30字，且不能包含 /"
  if (name === "未分组") return "未分组是系统保留名称"
  const parent = folders.find((folder) => folder.id === candidate.parentId)
  if (candidate.parentId && (!parent || parent.scope !== candidate.scope || parent.departmentId !== candidate.departmentId)) return "请选择当前范围内的父文件夹"
  if (parent && folderPath(folders, parent.id).split(" / ").length >= 3) return "最多支持三层文件夹"
  if (folders.some((folder) => folder.id !== candidate.id && folder.scope === candidate.scope && folder.departmentId === candidate.departmentId && folder.parentId === candidate.parentId && folder.name === name)) return "同一父级下已有同名文件夹"
  return ""
}

export function canManageFolders(user, scope, departmentId, inScope) {
  if (scope === "personal") return true
  if (user.roleIds.includes("system_admin")) return true
  if (scope === "public") return false
  return inScope(departmentId, user.organizationScopeIds)
    && (user.roleIds.includes("department_admin") || (user.roleIds.includes("approval_admin") && user.approvalTypeIds?.includes("material_publish")))
}

export function removeFolderTree(folders, assignments, id, removeTeamAssets = false) {
  const ids = descendantIds(folders, id)
  const affected = Object.keys(assignments).filter((key) => ids.includes(assignments[key]))
  return {
    folders: folders.filter((folder) => !ids.includes(folder.id)),
    assignments: Object.fromEntries(Object.entries(assignments).filter(([, value]) => !ids.includes(value))),
    // Never remove the resource object: personal/public projections survive.
    removedTeamIds: removeTeamAssets ? affected.filter((key) => key.startsWith("team:")).map((key) => key.slice(5)) : [],
    affected,
  }
}

// Build the complete next demo snapshot before publishing any change.
export function planFolderDeletion(state, id, deleteAssets, canDeleteMaterial) {
  const folder = state.folders.find((item) => item.id === id)
  if (!folder) throw new Error("文件夹已不存在，请刷新后重试")
  const ids = descendantIds(state.folders, id)
  const affectedTeamIds = Object.entries(state.folderAssignments)
    .filter(([key, value]) => key.startsWith("team:") && ids.includes(value))
    .map(([key]) => key.slice(5))
    .filter((resourceId) => !state.removedTeamIds.includes(resourceId))
  if (deleteAssets) {
    if (folder.scope !== "team") throw new Error("只有团队文件夹支持附带删除素材")
    for (const resourceId of affectedTeamIds) {
      const material = state.materials.find((item) => item.id === resourceId)
      if (!material || material.scope !== "team" || material.status !== "active"
        || material.ownerDepartmentId !== folder.departmentId
        || material.publicReviewStatus === "pending" || !canDeleteMaterial(material)) {
        throw new Error("部分素材的状态或删除权限已变化")
      }
    }
  }
  const result = removeFolderTree(state.folders, state.folderAssignments, id)
  const paths = ids.map((folderId) => folderPath(state.folders, folderId))
  return {
    ...state,
    folders: result.folders,
    folderAssignments: result.assignments,
    ...(folder.scope === "personal" ? {
      personalGroups: state.personalGroups.filter((path) => !paths.includes(path)),
      personalGroupAssignments: Object.fromEntries(Object.entries(state.personalGroupAssignments)
        .map(([resourceId, path]) => [resourceId, paths.includes(path) ? "" : path])),
    } : {}),
    removedTeamIds: deleteAssets ? [...new Set([...state.removedTeamIds, ...affectedTeamIds])] : state.removedTeamIds,
    ...(folder.scope === "team" ? { lastTeamLocation: { department: folder.departmentId, folder: "" } } : {}),
  }
}
