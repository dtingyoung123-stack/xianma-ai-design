import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import {
  adoptBuyerShowAgentVersion,
  advanceBuyerShowAgentTask,
  analyzeBuyerShowAgentDraft,
  applyBuyerShowAgentLocalEdit,
  approveBuyerShowAgentResult,
  completeBuyerShowAgentFeedbackRepair,
  createBuyerShowAgentTask,
  getEligibleBuyerShowReviewResults,
  inferBuyerShowEvidenceRole,
  restoreBuyerShowAgentVersion,
  retryBuyerShowAgentResult,
  stopBuyerShowAgentTask,
  submitBuyerShowAgentFeedback,
  validateBuyerShowAgentDraft,
} from "../src/lib/buyer-show-agent-prototype.mjs"

const product = {
  id: "test-product",
  name: "脱敏测试商品",
  sku: "TEST-001",
  variant: "标准款",
  facts: ["结构事实", "颜色事实"],
  images: [{ id: "main", src: "/assets/buyer.webp" }],
  versions: [{ id: "v1" }],
  taskGaps: ["背面缺少证据", "材质缺少近景"],
}

const baseDraft = {
  product,
  evidence: [],
  prompt: "生成自然居家场景，保持商品结构和颜色。",
  modelId: "auto",
  count: 4,
  ratio: "3:4",
  resolution: "2K",
  quality: "高画质",
}

test("商品和提示词必填，补充图片保持可选", () => {
  assert.deepEqual(validateBuyerShowAgentDraft({ evidence: [], prompt: "" }), {
    product: "请先选择已确认商品。",
    prompt: "请填写创作提示词。",
  })
  assert.deepEqual(validateBuyerShowAgentDraft(baseDraft), {})
})

test("Agent 自动识别图片角色和创作分支", () => {
  assert.equal(inferBuyerShowEvidenceRole({ name: "客厅目标场景.jpg" }), "目标场景图")
  assert.equal(inferBuyerShowEvidenceRole({ name: "商品领口结构细节.jpg" }), "商品结构或细节")
  const analysis = analyzeBuyerShowAgentDraft({ ...baseDraft, evidence: [{ id: "scene", name: "卧室场景.jpg", role: "目标场景图" }] })
  assert.equal(analysis.branch, "目标场景约束生成")
  assert.equal(analysis.kind, "gap")
})

test("普通缺口允许继续，关键冲突和不支持模型阻断", () => {
  assert.equal(analyzeBuyerShowAgentDraft(baseDraft).kind, "gap")
  assert.equal(analyzeBuyerShowAgentDraft({ ...baseDraft, product: { ...product, taskConflicts: ["型号冲突"] } }).kind, "conflict")
  const unsupported = analyzeBuyerShowAgentDraft({ ...baseDraft, modelId: "wan", resolution: "4K" })
  assert.equal(unsupported.kind, "model_conflict")
  assert.match(unsupported.modelMatch.reason, /不支持/)
})

test("任务保留商品快照、判断、模型、质检、修复与版本数据", () => {
  const analysis = analyzeBuyerShowAgentDraft(baseDraft)
  let task = createBuyerShowAgentTask(baseDraft, { analysis, gapOverrideConfirmed: true })
  assert.equal(task.productSnapshot.versionId, "v1")
  assert.equal(task.gapOverrideConfirmed, true)
  assert.equal(task.modelPlan.actualModel.id, "gpt-image")
  assert.equal(task.draft.quality, "高画质")
  for (let index = 0; index < 5; index += 1) task = advanceBuyerShowAgentTask(task)
  assert.equal(task.phase, "awaiting_confirmation")
  assert.ok(task.generationRecords.length)
  assert.ok(task.qaRecords.length)
  assert.ok(task.repairRecords.length)
  const repaired = task.results.find((result) => result.sequence === 2)
  assert.equal(repaired.versions.length, 2)
  assert.equal(repaired.currentVersionId, repaired.versions[1].id)
})

test("认可、反馈修复、微调、失败重生、版本恢复和采用形成闭环", () => {
  let task = createBuyerShowAgentTask(baseDraft, { analysis: analyzeBuyerShowAgentDraft(baseDraft), gapOverrideConfirmed: true })
  for (let index = 0; index < 5; index += 1) task = advanceBuyerShowAgentTask(task)
  const first = task.results[0]
  task = approveBuyerShowAgentResult(task, first.id)
  assert.equal(getEligibleBuyerShowReviewResults(task).length, 1)
  task = submitBuyerShowAgentFeedback(task, { resultId: first.id, types: ["颜色错误"], note: "颜色偏暖", regionEdit: null })
  task = completeBuyerShowAgentFeedbackRepair(task)
  assert.equal(task.results[0].versions.length, 2)
  task = applyBuyerShowAgentLocalEdit(task, first.id, { candidate: { src: "/assets/expert.webp" }, direction: { title: "提升真实感" }, instruction: "保留商品，降低修饰感" })
  assert.equal(task.results[0].versions.length, 3)
  const failed = task.results.find((result) => result.technicalStatus === "生成失败")
  task = retryBuyerShowAgentResult(task, failed.id)
  assert.equal(task.results.find((result) => result.id === failed.id).technicalStatus, "生成完成")
  const updated = task.results[0]
  task = adoptBuyerShowAgentVersion(task, updated.id, updated.currentVersionId)
  assert.equal(task.adoptedVersions[updated.id], updated.currentVersionId)
  task = restoreBuyerShowAgentVersion(task, updated.id, updated.versions[0].id)
  assert.equal(task.results[0].currentVersionId, updated.versions[0].id)
})

test("停止后保留输入和任务记录", () => {
  const running = advanceBuyerShowAgentTask(createBuyerShowAgentTask(baseDraft, { analysis: analyzeBuyerShowAgentDraft(baseDraft), gapOverrideConfirmed: true }))
  const stopped = stopBuyerShowAgentTask(running)
  assert.equal(stopped.status, "已停止")
  assert.equal(stopped.draft.prompt, baseDraft.prompt)
  assert.match(stopped.timeline.at(-1).title, /用户主动停止/)
})

test("页面复用统一组件且旧买家秀保持隔离", async () => {
  const page = await readFile(new URL("../src/app/ai-hub/BuyerShowAgentPage.jsx", import.meta.url), "utf8")
  const oldPage = await readFile(new URL("../src/app/ai-hub/BuyerShowPage.jsx", import.meta.url), "utf8")
  for (const component of ["ProductPickerModal", "AssetPickerModal", "ImageQueueModule", "WorkbenchParameterSelect", "WorkbenchModelSelect", "WorkbenchHistoryAction", "ImagePreviewModal", "RegionMaskEditor", "ResultLocalEditDialog", "WorkbenchPromptEditor"]) {
    assert.match(page, new RegExp(component))
  }
  assert.match(page, /2\. 补充图片/)
  assert.match(page, /limitText="可选 · 仅用于当前任务"/)
  assert.match(page, /renderItemExtra/)
  assert.match(page, /图片角色/)
  assert.match(page, /label: "画质"/)
  assert.match(page, /label: "图片张数"/)
  assert.doesNotMatch(page, /dimensions:/)
  assert.match(page, /开始生成/)
  assert.doesNotMatch(page, /EvidenceSelection|EvidenceDetailDialog|EvidencePickerDialog|开始 Agent 任务|反馈与版本|智能判断|既定场景替换|参考引导生成/)
  assert.doesNotMatch(oldPage, /BuyerShowAgentPage|buyer-show-agent/)
})

test("全局历史和模型管理使用独立 buyer-show-agent 来源", async () => {
  const historyData = await readFile(new URL("../src/data/demo/history.js", import.meta.url), "utf8")
  const historyPage = await readFile(new URL("../src/app/history/HistoryClient.jsx", import.meta.url), "utf8")
  const adminData = await readFile(new URL("../src/data/demo/admin.js", import.meta.url), "utf8")
  assert.match(historyData, /value: "buyer-show-agent"/)
  assert.match(historyPage, /"buyer-show-agent": "\/ai-hub\/buyer-show-agent"/)
  assert.match(adminData, /id: "buyer-show-agent"/)
})
