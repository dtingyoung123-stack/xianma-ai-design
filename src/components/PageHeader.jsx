"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function PageHeader({ crumbs = [], status = "" }) {
  const router = useRouter()
  const [canvasCrumbs, setCanvasCrumbs] = useState(null)
  useEffect(() => {
    const sync = event => setCanvasCrumbs(event.detail)
    window.addEventListener("canvas-breadcrumbs", sync)
    return () => window.removeEventListener("canvas-breadcrumbs", sync)
  }, [])
  const shownCrumbs = canvasCrumbs || crumbs

  function goBack() {
    if (crumbs.length >= 2) {
      const parent = crumbs[crumbs.length - 2]
      if (parent.href) { router.push(parent.href); return }
    }
    router.push("/home")
  }

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      {!canvasCrumbs && <button
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors hover:opacity-80"
        style={{ color: "var(--brand-primary)" }}
      >
        <ArrowLeft size={16} />
        <span>返回</span>
      </button>}

      {shownCrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm">
          {shownCrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: "var(--text-disabled)" }}>/</span>}
              {crumb.href && i < shownCrumbs.length - 1 ? (
                <Link href={crumb.href} onClick={canvasCrumbs ? (event) => { event.preventDefault(); if (crumb.onClick) crumb.onClick(); else window.location.assign(crumb.href) } : undefined} className="hover:underline"
                  style={{ color: "var(--text-secondary)" }}>
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: i === shownCrumbs.length - 1 ? "var(--text-title)" : "var(--text-secondary)" }}
                  className={i === shownCrumbs.length - 1 ? "font-semibold" : ""}>
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
