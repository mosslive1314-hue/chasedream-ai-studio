// Pipeline Orchestrator — 互动影游开发管线编排器
// 管线驱动多 Expert 协作：每个阶段自动激活对应 Expert，注入上一阶段产出作为上下文

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EXPERTS } from "@/lib/seed/expert-seed";
import type { Expert } from "@/lib/types/expert";

// ── 管线阶段定义 ──────────────────────────────────────────────

export type PipelineStageId =
  | "entry"       // 创作起点（导入 or 对话）
  | "narrative"   // 叙事构建（大纲/角色/场景/剧本）
  | "interaction" // 互动设计（分支/选择/变量/结局）
  | "cinematic"   // 演出设计（镜头/音频/分镜）
  | "asset"       // 资产生成（美术/音频/视频）
  | "qa"          // 质量校验
  | "preview"     // 预览试玩
  | "release";    // 发布导出

export type StageStatus = "pending" | "active" | "complete";

interface PipelineStageDef {
  id: PipelineStageId;
  label: string;
  expertId: string;
  description: string;
  // 该阶段 Expert 的专属指令（注入系统提示词，给 AI 看的工具操作指令）
  instructions: string;
  // 该阶段期望的产出（用于判断完成度）
  expectedOutputs: string[];
  // ── SOP：标准化作业流程（面向用户的引导） ──
  sop: {
    // 通俗开场白：AI 进入该阶段时对用户说的话（大白话解释为什么要做这一步）
    intro: string;
    // 预期用户输入
    expectedInput: string;
    // 预期产出
    expectedOutput: string;
    // 何时展示专业界面给高级用户
    proModeHint: string;
  };
}

// 管线阶段顺序定义 + Expert 映射 + 阶段指令
const STAGE_DEFS: PipelineStageDef[] = [
  {
    id: "entry",
    label: "创作起点",
    expertId: "expert-narrative",
    description: "导入已有内容或从创意开始",
    instructions: `你正在【创作起点】阶段。根据用户输入来源不同，采用不同策略：

A. 如果用户通过"+"导入了 DSL 脚本（.dfstory）：
   - DSL 编译器已自动生成节点图并写入 store
   - 你的任务：调用 set_story_outline 工具，基于生成的节点图总结一句故事大纲（主线标题 + 章节结构 + 结局数量）
   - 不要重复提取角色/场景/道具（DSL 编译器不产生这些，留空即可）

B. 如果用户粘贴了自然语言剧本/小说/创意：
   - 调用 set_story_outline 提取故事大纲（谁、想要什么、阻碍、结果）
   - 调用 add_character 逐个添加主要角色（姓名、定位、描述）
   - 调用 add_scene 逐个添加核心场景（名称、描述）
   - 调用 add_prop 逐个添加关键道具（名称、类型、描述、玩法效果）
   - 所有提取结果通过工具写入 store，系统会自动同步到管线上下文

C. 如果用户从空白起步：
   - 引导用户把一句话想法扩展为故事梗概（谁、想要什么、遇到什么阻碍、结果如何）
   - 调用 set_story_outline 写入大纲
   - 角色/场景/道具留给 narrative 阶段

完成后提示用户进入下一阶段：叙事构建`,
    expectedOutputs: ["storyOutline"],
    sop: {
      intro: `欢迎开始创作！首先我们需要一个故事起点。你有两种方式：

1. **导入已有内容**：点击左下角 + 按钮，上传剧本/小说文件（.txt/.md/.dfstory），系统自动解析
2. **从零开始**：告诉我你的创意想法（哪怕只是一句话），我帮你扩展成完整故事大纲

你想从哪里开始？`,
      expectedInput: "导入的剧本文件，或一句话创意想法",
      expectedOutput: "故事大纲（谁、想要什么、遇到什么阻碍、结果如何）",
      proModeHint: "用户主动要求查看章节规划/剧本分层结构时，展示 ScriptScreen 专业编辑器",
    },
  },
  {
    id: "narrative",
    label: "叙事构建",
    expertId: "expert-narrative",
    description: "构建角色、场景、道具、剧本",
    instructions: `你正在【叙事构建】阶段。基于上一阶段的故事大纲：
- 创建角色档案（姓名、性格、背景、视觉特征）—— 如果 entry 阶段已提取部分角色，在此基础上补充完善
- 创建场景设定（地点、氛围、光照、视觉关键词）
- 创建道具设定（关键道具、类型、玩法效果）
- 编写剧本（从大纲扩展为场景序列，每个场景包含对话、动作、情绪）
- 设计张力曲线（章节级情绪强度起伏）
- 完成后提示用户进入下一阶段：互动设计`,
    expectedOutputs: ["characters", "scenes", "props", "script"],
    sop: {
      intro: `故事大纲已经有了！接下来我们要把大纲变成完整的故事世界：

- **塑造角色**：谁在故事里？他们是什么性格、什么背景？
- **设定场景**：故事发生在哪些地方？每个地方什么氛围？
- **设计道具**：有什么关键物品？它们有什么玩法作用？
- **编写剧本**：把大纲展开成具体的场景和对话

你可以告诉我你的角色设想，或者让我基于大纲帮你自动生成。`,
      expectedInput: "角色设想、场景描述，或让 AI 基于大纲自动生成",
      expectedOutput: "角色档案、场景设定、道具清单、剧本初稿",
      proModeHint: "用户想手动编辑剧本结构（章节/分场/分层）时，展示 ScriptScreen 专业编辑器",
    },
  },
  {
    id: "interaction",
    label: "互动设计",
    expertId: "expert-interaction",
    description: "设计分支、选择、变量、结局",
    instructions: `你正在【互动设计】阶段。基于上一阶段的剧本和角色，使用工具构建完整的互动结构：

1. 创建互动节点图：
   - 用 add_node 创建场景节点（nodeType: "scene"）、选择节点（nodeType: "choice"）、条件节点（nodeType: "condition"）、QTE 节点（nodeType: "qte"）
   - 用 add_node 创建好结局（nodeType: "ending_good"）和坏结局（nodeType: "ending_bad"）
   - 用 add_edge 连接节点，label 填选择文本

2. 设计变量系统：
   - 用 add_variable 创建好感度、道德值、剧情标志等变量
   - 变量的 initialValue 设为合理初始值

3. 验证互动结构：
   - 用 run_path_test 检查死路、不可达节点、结局可达性
   - 用 check_consistency 检查逻辑矛盾
   - 如果发现问题，用 update_node/add_edge/remove_node 修复

4. 完成后提示用户进入下一阶段：演出设计（或跳过到质量校验）`,
    expectedOutputs: ["nodeGraph", "choices", "variables", "endings"],
    sop: {
      intro: `故事写好了，现在让它变成"可玩的"！我们要设计：

- **分支选择**：玩家在哪些地方可以做选择？每个选择带来什么后果？
- **变量系统**：好感度、道德值等会影响走向和结局
- **多种结局**：好结局、坏结局、中性结局、隐藏结局

你可以描述"当玩家选 X 时会怎样"，我会帮你画成右侧的节点图。
💡 节点图操作提示：拖动节点右侧的小圆点（手柄）到另一个节点，就能连线。点击 + 按钮可添加各种类型的节点。`,
      expectedInput: "分支设想、选择点描述，或让 AI 基于剧本自动生成分支",
      expectedOutput: "互动节点图、选择点、变量、结局",
      proModeHint: "用户想直接编辑节点图时，展示 GraphView（已默认展示）",
    },
  },
  {
    id: "cinematic",
    label: "演出蓝图",
    expertId: "expert-cinematic",
    description: "产出镜头/表演/音频蓝图（给外部视频工具用）",
    instructions: `你正在【演出蓝图】阶段。基于上一阶段的节点图和角色：

1. 用 add_cinematic_direction 为关键节点创建镜头指导：
   - 指定景别（wide/medium/close_up/tracking/push_in/pull_out/handheld/static）
   - 指定运镜（none/pan_left/pan_right/tilt_up/tilt_down/dolly_in/dolly_out/crane_up/crane_down/orbit/static/push_in/pull_out/tracking）
   - 指定时长、焦点、转场、节奏
   - 为角色添加表演指导（表情、动作、情绪强度）
   - 指定 BGM 氛围和音效

2. 用户也可以在画布区的"镜头"tab 中手动编辑镜头指导

3. 此阶段为可选增强，用户可跳过进入质量校验
4. 完成后提示用户进入下一阶段：资产中心（或跳过到质量校验）`,
    expectedOutputs: ["cinematicDirections"],
    sop: {
      intro: `互动结构搭好了！这一步是**可选的增强**——我们要产出一份「演出蓝图」，告诉外部视频工具（如 tpen、可灵、Runway）每个场景该怎么拍：

- **镜头景别**：这个场景看全景还是特写？
- **运镜方式**：镜头怎么动？（推进/拉远/平移/跟随）
- **表演指导**：角色什么表情、什么动作？
- **音乐音效**：什么氛围的背景音乐？

⚠️ 注意：ChaseDream **不直接生成视频**，而是产出结构化的镜头/表演/音频文档。你可以把这份蓝图导出后，导入到专业 AI 视频工具中生成最终画面。

如果你不需要这些细节，可以直接说"跳过"进入下一阶段。想设计的话，告诉我每个场景你希望观众看到什么感觉。`,
      expectedInput: "场景的视觉/听觉设想，或跳过此阶段",
      expectedOutput: "演出蓝图文档（镜头/表演/音频指导，可导出给外部视频工具）",
      proModeHint: "用户想精细调整镜头参数时，展示 CinematicView",
    },
  },
  {
    id: "asset",
    label: "资产中心",
    expertId: "expert-art",
    description: "导入+管理资产（图片/音频/视频/UI模板）",
    instructions: `你正在【资产中心】阶段。这里不做 AI 生成，而是管理创作所需的各类资产：

1. 用 set_asset_list 工具创建资产清单，包含：
   - 角色立绘资产：为每个角色记录视觉提示词（基于角色的 visualPrompt 字段）
   - 场景背景资产：为每个场景记录视觉提示词（基于场景的 visualPrompt 字段）
   - 音频资产：BGM、SFX、Voice 的需求清单
   - 视频资产：如需要
   - UI 模板资产：界面素材

2. 每个资产条目包含：type（character/scene/bgm/sfx/voice/video/ui）、name、prompt（视觉提示词）、status（pending/imported）

3. 用户可以通过统一导入入口导入已有资产（图片/音频/视频文件）
4. 也可以复制提示词到外部工具（tpen/runway/suno 等）生成后导入回来
5. 此阶段为可选增强，用户可跳过进入质量校验
6. 完成后提示用户进入下一阶段：质量校验`,
    expectedOutputs: ["assetList"],
    sop: {
      intro: `这一步是**资产中心**——管理你的互动影游需要的各类素材：

📦 **支持的资产类型**：
- 角色立绘（人物图片）
- 场景背景（环境图片）
- 背景音乐 & 音效
- 语音配音
- UI 模板素材

📥 **两种方式获取资产**：
1. **导入已有文件**：点击对话输入框的 + 按钮，选择对应类型导入
2. **外部工具生成 → 导入**：复制资产清单里的提示词，到专业 AI 工具（如 tpen 生成视频、可灵/Runway 生成图片、Suno 生成音乐）生成后，再导入回来

⚠️ ChaseDream **不直接生成媒体**，而是帮你管理资产清单和提示词。这样你可以用最专业的工具生成，再统一管理。

💡 提示：资产清单可以基于前面的角色和场景自动生成提示词，你确认后复制到外部工具使用。`,
      expectedInput: "让 AI 自动生成资产提示词清单，或直接导入已有素材文件",
      expectedOutput: "资产清单（含提示词）+ 已导入的素材文件",
      proModeHint: "用户想手动管理资产库时，展示 AssetLibraryScreen",
    },
  },
  {
    id: "qa",
    label: "质量校验",
    expertId: "expert-qa",
    description: "检查逻辑、路径、一致性",
    instructions: `你正在【质量校验】阶段。对整个项目进行全面质量检查：

1. 调用 check_consistency 工具：检测孤立节点、死路、悬空边、角色/道具/变量不一致
2. 调用 run_path_test 工具：分析可达结局路径、死胡同、不可达节点、循环节点
3. 基于工具返回的结果，用 set_qa_report 工具输出诊断报告：
   - errors：严重问题数量（死路、不可达结局、逻辑矛盾）
   - warnings：警告数量（孤立节点、未使用变量、张力异常）
   - summary：问题摘要和修复建议

4. 如果发现严重问题，建议用户返回对应阶段修复
5. 完成后提示用户进入下一阶段：预览试玩`,
    expectedOutputs: ["qaReport"],
    sop: {
      intro: `在发布前，我们要给整个项目做个体检：

- 检查故事逻辑有没有矛盾
- 检查有没有走不通的死路（玩家卡住）
- 检查所有结局是否都能到达
- 检查角色、道具、变量是否前后一致

我来自动跑一遍检查，有问题我会告诉你怎么修。你也可以随时输入"检查一致性"或"分析路径"重新检查。`,
      expectedInput: "无需输入，自动检查（或修复后重新检查）",
      expectedOutput: "QA 诊断报告（错误数、警告数、修复建议）",
      proModeHint: "展示 QA 报告视图（一致性检查 + 路径测试结果）",
    },
  },
  {
    id: "preview",
    label: "预览试玩",
    expertId: "expert-gameplay",
    description: "实时预览和试玩测试",
    instructions: `你正在【预览试玩】阶段。

1. 引导用户切换到画布区的"预览"tab 进行试玩
2. 预览区底部有浮动控制条：继续/回退/重新开始/存档/读档
3. 收集试玩反馈（节奏、难度、体验）
4. 根据反馈建议调整（可返回对应阶段修改）
5. 完成后提示用户进入下一阶段：发布导出`,
    expectedOutputs: [],
    sop: {
      intro: `马上就好了！现在你可以亲自试玩一下：

- 右侧画布就是预览区，像玩家一样体验
- 做选择、看不同分支、尝试到达不同结局
- 底部有控制条：继续/回退/重新开始/存档/读档

试玩后告诉我你的感受（节奏太快还是太慢？难度合适吗？体验流畅吗？），有问题可以回到前面的阶段调整。`,
      expectedInput: "试玩反馈（节奏、难度、体验）",
      expectedOutput: "试玩体验记录 + 调整建议",
      proModeHint: "展示 PreviewView（已默认展示）",
    },
  },
  {
    id: "release",
    label: "发布导出",
    expertId: "expert-release",
    description: "格式适配和发布",
    instructions: `你正在【发布导出】阶段。

1. 帮助用户选择导出格式（JSON/HTML5/其他行业格式）
2. 引导用户点击工具栏的"导出"按钮执行发布
3. 执行发布前最终检查（确认所有阶段已完成）
4. 导出项目文件`,
    expectedOutputs: [],
    sop: {
      intro: `恭喜！作品已经准备好了，现在导出发布：

- **选择导出格式**：JSON（给开发者二次开发）/ HTML5（可直接在浏览器玩）
- **发布前最终检查**：确认所有阶段都已完成
- **导出项目文件**：生成可分享的游戏文件
- **版本归档**：导出时自动创建版本快照

告诉我你想导出成什么格式，我帮你完成最后步骤。右侧画布有完整的发布配置面板。`,
      expectedInput: "导出格式选择（JSON / HTML5）",
      expectedOutput: "导出的项目文件 + 版本快照",
      proModeHint: "展示 PublishScreen（发布设置 + 检查清单 + 导出配置）",
    },
  },
];

// ── 管线上下文（各阶段产出） ──────────────────────────────────

export interface PipelineContext {
  // entry 阶段产出
  storyOutline?: string;
  // narrative 阶段产出
  characters?: Array<{ id: string; name: string; emoji: string; role: string; description: string }>;
  scenes?: Array<{ id: string; name: string; location: string; mood: string; visualPrompt: string }>;
  props?: Array<{ id: string; name: string; type: string; description: string; gameplayEffect: string }>;
  script?: string;
  // interaction 阶段产出
  nodeGraph?: { nodeCount: number; edgeCount: number };
  choices?: Array<{ nodeId: string; options: string[] }>;
  variables?: Array<{ id: string; label: string; initialValue: string }>;
  endings?: Array<{ id: string; type: string; label: string }>;
  // cinematic 阶段产出
  cinematicDirections?: Array<{ nodeId: string; shotType: string; duration: number }>;
  // asset 阶段产出
  assetList?: Array<{ type: string; name: string; prompt: string; status: string; fileUrl?: string; fileName?: string; fileSize?: number }>;
  // qa 阶段产出
  qaReport?: { errors: number; warnings: number; summary: string };
}

// ── Pipeline Store ────────────────────────────────────────────

interface PipelineState {
  currentStage: PipelineStageId;
  stageStatuses: Record<PipelineStageId, StageStatus>;
  context: PipelineContext;
  // 入口路径：import（导入解析）或 conversation（对话创作）
  entryPath: "import" | "conversation" | null;

  // Actions
  setStage: (stage: PipelineStageId) => void;
  advance: () => PipelineStageId | null;
  goToStage: (stage: PipelineStageId) => void;
  setEntryPath: (path: "import" | "conversation") => void;
  setStageOutput: (key: keyof PipelineContext, value: unknown) => void;
  updateContext: (partial: Partial<PipelineContext>) => void;
  reset: () => void;

  // Getters
  getStageDef: () => PipelineStageDef;
  getActiveExpert: () => Expert | null;
  getPreviousContext: () => string;
  isStageComplete: () => boolean;
  getStageIndex: () => number;
}

const STAGE_ORDER: PipelineStageId[] = STAGE_DEFS.map((s) => s.id);

const initialStatuses: Record<PipelineStageId, StageStatus> = {
  entry: "active",
  narrative: "pending",
  interaction: "pending",
  cinematic: "pending",
  asset: "pending",
  qa: "pending",
  preview: "pending",
  release: "pending",
};

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set, get) => ({
      currentStage: "entry",
      stageStatuses: { ...initialStatuses },
      context: {},
      entryPath: null,

      setStage: (stage) =>
        set((state) => ({
          currentStage: stage,
          stageStatuses: {
            ...state.stageStatuses,
            [stage]: "active",
          },
        })),

      advance: () => {
        const state = get();
        const idx = STAGE_ORDER.indexOf(state.currentStage);
        if (idx >= STAGE_ORDER.length - 1) return null;
        const nextStage = STAGE_ORDER[idx + 1];
        set({
          currentStage: nextStage,
          stageStatuses: {
            ...state.stageStatuses,
            [state.currentStage]: "complete",
            [nextStage]: "active",
          },
        });
        return nextStage;
      },

      goToStage: (stage) =>
        set((state) => ({
          currentStage: stage,
          stageStatuses: {
            ...state.stageStatuses,
            [stage]: "active",
          },
        })),

      setEntryPath: (path) => set({ entryPath: path }),

      setStageOutput: (key, value) =>
        set((state) => ({
          context: { ...state.context, [key]: value },
        })),

      updateContext: (partial) =>
        set((state) => ({
          context: { ...state.context, ...partial },
        })),

      reset: () =>
        set({
          currentStage: "entry",
          stageStatuses: { ...initialStatuses },
          context: {},
          entryPath: null,
        }),

      getStageDef: () => {
        const stage = get().currentStage;
        return STAGE_DEFS.find((s) => s.id === stage)!;
      },

      getActiveExpert: () => {
        const stage = get().currentStage;
        const def = STAGE_DEFS.find((s) => s.id === stage)!;
        return EXPERTS.find((e) => e.id === def.expertId) ?? null;
      },

      // 生成上一阶段产出的上下文摘要（注入系统提示词）
      getPreviousContext: () => {
        const ctx = get().context;
        const parts: string[] = [];

        if (ctx.storyOutline) {
          parts.push(`## 故事大纲\n${ctx.storyOutline}`);
        }
        if (ctx.characters && ctx.characters.length > 0) {
          parts.push(`## 已创建角色\n${ctx.characters.map((c) => `- ${c.emoji} ${c.name}（${c.role}）：${c.description}`).join("\n")}`);
        }
        if (ctx.scenes && ctx.scenes.length > 0) {
          parts.push(`## 已创建场景\n${ctx.scenes.map((s) => `- ${s.name}（${s.location}，${s.mood}）：${s.visualPrompt}`).join("\n")}`);
        }
        if (ctx.props && ctx.props.length > 0) {
          parts.push(`## 已创建道具\n${ctx.props.map((p) => `- ${p.name}（${p.type}）：${p.description} — 玩法效果：${p.gameplayEffect}`).join("\n")}`);
        }
        if (ctx.script) {
          parts.push(`## 剧本\n${ctx.script.slice(0, 2000)}${ctx.script.length > 2000 ? "..." : ""}`);
        }
        if (ctx.nodeGraph) {
          parts.push(`## 互动节点图\n${ctx.nodeGraph.nodeCount} 个节点，${ctx.nodeGraph.edgeCount} 条边`);
        }
        if (ctx.choices && ctx.choices.length > 0) {
          parts.push(`## 选择点\n${ctx.choices.length} 个选择点`);
        }
        if (ctx.variables && ctx.variables.length > 0) {
          parts.push(`## 变量\n${ctx.variables.map((v) => `- ${v.label} = ${v.initialValue}`).join("\n")}`);
        }
        if (ctx.endings && ctx.endings.length > 0) {
          parts.push(`## 结局\n${ctx.endings.map((e) => `- ${e.label}（${e.type}）`).join("\n")}`);
        }
        if (ctx.cinematicDirections && ctx.cinematicDirections.length > 0) {
          parts.push(`## 镜头设计\n${ctx.cinematicDirections.length} 个节点的镜头已设计`);
        }
        if (ctx.assetList && ctx.assetList.length > 0) {
          parts.push(`## 资产清单\n${ctx.assetList.length} 个资产`);
        }
        if (ctx.qaReport) {
          parts.push(`## 质量报告\n错误 ${ctx.qaReport.errors} 项，警告 ${ctx.qaReport.warnings} 项\n${ctx.qaReport.summary}`);
        }

        return parts.length > 0 ? `## 之前阶段的产出（你可以基于这些继续工作）\n${parts.join("\n\n")}` : "";
      },

      isStageComplete: () => {
        const state = get();
        const def = STAGE_DEFS.find((s) => s.id === state.currentStage)!;
        if (def.expectedOutputs.length === 0) return false;
        return def.expectedOutputs.every((key) => {
          const val = state.context[key as keyof PipelineContext];
          if (val == null) return false;
          if (Array.isArray(val)) return val.length > 0;
          if (typeof val === "string") return val.trim().length > 0;
          return true;
        });
      },

      getStageIndex: () => STAGE_ORDER.indexOf(get().currentStage),
    }),
    {
      name: "cd-pipeline",
      skipHydration: true,
    }
  )
);

// 导出阶段定义供 UI 使用
export { STAGE_DEFS, STAGE_ORDER };
