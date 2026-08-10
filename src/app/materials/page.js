import PageShell from "@/components/PageShell"
import MaterialsClient from "@/app/materials/MaterialsClient"

export default function MaterialsPage() {
  return (
    <PageShell pathname="/materials" description="集中管理个人、团体和全公司共享的内容素材">
      <MaterialsClient />
    </PageShell>
  )
}
