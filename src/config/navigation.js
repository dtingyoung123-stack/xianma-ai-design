import {
  ChartNoAxesCombined,
  Image,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

// Navigation is the single source of truth for labels, routes, and hierarchy.
export const topNavItems = [
  { key: "home", label: "工作台", href: "/home", match: (pathname) => pathname === "/home" },
  { key: "tools", label: "工具中心", href: "/image-tools", match: (pathname) => pathname.startsWith("/image-tools") },
  { key: "capability", label: "能力中心", href: "/ai-hub", match: (pathname) => pathname.startsWith("/ai-hub") },
  { key: "canvas", label: "无限画布", href: "/ai-canvas", match: (pathname) => pathname.startsWith("/ai-canvas") },
  { key: "materials", label: "素材库", href: "/materials", match: (pathname) => pathname.startsWith("/materials") },
  { key: "history", label: "历史记录", href: "/history", match: (pathname) => pathname.startsWith("/history") },
  { key: "help", label: "帮助文档", href: "/help-docs", match: (pathname) => pathname.startsWith("/help-docs") },
]

export const navGroups = [
  {
    key: "image-tools",
    label: "生图工具",
    icon: Image,
    children: [
      { key: "expert", label: "专家模式", href: "/image-tools/expert" },
      { key: "text-edit", label: "一键改字", href: "/image-tools/text-edit" },
      { key: "subject-replace", label: "主体替换", href: "/image-tools/subject-replace" },
      { key: "product-refine", label: "产品微调", href: "/image-tools/product-refine" },
      { key: "batch-beautify", label: "批量美颜", href: "/image-tools/batch-beautify" },
      { key: "batch-edit", label: "批量改图", href: "/image-tools/batch-edit" },
    ],
  },
  {
    key: "ai-hub",
    label: "AI 能力中心",
    icon: Sparkles,
    children: [
      { key: "multi-angle", label: "AI 多角度", href: "/ai-hub/multi-angle" },
      { key: "region-repaint", label: "AI 区域重绘", href: "/ai-hub/region-repaint" },
      { key: "prompt", label: "AI 提示词", href: "/ai-hub/prompt" },
      { key: "buyer-show", label: "AI 买家秀", href: "/ai-hub/buyer-show" },
      { key: "video-stream", label: "AI 视频流", href: "/ai-hub/video-stream" },
      { key: "product-suite", label: "AI 商品套图", href: "/ai-hub/product-suite", badge: "NEW" },
    ],
  },
]

export const adminItems = [
  { key: "admin-data", label: "数据智能", icon: ChartNoAxesCombined, href: "/admin/data" },
  { key: "admin-permission", label: "权限管理", icon: ShieldCheck, href: "/admin/permission" },
  { key: "admin-settings", label: "系统设置", icon: Settings, href: "/admin/settings" },
]

export const routeMeta = {
  "/home": { label: "工作台", section: "工作台", status: "ready" },
  "/image-tools/expert": { label: "专家模式", section: "生图工具", status: "prototype" },
  "/image-tools/text-edit": { label: "一键改字", section: "生图工具", status: "prototype" },
  "/image-tools/subject-replace": { label: "主体替换", section: "生图工具", status: "prototype" },
  "/image-tools/product-refine": { label: "产品微调", section: "生图工具", status: "prototype" },
  "/image-tools/batch-beautify": { label: "批量美颜", section: "生图工具", status: "prototype" },
  "/image-tools/batch-edit": { label: "批量改图", section: "生图工具", status: "prototype" },
  "/ai-hub": { label: "AI 能力中心", section: "AI 能力中心", status: "prototype" },
  "/ai-hub/multi-angle": { label: "AI 多角度", section: "AI 能力中心", status: "prototype" },
  "/ai-hub/region-repaint": { label: "AI 区域重绘", section: "AI 能力中心", status: "prototype" },
  "/ai-hub/prompt": { label: "AI 提示词", section: "AI 能力中心", status: "prototype" },
  "/ai-hub/buyer-show": { label: "AI 买家秀", section: "AI 能力中心", status: "prototype" },
  "/ai-hub/video-stream": { label: "AI 视频流", section: "AI 能力中心", status: "prototype" },
  "/ai-hub/product-suite": { label: "AI 商品套图", section: "AI 能力中心", status: "prototype" },
  "/ai-canvas": { label: "无限画布", section: "自研工具", status: "prototype" },
  "/materials": { label: "素材管理", section: "素材库", status: "prototype" },
  "/history": { label: "历史记录", section: "历史记录", status: "prototype" },
  "/help-docs": { label: "帮助文档", section: "帮助文档", status: "prototype" },
  "/admin/data": { label: "数据智能", section: "管理", status: "prototype" },
  "/admin/permission": { label: "权限管理", section: "管理", status: "prototype" },
  "/admin/settings": { label: "系统设置", section: "管理", status: "prototype" },
}

export const capabilityNames = Object.fromEntries(
  navGroups[1].children.map(({ key, label }) => [key, label])
)

export function isHrefActive(href, pathname, queryString = "") {
  const [targetPath, targetQuery = ""] = href.split("?")
  if (targetPath !== pathname) return false
  const targetParams = new URLSearchParams(targetQuery)
  if (!targetParams.size) return true
  const currentParams = new URLSearchParams(queryString)
  return [...targetParams.entries()].every(([key, value]) => currentParams.get(key) === value)
}

export function getBreadcrumbs(labels = []) {
  return [{ label: "首页", href: "/home" }, ...labels.map((label) => ({ label }))]
}

export function getRouteBreadcrumbs(pathname) {
  const meta = routeMeta[pathname]
  if (!meta) return getBreadcrumbs([])
  if (meta.section === "工作台" || meta.section === meta.label) return getBreadcrumbs([meta.label])
  return getBreadcrumbs([meta.section, meta.label])
}
