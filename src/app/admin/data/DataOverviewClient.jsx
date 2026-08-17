"use client"

import { useEffect, useState } from "react"
import {
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  X,
} from "lucide-react"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import {
  analysisThemes,
  dataSnapshot,
  featureTaskRows,
  organizationPlaceholders,
  organizationScopeOptions,
} from "@/data/demo/data-intelligence"

const numberFormatter = new Intl.NumberFormat("zh-CN")
const emptyValue = "--"
const controlClass = "h-10 w-full rounded-lg border bg-white px-3 text-sm text-[var(--text-body)] outline-none"

const statusStyles = {
  success: { color: "var(--success)", bg: "var(--success-bg)" },
  canceled: { color: "var(--gray-500)", bg: "var(--gray-100)" },
  failed: { color: "var(--danger)", bg: "var(--danger-bg)" },
  pending: { color: "var(--info)", bg: "var(--info-bg)" },
}

function formatNumber(value, decimals = 0) {
  if (value == null || value === emptyValue) return emptyValue
  if (decimals) return Number(value).toFixed(decimals)
  return numberFormatter.format(value)
}

function formatPercent(value) {
  if (value == null || value === emptyValue) return emptyValue
  return `${Number(value).toFixed(1)}%`
}

function getScopeType(scope) {
  if (scope.length === 1) return "company"
  if (scope.at(-1).startsWith("人员")) return "person"
  return "department"
}

function getThemeMetrics(theme, source, hasSnapshot, isAllFeatures) {
  const tasks = source?.tasks ?? dataSnapshot.tasks
  const users = source?.users ?? dataSnapshot.taskUsers
  const failed = source?.failed ?? dataSnapshot.failedTasks
  const coverage = source?.coverageRate ?? dataSnapshot.coverageRate
  const successRate = source?.successRate ?? dataSnapshot.successRate
  const available = (value, formatter = formatNumber) => hasSnapshot ? formatter(value) : emptyValue

  if (theme === "usage") return [
    { label: "实际生图用户", value: available(users), note: "至少发起过 1 次任务" },
    { label: "用户覆盖率", value: available(coverage, formatPercent), note: "实际生图用户 / 注册用户" },
    { label: "任务提交数", value: available(tasks), note: "按快照任务记录统计" },
    { label: "人均任务数", value: available(users ? tasks / users : 0, (value) => formatNumber(value, 2)), note: "任务数 / 实际生图用户" },
  ]
  if (theme === "quality") return [
    { label: "任务提交数", value: available(tasks), note: "成功、失败、取消及未完成" },
    { label: "任务成功率", value: available(successRate, formatPercent), note: "成功任务 / 全部任务" },
    { label: "失败任务", value: available(failed), note: "失败率按当前范围计算" },
    { label: "结果采纳率", value: emptyValue, note: "采纳事件字段待验收" },
  ]
  if (theme === "cost") {
    const costAvailable = hasSnapshot && isAllFeatures
    return [
      { label: "积分消耗", value: costAvailable ? formatNumber(dataSnapshot.points.primary) : emptyValue, note: "任务快照主口径" },
      { label: "平均每任务积分", value: costAvailable ? formatNumber(dataSnapshot.points.averagePerTask, 2) : emptyValue, note: "累计积分 / 累计任务" },
      { label: "单成功任务积分", value: costAvailable ? formatNumber(dataSnapshot.points.primary / dataSnapshot.successfulTasks, 2) : emptyValue, note: "累计积分 / 成功任务" },
      { label: "单有效产出成本", value: emptyValue, note: "等待结果采纳事件" },
    ]
  }
  if (theme === "assets") return [
    { label: "加入素材库", value: emptyValue, note: "资产沉淀事件待验收" },
    { label: "素材复用次数", value: emptyValue, note: "复用事件待验收" },
    { label: "素材复用率", value: emptyValue, note: "复用口径待确认" },
    { label: "继续编辑次数", value: emptyValue, note: "历史编辑事件待验收" },
  ]
  if (theme === "details") return [
    { label: "任务记录", value: available(tasks), note: "快照任务总量" },
    { label: "任务用户", value: available(users), note: "快照去重用户数" },
    { label: "结果记录", value: emptyValue, note: "结果表串联待验收" },
    { label: "采纳动作", value: emptyValue, note: "采纳事件待验收" },
  ]
  return [
    { label: "核心活跃用户", value: available(users), note: `目标用户渗透率 ${hasSnapshot ? formatPercent(coverage) : emptyValue}` },
    { label: "任务提交数", value: available(tasks), note: `成功率 ${hasSnapshot ? formatPercent(successRate) : emptyValue}` },
    { label: "结果采纳率", value: emptyValue, note: "按成功采纳动作去重" },
    { label: "积分消耗", value: hasSnapshot && isAllFeatures ? formatNumber(dataSnapshot.points.primary) : emptyValue, note: "单有效产出成本 --" },
  ]
}

export default function DataOverviewClient() {
  const [theme, setTheme] = useState("overview")
  const [timeRange, setTimeRange] = useState("snapshot")
  const [featureName, setFeatureName] = useState("all")
  const [scope, setScope] = useState(["全公司"])
  const [mode, setMode] = useState("department")
  const [definitionOpen, setDefinitionOpen] = useState(false)

  useEffect(() => {
    if (!definitionOpen) return undefined
    const closeOnEscape = (event) => event.key === "Escape" && setDefinitionOpen(false)
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [definitionOpen])

  const themeInfo = analysisThemes.find((item) => item.key === theme)
  const scopeType = getScopeType(scope)
  const currentScope = scope.at(-1)
  const selectedFeature = featureName === "all"
    ? null
    : featureTaskRows.find((row) => row.name === featureName)
  const hasSnapshot = timeRange === "snapshot" && scopeType === "company"
  const metrics = getThemeMetrics(theme, selectedFeature, hasSnapshot, featureName === "all")
  const visibleFeatureRows = selectedFeature ? [selectedFeature] : featureTaskRows
  const organizationRows = scopeType === "person"
    ? [currentScope]
    : mode === "person"
      ? organizationPlaceholders.person
      : scopeType === "company"
        ? organizationPlaceholders.company
        : organizationPlaceholders.department
  const selectedScopeKey = organizationScopeOptions.find((option) => option.path.join("/") === scope.join("/"))?.key ?? "company"

  function setAnalysisTheme(nextTheme) {
    setTheme(nextTheme)
  }

  function selectScope(scopeKey) {
    const nextScope = organizationScopeOptions.find((option) => option.key === scopeKey)
    if (!nextScope) return
    setScope(nextScope.path)
    setMode(nextScope.type === "person" ? "person" : "department")
  }

  function returnToScope(index) {
    const nextPath = scope.slice(0, index + 1)
    setScope(nextPath)
    setMode("department")
  }

  return (
    <PageShell
      pathname="/admin/data"
      description={`截至 ${dataSnapshot.date} 累计数据 · 企业历史快照`}
      actions={(
        <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-medium text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
          <LockKeyhole size={15} className="text-[var(--brand-primary)]" />仅系统管理员可访问 · 当前范围：{currentScope}
        </span>
      )}
    >
      <div className="min-w-0 space-y-4">
        <section className="rounded-lg border bg-white p-4" style={{ borderColor: "var(--border-base)" }} aria-label="查询条件">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_minmax(220px,1fr)_minmax(220px,1fr)_180px]">
            <FilterField label="时间范围">
              <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} className={controlClass} style={{ borderColor: "var(--border-base)" }}>
                <option value="snapshot">累计至 {dataSnapshot.date}</option>
                <option value="30d">近30天</option>
                <option value="7d">近7天</option>
                <option value="month">本月</option>
              </select>
            </FilterField>
            <FilterField label="数据范围">
              <select value={selectedScopeKey} onChange={(event) => selectScope(event.target.value)} className={controlClass} style={{ borderColor: "var(--border-base)" }}>
                {organizationScopeOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </FilterField>
            <FilterField label="功能">
              <select value={featureName} onChange={(event) => setFeatureName(event.target.value)} className={controlClass} style={{ borderColor: "var(--border-base)" }}>
                <option value="all">全部功能</option>
                {featureTaskRows.map((row) => <option key={row.name} value={row.name}>{row.name}</option>)}
              </select>
            </FilterField>
            <FilterField label="模型">
              <select value="all" onChange={() => {}} className={controlClass} style={{ borderColor: "var(--border-base)" }} aria-label="模型">
                <option value="all">全部模型</option>
              </select>
            </FilterField>
          </div>
          <div className="mt-3 border-t pt-3 text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-light)" }}>统计起始：-- · 最近更新：{dataSnapshot.date}</div>
        </section>

        <ThemeTabs activeTheme={theme} onChange={setAnalysisTheme} />

        <section className="flex flex-col gap-2 rounded-lg bg-[var(--gray-50)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="当前数据范围">
          <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm" aria-label="报表范围">
            {scope.map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-1">
                {index > 0 && <ChevronRight size={14} className="text-[var(--text-disabled)]" />}
                <button type="button" disabled={index === scope.length - 1} onClick={() => returnToScope(index)} className={`min-h-8 rounded-md px-2 font-medium ${index === scope.length - 1 ? "text-[var(--text-title)]" : "text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]"}`}>{item}</button>
              </span>
            ))}
          </nav>
          <span className="text-xs text-[var(--text-secondary)]">{scopeType === "company" ? "企业视图 · 全公司汇总" : scopeType === "department" ? `部门视图 · ${currentScope}汇总` : `个人视图 · ${currentScope}汇总`}</span>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="当前范围核心指标">
          {metrics.map((metric) => (
            <article key={metric.label} className="min-w-0 rounded-lg border bg-white p-4" style={{ borderColor: "var(--border-base)" }}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-[var(--text-secondary)]">{metric.label}</span><button type="button" onClick={() => setDefinitionOpen(true)} aria-label={`查看${metric.label}口径`} title="查看指标口径" className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--text-disabled)] hover:bg-[var(--gray-50)] hover:text-[var(--brand-primary)]"><CircleHelp size={15} /></button></div>
              <strong className="mt-3 block text-[28px] font-semibold leading-none text-[var(--text-title)] tabular-nums">{metric.value}</strong>
              <span className="mt-2 block min-h-5 text-xs leading-5 text-[var(--text-secondary)]">{metric.note}</span>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.75fr)]" aria-label="趋势与构成">
          <TrendPlaceholder title={`${currentScope}${themeInfo.label}趋势`} />
          <BreakdownPanel theme={theme} hasSnapshot={hasSnapshot} feature={selectedFeature} scopeType={scopeType} />
        </section>

        {theme === "overview"
          ? <OrganizationRanking currentScope={currentScope} scopeType={scopeType} mode={mode} rows={organizationRows} onModeChange={setMode} />
          : <FeatureAnalysisTable theme={theme} rows={hasSnapshot ? visibleFeatureRows : visibleFeatureRows.map((row) => ({ ...row, unavailable: true }))} />}

        <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,145px),1fr))] overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }} aria-label="六类分析主题说明">
          {analysisThemes.map((item) => (
            <button key={item.key} type="button" onClick={() => setAnalysisTheme(item.key)} aria-pressed={theme === item.key} className={`min-h-[72px] border-b border-r px-3 py-3 text-left transition-colors hover:bg-[var(--gray-50)] ${theme === item.key ? "bg-[var(--brand-primary-soft)]" : "bg-white"}`} style={{ borderColor: "var(--border-light)" }}>
              <span className={`block text-xs ${theme === item.key ? "font-semibold text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"}`}>{item.label}</span>
              <strong className="mt-1 block text-sm font-medium text-[var(--text-title)]">{item.summary}</strong>
            </button>
          ))}
        </section>
      </div>

      {definitionOpen && <MetricDefinitionDialog onClose={() => setDefinitionOpen(false)} />}
    </PageShell>
  )
}

function ThemeTabs({ activeTheme, onChange }) {
  return (
    <nav className="grid grid-cols-3 border-b sm:flex" style={{ borderColor: "var(--border-base)" }} aria-label="分析主题" role="tablist">
      {analysisThemes.map((item) => (
        <button key={item.key} type="button" role="tab" aria-selected={activeTheme === item.key} onClick={() => onChange(item.key)} className={`relative min-h-11 px-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${activeTheme === item.key ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-title)]"}`}>
          {item.label}<span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--brand-primary)] transition-opacity ${activeTheme === item.key ? "opacity-100" : "opacity-0"}`} />
        </button>
      ))}
    </nav>
  )
}

function FilterField({ label, children }) {
  return <label className="min-w-0"><span className="mb-1.5 block text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>{children}</label>
}

function TrendPlaceholder({ title }) {
  return (
    <article className="min-w-0 rounded-lg border bg-white p-4" style={{ borderColor: "var(--border-base)" }}>
      <SectionHeading title={title} meta="活跃用户 / 任务提交" />
      <div className="mt-4 grid h-48 grid-cols-[24px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_24px]" role="img" aria-label={`${title}暂无日期序列`}>
        <div className="flex flex-col justify-between pb-1 text-[10px] text-[var(--text-disabled)]"><span>高</span><span>中</span><span>低</span><span>0</span></div>
        <div className="relative border-b border-l" style={{ borderColor: "var(--border-base)", backgroundImage: "linear-gradient(to bottom, transparent calc(25% - 1px), var(--border-light) 25%, transparent calc(25% + 1px), transparent calc(50% - 1px), var(--border-light) 50%, transparent calc(50% + 1px), transparent calc(75% - 1px), var(--border-light) 75%, transparent calc(75% + 1px))" }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl font-semibold text-[var(--text-disabled)]">--</strong><span className="mt-1 text-xs text-[var(--text-secondary)]">当前快照无日期序列</span></div>
        </div>
        <span />
        <div className="grid grid-cols-4 pt-2 text-center text-[10px] text-[var(--text-disabled)]"><span>--</span><span>--</span><span>--</span><span>--</span></div>
      </div>
    </article>
  )
}

function BreakdownPanel({ theme, hasSnapshot, feature, scopeType }) {
  const sourceStatuses = feature
    ? [
        { key: "success", label: "成功", value: feature.success, rate: feature.successRate },
        { key: "canceled", label: "取消", value: feature.canceled, rate: feature.tasks ? feature.canceled / feature.tasks * 100 : 0 },
        { key: "failed", label: "失败", value: feature.failed, rate: feature.tasks ? feature.failed / feature.tasks * 100 : 0 },
        { key: "pending", label: "未完成", value: feature.pending, rate: feature.tasks ? feature.pending / feature.tasks * 100 : 0 },
      ]
    : dataSnapshot.taskStatuses
  let title = scopeType === "company" ? "部门贡献分布" : scopeType === "department" ? "下级对象贡献分布" : "当前人员指标构成"
  let meta = "当前数据范围下的统计分布"
  let rows = (scopeType === "company"
    ? organizationPlaceholders.company
    : scopeType === "department"
      ? organizationPlaceholders.department
      : ["使用", "任务质量", "积分成本", "资产复用"]
  ).slice(0, 4).map((label) => ({ label, value: null }))

  if (theme === "usage") {
    title = "功能用户分布"
    meta = "按实际生图用户排序"
    rows = [...featureTaskRows].sort((left, right) => right.users - left.users).slice(0, 4).map((row) => ({ label: row.name, value: hasSnapshot ? row.users : null }))
  } else if (theme === "quality") {
    title = "任务状态构成"
    meta = "按最终任务状态"
    rows = sourceStatuses.map((row) => ({ ...row, value: hasSnapshot ? row.value : null }))
  } else if (theme === "cost") {
    title = "功能积分消耗"
    meta = "功能积分字段待验收"
    rows = featureTaskRows.slice(0, 4).map((row) => ({ label: row.name, value: null }))
  } else if (theme === "assets") {
    title = "资产复用分布"
    meta = "资产事件字段待验收"
    rows = ["素材入库", "素材复用", "继续编辑", "模板使用"].map((label) => ({ label, value: null }))
  } else if (theme === "details") {
    title = "功能任务分布"
    meta = "按快照任务数排序"
    rows = featureTaskRows.slice(0, 4).map((row) => ({ label: row.name, value: hasSnapshot ? row.tasks : null }))
  }
  const maxValue = Math.max(1, ...rows.map((row) => row.value || 0))

  return (
    <article className="min-w-0 rounded-lg border bg-white p-4" style={{ borderColor: "var(--border-base)" }}>
      <SectionHeading title={title} meta={meta} />
      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const statusStyle = row.key ? statusStyles[row.key] : null
          return (
            <div key={row.label} className="grid grid-cols-[minmax(82px,120px)_minmax(70px,1fr)_52px] items-center gap-2 text-xs">
              <span className="truncate text-[var(--text-body)]" title={row.label}>{row.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full" style={{ width: row.value == null ? 0 : `${Math.max(1, row.value / maxValue * 100)}%`, background: statusStyle?.color || "var(--brand-primary)" }} /></span>
              <strong className="text-right text-[var(--text-title)] tabular-nums">{row.value == null ? emptyValue : formatNumber(row.value)}</strong>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function OrganizationRanking({ currentScope, scopeType, mode, rows, onModeChange }) {
  const title = scopeType === "person"
    ? `${currentScope} · 当前人员数据`
    : `${currentScope} · ${mode === "person" ? "按人员统计" : "按部门统计"}`
  return (
    <section className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }} aria-labelledby="organization-ranking-title">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-base)" }}>
        <div><h2 id="organization-ranking-title" className="text-base font-semibold text-[var(--text-title)]">{title}</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">当前范围统计对象汇总</p></div>
        {scopeType !== "person" && <SegmentedControl value={mode} onChange={onModeChange} />}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-[var(--gray-50)] text-xs font-semibold text-[var(--text-secondary)]"><tr><th className="px-4 py-3 text-left">{mode === "person" ? "人员" : "部门"}</th><th className="px-3 py-3 text-right">核心活跃</th><th className="px-3 py-3 text-right">任务数</th><th className="px-3 py-3 text-right">成功率</th><th className="px-3 py-3 text-right">采纳率</th><th className="px-3 py-3 text-right">积分消耗</th><th className="px-4 py-3 text-right">单有效产出成本</th></tr></thead>
          <tbody>{rows.map((name) => <OrganizationRow key={name} name={name} />)}</tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 md:hidden">{rows.map((name) => <OrganizationCard key={name} name={name} />)}</div>
    </section>
  )
}

function OrganizationRow({ name }) {
  return <tr className="border-t hover:bg-[var(--gray-25)]" style={{ borderColor: "var(--border-light)" }}><td className="px-4 py-3"><span className="font-medium text-[var(--text-title)]">{name}</span></td>{Array.from({ length: 6 }, (_, index) => <td key={index} className="px-3 py-3 text-right text-[var(--text-secondary)] tabular-nums">--</td>)}</tr>
}

function OrganizationCard({ name }) {
  return <article className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><strong className="text-sm text-[var(--text-title)]">{name}</strong><dl className="mt-3 grid grid-cols-3 gap-3 border-t pt-3" style={{ borderColor: "var(--border-light)" }}>{["核心活跃", "任务数", "成功率", "采纳率", "积分消耗", "有效产出成本"].map((label) => <div key={label}><dt className="text-[10px] text-[var(--text-secondary)]">{label}</dt><dd className="mt-1 text-sm font-medium text-[var(--text-title)]">--</dd></div>)}</dl></article>
}

function SegmentedControl({ value, onChange }) {
  return <div className="inline-flex w-fit rounded-lg bg-[var(--gray-100)] p-1" aria-label="统计对象">{[{ key: "department", label: "按部门统计" }, { key: "person", label: "按人员统计" }].map((option) => <button key={option.key} type="button" onClick={() => onChange(option.key)} aria-pressed={value === option.key} className={`min-h-8 rounded-md px-3 text-xs font-medium transition-colors ${value === option.key ? "bg-white text-[var(--text-title)] shadow-sm" : "text-[var(--text-secondary)]"}`}>{option.label}</button>)}</div>
}

function FeatureAnalysisTable({ theme, rows }) {
  const definitions = {
    usage: [{ key: "users", label: "活跃用户", format: formatNumber }, { key: "tasks", label: "任务数", format: formatNumber }, { key: "coverageRate", label: "用户覆盖率", format: formatPercent }, { key: "successRate", label: "成功率", format: formatPercent }, { key: "placeholder", label: "采纳率" }],
    quality: [{ key: "tasks", label: "任务数", format: formatNumber }, { key: "success", label: "成功", format: formatNumber }, { key: "failed", label: "失败", format: formatNumber }, { key: "canceled", label: "取消", format: formatNumber }, { key: "pending", label: "未完成", format: formatNumber }, { key: "successRate", label: "成功率", format: formatPercent }],
    cost: [{ key: "tasks", label: "任务数", format: formatNumber }, { key: "placeholder", label: "积分消耗" }, { key: "placeholder2", label: "平均每任务积分" }, { key: "placeholder3", label: "单成功任务积分" }, { key: "placeholder4", label: "单有效产出成本" }],
    assets: [{ key: "placeholder", label: "加入素材库" }, { key: "placeholder2", label: "复用次数" }, { key: "placeholder3", label: "复用率" }, { key: "placeholder4", label: "继续编辑" }],
    details: [{ key: "tasks", label: "任务数", format: formatNumber }, { key: "users", label: "用户数", format: formatNumber }, { key: "success", label: "成功", format: formatNumber }, { key: "failed", label: "失败", format: formatNumber }, { key: "canceled", label: "取消", format: formatNumber }, { key: "pending", label: "未完成", format: formatNumber }],
  }
  const columns = definitions[theme] || definitions.details
  const themeLabel = analysisThemes.find((item) => item.key === theme)?.label
  const orderedRows = theme === "usage" ? [...rows].sort((left, right) => right.users - left.users) : rows
  return (
    <section className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border-base)" }} aria-labelledby="feature-analysis-title">
      <div className="border-b p-4" style={{ borderColor: "var(--border-base)" }}><h2 id="feature-analysis-title" className="text-base font-semibold text-[var(--text-title)]">{themeLabel} · 功能表现</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">功能名称按快照原始标识展示，暂无字段统一显示 --</p></div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] border-collapse text-sm"><thead className="bg-[var(--gray-50)] text-xs font-semibold text-[var(--text-secondary)]"><tr><th className="px-4 py-3 text-left">功能</th>{columns.map((column) => <th key={column.key} className="px-3 py-3 text-right">{column.label}</th>)}</tr></thead><tbody>{orderedRows.map((row) => <tr key={row.name} className="border-t hover:bg-[var(--gray-25)]" style={{ borderColor: "var(--border-light)" }}><td className="px-4 py-3"><span className="font-medium text-[var(--text-title)]">{row.name}</span>{row.technical && <span className="ml-2 rounded-md bg-[var(--gray-100)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">技术标识</span>}</td>{columns.map((column) => <td key={column.key} className="px-3 py-3 text-right text-[var(--text-body)] tabular-nums">{row.unavailable || column.key.startsWith("placeholder") ? emptyValue : column.format(row[column.key])}</td>)}</tr>)}</tbody></table></div>
      <div className="space-y-3 p-3 md:hidden">{orderedRows.map((row) => <article key={row.name} className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><strong className="break-all text-sm text-[var(--text-title)]">{row.name}</strong><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--border-light)" }}>{columns.map((column) => <div key={column.key}><dt className="text-[10px] text-[var(--text-secondary)]">{column.label}</dt><dd className="mt-1 text-sm font-medium text-[var(--text-title)] tabular-nums">{row.unavailable || column.key.startsWith("placeholder") ? emptyValue : column.format(row[column.key])}</dd></div>)}</dl></article>)}</div>
    </section>
  )
}

function SectionHeading({ title, meta }) {
  return <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><h2 className="text-base font-semibold text-[var(--text-title)]">{title}</h2><span className="text-xs text-[var(--text-secondary)]">{meta}</span></div>
}

function MetricDefinitionDialog({ onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--overlay-scrim)] p-3 sm:p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[calc(100vh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-h-[calc(100vh-32px)]" role="dialog" aria-modal="true" aria-labelledby="metric-definition-title">
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5" style={{ borderColor: "var(--border-base)" }}><div><h2 id="metric-definition-title" className="text-lg font-semibold text-[var(--text-title)]">指标与数据口径</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">有快照数据则展示真实值，缺少字段统一显示 --。</p></div><button type="button" onClick={onClose} aria-label="关闭指标说明" title="关闭" className="flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><X size={18} /></button></div>
        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2"><DefinitionItem title="任务用户覆盖率" value="266 / 299 = 89.0%" description="实际发起过生图任务的用户数，占累计注册用户数的比例。" /><DefinitionItem title="平均每任务积分" value={`${formatNumber(dataSnapshot.points.primary)} / ${formatNumber(dataSnapshot.tasks)} = ${dataSnapshot.points.averagePerTask.toFixed(2)}`} description="以任务快照累计积分除以快照累计任务数。" /></div>
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--brand-primary-border)", background: "var(--brand-primary-soft)" }}><strong className="text-sm text-[var(--text-title)]">积分双口径</strong><p className="mt-1 text-xs leading-5 text-[var(--text-body)]">任务快照累计积分 <b>{formatNumber(dataSnapshot.points.primary)}</b> 为主数值；账号同步积分 <b>{formatNumber(dataSnapshot.points.accountSyncReference)}</b> 仅作参考，两者相差 <b>{formatNumber(dataSnapshot.points.difference)}</b>。当前材料不足以解释差异。</p></div>
          <div><h3 className="text-sm font-semibold text-[var(--text-title)]">当前显示规则</h3><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">快照不含日期序列、组织、模型、结果采纳、耗时、失败原因和资产复用字段；相关结构保留用于评审，数值显示 --，不作为已获得数据。</p></div>
          <p className="border-t pt-3 text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-light)" }}>来源：{dataSnapshot.source}</p>
        </div>
        <div className="flex justify-end border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border-base)" }}><Button size="lg" onClick={onClose}>知道了</Button></div>
      </section>
    </div>
  )
}

function DefinitionItem({ title, value, description }) {
  return <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><span className="text-xs font-medium text-[var(--text-secondary)]">{title}</span><strong className="mt-2 block text-base text-[var(--text-title)] tabular-nums">{value}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p></div>
}
