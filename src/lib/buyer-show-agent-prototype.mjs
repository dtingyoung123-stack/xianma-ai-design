import { agentResultSources, agentStageDefinitions, buyerShowAgentModels } from "../data/demo/buyer-show-agent.js"

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function nowLabel() {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
}

function makeStages(activeIndex = 0, activeStatus = "处理中") {
  return agentStageDefinitions.map((label, index) => ({
    id: `stage-${index + 1}`,
    label,
    status: index < activeIndex ? "完成" : index === activeIndex ? activeStatus : "等待",
  }))
}

function currentVersion(result) {
  return result.versions.find((version) => version.id === result.currentVersionId)
}

function createResult(sequence) {
  const id = `result-${sequence}`
  const version = {
    id: `${id}-v1`,
    label: "V1",
    src: agentResultSources[(sequence - 1) % agentResultSources.length],
    source: "初始生成",
    createdAt: `今天 ${nowLabel()}`,
  }
  return {
    id,
    sequence,
    currentVersionId: version.id,
    versions: [version],
    technicalStatus: sequence === 4 ? "生成失败" : "生成完成",
    qaStatus: sequence === 2 ? "待修复" : sequence === 4 ? "无法判断" : "通过",
    userStatus: "待确认",
    summary: sequence === 2
      ? "下摆纹样存在偏移，已进入定向修复。"
      : sequence === 4
        ? "候选图未完整返回，无法判断商品一致性。"
        : "商品主体与确认资料一致，人物和场景关系自然。",
    error: sequence === 4 ? "生成过程提前结束，可单张重新生成。" : "",
  }
}

export function inferBuyerShowEvidenceRole(asset) {
  const text = `${asset?.title || ""} ${asset?.name || ""} ${asset?.filename || ""} ${(asset?.tags || []).join(" ")}`.toLowerCase()
  if (/场景|环境|空间|客厅|卧室|户外|咖啡/.test(text)) return "目标场景图"
  if (/风格|氛围|构图|姿态|灵感/.test(text)) return "风格参考图"
  if (/细节|结构|材质|纹理|领口|袖口|拉链|车线/.test(text)) return "商品结构或细节"
  if (/商品|实拍|产品|主图|正面|背面|侧面/.test(text)) return "商品实拍"
  return "其他参考资料"
}

function supportsDraft(model, draft) {
  if (!model || model.id === "auto") return true
  return draft.evidence.length <= model.maxInputs
    && model.ratios.includes(draft.ratio)
    && model.resolutions.includes(draft.resolution)
}

export function matchBuyerShowAgentModel(draft) {
  const requested = buyerShowAgentModels.find((model) => model.id === draft.modelId) || buyerShowAgentModels[0]
  if (requested.id !== "auto") {
    if (!supportsDraft(requested, draft)) {
      return {
        supported: false,
        requested,
        reason: `${requested.name} 不支持当前 ${draft.evidence.length} 张补充图片、${draft.ratio} 比例与 ${draft.resolution} 清晰度组合。`,
      }
    }
    return { supported: true, requested, actualModel: requested, reason: "用户指定主要生成模型" }
  }
  const candidates = buyerShowAgentModels
    .filter((model) => model.id !== "auto" && supportsDraft(model, draft))
    .sort((left, right) => right.qualityScore - left.qualityScore)
  return {
    supported: Boolean(candidates[0]),
    requested,
    actualModel: candidates[0],
    candidates,
    reason: candidates[0] ? "按商品一致性、结构准确性和人物接触关系优先匹配" : "当前没有满足输入条件的模型",
  }
}

export function validateBuyerShowAgentDraft(draft) {
  const errors = {}
  if (!draft?.product) errors.product = "请先选择已确认商品。"
  if (!draft?.prompt?.trim()) errors.prompt = "请填写创作提示词。"
  return errors
}

export function analyzeBuyerShowAgentDraft(draft) {
  const conflicts = [...(draft?.product?.taskConflicts || []), ...draft.evidence.flatMap((asset) => asset.conflicts || [])]
  const gaps = [...(draft?.product?.taskGaps || [])]
  const roles = draft.evidence.map((asset) => asset.role || inferBuyerShowEvidenceRole(asset))
  const branch = roles.includes("目标场景图")
    ? "目标场景约束生成"
    : roles.includes("风格参考图")
      ? "参考引导生成"
      : "自由场景生成"
  const modelMatch = matchBuyerShowAgentModel(draft)
  const kind = conflicts.length ? "conflict" : !modelMatch.supported ? "model_conflict" : gaps.length ? "gap" : "ready"
  return {
    kind,
    confirmedFacts: draft?.product?.facts || [],
    evidenceCount: draft?.evidence?.length || 0,
    evidenceAnalysis: draft.evidence.map((asset) => ({ id: asset.id, name: asset.name || asset.title, role: asset.role || inferBuyerShowEvidenceRole(asset), roleSource: asset.roleSource || "agent" })),
    gaps,
    conflicts,
    branch,
    modelMatch,
  }
}

export function createBuyerShowAgentTask(draft, options = {}) {
  const id = `agent-${Date.now()}`
  const count = Number(draft.count) || 4
  const analysis = options.analysis || analyzeBuyerShowAgentDraft(draft)
  const actualModel = analysis.modelMatch.actualModel
  const productVersion = draft.product.versions?.at(-1)?.id || "confirmed"
  return {
    id,
    title: `${draft.product.name} · ${count} 张买家秀`,
    createdAt: `今天 ${nowLabel()}`,
    status: agentStageDefinitions[0],
    phase: "understanding",
    progress: 8,
    draft: clone(draft),
    productSnapshot: { id: draft.product.id, name: draft.product.name, sku: draft.product.sku, variant: draft.product.variant, versionId: productVersion, facts: clone(draft.product.facts || []), images: clone(draft.product.images || []) },
    evidenceAnalysis: analysis.evidenceAnalysis,
    learningResult: { status: "completed", summary: "已基于当前已确认商品快照完成本任务学习，未知信息未写入商品事实。" },
    gaps: analysis.gaps,
    conflicts: analysis.conflicts,
    gapOverrideConfirmed: Boolean(options.gapOverrideConfirmed),
    creationBranch: analysis.branch,
    methodPlan: ["固化已确认商品快照", `采用${analysis.branch}`, "优先检查商品一致性与人物接触关系", "只对明确失败项进行修复"],
    modelPlan: {
      requestedModelId: draft.modelId,
      actualModel: clone(actualModel),
      fallbackModels: (analysis.modelMatch.candidates || []).slice(1, 3).map((model) => ({ id: model.id, name: model.name })),
      tools: ["商品学习", "资料角色识别", "图片生成", "质量检查", "局部修复"],
      reason: analysis.modelMatch.reason,
    },
    stages: makeStages(0),
    results: [],
    adopted: null,
    adoptedVersions: {},
    reviews: [],
    reviewSettings: { count: 5, sellingPoints: "" },
    generationRecords: [],
    qaRecords: [],
    repairRecords: [],
    feedback: [],
    timeline: [{ id: `${id}-created`, type: "任务", title: "创建任务快照", detail: "已保存商品、补充图片、提示词、输出参数和模型计划。", createdAt: `今天 ${nowLabel()}` }],
  }
}

export function advanceBuyerShowAgentTask(task) {
  if (!task) return task
  if (task.phase === "understanding") return { ...task, status: agentStageDefinitions[1], phase: "planning", progress: 24, stages: makeStages(1) }
  if (task.phase === "planning") return { ...task, status: agentStageDefinitions[2], phase: "generating", progress: 46, stages: makeStages(2) }
  if (task.phase === "generating") {
    const results = Array.from({ length: Number(task.draft.count) || 4 }, (_, index) => createResult(index + 1))
    return {
      ...task,
      status: agentStageDefinitions[3],
      phase: "checking",
      progress: 70,
      stages: makeStages(3),
      results,
      generationRecords: [...task.generationRecords, { model: task.modelPlan.actualModel.name, version: "prototype-v1", input: { evidenceCount: task.evidenceAnalysis.length, ratio: task.draft.ratio, resolution: task.draft.resolution, quality: task.draft.quality }, result: `${results.filter((result) => result.technicalStatus === "生成完成").length} 张完成`, createdAt: `今天 ${nowLabel()}` }],
    }
  }
  if (task.phase === "checking") {
    return {
      ...task,
      status: agentStageDefinitions[4],
      phase: "repairing",
      progress: 86,
      stages: makeStages(4, "修复中"),
      qaRecords: [...task.qaRecords, { conclusion: "商品一致性和画面质量已逐张检查；结果 02 需要修复，结果 04 无法判断。", createdAt: `今天 ${nowLabel()}` }],
    }
  }
  if (task.phase === "repairing") {
    const results = task.results.map((result) => {
      if (result.sequence !== 2) return result
      const version = { id: `${result.id}-v2`, label: "V2", src: agentResultSources[4], source: "Agent 自动修复", reason: "修复商品纹样偏移", createdAt: `今天 ${nowLabel()}` }
      return { ...result, currentVersionId: version.id, versions: [...result.versions, version], technicalStatus: "生成完成", qaStatus: "通过", summary: "定向修复完成，商品结构与画面关系已通过检查。" }
    })
    return {
      ...task,
      status: "待用户确认",
      phase: "awaiting_confirmation",
      progress: 100,
      stages: makeStages(5),
      results,
      repairRecords: [...task.repairRecords, { resultId: "result-2", method: "局部结构修复", model: task.modelPlan.actualModel.name, conclusion: "V2 通过", createdAt: `今天 ${nowLabel()}` }],
      timeline: [...task.timeline, { id: `${task.id}-auto-repair`, type: "修复", title: "完成自动修复", detail: "结果 02 新增 V2，旧版本继续保留。", createdAt: `今天 ${nowLabel()}` }],
    }
  }
  return task
}

export function stopBuyerShowAgentTask(task) {
  if (!task) return task
  return {
    ...task,
    status: "已停止",
    phase: "stopped",
    stages: task.stages.map((stage) => ["处理中", "修复中"].includes(stage.status) ? { ...stage, status: "停止" } : stage),
    timeline: [...task.timeline, { id: `${task.id}-stopped`, type: "停止", title: "用户主动停止", detail: "当前输入和已生成版本已保留，可按原任务重新执行。", createdAt: `今天 ${nowLabel()}` }],
  }
}

export function retryBuyerShowAgentTask(task) {
  return createBuyerShowAgentTask(task.draft, { analysis: analyzeBuyerShowAgentDraft(task.draft), gapOverrideConfirmed: task.gapOverrideConfirmed })
}

export function approveBuyerShowAgentResult(task, resultId) {
  return {
    ...task,
    results: task.results.map((result) => result.id === resultId ? { ...result, userStatus: "认可" } : result),
    timeline: [...task.timeline, { id: `${task.id}-approve-${resultId}-${Date.now()}`, type: "认可", title: `认可结果 ${resultId.replace("result-", "")}`, detail: "该图片现在可用于生成评价文案。", createdAt: `今天 ${nowLabel()}` }],
  }
}

export function submitBuyerShowAgentFeedback(task, payload) {
  const result = task.results.find((item) => item.id === payload.resultId)
  if (!result) return task
  return {
    ...task,
    status: "正在修复图片问题",
    phase: "feedback_repairing",
    pendingFeedback: payload,
    results: task.results.map((item) => item.id === payload.resultId ? { ...item, userStatus: "待调整" } : item),
    feedback: [...task.feedback, { ...payload, id: `feedback-${Date.now()}`, createdAt: `今天 ${nowLabel()}` }],
    timeline: [...task.timeline, { id: `feedback-${Date.now()}`, type: "反馈", title: `待调整 · 结果 ${String(result.sequence).padStart(2, "0")}`, detail: `${payload.types.join("、")}${payload.note ? `：${payload.note}` : ""}`, createdAt: `今天 ${nowLabel()}` }],
  }
}

export function completeBuyerShowAgentFeedbackRepair(task) {
  const payload = task?.pendingFeedback
  if (!payload) return task
  const results = task.results.map((result) => {
    if (result.id !== payload.resultId) return result
    const nextNumber = result.versions.length + 1
    const version = {
      id: `${result.id}-v${nextNumber}`,
      label: `V${nextNumber}`,
      src: agentResultSources[5],
      source: "用户反馈定向修复",
      reason: `${payload.types.join("、")}${payload.note ? `：${payload.note}` : ""}`,
      createdAt: `今天 ${nowLabel()}`,
    }
    return { ...result, currentVersionId: version.id, versions: [...result.versions, version], technicalStatus: "生成完成", qaStatus: "通过", userStatus: "待确认", summary: "已按反馈生成新版本，旧版本继续保留。" }
  })
  return {
    ...task,
    status: "待用户确认",
    phase: "awaiting_confirmation",
    pendingFeedback: null,
    results,
    repairRecords: [...task.repairRecords, { resultId: payload.resultId, method: "用户反馈定向修复", model: task.modelPlan.actualModel.name, conclusion: "新版本已生成并通过检查", createdAt: `今天 ${nowLabel()}` }],
  }
}

export function applyBuyerShowAgentLocalEdit(task, resultId, payload) {
  const results = task.results.map((result) => {
    if (result.id !== resultId) return result
    const nextNumber = result.versions.length + 1
    const version = { id: `${result.id}-v${nextNumber}`, label: `V${nextNumber}`, src: payload.candidate.src, source: "继续微调", reason: payload.instruction, createdAt: `今天 ${nowLabel()}` }
    return { ...result, currentVersionId: version.id, versions: [...result.versions, version], qaStatus: "通过", userStatus: "待确认", summary: "已生成微调版本，旧版本继续保留。" }
  })
  return {
    ...task,
    results,
    repairRecords: [...task.repairRecords, { resultId, method: payload.direction.title, model: task.modelPlan.actualModel.name, conclusion: "微调版本已生成", createdAt: `今天 ${nowLabel()}` }],
    timeline: [...task.timeline, { id: `${task.id}-local-edit-${Date.now()}`, type: "版本", title: "完成继续微调", detail: payload.instruction, createdAt: `今天 ${nowLabel()}` }],
  }
}

export function retryBuyerShowAgentResult(task, resultId) {
  const results = task.results.map((result) => {
    if (result.id !== resultId || result.technicalStatus !== "生成失败") return result
    const nextNumber = result.versions.length + 1
    const version = { id: `${result.id}-v${nextNumber}`, label: `V${nextNumber}`, src: agentResultSources[6], source: "失败结果重新生成", reason: "根据失败原因切换候补方法", createdAt: `今天 ${nowLabel()}` }
    return { ...result, currentVersionId: version.id, versions: [...result.versions, version], technicalStatus: "生成完成", qaStatus: "通过", userStatus: "待确认", error: "", summary: "重新生成完成，已通过商品一致性与画面质量检查。" }
  })
  return {
    ...task,
    results,
    generationRecords: [...task.generationRecords, { model: task.modelPlan.fallbackModels[0]?.name || task.modelPlan.actualModel.name, version: "prototype-retry", input: { resultId, reason: "初始生成未完整返回" }, result: "重新生成成功", createdAt: `今天 ${nowLabel()}` }],
    timeline: [...task.timeline, { id: `${task.id}-retry-result-${Date.now()}`, type: "重试", title: "失败结果重新生成", detail: "已根据失败原因使用候补方法，未执行无差别重复生成。", createdAt: `今天 ${nowLabel()}` }],
  }
}

export function adoptBuyerShowAgentVersion(task, resultId, versionId) {
  const result = task.results.find((item) => item.id === resultId)
  const version = result?.versions.find((item) => item.id === versionId)
  if (!result || !version) return task
  return {
    ...task,
    status: "已有采用结果",
    adopted: { resultId, versionId },
    adoptedVersions: { ...(task.adoptedVersions || {}), [resultId]: versionId },
    timeline: [...task.timeline, { id: `${task.id}-adopt-${Date.now()}`, type: "采用", title: `采用结果 ${String(result.sequence).padStart(2, "0")} ${version.label}`, detail: "采用状态与生成和质检状态分开记录。", createdAt: `今天 ${nowLabel()}` }],
  }
}

export function restoreBuyerShowAgentVersion(task, resultId, versionId) {
  let restoredVersion = null
  const results = task.results.map((result) => {
    if (result.id !== resultId) return result
    restoredVersion = result.versions.find((version) => version.id === versionId)
    return restoredVersion ? { ...result, currentVersionId: versionId } : result
  })
  if (!restoredVersion) return task
  return {
    ...task,
    results,
    timeline: [...task.timeline, { id: `${task.id}-restore-${Date.now()}`, type: "恢复", title: `切换到 ${restoredVersion.label}`, detail: "仅切换当前查看版本，历史版本继续保留。", createdAt: `今天 ${nowLabel()}` }],
  }
}

export function getEligibleBuyerShowReviewResults(task) {
  return (task?.results || []).filter((result) => result.technicalStatus !== "生成失败" && (result.userStatus === "认可" || task.adoptedVersions?.[result.id]))
}

export function getBuyerShowAgentCurrentVersion(result) {
  return currentVersion(result)
}
