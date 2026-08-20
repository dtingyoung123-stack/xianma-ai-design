import PageShell from "@/components/PageShell"
import CanvasProjectsClient from "@/app/ai-canvas/CanvasProjectsClient"

export default function CanvasPage() {
  return (
    <PageShell pathname="/ai-canvas" description="按项目组织多轮图片创作，并在单画布中持续编辑与复用结果">
      <CanvasProjectsClient />
    </PageShell>
  )
}
