# 先马 AI 设计平台 · 前端 UI 规范

> 面向个人持续开发。本文档 + `src/app/globals.css` + `src/components/ui/` + 已调好的 `prototype/buyer-show-scene-page.html`、`prototype/cross-border-suite-page.html` = 当前 UI 规范与参考实现。新增模块必须遵守本文档和 `ARCHITECTURE.md`。

## 0. 规范使用原则

本规范从 `prototype` 中已经确认满意的两个页面反向沉淀，优先级高于早期通用后台式规范。后续新页面不要重新发明视觉语言，应先判断页面属于哪类工作流，再复用对应骨架和组件。

### 视觉基准

| 基准页面 | 用途 |
|----------|------|
| `prototype/buyer-show-scene-page.html` | AI 买家秀、场景化生成、左侧参数 + 右侧结果/任务流的工作台页面 |
| `prototype/cross-border-suite-page.html` | 商品套图、批量结果、素材选择、模板/版式/语言等复杂参数页面 |
| `prototype/app.css` | 全局导航、侧栏、首页卡片、模型卡片、公共按钮和面板样式 |

### 后续页面生产流程

1. 先选母版：工作流生成页默认参考两个 `prototype/*page.html`，首页/工具入口默认参考 `prototype/app.css`。
2. 再抽结构：只换业务内容和数据，不改变顶部栏、侧栏、双栏比例、面板头尾、按钮风格、卡片圆角和阴影。
3. 再补组件：如果连续两个页面出现同类控件，应沉淀为共享组件或明确写入本规范。
4. 最后验收：新页面必须和对应原型截图同屏对照，检查布局密度、圆角、阴影、按钮、标题层级、滚动区域和弹窗位置。

### 冲突处理

- 如果本文档和 `prototype` 冲突，以 `prototype` 为准，并更新本文档。
- 如果 `UI_SPEC.md` 和 `src/app/globals.css` 冲突，以 `src/app/globals.css` 的 token 为运行时事实，但必须同步修正文档。
- 如果 shadcn 默认样式和先马原型风格冲突，优先覆盖为先马风格。
- 不把未上线能力写成已上线能力；原型页面只代表 UI 和交互验证。

## 1. 技术栈

| 层 | 选型 | 版本 |
|---|------|------|
| 框架 | Next.js (App Router) | 16.x |
| UI 库 | React | 19.x |
| 组件 | shadcn/ui (Radix) | latest |
| 样式 | Tailwind CSS | v4 |
| 图标 | lucide-react | latest |

## 2. 设计令牌

所有 Token 定义在 `src/app/globals.css` 的 `:root` 和 `@theme` 块中，**全局生效，不需要额外引入**。Token 按 primitive → semantic → component 三层组织，组件禁止直接新增 raw hex。

### 三层 Token 规则

| 层级 | 命名示例 | 作用 |
|------|----------|------|
| Primitive | `--blue-600`、`--slate-alpha-10` | 原始调色板和透明度，只被语义层引用 |
| Semantic | `--brand-primary`、`--text-title` | 表达产品含义，页面和组件优先使用 |
| Component | `--button-height-md`、`--focus-ring` | 固化公共组件交互和尺寸契约 |

新增颜色的顺序：先确认是否已有语义 Token；没有时补 primitive，再补 semantic；只有跨多个组件稳定复用时才增加 component Token。产品代码不得新增 raw hex/rgba；现有原型演示区的局部 raw 值属于待治理遗留，组件正式接入产品时必须迁移到 Token。

### 主题色

| Token | 色值 | 用途 |
|-------|------|------|
| `--brand-primary` | `#2563EB` | 主按钮、选中态、强调、链接 |
| `--brand-primary-hover` | `#1D4ED8` | Hover 加深 |
| `--brand-primary-active` | `#1E40AF` | 按下态 |
| `--brand-primary-soft` | `rgba(37,99,235,0.08)` | 选中背景、标签底 |
| `--brand-on-primary` | `#FFFFFF` | 主色上的文字 |

### 中性色

```
--gray-25  #FCFCFD   最浅
--gray-50  #F7F8FA
--gray-100 #F2F4F7   顶部导航底、标签底
--gray-200 #E4E7EC   描边
--gray-300 #D0D5DD
--gray-400 #98A2B3   禁用文字
--gray-500 #667085   辅助文字  --text-secondary
--gray-600 #475467
--gray-700 #344054   正文  --text-body
--gray-800 #1D2939
--gray-900 #101828   标题  --text-title
```

### 文本层级

| Token | 映射 | 用途 |
|-------|------|------|
| `--text-title` | `--gray-900` | 页面标题 H1、卡片/面板标题、重要数字 |
| `--text-body` | `--gray-700` | 正文 14px/400 |
| `--text-secondary` | `--gray-500` | 辅助说明 13px 或 12px |
| `--text-disabled` | `--gray-400` | 占位/禁用 |

标题字号按容器密度确定：

| 场景 | 字号/字重 | 说明 |
|------|-----------|------|
| 首页 Hero 主标题 | 34px / 900 | 仅首页欢迎区使用 |
| 工具页标题 | 20-22px / 900 | 用于工作台顶部信息条、结果区标题 |
| 侧栏一级菜单 | 14px / 500-600 | 当前项 600 |
| 侧栏二级菜单 | 13px / 500-600 | 当前项 600 |
| 模块标题 | 15px / 700-800 | 参数模块、结果分组 |
| 卡片标题 | 13-16px / 700-800 | 根据卡片尺寸压缩 |

### 统计数字

| 类型 | 字号/字重 | 颜色 |
|------|----------|------|
| 主统计数字（核心指标） | 28px/700 | `--text-title` |
| 次级统计数字 | 20px/600 | `--text-title` |
| 统计标签 | 12px/400 | `--text-secondary` |

- 数字统一加 `font-variant-numeric: tabular-nums` 等宽
- 同一卡片内不得所有数字都用 28px

### 状态色

| Token | 色值 | 用途 |
|-------|------|------|
| `--success` / `--success-bg` | `#16A34A` / `#EAF8F1` | 成功 |
| `--warning` / `--warning-bg` | `#F59E0B` / `#FFF6E5` | 警告 |
| `--danger` / `--danger-bg` | `#DC2626` / `#FEF3F2` | 危险/删除 |
| `--info` / `--info-bg` | `#0EA5E9` / `#EFF6FF` | 信息 |

### 间距（4px 栅格）

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-1` | 4px | 标签之间、图标与文字 |
| `--space-2` | 8px | 表单项之间 |
| `--space-3` | 12px | |
| `--space-4` | 16px | 卡片内边距、卡片间距 |
| `--space-6` | 24px | 页面主区块之间 |
| `--space-8` | 32px | |

### 圆角

| Token | 值 | 场景 |
|-------|-----|------|
| `--radius-sm` | 6px | tag、小元素 |
| `--radius-md` | 8px | 按钮、输入框 |
| `--radius-lg` | 16px | 主卡片、工作台面板 |
| `--radius-xl` | 18px | 大弹窗、复杂编辑器面板 |
| `--radius-pill` | 999px | 胶囊、头像、状态点 |

### 阴影

| Token | 值 | 场景 |
|-------|-----|------|
| `--shadow-card` | `0 16px 44px rgba(72,102,137,0.13)` | 默认主卡片、工作台面板 |
| `--shadow-card-soft` | `0 10px 24px rgba(37,99,235,0.08)` | 选中态卡片 |
| `--shadow-card-hover` | `0 8px 24px rgba(15,23,42,0.10)` | 可点击卡片 hover |
| `--shadow-control` | `0 8px 18px rgba(15,23,42,0.06)` | 胶囊按钮、轻操作按钮 |

先马 AI 设计平台默认采用“白色/半透明白面板 + 细描边 + 柔和阴影”的工具台风格。不要再使用“默认卡片无阴影、hover 才加阴影”的旧规则。只有表格行、列表行、极小控件可只用描边不用阴影。

### 背景

- 全局背景使用浅蓝灰工作台底色，工作流页面可使用原型中的柔和径向光背景：
  `radial-gradient(...) + linear-gradient(180deg, #f8fbff 0%, #eef4fb 52%, #f5f8fc 100%)`。
- 主面板使用 `rgba(255,255,255,.92)` 或白色，保持轻微透气感。
- 禁止用大面积深色渐变作为普通后台页面背景；深色渐变只用于主按钮、局部强调条或少量预览卡。

### 交互状态

- 所有可交互元素必须保留 `focus-visible`，公共焦点环为 `--focus-ring`。
- 禁用元素使用 `disabled` 或 `aria-disabled="true"`，同时降低对比度并显示不可用光标。
- 异步动作必须保留按钮宽度，提供 loading 状态；列表必须提供 loading、empty、error 中适用的状态。
- 纯图标按钮必须有 `aria-label`；不熟悉的图标需要 Tooltip。
- 移动端点击目标建议不小于 32px，高频主操作使用 36px 或 40px。

### 字体

```
Inter, -apple-system, BlinkMacSystemFont, "Segoe UI",
"PingFang SC", "Microsoft YaHei", Arial, sans-serif
```

## 3. 布局框架

```
┌──────────────────────────────────────────────────────┐
│ Topbar  56px  白色底 + 底部 1px border               │
│ Logo + 产品名 │ 工作台/工具中心/能力中心/无限画布/... │ 积分+头像│
├────────┬─────────────────────────────────────────────┤
│ Sidebar│ Main Content                               │
│ 240px  │ fixed: top 56 / left 240 / right 0 / bottom 0│
│ 白底    │ px-6；工作流页内部双栏滚动                   │
│ 独立滚动 │ 首页可整页滚动，生成页整页不滚               │
└────────┴─────────────────────────────────────────────┘
```

- **最小视口**：1280px
- **内容最大宽**：不设限（信息页填满可用空间）
- **主区域高度**：固定在 Topbar 下方，撑满剩余视口
- Topbar 固定顶部 z-50
- Sidebar 固定左侧 z-40，独立 overflow-y:auto
- Main 区域 `position: fixed; top: 56px; left: 240px; right: 0; bottom: 0; padding: 0 24px;`
- 工作流生成页：Main 自身 `overflow:hidden`，左右面板内部滚动；底部主操作固定在左侧配置栏底部
- 首页/入口页：Main 可 `overflow:auto`，顶部留出 76px 左右的视觉呼吸

### 响应式规则

当前原型按内部运营桌面端优先设计，默认最小视口为 `1280px`。后续若要做移动端，不要直接压缩当前双栏工作台，应另起移动端规则。

| 宽度 | 行为 |
|------|------|
| `< 1280px` | 当前不作为主要验收视口，可出现横向最小宽限制 |
| `1280px` | 必须可用，左右栏不溢出，按钮和标题不换行到不可读 |
| `≥ 1440px` | 双栏工作台按比例拉伸，右侧结果区获得更多空间 |

### 弹窗与浮层适配规则

- **尺寸自适应**：弹窗应根据视口宽高适配，使用 `min()`、`max()`、`clamp()` 或等价的运行时计算；禁止只依赖一个桌面端固定宽高。
- **解除容器限制**：会从页面、侧栏、配置栏或滚动内容中“浮出”的弹窗，必须通过 Portal 挂载到 `document.body`，或使用不受业务容器 `overflow`、`transform` 和 stacking context 影响的顶层浮层层；不得把弹窗嵌在可能裁切它的业务容器内。
- **层级优先**：弹窗可以覆盖左右栏和主内容，使用统一的顶层 z-index；不能为了避免遮挡而把弹窗限制在触发区域或栏位边界内。
- **定位策略**：优先贴近触发控件展示；根据上下左右剩余空间自动选择展开方向，并将最终位置限制在视口安全边距内。
- **锚点一致**：同组选择弹层应与各自触发控件的左边缘对齐，向上或向下展开时与触发控件保持 `8px` 间距；不得因内容实际高度小于最大高度而产生位置漂移。
- **单层交互**：同一组选择控件同时只允许存在一个可见弹层；关闭后必须从交互层移除，不得残留透明遮罩或不可见内容拦截页面点击。
- **视口兜底**：当弹窗本身超过视口可用空间时，只缩小到 `视口尺寸 - 安全边距`，不得被浏览器边缘裁掉；桌面端和窄屏均需避免横向溢出。
- **滚动边界**：标题栏和操作栏保持可见，长内容只在弹窗内容区滚动；不要让页面滚动与弹窗内容滚动互相抢占。
- **验证要求**：至少验证桌面宽屏、`1280px`、`1024px` 和窄屏视口，并检查弹窗覆盖侧栏、边缘定位、内容滚动、同组弹层切换、外部点击关闭、键盘关闭和页面点击不被拦截。

### 工作流历史入口

- 已实现的工作流子页面统一在页面标题区右上角提供“历史记录”入口，不在配置滚动区重复展示历史列表。
- 历史入口使用公共组件和 `History` 图标，在新标签页打开统一历史页面，并携带来源页面、模型、清晰度、比例、画质、张数等可筛选参数。
- URL 不携带上传图片、提示词正文或其他大体积、敏感业务内容；历史页面应根据来源参数自动选中对应工具筛选。

### 顶部栏（Topbar）

- 左侧：Logo 32x32 + 产品名 15px/700 + 副标题 12px。
- 中间：一级菜单胶囊导航，文案为 `工作台 / 工具中心 / 能力中心 / 无限画布 / 素材库 / 历史记录 / 帮助文档`。
- 一级菜单样式：外层 `--gray-100` 浅灰胶囊，高 38px；菜单项高 34px、左右 16px、14px/600；选中态为 `--brand-primary` 蓝字 + 底部 2px 蓝线。
- 右侧：积分胶囊 32px 高 + 头像 32px + 用户名/角色。
- 背景白色，底部 1px `--border-base`，高度固定 56px。
- 侧边栏继续承载具体功能分组和二级入口；顶部一级菜单负责全局模块跳转。

### 侧边栏（Sidebar）

- 两个可展开组：生图工具（6项）、AI 能力中心（6项）
- **一级菜单**：16px 图标 + 文字 + 数量角标 + 展开箭头，`h-36px rounded-8px`
- **二级菜单**：不用图标，`h-34px`，靠左侧竖线 + 圆点 + 缩进表达层级
- 选中态：`--brand-primary-soft` 浅蓝底 + `--brand-primary` 蓝字，当前项字重 600
- 数量角标：浅蓝底 `--info-bg` + 蓝字，不用灰色角标
- 底部管理项（数据智能/权限管理/系统设置）：分隔线 + 图标 + 文字，非管理员不渲染
- 默认展开：生图工具和 AI 能力中心都展开

### 子页面位置区（PageHeader）

工作流生成页不用传统大块 PageHeader，改用顶部信息条：

- 信息条在 Main 顶部，`padding: 10px 16px; border-radius:14px; background:rgba(255,255,255,.92); box-shadow:var(--shadow-card)`。
- 面包屑居中偏左，父级灰蓝、分隔符浅灰、当前页深色加粗。
- 状态标签为浅蓝胶囊，文案如“原型验证中”，不得写成“已上线”。
- 右侧可放“历史记录”“下载 PRD”等胶囊按钮。

## 4. 页面区块间距规范

首页/入口页主区块之间使用 18-24px；工作流生成页不使用大块纵向堆叠，而使用顶部信息条 + 双栏工作区。

```
区块容器: mb-6
  ├── 标题行: flex items-center justify-between mb-4
  │   ├── 标题: text-base font-semibold + --text-title
  │   └── 副标题: text-xs mt-1 + --text-secondary（可选）
  └── 内容区: bg-white/92 rounded-[16px] border p-4 shadow-card
```

### 工作流生成页骨架

AI 买家秀、商品套图、区域重绘、提示词生成等页面默认使用该骨架：

```
Main fixed under topbar
  ├── topline-card: 面包屑 / 状态 / 历史记录或 PRD 操作
  └── workspace: grid 30% / 70%, gap 14px, flex:1
      ├── config-panel: card, flex column, overflow hidden
      │   ├── config-scroll: padding 16px, gap 10-14px, overflow-y auto
      │   └── config-foot: fixed bottom actions, border-top, primary action h46
      └── output-panel: card, flex column, overflow hidden
          ├── output-head: fixed, padding 16px, border-bottom
          └── output-scroll: padding 16px, overflow-y auto
```

- 左右比例默认 `3fr / 7fr`；配置复杂但结果较轻时可 `360-430px / 1fr`。
- 整页不滚，滚动只发生在 `config-scroll` 和 `output-scroll`。
- 左侧底部主按钮固定可见，避免用户滚到底才找到生成入口。
- 每个参数组用 `module`：白底、14px 圆角、1px 浅描边、12px 内边距。
- 右侧空状态用虚线边框居中，生成中用骨架微光 + 进度条，生成结果用图片网格。

## 5. 首页规范

### 结构顺序

1. **Hero 行**（欢迎区 + 个人信息卡）
2. **快速使用**（4 张图片卡片）
3. **最近使用**（历史记录列表）
4. **可用大模型**（模型卡片）

### Hero 行

- 布局：`grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5`
- 欢迎卡：渐变蓝底 `linear-gradient(135deg, #FFF 0%, #EBF2FF 60%, #E0E9FF 100%)` + 装饰圆 + 2 个 CTA 按钮
- 个人信息卡：360px 固定宽，包含 4 格统计 + 时钟/日期

### 快速使用卡片

- 网格：`grid gap-4`，`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- 卡片结构：`16:10` 图片区 + 暗色 Badge（右下角） + 标题(16px/600) + 描述(12px)
- Hover：`--shadow-card-hover` + `translateY(-2px)`
- 图片加载失败时自动隐藏（SafeImage 组件）

### 模型卡片

- 网格：`grid gap-4`，`grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))`
- 卡片结构：模型图标(40×40) + 名称 + 平均耗时标签 + 来源 + 描述 + 类型标签
- 类型标签：`--brand-primary-soft` 底 + `--brand-primary` 字
- 耗时标签：`--gray-100` 底 + `--text-secondary` 字

### 最近使用

- 列表形式：白底卡片 + border 分隔
- 每行：32×32 图标 + 标题 + 类型 · 时间 + 状态标签
- 状态色：已完成 `--success-bg` + `--success`，处理中 `--warning-bg` + `--warning`

## 6. 组件规格

### 工作台公共组件

AI 能力子页面优先使用 `src/components/workbench/Workbench.jsx`，不要在页面里重新手写外层骨架。

| 组件 | 用途 | 必用场景 |
|------|------|----------|
| `WorkbenchShell` | 工作流页面母版：背景、顶部信息条、双栏网格 | AI 买家秀、AI 商品套图及后续 AI 能力子页面 |
| `WorkbenchTopline` | 面包屑、状态标签、页面标题、副标题、右侧操作 | 所有工作流子页面 |
| `WorkbenchPanel` | 左右主面板：白/半透明白、16px 圆角、柔和阴影 | 配置栏、结果栏 |
| `WorkbenchPanelHead` | 右侧结果区或任务区固定头部 | 结果预览、结果任务、历史列表 |
| `WorkbenchScroll` | 面板内部滚动容器 | 配置项较多或结果列表较长时 |
| `WorkbenchFooter` | 左侧配置栏底部固定操作区 | 提交、生成、清空、终止 |
| `WorkbenchModule` | 参数模块卡片 | 商品原图、场景、提示词、生成参数、套图类型 |
| `WorkbenchButton` | 胶囊纯色主按钮、轻按钮 | 生成、历史记录、清空、辅助操作 |
| `WorkbenchEmpty` | 右侧空状态 | 未生成结果、无匹配任务、无数据 |

后续新增子页面默认写法：

```jsx
<WorkbenchShell
  crumbs={crumbs}
  status="原型验证中"
  title="页面名称"
  description="一句话说明当前工作流"
  columns="minmax(360px, 3fr) minmax(0, 7fr)"
>
  <WorkbenchPanel>
    <WorkbenchScroll>
      <WorkbenchModule title="参数模块">...</WorkbenchModule>
    </WorkbenchScroll>
    <WorkbenchFooter>
      <WorkbenchButton>生成</WorkbenchButton>
    </WorkbenchFooter>
  </WorkbenchPanel>

  <WorkbenchPanel>
    <WorkbenchPanelHead title="结果预览" />
    <WorkbenchScroll>...</WorkbenchScroll>
  </WorkbenchPanel>
</WorkbenchShell>
```

禁止事项：

- 不要在 AI 能力子页面里重新写 PageHeader、大块标题区、左右栏外壳、底部固定按钮栏。
- 不要在每个页面复制一套面包屑；要改面包屑时，只改 `WorkbenchTopline`。
- 不要在页面级新增 raw hex/rgba；若确需新增视觉值，先补 token 或组件样式。
- 不要让整页滚动和左右面板内部滚动同时存在。

### 按钮

| 类型 | 样式 | Tailwind |
|------|------|----------|
| Primary | `--brand-primary` 纯蓝底、白字、胶囊/12px 圆角、h46 主操作 | 使用 `WorkbenchButton variant="primary"` |
| Default | 白底灰边、柔和阴影、胶囊按钮 | 使用 `WorkbenchButton variant="ghost"` |
| Soft | 浅蓝底、蓝字、无阴影 | 使用 `WorkbenchButton variant="soft"` |
| Text | 蓝字无底无边 | `text-[var(--brand-primary)]` |
| Danger | 红底/红边 | 使用 `--danger` Token |

工作流底部主操作统一高度 46px；普通轻按钮 36-40px；图标按钮 32-36px。
状态：Default → Hover(加深) → Focus(2px 蓝色环) → Disabled(opacity:50%) → Loading(保留宽度+旋转图标)

### 卡片

- 工作台外层卡片：使用 `WorkbenchPanel`，白/半透明白 + 1px 描边 + 16px 圆角 + `--shadow-card`。
- 参数模块卡片：使用 `WorkbenchModule`，白底 + 14px 圆角 + 1px `#e5edf6` + 12px 内边距。
- 可点击结果卡片：默认细描边，hover 可加 `--shadow-card-hover` 或轻微遮罩。
- **禁止**：新页面手写另一套主面板圆角、阴影、左右栏容器。

### 标签/徽章

| 类型 | 样式 |
|------|------|
| 分类标签 | `--gray-100` 底，高 24px，`--radius-sm`(6px) |
| 能力状态标签 | `--brand-primary-soft` 底 + `--brand-primary` 字，蓝色系 |
| 任务状态标签 | 按 3.4 状态色（success/warning/danger/info） |
| 图片 Badge | `rgba(16,24,40,0.75)` 暗底 + 白色字，右下角 |

### 空状态

**所有列表/数据区必须处理**：线性图标(32px,`--text-disabled`) + 说明文字 + 引导动作按钮

## 7. 图标规范

- 统一使用 **lucide-react**，线性风格
- 常用图标映射：

| 业务动作 | 图标 |
|---------|------|
| 工作台 | `House` |
| 生图工具 | `Image` |
| AI 能力中心 | `Sparkles` |
| 无限画布 | `PanelsTopLeft` |
| 素材管理 | `FolderOpen` |
| 历史记录 | `History` |
| 帮助文档 | `BookOpen` |
| 数据智能 | `ChartNoAxesCombined` |
| 权限管理 | `ShieldCheck` |
| 系统设置 | `Settings` |
| 返回 | `ArrowLeft` |
| 展开/收起 | `ChevronDown` |
| 刷新 | `RefreshCw` |

- 图标尺寸：按钮 14-16px，一级入口 18-20px，空状态 32px
- 纯图标按钮需 Tooltip

## 8. 页面清单

| 路由 | 页面 | 位置 | 状态 |
|------|------|------|------|
| `/home` | 工作台首页 | `src/app/home/page.js` | 原型展示 |
| `/image-tools/expert` | 专家模式 | `src/app/image-tools/expert/page.js` | 原型中 |
| `/image-tools/text-edit` | 一键改字 | `src/app/image-tools/text-edit/page.js` | 原型中 |
| `/image-tools/subject-replace` | 主体替换 | `src/app/image-tools/subject-replace/page.js` | 原型中 |
| `/image-tools/product-refine` | 产品微调 | `src/app/image-tools/product-refine/page.js` | 原型中 |
| `/image-tools/batch-beautify` | 批量美颜 | `src/app/image-tools/batch-beautify/page.js` | 原型中 |
| `/image-tools/batch-edit` | 批量改图 | `src/app/image-tools/batch-edit/page.js` | 原型中 |
| `/ai-hub` | AI 能力中心(重定向到 multi-angle) | `src/app/ai-hub/page.js` | 重定向 |
| `/ai-hub/[capability]` | AI 能力中心(6能力) | `src/app/ai-hub/[capability]/page.js` | product-suite / buyer-show 已实现交互，其余 4 能力原型占位 |
| `/ai-canvas` | 无限画布 | `src/app/ai-canvas/page.js` | 原型中 |
| `/materials` | 素材管理 | `src/app/materials/page.js` | 原型中 |
| `/history` | 历史记录 | `src/app/history/page.js` | 原型中 |
| `/help-docs` | 帮助文档 | `src/app/help-docs/page.js` | 原型中 |
| `/admin/data` | 数据智能 | `src/app/admin/data/page.js` | 原型中 |
| `/admin/points-requests` | 积分审批 | `src/app/admin/points-requests/page.js` | 前端交互原型 |
| `/admin/permission` | 权限管理 | `src/app/admin/permission/page.js` | 原型中 |
| `/admin/settings` | 系统设置 | `src/app/admin/settings/page.js` | 原型中 |
| `/points` | 积分中心 | `src/app/points/page.js` | 前端交互原型 |

页面状态来源：`src/config/navigation.js` 的 `routeMeta`。页面显示“可用”只代表该路由已接入，不代表后端能力已生产上线。

## 9. 公共组件清单

| 组件 | 文件 | 类型 | 说明 |
|------|------|------|------|
| LayoutClient | `src/components/LayoutClient.jsx` | 客户端 | 全局布局容器，管理侧栏状态 + 响应式 |
| Topbar | `src/components/Topbar.jsx` | 客户端 | 全局顶部栏，承载品牌、一级菜单、UI 样式入口、积分和用户入口 |
| UI 规范页 | `src/app/ui-guide/page.js` | 客户端 | 设计系统与组件规范演示页 |
| Sidebar | `src/components/Sidebar.jsx` | 客户端 | 全局侧栏，移动端抽屉 |
| WorkbenchShell 等 | `src/components/workbench/Workbench.jsx` | 客户端 | AI 能力工作流页面母版、顶部信息条、左右面板、模块、按钮、空状态 |
| ColorSamplerButton / ColorConstraintChips | `src/components/workbench/ColorConstraintPicker.jsx` | 客户端 | 工作台公共吸色入口与颜色记录，包含色块、HEX、复制和删除；按页面需求接入 |
| ImagePreviewModal | `src/components/workbench/ImagePreviewModal.jsx` | 客户端 | 工作台公共图片预览弹窗，统一缩放、拖动、翻转、下载、吸色及色值复制交互 |
| PageHeader | `src/components/PageHeader.jsx` | 客户端 | 旧版/非工作流子页面面包屑+返回；AI 能力工作流页优先使用 WorkbenchTopline |
| SafeImage | `src/components/SafeImage.jsx` | 客户端 | 图片组件，加载失败自动隐藏 |
| PageShell | `src/components/PageShell.jsx` | 服务端 | 页面标题、面包屑、状态和内容外壳 |
| PlaceholderState | `src/components/PlaceholderState.jsx` | 服务端 | 原型/规划页面的统一空状态 |
| Button | `src/components/ui/button.jsx` | shadcn | 按钮 |
| DropdownMenu | `src/components/ui/dropdown-menu.jsx` | shadcn | 下拉菜单 |
| Avatar | `src/components/ui/avatar.jsx` | shadcn | 头像 |

## 10. 运行 & 开发

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 生产构建
```

### 项目结构

```
src/
├── app/              # Next.js App Router（页面路由）
│   ├── layout.js     # 根布局（Server Component）
│   ├── globals.css   # 设计令牌 + Tailwind
│   └── home/page.js  # → 各页面
├── components/
│   ├── LayoutClient.jsx  # 全局布局容器
│   ├── Topbar.jsx
│   ├── Sidebar.jsx
│   ├── PageHeader.jsx
│   ├── SafeImage.jsx
│   ├── workbench/    # AI 能力工作流页面母版组件
│   └── ui/           # shadcn/ui 组件
├── config/navigation.js # 导航、路由元数据、能力名称和面包屑
├── data/demo/          # 明确隔离的演示数据
├── lib/utils.js        # cn() 和纯工具函数
└── hooks/              # 可复用客户端 hooks
```

### 接入后端

在现有页面中直接调用 API 即可，项目已预留：
- `src/lib/` — 放 API 客户端
- `src/hooks/` — 放自定义 hooks（数据获取、状态管理等）
- 状态管理建议用 React Context 或 Zustand

### 开发规则

- 页面默认用 Server Component，需要交互的部分抽成 Client Component
- 新模块先在 `src/config/navigation.js` 注册 `routeMeta`、导航项和状态，再创建页面
- 子页面统一使用 `PageShell`；尚未实现的内容统一使用 `PlaceholderState`
- `onClick`、`onError`、`useState`、`useEffect` 等只能在 Client Component 中使用
- 图片组件统一用 `SafeImage`，避免 onError 导致的服务端渲染错误
- 设计令牌通过 CSS 变量引用（`var(--xxx)`），不要硬编码色值
- 演示数据只能放在 `src/data/demo/`，真实 API 不直接写进页面组件
- 提交前运行 `npm run lint` 和 `npm run build`

### 吸色与颜色约束

- 图片吸色使用 `ColorSamplerButton`，统一放在 `ImagePreviewModal` 工具栏，保证启动系统取色器时预览大图仍在当前可视区域；图片缩略图和图片队列标题不重复展示。
- 吸色成功后，预览工具栏显示色块与 HEX，自动复制到剪贴板并提供再次复制操作；无提示词的页面也必须支持独立吸色和复制。
- 点击吸管后，用户可在屏幕任意位置取色；不支持系统取色器时使用原生颜色选择控件回退。
- 已选颜色使用 `ColorConstraintChips` 展示，只包含可辨识色块、HEX 色值、复制和删除操作，不显示产品主体、参考色等页面相关标签。
- 吸色只记录并复制色值，不自动写入提示词或其他输入框；页面需要使用色值时由用户直接粘贴。
- 吸管和删除按钮必须提供 `aria-label`；颜色标签使用现有边框、文字和交互 token，不新增局部 raw 色值。
