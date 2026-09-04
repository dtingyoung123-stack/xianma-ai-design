// Presentation fixtures for the AI multi-angle workbench prototype.
// Production tasks, results, and history will come from the generation service.

import {
  buyerShowPersonalAssets,
  buyerShowPublicAssets,
  buyerShowTeamAssets,
  suitePersonalAssets,
  suitePublicAssets,
  suiteTeamAssets,
} from "@/data/demo/asset-picker"

export const multiAnglePersonalAssets = [...buyerShowPersonalAssets, ...suitePersonalAssets]
export const multiAngleTeamAssets = [...buyerShowTeamAssets, ...suiteTeamAssets]
export const multiAnglePublicAssets = [...buyerShowPublicAssets, ...suitePublicAssets]

export const multiAngleModels = [
  { name: "Nano Banana 2 QH", icon: "/assets/gemini.png", desc: "精品多角度线路，适合保持主体结构与关键标识", eta: "约 120s" },
  { name: "Nano Banana 2", icon: "/assets/gemini.png", desc: "通用多参考图生成，兼顾速度与主体一致性", eta: "约 75s" },
  { name: "GPT Image 2 QH", icon: "/assets/gpt.png", desc: "复杂结构推演与文字细节保持能力更强", eta: "约 100s" },
  { name: "Nano Banana Pro QH", icon: "/assets/gemini.png", desc: "高质量线路，适合精细商品与复杂材质", eta: "约 160s" },
]

export const multiAngleThinkingModes = ["自动", "快速", "深度"]
export const multiAngleQualityLevels = ["快速", "均衡", "高质量"]

export const multiAngleDefinitions = [
  { id: "front", label: "正面", instruction: "生成主体正面视角，保持主体居中，正面结构、比例、颜色和关键标识清晰可见。" },
  { id: "back", label: "背面", instruction: "生成主体背面视角，合理推测未展示的背面结构，延续颜色、材质、比例和设计语言。" },
  { id: "left", label: "左侧", instruction: "生成主体左侧视角，保持侧面结构、厚度、轮廓和连接关系可信。" },
  { id: "right", label: "右侧", instruction: "生成主体右侧视角，保持侧面结构、厚度、轮廓和连接关系可信。" },
  { id: "front-left", label: "左前45°", instruction: "生成主体左前方 45 度视角，同时展示正面和左侧的关键结构。" },
  { id: "front-right", label: "右前45°", instruction: "生成主体右前方 45 度视角，同时展示正面和右侧的关键结构。" },
  { id: "back-left", label: "左后45°", instruction: "生成主体左后方 45 度视角，合理补全背面与左侧结构。" },
  { id: "back-right", label: "右后45°", instruction: "生成主体右后方 45 度视角，合理补全背面与右侧结构。" },
]

export const multiAngleDefaultPrompt = "保持商品主体身份、结构比例、颜色、材质、文字、Logo 和装饰细节一致，使用干净的浅色摄影棚背景。"

export const multiAngleResultImages = [
  "/assets/layout-vertical-1.png",
  "/assets/layout-vertical-2.png",
  "/assets/layout-vertical-3.png",
  "/assets/layout-square-1.png",
  "/assets/layout-square-2.png",
  "/assets/layout-horizontal-1.png",
  "/assets/layout-horizontal-2.png",
  "/assets/layout-square-3.jpg",
]

function buildResults(angleIds, startIndex = 0, status = "completed") {
  return angleIds.map((angleId, index) => {
    const angle = multiAngleDefinitions.find((item) => item.id === angleId)
    return {
      id: `multi-angle-${angleId}-${startIndex}-${index}`,
      angleId,
      angle: angle?.label || angleId,
      name: `${angle?.label || angleId}视角结果`,
      instruction: angle?.instruction || "",
      src: status === "completed" ? multiAngleResultImages[(startIndex + index) % multiAngleResultImages.length] : "",
      status,
      feedback: "",
      requestId: `MA-R${String(startIndex + index + 1).padStart(3, "0")}`,
      error: status === "failed" ? "模型请求过于频繁，请稍后重试或切换模型。" : "",
    }
  })
}

export const multiAngleHistory = [
  {
    id: "MA-260902-1723",
    status: "completed",
    createdAt: "今天 17:23",
    completedAt: "今天 17:25",
    model: "GPT Image 2 QH",
    thinking: "自动",
    quality: "均衡",
    prompt: "保持包装颜色、Logo 和磨砂材质，背景干净统一。",
    sourceImage: { title: "护腰带主图", src: "/assets/buyer.webp", source: "个人素材" },
    results: buildResults(["front", "back"], 0),
  },
  {
    id: "MA-260902-1658",
    status: "failed",
    createdAt: "今天 16:58",
    completedAt: "今天 16:59",
    model: "Nano Banana Pro QH",
    thinking: "深度",
    quality: "高质量",
    prompt: "保持主体结构与颜色一致。",
    sourceImage: { title: "商品角度参考", src: "/assets/mat-4.png", source: "团体素材" },
    results: buildResults(["front", "back"], 2, "failed"),
  },
  {
    id: "MA-260902-1536",
    status: "cancelled",
    createdAt: "今天 15:36",
    completedAt: "今天 15:37",
    model: "Nano Banana 2",
    thinking: "快速",
    quality: "均衡",
    prompt: "未填写补充提示词",
    sourceImage: { title: "厨房收纳主图", src: "/assets/mat-1.png", source: "个人素材" },
    results: buildResults(["front", "back", "left", "right"], 3, "cancelled"),
  },
  {
    id: "MA-260902-1450",
    status: "completed",
    createdAt: "今天 14:50",
    completedAt: "今天 14:53",
    model: "Nano Banana 2 QH",
    thinking: "自动",
    quality: "均衡",
    prompt: "保持商品比例和白色背景，补全各方向结构。",
    sourceImage: { title: "质感细节参考", src: "/assets/mat-3.png", source: "个人素材" },
    results: buildResults(["front", "back", "left", "right"], 3),
  },
  {
    id: "MA-260901-2353",
    status: "completed",
    createdAt: "昨天 23:53",
    completedAt: "昨天 23:55",
    model: "Nano Banana 2",
    thinking: "自动",
    quality: "均衡",
    prompt: "保持主体设计语言，生成前后视角。",
    sourceImage: { title: "团队商品角度参考", src: "/assets/mat-4.png", source: "团体素材" },
    results: buildResults(["front", "back"], 6),
  },
  {
    id: "MA-260901-1906",
    status: "cancelled",
    createdAt: "昨天 19:06",
    completedAt: "昨天 19:07",
    model: "Nano Banana 2 QH",
    thinking: "自动",
    quality: "均衡",
    prompt: "保持结构一致并补齐四个基础角度。",
    sourceImage: { title: "家居场景参考", src: "/assets/mat-2.png", source: "个人素材" },
    results: buildResults(["front", "back", "left", "right"], 1, "cancelled"),
  },
]
