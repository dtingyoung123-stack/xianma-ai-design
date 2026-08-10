import PageShell from "@/components/PageShell"
import PromptsClient from "@/app/prompts/PromptsClient"

export default function PromptsPage() {
  return (
    <PageShell pathname="/prompts" description="查找、使用并沉淀经过验证的电商提示词">
      <PromptsClient />
    </PageShell>
  )
}
