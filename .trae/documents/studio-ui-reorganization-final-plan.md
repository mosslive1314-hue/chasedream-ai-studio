# Studio UI 工作流重组 — 最终执行计划

> 本计划基于 Phase 1（已完成）的 store 层基础，执行 Phase 2（前端 CRUD 补全）剩余部分 + Phase 3（22 tab → 8 阶段工作流重组）。
>
> **硬约束（用户明确要求，不可违反）：**
> 1. ❌ 不允许任何折叠/展开 UI（无 collapsed state、无 ChevronUp/ChevronDown、无点击展开面板）
> 2. ❌ 不允许右侧上下文面板（当前是两栏布局：左对话 + 右画布，保持不变）
> 3. ❌ 不允许 mock/硬编码数据（所有功能走真实 store）
> 4. ✅ 22 tab → 8 阶段，门禁式锁定，阶段完成后手动确认进入下一阶段
> 5. ✅ 阶段信息通过「工具栏常驻进度条」+「画布顶部单行状态条」+「对话流系统消息」呈现，全部不折叠

---

## 一、当前状态分析（Phase 1 探索结果）

### 1.1 已完成（Phase 1 + Phase 2 部分）

| 项目 | 状态 | 证据 |
|---|---|---|
| store 层 CRUD（removeProp/removeScene/removeCinematicDirection/addCinematicDirection/updateCinematicDirection） | ✅ 全部就绪 | `use-narrative-store.ts` 第 252-265 行接口、第 578-644 行实现 |
| usePipelineStore 8 阶段定义 | ✅ 就绪 | `use-pipeline-store.ts` STAGE_DEFS 第 35-185 行，advance() 第 266-280 行，isStageComplete() 第 367-378 行 |
| chat-panel 管线集成 | ✅ 就绪 | `chat-panel.tsx` 已有 syncNarrativeToPipeline（157-214 行）、checkStageAdvancement（243-262 行）、isStageComplete 调用（329/452 行） |
| PropsView 编辑/删除/空数据引导 | ✅ 完成 | `canvas-area.tsx` 第 1986-2210 行 |
| ScenesView 删除/空数据引导 | ✅ 完成 | `canvas-area.tsx` 第 838-992 行 |
| AI 工具系统 68 个工具 | ✅ 就绪 | `tool-registry.ts` |
| collab store 真实持久化 | ✅ 就绪 | `use-collab-store.ts` |

### 1.2 待完成（本计划范围）

**Phase 2 剩余（前端 CRUD UI 补全）：**
- CinematicView 缺删除按钮 + 空数据引导弱（第 995-1236 行，store 方法已就绪但 UI 未接入）
- TimelineView 空数据引导极简（第 679-721 行，仅"暂无节点"一行）
- CharactersView 空数据引导弱（第 724-835 行，仅"暂无角色"一行）
- MoralView 行为历史空状态弱（第 1783-1909 行）
- HealthView 无空状态引导（第 1266-1441 行）

**Phase 3（22 tab → 8 阶段重组）：**
- studio-toolbar.tsx 22 tab → 8 阶段进度条（第 35-64 行 22 个 tab 定义）
- canvas-area.tsx 阶段子视图切换（第 2302-2334 行 switch 逻辑）
- studio-layout.tsx activeTab 联动 currentStage（第 74 行默认 "preview"）
- 新建 pipeline-progress.tsx 进度条组件
- 新建管理入口模态（collab/my-works/versions）
- 暗色主题统一
- 修复 WorkflowEditorView 状态值 bug（第 2229-2238 行用了 store 不存在的 running/failed 状态）

---

## 二、22 tab → 8 阶段映射表

### 2.1 阶段视图映射

| 阶段 | 阶段名 | 画布子视图（用户可切换） | 来源 tab | 完成条件（isStageComplete） |
|---|---|---|---|---|
| entry | 创作起点 | 剧本（script）+ 预览（preview） | script, preview | storyOutline 非空 |
| narrative | 叙事构建 | 角色（characters）+ 场景（scenes）+ 道具（props）+ 关系（relationships）+ 道德（moral） | characters, scenes, props, relationships, moral | characters/scenes/props/script 非空 |
| interaction | 互动设计 | 节点图（graph）+ 互动设计（interaction）+ 时间线（timeline） | graph, interaction, timeline | nodeGraph/choices/variables/endings 非空 |
| cinematic | 演出设计 | 镜头（cinematic） | cinematic | cinematicDirections 非空 |
| asset | 资产生成 | 资产库（assets） | assets | assetList 非空 |
| qa | 质量校验 | 健康度（health） | health | qaReport 非空 |
| preview | 预览试玩 | 预览（preview） | preview（复用） | 无（手动确认） |
| release | 发布导出 | 发布（publish） | publish | 无（手动确认） |

### 2.2 删除的 tab（5 个）

| tab | 原因 | 替代方案 |
|---|---|---|
| pipeline（AI管线） | 与 8 阶段进度条重复 | 工具栏进度条 |
| story（故事总览） | 与 entry 阶段剧本视图重复 | 故事大纲融入 script 视图顶部只读区 |
| pipeline-viz（管线可视化） | 与 8 阶段进度条重复 | 工具栏进度条 |
| workflow（工作流） | 与 8 阶段进度条重复 + 状态值 bug | 工具栏进度条 |
| industry-assets（行业资产） | 与 assets 重复 | 合并到 assets 视图 |

### 2.3 移到工具栏图标模态（3 个）

| tab | 工具栏图标 | 模态内容 |
|---|---|---|
| collab（协作） | Users 图标 | 嵌入 CollabScreen |
| my-works（作品） | FolderOpen 图标 | 嵌入 MyWorksScreen |
| versions（版本） | Save 图标 | 嵌入 VersionScreen |

### 2.4 保留并归入阶段的 tab（14 个）

script, preview, characters, scenes, props, relationships, moral, graph, interaction, timeline, cinematic, assets, health, publish

**验证：14（保留）+ 5（删除）+ 3（工具栏）= 22 ✅**

---

## 三、Phase 2 剩余：前端 CRUD UI 补全

### 3.1 Phase 2.3 — CinematicView 补全删除 + 空数据引导

**文件：** `src/components/studio/canvas-area.tsx` 第 995-1236 行

**改动：**
1. 在 CinematicView 函数顶部从 store 解构 `removeCinematicDirection`（store 已有，第 640-644 行实现，按 `nodeId` 过滤）
2. 新增 `deleteTarget` state（`{ nodeId: string; label: string } | null`）
3. 在详情视图头部（当前显示节点 label + Camera 图标的位置）右侧添加 Trash2 删除按钮
4. 新增删除确认对话框（复用 PropsView/ScenesView 的模式：AlertTriangle 图标 + 确认/取消按钮）
5. `confirmDelete()` 调用 `removeCinematicDirection(deleteTarget.nodeId)`，清空 selectedId
6. 改进空数据引导：
   - 列表空：Film 图标 + "暂无镜头指导" + "通过对话让 AI 为每个节点设计镜头"
   - 详情空：Film 图标 + "选择左侧节点查看镜头指导" + "或通过对话让 AI 批量生成"

**注意：** `removeCinematicDirection` 的参数是 `nodeId`（不是记录自身 id），因为 CinematicDirection 按 nodeId 一对一关联。

### 3.2 Phase 2.4 — TimelineView 空数据引导

**文件：** `src/components/studio/canvas-area.tsx` 第 679-721 行

**改动：**
- 当前第 696 行仅 `"暂无节点"` 一行文本
- 改为：Clapperboard 图标 + "暂无时间线节点" + "在「节点图」中创建分支节点后，时间线将自动显示"

### 3.3 Phase 2.5 — 其他视图空数据引导

**文件：** `src/components/studio/canvas-area.tsx`

**3.3.1 CharactersView（第 724-835 行）：**
- 当前第 746 行仅 `"暂无角色"`
- 改为：Users 图标 + "暂无角色" + "通过对话让 AI 基于剧本创建角色"

**3.3.2 MoralView（第 1783-1909 行）：**
- 当前第 1862 行 `"暂无道德行为记录"`
- 改为：Scale 图标 + "暂无道德行为记录" + "当玩家在互动中做出道德选择后，行为记录将出现在这里"

**3.3.3 HealthView（第 1266-1441 行）：**
- 当前无空状态引导（数据为 0 也显示 0 分）
- 在健康度评分区域上方添加常驻提示：Heart 图标 + "健康度评分基于当前项目数据自动计算" （单行，非空状态，仅作说明）
- 不做"空数据"分支，因为健康度始终有值（0 也是有效值）

**3.3.4 RelationshipsView（第 1475-1682 行）：**
- 已有良好空状态引导（Users 图标 + 提示文案）✅ 无需改动

---

## 四、Phase 3：22 tab → 8 阶段工作流重组

### 4.1 Phase 3.1 — 新建 pipeline-progress.tsx 进度条组件

**新文件：** `src/components/studio/pipeline-progress.tsx`

**职责：** 在工具栏显示 8 阶段进度条 + "完成本阶段"按钮

**组件结构（无折叠，常驻显示）：**
```tsx
export function PipelineProgress() {
  const currentStage = usePipelineStore(s => s.currentStage);
  const stageStatuses = usePipelineStore(s => s.stageStatuses);
  const advance = usePipelineStore(s => s.advance);
  const isStageComplete = usePipelineStore(s => s.isStageComplete);

  // 单行水平排列：8 个阶段点 + 连接线 + 右侧"完成本阶段"按钮
  return (
    <div className="flex items-center gap-1">
      {STAGE_DEFS.map((stage, idx) => (
        <div key={stage.id} className="flex items-center">
          <StageDot
            status={stageStatuses[stage.id]}  // pending/active/complete
            label={stage.label}
            isCurrent={stage.id === currentStage}
          />
          {idx < STAGE_DEFS.length - 1 && <Connector />}
        </div>
      ))}
      <CompleteButton
        disabled={!isStageComplete()}
        onClick={() => {
          const next = advance();
          // 通过 store 触发对话流系统消息（在 chat-panel 中监听 currentStage 变化）
        }}
      />
    </div>
  );
}
```

**视觉规则（暗色主题）：**
- pending（未开始）：zinc-700 圆点 + zinc-500 文字
- active（当前）：blue-500 圆点 + 脉冲动画 + blue-400 文字
- complete（已完成）：emerald-500 圆点 + Check 图标 + emerald-400 文字
- 连接线：已完成段 emerald-600，未完成段 zinc-700
- "完成本阶段"按钮：isStageComplete() 为 true 时 emerald-600 可点击，否则 zinc-800 禁用

**阶段点交互：** 点击已完成的阶段点可回看（切换 activeTab 到该阶段的默认子视图），但不改变 currentStage（只读回看，不回退进度）。

### 4.2 Phase 3.2 — 重构 studio-toolbar.tsx

**文件：** `src/components/studio/studio-toolbar.tsx`（当前 232 行）

**改动：**

1. **删除 22 tab 定义**（第 35-64 行的 `TAB_GROUPS` / `TABS` 数组）
2. **删除 TabGroup 分组逻辑**（第 21-27 行、第 167-174 行 showSeparator）
3. **删除中间 tab 切换区域**，替换为 `<PipelineProgress />` 组件
4. **右侧添加 3 个管理图标按钮**（在现有 4 个面板触发按钮之前）：
   - Users 图标 → 打开协作模态
   - FolderOpen 图标 → 打开作品模态
   - Save 图标 → 打开版本模态
5. **更新 ViewTab 类型**：从 22 个字面量联合类型改为阶段子视图类型

**新 ViewTab 类型定义：**
```ts
export type ViewTab =
  // entry 阶段
  | "script" | "preview"
  // narrative 阶段
  | "characters" | "scenes" | "props" | "relationships" | "moral"
  // interaction 阶段
  | "graph" | "interaction" | "timeline"
  // cinematic 阶段
  | "cinematic"
  // asset 阶段
  | "assets"
  // qa 阶段
  | "health"
  // release 阶段
  | "publish";
```

**新工具栏布局（单行，无折叠）：**
```
[项目名 + 保存状态] | [8 阶段进度条 + 完成本阶段按钮] | [协作][作品][版本] [音频][样式][导出][设置]
```

### 4.3 Phase 3.3 — 重构 canvas-area.tsx 阶段子视图切换

**文件：** `src/components/studio/canvas-area.tsx`（当前 2334 行）

**改动：**

1. **删除以下视图分支**（第 2319-2331 行）：
   - `activeTab === "workflow"` → 删除（WorkflowEditorView 不再需要，由进度条替代）
   - `activeTab === "pipeline"` → 删除（ParseScreen 由进度条替代）
   - `activeTab === "story"` → 删除（StoryOverviewScreen 融入 script 视图）
   - `activeTab === "pipeline-viz"` → 删除（PipelineScreen 由进度条替代）
   - `activeTab === "industry-assets"` → 删除（合并到 assets）
   - `activeTab === "collab"` → 删除（移到工具栏模态）
   - `activeTab === "my-works"` → 删除（移到工具栏模态）
   - `activeTab === "versions"` → 删除（移到工具栏模态）

2. **删除对应 import**（第 33-43 行）：
   - 删除 ParseScreen、StoryOverviewScreen、PipelineScreen、CollabScreen、MyWorksScreen、VersionScreen、AssetsScreen 的 import
   - 保留 ScriptScreen、InteractionScreen、AssetLibraryScreen、PublishScreen 的 import（仍用于嵌入）

3. **删除 WorkflowEditorView 函数**（第 2212-2300 行附近）及其 STAGES 数组（第 2219-2225 行，这是另一个 hardcoded STEPS，与 use-pipeline-store 重复）

4. **新增画布顶部状态条**（常驻单行，非折叠）：
   ```tsx
   function CanvasStageBar() {
     const currentStage = usePipelineStore(s => s.currentStage);
     const stageDef = STAGE_DEFS.find(s => s.id === currentStage)!;
     const characters = useNarrativeStore(s => s.characters);
     const scenes = useNarrativeStore(s => s.scenes);
     // ... 根据阶段显示对应产出计数
     return (
       <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-2 text-sm text-zinc-400">
         <span className="text-zinc-200 font-medium">{stageDef.label}</span>
         <span>{stageDef.description}</span>
         <span className="text-zinc-500">|</span>
         {/* 根据阶段显示产出计数 */}
         {currentStage === "narrative" && (
           <span>角色 {characters.length} · 场景 {scenes.length} · ...</span>
         )}
       </div>
     );
   }
   ```

5. **CanvasArea 渲染结构更新：**
   ```tsx
   export function CanvasArea({ activeTab, ... }) {
     return (
       <div className="relative flex h-full flex-col bg-zinc-950">
         <CanvasStageBar />  {/* 常驻顶部状态条 */}
         <div className="relative min-h-0 flex-1">
           {/* 阶段子视图切换 */}
           {activeTab === "script" && <ScreenEmbedView><ScriptScreen /></ScreenEmbedView>}
           {activeTab === "preview" && <PreviewView />}
           {/* ... 其他视图 */}
         </div>
       </div>
     );
   }
   ```

6. **删除 ROUTE_TO_TAB 映射**（第 1917-1925 行附近）—— 旧路由跳转逻辑不再需要

### 4.4 Phase 3.4 — 重构 studio-layout.tsx 状态管理升级

**文件：** `src/components/studio/studio-layout.tsx`（当前 155 行）

**改动：**

1. **activeTab 默认值改为与 currentStage 联动：**
   ```tsx
   const currentStage = usePipelineStore(s => s.currentStage);
   const [activeTab, setActiveTab] = useState<ViewTab>("script");  // entry 阶段默认

   // 当 currentStage 变化时，自动切换到该阶段的默认子视图
   useEffect(() => {
     const stageDefaultTab: Record<PipelineStageId, ViewTab> = {
       entry: "script",
       narrative: "characters",
       interaction: "graph",
       cinematic: "cinematic",
       asset: "assets",
       qa: "health",
       preview: "preview",
       release: "publish",
     };
     setActiveTab(stageDefaultTab[currentStage]);
   }, [currentStage]);
   ```

2. **新增管理模态状态：**
   ```tsx
   const [manageModal, setManageModal] = useState<null | "collab" | "my-works" | "versions">(null);
   ```
   并将 `setManageModal` 传递给 StudioToolbar，将 `manageModal` + `setManageModal` 传递给管理模态组件。

3. **布局结构保持两栏不变**（左对话 42% + 右画布 flex-1），不添加右侧上下文面板。

### 4.5 Phase 3.5 — 重构 chat-panel.tsx 阶段产出物作为对话消息

**文件：** `src/components/studio/chat-panel.tsx`（当前 603 行）

**改动：**

1. **监听 currentStage 变化，发送阶段切换系统消息：**
   ```tsx
   const prevStageRef = useRef(currentStage);
   useEffect(() => {
     if (prevStageRef.current !== currentStage) {
       const prevDef = STAGE_DEFS.find(s => s.id === prevStageRef.current)!;
       const newDef = STAGE_DEFS.find(s => s.id === currentStage)!;
       // 发送系统消息到对话流
       setMessages(prev => [...prev, {
         id: `stage-${Date.now()}`,
         role: "system",
         content: `✓ 已完成「${prevDef.label}」阶段\n\n本阶段产出：\n${formatStageOutputs(prevStageRef.current)}\n\n▶ 进入「${newDef.label}」阶段\n${newDef.instructions}`,
         timestamp: Date.now(),
       }]);
       prevStageRef.current = currentStage;
     }
   }, [currentStage]);
   ```

2. **新增 formatStageOutputs 辅助函数：** 根据 stageId 从 store 读取对应产出物并格式化为清单文本（如"角色 5 个：张三、李四..."）。

3. **不添加任何折叠 UI**（确认当前 chat-panel 无 collapsed state，保持不变）。

4. **保留现有的 checkStageAdvancement 关键词检测**（第 243-262 行）—— 用户在对话中说"下一阶段"仍可触发 advance()，与工具栏按钮互补。

### 4.6 Phase 3.6 — 新建管理入口模态组件

**新文件：** `src/components/studio/manage-modal.tsx`

**职责：** 统一承载 collab/my-works/versions 三个管理功能的模态对话框

**组件结构：**
```tsx
interface ManageModalProps {
  type: "collab" | "my-works" | "versions" | null;
  onClose: () => void;
}

export function ManageModal({ type, onClose }: ManageModalProps) {
  if (!type) return null;
  const config = {
    collab: { title: "协作管理", component: <CollabScreen /> },
    "my-works": { title: "我的作品", component: <MyWorksScreen /> },
    versions: { title: "版本管理", component: <VersionScreen /> },
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex h-[80vh] w-[80vw] flex-col rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-medium text-zinc-100">{config.title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {config.component}
        </div>
      </div>
    </div>
  );
}
```

**import 来源：** 从 `canvas-area.tsx` 中移出 CollabScreen/MyWorksScreen/VersionScreen 的 import 到此文件。

### 4.7 Phase 3.7 — 暗色主题统一

**文件：** `src/components/studio/canvas-area.tsx` + 嵌入的旧 Screen 组件

**改动：**

1. **ScreenEmbedView 添加暗色背景包装**（确保嵌入的旧 Screen 在暗色环境下可读）：
   ```tsx
   function ScreenEmbedView({ children, onTabChange }: { children: ReactNode; onTabChange?: (tab: ViewTab) => void }) {
     return (
       <div className="h-full overflow-auto bg-zinc-950 text-zinc-200">
         <div className="min-h-full [&_*]:max-w-none" data-theme="dark">
           {children}
         </div>
       </div>
     );
   }
   ```

2. **检查嵌入的旧 Screen 组件**（ScriptScreen/InteractionScreen/AssetLibraryScreen/PublishScreen）是否有白色背景硬编码，若有则通过 CSS 覆盖为暗色：
   - 在 ScreenEmbedView 包装层添加 `[&_.bg-white]:bg-zinc-900` 等 Tailwind 任意值选择器
   - 或在 globals.css 添加 `.studio-embed [data-theme="dark"]` 作用域样式

3. **不修改旧 Screen 组件源文件**（保留其独立性，通过包装层适配主题）

### 4.8 Phase 3.8 — 修复 WorkflowEditorView 状态值 bug（随删除一并解决）

**说明：** WorkflowEditorView（第 2212-2300 行）使用了 store 中不存在的 `running/failed` 状态值（第 2229-2238 行 STATUS_COLORS）。Phase 3.3 中删除 WorkflowEditorView 函数后，此 bug 自然消失，无需单独修复。

---

## 五、执行顺序

按依赖关系排序，必须严格按顺序执行：

| 步骤 | 任务 | 依赖 | 文件 |
|---|---|---|---|
| 1 | Phase 2.3 CinematicView 删除 + 空数据引导 | 无 | canvas-area.tsx |
| 2 | Phase 2.4 TimelineView 空数据引导 | 无 | canvas-area.tsx |
| 3 | Phase 2.5 其他视图空数据引导 | 无 | canvas-area.tsx |
| 4 | Phase 3.1 新建 pipeline-progress.tsx | 无 | 新文件 |
| 5 | Phase 3.6 新建 manage-modal.tsx | 无 | 新文件 |
| 6 | Phase 3.2 重构 studio-toolbar.tsx | 步骤 4 | studio-toolbar.tsx |
| 7 | Phase 3.3 重构 canvas-area.tsx | 步骤 5 | canvas-area.tsx |
| 8 | Phase 3.4 重构 studio-layout.tsx | 步骤 6,7 | studio-layout.tsx |
| 9 | Phase 3.5 重构 chat-panel.tsx | 步骤 7 | chat-panel.tsx |
| 10 | Phase 3.7 暗色主题统一 | 步骤 7 | canvas-area.tsx + globals.css |
| 11 | 最终验证 lint + build | 全部 | - |

---

## 六、假设与决策

### 6.1 假设

1. **store 层方法全部就绪** —— Phase 1 探索已确认 removeProp/removeScene/removeCinematicDirection/addCinematicDirection/updateCinematicDirection 全部实现，无需新增 store 方法。
2. **chat-panel 管线集成完整** —— syncNarrativeToPipeline/checkStageAdvancement/isStageComplete 已存在，Phase 3.5 仅需新增阶段切换系统消息。
3. **旧 Screen 组件功能完整** —— ScriptScreen/InteractionScreen/AssetLibraryScreen/PublishScreen/CollabScreen/MyWorksScreen/VersionScreen 保留嵌入使用，不重写。
4. **preview 视图复用** —— entry 阶段和 preview 阶段都用 preview 视图，entry 阶段是实时反馈，preview 阶段是完整试玩，UI 上是同一个组件。

### 6.2 决策

1. **不添加右侧上下文面板** —— 保持两栏布局（左对话 42% + 右画布 flex-1），阶段信息通过工具栏进度条 + 画布顶部状态条 + 对话流消息呈现。
2. **不添加任何折叠/展开 UI** —— 所有信息要么常驻显示（工具栏、状态条），要么作为对话消息流入对话区。无 collapsed state、无 ChevronUp/ChevronDown、无点击展开面板。
3. **门禁式锁定实现** —— 工具栏进度条右侧"完成本阶段"按钮，仅当 isStageComplete() 为 true 时可点击。点击后调用 advance()，触发对话流系统消息。已完成阶段可点击回看（只读），但不回退进度。
4. **删除 5 个 tab** —— pipeline/story/pipeline-viz/workflow/industry-assets，功能由 8 阶段进度条或合并到其他视图替代。
5. **3 个 tab 移到工具栏模态** —— collab/my-works/versions，通过工具栏图标打开全屏模态。
6. **activeTab 联动 currentStage** —— 阶段切换时自动切换到该阶段默认子视图，用户仍可在阶段内手动切换子视图。
7. **暗色主题通过包装层适配** —— 不修改旧 Screen 源文件，通过 ScreenEmbedView 包装层 + CSS 任意值选择器强制暗色。

---

## 七、验证步骤

### 7.1 Phase 2 验证

- [ ] CinematicView：选中节点 → 点击删除按钮 → 确认对话框 → 节点镜头指导被移除
- [ ] CinematicView：无镜头指导时显示 Film 图标 + 引导文案
- [ ] TimelineView：无节点时显示 Clapperboard 图标 + 引导文案
- [ ] CharactersView：无角色时显示 Users 图标 + 引导文案
- [ ] MoralView：无行为记录时显示 Scale 图标 + 引导文案

### 7.2 Phase 3 验证

- [ ] 工具栏显示 8 阶段进度条，当前阶段蓝色脉冲，已完成阶段绿色 ✓
- [ ] 工具栏右侧"完成本阶段"按钮在 isStageComplete() 为 false 时禁用
- [ ] 点击"完成本阶段"按钮 → 阶段前进 → 对话流出现系统消息
- [ ] 工具栏右侧 3 个管理图标（协作/作品/版本）点击打开模态
- [ ] 画布顶部状态条常驻显示当前阶段名 + 产出计数（单行，不折叠）
- [ ] activeTab 随 currentStage 自动切换到阶段默认子视图
- [ ] 22 tab 不再出现，工具栏只有进度条 + 管理图标 + 面板触发按钮
- [ ] 无任何折叠/展开 UI（全局搜索 collapsed/ChevronUp/ChevronDown 应无结果）
- [ ] 嵌入的旧 Screen 在暗色主题下可读（无白色背景突兀）

### 7.3 最终验证

- [ ] `bun run lint` 通过
- [ ] `bun run build` 通过
- [ ] 手动测试完整工作流：entry → narrative → interaction → cinematic → asset → qa → preview → release，每阶段完成后能锁定并进入下一阶段
