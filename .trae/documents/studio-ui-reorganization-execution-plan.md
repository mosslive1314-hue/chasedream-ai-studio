# Studio UI 工作流重组 — 执行计划（Phase 1 补漏 + Phase 2 + Phase 3）

> 依据：用户反馈（22 tab 太散、上下文面板问题、阶段+对话双驱动、门禁式锁定）
> 本计划范围：Phase 1 遗漏补全 + Phase 2（前端 CRUD UI）+ Phase 3（UI 工作流重组）

***

## 一、Phase 1 完成度审计（用户要求核对）

### 1.1 修复 mock/硬编码

| 子项 | 状态 | 验证依据 |
|---|---|---|
| assets SEED_ASSETS | ✅ 已完成 | `AssetLibraryScreen.tsx` 已删除 SEED_ASSETS，数据源改为 `useNarrativeStore(s => s.assetCards)`（line 117） |
| versions MOCK | ✅ 已完成 | `use-version-store.ts` 已删除 MOCK_* 导入，改为 `createDefaultMainBranch()`，初始状态为空数组 |
| **pipeline STEPS** | ❌ **未完成** | `ParseScreen.tsx` line 46-57 仍有硬编码 `STEPS` 数组（status: "done"/"running"/"pending" 静态值），未接入 `usePipelineStore` |
| collab 权限 | ✅ 已完成 | `use-collab-store.ts` 已创建，`StoreHydrator.tsx` line 56 已注册 rehydrate，`store/index.ts` line 22 已导出 |
| pipeline-viz (PipelineScreen) | ℹ️ 按原计划 Phase 1 跳过 | 原计划 3.1.4 明确"Phase 1 暂不修改，Phase 3 删除" |

### 1.2 修复数据分裂

| 子项 | 状态 | 验证依据 |
|---|---|---|
| 道德系统统一 | ✅ 已完成 | `use-narrative-store.ts` line 205 `moralAxes` 标记 `@deprecated` |
| 管线状态统一 | ✅ 已完成 | `use-narrative-store.ts` line 181 `pipelineStages` 标记 `@deprecated` |

### 1.3 补全 AI 工具系统

| 子项 | 状态 | 验证依据 |
|---|---|---|
| 版本控制工具 | ✅ 已完成 | `tool-registry.ts` line 1978-2088（#48-51: create/restore/list/compare_version_snapshot） |
| 资产管理工具 | ✅ 已完成 | `tool-registry.ts` line 2090-2296（#52-56: add/update/remove/list/generate_and_add_asset） |
| 发布工具 | ✅ 已完成 | `tool-registry.ts` line 2298-2390（#57-59: export_project/list_export_formats/get_export_status） |
| 协作工具 | ✅ 已完成 | `tool-registry.ts` line 2392-2576（#60-64: add_collab_member/assign_collab_task/update_collab_task/add_collab_comment/submit_for_review） |
| 作品管理工具 | ✅ 已完成 | `tool-registry.ts` line 2578-2680（#65-68: list/switch/delete_project + get_project_analytics） |

### 1.4 补全 CRUD store

| 子项 | 状态 | 验证依据 |
|---|---|---|
| removeProp | ✅ 已完成 | `use-narrative-store.ts` line 254 声明 + line 590 实现 |
| removeScene | ✅ 已完成 | `use-narrative-store.ts` line 252 声明 + line 578 实现 |
| addCinematicDirection | ✅ 已完成 | `use-narrative-store.ts` line 263 声明 + line 626 实现 |
| removeCinematicDirection | ✅ 已完成 | `use-narrative-store.ts` line 265 声明 + line 640 实现 |
| addAssetCard | ✅ 已完成 | `use-narrative-store.ts` line 268 声明 + line 647 实现 |
| updateAssetCard | ✅ 已完成 | `use-narrative-store.ts` line 269 声明 + line 653 实现 |
| removeAssetCard | ✅ 已完成 | `use-narrative-store.ts` line 270 声明 + line 661 实现 |

### 1.5 Phase 1 遗漏项处理决策

**唯一遗漏**：`ParseScreen.tsx` 的硬编码 `STEPS` 数组（Phase 1.1.3）

**决策**：**不在 Phase 1 单独修复，改为由 Phase 3 删除整个 pipeline tab 解决**

**理由**：
- 原计划 Phase 3.6 明确"pipeline (ParseScreen) — 删除 — 功能融入 entry/narrative 阶段的 Agent 对话"
- 在 Phase 1 修复 STEPS 接入 usePipelineStore 是浪费工作（Phase 3 会删掉整个文件）
- ParseScreen 的 10 步管线是旧设计，与新的 8 阶段管线（usePipelineStore）冲突，修复意义不大
- Phase 3 删除后，硬编码问题自然消失

**风险**：在 Phase 2/3 执行期间，ParseScreen 仍有硬编码数据，但该 tab 在 Phase 3 会被删除，不影响最终结果。

***

## 二、上下文面板问题澄清（用户关注点）

### 2.1 问题回顾

用户指出旧计划 line 114 提到"总览功能融入上下文面板"，但当前 Studio 布局**没有右侧上下文面板**。

### 2.2 当前实际布局（已验证）

```
src/components/studio/studio-layout.tsx (line 125-138)
┌─────────────────────────────────────────────────────────┐
│ 顶部工具栏（StudioToolbar）                              │
├──────────────┬──────────────────────────────────────────┤
│  对话区      │    画布区                                │
│  (左 42%)    │    (右 flex-1)                           │
│  ChatPanel   │    CanvasArea                            │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**确认**：只有两列，**没有**第三列上下文面板。AGENTS.md 中提到的"右上下文(280px)"是规划中的设计，实际代码未实现。

### 2.3 解决方案（本计划执行）

"总览/阶段产出物/检查清单"功能**不放入不存在的上下文面板**，也**不使用任何折叠/展开 UI**（用户明确禁止），而是：

| 功能 | 放置位置 | 实现文件 |
|---|---|---|
| 当前阶段名称 + Expert 头像 | 顶部工具栏管线进度条（高亮当前节点） | `studio-toolbar.tsx` + `pipeline-progress.tsx` |
| 阶段产出物清单（逐项打勾） | 阶段切换时作为 Agent 系统消息发到对话流 | `chat-panel.tsx`（已有消息系统） |
| 项目统计（角色数/场景数/节点数） | 工具栏项目名右侧轻量文本（单行，不占额外空间） | `studio-toolbar.tsx` |
| "✓ 产出已就绪，进入下一步"提示 | Agent 系统消息（已有实现，line 333-342）+ 进度条当前节点高亮 | `chat-panel.tsx`（已有） |
| 管线进度条（8 阶段节点） | 顶部工具栏中间 | `studio-toolbar.tsx` |
| 属性编辑 | 内联或模态框（符合项目规则） | `canvas-area.tsx` |

**关键**：
- 不新增第三列面板
- **不使用任何折叠/展开 UI** — 所有信息要么常驻显示（工具栏），要么作为对话消息流式呈现
- 符合项目规则"不要折叠面板遮挡内容"和"不要冗余的工作流指示单独占一行"

***

## 三、Phase 2：前端 CRUD UI 补全

> 目标：每个视图都有完整 CRUD UI，空数据有引导提示。
> 依赖：Phase 1 已完成（store actions 已就绪）。

### 3.1 PropsView — 补全编辑/删除

**文件**：`src/components/studio/canvas-area.tsx`（PropsView 函数，line 1927 附近）

**当前问题**：只有添加表单，已有道具卡片无编辑/删除按钮。

**修改**：
- 每个道具卡片右上角添加"编辑"（Edit2 图标）和"删除"（Trash2 图标）按钮
- 编辑点击 → 切换为内联表单（复用现有添加表单字段，预填数据）
- 删除点击 → 弹出 `DeleteConfirmDialog`（已存在于 line 29 导入）
- 删除确认后调用 `useNarrativeStore.getState().removeProp(id)`（Phase 1 已添加）

**空数据引导**：
```tsx
{props.length === 0 && (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-zinc-600">
    <Package className="h-8 w-8" />
    <p>暂无道具</p>
    <p className="text-xs text-zinc-700">通过对话让 AI 创建，或点击上方"添加道具"</p>
  </div>
)}
```

### 3.2 ScenesView — 补全删除

**文件**：`src/components/studio/canvas-area.tsx`（ScenesView 函数，line 838 附近）

**当前问题**：有添加表单，但场景卡片无删除按钮。

**修改**：
- 每个场景卡片右上角添加"删除"按钮
- 删除点击 → `DeleteConfirmDialog` → `useNarrativeStore.getState().removeScene(id)`（Phase 1 已添加）

**空数据引导**：同 PropsView 模式。

### 3.3 CinematicView — 补全删除

**文件**：`src/components/studio/canvas-area.tsx`（CinematicView 函数，line 936 附近）

**当前问题**：有添加表单，但镜头指导卡片无删除按钮。

**修改**：
- 每个镜头指导卡片右上角添加"删除"按钮
- 删除点击 → `DeleteConfirmDialog` → `useNarrativeStore.getState().removeCinematicDirection(id)`（Phase 1 已添加）

**空数据引导**：同 PropsView 模式。

### 3.4 TimelineView — 保持只读（Phase 3 再改）

**文件**：`src/components/studio/canvas-area.tsx`（TimelineView 函数，line 679 附近）

**决策**：Phase 2 暂不改为可编辑，Phase 3 重写为 cinematic 阶段子视图时再处理。当前只确保空数据引导。

### 3.5 其他视图空数据引导检查

需检查并补全空数据引导的视图：
- `CharactersView`（line 724）— 检查是否有空数据引导
- `RelationshipsView`（line 1416）— 检查是否有空数据引导
- `MoralView`（line 1724）— 检查是否有空数据引导
- `HealthView`（line 1207）— 检查是否有空数据引导

### 3.6 暗色主题统一（Phase 3 处理）

**决策**：旧 Screen 的白色背景问题在 Phase 3 重写为原生暗色视图时统一处理，Phase 2 不动旧 Screen 样式。

***

## 四、Phase 3：UI 工作流重组

> 目标：22 个 flat tab → 8 阶段驱动 + 对话双驱动 + 管理入口
> 核心改造：toolbar / canvas-area / studio-layout / chat-panel

### 4.1 重构 studio-toolbar.tsx — 22 tab → 8 阶段进度条

**文件**：`src/components/studio/studio-toolbar.tsx`

**当前状态**（line 35-64）：22 个 tab 平铺，仅有分组分隔线。

**修改**：

1. **删除** 22 个 tab 的 `TABS` 数组和 `TabGroup` 类型
2. **新增** `ViewTab` 类型改为管线阶段 ID：
   ```typescript
   export type ViewTab = PipelineStageId;
   // entry | narrative | interaction | cinematic | asset | qa | preview | release
   ```
3. **新增** 管理入口类型：
   ```typescript
   export type ManagementModal = "none" | "my-works" | "collab" | "versions";
   ```
4. **渲染** 8 阶段进度条（横向）：
   - 从 `usePipelineStore` 读取 `STAGE_DEFS` + `stageStatuses`
   - 每个阶段节点：图标 + 标签 + 状态
     - ✅ 完成：绿色 + 可点击回顾
     - 🔵 当前：蓝色高亮 + 可点击
     - 🔒 未解锁：灰色 + 不可点击 + hover tooltip "需先完成 XX 阶段"
5. **右侧** 管理入口图标按钮：
   - 作品（FolderOpen 图标）→ 打开 my-works 模态
   - 协作（Users 图标）→ 打开 collab 模态
   - 版本（GitBranch 图标）→ 打开 versions 模态
   - 保留原有：音频/样式/导出/设置

**Props 变更**：
```typescript
interface StudioToolbarProps {
  activeStage: ViewTab;                    // 改名 activeTab → activeStage
  onStageChange: (stage: ViewTab) => void; // 改名 onTabChange → onStageChange
  activeModal: ManagementModal;            // 新增
  onModalChange: (modal: ManagementModal) => void; // 新增
  projectName: string;
  activePanel: ToolbarPanel;
  onPanelToggle: (panel: ToolbarPanel) => void;
  onProjectNameChange?: (newName: string) => void;
}
```

### 4.2 新建 pipeline-progress.tsx — 管线进度条组件

**新建文件**：`src/components/studio/pipeline-progress.tsx`

**功能**：
- 横向渲染 8 个阶段节点（从 `usePipelineStore` 的 `STAGE_DEFS`）
- 每个节点：圆形图标 + 阶段 label + 状态指示
- 点击逻辑：
  - 已完成/当前阶段 → 调用 `onStageChange(stageId)`
  - 未解锁阶段 → 不响应，显示 tooltip
- 当前阶段下方显示"✓ 产出已就绪，进入下一步"按钮（当 `isStageComplete()` 为 true）
- 点击该按钮 → 调用 `usePipelineStore.getState().advance()`

**关键代码结构**：
```tsx
export function PipelineProgress({ activeStage, onStageChange }: Props) {
  const stages = usePipelineStore(s => s.stages); // STAGE_DEFS
  const stageStatuses = usePipelineStore(s => s.stageStatuses);
  const advance = usePipelineStore(s => s.advance);
  const isStageComplete = usePipelineStore(s => s.isStageComplete);

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, idx) => {
        const status = stageStatuses[stage.id];
        const canClick = status === "active" || status === "complete";
        return (
          <div key={stage.id} className="flex items-center">
            {idx > 0 && <div className="h-px w-4 bg-zinc-700" />}
            <button
              disabled={!canClick}
              onClick={() => canClick && onStageChange(stage.id)}
              className={/* 状态颜色 */}
              title={!canClick ? `需先完成 ${stages[idx-1].label} 阶段` : stage.label}
            >
              {/* 图标 + label */}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

### 4.3 重构 canvas-area.tsx — 阶段子视图切换

**文件**：`src/components/studio/canvas-area.tsx`

**当前状态**（line 2127-2153）：22 个 `activeTab ===` 条件渲染。

**修改**：

1. **Props 变更**：
   ```typescript
   interface CanvasAreaProps {
     activeStage: ViewTab; // 改名
     activeSubView: string; // 新增：当前阶段内的子视图
     onSubViewChange: (sub: string) => void; // 新增
     selectedNodeId: string | null;
     onSelectNode: (id: string | null) => void;
   }
   ```

2. **删除** 22 个 `activeTab ===` 条件渲染块

3. **新增** 阶段 → 子视图映射容器：
   ```tsx
   // 每个阶段渲染一个 StageContainer，内部用子 tab 切换
   {activeStage === "entry" && <EntryStageView subView={activeSubView} />}
   {activeStage === "narrative" && <NarrativeStageView subView={activeSubView} />}
   // ... 8 个阶段
   ```

4. **每个 StageView 内部**：顶部子 tab（2-4 个）+ 内容区

**阶段 → 子视图映射**：

| 阶段 | 子视图 | 复用的现有组件 |
|---|---|---|
| **entry** | ① 导入面板 ② 故事大纲 | ImportPanel（已有）+ 新建 StoryOutlineView |
| **narrative** | ① 剧本 ② 角色 ③ 场景 ④ 道具 | ScriptScreen + CharactersView + ScenesView + PropsView |
| **interaction** | ① 节点图 ② 互动设计 ③ 变量 ④ 关系 | GraphView + InteractionScreen + 新建 VariablesView + RelationshipsView |
| **cinematic** | ① 镜头 ② 时间线 ③ 道德 | CinematicView + TimelineView + MoralView |
| **asset** | ① 资产库 ② 媒体生成 | AssetLibraryScreen（已去 mock）+ 新建 MediaGenView |
| **qa** | ① 健康度 ② 一致性 ③ 路径测试 | HealthView + 新建 ConsistencyView + 新建 PathTestView |
| **preview** | ① 预览播放器 | PreviewView（已有） |
| **release** | ① 发布 ② 版本 | PublishScreen + VersionScreen |

5. **删除的视图**（功能被吸收）：
   - `WorkflowEditorView`（line 2035）— 功能由管线进度条替代
   - `ScreenEmbedView` 嵌入 `PipelineScreen`（pipeline-viz）— 功能由管线进度条替代
   - `ScreenEmbedView` 嵌入 `ParseScreen`（pipeline）— 功能融入 entry/narrative 阶段对话（**Phase 1 遗漏的 STEPS 硬编码问题随之解决**）
   - `ScreenEmbedView` 嵌入 `StoryOverviewScreen`（story）— 总览融入对话区阶段摘要条
   - `ScreenEmbedView` 嵌入 `AssetsScreen`（industry-assets）— 合并到 asset 阶段资产库

### 4.4 重构 studio-layout.tsx — 状态管理升级

**文件**：`src/components/studio/studio-layout.tsx`

**当前状态**（line 74）：`const [activeTab, setActiveTab] = useState<ViewTab>("preview");`

**修改**：
```typescript
// 改为阶段驱动
const [activeStage, setActiveStage] = useState<ViewTab>("entry"); // 默认从 entry 开始
const [activeSubView, setActiveSubView] = useState<string>("default");
const [activeModal, setActiveModal] = useState<ManagementModal>("none");

// 管线推进时，自动切换画布阶段
const handleStageChange = useCallback((stage: ViewTab) => {
  setActiveStage(stage);
  // 重置子视图为该阶段的第一个
  setActiveSubView(STAGE_DEFAULT_SUBVIEW[stage]);
}, []);

// 管线 advance 时自动切换
const handleAdvance = useCallback(() => {
  const next = usePipelineStore.getState().advance();
  if (next) {
    setActiveStage(next);
    setActiveSubView(STAGE_DEFAULT_SUBVIEW[next]);
  }
}, []);
```

**渲染调整**：
```tsx
<StudioToolbar
  activeStage={activeStage}
  onStageChange={handleStageChange}
  activeModal={activeModal}
  onModalChange={setActiveModal}
  // ...
/>

<div className="flex min-h-0 flex-1">
  <div style={{ width: `${chatWidthPct}%` }}>
    <ChatPanel onAdvance={handleAdvance} />
  </div>
  <ResizeHandle onDrag={handleResize} />
  <div className="relative min-w-0 flex-1">
    <CanvasArea
      activeStage={activeStage}
      activeSubView={activeSubView}
      onSubViewChange={setActiveSubView}
      selectedNodeId={null}
      onSelectNode={() => {}}
    />
  </div>
</div>

{/* 管理入口模态弹窗 */}
{activeModal === "my-works" && <MyWorksModal onClose={() => setActiveModal("none")} />}
{activeModal === "collab" && <CollabModal onClose={() => setActiveModal("none")} />}
{activeModal === "versions" && <VersionModal onClose={() => setActiveModal("none")} />}
```

### 4.5 重构 chat-panel.tsx — 阶段产出物作为对话消息（无折叠 UI）

**文件**：`src/components/studio/chat-panel.tsx`

**当前状态**：已有管线集成（syncNarrativeToPipeline、checkStageAdvancement、isStageComplete 检查），阶段完成时已通过 `addMessage` 发送系统消息（line 333-342）。

**修改原则**：**不添加任何折叠/展开 UI 组件**。阶段信息通过两种方式呈现：
1. **常驻显示**：工具栏管线进度条（高亮当前阶段）+ 项目名右侧轻量统计文本
2. **流式呈现**：阶段切换/完成时作为 Agent 系统消息发到对话流（已有实现）

**具体修改**：

1. **阶段切换时发送产出物清单消息**（增强已有逻辑）：
   在 `checkStageAdvancement` 函数（line 243-262）中，阶段切换后除了现有的欢迎消息，追加一条产出物清单消息：
   ```tsx
   // 在 checkStageAdvancement 的 addMessage 欢迎消息后追加
   const expectedOutputs = stageDef.expectedOutputs;
   const context = usePipelineStore.getState().context;
   const checklist = expectedOutputs.map(output => {
     const done = context[output] != null;
     return `${done ? "✓" : "○"} ${OUTPUT_LABELS[output] ?? output}`;
   }).join("\n");
   addMessage({
     role: "assistant",
     content: `本阶段产出物清单：\n${checklist}\n\n完成所有产出后可进入下一阶段。`,
     expertId: stageDef.expertId,
     expertRole: usePipelineStore.getState().getActiveExpert()?.role,
     expertAvatar: usePipelineStore.getState().getActiveExpert()?.avatar,
   });
   ```

2. **阶段完成提示**（已有实现，无需修改）：
   line 333-342 已有 `isStageComplete()` 检测，发送"【XX】阶段的核心产出已完成。输入'下一阶段'进入下一阶段"消息。

3. **不添加 StageSummaryBar 组件** — 删除原计划中的折叠摘要条设计。

4. **ChatPanel Props 变更**：
   ```typescript
   interface ChatPanelProps {
     onAdvance?: () => void; // 新增：阶段推进回调（供工具栏进度条点击下一步时调用）
   }
   ```

**项目统计显示**（移到工具栏，不在对话区）：
- 在 `studio-toolbar.tsx` 的 `ProjectInfo` 组件中，项目名右侧添加轻量统计文本：
  ```tsx
  // ProjectInfo 组件内
  const charCount = useNarrativeStore(s => s.characters.length);
  const sceneCount = useNarrativeStore(s => s.scenes.length);
  const nodeCount = useNarrativeStore(s => s.storyNodes.length);

  // 渲染（项目名右侧，单行，不占额外空间）
  <span className="text-zinc-700">·</span>
  <span className="text-xs text-zinc-500">{charCount}角色 · {sceneCount}场景 · {nodeCount}节点</span>
  ```

### 4.6 新建管理入口模态组件

**新建文件**：
- `src/components/studio/my-works-modal.tsx` — 包装 MyWorksScreen 为暗色模态
- `src/components/studio/collab-modal.tsx` — 包装 CollabScreen 为暗色模态
- `src/components/studio/version-modal.tsx` — 包装 VersionScreen 为暗色模态

**统一模态外壳**：
```tsx
export function MyWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-md p-1 text-zinc-500 hover:bg-zinc-900">
          <X className="h-4 w-4" />
        </button>
        <div className="p-6">
          <MyWorksScreen />
        </div>
      </div>
    </div>
  );
}
```

### 4.7 暗色主题统一

**问题**：CollabScreen、VersionScreen、PublishScreen、MyWorksScreen、AssetsScreen 等旧 Screen 使用白色背景。

**修复策略**：
- 模态弹窗内的旧 Screen：通过 CSS 覆盖层强制暗色（在模态外壳添加 `dark` 类 + CSS 变量覆盖）
- 阶段子视图内嵌的旧 Screen（如 ScriptScreen、InteractionScreen）：在 StageView 容器内添加暗色覆盖层
- 优先级：Phase 3 先用 CSS 覆盖层快速统一，后续迭代再重写为原生暗色组件

**CSS 覆盖层实现**（在 `src/globals.css` 添加）：
```css
/* 旧 Screen 暗色覆盖 */
.screen-dark-override {
  background: #09090b !important;
  color: #f4f4f5 !important;
}
.screen-dark-override * {
  background-color: inherit !important;
  color: inherit !important;
  border-color: #27272a !important;
}
```

***

## 五、执行顺序与依赖关系

```
Phase 1 补漏（无需单独执行，Phase 3 删除时解决）
└── ParseScreen STEPS 硬编码 → Phase 3.3 删除 pipeline tab 时自然解决

Phase 2: 前端 CRUD UI 补全（可并行）
├── 3.1 PropsView 编辑/删除
├── 3.2 ScenesView 删除
├── 3.3 CinematicView 删除
├── 3.4 TimelineView 空数据引导
└── 3.5 其他视图空数据引导检查

Phase 3: UI 工作流重组（顺序执行）
├── 4.2 新建 pipeline-progress.tsx（无依赖）
├── 4.1 重构 studio-toolbar.tsx（依赖 4.2）
├── 4.5 重构 chat-panel.tsx 添加阶段摘要条（无依赖，可与 4.1 并行）
├── 4.3 重构 canvas-area.tsx（依赖 4.1）
├── 4.4 重构 studio-layout.tsx（依赖 4.1 + 4.3 + 4.5）
├── 4.6 新建管理入口模态（依赖 4.4）
└── 4.7 暗色主题统一（依赖 4.6）
```

***

## 六、22 tab → 8 阶段映射（最终结果）

| 原 22 Tab | 去向 | 实现方式 |
|---|---|---|
| preview | → preview 阶段画布 | PreviewView（已有） |
| pipeline (ParseScreen) | **删除** | 功能融入 entry/narrative 阶段对话（Phase 1 STEPS 硬编码随之解决） |
| script | → narrative 阶段子视图 ① | ScriptScreen（暗色覆盖） |
| story (StoryOverviewScreen) | **删除** | 总览融入对话区阶段摘要条 |
| graph | → interaction 阶段子视图 ① | GraphView（已有） |
| characters | → narrative 阶段子视图 ② | CharactersView（已有） |
| props | → narrative 阶段子视图 ③ | PropsView（Phase 2 补全 CRUD） |
| scenes | → narrative 阶段子视图 ④ | ScenesView（Phase 2 补全删除） |
| relationships | → interaction 阶段子视图 ④ | RelationshipsView（已有） |
| moral | → cinematic 阶段子视图 ③ | MoralView（已有） |
| cinematic | → cinematic 阶段子视图 ① | CinematicView（Phase 2 补全删除） |
| interaction (InteractionScreen) | → interaction 阶段子视图 ② | InteractionScreen（暗色覆盖） |
| timeline | → cinematic 阶段子视图 ② | TimelineView（已有，Phase 3 再改可编辑） |
| health | → qa 阶段子视图 ① | HealthView（已有） |
| versions (VersionScreen) | → release 阶段子视图 ② + 工具栏模态 | VersionScreen（暗色覆盖） |
| assets (AssetLibraryScreen) | → asset 阶段子视图 ① | AssetLibraryScreen（已去 mock） |
| industry-assets (AssetsScreen) | **合并** → asset 阶段资产库筛选 | 合并到 AssetLibraryScreen |
| publish (PublishScreen) | → release 阶段子视图 ① | PublishScreen（暗色覆盖） |
| pipeline-viz (PipelineScreen) | **删除** | 功能由管线进度条替代 |
| workflow (WorkflowEditorView) | **删除** | 功能由管线进度条+对话驱动替代 |
| collab (CollabScreen) | → 工具栏图标模态 | CollabScreen（暗色覆盖） |
| my-works (MyWorksScreen) | → 工具栏图标模态 | MyWorksScreen（暗色覆盖） |

**结果**：22 个 flat tab → 8 个管线阶段（每阶段 2-4 个子视图）+ 3 个管理入口模态

***

## 七、验证步骤

### 7.1 Phase 1 补漏验证

- 确认 `ParseScreen.tsx` 的 STEPS 硬编码问题在 Phase 3 删除 pipeline tab 后自然消失
- `bun run lint` — 0 警告
- `bun run build` — 成功

### 7.2 Phase 2 验证

- `bun run lint` — 0 警告
- `bun run build` — 成功
- 手动验证：
  - PropsView：添加/编辑/删除都能持久化
  - ScenesView：添加/删除都能持久化
  - CinematicView：添加/删除都能持久化
  - 所有视图空数据时显示引导提示

### 7.3 Phase 3 验证

- `bun run lint` — 0 警告
- `bun run build` — 成功
- E2E 测试（Playwright）：
  - 访问 /studio，看到 8 阶段管线进度条（不再是 22 tab）
  - 当前阶段高亮，未解锁阶段灰色不可点击
  - 画布显示当前阶段的子视图
  - 子 tab 切换正常（每阶段 2-4 个）
  - 阶段切换时对话流显示产出物清单消息
  - 阶段完成时对话流显示"进入下一步"提示消息
  - 工具栏项目名右侧显示轻量统计文本（角色/场景/节点数）
  - **无任何折叠/展开 UI**
  - 管理入口（作品/协作/版本）通过工具栏图标打开模态
  - 暗色主题统一，无白色背景

***

## 八、假设与决策

1. **决策**：Phase 1 遗漏的 ParseScreen STEPS 硬编码不单独修复，由 Phase 3 删除 pipeline tab 自然解决
2. **决策**：不新增右侧上下文面板，保持两列布局（对话区+画布区）
3. **决策**：总览/阶段产出物功能通过工具栏常驻显示 + 对话消息流式呈现，**不使用任何折叠/展开 UI**
4. **决策**：管理类功能（作品/协作/版本）不作为管线阶段，工具栏图标触发模态弹窗
5. **决策**：旧 Screen 暗色主题先用 CSS 覆盖层快速统一，后续迭代再重写为原生暗色组件
6. **假设**：`usePipelineStore` 的 8 阶段定义符合用户预期的工作流
7. **假设**：用户接受"阶段+对话双驱动"模型 — 管线进度条引导 + 对话区自动推进
8. **决策**：Phase 2 暂不改造 TimelineView 为可编辑，Phase 3 重写 cinematic 阶段时再处理
9. **决策**：industry-assets 合并到 asset 阶段的 AssetLibraryScreen（作为筛选选项），不单独存在
