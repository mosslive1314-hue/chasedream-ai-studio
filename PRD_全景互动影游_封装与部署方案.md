# PRD：AI 互动影游创作流水线 —— ChaseDream 创作端 × 全景模板运行端

> 版本 v1.0 · 2026-06-19 · 状态：待评审
> 范式决策：**360° 全景到底**（图驱动 MVP → phase-2 视频/语音）

---

## 0. 一页速读（TL;DR）

我们要做的是一条 **"剧本 → 资产 → 封装 → 部署 → 可玩链接"** 的全自动流水线，由两个独立 App 拼成：

- **创作端 = ChaseDream Creator Studio**（已存在）：前 6 步把剧本做成结构化互动叙事，**产出 `.dfstory` 文件**作为唯一交接物。
- **运行端 = 全景模板 `panorama-romance-game`**（已存在）：纯前端 React + Three.js 360° 全景播放器，**数据驱动**，把资产灌进去就是一个可玩的游戏。
- **中间的桥 = 封装器（Packager）**：把 `.dfstory` + 生成好的全景图/配音/视频，转换成模板能吃的 `story.ts` + `characters.ts` + 资产 URL。
- **部署 = Deploy Service**：前端点一下"部署"，后端服务构建模板并调用 Vercel API/CLI 上线，**返回可玩链接**。

两个 App 都是 React 19、都无强后端耦合，**架构不冲突**。模板已内置视频全景与配音位，phase-2 几乎零改动。

---

## 1. 背景与目标

### 1.1 现状

| 项目 | 角色 | 技术栈 | 状态 |
|---|---|---|---|
| ChaseDream Creator Studio | 创作/编排 | TanStack Start (SSR) · React 19 · Zustand+IndexedDB · ReactFlow · Tailwind4 | 已有 12 阶段管线、可跑的试玩器、`.dfstory` 协议 |
| panorama-romance-game | 运行/播放 | React 19 · Vite6 · Three.js · 纯前端 SPA | 已有全景渲染、选择/分支/数值/结局、存档、视频全景、配音位 |

ChaseDream **本身不做资产生成**（代码里明确："不直接生成视频"、"资产中心不做生成"），它产出 prompt 和资产清单，留出下游空缺——这正是我们要补的 7/8/9。

### 1.2 目标

把一个剧本，经过 9 步，全自动变成一个挂在公网、点链接就能玩的 360° 全景互动影游。

### 1.3 范围切分（MVP 优先）

| 版本 | 范围 | 说明 |
|---|---|---|
| **MVP v0**（闭环优先） | 全景图 + 文字对白 + 点击选择 + 分支结局 → 封装 → 部署 → 出链接 | 不含 TTS、不含真实视频；图片可先少量手动/占位。目标：打通 `.dfstory → 模板 → Vercel → URL` 全链路 |
| **MVP v1** | 接入全景图自动生成 + TTS 配音自动填充 | 模板 voiceSrc 已就绪，无需改模板 |
| **Phase 2** | 关键节点视频全景（开场/CG）、玩家语音输入(ASR)、视频交互 | 模板已支持 .mp4 全景，主要是资产生成 |

---

## 2. 总体架构：两个项目如何衔接

### 2.1 分层视图

```
┌─────────────────────────── 创作端（ChaseDream Studio）───────────────────────────┐
│  Step1 项目创建 → Step2 解构 → Step3 世界观 → Step4 章纲 → Step5 线性剧本 →        │
│  Step6 互动叙事设计（选择/分支/变量/结局）                                          │
│                                                                                    │
│                          ▼ 导出（新增按钮：serializeDfStory）                       │
│                    ┌──────────────────────┐                                        │
│                    │   story.dfstory       │  ← 唯一交接契约（JSON）                │
│                    │   (graph/script/      │                                        │
│                    │    variables/         │                                        │
│                    │    characters/scenes/ │                                        │
│                    │    assets/cinematic)  │                                        │
│                    └──────────┬───────────┘                                        │
└───────────────────────────────┼────────────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────── 资产生成管线（新增，7/8/9）──────────────────────────┐
│  Step7 全景图：按节点 panorama-prompt → 可灵/即梦文生图（2:1 全景）→ 后处理       │
│  Step8 视频：关键节点 → 可灵图生视频（全景 mp4）            ［phase-2］           │
│  Step9 音频：对白 → MiniMax TTS 配音 + BGM                  ［MVP v1 起］          │
│                          ▼                                                          │
│              上传 CDN/对象存储（OSS/R2），把 URL 回填进 dfstory.assets             │
└───────────────────────────────┼────────────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────── 封装器 Packager（新增，核心适配器）─────────────────┐
│  dfstory + 资产URL  ──映射──▶  模板 src/data/story.ts + characters.ts + config    │
│  （跨 graph/script/variables/characters 多区块 JOIN 拼出每个 StoryNode）          │
└───────────────────────────────┼────────────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────── 部署 Deploy Service（新增）────────────────────────┐
│  注入模板 → vite build → 调 Vercel API/CLI 部署 → 轮询 → 返回可玩 URL          │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 关键设计原则

1. **两个 App 不合并**。创作端是 SSR + IndexedDB 的重应用，运行端是静态 SPA。强行合并会引入 SSR/路由/打包冲突。它们通过 `.dfstory` 这个**纯数据契约**解耦，各自独立演进。
2. **`.dfstory` 是唯一真相源**。资产生成只往里回填 URL，不改结构；封装器只读它。
3. **模板保持"数据驱动 + 配置化"**。一次泛化改造后，任何 dfstory 都能注入，模板本身不再为单个游戏改代码。
4. **资产不进 Git、不进构建产物**。全景图/视频/音频体积大，统一走 CDN，模板只存 URL，保证部署包小、Vercel 不超限。

---

## 3. 数据契约：`.dfstory → 模板` 字段映射

这是整套方案的"接缝"，也是工作量最大的一块。**注意**：ChaseDream 的 `StoryNode` 很轻（仅 id/label/type/x/y/POV），真正内容分散在多个结构，封装器需 JOIN 拼装。

### 3.1 节点映射（核心）

| 模板 `StoryNode` 字段 | 来源（dfstory） | 转换逻辑 |
|---|---|---|
| `id` | `graph.nodes[].id` | 直接映射 |
| `chapter` / `title` | `chapters` + `graph.intents[].purposeLabel` | 章节归属 + 节点意图标题 |
| `location` | `scenes[]`（按节点 sceneId 关联） | 取场景名 |
| `panorama` | `assets.cards[]`（type=image/video，按节点关联） | 回填后的 CDN URL；缺失走占位兜底 |
| `panoramaType` | `assets.cards[].type` | `image` \| `video` |
| `palette` | `scenes[].palette` 或按题材默认 | 渐变兜底色（全景加载前显示） |
| `synopsis` | `graph.intents[].description` | 节点设计意图 |
| `lines[]` | `script`（线性剧本 ScriptBlock）+ `characters` | 对白序列；speaker=角色 id；`voiceSrc`=TTS 资产 URL |
| `choices[]` | `graph.edges[]` + `graph.branches[]` + 互动点 | 出边→选项；`next`=目标节点；`effect`=变量增减；`condition`=分支判定 |
| `hotspots[]` | `qte/hotspot` 配置 | ⚠️ 缺 yaw/pitch 3D 坐标，需默认布点或加放置步骤 |
| `effect`（choice 内） | `variables` 的 consequenceChains | 变量 delta 映射 |
| `condition`（choice 内） | `branches[].conditions` | 变量阈值 → minRelationship/minGlobal |
| `ending` | `graph.nodes[].type=ending_*` | good→romance/growth；bad→regret（类型需映射表） |

### 3.2 角色映射

| 模板 `CharacterProfile` | dfstory `GameCharacter` |
|---|---|
| `id` / `name` / `shortName` | 直接映射（id 需从中文名生成稳定 slug） |
| `role` / `theme` | 角色设定字段 |
| `color` / `accent` | 缺则按题材分配调色板 |

### 3.3 变量/数值映射（模板改造关键）

模板当前把数值**写死**为 `spark/trust/boundary`（每角色）+ `career/integrity/stress`（全局）。dfstory 的变量是任意的（潜行值/警戒值/信任值/真相值…）。

- **方案**：把模板的 `MetricKey`/`GlobalKey`/`CharacterId` 从固定 union 改为**运行时配置**（从注入的 `gameConfig` 读取变量定义与角色表）。
- 数值面板、条件判定、effect 计算改为遍历配置而非硬编码字段。

---

## 4. 模板改造清单（panorama-romance-game）

| # | 改造项 | 文件 | 工作量 | MVP 阶段 |
|---|---|---|---|---|
| T1 | 类型泛化：`CharacterId`/`MetricKey`/`GlobalKey` 固定 union → 动态配置 | `src/types.ts` | 中 | v0 |
| T2 | 角色表配置化：`characters.ts` 硬编码 → 从注入 config 读取 | `src/data/characters.ts` | 小 | v0 |
| T3 | 数值面板/条件/effect 改为遍历配置 | `src/App.tsx`、`engine/game.ts` | 中 | v0 |
| T4 | `story.ts` 改为构建期注入（封装器生成） | `src/data/story.ts` | 小 | v0 |
| T5 | 全景资产缺失兜底（palette 渐变占位） | `PanoramaViewer.tsx` | 小 | v0 |
| T6 | 配音播放接线（voiceSrc 已有字段，补播放器） | `engine/game.ts` | 小 | v1 |
| T7 | 视频全景已支持，仅验证 | `PanoramaViewer.tsx` | 极小 | phase-2 |

**好消息**：T6/T7 对应的 phase-2（配音、视频）模板字段已就绪，改动很小。重头在 T1–T4 的泛化。

---

## 5. 资产生成管线（Step 7/8/9）

### 5.1 全景图（Step 7，MVP v1 核心）

- **输入**：每个节点的全景 prompt（参考模板 `specs/panorama-prompts.md` 的写法：equirectangular、2:1、第一视角、无缝）。ChaseDream 已能产出场景 prompt，需补"全景化"模板词。
- **模型**：国内全家桶——**可灵 / 即梦** 文生图，支持全景/广角；输出后**后处理**校正 2:1 比例与左右接缝。
- **输出**：`<node>.jpg`（2:1）→ 上传 CDN → URL 回填 `dfstory.assets`。

### 5.2 配音 TTS（Step 9，MVP v1）

- **输入**：`lines[]` 里每条对白 + 角色音色配置。
- **模型**：**MiniMax TTS**，每角色绑定一个音色。
- **输出**：`<node>-<lineIdx>.mp3` → CDN → 回填 `voiceSrc`。

### 5.3 视频全景（Step 8，phase-2）

- **输入**：关键节点（开场/CG）的全景图 + 运镜 prompt。
- **模型**：**可灵 图生视频**（全景 mp4）。
- **输出**：`<node>.mp4` → CDN → `panoramaType:"video"`。

### 5.4 资产管线运行在哪

> ⚠️ 浏览器/IndexedDB 装不下大资产，也扛不住长时异步生成。需要一个**轻后端 + 任务队列 + 对象存储**。MVP v0 可先不接真实生成（手动/占位），v1 起引入。

- 队列：节点级任务（生成→后处理→上传→回填），可重试、可断点续跑。
- 存储：对象存储（阿里云 OSS / Cloudflare R2）+ CDN 加速。
- 这部分是 v1 才需要的基础设施，v0 不阻塞。

---

## 6. 部署方案（Step 9 末：一键部署 → 可玩链接）

### 6.1 核心约束

**纯前端页面无法直接执行 CLI / 脚本**（浏览器没有 shell）。所以"点击部署"必须经过一个**后端 Deploy Service** 中转。这是必须新增的最小后端。

### 6.2 部署流程（推荐方案）

```
[Studio 前端]  点击"部署"
      │  POST /deploy { dfstoryId, assetManifest }
      ▼
[Deploy Service]（Node 服务 / Serverless）
   1. 拉取 dfstory + 资产 URL
   2. 复制模板 → 注入 story.ts/characters.ts/config（调用 Packager）
   3. 资产走 CDN（不打进包），仅写 URL
   4. 构建：vite build  →  dist/
   5. 部署到 Vercel（见 6.3 三选一）
   6. 轮询部署状态 → 拿到 production URL
      │  回写 deploy 记录（复用现有 export-engine 的 DeployRecord 类型）
      ▼
[Studio 前端]  显示可玩链接 https://xxx.vercel.app（替换当前 PublishScreen 的硬编码 URL）
```

### 6.3 调用 Vercel 的三种方式

| 方案 | 机制 | 优点 | 缺点 | 推荐 |
|---|---|---|---|---|
| **A. Vercel REST API（上传 prebuilt）** | Deploy Service 用 `@vercel/client` 或 REST `POST /v13/deployments`，上传 `dist/` 文件 | 无需 CLI、可编程、可拿 deploymentId 轮询 | 需管理 Vercel Token | ✅ **首选** |
| **B. Vercel CLI（child_process）** | 后端 `vercel deploy --prebuilt --token=xxx` | 简单直观、官方维护 | 需在服务器装 CLI、解析 stdout 拿 URL | 备选 |
| **C. Git 集成** | Packager 把成品 push 到 GitHub 仓库，Vercel 自动构建 | 全自动 CI、可回溯 | 每游戏一仓库/分支，较重 | 多游戏量产时再上 |

**MVP 选 A**：Deploy Service 持有一个 Vercel Token，每次部署创建一个 deployment，预构建后上传，轮询 `READY` 即返回 `url`。资产已在 CDN，部署包只有模板代码 + 注入数据，体积小、秒级完成。

### 6.4 复用现有脚手架

ChaseDream 已有：`PublishScreen`（发布 UI）、`export-engine.ts` 里的 `DeployRecord/DeployEnvironment/deployUrl` 类型、`h5-package` 导出格式定义。部署功能**接到这些已有结构上**即可，不用从零造 UI。当前 `PublishScreen` 的 URL 是硬编码 mock，替换成真实返回值。

### 6.5 多游戏与链接形态

- MVP：每个游戏 = 一个 Vercel deployment，独立 `*.vercel.app` 链接。
- 量产期：方案 A + 自定义域名（`play.zhuomeng.ai/<gameId>`），资产按 gameId 分目录隔离。

---

## 7. 技术栈与依赖总览

### 7.1 各模块技术栈

| 模块 | 技术栈 | 新增依赖 |
|---|---|---|
| 创作端 Studio | TanStack Start · React19 · Zustand · ReactFlow · Tailwind4 · TipTap | 仅补"导出 dfstory"按钮，无新依赖 |
| 运行端 模板 | React19 · Vite6 · Three.js0.174 · lucide-react | 无（泛化是改代码，不加包） |
| 封装器 Packager | Node · TypeScript（纯转换函数） | 可复用 `src/lib/export/adapters.ts` 的模式，新增一个 `panoramaAdapter` |
| 资产管线 | Node 服务 · 任务队列 · 可灵/即梦/MiniMax SDK · OSS/R2 | v1 才引入 |
| Deploy Service | Node · `@vercel/client` 或 Vercel CLI | `@vercel/client` |

### 7.2 依赖冲突评估

| 维度 | 评估 | 结论 |
|---|---|---|
| React 版本 | 两端均 React 19 | ✅ 一致 |
| 构建工具 | Studio=Vite8/Nitro；模板=Vite6 | ✅ 各自独立构建，互不影响 |
| 后端依赖 | 两端前端均无强后端；新增 Deploy/资产服务是独立进程 | ✅ 不耦合 |
| 数据格式 | 统一 `.dfstory` JSON | ✅ 单一契约 |
| Three.js | 仅运行端用 | ✅ 不进创作端 |
| **风险点** | 模板类型硬编码（T1–T3） | ⚠️ 需泛化，但属改造非冲突 |

**总判断：无阻塞性依赖冲突。** 主要工作是"新增"（封装器、Deploy Service、资产管线）和"泛化"（模板类型），不是"打架"。

---

## 8. 里程碑路线图

| 里程碑 | 内容 | 交付物 | 依赖 |
|---|---|---|---|
| **M0 打通闭环（MVP v0）** | T1–T5 模板泛化 + Packager + Deploy Service(A) + dfstory 导出按钮 | 用现有 demo 故事 + 少量手动全景图，点部署出可玩链接 | Vercel Token、对象存储桶 |
| **M1 资产自动化（MVP v1）** | Step7 全景图生成 + Step9 TTS + 资产队列/CDN 回填 | 输入剧本→自动出图出声→部署 | 可灵/即梦/MiniMax API Key |
| **M2 影像增强（Phase 2）** | Step8 视频全景 + 配音接线 T6 | 关键节点视频 CG | 可灵视频额度 |
| **M3 量产化** | 语音输入(ASR)、多游戏域名、模板主题化 | 规模化产线 | — |

---

## 9. 风险与未决项

| 项 | 风险 | 缓解 |
|---|---|---|
| 全景图生成质量 | 2:1 无缝全景对模型要求高，可能有接缝/畸变 | 后处理校正 + 人工挑选 + palette 兜底；先小批量验证 |
| hotspot 3D 坐标缺失 | dfstory 无 yaw/pitch，热点放不准 | v0 默认正前方布点；后续在 Studio 加全景放置编辑器 |
| 数值语义对齐 | 模板数值面板的 UI 文案/图标按"恋爱"设计，换题材需主题化 | T3 一并做成配置化文案 |
| Deploy Service 安全 | Vercel Token、对象存储密钥需保管 | 服务端持有，前端不接触；按用户隔离 |
| 资产成本/时长 | 视频生成贵且慢 | v0/v1 不依赖视频；视频仅关键节点 |

### 待你拍板的决策

1. **对象存储选型**：阿里云 OSS / 七牛 / Cloudflare R2？（影响 CDN 与上传 SDK）
2. **Vercel 账号与 Token**：用个人还是团队账号？是否要自定义域名 `play.zhuomeng.ai`？
3. **M0 是否就上真实图片生成**，还是先用手动/占位图把闭环跑通（推荐后者）。
4. **角色 id slug 规则**：中文名→英文 slug 的生成方式（影响资产命名与稳定性）。

---

## 附：MVP v0 落地步骤（待批准后执行，本阶段不写代码）

1. 在 Studio 接一个"导出 .dfstory"按钮（`serializeDfStory` 已存在，仅缺 UI）。
2. 写 `panoramaAdapter`：dfstory → 模板 `story.ts`/`characters.ts`/`gameConfig`（仿 `export/adapters.ts`）。
3. 改造模板 T1–T5（类型泛化、配置化、资产兜底）。
4. 写 Deploy Service：注入 → `vite build` → `@vercel/client` 部署 → 返回 URL。
5. 把现有 demo 故事跑通：导出→封装→部署→拿到链接→真机试玩。
6. 验证：TypeScript/build 通过、桌面+移动端全景渲染正常、分支与结局可达。
