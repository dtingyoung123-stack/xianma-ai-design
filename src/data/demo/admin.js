export const organizationTree = [
  {
    id: "org-president-office",
    name: "总裁办~江左盟",
    children: [
      { id: "org-legal-pr", name: "法务公关部", children: [] },
      { id: "org-strategy-operations", name: "战略营运部", children: [] },
      { id: "org-audit-compliance", name: "审计合规部", children: [] },
    ],
  },
  {
    id: "org-digital-intelligence",
    name: "数智中心~星河界",
    children: [
      { id: "org-business-support", name: "业务保障部", children: [] },
      { id: "org-ai-lab", name: "AI实验室", children: [] },
      { id: "org-data-operations", name: "数据运营", children: [] },
    ],
  },
  {
    id: "org-finance",
    name: "财经中心~聚财殿",
    children: [
      { id: "org-finance-bp", name: "财经BP", children: [] },
      { id: "org-inventory-funds-tax", name: "存货资金税务模块", children: [] },
    ],
  },
  {
    id: "org-visual",
    name: "视觉中心~画江湖",
    children: [
      { id: "org-photography", name: "摄影组", children: [] },
      { id: "org-design", name: "设计组", children: [] },
      { id: "org-packaging-design", name: "包装设计组", children: [] },
    ],
  },
  {
    id: "org-hr-administration",
    name: "人力行政中心~群英荟",
    children: [
      { id: "org-hr-administration-department", name: "人力行政部", children: [] },
    ],
  },
  {
    id: "org-supply-chain",
    name: "供应链中心~逍遥派",
    children: [
      { id: "org-logistics-management", name: "物流管理组", children: [] },
      { id: "org-supplier-management", name: "供应商管理与开发组", children: [] },
      { id: "org-quality-management", name: "质量管理组", children: [] },
    ],
  },
  {
    id: "org-procurement",
    name: "采购中心~天山派",
    children: [
      { id: "org-procurement-1", name: "采购1组", children: [] },
      { id: "org-procurement-2", name: "采购2组", children: [] },
      { id: "org-procurement-3", name: "采购3组", children: [] },
    ],
  },
  { id: "org-customer-service", name: "客服中心~云梦泽", children: [] },
  { id: "org-product", name: "产品中心~众妙门", children: [] },
  { id: "org-cloud-warehouse", name: "云仓中心", children: [] },
  {
    id: "org-innovation",
    name: "创新事业群",
    children: [
      { id: "org-innovation-biluotian", name: "碧落天事业部", children: [] },
      { id: "org-innovation-tiandihui", name: "天地会事业部", children: [] },
      { id: "org-innovation-duobaoge", name: "多宝阁事业部", children: [] },
      { id: "org-innovation-wujidian", name: "无极殿事业部", children: [] },
    ],
  },
  {
    id: "org-yima",
    name: "一马事业群",
    children: [
      { id: "org-yima-zhenwudian", name: "真武殿事业部", children: [] },
      { id: "org-yima-jiuxiaodian", name: "九霄殿事业部", children: [] },
      { id: "org-yima-product", name: "一马事业群~商品部", children: [] },
      { id: "org-yima-protective-gear", name: "护具事业部", children: [] },
      { id: "org-yima-douyin", name: "抖音事业部", children: [] },
    ],
  },
  {
    id: "org-zhongchuang",
    name: "众创事业群",
    children: [
      { id: "org-zhongchuang-business-center", name: "业务中心", children: [] },
      {
        id: "org-zhongchuang-product",
        name: "众创事业群~商品部",
        children: [
          { id: "org-zhongchuang-xumishan", name: "须弥山", children: [] },
          { id: "org-zhongchuang-qiufengshan", name: "秋名山", children: [] },
          { id: "org-zhongchuang-juxingge", name: "聚星阁", children: [] },
          { id: "org-zhongchuang-jingdong", name: "京东", children: [] },
        ],
      },
      { id: "org-zhongchuang-huaguoshan", name: "花果山", children: [] },
      {
        id: "org-zhongchuang-chenghuige",
        name: "承晖阁",
        children: [
          { id: "org-zhongchuang-bp", name: "BP组", children: [] },
          { id: "org-zhongchuang-administration", name: "行政部", children: [] },
        ],
      },
    ],
  },
  {
    id: "org-xiyou",
    name: "喜佑事业群",
    children: [
      { id: "org-xiyou-langzhentian", name: "朗臻天业务中心", children: [] },
      { id: "org-xiyou-doushuaitian", name: "兜率天中后台", children: [] },
    ],
  },
]

export const companyOrganizationName = "湖南先马品牌管理有限公司"
export const permissionOrganizationTree = organizationTree.filter((organization) => organization.id === "org-zhongchuang")
export const permissionOrganizationName = "众创事业群"

export const platformRoles = [
  {
    id: "system_admin",
    name: "系统管理员",
    description: "进入全部后台管理页面并管理平台全部数据",
  },
  {
    id: "department_admin",
    name: "部门管理员",
    description: "管理授权组织的团体资源，并自动处理素材、提示词入库审批；主管一期默认拥有",
  },
  {
    id: "approval_admin",
    name: "审批员",
    description: "查看授权组织数据并处理所选审批事项，不编辑或删除团体资源",
  },
  {
    id: "member",
    name: "普通用户",
    description: "所有有效账号默认拥有，使用业务功能并查看组织可见资源与本人记录",
  },
]

export const approvalTypes = [
  { id: "material_publish", name: "素材入库审批" },
  { id: "prompt_publish", name: "提示词入库审批" },
  { id: "points_request", name: "积分申请审批", systemAdminOnly: true },
]

export const adminUsers = [
  { id: "U0001", account: "demo.admin", name: "演示管理员", departmentId: "org-ai-lab", department: "数智中心~星河界 / AI实验室", isSupervisor: false, supervisorApprovalEnabled: false, manualRoleIds: ["system_admin"], approvalTypeIds: [], extraOrgIds: [], status: "active" },
  { id: "U0002", account: "demo.design", name: "演示主管A", departmentId: "org-zhongchuang-product", department: "众创事业群 / 众创事业群~商品部", isSupervisor: true, supervisorApprovalEnabled: true, manualRoleIds: [], approvalTypeIds: ["material_publish", "prompt_publish"], extraOrgIds: [], status: "active" },
  { id: "U0003", account: "demo.digital", name: "演示主管B", departmentId: "org-zhongchuang-huaguoshan", department: "众创事业群 / 花果山", isSupervisor: true, supervisorApprovalEnabled: true, manualRoleIds: ["system_admin"], approvalTypeIds: ["material_publish", "prompt_publish"], extraOrgIds: [], status: "active" },
  { id: "U0004", account: "demo.bp", name: "演示BP", departmentId: "org-zhongchuang-bp", department: "众创事业群 / 承晖阁 / BP组", isSupervisor: false, supervisorApprovalEnabled: false, manualRoleIds: ["approval_admin"], approvalTypeIds: ["material_publish", "prompt_publish"], extraOrgIds: ["org-zhongchuang-product", "org-zhongchuang-huaguoshan"], status: "active" },
  { id: "U0005", account: "demo.product", name: "演示主管C", departmentId: "org-zhongchuang-chenghuige", department: "众创事业群 / 承晖阁", isSupervisor: true, supervisorApprovalEnabled: false, manualRoleIds: [], approvalTypeIds: [], extraOrgIds: [], status: "active" },
  { id: "U0006", account: "demo.procurement", name: "演示用户D", departmentId: "org-zhongchuang-jingdong", department: "众创事业群 / 众创事业群~商品部 / 京东", isSupervisor: false, supervisorApprovalEnabled: false, manualRoleIds: [], approvalTypeIds: [], extraOrgIds: [], status: "active" },
  { id: "U0007", account: "demo.disabled", name: "演示停用账号", departmentId: "org-zhongchuang-administration", department: "众创事业群 / 承晖阁 / 行政部", isSupervisor: false, supervisorApprovalEnabled: false, manualRoleIds: [], approvalTypeIds: [], extraOrgIds: [], status: "disabled" },
]

export const adminModels = [
  { id: "wan", name: "Wan 2.7 Image Pro", code: "wan2.7-image-pro", enabled: true, inputCount: 9, singleMb: 10, totalMb: 60, outputCount: 9 },
  { id: "banana-pro", name: "Nano Banana Pro", code: "gemini-3-pro-image-preview", enabled: true, inputCount: 9, singleMb: 10, totalMb: 60, outputCount: 9 },
  { id: "banana-2", name: "Nano Banana 2", code: "gemini-3.1-flash-image-preview", enabled: true, inputCount: 9, singleMb: 10, totalMb: 60, outputCount: 9 },
  { id: "seedream", name: "Seedream 5.0", code: "doubao-seedream-5-0-260128", enabled: true, inputCount: 9, singleMb: 10, totalMb: 60, outputCount: 9 },
  { id: "gpt-image", name: "GPT Image 2", code: "gpt-image-2", enabled: true, inputCount: 16, singleMb: 20, totalMb: 120, outputCount: 9 },
]

const allModelIds = adminModels.map((model) => model.id)

export const moduleModelRules = [
  { id: "expert", name: "专家模式", group: "生图工具", defaultModel: "banana-2", allowedModels: allModelIds },
  { id: "text-edit", name: "一键改字", group: "生图工具", defaultModel: "gpt-image", allowedModels: allModelIds },
  { id: "subject-replace", name: "主体替换", group: "生图工具", defaultModel: "banana-2", allowedModels: allModelIds },
  { id: "product-refine", name: "产品微调", group: "生图工具", defaultModel: "banana-2", allowedModels: allModelIds },
  { id: "batch-beautify", name: "批量美颜", group: "生图工具", defaultModel: "banana-2", allowedModels: allModelIds },
  { id: "batch-edit", name: "批量改图", group: "生图工具", defaultModel: "banana-2", allowedModels: ["banana-2", "seedream"] },
  { id: "cutout", name: "主体抠图", group: "AI能力中枢", defaultModel: "gpt-image", allowedModels: allModelIds },
  { id: "erase", name: "智能擦除", group: "AI能力中枢", defaultModel: "gpt-image", allowedModels: allModelIds },
  { id: "repaint", name: "局部重绘", group: "AI能力中枢", defaultModel: "gpt-image", allowedModels: allModelIds },
  { id: "multi-angle", name: "AI多角度", group: "AI能力中枢", defaultModel: "gpt-image", allowedModels: ["wan", "banana-pro", "banana-2", "gpt-image"] },
  { id: "expand", name: "AI扩图", group: "AI能力中枢", defaultModel: "banana-2", allowedModels: allModelIds },
  { id: "buyer-show", name: "AI买家秀", group: "AI能力中枢", defaultModel: "gpt-image", allowedModels: ["wan", "banana-pro", "banana-2", "gpt-image"] },
  { id: "product-suite", name: "AI商品套图", group: "AI能力中枢", defaultModel: "banana-2", allowedModels: ["banana-2", "seedream", "gpt-image"] },
]

export const initialSystemPrompts = [
  { id: "prompt-1", name: "平台基础规范", scope: "全平台", enabled: true, content: "保持输出准确、清晰，并遵守平台内容规范。" },
  { id: "prompt-2", name: "商品内容规范", scope: "商品相关功能", enabled: true, content: "商品信息以用户提供内容为准，不臆造规格、功效或认证。" },
]
