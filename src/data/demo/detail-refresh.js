// Synthetic fixtures for the AI detail-refresh prototype.

import { initialProducts } from "./products.js"

export const detailRefreshImages = [
  { id: "detail-01", shot: "01", role: "首屏主视觉", name: "主视觉-原图.png", src: "/assets/layout-square-1.png", size: "1200 × 1200 px" },
  { id: "detail-02", shot: "02", role: "核心卖点说明", name: "卖点说明-原图.png", src: "/assets/layout-horizontal-2.png", size: "1464 × 600 px" },
  { id: "detail-03", shot: "03", role: "材质与结构细节", name: "材质细节-原图.png", src: "/assets/mat-7.png", size: "1200 × 1200 px" },
  { id: "detail-04", shot: "04", role: "使用场景展示", name: "使用场景-原图.png", src: "/assets/buyer.webp", size: "1200 × 1500 px" },
]

export const detailRefreshProducts = [
  {
    id: "refresh-product-a",
    name: "环抱式运动护具 A",
    category: "护具类",
    status: "confirmed",
    source: "商品智库",
    factSummary: "环抱式主体，深灰主体配浅灰边缘，主体 1 件、固定带 2 条。",
    images: [
      { id: "product-a-01", title: "商品完整外观", src: "/assets/buyer.webp", size: "116 KB" },
      { id: "product-a-02", title: "商品结构细节", src: "/assets/expert.webp", size: "48 KB" },
    ],
  },
  {
    id: "refresh-product-b",
    name: "可调节宠物用品 E",
    category: "宠物类",
    status: "confirmed",
    source: "商品智库",
    factSummary: "可调节结构，深色主体，已完成商品事实确认。",
    images: [{ id: "product-b-01", title: "商品参考图", src: "/assets/repaint.webp", size: "92 KB" }],
  },
]

const teamRejectedProduct = {
  ...detailRefreshProducts[0],
  id: "refresh-product-team-rejected",
  name: "环抱式运动护具 A（团队驳回）",
  source: "团队审核驳回",
  scope: "mine",
  teamReviewStatus: "rejected",
  teamRejectionReason: "请补充侧面结构图",
  ownerId: "demo-member",
  candidates: [{ id: "candidate-a", status: "success", selected: true, src: "/assets/layout-square-1.png" }],
  versions: [{ id: "v2", label: "已确认版本", note: "运营确认候选图", createdAt: "2026-09-03 10:20" }],
}

const publicRejectedProduct = {
  ...detailRefreshProducts[1],
  id: "refresh-product-public-rejected",
  name: "可调节宠物用品 E（公共驳回）",
  source: "公共审核驳回",
  scope: "team",
  teamReviewStatus: "approved",
  publicReviewStatus: "rejected",
  publicRejectionReason: "商品说明需补充",
  ownerId: "demo-member",
  candidates: [{ id: "candidate-a", status: "success", selected: true, src: "/assets/layout-square-2.png" }],
  versions: [{ id: "v2", label: "已确认版本", note: "团队确认候选图", createdAt: "2026-09-03 11:40" }],
}

// The picker uses the same product records and lifecycle fields as 商品智库.
export const detailRefreshProductLibrary = [
  ...initialProducts,
  ...detailRefreshProducts.map((product) => ({
    ...product,
    scope: "mine",
    ownerId: "demo-member",
    candidates: [{ id: `${product.id}-confirmed`, status: "success", selected: true, src: product.images?.[0]?.src }],
    versions: [{ id: `${product.id}-v1`, label: "已确认版本", note: "运营确认商品事实", createdAt: "2026-09-02 16:00" }],
  })),
  teamRejectedProduct,
  publicRejectedProduct,
]

export function hasValidDetailRefreshConfirmation(product) {
  return product?.status === "confirmed"
    && (product.candidates?.some((candidate) => candidate.status === "success" && candidate.selected)
      || product.versions?.some((version) => /确认/.test(version.label || "")))
}

export const detailRefreshReplacementAssets = [
  { id: "replacement-01", title: "商品侧面参考", src: "/assets/repaint.webp", size: "92 KB" },
  { id: "replacement-02", title: "商品材质特写", src: "/assets/mat-5.png", size: "42 KB" },
  { id: "replacement-03", title: "商品局部结构", src: "/assets/mat-2.png", size: "36 KB" },
]

export const detailRefreshResultPool = [
  "/assets/layout-square-4.jpg",
  "/assets/layout-horizontal-5.jpg",
  "/assets/layout-square-5.jpg",
  "/assets/layout-vertical-4.jpg",
]

export const detailRefreshDirections = [
  { key: "detail", title: "修正局部细节", desc: "改善边缘、材质和结构细节", defaultInstruction: "保持商品结构不变，修正局部材质和边缘细节。" },
  { key: "layout", title: "调整版式构图", desc: "保留详情角色，优化留白和信息层级", defaultInstruction: "保留当前详情页角色，优化留白和文字层级。" },
  { key: "scene", title: "调整人物场景", desc: "小幅改变人物、背景和环境关系", defaultInstruction: "保持商品事实不变，小幅调整人物动作与背景氛围。" },
  { key: "natural", title: "提升真实感", desc: "减少生成痕迹，保持商品可信", defaultInstruction: "减少生成痕迹，保持商品外观、比例和颜色真实。" },
]
