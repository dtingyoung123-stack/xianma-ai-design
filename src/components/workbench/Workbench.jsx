"use client"

import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function WorkbenchShell({
  crumbs = [],
  status = "原型验证中",
  title,
  description,
  actions,
  columns = "minmax(0, 3fr) minmax(0, 7fr)",
  children,
}) {
  return (
    <div className="xm-workbench -mx-6 -my-6 flex h-[calc(100%+48px)] min-h-0 flex-col px-6 py-5">
      <WorkbenchTopline crumbs={crumbs} status={status} title={title} description={description} actions={actions} />
      <div
        className="mt-3 grid flex-1 min-h-0 items-stretch gap-3.5"
        style={{ gridTemplateColumns: columns }}
      >
        {children}
      </div>
    </div>
  )
}

export function WorkbenchTopline({ crumbs = [], status, title, description, actions }) {
  return (
    <div className="xm-topline-card flex shrink-0 items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-[13px] font-extrabold">
          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-bold transition-colors hover:bg-[var(--brand-primary-soft)]"
            style={{ color: "var(--brand-primary)" }}
          >
            <ArrowLeft size={14} />
            返回
          </button>
          <nav className="flex min-w-0 items-center gap-2" aria-label="面包屑">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1
              return (
                <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
                  {index > 0 && <span style={{ color: "#cbd5e1" }}>/</span>}
                  <span
                    className={cn("truncate", isLast && "font-black")}
                    style={{ color: isLast ? "var(--text-title)" : "#64748b" }}
                  >
                    {crumb.label}
                  </span>
                </span>
              )
            })}
          </nav>
          {status && (
            <span
              className="ml-1 inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-bold"
              style={{ background: "var(--info-bg)", color: "var(--brand-primary)" }}
            >
              {status}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          {title && <h1 className="m-0 text-xl font-black leading-tight" style={{ color: "var(--text-title)" }}>{title}</h1>}
          {description && <p className="m-0 text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function WorkbenchPanel({ children, className = "" }) {
  return (
    <section className={cn("xm-panel flex min-h-0 flex-col overflow-hidden", className)}>
      {children}
    </section>
  )
}

export function WorkbenchPanelHead({ title, description, meta, children, className = "" }) {
  return (
    <div className={cn("flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3.5", className)} style={{ borderColor: "var(--border-light)" }}>
      <div className="min-w-0">
        {title && <h2 className="m-0 text-[15px] font-black" style={{ color: "var(--text-title)" }}>{title}</h2>}
        {description && <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{description}</p>}
      </div>
      {(meta || children) && <div className="flex shrink-0 items-center gap-2">{meta}{children}</div>}
    </div>
  )
}

export function WorkbenchScroll({ children, gap = 14, className = "" }) {
  return (
    <div
      className={cn("flex-1 min-h-0 overflow-y-auto p-4", className)}
      style={{ display: "grid", gap, alignContent: "start" }}
    >
      {children}
    </div>
  )
}

export function WorkbenchFooter({ children, className = "" }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center gap-3 border-t bg-white px-4 py-3", className)} style={{ borderColor: "var(--border-light)" }}>
      {children}
    </div>
  )
}

export function WorkbenchModule({ title, hint, action, children, className = "" }) {
  return (
    <div className={cn("xm-module", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <strong className="text-[15px] font-bold" style={{ color: "var(--text-title)" }}>{title}</strong>
        <div className="flex shrink-0 items-center gap-2">
          {hint && <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{hint}</span>}
          {action}
        </div>
      </div>
      {children}
    </div>
  )
}

export function WorkbenchButton({ children, variant = "primary", className = "", style, ...props }) {
  const styles = {
    primary: {
      color: "var(--brand-on-primary)",
      borderColor: "#14327d",
      background: "linear-gradient(180deg, var(--brand-primary-hover), var(--brand-primary-deep))",
      boxShadow: "0 10px 22px rgba(29,78,216,.26)",
    },
    ghost: {
      color: "var(--text-body)",
      borderColor: "var(--border-base)",
      background: "var(--white)",
      boxShadow: "var(--shadow-control)",
    },
    soft: {
      color: "var(--brand-primary)",
      borderColor: "rgba(37,99,235,.15)",
      background: "var(--info-bg)",
      boxShadow: "none",
    },
  }

  return (
    <button
      className={cn("inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-extrabold transition-opacity hover:opacity-90 disabled:opacity-60", className)}
      style={{ ...styles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  )
}

export function WorkbenchEmpty({ title, description, className = "" }) {
  return (
    <div className={cn("rounded-[14px] border-2 border-dashed px-5 py-11 text-center", className)} style={{ borderColor: "#cbd5e1", color: "var(--text-secondary)" }}>
      {title && <strong className="mb-1.5 block text-base" style={{ color: "var(--text-title)" }}>{title}</strong>}
      {description && <p className="m-0 text-sm">{description}</p>}
    </div>
  )
}
