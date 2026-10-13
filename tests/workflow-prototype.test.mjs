import test from "node:test"
import assert from "node:assert/strict"
import { assertManagementCurrent, outputText, createExampleCase, workflowParent, acceptTask, canUse, canManage, executionOrder, inferInputs, taskState, validatePublication } from "../src/lib/workflow-prototype.mjs"

const tree = [{ id: "parent", children: [{ id: "child", children: [] }, { id: "future-child", children: [] }] }, { id: "other", children: [] }]
const graph = { nodes: [{ id: "in", type: "text", title: "信息", prompt: "固定文案" }, { id: "out", type: "image", title: "图片" }], edges: [{ source: "in", target: "out" }] }
const template = { id: "t", authorId: "author", name: "模板", description: "用途", scenes: ["主图"], cover: "/cover.png", orgIds: ["parent"], status: "published", version: 1, graph, inputs: inferInputs(graph), outputs: [{ nodeId: "out", type: "image", label: "成品" }] }
const user = { id: "member", orgId: "child", balance: 100 }
function submit(patch = {}) { return acceptTask({ template, user, tree, version: 1, values: { in: "商品一" }, requestId: "request", tasks: [], quote: 10, now: 1000, outcome: "succeeded", ...patch }) }
test("自动获取根输入，不将中间文本或结果开放，执行不依赖坐标", () => {
  assert.deepEqual(inferInputs(graph).map(i => i.nodeId), ["in"])
  assert.deepEqual(executionOrder({ ...graph, nodes: [...graph.nodes].reverse() }), ["in", "out"])
  assert.throws(() => executionOrder({ ...graph, edges: [...graph.edges, { source: "out", target: "in" }] }), /循环/)
})
test("发布检查定位缺失输出、固定内容、不支持节点和空值依赖", () => {
  assert.deepEqual(validatePublication(template, graph, ["parent"]), [])
  assert.ok(validatePublication({ ...template, outputs: [] }, graph, ["parent"]).some(e => e.includes("最终输出")))
  assert.ok(validatePublication({ ...template, inputs: [{ ...template.inputs[0], open: false }] }, { ...graph, nodes: graph.nodes.map(n => ({ ...n, prompt: "" })) }, ["parent"]).some(e => e.includes("固定内容缺失")))
  assert.ok(validatePublication({ ...template, inputs: [{ ...template.inputs[0], required: false }] }, graph, ["parent"]).some(e => e.includes("接受空值")))
})
test("父组织覆盖未来子组织，使用权不等于管理权", () => {
  assert.equal(canUse(template, { ...user, orgId: "future-child" }, tree), true)
  assert.equal(canUse(template, { ...user, orgId: "other" }, tree), false)
  assert.equal(canManage(template, user), false)
  assert.equal(canManage(template, { id: "author" }), true)
})
test("下架、撤权、过期版本、未知费用、余额和必填拦截", () => {
  assert.throws(() => submit({ template: { ...template, status: "unpublished" } }), /下架/)
  assert.throws(() => submit({ user: { ...user, orgId: "other" } }), /权限/)
  assert.throws(() => submit({ version: 0 }), /已更新/)
  assert.throws(() => submit({ quote: null }), /费用/)
  assert.throws(() => submit({ user: { ...user, balance: 0 } }), /余额/)
  assert.throws(() => submit({ values: {} }), /填写/)
})
test("独立快照不受模板更新下架和其他运行者输入影响", () => {
  const t = structuredClone(template), task = submit({ template: t })
  t.version = 2; t.status = "unpublished"; t.graph.nodes[0].prompt = "新配置"
  assert.equal(task.snapshot.version, 1); assert.equal(task.snapshot.graph.nodes[0].prompt, "固定文案")
  const other = submit({ user: { ...user, id: "other-member" }, requestId: "other", values: { in: "商品二" } })
  assert.equal(task.values.in, "商品一"); assert.equal(other.values.in, "商品二")
  assert.equal(taskState(task, 1200), "queued"); assert.equal(taskState(task, 4000), "running"); assert.equal(taskState(task, 10000), "succeeded")
})
test("重复请求复用任务，重新上架不改变发布版本", () => {
  const task = submit()
  assert.equal(submit({ tasks: [task] }), task)
  assert.equal(submit({ template: { ...template, status: "published" } }).version, 1)
  assert.equal(taskState({ ...task, outcome: "failed" }, 10000), "failed")
  assert.equal(taskState({ ...task, outcome: "cancelled" }, 1200), "cancelled")
})

test("工作流返回到对应上一层，分享链接与未知来源安全兜底", () => {
  assert.equal(workflowParent("view=templates&template=t&tab=published").href, "/ai-canvas?view=templates&tab=published")
  assert.equal(workflowParent("view=templates&template=t").href, "/ai-canvas?view=templates&tab=available")
  assert.equal(workflowParent("view=templates&task=t&tab=available").href, "/ai-canvas?view=templates&tab=tasks")
  assert.equal(workflowParent("view=templates&template=t&tab=invalid").href, "/ai-canvas?view=templates&tab=available")
  assert.equal(workflowParent("view=templates&tab=tasks").href, "/ai-canvas")
  assert.equal(workflowParent("project=p"), null)
})

test("示范案例仅按选择保存，同版本输入输出独立于原画布与任务", () => {
  const canvas = { nodes: [{ id: "in", type: "text", prompt: "发布时输入" }, { id: "out", type: "text", result: "发布时结果", prompt: "生成要求" }, { id: "image", type: "image", result: "/image.png" }, { id: "video", type: "video", result: "/video.mp4" }], edges: [] }
  const draft = { inputs: [{ nodeId: "in", label: "商品信息", type: "text", open: true, link: "https://old", linkLabel: "旧链接" }], outputs: [{ nodeId: "out", label: "文案", type: "text" }, { nodeId: "image", label: "图片", type: "image" }, { nodeId: "video", label: "视频", type: "video" }] }
  assert.equal(createExampleCase(draft, canvas, 2), null)
  const example = createExampleCase({ ...draft, includeExample: true }, canvas, 2)
  canvas.nodes[0].prompt = "修改后输入"
  canvas.nodes[1].result = "其他结果"
  draft.outputs[0].label = "修改后名称"
  assert.equal(example.values.in, "发布时输入")
  assert.equal(example.graph.nodes[1].result, "发布时结果")
  assert.equal(example.outputs[0].label, "文案")
  assert.equal(example.outputs.length, 3)
  assert.equal(example.version, 2)
  assert.equal("link" in example.inputs[0], false)
  assert.equal("linkLabel" in example.inputs[0], false)
})
test("案例缺失输入或最终结果时阻止保存，取消案例不影响原发布", () => {
  const draft = { includeExample: true, inputs: [{ nodeId: "in", label: "输入图", type: "image" }], outputs: [{ nodeId: "out", label: "输出图", type: "image" }] }
  const canvas = { nodes: [{ id: "in", result: "" }, { id: "out", result: "" }], edges: [] }
  assert.throws(() => createExampleCase(draft, canvas, 1), /缺少输入图/)
  canvas.nodes[0].result = "/input.png"
  assert.throws(() => createExampleCase(draft, canvas, 1), /缺少输出图/)
  assert.equal(createExampleCase({ ...draft, includeExample: false }, canvas, 1), null)
})

test("管理保存重新核对身份、权限、组织变更及删除", () => {
  const opened = { ...template, updatedAt: "old" }
  const author = { id: "author" }
  assert.doesNotThrow(() => assertManagementCurrent(opened, opened, author.id, author))
  assert.throws(() => assertManagementCurrent(opened, opened, "member", author), /身份/)
  assert.throws(() => assertManagementCurrent(opened, opened, user.id, user), /权限/)
  assert.throws(() => assertManagementCurrent(null, opened, author.id, author), /不存在/)
  assert.throws(() => assertManagementCurrent({ ...opened, orgIds: ["other"] }, opened, author.id, author), /其他窗口/)
  assert.throws(() => assertManagementCurrent({ ...opened, status: "unpublished" }, opened, author.id, author), /其他窗口/)
})
test("展示和复制均取文本生成结果，缺少结果才退回原文本", () => {
  assert.equal(outputText({ result: "生成结果", prompt: "提示词" }), "生成结果")
  assert.equal(outputText({ prompt: "原文本" }), "原文本")
  assert.equal(outputText(null), "")
})

 test("运行提交拒绝等待期间身份切换及退出登录", async () => {
  const { assertSubmissionIdentity } = await import("../src/lib/workflow-prototype.mjs")
  assert.doesNotThrow(() => assertSubmissionIdentity("member", "member"))
  assert.throws(() => assertSubmissionIdentity("other", "member"), /身份/)
  assert.throws(() => assertSubmissionIdentity("", "member"), /身份/)
  assert.throws(() => assertSubmissionIdentity("", ""), /身份/)
})
test("更新发布使用打开时快照检测组织、状态、版本、删除与身份冲突", async () => {
  const { assertPublicationCurrent } = await import("../src/lib/workflow-prototype.mjs")
  const author = { id: "author", allowedScopeIds: ["org"] }
  const opened = { ...template, updatedAt: "before" }
  assert.doesNotThrow(() => assertPublicationCurrent(opened, opened, author.id, author))
  for (const patch of [{ orgIds: ["other"] }, { status: "unpublished" }, { version: 2 }, { updatedAt: "after" }]) {
    assert.throws(() => assertPublicationCurrent({ ...opened, ...patch }, opened, author.id, author), /其他窗口/)
  }
  assert.throws(() => assertPublicationCurrent(null, opened, author.id, author), /不存在/)
  assert.throws(() => assertPublicationCurrent(opened, opened, "other", author), /身份/)
  assert.doesNotThrow(() => assertPublicationCurrent(undefined, undefined, author.id, author))
  assert.throws(() => assertPublicationCurrent(opened, undefined, author.id, author), /其他窗口发布/)
})

test("默认验收模板有V2示范案例，旧默认升级不覆盖修改及历史任务", async () => {
  const { initialWorkflows, workflowTaskExamples, upgradeDefaultWorkflowDemo } = await import("../src/data/demo/workflows.js")
  assert.equal(initialWorkflows[0].version, 2)
  assert.equal(initialWorkflows[0].exampleCase.version, 2)
  const old = structuredClone(workflowTaskExamples[0].snapshot)
  const changed = { ...old, description: "本人修改" }
  const tasks = structuredClone(workflowTaskExamples)
  const upgraded = upgradeDefaultWorkflowDemo({ templates: [old, changed], tasks, userId: "wf-member" })
  assert.equal(upgraded.templates[0].version, 2)
  assert.equal(upgraded.templates[1].version, 1)
  assert.equal(upgraded.templates[1].description, "本人修改")
  assert.equal(upgraded.tasks, tasks)
  assert.equal(upgraded.tasks[0].snapshot.version, 1)
  assert.equal(old.version, 1)
})
