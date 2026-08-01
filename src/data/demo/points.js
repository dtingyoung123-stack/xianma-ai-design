export const demoCurrentUser = {
  id: "user-001",
  name: "肖雨",
  department: "电商设计部",
  account: "xiaoyu@xianma.com",
}

export const demoPointsState = {
  balance: 917,
  requests: [
    {
      id: "PA-20260718-001",
      applicantId: "user-001",
      applicantName: "肖雨",
      department: "电商设计部",
      account: "xiaoyu@xianma.com",
      reason: "用于新品夏季服饰的 AI 买家秀批量生成",
      amount: 1000,
      status: "approved",
      createdAt: "2026-07-18T09:30:00+08:00",
      reviewedAt: "2026-07-18T10:12:00+08:00",
      reviewer: "系统管理员",
      reviewComment: "同意",
    },
    {
      id: "PA-20260702-001",
      applicantId: "user-001",
      applicantName: "肖雨",
      department: "电商设计部",
      account: "xiaoyu@xianma.com",
      reason: "跨境店铺秋季上新素材测试",
      amount: 500,
      status: "rejected",
      createdAt: "2026-07-02T14:20:00+08:00",
      reviewedAt: "2026-07-02T16:05:00+08:00",
      reviewer: "系统管理员",
      reviewComment: "请补充对应店铺和预计生成数量",
    },
  ],
  ledger: [
    {
      id: "PL-20260718-001",
      type: "grant",
      amount: 1000,
      balanceAfter: 917,
      description: "积分申请审批通过",
      requestId: "PA-20260718-001",
      createdAt: "2026-07-18T10:12:00+08:00",
    },
    {
      id: "PL-20260731-001",
      type: "consume",
      amount: -8,
      balanceAfter: 917,
      description: "AI 买家秀任务消耗",
      createdAt: "2026-07-31T17:42:00+08:00",
    },
  ],
}
