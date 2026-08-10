# 先马AI内容与视觉平台

这是一个基于 Next.js App Router 的前端原型与开发工作台，用来验证 AI 买家秀、AI 商品套图、素材库弹窗、图片队列和统一导航框架。

## 快速开始

```bash
npm install
npm run dev
```

开发服务默认运行在 `http://localhost:3000`。

## 主要入口

- `src/config/navigation.js`：顶部菜单、侧边栏、路由元信息、面包屑来源
- `src/app/globals.css`：全局设计 token 与基础样式
- `src/components/workbench/`：公共工作台组件
- `src/app/ai-hub/BuyerShowPage.jsx`：AI 买家秀
- `src/app/ai-hub/SuitePage.jsx`：AI 商品套图
- `src/app/ui-guide/page.js`：UI 样式与设计规范演示页
- `docs/前端UI规范与需求说明-V1.md`：给开发的 UI 规范与需求说明
- `UI_SPEC.md`：完整视觉与布局规范

## 当前状态

- 当前页面与交互以原型验证为主
- 图片队列、素材弹窗、大图预览、任务详情下载等能力已抽为公共实现
- 新增子页面应优先复用现有框架与公共组件，避免重复造轮子
