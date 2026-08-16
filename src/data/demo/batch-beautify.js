// Presentation fixtures for the batch beautification workbench prototype.
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

export const batchBeautifyPersonalAssets = [...buyerShowPersonalAssets, ...suitePersonalAssets]
export const batchBeautifyTeamAssets = [...buyerShowTeamAssets, ...suiteTeamAssets]
export const batchBeautifyPublicAssets = [...buyerShowPublicAssets, ...suitePublicAssets]
export const batchBeautifyModels = expertModels

export const batchBeautifyPresets = [
  {
    id: "natural",
    name: "自然",
    description: "保留皮肤纹理，轻微优化",
    prompt: "对人像进行自然美颜，轻微优化肤色、暗沉和小瑕疵，保留真实皮肤纹理。保持五官结构、脸型、发型、服装、背景和人物真实感不变，避免过度磨皮、塑料感和明显 AI 痕迹。",
  },
  {
    id: "standard",
    name: "标准",
    description: "均衡美颜和真实感",
    prompt: "对人像进行自然美颜和统一精修，优化肤色、肤质、暗沉、轻微瑕疵和整体清爽度。保持五官结构、脸型、发型、服装、背景和人物真实感不变，避免过度磨皮、塑料感和明显 AI 痕迹。",
  },
  {
    id: "refined",
    name: "精修",
    description: "强化五官与肤质细节",
    prompt: "对人像进行精细美颜，统一优化肤色、肤质、五官细节和整体清晰度，同时保留必要的皮肤纹理。保持人物身份、脸型、发型、服装、背景和构图不变，避免失真、过度磨皮和明显 AI 痕迹。",
  },
]

export const batchBeautifyResultImages = [
  "/assets/layout-vertical-3.png",
  "/assets/layout-vertical-5.jpg",
  "/assets/layout-square-4.jpg",
  "/assets/layout-square-6.jpg",
  "/assets/layout-vertical-1.png",
  "/assets/layout-square-1.png",
  "/assets/layout-square-2.png",
  "/assets/layout-square-3.jpg",
  "/assets/layout-square-5.jpg",
]

export const batchBeautifyHistory = [
  { id: "BB-816-1618", prompt: batchBeautifyPresets[1].prompt, count: 12, time: "今天 16:18", image: "/assets/layout-vertical-3.png" },
  { id: "BB-816-1350", prompt: batchBeautifyPresets[0].prompt, count: 8, time: "今天 13:50", image: "/assets/layout-vertical-5.jpg" },
  { id: "BB-816-1016", prompt: batchBeautifyPresets[2].prompt, count: 16, time: "今天 10:16", image: "/assets/layout-square-4.jpg" },
  { id: "BB-815-1742", prompt: "统一人物肤色和画面清爽度，保留妆容与面部特征。", count: 9, time: "昨天 17:42", image: "/assets/layout-square-6.jpg" },
  { id: "BB-815-1128", prompt: "轻微去除暗沉与面部瑕疵，保持真实皮肤纹理。", count: 6, time: "昨天 11:28", image: "/assets/layout-vertical-1.png" },
  { id: "BB-814-1536", prompt: "统一精修人物状态，不改变服装、背景与构图。", count: 10, time: "08-14 15:36", image: "/assets/layout-square-1.png" },
]
