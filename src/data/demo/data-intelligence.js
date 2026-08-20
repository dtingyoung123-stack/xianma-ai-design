export const analysisThemes = [
  { key: "overview", label: "数据总览", summary: "使用、任务与积分" },
  { key: "usage", label: "使用分析", summary: "用户覆盖与功能分布" },
  { key: "efficiency", label: "任务与效率", summary: "状态与处理效率" },
  { key: "points", label: "积分使用", summary: "分布与使用效率" },
  { key: "assets", label: "资产与复用", summary: "沉淀与再次使用" },
  { key: "details", label: "人员洞察", summary: "个人使用与产出价值" },
]

export const reportDemoData = {
  registeredUsers: 299,
  taskUsers: 266,
  coverageRate: 89,
  actualUses: 51326,
  tasks: 49998,
  successfulTasks: 43677,
  successRate: 87.4,
  failedTasks: 1117,
  failedRate: 2.2,
  canceledTasks: 5196,
  canceledRate: 10.4,
  pendingTasks: 8,
  efficiency: {
    averageDurationSeconds: 42,
    medianDurationSeconds: 31,
    completedWithinTwoMinutesRate: 91.6,
    peakPeriod: "14:00-16:00",
  },
  points: {
    consumed: 136167,
    users: 248,
    averagePerUse: 2.72,
    averagePerFollowupResult: 6.37,
    topTenUserShare: 52.1,
    periodGrowthRate: 8.7,
    useGrowthRate: 3.1,
  },
  cancelReasons: [
    { label: "主动取消", value: 3440, rate: 66.2 },
    { label: "系统中止", value: 1216, rate: 23.4 },
    { label: "超时关闭", value: 540, rate: 10.4 },
  ],
  assets: {
    materials: {
      available: 4328,
      added: 812,
      active: 1685,
      usageCount: 3942,
      usageRate: 38.9,
      taskCount: 3210,
      averageUsesPerActiveAsset: 2.34,
      personalUsage: 1230,
      teamUsage: 1680,
      publicUsage: 1032,
    },
    prompts: {
      available: 2160,
      added: 386,
      active: 972,
      usageCount: 3148,
      usageRate: 45.0,
      copyCount: 1480,
      templateUseCount: 1160,
      applyToToolCount: 508,
      applyToToolRate: 16.1,
    },
    overall: {
      available: 6488,
      added: 1198,
      active: 2657,
      usageCount: 7090,
      teamPublicUsageShare: 67.4,
    },
    management: {
      publicCandidates: 86,
      dormantAssets: 1124,
      unusedNewAssets: 214,
    },
  },
  management: {
    successfulResults: 47370,
    followupUsedResults: 21384,
    followupUseRate: 45.1,
    creativeChains: 15048,
    firstRoundAdoptedChains: 8126,
    firstRoundAdoptionRate: 54.0,
    crossTaskReusedAssets: 1685,
    generatedAssets: 4328,
    crossTaskReuseRate: 38.9,
    averagePointsPerFollowupResult: 6.37,
  },
  taskStatuses: [
    { key: "success", label: "成功", value: 43677, rate: 87.4 },
    { key: "canceled", label: "取消", value: 5196, rate: 10.4 },
    { key: "failed", label: "失败", value: 1117, rate: 2.2 },
    { key: "pending", label: "未完成", value: 8, rate: 0.02, rateLabel: "<0.1%" },
  ],
}

const featureDemoMetrics = {
  "专家模式": { points: 83210, averageDurationSeconds: 46, followupUsedResults: 12800, followupUseRate: 47.8 },
  "一键改字": { points: 4780, averageDurationSeconds: 28, followupUsedResults: 720, followupUseRate: 51.6 },
  "主体替换": { points: 23640, averageDurationSeconds: 39, followupUsedResults: 3600, followupUseRate: 43.2 },
  "产品微调": { points: 3010, averageDurationSeconds: 34, followupUsedResults: 510, followupUseRate: 46.3 },
  "批量美颜": { points: 145, averageDurationSeconds: 52, followupUsedResults: 18, followupUseRate: 37.5 },
  "批量改图": { points: 1920, averageDurationSeconds: 44, followupUsedResults: 270, followupUseRate: 41.2 },
  "AI多角度": { points: 310, averageDurationSeconds: 58, followupUsedResults: 34, followupUseRate: 38.6 },
  "AI区域重绘": { points: 480, averageDurationSeconds: 41, users: 13, followupUsedResults: 64, followupUseRate: 44.1 },
  "AI提示词": { points: 0, averageDurationSeconds: 6 },
  "AI买家秀": { points: 16950, averageDurationSeconds: 48, users: 114, followupUsedResults: 2810, followupUseRate: 49.8 },
  "AI视频流": { points: 970, averageDurationSeconds: 96, followupUsedResults: 72, followupUseRate: 29.7 },
  "AI商品套图": { points: 88, averageDurationSeconds: 63, followupUsedResults: 9, followupUseRate: 52.9 },
  "AI无限画布": { points: 664, averageDurationSeconds: 37, followupUsedResults: 477, followupUseRate: 43.5 },
}

const rawFeatureTaskRows = [
  { name: "专家模式", tasks: 30664, users: 183, success: 26710, failed: 484, canceled: 3468, pending: 2 },
  { name: "主体替换", tasks: 8546, users: 118, success: 7401, failed: 279, canceled: 864, pending: 2 },
  { name: "AI买家秀", tasks: 5972, users: 109, success: 5273, failed: 178, canceled: 521, pending: 0 },
  { name: "一键改字", tasks: 1895, users: 102, success: 1736, failed: 44, canceled: 115, pending: 0 },
  { name: "产品微调", tasks: 1115, users: 83, success: 1045, failed: 20, canceled: 49, pending: 1 },
  { name: "批量改图", tasks: 698, users: 62, success: 630, failed: 34, canceled: 34, pending: 0 },
  { name: "AI视频流", tasks: 226, users: 24, success: 159, failed: 44, canceled: 23, pending: 0 },
  { name: "AI多角度", tasks: 100, users: 18, success: 79, failed: 7, canceled: 14, pending: 0 },
  { name: "AI买家秀分镜", tasks: 66, users: 11, success: 64, failed: 0, canceled: 2, pending: 0 },
  { name: "ai-capability:matting", tasks: 59, users: 5, success: 54, failed: 0, canceled: 5, pending: 0, technical: true },
  { name: "批量美颜", tasks: 50, users: 11, success: 33, failed: 6, canceled: 11, pending: 0 },
  { name: "AI区域重绘", tasks: 43, users: 8, success: 15, failed: 0, canceled: 28, pending: 0 },
  { name: "ai-capability:erase", tasks: 36, users: 3, success: 6, failed: 0, canceled: 30, pending: 0, technical: true },
  { name: "ai-capability:outpaint", tasks: 19, users: 1, success: 19, failed: 0, canceled: 0, pending: 0, technical: true },
  { name: "AI商品套图", tasks: 17, users: 8, success: 17, failed: 0, canceled: 0, pending: 0 },
  { name: "AI买家秀评价", tasks: 6, users: 5, success: 5, failed: 0, canceled: 1, pending: 0 },
]

function mergeTaskRows(name, sourceNames) {
  const sourceRows = rawFeatureTaskRows.filter((row) => sourceNames.includes(row.name))
  const sum = (key) => sourceRows.reduce((total, row) => total + row[key], 0)
  const tasks = sum("tasks")
  const demoMetrics = featureDemoMetrics[name]
  const users = demoMetrics.users ?? (sourceRows.length === 1 ? sourceRows[0].users : null)

  return {
    name,
    measurement: "task",
    pointsMode: "charged",
    tasks,
    users,
    success: sum("success"),
    failed: sum("failed"),
    canceled: sum("canceled"),
    pending: sum("pending"),
    successRate: tasks ? sum("success") / tasks * 100 : null,
    coverageRate: users == null ? null : users / reportDemoData.registeredUsers * 100,
    points: demoMetrics.points,
    followupUsedResults: demoMetrics.followupUsedResults,
    followupUseRate: demoMetrics.followupUseRate,
    averageDurationSeconds: demoMetrics.averageDurationSeconds,
  }
}

function createDemoFeature(name, measurement, pointsMode, values) {
  const successRate = values.tasks ? values.success / values.tasks * 100 : 0
  return {
    name,
    measurement,
    pointsMode,
    ...values,
    successRate,
    coverageRate: values.users / reportDemoData.registeredUsers * 100,
  }
}

export const featureTaskRows = [
  mergeTaskRows("专家模式", ["专家模式"]),
  mergeTaskRows("一键改字", ["一键改字"]),
  mergeTaskRows("主体替换", ["主体替换"]),
  mergeTaskRows("产品微调", ["产品微调"]),
  mergeTaskRows("批量美颜", ["批量美颜"]),
  mergeTaskRows("批量改图", ["批量改图"]),
  mergeTaskRows("AI多角度", ["AI多角度"]),
  mergeTaskRows("AI区域重绘", ["AI区域重绘", "ai-capability:matting", "ai-capability:erase", "ai-capability:outpaint"]),
  createDemoFeature("AI提示词", "action", "free", { tasks: 1328, users: 76, success: 1247, failed: 51, canceled: 30, pending: 0, ...featureDemoMetrics["AI提示词"] }),
  mergeTaskRows("AI买家秀", ["AI买家秀", "AI买家秀分镜", "AI买家秀评价"]),
  mergeTaskRows("AI视频流", ["AI视频流"]),
  mergeTaskRows("AI商品套图", ["AI商品套图"]),
  createDemoFeature("AI无限画布", "canvas", "charged", { tasks: 486, users: 54, success: 431, failed: 21, canceled: 31, pending: 3, ...featureDemoMetrics["AI无限画布"] }),
]

export const departmentUsageRows = [
  { name: "视觉中心~画江湖", users: 84, uses: 16540, followupUsedResults: 8050, successfulResults: 15720, followupUseRate: 51.2, points: 51000, pointsPerFollowupResult: 6.34 },
  { name: "创新事业群", users: 61, uses: 11020, followupUsedResults: 4300, successfulResults: 10200, followupUseRate: 42.2, points: 26800, pointsPerFollowupResult: 6.23 },
  { name: "一马事业群", users: 43, uses: 8910, followupUsedResults: 3450, successfulResults: 8400, followupUseRate: 41.1, points: 22500, pointsPerFollowupResult: 6.52 },
  { name: "众创事业群", users: 39, uses: 7720, followupUsedResults: 3100, successfulResults: 7150, followupUseRate: 43.4, points: 20100, pointsPerFollowupResult: 6.48 },
  { name: "喜佑事业群", users: 16, uses: 3220, followupUsedResults: 1200, successfulResults: 2900, followupUseRate: 41.4, points: 7200, pointsPerFollowupResult: 6.00 },
  { name: "产品中心~众妙门", users: 13, uses: 2180, followupUsedResults: 780, successfulResults: 1900, followupUseRate: 41.1, points: 4850, pointsPerFollowupResult: 6.22 },
  { name: "数智中心~星河界", users: 10, uses: 1736, followupUsedResults: 504, successfulResults: 1100, followupUseRate: 45.8, points: 3717, pointsPerFollowupResult: 7.38 },
]

export const pointsTrendRows = [
  { label: "08/13", points: 17050, uses: 6260, followupUsedResults: 2650 },
  { label: "08/14", points: 18460, uses: 6800, followupUsedResults: 2860 },
  { label: "08/15", points: 19230, uses: 7065, followupUsedResults: 3010 },
  { label: "08/16", points: 18110, uses: 6650, followupUsedResults: 2790 },
  { label: "08/17", points: 20780, uses: 7610, followupUsedResults: 3320 },
  { label: "08/18", points: 21620, uses: 7890, followupUsedResults: 3470 },
  { label: "08/19", points: 20917, uses: 7723, followupUsedResults: 3284 },
]

export const personPointsRows = [
  { name: "成员 A01", department: "视觉中心~画江湖", points: 12280, uses: 3210, followupUsedResults: 1680, mainFeature: "专家模式" },
  { name: "成员 A02", department: "创新事业群", points: 10460, uses: 2840, followupUsedResults: 1420, mainFeature: "专家模式" },
  { name: "成员 A03", department: "一马事业群", points: 8750, uses: 2010, followupUsedResults: 920, mainFeature: "AI买家秀" },
  { name: "成员 A04", department: "众创事业群", points: 7620, uses: 1890, followupUsedResults: 850, mainFeature: "主体替换" },
  { name: "成员 A05", department: "视觉中心~画江湖", points: 6890, uses: 1710, followupUsedResults: 790, mainFeature: "专家模式" },
  { name: "成员 A06", department: "喜佑事业群", points: 6040, uses: 1520, followupUsedResults: 660, mainFeature: "一键改字" },
  { name: "成员 A07", department: "创新事业群", points: 5580, uses: 1390, followupUsedResults: 610, mainFeature: "AI买家秀" },
  { name: "成员 A08", department: "产品中心~众妙门", points: 4920, uses: 1250, followupUsedResults: 540, mainFeature: "产品微调" },
  { name: "成员 A09", department: "数智中心~星河界", points: 4360, uses: 1170, followupUsedResults: 480, mainFeature: "批量改图" },
  { name: "成员 A10", department: "一马事业群", points: 3980, uses: 1030, followupUsedResults: 410, mainFeature: "AI无限画布" },
  { name: "成员 A11", department: "众创事业群", points: 3560, uses: 960, followupUsedResults: 395, mainFeature: "AI区域重绘" },
  { name: "成员 A12", department: "视觉中心~画江湖", points: 3270, uses: 890, followupUsedResults: 360, mainFeature: "批量美颜" },
  { name: "成员 A13", department: "创新事业群", points: 2980, uses: 810, followupUsedResults: 325, mainFeature: "AI多角度" },
  { name: "成员 A14", department: "喜佑事业群", points: 2710, uses: 720, followupUsedResults: 260, mainFeature: "AI视频流" },
  { name: "成员 A15", department: "产品中心~众妙门", points: 2380, uses: 650, followupUsedResults: 245, mainFeature: "AI商品套图" },
]

const personTrendLabels = ["08/13", "08/14", "08/15", "08/16", "08/17", "08/18", "08/19"]
const personTrendWeights = [12, 14, 13, 15, 14, 17, 15]

function distributePersonMetric(total) {
  let allocated = 0
  return personTrendWeights.map((weight, index) => {
    const value = index === personTrendWeights.length - 1
      ? total - allocated
      : Math.round(total * weight / 100)
    allocated += value
    return value
  })
}

function createPersonInsight({ id, name, department, lastActiveAt, effectiveActiveDays, features }) {
  const sum = (key) => features.reduce((total, feature) => total + feature[key], 0)
  const uses = sum("uses")
  const points = sum("points")
  const followupUsedResults = sum("followupUsedResults")
  const trendUses = distributePersonMetric(uses)
  const trendPoints = distributePersonMetric(points)
  const trendFollowup = distributePersonMetric(followupUsedResults)

  return {
    id,
    name,
    department,
    lastActiveAt,
    effectiveActiveDays,
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
    features,
    trend: personTrendLabels.map((label, index) => ({
      label,
      uses: trendUses[index],
      points: trendPoints[index],
      followupUsedResults: trendFollowup[index],
    })),
  }
}

function personFeature(name, uses, successfulResults, followupUsedResults, points, creativeChains, firstRoundAdoptedChains, crossTaskReusedAssets, teamUsedMaterials, teamUsedPrompts) {
  return {
    name,
    uses,
    successfulResults,
    followupUsedResults,
    points,
    creativeChains,
    firstRoundAdoptedChains,
    crossTaskReusedAssets,
    crossTaskReuseCount: crossTaskReusedAssets * 3 + Math.round(uses * 0.02),
    teamUsedMaterials,
    teamMaterialUseCount: teamUsedMaterials * 4 + Math.round(uses * 0.01),
    teamUsedPrompts,
    teamPromptUseCount: teamUsedPrompts * 5 + Math.round(uses * 0.008),
  }
}

export const personInsightRows = [
  createPersonInsight({ id: "member-a01", name: "成员 A01", department: "视觉中心~画江湖", lastActiveAt: "08-19 16:42", effectiveActiveDays: 18, features: [
    personFeature("专家模式", 2100, 1990, 1180, 8400, 810, 524, 76, 24, 9),
    personFeature("产品微调", 620, 586, 292, 1860, 285, 176, 31, 9, 4),
    personFeature("AI区域重绘", 490, 438, 208, 2020, 220, 131, 19, 5, 3),
  ] }),
  createPersonInsight({ id: "member-a05", name: "成员 A05", department: "视觉中心~画江湖", lastActiveAt: "08-19 15:58", effectiveActiveDays: 16, features: [
    personFeature("专家模式", 1420, 1328, 704, 5680, 610, 371, 48, 17, 7),
    personFeature("一键改字", 530, 501, 270, 1240, 248, 151, 23, 8, 5),
    personFeature("AI提示词", 390, 376, 205, 0, 186, 117, 12, 3, 8),
  ] }),
  createPersonInsight({ id: "member-a02", name: "成员 A02", department: "创新事业群", lastActiveAt: "08-19 16:18", effectiveActiveDays: 17, features: [
    personFeature("AI买家秀", 1210, 1146, 642, 4840, 540, 338, 44, 16, 6),
    personFeature("专家模式", 820, 768, 382, 3280, 350, 207, 29, 10, 4),
    personFeature("主体替换", 430, 398, 189, 1720, 198, 116, 16, 5, 3),
  ] }),
  createPersonInsight({ id: "member-a07", name: "成员 A07", department: "创新事业群", lastActiveAt: "08-19 14:37", effectiveActiveDays: 14, features: [
    personFeature("主体替换", 980, 905, 428, 3920, 410, 241, 32, 11, 5),
    personFeature("AI买家秀", 590, 548, 251, 2360, 254, 143, 19, 7, 4),
    personFeature("AI提示词", 360, 344, 182, 0, 172, 101, 11, 3, 7),
  ] }),
  createPersonInsight({ id: "member-a03", name: "成员 A03", department: "一马事业群", lastActiveAt: "08-19 15:06", effectiveActiveDays: 15, features: [
    personFeature("AI买家秀", 860, 812, 402, 3440, 382, 224, 28, 9, 4),
    personFeature("AI无限画布", 610, 560, 263, 2440, 268, 151, 24, 8, 4),
    personFeature("专家模式", 430, 401, 178, 1720, 189, 107, 14, 5, 2),
  ] }),
  createPersonInsight({ id: "member-a10", name: "成员 A10", department: "一马事业群", lastActiveAt: "08-19 11:42", effectiveActiveDays: 12, features: [
    personFeature("一键改字", 720, 682, 335, 1680, 330, 197, 22, 7, 3),
    personFeature("批量改图", 510, 473, 214, 1530, 226, 132, 17, 6, 3),
    personFeature("AI提示词", 270, 258, 127, 0, 129, 72, 8, 2, 5),
  ] }),
  createPersonInsight({ id: "member-a04", name: "成员 A04", department: "众创事业群", lastActiveAt: "08-19 16:27", effectiveActiveDays: 16, features: [
    personFeature("主体替换", 910, 842, 391, 3640, 396, 229, 31, 10, 5),
    personFeature("专家模式", 650, 608, 286, 2600, 285, 166, 21, 7, 3),
    personFeature("AI区域重绘", 320, 292, 131, 1280, 142, 81, 12, 4, 2),
  ] }),
  createPersonInsight({ id: "member-a11", name: "成员 A11", department: "众创事业群", lastActiveAt: "08-18 18:12", effectiveActiveDays: 11, features: [
    personFeature("批量改图", 620, 579, 258, 1860, 276, 154, 19, 6, 3),
    personFeature("一键改字", 490, 462, 216, 1140, 224, 129, 15, 5, 3),
    personFeature("AI提示词", 310, 297, 146, 0, 146, 83, 9, 2, 6),
  ] }),
  createPersonInsight({ id: "member-a08", name: "成员 A08", department: "产品中心~众妙门", lastActiveAt: "08-19 14:32", effectiveActiveDays: 13, features: [
    personFeature("产品微调", 690, 651, 318, 2070, 308, 183, 24, 8, 4),
    personFeature("AI商品套图", 430, 408, 205, 1720, 191, 113, 17, 6, 3),
    personFeature("AI多角度", 280, 258, 119, 840, 126, 72, 10, 3, 2),
  ] }),
  createPersonInsight({ id: "member-a09", name: "成员 A09", department: "数智中心~星河界", lastActiveAt: "08-19 16:51", effectiveActiveDays: 10, features: [
    personFeature("AI提示词", 760, 731, 402, 0, 342, 225, 26, 6, 14),
    personFeature("AI无限画布", 390, 356, 171, 1560, 174, 101, 14, 5, 3),
    personFeature("AI视频流", 180, 142, 58, 900, 82, 43, 5, 2, 1),
  ] }),
]

export const assetScopeRows = [
  { name: "个人资产", materialCount: 1880, promptCount: 940, totalAssets: 2820, activeAssets: 970, usageCount: 2310, usageRate: 34.4, users: 198 },
  { name: "团队资产", materialCount: 1530, promptCount: 760, totalAssets: 2290, activeAssets: 1050, usageCount: 2960, usageRate: 45.9, users: 210 },
  { name: "公共资产", materialCount: 918, promptCount: 460, totalAssets: 1378, activeAssets: 637, usageCount: 1820, usageRate: 46.2, users: 226 },
]

export const teamAssetRows = [
  { name: "视觉中心~画江湖", materials: 760, prompts: 320, activeAssets: 520, usageCount: 1520, users: 78, crossTeamUses: 430 },
  { name: "创新事业群", materials: 420, prompts: 220, activeAssets: 310, usageCount: 980, users: 61, crossTeamUses: 260 },
  { name: "一马事业群", materials: 360, prompts: 185, activeAssets: 260, usageCount: 820, users: 43, crossTeamUses: 210 },
  { name: "众创事业群", materials: 300, prompts: 160, activeAssets: 215, usageCount: 690, users: 39, crossTeamUses: 180 },
  { name: "喜佑事业群", materials: 170, prompts: 90, activeAssets: 115, usageCount: 390, users: 16, crossTeamUses: 90 },
  { name: "产品中心~众妙门", materials: 135, prompts: 70, activeAssets: 92, usageCount: 310, users: 13, crossTeamUses: 74 },
  { name: "数智中心~星河界", materials: 95, prompts: 55, activeAssets: 68, usageCount: 240, users: 10, crossTeamUses: 62 },
]

export const topMaterialRows = [
  { name: "通用商品白底图", scope: "公共素材", team: "视觉中心~画江湖", uses: 286, users: 94, mainFeature: "专家模式", lastUsed: "08-19 16:42" },
  { name: "生活方式场景背景", scope: "团队素材", team: "创新事业群", uses: 241, users: 78, mainFeature: "AI买家秀", lastUsed: "08-19 15:36" },
  { name: "产品细节光影参考", scope: "公共素材", team: "视觉中心~画江湖", uses: 218, users: 72, mainFeature: "产品微调", lastUsed: "08-19 14:18" },
  { name: "人物展示姿态参考", scope: "团队素材", team: "一马事业群", uses: 196, users: 65, mainFeature: "主体替换", lastUsed: "08-19 11:27" },
  { name: "节日促销背景套组", scope: "公共素材", team: "众创事业群", uses: 174, users: 59, mainFeature: "批量改图", lastUsed: "08-18 17:54" },
  { name: "包装材质细节参考", scope: "团队素材", team: "产品中心~众妙门", uses: 151, users: 48, mainFeature: "AI多角度", lastUsed: "08-18 16:20" },
  { name: "自然环境背景组", scope: "团队素材", team: "喜佑事业群", uses: 133, users: 42, mainFeature: "AI商品套图", lastUsed: "08-18 13:08" },
]

export const topPromptRows = [
  { name: "商品主图质感增强", scope: "公共提示词", team: "视觉中心~画江湖", uses: 318, users: 108, mainFeature: "专家模式", lastUsed: "08-19 16:51" },
  { name: "真实买家秀场景", scope: "团队提示词", team: "创新事业群", uses: 276, users: 91, mainFeature: "AI买家秀", lastUsed: "08-19 15:48" },
  { name: "产品卖点结构化描述", scope: "公共提示词", team: "产品中心~众妙门", uses: 243, users: 84, mainFeature: "AI商品套图", lastUsed: "08-19 14:32" },
  { name: "主体替换自然融合", scope: "团队提示词", team: "一马事业群", uses: 217, users: 76, mainFeature: "主体替换", lastUsed: "08-19 12:45" },
  { name: "局部重绘边缘修复", scope: "公共提示词", team: "视觉中心~画江湖", uses: 189, users: 68, mainFeature: "AI区域重绘", lastUsed: "08-19 10:26" },
  { name: "中文文字版式保持", scope: "团队提示词", team: "众创事业群", uses: 162, users: 55, mainFeature: "一键改字", lastUsed: "08-18 18:12" },
  { name: "产品细节精修", scope: "团队提示词", team: "喜佑事业群", uses: 146, users: 49, mainFeature: "产品微调", lastUsed: "08-18 15:07" },
]
