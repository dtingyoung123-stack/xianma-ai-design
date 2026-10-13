import "@xyflow/react/dist/style.css"

import PageShell from "@/components/PageShell"
import FlowProbe from "./FlowProbe"

export default function CanvasEngineCheckPage() {
  return (
    <PageShell pathname="/ai-canvas/engine-check">
      <FlowProbe />
    </PageShell>
  )
}
