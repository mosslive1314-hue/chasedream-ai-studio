# ChaseDream Creator Studio

AI 驱动的互动叙事游戏创作平台 — 将剧本转化为可玩互动叙事结构。

## 技术栈

- **框架**: [TanStack Start](https://tanstack.com/start) 1.168.x (Vite 8 + Nitro 3)
- **路由**: [TanStack Router](https://tanstack.com/router) (file-based routing)
- **状态管理**: [Zustand](https://zustand.docs.pmnd.rs/) 5 + IndexedDB persistence
- **UI**: [TailwindCSS](https://tailwindcss.com/) 4 + [Shadcn UI](https://ui.shadcn.com/) + [Framer Motion](https://motion.dev/)
- **节点图**: [@xyflow/react](https://reactflow.dev/) 12 + dagre auto-layout
- **AI**: OpenAI / Qwen / 混元 多模型路由

## 快速开始

### 前置要求

- [Bun](https://bun.sh/) >= 1.3 (推荐) 或 Node.js >= 22
- 无需数据库（使用 IndexedDB 本地持久化）
- 无需 API Key 即可启动（AI 功能在设置页面手动配置）

### 安装与启动

```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev

# 打开浏览器访问 http://localhost:3000
```

### 构建生产版本

```bash
bun run build
bun run start
```

## 项目结构

```
src/
├── routes/           # 页面路由 (TanStack Router file-based)
├── components/
│   ├── screens/      # 页面组件 (lazy-loaded)
│   ├── layout/       # 布局组件 (AppShell, SideNav, etc.)
│   ├── ui/           # 通用 UI 组件
│   └── workbench/    # 工作台标签页
├── store/            # Zustand stores (persist + IndexedDB)
├── lib/
│   ├── ai/           # AI Agent 系统 (tool-registry, chat-loop, model-router)
│   ├── reactflow/    # ReactFlow 集成 (node/edge types, sync, auto-layout)
│   ├── seed/         # Mock 数据种子
│   └── types/        # TypeScript 类型定义
├── server/functions/ # TanStack Start Server Functions
├── router.tsx        # Router 配置
└── start.ts          # TanStack Start 入口
```

## 核心功能

| 功能 | 说明 |
|------|------|
| AI 创作对话 | Agent 驱动的创作伙伴，支持工具调用和 HITL 确认 |
| 节点图画布 | ReactFlow 可视化编辑故事节点和边关系 |
| 演出预览 | 互动叙事模拟器，支持选择分支和变量追踪 |
| 版本管理 | 快照、分支、差异对比 |
| 剧本编辑 | TipTap 富文本编辑器 |

## 环境变量

项目默认不需要 `.env` 文件即可运行。以下为可选配置：

```bash
# AI API Keys (也可在设置页面 UI 中配置)
OPENAI_API_KEY=sk-xxx
QWEN_API_KEY=sk-xxx
HUNYUAN_API_KEY=xxx

# 数据库 (仅 server functions 使用，不影响前端页面)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp
```

## 开发说明

- **SSR**: 启用 SSR 用于生成 HTML shell，所有交互内容通过 ClientGuard + React.lazy 在客户端渲染
- **数据持久化**: 所有用户数据存储在浏览器 IndexedDB 中，无需后端数据库
- **Auth**: 开发模式自动使用 mock 用户，无需配置认证服务

## License

Private — All rights reserved.
