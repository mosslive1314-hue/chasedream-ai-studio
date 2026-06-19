# Studio UI 工作流重组与后端补全计划

> 依据：22 tab 后端支持审计报告 + 用户反馈（阶段+对话双驱动为主，融合 8 阶段与精简 flat tab 优点）
> 执行顺序：Phase 1（后端补全）→ Phase 2（前端完整性）→ Phase 3（UI 工作流重组）

***

## 一、现状分析（基于审计报告）

### 1.1 22 个 Tab 的后端支持分布

| 完整度                       | Tab 数量 | 具体列表                                                                                                    |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| **完整**（CRUD + 真实数据流）      | 9      | preview, script, story, graph, characters, relationships, moral, interaction, health, publish, my-works |
| **部分**（缺 CRUD 或用 seed 数据） | 9      | pipeline, props, scenes, cinematic, versions, industry-assets, pipeline-viz, workflow, collab           |
| **仅展示**（硬编码/mock/只读）      | 2      | timeline（只读）, assets（硬编码 SEED\_ASSETS）                                                                  |

### 1.2 五大问题

1. **管线状态三重分裂**：`pipeline` / `pipeline-viz` / `workflow` 三个 tab 用三套数据源（narrative.pipelineStages seed / narrative.pipelineStages seed / pipeline store），互不联动
2. **世界构建六重重复**：`story` 的"角色与世界"子 tab 几乎覆盖 `characters` / `props` / `scenes` / `relationships` / `moral` 五个原生视图
3. **违反"禁止 mock"铁律**：`assets`（SEED\_ASSETS 14 个 mock）、`versions`（MOCK\_SNAPSHOTS 等）、`pipeline`（硬编码 STEPS 状态）、`pipeline-viz`（seed stageProgress）、`collab`（硬编码 PERMISSION\_LEVELS）
4. **5 个领域无 AI 工具支持**：版本控制、资产管理、发布、协作、作品管理 — Agent 无法通过工具操作这些领域
5. **数据分裂**：道德系统（useMoralStore vs narrative.moralAxes）、管线状态（usePipelineStore vs narrative.pipelineStages）两套数据不互通

### 1.3 已有的工作流基础

`usePipelineStore` 已定义 8 阶段管线 + 锁定机制：

* **8 阶段**：entry → narrative → interaction → cinematic → asset → qa → preview → release

* **每阶段**：expertId（对应 Expert Agent）、instructions（Agent 指令）、expectedOutputs（完成度判断）

* **锁定机制**：stageStatuses（pending/active/complete）、advance()、isStageComplete()

* **chat-panel 已集成**：同步 narrative store → pipeline context、阶段完成检测、自动推进提示

**关键**：管线基础已存在，但 UI 未围绕它组织 — 22 个 tab 是平铺的，与管线阶段无映射关系。

***

## 二、目标 UI 模型（综合方案）

### 2.1 核心理念：阶段+对话双驱动

融合三种模型的优点：

* **8 阶段驱动的强引导**：用户始终知道当前在哪一步、下一步是什么

* **阶段+对话双驱动的自然性**：画布随对话推进自动切换，用户也可手动切换当前阶段内的视图

* **精简 flat tab 的灵活性**：管理类功能（作品/协作）不挤占管线 tab

### 2.2 布局设计

> **重要**：当前 Studio 布局只有两列（对话区 + 画布区），**没有右侧上下文面板**。
> AGENTS.md 中提到的"右上下文(280px)"是规划中的设计，实际代码未实现。
> 本计划保持两列布局，不新增第三列面板，符合项目规则"不要折叠面板遮挡内容"。

```
┌─────────────────────────────────────────────────────────┐
│ 顶部工具栏：项目名 | 管线进度条(8步) | 设置/导出/作品/协作 │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  对话区      │    画布区                                │
│  (左侧 42%)  │    (右侧 flex-1，自动随阶段切换)          │
│  可拖拽调宽   │                                          │
│              │  当前阶段的视图：                         │
│  - 阶段摘要  │  · 阶段内子视图切换                       │
│    (顶部折叠)│    (最多 3-4 个子 tab)                   │
│  - Agent对话 │                                          │
│  - 工具调用  │                                          │
│    可视化    │                                          │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│ 管理入口（工具栏图标，非管线 tab）：作品 | 协作          │
└─────────────────────────────────────────────────────────┘
```

**关键调整**：
- **不新增右侧上下文面板** — 保持当前两列布局（对话区 + 画布区）
- **阶段产出物/检查清单** → 融入对话区顶部的可折叠"阶段摘要"条
- **故事总览统计** → 融入对话区阶段摘要 + 画布区的阶段子视图
- **属性编辑** → 内联或模态框（符合项目规则，不用遮挡式浮动面板）

### 2.3 管线阶段 → 画布视图映射

| 管线阶段                 | 画布子视图（用户可切换）                | 锁定条件                              |
| -------------------- | --------------------------- | --------------------------------- |
| **entry** 创作起点       | ① 导入面板 ② 故事大纲编辑             | storyOutline 非空                   |
| **narrative** 叙事构建   | ① 剧本编辑 ② 角色管理 ③ 场景管理 ④ 道具管理 | characters/scenes/props/script 非空 |
| **interaction** 互动设计 | ① 节点图 ② 互动设计 ③ 变量系统 ④ 关系网络  | nodeGraph 有节点+边                   |
| **cinematic** 演出设计   | ① 镜头指导 ② 时间线 ③ 道德系统         | cinematicDirections 非空（可跳过）       |
| **asset** 资产生成       | ① 资产库 ② 媒体生成                | assetList 非空（可跳过）                 |
| **qa** 质量校验          | ① 健康度 ② 一致性检查 ③ 路径测试        | qaReport 已生成                      |
| **preview** 预览试玩     | ① 预览播放器                     | 无（用户确认即可）                         |
| **release** 发布导出     | ① 导出面板 ② 版本管理               | 无（用户确认即可）                         |

### 2.4 管理类功能（非管线 tab，工具栏图标触发）

* **作品管理**（my-works）：工具栏图标 → 模态弹窗

* **协作**（collab）：工具栏图标 → 模态弹窗（需补全后端）

* **行业资产**（industry-assets）：合并到 asset 阶段的资产库子视图

### 2.5 锁定机制 UI

* 管线进度条显示 8 个阶段节点：✅ 完成 / 🔵 当前 / 🔒 未解锁

* 未解锁阶段：灰色不可点击，hover 显示"需先完成 XX 阶段"

* 已完成阶段：可点击回顾（只读模式）

* 当前阶段：高亮，画布显示该阶段的子视图

* 阶段完成检测：`isStageComplete()` 已存在，UI 展示"✓ 本阶段产出已就绪，可进入下一步"按钮

### 2.6 从 22 tab 到 8 阶段的映射

| 原 22 Tab                        | 去向                                          |
| ------------------------------- | ------------------------------------------- |
| preview                         | → preview 阶段画布                              |
| pipeline (ParseScreen)          | **删除** — 功能合并到 entry/narrative 阶段的 Agent 对话 |
| script                          | → narrative 阶段子视图 ①                         |
| story (StoryOverviewScreen) | **删除** — 总览统计融入对话区顶部"阶段摘要"条（可折叠），子功能分散到各阶段画布子视图 |
| graph                           | → interaction 阶段子视图 ①                       |
| characters                      | → narrative 阶段子视图 ②                         |
| props                           | → narrative 阶段子视图 ③                         |
| scenes                          | → narrative 阶段子视图 ④                         |
| relationships                   | → interaction 阶段子视图 ④                       |
| moral                           | → cinematic 阶段子视图 ③                         |
| cinematic                       | → cinematic 阶段子视图 ①                         |
| interaction (InteractionScreen) | → interaction 阶段子视图 ②                       |
| timeline                        | → cinematic 阶段子视图 ②（改为可编辑）                  |
| health                          | → qa 阶段子视图 ①                                |
| versions (VersionScreen)        | → release 阶段子视图 ② + 工具栏快捷入口                 |
| assets (AssetLibraryScreen)     | **删除 mock，重建** → asset 阶段子视图 ①              |
| industry-assets (AssetsScreen)  | **合并** → asset 阶段子视图 ① 的行业筛选                |
| publish (PublishScreen)         | → release 阶段子视图 ①                           |
| pipeline-viz (PipelineScreen)   | **删除** — 功能由管线进度条替代                         |
| workflow (WorkflowEditorView)   | **删除** — 功能由管线进度条+对话驱动替代                    |
| collab (CollabScreen)           | → 工具栏图标触发（需补全后端）                            |
| my-works (MyWorksScreen)        | → 工具栏图标触发                                   |

**结果**：22 个 flat tab → 8 个管线阶段（每阶段 2-4 个子视图）+ 2 个管理入口

***

## 三、Phase 1：后端补全（并行推进，无 mock）

> 目标：每个功能都有真实后端逻辑，数据可为空（从零开始），但必须真实流转。
> 原则：不硬编码、不 mock、空数据 OK、真实 store 持久化、AI 工具可调用。

### 3.1 修复违反"禁止 mock"铁律的问题

#### 3.1.1 assets tab — 删除 SEED\_ASSETS，接入真实 store

**文件**：`src/components/screens/AssetLibraryScreen.tsx`
**问题**：第 32-47 行硬编码 `SEED_ASSETS`（14 个 mock 资产），与 store 的 `assetCards` 完全脱节
**修复**：

* 删除 `SEED_ASSETS` 常量

* 数据源改为 `useNarrativeStore(s => s.assetCards)`

* 添加 `addAssetCard` / `updateAssetCard` / `removeAssetCard` action 到 `useNarrativeStore`（如不存在）

* 空数据时显示"暂无资产，通过对话让 AI 生成或手动添加"

* 筛选/排序/视图模式功能保留，但操作真实数据

#### 3.1.2 versions tab — 删除 MOCK 数据，补全快照恢复

**文件**：`src/store/use-version-store.ts`、`src/components/screens/VersionScreen.tsx`
**问题**：第 27-31 行引入 `MOCK_SNAPSHOTS` / `MOCK_BRANCHES` / `MOCK_VERSION_HISTORY` / `MOCK_RESTORE_POINTS` 作为初始种子；`restoreFromSnapshot` 是占位实现
**修复**：

* 删除所有 MOCK\_\* 导入和初始数据

* store 初始状态为空数组（`snapshots: []`, `branches: []`, `history: []`）

* 补全 `restoreFromSnapshot`：真实捕获 `useNarrativeStore.getState()` 全量数据 → 存为快照 → 替换当前 narrative store 数据

* 补全 `createSnapshot`：从 narrative store 真实捕获（已有 `captureSnapshotData` 逻辑）

* VersionScreen 空数据时显示"暂无版本快照，点击创建快照保存当前进度"

#### 3.1.3 pipeline tab — 删除硬编码 STEPS，接入 pipeline store

**文件**：`src/components/screens/ParseScreen.tsx`
**问题**：第 46-57 行 `STEPS` 数组硬编码步骤状态（done/running/pending），不与 `usePipelineStore` 联动
**修复**：

* 删除硬编码 `STEPS` 数组

* 步骤状态改为读取 `usePipelineStore(s => s.stageStatuses)`

* 步骤定义改为读取 `STAGE_DEFS`（从 pipeline store 导出）

* 审核编辑（onApprove/onReject/onEditItem）保留，但操作真实 narrative store 数据

#### 3.1.4 pipeline-viz tab — 删除 seed stageProgress

**文件**：`src/components/screens/PipelineScreen.tsx`
**问题**：使用 `stageProgress` 数组（seed 数据），非真实计算，且与 `usePipelineStore` 不联动
**修复**：此 tab 将在 Phase 3 删除（功能由管线进度条替代），Phase 1 暂不修改

#### 3.1.5 collab tab — 删除硬编码权限，构建协作后端

**文件**：`src/components/screens/CollabScreen.tsx`、新建 `src/store/use-collab-store.ts`
**问题**：第 77-83 行 `PERMISSION_LEVELS` 硬编码权限矩阵，无真实协作后端
**修复**：

* 新建 `use-collab-store.ts`：持久化团队成员、任务、评论、审核流

  * `members: CollabMember[]`（id/name/role/permissions/avatar）

  * `tasks: CollabTask[]`（id/title/status/assignee/priority/category/dueDate）

  * `comments: CollabComment[]`（id/author/targetType/targetId/content/timestamp）

  * `reviews: ReviewItem[]`（id/type/stage/submitter/approver/status）

  * `activities: CollabActivity[]`（id/actor/action/target/timestamp）

  * CRUD actions + persist（`cd-collab`）

* CollabScreen 数据源改为 `useCollabStore`

* 权限矩阵保留为常量定义（角色→权限映射是业务逻辑，不是 mock 数据），但成员数据从 store 读取

* 空数据时显示"暂无团队成员，添加成员开始协作"

### 3.2 修复数据分裂问题

#### 3.2.1 道德系统数据统一

**文件**：`src/store/use-moral-store.ts`、`src/lib/seed/narrative-seed.ts`、`src/components/studio/canvas-area.tsx`（MoralView）
**问题**：`useMoralStore`（`cd-moral`）与 `narrative.moralAxes`（`cd-narrative` seed）两套数据不互通
**修复**：

* 以 `useMoralStore` 为唯一数据源

* `narrative.moralAxes` 字段标记为 deprecated（保留但不读写）

* MoralView 只读 `useMoralStore`

* StoryOverviewScreen 中道德相关展示改为读 `useMoralStore`

#### 3.2.2 管线状态数据统一

**文件**：`src/lib/seed/narrative-seed.ts`、`src/components/screens/ParseScreen.tsx`、`src/components/screens/PipelineScreen.tsx`
**问题**：`usePipelineStore`（`cd-pipeline`）与 `narrative.pipelineStages`（`cd-narrative` seed）两套数据不联动
**修复**：

* 以 `usePipelineStore` 为唯一数据源

* `narrative.pipelineStages` 字段标记为 deprecated

* ParseScreen / PipelineScreen 改为读 `usePipelineStore`

* `PIPELINE_STAGES` seed 数据（narrative-seed.ts 第 361 行）保留作为阶段定义参考，但不作为运行时状态

### 3.3 补全 AI 工具系统（5 个缺口领域）

#### 3.3.1 版本控制工具

**文件**：`src/lib/ai/tool-registry.ts`
**新增工具**：

* `create_version_snapshot` — 创建版本快照（调用 `useVersionStore.createSnapshot`）

* `restore_version_snapshot` — 恢复到指定快照（调用 `useVersionStore.restoreFromSnapshot`）

* `list_version_snapshots` — 列出所有快照

* `compare_versions` — 对比两个快照的差异（调用 `computeChangeSet`）

#### 3.3.2 资产管理工具

**文件**：`src/lib/ai/tool-registry.ts`、`src/store/use-narrative-store.ts`
**新增 store action**：`addAssetCard` / `updateAssetCard` / `removeAssetCard`
**新增工具**：

* `add_asset` — 添加资产到资产库（type/name/prompt/status）

* `update_asset` — 更新资产状态

* `remove_asset` — 删除资产

* `list_assets` — 列出所有资产（支持按 type 筛选）

* `generate_and_add_asset` — 生成媒体并自动入库（调用 media-service + add\_asset）

#### 3.3.3 发布工具

**文件**：`src/lib/ai/tool-registry.ts`
**新增工具**：

* `export_project` — 导出项目（调用 `useExportStore.runExport`）

* `list_export_formats` — 列出可用导出格式

* `get_export_status` — 查询导出任务状态

#### 3.3.4 协作工具

**文件**：`src/lib/ai/tool-registry.ts`
**新增工具**：

* `add_collab_member` — 添加团队成员

* `assign_collab_task` — 分配协作任务

* `update_collab_task` — 更新任务状态

* `add_collab_comment` — 添加评论

* `submit_for_review` — 提交审核

#### 3.3.5 作品管理工具

**文件**：`src/lib/ai/tool-registry.ts`
**新增工具**：

* `list_projects` — 列出所有项目

* `switch_project` — 切换当前项目

* `delete_project` — 删除项目

* `get_project_analytics` — 获取项目分析数据

### 3.4 补全 CRUD 不完整的 store

#### 3.4.1 props — 补全 update/remove

**文件**：`src/store/use-narrative-store.ts`
**新增 action**：`removeProp(id)`（`updateProp` 已存在）
**新增工具**：`update_prop` / `remove_prop`

#### 3.4.2 scenes — 补全 add/remove

**文件**：`src/store/use-narrative-store.ts`
**新增 action**：`removeScene(id)`（`addScene` / `updateScene` 已存在）
**新增工具**：`remove_scene`

#### 3.4.3 cinematic — 补全 add/remove

**文件**：`src/store/use-narrative-store.ts`
**新增 action**：`addCinematicDirection` / `removeCinematicDirection`（`updateCinematicDirection` 已存在）
**新增工具**：`update_cinematic_direction` / `remove_cinematic_direction`

***

## 四、Phase 2：前端完整性

> 目标：每个视图都有完整 CRUD UI，空数据有引导提示，暗色主题统一。

### 4.1 补全缺失的 CRUD UI

#### 4.1.1 PropsView — 补全编辑/删除

**文件**：`src/components/studio/canvas-area.tsx`（PropsView 函数）

* 每个道具卡片添加"编辑"和"删除"按钮

* 编辑走内联表单或模态框

* 删除需确认对话框

#### 4.1.2 ScenesView — 补全添加/删除

**文件**：`src/components/studio/canvas-area.tsx`（ScenesView 函数）

* 添加"新建场景"按钮 + 表单

* 每个场景卡片添加"删除"按钮

#### 4.1.3 CinematicView — 补全添加/删除

**文件**：`src/components/studio/canvas-area.tsx`（CinematicView 函数）

* 添加"新建镜头指导"按钮（选择关联节点）

* 每个镜头指导卡片添加"删除"按钮

#### 4.1.4 TimelineView — 从只读改为可编辑

**文件**：`src/components/studio/canvas-area.tsx`（TimelineView 函数）

* 支持拖拽调整节点顺序

* 支持点击节点跳转到节点图编辑

### 4.2 暗色主题统一

**问题**：CollabScreen、AssetsScreen、StoryOverviewScreen 等旧 Screen 使用白色背景（`S.bg = "#FAFBFF"`），与 Studio 暗色主题不搭。

**修复策略**（Phase 3 统一处理，Phase 2 暂不动）：

* 嵌入旧 Screen 的 `ScreenEmbedView` 添加暗色主题 CSS 覆盖层

* 或在 Phase 3 重写为原生暗色视图

### 4.3 空数据引导

所有视图在数据为空时显示引导提示：

* "暂无角色，通过对话让 AI 创建，或点击添加"

* "暂无节点，通过对话让 AI 构建互动结构"

* 等等

***

## 五、Phase 3：UI 工作流重组

> 目标：22 个 flat tab → 8 阶段驱动 + 对话双驱动 + 管理入口

### 5.1 重构 studio-toolbar.tsx

**文件**：`src/components/studio/studio-toolbar.tsx`

**变更**：

* 删除 22 个 flat tab 的 `TABS` 数组

* 改为读取 `usePipelineStore` 的 `STAGE_DEFS` + `stageStatuses`

* 渲染 8 个管线阶段节点（带锁定状态图标）

* 管理入口（作品/协作）改为右侧图标按钮

**新 ViewTab 类型**：

```typescript
export type ViewTab = PipelineStageId; // entry | narrative | interaction | cinematic | asset | qa | preview | release
```

**阶段节点渲染**：

* ✅ 完成：绿色 + 可点击回顾

* 🔵 当前：蓝色高亮 + 可点击

* 🔒 未解锁：灰色 + 不可点击 + hover tooltip "需先完成 XX 阶段"

### 5.2 重构 canvas-area.tsx

**文件**：`src/components/studio/canvas-area.tsx`

**变更**：

* `CanvasArea` 接收 `activeStage: PipelineStageId` 而非 `activeTab: ViewTab`

* 每个阶段渲染对应的子视图容器

* 子视图容器内部用子 tab 切换（最多 4 个）

* 删除 `ScreenEmbedView` 的旧 Screen 嵌入（Phase 3 重写为原生暗色视图）

**阶段 → 子视图映射**（见二、2.3 节）

**子视图切换 UI**：

* 画布顶部显示当前阶段的子 tab（如 narrative 阶段显示：剧本 | 角色 | 场景 | 道具）

* 子 tab 数量少（2-4 个），不会信息过载

### 5.3 重构 studio-layout.tsx

**文件**：`src/components/studio/studio-layout.tsx`

**变更**：

* `activeTab` 状态改为 `activeStage`，类型为 `PipelineStageId`

* 添加 `activeSubView` 状态（当前阶段内的子视图索引）

* 管线进度条嵌入顶部工具栏

* 管理入口（作品/协作）改为模态弹窗

### 5.4 管线进度条组件

**新建文件**：`src/components/studio/pipeline-progress.tsx`

**功能**：

* 横向显示 8 个阶段节点

* 每个节点：图标 + 标签 + 状态（完成/当前/锁定）

* 点击已完成或当前阶段 → 切换画布

* 点击未解锁阶段 → tooltip 提示

* 当前阶段下方显示"✓ 产出已就绪，进入下一步"按钮（当 `isStageComplete()` 为 true 时）

### 5.5 对话区顶部"阶段摘要"条

> **注意**：当前 Studio 布局没有右侧上下文面板（只有对话区+画布区两列）。
> 阶段产出物和检查清单不放入不存在的面板，而是融入对话区顶部。

**文件**：`src/components/studio/chat-panel.tsx`

**变更**：
- 在对话区顶部（消息列表上方）添加可折叠的"阶段摘要"条
- 摘要内容：
  - 当前阶段名称 + Expert Agent 头像
  - 阶段产出物清单（从 `pipeline.context` 读取，逐项打勾/未完成）
  - 阶段完成度（`expectedOutputs` 检查结果）
  - "✓ 产出已就绪，进入下一步"按钮（当 `isStageComplete()` 为 true 时）
- 折叠状态：默认展开（当前阶段），用户可点击折叠为单行
- 不遮挡对话消息流 — 折叠后只占一行高度

**替代原 StoryOverviewScreen 的总览功能**：
- 项目统计（角色数/场景数/节点数/结局数）→ 显示在阶段摘要条
- 张力曲线 → narrative 阶段画布子视图
- 创作进度 → 管线进度条已展示

### 5.6 删除冗余 tab

**删除的 tab**（功能被其他地方吸收）：

* `pipeline` (ParseScreen) — 功能融入 entry/narrative 阶段对话

* `story` (StoryOverviewScreen) — 总览融入对话区阶段摘要条，子功能分散到各阶段

* `pipeline-viz` (PipelineScreen) — 功能由管线进度条替代

* `workflow` (WorkflowEditorView) — 功能由管线进度条+对话驱动替代

* `assets` (AssetLibraryScreen) — 重建为 asset 阶段子视图

* `industry-assets` (AssetsScreen) — 合并到 asset 阶段子视图

**保留但改为模态弹窗的**：

* `collab` (CollabScreen) — 工具栏图标触发

* `my-works` (MyWorksScreen) — 工具栏图标触发

* `versions` (VersionScreen) — release 阶段子视图 + 工具栏快捷入口

### 5.7 暗色主题统一

所有嵌入的旧 Screen 在 Phase 3 重写为原生暗色视图：

* CollabScreen → 暗色协作面板（模态弹窗）

* VersionScreen → 暗色版本管理（release 阶段子视图）

* PublishScreen → 暗色发布面板（release 阶段子视图）

* 等等

***

## 六、执行顺序与依赖关系

```
Phase 1: 后端补全（并行）
├── 3.1 修复 mock/硬编码（5 个子任务，可并行）
├── 3.2 修复数据分裂（2 个子任务，可并行）
├── 3.3 补全 AI 工具（5 个领域，可并行）
└── 3.4 补全 CRUD store（3 个子任务，可并行）

Phase 2: 前端完整性（依赖 Phase 1）
├── 4.1 补全 CRUD UI（4 个子任务，依赖 3.4）
└── 4.3 空数据引导（依赖 3.1）

Phase 3: UI 工作流重组（依赖 Phase 1 + 2）
├── 5.1 重构 studio-toolbar（依赖 3.2 管线状态统一）
├── 5.2 重构 canvas-area（依赖 5.1）
├── 5.3 重构 studio-layout（依赖 5.1 + 5.2）
├── 5.4 新建 pipeline-progress（依赖 5.1）
├── 5.5 对话区阶段摘要条（依赖 3.3）
├── 5.6 删除冗余 tab（依赖 5.2）
└── 5.7 暗色主题统一（依赖 5.6）
```

***

## 七、验证步骤

### 7.1 Phase 1 验证

* `bun run lint` — 0 警告

* `bun run build` — 成功

* 检查每个修复的 store：初始数据为空（非 mock）

* 检查新增 AI 工具：在 tool-registry.ts 中注册且 handler 调用真实 store

### 7.2 Phase 2 验证

* `bun run lint` — 0 警告

* `bun run build` — 成功

* 手动验证每个 CRUD UI：添加/编辑/删除都能持久化

* 空数据引导提示正确显示

### 7.3 Phase 3 验证

* `bun run lint` — 0 警告

* `bun run build` — 成功

* E2E 测试（Playwright）：

  * 访问 /studio，看到 8 阶段管线进度条

  * 当前阶段高亮，未解锁阶段灰色

  * 画布显示当前阶段的子视图

  * 子 tab 切换正常

  * 管理入口（作品/协作）通过工具栏图标打开

  * 暗色主题统一，无白色背景

***

## 八、假设与决策

1. **假设**：`usePipelineStore` 的 8 阶段定义符合用户预期的工作流（基于 PRD 和现有代码）
2. **决策**：管理类功能（作品/协作）不作为管线阶段，而是工具栏图标触发的模态弹窗
3. **决策**：旧 Screen 的暗色主题统一在 Phase 3 处理，Phase 1/2 不动旧 Screen 样式
4. **决策**：`narrative.pipelineStages` 和 `narrative.moralAxes` 标记 deprecated 但不删除（避免破坏性变更）
5. **假设**：用户接受"空数据从零开始"的方式，而非保留 seed 数据做演示

