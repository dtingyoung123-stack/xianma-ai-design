// Presentation fixtures for the subject replacement workbench prototype.
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

export const subjectReplacePersonalAssets = [...buyerShowPersonalAssets, ...suitePersonalAssets]
export const subjectReplaceTeamAssets = [...buyerShowTeamAssets, ...suiteTeamAssets]
export const subjectReplacePublicAssets = [...buyerShowPublicAssets, ...suitePublicAssets]
export const subjectReplaceModels = expertModels

export const subjectReplaceDefaultPrompt = "保留图一的场景、人物动作、构图、光影和透视关系，将图二及后续参考图中的主体自然替换到图一。确保主体比例、遮挡、边缘和落地阴影真实，保留参考主体的结构、颜色和关键细节，不新增无关文字或元素。"

export const subjectReplaceResultImages = [
  "/assets/layout-horizontal-3.png",
  "/assets/layout-horizontal-5.jpg",
  "/assets/layout-square-4.jpg",
  "/assets/layout-square-6.jpg",
  "/assets/layout-vertical-3.png",
  "/assets/layout-vertical-5.jpg",
  "/assets/layout-square-1.png",
  "/assets/layout-square-2.png",
  "/assets/layout-horizontal-1.png",
]

export const subjectReplaceHistory = [
  { id: "SR-815-1628", prompt: subjectReplaceDefaultPrompt, count: 2, time: "今天 16:28", image: "/assets/layout-horizontal-3.png" },
  { id: "SR-815-1406", prompt: "保持人物动作与场景不变，将手持产品替换为参考图商品，尺寸和握持关系自然。", count: 1, time: "今天 14:06", image: "/assets/layout-vertical-3.png" },
  { id: "SR-815-1052", prompt: "将图二模特替换到图一场景，保留服饰特征并匹配原图光线方向。", count: 2, time: "今天 10:52", image: "/assets/layout-vertical-5.jpg" },
  { id: "SR-814-1735", prompt: "将参考地毯替换到客厅原图，保留家具遮挡和地面透视。", count: 1, time: "昨天 17:35", image: "/assets/layout-horizontal-5.jpg" },
  { id: "SR-814-1120", prompt: "替换画面中的护具主体，保持人物姿势、佩戴位置和产品结构准确。", count: 1, time: "昨天 11:20", image: "/assets/layout-square-4.jpg" },
  { id: "SR-813-1542", prompt: "将宠物用品替换为参考商品，保留宠物动作并自然处理接触阴影。", count: 2, time: "08-13 15:42", image: "/assets/layout-square-6.jpg" },
]
