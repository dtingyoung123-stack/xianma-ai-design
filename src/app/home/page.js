import Link from "next/link"
import { Plus, ArrowRight, RefreshCw, Circle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import SafeImage from "@/components/SafeImage"
import { models, quickCards, recentItems } from "@/data/demo/home"

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-6">
        <WelcomeCard />
        <ProfileCard />
      </div>

      {/* Quick access */}
      <QuickGrid />

      {/* Recent history */}
      <RecentSection />

      {/* Available models */}
      <ModelSection />
    </div>
  )
}

/** ─── 欢迎区 ─── */
function WelcomeCard() {
  return (
    <div className="relative flex flex-col justify-center min-h-[200px] px-8 py-6 rounded-xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--white) 0%, var(--brand-primary-soft) 100%)",
        borderColor: "var(--brand-primary-soft)",
      }}>
      <div className="absolute right-[-40px] top-[-40px] w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{ background: "var(--brand-primary-soft)" }} />
      <div className="absolute right-[60px] bottom-[-30px] w-[120px] h-[120px] rounded-full pointer-events-none"
        style={{ background: "var(--brand-primary-soft)" }} />
      <div className="relative z-10">
        <div className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "var(--brand-primary)" }}>
          WORKSPACE
        </div>
        <h1 className="text-[22px] font-semibold leading-[30px] mb-1.5" style={{ color: "var(--text-title)" }}>
          夜深了，肖子雄
        </h1>
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          肖子雄公子，幸会先马。愿助君挥毫泼墨，绘尽万里锦绣山河。
        </p>
        <div className="flex gap-3">
          <Link href="/ai-hub/prompt"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "var(--brand-primary)" }}>
            <Plus size={14} /> 打开 AI 提示词
          </Link>
          <Link href="/ai-hub/buyer-show"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium border transition-colors bg-white hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>
            <ArrowRight size={14} /> 进入 AI 买家秀
          </Link>
        </div>
      </div>
    </div>
  )
}

/** ─── 个人信息卡 ─── */
function ProfileCard() {
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: "var(--border-base)" }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium"
            style={{ background: "var(--brand-primary)" }}>肖</div>
          <div>
            <div className="text-base font-semibold" style={{ color: "var(--text-title)" }}>肖子雄</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>数据中心 - 星河界</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--success)" }}>
          <Circle size={6} fill="currentColor" /> 积分同步正常
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatBox value="917" label="可用积分" primary />
        <StatBox value="0" label="今日使用" />
        <StatBox value="0" label="本周使用" />
        <StatBox value="5" label="平台模型" />
      </div>
      <div className="flex items-baseline justify-between pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
        <div className="text-[28px] font-bold leading-none" style={{ color: "var(--text-title)", fontVariantNumeric: "tabular-nums" }}>00:07</div>
        <div className="text-right text-xs" style={{ color: "var(--text-secondary)" }}>
          <div className="font-semibold" style={{ color: "var(--text-body)" }}>星期一</div>
          <div>2026年7月20日</div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ value, label, primary }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="font-semibold leading-none" style={{
        fontSize: primary ? "28px" : "20px",
        fontWeight: primary ? 700 : 600,
        color: "var(--text-title)",
        fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </div>
  )
}

/** ─── 快速入口 ─── */
function QuickGrid() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-title)" }}>快速使用</h2>
        <Link href="/image-tools" className="text-[13px] flex items-center gap-1 hover:text-[var(--brand-primary)] transition-colors"
          style={{ color: "var(--text-secondary)" }}>
          全部工具 <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 196px), 1fr))" }}>
        {quickCards.map((card) => (
          <Link key={card.key} href={card.href}
            className="bg-white rounded-xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 group"
            style={{ borderColor: "var(--border-base)" }}>
            <div className="relative w-full aspect-video" style={{ background: "var(--gray-100)" }}>
              <SafeImage src={card.img} alt={card.title} className="w-full h-full object-cover" />
              {card.badge && (
                <span className="absolute right-2.5 bottom-2.5 h-5 px-2 rounded-full flex items-center text-[10px] font-semibold text-white backdrop-blur"
                  style={{ background: "var(--gray-900)" }}>
                  {card.badge}
                </span>
              )}
            </div>
            <div className="p-3 flex flex-col gap-0.5">
              <div className="text-sm font-semibold leading-5 group-hover:text-[var(--brand-primary)] transition-colors"
                style={{ color: "var(--text-title)" }}>{card.title}</div>
              <div className="text-xs leading-[18px]" style={{ color: "var(--text-secondary)" }}>{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** ─── 可用大模型 ─── */
function ModelSection() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-title)" }}>可用大模型</h2>
          <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>将可用模型选择卡片语言搬进首页，统一视觉和使用方式。</p>
        </div>
        <button className="inline-flex items-center gap-1 text-[13px] transition-colors hover:text-[var(--brand-primary)] shrink-0"
          style={{ color: "var(--text-secondary)" }}>
          <RefreshCw size={14} /> 刷新
        </button>
      </div>
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border-base)" }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {models.map((m, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border rounded-xl p-4 transition-all duration-150 hover:shadow-[var(--shadow-card-hover)]"
              style={{ borderColor: "var(--border-base)" }}>
              <SafeImage src={m.img} alt={m.name}
                className="w-10 h-10 rounded-lg object-contain border p-1 bg-white shrink-0"
                style={{ borderColor: "var(--border-light)" }} />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--text-title)" }}>{m.name}</span>
                  <span className="text-[11px] h-5 px-1.5 rounded flex items-center shrink-0"
                    style={{ background: "var(--gray-100)", color: "var(--text-secondary)" }}>平均 {m.time}</span>
                </div>
                <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "var(--gray-500)" }}>{m.source}</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{m.desc}</span>
                  <span className="text-[11px] px-1.5 rounded shrink-0 font-medium"
                    style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>{m.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** ─── 最近历史 ─── */
function RecentSection() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-title)" }}>最近使用</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>快速访问最近的生成任务</p>
        </div>
        <Link href="/history" className="text-[13px] flex items-center gap-1 hover:text-[var(--brand-primary)] transition-colors"
          style={{ color: "var(--text-secondary)" }}>
          全部历史 <ArrowRight size={14} />
        </Link>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-base)" }}>
        {recentItems.map((item, i) => (
          <Link key={i} href="/history"
            className={cn(
              "flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--bg-hover)]",
              i < recentItems.length - 1 ? "border-b" : ""
            )}
            style={{ borderColor: "var(--border-light)" }}>
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--gray-100)" }}>
                <Sparkles size={18} style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--text-title)" }}>{item.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.type} · {item.time}</div>
              </div>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full shrink-0 ml-4 font-medium",
              item.status === "已完成" ? "text-[var(--success)]" : "text-[var(--warning)]"
            )}
            style={item.status === "已完成" ? { background: "var(--success-bg)" } : { background: "var(--warning-bg)" }}>
              {item.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
