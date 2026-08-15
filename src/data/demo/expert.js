// Presentation fixtures for the expert image workbench prototype.
// Production tasks, results, and history will come from the generation service.

import {
  buyerShowPersonalAssets,
  buyerShowPublicAssets,
  buyerShowTeamAssets,
  suitePersonalAssets,
  suitePublicAssets,
  suiteTeamAssets,
} from "@/data/demo/asset-picker"

export const expertPersonalAssets = [...buyerShowPersonalAssets, ...suitePersonalAssets]
export const expertTeamAssets = [...buyerShowTeamAssets, ...suiteTeamAssets]
export const expertPublicAssets = [...buyerShowPublicAssets, ...suitePublicAssets]

export const expertModels = [
  { name: "Nano Banana 2 QH", icon: "/assets/gemini.png", desc: "精品线路，支持 4K 与多参考图编辑", eta: "108s" },
  { name: "Nano Banana 2", icon: "/assets/gemini.png", desc: "多参考图生成，适合复杂主体与长文本画面", eta: "136s" },
  { name: "Seedream 5.0 Pro", icon: "/assets/seedream.svg", desc: "生成速度快，适合批量创意与商业出图", eta: "188s" },
  { name: "GPT Image 2 QH", icon: "/assets/gpt.svg", desc: "精品线路，支持图片生成与多图编辑", eta: "107s" },
  { name: "Nano Banana Pro QH", icon: "/assets/gemini.png", desc: "精品线路，支持 4K 与多参考图编辑", eta: "67s" },
]

export const expertDefaultPrompts = {
  reference: "基于上传参考图进行专业组合编辑，优先保留主体身份、商品结构、关键版式、构图锚点和重要细节；再按需求调整场景、材质、光线、风格或局部内容。输出需要商业级干净质感，边缘自然，关系合理，不新增无关文字、水印或明显 AI 痕迹。",
  text: "生成一张专业商业视觉图像。请明确主体、使用场景、构图视角、材质细节、光线氛围、色彩风格和画面用途，输出需要干净高级、细节可信、适合电商海报或广告投放。",
}

export const expertResultImages = [
  "/assets/layout-square-1.png",
  "/assets/layout-square-2.png",
  "/assets/layout-square-3.jpg",
  "/assets/layout-square-4.jpg",
  "/assets/layout-square-5.jpg",
  "/assets/layout-square-6.jpg",
  "/assets/layout-horizontal-1.png",
  "/assets/layout-vertical-1.png",
  "/assets/layout-horizontal-2.png",
]

export const expertHistory = [
  { id: "2dcb7624", prompt: expertDefaultPrompts.reference, count: 1, time: "今天 16:20", image: "/assets/layout-square-1.png" },
  { id: "8269835b", prompt: "保持原图构图和商品位置，仅替换主标题文字。", count: 2, time: "今天 15:42", image: "/assets/layout-square-2.png" },
  { id: "0b003665", prompt: `${expertDefaultPrompts.text} 主题为东方武侠动作游戏。`, count: 1, time: "今天 14:36", image: "/assets/layout-horizontal-1.png" },
  { id: "b4b9ba9a", prompt: "生成干净的电商白底商品主图，保持商品结构和颜色准确。", count: 1, time: "今天 13:18", image: "/assets/layout-square-3.jpg" },
  { id: "132a9a73", prompt: "生成一张户外探险主题商业海报，保留产品主体细节。", count: 1, time: "昨天 18:08", image: "/assets/layout-vertical-1.png" },
  { id: "f10688a1", prompt: "去掉背景，保留商品边缘和原始材质。", count: 1, time: "昨天 16:34", image: "/assets/layout-square-4.jpg" },
  { id: "a843fabd", prompt: "去除背景并生成自然落地阴影。", count: 1, time: "昨天 15:12", image: "/assets/layout-square-5.jpg" },
  { id: "ef967806", prompt: "转换成简单线稿，保留外观轮廓即可。", count: 2, time: "08-13 17:55", image: "/assets/layout-horizontal-2.png" },
  { id: "2897b1c4", prompt: "将图二产品替换到图一，其他内容保持不变。", count: 1, time: "08-13 15:27", image: "/assets/layout-square-6.jpg" },
  { id: "8587ad95", prompt: "保持版式，仅优化画面中的英文标题。", count: 2, time: "08-12 11:20", image: "/assets/layout-vertical-2.png" },
  { id: "69a614ce", prompt: "延展背景到 1:1，主体比例和位置不变。", count: 1, time: "08-11 16:05", image: "/assets/layout-horizontal-3.png" },
  { id: "38c279d1", prompt: "加强产品材质细节，背景保持简洁。", count: 1, time: "08-11 10:42", image: "/assets/layout-square-2.png" },
]
