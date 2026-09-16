// Synthetic fixtures for the AI Buyer Show Agent prototype.
// They do not represent real products, users, model calls, or production tasks.

export const buyerShowAgentProducts = [
  {
    id: "agent-product-a",
    name: "复古提花针织开衫 A",
    sku: "XM-DEMO-FZ-A01",
    variant: "棕白 · M",
    category: "通用",
    scope: "team",
    status: "confirmed",
    teamReviewStatus: "approved",
    ownerId: "demo-member",
    source: "团队商品库",
    factSummary: "棕白提花针织主体，米白翻领与门襟，单排纽扣，袖口和下摆为棕色罗纹收边。",
    facts: ["棕白对称提花", "米白翻领与门襟", "单排纽扣"],
    taskGaps: ["背面提花排布缺少清晰参考", "材质近景缺少同光线对照"],
    images: [{ id: "agent-product-a-main", src: "/assets/layout-vertical-1.png", name: "商品确认图" }],
    candidates: [{ id: "agent-product-a-confirmed", src: "/assets/layout-vertical-1.png", status: "success", selected: true }],
    versions: [{ id: "v2", label: "已确认版本" }],
  },
  {
    id: "agent-product-b",
    name: "轻量织物支撑用品 B",
    sku: "XM-DEMO-ZW-B02",
    variant: "浅灰 · 标准款",
    category: "通用",
    scope: "public",
    status: "confirmed",
    teamReviewStatus: "approved",
    publicReviewStatus: "approved",
    ownerId: "demo-system",
    source: "公共商品库",
    factSummary: "浅灰织物主体，柔性包边与分区车线已确认，当前资料覆盖完整外观和材质。",
    facts: ["浅灰织物主体", "柔性包边", "分区车线"],
    taskGaps: [],
    images: [{ id: "agent-product-b-main", src: "/assets/layout-square-2.png", name: "商品确认图" }],
    candidates: [{ id: "agent-product-b-confirmed", src: "/assets/layout-square-2.png", status: "success", selected: true }],
    versions: [{ id: "v1", label: "已确认版本" }],
  },
  {
    id: "agent-product-c",
    name: "多分区收纳用品 C",
    sku: "XM-DEMO-SN-C03",
    variant: "深灰 · 三分区",
    category: "通用",
    scope: "team",
    status: "confirmed",
    teamReviewStatus: "approved",
    ownerId: "demo-member",
    source: "团队商品库",
    factSummary: "深灰色三分区结构，双拉链和分区关系已确认；当前补充资料存在颜色与结构冲突。",
    facts: ["深灰主色", "三分区结构", "双拉链"],
    taskGaps: [],
    taskConflicts: ["商品快照为深灰色，但补充资料标注为米白色", "商品快照为三分区结构，但补充资料标注为双分区"],
    images: [{ id: "agent-product-c-main", src: "/assets/layout-square-3.jpg", name: "商品确认图" }],
    candidates: [{ id: "agent-product-c-confirmed", src: "/assets/layout-square-3.jpg", status: "success", selected: true }],
    versions: [{ id: "v3", label: "已确认版本" }],
  },
]

export const evidenceRoleOptions = ["商品实拍", "商品结构或细节", "目标场景图", "风格参考图", "其他参考资料"]

export const buyerShowAgentModels = [
  { id: "auto", name: "智能匹配 · 质量优先", desc: "按资料、比例和清晰度自动选择主要生成模型" },
  { id: "gpt-image", name: "GPT Image 2", desc: "细节还原强，适合高质量生成与局部修改", eta: "140s", icon: "/assets/gpt.svg", maxInputs: 8, ratios: ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"], resolutions: ["1K", "2K", "4K"], qualityScore: 98 },
  { id: "banana-2", name: "Nano Banana 2", desc: "多参考图生成，适合复杂主体与长文本画面", eta: "75s", icon: "/assets/gemini.png", maxInputs: 8, ratios: ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"], resolutions: ["1K", "2K"], qualityScore: 94 },
  { id: "banana-pro", name: "Nano Banana Pro", desc: "复杂主体一致性较好，适合多图参考", eta: "79s", icon: "/assets/gemini.png", maxInputs: 6, ratios: ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"], resolutions: ["1K", "2K", "4K"], qualityScore: 92 },
  { id: "wan", name: "Wan 2.7 Image Pro", desc: "中文指令稳定，适合商品、场景与主体编辑", eta: "61s", icon: "/assets/wan.png", maxInputs: 4, ratios: ["智能比例", "1:1", "3:2", "2:3", "16:9", "4:3", "3:4", "9:16"], resolutions: ["1K", "2K"], qualityScore: 88 },
]

export const agentStageDefinitions = [
  "正在理解商品",
  "正在分析创作需求",
  "正在生成图片",
  "正在检查图片质量",
  "正在修复图片问题",
]

export const agentResultSources = [
  "/assets/layout-vertical-1.png",
  "/assets/layout-vertical-2.png",
  "/assets/layout-vertical-4.jpg",
  "/assets/buyer.webp",
  "/assets/expert.webp",
  "/assets/prompt.webp",
  "/assets/repaint.webp",
]

export const feedbackTypes = [
  "商品不一致",
  "结构错误",
  "比例错误",
  "颜色错误",
  "材质错误",
  "遮挡或接触关系错误",
  "人物或场景问题",
  "其他",
]

export const localEditDirections = [
  { key: "product", title: "修正商品细节", desc: "保持人物和场景，修正商品结构、颜色或材质" },
  { key: "relation", title: "调整接触关系", desc: "校准人物动作、遮挡和商品接触关系" },
  { key: "scene", title: "优化人物与场景", desc: "保持商品不变，调整人物状态、光线或背景" },
  { key: "natural", title: "提升真实感", desc: "减少生成痕迹，让画面更像真实买家拍摄" },
]

export const defaultBuyerShowAgentDraft = {
  product: null,
  evidence: [],
  prompt: "",
  count: 4,
  ratio: "3:4",
  resolution: "2K",
  quality: "高画质",
  modelId: "auto",
}

function seedStages(activeIndex, activeStatus = "处理中") {
  return agentStageDefinitions.map((label, index) => ({
    id: `stage-${index + 1}`,
    label,
    status: index < activeIndex ? "完成" : index === activeIndex ? activeStatus : "等待",
  }))
}

function seedResult(id, sequence, src, overrides = {}) {
  const version = { id: `${id}-v1`, label: "V1", src, source: "初始生成", createdAt: "今天 14:20" }
  return {
    id,
    sequence,
    currentVersionId: version.id,
    versions: [version],
    technicalStatus: "生成完成",
    qaStatus: "通过",
    userStatus: "待确认",
    summary: "商品主体与确认资料一致，人物和场景关系自然。",
    ...overrides,
  }
}

export const buyerShowAgentSeedTasks = [
  {
    id: "agent-seed-complete",
    title: "复古开衫 · 4 张买家秀",
    createdAt: "今天 14:20",
    status: "待用户确认",
    phase: "awaiting_confirmation",
    progress: 100,
    draft: { ...defaultBuyerShowAgentDraft, product: buyerShowAgentProducts[0], prompt: "咖啡店休闲穿搭场景，人物自然展示开衫，保持提花、领口和纽扣结构清晰。" },
    productSnapshot: { id: "agent-product-a", versionId: "v2", facts: buyerShowAgentProducts[0].facts },
    evidenceAnalysis: [],
    learningResult: { status: "completed", summary: "已基于确认商品快照完成当前任务学习" },
    gaps: buyerShowAgentProducts[0].taskGaps,
    conflicts: [],
    gapOverrideConfirmed: true,
    creationBranch: "自由场景生成",
    methodPlan: ["商品一致性约束", "人物接触关系检查", "失败项定向修复"],
    modelPlan: { requestedModelId: "auto", actualModel: buyerShowAgentModels[1], tools: ["商品学习", "图片生成", "质量检查", "局部修复"] },
    stages: seedStages(5),
    results: [
      seedResult("seed-1", 1, agentResultSources[0], { userStatus: "认可" }),
      seedResult("seed-2", 2, agentResultSources[1], { versions: [
        { id: "seed-2-v1", label: "V1", src: agentResultSources[1], source: "初始生成", createdAt: "今天 14:20" },
        { id: "seed-2-v2", label: "V2", src: agentResultSources[4], source: "Agent 自动修复", createdAt: "今天 14:22" },
      ], currentVersionId: "seed-2-v2", userStatus: "待调整" }),
      seedResult("seed-3", 3, agentResultSources[2]),
      seedResult("seed-4", 4, agentResultSources[3], { technicalStatus: "生成失败", qaStatus: "无法判断", summary: "本次未获得完整图片。", error: "生成过程提前结束，可单张重新生成。" }),
    ],
    adopted: null,
    adoptedVersions: {},
    reviews: [],
    reviewSettings: { count: 5, sellingPoints: "提花纹样清晰、穿着自然、日常搭配方便" },
    generationRecords: [{ model: "GPT Image 2", version: "demo-v2", result: "3 张完成，1 张失败", createdAt: "今天 14:20" }],
    qaRecords: [{ conclusion: "2 张通过，1 张自动修复后通过，1 张无法判断", createdAt: "今天 14:21" }],
    repairRecords: [{ resultId: "seed-2", method: "局部结构修复", conclusion: "V2 通过", createdAt: "今天 14:22" }],
    feedback: [],
    timeline: [{ id: "seed-created", type: "任务", title: "任务完成", detail: "已保留生成、质检和修复记录。", createdAt: "今天 14:22" }],
  },
]
