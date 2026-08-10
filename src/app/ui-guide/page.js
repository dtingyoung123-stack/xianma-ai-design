"use client"

import { useState } from "react"

const tocItems = [
  { id: "design", label: "设计基础" },
  { id: "basic", label: "基础组件" },
  { id: "form", label: "表单与选择" },
  { id: "nav", label: "导航与布局" },
  { id: "data", label: "数据展示" },
  { id: "feedback", label: "反馈" },
  { id: "overlay", label: "弹层" },
]

export default function UiGuidePage() {
  return (
    <div className="w-full pb-16">
      <PageTitle />

      <div id="design"><CategoryDivider title="设计基础 Design Foundation" /></div>
      <BrandColors />
      <NeutralColors />
      <StateColors />
      <Typography />
      <Spacing />
      <Radius />
      <Shadow />

      <div id="basic"><CategoryDivider title="基础组件 Basic" /></div>
      <Buttons />
      <Inputs />
      <Tags />
      <Cards />

      <div id="form"><CategoryDivider title="表单与选择 Form & Selection" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SelectDropdown /><RadioGroup /><CheckboxGroup />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SwitchToggle /><SliderBar />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CountGrid /><RatioSelect />
      </div>
      <ModelDropdownSelect />
      <ParamModal />

      <div id="nav"><CategoryDivider title="导航与布局 Navigation & Layout" /></div>
      <TabsSegment />

      <div id="data"><CategoryDivider title="数据展示 Data Display" /></div>
      <TableDemo />
      <Pagination />

      <div id="feedback"><CategoryDivider title="反馈 Feedback" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProgressBar /><UploadZone /><ToastDemo /><SkeletonDemo />
      </div>
      <EmptyState />

      <div id="overlay"><CategoryDivider title="弹层 Overlay" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DialogDemo /><SheetDemo />
      </div>
    </div>
  )
}

/* ── Category divider ── */
function CategoryDivider({ title }) {
  return (
    <div className="mt-12 mb-6 pb-3 border-b-2" style={{ borderColor: "var(--brand-primary-soft)" }}>
      <h2 className="text-sm font-bold tracking-[1px]" style={{ color: "var(--text-title)" }}>{title}</h2>
    </div>
  )
}

/* ── Section wrapper ── */
function Section({ title, desc, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-[20px] font-semibold mb-1" style={{ color: "var(--text-title)" }}>{title}</h2>
      {desc && <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{desc}</p>}
      {children}
    </section>
  )
}

/* ── Swatch ── */
function ColorSwatch({ name, color, token, usage }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full aspect-[2/1] rounded-lg border" style={{ background: color, borderColor: "var(--border-base)" }} />
      <div>
        <div className="text-sm font-semibold" style={{ color: "var(--text-title)" }}>{name}</div>
        <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{color}</div>
        {token && <div className="text-xs font-mono" style={{ color: "var(--text-disabled)" }}>{token}</div>}
        {usage && <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{usage}</div>}
      </div>
    </div>
  )
}

/* ── Page Title ── */
function PageTitle() {
  return (
    <div className="mb-8 pb-6 border-b flex items-start justify-between gap-4" style={{ borderColor: "var(--border-base)" }}>
      <div>
        <h1 className="text-[28px] font-bold mb-2" style={{ color: "var(--text-title)" }}>设计系统 · UI 规范</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>先马AI内容与视觉平台 · 品牌色 #2563EB · React + shadcn/ui + Tailwind CSS</p>
      </div>
      <a href="/api/ui-spec" download
        className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ background: "var(--brand-primary)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-primary-hover)" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--brand-primary)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        导出 UI 规范说明
      </a>
    </div>
  )
}

/* ── Brand Colors ── */
function BrandColors() {
  const colors = [
    { name: "Primary", color: "#2563EB", token: "--brand-primary", usage: "主按钮、选中态、强调" },
    { name: "Primary Hover", color: "#1D4ED8", token: "--brand-primary-hover", usage: "Hover 加深" },
    { name: "Primary Active", color: "#1E40AF", token: "--brand-primary-active", usage: "按下态" },
    { name: "Primary Soft", color: "rgba(37,99,235,0.08)", token: "--brand-primary-soft", usage: "选中背景、标签底" },
    { name: "On Primary", color: "#FFFFFF", token: "--brand-on-primary", usage: "主色上的文字" },
  ]
  return (
    <Section title="主题色" desc="蓝色系 #2563EB，仅用于主题、主操作、选中态、焦点态。大面积背景保持白色/浅中性色。">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {colors.map((c) => <ColorSwatch key={c.name} {...c} />)}
      </div>
    </Section>
  )
}

/* ── Neutral Colors ── */
function NeutralColors() {
  const grays = [
    { name: "Gray 25", color: "#FCFCFD", token: "--gray-25" },
    { name: "Gray 50", color: "#F7F8FA", token: "--gray-50" },
    { name: "Gray 100", color: "#F2F4F7", token: "--gray-100" },
    { name: "Gray 200", color: "#E4E7EC", token: "--gray-200" },
    { name: "Gray 300", color: "#D0D5DD", token: "--gray-300" },
    { name: "Gray 400", color: "#98A2B3", token: "--gray-400" },
    { name: "Gray 500", color: "#667085", token: "--gray-500" },
    { name: "Gray 600", color: "#475467", token: "--gray-600" },
    { name: "Gray 700", color: "#344054", token: "--gray-700" },
    { name: "Gray 800", color: "#1D2939", token: "--gray-800" },
    { name: "Gray 900", color: "#101828", token: "--gray-900" },
  ]
  return (
    <Section title="中性色" desc="从浅到深 11 档灰度。Gray 900 用于标题，Gray 700 用于正文，Gray 500 用于辅助文字。">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3">
        {grays.map((g) => (
          <div key={g.name} className="flex flex-col gap-1.5">
            <div className="w-full aspect-[1.6/1] rounded-lg border"
              style={{ background: g.color, borderColor: g.name === "Gray 25" ? "var(--border-base)" : "transparent" }} />
            <div className="text-xs font-semibold" style={{ color: "var(--text-title)" }}>{g.name}</div>
            <div className="text-[11px] font-mono" style={{ color: "var(--text-disabled)" }}>{g.color}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ── State Colors ── */
function StateColors() {
  const states = [
    { name: "成功 Success", color: "#16A34A", token: "--success", bg: "#EAF8F1", bgToken: "--success-bg" },
    { name: "警告 Warning", color: "#F59E0B", token: "--warning", bg: "#FFF6E5", bgToken: "--warning-bg" },
    { name: "失败 Danger", color: "#DC2626", token: "--danger", bg: "#FEF3F2", bgToken: "--danger-bg" },
    { name: "信息 Info", color: "#0EA5E9", token: "--info", bg: "#EFF6FF", bgToken: "--info-bg" },
  ]
  return (
    <Section title="状态色" desc="语义色，仅用于表达操作结果和状态反馈。">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {states.map((s) => (
          <div key={s.name} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1 aspect-square rounded-lg" style={{ background: s.color }} />
              <div className="flex-1 aspect-square rounded-lg border" style={{ background: s.bg, borderColor: "var(--border-base)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-title)" }}>{s.name}</div>
              <div className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>{s.color}</div>
              <div className="text-[11px] font-mono" style={{ color: "var(--text-disabled)" }}>{s.token} / {s.bgToken}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ── Typography ── */
function Typography() {
  return (
    <Section title="字体 & 文本层级" desc="字体栈: Inter → system-ui → PingFang SC → Microsoft YaHei">
      <div className="bg-white rounded-xl border p-6 space-y-6" style={{ borderColor: "var(--border-base)" }}>
        <div className="border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>Display · 28px/700 · 统计大数</div>
          <div className="text-[28px] font-bold" style={{ color: "var(--text-title)", fontVariantNumeric: "tabular-nums" }}>917</div>
        </div>
        <div className="border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>H1 · 22px/600 · 页面标题</div>
          <div className="text-[22px] font-semibold" style={{ color: "var(--text-title)" }}>先马AI内容与视觉平台</div>
        </div>
        <div className="border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>H2 · 20px/600 · 页面主要分区标题</div>
          <div className="text-[20px] font-semibold" style={{ color: "var(--text-title)" }}>可用大模型</div>
        </div>
        <div className="border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>H3 · 16px/600 · 卡片/面板标题</div>
          <div className="text-base font-semibold" style={{ color: "var(--text-title)" }}>AI 提示词</div>
        </div>
        <div className="border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>Body · 14px/400 · 默认正文</div>
          <p className="text-sm" style={{ color: "var(--text-body)" }}>肖子雄公子，幸会先马。愿助君挥毫泼墨，绘尽万里锦绣山河。</p>
        </div>
        <div className="border-b pb-4" style={{ borderColor: "var(--border-light)" }}>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>Body Medium · 14px/500 · 按钮、标签文字</div>
          <div className="text-sm font-medium" style={{ color: "var(--text-body)" }}>打开 AI 提示词</div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>Small · 12px/400 · 辅助说明、时间、角标</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>2026年7月20日 · 2 分钟前</div>
        </div>
      </div>
    </Section>
  )
}

/* ── Spacing ── */
function Spacing() {
  const spaces = [
    { name: "space-1", value: "4px", label: "标签之间 / 图标与文字" },
    { name: "space-2", value: "8px", label: "表单项之间" },
    { name: "space-3", value: "12px", label: "" },
    { name: "space-4", value: "16px", label: "卡片内边距 / 卡片间距" },
    { name: "space-5", value: "20px", label: "" },
    { name: "space-6", value: "24px", label: "页面主区块之间 (mb-6)" },
    { name: "space-8", value: "32px", label: "" },
    { name: "space-9", value: "48px", label: "" },
  ]
  return (
    <Section title="间距 · 4px 栅格" desc="所有间距为 4 的倍数。区块之间统一 mb-6 (24px)。">
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: "var(--border-base)" }}>
        {spaces.map((s) => (
          <div key={s.name} className="flex items-center gap-4">
            <div className="text-xs font-mono w-16 shrink-0" style={{ color: "var(--text-disabled)" }}>{s.name}</div>
            <div className="text-xs font-mono w-10 shrink-0" style={{ color: "var(--text-secondary)" }}>{s.value}</div>
            <div className="h-6 rounded" style={{ width: s.value, background: "var(--brand-primary-soft)", minWidth: "4px" }} />
            {s.label && <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</div>}
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ── Radius ── */
function Radius() {
  const radii = [
    { name: "radius-sm", value: "6px", usage: "tag、小元素" },
    { name: "radius-md", value: "8px", usage: "按钮、输入框" },
    { name: "radius-lg", value: "16px", usage: "卡片、面板、弹窗" },
    { name: "radius-pill", value: "999px", usage: "胶囊、头像、状态点" },
  ]
  return (
    <Section title="圆角">
      <div className="flex flex-wrap gap-6">
        {radii.map((r) => (
          <div key={r.name} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 flex items-center justify-center text-xs font-medium"
              style={{ background: "var(--brand-primary-soft)", borderRadius: r.value, color: "var(--brand-primary)" }}>
              {r.value}
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold" style={{ color: "var(--text-title)" }}>{r.name}</div>
              <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.usage}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ── Shadow ── */
function Shadow() {
  return (
    <Section title="阴影">
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-32 h-24 rounded-xl bg-white flex items-center justify-center text-xs font-medium"
            style={{ boxShadow: "var(--shadow-card)" }}>
            shadow-card
          </div>
          <div className="text-[11px] text-center" style={{ color: "var(--text-secondary)" }}>默认卡片不使用</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-32 h-24 rounded-xl bg-white flex items-center justify-center text-xs font-medium"
            style={{ boxShadow: "var(--shadow-card-hover)", transform: "translateY(-2px)" }}>
            shadow-hover
          </div>
          <div className="text-[11px] text-center" style={{ color: "var(--text-secondary)" }}>hover 态 + 微上移</div>
        </div>
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--text-disabled)" }}>规则：卡片&quot;阴影 / 边框&quot;二选一，不叠加。</p>
    </Section>
  )
}

/* ── Buttons ── */
function Buttons() {
  return (
    <Section title="按钮">
      <div className="bg-white rounded-xl border p-6 space-y-5" style={{ borderColor: "var(--border-base)" }}>
        {/* Primary */}
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>Primary · 蓝底白字 · 页面主操作</div>
          <div className="flex flex-wrap items-end gap-3">
            <button className="h-10 px-5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--brand-primary)" }}>Large 40px</button>
            <button className="h-9 px-4 rounded-lg text-sm font-medium text-white" style={{ background: "var(--brand-primary)" }}>Medium 36px</button>
            <button className="h-8 px-3 rounded-lg text-[13px] font-medium text-white" style={{ background: "var(--brand-primary)" }}>Small 32px</button>
            <button className="h-9 px-4 rounded-lg text-sm font-medium text-white opacity-50 cursor-not-allowed" style={{ background: "var(--brand-primary)" }}>Disabled</button>
          </div>
        </div>
        {/* Default */}
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>Default · 白底灰边 · 次要操作</div>
          <div className="flex flex-wrap items-end gap-3">
            <button className="h-10 px-5 rounded-lg text-sm font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>Large 40px</button>
            <button className="h-9 px-4 rounded-lg text-sm font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>Medium 36px</button>
            <button className="h-8 px-3 rounded-lg text-[13px] font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>Small 32px</button>
            <button className="h-9 px-4 rounded-lg text-sm font-medium border bg-white opacity-50 cursor-not-allowed" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>Disabled</button>
          </div>
        </div>
        {/* Text */}
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>Text · 蓝字无底无边 · 弱操作</div>
          <div className="flex flex-wrap items-end gap-3">
            <button className="h-9 px-2 rounded-lg text-sm font-medium" style={{ color: "var(--brand-primary)" }}>← 返回</button>
            <button className="h-9 px-2 rounded-lg text-sm font-medium" style={{ color: "var(--brand-primary)" }}>查看更多</button>
          </div>
        </div>
        {/* Danger */}
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>Danger · 红色 · 破坏性操作</div>
          <div className="flex flex-wrap items-end gap-3">
            <button className="h-9 px-4 rounded-lg text-sm font-medium text-white" style={{ background: "var(--danger)" }}>删除</button>
            <button className="h-9 px-4 rounded-lg text-sm font-medium border" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>删除</button>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ── 表格 Table ── */
function TableDemo() {
  const rows = [
    { id: "T-001", name: "夏季T恤模特图", model: "Wan 2.7", status: "已完成", time: "2026-07-20", cost: "12 积分" },
    { id: "T-002", name: "新品连衣裙买家秀", model: "Nano Banana 2", status: "处理中", time: "2026-07-20", cost: "8 积分" },
    { id: "T-003", name: "运动鞋白底图优化", model: "Doubao", status: "失败", time: "2026-07-19", cost: "6 积分" },
    { id: "T-004", name: "防晒衣多角度", model: "GPT Image 2", status: "排队中", time: "2026-07-19", cost: "15 积分" },
  ]
  const statusMap = {
    "已完成": { bg: "var(--success-bg)", color: "var(--success)" },
    "处理中": { bg: "var(--warning-bg)", color: "var(--warning)" },
    "失败": { bg: "var(--danger-bg)", color: "var(--danger)" },
    "排队中": { bg: "var(--info-bg)", color: "var(--info)" },
  }
  return (
    <Section title="表格 Table" desc="数据列表。白底 + 水平分隔线，表头灰底，行 hover 浅灰。">
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-base)" }}>
        <table className="w-full text-sm">
          <thead style={{ background: "var(--gray-50)" }}>
            <tr>
              {["任务 ID", "任务名称", "模型", "状态", "时间", "消耗"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-[var(--bg-hover)] transition-colors cursor-pointer" style={{ borderColor: "var(--border-light)" }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-disabled)" }}>{r.id}</td>
                <td className="px-4 py-3 font-medium" style={{ color: "var(--text-title)" }}>{r.name}</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{r.model}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center h-6 px-2 rounded text-xs font-medium" style={statusMap[r.status]}>{r.status}</span></td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{r.time}</td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-body)" }}>{r.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

/* ── 分页 Pagination ── */
function Pagination() {
  const [page, setPage] = useState(1)
  return (
    <Section title="分页 Pagination" desc="列表翻页。当前页蓝色实底，其他灰色。">
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => setPage(Math.max(1, page - 1))} className="h-8 px-3 rounded-lg text-sm border hover:text-[var(--brand-primary)] transition-colors" style={{ color: "var(--text-secondary)", borderColor: "var(--border-base)" }}>上一页</button>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <button key={n} onClick={() => setPage(n)} className="h-8 w-8 rounded-lg text-sm font-medium transition-colors"
            style={page === n ? { background: "var(--brand-primary)", color: "var(--white)" } : { color: "var(--text-body)" }}>{n}</button>
        ))}
        <button onClick={() => setPage(Math.min(8, page + 1))} className="h-8 px-3 rounded-lg text-sm border hover:text-[var(--brand-primary)] transition-colors" style={{ color: "var(--text-secondary)", borderColor: "var(--border-base)" }}>下一页</button>
      </div>
    </Section>
  )
}

/* ── 弹窗 Dialog ── */
function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Section title="弹窗 Dialog / Modal" desc="居中弹窗。标题 + 内容 + 底部按钮。点击遮罩或关闭按钮关闭。">
      <button onClick={() => setOpen(true)} className="h-9 px-4 rounded-lg text-sm font-medium text-white" style={{ background: "var(--brand-primary)" }}>打开弹窗</button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-7" style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="bg-white rounded-[22px] border overflow-hidden" style={{ width: "480px", borderColor: "var(--border-light)", boxShadow: "var(--shadow-card-hover)" }}>
            <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: "var(--border-light)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-title)" }}>确认删除</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-secondary)" }}>×</button>
            </div>
            <div className="px-5 py-4 text-sm" style={{ color: "var(--text-body)" }}>删除后将无法恢复，确定要删除该任务吗？</div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: "var(--border-light)" }}>
              <button onClick={() => setOpen(false)} className="h-9 px-5 rounded-lg text-sm font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>取消</button>
              <button onClick={() => setOpen(false)} className="h-9 px-5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--danger)" }}>删除</button>
            </div>
          </div>
        </div>
      )}
    </Section>
  )
}

/* ── Toast 通知 ── */
function ToastDemo() {
  const [show, setShow] = useState(false)
  const [type, setType] = useState("success")
  const items = [
    { key: "success", label: "成功", bg: "var(--success-bg)", color: "var(--success)", icon: "✓", text: "任务提交成功" },
    { key: "error", label: "失败", bg: "var(--danger-bg)", color: "var(--danger)", icon: "✗", text: "生成失败：积分不足" },
  ]
  const current = items.find((t) => t.key === type)
  return (
    <Section title="Toast 通知" desc="全局操作反馈，右上角弹出。成功/失败/警告/信息四种。自动消失或手动关闭。">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {items.map((t) => (
            <button key={t.key} onClick={() => { setType(t.key); setShow(true) }} className="h-8 px-3 rounded-lg text-xs font-medium border" style={{ color: t.color, borderColor: t.color }}>{t.label}</button>
          ))}
          <button onClick={() => setShow(false)} className="h-8 px-3 rounded-lg text-xs font-medium border" style={{ color: "var(--text-secondary)", borderColor: "var(--border-base)" }}>关闭</button>
        </div>
        {show && (
          <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border-base)", boxShadow: "var(--shadow-card-hover)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: current.color }}>{current.icon}</div>
            <span className="text-sm" style={{ color: "var(--text-body)" }}>{current.text}</span>
          </div>
        )}
      </div>
    </Section>
  )
}

/* ── Sheet 侧出面板 ── */
function SheetDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Section title="侧出面板 Sheet / Drawer" desc="从右侧滑出。用于详情、筛选、移动端菜单。点击遮罩关闭。">
      <button onClick={() => setOpen(true)} className="h-9 px-4 rounded-lg text-sm font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>打开侧出面板</button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 z-[70] w-[400px] max-w-[90vw] bg-white shadow-2xl flex flex-col" style={{ boxShadow: "var(--shadow-card-hover)" }}>
            <div className="flex justify-between items-center px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border-light)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-title)" }}>任务详情</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-secondary)" }}>×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {[{ label: "任务 ID", value: "T-20260720-001" }, { label: "模型", value: "Nano Banana 2" }, { label: "清晰度", value: "2K" }, { label: "图片尺寸", value: "1:1" }, { label: "生成张数", value: "4 张" }, { label: "消耗积分", value: "8 积分" }].map((f) => (
                <div key={f.label}><div className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{f.label}</div><div className="text-sm font-medium" style={{ color: "var(--text-title)" }}>{f.value}</div></div>
              ))}
            </div>
          </div>
        </>
      )}
    </Section>
  )
}

/* ── 骨架屏 Skeleton ── */
function SkeletonDemo() {
  const [loading, setLoading] = useState(true)
  return (
    <Section title="骨架屏 Skeleton" desc="内容加载占位。灰色矩形 + 脉冲动画，避免页面跳动。">
      <div className="space-y-3">
        <button onClick={() => setLoading(!loading)} className="h-8 px-3 rounded-lg text-xs font-medium border" style={{ color: "var(--text-secondary)", borderColor: "var(--border-base)" }}>{loading ? "显示内容" : "显示骨架屏"}</button>
        <div className="bg-white rounded-xl border p-4 space-y-3 max-w-sm" style={{ borderColor: "var(--border-base)" }}>
          {loading ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "var(--gray-100)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: "var(--gray-100)" }} />
                  <div className="h-2.5 w-1/2 rounded animate-pulse" style={{ background: "var(--gray-100)" }} />
                </div>
              </div>
              <div className="h-2.5 w-full rounded animate-pulse" style={{ background: "var(--gray-100)" }} />
              <div className="h-2.5 w-5/6 rounded animate-pulse" style={{ background: "var(--gray-100)" }} />
              <div className="h-2.5 w-4/6 rounded animate-pulse" style={{ background: "var(--gray-100)" }} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "var(--brand-primary)" }}>W</div>
                <div><div className="text-sm font-semibold" style={{ color: "var(--text-title)" }}>Wan 2.7 Image Pro</div><div className="text-xs" style={{ color: "var(--text-secondary)" }}>图像编辑 · 平均 218s</div></div>
              </div>
              <p className="text-sm" style={{ color: "var(--text-body)" }}>Wan 聚合图像生成与编辑模型</p>
              <div className="flex gap-2">
                <span className="text-[11px] h-5 px-1.5 rounded flex items-center font-medium" style={{ background: "var(--gray-100)", color: "var(--text-secondary)" }}>wan</span>
                <span className="text-[11px] h-5 px-1.5 rounded flex items-center font-medium" style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>图像编辑</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Section>
  )
}

/* ── Tags ── */
function Tags() {
  return (
    <Section title="标签 & 徽章">
      <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "var(--border-base)" }}>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>分类标签 · --gray-100 底 · 24px 高 · 6px 圆角</div>
          <div className="flex flex-wrap gap-2">
            {["图像生成", "图像编辑", "wan", "gemini"].map((t) => (
              <span key={t} className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium"
                style={{ background: "var(--gray-100)", color: "var(--text-secondary)" }}>{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>能力状态标签 · --brand-primary-soft 底 + 蓝字 · 蓝色系</div>
          <div className="flex flex-wrap gap-2">
            {["可用", "即将上线", "Beta"].map((t) => (
              <span key={t} className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium"
                style={{ background: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>任务状态标签 · 语义色</div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium" style={{ background: "var(--success-bg)", color: "var(--success)" }}>已完成</span>
            <span className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>处理中</span>
            <span className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>失败</span>
            <span className="inline-flex items-center h-6 px-2.5 rounded text-xs font-medium" style={{ background: "var(--info-bg)", color: "var(--info)" }}>排队中</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>图片 Badge · 暗底白字 · 卡片右下角</div>
          <div className="flex flex-wrap gap-2">
            {["Prompt", "Buyer", "Expert", "Edit"].map((t) => (
              <span key={t} className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-semibold text-white"
                style={{ background: "var(--gray-900)" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ── Cards ── */
function Cards() {
  return (
    <Section title="卡片">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>默认卡片 · 白底 + 边框 · 无阴影</div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border-base)" }}>
            <div className="text-base font-semibold mb-2" style={{ color: "var(--text-title)" }}>卡片标题</div>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>卡片描述文字，使用 --text-secondary 辅助色。</p>
            <div className="flex gap-2">
              <button className="h-9 px-4 rounded-lg text-sm font-medium text-white" style={{ background: "var(--brand-primary)" }}>主操作</button>
              <button className="h-9 px-4 rounded-lg text-sm font-medium border bg-white" style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>取消</button>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>可点击卡片 · hover 阴影 + 微上移</div>
          <div className="bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{ borderColor: "var(--border-base)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"
              e.currentTarget.style.borderColor = "transparent"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = ""
              e.currentTarget.style.borderColor = "var(--border-base)"
            }}>
            <div className="text-base font-semibold mb-2" style={{ color: "var(--text-title)" }}>可点击卡片</div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Hover 试试效果。border → shadow 切换。</p>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ── Inputs ── */
function Inputs() {
  return (
    <Section title="输入框 & 表单">
      <div className="bg-white rounded-xl border p-6 space-y-5 max-w-lg" style={{ borderColor: "var(--border-base)" }}>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>默认 · 40px 高 · 8px 圆角 · 灰色边框</div>
          <input type="text" placeholder="输入提示词描述..." className="w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors"
            style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}
            onFocus={(e) => { e.target.style.borderColor = "var(--brand-primary)"; e.target.style.boxShadow = "var(--focus-ring)" }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-base)"; e.target.style.boxShadow = "" }}
          />
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>Textarea · 最小 112px · 右下角字符计数</div>
          <textarea placeholder="输入详细描述..." rows={4} className="w-full min-h-[112px] p-3 rounded-lg border text-sm outline-none resize-y transition-colors"
            style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}
            onFocus={(e) => { e.target.style.borderColor = "var(--brand-primary)"; e.target.style.boxShadow = "var(--focus-ring)" }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-base)"; e.target.style.boxShadow = "" }}
          />
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>Error · 红色边框 + 错误图标 + 错误文案</div>
          <input type="text" defaultValue="错误内容" className="w-full h-10 px-3 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--danger)", color: "var(--text-body)" }} />
          <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>请输入正确的格式</p>
        </div>
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-disabled)" }}>Disabled</div>
          <input type="text" placeholder="已禁用" disabled className="w-full h-10 px-3 rounded-lg border text-sm outline-none cursor-not-allowed"
            style={{ borderColor: "var(--border-base)", background: "var(--gray-50)", color: "var(--text-disabled)" }} />
        </div>
      </div>
    </Section>
  )
}

/* ── Radio：单选（模型选择）── */
function RadioGroup() {
  const models = ["Wan 2.7 Image Pro", "Gemini 3 Pro", "Doubao Seedream 5.0", "GPT Image 2"]
  const [selected, setSelected] = useState(models[0])
  return (
    <Section title="单选 Radio · 模型选择" desc="用于从互斥选项中选中一个，如选择模型、比例、画质。">
      <div className="bg-white rounded-xl border p-5 max-w-md space-y-3" style={{ borderColor: "var(--border-base)" }}>
        {models.map((m) => (
          <label key={m} className="flex items-center gap-3 py-1.5 cursor-pointer group">
            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              style={selected === m ? { borderColor: "var(--brand-primary)" } : { borderColor: "var(--gray-300)" }}>
              {selected === m && <div className="w-2 h-2 rounded-full" style={{ background: "var(--brand-primary)" }} />}
            </div>
            <input type="radio" className="hidden" checked={selected === m} onChange={() => setSelected(m)} />
            <span className="text-sm group-hover:text-[var(--brand-primary)] transition-colors"
              style={{ color: selected === m ? "var(--text-title)" : "var(--text-body)" }}>{m}</span>
          </label>
        ))}
      </div>
    </Section>
  )
}

/* ── 模型下拉选择（套图页原型：select-card + dropdown-panel）── */
function ModelDropdownSelect() {
  const models = [
    { name: "Wan 2.7 Image Pro", eta: "218s", desc: "Wan 聚合图像生成与编辑模型", img: "/assets/wan.png" },
    { name: "Gemini 3 Pro Image Preview", eta: "79s", desc: "Gemini 图像生成通道", img: "/assets/gemini.png" },
    { name: "Nano Banana 2", eta: "85s", desc: "Gemini 图像生成通道", img: "/assets/gemini.png" },
    { name: "Doubao Seedream 5.0", eta: "40s", desc: "Doubao Seedream 图像生成通道", img: "/assets/doubao.png" },
    { name: "GPT Image 2", eta: "236s", desc: "OpenAI 图像编辑通道", img: "/assets/gpt.svg" },
  ]
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(models[0])
  return (
    <Section title="模型下拉选择" desc="点击触发按钮展开下拉面板，选项以卡片形式展示完整信息。选中项：蓝色边框 + 浅蓝底 + 右下角「已选」。用于模型、模板等需展示辅助信息的选择。">
      <div className="relative w-full max-w-sm">
        {/* Trigger */}
        <button onClick={() => setOpen(!open)}
          className="w-full h-[58px] px-3 border rounded-xl flex flex-col justify-center gap-0.5 text-left transition-colors bg-white hover:border-[var(--brand-primary)]"
          style={{ borderColor: open ? "var(--brand-primary)" : "var(--border-base)" }}>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>模型</span>
          <strong className="text-[13px] truncate" style={{ color: "var(--text-title)" }}>{sel.name}</strong>
        </button>
        {/* Dropdown */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border rounded-2xl shadow-lg p-3 space-y-2"
              style={{ borderColor: "var(--border-base)" }}>
              <div className="flex justify-between text-xs px-1 mb-2" style={{ color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-title)" }}>选择模型</strong>
                <span>{models.length} 个选项</span>
              </div>
              <div className="space-y-2">
                {models.map((m) => (
                  <button key={m.name} onClick={() => { setSel(m); setOpen(false) }}
                    className="w-full flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-colors"
                    style={sel.name === m.name
                      ? { borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" }
                      : { borderColor: "var(--border-base)", background: "var(--white)" }}>
                    <img src={m.img} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0 border p-0.5 bg-white"
                      style={{ borderColor: "var(--border-light)" }} />
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm" style={{ color: "var(--text-title)" }}>{m.name}</strong>
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded shrink-0 ml-2"
                          style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>{m.eta}</span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.desc}</p>
                    </div>
                    {sel.name === m.name && (
                      <span className="text-xs font-semibold shrink-0" style={{ color: "var(--brand-primary)" }}>✓ 已选</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Section>
  )
}

/* ── 数量选择九宫格（买家秀原型）── */
function CountGrid() {
  const [cnt, setCnt] = useState(4)
  return (
    <Section title="数量选择 · 九宫格" desc="用于选择生成数量（1-9）。选中项：白色底 + 阴影，灰色底槽。">
      <div className="inline-grid grid-cols-9 gap-1.5 p-1.5 rounded-[14px]" style={{ background: "var(--gray-100)" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} onClick={() => setCnt(n)}
            className="min-w-[46px] h-[46px] grid place-items-center text-sm font-bold rounded-xl transition-all"
            style={cnt === n
              ? { background: "var(--white)", color: "var(--text-title)", boxShadow: "var(--shadow-card)" }
              : { color: "var(--text-secondary)" }}>
            {n}
          </button>
        ))}
      </div>
    </Section>
  )
}

/* ── 比例选择（套图原型）── */
function RatioSelect() {
  const ratios = [
    { key: "1:1", label: "1:1", w: 28, h: 28 },
    { key: "16:9", label: "16:9", w: 38, h: 24 },
    { key: "9:16", label: "9:16", w: 24, h: 38 },
    { key: "auto", label: "自适应", w: 32, h: 24 },
  ]
  const [sel, setSel] = useState("1:1")
  return (
    <Section title="比例选择 · 图形化" desc="用于选择图片输出比例。每个选项用边框图形直观展示比例。选中项：白色底 + 阴影。">
      <div className="inline-grid grid-cols-4 gap-2 p-1.5 rounded-[14px]" style={{ background: "var(--gray-100)" }}>
        {ratios.map((r) => (
          <button key={r.key} onClick={() => setSel(r.key)}
            className="min-h-[80px] flex flex-col items-center justify-center gap-2 rounded-xl px-4 transition-all"
            style={sel === r.key
              ? { background: "var(--white)", color: "var(--brand-primary)", boxShadow: "var(--shadow-card)" }
              : { color: "var(--text-secondary)" }}>
            <span className="block border-2 rounded" style={{
              width: r.w, height: r.h,
              borderColor: sel === r.key ? "var(--brand-primary)" : "var(--gray-300)"
            }} />
            <span className="text-[13px] font-bold">{r.label}</span>
          </button>
        ))}
      </div>
    </Section>
  )
}

/* ── 参数下拉面板（买家秀页原型：select-card + dropdown-panel）── */
function ParamModal() {
  const [open, setOpen] = useState(false)
  const [resolution, setResolution] = useState("2K")
  const [ratio, setRatio] = useState("1:1")
  const [count, setCount] = useState(4)
  const resolutions = ["1K", "2K", "4K"]
  const ratios = [
    { key: "自适应", w: 32, h: 24 }, { key: "1:1", w: 28, h: 28 }, { key: "3:2", w: 34, h: 24 },
    { key: "2:3", w: 24, h: 34 }, { key: "16:9", w: 38, h: 24 },
    { key: "4:3", w: 34, h: 28 }, { key: "3:4", w: 28, h: 34 },
    { key: "9:16", w: 24, h: 38 },
  ]
  return (
    <Section title="参数调节下拉面板" desc="select-card 触发按钮 + dropdown-panel 下拉面板（非弹窗）。面板内含清晰度/尺寸/张数等参数区。用于参数组合选择。">
      <div className="relative w-full max-w-sm">
        {/* Trigger */}
        <button onClick={() => setOpen(!open)}
          className="w-full h-[58px] px-3 border rounded-xl flex flex-col justify-center gap-0.5 text-left transition-colors bg-white hover:border-[var(--brand-primary)]"
          style={{ borderColor: open ? "var(--brand-primary)" : "var(--border-base)" }}>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>参数</span>
          <strong className="text-[13px] truncate" style={{ color: "var(--text-title)" }}>
            {resolution} · {ratio} · 高画质 · {count} 张
          </strong>
        </button>
        {/* Dropdown Panel */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 p-3 border rounded-[18px] space-y-4 shadow-lg"
              style={{ background: "var(--white)", borderColor: "var(--border-base)", width: "460px", boxShadow: "var(--shadow-card-hover)" }}>
              {/* 清晰度 */}
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>清晰度</h4>
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-[14px]" style={{ background: "var(--gray-100)" }}>
                  {resolutions.map((r) => (
                    <button key={r} onClick={() => setResolution(r)}
                      className="h-11 rounded-xl text-sm font-bold transition-all"
                      style={resolution === r
                        ? { background: "var(--white)", color: "var(--text-title)", boxShadow: "var(--shadow-card)" }
                        : { color: "var(--text-secondary)" }}>{r}</button>
                  ))}
                </div>
              </div>
              {/* 图片尺寸 */}
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>图片尺寸</h4>
                <div className="grid grid-cols-4 gap-2 p-1.5 rounded-[14px]" style={{ background: "var(--gray-100)" }}>
                  {ratios.map((r) => (
                    <button key={r.key} onClick={() => setRatio(r.key)}
                      className="min-h-[80px] flex flex-col items-center justify-center gap-2 rounded-xl transition-all"
                      style={ratio === r.key
                        ? { background: "var(--white)", boxShadow: "var(--shadow-card)", color: "var(--brand-primary)" }
                        : { color: "var(--text-secondary)" }}>
                      <span className="block border-2 rounded" style={{
                        width: r.w, height: r.h,
                        borderColor: ratio === r.key ? "var(--brand-primary)" : "var(--gray-300)"
                      }} />
                      <span className="text-[13px] font-bold">{r.key}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* 图片张数 */}
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-title)" }}>图片张数</h4>
                <div className="inline-grid grid-cols-9 gap-1.5 p-1.5 rounded-[14px]" style={{ background: "var(--gray-100)" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button key={n} onClick={() => setCount(n)}
                      className="w-[46px] h-[46px] grid place-items-center text-sm font-bold rounded-xl transition-all"
                      style={count === n
                        ? { background: "var(--white)", color: "var(--text-title)", boxShadow: "var(--shadow-card)" }
                        : { color: "var(--text-secondary)" }}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Section>
  )
}

/* ── Checkbox：复选（参数选择）── */
function CheckboxGroup() {
  const options = ["保留原始构图", "智能优化色彩", "自动修复瑕疵", "生成多角度视图"]
  const [checked, setChecked] = useState(["保留原始构图", "智能优化色彩"])
  function toggle(opt) { setChecked((prev) => prev.includes(opt) ? prev.filter((c) => c !== opt) : [...prev, opt]) }
  return (
    <Section title="复选 Checkbox · 参数选择" desc="用于非互斥的多选场景，如生成选项、功能开关组合。">
      <div className="bg-white rounded-xl border p-5 max-w-md space-y-3" style={{ borderColor: "var(--border-base)" }}>
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-3 py-1.5 cursor-pointer group">
            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
              style={checked.includes(opt) ? { background: "var(--brand-primary)", borderColor: "var(--brand-primary)" } : { borderColor: "var(--gray-300)" }}>
              {checked.includes(opt) && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              )}
            </div>
            <input type="checkbox" className="hidden" checked={checked.includes(opt)} onChange={() => toggle(opt)} />
            <span className="text-sm" style={{ color: "var(--text-body)" }}>{opt}</span>
          </label>
        ))}
      </div>
    </Section>
  )
}

/* ── Select ── */
function SelectDropdown() {
  const [value, setValue] = useState("doubao")
  const options = [
    { value: "wan", label: "Wan 2.7 Image Pro" },
    { value: "gemini", label: "Gemini 3 Pro" },
    { value: "doubao", label: "Doubao Seedream 5.0" },
    { value: "gpt", label: "GPT Image 2" },
  ]
  return (
    <Section title="下拉选择 Select" desc="选项较多时的单选，如模型切换、分类筛选。高 40px、8px 圆角、灰色边框。">
      <div className="bg-white rounded-xl border p-5 max-w-sm" style={{ borderColor: "var(--border-base)" }}>
        <select value={value} onChange={(e) => setValue(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border text-sm outline-none transition-colors bg-white cursor-pointer"
          style={{ borderColor: "var(--border-base)", color: "var(--text-body)" }}
          onFocus={(e) => { e.target.style.borderColor = "var(--brand-primary)" }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border-base)" }}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </Section>
  )
}

/* ── Switch ── */
function SwitchToggle() {
  const [on, setOn] = useState(true)
  return (
    <Section title="开关 Switch" desc="布尔值切换，如启用/禁用某项功能。">
      <div className="bg-white rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: "var(--border-base)" }}>
        <button onClick={() => setOn(!on)}
          className="relative w-11 h-6 rounded-full transition-colors duration-200"
          style={{ background: on ? "var(--brand-primary)" : "var(--gray-300)" }}>
          <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
            style={{ left: on ? "22px" : "2px" }} />
        </button>
        <span className="text-sm" style={{ color: "var(--text-body)" }}>{on ? "已启用" : "已禁用"}</span>
      </div>
    </Section>
  )
}

/* ── Tabs + Segmented Control ── */
function TabsSegment() {
  const [tab, setTab] = useState("expert")
  const tabs = [
    { key: "expert", label: "专家模式" }, { key: "text", label: "一键改字" },
    { key: "replace", label: "主体替换" }, { key: "refine", label: "产品微调" },
  ]
  const [seg, setSeg] = useState("square")
  const segs = [
    { key: "square", label: "1:1 方图" }, { key: "horizontal", label: "16:9 横图" }, { key: "vertical", label: "9:16 竖图" },
  ]
  return (
    <Section title="Tabs · 标签页 & 分段控件" desc="Tabs 用于页面/面板级视图切换；分段控件用于互斥模式/参数选择（禁止彩色边框、彩色选中底）。">
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>页面级 Tabs · 蓝色下划线选中态</div>
          <div className="flex border-b" style={{ borderColor: "var(--border-base)" }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                style={tab === t.key
                  ? { color: "var(--brand-primary)", borderColor: "var(--brand-primary)" }
                  : { color: "var(--text-secondary)", borderColor: "transparent" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-disabled)" }}>分段控件 · 灰色底槽 + 白色选中项</div>
          <div className="inline-flex rounded-xl p-1 gap-1" style={{ background: "var(--gray-100)" }}>
            {segs.map((s) => (
              <button key={s.key} onClick={() => setSeg(s.key)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={seg === s.key
                  ? { background: "var(--white)", color: "var(--brand-primary)", boxShadow: "var(--shadow-card)" }
                  : { color: "var(--text-secondary)" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ── Slider ── */
function SliderBar() {
  const [val, setVal] = useState(50)
  return (
    <Section title="滑块 Slider" desc="连续值调整，如强度、数量参数。">
      <div className="bg-white rounded-xl border p-5 max-w-sm space-y-3" style={{ borderColor: "var(--border-base)" }}>
        <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>0</span><span>强度：{val}</span><span>100</span>
        </div>
        <input type="range" min="0" max="100" value={val} onChange={(e) => setVal(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "var(--brand-primary)" }} />
      </div>
    </Section>
  )
}

/* ── Upload ── */
function UploadZone() {
  return (
    <Section title="上传入口 Upload" desc="图片/文件上传区域。高 88px、8px 圆角、白底虚线边框。Hover 边框变蓝。">
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border-base)" }}>
        <div className="max-w-md h-[88px] rounded-lg border border-dashed flex items-center gap-4 px-5 cursor-pointer transition-colors"
          style={{ borderColor: "var(--border-base)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-primary)"; e.currentTarget.style.background = "var(--brand-primary-soft)" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-base)"; e.currentTarget.style.background = "" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--brand-primary-soft)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              style={{ color: "var(--brand-primary)" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-title)" }}>点击或拖拽上传图片</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>支持 JPG、PNG、WebP 格式，最大 20MB</div>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ── Progress ── */
function ProgressBar() {
  const [pct, setPct] = useState(68)
  return (
    <Section title="进度条 Progress" desc="任务进度展示，蓝色填充 + 灰色底槽。">
      <div className="bg-white rounded-xl border p-5 max-w-sm space-y-4" style={{ borderColor: "var(--border-base)" }}>
        <div>
          <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
            <span>正在生成...</span><span>{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-200)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "var(--brand-primary)" }} />
          </div>
        </div>
        <div className="text-xs" style={{ color: "var(--text-disabled)" }}>拖动模拟：</div>
        <input type="range" min="0" max="100" value={pct} onChange={(e) => setPct(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "var(--brand-primary)" }} />
      </div>
    </Section>
  )
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <Section title="空状态 Empty State" desc="所有列表/数据区必须处理。线性图标(32px) + 说明文字 + 引导动作。">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: "○", title: "暂无可用模型", desc: "请联系管理员配置模型", action: "刷新" },
          { icon: "□", title: "还没有生成记录", desc: "去生图工具开始创作", action: "去生图工具" },
          { icon: "△", title: "还没有素材", desc: "上传图片或提示词开始管理", action: "上传素材" },
          { icon: "◇", title: "没有找到相关内容", desc: "尝试调整筛选条件", action: "清除筛选" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border-dashed border p-8 flex flex-col items-center text-center gap-3"
            style={{ borderColor: "var(--border-base)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
              style={{ color: "var(--text-disabled)", background: "var(--gray-50)" }}>{item.icon}</div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-title)" }}>{item.title}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.desc}</div>
            <button className="h-8 px-4 rounded-lg text-sm font-medium border bg-white transition-colors hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]"
              style={{ color: "var(--text-body)", borderColor: "var(--border-base)" }}>{item.action}</button>
          </div>
        ))}
      </div>
    </Section>
  )
}
