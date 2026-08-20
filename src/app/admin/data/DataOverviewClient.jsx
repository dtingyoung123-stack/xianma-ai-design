"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Coins,
  Database,
  Gauge,
  Layers3,
  LockKeyhole,
  MousePointerClick,
  Repeat2,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import {
  analysisThemes,
  assetScopeRows,
  departmentUsageRows,
  featureTaskRows,
  personInsightRows,
  personPointsRows,
  pointsTrendRows,
  reportDemoData,
  teamAssetRows,
  topMaterialRows,
  topPromptRows,
} from "@/data/demo/data-intelligence"
import { organizationTree } from "@/data/demo/admin"

const numberFormatter = new Intl.NumberFormat("zh-CN")
const controlClass = "h-10 w-full rounded-lg border bg-white px-3 text-sm text-[var(--text-body)] outline-none transition-colors focus-visible:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
const dayMilliseconds = 24 * 60 * 60 * 1000

const statusStyles = {
  success: { color: "var(--success)", bg: "var(--success-bg)" },
  canceled: { color: "var(--gray-500)", bg: "var(--gray-100)" },
  failed: { color: "var(--danger)", bg: "var(--danger-bg)" },
  pending: { color: "var(--info)", bg: "var(--info-bg)" },
}

function flattenOrganizations(nodes, depth = 0, ancestorIds = [], ancestorNames = []) {
  return nodes.flatMap((node) => [
    {
      ...node,
      children: node.children || [],
      depth,
      ancestorIds,
      path: [...ancestorNames, node.name].join(" / "),
    },
    ...flattenOrganizations(
      node.children || [],
      depth + 1,
      [...ancestorIds, node.id],
      [...ancestorNames, node.name],
    ),
  ])
}

const reportOrganizationTree = [{ id: "company", name: "全公司", children: organizationTree }]
const reportScopeOptions = flattenOrganizations(reportOrganizationTree)
const reportScopeMap = Object.fromEntries(reportScopeOptions.map((scope) => [scope.id, scope]))
const timePresetOptions = [
  { value: "today", label: "今日" },
  { value: "last7", label: "近 7 天" },
  { value: "last30", label: "近 30 天" },
  { value: "custom", label: "自定义" },
]

function getTodayValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function shiftDateValue(value, days) {
  const [year, month, day] = value.split("-").map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

function parseDateValue(value) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDateValue(date, includeYear = false) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return includeYear ? `${year}/${month}/${day}` : `${month}/${day}`
}

function getTrendTimeBuckets(startDate, endDate) {
  const start = parseDateValue(startDate)
  const end = parseDateValue(endDate)
  const dayCount = Math.floor((end - start) / dayMilliseconds) + 1

  if (dayCount === 1) {
    return {
      granularity: "two-hour",
      granularityLabel: "每 2 小时",
      buckets: Array.from({ length: 12 }, (_, index) => {
        const startHour = index * 2
        const endHour = startHour + 1
        return {
          key: `${startDate}-${startHour}`,
          label: `${String(startHour).padStart(2, "0")}:00-${String(endHour).padStart(2, "0")}:59`,
        }
      }),
    }
  }

  if (dayCount <= 31) {
    return {
      granularity: "day",
      granularityLabel: "按日",
      buckets: Array.from({ length: dayCount }, (_, index) => {
        const date = new Date(start.getTime() + index * dayMilliseconds)
        return { key: date.toISOString().slice(0, 10), label: formatDateValue(date) }
      }),
    }
  }

  if (dayCount <= 180) {
    const buckets = []
    for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + 7 * dayMilliseconds)) {
      const bucketEnd = new Date(Math.min(cursor.getTime() + 6 * dayMilliseconds, end.getTime()))
      buckets.push({
        key: cursor.toISOString().slice(0, 10),
        label: `${formatDateValue(cursor)}-${formatDateValue(bucketEnd)}`,
      })
    }
    return { granularity: "week", granularityLabel: "按周", buckets }
  }

  const buckets = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  while (cursor <= end) {
    const year = cursor.getUTCFullYear()
    const month = cursor.getUTCMonth()
    buckets.push({ key: `${year}-${month + 1}`, label: `${year}/${String(month + 1).padStart(2, "0")}` })
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return { granularity: "month", granularityLabel: "按月", buckets }
}

function distributeTrendMetric(total, bucketCount, seed = 0) {
  if (!bucketCount) return []
  const weights = Array.from({ length: bucketCount }, (_, index) => 80 + ((index * 17 + seed * 11) % 41))
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)
  let allocated = 0
  return weights.map((weight, index) => {
    const value = index === bucketCount - 1 ? total - allocated : Math.floor(total * weight / weightTotal)
    allocated += value
    return value
  })
}

function createTimeRangeTrend(startDate, endDate, totals, seed = 0) {
  const definition = getTrendTimeBuckets(startDate, endDate)
  const points = distributeTrendMetric(totals.points, definition.buckets.length, seed)
  const uses = distributeTrendMetric(totals.uses, definition.buckets.length, seed + 1)
  const followupUsedResults = distributeTrendMetric(totals.followupUsedResults, definition.buckets.length, seed + 2)
  const rangeLabel = startDate === endDate ? formatDateValue(parseDateValue(startDate), true) : `${formatDateValue(parseDateValue(startDate), true)} - ${formatDateValue(parseDateValue(endDate), true)}`

  return {
    ...definition,
    rangeLabel: `${rangeLabel} · ${definition.granularityLabel}`,
    rows: definition.buckets.map((bucket, index) => ({
      ...bucket,
      points: points[index],
      uses: uses[index],
      followupUsedResults: followupUsedResults[index],
    })),
  }
}

function getPresetRange(preset, todayValue) {
  if (preset === "last7") return { startDate: shiftDateValue(todayValue, -6), endDate: todayValue }
  if (preset === "last30") return { startDate: shiftDateValue(todayValue, -29), endDate: todayValue }
  return { startDate: todayValue, endDate: todayValue }
}

function formatNumber(value, decimals = 0) {
  if (value == null) return "--"
  return decimals ? Number(value).toFixed(decimals) : numberFormatter.format(value)
}

function formatPercent(value) {
  return value == null ? "--" : `${Number(value).toFixed(1)}%`
}

function formatCompactNumber(value) {
  return value >= 10000 ? `${(value / 10000).toFixed(1)}万` : formatNumber(value)
}

function formatDuration(seconds) {
  if (seconds < 60) return `${formatNumber(seconds)} 秒`
  return `${formatNumber(seconds / 60, 1)} 分钟`
}

function getLayoutOffsetTop(element) {
  let offset = 0
  let current = element
  while (current) {
    offset += current.offsetTop
    current = current.offsetParent
  }
  return offset
}

function formatMetric(value, formatter = formatNumber, available = true) {
  return available && value != null ? formatter(value) : "暂无统计结果"
}

function getFeatureStatuses(feature) {
  if (!feature) return reportDemoData.taskStatuses
  if (feature.tasks == null) return null
  return [
    { key: "success", label: "成功", value: feature.success, rate: feature.successRate },
    { key: "canceled", label: "取消", value: feature.canceled, rate: feature.tasks ? feature.canceled / feature.tasks * 100 : 0 },
    { key: "failed", label: "失败", value: feature.failed, rate: feature.tasks ? feature.failed / feature.tasks * 100 : 0 },
    { key: "pending", label: "未完成", value: feature.pending, rate: feature.tasks ? feature.pending / feature.tasks * 100 : 0 },
  ]
}

function getMetrics(theme, feature) {
  const tasks = feature ? feature.tasks : reportDemoData.actualUses
  const users = feature ? feature.users : reportDemoData.taskUsers
  const success = feature ? feature.success : reportDemoData.successfulTasks
  const failed = feature ? feature.failed : reportDemoData.failedTasks
  const canceled = feature ? feature.canceled : reportDemoData.canceledTasks
  const successRate = feature ? feature.successRate : reportDemoData.successRate
  const coverageRate = feature ? feature.coverageRate : reportDemoData.coverageRate
  const hasUsageData = tasks != null
  const hasUserData = users != null
  const hasTaskData = success != null
  const isPrompt = feature?.measurement === "action"
  const duration = feature ? feature.averageDurationSeconds : reportDemoData.efficiency.averageDurationSeconds
  const actualUseNote = !feature ? "任务创建或核心动作成功" : isPrompt ? "生成、润色或反推成功" : "后台成功创建任务"
  const noDataNote = "当前暂无该功能数据"

  if (theme === "usage") return [
    { label: "实际使用用户", value: formatMetric(users, formatNumber, hasUserData), note: hasUserData ? "至少完成 1 次实际使用" : noDataNote, icon: Users, progress: hasUserData ? coverageRate : null, unavailable: !hasUserData },
    { label: "用户覆盖率", value: formatMetric(coverageRate, formatPercent, hasUserData), note: hasUserData ? (feature ? "该功能用户 / 注册用户" : `${formatNumber(users)} / ${formatNumber(reportDemoData.registeredUsers)} 名注册用户`) : noDataNote, icon: Gauge, progress: hasUserData ? coverageRate : null, unavailable: !hasUserData },
    { label: "实际使用次数", value: formatMetric(tasks, formatNumber, hasUsageData), note: hasUsageData ? actualUseNote : noDataNote, icon: ChartNoAxesColumnIncreasing, unavailable: !hasUsageData },
    { label: "人均使用次数", value: formatMetric(users ? tasks / users : null, (value) => formatNumber(value, 1), hasUsageData && hasUserData), note: hasUsageData && hasUserData ? "实际使用次数 / 实际使用用户" : noDataNote, icon: Activity, unavailable: !(hasUsageData && hasUserData) },
  ]

  if (theme === "efficiency") return [
    { label: isPrompt ? "成功动作" : "成功任务", value: formatMetric(success, formatNumber, hasTaskData), note: hasTaskData ? `成功率 ${formatPercent(successRate)}` : noDataNote, icon: CheckCircle2, tone: "success", unavailable: !hasTaskData },
    { label: isPrompt ? "取消动作" : "取消任务", value: formatMetric(canceled, formatNumber, hasTaskData), note: hasTaskData ? `占比 ${formatPercent(tasks ? canceled / tasks * 100 : 0)}` : noDataNote, icon: X, unavailable: !hasTaskData },
    { label: isPrompt ? "失败动作" : "失败任务", value: formatMetric(failed, formatNumber, hasTaskData), note: hasTaskData ? `占比 ${formatPercent(tasks ? failed / tasks * 100 : 0)}` : noDataNote, icon: AlertTriangle, tone: "danger", unavailable: !hasTaskData },
    { label: "平均处理时长", value: formatDuration(duration), note: isPrompt ? "单次核心动作平均耗时" : "从任务创建到完成", icon: Clock3 },
  ]

  if (theme === "points" && feature?.pointsMode === "free") return [
    { label: "积分规则", value: "不扣积分", note: "AI提示词核心动作不产生生图积分", icon: Coins },
    { label: "核心动作", value: formatNumber(feature.tasks), note: "生成、润色与反推", icon: ChartNoAxesColumnIncreasing },
    { label: "使用用户", value: formatNumber(feature.users), note: `覆盖率 ${formatPercent(feature.coverageRate)}`, icon: Users },
    { label: "人均使用", value: formatNumber(feature.tasks / feature.users, 1), note: "核心动作 / 使用用户", icon: Activity },
  ]

  if (theme === "points") return [
    { label: "消耗积分", value: formatNumber(feature ? feature.points : reportDemoData.points.consumed), note: feature ? `占总积分 ${formatPercent(feature.points / reportDemoData.points.consumed * 100)}` : "当前筛选范围内已结算扣减", icon: Coins },
    { label: "积分使用人数", value: formatNumber(feature ? feature.users : reportDemoData.points.users), note: "发生过积分扣减的去重用户", icon: Users },
    { label: "平均每次使用积分", value: formatNumber(feature ? feature.points / feature.tasks : reportDemoData.points.averagePerUse, 2), note: "消耗积分 / 扣积分使用次数", icon: Gauge },
    { label: "平均后续使用结果积分", value: formatNumber(feature ? feature.points / feature.followupUsedResults : reportDemoData.points.averagePerFollowupResult, 2), note: "消耗积分 / 后续使用结果数", icon: ChartNoAxesColumnIncreasing },
  ]

  if (theme === "assets") return [
    { label: "可用素材数", value: formatNumber(reportDemoData.assets.materials.available), note: `本期新增 ${formatNumber(reportDemoData.assets.materials.added)}`, icon: Layers3 },
    { label: "素材复用率", value: formatPercent(reportDemoData.assets.materials.usageRate), note: "被选入任务素材 / 可用素材", icon: Activity, progress: reportDemoData.assets.materials.usageRate },
    { label: "可用提示词数", value: formatNumber(reportDemoData.assets.prompts.available), note: `本期新增 ${formatNumber(reportDemoData.assets.prompts.added)}`, icon: Database },
    { label: "提示词使用率", value: formatPercent(reportDemoData.assets.prompts.usageRate), note: "被实际使用提示词 / 可用提示词", icon: Gauge, progress: reportDemoData.assets.prompts.usageRate },
  ]

  if (theme === "details") return [
    { label: "纳入统计功能", value: formatNumber(feature ? 1 : featureTaskRows.length), note: "与线上13个工具保持一致", icon: Layers3 },
    { label: "实际使用次数", value: formatMetric(tasks, formatNumber, hasUsageData), note: hasUsageData ? actualUseNote : noDataNote, icon: Database, unavailable: !hasUsageData },
    { label: "实际使用用户", value: formatMetric(users, formatNumber, hasUserData), note: hasUserData ? "当前范围去重用户数" : noDataNote, icon: Users, unavailable: !hasUserData },
    { label: isPrompt ? "动作成功率" : "任务成功率", value: formatMetric(successRate, formatPercent, hasTaskData), note: isPrompt ? "成功核心动作 / 全部动作" : hasTaskData ? "成功任务 / 全部任务" : noDataNote, icon: CheckCircle2, tone: "success", unavailable: !hasTaskData },
  ]

  return [
    { label: "实际使用用户", value: formatMetric(users, formatNumber, hasUserData), note: hasUserData ? `覆盖率 ${formatPercent(coverageRate)}` : noDataNote, icon: Users, progress: hasUserData ? coverageRate : null, unavailable: !hasUserData },
    { label: "实际使用次数", value: formatMetric(tasks, formatNumber, hasUsageData), note: hasUsageData ? actualUseNote : noDataNote, icon: ChartNoAxesColumnIncreasing, unavailable: !hasUsageData },
    { label: isPrompt ? "成功核心动作" : "成功任务", value: formatMetric(success, formatNumber, hasTaskData), note: hasTaskData ? `失败 ${formatNumber(failed)} · 取消 ${formatNumber(canceled)}` : noDataNote, icon: CheckCircle2, tone: "success", unavailable: !hasTaskData },
    { label: "积分消耗", value: feature?.pointsMode === "free" ? "不扣积分" : formatNumber(feature ? feature.points : reportDemoData.points.consumed), note: feature?.pointsMode === "free" ? "AI提示词不产生生图积分" : `平均每次使用 ${formatNumber(feature ? feature.points / feature.tasks : reportDemoData.points.averagePerUse, 2)}`, icon: Coins },
  ]
}

function getMetricDefinition(metric) {
  const definitions = {
    "实际使用用户": {
      meaning: "反映平台在所选范围内覆盖到的真实使用人群规模。人数增加说明更多用户已经从注册或访问转为实际使用，但还需结合人均使用次数判断是否形成持续使用。",
      rule: "同一用户重复使用只计 1 人；生图、视频和无限画布以实际创建任务为使用，AI提示词以完成生成、润色或反推为使用；仅访问页面不计入。",
      value: "结合实际使用次数判断平台是广泛覆盖还是集中在少数高频用户，不单独作为员工活跃度或绩效评价。",
    },
    "用户覆盖率": {
      meaning: "反映已注册用户中真正开始使用平台的比例。比例提升说明平台在现有用户中的实际触达更充分，但不表示所有岗位都必须达到相同水平。",
      rule: "用去重后的实际使用用户数除以注册用户数计算；统计范围随当前选择的时间、组织和功能变化。",
      value: "用于发现已注册但尚未形成实际使用的人群，辅助培训和推广；不表示所有岗位都必须使用平台。",
    },
    "实际使用次数": {
      meaning: "反映平台承载的实际工作量和各项能力的使用规模。次数增长说明平台参与业务工作的频率提高，但不等同于产出质量或业务价值同步提升。",
      rule: "生图、视频和无限画布每成功创建 1 个任务计 1 次；AI提示词每完成 1 次生成、润色或反推计 1 次；仅访问页面不计入。",
      value: "用于判断平台和各功能的实际使用规模，识别高频能力及使用结构；次数高不等于产出质量高。",
    },
    "人均使用次数": {
      meaning: "反映每名实际使用用户的平均使用深度。数值上升通常说明用户使用更频繁，但也可能受到少数高频用户影响，需要结合用户覆盖和分布一起判断。",
      rule: "用实际使用次数除以去重后的实际使用用户数计算；没有实际使用用户时不计算。",
      value: "用于区分一次性尝试与持续使用，并辅助比较不同组织或功能的使用深度，不直接代表效率或价值。",
    },
    "成功任务": {
      meaning: "反映平台实际完成的创作任务规模，是观察平台使用是否形成稳定产出的基础。数量增加表示完成的任务更多，但不代表生成结果已经被业务采用。",
      rule: "按照去重的任务，统计最终状态为成功的任务；部分成功也计为成功。AI提示词的生成、润色和反推按成功动作统计，不计入任务数量。",
      value: "结合实际使用次数和任务成功率，可判断平台任务承载是否稳定；是否产生业务价值，还需结合后续使用结果等产出指标判断。",
    },
    "取消任务": {
      meaning: "反映任务发起后未继续完成而被中止的规模。取消数量或占比持续上升，可能说明等待时间、操作流程或任务策略存在阻力。",
      rule: "按照去重的任务，统计最终由用户取消、系统中止或超时关闭的任务；同一任务只计 1 次。",
      value: "用于定位等待时间、操作流程或系统策略是否造成任务中止，不直接判断积分浪费。",
    },
    "失败任务": {
      meaning: "反映平台未能完成用户创作请求的任务规模。失败数量或占比上升说明运行稳定性需要关注，但不能直接归因于用户操作。",
      rule: "按照去重的任务，统计最终状态为失败且没有产生任何成功结果的任务；部分成功计入成功任务，不重复计入失败任务。",
      value: "用于了解平台运行是否稳定并定位异常较多的功能，不用于评价用户操作质量。",
    },
    "成功动作": {
      meaning: "反映 AI 提示词能力实际完成用户请求的规模。数量增加说明该能力被更多用于实际工作，但不代表生成内容已经被采纳。",
      rule: "每完成 1 次生成、润色或反推计 1 次，同一次动作只计 1 次；页面访问、输入和预览不计入。",
      value: "结合实际使用次数和动作成功率，可判断 AI 提示词能力的使用规模与运行稳定性；输出价值仍需结合后续采纳行为判断。",
    },
    "取消动作": {
      meaning: "反映 AI 提示词操作发起后未继续完成的规模。取消情况增多可能说明等待、误操作或使用流程存在阻力。",
      rule: "按照去重的生成、润色或反推动作，统计最终被用户或系统取消的动作；没有实际发起的不计入。",
      value: "用于发现等待、误操作或流程阻力，不作为用户使用质量判断。",
    },
    "失败动作": {
      meaning: "反映 AI 提示词能力未能完成用户请求的规模。失败情况增多说明服务稳定性需要关注，不代表提示词内容质量较差。",
      rule: "按照去重的生成、润色或反推动作，统计最终执行失败的动作；没有实际发起的不计入。",
      value: "用于监控提示词服务可用性和错误情况，不用于评价提示词内容质量。",
    },
    "平均处理时长": {
      meaning: "反映用户从发起使用到获得结果的平均等待时间。时间缩短通常表示处理效率改善，但不等同于实际节省了同等人工工时。",
      rule: "分别计算每个成功任务从提交到完成所用的时间，再取平均值；失败、取消和未成功创建的任务不计入。AI提示词按每次动作从发起到完成的时长统计。",
      value: "用于观察用户实际等待时间和处理链路效率，辅助定位慢功能或慢模型；不等同于人工节省工时。",
    },
    "消耗积分": {
      meaning: "反映平台在所选范围内投入的模型资源规模。积分增加可能来自使用量增长、任务复杂度变化或功能结构变化，不能直接判断为浪费。",
      rule: "汇总已经完成结算的积分扣减记录；积分申请、账户余额、补发和退还不计入消耗积分。",
      value: "用于观察平台资源投入规模，并与实际使用和后续使用结果结合判断投入结构；积分高不直接代表浪费。",
    },
    "积分使用人数": {
      meaning: "反映产生模型资源投入的实际用户覆盖规模。人数越多说明积分投入覆盖更广，人数较少则可能表示资源集中在少数使用者。",
      rule: "同一用户发生多次扣减只计 1 人；不扣积分功能的使用用户不计入。",
      value: "用于观察积分消耗覆盖了多少实际用户，并识别积分是否过度集中在少数人员。",
    },
    "平均每次使用积分": {
      meaning: "反映完成一次扣积分功能使用所需的平均资源投入。数值差异可能来自功能、模型和任务复杂度不同，不能脱离使用场景直接比较高低。",
      rule: "用消耗积分除以扣积分功能的实际使用次数计算；不扣积分功能不参与计算。",
      value: "用于比较不同功能、部门或人员的单位使用投入；需结合任务复杂度和后续产出判断，不能单独评价高低。",
    },
    "平均后续使用结果积分": {
      meaning: "反映每形成一个进入后续工作环节的结果需要投入多少积分，是观察积分向有效产出转化效率的核心指标。数值越低通常表示单位有效产出的资源投入越少。",
      rule: "按结果的生成时间归入统计周期；用消耗积分除以截至查询时发生过下载、继续编辑、加入素材库、认可或跨任务复用的去重结果数。同一结果发生多个后续动作只计 1 个。",
      value: "用于比较不同功能、部门或人员的积分转化情况，并识别高投入但后续使用结果较少的范围；仍需结合任务难度和模型差异复核。",
    },
    "积分规则": {
      meaning: "反映当前功能是否会产生模型资源投入，帮助区分免费能力与扣积分能力，避免将两类使用混合评价。",
      rule: "AI提示词的生成、润色和反推等核心动作不扣积分；生图、视频和无限画布等收费功能只统计已完成结算的实际扣减积分。",
      value: "帮助管理者明确哪些使用会产生资源投入，避免把免费能力纳入积分消耗和积分效率判断。",
    },
    "可用素材数": {
      meaning: "反映平台已经沉淀且可直接投入生产的素材资产规模。数量增加说明资产供给更丰富，但不能单独证明这些素材正在被有效复用。",
      rule: "取所选结束日期当天的可用存量，按照素材去重统计个人、团队和公共素材；审核中、已驳回、已删除或不可用素材不计入。",
      value: "用于观察平台可直接复用的素材资产规模，并结合活跃数量和复用率识别存量是否真正进入生产。",
    },
    "素材复用率": {
      meaning: "反映可用素材从库存进入实际生产的转化程度。比例越高说明素材库中的存量更充分地参与了后续工作。",
      rule: "用所选期间成功选入任务的去重素材数，除以所选结束日期当天的可用素材数计算；预览、下载和仅加入素材库不算复用。",
      value: "用于判断素材库是有效生产资产还是仅有存量，支持推广高价值素材和治理长期未使用素材。",
    },
    "可用提示词数": {
      meaning: "反映平台已经沉淀且可供组织复用的提示词资产规模。数量增加说明方法经验沉淀更丰富，但不代表这些提示词已经被实际采用。",
      rule: "取所选结束日期当天的可用存量，按照提示词去重统计个人、团队和公共提示词；灵感广场、审核中、已驳回、已删除或不可用提示词不计入。",
      value: "用于观察内部已沉淀、可复用的提示词资产规模，并为团队共享和公共发布提供基础。",
    },
    "提示词使用率": {
      meaning: "反映已沉淀提示词被实际采用的程度。比例越高说明提示词资产与真实工作需求匹配度和复用活跃度越高。",
      rule: "用所选期间复制成功或确认使用的去重提示词数，除以所选结束日期当天的可用提示词数计算；带入工具成功另行统计，灵感广场和站外行为不计入。",
      value: "用于判断提示词资产是否被真实采用，并识别值得推广、需要优化或长期未使用的内部提示词。",
    },
    "纳入统计功能": {
      meaning: "反映当前报表覆盖的平台功能范围。覆盖完整才能保证管理者看到的平台使用情况不存在明显漏统或重复统计。",
      rule: "统计 6 个生图工具、6 个 AI 能力和 AI 无限画布；同一工具下的子能力合并计算，素材库和提示词库等资源页面不计为生成工具。",
      value: "用于确认报表覆盖范围，避免功能新增、合并或改名后出现漏统和重复统计。",
    },
    "任务成功率": {
      meaning: "反映平台将用户发起的任务稳定转化为成功结果的能力。比例下降说明任务运行稳定性需要关注，但不代表成功结果一定符合业务要求。",
      rule: "按照去重的成功任务数除以实际创建的去重任务数计算；部分成功计为成功，失败、取消和未完成任务不计入成功任务。",
      value: "结合任务量、失败任务和取消任务的变化，可定位运行异常集中的功能或时段；结果质量仍需结合后续使用指标判断。",
    },
    "动作成功率": {
      meaning: "反映 AI 提示词能力稳定完成用户请求的程度。比例下降说明服务运行需要关注，但不能据此判断输出内容是否可用。",
      rule: "用成功完成的生成、润色和反推动作数，除以实际发起的动作数计算；页面访问和仅输入内容不计入。",
      value: "结合动作量、失败动作和取消动作的变化，可判断 AI 提示词服务是否稳定并定位异常时段；不用于评价输出内容质量。",
    },
  }

  const aliases = {
    "使用用户": "实际使用用户",
    "人均使用": "人均使用次数",
    "积分消耗": "消耗积分",
    "成功核心动作": "成功动作",
    "核心动作": "实际使用次数",
  }
  const definition = definitions[aliases[metric.label] || metric.label]

  return definition || {
    meaning: `反映当前所选范围内的${metric.label}情况，需要结合相关使用、投入和产出指标共同理解。`,
    rule: "按当前选择的时间范围、组织范围和功能范围统计；具体数值随筛选条件同步变化。",
    value: "用于理解当前指标所反映的使用、运行、投入或产出情况，并与同主题其他指标结合判断。",
  }
}

export default function DataOverviewClient() {
  const todayValue = useMemo(() => getTodayValue(), [])
  const [theme, setTheme] = useState("overview")
  const [featureName, setFeatureName] = useState("all")
  const [scopeId, setScopeId] = useState("company")
  const [timePreset, setTimePreset] = useState("today")
  const [startDate, setStartDate] = useState(() => getPresetRange("today", getTodayValue()).startDate)
  const [endDate, setEndDate] = useState(() => getPresetRange("today", getTodayValue()).endDate)
  const [definitionMetric, setDefinitionMetric] = useState(null)
  const themeTabsRef = useRef(null)

  useEffect(() => {
    if (!definitionMetric) return undefined
    const closeOnEscape = (event) => event.key === "Escape" && setDefinitionMetric(null)
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [definitionMetric])

  const selectedFeature = featureName === "all" ? null : featureTaskRows.find((row) => row.name === featureName)
  const selectedScope = reportScopeMap[scopeId] || reportScopeOptions[0]
  const visibleRows = selectedFeature ? [selectedFeature] : featureTaskRows
  const metrics = getMetrics(theme, selectedFeature)

  function handleTimePresetChange(nextPreset) {
    setTimePreset(nextPreset)
    if (nextPreset === "custom") return
    const nextRange = getPresetRange(nextPreset, todayValue)
    setStartDate(nextRange.startDate)
    setEndDate(nextRange.endDate)
  }

  function handleStartDateChange(value) {
    setTimePreset("custom")
    setStartDate(value)
    if (value > endDate) setEndDate(value)
  }

  function handleEndDateChange(value) {
    setTimePreset("custom")
    setEndDate(value)
    if (value < startDate) setStartDate(value)
  }

  function handleThemeChange(nextTheme) {
    const tabs = themeTabsRef.current
    const scrollContainer = tabs?.closest("main")
    const targetScrollTop = tabs && scrollContainer
      ? getLayoutOffsetTop(tabs) - getLayoutOffsetTop(scrollContainer)
      : null

    setTheme(nextTheme)
    if (scrollContainer && targetScrollTop != null && scrollContainer.scrollTop > targetScrollTop) {
      requestAnimationFrame(() => scrollContainer.scrollTo({ top: targetScrollTop, behavior: "auto" }))
    }
  }

  return (
    <PageShell
      pathname="/admin/data"
      description="查看平台使用、任务运行、积分消耗与资产复用情况"
      actions={(
        <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-medium text-[var(--text-secondary)]" style={{ borderColor: "var(--border-base)" }}>
          <LockKeyhole size={15} className="text-[var(--brand-primary)]" />系统管理员 · {selectedScope.path}
        </span>
      )}
    >
      <div className="min-w-0 space-y-4">
        <ReportFilters
          featureName={featureName}
          onFeatureChange={setFeatureName}
          scopeId={scopeId}
          onScopeChange={setScopeId}
          selectedScope={selectedScope}
          timePreset={timePreset}
          onTimePresetChange={handleTimePresetChange}
          startDate={startDate}
          endDate={endDate}
          maxDate={todayValue}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
        <ThemeTabs activeTheme={theme} navRef={themeTabsRef} onChange={handleThemeChange} />

        {theme !== "details" && (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="核心指标">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} onHelp={() => setDefinitionMetric(metric)} />)}
          </section>
        )}

        <ThemeContent theme={theme} feature={selectedFeature} rows={visibleRows} selectedScope={selectedScope} startDate={startDate} endDate={endDate} onThemeChange={handleThemeChange} />
      </div>

      {definitionMetric && <MetricDefinitionDialog metric={definitionMetric} onClose={() => setDefinitionMetric(null)} />}
    </PageShell>
  )
}

function ReportFilters({
  featureName,
  onFeatureChange,
  scopeId,
  onScopeChange,
  selectedScope,
  timePreset,
  onTimePresetChange,
  startDate,
  endDate,
  maxDate,
  onStartDateChange,
  onEndDateChange,
}) {
  return (
    <section className="xm-panel p-4" aria-label="查询条件">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(500px,1.65fr)_minmax(230px,.75fr)_minmax(180px,.55fr)]">
        <FilterField label="时间范围" className="sm:col-span-2 xl:col-span-1">
          <TimeRangeFilter
            preset={timePreset}
            onPresetChange={onTimePresetChange}
            startDate={startDate}
            endDate={endDate}
            maxDate={maxDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />
        </FilterField>
        <FilterField label="数据范围">
          <OrganizationTreeFilter value={scopeId} onChange={onScopeChange} selectedScope={selectedScope} />
        </FilterField>
        <FilterField label="功能">
          <select value={featureName} onChange={(event) => onFeatureChange(event.target.value)} className={controlClass} style={{ borderColor: "var(--border-base)" }}>
            <option value="all">全部功能</option>
            {featureTaskRows.map((row) => <option key={row.name} value={row.name}>{row.name}</option>)}
          </select>
        </FilterField>
      </div>
      <div className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs text-[var(--text-secondary)] lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: "var(--border-light)" }}>
        <span>统计范围：{selectedScope.path}</span>
        <span>实际使用：任务成功创建或核心动作成功，页面访问不计入</span>
      </div>
    </section>
  )
}

function FilterField({ label, children, className = "" }) {
  return <div className={`min-w-0 ${className}`}><span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>{children}</div>
}

function TimeRangeFilter({ preset, onPresetChange, startDate, endDate, maxDate, onStartDateChange, onEndDateChange }) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2">
      <div className="inline-flex shrink-0 rounded-lg bg-[var(--gray-100)] p-1" role="group" aria-label="快捷时间范围">
        {timePresetOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={preset === option.value}
            onClick={() => onPresetChange(option.value)}
            className={`h-8 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${preset === option.value ? "bg-[var(--brand-primary)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-title)]"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <DateRangeField label="开始" value={startDate} max={endDate || maxDate} onChange={onStartDateChange} />
      <DateRangeField label="结束" value={endDate} min={startDate} max={maxDate} onChange={onEndDateChange} />
    </div>
  )
}

function DateRangeField({ label, value, min, max, onChange }) {
  return (
    <label className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <span className="shrink-0">{label}</span>
      <span className="relative block min-w-0">
        <CalendarDays size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-[var(--text-disabled)]" />
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-[138px] rounded-lg border bg-white pl-8 pr-1 text-xs text-[var(--text-body)] outline-none transition-colors focus-visible:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          style={{ borderColor: "var(--border-base)" }}
          aria-label={`${label}日期`}
        />
      </span>
    </label>
  )
}

function OrganizationTreeFilter({ value, onChange, selectedScope }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [expandedIds, setExpandedIds] = useState(["company"])
  const [panelPosition, setPanelPosition] = useState(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (normalizedQuery) {
      const visibleIds = new Set()
      reportScopeOptions.forEach((scope) => {
        if (!scope.path.toLowerCase().includes(normalizedQuery)) return
        visibleIds.add(scope.id)
        scope.ancestorIds.forEach((ancestorId) => visibleIds.add(ancestorId))
      })
      return reportScopeOptions.filter((scope) => visibleIds.has(scope.id))
    }
    return reportScopeOptions.filter((scope) => scope.depth === 0 || scope.ancestorIds.every((ancestorId) => expandedIds.includes(ancestorId)))
  }, [expandedIds, query])

  useEffect(() => {
    if (!open) return undefined
    function updatePanelPosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const safeGap = 12
      const width = Math.min(Math.max(rect.width, 360), window.innerWidth - safeGap * 2)
      const maxHeight = Math.min(420, window.innerHeight - safeGap * 2)
      const left = Math.min(Math.max(safeGap, rect.left), window.innerWidth - width - safeGap)
      const opensUpward = rect.bottom + 8 + maxHeight > window.innerHeight && rect.top > window.innerHeight - rect.bottom
      const top = opensUpward ? Math.max(safeGap, rect.top - maxHeight - 8) : Math.min(rect.bottom + 8, window.innerHeight - maxHeight - safeGap)
      setPanelPosition({ top, left, width, maxHeight })
    }
    updatePanelPosition()
    window.addEventListener("resize", updatePanelPosition)
    window.addEventListener("scroll", updatePanelPosition, true)
    return () => {
      window.removeEventListener("resize", updatePanelPosition)
      window.removeEventListener("scroll", updatePanelPosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function closeMenu(event) {
      if (event.type === "keydown" && event.key !== "Escape") return
      if (event.type === "mousedown" && (triggerRef.current?.contains(event.target) || panelRef.current?.contains(event.target))) return
      setOpen(false)
    }
    document.addEventListener("mousedown", closeMenu)
    window.addEventListener("keydown", closeMenu)
    return () => {
      document.removeEventListener("mousedown", closeMenu)
      window.removeEventListener("keydown", closeMenu)
    }
  }, [open])

  function toggleExpanded(scopeId) {
    setExpandedIds((current) => current.includes(scopeId)
      ? current.filter((id) => id !== scopeId)
      : [...current, scopeId])
  }

  function selectScope(scopeId) {
    onChange(scopeId)
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="tree"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${controlClass} flex items-center justify-between gap-2 text-left focus-visible:outline-none`}
        style={{ borderColor: "var(--border-base)" }}
      >
        <span className="flex min-w-0 items-center gap-2"><Building2 size={15} className="shrink-0 text-[var(--brand-primary)]" /><span className="truncate">{selectedScope.path}</span></span>
        <ChevronDown size={15} className={`shrink-0 text-[var(--text-secondary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && panelPosition && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[90] flex flex-col overflow-hidden rounded-lg border bg-white shadow-xl"
          style={{ ...panelPosition, borderColor: "var(--border-base)" }}
        >
          <div className="border-b p-3" style={{ borderColor: "var(--border-light)" }}>
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-[var(--text-disabled)]" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索组织名称"
                className="h-9 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-[var(--text-body)] outline-none focus-visible:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                style={{ borderColor: "var(--border-base)" }}
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2" role="tree" aria-label="组织架构">
            {visibleRows.length ? visibleRows.map((scope) => {
              const hasChildren = scope.children.length > 0
              const searching = Boolean(query.trim())
              const expanded = searching || expandedIds.includes(scope.id)
              const selected = scope.id === value
              return (
                <div key={scope.id} role="treeitem" aria-selected={selected} aria-expanded={hasChildren ? expanded : undefined} className="flex min-w-0 items-center gap-1 rounded-md hover:bg-[var(--gray-50)]" style={{ paddingLeft: `${scope.depth * 18 + 4}px` }}>
                  {hasChildren ? (
                    <button type="button" disabled={searching} onClick={() => toggleExpanded(scope.id)} aria-label={searching ? `${scope.name}搜索结果已展开` : `${expanded ? "收起" : "展开"}${scope.name}`} className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-default">
                      <ChevronRight size={15} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
                    </button>
                  ) : <span className="size-8 shrink-0" />}
                  <button type="button" onClick={() => selectScope(scope.id)} className={`flex min-h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${selected ? "font-medium text-[var(--brand-primary)]" : "text-[var(--text-body)]"}`}>
                    <span className="truncate">{scope.name}</span>
                    {selected && <Check size={15} className="shrink-0" />}
                  </button>
                </div>
              )
            }) : <div className="px-3 py-8 text-center text-sm text-[var(--text-secondary)]">未找到匹配组织</div>}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function ThemeTabs({ activeTheme, navRef, onChange }) {
  return (
    <nav ref={navRef} className="sticky -top-4 z-30 grid grid-cols-3 border-b bg-[var(--bg-body)] md:-top-5 lg:-top-6 sm:flex" style={{ borderColor: "var(--border-base)" }} aria-label="分析主题" role="tablist">
      {analysisThemes.map((item) => (
        <button key={item.key} type="button" role="tab" aria-selected={activeTheme === item.key} onClick={() => onChange(item.key)} className={`relative min-h-11 px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:px-4 sm:text-sm ${activeTheme === item.key ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-title)]"}`}>
          {item.label}
          <span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--brand-primary)] transition-opacity ${activeTheme === item.key ? "opacity-100" : "opacity-0"}`} />
        </button>
      ))}
    </nav>
  )
}

function MetricCard({ metric, onHelp }) {
  const Icon = metric.icon
  const iconStyle = metric.tone === "success"
    ? { color: "var(--success)", background: "var(--success-bg)" }
    : metric.tone === "danger"
      ? { color: "var(--danger)", background: "var(--danger-bg)" }
      : metric.tone === "warning"
        ? { color: "var(--warning)", background: "var(--warning-bg)" }
        : { color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }

  return (
    <article className="xm-panel min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={iconStyle}><Icon size={17} /></span>
        <button type="button" onClick={onHelp} aria-label={`查看${metric.label}口径`} title="查看指标口径" className="flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--text-disabled)] transition-colors hover:bg-[var(--gray-50)] hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"><CircleHelp size={15} /></button>
      </div>
      <span className="mt-3 block text-xs font-medium text-[var(--text-secondary)]">{metric.label}</span>
      <strong className={`mt-1 block min-h-8 font-semibold leading-8 text-[var(--text-title)] tabular-nums ${metric.unavailable ? "text-base" : "text-2xl"}`}>{metric.value}</strong>
      {metric.progress != null && <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${Math.min(100, metric.progress)}%` }} /></span>}
      <span className="mt-2 block min-h-5 text-xs leading-5 text-[var(--text-secondary)]">{metric.note}</span>
    </article>
  )
}

function ThemeContent({ theme, feature, rows, selectedScope, startDate, endDate, onThemeChange }) {
  if (theme === "overview") return <OverviewContent feature={feature} onThemeChange={onThemeChange} />
  if (theme === "usage") return <UsageContent feature={feature} rows={rows} />
  if (theme === "efficiency") return <EfficiencyContent feature={feature} />
  if (theme === "points") return <PointsContent feature={feature} startDate={startDate} endDate={endDate} />
  if (theme === "assets") return <AssetsContent feature={feature} />
  return <PeopleInsightsContent feature={feature} selectedScope={selectedScope} startDate={startDate} endDate={endDate} />
}

function OverviewContent({ feature, onThemeChange }) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <FeatureRanking title="高频功能" meta="按实际使用次数排序" metric="tasks" feature={feature} />
        <TaskStatusPanel feature={feature} />
      </div>
      {!feature && <ManagementFocus onThemeChange={onThemeChange} />}
      {feature ? <FeatureTable rows={[feature]} compact /> : <DepartmentUsageTable rows={departmentUsageRows} />}
    </>
  )
}

function UsageContent({ feature, rows }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <FeatureRanking title="功能使用次数排行" meta="按实际使用次数排序，反映各功能使用规模" metric="tasks" feature={feature} />
        <FeatureRanking title="功能使用人数排行" meta="按去重使用人数排序，反映各功能用户覆盖" metric="users" feature={feature} />
      </div>
      <FeatureTable rows={rows} columns="usage" />
    </>
  )
}

function EfficiencyContent({ feature }) {
  const averageDuration = feature?.averageDurationSeconds ?? reportDemoData.efficiency.averageDurationSeconds
  const efficiencyItems = feature ? [
    { label: "平均处理时长", value: formatDuration(averageDuration), detail: "从发起使用到返回最终状态" },
    { label: "成功率", value: formatPercent(feature.successRate), detail: `${formatNumber(feature.success)} 次成功运行` },
    { label: "取消率", value: formatPercent(feature.canceled / feature.tasks * 100), detail: `${formatNumber(feature.canceled)} 次取消` },
    { label: "失败率", value: formatPercent(feature.failed / feature.tasks * 100), detail: `${formatNumber(feature.failed)} 次失败` },
  ] : [
    { label: "平均处理时长", value: formatDuration(reportDemoData.efficiency.averageDurationSeconds), detail: "全部任务平均完成耗时" },
    { label: "中位处理时长", value: formatDuration(reportDemoData.efficiency.medianDurationSeconds), detail: "50% 的任务在该时长内完成" },
    { label: "2 分钟内完成", value: formatPercent(reportDemoData.efficiency.completedWithinTwoMinutesRate), detail: "任务创建后 120 秒内完成" },
    { label: "使用高峰", value: reportDemoData.efficiency.peakPeriod, detail: "当日任务创建最集中时段" },
  ]
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(300px,.7fr)_minmax(0,1.3fr)]">
        <TaskStatusPanel feature={feature} />
        <ReportDetailPanel title={feature ? `${feature.name}运行效率` : "运行效率概览"} items={efficiencyItems} />
      </div>
      <FeatureTable rows={feature ? [feature] : featureTaskRows} columns="efficiency" />
    </>
  )
}

function getScopedPointsTrend(feature, startDate, endDate) {
  const sourceTotals = feature ? {
    points: feature.points,
    uses: feature.tasks,
    followupUsedResults: feature.followupUsedResults,
  } : {
    points: pointsTrendRows.reduce((sum, row) => sum + row.points, 0),
    uses: pointsTrendRows.reduce((sum, row) => sum + row.uses, 0),
    followupUsedResults: pointsTrendRows.reduce((sum, row) => sum + row.followupUsedResults, 0),
  }
  return createTimeRangeTrend(startDate, endDate, sourceTotals, feature ? feature.name.length : 0)
}

function getScopedDepartmentPoints(feature) {
  if (!feature) return departmentUsageRows
  const pointRatio = feature.points / reportDemoData.points.consumed
  const useRatio = feature.tasks / reportDemoData.tasks
  const followupRatio = feature.followupUsedResults / reportDemoData.management.followupUsedResults
  return departmentUsageRows.map((row) => {
    const points = Math.round(row.points * pointRatio)
    const followupUsedResults = Math.max(1, Math.round(row.followupUsedResults * followupRatio))
    return {
      ...row,
      users: Math.max(1, Math.round(row.users * feature.users / reportDemoData.points.users)),
      uses: Math.max(1, Math.round(row.uses * useRatio)),
      points,
      followupUsedResults,
      pointsPerFollowupResult: points / followupUsedResults,
    }
  })
}

function PointsContent({ feature, startDate, endDate }) {
  const [personLimit, setPersonLimit] = useState(10)
  const promptFeature = feature?.pointsMode === "free"

  if (promptFeature) return <NoPointsFeaturePanel feature={feature} />

  const featureRows = (feature ? [feature] : featureTaskRows.filter((row) => row.pointsMode === "charged")).sort((left, right) => right.points - left.points)
  const departmentRows = [...getScopedDepartmentPoints(feature)].sort((left, right) => right.followupUsedResults - left.followupUsedResults || right.points - left.points)
  const people = feature ? personPointsRows.filter((row) => row.mainFeature === feature.name) : personPointsRows

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <PointsTrendPanel trend={getScopedPointsTrend(feature, startDate, endDate)} feature={feature} />
        <PointsManagementSignals feature={feature} />
      </div>
      <FeaturePointsTable rows={featureRows} />
      <DepartmentPointsTable rows={departmentRows} />
      <PersonPointsRanking rows={people} limit={personLimit} onLimitChange={setPersonLimit} />
    </div>
  )
}

function NoPointsFeaturePanel({ feature }) {
  return (
    <section className="xm-panel p-4">
      <SectionHeading title={`${feature.name}积分使用`} meta="不扣积分" />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <ValueBlock label="积分规则" value="不扣积分" note="核心动作不产生生图积分" />
        <ValueBlock label="核心动作" value={formatNumber(feature.tasks)} note="生成、润色与反推" />
        <ValueBlock label="使用用户" value={formatNumber(feature.users)} note={`人均 ${formatNumber(feature.tasks / feature.users, 1)} 次`} />
      </div>
    </section>
  )
}

function PointsTrendPanel({ trend, feature }) {
  const { rows, rangeLabel } = trend
  const maxPoints = Math.max(...rows.map((row) => row.points), 1)
  const totalPoints = rows.reduce((sum, row) => sum + row.points, 0)
  const totalUses = rows.reduce((sum, row) => sum + row.uses, 0)
  const totalFollowup = rows.reduce((sum, row) => sum + row.followupUsedResults, 0)

  return (
    <section className="xm-panel min-w-0 p-4">
      <SectionHeading title="积分使用趋势" meta={`${feature ? `${feature.name} · ` : ""}${rangeLabel}`} />
      <dl className="mt-4 grid grid-cols-3 divide-x divide-[var(--border-light)] border-y py-3" style={{ borderColor: "var(--border-light)" }}>
        <div className="min-w-0 pr-3"><dt className="text-xs text-[var(--text-secondary)]">消耗积分</dt><dd className="mt-1 truncate text-sm font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(totalPoints)}</dd></div>
        <div className="min-w-0 px-3"><dt className="text-xs text-[var(--text-secondary)]">实际使用次数</dt><dd className="mt-1 truncate text-sm font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(totalUses)}</dd></div>
        <div className="min-w-0 pl-3"><dt className="text-xs text-[var(--text-secondary)]">后续使用结果数</dt><dd className="mt-1 truncate text-sm font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(totalFollowup)}</dd></div>
      </dl>
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="grid h-48 gap-2" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(36px, 1fr))`, minWidth: `${Math.max(100, rows.length * 44)}px` }} aria-label={`积分消耗趋势柱状图，${rangeLabel}`}>
          {rows.map((row) => (
            <div key={row.key} className="flex min-w-0 flex-col items-center justify-end gap-2" title={`${row.label}：${formatNumber(row.points)} 积分`}>
              <span className="text-[10px] text-[var(--text-secondary)] tabular-nums sm:text-xs">{formatCompactNumber(row.points)}</span>
              <span className="flex h-32 w-full items-end justify-center rounded-md bg-[var(--gray-50)] px-1">
                <span className="block w-full max-w-8 rounded-t-md bg-[var(--brand-primary)] transition-[height]" style={{ height: `${Math.max(8, row.points / maxPoints * 100)}%` }} />
              </span>
              <span className="whitespace-nowrap text-[10px] text-[var(--text-secondary)] tabular-nums sm:text-xs">{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PointsManagementSignals({ feature }) {
  const lowestFeature = feature || featureTaskRows.filter((row) => row.pointsMode === "charged").sort((left, right) => left.followupUseRate - right.followupUseRate)[0]
  const signals = feature ? [
    { icon: Coins, title: "积分占比", value: formatPercent(feature.points / reportDemoData.points.consumed * 100), detail: `${formatNumber(feature.points)} 积分` },
    { icon: Gauge, title: "后续使用效率", value: formatPercent(feature.followupUseRate), detail: `${formatNumber(feature.followupUsedResults)} 个结果进入后续工作` },
    { icon: ChartNoAxesColumnIncreasing, title: "平均后续使用结果积分", value: formatNumber(feature.points / feature.followupUsedResults, 2), detail: "消耗积分 / 后续使用结果数" },
  ] : [
    { icon: ChartNoAxesColumnIncreasing, title: "积分与使用增速", value: `+${formatPercent(reportDemoData.points.periodGrowthRate)}`, detail: `实际使用增长 +${formatPercent(reportDemoData.points.useGrowthRate)}` },
    { icon: Users, title: "TOP 10 人员积分占比", value: formatPercent(reportDemoData.points.topTenUserShare), detail: "用于观察积分使用集中度" },
    { icon: Gauge, title: "需关注功能", value: lowestFeature.name, detail: `后续使用率 ${formatPercent(lowestFeature.followupUseRate)}，仅作为复核信号` },
  ]

  return (
    <section className="xm-panel p-4">
      <SectionHeading title="积分管理信号" meta="不直接判断浪费" />
      <div className="mt-3 divide-y divide-[var(--border-light)]">
        {signals.map((signal) => {
          const Icon = signal.icon
          return <div key={signal.title} className="flex items-start gap-3 py-4 first:pt-2 last:pb-1"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><Icon size={17} /></span><div className="min-w-0 flex-1"><span className="text-xs text-[var(--text-secondary)]">{signal.title}</span><strong className="mt-0.5 block break-words text-base font-semibold text-[var(--text-title)] tabular-nums">{signal.value}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{signal.detail}</p></div></div>
        })}
      </div>
    </section>
  )
}

function FeaturePointsTable({ rows }) {
  const columns = [
    { key: "points", label: "消耗积分", format: formatNumber },
    { key: "share", label: "积分占比", format: (_, row) => formatPercent(row.points / reportDemoData.points.consumed * 100) },
    { key: "tasks", label: "实际使用次数", format: formatNumber },
    { key: "pointsPerUse", label: "平均每次使用积分", format: (_, row) => formatNumber(row.points / row.tasks, 2) },
    { key: "followupUsedResults", label: "后续使用结果数", format: (value) => <FollowupResultCount value={value} /> },
    { key: "followupUseRate", label: "后续使用率", format: formatPercent },
    { key: "pointsPerFollowup", label: "平均后续使用结果积分", format: (_, row) => <PointsEfficiencyValue points={row.points} resultCount={row.followupUsedResults} /> },
  ]
  return <PointsTableSection title="按功能统计" meta={`共 ${rows.length} 个扣积分功能`} nameLabel="功能" rows={rows} columns={columns} />
}

function DepartmentPointsTable({ rows }) {
  const columns = [
    { key: "points", label: "消耗积分", format: formatNumber },
    { key: "users", label: "积分使用人数", format: formatNumber },
    { key: "uses", label: "实际使用次数", format: formatNumber },
    { key: "pointsPerUse", label: "平均每次使用积分", format: (_, row) => formatNumber(row.points / row.uses, 2) },
    { key: "followupUsedResults", label: "后续使用结果数", format: (value) => <FollowupResultCount value={value} /> },
    { key: "pointsPerFollowupResult", label: "平均后续使用结果积分", format: (_, row) => <PointsEfficiencyValue points={row.points} resultCount={row.followupUsedResults} /> },
  ]
  return <PointsTableSection title="按部门统计" meta="按后续使用结果数从高到低排列" nameLabel="部门" rows={rows} columns={columns} />
}

function FollowupResultCount({ value }) {
  return formatNumber(value)
}

function PointsEfficiencyValue({ points, resultCount }) {
  if (!resultCount) return "--"
  return formatNumber(points / resultCount, 2)
}

function PointsTableSection({ title, meta, nameLabel, rows, columns }) {
  return (
    <section className="xm-panel overflow-hidden">
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border-light)" }}><SectionHeading title={title} meta={meta} /></div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[940px] border-collapse text-sm">
          <thead className="bg-[var(--gray-50)] text-xs font-semibold text-[var(--text-secondary)]"><tr><th className="px-4 py-3 text-left">{nameLabel}</th>{columns.map((column) => <th key={column.key} className="px-3 py-3 text-right">{column.label}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.name} className="border-t transition-colors hover:bg-[var(--gray-25)]" style={{ borderColor: "var(--border-light)" }}><td className="px-4 py-3 font-medium text-[var(--text-title)]">{row.name}</td>{columns.map((column) => <td key={column.key} className="px-3 py-3 text-right text-[var(--text-body)] tabular-nums">{column.format(row[column.key], row)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => <article key={row.name} className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><strong className="break-words text-sm text-[var(--text-title)]">{row.name}</strong><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--border-light)" }}>{columns.map((column) => <div key={column.key}><dt className="text-xs leading-5 text-[var(--text-secondary)]">{column.label}</dt><dd className="mt-1 text-sm font-medium text-[var(--text-title)] tabular-nums">{column.format(row[column.key], row)}</dd></div>)}</dl></article>)}
      </div>
    </section>
  )
}

function PersonPointsRanking({ rows, limit, onLimitChange }) {
  const visibleRows = [...rows].sort((left, right) => right.followupUsedResults - left.followupUsedResults || right.points - left.points).slice(0, limit)
  return (
    <section className="xm-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: "var(--border-light)" }}>
        <div><h2 className="text-base font-semibold text-[var(--text-title)]">有效产出贡献 TOP N</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">按后续使用结果数排列，积分仅作投入与效率参考，不作为员工绩效评价</p></div>
        <div className="inline-flex w-fit rounded-lg bg-[var(--gray-100)] p-1" aria-label="排行人数">{[10, 20, 50].map((value) => <button key={value} type="button" onClick={() => onLimitChange(value)} aria-pressed={limit === value} className={`min-h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${limit === value ? "bg-white text-[var(--text-title)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-title)]"}`}>TOP {value}</button>)}</div>
      </div>
      {visibleRows.length ? (
        <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1040px] border-collapse text-sm"><thead className="bg-[var(--gray-50)] text-xs font-semibold text-[var(--text-secondary)]"><tr><th className="px-4 py-3 text-center">排名</th><th className="px-3 py-3 text-left">人员 / 部门</th><th className="px-3 py-3 text-right">后续使用结果数</th><th className="px-3 py-3 text-right">消耗积分</th><th className="px-3 py-3 text-right">实际使用次数</th><th className="px-3 py-3 text-right">平均每次使用积分</th><th className="px-3 py-3 text-right">平均后续使用结果积分</th><th className="px-3 py-3 text-left">主要使用功能</th></tr></thead><tbody>{visibleRows.map((row, index) => <tr key={row.name} className="border-t transition-colors hover:bg-[var(--gray-25)]" style={{ borderColor: "var(--border-light)" }}><td className="px-4 py-3 text-center font-semibold text-[var(--brand-primary)] tabular-nums">{String(index + 1).padStart(2, "0")}</td><td className="px-3 py-3"><strong className="block font-medium text-[var(--text-title)]">{row.name}</strong><span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{row.department}</span></td><td className="px-3 py-3 text-right tabular-nums"><FollowupResultCount value={row.followupUsedResults} /></td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.points)}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.uses)}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.points / row.uses, 2)}</td><td className="px-3 py-3 text-right tabular-nums"><PointsEfficiencyValue points={row.points} resultCount={row.followupUsedResults} /></td><td className="px-3 py-3 text-[var(--text-body)]">{row.mainFeature}</td></tr>)}</tbody></table></div>
          <div className="space-y-3 p-3 md:hidden">{visibleRows.map((row, index) => <article key={row.name} className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-xs font-semibold text-[var(--brand-primary)]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><strong className="block text-sm text-[var(--text-title)]">{row.name}</strong><span className="mt-1 block break-words text-xs text-[var(--text-secondary)]">{row.department} · {row.mainFeature}</span></div></div><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--border-light)" }}><div><dt className="text-xs text-[var(--text-secondary)]">后续使用结果数</dt><dd className="mt-1 text-sm font-medium tabular-nums"><FollowupResultCount value={row.followupUsedResults} /></dd></div><div><dt className="text-xs text-[var(--text-secondary)]">消耗积分</dt><dd className="mt-1 text-sm font-medium tabular-nums">{formatNumber(row.points)}</dd></div><div><dt className="text-xs text-[var(--text-secondary)]">实际使用次数</dt><dd className="mt-1 text-sm font-medium tabular-nums">{formatNumber(row.uses)}</dd></div><div><dt className="text-xs text-[var(--text-secondary)]">平均每次使用积分</dt><dd className="mt-1 text-sm font-medium tabular-nums">{formatNumber(row.points / row.uses, 2)}</dd></div><div className="col-span-2"><dt className="text-xs text-[var(--text-secondary)]">平均后续使用结果积分</dt><dd className="mt-1 text-sm font-medium tabular-nums"><PointsEfficiencyValue points={row.points} resultCount={row.followupUsedResults} /></dd></div></dl></article>)}</div>
        </>
      ) : <UnavailableState icon={Users} title="暂无人员积分记录" description="当前功能下暂无可展示的人员积分使用数据。" />}
    </section>
  )
}

function AssetsContent({ feature }) {
  const selectedMaterialRows = feature ? topMaterialRows.filter((row) => row.mainFeature === feature.name) : topMaterialRows
  const selectedPromptRows = feature ? topPromptRows.filter((row) => row.mainFeature === feature.name) : topPromptRows
  const scopeColumns = [
    { key: "materialCount", label: "素材数", format: formatNumber },
    { key: "promptCount", label: "提示词数", format: formatNumber },
    { key: "totalAssets", label: "资产总数", format: formatNumber },
    { key: "activeAssets", label: "活跃资产", format: formatNumber },
    { key: "usageCount", label: "使用次数", format: formatNumber },
    { key: "usageRate", label: "资产使用率", format: formatPercent },
    { key: "users", label: "使用人数", format: formatNumber },
  ]
  const teamColumns = [
    { key: "materials", label: "贡献素材", format: formatNumber },
    { key: "prompts", label: "贡献提示词", format: formatNumber },
    { key: "totalAssets", label: "贡献资产", format: (_, row) => formatNumber(row.materials + row.prompts) },
    { key: "activeAssets", label: "被使用资产", format: formatNumber },
    { key: "usageRate", label: "贡献资产使用率", format: (_, row) => formatPercent(row.activeAssets / (row.materials + row.prompts) * 100) },
    { key: "usageCount", label: "资产使用次数", format: formatNumber },
    { key: "users", label: "使用人数", format: formatNumber },
    { key: "crossTeamUses", label: "跨团队使用", format: formatNumber },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <AssetTypePanel type="material" />
        <AssetTypePanel type="prompt" />
      </div>
      <PointsTableSection title="按资产范围统计" meta="个人、团队与公共资产" nameLabel="资产范围" rows={assetScopeRows} columns={scopeColumns} />
      <PointsTableSection title="按团队统计" meta="贡献与实际使用结合观察" nameLabel="团队" rows={teamAssetRows} columns={teamColumns} />
      <div className="grid gap-4 xl:grid-cols-2">
        <AssetRankingPanel title="热门素材" meta={feature ? feature.name : "TOP 7"} rows={selectedMaterialRows} emptyText="当前功能暂无素材使用记录" />
        <AssetRankingPanel title="热门提示词" meta={feature ? feature.name : "TOP 7"} rows={selectedPromptRows} emptyText="当前功能暂无提示词使用记录" />
      </div>
    </div>
  )
}

function AssetTypePanel({ type }) {
  const isMaterial = type === "material"
  const data = isMaterial ? reportDemoData.assets.materials : reportDemoData.assets.prompts
  const details = isMaterial ? [
    { label: "素材使用次数", value: formatNumber(data.usageCount), note: "成功选入任务" },
    { label: "产生任务数", value: formatNumber(data.taskCount), note: "关联去重任务" },
    { label: "平均每项使用", value: formatNumber(data.averageUsesPerActiveAsset, 2), note: "使用次数 / 活跃素材" },
  ] : [
    { label: "复制成功", value: formatNumber(data.copyCount), note: "站内复制按钮" },
    { label: "确认使用", value: formatNumber(data.templateUseCount), note: "模板确认使用" },
    { label: "带入工具", value: formatNumber(data.applyToToolCount), note: `深层使用率 ${formatPercent(data.applyToToolRate)}` },
  ]
  return (
    <section className="xm-panel p-4">
      <SectionHeading title={isMaterial ? "素材使用概览" : "提示词使用概览"} meta={isMaterial ? "成功选入任务才计使用" : "仅统计内部提示词"} />
      <dl className="mt-4 grid grid-cols-3 divide-x divide-[var(--border-light)] border-y py-3" style={{ borderColor: "var(--border-light)" }}>
        <div className="min-w-0 pr-3"><dt className="text-xs text-[var(--text-secondary)]">可用数量</dt><dd className="mt-1 truncate text-base font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(data.available)}</dd></div>
        <div className="min-w-0 px-3"><dt className="text-xs text-[var(--text-secondary)]">活跃数量</dt><dd className="mt-1 truncate text-base font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(data.active)}</dd></div>
        <div className="min-w-0 pl-3"><dt className="text-xs text-[var(--text-secondary)]">使用率</dt><dd className="mt-1 truncate text-base font-semibold text-[var(--text-title)] tabular-nums">{formatPercent(data.usageRate)}</dd></div>
      </dl>
      <span className="mt-4 block h-2 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${data.usageRate}%` }} /></span>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {details.map((item) => <div key={item.label} className="min-w-0"><span className="block text-xs leading-5 text-[var(--text-secondary)]">{item.label}</span><strong className="mt-1 block truncate text-sm font-semibold text-[var(--text-title)] tabular-nums">{item.value}</strong><span className="mt-1 block text-[10px] leading-4 text-[var(--text-secondary)]">{item.note}</span></div>)}
      </div>
    </section>
  )
}

function AssetRankingPanel({ title, meta, rows, emptyText }) {
  const maxUses = Math.max(...rows.map((row) => row.uses), 1)
  return (
    <section className="xm-panel min-w-0 p-4">
      <SectionHeading title={title} meta={meta} />
      {rows.length ? <div className="mt-4 divide-y divide-[var(--border-light)]">
        {rows.map((row, index) => <div key={row.name} className="grid grid-cols-[28px_minmax(0,1fr)_58px] items-center gap-3 py-3 first:pt-1 last:pb-1"><span className="text-center text-xs font-semibold text-[var(--brand-primary)] tabular-nums">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><strong className="truncate text-sm font-medium text-[var(--text-title)]" title={row.name}>{row.name}</strong><span className="shrink-0 rounded-md bg-[var(--gray-100)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">{row.scope}</span></div><p className="mt-1 truncate text-xs text-[var(--text-secondary)]" title={`${row.team} · ${row.mainFeature}`}>{row.team} · {row.mainFeature}</p><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${row.uses / maxUses * 100}%` }} /></span><p className="mt-1 text-[10px] text-[var(--text-secondary)]">{formatNumber(row.users)} 人使用 · 最近 {row.lastUsed}</p></div><strong className="text-right text-sm font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(row.uses)}</strong></div>)}
      </div> : <UnavailableState icon={Layers3} title="暂无资产使用记录" description={emptyText} />}
    </section>
  )
}

function FeatureRanking({ title, meta, metric, feature }) {
  const sortedRows = (feature ? [feature] : [...featureTaskRows])
    .filter((row) => row[metric] != null)
    .sort((left, right) => right[metric] - left[metric])
    .slice(0, 7)
  const max = Math.max(...sortedRows.map((row) => row[metric]), 1)
  return (
    <section className="xm-panel min-w-0 p-4">
      <SectionHeading title={title} meta={meta} />
      {sortedRows.length ? <div className="mt-5 space-y-4">
        {sortedRows.map((row, index) => (
          <div key={row.name} className="grid grid-cols-[24px_minmax(86px,150px)_minmax(70px,1fr)_64px] items-center gap-2 text-xs">
            <span className="text-center font-medium text-[var(--text-disabled)] tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <span className="truncate font-medium text-[var(--text-body)]" title={row.name}>{row.name}</span>
            <span className="h-2 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${Math.max(2, row[metric] / max * 100)}%` }} /></span>
            <strong className="text-right text-[var(--text-title)] tabular-nums">{formatNumber(row[metric])}</strong>
          </div>
        ))}
      </div> : <UnavailableState icon={ChartNoAxesColumnIncreasing} title="暂无使用数据" description="当前暂无该功能的实际使用记录。" />}
    </section>
  )
}

function TaskStatusPanel({ feature }) {
  const statuses = getFeatureStatuses(feature)
  if (!statuses) {
    const promptFeature = feature?.measurement === "action"
    return (
      <section className="xm-panel p-4">
        <SectionHeading title="任务状态" meta={promptFeature ? "不适用" : "暂无数据"} />
        <UnavailableState icon={Clock3} title={promptFeature ? "AI提示词不进入任务状态" : "暂无任务状态数据"} description={promptFeature ? "生成、润色、反推等行为在使用分析中按核心动作统计。" : "当前暂无AI无限画布的运行状态数据。"} />
      </section>
    )
  }
  const total = statuses.reduce((sum, item) => sum + item.value, 0)
  const successRate = statuses.find((item) => item.key === "success")?.rate ?? 0
  const canceledRate = statuses.find((item) => item.key === "canceled")?.rate ?? 0
  const failedRate = statuses.find((item) => item.key === "failed")?.rate ?? 0
  const successEnd = Math.min(100, successRate)
  const canceledEnd = Math.min(100, successEnd + canceledRate)
  const failedEnd = Math.min(100, canceledEnd + failedRate)
  const actionMode = feature?.measurement === "action"
  const statusTitle = actionMode ? "核心动作状态" : "任务状态"
  return (
    <section className="xm-panel p-4">
      <SectionHeading title={statusTitle} meta="按最终状态统计" />
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center xl:flex-col 2xl:flex-row">
        <div className="relative flex size-32 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--success) 0 ${successEnd}%, var(--gray-400) ${successEnd}% ${canceledEnd}%, var(--danger) ${canceledEnd}% ${failedEnd}%, var(--info) ${failedEnd}% 100%)` }} role="img" aria-label={`${statusTitle}成功率 ${formatPercent(successRate)}`}>
          <div className="flex size-24 flex-col items-center justify-center rounded-full bg-white">
            <strong className="text-xl font-semibold text-[var(--text-title)] tabular-nums">{formatPercent(successRate)}</strong>
            <span className="mt-1 text-[11px] text-[var(--text-secondary)]">成功率</span>
          </div>
        </div>
        <div className="w-full min-w-0 space-y-2.5">
          {statuses.map((status) => <div key={status.key} className="grid grid-cols-[10px_minmax(50px,1fr)_70px_50px] items-center gap-2 text-xs"><span className="size-2 rounded-full" style={{ background: statusStyles[status.key].color }} /><span className="text-[var(--text-body)]">{status.label}</span><strong className="text-right text-[var(--text-title)] tabular-nums">{formatNumber(status.value)}</strong><span className="text-right text-[var(--text-secondary)] tabular-nums">{status.rateLabel ?? formatPercent(status.rate)}</span></div>)}
          <div className="border-t pt-2 text-right text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-light)" }}>合计 {formatNumber(total)}</div>
        </div>
      </div>
    </section>
  )
}

function ManagementFocus({ onThemeChange }) {
  const management = reportDemoData.management
  const items = [
    { title: "产出后续使用率", value: formatPercent(management.followupUseRate), note: `${formatNumber(management.followupUsedResults)} / ${formatNumber(management.successfulResults)} 个成功结果发生后续使用`, action: "assets" },
    { title: "首轮直接采纳率", value: formatPercent(management.firstRoundAdoptionRate), note: `${formatNumber(management.firstRoundAdoptedChains)} / ${formatNumber(management.creativeChains)} 条创作链首轮结果直接被采纳`, action: "efficiency" },
    { title: "跨任务复用率", value: formatPercent(management.crossTaskReuseRate), note: `${formatNumber(management.crossTaskReusedAssets)} / ${formatNumber(management.generatedAssets)} 个生成素材进入其他任务`, action: "assets" },
    { title: "平均后续使用结果积分", value: formatNumber(management.averagePointsPerFollowupResult, 2), note: `${formatNumber(reportDemoData.points.consumed)} 消耗积分 / ${formatNumber(management.followupUsedResults)} 个后续使用结果`, action: "points" },
  ]
  return (
    <section className="xm-panel">
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border-light)" }}><SectionHeading title="管理关注项" meta="从产出使用、创作过程、资产复用与积分效率观察平台价值" /></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <button key={item.title} type="button" onClick={() => onThemeChange(item.action)} className="min-h-[132px] border-b border-r p-4 text-left transition-colors hover:bg-[var(--gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-light)" }}>
            <span className="text-xs font-medium text-[var(--text-secondary)]">{item.title}</span>
            <strong className="mt-2 block text-xl font-semibold text-[var(--text-title)] tabular-nums">{item.value}</strong>
            <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">{item.note}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function DepartmentUsageTable({ rows }) {
  const columns = [
    { key: "users", label: "实际使用人数", format: formatNumber },
    { key: "uses", label: "实际使用次数", format: formatNumber },
    { key: "usesPerUser", label: "人均实际使用", format: (_, row) => formatNumber(row.uses / row.users, 1) },
    { key: "followupUseRate", label: "产出后续使用率", format: formatPercent },
    { key: "points", label: "消耗积分", format: formatNumber },
    { key: "pointsPerFollowupResult", label: "平均后续使用结果积分", format: (value) => formatNumber(value, 2) },
  ]

  return (
    <section className="xm-panel overflow-hidden" aria-labelledby="department-usage-title">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border-light)" }}>
        <div><h2 id="department-usage-title" className="text-base font-semibold text-[var(--text-title)]">各部门使用与价值概览</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">仅展示当前统计范围内有实际使用记录的部门</p></div>
        <span className="shrink-0 text-xs text-[var(--text-secondary)]">共 {formatNumber(rows.length)} 个部门</span>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-[var(--gray-50)] text-xs font-semibold text-[var(--text-secondary)]"><tr><th className="px-4 py-3 text-left">部门</th>{columns.map((column) => <th key={column.key} className="px-3 py-3 text-right">{column.label}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.name} className="border-t transition-colors hover:bg-[var(--gray-25)]" style={{ borderColor: "var(--border-light)" }}><td className="px-4 py-3 font-medium text-[var(--text-title)]">{row.name}</td>{columns.map((column) => <td key={column.key} className="px-3 py-3 text-right text-[var(--text-body)] tabular-nums">{column.format(row[column.key], row)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => <article key={row.name} className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><strong className="break-words text-sm text-[var(--text-title)]">{row.name}</strong><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--border-light)" }}>{columns.map((column) => <div key={column.key}><dt className="text-xs leading-5 text-[var(--text-secondary)]">{column.label}</dt><dd className="mt-1 text-sm font-medium text-[var(--text-title)] tabular-nums">{column.format(row[column.key], row)}</dd></div>)}</dl></article>)}
      </div>
    </section>
  )
}

function ReportDetailPanel({ title, items }) {
  return (
    <section className="xm-panel p-4">
      <SectionHeading title={title} meta="当前统计范围" />
      <div className="mt-4 divide-y divide-[var(--border-light)]">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 py-3 first:pt-1 last:pb-1">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gray-100)] text-[var(--text-secondary)]"><Clock3 size={16} /></span>
            <div className="min-w-0 flex-1"><strong className="text-sm font-medium text-[var(--text-title)]">{item.label}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.detail}</p></div>
            <strong className="shrink-0 text-sm font-semibold text-[var(--text-title)] tabular-nums">{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function ValueBlock({ label, value, note }) {
  return <div className="rounded-lg bg-[var(--gray-50)] p-3"><span className="text-xs text-[var(--text-secondary)]">{label}</span><strong className="mt-1 block text-xl font-semibold text-[var(--text-title)] tabular-nums">{value}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{note}</span></div>
}

function getPersonScope(person, feature) {
  const features = feature
    ? person.features.filter((item) => item.name === feature.name)
    : person.features
  if (!features.length) return null
  const sum = (key) => features.reduce((total, item) => total + item[key], 0)
  const uses = sum("uses")
  const points = sum("points")
  const followupUsedResults = sum("followupUsedResults")

  return {
    features,
    uses,
    points,
    successfulResults: sum("successfulResults"),
    followupUsedResults,
    creativeChains: sum("creativeChains"),
    firstRoundAdoptedChains: sum("firstRoundAdoptedChains"),
    crossTaskReusedAssets: sum("crossTaskReusedAssets"),
    crossTaskReuseCount: sum("crossTaskReuseCount"),
    teamUsedMaterials: sum("teamUsedMaterials"),
    teamMaterialUseCount: sum("teamMaterialUseCount"),
    teamUsedPrompts: sum("teamUsedPrompts"),
    teamPromptUseCount: sum("teamPromptUseCount"),
  }
}

function averagePersonMetric(people, feature, selector) {
  if (!people.length) return 0
  return people.reduce((total, person) => total + selector(getPersonScope(person, feature)), 0) / people.length
}

function PeopleInsightsContent({ feature, selectedScope, startDate, endDate }) {
  const [query, setQuery] = useState("")
  const [selectedPersonId, setSelectedPersonId] = useState(personInsightRows[0]?.id ?? null)
  const scopePeople = useMemo(() => personInsightRows.filter((person) => {
    const inOrganization = selectedScope.id === "company" || person.department === selectedScope.name
    return inOrganization && getPersonScope(person, feature)
  }), [feature, selectedScope])
  const visiblePeople = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return scopePeople
    return scopePeople.filter((person) => `${person.name} ${person.department}`.toLowerCase().includes(normalizedQuery))
  }, [query, scopePeople])

  const person = visiblePeople.find((item) => item.id === selectedPersonId) ?? visiblePeople[0] ?? null
  const effectivePersonId = person?.id ?? null
  const personScope = person ? getPersonScope(person, feature) : null
  const personTrend = personScope ? createTimeRangeTrend(startDate, endDate, {
    points: personScope.points,
    uses: personScope.uses,
    followupUsedResults: personScope.followupUsedResults,
  }, person.name.length) : null
  const departmentPeers = person
    ? scopePeople.filter((item) => item.department === person.department)
    : []

  return (
    <div className="grid min-w-0 gap-4 xl:sticky xl:top-11 xl:h-[calc(100dvh-100px)] xl:min-h-0 xl:grid-cols-[280px_minmax(0,1fr)] xl:overflow-hidden">
      <PeopleSearchPanel
        people={visiblePeople}
        query={query}
        onQueryChange={setQuery}
        selectedPersonId={effectivePersonId}
        onSelectPerson={setSelectedPersonId}
        total={scopePeople.length}
      />
      {person && personScope ? (
        <div className="min-w-0 space-y-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pr-1">
          <PersonProfileHeader person={person} feature={feature} selectedScope={selectedScope} />
          <PersonUsageMetrics person={person} scope={personScope} />
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <PersonValuePanel scope={personScope} />
            <PersonPointsPanel person={person} scope={personScope} feature={feature} peers={departmentPeers} />
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <PersonFeatureDistribution rows={personScope.features} totalUses={personScope.uses} />
            <PersonTrendPanel trend={personTrend} />
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <PersonAssetValuePanel scope={personScope} />
            <PersonDataSummary person={person} scope={personScope} feature={feature} peers={departmentPeers} />
          </div>
        </div>
      ) : (
        <section className="xm-panel flex min-h-80 items-center justify-center p-4 xl:h-full xl:min-h-0">
          <UnavailableState icon={UserRound} title="暂无匹配人员" description="当前时间、组织、功能和人员搜索条件下，没有实际使用记录。" />
        </section>
      )}
    </div>
  )
}

function PeopleSearchPanel({ people, query, onQueryChange, selectedPersonId, onSelectPerson, total }) {
  return (
    <aside className="xm-panel flex h-[calc(100dvh-144px)] min-w-0 flex-col self-start overflow-hidden sm:h-[calc(100dvh-100px)] xl:h-full xl:min-h-0" aria-label="人员搜索与选择">
      <div className="shrink-0 border-b p-4" style={{ borderColor: "var(--border-light)" }}>
        <SectionHeading title="选择人员" meta={`${formatNumber(total)} 人有记录`} />
        <label className="relative mt-3 block">
          <Search size={15} className="pointer-events-none absolute left-3 top-3 text-[var(--text-disabled)]" />
          <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索姓名或部门" aria-label="搜索姓名或部门" className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-[var(--text-body)] outline-none transition-colors focus-visible:border-[var(--brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" style={{ borderColor: "var(--border-base)" }} />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {people.length ? people.map((person) => {
          const selected = person.id === selectedPersonId
          return (
            <button key={person.id} type="button" onClick={() => onSelectPerson(person.id)} aria-pressed={selected} className={`flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${selected ? "bg-[var(--brand-primary-soft)]" : "hover:bg-[var(--gray-50)]"}`}>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--gray-100)] text-[var(--text-secondary)]"}`}><UserRound size={16} /></span>
              <span className="min-w-0 flex-1"><strong className={`block truncate text-sm font-medium ${selected ? "text-[var(--brand-primary)]" : "text-[var(--text-title)]"}`}>{person.name}</strong><span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]" title={person.department}>{person.department}</span></span>
              {selected && <Check size={15} className="shrink-0 text-[var(--brand-primary)]" />}
            </button>
          )
        }) : <UnavailableState icon={Search} title="未找到人员" description="请调整姓名、部门或顶部筛选条件。" />}
      </div>
    </aside>
  )
}

function PersonProfileHeader({ person, feature, selectedScope }) {
  return (
    <section className="xm-panel flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white"><UserRound size={20} /></span>
        <div className="min-w-0"><h2 className="truncate text-lg font-semibold text-[var(--text-title)]">{person.name}</h2><p className="mt-1 truncate text-xs text-[var(--text-secondary)]" title={person.department}>{person.department}</p></div>
      </div>
      <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-right">
        <div><dt className="text-[var(--text-secondary)]">最近使用</dt><dd className="mt-1 font-medium text-[var(--text-title)] tabular-nums">{person.lastActiveAt}</dd></div>
        <div><dt className="text-[var(--text-secondary)]">当前范围</dt><dd className="mt-1 max-w-48 truncate font-medium text-[var(--text-title)]" title={`${selectedScope.path} · ${feature?.name ?? "全部功能"}`}>{feature?.name ?? "全部功能"}</dd></div>
      </dl>
    </section>
  )
}

function PersonUsageMetrics({ person, scope }) {
  const primaryFeature = [...scope.features].sort((left, right) => right.uses - left.uses)[0]
  const metrics = [
    { label: "实际使用次数", value: formatNumber(scope.uses), note: "实际任务或核心动作", icon: MousePointerClick },
    { label: "有效活跃天数", value: formatNumber(person.effectiveActiveDays), note: "发生生成、采纳或复用行为", icon: CalendarDays },
    { label: "使用功能数", value: formatNumber(scope.features.length), note: "有实际使用记录的功能", icon: Layers3 },
    { label: "主要使用功能", value: primaryFeature.name, note: `占个人使用 ${formatPercent(primaryFeature.uses / scope.uses * 100)}`, icon: Gauge },
  ]
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="个人使用概况">{metrics.map((metric) => <article key={metric.label} className="xm-panel min-w-0 p-4"><span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><metric.icon size={17} /></span><span className="mt-3 block text-xs text-[var(--text-secondary)]">{metric.label}</span><strong className="mt-1 block truncate text-xl font-semibold text-[var(--text-title)] tabular-nums" title={String(metric.value)}>{metric.value}</strong><span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{metric.note}</span></article>)}</section>
}

function PersonValuePanel({ scope }) {
  const followupRate = scope.successfulResults ? scope.followupUsedResults / scope.successfulResults * 100 : 0
  const firstRoundRate = scope.creativeChains ? scope.firstRoundAdoptedChains / scope.creativeChains * 100 : 0
  const items = [
    { label: "成功产出结果", value: formatNumber(scope.successfulResults), note: "平台返回成功结果" },
    { label: "产出后续使用率", value: formatPercent(followupRate), note: `${formatNumber(scope.followupUsedResults)} 个结果进入后续工作` },
    { label: "首轮直接采纳率", value: formatPercent(firstRoundRate), note: `${formatNumber(scope.firstRoundAdoptedChains)} 条创作链首轮结果直接被采纳` },
    { label: "跨任务复用资产", value: formatNumber(scope.crossTaskReusedAssets), note: "生成资产进入其他任务" },
  ]
  return <section className="xm-panel min-w-0 p-4"><SectionHeading title="产出价值" meta="以实际后续行为衡量" /><div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item) => <ValueBlock key={item.label} {...item} />)}</div></section>
}

function PersonPointsPanel({ person, scope, feature, peers }) {
  const averagePerUse = scope.uses ? scope.points / scope.uses : 0
  const averagePerFollowup = scope.followupUsedResults ? scope.points / scope.followupUsedResults : 0
  const departmentAverageUses = averagePersonMetric(peers, feature, (item) => item.uses)
  const departmentAveragePointsPerFollowup = averagePersonMetric(peers, feature, (item) => item.followupUsedResults ? item.points / item.followupUsedResults : 0)
  const useDelta = departmentAverageUses ? (scope.uses / departmentAverageUses - 1) * 100 : 0
  const pointDelta = departmentAveragePointsPerFollowup ? (averagePerFollowup / departmentAveragePointsPerFollowup - 1) * 100 : 0
  return (
    <section className="xm-panel min-w-0 p-4">
      <SectionHeading title="积分效率" meta={`对比${person.department}有记录人员`} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><ValueBlock label="消耗积分" value={formatNumber(scope.points)} note="统计周期内已结算并实际扣除" /><ValueBlock label="平均每次使用积分" value={formatNumber(averagePerUse, 2)} note="消耗积分 / 实际使用次数" /><ValueBlock label="平均后续使用结果积分" value={<PointsEfficiencyValue points={scope.points} resultCount={scope.followupUsedResults} />} note="消耗积分 / 后续使用结果数" /><ValueBlock label="部门有记录人员" value={formatNumber(peers.length)} note="仅作为同范围参照" /></div>
      <div className="mt-4 divide-y divide-[var(--border-light)] border-t text-xs" style={{ borderColor: "var(--border-light)" }}><ComparisonRow label="实际使用次数" value={scope.uses} average={departmentAverageUses} delta={useDelta} /><ComparisonRow label="平均后续使用结果积分" value={averagePerFollowup} average={departmentAveragePointsPerFollowup} delta={pointDelta} decimals={2} /></div>
    </section>
  )
}

function ComparisonRow({ label, value, average, delta, decimals = 0 }) {
  const direction = delta > 0 ? "高于" : delta < 0 ? "低于" : "等于"
  return <div className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="text-[var(--text-secondary)]">{label}</span><span className="text-right text-[var(--text-body)]"><strong className="font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(value, decimals)}</strong><span className="ml-2">部门均值 {formatNumber(average, decimals)} · {direction} {formatPercent(Math.abs(delta))}</span></span></div>
}

function PersonFeatureDistribution({ rows, totalUses }) {
  const sortedRows = [...rows].sort((left, right) => right.uses - left.uses)
  return (
    <section className="xm-panel min-w-0 p-4">
      <SectionHeading title="功能使用结构" meta={`${formatNumber(rows.length)} 个功能有记录`} />
      <div className="mt-4 divide-y divide-[var(--border-light)]">{sortedRows.map((row) => <div key={row.name} className="py-3 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center justify-between gap-3"><strong className="truncate text-sm font-medium text-[var(--text-title)]">{row.name}</strong><span className="shrink-0 text-sm font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(row.uses)}</span></div><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[var(--gray-100)]"><span className="block h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${row.uses / totalUses * 100}%` }} /></span><div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]"><span>占比 {formatPercent(row.uses / totalUses * 100)}</span><span>{formatNumber(row.points)} 积分 · {formatNumber(row.followupUsedResults)} 个后续使用结果</span></div></div>)}</div>
    </section>
  )
}

function PersonTrendPanel({ trend }) {
  const { rows, rangeLabel } = trend
  const maxUses = Math.max(...rows.map((row) => row.uses), 1)
  return (
    <section className="xm-panel min-w-0 p-4">
      <SectionHeading title="使用趋势" meta={rangeLabel} />
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="grid h-52 items-end gap-1 sm:gap-2" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(42px, 1fr))`, minWidth: `${Math.max(100, rows.length * 48)}px` }} role="img" aria-label={`个人使用趋势，${rangeLabel}`}>
          {rows.map((row) => <div key={row.key} className="flex h-full min-w-0 flex-col justify-end"><div className="flex min-h-0 flex-1 items-end justify-center gap-0.5"><span className="w-2.5 rounded-t bg-[var(--brand-primary)] sm:w-3" style={{ height: `${Math.max(5, row.uses / maxUses * 100)}%` }} title={`${row.label} 实际使用次数 ${row.uses}`} /><span className="w-2.5 rounded-t bg-[var(--brand-primary-border)] sm:w-3" style={{ height: `${Math.max(4, row.followupUsedResults / maxUses * 100)}%` }} title={`${row.label} 后续使用结果数 ${row.followupUsedResults}`} /></div><strong className="mt-2 truncate text-center text-[10px] font-medium text-[var(--text-title)] tabular-nums">{formatCompactNumber(row.uses)}</strong><span className="mt-1 whitespace-nowrap text-center text-[10px] text-[var(--text-secondary)]">{row.label}</span></div>)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-[var(--text-secondary)]" style={{ borderColor: "var(--border-light)" }}><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[var(--brand-primary)]" />实际使用次数</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[var(--brand-primary-border)]" />后续使用结果数</span><span className="ml-auto">积分合计 {formatNumber(rows.reduce((total, row) => total + row.points, 0))}</span></div>
    </section>
  )
}

function PersonAssetValuePanel({ scope }) {
  const items = [
    { label: "跨任务复用资产", value: scope.crossTaskReusedAssets, uses: scope.crossTaskReuseCount, note: "本人生成后进入其他任务", icon: Repeat2 },
    { label: "被团队使用素材", value: scope.teamUsedMaterials, uses: scope.teamMaterialUseCount, note: "本人沉淀且被团队使用", icon: Layers3 },
    { label: "被团队使用提示词", value: scope.teamUsedPrompts, uses: scope.teamPromptUseCount, note: "本人沉淀且被团队使用", icon: Database },
  ]
  return <section className="xm-panel min-w-0 p-4"><SectionHeading title="资产复用价值" meta="去重资产数与累计复用次数" /><div className="mt-4 divide-y divide-[var(--border-light)]">{items.map((item) => <div key={item.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"><item.icon size={17} /></span><div className="min-w-0 flex-1"><strong className="text-sm font-medium text-[var(--text-title)]">{item.label}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.note}</p></div><div className="shrink-0 text-right"><strong className="block text-lg font-semibold text-[var(--text-title)] tabular-nums">{formatNumber(item.value)} 个</strong><span className="mt-1 block text-xs text-[var(--text-secondary)] tabular-nums">{formatNumber(item.uses)} 次复用</span></div></div>)}</div></section>
}

function PersonDataSummary({ person, scope, feature, peers }) {
  const primaryFeature = [...scope.features].sort((left, right) => right.uses - left.uses)[0]
  const primaryShare = primaryFeature.uses / scope.uses * 100
  const personPointEfficiency = scope.followupUsedResults ? scope.points / scope.followupUsedResults : 0
  const departmentPointEfficiency = averagePersonMetric(peers, feature, (item) => item.followupUsedResults ? item.points / item.followupUsedResults : 0)
  const summaries = [
    { title: "功能使用", icon: Gauge, description: `${primaryFeature.name}为主要使用功能，占个人实际使用的 ${formatPercent(primaryShare)}；共使用 ${formatNumber(scope.features.length)} 个功能。` },
    { title: "资产复用", icon: Repeat2, description: `${formatNumber(scope.crossTaskReusedAssets)} 个生成资产发生 ${formatNumber(scope.crossTaskReuseCount)} 次跨任务复用；${formatNumber(scope.teamUsedMaterials)} 个素材和 ${formatNumber(scope.teamUsedPrompts)} 个提示词被团队使用。` },
    { title: "积分效率", icon: Coins, description: `平均每个后续使用结果消耗 ${formatNumber(personPointEfficiency, 2)} 积分，同部门有记录人员均值为 ${formatNumber(departmentPointEfficiency, 2)}。` },
  ]
  return <section className="xm-panel min-w-0 p-4"><SectionHeading title="个人数据总结" meta="功能使用 · 资产复用 · 积分效率" /><div className="mt-4 divide-y divide-[var(--border-light)]">{summaries.map((item) => <div key={item.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--gray-100)] text-[var(--text-secondary)]"><item.icon size={17} /></span><div className="min-w-0"><strong className="text-sm font-medium text-[var(--text-title)]">{item.title}</strong><p className="mt-1 text-sm leading-6 text-[var(--text-body)]">{item.description}</p></div></div>)}</div><p className="mt-4 border-t pt-3 text-xs leading-5 text-[var(--text-secondary)]" style={{ borderColor: "var(--border-light)" }}>{person.name}的数据用于理解使用结构与产出行为，不作为人员绩效评价。</p></section>
}

function UnavailableState({ icon: Icon, title, description }) {
  return <div className="my-8 flex flex-col items-center px-4 py-6 text-center"><span className="flex size-11 items-center justify-center rounded-lg bg-[var(--gray-100)] text-[var(--text-secondary)]"><Icon size={20} /></span><strong className="mt-3 text-sm font-semibold text-[var(--text-title)]">{title}</strong><p className="mt-1 max-w-xl text-xs leading-5 text-[var(--text-secondary)]">{description}</p></div>
}

function formatFeatureCell(column, row) {
  if (row[column.key] == null && column.key !== "tasksPerUser") return "暂无统计结果"
  if (column.key === "tasksPerUser" && (row.tasks == null || row.users == null)) return "暂无统计结果"
  return column.format(row[column.key], row)
}

function FeatureTable({ rows, columns = "details", compact = false }) {
  const columnSets = {
    usage: [
      { key: "users", label: "实际使用用户", format: formatNumber },
      { key: "coverageRate", label: "注册用户覆盖率", format: formatPercent },
      { key: "tasks", label: "实际使用次数", format: formatNumber },
      { key: "tasksPerUser", label: "人均使用次数", format: (_, row) => formatNumber(row.tasks / row.users, 1) },
    ],
    efficiency: [
      { key: "tasks", label: "实际使用数", format: formatNumber },
      { key: "success", label: "成功", format: formatNumber },
      { key: "canceled", label: "取消", format: formatNumber },
      { key: "failed", label: "失败", format: formatNumber },
      { key: "successRate", label: "成功率", format: formatPercent },
    ],
    details: [
      { key: "tasks", label: "实际使用次数", format: formatNumber },
      { key: "users", label: "实际使用用户", format: formatNumber },
      { key: "success", label: "成功", format: formatNumber },
      { key: "canceled", label: "取消", format: formatNumber },
      { key: "failed", label: "失败", format: formatNumber },
      { key: "pending", label: "未完成", format: formatNumber },
      { key: "successRate", label: "成功率", format: formatPercent },
    ],
  }
  const selectedColumns = columnSets[columns]
  const title = compact ? "主要功能明细" : columns === "usage" ? "功能使用明细" : columns === "efficiency" ? "功能运行状态" : "功能数据明细"

  return (
    <section className="xm-panel overflow-hidden" aria-labelledby="feature-table-title">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border-light)" }}><div><h2 id="feature-table-title" className="text-base font-semibold text-[var(--text-title)]">{title}</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">按线上一级工具统一展示使用与运行指标</p></div><span className="shrink-0 text-xs text-[var(--text-secondary)]">共 {formatNumber(rows.length)} 项</span></div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead className="bg-[var(--gray-50)] text-xs font-semibold text-[var(--text-secondary)]"><tr><th className="px-4 py-3 text-left">功能</th>{selectedColumns.map((column) => <th key={column.key} className="px-3 py-3 text-right">{column.label}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.name} className="border-t transition-colors hover:bg-[var(--gray-25)]" style={{ borderColor: "var(--border-light)" }}><td className="px-4 py-3"><span className="font-medium text-[var(--text-title)]">{row.name}</span></td>{selectedColumns.map((column) => <td key={column.key} className="px-3 py-3 text-right text-[var(--text-body)] tabular-nums">{formatFeatureCell(column, row)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => <article key={row.name} className="rounded-lg border p-4" style={{ borderColor: "var(--border-base)" }}><strong className="break-all text-sm text-[var(--text-title)]">{row.name}</strong><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "var(--border-light)" }}>{selectedColumns.map((column) => <div key={column.key}><dt className="text-xs text-[var(--text-secondary)]">{column.label}</dt><dd className="mt-1 text-sm font-medium text-[var(--text-title)] tabular-nums">{formatFeatureCell(column, row)}</dd></div>)}</dl></article>)}
      </div>
    </section>
  )
}

function SectionHeading({ title, meta }) {
  return <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><h2 className="text-base font-semibold text-[var(--text-title)]">{title}</h2><span className="text-xs text-[var(--text-secondary)]">{meta}</span></div>
}

function MetricDefinitionDialog({ metric, onClose }) {
  const definition = getMetricDefinition(metric)

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--overlay-scrim)] p-3 sm:p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex max-h-[calc(100vh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-h-[calc(100vh-32px)]" role="dialog" aria-modal="true" aria-labelledby="metric-definition-title">
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5" style={{ borderColor: "var(--border-base)" }}><div><h2 id="metric-definition-title" className="text-lg font-semibold text-[var(--text-title)]">{metric.label}</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">当前指标说明</p></div><button type="button" onClick={onClose} aria-label="关闭指标说明" title="关闭" className="flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"><X size={18} /></button></div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <div className="divide-y divide-[var(--border-light)]">
            <DefinitionItem title="指标解读" description={definition.meaning} />
            <DefinitionItem title="统计口径" description={definition.rule} />
            <DefinitionItem title="管理参考" description={definition.value} />
          </div>
        </div>
        <div className="flex justify-end border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border-base)" }}><Button size="lg" onClick={onClose}>知道了</Button></div>
      </section>
    </div>,
    document.body,
  )
}

function DefinitionItem({ title, description }) {
  return <section className="py-4 first:pt-0 last:pb-0"><h3 className="text-xs font-semibold text-[var(--text-secondary)]">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[var(--text-body)]">{description}</p></section>
}
