// Presentation fixtures for the AI multi-angle workbench prototype.
// Production tasks, results, and history will come from the generation service.

import {
  buyerShowPersonalAssets,
  buyerShowPublicAssets,
  buyerShowTeamAssets,
  suitePersonalAssets,
  suitePublicAssets,
  suiteTeamAssets,
} from "./asset-picker.js"

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

export const MULTI_ANGLE_DEFAULT_VALUE = 45

export const multiAngleDefaultValues = {
  "front-left": MULTI_ANGLE_DEFAULT_VALUE,
  "front-right": MULTI_ANGLE_DEFAULT_VALUE,
  "back-left": MULTI_ANGLE_DEFAULT_VALUE,
  "back-right": MULTI_ANGLE_DEFAULT_VALUE,
}

export const multiAngleDefinitions = [
  { id: "front", label: "正面", anglePrompt: "front view", actualAzimuth: 0, instruction: "生成主体正面视角，保持主体居中，正面结构、比例、颜色和关键标识清晰可见。" },
  { id: "back", label: "背面", anglePrompt: "back view", actualAzimuth: 180, instruction: "生成主体背面视角，合理推测未展示的背面结构，延续颜色、材质、比例和设计语言。" },
  { id: "left", label: "左侧", anglePrompt: "left side view", actualAzimuth: 270, instruction: "生成主体左侧视角，保持侧面结构、厚度、轮廓和连接关系可信。" },
  { id: "right", label: "右侧", anglePrompt: "right side view", actualAzimuth: 90, instruction: "生成主体右侧视角，保持侧面结构、厚度、轮廓和连接关系可信。" },
  { id: "front-left", label: "左前 45°", direction: "左前", promptDirection: "left-front", editable: true },
  { id: "front-right", label: "右前 45°", direction: "右前", promptDirection: "right-front", editable: true },
  { id: "back-left", label: "左后 45°", direction: "左后", promptDirection: "left-back", editable: true },
  { id: "back-right", label: "右后 45°", direction: "右后", promptDirection: "right-back", editable: true },
]

export function createDefaultMultiAngleValues() {
  return { ...multiAngleDefaultValues }
}

export function clampMultiAngleValue(value, fallback = MULTI_ANGLE_DEFAULT_VALUE) {
  if (typeof value === "string" && value.trim() === "") return fallback
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return fallback
  return Math.min(90, Math.max(0, numericValue))
}

export function normalizeMultiAngleValue(value, fallback = MULTI_ANGLE_DEFAULT_VALUE) {
  return Math.round(clampMultiAngleValue(value, fallback) / 5) * 5
}

export function resolveMultiAngleDefinition(angleId, angleValues = multiAngleDefaultValues) {
  const definition = multiAngleDefinitions.find((item) => item.id === angleId)
  if (!definition) return null
  if (!definition.editable) return { ...definition, angleValue: null }

  const angleValue = normalizeMultiAngleValue(angleValues[angleId])
  const actualAzimuth = {
    "front-right": angleValue,
    "back-right": 180 - angleValue,
    "back-left": 180 + angleValue,
    "front-left": angleValue === 0 ? 0 : 360 - angleValue,
  }[angleId]

  return {
    ...definition,
    angleValue,
    actualAzimuth,
    label: `${definition.direction} ${angleValue}°`,
    anglePrompt: `${angleValue} degrees ${definition.promptDirection} view`,
    instruction: `生成主体${definition.direction}方 ${angleValue} 度视角，保持商品身份、结构比例、颜色、材质、文字、Logo 和包装细节一致。`,
  }
}

export function buildMultiAnglePrompt(anglePrompt, supplementalPrompt = "") {
  const promptParts = [
    `product photography, ${anglePrompt}, eye-level camera angle, medium shot, 50mm lens, even soft lighting, clean background`,
    "keep product identity, structure proportion, color, material, text, logo and packaging details consistent with the reference image",
  ]
  const supplement = supplementalPrompt.trim()
  if (supplement) promptParts.push(supplement)
  return promptParts.join(". ")
}

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
    const angle = resolveMultiAngleDefinition(angleId)
    return {
      id: `multi-angle-${angleId}-${startIndex}-${index}`,
      angleId,
      angle: angle?.label || angleId,
      name: `${angle?.label || angleId}视角结果`,
      instruction: angle?.instruction || "",
      angleValue: angle?.angleValue ?? null,
      actualAzimuth: angle?.actualAzimuth ?? null,
      anglePrompt: angle?.anglePrompt || "",
      fullPrompt: buildMultiAnglePrompt(angle?.anglePrompt || "front view"),
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
