// Temporary presentation data. Replace this module with API-backed data when the platform backend is ready.
export const quickCards = [
  { key: "prompt", title: "AI 提示词", desc: "从一句需求开始打磨可执行提示词", badge: "Prompt", href: "/ai-hub/prompt", img: "/assets/prompt.webp" },
  { key: "buyer", title: "AI 买家秀", desc: "围绕商品生成更自然的买家秀内容", badge: "Buyer", href: "/ai-hub/buyer-show", img: "/assets/buyer.webp" },
  { key: "expert", title: "专家模式", desc: "直接进入组合编辑和参考位工作流", badge: "Expert", href: "/image-tools/expert", img: "/assets/expert.webp" },
  { key: "repaint", title: "AI 局部重绘", desc: "局部重绘、换色与画面修复", badge: "Edit", href: "/ai-hub/region-repaint", img: "/assets/repaint.webp" },
]

export const models = [
  { name: "Wan 2.7 Image Pro", source: "wan", time: "218s", desc: "聚合图像生成与编辑模型", type: "图像编辑", img: "/assets/wan.png" },
  { name: "Gemini 3 Pro Image Preview", source: "gemini", time: "79s", desc: "Gemini 图像生成通道", type: "图像生成", img: "/assets/gemini.png" },
  { name: "Nano Banana 2", source: "gemini", time: "85s", desc: "Gemini 图像生成通道", type: "图像生成", img: "/assets/gemini.png" },
  { name: "Doubao Seedream 5.0", source: "doubao", time: "40s", desc: "Seedream 图像生成通道", type: "图像生成", img: "/assets/doubao.png" },
  { name: "GPT Image 2", source: "openai", time: "236s", desc: "OpenAI 图像编辑通道", type: "图像编辑", img: "/assets/gpt.svg" },
]

export const recentItems = [
  { title: "夏季T恤模特图生成", time: "2 分钟前", status: "已完成", type: "专家模式" },
  { title: "新品连衣裙买家秀", time: "15 分钟前", status: "已完成", type: "AI 买家秀" },
  { title: "运动鞋白底图优化", time: "1 小时前", status: "已完成", type: "产品微调" },
  { title: "防晒衣多角度生成", time: "2 小时前", status: "处理中", type: "AI 多角度" },
]
