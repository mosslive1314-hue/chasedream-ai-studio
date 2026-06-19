# Project Memory — ChaseDream Creator Studio

## Tech Stack
- **Framework**: TanStack Start 1.168.x (Vite 8 + Nitro 3)
- **Router**: TanStack Router (file-based, src/routes/)
- **State**: Zustand 5 + IndexedDB persistence (idb-keyval dynamic import + memory fallback)
- **UI**: TailwindCSS 4 + Shadcn UI + Framer Motion
- **Auth**: Local zustand store (useAuthStore, skipHydration:true)
- **Build**: Vite 8 + Nitro 3 | SSR enabled (shell only), content client-only via ClientGuard + React.lazy

## Critical Dev Notes
- **SSR script injection**: Must manually add `<script type="module" src="/@id/virtual:tanstack-start-dev-client-entry" />` in `__root.tsx` <head>
- **Zustand selector 陷阱**: 禁止 `s => s.getHistory()` — 每次返回新引用导致无限循环。改为 `s => s.history` + useMemo 派生
- **IIFE in render**: 禁止在组件体中用 IIFE 计算派生状态(如 `const x = (()=>{...})()`) — 每次渲染返回新引用导致 useMemo/useEffect 级联无限循环。改用 useMemo
- **Store action in useEffect**: useRef pattern，不应将 store action 放入 useEffect 依赖数组
- **rebuildPlayableGraph guard**: set() 前做 JSON.stringify 比较，graph 相同时跳过
- **idbStorage**: dynamic import('idb-keyval') + isIndexedDBAvailable() probe，SSR 安全

## GitHub Repo
- **URL**: https://github.com/mosslive1314-hue/chasedream-creator-studio (Private)
- **Commit 1**: feat: initial commit — TanStack Start migration (216 files)
- **Commit 2**: fix: CSS import path + README + .env.example
- **本地镜像**: C:\tmp\chasedream-clean

## MVP PRD (v2.0 — 2026-06-16)
- **核心目标**: Agent对话驱动，端到端跑通互动叙事游戏创作链路
- **验收标准**: 3场景 + 2选择点 + 2不同结局
- **信息架构**: Agent-First + Canvas，左侧常驻对话(320px) + 右侧单焦点视图
- **4阶段全部完成**: Phase1 Agent(✅) → Phase2 Canvas(✅) → Phase3 Simulator(✅) → Phase4 E2E(✅)

## P0 Implementation Status (ALL COMPLETE)
- ✅ Agent: system-prompt + tool-registry(18 tools) + tool-executor + chat-loop + model-router + agent-store + AgentPanel
- ✅ Canvas: ReactFlow sync + StoryNodeRF(7 types) + 5 edge types + dagre auto-layout + NodesScreen editing
- ✅ Simulator: playable-graph-generator + path-test-engine + SimulatorScreen + route search params
- ✅ E2E: tool handlers auto rebuild graph + SimulatorScreen watches store changes
- ✅ BugFix: Zustand selector infinite loop (VersionScreen + SimulatorScreen + NodesScreen) + rebuildPlayableGraph guard

## Week 1 UI 范式重构 — Agent-First 三区布局 (COMPLETE)
- **布局**: Chat(左 320px) + Canvas(中) + Context(右 280px)，均可折叠
- **AgentFirstShell**: route→tab 单向同步(useRef 防循环)，<Outlet /> 渲染路由内容
- **AgentPanel embedded mode**: `embedded` prop，true 时内联 <aside>，false 时 createPortal overlay
- **ContextPanel**: 选中节点属性、角色列表、变量、版本快照
- **use-ui-store 新增**: activeTab/agentPanelCollapsed/contextPanelCollapsed/selectedNodeId
- **__root.tsx**: AppShell → AgentFirstShell | **index.tsx**: redirect → /nodes

## Key File Paths
- Routes: `src/routes/*.tsx` | Screens: `src/components/screens/*Screen.tsx`
- Stores: `src/store/*.ts` | Root: `src/routes/__root.tsx`
- **Layout**: `src/components/layout/AgentFirstShell.tsx` (主壳) + `ContextPanel.tsx`
- **Legacy Shell**: `src/components/layout/AppShell.tsx` (已弃用，保留备份)
- Agent: `src/lib/ai/` | Canvas: `src/lib/reactflow/` | Simulator: `src/lib/playable-graph-generator.ts`
