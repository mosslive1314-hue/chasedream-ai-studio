# 逐梦AI互动影视游戏平台 — 完整管线落地分析

> 文档版本：v1.0 | 作者：架构师 高见远 | 日期：2025-07-27

---

## 目录

- [第1章：互动影视游戏创作完整管线](#第1章互动影视游戏创作完整管线)
- [第2章：逐梦的核心竞争力 vs 可借力部分](#第2章逐梦的核心竞争力-vs-可借力部分)
- [第3章：从内容到游戏——关键技术路径](#第3章从内容到游戏关键技术路径)
- [第4章：MVP定义](#第4章mvp定义)
- [第5章：实现难度与风险矩阵](#第5章实现难度与风险矩阵)
- [第6章：竞品能力对比与取舍](#第6章竞品能力对比与取舍)

---

## 第1章：互动影视游戏创作完整管线

### 管线总览

从"用户打开平台"到"用户得到一个可玩的互动影视游戏"，完整的创作管线分为 **6 大阶段、18 个步骤**。

### 阶段一：项目初始化与世界构建

| # | 步骤 | 描述 | 用户做什么 | 系统做什么 | 需要的技术 | 技术实现方式 | 实现难度 | 当前实现状态 |
|---|------|------|-----------|-----------|-----------|------------|---------|------------|
| 1 | 创建项目 | 用户输入项目名称、类型、世界观简述 | 填写表单 | 创建项目数据对象，初始化 Zustand store | React Hook Form + Zod 校验 | `useProjectStore.createProject()` 创建项目元数据，触发 `NarrativeStore.loadProjectData()` 初始化空数据 | 🟢 简单 | ✅ `use-project-store.ts` 已实现，`NarrativeStore.loadProjectData()` 已有 |
| 2 | 世界观设定 | 定义世界规则、角色约束、叙事禁忌 | 填写世界规件（category + content 条目） | 存储到 `worldBuilding[]` 和 `worldRules[]`，作为 AI 上下文 | Zustand `addScene`/`addCharacter` + 自定义表单 | `useNarrativeStore.updateWorldRule()` 写入规则，AI 上下文构建时从 `worldRules` 抽取 | 🟢 简单 | ✅ 数据模型完整，UI有壳但缺可视化编辑 |
| 3 | 角色与场景定义 | 创建角色档案（姓名/描述/颜色）和场景卡片 | 填写角色表单、场景表单 | 存储到 `characters[]`、`scenes[]` | Zustand actions | `addCharacter()` / `addScene()` 写入 store，角色数据通过 `DfStoryCharacterV01Schema` 可序列化 | 🟢 简单 | ✅ 数据层完整，UI在 OverviewScreen 有基础表单 |

### 阶段二：大纲与剧本创作

| # | 步骤 | 描述 | 用户做什么 | 系统做什么 | 需要的技术 | 技术实现方式 | 实现难度 | 当前实现状态 |
|---|------|------|-----------|-----------|-----------|------------|---------|------------|
| 4 | AI辅助大纲生成 | 用户输入故事梗概，AI生成章节大纲 | 输入故事概念 → 点击"生成大纲" | 调用 AIService.generateDialogue / completeText，生成 ChapterPlan[] | LLM API 调用 + Story Patch 系统 | `AIService.completeStream()` 流式生成章节 JSON → `StoryPatchProposalSchema` 校验 → `addChapterPlan()` 写入 store | 🟡 中等 | ⚠️ AI服务层完整，但大纲生成prompt未对接，ScriptScreen仅展示数据 |
| 5 | 线性剧本编辑 | 在 TipTap 富文本编辑器中写剧本（场景/对白/选择/条件块） | 在编辑器中输入，使用 /scene /dialog /choice 等斜杠命令 | 实时保存为 ScriptBlock[]，支持 AI 续写 | TipTap 3.x + 自定义 Extension + y-prosemirror | TipTap Editor 初始化 → 注册 SlashCommand Extension → 输入/choice触发自定义NodeView → 保存为ScriptBlock | 🔴 困难 | ❌ 当前仅用 `<textarea>` 编辑，TipTap已安装但未接入，无 SlashCommand |
| 6 | AI续写与对话生成 | 用户在编辑器中请求AI续写或生成对话选项 | 点击"AI续写"按钮 | 调用 AIService.continueScript / generateDialogue，返回结果预览 | LLM 流式输出 + Story Patch 校验 | `AIService.completeStream()` → 显示预览面板 → 用户确认 → `StoryPatchOperationSchema` 校验 → 应用修改 | 🟡 中等 | ⚠️ AI接口完整，但编辑器集成缺失，ScriptAiPanel只是简单textarea |
| 7 | 剧本块→节点图转换 | 将线性剧本块自动转换为StoryNode[] + NodeEdge[] | 点击"生成节点图" | 解析ScriptBlock.type→NodeType映射，自动生成节点和边 | 数据转换逻辑 + 布局算法 | 遍历 scriptBlocks → 按 type 映射为 StoryNode → 相邻块生成 NodeEdge → dagre/elkjs 自动布局 | 🟡 中等 | ❌ 完全缺失，scriptBlocks 和 storyNodes 是两套独立数据 |

### 阶段三：互动叙事设计

| # | 步骤 | 描述 | 用户做什么 | 系统做什么 | 需要的技术 | 技术实现方式 | 实现难度 | 当前实现状态 |
|---|------|------|-----------|-----------|-----------|------------|---------|------------|
| 8 | 分支变量系统设计 | 定义游戏变量（好感度/道德值等）、初始值、变量效果 | 在变量面板中添加/修改变量 | 存储到 `variables[]`，条件引擎可引用 | Zustand + 条件引擎 | `addVariable()` 写入 → `ConditionSchema` 引用 variableId → `evaluateCondition()` 运行时求值 | 🟢 简单 | ✅ 条件引擎完整，NodesVariablesTab有UI，但变量效果预览缺失 |
| 9 | 节点图可视化编辑 | 在 ReactFlow 画布中拖拽节点、连线、编辑节点属性 | 拖拽节点/连线、双击编辑 | 渲染 StoryNode 为 ReactFlow Node，NodeEdge 为 Edge | ReactFlow 12 + 自定义 Node/Edge 组件 | `<ReactFlow>` 渲染 → 自定义 `StoryNodeComponent`（按 NodeType 渲染不同样式） → 拖拽更新 `node.x/y` → 连线创建 `NodeEdge` | 🟡 中等 | ⚠️ NodesCanvasTab 存在但 ReactFlow 未安装（不在 package.json），当前是简化实现 |
| 10 | 条件分支设计 | 为边/选择设置条件表达式和变量效果 | 选中边 → 设置 condition + effects | 条件引擎校验条件可达性 | 条件引擎 + UI表单 | 选中 NodeEdge → 编辑 `condition: Condition` + `effects: VariableEffect[]` → `evaluateCondition()` 实时校验 | 🟡 中等 | ✅ 条件引擎完整，UI有壳但条件编辑器简陋 |
| 11 | 互动点设计 | 定义对话树、限时决策、QTE等互动点 | 在互动设计页面添加互动点 | 存储到 `interactionPoints[]`、`dialogueTrees[]` | Zustand + 交互类型系统 | `updateInteractionPoint()` 写入 → interactionType 分类渲染（exploration/dialogue/decision/confrontation） | 🟡 中等 | ⚠️ InteractionScreen有壳但功能极薄，54行仅渲染Tab容器 |

### 阶段四：资产制作

| # | 步骤 | 描述 | 用户做什么 | 系统做什么 | 需要的技术 | 技术实现方式 | 实现难度 | 当前实现状态 |
|---|------|------|-----------|-----------|-----------|------------|---------|------------|
| 12 | AI图片生成 | 为角色立绘/场景背景/道具生成图片 | 点击"生成"→ 选择风格 → 预览 | 调用 ai-image-service，支持 DALL-E/SD/Mock | OpenAI API / SD WebUI API + 图片队列 | `generateCharacterPortrait()` / `generateSceneBackground()` → `ImageGenQueue` 排队 → 返回 base64/URL → 绑定到 AssetCard | 🟡 中等 | ⚠️ AI图片服务完整（3模式），但资产工坊UI只是mock，无真实生成流程闭环 |
| 13 | 资产绑定与替换 | 将生成的图片绑定到节点/角色/场景 | 选择节点 → 上传/选择图片 → 绑定 | 更新 AssetCard + StoryNode.sceneId/characterId | 文件上传 + Zustand 联动 | `handleBindUploadedImage()` → `upsertAssetCard()` → 关联 nodeId 的 sceneId/characterId → 渲染引擎读取 | 🟢 简单 | ⚠️ 上传绑定有基础实现，但资产生命周期（草稿→审核→发布）缺失 |
| 14 | 演出方向设计 | 为每个节点设置镜头运动/转场/情感曲线 | 在影视分镜中编辑 CinematicDirection | 存储到 cinematicDirections[]，导出时渲染 | Zustand + 分镜UI | `updateCinematicDirection()` → StoryboardShot 增删改 → 导出时转换为引擎指令 | 🟡 中等 | ⚠️ UI有但 storyboard 数据是本地state，不与Zustand联动 |

### 阶段五：预览与测试

| # | 步骤 | 描述 | 用户做什么 | 系统做什么 | 需要的技术 | 技术实现方式 | 实现难度 | 当前实现状态 |
|---|------|------|-----------|-----------|-----------|------------|---------|------------|
| 15 | 实时游戏预览 | 在平台内试玩自己的互动叙事 | 点击"试玩" | 嵌入式运行时加载 playableGraph，模拟完整游戏循环 | 内嵌运行时引擎 + Zustand 数据桥接 | 复用 `h5-player-runtime.ts` 的核心逻辑 → React组件化包装 → 从 narrativeStore 实时读取 nodes/edges/variables → 渲染当前节点+选择 → 应用 VariableEffect | 🔴 困难 | ⚠️ SimulatorPlayTab 有基础文字选择，但无场景背景图/角色立绘渲染，无Pixi.js画布 |
| 16 | 路径可达性测试 | 自动检测死路/孤立节点/不可达结局 | 点击"路径测试" | 图算法遍历所有路径，报告问题 | 图算法 + smoke test | `runStoryRuntimeSmokeTest()` + `validateStoryGraph()` → BFS/DFS 遍历 → 报告死路/断链/不可达节点 | 🟢 简单 | ✅ story-validator完整（6种校验），RuntimeSmokePanel已实现 |

### 阶段六：导出与发布

| # | 步骤 | 描述 | 用户做什么 | 系统做什么 | 需要的技术 | 技术实现方式 | 实现难度 | 当前实现状态 |
|---|------|------|-----------|-----------|-----------|------------|---------|------------|
| 17 | 导出为可玩游戏 | 选择导出格式（H5/RenPy/WebGal/Ink/JSON） | 选择格式 → 点击"导出" | 序列化数据 → 格式转换 → 打包下载 | 导出适配器 + .dfstory协议 | `serializeDfStoryV01()` → 目标适配器转换（如 `renpyAdapter`）→ 生成文件内容 → `downloadDfStory()` 下载 | 🟢 简单 | ✅ 6个导出适配器完整，H5 Player Runtime 150行自包含 |
| 18 | H5独立包发布 | 生成自包含HTML文件，可直接在浏览器运行 | 点击"发布H5" | 创建H5包：校验→序列化→渲染HTML模板→下载 | HTML模板引擎 + 运行时嵌入 | `createH5Package()` → `validateStoryGraph()` → `renderStandalonePlayer()` → 单文件HTML（含CSS+JS+数据） | 🟢 简单 | ✅ 完整实现，含响应式布局+analytics+session追踪 |

### 管线数据流总图

```
用户输入 ──→ [阶段1: 项目初始化]
                │ 产出: ProjectMeta + Characters[] + Scenes[] + WorldRules[]
                ▼
             [阶段2: 剧本创作]
                │ 输入: WorldRules + Characters
                │ 产出: ScriptBlocks[] + ChapterPlans[]
                │ 🔑 关键转换: ScriptBlock[] → StoryNode[] + NodeEdge[]
                ▼
             [阶段3: 互动设计]
                │ 输入: StoryNode[] + NodeEdge[]
                │ 产出: Variables[] + Conditions + InteractionPoints[]
                │ 核心引擎: ConditionEngine.evaluateCondition()
                ▼
             [阶段4: 资产制作]
                │ 输入: StoryNode[] (sceneId/characterId) + AI Prompts
                │ 产出: AssetCards[] + 图片URL/base64
                │ 🔑 关键绑定: Asset → Node → 渲染引擎
                ▼
             [阶段5: 预览测试]
                │ 输入: 完整 NarrativeStoreState
                │ 产出: 验证结果 + 测试报告
                │ 核心循环: render(currentNode) → choose(choice) → applyEffects() → render(nextNode)
                ▼
             [阶段6: 导出发布]
                │ 输入: NarrativeStoreState + ExportOptions
                │ 产出: .dfstory JSON / .rpy / .html / WebGal脚本
                │ 核心序列化: DfStoryV01Schema → 适配器转换
                ▼
             可玩的互动影视游戏 🎮
```

---

## 第2章：逐梦的核心竞争力 vs 可借力部分

### 核心竞争力判定原则

| 判定维度 | 逐梦必须自研 | 可借力外部 | 判断依据 |
|---------|------------|-----------|---------|
| 数据主权 | 叙事数据模型(.dfstory) | — | 格式即壁垒，自定义协议是核心竞争力 |
| 业务逻辑 | 条件引擎、分支求值 | — | 互动叙事的核心逻辑，不可外包 |
| 内容生成 | — | LLM API (OpenAI/Claude/DeepSeek) | AI生成能力是调API，不是壁垒 |
| 视觉渲染 | — | Pixi.js/Canvas2D | 渲染层是工具，不是壁垒 |
| 编辑体验 | TipTap富文本+节点图编辑 | — | 创作流程体验是壁垒 |
| 导出能力 | 导出适配器层 | — | 格式转换是逐梦的价值 |
| 运行时 | 轻量叙事运行时 | — | 必须自建，但可极简 |
| 协同/多人 | — | Yjs生态 | 协同编辑是工具能力，不是核心竞争力 |
| 图片生成 | — | DALL-E/SD API | 图片生成是调API |
| 视频生成 | — | 第三方API (Phase 2) | 视频生成不自建模型 |
| 3D渲染 | — | PlayCanvas/Three.js (Phase 2) | 3D引擎不自建 |

### 详细能力分析

| 能力 | 逐梦必须自研？ | 可借力的方案 | 理由 |
|------|-------------|------------|------|
| **叙事数据模型 (.dfstory)** | ✅ 必须自研 | — | 这是逐梦的核心资产格式。DfStoryV01Schema 已定义 nodes/edges/variables/characters/scenes，Zod校验完整。迁移成本极高，必须自主掌控。 |
| **条件引擎** | ✅ 必须自研 | — | AtomicCondition + CompositeCondition 的递归求值是互动叙事的"大脑"。已实现完整，是核心资产。 |
| **Story Patch 系统** | ✅ 必须自研 | — | AI修改叙事的"安全阀"——所有AI修改必须通过 Zod 校验 + 图验证后才应用。已实现完整。 |
| **剧本编辑器（TipTap集成）** | ✅ 必须自研 | — | 创作体验是壁垒。需要自定义 SlashCommand（/scene, /dialog, /choice, /condition）、自定义 NodeView（选择块内联渲染）、与AI联动。 |
| **节点图编辑器** | ✅ 必须自研 | ReactFlow 12 做渲染层 | ReactFlow 提供画布/拖拽/连线基础能力，但节点样式/条件编辑/变量面板必须自建。 |
| **AI服务层** | ✅ 自研路由层 | LLM API 提供生成能力 | AIService + ModelRouter 是逐梦的AI编排层，必须自研。但底层的文本/图片/视频生成全部借力外部API。 |
| **导出适配器** | ✅ 自研转换逻辑 | — | WebGal/RenPy/Ink/JSON/H5 6个适配器已完整。这是"一次创作，多端发布"的价值。 |
| **内置游戏运行时** | ✅ 自研极简版 | — | H5 Player Runtime 已有150行核心逻辑。需要增强：Pixi.js渲染场景图 + 角色立绘 + 选择UI。 |
| **LLM文本生成** | ❌ 借力 | OpenAI API / Claude API / DeepSeek API | 文本生成是商品化能力，调API即可。AIService 已有 ModelRouter 支持多模型。 |
| **AI图片生成** | ❌ 借力 | DALL-E 3 API / Stable Diffusion API | ai-image-service 已实现三模式（DALL-E/SD/Mock），只需配置API Key。 |
| **富文本编辑** | ❌ 借力框架 | TipTap 3.x（已安装） | TipTap 提供 ProseMirror 封装 + Extension 机制，逐梦在其上建自定义扩展。 |
| **节点图画布** | ❌ 借力框架 | ReactFlow 12（未安装） | ReactFlow 提供画布渲染、拖拽、连线，逐梦自定义节点组件。 |
| **场景渲染** | ❌ 借力框架 | Pixi.js 8（未安装） | 2D渲染用 Pixi.js Sprite/Text 即可，Phase 2 再考虑3D。 |
| **协同编辑** | ❌ 借力框架 | Yjs + y-prosemirror（未安装） | Yjs 是 CRDT 协同编辑的事实标准。MVP 不需要。 |
| **数据持久化** | ❌ 借力框架 | Drizzle ORM + PostgreSQL（已安装） | 已有 drizzle-orm + postgres 依赖。 |
| **UI组件库** | ❌ 借力框架 | Shadcn UI + Radix + TailwindCSS 4 | 已有 shadcn + tailwindcss 4。 |
| **表单验证** | ❌ 借力框架 | React Hook Form + Zod 4 | Zod 已安装（v4.3.6），React Hook Form 未安装。 |
| **视频生成** | ❌ 借力 (Phase 2) | Runway/Pika/Kling API | Phase 1 不做。Phase 2 通过API调用。 |
| **3D渲染** | ❌ 借力 (Phase 2) | PlayCanvas / Three.js | Phase 1 明确不做。 |
| **数字人驱动** | ❌ 借力 (Phase 2+) | HeyGen/D-ID API | 远期规划，通过API集成。 |

### 关键结论

**逐梦的真正壁垒是三件事：**
1. **叙事数据模型**（.dfstory）——从创意到可玩游戏的"中间表示"
2. **创作工作流**（TipTap剧本 → 节点图 → 互动设计 → 预览 → 导出）——端到端的创作体验
3. **AI→叙事的闭环**（Story Patch系统）——AI修改必须经过校验才能应用

**不是壁垒的：图片生成、视频生成、3D渲染、协同编辑**——这些都是商品化能力，调API或用开源框架即可。

---

## 第3章：从内容到游戏——关键技术路径

### 3.1 互动影视游戏的本质

用技术语言来说，互动影视游戏是一个**有状态的有限状态机（FSM）+ 条件求值引擎 + 渲染管线**的组合：

```
┌──────────────────────────────────────────────────────────┐
│                   互动影视游戏运行时本质                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. 叙事图 (StoryGraph)                                   │
│     └─ 有向图 G = (Nodes, Edges)                          │
│     └─ 每个节点 = 一个叙事时刻（场景+对白+选择）             │
│     └─ 每条边 = 玩家选择 / 条件跳转 / 因果关系             │
│                                                          │
│  2. 游戏状态 (GameState)                                  │
│     └─ variables: Record<string, number|boolean|string>   │
│     └─ currentNodeId: string                             │
│     └─ history: { nodeId, choiceIndex, timestamp }[]     │
│                                                          │
│  3. 条件引擎 (ConditionEngine)                            │
│     └─ evaluateCondition(condition, variables) → boolean  │
│     └─ 支持: eq/neq/gt/gte/lt/lte/contains/not_contains │
│     └─ 组合: AND/OR/NOT 递归求值                          │
│                                                          │
│  4. 效果应用 (EffectApplicator)                           │
│     └─ applyEffects(effects, variables) → newVariables   │
│     └─ 支持: set/increment/decrement                     │
│                                                          │
│  5. 渲染管线 (RenderPipeline)                             │
│     └─ 输入: currentNode + gameState                     │
│     └─ 输出: 视觉表现 (场景背景 + 角色立绘 + 对话框 + 选择) │
│                                                          │
│  游戏循环:                                                │
│  render(node) → 用户选择 choice →                         │
│    evaluateCondition(choice.condition) →                  │
│    applyEffects(choice.effects) →                         │
│    transitionTo(choice.targetNodeId) →                    │
│  render(nextNode) → ...                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**核心洞察**：互动影视游戏不需要物理引擎、不需要碰撞检测、不需要实时渲染。它本质上是一个**图遍历 + 条件分支 + 视觉表现**的系统。这比传统游戏引擎简单几个数量级。

### 3.2 是否需要内置游戏引擎？——三种方案对比

#### 方案A：内置轻量运行时（推荐 ✅）

**基于已有的 H5 Player Runtime，增强为平台内嵌预览引擎**

```
当前 H5 Player Runtime（150行）:
  ✅ 条件求值 evalCondition()
  ✅ 变量效果 applyEffects()
  ✅ 选择分支 chooseTransition()
  ✅ session追踪 finishSession()
  ❌ 无场景背景图渲染
  ❌ 无角色立绘渲染
  ❌ 无转场动画
  ❌ 不是React组件，是独立JS字符串
```

**增强方案**：

| 能力 | 实现方式 | 工作量 |
|------|---------|--------|
| React组件化 | 将 runtime 逻辑抽入 `useGameRuntime()` hook，UI 用 React 组件渲染 | 2天 |
| 场景背景图 | `<img>` 或 Pixi.js Sprite 渲染 `node.sceneId → scene.imageUrl` | 1天 |
| 角色立绘 | CSS absolute positioning + `<img>`，参考 Galgame 布局 | 2天 |
| 对话框UI | 模拟视觉小说的底部对话框（角色名 + 文字 + 打字机效果） | 2天 |
| 选择UI | 按钮列表 → 带条件隐藏/显示的选择按钮 | 1天 |
| 简单转场 | CSS transition (fade/slide)，通过 `node.transition` 触发 | 1天 |

**总工作量：约9天**

**优点**：
- 最大化复用已有代码（条件引擎、Story Patch、dfstory 协议）
- 数据流闭环：NarrativeStore → useGameRuntime → 渲染 → 用户操作 → NarrativeStore
- 不依赖外部引擎的格式转换损耗
- 用户在平台内即可预览，体验流畅

**缺点**：
- 运行时能力有限（Phase 1 只支持2D文字+图片+选择）
- 需要自建渲染逻辑

#### 方案B：导出到 WebGal 等已有引擎

**将逐梦数据转换为 WebGal 脚本，在 WebGal 运行时中运行**

```
逐梦数据 → webgalAdapter → WebGal脚本(.txt) → WebGal引擎加载 → 运行
```

**分析**：

| 维度 | 评估 |
|------|------|
| 转换完整性 | webgalAdapter 已实现，但仅生成文本脚本，不生成 WebGal 的资源目录结构 |
| 预览体验 | 需要嵌入完整的 WebGal 编辑器/运行时（约 5MB JS），加载慢 |
| 数据回写 | WebGal运行时的状态无法回写到逐梦的 NarrativeStore |
| 实时预览 | 每次修改都需要重新导出+重新加载WebGal，体验差 |
| 扩展性 | 受限于WebGal的能力边界（条件系统简单，无复杂变量效果） |

**优点**：利用成熟引擎的渲染能力

**缺点**：
- 预览体验差（需要导出→加载→运行，无法实时预览）
- 数据流断裂（WebGal运行时与逐梦创作工具数据不互通）
- 条件系统不匹配（WebGal的条件系统远比逐梦简单）
- **不适合作为平台内预览方案**，只适合作为导出目标

#### 方案C：自建完整叙事引擎

**从零构建一个完整的互动叙事引擎（类 Twine/Ink/Narrascope）**

**分析**：工作量为 3-6 个月，远远超出 MVP 范围。不适合当前阶段。

#### 方案选择结论

**MVP 采用方案A**，理由：
1. 已有 H5 Player Runtime 的核心逻辑（条件求值+变量效果+选择分支），只需增强渲染层
2. 数据流闭环：NarrativeStore ↔ useGameRuntime，修改即所见
3. 导出仍然支持方案B（WebGal/RenPy适配器已完整），但预览用方案A
4. Phase 2 视频播放能力时，在方案A的基础上增加 `<video>` 渲染即可

### 3.3 "资产"如何变成"游戏"——具体技术流程

```
                    ┌─────────────┐
                    │  叙事数据层   │
                    │ NarrativeStore│
                    │              │
                    │ storyNodes[] │ ← 节点 = 游戏中的"一幕"
                    │ nodeEdges[]  │ ← 边   = 游戏中的"跳转"
                    │ variables[]  │ ← 变量 = 游戏中的"状态"
                    │ characters[] │ ← 角色 = 游戏中的"演员"
                    │ scenes[]     │ ← 场景 = 游戏中的"舞台"
                    │ assetCards[] │ ← 资产 = 游戏中的"素材"
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │  运行时引擎  │ │  导出管线   │ │  AI创作层   │
     │            │ │            │ │            │
     │ 从Store    │ │ 从Store    │ │ 从Store    │
     │ 实时读取    │ │ 序列化     │ │ 读取上下文  │
     │            │ │            │ │            │
     │ render()   │ │ dfstory    │ │ AIService  │
     │ choose()   │ │ →适配器    │ │ →Patch     │
     │ evaluate() │ │ →下载      │ │ →校验      │
     └────────────┘ └────────────┘ └────────────┘
```

**具体数据转换流程**：

```
步骤1: 叙事数据就绪
  NarrativeStore 中有完整的:
  - storyNodes: [{id:"N01", type:"scene", dialogue:"月光下...", sceneId:"S01", characterId:"C01"}]
  - nodeEdges: [{from:"N01", to:"N02", choiceIndex:0, effects:[{variableId:"trust", operation:"increment", value:1}]}]
  - variables: [{id:"trust", name:"信任值", initialValue:0}]
  - characters: [{id:"C01", name:"林月", portraitUrl:"..."}]
  - scenes: [{id:"S01", name:"月台", imageUrl:"..."}]
  - assetCards: [{nodeId:"N01", hasImage:true, imageUrl:"data:..."}]

步骤2: 运行时加载
  useGameRuntime() 从 NarrativeStore 读取:
  - currentNodeId = startNode.id
  - runtimeVars = Object.fromEntries(variables.map(v => [v.id, v.initialValue]))
  - nodeMap = new Map(storyNodes.map(n => [n.id, n]))

步骤3: 渲染当前节点
  function renderNode(node, vars) {
    1. 查找场景: scene = scenes.find(s => s.id === node.sceneId)
    2. 渲染背景: <img src={scene.imageUrl} /> (全屏)
    3. 查找角色: char = characters.find(c => c.id === node.characterId)
    4. 渲染立绘: <img src={char.portraitUrl} className="character-sprite" />
    5. 渲染对话框: <DialogBox speaker={char.name} text={node.dialogue} />
    6. 查找可选边: edges.filter(e => e.from === node.id && evaluateCondition(e.condition, vars))
    7. 渲染选择: edges.map(e => <ChoiceButton text={e.label || choice.text} />)
  }

步骤4: 用户选择
  function choose(edge) {
    1. 应用变量效果: edge.effects.forEach(applyEffect) → vars更新
    2. 切换节点: currentNodeId = edge.to
    3. 记录历史: history.push({nodeId, choice, timestamp})
    4. 重新渲染: renderNode(nextNode, updatedVars)
  }

步骤5: 到达结局
  if (node.type === 'ending_good' || node.type === 'ending_bad') {
    渲染结局画面 → 记录session → 可选择重新开始
  }
```

### 3.4 Phase 1（2D文字+图片+选择分支）具体实现路径

```
Phase 1 技术栈:
┌─────────────────────────────────────────┐
│ 前端渲染                                 │
│ ├── React 组件（对话框/选择按钮/变量面板） │ ← 已有基础
│ ├── CSS 定位（角色立绘绝对定位）           │ ← 新增，2天
│ └── Framer Motion（简单转场 fade/slide） │ ← 已安装
│                                         │
│ 运行时引擎                               │
│ ├── useGameRuntime() Hook               │ ← 新增，3天
│ ├── 条件引擎 evaluateCondition()        │ ← 已完整 ✅
│ ├── 变量效果 applyEffects()              │ ← 已完整 ✅
│ └── 历史记录/撤销                        │ ← SimulatorPlayTab有参考
│                                         │
│ 编辑器                                   │
│ ├── TipTap 剧本编辑器                    │ ← 新增，5天
│ ├── ReactFlow 节点图编辑器               │ ← 新增，4天
│ └── 资产绑定面板                         │ ← 增强，2天
│                                         │
│ 导出                                     │
│ ├── H5 独立包                           │ ← 已完整 ✅
│ ├── RenPy 脚本                          │ ← 已完整 ✅
│ └── WebGal 脚本                         │ ← 已完整 ✅
└─────────────────────────────────────────┘
```

**关键实现细节**：

1. **useGameRuntime() Hook 设计**
```typescript
// src/lib/runtime/use-game-runtime.ts
interface GameRuntimeState {
  currentNodeId: string;
  variables: Record<string, number | string | boolean>;
  history: { nodeId: string; choiceIndex: number; timestamp: string }[];
  isEnding: boolean;
  endingType: 'good' | 'bad' | null;
}

function useGameRuntime() {
  const { storyNodes, nodeEdges, variables, characters, scenes } = useNarrativeStore();
  const [state, setState] = useState<GameRuntimeState>(initializeRuntime(storyNodes, variables));

  const currentNode = storyNodes.find(n => n.id === state.currentNodeId);
  const availableChoices = getAvailableChoices(currentNode, nodeEdges, state.variables);
  const scene = scenes.find(s => s.id === currentNode?.sceneId);
  const character = characters.find(c => c.id === currentNode?.characterId);

  const choose = (choiceIndex: number) => {
    const edge = availableChoices[choiceIndex];
    if (!edge) return;
    const newVars = applyEffects(edge.effects, state.variables);
    setState(prev => ({
      ...prev,
      currentNodeId: edge.to,
      variables: newVars,
      history: [...prev.history, { nodeId: prev.currentNodeId, choiceIndex, timestamp: new Date().toISOString() }],
    }));
  };

  const reset = () => setState(initializeRuntime(storyNodes, variables));
  const undo = () => { /* 回退到history最后一个状态 */ };

  return { currentNode, scene, character, availableChoices, state, choose, reset, undo };
}
```

2. **TipTap 自定义 SlashCommand 实现**
```typescript
// src/lib/editor/extensions/slash-command.ts
// 使用 TipTap 的 Extension.create() 机制
// 输入 / 时弹出命令面板
// 支持: /scene → 创建场景块, /dialog → 创建对话块, /choice → 创建选择块
// 每个块对应一个 ScriptBlock，通过 ProseMirror Node Spec 定义
```

3. **剧本块→节点图自动转换**
```typescript
// src/lib/transform/script-to-graph.ts
function scriptBlocksToStoryNodes(blocks: ScriptBlock[]): { nodes: StoryNode[], edges: NodeEdge[] } {
  const nodes: StoryNode[] = [];
  const edges: NodeEdge[] = [];

  blocks.forEach((block, i) => {
    const nodeType = blockTypeToNodeType(block.type); // scene→scene, dialog→scene, choice→choice
    nodes.push({ id: block.id, label: block.label, type: nodeType, dialogue: block.content, ... });

    if (block.type === 'choice' && block.options) {
      // 选择块 → 多条边
      block.options.forEach((opt, j) => {
        edges.push({ from: block.id, to: blocks[i+1+j]?.id ?? `placeholder-${j}`, choiceIndex: j, label: opt });
      });
    } else if (i < blocks.length - 1) {
      // 非选择块 → 直接连到下一个
      edges.push({ from: block.id, to: blocks[i+1].id, edgeType: 'causal' });
    }
  });

  return { nodes, edges };
}
```

### 3.5 Phase 2（视频+3D+动态UI）技术演进路径

| 能力 | Phase 1 | Phase 2 演进 | 关键技术变更 |
|------|---------|-------------|------------|
| 场景渲染 | `<img>` 背景图 | `<video>` 背景视频 | 替换 `<img>` 为 `<video>`，视频源来自 AI 视频生成 API |
| 角色渲染 | `<img>` 立绘 | Pixi.js Spine 动画 / Live2D | 引入 Pixi.js，渲染 Spine/Live2D 模型 |
| 3D场景 | 不支持 | PlayCanvas 渲染 | 引入 PlayCanvas iframe，通过 postMessage 通信 |
| 数字人 | 不支持 | HeyGen/D-ID API 集成 | 调用数字人 API，返回视频流 |
| 动态UI | CSS 静态布局 | Framer Motion 动态布局 | 增加 motion 组件的 layout 动画 |
| 音频 | 不支持 | Howler.js 音频引擎 | BGM + SE 播放，支持 `node.bgm` 和 `node.voiceFile` |

**Phase 2 演进关键**：运行时引擎的接口不变（`render → choose → applyEffects → render`），只替换渲染层实现。这是方案A的核心优势——业务逻辑与渲染解耦。

---

## 第4章：MVP定义

### 4.1 MVP核心价值主张

> **"从创意到可玩游戏，最快30分钟"**

用户应该能：打开平台 → 输入故事概念 → AI辅助生成剧本 → 在节点图中设计分支 → 绑定AI生成的图片 → 预览试玩 → 导出为H5可玩游戏。

### 4.2 MVP功能范围

#### ✅ 做（核心路径）

| 功能 | 说明 | 验证的价值 |
|------|------|-----------|
| 项目创建 + 世界观设定 | 简单表单创建项目，定义角色和场景 | 创作流程起点 |
| AI辅助剧本生成 | 输入概念 → AI生成章节大纲 → 生成剧本块 | AI原生创作体验 |
| TipTap剧本编辑器 | 富文本编辑 + /scene /dialog /choice 斜杠命令 | 核心创作工具 |
| 剧本→节点图转换 | 一键将线性剧本转为节点图 | 线性→互动的关键转换 |
| ReactFlow节点图编辑 | 拖拽编辑节点/连线，设置条件和变量效果 | 可视化互动设计 |
| AI图片生成 | 为角色/场景生成图片（DALL-E/SD/Mock） | 资产生成能力 |
| 资产绑定 | 将图片绑定到节点 | 资产→游戏的桥梁 |
| 内置游戏预览 | 试玩自己的互动叙事，完整的游戏循环 | 最核心的验证 |
| H5导出 | 导出为自包含HTML文件 | 可分享/部署的可玩游戏 |

#### ❌ 不做（MVP外）

| 功能 | 理由 |
|------|------|
| CRDT协同编辑 | 单人创作足够，多人协同是增量价值 |
| 视频生成/3D渲染 | Phase 2 内容，MVP用图片+文字足够验证 |
| 数字人/NPC灵魂引擎 | 研发级工作，不验证核心价值 |
| QTE/限时决策 | 互动类型复杂，基础选择分支已够验证 |
| 多人在线发布 | 先做离线H5包，在线发布需要后端服务 |
| 版本管理 | 用 localStorage 暂存，不做 git-like 版本系统 |
| 自定义UI模板 | 用默认 Galgame 风格，不做UI定制 |
| AG-UI Agent画布闭环 | 事件类型已定义，但不做Agent→Canvas的运行时闭环 |
| 音频生成/播放 | MVP专注文字+图片，音频是增量 |

### 4.3 MVP技术架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        逐梦 MVP 架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React 前端 (Next.js)                   │   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│  │  │ 剧本编辑  │  │ 节点图    │  │ 资产工坊  │  │游戏预览 │  │   │
│  │  │ TipTap   │  │ReactFlow │  │ AI图片   │  │Runtime │  │   │
│  │  │ +AI续写  │  │ +条件编辑 │  │ +绑定    │  │+导出   │  │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │   │
│  │       │              │              │             │       │   │
│  │       ▼              ▼              ▼             ▼       │   │
│  │  ┌───────────────────────────────────────────────────┐   │   │
│  │  │              NarrativeStore (Zustand)              │   │   │
│  │  │  storyNodes · nodeEdges · variables · characters   │   │   │
│  │  │  scenes · scriptBlocks · assetCards · chapterPlans │   │   │
│  │  └───────────────────────┬───────────────────────────┘   │   │
│  │                          │                               │   │
│  │  ┌───────────────────────┼───────────────────────────┐   │   │
│  │  │              核心服务层                             │   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │   │
│  │  │  │Condition │ │StoryPatch│ │.dfstory │           │   │   │
│  │  │  │Engine   │ │Validator │ │Protocol │           │   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘           │   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │   │
│  │  │  │Story     │ │AI Image  │ │Export    │           │   │   │
│  │  │  │Validator │ │Service   │ │Adapters  │           │   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘           │   │   │
│  │  └───────────────────────────────────────────────────┘   │   │
│  │                          │                               │   │
│  │  ┌───────────────────────┼───────────────────────────┐   │   │
│  │  │              AI服务层                               │   │   │
│  │  │  AIService → ModelRouter → OpenAI/Claude/DeepSeek │   │   │
│  │  │  → 流式输出 → StoryPatch校验 → 应用修改             │   │   │
│  │  └───────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              持久化层 (Phase 1: localStorage)             │   │
│  │  Zustand → IndexedDB (idb-keyval) → .dfstory JSON      │   │
│  │  Phase 2: Drizzle ORM + PostgreSQL                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 MVP实现步骤（每步1-3天）

| 天数 | 步骤 | 创建/修改的文件 | 具体实现 |
|------|------|---------------|---------|
| **Day 1-2** | **1. 安装缺失依赖 + 项目基础修复** | `package.json` | `bun add @xyflow/react tiptap @tiptap/react @tiptap/starter-kit @tiptap/pm @tiptap/extension-placeholder @tiptap/extension-slash-command react-hook-form` |
| **Day 3-5** | **2. TipTap剧本编辑器** | `src/lib/editor/create-editor.ts`（TipTap Editor 配置）、`src/lib/editor/extensions/slash-command.ts`（自定义斜杠命令）、`src/lib/editor/extensions/choice-block.ts`（选择块NodeView）、`src/components/script/script-tip-tap-editor.tsx`（替换ScriptBlockEditor）、`src/lib/transform/script-to-graph.ts`（剧本→节点图转换） | TipTap Editor 初始化 → 注册 /scene /dialog /choice 命令 → choice 块渲染为自定义 NodeView → 编辑内容实时同步到 scriptBlocks → 一键"生成节点图"调用 scriptBlocksToStoryNodes() |
| **Day 6-8** | **3. ReactFlow节点图编辑器** | `src/components/nodes/story-node-component.tsx`（自定义节点渲染）、`src/components/nodes/story-edge-component.tsx`（自定义边渲染+条件标签）、`src/components/nodes/nodes-canvas-tab.tsx`（替换当前实现）、`src/components/nodes/node-detail-panel.tsx`（节点属性编辑面板）、`src/components/nodes/edge-condition-editor.tsx`（条件+效果编辑器） | `<ReactFlow>` 初始化 → 自定义 StoryNodeComponent（按 type 渲染不同颜色/图标）→ 拖拽更新 x/y → 连线创建 NodeEdge → 双击节点打开编辑面板 → 条件编辑器调用 ConditionEngine 实时校验 |
| **Day 9-10** | **4. AI图片生成闭环** | `src/components/assets/image-gen-panel.tsx`（图片生成面板）、`src/components/assets/asset-bind-panel.tsx`（资产绑定面板）、`src/lib/ai/ai-image-queue.ts`（增强队列，支持状态回调） | 用户选择节点 → "生成场景图" → `generateSceneBackground()` → 等待/轮询 → 预览 → 确认绑定 → `upsertAssetCard()` + 更新 `scene.imageUrl` |
| **Day 11-13** | **5. 内置游戏预览引擎** | `src/lib/runtime/use-game-runtime.ts`（核心运行时 Hook）、`src/lib/runtime/game-renderer.tsx`（渲染层：场景+角色+对话框+选择）、`src/components/simulator/simulator-game-tab.tsx`（替换SimulatorPlayTab）、`src/lib/runtime/runtime-serializer.ts`（从 NarrativeStore 提取运行时数据） | `useGameRuntime()` 从 NarrativeStore 读取 → `renderNode()` 渲染当前节点（场景背景+角色立绘+对话框+选择按钮）→ 用户点击选择 → `choose()` 应用效果+跳转 → 到达结局时记录session → 支持撤销/重置 |
| **Day 14-15** | **6. AI剧本生成集成** | `src/lib/ai/ai-story-generator.ts`（大纲→剧本生成流程）、`src/components/script/ai-story-gen-panel.tsx`（AI生成面板UI）、`src/lib/ai/ai-prompts.ts`（增强outline/script生成prompt） | 用户输入故事梗概 → AI生成 ChapterPlan[] → 用户确认 → AI逐章生成 ScriptBlock[] → StoryPatch 校验 → 写入 NarrativeStore → 自动转换为节点图 |
| **Day 16-17** | **7. 端到端联调 + 示例数据** | `src/lib/demo/demo-story.ts`（示例故事数据）、`src/components/screens/PipelineScreen.tsx`（管线状态面板增强） | 预置一个完整示例故事（3章、5个结局、8个变量）→ 从头到尾走通：创建→编辑→设计→资产→预览→导出 → 修复bug |
| **Day 18-20** | **8. 导出增强 + 打磨** | `src/lib/export/h5-player-template.ts`（增加场景图/角色立绘嵌入）、`src/lib/export/h5-player-style.ts`（增强CSS：对话框样式+选择按钮样式）、`src/components/screens/PublishScreen.tsx`（导出/发布页面增强） | H5 导出包支持场景图+角色立绘（base64内嵌）→ 对话框样式优化（Galgame风格）→ 导出流程UI优化 → 最终demo录制 |

### 4.5 关键数据流——从创意到可玩游戏的完整数据流

```
用户输入故事概念: "一个赛博朋克世界的侦探故事，主角需要在正义和生存之间抉择"
                    │
                    ▼
        ┌─────── AI生成大纲 ────────┐
        │  AIService.complete()      │
        │  systemPrompt: outline-gen  │
        │  输出: ChapterPlan[]        │
        │  [                         │
        │    {title:"霓虹雨夜",       │
        │     events:[...],          │
        │     emotionArc:"紧张→舒缓"} │
        │  ]                         │
        └──────────┬────────────────┘
                   │ 用户确认大纲
                   ▼
        ┌─────── AI生成剧本 ────────┐
        │  AIService.completeStream()│
        │  逐章生成 ScriptBlock[]    │
        │  [                         │
        │    {type:"scene",          │
        │     content:"雨夜..."},    │
        │    {type:"dialog",         │
        │     char:"林月",           │
        │     content:"你不该来这"},  │
        │    {type:"choice",         │
        │     options:["相信她",      │
        │              "保持警惕"]}  │
        │  ]                         │
        └──────────┬────────────────┘
                   │ StoryPatch校验
                   ▼
        ┌──── 剧本→节点图转换 ────┐
        │  scriptBlocksToStoryNodes()│
        │  ScriptBlock → StoryNode   │
        │  scene → type:"scene"     │
        │  dialog → type:"scene"    │
        │  choice → type:"choice"   │
        │  + NodeEdge[] 自动生成    │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──── 节点图编辑+互动设计 ────┐
        │  用户在ReactFlow中:         │
        │  - 拖拽调整布局             │
        │  - 添加条件分支             │
        │  - 设置变量效果             │
        │  - 添加新结局               │
        │  NarrativeStore 实时更新    │
        └──────────┬─────────────────┘
                   │
                   ▼
        ┌──── AI图片生成 ──────────┐
        │  遍历 scenes[]:           │
        │    generateSceneBackground()│
        │    → scene.imageUrl = ... │
        │  遍历 characters[]:        │
        │    generateCharacterPortrait()│
        │    → character.portraitUrl│
        │  资产绑定: AssetCard[]    │
        └──────────┬────────────────┘
                   │
                   ▼
        ┌──── 游戏预览 ────────────┐
        │  useGameRuntime()         │
        │  初始化:                   │
        │    currentNodeId = "N01"  │
        │    vars = {trust:0, ...}  │
        │                            │
        │  渲染循环:                 │
        │  render(N01):             │
        │    scene = 月台(雨夜图)   │
        │    char = 林月(立绘)      │
        │    dialog = "你不该来这"   │
        │    choices = [             │
        │      "相信她"→N02(+trust) │
        │      "保持警惕"→N03       │
        │    ]                       │
        │                            │
        │  choose("相信她"):        │
        │    vars.trust += 1        │
        │    → render(N02)          │
        └──────────┬────────────────┘
                   │ 用户满意
                   ▼
        ┌──── H5导出 ────────────┐
        │  createH5Package()       │
        │  1. validateStoryGraph() │
        │  2. serializeDfStoryV01()│
        │  3. renderStandalonePlayer()│
        │  → 单文件HTML           │
        │  (含场景图+角色立绘+CSS │
        │   +JS运行时+数据)       │
        └──────────┬──────────────┘
                   │
                   ▼
           🎮 可玩的互动游戏!
        浏览器打开即可游玩
        可分享给朋友体验
```

### 4.6 可演示的场景

**MVP Demo 脚本：**

> **场景：产品负责人给投资人演示**

1. **"打开逐梦"** → 进入欢迎页面，点击"创建新项目"
2. **"输入故事概念"** → 在输入框中输入："一个赛博朋克世界的侦探故事，主角需要在正义和生存之间抉择"
3. **"AI生成大纲"** → 点击"生成大纲"，3秒后显示3个章节的大纲卡片，每个章节有标题、事件、情感弧线
4. **"AI生成剧本"** → 点击"逐章生成"，流式输出第1章剧本。剧本中包含场景描述、角色对话、选择分支
5. **"编辑剧本"** → 在TipTap编辑器中，输入 `/choice` 弹出斜杠命令，创建一个新的选择块
6. **"生成节点图"** → 点击"转换为节点图"，左侧线性剧本自动转为右侧ReactFlow节点图，选择节点有分叉
7. **"编辑分支条件"** → 在节点图中选中一条边，设置条件"信任值 > 5"，设置效果"道德值 +1"
8. **"生成图片"** → 点击"资产工坊"，为"月台雨夜"场景生成背景图，为"林月"角色生成立绘
9. **"预览试玩"** → 点击"试玩"，进入游戏模式。看到雨夜场景背景，林月立绘，对话框显示"你不该来这里"。点击"相信她"，信任值+1，进入下一幕
10. **"导出H5"** → 点击"导出"，下载一个HTML文件。打开后即可在浏览器中完整游玩

---

## 第5章：实现难度与风险矩阵

### MVP功能模块评估

| 模块 | 难度 | 风险 | 依赖 | 工作量(人天) | 备注 |
|------|------|------|------|------------|------|
| **TipTap剧本编辑器** | 🔴 困难 | 中 | TipTap依赖安装 + 自定义Extension开发 | 5 | TipTap的SlashCommand和自定义NodeView是主要难点。TipTap 3.x的Extension API有breaking change，需要预研验证 |
| **剧本→节点图转换** | 🟡 中等 | 低 | ScriptBlock → StoryNode 的类型映射 | 2 | 核心逻辑简单，但choice→多条边的映射需要仔细处理。自动布局需要引入dagre/elkjs |
| **ReactFlow节点图编辑器** | 🟡 中等 | 低 | @xyflow/react安装 | 4 | ReactFlow API成熟，主要工作在自定义节点组件和条件编辑UI |
| **AI图片生成闭环** | 🟡 中等 | 中 | DALL-E/SD API Key + 跨域问题 | 3 | API调用本身简单，但生成等待时间UX、错误重试、跨域图片base64转换需要注意 |
| **内置游戏预览引擎** | 🔴 困难 | 中 | useGameRuntime Hook + 渲染层 | 5 | 核心逻辑已有（条件引擎+变量效果），但渲染层的Galgame风格UI需要打磨。角色立绘的布局/缩放/多角色同屏是难点 |
| **AI剧本生成集成** | 🟡 中等 | 中 | Prompt工程质量 | 3 | 关键风险：生成的剧本格式不稳定，需要多次迭代prompt。建议先硬编码1-2个示例的few-shot |
| **项目基础修复+依赖安装** | 🟢 简单 | 低 | — | 2 | 安装ReactFlow、TipTap扩展、react-hook-form |
| **导出增强** | 🟢 简单 | 低 | 已有完整导出适配器 | 2 | H5导出增加图片嵌入，样式优化 |
| **端到端联调** | 🟡 中等 | 中 | 所有模块完成 | 3 | 数据在模块间流转的edge case处理 |

### 风险详细分析

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| TipTap 3.x Extension API breaking change | 中 | 高 | 先用 TipTap Starter Kit 验证基本功能，SlashCommand 用 `@tiptap/suggestion` 而非社区插件 |
| AI生成的剧本格式不一致 | 高 | 中 | 使用 few-shot prompt + Zod 后校验 + 结构化输出（JSON mode） |
| ReactFlow 与 Next.js 的 SSR 冲突 | 中 | 低 | 使用 `'use client'` + `dynamic(() => import(...), { ssr: false })` |
| 图片生成API延迟导致UX差 | 高 | 低 | 实现队列+进度条+Mock模式兜底 |
| NarrativeStore 数据量过大导致性能问题 | 低 | 中 | 使用 Zustand selector 精确订阅，避免不必要渲染 |
| 剧本→节点图转换丢失信息 | 中 | 中 | 转换后保留原始 ScriptBlock 引用，支持双向同步 |

### 技术预研项（MVP启动前需验证）

| 预研项 | 验证方式 | 预计时间 |
|--------|---------|---------|
| TipTap 3.x SlashCommand Extension 是否可用 | 创建最小 TipTap + SlashCommand demo | 0.5天 |
| ReactFlow 12 + Next.js 16 SSR 兼容性 | 创建最小 ReactFlow + Next.js demo | 0.5天 |
| DALL-E API 跨域调用方式 | 测试 `fetch('/api/proxy')` → OpenAI API | 0.5天 |
| TipTap 自定义 NodeView 渲染 choice 块 | 在 ProseMirror schema 中定义 choice node | 1天 |

---

## 第6章：竞品能力对比与取舍

### 竞品定位对比

| 能力 | LibliTV | Tapnow | 逐梦MVP | 取舍理由 |
|------|---------|--------|---------|---------|
| **核心定位** | AI视频生成平台 | AI短视频制作 | AI互动叙事创作+导出 | 逐梦做"可玩的互动游戏"，不是"可看的视频" |
| **AI文本生成** | 剧本/文案生成 | 文案/脚本生成 | 剧本+大纲+对话+分支生成 | 三家都有，逐梦侧重"互动叙事结构"而非"线性文案" |
| **AI图片生成** | 有（风格统一） | 有（封面图） | 有（角色立绘+场景+道具） | 逐梦的图片生成服务于"游戏资产"，非"视频素材" |
| **AI视频生成** | ✅ 核心能力 | ✅ 核心能力 | ❌ Phase 2 通过API | **关键取舍**：逐梦不做视频生成平台。视频生成是重度GPU+大模型，1人团队无法承担。Phase 2通过API借力 |
| **互动分支** | ❌ 无 | ❌ 无 | ✅ 核心能力 | **逐梦唯一差异化**：LibliTV/Tapnow都是线性视频输出，逐梦输出的是"有分支的可玩游戏" |
| **条件/变量系统** | ❌ 无 | ❌ 无 | ✅ 条件引擎+变量效果 | 互动叙事的基础设施，竞品完全没有 |
| **节点图编辑** | ❌ 无 | ❌ 无 | ✅ ReactFlow可视化 | 分支叙事的直观表达方式 |
| **导出为可玩游戏** | ❌ 导出视频 | ❌ 导出视频 | ✅ H5/RenPy/WebGal/Ink | 逐梦导出的是"游戏"，不是"视频" |
| **实时预览** | 实时视频预览 | 实时视频预览 | 互动游戏预览 | 预览的本质不同：逐梦预览的是"游戏循环" |
| **3D/数字人** | ❌ | 部分 | ❌ Phase 2+ | 逐梦不与竞品在视频/3D上竞争，在互动叙事上建立壁垒 |
| **开发团队规模** | 20+ 人 | 10+ 人 | 1人 (MVP) | 逐梦必须极度聚焦，不做任何"有了更好"但"不是必须"的功能 |

### 关键取舍原则

```
逐梦的核心取舍逻辑:

LibliTV/Tapnow 的价值链:
  创意 → AI文案 → AI视频 → 线性视频成品
                    ↑
               核心壁垒在这里（重资产：GPU集群+视频模型）

逐梦的价值链:
  创意 → AI大纲 → 互动剧本 → 节点图+分支 → 预览 → 可玩游戏
                    ↑                    ↑
               文本生成(调API)    核心壁垒在这里（互动叙事数据模型+创作工作流）

关键洞察:
  - AI文本生成是商品化能力（调API），不是壁垒
  - AI视频生成是重资产能力（需要GPU+模型），1人团队做不了
  - 互动叙事设计能力（数据模型+条件引擎+创作流程+导出）是轻资产+高壁垒
  - 逐梦应该把所有精力放在"互动叙事设计"这个唯一差异化上
```

### MVP聚焦确认

逐梦 MVP 的成功标准是：

> **一个没有编程能力的创作者，能在30分钟内，从零创作出一个有3个分支、2个结局、带AI生成图片的互动叙事游戏，并导出为可分享的H5文件。**

这个标准：
- ✅ 验证了"AI辅助创作"的价值（AI生成大纲+剧本+图片）
- ✅ 验证了"互动叙事设计"的价值（条件分支+变量效果+节点图）
- ✅ 验证了"导出可玩游戏"的价值（H5独立包）
- ❌ 不验证"视频生成"（Phase 2）
- ❌ 不验证"3D渲染"（Phase 2）
- ❌ 不验证"多人协同"（Phase 2+）

---

## 附录：当前代码库实际技术栈 vs PRD规划技术栈

| 层次 | PRD规划 | 实际安装 (package.json) | 差距 |
|------|---------|----------------------|------|
| 全栈框架 | TanStack Start v1 RC | **Next.js 16.2.4** | ❌ 未迁移，当前应继续用Next.js |
| 路由 | @tanstack/react-router | **Next.js App Router** | ❌ 未迁移 |
| 构建 | Vite 6.x | **Next.js Build** | ❌ 未迁移 |
| 数据获取 | @tanstack/react-query 5.x | ❌ 未安装 | — |
| 状态管理 | Zustand 5.x | ✅ zustand@5.0.14 | 匹配 |
| 富文本 | TipTap 3.x + y-prosemirror | ✅ @tiptap/react@3.25（已安装但未集成）| ⚠️ y-prosemirror未安装 |
| 画布渲染 | Pixi.js 8 + @pixi/react | ❌ 未安装 | — |
| 节点图 | ReactFlow 12.x | ❌ 未安装 | — |
| UI | Shadcn UI + Radix + TailwindCSS 4 | ✅ shadcn + tailwindcss@4 | 匹配 |
| 协同编辑 | Yjs + y-prosemirror | ❌ 未安装 | — |
| 后端API | TanStack Start Server Functions | **Next.js API Routes** | ❌ 未迁移 |
| WebSocket | Hono 4.x | ❌ 未安装 | — |
| 动画 | Framer Motion 12.x | ✅ framer-motion@12.38 | 匹配 |
| 表单 | React Hook Form + Zod 4.x | ⚠️ Zod@4已安装，React Hook Form未安装 | — |
| ORM | Drizzle ORM | ✅ drizzle-orm@0.45 | 匹配 |
| Agent传输 | AG-UI + A2UI | ⚠️ 类型定义有，运行时无 | — |
| CRDT | Yjs | ❌ 未安装 | — |
| 3D | Phase 1不做 | — | — |

**关键结论**：当前代码库运行在 Next.js 16 上，未迁移到 TanStack Start。MVP 阶段应继续使用 Next.js，避免迁移风险。ReactFlow、Pixi.js 需要在 MVP 开发中安装。

---

> 文档结束。本文档基于 2025-07-27 的代码库扫描结果编写。所有技术方案和评估均基于实际代码分析，非假设性推演。
