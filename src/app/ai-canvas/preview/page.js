import "@xyflow/react/dist/style.css"

import PageShell from "@/components/PageShell"
import CanvasEditor from "@/components/ai-canvas/CanvasEditor"
import { initialCanvasProjects } from "@/data/demo/ai-canvas-projects"

export default async function CanvasPreviewPage({ searchParams }) {
  const { project } = await searchParams
  const projectName = initialCanvasProjects.find((item) => item.id === project)?.name || "新项目画布"

  return (
    <PageShell pathname="/ai-canvas/preview">
      <CanvasEditor projectId={project} projectName={projectName} />
    </PageShell>
  )
}
