"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PageHeader({ crumbs = [], status = "" }) {
  const router = useRouter()

  function goBack() {
    if (crumbs.length >= 2) {
      const parent = crumbs[crumbs.length - 2]
      if (parent.href) { router.push(parent.href); return }
    }
    router.push("/home")
  }

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors hover:opacity-80"
        style={{ color: "var(--brand-primary)" }}
      >
        <ArrowLeft size={16} />
        <span>返回</span>
      </button>

      {crumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: "var(--text-disabled)" }}>/</span>}
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="hover:underline"
                  style={{ color: "var(--text-secondary)" }}>
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: i === crumbs.length - 1 ? "var(--text-title)" : "var(--text-secondary)" }}
                  className={i === crumbs.length - 1 ? "font-semibold" : ""}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {status && (
        <span
          className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium"
          style={{
            backgroundColor: "var(--brand-primary-soft)",
            color: "var(--brand-primary)",
          }}
        >
          {status}
        </span>
      )}
    </div>
  )
}
