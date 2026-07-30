"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, X } from "lucide-react"
import { useSidebar } from "./LayoutClient"
import { adminItems, isHrefActive, navGroups } from "@/config/navigation"

export default function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { open, setOpen } = useSidebar()
  const [expanded, setExpanded] = useState({ "image-tools": true, "ai-hub": true })

  function closeSidebar() { setOpen(false) }

  function toggleExpand(key) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function isParentActive(group) {
    return group.children.some((child) => isHrefActive(child.href, pathname, searchParams.toString()))
  }

  return (
    <aside
      className={cn(
        "fixed top-14 bottom-0 left-0 w-[240px] bg-white border-r overflow-y-auto py-4 px-3 z-40 transition-transform duration-200",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ borderColor: "var(--border-base)" }}>
      {/* Close button (mobile only) */}
      <button
        className="lg:hidden absolute top-3 right-3 p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
        onClick={closeSidebar}
        aria-label="Close sidebar"
      >
        <X size={18} style={{ color: "var(--text-secondary)" }} />
      </button>
      {navGroups.map((group) => (
        <div key={group.key} className="mb-6">
          <button
            onClick={() => toggleExpand(group.key)}
            className={cn(
              "w-full h-10 px-3 rounded-lg flex items-center gap-2.5 text-sm font-medium transition-colors",
              isParentActive(group)
                ? "text-[var(--brand-primary)]"
                : "text-[var(--text-body)] hover:bg-[var(--bg-hover)]"
            )}
            style={isParentActive(group) ? { background: "var(--brand-primary-soft)" } : {}}
          >
            <group.icon size={18} style={{ color: "var(--text-secondary)" }} />
            <span className="flex-1 text-left">{group.label}</span>
            <span className="text-[11px] h-[18px] min-w-[18px] px-1.5 rounded-full flex items-center justify-center"
              style={{ background: "var(--gray-100)", color: "var(--text-secondary)" }}>
              {group.children.length}
            </span>
            <ChevronDown
              size={14}
              className={cn("transition-transform", expanded[group.key] && "rotate-180")}
              style={{ color: "var(--text-secondary)" }}
            />
          </button>
          {expanded[group.key] && (
            <div className="mt-1 ml-2 pl-4 border-l" style={{ borderColor: "var(--border-light)" }}>
              {group.children.map((child) => (
                <Link
                  key={child.key}
                  href={child.href}
                  onClick={closeSidebar}
                  className={cn(
                    "h-[34px] px-3 rounded-md flex items-center gap-2 text-[13px] font-medium transition-colors",
                    isHrefActive(child.href, pathname, searchParams.toString())
                      ? "text-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]"
                  )}
                >
                  <span className="flex-1">{child.label}</span>
                  {child.badge && (
                    <span className="text-[11px] h-[18px] px-1.5 rounded-full flex items-center font-medium"
                      style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>
                      {child.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Admin divider + items */}
      <div className="mt-8 pt-4 border-t" style={{ borderColor: "var(--border-light)" }}>
        {adminItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={closeSidebar}
            className={cn(
              "h-10 px-3 rounded-lg flex items-center gap-2.5 text-sm font-medium transition-colors",
              pathname === item.href
                ? "text-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                : "text-[var(--text-body)] hover:bg-[var(--bg-hover)]"
            )}
          >
            <item.icon size={18} style={{ color: "var(--text-secondary)" }} />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
