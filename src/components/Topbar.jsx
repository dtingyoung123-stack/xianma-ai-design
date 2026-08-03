"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Coins, KeyRound, LogOut, Menu, RefreshCw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./LayoutClient"
import { topNavItems } from "@/config/navigation"
import SafeImage from "./SafeImage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser, POINTS_CHANGE_EVENT, readPointsState } from "@/lib/points-store"

function getUsageStats(state) {
  const now = new Date()
  const today = now.toDateString()
  const year = now.getFullYear()
  const consumed = state.ledger.filter((item) => item.amount < 0)

  return {
    today: consumed
      .filter((item) => new Date(item.createdAt).toDateString() === today)
      .reduce((total, item) => total + Math.abs(item.amount), 0),
    year: consumed
      .filter((item) => new Date(item.createdAt).getFullYear() === year)
      .reduce((total, item) => total + Math.abs(item.amount), 0),
  }
}

export default function Topbar() {
  const { open, setOpen } = useSidebar()
  const pathname = usePathname()
  const user = getCurrentUser()
  const [pointsState, setPointsState] = useState(() => readPointsState())
  const usage = getUsageStats(pointsState)

  useEffect(() => {
    const sync = (event) => setPointsState(event.detail || readPointsState())
    window.addEventListener(POINTS_CHANGE_EVENT, sync)
    return () => window.removeEventListener(POINTS_CHANGE_EVENT, sync)
  }, [])

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
        <Link href="/points" aria-label={`积分中心，当前 ${pointsState.balance} 积分`} className="inline-flex items-center gap-1.5 h-7 md:h-8 px-2 md:px-3 rounded-full text-[11px] md:text-[13px] font-medium transition-colors hover:ring-2 hover:ring-[var(--brand-primary-soft)]"
          style={{
            backgroundColor: "var(--brand-primary-soft)",
            color: "var(--brand-primary)",
            fontVariantNumeric: "tabular-nums",
          }}>
          <Coins size={14} />
          <span className="hidden sm:inline">{pointsState.balance.toLocaleString()} 积分</span>
          <span className="sm:hidden font-semibold">{pointsState.balance.toLocaleString()}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="打开个人信息"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white outline-none transition-shadow hover:ring-2 hover:ring-[var(--brand-primary-soft)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] md:h-8 md:w-8 md:text-[13px]"
            style={{ background: "var(--brand-primary)" }}
          >
            {user.name.slice(0, 1)}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-[260px] overflow-hidden border bg-[var(--bg-card)] p-0 text-[var(--text-body)] shadow-lg ring-0"
            style={{ borderColor: "var(--border-base)" }}
          >
            <div className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-title)]">{user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{user.department} · {user.role}</p>
                </div>
                <span className="shrink-0 rounded-md bg-[var(--success-bg)] px-1.5 py-0.5 text-[11px] text-[var(--success)]">演示账号</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ProfileStat label="可用积分" value={pointsState.balance} />
                <ProfileStat label="今日使用" value={usage.today} />
                <ProfileStat label="本年使用" value={usage.year} />
                <ProfileStat label="待同步事件" value={user.pendingSyncEvents} />
              </div>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-1.5">
              <DropdownMenuItem render={<Link href="/points" />} className="h-9 gap-2 px-2.5">
                <Coins />积分中心
              </DropdownMenuItem>
              <DropdownMenuItem className="h-9 gap-2 px-2.5">
                <KeyRound />修改密码
              </DropdownMenuItem>
              <DropdownMenuItem className="h-9 gap-2 px-2.5">
                <RefreshCw />刷新账号信息
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="h-9 gap-2 px-2.5">
                <LogOut />退出登录
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function ProfileStat({ label, value }) {
  return (
    <div className="rounded-md border bg-[var(--gray-50)] px-2.5 py-2" style={{ borderColor: "var(--border-base)" }}>
      <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-title)]">{value.toLocaleString()}</p>
    </div>
  )
}
