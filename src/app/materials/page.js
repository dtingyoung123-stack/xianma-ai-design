import PageShell from "@/components/PageShell"
import MaterialsClient from "@/app/materials/MaterialsClient"
import { Download } from "lucide-react"

export default function MaterialsPage() {
  return (
    <PageShell pathname="/materials" description="集中管理个人、团体和全公司共享的内容素材" actions={
      <a href="/api/materials-prd" download className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-medium text-[var(--brand-on-primary)] transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--brand-primary-soft)] sm:w-auto">
        <Download size={16} />导出 PRD
      </a>
    }>
      <MaterialsClient />
    </PageShell>
  )
}
