import { createExampleCase } from "../../lib/workflow-prototype.mjs"

export const workflowUsers = [
  { id: "wf-author", name: "设计作者", orgId: "org-zhongchuang-business-center", balance: 800, allowedScopeIds: ["org-zhongchuang"] },
  { id: "wf-member", name: "有权同事 A", orgId: "org-zhongchuang-xumishan", balance: 500 },
  { id: "wf-member-b", name: "有权同事 B", orgId: "org-zhongchuang-jingdong", balance: 500 },
  { id: "wf-outsider", name: "无权同事", orgId: "org-zhongchuang-huaguoshan", balance: 500 },
  { id: "wf-admin", name: "系统管理员", orgId: "org-zhongchuang-business-center", balance: 800, admin: true, allowedScopeIds: ["org-zhongchuang"] },
  { id: "", name: "未登录", orgId: "", balance: 0 },
]
export const workflowScenes = ["商品主图", "场景图", "详情页", "短视频", "营销海报"]
export const workflowDemoGraph = {
  nodes: [
    { id: "product", type: "image", title: "商品图片", x: 0, y: 0, width: 280, result: "/assets/layout-square-1.png" },
    { id: "brief", type: "text", title: "商品信息", x: 0, y: 380, width: 280, prompt: "描述商品卖点与使用场景" },
    { id: "reference", type: "image", title: "固定风格参考", x: 0, y: 760, width: 280, result: "/assets/layout-horizontal-5.jpg" },
    { id: "copy", type: "text", title: "整理创作描述", x: 380, y: 380, width: 280, prompt: "根据商品信息整理准确的场景描述" },
    { id: "visual", type: "image", title: "商品场景图", x: 760, y: 0, width: 280, result: "/assets/layout-horizontal-5.jpg", generated: true },
    { id: "caption", type: "text", title: "商品展示文案", x: 760, y: 380, width: 280, prompt: "以清晰构图呈现商品，突出真实使用场景。", generated: true },
  ],
  edges: [{ source: "product", target: "visual" }, { source: "brief", target: "copy" }, { source: "reference", target: "visual" }, { source: "copy", target: "visual" }, { source: "copy", target: "caption" }].map((e, i) => ({ ...e, id: `we-${i}` })),
}
export const initialWorkflows = [{
  id: "wf-product-scene", name: "商品场景图与展示文案", description: "上传商品图片，填写商品信息，一次获取场景图和展示文案。", scenes: ["商品主图", "场景图"], cover: "/assets/layout-horizontal-5.jpg",
  authorId: "wf-author", authorName: "设计作者", projectId: "wf-example", orgIds: ["org-zhongchuang-product", "org-zhongchuang-business-center"], status: "published", version: 1, updatedAt: "2026-10-13T00:00:00.000Z", graph: workflowDemoGraph,
  inputs: [{ nodeId: "product", type: "image", label: "商品图片", open: true, required: true, help: "上传清晰、主体完整的商品图", link: "", linkLabel: "素材制作参考" }, { nodeId: "brief", type: "text", label: "商品基础信息", open: true, required: true, help: "填写品名、卖点及期望场景", link: "", linkLabel: "制作参考" }, { nodeId: "reference", type: "image", label: "固定风格参考", open: false, required: true, help: "", link: "", linkLabel: "" }],
  outputs: [{ nodeId: "visual", type: "image", label: "商品场景图" }, { nodeId: "caption", type: "text", label: "展示文案" }], demoQuote: 20,
}]

// Keep the old version as an independent historical task fixture.
const historicalWorkflow = structuredClone(initialWorkflows[0])
initialWorkflows[0] = {
  ...initialWorkflows[0], version: 2, updatedAt: "2026-10-13T08:00:00.000Z", includeExample: true,
  inputs: initialWorkflows[0].inputs.map(({ link, linkLabel, ...input }) => input),
  exampleCase: createExampleCase({ ...initialWorkflows[0], includeExample: true }, workflowDemoGraph, 2),
}

export function upgradeDefaultWorkflowDemo(store) {
  const original = JSON.stringify(historicalWorkflow)
  return { ...store, templates: store.templates.map(template => JSON.stringify(template) === original ? structuredClone(initialWorkflows[0]) : template) }
}

// Recorded example states, not production settlement or cancellation rules.
export const workflowTaskExamples = ["succeeded", "failed", "cancelled"].map((outcome, index) => ({
  id: `wf-record-${index}`, requestId: `wf-record-${index}`, ownerId: "wf-member-b", startedAt: Date.parse("2026-10-13T00:00:00Z") + index * 60000,
  templateId: initialWorkflows[0].id, templateName: initialWorkflows[0].name, version: 1, snapshot: historicalWorkflow,
  values: { product: "/assets/layout-square-1.png", brief: "演示商品的基础信息与场景要求" }, estimated: 20, settled: outcome === "succeeded" ? 20 : null, outcome,
}))
