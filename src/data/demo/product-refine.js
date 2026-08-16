// Presentation fixtures for the product refinement workbench prototype.
// Production tasks, results, and history will come from the generation service.

import {
  buyerShowPersonalAssets,
  buyerShowPublicAssets,
  buyerShowTeamAssets,
  suitePersonalAssets,
  suitePublicAssets,
  suiteTeamAssets,
} from "@/data/demo/asset-picker"
import { expertModels } from "@/data/demo/expert"

export const productRefinePersonalAssets = [...buyerShowPersonalAssets, ...suitePersonalAssets]
export const productRefineTeamAssets = [...buyerShowTeamAssets, ...suiteTeamAssets]
export const productRefinePublicAssets = [...buyerShowPublicAssets, ...suitePublicAssets]
export const productRefineModels = expertModels

export const productRefineDefaultPrompt = "对单张产品图做轻量商业精修，优化材质质感、边缘干净度、反光、高光、阴影和细节清晰度。保持产品形状、结构、比例、颜色、品牌信息、文字、构图和背景关系不变，不新增无关元素。"

export const productRefineResultImages = [
  "/assets/layout-square-4.jpg",
  "/assets/layout-square-6.jpg",
  "/assets/layout-square-1.png",
  "/assets/layout-square-2.png",
  "/assets/layout-square-3.jpg",
  "/assets/layout-square-5.jpg",
  "/assets/layout-vertical-3.png",
  "/assets/layout-horizontal-3.png",
  "/assets/layout-horizontal-5.jpg",
]

export const productRefineHistory = [
  { id: "PR-815-1642", prompt: productRefineDefaultPrompt, count: 1, time: "今天 16:42", image: "/assets/layout-square-4.jpg" },
  { id: "PR-815-1336", prompt: "优化产品表面材质和边缘细节，保持结构、颜色、文字与背景不变。", count: 2, time: "今天 13:36", image: "/assets/layout-square-6.jpg" },
  { id: "PR-815-1018", prompt: "仅处理已圈选区域，去除局部褶皱和瑕疵，未选区域保持原样。", count: 1, time: "今天 10:18", image: "/assets/layout-square-1.png" },
  { id: "PR-814-1750", prompt: "增强金属部件的真实反光和边缘清晰度，不改变商品比例。", count: 1, time: "昨天 17:50", image: "/assets/layout-square-2.png" },
  { id: "PR-814-1124", prompt: "提升面料纹理和缝线细节，保留品牌标识与原始色彩。", count: 2, time: "昨天 11:24", image: "/assets/layout-square-3.jpg" },
  { id: "PR-813-1605", prompt: "清理商品边缘杂色并优化落地阴影，背景和构图保持不变。", count: 1, time: "08-13 16:05", image: "/assets/layout-square-5.jpg" },
]
