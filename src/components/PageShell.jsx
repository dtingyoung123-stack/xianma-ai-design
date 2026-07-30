import PageHeader from "@/components/PageHeader"
import { getRouteBreadcrumbs, routeMeta } from "@/config/navigation"

const statusLabels = {
  ready: "可用",
  prototype: "原型中",
  planned: "规划中",
}

export default function PageShell({ pathname, description, children }) {
  const meta = routeMeta[pathname]
  const title = meta?.label || "页面"

  return (
    <div className="w-full">
      <PageHeader crumbs={getRouteBreadcrumbs(pathname)} status={statusLabels[meta?.status]} />
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold" style={{ color: "var(--text-title)" }}>{title}</h1>
        {description && <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}
