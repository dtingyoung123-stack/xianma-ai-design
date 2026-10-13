// Local prototype contracts only. No model, billing or authorization service.
export function executionOrder(graph) {
  const ids = new Set(graph.nodes.map(n => n.id))
  if (graph.edges.some(e => !ids.has(e.source) || !ids.has(e.target))) throw new Error("流程有失效连线，请返回画布检查")
  const pending = new Map(graph.nodes.map(n => [n.id, 0]))
  graph.edges.forEach(e => pending.set(e.target, pending.get(e.target) + 1))
  const queue = graph.nodes.filter(n => !pending.get(n.id)).map(n => n.id), order = []
  while (queue.length) {
    const id = queue.shift(); order.push(id)
    graph.edges.filter(e => e.source === id).forEach(e => { pending.set(e.target, pending.get(e.target) - 1); if (!pending.get(e.target)) queue.push(e.target) })
  }
  if (order.length !== graph.nodes.length) throw new Error("流程存在循环连线，请返回画布检查")
  return order
}

export function inferInputs(graph) {
  const targets = new Set(graph.edges.map(e => e.target))
  return graph.nodes.filter(n => !targets.has(n.id) && ["image", "text"].includes(n.type)).map(n => ({ nodeId: n.id, type: n.type, label: n.title, open: true, required: true, help: "" }))
}

export function validatePublication(draft, graph, allowedIds) {
  const errors = []
  if (!draft.name.trim()) errors.push("请填写模板名称")
  if (!draft.description.trim()) errors.push("请填写用途说明")
  if (!draft.scenes.length) errors.push("请至少选择一个使用场景")
  if (!draft.cover) errors.push("请选择或上传模板封面")
  if (!draft.orgIds.length || draft.orgIds.some(id => !allowedIds.includes(id))) errors.push("请选择有效的可授权组织")
  if (!draft.outputs.length) errors.push("请至少指定一个最终输出")
  try { executionOrder(graph) } catch (e) { errors.push(e.message) }
  graph.nodes.forEach(n => {
    if (!["image", "text", "video"].includes(n.type)) errors.push(`${n.title}：本期尚不支持封装此类节点`)
    const input = draft.inputs.find(i => i.nodeId === n.id)
    if (input && !input.open && !(n.type === "image" ? n.result : n.prompt)?.trim()) errors.push(`${n.title}：固定内容缺失`)
    if (input?.open && !input.label.trim()) errors.push(`${n.title}：请填写字段名称`)
    if (input?.open && !input.required && graph.edges.some(e => e.source === n.id)) errors.push(`${n.title}：尚未核实下游节点是否接受空值，请设为必填或固定内容`)
  })
  draft.outputs.forEach(o => {
    if (!o.label.trim()) errors.push("请填写输出名称")
    const n = graph.nodes.find(n => n.id === o.nodeId)
    if (!n || !["image", "video", "text"].includes(n.type) || !graph.edges.some(e => e.target === n.id)) errors.push(`${o.label}：没有可执行的输出路径`)
  })
  return [...new Set(errors)]
}

export function organizationIds(tree) { return tree.flatMap(n => [n.id, ...organizationIds(n.children || [])]) }
export function inOrganizationScope(id, scopes, tree) {
  return tree.some(n => (scopes.includes(n.id) && organizationIds([n]).includes(id)) || inOrganizationScope(id, scopes, n.children || []))
}
export function canManage(template, user) { return user.admin || template.authorId === user.id }
export function canUse(template, user, tree) { return Boolean(user.id && inOrganizationScope(user.orgId, template.orgIds, tree)) }
export function taskState(task, now) {
  if (task.outcome === "cancelled") return "cancelled"
  if (now < task.startedAt + 2000) return "queued"
  if (now < task.startedAt + 8000) return "running"
  return task.outcome === "failed" ? "failed" : "succeeded"
}
export function acceptTask({ template, user, tree, version, values, requestId, tasks, quote, now, outcome }) {
  if (!canUse(template, user, tree)) throw new Error("你暂无此模板的使用权限")
  if (template.status !== "published") throw new Error("模板已下架，暂时无法使用")
  if (template.version !== version) throw new Error("模板已更新，请核对最新填写要求后重新提交")
  if (!Number.isFinite(quote) || quote <= 0) throw new Error("费用暂时无法获取，请重试")
  if (user.balance < quote) throw new Error("积分余额不足，请补充积分或返回")
  for (const input of template.inputs.filter(i => i.open)) if (input.required && !values[input.nodeId]?.trim()) throw new Error(`请填写${input.label}`)
  const duplicate = tasks.find(t => t.requestId === requestId && t.ownerId === user.id)
  if (duplicate) return duplicate
  return { id: requestId, requestId, ownerId: user.id, startedAt: now, templateId: template.id, templateName: template.name, version: template.version, snapshot: structuredClone(template), values: structuredClone(values), estimated: quote, outcome, settled: null }
}

// Resolve an internal parent even when a detail is opened from a shared link.
export function workflowParent(search) {
  const params = new URLSearchParams(search)
  if (params.get("view") !== "templates") return null
  if (params.has("task")) return { href: "/ai-canvas?view=templates&tab=tasks", label: "返回我的任务" }
  if (params.has("template")) {
    const tab = params.get("tab") === "published" ? "published" : "available"
    return { href: `/ai-canvas?view=templates&tab=${tab}`, label: tab === "published" ? "返回我的发布" : "返回可用模板" }
  }
  return { href: "/ai-canvas", label: "返回项目列表" }
}

export function createExampleCase(draft, graph, version) {
  if (!draft.includeExample) return null
  const snapshot = structuredClone({ version, inputs: draft.inputs.map(({ link, linkLabel, ...input }) => input), outputs: draft.outputs, graph })
  const values = Object.fromEntries(snapshot.inputs.map(input => {
    const node = snapshot.graph.nodes.find(n => n.id === input.nodeId)
    const value = input.type === "text" ? node?.prompt : node?.result
    if (!value?.trim()) throw new Error(`示范案例缺少${input.label}，请先在画布准备内容或取消勾选示范案例`)
    return [input.nodeId, value]
  }))
  snapshot.outputs.forEach(output => {
    const node = snapshot.graph.nodes.find(n => n.id === output.nodeId)
    const value = output.type === "text" ? node?.result || node?.prompt : node?.result
    if (!value?.trim()) throw new Error(`示范案例缺少${output.label}结果，请先在画布准备结果或取消勾选示范案例`)
  })
  return { ...snapshot, values }
}

export function assertManagementCurrent(current, opened, currentUserId, user) {
  if (currentUserId !== user.id) throw new Error("登录身份已变化，请重新打开管理配置")
  if (!current) throw new Error("模板已不存在，请刷新列表")
  if (!canManage(current, user)) throw new Error("没有管理权限")
  if (current.updatedAt !== opened.updatedAt || current.version !== opened.version || JSON.stringify(current.orgIds) !== JSON.stringify(opened.orgIds) || current.status !== opened.status) throw new Error("模板配置已被其他窗口修改，请关闭后重新打开")
}
export function outputText(node) { return node?.result || node?.prompt || "" }

export function assertSubmissionIdentity(currentUserId, openedUserId) {
  if (!openedUserId || currentUserId !== openedUserId) throw new Error("登录身份已变化，请重新打开页面后提交")
}
export function assertPublicationCurrent(current, opened, currentUserId, user) {
  assertSubmissionIdentity(currentUserId, user.id)
  if (!user.admin && !user.allowedScopeIds?.length) throw new Error("当前身份无模板发布权限")
  if (opened) assertManagementCurrent(current, opened, currentUserId, user)
  else if (current) throw new Error("模板已由其他窗口发布，请关闭后重新打开配置")
}
