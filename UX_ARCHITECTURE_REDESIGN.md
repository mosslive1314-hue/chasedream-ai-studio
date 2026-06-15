# 逐梦 Creator Studio — 用户体验架构重设计

> **ArchitectUX 架构审计** | 2026-06-15 | 基于全量代码审查 + 已有文档分析

---

## 一、诊断：当前 UX 架构的根本问题

### 1.1 核心矛盾

**当前产品是一个高保真静态原型，而非可运行的真实工具。**

所有 12 个页面都是 `studio-data.ts` 静态种子数据的并行消费者。没有任何页面真正"生产"数据供下游使用。用户在 A 页面的操作对 B 页面完全不可见。

| 指标 | 当前值 | 健康值 | 差距级别 |
|------|--------|--------|----------|
| 页面间真实数据传递 | 0 处 | ≥10 处 | **致命** |
| Store actions 被实际调用 | ~5% | ≥80% | **严重** |
| 编辑操作持久化 | 0 处 | 全部 | **致命** |
| AI 模型路由(N-01~N-18)接入 | 0% | ≥60% | **严重** |
| 导航分组与数据流一致性 | 错位 | 完全对齐 | **中等** |
| 页面间衔接引导 | 0 处 | 每页 ≥1 | **中等** |

### 1.2 六大 UX 断点详解

```
断点1 — ParseScreen → Store 写入缺失
  现状: "应用到工作台"按钮只执行 router.push("/script")
  影响: AI 解构出的角色/场景/道具/世界观不会传递给任何下游页面
  修复: 按钮应调用 narrativeStore.addCharacter/addScene/addProp 写入数据

断点2 — ScriptScreen → Store 写入缺失
  现状: 所有编辑操作只改本地 useState，不持久化
  影响: 剧本修改刷新即丢失，不会反映到互动设计或节点图谱
  修复: 编辑操作应实时更新 scriptBlocks/chapterPlans 到 narrativeStore

断点3 — InteractionScreen 纯只读
  现状: 只能浏览互动点、后果链、统计数据
  影响: 无法编辑互动点、无法标记已测试状态
  修复: 接入 updateInteractionPoint/createInteractionPoint 等 store actions

断点4 — NodesScreen Store actions 未调用
  现状: addNode/removeNode/addEdge/removeEdge 存在但从未被页面调用
  影响: 节点图不可编辑，是静态展示
  修复: Canvas 编辑操作应调用对应 store actions

断点5 — CinematicEditorScreen 纯只读
  现状: 5 个分区全部只读展示
  影响: 演出方向无法修改
  修复: 新增 updateCinematicDirection store action + 接入编辑 UI

断点6 — 资产生成与管理完全缺失
  现状: AI 模型路由定义了 N-04~N-07 但前端无任何 UI 入口
  影响: 互动影游最核心的视觉/音频内容无法产出
  修复: 新建资产工坊页面 (AssetWorkshopScreen)
```

### 1.3 导航架构问题

| 问题 | 现状 | 应有状态 |
|------|------|----------|
| 演出设计分组 | 放在"设计"组，与互动设计并列 | 应在"交付"组，因为它依赖节点图谱作为输入 |
| ParseScreen 跳转 | "应用到工作台"跳转到 /overview | 应跳转到 /script（创作流程的下一步） |
| 管线导航位置 | 藏在底部工具区 | 应在侧边栏顶部，作为全局进度指示器 |
| 4 个孤儿路由 | /node-canvas, /debugger, /qte-editor, /playt 无导航入口 | 应合并到对应父页面 |
| 移动端导航 | 底部只显示 5 个页面 | 应支持全部页面访问 |

---

## 二、目标架构：四阶段流水线 + 数据闭环

### 2.1 核心设计原则

1. **数据驱动导航**：页面分组严格对齐数据生产链路，而非功能类别
2. **每一步都产出**：用户离开任何页面时，Store 中必定多了一些数据
3. **自然过渡引导**：每个页面底部/右上角有明确的"下一步"引导
4. **AI 嵌入流程**：AI 不是独立工具，而是嵌入到每个创作步骤中的加速器
5. **进度可见**：用户始终知道"我在哪一步、整体进度如何"

### 2.2 重设计的信息架构

```
┌─────────────────────────────────────────────────────────────┐
│  阶段1: 创作 (Creation) — 把故事"写出来"                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 剧本总览     │→ │ 剧本解析     │→ │ 剧本编辑     │          │
│  │ /story-overview│  │ /parse      │  │ /script     │          │
│  │              │  │              │  │              │          │
│  │ 产出:        │  │ 产出:        │  │ 产出:        │          │
│  │ 项目骨架     │  │ 角色+场景    │  │ 剧本块+     │          │
│  │ 章节规划     │  │ 道具+世界观  │  │ 对白+指令    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  阶段2: 设计 (Design) — 把故事"结构化"                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 互动设计     │→ │ 节点图谱     │→ │ 资产工坊 ★  │          │
│  │ /interaction│  │ /nodes      │  │ /asset-workshop│        │
│  │              │  │              │  │ (新页面!)    │          │
│  │ 产出:        │  │ 产出:        │  │ 产出:        │          │
│  │ 互动点+后果  │  │ DAG+变量    │  │ 图片+BGM    │          │
│  │ 链+QTE      │  │ +条件边      │  │ 配音+视频    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  阶段3: 交付 (Delivery) — 把故事"跑起来"                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 演出设计 ★  │→ │ 演出预览     │→ │ 质检总览     │→ 发布   │
│  │ /cinematic  │  │ /simulator  │  │ /overview    │ /publish│
│  │ (移入交付组) │  │              │  │              │          │
│  │              │  │ 产出:        │  │ 产出:        │          │
│  │ 产出:        │  │ 路径测试    │  │ 实时质检     │          │
│  │ 镜头+表演    │  │ 覆盖率      │  │ (非seed)    │          │
│  │ +音频+转场   │  │              │  │              │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  贯穿全流程: AI 创作助手 (单 Agent 三模式)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 全局顾问     │  │ 页面助手     │  │ 执行者       │          │
│  │ 跨页面影响  │  │ 上下文感知  │  │ N-01~N-18  │          │
│  │ 创意讨论    │  │ 专项建议    │  │ + HITL确认  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 导航架构重设计

**当前问题**：4 个导航组（创作/设计/资产/交付）中的资产组有 5 个子项（4 个 tab + 资产库），过于臃肿。演出设计放在"设计"组但实际依赖节点图谱。

**新导航结构**：

```
┌─────────────────────────────────┐
│ 逐梦 Creator                    │ ← Logo
├─────────────────────────────────┤
│ ▼ 管线进度  [全局进度 69%]       │ ← 核心入口，可展开的管线导航
│   ① 项目创建    ✅              │
│   ② 素材解构    ✅              │
│   ③ 世界观      ✅              │
│   ④ 章纲规划    ✅ 85%          │
│   ⑤ 线性剧本    ✅              │
│   ⑥ 互动设计    🔵 65%          │ ← 当前阶段高亮
│   ⑦ 变量配置    🔵 50%          │
│   ⑧ 节点图谱    🔵 75%          │
│   ⑨ 资产生成    ⚪ 40%          │
│   ⑩ 演出预览    ⚪ 20%          │
│   ⑪ 质检修复    ⚪ 60%          │
│   ⑫ 发布导出    ⚪ 30%          │
├─────────────────────────────────┤
│ ▼ 创作                          │ ← 对应阶段 1-3
│   剧本总览                      │
│   剧本解析                      │
│   剧本编辑                      │
├─────────────────────────────────┤
│ ▼ 设计                          │ ← 对应阶段 4-6
│   互动设计                      │
│   节点图谱                      │
│   资产工坊 ★ (新页面)           │
├─────────────────────────────────┤
│ ▼ 交付                          │ ← 对应阶段 7-9
│   演出设计 ★ (从设计组移入)     │
│   演出预览                      │
│   质检总览                      │
│   发布                          │
├─────────────────────────────────┤
│ 📦 协作                         │ ← 工具区
│ 📋 版本管理                     │
│ ⚙ 设置                          │
│ 👤 用户                         │
└─────────────────────────────────┘
```

**核心改动**：

1. **管线导航提升到顶部**：不再藏在底部。用户打开工作台就能看到 12 步流水线 + 当前进度
2. **"资产库"升级为"资产工坊"**：从单纯的文件管理器变成具备 AI 生成能力的工作台
3. **演出设计移入"交付"组**：它是后期设计环节，依赖节点图作为输入
4. **资产 tab 不再单独占导航项**：/assets 的 4 个 tab 合并到资产工坊页面内部

---

## 三、页面间衔接设计 — 消灭断点的具体方案

### 3.1 衔接组件：NextStepBar

每个页面底部或右上角添加一个"下一步建议"导航条，基于当前数据状态动态显示。

**设计规格**：

```tsx
// 组件位置: src/components/ui/NextStepBar.tsx
// 在每个 Screen 组件底部渲染

interface NextStepProps {
  currentStage: string;
  completedStages: string[];
  nextStage: {
    label: string;
    href: string;
    description: string;
  } | null;
}

// 示例: 在 ParseScreen 底部
// "已完成素材解构 → 下一步: 剧本编辑 (编辑AI生成的剧本块和对白)"
// [前往剧本编辑 →]
```

### 3.2 每个页面的衔接修复

| 页面 | 当前跳转 | 修复后跳转 | 衔接文案 |
|------|----------|-----------|----------|
| ParseScreen "应用到工作台" | router.push("/overview") | 写入 Store → router.push("/script") | "角色和场景已导入，开始编辑剧本" |
| ScriptScreen | 无出口 | 新增"进入互动设计"按钮 → /interaction | "剧本就绪，设计互动选择点" |
| InteractionScreen | 无出口 | 新增"生成节点图谱"按钮 → /nodes | "互动点已定义，构建节点图" |
| NodesScreen | 无出口 | 新增"进入资产工坊"按钮 → /asset-workshop | "节点图完成，开始生成资产" |
| AssetWorkshop | (新页面) | "进入演出设计"按钮 → /cinematic | "资产就位，设计镜头和演出" |
| CinematicEditor | 无出口 | "演出预览"按钮 → /simulator | "演出设计完成，试玩验证" |
| Simulator | 无出口 | "查看质检报告"按钮 → /overview | "试玩完成，查看质检结果" |
| Overview | 无出口 | "修复问题"(返回编辑) 或 "准备发布" → /publish | 质检通过/未通过两种状态 |

### 3.3 数据流打通方案

```
核心数据链路 (按优先级排序):

P0-1: ParseScreen → narrativeStore 写入
  "应用到工作台"按钮:
  1. 调用 narrativeStore.addCharacter() × N
  2. 调用 narrativeStore.addScene() × N
  3. 调用 narrativeStore.addProp() × N
  4. 调用 narrativeStore.addWorldRule() × N
  5. 成功后 router.push("/script")

P0-2: ScriptScreen → narrativeStore 写入
  每个编辑操作:
  1. 调用 narrativeStore.updateScriptBlock(id, changes)
  2. 接入 useHistoryStore 记录操作
  3. 自动保存指示器实时更新

P0-3: InteractionScreen → narrativeStore 写入
  互动点编辑:
  1. 调用 narrativeStore.updateInteractionPoint(id, changes)
  2. 调用 narrativeStore.addInteractionPoint() 新增
  3. 后果链编辑调用 narrativeStore.updateConsequenceChain()

P0-4: NodesScreen → narrativeStore 写入
  Canvas 编辑:
  1. 拖拽创建节点 → narrativeStore.addNode()
  2. 连线 → narrativeStore.addEdge()
  3. 删除 → narrativeStore.removeNode()/removeEdge()
  4. 变量配置 → narrativeStore.addVariable()/updateVariable()

P1-1: CinematicEditor → narrativeStore 写入
  需新增 store action:
  1. narrativeStore.updateCinematicDirection(id, changes)
  2. narrativeStore.addCinematicDirection(data)

P1-2: OverviewScreen → 实时计算
  替换 seed 数据为实时计算:
  1. 结构维度: 从 storyNodes[] + nodeEdges[] 实时计算连通性
  2. 叙事维度: 调用 N-09 Content Moderator
  3. 资产维度: 从 assetCards[] 计算
  4. 互动维度: 从 interactionPoints[] + variables[] 计算
```

---

## 四、新页面设计：资产工坊 (AssetWorkshopScreen)

### 4.1 为什么需要这个页面

互动影游区别于纯文字互动小说的核心在于**每个节点需要场景图、角色立绘、BGM、音效、配音、视频片段**。AI 模型路由已经定义了 N-04（图片生成）、N-05（视频生成）、N-06（音频生成）、N-07（TTS 配音），但前端没有任何 UI 来触发和管理这些生成任务。

### 4.2 页面布局

```
┌──────────────────────────────────────────────────────────────┐
│ 资产工坊                                      [AI助手 Cmd+J] │
├─────────────┬────────────────────────────────────────────────┤
│ 节点资产     │  资产生成面板                                   │
│ 需求看板     │                                                │
│             │  ┌─────────────────────────────────────────┐   │
│ N01 开场     │  │ 场景图片生成                             │   │
│ ├ 🖼 缺失   │  │ 场景: 雨夜苏州河畔                        │   │
│ ├ 🎵 缺失   │  │ 风格: 赛博朋克+1930s                     │   │
│ └ 🎤 缺失   │  │ [AI生成] [从库选择] [上传]               │   │
│             │  └─────────────────────────────────────────┘   │
│ N02 对峙     │                                                │
│ ├ 🖼 缺失   │  ┌─────────────────────────────────────────┐   │
│ ├ 🎵 缺失   │  │ BGM 生成                                 │   │
│ └ 🎤 缺失   │  │ 情绪: 紧张+压抑                          │   │
│             │  │ 时长: 120s                               │   │
│ N03 抉择     │  │ [AI生成 N-06] [从库选择]                 │   │
│ ├ 🖼 ✅     │  └─────────────────────────────────────────┘   │
│ ├ 🎵 缺失   │                                                │
│ └ 🎤 缺失   │  ┌─────────────────────────────────────────┐   │
│             │  │ TTS 配音                                 │   │
│             │  │ 角色: 林墨 | 台词: "我们别无选择"          │   │
│             │  │ 声线: 低沉男声+压抑                       │   │
│             │  │ [AI生成 N-07] [从库选择]                  │   │
│             │  └─────────────────────────────────────────┘   │
└─────────────┴────────────────────────────────────────────────┘
```

### 4.3 核心功能清单

| 功能 | AI 模型 | 数据源 | 产出写入 |
|------|---------|--------|----------|
| 场景图片生成 | N-04 ImageGen | scenes[] + cinematicDirections[] | assetCards[] |
| 角色立绘生成 | N-04 ImageGen | characters[] + 外貌描述 | assetCards[] |
| BGM 生成 | N-06 AudioGen | emotionCurve + cinematic.audio | assetCards[] |
| 配音/TTS | N-07 TTS Voice | scriptBlocks[] + 角色声线 | assetCards[] |
| 视频片段 | N-05 VideoGen | cinematic 镜头描述 | assetCards[] |
| 资产绑定 | — | 选择 assetCard → 绑定到 storyNode | node.assetIds |

---

## 五、AI Agent 架构：单 Agent 三模式

### 5.1 为什么推荐单 Agent

1. AG-UI 协议已定义 16 种标准事件类型，足够处理所有交互场景
2. 两个 Agent 会造成对话上下文割裂 — 用户在"全局对话"中的决策，"局部 Agent"不知道
3. 互动影视创作的决策高度耦合 — 修改一个角色的性格可能影响 10 个节点的演出设计

### 5.2 三模式设计

```
┌─────────────────────────────────────────────┐
│           统一 AI 创作助手                     │
│                                             │
│  模式1: 全局顾问 (Consultant)                │
│  ├── 项目整体建议、创意方向讨论               │
│  ├── 跨页面的影响分析                        │
│  └── "这个角色的设定和第三章有矛盾吗？"        │
│                                             │
│  模式2: 页面助手 (Page Assistant)            │
│  ├── 自动感知当前页面，提供上下文建议          │
│  ├── 在剧本页 → 帮你写/改剧本                │
│  ├── 在节点图 → 帮你检查路径连通性            │
│  └── 在演出设计 → 推荐镜头和BGM方案           │
│                                             │
│  模式3: 执行者 (Executor)                    │
│  ├── 调用 AI 模型执行具体任务                 │
│  ├── "生成这个场景的背景图" → 调用 N-04       │
│  ├── "给这段对白配音" → 调用 N-07 TTS         │
│  └── 需要用户确认 (AG-UI HITL 流程)          │
└─────────────────────────────────────────────┘
```

### 5.3 前端实现

- **位置**：右侧抽屉面板，固定宽度 360px，不随页面切换而消失
- **触发**：Cmd+J 快捷键或顶部按钮
- **上下文**：面板顶部显示"当前：演出设计 > 第二章 > N04 对峙场景"
- **对话管理**：使用 `useCanvasAgentStore` 管理对话历史和 AG-UI 事件流
- **任务分发**：使用 `model-router.ts` 中的 12 种 AI 任务类型

---

## 六、用户旅程地图

### 6.1 新用户首次使用（"从零到第一个可玩场景"）

```
Step 1: 进入工作台 → 自动弹出 OnboardingWizard
Step 2: 选择行业（游戏/旅游/教育/衍生品）→ 全局术语切换
Step 3: 选择项目类型 → 从模板 or 导入小说 or 空白创建
Step 4: 进入 ParseScreen → 粘贴文本 → AI 10步解构
Step 5: 点击"应用到工作台" → 数据写入 Store → 自动跳转到 /script
Step 6: 在 ScriptScreen 编辑剧本块 → AI 辅助续写
Step 7: 点击"设计互动" → 进入 /interaction → 添加选择点
Step 8: 点击"构建图谱" → 进入 /nodes → 自动生成节点图
Step 9: 点击"生成资产" → 进入资产工坊 → AI 批量生成
Step 10: 点击"演出预览" → 在 /simulator 试玩第一个场景
```

### 6.2 老用户日常编辑

```
1. 从侧边栏顶部管线导航 → 一眼看到当前进度
2. 点击当前阶段 → 直接跳转到对应页面
3. 编辑数据 → 实时写入 Store → SaveIndicator 显示保存状态
4. AI 面板随时可用 → Cmd+J 唤出 → 上下文感知建议
5. Ctrl+Z/Y 撤销重做 → useHistoryStore 已接入
```

---

## 七、实施优先级与依赖关系

### 7.1 四轮迭代计划

```
第一轮 (1-2周): 打通数据流 — 产品生命线
  P0-1: ParseScreen → narrativeStore 写入 ← 无依赖
  P0-2: ScriptScreen → narrativeStore 写入 ← 依赖 P0-1
  P0-3: NodesScreen → narrativeStore 写入 ← 依赖 P0-2
  P0-4: InteractionScreen → narrativeStore 写入 ← 依赖 P0-2
  同步: 所有编辑操作接入 useHistoryStore 撤销/重做

第二轮 (2-3周): 接入 AI + Agent
  P1-1: 全局 Agent 面板组件 (单 Agent 三模式) ← 无依赖
  P1-2: ParseScreen AI 对话接入 N-18 通用模型 ← 依赖 P1-1
  P1-3: ScriptScreen AI 助手接入 N-01/N-08 ← 依赖 P1-1
  P1-4: 资产工坊页面新建 + N-04~07 接入 ← 依赖 P0-3

第三轮 (3-4周): 补全缺失功能
  P2-1: 导航分组调整 (演出设计移入交付组, 管线导航提升)
  P2-2: 每个页面添加 NextStepBar 衔接引导
  P2-3: OverviewScreen 质检引擎从 seed 改为实时计算
  P2-4: CinematicEditor 编辑能力 + 写入 Store
  P2-5: 空状态设计 (每个页面的空项目引导)

第四轮 (4-5周): UX 细节打磨
  P3-1: 孤儿路由整合 (/node-canvas→/nodes, /debugger→/simulator)
  P3-2: 移动端导航修复 (双层设计)
  P3-3: 跨页面数据验证和级联更新
  P3-4: WorkbenchHeader 精简
```

### 7.2 依赖关系图

```
P0-1 ──→ P0-2 ──→ P0-3 ──→ P1-4 (资产工坊)
  │         │         │
  │         └──→ P0-4 ─┘
  │
  └──→ P1-1 (Agent面板) ──→ P1-2 ──→ P1-3

P2-1~P2-5 依赖 P0-* 完成
P3-1~P3-4 依赖 P2-* 完成
```

---

## 八、开发者实施指南

### 8.1 文件变更清单

**新建文件**:
```
src/app/asset-workshop/page.tsx              ← 新页面
src/components/screens/AssetWorkshopScreen.tsx  ← 新 Screen
src/components/ui/NextStepBar.tsx              ← 衔接引导组件
src/components/asset-workshop/                 ← 资产工坊子组件
  node-asset-kanban.tsx                        ← 节点资产需求看板
  ai-generate-panel.tsx                        ← AI 批量生成面板
  asset-bind-panel.tsx                         ← 资产绑定面板
```

**修改文件**:
```
src/components/layout/navigation/nav-data.ts  ← 导航分组调整
src/components/screens/ParseScreen.tsx         ← 写入 Store + 跳转修复
src/components/screens/ScriptScreen.tsx        ← 编辑持久化
src/components/screens/InteractionScreen.tsx   ← 添加编辑能力
src/components/screens/NodesScreen.tsx         ← Store actions 接入
src/components/screens/CinematicEditorScreen.tsx ← 添加编辑能力
src/components/screens/OverviewScreen.tsx       ← 实时质检计算
src/store/narrative/core-actions.ts            ← 新增 updateCinematicDirection
```

### 8.2 关键代码模式

**ParseScreen "应用到工作台" — 修复前**:
```tsx
// 当前: 只跳转，不写入数据
const handleApply = () => {
  router.push("/script");
};
```

**ParseScreen "应用到工作台" — 修复后**:
```tsx
const narrativeStore = useNarrativeStore();
const handleApply = () => {
  // 将解构结果写入 Store
  parsedData.characters.forEach(c => narrativeStore.addCharacter(c));
  parsedData.scenes.forEach(s => narrativeStore.addScene(s));
  parsedData.props.forEach(p => narrativeStore.addProp(p));
  parsedData.worldRules.forEach(r => narrativeStore.addWorldRule(r));
  toast.success("已导入到工作台", { action: { label: "前往剧本编辑", onClick: () => router.push("/script") } });
};
```

**NextStepBar 通用组件**:
```tsx
// 根据 Store 数据状态动态计算下一步
const NEXT_STEP_MAP: Record<string, { label: string; href: string; check: (s: NarrativeStore) => boolean }> = {
  "/parse": { label: "编辑剧本", href: "/script", check: s => s.characters.length > 0 },
  "/script": { label: "设计互动", href: "/interaction", check: s => s.scriptBlocks.length > 0 },
  "/interaction": { label: "构建图谱", href: "/nodes", check: s => s.interactionPoints.length > 0 },
  "/nodes": { label: "生成资产", href: "/asset-workshop", check: s => s.storyNodes.length > 0 },
  "/asset-workshop": { label: "演出设计", href: "/cinematic", check: s => s.assetCards.length > 0 },
  "/cinematic": { label: "演出预览", href: "/simulator", check: s => s.cinematicDirections.length > 0 },
  "/simulator": { label: "查看质检", href: "/overview", check: s => s.pathTestResults.length > 0 },
  "/overview": { label: "准备发布", href: "/publish", check: s => s.qualityChecks.every(q => q.status === "pass") },
};
```

---

## 九、架构验证清单

改造完成后，以下用户旅程应能无断点走通：

- [ ] 新用户从 OnboardingWizard 创建项目 → 自动填充 NarrativeStore
- [ ] ParseScreen AI 解构 → "应用到工作台" → 数据写入 → 自动跳转到 ScriptScreen
- [ ] ScriptScreen 编辑剧本 → 修改实时持久化 → InteractionScreen 可读取
- [ ] InteractionScreen 编辑互动点 → NodesScreen 节点图基于互动点生成
- [ ] 资产工坊 AI 批量生成 → 绑定到节点 → Simulator 可预览
- [ ] OverviewScreen 质检分数基于真实数据计算（非 seed）
- [ ] 全局 Agent 面板 Cmd+J 可用，上下文自动感知当前页面
- [ ] 每个页面底部 NextStepBar 显示动态"下一步"建议
- [ ] 所有编辑操作 Ctrl+Z/Y 撤销重做可用

---

**ArchitectUX Agent** | 2026-06-15
**架构诊断完成** | 待实施：四轮迭代计划
**下一步**: 从 P0-1 (ParseScreen → Store 写入) 开始执行
