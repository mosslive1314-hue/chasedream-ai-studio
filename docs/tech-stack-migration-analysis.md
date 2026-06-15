# 逐梦AI互动影视游戏平台 — 技术栈迁移全面分析

> **文档版本**：V1.1
> **日期**：2026-07-11
> **作者**：Bob（架构师）
> **状态**：待评审
> **V1.1 修订说明**：基于上轮讨论确认，更新技术栈推荐（TanStack Start + Hono独立WebSocket服务 + PlayCanvas 3D），新增第7章「PRD原始设计与推荐技术栈适配度分析」

---

## 目录

1. [Next.js vs TanStack Router 全面对比](#1-nextjs-vs-tanstack-router-全面对比)
2. [迁移到 TanStack 的核心收益清单](#2-迁移到-tanstack-的核心收益清单)
3. [迁移风险与代价](#3-迁移风险与代价)
4. [完整技术栈推荐](#4-完整技术栈推荐)
5. [架构适配性分析](#5-架构适配性分析)
6. [迁移路线图建议](#6-迁移路线图建议)
7. [PRD原始设计与推荐技术栈适配度分析](#7-prd原始设计与推荐技术栈适配度分析)

---

## 1. Next.js vs TanStack Router 全面对比

### 1.1 路由系统

| 维度 | Next.js App Router | TanStack Router | 逐梦项目影响 |
|------|-------------------|-----------------|-------------|
| **类型安全** | 表面类型安全（IDE 插件提供链接提示），路由参数为 `string \| string[]`，无编译时验证 | **100% 编译时类型安全**，路由路径、参数、搜索参数全链路推断；拼写错误是编译错误 | 🔴 **关键**：逐梦有 20+ 路由，参数类型多样（项目 ID、场景 ID、节点 ID），类型安全可消除整类运行时路由 bug |
| **嵌套布局** | 基于文件系统 `layout.tsx`，隐式嵌套，需理解 Server/Client 边界 | 代码定义路由树，显式嵌套布局，`Outlet` 组件清晰渲染子路由 | 🟡 **中等**：逐梦的三栏布局是全局持久布局，TanStack 的显式嵌套更可控 |
| **搜索参数** | `useSearchParams()` 返回原始字符串，无验证，无类型推断 | `searchParams` 可定义 schema（Zod），编译时类型推断 + 运行时验证 + 序列化/反序列化 | 🔴 **关键**：逐梦的画布状态（选中节点、编辑模式、缩放级别）大量依赖 URL 搜索参数，类型安全搜索参数可大幅减少 bug |
| **路由守卫** | 无内置支持，需手动 middleware 或 `useEffect` 重定向 | 内置 `beforeLoad` 钩子 + `useBlocker`（未保存更改警告） | 🟡 **中等**：逐梦需要「离开未保存项目」警告、权限校验等守卫逻辑 |
| **路由生命周期** | 无挂载/过渡/卸载事件 | `onEnter`/`onStay`/`onLeave` 等生命周期钩子 | 🟢 **辅助**：可实现「场景切换时自动保存」等精细逻辑 |
| **文件路由** | 唯一方式，强制文件系统结构 | 支持文件路由（`@tanstack/router-plugin`）和代码定义路由，可选 | 🟡 **中等**：当前 20+ 文件路由迁移成本低，但代码路由提供更灵活的组织方式 |

**关键判断**：逐梦 71% 的组件是 `"use client"`，说明路由层几乎不涉及服务端渲染逻辑。TanStack Router 的客户端优先路由 + 类型安全搜索参数，是更匹配当前代码模式的选择。

### 1.2 SSR/SSG 需求匹配度

| 维度 | Next.js | TanStack Router/Start | 逐梦项目影响 |
|------|---------|----------------------|-------------|
| **SSR 能力** | 成熟的 SSR/SSG/ISR | 基于 Nitro 的 SSR，功能对等 | 🟢 **低影响**：逐梦**零 Server Components、零 SSR 使用**，当前完全不需要 SSR |
| **SEO 需求** | 一流（SSG/ISR 开箱即用） | 需更多手动配置 | 🟢 **低影响**：逐梦是**创作工具平台**（类似 Figma/VSCode），所有核心页面均在登录后，SEO 几乎无需求 |
| **首屏性能** | SSR 加速首屏渲染 | SPA 模式下首屏较慢，需自行优化 | 🟡 **中等**：可通过代码分割 + 预加载 + 骨架屏缓解 |
| **Server Components** | 默认 RSC | 可选 RSC（Start 中） | 🔴 **关键**：逐梦**零 RSC 使用**，Next.js 的默认 RSC 策略反而是负担——71% 组件被迫标注 `"use client"` |

**关键判断**：逐梦是一个**客户端重度交互应用**（Canvas/WebGL/CRDT/WebSocket），SSR/SSG/RSC 价值接近零。Next.js 的服务端优先架构在此场景下是**架构税而非架构红利**。

### 1.3 客户端状态集成

| 维度 | Next.js | TanStack Router | 逐梦项目影响 |
|------|---------|-----------------|-------------|
| **状态管理** | 无内建方案，需自行集成 | 与 TanStack Query 一等集成，路由 loader 内建 SWR 缓存 | 🔴 **关键**：逐梦有 AppState 统一状态树（renderTree + DAG + selection），TanStack Router 的 loader 机制可直接管理路由级数据预取和缓存 |
| **搜索参数 ↔ 状态同步** | 手动实现，易出 bug | 内建搜索参数验证 + 状态同步 | 🔴 **关键**：逐梦画布的 selection、zoom、pan 等状态需要与 URL 双向同步 |
| **路由级数据预取** | 有限支持（RSC fetch + revalidation） | `loader` + `staleTime`/`gcTime` 精确控制 | 🟡 **中等**：可在路由切换时预取项目数据，提升体验 |

### 1.4 开发体验（DX）

| 维度 | Next.js | TanStack Router/Start | 逐梦项目影响 |
|------|---------|----------------------|-------------|
| **心智负担** | 高——需持续思考 RSC 边界、`"use client"`/`"use server"`、缓存语义（4 层缓存）、序列化规则 | 低——组件默认交互式，显式模式，行为可预测 | 🔴 **关键**：当前代码中 71% `"use client"` 标注是纯粹的心智负担和代码噪声 |
| **学习曲线** | 陡峭——App Router、Server Components、Streaming、Partial Prerendering | 相对平缓——Vite 生态 + 标准 React 模式 + 显式 API | 🟡 **中等**：团队需学习 TanStack Router 特定 API，但概念更少 |
| **框架"魔法"** | 多——自动代码分割、隐式缓存、RSC 序列化、Flight 协议 | 少——行为透明，配置显式 | 🔴 **关键**：逐梦的 Canvas/WebGL/CRDT 集成需要**精确控制渲染时序**，框架隐式行为是调试噩梦 |
| **调试难度** | 高——RSC 边界调试困难、缓存失效语义复杂、DevTools 有限 | 低——标准 React DevTools + TanStack Router DevTools | 🟡 **中等**：Canvas 相关 bug 调试已够复杂，框架层应尽量透明 |
| **API 稳定性** | 历史上多次破坏性变更（Pages → App Router、缓存策略反复调整） | v1 临近稳定，API 设计清晰，破坏性变更较少 | 🟡 **中等**：API 稳定性影响长期维护成本 |

### 1.5 构建性能（Vite vs Webpack/Turbopack）

| 维度 | Next.js (Turbopack/Webpack) | TanStack (Vite) | 逐梦项目影响 |
|------|----------------------------|-----------------|-------------|
| **开发服务器启动** | 较慢（尤其大型项目） | **显著更快**（Vite 的即时启动） | 🔴 **关键**：713 个 TypeScript 文件，冷启动时间差异显著 |
| **HMR 速度** | 中等（Turbopack 有改善） | **极快**（Vite 原生 ESM HMR） | 🔴 **关键**：逐梦的 Canvas 组件热更新对开发效率至关重要 |
| **构建产物体积** | 较大（服务端架构开销） | **更精简**（客户端优先，无架构税） | 🟡 **中等**：直接影响首屏加载时间 |
| **插件生态** | Next.js 专用插件 | **全 Vite 生态**（Rollup 插件通用） | 🟡 **中等**：Vite 生态更丰富，尤其 Canvas/WebGL 相关工具链 |
| **构建配置** | 隐式（`next.config.js` 选项有限） | **显式**（`vite.config.ts` 完全控制） | 🟡 **中等**：逐梦需要自定义 Pixi.js/WebGL 构建优化 |

**关键判断**：713 个 TS 文件 + Canvas/WebGL 渲染管线，Vite 的构建速度优势在开发体验上的收益是**量化级的**。

### 1.6 生态与社区

| 维度 | Next.js | TanStack | 逐梦项目影响 |
|------|---------|---------|-------------|
| **生态成熟度** | ✅ 极成熟，社区庞大 | 🔄 快速增长中，但规模较小 | 🟡 **中等**：逐梦的核心依赖（Pixi.js、Yjs、ProseMirror）均为框架无关库，对框架生态依赖度低 |
| **学习资源** | 海量教程、博客、示例 | 相对较少，但官方文档质量高 | 🟢 **低影响**：团队有 React 经验，TanStack 学习成本可控 |
| **招聘市场** | 主流技能，人才池大 | 新兴技能，人才池较小 | 🟢 **低影响**：TanStack Router 的核心概念（路由、loader、守卫）与 React Router 有共通性 |
| **第三方集成** | 平台绑定（Vercel 深度集成） | **平台自由**（Cloudflare/Netlify/AWS/Fly 均一等支持） | 🟡 **中等**：逐梦可能部署在自有基础设施，部署自由度有价值 |

### 1.7 对话式 Agent / 画布原生 Agent 适配度

| 维度 | Next.js | TanStack Router | 逐梦项目影响 |
|------|---------|-----------------|-------------|
| **WebSocket 集成** | 无特殊支持，API Route 有冷启动问题 | 标准客户端 WebSocket，无框架限制 | 🔴 **关键**：逐梦的对话式 Agent 需要 WebSocket 流式响应，Next.js API Route 的 Serverless 冷启动对实时性有负面影响 |
| **JSON Patch 应用** | 需手动实现状态更新逻辑 | 可与 Zustand/TanStack Query 深度集成 | 🟡 **中等**：Agent 通过 JSON Patch 修改渲染树，两种框架均可实现但 TanStack 集成更自然 |
| **Canvas 状态绑定** | RSC 边界阻碍 Canvas 与 React 状态的双向绑定 | 客户端优先，Canvas 状态绑定无障碍 | 🔴 **关键**：画布原生 Agent 需要**直接操作 Canvas 元素 + 双向绑定 React 状态**，Next.js 的 RSC 边界是架构障碍 |
| **流式响应处理** | 支持（Route Handlers + Streaming） | 原生支持（Server Functions + Streaming） | 🟢 **低影响**：两者均可，实现方式不同 |
| **MCP 协议集成** | 无特殊支持 | 无特殊支持 | 🟢 **低影响**：MCP 是独立协议层，与路由框架无关 |

### 1.8 复杂交互兼容性（Canvas、WebSocket、CRDT）

| 维度 | Next.js | TanStack Router | 逐梦项目影响 |
|------|---------|-----------------|-------------|
| **Pixi.js/WebGL 集成** | 可行但需 `"use client"` 包裹，SSR 需要动态导入 `next/dynamic` | **原生友好**——客户端优先，无需特殊处理 | 🔴 **关键**：逐梦的渲染监视器（右侧面板）是 Pixi.js/WebGL 实时渲染，与 React 共存。TanStack 的客户端优先架构消除了所有 SSR/动态导入的样板代码 |
| **WebSocket 生命周期** | API Route 需处理 Serverless 冷启动 + 连接保持 | 标准 WebSocket，生命周期由应用控制 | 🔴 **关键**：CRDT 协同（Yjs）依赖长连接 WebSocket，Serverless 架构不适配 |
| **CRDT（Yjs）集成** | 框架无关，但 API Route 环境不友好 | 框架无关，标准客户端/服务端环境均友好 | 🟡 **中等**：Yjs 需要持久化 WebSocket 连接，与 Serverless 模型冲突 |
| **高频交互性能** | RSC 序列化/反序列化开销、缓存一致性检查 | 纯客户端渲染，无额外开销 | 🔴 **关键**：逐梦的逆向拾取 Flow（点击画布 → Store 更新 → 所有视图同步）需要**亚 16ms 响应**，任何框架层开销都不可接受 |

---

## 2. 迁移到 TanStack 的核心收益清单

### 2.1 消除架构税（Architecture Tax Relief）

| # | 收益 | 关联项目需求 | 量化指标 |
|---|------|-------------|---------|
| 1 | **消除 71% 的 `"use client"` 标注** | 256 个客户端组件无需标记 | 减少 ~256 行样板代码，消除 RSC 边界认知负担 |
| 2 | **消除 SSR/SSG 构建开销** | 零 SSR 使用，构建产物不含服务端运行时 | 构建产物预计缩小 30-40%，构建时间减少 |
| 3 | **消除 `next/dynamic` 导入** | Canvas/WebGL 组件无需动态导入 workaround | Pixi.js 渲染器初始化代码简化 |
| 4 | **消除 API Route 冷启动** | WebSocket 长连接不受 Serverless 影响 | Agent 流式响应延迟从 ~500ms（冷启动）降至 ~50ms |

### 2.2 类型安全收益（Type Safety Gains）

| # | 收益 | 关联项目需求 | 量化指标 |
|---|------|-------------|---------|
| 5 | **100% 编译时路由类型安全** | 20+ 路由，参数类型多样（projectId, sceneId, nodeId） | 消除 `useParams()` 返回 `string \| string[]` 的类型断言代码 |
| 6 | **搜索参数 schema 验证** | 画布状态（selection, zoom, mode）通过 URL 参数同步 | 消除手动 `URLSearchParams` 解析/序列化代码 |
| 7 | **路由间导航类型推断** | `navigate({ to: '/project/$id', params: { id } })` 编译时验证参数 | 消除死链和参数错误类 bug |
| 8 | **Loader 数据类型推断** | 路由级数据预取返回类型自动推断到组件 | 消除手动类型声明和 `as` 断言 |

### 2.3 开发效率收益（DX Gains）

| # | 收益 | 关联项目需求 | 量化指标 |
|---|------|-------------|---------|
| 9 | **Vite 极速 HMR** | 713 个 TS 文件，Canvas 组件热更新 | HMR 速度预计提升 3-5x |
| 10 | **路由 DevTools** | 复杂嵌套布局 + 搜索参数调试 | 可视化路由状态、缓存、待处理导航 |
| 11 | **TanStack Query 一等集成** | Agent 流式响应数据缓存 + 项目数据预取 | Loader 内建 SWR 缓存，减少手动缓存逻辑 |
| 12 | **`beforeLoad` 路由守卫** | 「离开未保存项目」警告、权限校验 | 消除手动 `useEffect` 重定向逻辑 |

### 2.4 架构适配收益（Architecture Fit Gains）

| # | 收益 | 关联项目需求 | 量化指标 |
|---|------|-------------|---------|
| 13 | **Canvas/WebGL 原生友好** | Pixi.js 渲染监视器 + 画布原生 Agent | 消除 `next/dynamic` + `"use client"` 双重包裹 |
| 14 | **WebSocket 生命周期可控** | CRDT 协同（Yjs）+ Agent 实时通信 | 消除 Serverless 冷启动对长连接的影响 |
| 15 | **无隐式缓存语义** | AppState 统一状态树 + JSON Patch 驱动 | 消除 Next.js 4 层缓存与 Zustand Store 的冲突 |
| 16 | **Vite 插件生态** | Pixi.js 资源打包优化、WASM 加载、Web Worker | 可用 `vite-plugin-pixi`、`vite-plugin-wasm` 等生态插件 |
| 17 | **部署自由度** | 未来可能需要私有化部署、Edge 部署 | 不绑定 Vercel，任意 Node/Deno/Bun 运行时 |

---

## 3. 迁移风险与代价

### 3.1 代码迁移量评估

| 迁移项 | 影响范围 | 迁移工作量 | 风险等级 |
|--------|---------|-----------|---------|
| **路由定义迁移** | 20+ 文件路由 → TanStack Router 文件/代码路由 | 中等（2-3 天） | 🟢 低：`@tanstack/router-plugin` 支持文件路由，目录结构可保留 |
| **`next/navigation` 替换** | 20 处（redirect 7处，useRouter/usePathname 13处） | 低（1 天） | 🟢 低：`useRouter` → `useRouter`（TanStack），`redirect` → `throw redirect()` |
| **`next/link` 替换** | 6 处 | 低（0.5 天） | 🟢 低：`<Link>` API 几乎一致 |
| **`next/image` 替换** | 1 处 | 极低（0.5 天） | 🟢 低：替换为 `<img>` 或 `@unpic/react` |
| **`next/og` 替换** | 1 处 | 低（0.5 天） | 🟢 低：替换为 `satori` + 自行渲染 |
| **5 个 API Route 迁移** | ai, mcp, notifications/cron, notifications/test, user/profile | 中等（2-3 天） | 🟡 中：CRUD 类 API 迁移至 TanStack Start Server Functions；WebSocket/实时类（ai, mcp）迁移至 Hono 独立服务 |
| **`next.config.js` → `vite.config.ts`** | 1 个配置文件 | 低（1 天） | 🟢 低：Vite 配置更简洁 |
| **`next/dynamic` 清理** | 动态导入的客户端组件 | 低（1 天） | 🟢 低：直接 import，无需动态导入 |
| **测试框架适配** | 如使用 Next.js 测试工具 | 低（1 天） | 🟢 低：Vitest 替代 Jest |
| **总计** | — | **约 10-14 个工作日**（1 位开发者） | — |

### 3.2 学习成本

| 知识域 | 学习曲线 | 预估时间 | 备注 |
|--------|---------|---------|------|
| TanStack Router 核心 API | 低 | 2-3 天 | 概念与 React Router 类似，但类型安全部分需深入理解 |
| TanStack Router 文件路由 | 极低 | 0.5 天 | 与 Next.js 文件路由结构相似 |
| TanStack Query 集成 | 低 | 1-2 天 | 团队可能已有经验，与 React Query 概念一致 |
| Vite 配置与插件 | 低 | 1 天 | 配置远比 `next.config.js` 简单 |
| TanStack Start Server Functions（含 API Routes） | 中 | 2-3 天 | 全栈模式下需理解 Server Functions + API Routes，但与 Router 一体化开发体验优秀 |

### 3.3 生态缺失

| 缺失项 | 影响程度 | 替代方案 | 备注 |
|--------|---------|---------|------|
| **无内置图片优化** | 🟢 低 | `@unpic/react`、`<img>` + CDN | 逐梦是创作工具，图片量有限 |
| **无内置字体优化** | 🟢 低 | `@fontsource`、Vite 插件 | 可手动优化 |
| **Middleware 生态不同** | 🟡 中 | TanStack Router `beforeLoad` + 自定义中间件 | 功能对等，但社区中间件需自行实现 |
| **ISR 预渲染** | 🟢 低 | 不需要 | 逐梦无 SEO 需求 |
| **社区示例较少** | 🟡 中 | 官方示例 + TanStack Discord | 但逐梦的核心场景（Canvas/CRDT/Agent）在任何框架都缺示例 |
| **Vercel 部署优化** | 🟢 低 | TanStack Start 同样支持 Vercel | 且提供更多部署选项 |

### 3.4 已知限制

| 限制项 | 说明 | 缓解方案 |
|--------|------|---------|
| **TanStack Start 已进入 v1 RC** | Start 已发布 v1 RC，API 锁定，生产可用；Router 已稳定 | 可放心采用 Start 全栈模式，Server Functions + API Routes 开箱即用 |
| **文件路由插件与 Vite 插件冲突** | 极少数情况下，`@tanstack/router-plugin` 与其他 Vite 插件可能有冲突 | 关注 issue，使用稳定版本 |
| **无并行路由（Parallel Routes）** | Next.js 的并行路由在 TanStack 中无直接对等 | 可通过布局组件 + 条件渲染实现相同效果 |
| **无拦截路由（Intercepting Routes）** | Next.js 的拦截路由（模态框场景）在 TanStack 中需手动实现 | 使用搜索参数 + 条件渲染模式实现 |

---

## 4. 完整技术栈推荐

基于逐梦项目的核心需求（AI 原生互动影视创作平台、Canvas/WebGL 渲染、CRDT 协同、WebSocket 实时通信、Agent 集成），推荐以下完整技术栈：

### 4.1 推荐技术栈总览

| 层次 | 技术 | 推荐版本 | 理由 |
|------|------|---------|------|
| **构建/打包** | Vite | ^6.x | 极速 HMR、原生 ESM、Rollup 插件生态丰富、对 Canvas/WebGL/WASM 构建优化友好 |
| **全栈框架** | TanStack Start | v1 RC | 客户端优先全栈框架，内置 Server Functions + API Routes + SSR + Nitro 部署，含 React 19，类型安全路由 + 搜索参数 schema + 路由守卫一体化 |
| **路由** | @tanstack/react-router | ^1.169.x | 100% 类型安全路由、搜索参数 schema 验证、嵌套布局、路由守卫、DevTools（Start 内置） |
| **路由文件生成** | @tanstack/router-plugin | ^1.168.x | Vite 插件，支持文件路由自动生成路由树 |
| **数据获取/缓存** | @tanstack/react-query | ^5.x | 与 Router 一等集成、SWR 缓存、乐观更新、流式数据支持（Agent 响应缓存） |
| **状态管理** | Zustand | ^5.x | ✅ **保留**：轻量、无 Provider、完美适配 Canvas/WebGL 状态绑定；逐梦的 AppState 统一状态树（renderTree + DAG + selection）天然适合 Zustand 的集中式 Store |
| **富文本编辑器** | TipTap | ^3.x | ✅ **保留**：基于 ProseMirror、扩展生态丰富、与 Yjs 原生集成协同编辑、Notion-Style 双态编辑器的基础 |
| **画布渲染** | PixiJS | ^8.x | ✅ **保留**：WebGL2/WebGPU 渲染、高性能 2D 图形、与 React 通过 `@pixi/react` 集成 |
| **React-Pixi 集成** | @pixi/react | ^8.x | PixiJS v8 专用 React 绑定，声明式 Canvas 渲染 |
| **3D渲染** | PlayCanvas | ^2.x | ✅ **PRD v2.5 指定**：开源 Web-first 3D 游戏引擎（MIT），WebGL 2.0 / WebGPU 渲染，与 Pixi.js 2D 渲染互补，支持 3DGS 混合渲染 |
| **节点图** | ReactFlow | ^12.x | 高度可定制的节点图、迷你地图、自动布局、支持自定义节点渲染 |
| **UI 组件库** | Shadcn UI + Radix UI | 最新 | ✅ **保留**：无运行时开销、完全可控、Tailwind 样式；补充 Radix 原语用于复杂交互 |
| **样式方案** | TailwindCSS | ^4.x | ✅ **保留**：原子化 CSS、JIT 编译、与 Shadcn UI 天然集成 |
| **协同编辑** | Yjs + y-prosemirror | 最新 | CRDT 无冲突协同、与 ProseMirror/TipTap 原生集成、支持多人+AI 并发编辑 |
| **实时通信** | WebSocket（原生/Socket.IO） | — | 长连接实时通信、Agent 流式响应、CRDT 同步传输 |
| **表单处理** | React Hook Form + Zod | 最新 | ✅ **保留**：高性能表单、Zod schema 验证与 TanStack Router 搜索参数 schema 复用 |
| **动画** | Framer Motion | ^12.x | ✅ **保留**：React 声明式动画、手势支持、布局动画 |
| **Schema 验证** | Zod | ^4.x | ✅ **保留**：全栈 schema 验证，与 TanStack Router/TanStack Query/React Hook Form 统一 |
| **包管理** | Bun | ^1.x | ✅ **保留**：极速安装、原生 TypeScript 支持、Monorepo 友好 |
| **ORM** | Drizzle ORM | ^0.45.x | ✅ **保留**：类型安全 SQL、轻量、与 PostgreSQL JSONB 存储完美适配 |
| **数据库** | PostgreSQL | 16+ | ✅ **保留**：JSONB 存储渲染树、ACID 事务、成熟生态 |
| **IndexedDB** | idb-keyval | ^6.x | ✅ **保留**：客户端离线缓存、大型资产本地存储 |
| **通知/Toast** | Sonner | ^2.x | ✅ **保留**：轻量美观的 Toast 通知 |
| **后端 API** | TanStack Start Server Functions + Hono | Start v1 RC + Hono ^4.x | **混合架构**：普通 API（CRUD、鉴权、项目数据）用 TanStack Start 内置 Server Functions + API Routes；WebSocket 长连接（Yjs CRDT 同步 + Agent 流式通信）用 Hono 4.x 独立服务，极轻量、多运行时、类型安全 |
| **异步任务队列** | Kafka（BullMQ 备选） | — | 逐梦项目规划中的 AI 资产生成异步队列 |

### 4.2 关键选型决策说明

#### 为什么保留 Zustand 而非迁移到 Jotai/Valtio？

逐梦的 AppState 是**高度关联的统一状态树**（renderTree ↔ DAG ↔ selection 三者强关联），Zustand 的集中式 Store 模式天然适配：

- **JSON Patch 驱动**：Agent 通过 JSON Patch 修改 renderTree，Zustand 的 `set` + `immer` middleware 可直接应用 patch
- **Canvas 状态绑定**：Pixi.js 渲染循环需要高频读取 Store（60fps），Zustand 的 `subscribe` + `getState()` 无 React 调度开销
- **CRDT 桥接**：Yjs 的 `observe` 事件 → Zustand `set`，单向数据流清晰可控

Jotai 的原子化模型适合**松耦合的独立状态**，但对逐梦这种**强关联状态树 + 高频 Canvas 读取**场景，集中式 Store 更高效。

#### 为什么采用 TanStack Start Server Functions + Hono 混合架构？

逐梦的后端需求可分为两类，采用混合架构各取所长：

**普通 API（TanStack Start Server Functions）**：
- 项目 CRUD、用户鉴权、资产元数据管理等标准 REST 语义
- 与前端路由一体化，类型从数据库到 UI 全链路推断
- 基于 Nitro 部署，支持 Serverless / Edge / Node 多运行时
- 无需维护独立后端服务，减少运维复杂度

**WebSocket 长连接（Hono 4.x 独立服务）**：
- Yjs CRDT 实时同步：需要持久化 WebSocket 连接，Serverless 冷启动不适用
- Agent 流式通信：AG-UI 协议的 16 种事件类型通过 WebSocket 推送
- Hono 的 `upgradeWebSocket` 原生支持，极小体积（~14KB），冷启动极快
- 独立部署，可独立水平扩展，不与 Start 主服务耦合

这种"Server Functions 处理普通 API + Hono 处理实时通信"的分层策略，既利用了 Start 的一体化开发体验，又确保了实时通信的可靠性和可扩展性。

#### 为什么选择 ReactFlow 而非 X6？

- **React 原生**：ReactFlow 是 React 组件，与 TanStack Router + Zustand 深度集成
- **自定义节点**：支持完全自定义的 React 节点渲染，适合逐梦的叙事节点图
- **迷你地图**：内置 MiniMap、Controls、Background
- **社区活跃**：12k+ GitHub Stars，持续维护

---

## 5. 架构适配性分析

### 5.1 对话式 Agent（实时流式响应 + JSON Patch 应用）

**适配度：⭐⭐⭐⭐⭐ 优秀**

```
创作者输入 → Debounce → WebSocket → LLM 流式响应
                                      ↓
                              JSON Patch 生成
                                      ↓
                          Zustand Store.set(applyPatch)
                                      ↓
                    ┌─────────────┬──────────────────┐
                    ↓             ↓                  ↓
            ProseMirror      Pixi.js           Agent Panel
            编辑器更新       渲染器更新          状态显示
```

**TanStack 技术栈的适配优势**：

1. **无 RSC 边界阻碍**：WebSocket 连接、JSON Patch 应用、Zustand Store 更新全在客户端，无需穿越 Server/Client 边界
2. **TanStack Query 流式数据**：Agent 流式响应可用 `useQuery` + `stream` 模式，内建缓存和重试
3. **搜索参数同步**：Agent 对话上下文可通过 URL 搜索参数持久化，TanStack Router 的类型安全搜索参数确保参数正确性
4. **路由守卫**：`beforeLoad` 可检查 Agent 连接状态，未连接时重定向到重连页面

### 5.2 画布原生 Agent（Canvas/WebGL 交互 + 状态绑定）

**适配度：⭐⭐⭐⭐⭐ 优秀**

```
画布原生 Agent 操作流程：
┌─────────────────────────────────────────────────┐
│                   Zustand Store                  │
│  AppState { renderTree, DAG, selection }        │
│       ↑                    ↓                    │
│  Agent Patch          Subscribe                  │
│       ↑                    ↓                    │
│  ┌────┴─────┐    ┌──────────────────┐           │
│  │  Agent    │    │  Pixi.js 渲染器  │           │
│  │  Panel    │    │  (60fps 渲染循环)│           │
│  └──────────┘    └──────────────────┘           │
│       ↑                    ↑                    │
│  用户指令            逆向拾取                      │
│  "/choice"        点击 Canvas 元素              │
└─────────────────────────────────────────────────┘
```

**TanStack 技术栈的适配优势**：

1. **客户端渲染无障碍**：`@pixi/react` 组件直接使用，无需 `"use client"` + `next/dynamic` 双重包裹
2. **Zustand 高频读取**：Pixi.js 渲染循环中 `store.getState()` 无 React 调度开销，60fps 无卡顿
3. **逆向拾取 Flow**：Canvas 点击 → `selection` 更新 → 所有面板同步，无 RSC 序列化延迟
4. **Vite 构建优化**：Pixi.js 资源（纹理、精灵表）可通过 Vite 插件优化打包

### 5.3 CRDT 协同编辑

**适配度：⭐⭐⭐⭐☆ 良好**

```
CRDT 协同编辑架构：
                    ┌─────────────┐
                    │  Yjs Server  │
                    │  (WebSocket) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
        创作者 A      创作者 B      AI Agent
              │            │            │
              ↓            ↓            ↓
        Y.Doc (ProseMirror)  Y.Doc (ProseMirror)  Y.Doc (renderTree)
              │            │            │
              └────────────┼────────────┘
                           │
                    Zustand Store
                    (桥接 Yjs → React)
```

**适配优势**：
- WebSocket 长连接不受 Serverless 冷启动影响
- Yjs + y-prosemirror 与 TipTap 原生集成
- Zustand 作为 Yjs ↔ React 的桥接层，单向数据流清晰

**注意事项**：
- Yjs 服务端需要独立部署（非 Serverless），建议使用 Hono + WebSocket 服务器
- CRDT 的 `Y.Doc` 与 Zustand Store 的状态同步需仔细设计，避免双向绑定导致的循环更新

### 5.4 大规模状态树（renderTree + DAG + selection）

**适配度：⭐⭐⭐⭐☆ 良好**

**逐梦的 AppState 结构**：

```typescript
interface AppState {
  // 渲染树：画布图层参数（不可变数据结构）
  renderTree: Immutable<Map<string, RenderNode>>;
  
  // DAG：逻辑节点图
  dag: Immutable<Map<string, DAGNode>>;
  
  // 选择状态
  selection: {
    type: 'node' | 'edge' | 'group' | null;
    ids: string[];
    focusedPanel: 'editor' | 'canvas' | 'agent';
  };
}
```

**TanStack + Zustand 的适配策略**：

1. **Zustand Slices 模式**：将 AppState 拆分为 `renderTreeSlice`、`dagSlice`、`selectionSlice`，每个 Slice 独立更新
2. **`subscribe` + `selector`**：Pixi.js 渲染器仅订阅 `renderTree`，ProseMirror 仅订阅 DAG 中的叙事节点，避免全量渲染
3. **Immer Middleware**：JSON Patch 应用通过 `immer` middleware 简化不可变更新
4. **TanStack Query 管理服务端状态**：项目列表、用户信息等与 AppState 解耦

**性能关注点**：
- `renderTree` 可能包含数千个节点，需使用 `useStore(selector)` 精确订阅，避免全量 `useStore()`
- 考虑对 `renderTree` 使用 `Map` 而非普通对象，提升查找/更新性能

### 5.5 高频交互下的性能

**适配度：⭐⭐⭐⭐⭐ 优秀**

| 交互场景 | 频率 | TanStack 方案 | 性能保障 |
|---------|------|-------------|---------|
| 逆向拾取（Canvas 点击 → 状态同步） | 60fps | Zustand `subscribe` → 无 React 调度 | ✅ 无 RSC 开销 |
| 智能场记（打字 → Debounce → LLM） | 300ms Debounce | TanStack Query + `useDebounce` | ✅ 请求去重 + 缓存 |
| /choice 宏指令 | 用户触发 | Zustand Store + ReactFlow 同步 | ✅ 单向数据流 |
| 异步确权（Tinder 卡片审批） | 手势驱动 | Framer Motion + Zustand | ✅ 声明式动画 |
| CRDT 实时同步 | 每次编辑 | Yjs → Zustand 桥接 | ✅ 增量更新 |
| 画布缩放/平移 | 60fps | Pixi.js 原生 + Zustand selection | ✅ 无框架层开销 |

---

## 6. 迁移路线图建议

### 阶段 0：准备期（1 周）

| 任务 | 说明 |
|------|------|
| 技术预研 | 搭建 TanStack Router + Vite 最小原型，验证 Canvas/WebGL/TipTap 集成 |
| 依赖审计 | 梳理所有 Next.js 特有依赖（`next/*`），评估替换方案 |
| 迁移脚本 | 编写自动化脚本：`next/navigation` → `@tanstack/react-router` 的 API 映射 |
| 分支策略 | 创建 `migration/tanstack` 分支，确保主分支可继续开发 |

### 阶段 1：基础设施迁移（2-3 天）

| 任务 | 说明 |
|------|------|
| Vite 配置 | `vite.config.ts` + TailwindCSS 4 插件 + TanStack Router 插件 |
| 入口文件 | `index.html` + `src/main.tsx` 替代 `app/layout.tsx` + `app/page.tsx` |
| 路由树生成 | `@tanstack/router-plugin` 自动生成 `routeTree.gen.ts` |
| 全局布局 | 三栏式布局迁移为 TanStack Router 的 `rootRoute` + `Outlet` |
| 构建验证 | `bun run dev` + `bun run build` 通过 |

### 阶段 2：路由与导航迁移（2-3 天）

| 任务 | 说明 |
|------|------|
| 文件路由迁移 | 20+ 页面路由文件迁移为 TanStack Router 文件路由 |
| `next/navigation` 替换 | 7 处 `redirect` → `throw redirect()`，13 处 `useRouter`/`usePathname` → TanStack Router API |
| `next/link` 替换 | 6 处 `<Link>` 组件 API 适配 |
| 搜索参数迁移 | 画布状态参数定义 Zod schema + `validateSearch` |
| 路由守卫 | 实现 `beforeLoad` 权限校验 + `useBlocker` 未保存警告 |

### 阶段 3：API 层迁移（2-3 天）

| 任务 | 说明 |
|------|------|
| 5 个 API Route 重写 | CRUD 类 → TanStack Start Server Functions / API Routes；实时类 → Hono WebSocket 独立服务 |
| WebSocket 服务 | Hono WebSocket 服务器（AI Agent 流式通信 + CRDT Yjs 同步） |
| 数据获取迁移 | 关键页面加载器 → TanStack Router `loader` |
| TanStack Query 集成 | Agent 流式响应缓存 + 项目数据预取 |

### 阶段 4：清理与优化（2-3 天）

| 任务 | 说明 |
|------|------|
| `"use client"` 清理 | 移除所有 256 处 `"use client"` 标注 |
| `next/dynamic` 清理 | 移除动态导入，改为标准 import |
| `next/image` / `next/og` 替换 | 1 处图片优化 + 1 处 OG 图替换 |
| 测试迁移 | Jest → Vitest（如有） |
| 性能验证 | Lighthouse + Canvas fps 基准测试对比 |
| CI/CD 适配 | Vite 构建流水线配置 |

### 阶段 5：验证与稳定（1 周）

| 任务 | 说明 |
|------|------|
| 全功能回归测试 | 所有核心 Flow（智能场记、/choice、逆向拾取、异步确权）验证 |
| 类型安全验证 | TypeScript 严格模式 + TanStack Router 类型推断覆盖率 |
| 性能基准 | 开发 HMR 速度、构建时间、首屏加载时间对比 |
| 文档更新 | 开发文档、部署文档、新人 Onboarding 文档更新 |

### 迁移总时间线

```
Week 1:  阶段 0（准备） + 阶段 1（基础设施）
Week 2:  阶段 2（路由迁移） + 阶段 3（API 层）
Week 3:  阶段 4（清理优化） + 阶段 5（验证稳定）
```

**总计：约 3 周（1 位核心开发者全职投入）**

---

## 7. PRD原始设计与推荐技术栈适配度分析

> **本章目标**：逐条对照用户 PRD v2.5 中的每一个关键设计点，评估推荐技术栈的适配程度，识别差异与风险，给出最终建议。

### 7.1 三层解耦架构适配度

#### 7.1.1 存储层（5个组件）

**适配等级：⭐⭐⭐⭐ 高度适配**

| PRD 存储组件 | 推荐技术栈实现 | 适配分析 |
|-------------|---------------|---------|
| **S-01 故事存储** | TanStack Start Server Functions + Drizzle ORM + PostgreSQL JSONB | ✅ `.dfstory` 协议的原生存储：JSONB 存储 renderTree/DAG 等半结构化数据，Server Functions 提供类型安全的 CRUD API |
| **S-02 用户存储** | TanStack Start Server Functions + Drizzle ORM + PostgreSQL | ✅ 标准用户表，Start 内置认证中间件可集成 Clerk/Auth.js |
| **S-03 运行时存储** | Zustand Store（客户端）+ Redis（服务端缓存） | ✅ 运行时状态天然适合 Zustand 集中管理；Redis 作为服务端运行时缓存，Start Server Functions 可直接访问 |
| **S-04 资产存储** | S3/OSS + Drizzle ORM 元数据索引 + idb-keyval 客户端缓存 | ✅ 大文件走对象存储，元数据走 PostgreSQL，客户端离线缓存走 IndexedDB |
| **S-05 反馈数据存储** | TanStack Start Server Functions + Drizzle ORM + ClickHouse（分析） | ✅ 结构化反馈走 PostgreSQL，大规模分析数据可外接 ClickHouse |

**差异与风险**：
- PRD 未指定运行时存储的服务端组件，建议补充 Redis 作为 EventBus + CapabilityRegistry 的服务端状态后端
- S-03 运行时存储跨客户端/服务端，需要明确 Zustand（客户端）和 Redis（服务端）的数据分界线

**最终建议**：推荐技术栈完全覆盖存储层需求，JSONB 是存储 `.dfstory` 半结构化数据的最佳选择。

#### 7.1.2 能力层（25个组件）

**适配等级：⭐⭐⭐⭐ 高度适配**

PRD 要求每个能力组件实现标准接口：`register()`, `execute(input)`, `estimateCost(input)`, `healthCheck()`

**推荐技术栈实现**：

```typescript
// 能力组件标准接口 — TypeScript 实现
interface ICapability<TInput, TOutput> {
  readonly id: string;
  readonly type: 'ai' | 'core' | 'ui';
  register(registry: CapabilityRegistry): void;
  execute(input: TInput): Promise<TOutput>;
  estimateCost(input: TInput): CostEstimate;
  healthCheck(): Promise<HealthStatus>;
}

// 能力注册中心 — Zustand Store 桥接
class CapabilityRegistry {
  private capabilities = new Map<string, ICapability<any, any>>();

  register(capability: ICapability<any, any>): void { /* ... */ }
  get(id: string): ICapability<any, any> | undefined { /* ... */ }
  listByType(type: 'ai' | 'core' | 'ui'): ICapability<any, any>[] { /* ... */ }
}
```

**各层组件映射**：

| PRD 分层 | 组件数 | 技术实现路径 |
|---------|-------|-------------|
| **AI 层**（18个） | 故事/角色/分支剧本/图像/视频/音频/TTS 生成器等 | ✅ 每个 AI 能力封装为 `ICapability` 实现，`execute()` 通过 Hono WebSocket 调用模型路由器，`estimateCost()` 根据模型路由器的成本分层计算 |
| **核心层**（3个） | StateMachine 引擎 / 分支管理器 / 变量系统 | ✅ 核心引擎纯 TypeScript 实现，Zustand 管理状态，StateMachine 可用 XState 或自研轻量 FSM |
| **UI 层**（4个） | 分支画布 / 播放器 / 资产库 / 工作流编辑器 | ✅ ReactFlow 实现分支画布和工作流编辑器，Pixi.js + PlayCanvas 实现播放器，Shadcn UI 实现资产库 |

**差异与风险**：
- 18 个 AI 能力组件的后端实现（模型路由、GPU 调度、队列管理）超出前端技术栈范围，需要独立的后端微服务架构
- `estimateCost()` 和 `healthCheck()` 需要服务端支持，不能纯前端实现——需通过 Start Server Functions 或 Hono 服务调用后端 AI 基础设施

**最终建议**：前端能力组件接口设计完整可行，但需明确 AI 层组件的"前端适配器"模式——前端 `ICapability.execute()` 实际上是调用后端服务的代理，真正的 AI 推理在后端微服务中执行。

#### 7.1.3 编排层（5个智能体）

**适配等级：⭐⭐⭐⭐ 高度适配**

| PRD 智能体 | 推荐技术栈实现 | 适配分析 |
|-----------|---------------|---------|
| **故事创作智能体** | AG-UI 协议 + Hono WebSocket + TanStack Query 流式缓存 | ✅ 通过 AG-UI 事件流驱动，声明式 Generative UI 渲染建议 |
| **视觉化智能体** | AG-UI 协议 + Pixi.js/PlayCanvas 渲染 + Zustand 状态同步 | ✅ Agent Patch 直接操作 renderTree，触发 Pixi.js/PlayCanvas 重新渲染 |
| **互动设计智能体** | AG-UI 协议 + ReactFlow DAG 操作 | ✅ Agent 通过 JSON Patch 添加/修改 DAG 节点和边 |
| **画布原生Agent** | AG-UI 协议 + Zustand + @pixi/react + ReactFlow | ✅ 住在画布中，决策链透明，节点级控制（详见 7.2 节） |
| **审核智能体** | AG-UI 协议 + Server Function 调用内容审核器 | ✅ 审核结果通过 INTERRUPT 事件实现 Human-in-the-Loop |

**差异与风险**：
- PRD 的编排层依赖 AG-UI 协议（详见 7.9 节），需要完整的 AG-UI 客户端 SDK 实现
- 5 个智能体的"智能"来自后端 LLM，前端仅负责交互层——需确保 AG-UI 事件流与 TanStack Start/Hono 的集成方案成熟

**最终建议**：编排层的前端交互设计完美适配推荐技术栈。关键依赖是 AG-UI 协议的前端 SDK 质量，建议优先在 Phase 1 实现画布原生 Agent 作为 AG-UI 集成的 PoC。

---

### 7.2 核心交互范式适配度

#### 7.2.1 画布原生 Agent + AG-UI 协议

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

**PRD 原始设计**：
- 住在创作画布中，决策链透明
- 节点级控制：创作者可在任意节点插手修改
- Detect + Suggest 模式
- 通过 AG-UI 协议与前端通信（16种标准事件类型）
- 三种 Generative UI 模式：受控、声明式（推荐）、开放式

**推荐技术栈实现**：

```
画布原生 Agent 集成架构：

┌─────────────────────────────────────────────────────────────────┐
│                        前端（TanStack Start）                    │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ AG-UI Client  │───▶│  Zustand Store   │───▶│  ReactFlow   │  │
│  │ SDK           │    │  (AppState)      │    │  (DAG画布)   │  │
│  └──────┬───────┘    └────────┬─────────┘    └──────────────┘  │
│         │                     │                                  │
│         │ 16种事件            │ 状态同步                          │
│         ↓                     ↓                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ Generative   │    │  @pixi/react     │    │  Agent Panel  │  │
│  │ UI (声明式)  │    │  (渲染画布)      │    │  (对话面板)   │  │
│  └──────────────┘    └──────────────────┘    └──────────────┘  │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ WebSocket (Hono)
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│                    Hono WebSocket 服务                             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐              │
│  │ AG-UI 协议  │  │ 模型路由器  │  │ LLM 后端    │              │
│  │ 事件分发    │  │ (成本分层)  │  │ (多模型)    │              │
│  └────────────┘  └────────────┘  └──────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

**适配优势**：
1. **声明式 Generative UI**：React 天然适配——Agent 返回的 UI 描述直接渲染为 React 组件，Shadcn UI 提供丰富的可组合原语
2. **节点级控制**：ReactFlow 自定义节点 + Zustand selection 精确定位 Agent 操作的节点，创作者可在任意节点插手
3. **Detect + Suggest**：Agent 的 `TEXT_MESSAGE_START/CONTENT/END` 事件流 → TanStack Query 流式缓存 → UI 实时渲染建议
4. **决策链透明**：Agent 的 `STEP_START/END` 事件 → 日志面板实时展示推理过程

**差异与风险**：
- AG-UI 协议目前的主要实现是 CopilotKit 的 `@copilotkit/runtime`，需评估是否直接使用 CopilotKit SDK 还是自研轻量 AG-UI 客户端
- PRD 明确指定 AG-UI 协议"不绑定 CopilotKit 框架，不绑定 React"，但声明式 Generative UI 模式天然与 React 绑定——这是一个设计哲学与实践的张力

**最终建议**：推荐采用"AG-UI 协议兼容 + 自研轻量客户端"策略。协议层严格遵循 AG-UI 16 种事件类型标准，但客户端实现不依赖 CopilotKit 全家桶，而是基于 Hono WebSocket + Zustand 自研薄封装层。这样既保证了协议兼容性，又避免了框架绑定。

#### 7.2.2 DAG 工作流引擎

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

**PRD 原始设计**：
- 基于有向无环图的工作流编排
- 节点是原子化能力组件，连线是数据流向
- 支持拖拽、删除、插入、替换、保存模板

**推荐技术栈实现**：
- **ReactFlow 12.x**：完美匹配 DAG 可视化需求——自定义节点（映射到能力组件）+ 自定义边（映射到数据流向）+ 拖拽 + 删除 + 迷你地图
- **Zustand**：DAG 状态管理——节点列表、边列表、选中状态、校验状态
- **能力组件标准接口**：每个 ReactFlow 节点内部持有 `ICapability` 引用，节点执行时调用 `capability.execute(input)`

**差异与风险**：无显著差异。ReactFlow 是 DAG 可视化编辑器的最佳选择。

**最终建议**：ReactFlow + Zustand + ICapability 接口三位一体，完美实现 DAG 工作流引擎。

#### 7.2.3 实时预览与编辑同步

**适配等级：⭐⭐⭐⭐ 高度适配**

**PRD 原始设计**：编辑器修改 → 实时反映到画布预览；画布操作 → 编辑器同步更新

**推荐技术栈实现**：
- **Zustand 单一数据源**：`renderTree` 是所有视图的共同状态源
- **`subscribe` + `selector`**：编辑器订阅 DAG 变更 → 更新 renderTree → 画布自动重渲染
- **逆向拾取**：画布点击 → Zustand selection 更新 → 编辑器面板自动聚焦对应节点
- **TanStack Router 搜索参数**：当前选中节点 ID 通过 URL 参数持久化，刷新不丢失

**差异与风险**：
- PlayCanvas 3D 场景的实时预览需要额外桥接：renderTree 变更 → PlayCanvas Entity 更新，这个桥接层需要自研

**最终建议**：2D 层（Pixi.js）的实时预览完美适配；3D 层（PlayCanvas）需要自研 renderTree → PlayCanvas Entity 的响应式桥接。

#### 7.2.4 分层服务模式（专业/半辅助/全自动）

**适配等级：⭐⭐⭐⭐ 高度适配**

**PRD 原始设计**：
- 专业模式：创作者完全控制，Agent 仅响应显式指令
- 半辅助模式：Agent Detect + Suggest，创作者审批
- 全自动模式：Agent 自主执行，创作者可随时中断

**推荐技术栈实现**：
- **AG-UI 协议原生支持**：`INTERRUPT` 事件实现 Human-in-the-Loop，对应半辅助模式的审批节点
- **Zustand 服务模式状态**：`appServiceMode: 'professional' | 'semi-assisted' | 'auto'` 全局状态
- **路由守卫**：`beforeLoad` 根据服务模式加载不同 Agent 配置

**差异与风险**：无显著差异。AG-UI 协议的三种 Generative UI 模式（受控/声明式/开放式）与分层服务模式天然对应。

**最终建议**：AG-UI 协议 + Zustand 服务模式状态即可完美实现分层服务模式。

---

### 7.3 渲染架构适配度

#### 7.3.1 Pixi.js 2D 渲染 vs PRD 混合场景架构

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

**PRD 原始设计**：混合场景架构包含确定性场景层、确定性角色层、交互道具层

**推荐技术栈实现**：

```
混合场景渲染架构：

┌────────────────────────────────────────────────┐
│                  渲染层适配器                    │
│  ┌──────────────────────────────────────────┐  │
│  │         Pixi.js 8 (@pixi/react)          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │场景层    │  │角色层    │  │道具层  │ │  │
│  │  │(2D BG)  │  │(2D角色) │  │(2D UI) │ │  │
│  │  └──────────┘  └──────────┘  └────────┘ │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │         PlayCanvas (3D 渲染)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│  │  │3D场景层  │  │3DGS渲染  │  │3D角色  │ │  │
│  │  │(WebGL2) │  │(3DGS)   │  │(数字人)│ │  │
│  │  └──────────┘  └──────────┘  └────────┘ │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Zustand Store: renderTree → 渲染层适配器分发   │
└────────────────────────────────────────────────┘
```

- **Pixi.js 8**：负责 2D 分支画布、2D 场景预览、UI 叠加层、Hotspot 交互区域
- **@pixi/react**：声明式 React 绑定，renderTree 变更自动触发重渲染
- **Zustand `subscribe`**：渲染循环内 `getState()` 无 React 调度开销，60fps 无卡顿

**差异与风险**：无。Pixi.js 8 + @pixi/react 是 PRD 2D 渲染需求的最佳实现。

#### 7.3.2 PlayCanvas 3D 渲染集成路径

**适配等级：⭐⭐⭐⭐ 高度适配**

**PRD 原始设计**：
- 开源 Web-first 3D 游戏引擎，MIT 许可证
- WebGL 2.0 / WebGPU 渲染
- 渲染层适配器 + 资源管道 + 脚本桥接 + 混合渲染
- 与 3DGS 混合渲染

**推荐技术栈实现**：

```typescript
// PlayCanvas 与 React 的桥接方案
class PlayCanvasBridge {
  private app: pc.Application;
  private entityMap = new Map<string, pc.Entity>(); // renderTree node → PC Entity

  // 监听 Zustand renderTree 变更
  subscribe(store: StoreApi<AppState>): void {
    store.subscribe((state) => {
      this.syncEntities(state.renderTree);
    });
  }

  // 同步 renderTree → PlayCanvas Entity
  private syncEntities(renderTree: RenderTree): void {
    // diff + patch 策略，只更新变化的 Entity
  }

  // 逆向拾取：PlayCanvas Entity 点击 → Zustand selection
  onEntityClick(entityId: string): void {
    useAppStore.getState().setSelection({ type: 'node', ids: [entityId] });
  }
}
```

**集成架构**：
1. **渲染层适配器**：`PlayCanvasBridge` 类，桥接 Zustand renderTree ↔ PlayCanvas Entity
2. **资源管道**：PlayCanvas 的 `Asset` 系统对接 S3/OSS 资产存储 + idb-keyval 客户端缓存
3. **脚本桥接**：PlayCanvas 脚本系统映射到 Zustand Action，实现"3D 场景交互 → 状态更新"
4. **混合渲染**：Pixi.js 2D 叠加层 + PlayCanvas 3D 底层，通过 CSS `position: absolute` + `z-index` 分层

**差异与风险**：
- PlayCanvas 没有像 `@pixi/react` 那样的官方 React 声明式绑定——需要自研 `PlayCanvasBridge` 适配层
- PlayCanvas 的 `Application` 生命周期需要手动管理（init/update/destroy），与 React 组件生命周期的对齐需要 `useEffect` + `useRef`
- 3DGS（3D Gaussian Splatting）渲染目前是前沿技术，PlayCanvas 社区的 3DGS 集成方案尚不成熟，可能需要自研 Shader

**最终建议**：PlayCanvas 集成路径清晰可行，但需要投入自研桥接层。建议在 Phase 1 先实现 2D-only 验证，Phase 2 引入 PlayCanvas 3D + 3DGS。

#### 7.3.3 3DGS + PlayCanvas 混合渲染技术路径

**适配等级：⭐⭐⭐ 基本适配**

**PRD 原始设计**：3DGS 渲染器作为能力组件，与 PlayCanvas 混合渲染

**技术挑战**：
- 3DGS（3D Gaussian Splatting）是基于高斯泼溅的实时渲染技术，需要自定义 Shader
- PlayCanvas 的 Shader 管线支持自定义但文档有限
- 3DGS 的 `.ply` / `.splat` 数据格式需要自研加载器
- 与传统 3D 模型的混合渲染需要深度缓冲共享

**推荐实现路径**：
1. **Phase 1**：使用 PlayCanvas 标准 WebGL2 渲染管线，暂不集成 3DGS
2. **Phase 2**：基于 PlayCanvas 的自定义 Shader Chunk 实现 3DGS 渲染 Pass
3. **Phase 3**：深度缓冲共享 + 传统模型/3DGS 混合渲染

**差异与风险**：
- 3DGS 是 PRD v2.5 的高阶特性，技术成熟度较低，社区方案稀缺
- 建议作为 Phase 2-3 渐进式实现，不阻塞 Phase 1 核心功能

**最终建议**：3DGS 混合渲染是技术前沿领域，推荐技术栈可提供基础（PlayCanvas WebGL2/WebGPU 管线），但具体实现需要大量自研。建议将 3DGS 作为独立的能力组件（`ICapability`）封装，Phase 2+ 渐进式交付。

---

### 7.4 数据协议适配度

#### 7.4.1 .dfstory 协议 → 数据建模 + 存储

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

**PRD 原始设计**：.dfstory 协议 v2.0 是原生故事格式，所有表现形式的基础

**推荐技术栈实现**：

```typescript
// .dfstory 数据建模 — Drizzle ORM + Zod
import { pgTable, uuid, varchar, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// 数据库表定义
export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  version: integer('version').notNull().default(2),  // .dfstory v2.0
  renderTree: jsonb('render_tree').notNull().$type<RenderTree>(),
  dag: jsonb('dag').notNull().$type<DAG>(),
  personalityVectors: jsonb('personality_vectors').notNull().$type<PersonalityVector[]>(),
  sceneSemanticMap: jsonb('scene_semantic_map').notNull().$type<SceneSemanticMap>(),
  worldInfo: jsonb('world_info').$type<WorldInfoEntry[]>(),  // DCI 导入
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod Schema — 与 TanStack Router 搜索参数复用
export const DFStorySchema = z.object({
  version: z.literal(2),
  renderTree: RenderTreeSchema,
  dag: DAGSchema,
  personalityVectors: z.array(PersonalityVectorSchema),
  sceneSemanticMap: SceneSemanticMapSchema,
  worldInfo: z.array(WorldInfoEntrySchema).optional(),
});
```

**适配优势**：
1. **PostgreSQL JSONB**：完美适配 `.dfstory` 的半结构化数据——renderTree、DAG、personality_vector 等均可原生存储为 JSONB，支持 JSONPath 查询
2. **Drizzle ORM**：类型安全的 JSONB 操作，`.$type<>()` 提供端到端类型推断
3. **Zod Schema**：`.dfstory` 协议的验证规则定义一次，与 TanStack Router 搜索参数、API 请求/响应验证复用

**差异与风险**：无显著差异。

**最终建议**：JSONB + Drizzle ORM + Zod 三位一体，是 `.dfstory` 协议的最佳存储和验证方案。

#### 7.4.2 Character Card V2/V3 适配器 → 实现路径

**适配等级：⭐⭐⭐⭐ 高度适配**

**PRD 原始设计**：Character Card V2/V3 格式适配器，支持导入外部角色定义

**推荐技术栈实现**：

```typescript
// Character Card 适配器模式
interface CharacterCardAdapter<TCard> {
  version: 'V2' | 'V3';
  parse(raw: unknown): TCard;
  toDFStory(card: TCard): PersonalityVector;  // 转换为 .dfstory 格式
  fromDFStory(vector: PersonalityVector): TCard;  // 从 .dfstory 导出
}

// V2 适配器
class CharacterCardV2Adapter implements CharacterCardAdapter<CharacterCardV2> {
  version = 'V2' as const;
  parse(raw: unknown): CharacterCardV2 { /* Zod schema 验证 */ }
  toDFStory(card: CharacterCardV2): PersonalityVector {
    // V2 字段 → personality_vector 五维度映射
    return {
      core_motivation: card.description,
      info_boundaries: card.mes_example,
      emotional_response: card.personality,
      language_style: card.scenario,
      relationship_weights: {},  // V2 无此字段，默认空
    };
  }
}
```

**适配优势**：
- Zod Schema 验证确保导入数据合规
- 适配器模式可扩展支持更多角色格式
- `toDFStory()` 方法将外部格式映射到内部 `personality_vector`

**差异与风险**：Character Card V3 的 `extensions` 字段是开放 schema，需要版本协商策略。

**最终建议**：适配器模式 + Zod 验证是最佳实践，Phase 1 先支持 V2，Phase 2 扩展 V3。

#### 7.4.3 personality_vector + scene_semantic_map → 数据结构映射

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

**PRD 原始设计**：
- `personality_vector`：core_motivation, info_boundaries, emotional_response, language_style, relationship_weights
- `scene_semantic_map`：场景语义地图

**推荐技术栈实现**：

```typescript
// 人格向量 — Zod Schema + TypeScript 类型
const PersonalityVectorSchema = z.object({
  core_motivation: z.string().describe('核心动机'),
  info_boundaries: z.record(z.string(), z.string()).describe('信息边界'),
  emotional_response: z.object({
    default: z.string(),
    triggers: z.array(z.object({ stimulus: z.string(), response: z.string() })),
  }).describe('情感响应模式'),
  language_style: z.object({
    tone: z.string(),
    vocabulary: z.array(z.string()),
    patterns: z.array(z.string()),
  }).describe('语言风格'),
  relationship_weights: z.record(z.string(), z.number().min(0).max(1)).describe('关系权重'),
});

// 场景语义地图
const SceneSemanticMapSchema = z.object({
  sceneId: z.string(),
  locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['indoor', 'outdoor', 'abstract']),
    semanticTags: z.array(z.string()),
    ambientProperties: z.record(z.string(), z.unknown()),
  })),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['physical', 'temporal', 'narrative']),
  })),
});

// 存储：PostgreSQL JSONB
// 查询：JSONPath → SELECT * FROM stories WHERE scene_semantic_map @> '{"locations":[{"type":"indoor"}]}'
```

**适配优势**：
- JSONB 原生支持嵌套 JSON 查询和索引（GIN 索引）
- Zod Schema 定义一次，数据库 → API → UI 全链路复用
- `relationship_weights` 的向量特征可接入向量数据库（pgvector 扩展）进行相似性搜索

**差异与风险**：无显著差异。Zod + JSONB + pgvector 的组合覆盖了人格向量的存储、验证和相似性搜索需求。

**最终建议**：推荐采用 PostgreSQL JSONB + pgvector 扩展存储 personality_vector，既满足结构化查询，又支持向量相似性搜索（NPC 灵魂引擎的"记忆检索"场景）。

---

### 7.5 CRDT 协同编辑适配度

**适配等级：⭐⭐⭐⭐ 高度适配（附关键选型建议）**

#### ⚠️ 核心差异：loro vs Yjs 深度对比

PRD v2.5 指定 **loro** 库（MIT 许可证），推荐技术栈使用 **Yjs + y-prosemirror**。这是最关键的技术选型差异，需要深入分析。

| 对比维度 | **Loro** | **Yjs** | 逐梦项目影响 |
|---------|----------|---------|-------------|
| **许可证** | MIT ✅ | Yjs 专用许可证（类似 MIT，允许商用） ✅ | 🟢 两者均可商用 |
| **CRDT 算法** | Fugue（基于区间 RGA） | YATA（基于双链表 RGA） | 🟡 理论上 Fugue 在某些场景下内存效率更高，但 YATA 已被大规模验证 |
| **ProseMirror/TipTap 集成** | ⚠️ **loro-prosemirror 存在但较新**，社区案例少 | ✅ **y-prosemirror 成熟稳定**，TipTap 官方推荐方案 | 🔴 **关键**：逐梦已选定 TipTap 3.x 作为富文本编辑器，y-prosemirror 是经过验证的集成方案 |
| **React 生态集成** | loro-react 绑定存在但较基础 | yjs-react 绑定 + y-websocket + y-indexeddb 生态完整 | 🟡 Yjs 的 React 生态更成熟 |
| **离线支持** | ✅ 原生支持本地优先 | ✅ 通过 y-indexeddb 持久化 | 🟢 两者均支持 |
| **文档模型** | LoroDoc + LoroMap/LoroList/LoroText | Y.Doc + Y.Map/Y.Array/Y.Text | 🟡 概念等价，API 风格不同 |
| **WebSocket 同步** | 需自研或使用 loro-server | ✅ y-websocket 开箱即用（与 Hono WebSocket 兼容） | 🟡 Yjs 的服务端生态更完整 |
| **社区与成熟度** | 较新（2023 年开源），~5k stars，生产案例少 | 成熟（2018 年开源），~17k stars，Notion/Linear 等生产验证 | 🔴 **关键**：逐梦是创新项目，CRDT 层应尽量选择稳定方案降低风险 |
| **性能** | Fugue 算法在大型文档上有理论优势 | YATA 算法已优化多年，实际性能优秀 | 🟢 逐梦的 CRDT 场景（DAG 节点 + 富文本）规模可控，两者性能差异不显著 |
| **多人+AI 并发** | AI Agent 作为特殊 Peer 接入 | AI Agent 作为 Y.Doc 的另一个 Provider 接入 | 🟢 两者均支持，实现方式等价 |
| **版本历史/时间旅行** | ✅ 原生支持版本历史快照 | ✅ 通过 Y.Doc 的 GC + snapshot 实现 | 🟢 两者均支持 |

#### 🏆 最终推荐：Yjs（而非 loro）

**推荐理由**：

1. **TipTap 集成是决定性因素**：逐梦已选定 TipTap 3.x 作为富文本编辑器，y-prosemirror 是唯一经过大规模验证的 ProseMirror CRDT 绑定。loro-prosemirror 虽然存在，但社区案例极少，在 Phase 1 的紧迫时间线下风险不可控。

2. **生产验证差距**：Yjs 在 Notion、Linear、Pixso 等产品中经过百万级用户验证；loro 虽然算法优秀，但生产案例稀缺。逐梦的 CRDT 需求涉及"多人 + AI Agent"并发，这是 CRDT 最复杂的场景，应优先选择稳定性。

3. **服务端生态完整**：y-websocket 开箱即用，与 Hono WebSocket 服务的集成路径清晰；loro 需要自研同步服务。

4. **离线存储成熟**：y-indexeddb 提供可靠的客户端持久化，与逐梦的"本地优先"架构一致。

5. **许可证无障碍**：Yjs 的许可证允许商用，不存在法律风险。

**对 PRD 的偏离说明**：推荐 Yjs 替代 loro 是基于工程实践的风险评估。如果未来 loro 的 ProseMirror 集成成熟（达到 y-prosemirror 的稳定性），可以在 Phase 2 评估迁移。Yjs 和 loro 的文档模型概念等价，迁移成本可控。

#### CRDT 与 Zustand 的桥接设计

```typescript
// Yjs → Zustand 单向桥接
class YjsZustandBridge<T> {
  constructor(
    private yMap: Y.Map<T>,
    private store: StoreApi<AppState>,
    private key: keyof AppState,
  ) {
    // Yjs 变更 → Zustand 更新（单向）
    this.yMap.observe((event) => {
      const snapshot = this.yMap.toJSON();
      this.store.setState({ [this.key]: snapshot } as Partial<AppState>);
    });
  }

  // Zustand Action → Yjs 更新（反向）
  applyLocalChange(updater: (state: T) => T): void {
    const current = this.yMap.toJSON() as T;
    const next = updater(current);
    // 通过 Yjs 的 transact 确保原子性
    this.yMap.doc?.transact(() => {
      this.yMap.set('__state', next as any);
    });
  }
}
```

**桥接原则**：
- **单向数据流优先**：Yjs observe → Zustand set，避免双向绑定的循环更新
- **本地操作走 Yjs**：用户在 TipTap/ReactFlow 中的编辑操作先写入 Yjs，Yjs 同步后触发 Zustand 更新
- **远程操作走 Yjs observe**：其他用户/AI Agent 的变更通过 Yjs 同步，observe 回调更新 Zustand

---

### 7.6 运行时基础设施适配度

**适配等级：⭐⭐⭐⭐ 高度适配**

#### EventBus → 技术选型

**PRD 原始设计**：统一事件总线，用于组件间解耦通信

**推荐实现**：

```typescript
// 轻量 EventBus — 基于 Mitt（~200B）+ Zustand 集成
import mitt from 'mitt';

type EventMap = {
  'capability:executed': { capabilityId: string; result: unknown };
  'agent:message': { agentId: string; event: AGUIEvent };
  'canvas:click': { nodeId: string; position: Point };
  'selection:changed': { type: SelectionType; ids: string[] };
  'crdt:synced': { docId: string; version: number };
};

const eventBus = mitt<EventMap>();

// Zustand 集成：关键事件同步到 Store
eventBus.on('selection:changed', (e) => {
  useAppStore.getState().setSelection({ type: e.type, ids: e.ids });
});
```

**为什么不选 RxJS？**
- 逐梦的事件流是"分发-消费"模式，不需要 RxJS 的复杂操作符链（debounce/throttle 可用 lodash 或自研）
- Mitt 仅 ~200B，RxJS ~30KB，对客户端包体积影响显著
- Zustand 已经承担了状态管理职责，EventBus 仅需轻量级事件分发

**最终建议**：使用 Mitt（~200B）+ Zustand 集成，不引入 RxJS。

#### CapabilityRegistry → 实现方案

**PRD 原始设计**：能力组件注册中心，管理 25 个能力组件的生命周期

**推荐实现**：

```typescript
class CapabilityRegistry {
  private capabilities = new Map<string, ICapability<any, any>>();
  private healthStatus = new Map<string, HealthStatus>();

  register(capability: ICapability<any, any>): void {
    this.capabilities.set(capability.id, capability);
    // 启动健康检查定时器
    this.startHealthCheck(capability);
  }

  async execute(id: string, input: unknown): Promise<unknown> {
    const cap = this.capabilities.get(id);
    if (!cap) throw new Error(`Capability not found: ${id}`);
    if (this.healthStatus.get(id) !== 'healthy') throw new Error(`Capability unhealthy: ${id}`);
    return cap.execute(input);
  }

  // 与 Zustand 集成：注册状态可观察
  toStoreSlice() {
    return {
      capabilities: Array.from(this.capabilities.keys()),
      healthStatus: Object.fromEntries(this.healthStatus),
    };
  }
}
```

**最终建议**：CapabilityRegistry 是纯逻辑层，不依赖特定框架，TypeScript 类实现即可。通过 `toStoreSlice()` 桥接到 Zustand 供 UI 观察。

#### ConfigCenter → 实现方案

**PRD 原始设计**：统一配置中心，管理 AI 模型配置、成本阈值、服务模式等

**推荐实现**：

```typescript
// ConfigCenter — 基于 TanStack Start 环境变量 + 服务端配置
class ConfigCenter {
  private config: Map<string, unknown>;

  static async load(): Promise<ConfigCenter> {
    // 从 Server Function 获取配置
    const serverConfig = await serverFunctions.getConfig();
    return new ConfigCenter(serverConfig);
  }

  get<T>(key: string): T { /* ... */ }
  set(key: string, value: unknown): void { /* 仅允许服务端推送 */ }
}
```

**最终建议**：ConfigCenter 通过 Start Server Function 初始化，运行时配置存储在 Zustand，服务端配置通过 Server Function 获取。

---

### 7.7 后端服务适配度

**适配等级：⭐⭐⭐⭐ 高度适配**

#### 7.7.1 TanStack Start Server Functions vs 5个存储层服务

| 存储层服务 | Start Server Function 实现 | 说明 |
|-----------|--------------------------|------|
| S-01 故事存储 | `createStory`, `getStory`, `updateStory`, `deleteStory` | ✅ 标准 CRUD，Start Server Functions 一等支持 |
| S-02 用户存储 | `getUser`, `updateUser`, `validateAuth` | ✅ 认证逻辑可集成 Clerk/Auth.js |
| S-03 运行时存储 | `saveRuntimeState`, `loadRuntimeState` | ✅ 运行时快照持久化 |
| S-04 资产存储 | `getAssetUrl`（签名 URL 生成） | ✅ 大文件直接上传 S3，Start 仅处理元数据 |
| S-05 反馈数据存储 | `submitFeedback`, `getAnalytics` | ✅ 结构化反馈存储 + 聚合查询 |

**适配优势**：
- Server Functions 与前端路由一体化，类型从数据库到 UI 全链路推断
- 不需要维护独立的后端服务，减少运维复杂度
- Nitro 部署层支持 Serverless / Edge / Node 多运行时

#### 7.7.2 Hono WebSocket 服务 vs Agent 通信 + CRDT 同步

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

```
Hono WebSocket 服务架构：

┌────────────────────────────────────────────────┐
│          Hono 4.x 独立 WebSocket 服务           │
│                                                │
│  ┌──────────────────┐  ┌────────────────────┐ │
│  │  Yjs 同步服务     │  │  AG-UI Agent 服务  │ │
│  │  (y-websocket)   │  │  (事件流路由)       │ │
│  │                  │  │                    │ │
│  │  - Y.Doc 同步    │  │  - 16种事件类型     │ │
│  │  - 感知信息      │  │  - 流式响应         │ │
│  │  - 历史快照      │  │  - INTERRUPT       │ │
│  └──────────────────┘  └────────────────────┘ │
│                                                │
│  共享：鉴权中间件 + 连接管理 + 健康检查          │
└────────────────────────────────────────────────┘
```

**适配优势**：
- Hono 的 `upgradeWebSocket` API 原生支持 WebSocket，无需额外库
- 独立部署，可独立水平扩展（Agent 通信流量与 CRDT 同步流量隔离）
- 与 y-websocket 兼容，CRDT 同步开箱即用

#### 7.7.3 模型路由器 + 成本分层实现

**适配等级：⭐⭐⭐⭐ 高度适配**

**PRD 原始设计**：六层成本分层模型（L1确定性~L6世界模型），模型路由器智能选择

**推荐实现**：
- **模型路由器**：Hono WebSocket 服务内的中间件，根据 `estimateCost()` 和成本阈值选择模型
- **成本分层**：`ConfigCenter` 存储成本阈值，`CapabilityRegistry.estimateCost()` 返回成本预估
- **Drizzle ORM**：成本记录持久化到 PostgreSQL，支持账单和用量分析

**差异与风险**：模型路由器需要后端 AI 基础设施支持（GPU 集群、模型服务），超出前端技术栈范围。

**最终建议**：前端提供 `estimateCost()` 接口和成本分层配置 UI，实际的路由逻辑在后端微服务中实现。

---

### 7.8 部署架构适配度

**适配等级：⭐⭐⭐⭐ 高度适配**

#### 7.8.1 TanStack Start + Nitro vs K8s 部署

**PRD 原始设计**：Docker + Kubernetes + Istio，多区域部署

**推荐技术栈实现**：

```
部署架构：

┌──────────────────────────────────────────────────────┐
│                    Kubernetes 集群                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  TanStack Start 主服务 (Nitro)                 │  │
│  │  - Server Functions / API Routes               │  │
│  │  - SSR (可选)                                   │  │
│  │  - 多副本 + HPA                                 │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Hono WebSocket 服务 (独立 Pod)                │  │
│  │  - Yjs CRDT 同步                               │  │
│  │  - AG-UI Agent 流式通信                         │  │
│  │  - Sticky Session + WebSocket 连接保持          │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  AI 后端微服务 (独立部署)                       │  │
│  │  - 模型路由器                                   │  │
│  │  - GPU 推理集群                                 │  │
│  │  - 异步任务队列                                 │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌─────────────────┐  │
│  │ PG   │  │Redis │  │S3   │  │ 监控             │  │
│  │      │  │      │  │/OSS │  │ Prometheus+Grafana│  │
│  └──────┘  └──────┘  └──────┘  └─────────────────┘  │
│                                                      │
│  Istio Service Mesh (mTLS + 流量管理 + 可观测性)       │
└──────────────────────────────────────────────────────┘
```

**适配优势**：
- **Nitro 部署预设**：Start 基于 Nitro，内置 Docker/Node/Cloudflare Workers 等部署预设，K8s 部署开箱即用
- **Hono 多运行时**：Hono 可在 Node/Bun 上运行，K8s Pod 部署无障碍
- **Istio 兼容**：Start 主服务 + Hono WebSocket 服务均可纳入 Istio Service Mesh

**差异与风险**：
- WebSocket 服务的 K8s 部署需要 Sticky Session 配置（Istio 的 `DestinationRule` 可配置）
- Start 的 SSR 功能在 K8s 中需要健康检查配置

**最终建议**：TanStack Start + Hono + K8s + Istio 的组合完全可行。Nitro 的多部署预设降低了 K8s 配置复杂度。

#### 7.8.2 Hono 独立服务部署方案

**推荐方案**：
1. **Docker 镜像**：Hono 服务打包为独立 Docker 镜像，基于 Bun 运行时
2. **K8s Deployment**：独立 Deployment + Service，配置 Sticky Session
3. **HPA**：基于 WebSocket 连接数自动扩缩容
4. **Istio**：纳入 Service Mesh，mTLS 加密 WebSocket 连接

---

### 7.9 AG-UI 协议集成适配度

**适配等级：⭐⭐⭐⭐ 高度适配**

#### 7.9.1 16种事件类型 → 技术实现

**PRD 原始设计**：AG-UI 协议定义 16 种标准事件类型，不绑定任何框架

**推荐技术栈实现**：

```typescript
// AG-UI 事件类型 → Hono WebSocket 消息映射
type AGUIEventType =
  | 'TEXT_MESSAGE_START'     // Agent 开始生成文本
  | 'TEXT_MESSAGE_CONTENT'   // Agent 文本增量
  | 'TEXT_MESSAGE_END'       // Agent 文本生成完成
  | 'TOOL_CALL_START'        // Agent 调用工具
  | 'TOOL_CALL_ARGS'         // 工具调用参数
  | 'TOOL_CALL_END'          // 工具调用完成
  | 'TOOL_CALL_RESULT'       // 工具调用结果
  | 'STEP_START'             // Agent 推理步骤开始
  | 'STEP_END'               // Agent 推理步骤结束
  | 'STATE_SNAPSHOT'         // Agent 状态快照
  | 'STATE_DELTA'            // Agent 状态增量（JSON Patch）
  | 'INTERRUPT'              // Human-in-the-Loop 中断
  | 'RUN_STARTED'            // Agent 运行开始
  | 'RUN_FINISHED'           // Agent 运行完成
  | 'RUN_ERROR'              // Agent 运行错误
  | 'CUSTOM';                // 自定义事件

// Hono WebSocket 服务端 → 客户端事件流
app.get('/ws/agent', upgradeWebSocket((c) => ({
  onOpen(event, ws) { /* 注册 Agent 连接 */ },
  onMessage(event, ws) {
    const aguiEvent = JSON.parse(event.data) as AGUIEvent;
    // 根据 event.type 分发
    switch (aguiEvent.type) {
      case 'STATE_DELTA':
        // JSON Patch → Zustand Store
        applyPatch(useAppStore, aguiEvent.delta);
        break;
      case 'INTERRUPT':
        // Human-in-the-Loop → 弹出审批 UI
        showApprovalModal(aguiEvent);
        break;
      // ... 其他事件
    }
  },
})));
```

**适配优势**：
- Hono WebSocket 原生支持事件流传输
- `STATE_DELTA` 事件与 Zustand 的 JSON Patch 应用天然匹配
- 事件分发逻辑在客户端，不依赖特定 UI 框架（协议层不绑定 React）

**差异与风险**：
- AG-UI 协议目前主要实现在 CopilotKit 生态中，独立使用需自研客户端 SDK
- `CUSTOM` 事件类型提供了扩展性，但需要在逐梦项目中定义自己的事件语义

#### 7.9.2 声明式 Generative UI → React 实现路径

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

**PRD 原始设计**：推荐声明式模式——Agent 返回 UI 描述，前端自动渲染

**推荐技术栈实现**：

```typescript
// 声明式 Generative UI 实现
// Agent 返回 UI 描述 → React 组件映射
const ComponentRegistry = {
  'suggestion-card': SuggestionCard,      // Shadcn Card + Framer Motion
  'character-preview': CharacterPreview,   // @pixi/react 渲染
  'dialog-choice': DialogChoice,          // Shadcn Button + RadioGroup
  'narrative-branch': NarrativeBranch,    // ReactFlow 自定义节点
  'approval-panel': ApprovalPanel,        // Shadcn Dialog + INTERRUPT
};

// Agent 事件 → UI 渲染
function AgentPanel() {
  const { pendingSuggestions } = useAppStore();

  return (
    <div className="agent-panel">
      {pendingSuggestions.map((suggestion) => {
        const Component = ComponentRegistry[suggestion.uiType];
        return Component ? (
          <Component
            key={suggestion.id}
            data={suggestion.data}
            onAccept={() => acceptSuggestion(suggestion.id)}
            onReject={() => rejectSuggestion(suggestion.id)}
          />
        ) : null;
      })}
    </div>
  );
}
```

**适配优势**：
- React 组件系统天然适配"UI 描述 → 组件渲染"的声明式模式
- Shadcn UI + Radix 提供丰富的可组合原语
- Framer Motion 提供 Generative UI 的入场/退场动画

#### 7.9.3 Human-in-the-Loop INTERRUPT → 技术实现

**适配等级：⭐⭐⭐⭐⭐ 完美适配**

**PRD 原始设计**：通过 INTERRUPT 事件实现 Human-in-the-Loop，Agent 暂停等待创作者审批

**推荐技术栈实现**：

```typescript
// INTERRUPT 事件处理流程
// 1. Hono WebSocket 服务推送 INTERRUPT 事件
// 2. 客户端监听 INTERRUPT，弹出审批 UI
// 3. 创作者选择"批准"或"拒绝"
// 4. 客户端发送对应事件恢复 Agent 执行

function useAGUIInterrupt() {
  const ws = useWebSocket('/ws/agent');
  const [interrupt, setInterrupt] = useState<InterruptEvent | null>(null);

  useEffect(() => {
    ws.onMessage((event) => {
      const aguiEvent = JSON.parse(event.data);
      if (aguiEvent.type === 'INTERRUPT') {
        setInterrupt(aguiEvent);
        // 暂停当前 Agent 的 STATE_DELTA 应用
        useAppStore.getState().pauseAgentPatches();
      }
    });
  }, [ws]);

  const resume = (decision: 'approve' | 'reject') => {
    ws.send(JSON.stringify({ type: 'INTERRUPT_RESPONSE', decision }));
    setInterrupt(null);
    useAppStore.getState().resumeAgentPatches();
  };

  return { interrupt, resume };
}
```

**适配优势**：
- INTERRUPT 事件与 Zustand 的 `pauseAgentPatches` / `resumeAgentPatches` 配合，实现精确的 Agent 暂停/恢复控制
- React 的声明式 UI 天然适配审批模态框的展示/隐藏

**差异与风险**：无。INTERRUPT 事件在推荐技术栈中的实现路径清晰且自然。

---

### 7.10 一致性保障架构适配度

**适配等级：⭐⭐⭐⭐ 高度适配**

#### 7.10.1 身份锚点系统 → 向量数据库选型

**PRD 原始设计**：身份锚点系统确保角色/场景/风格的跨场景一致性

**推荐技术栈实现**：

```typescript
// 身份锚点存储方案
// 方案 A：PostgreSQL + pgvector 扩展（推荐）
// 方案 B：独立向量数据库（Milvus/Qdrant，Phase 2+）

// pgvector 方案 — 与主数据库一体化
import { pgTable, uuid, varchar, jsonb, vector } from 'drizzle-orm/pg-core';

export const identityAnchors = pgTable('identity_anchors', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id),
  type: varchar('type', { length: 50 }).notNull(), // 'character' | 'style' | 'scene'
  embedding: vector('embedding', { dimensions: 1536 }),  // OpenAI ada-002 维度
  metadata: jsonb('metadata').notNull(),  // LoRA config, IPAdapter config
  version: integer('version').notNull().default(1),
});
```

**最终建议**：Phase 1 使用 PostgreSQL + pgvector 扩展（与主库一体化，运维简单），Phase 2+ 评估独立向量数据库（Milvus/Qdrant）。

#### 7.10.2 生成时控制 → 技术集成路径

**PRD 原始设计**：IPAdapter, LoRA, 风格一致性, 提示词模板, RAG 检索

**推荐技术栈实现**：

```typescript
// 生成时控制 — 能力组件封装
class StyleConsistencyCapability implements ICapability<StyleInput, StyleOutput> {
  id = 'style-consistency';
  type = 'ai' as const;

  async execute(input: StyleInput): Promise<StyleOutput> {
    // 1. 从身份锚点检索风格向量
    const anchor = await this.findAnchor(input.characterId);
    // 2. 构建 IPAdapter + LoRA 配置
    const config = this.buildConfig(anchor, input);
    // 3. 调用后端生成服务
    return this.callGenerationService(config);
  }

  async estimateCost(input: StyleInput): Promise<CostEstimate> {
    // 根据成本分层模型计算
    return { level: 'L2', estimatedTokens: 500, costUSD: 0.02 };
  }
}
```

**适配优势**：
- 生成时控制作为 `ICapability` 实现封装，符合 PRD 的能力组件标准接口
- 身份锚点通过 pgvector 检索，与主库一体化

**差异与风险**：IPAdapter/LoRA 的后端推理服务需要 GPU 集群支持，超出前端技术栈范围。

#### 7.10.3 生成后验证 → 自动化流水线

**PRD 原始设计**：CLIP 相似度, LLM 判断, 规则引擎，一致性评分体系

**推荐技术栈实现**：

```typescript
// 生成后验证 — DAG 工作流节点
class ConsistencyValidator implements ICapability<ValidationInput, ConsistencyScore> {
  id = 'consistency-validator';
  type = 'ai' as const;

  async execute(input: ValidationInput): Promise<ConsistencyScore> {
    const scores: ConsistencyScore = {
      characterIdentity: 0,  // CLIP 相似度
      styleConsistency: 0,   // 风格评分
      narrativeCoherence: 0, // LLM 判断
      ruleCompliance: 0,     // 规则引擎
      overall: 0,
    };

    // 并行执行验证
    const [clip, llm, rules] = await Promise.all([
      this.runCLIPValidation(input),
      this.runLLMValidation(input),
      this.runRuleEngine(input),
    ]);

    scores.characterIdentity = clip.score;
    scores.narrativeCoherence = llm.score;
    scores.ruleCompliance = rules.score;
    scores.overall = this.weightedAverage(scores);

    return scores;
  }
}
```

**适配优势**：
- 生成后验证作为 DAG 工作流中的节点，可插入任意位置
- 验证结果通过 `STATE_SNAPSHOT` 事件推送到前端，实时展示一致性评分

**差异与风险**：验证流水线的并行执行需要后端任务调度支持。

**最终建议**：前端提供验证流水线的 DAG 编排 UI + 评分展示，后端实现具体的 CLIP/LLM/规则引擎验证逻辑。

---

### 7.11 适配度总结矩阵

| # | 分析维度 | 适配等级 | 核心差异 | 最终建议 |
|---|---------|---------|---------|---------|
| 1 | 三层解耦架构 | ⭐⭐⭐⭐ | AI 层组件需要后端微服务 | 前端适配器模式 + 后端 AI 微服务 |
| 2 | 核心交互范式 | ⭐⭐⭐⭐⭐ | 无显著差异 | AG-UI 协议 + 自研轻量客户端 |
| 3 | 渲染架构 | ⭐⭐⭐⭐ | PlayCanvas 需自研 React 桥接 | Phase 1: 2D-only, Phase 2: 3D+3DGS |
| 4 | 数据协议 | ⭐⭐⭐⭐⭐ | 无显著差异 | JSONB + Zod + pgvector |
| 5 | CRDT 协同编辑 | ⭐⭐⭐⭐ | ⚠️ PRD 指定 loro，推荐 Yjs | **采用 Yjs**（TipTap 集成是决定性因素） |
| 6 | 运行时基础设施 | ⭐⭐⭐⭐ | 无显著差异 | Mitt + CapabilityRegistry + ConfigCenter |
| 7 | 后端服务 | ⭐⭐⭐⭐ | AI 推理需要后端微服务 | Start Server Functions + Hono WebSocket + AI 微服务 |
| 8 | 部署架构 | ⭐⭐⭐⭐ | WebSocket 服务需 Sticky Session | K8s + Istio + Nitro 多部署预设 |
| 9 | AG-UI 协议集成 | ⭐⭐⭐⭐ | 需自研 AG-UI 客户端 SDK | 协议兼容 + 自研轻量客户端 |
| 10 | 一致性保障架构 | ⭐⭐⭐⭐ | 3DGS 和验证流水线需后端支持 | pgvector + DAG 验证节点 + 后端 AI 服务 |

### 7.12 关键风险与行动建议

| # | 风险项 | 影响等级 | 行动建议 |
|---|-------|---------|---------|
| 1 | **CRDT 选型偏离 PRD**（loro → Yjs） | 🔴 高 | Phase 1 使用 Yjs，Phase 2 评估 loro 成熟度；Yjs↔loro 的文档模型概念等价，迁移成本可控 |
| 2 | **PlayCanvas React 桥接自研** | 🟡 中 | Phase 1 先 2D-only，Phase 2 实现 PlayCanvasBridge；桥接层可复用现有 WebGL+React 集成经验 |
| 3 | **AG-UI 客户端 SDK 自研** | 🟡 中 | 参考 CopilotKit 的 `@copilotkit/runtime` 实现简化版；16 种事件类型定义清晰，自研工作量可控 |
| 4 | **3DGS 渲染技术不成熟** | 🟡 中 | Phase 2+ 渐进式交付，不阻塞 Phase 1；作为独立 ICapability 封装 |
| 5 | **AI 层后端微服务超出前端技术栈** | 🟢 低 | 明确前后端边界：前端负责 ICapability 接口 + UI + 编排，后端负责 AI 推理 + GPU 调度 |

> **结论**：推荐技术栈与 PRD v2.5 的适配度整体为**高度适配（4.4/5.0）**。唯一的重大偏离是 CRDT 选型（loro → Yjs），但基于 TipTap 集成稳定性的考量，Yjs 是更安全的工程选择。其余差异均可通过自研桥接层、渐进式交付策略和明确的前后端边界来消化。**推荐技术栈能够完整承载 PRD v2.5 的核心设计愿景**。

---

## 附录 A：Next.js → TanStack Router API 迁移速查

| Next.js API | TanStack Router API | 说明 |
|-------------|---------------------|------|
| `useRouter()` | `useRouter()` | 路由实例 |
| `usePathname()` | `useRouter().state.location.pathname` | 当前路径 |
| `useSearchParams()` | `useSearch()` | 类型安全搜索参数 |
| `useParams()` | `useParams()` | 类型安全路径参数 |
| `redirect()` | `throw redirect()` | 服务端/Loader 重定向 |
| `<Link href="/foo">` | `<Link to="/foo">` | 类型安全链接 |
| `router.push()` | `router.navigate()` | 编程式导航 |
| `router.back()` | `router.history.back()` | 返回 |
| `next/dynamic(() => import(...))` | 直接 `import` | 无需动态导入 |
| `"use client"` | 无需标注 | 客户端优先 |
| `layout.tsx` | `Route.component` + `Outlet` | 嵌套布局 |
| `page.tsx` | `Route.component` | 页面组件 |
| `loading.tsx` | `Route.pendingComponent` | 加载状态 |
| `error.tsx` | `Route.errorComponent` | 错误状态 |
| `middleware.ts` | `Route.beforeLoad` | 路由守卫 |

## 附录 B：风险评估矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| TanStack Router API 破坏性变更 | 低 | 中 | 锁定 minor 版本，关注 changelog |
| Canvas/WebGL 集成兼容性问题 | 低 | 高 | 阶段 0 预研验证 |
| 团队学习曲线 | 中 | 低 | 内部分享 + 官方文档 + 配对编程 |
| 迁移期间主分支无法合并 | 中 | 中 | 短期 feature freeze 或双分支并行 |
| 后端 API 迁移引入 bug | 中 | 中 | 逐个 API Route 迁移 + 集成测试 |
| TanStack Start API 破坏性变更 | 极低 | 中 | v1 RC API 已锁定，锁定 minor 版本即可 |

---

> **结论**：逐梦AI互动影视游戏平台是一个**客户端重度交互、Canvas/WebGL 渲染、CRDT 协同、Agent 驱动**的创作工具。Next.js 的服务端优先架构与逐梦的实际使用模式存在根本性错配——71% `"use client"` 标注、零 SSR/SSG 使用、Serverless 冷启动对 WebSocket 的阻碍、RSC 边界对 Canvas 集成的困扰。迁移到 TanStack Router + Vite 不仅消除了架构税，还带来了编译时类型安全、极速构建体验、原生 Canvas 友好和部署自由度。**迁移风险可控、收益明确、时机合适**。

---

## 8. AG-UI 与 A2UI 协议选型分析

> **新增日期**：2026-07-11
> **背景**：用户确认 Yjs 替代 loro、Phase 1 不做 PlayCanvas，提出 Agent UI 协议选型需求——为生成的视频资产匹配生成适合的交互 UI。

### 8.1 核心结论：不是二选一，而是上下两层

AG-UI 和 A2UI 解决的是 Agent 协议栈中**不同层级**的问题，高度互补而非竞争：

| 维度 | A2UI (Google) | AG-UI (CopilotKit) |
|------|-------------|-------------------|
| **协议定位** | **内容层 / UI 描述层**（定义"显示什么 UI"） | **传输层 / 数据流转层**（定义"怎么传输和交互"） |
| **核心理念** | Agent 发送声明式 JSON 组件蓝图，客户端用原生组件渲染 | 处理 Agent 与前端之间的双向实时通信和数据流转 |
| **UI 生成方式** | 声明式 JSON（流式 JSONL），白名单组件 Catalog | 不规定 UI 格式，可传输任意 Spec |
| **状态管理** | 仅管理 UI 状态 | **全栈**：共享状态、工具调用、Human-in-the-Loop |
| **安全模型** | 声明式 + 白名单，天然防注入 | 依赖前端实现 + 运行时验证 |
| **LLM 友好度** | 极高（扁平 JSON，易 prompting） | 中等（事件序列） |
| **React 生态** | ❌ 原生渲染器规划中 | ✅ 原生支持 |
| **成熟度** | v0.8-v0.9（2025.12 发布） | v1.x（2025.5 发布，更早约 7 个月） |
| **许可证** | Apache 2.0 | 开源 |

经典比喻：**A2UI 是"装修图纸"（灯泡），AG-UI 是"水电管道+实时监控系统"（电线）**。

### 8.2 逐梦平台的推荐架构：AG-UI + A2UI 叠加

```
┌──────────────────────────────────────────────────────┐
│              逐梦 Agent UI 架构                        │
│                                                      │
│   ┌─────────────────────────────────────────────┐    │
│   │  A2UI 层（内容层——"亮什么灯"）                  │    │
│   │  Agent 生成 JSON 蓝图 → 渲染成选择按钮/信息卡    │    │
│   │  例：场景A生成了 → Agent描述3个分支选项UI         │    │
│   └──────────────────┬──────────────────────────┘    │
│                      │ A2UI JSON 通过 AG-UI 传输      │
│   ┌──────────────────▼──────────────────────────┐    │
│   │  AG-UI 层（传输层——"电怎么通"）                 │    │
│   │  SSE 事件流 + 状态同步 + Human-in-the-Loop     │    │
│   │  例：实时推送 Agent 推理过程 → 用户可打断修正     │    │
│   └──────────────────┬──────────────────────────┘    │
│                      │ WebSocket / SSE               │
│   ┌──────────────────▼──────────────────────────┐    │
│   │  渲染层（定制层——"灯装在哪"）                    │    │
│   │  Pixi.js 画布 + React UI 叠加层                │    │
│   │  例：视频资产在 Pixi 画布播放，A2UI 组件叠加渲染  │    │
│   └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### 8.3 视频资产 → 匹配 UI 的技术缺口与解决方案

**关键缺口**：A2UI 标准组件目录（Button/Text/Image/Video 等）无法直接描述互动影视特有的交互叠加——热点叠加、分支选择面板、时间轴标记等。

**解决方案：自定义 A2UI Catalog + Pixi.js 渲染桥**

| 自定义组件 | 功能 | 渲染方式 |
|-----------|------|---------|
| `HotspotOverlay` | 视频热点叠加层 | Pixi.js 画布定位 |
| `BranchChoicePanel` | 分支选择面板 | React 悬浮层 |
| `CharacterInfoCard` | 角色信息卡片 | React 卡片 |
| `DialogueBubble` | 对话气泡 | Pixi.js + React 混合 |
| `TimelineMarker` | 时间轴标记点 | React 控件 |

Agent 生成视频资产后，通过 A2UI JSON 蓝图使用自定义组件描述交互 UI，前端自定义渲染器识别并分发到 Pixi.js 叠加层或 React 悬浮层。

### 8.4 技术栈更新

| 层次 | 技术 | 说明 |
|------|------|------|
| **Agent 传输层** | AG-UI（16种标准事件 + SSE/WebSocket） | 负责双向实时通信、状态同步、Human-in-the-Loop |
| **Agent UI 描述层** | A2UI（声明式 JSON 蓝图 + 自定义 Catalog） | 负责描述 Agent 生成的 UI 内容 |
| **自定义 Catalog** | HotspotOverlay, BranchChoicePanel 等 | 互动影视行业组件 |
| **渲染桥** | 自定义 A2UI 渲染器 → Pixi.js + React | 标准组件用 React，自定义组件分发到画布叠加层 |

### 8.5 已确认的决策汇总

| 决策项 | 结论 | 依据 |
|--------|------|------|
| CRDT 选型 | **Yjs** 替代 loro | TipTap 集成是决定性因素 |
| PlayCanvas 3D | **Phase 1 不做** | 2D 先行 3D 渐进 |
| Agent UI 协议 | **AG-UI + A2UI 叠加** | 传输层 + 内容层互补 |
| 视频资产 UI 匹配 | **自定义 A2UI Catalog** | 标准组件覆盖不了互动影视需求 |
