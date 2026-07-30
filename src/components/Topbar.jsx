"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./LayoutClient"
import { topNavItems } from "@/config/navigation"
import SafeImage from "./SafeImage"

export default function Topbar() {
  const { open, setOpen } = useSidebar()
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b flex items-center justify-between px-3 md:px-4 lg:px-5"
      style={{ borderColor: "var(--border-base)" }}>

      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 mr-2">
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href="/home" className="flex items-center gap-2 md:gap-2.5">
          <SafeImage src="/logo.png" alt="先马" className="w-7 h-7 md:w-8 md:h-8 rounded-full" />
          <div className="hidden sm:block leading-tight">
            <div className="text-[13px] md:text-[15px] font-semibold" style={{ color: "var(--text-title)" }}>先马 AI 设计平台</div>
            <div className="text-[10px] md:text-[11px] hidden md:block" style={{ color: "var(--text-secondary)" }}>企业智能设计工作台</div>
          </div>
        </Link>
      </div>

      {/* Center: Primary navigation */}
      <nav
        className="hidden lg:flex h-[38px] items-center gap-1 rounded-full px-1"
        style={{ background: "var(--gray-100)" }}
        aria-label="一级菜单"
      >
        {topNavItems.map((item) => {
          const active = item.match(pathname)
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "relative flex h-[34px] items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors",
                active
                  ? "text-[var(--brand-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-title)]"
              )}
            >
              {item.label}
              {active && (
                <span
                  className="absolute left-3 right-3 bottom-[-2px] h-0.5 rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Right: UI 样式 + Credits + User */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
        <Link href="/ui-guide"
          className="text-xs font-medium px-2.5 py-1 rounded-full border transition-colors hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border-base)" }}>
          UI 样式
        </Link>
        <div className="hidden xs:inline-flex items-center gap-1.5 h-7 md:h-8 px-2 md:px-3 rounded-full text-[11px] md:text-[13px] font-medium"
          style={{
            backgroundColor: "var(--brand-primary-soft)",
            color: "var(--brand-primary)",
            fontVariantNumeric: "tabular-nums",
          }}>
          <span className="hidden sm:inline">917 积分</span>
          <span className="sm:hidden font-semibold">917</span>
        </div>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white text-[11px] md:text-[13px] font-medium shrink-0"
          style={{ background: "var(--brand-primary)" }}>
          肖
        </div>
      </div>
    </header>
  )
}
