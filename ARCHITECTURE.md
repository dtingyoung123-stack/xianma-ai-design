# 项目架构说明

## 目标

本项目是一个持续增加 AI 能力、工具和运营模块的个人开发平台。架构优先保证：

- 新增模块时只需要注册路由和模块元数据。
- 页面外壳、导航、状态、面包屑和设计令牌保持一致。
- 原型能力、演示数据和真实业务数据有清晰边界。
- 后续接入 API、鉴权、任务队列和持久化时不需要重写页面结构。

## 分层

```text
src/app/                 路由入口，负责页面组合
src/components/          业务无关或跨页面复用的 UI
src/components/ui/       shadcn 基础组件
src/config/              路由、导航、能力和产品配置
src/data/demo/           明确标记的演示数据
src/lib/                 API 客户端、格式化和纯函数工具
src/hooks/               可复用的客户端交互和数据 hooks
```

## 页面约定

- 页面默认使用 Server Component；只有使用浏览器 API、状态或事件的部分才使用 Client Component。
- 子页面统一使用 `PageShell`，内容区使用真实模块或 `PlaceholderState`。
- 页面标题、所属分组、路由状态和面包屑来源于 `src/config/navigation.js`。
- 不在页面中重复维护导航名称、路由名称和状态标签。
- 占位页面必须标记为 `prototype` 或 `planned`，不得显示“可用”。

## 数据约定

- `src/data/demo/` 只放演示数据，文件名和模块名必须包含明确业务范围。
- 真实 API 接入后，页面只消费统一的数据适配层，不直接散落 fetch 请求。
- API 返回结构和界面展示结构分离；转换逻辑放在 `src/lib` 或领域数据模块。
- 不把个人、内部业务或敏感数据写死在页面组件中。

## UI 约定

- Token 遵循 primitive → semantic → component 三层，定义在 `src/app/globals.css`。
- 组件优先使用 `var(--token)` 和 Tailwind 语义色，避免在 JSX 中写新的 raw hex。
- 交互控件必须有 hover、focus-visible、disabled 和 loading/empty/error 中适用的状态。
- 复杂页面使用统一的 `mb-6` 区块间距、`PageHeader` 标题区和公共空状态。
- 图标使用 `lucide-react`；纯图标按钮必须有 `aria-label` 或 Tooltip。

## 变更顺序

1. 先更新 `src/config/navigation.js` 中的模块元数据。
2. 再创建页面入口和内容组件。
3. 再接入数据适配层或 API。
4. 最后补齐空、错、加载和权限状态。
5. 运行 `npm run lint` 与 `npm run build`。
