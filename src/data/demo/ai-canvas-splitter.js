export const canvasDemoAssets = [
  {
    id: "canvas-humidifier-main",
    title: "加湿器主图参考",
    src: "/assets/layout-square-1.png",
    category: "家居用品",
    tags: ["商品图"],
  },
  {
    id: "canvas-humidifier-scene",
    title: "加湿器场景参考",
    src: "/assets/layout-square-2.png",
    category: "家居用品",
    tags: ["场景图"],
  },
  {
    id: "canvas-humidifier-detail",
    title: "加湿器细节参考",
    src: "/assets/layout-horizontal-4.png",
    category: "家居用品",
    tags: ["细节图"],
  },
]

const projectGraphs = {
  p1: {
    nodes: [
      {
        id: "image-source",
        type: "image",
        position: { x: 100, y: 120 },
        data: { title: "商品参考图", src: canvasDemoAssets[0].src, assetId: canvasDemoAssets[0].id },
      },
      {
        id: "text-brief",
        type: "text",
        position: { x: 450, y: 120 },
        data: { title: "创作需求", textRole: "request", text: "为这款加湿器设计电商主图、卖点图和详情图，突出外观与家居场景，不添加未经确认的商品参数。" },
      },
    ],
    edges: [],
  },
  p2: {
    nodes: [
      {
        id: "image-source",
        type: "image",
        position: { x: 100, y: 120 },
        data: { title: "家居场景参考", src: canvasDemoAssets[1].src, assetId: canvasDemoAssets[1].id },
      },
      {
        id: "text-brief",
        type: "text",
        position: { x: 450, y: 120 },
        data: { title: "买家秀需求", textRole: "request", text: "生成自然家居场景中的买家秀与使用体验图，保持商品外观，不添加未经确认的功效描述。" },
      },
    ],
    edges: [],
  },
}

export function createCanvasDemoGraph(projectId) {
  const graph = projectGraphs[projectId] || { nodes: [], edges: [] }
  return {
    nodes: graph.nodes.map((node) => ({ ...node, position: { ...node.position }, data: { ...node.data } })),
    edges: graph.edges.map((edge) => ({ ...edge })),
  }
}
