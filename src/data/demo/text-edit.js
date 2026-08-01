// Presentation-only data for the one-click text editing prototype.
// OCR results and generation tasks are presentation fixtures, not production data.

export const textEditDemoAsset = {
  id: "text-edit-demo-humidifier",
  title: "加湿器英文卖点图",
  name: "加湿器英文卖点图.png",
  filename: "加湿器英文卖点图.png",
  src: "/assets/layout-square-1.png",
  img: "/assets/layout-square-1.png",
  size: "512 x 512",
  source: "演示素材",
  category: "家居电器",
  tags: ["英文", "卖点图"],
  demoTextLayers: [
    { id: "text-1", sourceText: "LARGE CAPACITY", replacement: "LARGE TANK", x: 72.4, y: 27.3, width: 23.8, height: 6.4 },
    { id: "text-2", sourceText: "SMART CONTROL", replacement: "SMART DISPLAY", x: 72.1, y: 58.8, width: 24.9, height: 6.4 },
    { id: "text-3", sourceText: "COOL MIST", replacement: "FINE MIST", x: 76.1, y: 90.0, width: 18.9, height: 5.8 },
  ],
}

export const textEditPersonalAssets = [textEditDemoAsset]

export const textEditPublicAssets = [
  textEditDemoAsset,
  {
    id: "text-edit-demo-poster",
    title: "商品卖点排版示例",
    name: "商品卖点排版示例.png",
    filename: "商品卖点排版示例.png",
    src: "/assets/layout-square-2.png",
    img: "/assets/layout-square-2.png",
    size: "演示素材",
    source: "公共素材库",
    category: "商品海报",
    tags: ["卖点", "中文"],
  },
]

export const textEditModels = [
  { name: "GPT Image 2", icon: "/assets/gpt.svg", desc: "细节还原强，适合文字与局部修改" },
  { name: "Wan 2.7 Image Pro", icon: "/assets/wan.png", desc: "中文指令稳定，适合商品图编辑" },
  { name: "Nano Banana 2", icon: "/assets/gemini.png", desc: "多参考图生成，适合复杂画面" },
  { name: "Seedream 5.0", icon: "/assets/seedream.svg", desc: "生成速度快，适合批量创意" },
]

export const textEditHistory = [
  { id: "34f09c08", title: "包装卖点文字调整", summary: "LARGE CAPACITY -> LARGE TANK", time: "今天 15:42", status: "已完成", src: "/assets/layout-square-1.png" },
  { id: "1f8e72c9", title: "活动价格改字", summary: "100% -> 99", time: "今天 14:18", status: "已完成", src: "/assets/layout-square-2.png" },
]
