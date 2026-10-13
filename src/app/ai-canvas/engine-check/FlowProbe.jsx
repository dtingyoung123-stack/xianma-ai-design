"use client"

import { useCallback, useRef } from "react"
import { Plus } from "lucide-react"
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"

const initialNodes = [
  { id: "source", type: "probe", position: { x: 80, y: 140 }, data: { label: "图片节点", kind: "输入" } },
  { id: "config", type: "probe", position: { x: 420, y: 140 }, data: { label: "生成配置", kind: "处理" } },
]
const initialEdges = [{ id: "source-config", source: "source", target: "config" }]

function ProbeNode({ data, selected }) {
  return (
    <div
      className="min-w-48 rounded-lg border px-4 py-3 shadow-[var(--shadow-card)]"
      style={{
        background: "var(--gray-900)",
        borderColor: selected ? "var(--brand-primary)" : "var(--gray-600)",
        color: "var(--brand-on-primary)",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <span className="block text-xs opacity-70">{data.kind}</span>
      <strong className="block text-sm">{data.label}</strong>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { probe: ProbeNode }

export default function FlowProbe() {
  const nextId = useRef(1)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const onConnect = useCallback((connection) => {
    setEdges((current) => addEdge(connection, current))
  }, [setEdges])

  function addNode() {
    const number = nextId.current++
    setNodes((current) => [
      ...current,
      {
        id: `result-${number}`,
        type: "probe",
        position: { x: 740, y: 100 + number * 110 },
        data: { label: `结果 ${number}`, kind: "输出" },
      },
    ])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[var(--text-secondary)]" aria-live="polite">
          节点 {nodes.length} · 连线 {edges.length}
        </div>
        <button
          type="button"
          onClick={addNode}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--brand-on-primary)] hover:bg-[var(--brand-primary-hover)] focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none"
        >
          <Plus size={16} />添加节点
        </button>
      </div>
      <div
        className="h-[min(70vh,700px)] min-h-[420px] overflow-hidden rounded-lg border border-[var(--border-base)] bg-[var(--gray-900)]"
        aria-label="画布引擎验证区域"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="var(--gray-700)" gap={20} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
