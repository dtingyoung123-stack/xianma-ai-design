# 项目记忆

本文档记录先马 AI 设计平台的重要功能、需求时间、确认结论和长期规则。后续询问“什么时候做的”“当时怎么定的”“需要遵守什么规则”时，以本文件、对应 PRD、`UI_SPEC.md` 和 Git 记录共同为准。

## 维护规则

- 每次完成新功能、需求调整、公共组件变更或重要问题修复后，更新本文件。
- 每条记录必须包含：日期、功能或需求、状态、确认范围、关键规则、关联文件。
- 需求发生变化时保留原结论，并追加新的变更日期，不直接抹掉历史。
- 日期优先记录实际需求确认或开发日期；与 Git 入库日期不一致时分别标明。
- Git 同步前检查本文件是否已覆盖本轮完成内容。

## 长期开发规则

1. 新功能先理解需求并给出具体方案，用户确认后再修改代码。
2. 开发前检查项目架构、UI 规范、现有框架和公共组件。
3. 优先复用现有组件；确需新增公共组件时，先说明职责、位置和复用范围并获得确认。
4. 只处理当前确认的问题，不修改、重构或格式化无关代码。
5. 前端原型需要提供完整交互，不在页面显示“API 未接入”等技术提示。
6. 公共能力在各业务页面保持统一样式和交互，页面只处理自己的业务状态。
7. 修改后执行相应的 ESLint、构建、页面交互、控制台、溢出和最终差异检查。
8. 用户要求同步 GitHub 时，先检查提交范围、敏感文件、未跟踪文件和远程分支，再提交推送。
9. 每次需求完成后同步更新 `PROJECT_MEMORY.md`；涉及产品定义时更新 `PRODUCT_REQUIREMENTS.md`，涉及 UI 或公共组件时更新 `UI_SPEC.md`。

## 当前技术栈

- 应用框架：Next.js 16，使用 App Router，页面和接口位于 `src/app/`。
- UI 运行时：React 19、React DOM 19。
- 开发语言：JavaScript 与 JSX；当前未启用 TypeScript。
- 样式方案：Tailwind CSS 4、PostCSS、CSS Variables；运行时设计 Token 统一维护在 `src/app/globals.css`。
- 组件体系：shadcn 4（`base-nova` 风格）与 Base UI React；基础组件位于 `src/components/ui/`。
- 公共业务组件：工作台通用能力位于 `src/components/workbench/`，业务页面优先复用现有组件。
- 图标体系：Lucide React。
- 样式工具：`clsx`、`tailwind-merge`、`class-variance-authority`、`tw-animate-css`。
- 代码检查：ESLint 9 与 Next.js Core Web Vitals 规则。
- 构建方式：Next.js 默认构建流程与 Turbopack。
- 版本管理与部署：GitHub `main` 分支连接 Vercel 自动部署，正式域名为 `https://ai.iiting.fun`。
- 当前产品形态：以前端交互原型和工作台为主，尚未接入独立后端框架、正式数据库及完整业务 API。
- 版本依据：依赖及准确版本以 `package.json` 和锁文件为准；架构边界以 `ARCHITECTURE.md` 为准。

## 功能时间线

### 2026-07-30：项目基础版本

- 状态：已入库。
- 完成统一导航、工作台框架、AI 买家秀、AI 商品套图、素材库、图片队列和 UI 规范页的基础原型。
- 关键规则：工作台页面复用 `src/components/workbench/`；运行时 UI 以 `src/app/globals.css` token 为准。
- Git：`c61944a Initial commit`。
- 关联文件：`ARCHITECTURE.md`、`UI_SPEC.md`、`src/components/workbench/Workbench.jsx`。

### 2026-07-31：AI 买家秀区域编辑

- 状态：前端交互原型已完成；整理入库时间为 2026-08-01。
- 功能：商品图片支持区域编辑、画笔遮罩、擦除、撤销、重做、清空、缩放、拖动和保存状态。
- 关键规则：区域数据跟随对应图片保存；关闭未保存不覆盖原数据；替换或删除图片时同步处理区域数据。
- 关联文件：`src/components/workbench/RegionMaskEditor.jsx`、`src/components/workbench/ImageQueueModule.jsx`、`src/app/ai-hub/BuyerShowPage.jsx`。

### 2026-07-31：区域编辑自定义文本标注

- 状态：公共前端组件能力已完成；整理入库时间为 2026-08-01。
- 功能：区域编辑器支持创建、编辑、拖动和删除自定义文本标注。
- 关键规则：不自动编号；按住圆点或文字框均可移动；单击文字框才修改内容；坐标基于图片保存，缩放后不偏移。
- 复用范围：属于公共区域编辑能力，不只服务 AI 买家秀。
- 关联文件：`src/components/workbench/RegionMaskEditor.jsx`、`8.1需求说明.md`。

### 2026-07-31：一键改字页面交互优化

- 状态：前端交互原型已完成；整理入库时间为 2026-08-01。
- 功能：素材选择、图片上传、全部文字识别、文字列表与图片选区联动、逐项修改、手动补充区域、拖动调整、撤销重做、模型与参数设置。
- 关键规则：不再要求用户单独填写“原文字”；识别不到文字时允许手动框选；页面复用公共图片、模型、参数和历史记录组件。
- 关联文件：`src/app/image-tools/text-edit/TextEditWorkbench.jsx`、`src/data/demo/text-edit.js`、`8.1需求说明.md`。

### 2026-07-31：子页面统一历史记录入口

- 状态：前端交互原型已完成；整理入库时间为 2026-08-01。
- 功能：子页面右上角提供统一历史记录入口，并携带来源页面和当前生成参数打开历史记录页面。
- 关键规则：入口位置和交互在工作台子页面保持一致；页面参数通过查询参数传递。
- 关联文件：`src/components/workbench/Workbench.jsx`、`src/app/history/HistoryClient.jsx`、`src/data/demo/history.js`。

### 2026-08-01：公共图片预览与吸色

- 状态：公共前端组件已完成。
- 功能：统一图片预览弹窗支持缩放、拖动、翻转、切换、下载和吸色；吸色后显示色块与 HEX，并自动复制，支持再次复制和删除。
- 关键规则：吸管只出现在公共图片预览工具栏；缩略图和图片队列标题不重复出现；不显示“产品主体”“参考色”等业务标签；不自动新增、修改或删除提示词。
- 当前覆盖：AI 买家秀、AI 商品套图、一键改字，以及后续复用 `ImageQueueModule` 的页面。
- 关联文件：`src/components/workbench/ImagePreviewModal.jsx`、`src/components/workbench/ColorConstraintPicker.jsx`、`src/components/workbench/ImageQueueModule.jsx`、`8.1需求说明.md`。

### 2026-08-01：UI 规范导出文件恢复

- 状态：已恢复并验证。
- 问题：`docs/前端UI规范与需求说明-V1.md` 未进入前两次 Git 提交，文件从本地消失后导致 `/api/ui-spec` 返回 500。
- 处理：从原始项目压缩包恢复文件，导出接口恢复为 200，并将文档加入 Git 跟踪。
- 关键规则：导出源文件必须纳入 Git；同步前检查 `docs` 和所有未跟踪项目文档。
- 关联文件：`docs/前端UI规范与需求说明-V1.md`、`src/app/api/ui-spec/route.js`、`src/app/ui-guide/page.js`。

## 当前需求文档

- `8.1需求说明.md`：本轮四项功能的开发 PRD。
- `PRODUCT_REQUIREMENTS.md`：产品需求池和后续规划。
- `UI_SPEC.md`：运行中的 UI 规则和公共组件清单。
- `docs/前端UI规范与需求说明-V1.md`：UI 规范页的可下载开发说明。
- `AGENTS.md`：项目开发和协作执行规则。

### 2026-08-01：积分申请与系统管理员审批

- 状态：前端完整交互原型已实现；真实账号、权限、审批事务和积分入账 API 待后端接入。
- 确认范围：用户积分中心、积分申请、申请记录、积分流水、系统管理员审批；默认申请 1000，单次上限 5000。
- 权限规则：首期仅系统管理员审批；组织权限体系完成后再扩展部门或业务线审批配置。
- 关键规则：用户身份字段自动带出；同一用户不可同时存在多笔待审批申请；驳回必须填写原因；审批通过同步更新余额、申请状态和流水；已处理申请不可重复审批。
- 原型数据边界：演示数据位于 `src/data/demo/points.js`，页面通过 `src/lib/points-store.js` 读写浏览器本地状态，后续由真实 API 适配层替换。
- 入口规则：顶栏积分胶囊进入积分中心；首页个人信息卡在“可用积分”统计项下提供“申请积分”文字入口，同样跳转积分中心，不额外增加首页弹窗或状态逻辑。
- 关联文件：`src/app/points/page.js`、`src/app/admin/points-requests/page.js`、`src/app/home/page.js`、`src/components/Topbar.jsx`、`src/config/navigation.js`、`PRODUCT_REQUIREMENTS.md`。

### 2026-08-03：积分审批待审批演示数据

- 状态：前端演示数据已补充。
- 调整内容：新增两条不同申请人、部门和申请金额的待审批数据，用于验证审批列表、详情、通过和驳回交互。
- 数据边界：申请人和账号均为虚构测试信息；原型本地存储版本升级为 `v3`，首次读取时恢复新版演示数据。
- 关联文件：`src/data/demo/points.js`、`src/lib/points-store.js`。

### 2026-08-03：积分申请审批 PRD 导出

- 状态：前端导出入口与 Markdown 下载接口已实现。
- 功能：积分中心标题区右上角提供“导出 PRD”，点击后直接下载 `积分申请与审批模块PRD.md`。
- 统一规则：后续 PRD 导出复用 `PageShell` 的 `actions` 操作位和 UI 规范页的下载按钮样式；源文件统一放在 `docs/` 并纳入 Git。
- 异常边界：源文件读取失败时返回明确错误状态，不生成空文件。
- 关联文件：`src/app/points/page.js`、`src/components/PageShell.jsx`、`src/app/api/points-prd/route.js`、`docs/积分申请与审批模块PRD.md`、`UI_SPEC.md`。

### 2026-08-03：顶栏个人信息面板

- 状态：前端交互原型已实现。
- 功能：点击右上角头像展示用户身份、可用积分、今日使用、本年使用和待同步事件，并提供积分中心、修改密码、刷新账号信息和退出登录入口。
- 数据边界：身份与待同步事件使用演示用户数据；积分及使用量从浏览器本地积分状态计算；账号类入口仅保留前端产品形态，不代表真实账号接口已接入。
- 关联文件：`src/components/Topbar.jsx`、`src/data/demo/points.js`、`UI_SPEC.md`。
