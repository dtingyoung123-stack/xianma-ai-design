import { notFound } from "next/navigation"
import PageShell from "@/components/PageShell"
import PlaceholderState from "@/components/PlaceholderState"
import { capabilityNames } from "@/config/navigation"
import SuitePage from "../SuitePage"
import BuyerShowPage from "../BuyerShowPage"

export default async function CapabilityPage({ params }) {
  const { capability } = await params
  const name = capabilityNames[capability]
  if (!name) notFound()

  if (capability === "product-suite") return <SuitePage />
  if (capability === "buyer-show") return <BuyerShowPage />

  return (
    <PageShell pathname={`/ai-hub/${capability}`}>
      <PlaceholderState description={`${name}的交互流程、参数和结果展示正在建设中`} />
    </PageShell>
  )
}
