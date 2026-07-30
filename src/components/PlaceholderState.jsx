import { Construction } from "lucide-react"

export default function PlaceholderState({ description = "该功能正在设计与开发中" }) {
  return (
    <section
      className="min-h-[400px] border border-dashed rounded-xl flex flex-col items-center justify-center gap-3 p-6 text-center"
      style={{ borderColor: "var(--border-base)", background: "var(--bg-card)" }}
    >
      <Construction size={32} strokeWidth={1.5} style={{ color: "var(--text-disabled)" }} />
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-body)" }}>功能建设中</p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{description}</p>
      </div>
    </section>
  )
}
