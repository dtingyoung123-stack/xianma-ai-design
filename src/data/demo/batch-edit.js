// Presentation fixtures for the batch editing workbench prototype.
// Production tasks, results, and history will come from the generation service.

import {
  buyerShowPersonalAssets,
  buyerShowPublicAssets,
  buyerShowTeamAssets,
  suitePersonalAssets,
  suitePublicAssets,
  suiteTeamAssets,
} from "@/data/demo/asset-picker"

export const batchEditPersonalAssets = [...buyerShowPersonalAssets, ...suitePersonalAssets]
export const batchEditTeamAssets = [...buyerShowTeamAssets, ...suiteTeamAssets]
export const batchEditPublicAssets = [...buyerShowPublicAssets, ...suitePublicAssets]

export const batchEditModels = [
  { name: "Nano Banana 2", icon: "/assets/gemini.png", desc: "多参考图生成，适合复杂主体与长文本画面", eta: "61s" },
  { name: "Seedream 5.0 Pro", icon: "/assets/seedream.svg", desc: "生成速度快，适合批量创意与商业出图", eta: "85s" },
  { name: "Nano Banana 2 QH", icon: "/assets/gemini.png", desc: "精品线路，支持 4K 与多参考图编辑", eta: "179s" },
]

export const batchEditDefaultPrompt = "上传多张图片，用同一提示词逐张完成统一修改。请保持每张图的主体身份、商品结构、构图关系和关键文字信息稳定，只按提示词描述调整画面。"

export const batchEditResultImages = [
  "/assets/layout-square-1.png",
  "/assets/layout-horizontal-1.png",
  "/assets/layout-vertical-1.png",
  "/assets/layout-square-3.jpg",
  "/assets/layout-horizontal-2.png",
  "/assets/layout-vertical-3.png",
  "/assets/layout-square-5.jpg",
  "/assets/layout-horizontal-3.png",
  "/assets/layout-vertical-5.jpg",
]

export const batchEditHistory = [
  { id: "BE-902-1642", prompt: "统一替换为干净的浅灰摄影棚背景，保留商品结构、颜色和文字信息。", count: 6, time: "今天 16:42", image: "/assets/layout-square-1.png", model: "Nano Banana 2", resolution: "1K", ratio: "1:1" },
  { id: "BE-902-1426", prompt: "保持原构图与主体比例不变，将整批图片调整为柔和自然光和统一暖色调。", count: 8, time: "今天 14:26", image: "/assets/layout-horizontal-1.png", model: "Seedream 5.0 Pro", resolution: "2K", ratio: "3:2" },
  { id: "BE-902-1058", prompt: "统一清理画面杂物，保留人物、产品和关键文字，提升整体清晰度。", count: 4, time: "今天 10:58", image: "/assets/layout-vertical-1.png", model: "Nano Banana 2 QH", resolution: "2K", ratio: "智能比例" },
  { id: "BE-901-1712", prompt: "将图片统一改为适合电商详情页的简洁风格，保持商品材质和细节可信。", count: 10, time: "昨天 17:12", image: "/assets/layout-square-3.jpg", model: "Nano Banana 2", resolution: "1K", ratio: "1:1" },
]

export const batchEditDirections = [
  { key: "detail", title: "修正局部细节", desc: "改善边缘、材质和结构细节" },
  { key: "layout", title: "校准构图", desc: "保持主体关系，微调位置与比例" },
  { key: "light", title: "统一光影", desc: "让局部明暗和色温更自然" },
  { key: "clean", title: "清理画面", desc: "移除不需要的杂物和生成痕迹" },
]
