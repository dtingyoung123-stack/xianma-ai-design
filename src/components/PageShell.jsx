import PageHeader from "@/components/PageHeader"
import { getRouteBreadcrumbs, routeMeta } from "@/config/navigation"

const statusLabels = {
  ready: "可用",
  prototype: "原型中",
  planned: "规划中",
}

export default function PageShell({ pathname, description, actions, children }) {
  const meta = routeMeta[pathname]
  const title = meta?.label || "页面"

  return (
    <div className="w-full">
      <PageHeader crumbs={getRouteBreadcrumbs(pathname)} status={statusLabels[meta?.status]} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--text-title)" }}>{title}</h1>
          {description && <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
