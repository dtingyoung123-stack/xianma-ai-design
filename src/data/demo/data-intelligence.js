export const analysisThemes = [
  { key: "overview", label: "数据总览", summary: "核心经营指标" },
  { key: "usage", label: "使用分析", summary: "谁在用、用什么" },
  { key: "quality", label: "任务与质量", summary: "成功、失败、采纳" },
  { key: "cost", label: "成本效率", summary: "积分与有效成本" },
  { key: "assets", label: "资产与复用", summary: "沉淀与再次使用" },
  { key: "details", label: "数据明细", summary: "用户、任务、动作" },
]

export const dataSnapshot = {
  date: "2026-07-30",
  source: "平台使用数据快照_2026-07-30.txt",
  registeredUsers: 299,
  taskUsers: 266,
  coverageRate: 89,
  tasks: 49512,
  successfulTasks: 43246,
  successRate: 87.3,
  failedTasks: 1096,
  failedRate: 2.2,
  canceledTasks: 5165,
  canceledRate: 10.4,
  pendingTasks: 5,
  points: {
    primary: 136167,
    accountSyncReference: 105452,
    difference: 30715,
    averagePerTask: 2.75,
  },
  taskStatuses: [
    { key: "success", label: "成功", value: 43246, rate: 87.3 },
    { key: "canceled", label: "取消", value: 5165, rate: 10.4 },
    { key: "failed", label: "失败", value: 1096, rate: 2.2 },
    { key: "pending", label: "未完成", value: 5, rate: 0.01, rateLabel: "<0.1%" },
  ],
}

export const featureTaskRows = [
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
].map((row) => ({
  ...row,
  successRate: row.tasks ? row.success / row.tasks * 100 : 0,
  coverageRate: row.users / dataSnapshot.registeredUsers * 100,
}))

export const organizationPlaceholders = {
  company: ["一级部门 A", "一级部门 B", "一级部门 C", "一级部门 D"],
  department: ["子部门 A", "子部门 B", "直属成员"],
  person: ["人员 A", "人员 B", "人员 C", "人员 D"],
}

export const organizationScopeOptions = [
  { key: "company", label: "全公司", path: ["全公司"], type: "company" },
  { key: "department-a", label: "一级部门 A", path: ["全公司", "一级部门 A"], type: "department" },
  { key: "department-a-sub-a", label: "一级部门 A / 子部门 A", path: ["全公司", "一级部门 A", "子部门 A"], type: "department" },
  { key: "person-a", label: "一级部门 A / 子部门 A / 人员 A", path: ["全公司", "一级部门 A", "子部门 A", "人员 A"], type: "person" },
]
