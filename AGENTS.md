# Agent Guide

本仓库是 **逐梦 Creator Studio** —— 一个 AI 原生的互动影游开发工作台，把剧本转化为可玩的互动叙事结构。

> ⚠️ 本文件描述的是**当前真实架构**（TanStack Start）。任何与本文不符的旧描述（如 Next.js、`@eazo/sdk`、`src/app/` 路由等）均属于历史残留，应以本文件为准。

## 1. 技术栈

- **TanStack Start** + **TanStack Router**（文件式路由，`src/routes/`）
- **React 19** + **TypeScript**
- **Tailwind CSS v4**（`@tailwindcss/vite` 插件）
- **Bun**（包管理器 + 脚本运行器，`packageManager: bun@1.3.9`）
- **Zustand 5**（状态管理，14 个 persist store + `StoreHydrator` 统一 rehydrate）
- **Drizzle ORM**（PostgreSQL，`postgres.js` 驱动）
- **@xyflow/react**（节点画布，用于剧本图编辑）
- **TipTap**（富文本编辑器，剧本编辑用）
- **@modelcontextprotocol/sdk**（MCP server，暴露工具给外部 Agent）
- **framer-motion** + **lucide-react** + **sonner**（动画 / 图标 / Toast）
- **Nitro**（TanStack Start 的服务端引擎）

> ❌ 不依赖 `@eazo/sdk`、不依赖 Next.js、不使用 `src/app/` 目录。`vite.config.ts` 配置 `tanstackStart({ srcDirectory: "src" })`，所有路由都在 `src/routes/`。

## 2. 命令

```bash
bun install
bun dev          # 启动开发服务器（vite dev，端口 3000）
bun run build    # 生产构建（vite build → .output/server/index.mjs）
bun start        # 运行生产构建
bun run lint     # eslint

# 数据库（Drizzle）
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

## 3. 项目结构

```
src/
  routes/                      — TanStack Router 文件式路由
    __root.tsx                 — 根路由：按路径分流到 Studio 或 AgentFirstShell
    studio.tsx                 — 新 Studio 入口（/studio）
    *.tsx                      — 旧 16 个 Screen 路由（overview/script/parse/...）
  components/
    studio/                    — 【新】AI 原生 Studio（对话+画布+上下文三区）
      studio-layout.tsx        — 顶层布局：左对话(320px) + 中画布(flex-1) + 右上下文(280px)
      chat-panel.tsx           — 左侧 Agent 对话区
      canvas-area.tsx          — 中间画布区（图编辑/预览/设置等多 tab）
      context-panel.tsx        — 右侧上下文面板
      studio-toolbar.tsx       — 顶部工具栏（项目名编辑 + tab 切换 + 面板触发）
      audio-panel / style-panel / export-panel / import-panel / settings-panel / version-panel
    screens/                   — 【旧】16 个传统多页 Screen（仍由 routes/*.tsx 激活）
    layout/
      AgentFirstShell.tsx      — 旧 UI 外壳：挂载 StoreHydrator + ProjectSwitcher + Toaster + 命令面板等基础设施
      ContextPanel.tsx
    simulator/                 — 运行时预览组件（scene-renderer / ui-renderer / audio-player / save-panel / style-provider / use-runtime-engine）
    ui/                        — 基础 UI 原语（button/card/dialog/input/...）+ 复合组件（AgentPanel/CommandPalette/SaveIndicator/...）
    lib/
      AuthBootstrap.tsx        — 登录引导
    user-profile/
      user-sync-effect.tsx     — 登录后 upsert 用户到 DB
  lib/
    ai/                        — AI 多 Agent 系统（核心）
      agent-orchestrator.ts    — 7 Expert Agent 编排器（narrative/interaction/cinematic/art/gameplay/qa/release）
      agent-chat-loop.ts       — Agent 对话主循环
      agent-system-prompt.ts   — Agent 系统提示词
      tool-registry.ts         — 工具注册表
      tool-executor.ts         — 工具执行器
      model-router.ts          — 模型路由（多模型选择）
      ai-service.ts            — AI 服务调用
      ai-image-service.ts      — 图像生成
      ag-ui-events.ts          — AG-UI 事件流
      pin-graph-store.ts       — Pin Graph 状态
      pin-graph-tools.ts       — Pin Graph 工具
    runtime/                   — 运行时引擎（scene-context / scene-objects / snapshot / executor）
    node-system/               — 节点系统（built-in 节点 + executor + node-registry）
    dsl/                       — 剧本 DSL（compiler / parser / tokenizer / types）
    reactflow/                 — @xyflow/react 集成（auto-layout / node-types / edge-types / sync）
    save/                      — 存档系统（save-manager / save-types）
    style/                     — 样式系统（style-manager / default-styles / style-types）
    ui-system/                 — UI 系统（ui-manager / ui-templates / ui-types）
    resource/                  — 资源索引
    export/                    — 导出适配器
    db/                        — Drizzle（schema/users + queries/users + client + migrate）
    auth/                      — 鉴权（requireAuth）
    api/                       — 客户端 API 封装（request.ts / user-profile.ts）
    mcp/
      server.ts                — MCP server 入口（注册工具给外部 Agent）
    types/                     — 全部业务类型定义（narrative/cinematic/game/expert/...）
    seed/                      — 种子数据（project/narrative/cinematic/expert/...）
    studio-data.ts             — Studio 数据
    persistence.ts             — 持久化
    consistency-engine.ts      — 一致性校验
    cascade-validation.ts      — 级联校验
    condition-engine.ts        — 条件引擎
    tension-curve.ts           — 张力曲线
    playable-graph-generator.ts — 可玩图生成
    data-flow-bridge.ts        — 数据流桥接
    path-test-engine.ts        — 路径测试
  store/                       — 14 个 Zustand store
    index.ts                   — 统一导出
    StoreHydrator.tsx          — 统一 rehydrate（在 AgentFirstShell 和 StudioLayout 都挂载）
    idb-storage.ts             — IndexedDB 持久化适配器
    use-project-store.ts       — 项目（持久化 key: cd-projects）
    use-narrative-store.ts     — 叙事节点
    use-canvas-agent-store.ts  — 画布 Agent 状态
    use-expert-store.ts        — 7 Expert Agent
    use-version-store.ts       — 版本
    use-export-store.ts        — 导出
    use-history-store.ts       — 历史撤销
    use-wardrobe-store.ts      — 服装
    use-skill-store.ts         — 技能
    use-analytics-store.ts     — 分析
    use-settings-store.ts      — 设置
    use-ui-store.ts            — UI 状态
    use-project-data-cache-store.ts — 项目数据缓存
    use-auth-store.ts          — 鉴权
    ProjectSwitcher.tsx        — 项目切换组件
  server/
    functions/                 — TanStack Start server functions
      notifications.ts
      user.ts
  utils/
    utils.ts                   — cn() Tailwind class helper
  globals.css                  — 全局样式 + CSS 变量（--app-bg / --bg / ...）
  router.tsx                   — 路由实例（import ./routeTree.gen）
  start.ts                     — TanStack Start 入口
  routeTree.gen.ts             — 自动生成的路由树（勿手改）
```

## 4. 双 UI 系统（重要）

项目当前**两套 UI 并存**，由 `src/routes/__root.tsx` 按路径分流：

```ts
// src/routes/__root.tsx
const isStudioRoute = location.pathname.startsWith("/studio");
{isStudioRoute ? <StudioLayout /> : <AgentFirstShell />}
```

| 系统 | 路径 | 入口 | 状态 |
|---|---|---|---|
| **新 Studio**（AI 原生） | `/studio` | `src/components/studio/studio-layout.tsx` | 当前重点开发方向 |
| **旧 AgentFirstShell**（多页） | `/`、`/overview`、`/script` 等 16 个路由 | `src/components/layout/AgentFirstShell.tsx` | 保留作为工作流参考，逐步迁移到 Studio |

**关键差异：**
- `AgentFirstShell` 挂载了完整基础设施：`StoreHydrator`、`ProjectSwitcher`、`UndoRedoListener`、`CommandPalette`、`SaveIndicator`、`Toaster`、`OnboardingGate`、`AuthBootstrap`、`AgentPanel`、`ContextPanel`。
- `StudioLayout` 目前只挂载了 `StoreHydrator`（已修复 persist rehydrate 问题），**其他基础设施尚未接入** —— 这是方向 A 要补全的缺口。

## 5. 状态管理（Zustand）

### 5.1 Store 使用规范

```ts
import { useNarrativeStore, useProjectStore } from "@/store";

// 组件内：响应式订阅
const projectName = useProjectStore((s) => s.projects.find(p => p.id === s.currentProjectId)?.title);

// 事件处理器/effect 内：直接调用 action
useProjectStore.getState().updateProject(id, { title: newName });
```

### 5.2 StoreHydrator（关键）

所有 persist store 都用 `skipHydration: true` 创建，必须由 `StoreHydrator` 统一触发 rehydrate。**任何绕过 `AgentFirstShell` 的新路由（如 `/studio`）都必须自己挂载 `<StoreHydrator />`**，否则页面刷新后所有 persist 数据丢失。

```tsx
// studio-layout.tsx
import { StoreHydrator } from "@/store";
return (
  <div>
    <StoreHydrator />  {/* 必须挂载 */}
    {/* ... */}
  </div>
);
```

### 5.3 持久化 key

- 项目：`cd-projects`
- 其他 store 见各自 `persist({ name: "cd-xxx" })` 配置
- IndexedDB 适配器：`src/store/idb-storage.ts`

## 6. AI 多 Agent 系统

`src/lib/ai/` 是核心。**7 个 Expert Agent** 通过 Handoff 协作：

| Agent | 职责 |
|---|---|
| narrative | 剧本叙事 |
| interaction | 互动设计 |
| cinematic | 镜头演出 |
| art | 美术 |
| gameplay | 玩法 |
| qa | 质量校验 |
| release | 发布 |

**架构：**
- `agent-orchestrator.ts` —— 编排器，决定 Handoff
- `agent-chat-loop.ts` —— 对话主循环
- `tool-registry.ts` + `tool-executor.ts` —— 工具系统
- `model-router.ts` —— 多模型路由
- `ag-ui-events.ts` —— AG-UI 事件流（流式输出）

> ⚠️ **当前缺口**：新 Studio 的 `chat-panel` 只连接了单个 Agent，7 Expert 协作系统尚未接入。这是方向 A 的重点。

## 7. 运行时 & 预览

- `src/lib/runtime/` —— 运行时引擎（executor / scene-context / scene-objects / snapshot）
- `src/components/simulator/` —— 预览组件：
  - `scene-renderer.tsx` —— 场景渲染
  - `ui-renderer.tsx` —— UI 渲染
  - `audio-player.tsx` —— 音频播放
  - `save-panel.tsx` —— 存档面板
  - `style-provider.tsx` —— 样式提供
  - `use-runtime-engine.ts` —— 运行时引擎 hook

> ⚠️ **当前缺口**：新 Studio 的 `canvas-area` 预览只用了 `scene-renderer` + `use-runtime-engine`，其他 5 个组件尚未接入。

## 8. 节点系统 & 画布

- `src/lib/node-system/` —— 节点定义（built-in 下 15+ 节点类型）+ executor + registry
- `src/lib/reactflow/` —— @xyflow/react 集成（auto-layout / node-types / edge-types / sync）
- 画布编辑器在 `src/components/studio/canvas-area.tsx`

## 9. DSL 编译器

`src/lib/dsl/` —— 剧本 DSL：
- `tokenizer.ts` —— 词法分析
- `parser.ts` —— 语法分析
- `compiler.ts` —— 编译为可执行图
- `types.ts` —— DSL 类型

## 10. 数据库（Drizzle）

```bash
bun run db:generate   # 生成迁移
bun run db:migrate    # 执行迁移
bun run db:push       # 推送 schema
bun run db:studio     # 可视化管理
```

- Schema：`src/lib/db/schema/`（当前只有 `users`）
- Queries：`src/lib/db/queries/`（`users.ts` 提供 `upsertUser`）
- Client：`src/lib/db/client.ts`
- **必须保留 `users` 表** —— 每个应用都要持久化登录用户信息。

## 11. 鉴权

```ts
import { requireAuth } from "@/lib/auth";

export function GET(request: NextRequest) {
  const r = requireAuth(request);
  if (!r.ok) return r.response;
  // r.user: { id, email, name, avatarUrl }
}
```

客户端 API 调用统一走 `src/lib/api/request.ts`（自动注入 session header）。

## 12. MCP Server

`src/lib/mcp/server.ts` —— MCP server 入口，通过 `buildMcpServer(userId)` 组装。新增工具：

1. 创建 `src/lib/mcp/tools/<tool-name>.ts`，导出 `register<ToolName>(server, userId)` 函数
2. 在 `server.ts` 的 `buildMcpServer` 中注册

工具规则：
- 始终用闭包传入的 `userId`，**绝不信任用户输入的 ID**
- 成功返回 `{ content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }`
- 失败返回 `{ isError: true, content: [...] }`

## 13. 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `DATABASE_URL` | 用 DB 时 | `postgresql://USER:PASS@HOST:PORT/DATABASE` |
| 鉴权相关密钥 | 是 | 见 `src/lib/auth/` |
| AI 模型密钥 | 是 | 见 `src/lib/ai/ai-service.ts` |

复制 `.env.example` 到 `.env` 本地配置。

## 14. 编码规范

### 14.1 组件封装

- **`page.tsx` / 路由文件保持精简** —— 只导入一个顶层组件并渲染
- **一个文件一个组件** —— 辅助组件也拆分到独立文件
- **按功能分组** —— 相关组件放在 `src/components/<feature>/`，不要堆在扁平 `components/` 下
- **barrel 导出** —— 每个 feature 文件夹用 `index.tsx` 重新导出顶层组件

### 14.2 文件大小指导（替代旧的硬限制）

> ❌ **不再采用**"250 行硬限制一刀切"。该规则来自已废弃的旧模板，对当前复杂的 Studio 组件（如 `canvas-area.tsx` 692 行、`chat-panel.tsx` 485 行）会造成过度拆分。

**新原则：按"内聚边界"拆分，而非按行数拆分。**

| 信号 | 拆分动作 |
|---|---|
| 一个 section 有自己的 `useState` / `useEffect` / 数据 fetch | 抽成独立组件 |
| 一个 section 职责可以用一句话命名 | 抽成独立组件 |
| 同一文件出现 2 个以上不相关的 UI 块 | 按职责拆分 |
| 文件超过 400 行且仍有增长趋势 | 评估是否可抽 hook / 子组件 |
| 纯展示组件与有状态逻辑混在一起 | 拆分为 presentational + container |

**不强制拆分的情况：**
- 单一职责的组件，即使较长（如一个复杂表单）
- 紧密耦合的 JSX 模板，拆开反而增加跳转成本
- 临时原型阶段，过早拆分会阻碍迭代

### 14.3 命名

- 组件文件：`kebab-case.tsx`（如 `user-profile-card.tsx`）
- 组件导出：`PascalCase` 命名导出（如 `export function UserProfileCard`）
- API helper：`camelCase` 函数，放在 `src/lib/api/<resource>.ts`
- Store：`use-<name>-store.ts`，导出 `useXxxStore`

### 14.4 状态与数据

- **不要在 `page.tsx` 里直接 fetch** —— 委托给 client 组件或 `src/lib/api/`
- **所有 API 调用逻辑放 `src/lib/api/`** —— 不要在组件里直接 `fetch`
- 共享状态用 Zustand store，不要跨文件散布 `useState`
- 读 auth 状态用 `useAuthStore((s) => s.user)`，不要在组件里重复 fetch profile

### 14.5 导入

- 用 `@/` 路径别名，不要 `../../` 链
- UI 原语从 `@/components/ui/` 导入

## 15. 当前开发方向

按用户指定顺序执行：

1. **方向 C（进行中）**：清理旧代码残留 + 移除历史平台依赖
2. **方向 A（待办）**：补全新 Studio 功能缺口
   - 接入 7 Expert 多 Agent 协作系统
   - 补全预览功能（audio/ui/save/style 5 个组件）
   - 接入缺失基础设施（ProjectSwitcher / UndoRedoListener / Toaster / CommandPalette）
   - 补全角色编辑、场景设置、镜头编辑器
3. **方向 B（待办）**：重构为 Converge.ai 式布局
   - 左对话区加宽（320px → 40-45%）
   - 画布从编辑器转为预览器
   - 属性编辑移到浮动面板
   - 增加工作流引导
   - **关键**：融合用户现有的互动影游专业工作流，不是简单照搬

## 16. 目标

保持精简、框架原生，只在有具体产品需求时增加复杂度。新功能优先在 `/studio` 下实现，旧 16 个 Screen 作为工作流参考保留。
