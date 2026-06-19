# AltFlow · 互动影视游戏开发平台 — 完整逆向工程分析报告

> **文档目的**: 供编程智能体阅读的通俗技术文档，用于复现 AltFlow 平台的页面 UI 布局、功能设计与交互逻辑  
> **分析日期**: 2026-06-18  
> **平台地址**: https://altflow.cn  
> **采集深度**: Step 1-4 全量 DOM 采集（Step 5-6 因 AI 生成依赖无法访问）  
> **项目 ID**: p_nnbnuvy7（测试项目）  

---

## 目录

1. [平台概览](#1-平台概览)
2. [技术架构推断](#2-技术架构推断)
3. [全局布局系统](#3-全局布局系统)
4. [完整工作流：6 步引导模式](#4-完整工作流6步引导模式)
5. [UI 组件完整清单（89 个）](#5-ui-组件完整清单89-个)
6. [设计模式目录（69 个）](#6-设计模式目录69-个)
7. [各步骤详细逆向分析](#7-各步骤详细逆向分析)
8. [数据结构与状态模型](#8-数据结构与状态模型)
9. [用户体验亮点总结](#9-用户体验亮点总结)
10. [复现实现指南](#10-复现实现指南)

---

## 1. 平台概览

### 1.1 产品定位

| 属性 | 值 |
|------|-----|
| **产品名称** | AltFlow（工作台） |
| **Slogan** | Every Choice Creates A World / 所有未发生，都值得被创造 |
| **核心品类** | 互动影视游戏开发平台（Interactive Movie/Game Development Platform） |
| **目标用户** | 剧本作者、互动内容创作者、影视改编团队 |
| **商业模式** | 积分制（AI 分析消耗积分，初始 2000 分） |

### 1.2 核心功能矩阵

```
┌─────────────────────────────────────────────────────────────┐
│                    AltFlow 功能全景图                         │
├─────────────┬───────────┬───────────┬───────────────────────┤
│  输入层      │  分析层    │  设计层    │  输出层               │
├─────────────┼───────────┼───────────┼───────────────────────┤
│ 剧本上传     │ AI 频道识别│ 互动方向配置│ 全集大纲（30集分集）    │
│ txt/docx/pdf│ 多Agent并行│ 热力图编辑 │ 互动节点（A/B选项）    │
│ 50万字支持  │ 故事画像   │ 选择机制定义│ 状态变化（好感/信任）  │
│             │ 叙事弧线   │ 钩子设计   │ 结尾钩子              │
│             │ 角色关系网 │ 反馈规则   │ 原文映射回查          │
└─────────────┴───────────┴───────────┴───────────────────────┘
```

### 1.3 两种创作模式

| 模式 | 入口 | 特点 | 适用场景 |
|------|------|------|----------|
| **引导模式 (Guided)** | 默认 | 6 步向导式流程，AI 逐步引导 | 新手用户、标准化产出 |
| **自由创作 (Free Creation)** | 切换入口 | 无固定步骤，自由编辑 | 高级用户、特殊需求 |

---

## 2. 技术架构推断

### 2.1 前端架构

```
┌────────────────────────────────────────────────────────────┐
│                      应用层 (App Shell)                      │
│  ┌──────────┐ ┌────────────────────┐ ┌──────────────────┐  │
│  │ Sidebar  │ │    Top Navigation   │ │  AI Assistant    │  │
│  │ (固定)   │ │ (Step Progress Bar) │ │  (Floating FAB)  │  │
│  └──────────┘ └────────────────────┘ └──────────────────┘  │
├────────────────────────────────────────────────────────────┤
│                    路由层 (Router Guard)                     │
│  ✓ Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6   │
│  ✗ 禁止跳步（每步有前置条件检查）                             │
│  ✗ 禁止直接 URL 访问未完成步骤（会触发状态重置）               │
├────────────────────────────────────────────────────────────┤
│                     状态管理层 (State)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ ProjectState │ │ StepProgress  │ │ GenerationStatus   │  │
│  │ (项目配置)    │ │ (步骤进度)    │ │ (AI 生成状态)       │  │
│  └──────────────┘ └──────────────┘ └────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│                    渲染层 (UI Components)                    │
│  左侧面板(AI 对话) │ 右侧面板(结构化编辑器) │ 底部操作栏      │
└────────────────────────────────────────────────────────────┘
```

### 2.2 关键技术决策

| 决策点 | 推断实现 | 设计原因 |
|--------|----------|----------|
| **路由方案** | React Router / Vue Router + 守卫 | 保护步骤顺序，防止跳步导致数据不一致 |
| **状态管理** | Redux / Pinia / Zustand | 跨步骤共享项目配置、AI 生成进度等全局状态 |
| **实时通信** | SSE (Server-Sent Events) 或 WebSocket | AI 流式生成需要服务端推送进度 |
| **渲染策略** | 虚拟滚动 (Virtual Scrolling) | 30 集分集卡片列表的性能优化 |
| **热力图** | Canvas 或 SVG 内联渲染 | 30 列 × N 行的高密度交互网格 |

### 2.3 AI 引擎架构（推断）

```
用户输入剧本 (209字)
       ↓
┌─────────────────────────────────────────────┐
│           Step 1: 频道识别引擎               │
│  • NLP 标签提取 (女频/BG/都市/言情)         │
│  • 故事驱动力分类 (恋爱/冒险/悬疑)           │
│  • 置信度评分 (60%→90%)                    │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│        Step 2: 多 Agent 并行分析系统         │
│  ┌───────────┬───────────┬───────────┐     │
│  │体验设计Agent│人物档案Agent│空间制图Agent│    │
│  │(关系/情绪) │(角色/心理) │(场景/符号) │     │
│  └───────────┴───────────┴───────────┘     │
│  ┌───────────┐                              │
│  │结构师Agent │ ← 协调汇总                  │
│  │(弧线/节奏) │                              │
│  └───────────┘                              │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│        Step 3: 互动方向配置引擎              │
│  • 01 节奏(Rhythm): 密度/速度/比例           │
│  • 02 钩子(Hooks): 收益/危机分布             │
│  • 03 选择机制(Selection): 4 类选项定义      │
│  • 04 状态反馈(State): 5 维状态沉淀           │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│        Step 4: 全集大纲生成引擎              │
│  • 6 阶段弧线骨架推断                        │
│  • 30 集分逐一集展开                         │
│  • 自动标记含互动集数                        │
│  • 互动节点 A/B 选项生成                     │
└──────────────────┬──────────────────────────┘
                   ↓
            Step 5-6: (待探索 — 互动大纲/导出)
```

---

## 3. 全局布局系统

### 3.1 页面骨架 (Page Skeleton)

```
╔══════════════════════════════════════════════════════════╗
║  ┌────┐  ┌──────────────────────────────────────────┐  ║
║  │Side│  │  Top Bar: [☰] [全集大纲 ▾] · ①②③④⑤⑥  │  ║
║  │bar │  │  Step 4 · 弧线骨架已完成    项目名 30集   │  ║
║  │    │  └──────────────────────────────────────────┘  ║
║  │Logo│  ┌─────────────────┬─────────────────────────┐ ║
║  │    │  │                 │                         │ ║
║  │首页│  │   Left Panel    │    Right Panel          │ ║
║  │    │  │   (AI Chat)    │    (Editor)             │ ║
║  │工作台│  │                 │  ┌─────────────────┐   │ ║
║  │    │  │  [AI Messages]  │  │ Stage Tabs (H)   │   │ ║
║  │────│  │                 │  │ 01初遇 02暧昧... │   │ ║
║  │语言│  │  [Input Box]    │  ├─────────────────┤   │ ║
║  │用户│  │  [附件][@][Auto]│  │ Stage Detail    │   │ ║
║  │退出│  │                 │  │ 意图·描述·情绪线  │   │ ║
║  └────┘  │                 │  ├─────────────────┤   │ ║
║          │                 │  │ Episode Cards   │   │ ║
║          │                 │  │ Ep.01 ▸ Ep.02 ▸ │   │ ║
║          │                 │  │ Ep.03 ▾ ...      │   │ ║
║          │                 │  └─────────────────┘   │ ║
║          └─────────────────┴─────────────────────────┘ ║
║  ┌──────────────────────────────────────────────────┐  ║
║  │ Bottom Bar: ✓ 已完成  [||暂停]  [进入Step5 →]   │  ║
║  └──────────────────────────────────────────────────┘  ║
║  ┌──────────────────────────────────────────────────┐  ║
║  │ [🤖] AI Assistant (FAB, 右下角悬浮按钮)          │  ║
║  └──────────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════╝
```

### 3.2 响应式断点（推断）

| 断点 | 宽度范围 | 布局行为 |
|------|----------|----------|
| Desktop (≥1280px) | 当前采集状态 | 双栏布局（左对话 + 右编辑器） |
| Tablet (768-1279px) | 推断 | 左侧边栏可收起，主内容区单栏 |
| Mobile (<768px) | 推断 | 单栏堆叠，阶段 Tab 可横向滑动 |

### 3.3 色彩系统 (Color System)

| 用途 | 色值（推断） | 使用场景 |
|------|-------------|----------|
| **品牌主色** | `#FF6B35` (橙色) | 激活态 Tab、主按钮、高亮标签 |
| **成功色** | `#22C55E` (绿色) | 已完成步骤 (✓)、确认状态 |
| **背景色** | `#0F0F0F` (深黑) | 主背景（暗色主题） |
| **卡片背景** | `#1A1A1A` (深灰) | 卡片容器、面板背景 |
| **文字主色** | `#F5F5F5` (近白) | 标题、正文 |
| **文字次色** | `#999999` (中灰) | 辅助说明、提示文字 |
| **边框色** | `#333333` (暗灰) | 卡片边框、分割线 |
| **警告色** | `#FF9500` (橙黄) | 警告横幅、质量检测提示 |

---

## 4. 完整工作流：6 步引导模式

### 4.1 工作流总览

```
Step 1          Step 2          Step 3          Step 4          Step 5      Step 6
频道识别  ──→   故事画像  ──→   互动方向  ──→   全集大纲  ──→   互动大纲  ──→  ?
  │              │              │              │              │           │
  ▼              ▼              ▼              ▼              ▼           ▼
识别互动体验    多Agent分析    4方向×12判断   6阶段×30集    互动节点细化  导出/发布
确认项目设定    M1-M5模块     热力图配置     分集卡片展开    分支逻辑?     ?
AI深度分析      故事画像确认   逐方向确认     弧线骨架完成    ?           ?
```

### 4.2 各步骤输入输出关系

| 步骤 | 核心输入 | 核心输出 | 下一步依赖 |
|------|----------|----------|------------|
| **Step 1** | 原始剧本文本 (209字) | 互动体验类型 + 项目设定(30集/2-3min/抖音) + 10张分析卡 | 设定锁定后触发 AI 分析 |
| **Step 2** | Step 1 的分析结果 | M1-M5 五大故事画像模块 + 4 Agent 并行分析输出 | 故事画像确认后解锁 Step 3 |
| **Step 3** | Step 2 的故事画像 | 4 个互动方向配置(节奏/钩子/选择机制/状态反馈) + 360 个热力图按钮 | 4 方向全部确认后解锁 Step 4 |
| **Step 4** | Step 3 的方向配置 | 6 阶段弧线骨架 + 30 集分集卡片(每集 8 个字段) | 全部生成完成后解锁 Step 5 |
| **Step 5** | Step 4 的全集大纲 | *(推测)* 互动节点的 A/B 选项细节 + 分支逻辑 | *(未知)* |
| **Step 6** | Step 5 的互动大纲 | *(推测)* 最终导出 / 发布配置 | *(未知)* |

---

## 5. UI 组件完整清单（89 个）

### 5.1 导航与布局组件 (1-15)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 01 | 左侧边栏 | Sidebar | 全局固定 | Logo + 导航项 + 用户信息 + 可收起 |
| 02 | 顶部导航栏 | TopBar | 全局固定 | 汉堡菜单 + 模块下拉 + Step 进度条 |
| 03 | Step 进度指示器 | Step Progress Indicator | TopBar | ①②③④⑤⑥ 圆形编号，完成态绿色✓ |
| 04 | 底部操作栏 | BottomBar | 页面底部 | 状态文本 + 暂停按钮 + 下一步按钮 |
| 05 | 双栏布局 | Dual-Pane Layout | 主内容区 | 左侧 AI 对话 + 右侧结构化编辑器 |
| 06 | 模块下拉选择器 | Module Dropdown | TopBar 左侧 | 「全集大纲」/「故事画像」/「互动方向」等 |
| 07 | 账户积分按钮 | Credits Button | TopBar 右侧 | 显示当前积分余额(1998) |
| 08 | AI 助手悬浮按钮 | AI Assistant FAB | 右下角 | 蓝色圆形，点击打开 AI 助手 |
| 09 | 通知区域 | Notifications Region | 右上角 | `live=polite`, `relevant=additions text` |
| 10 | Alert 区域 | Alert Region | 页面底部 | `live=assertive`, 显示当前页面标题 |
| 11 | 侧边栏收起按钮 | Collapse Sidebar Button | Sidebar 顶部 | 图标按钮，切换侧边栏展开/收起 |
| 12 | 语言切换按钮 | Language Switcher | Sidebar 底部 | 中/英 切换 |
| 13 | 用户信息按钮 | User Profile Button | Sidebar 底部 | 显示「用户5849」 |
| 14 | 退出登录按钮 | Logout Button | Sidebar 底部 | 文本按钮 |
| 15 | 展开侧边栏按钮 | Expand Sidebar Button | TopBar 左侧(收起态) | 仅在侧边栏收起时显示 |

### 5.2 AI 对话组件 (16-27)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 16 | AI 消息气泡 | AI Message Bubble | Left Panel | 支持 Markdown 格式，带加载动画 |
| 17 | 用户消息气泡 | User Message Bubble | Left Panel | 用户发送的消息展示 |
| 18 | 聊天输入框 | Chat Input | Left Panel 底部 | 支持 @提及、附件上传 |
| 19 | 发送按钮 | Send Button | Input 右侧 | Enter 发送，默认 disabled |
| 20 | 附件按钮 | Attachment Button | Input 左侧 | 上传文件附件 |
| 21 | @提及按钮 | @Mention Button | Input 左侧 | @ 模块进行局部调整 |
| 22 | 模式选择下拉 | Mode Selector | Input 右侧 | Auto / Manual 模式切换 |
| 23 | 快捷键提示 | Shortcut Hint | Input 下方 | Enter 发送 / Shift+Enter 换行 |
| 24 | 暂停按钮 | Pause Button | BottomBar 中央 | `\|\|` 图标，橙色激活态 |
| 25 | 状态标签 | Status Label | LeftPanel 顶部 | 橙色标签显示当前锁定状态 |
| 26 | 加载动画 | Loading Animation | AI 消息内 | 旋转图标 + 「正在分析中...」 |
| 27 | 进度卡片 | Progress Card | LeftPanel | 显示当前生成阶段和百分比 |

### 5.3 结构化卡片组件 (28-50)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 28 | 识别结果卡 | Recognition Result Card | Step1 Right | 置信度 + 标签组 + 推荐按钮 |
| 29 | 项目设定卡 | Project Settings Card | Step1 Right | 4 组配置项(集数/时长/平台/受众) |
| 30 | 元数据卡(M系列) | Metadata Card (M-Series) | Step1/2 Right | M1-M5 编号系统，[采用]/[修改] 操作 |
| 31 | 分析卡(数字系列) | Analysis Card (Numbered) | Step1 Right | 01/05-05/05 编号，[@]/[重新生成] 操作 |
| 32 | HeroCard | Hero Card | Step2 M1 | 一句话定位 + Promise/Thesis 框架 |
| 33 | 叙事弧卡 | Narrative Arc Card | Step2 M2 | 6 阶段情绪曲线可视化 |
| 34 | 体验画像卡 | Experience Profile Card | Step2 M3 | 4 维滑块控件(1-5 刻度) |
| 35 | 人物关系网卡 | Relationship Graph Card | Step2 M4 | 角色节点 + 关系连线图 |
| 36 | 互动机会点卡 | Interaction Opportunity Card | Step2 M5 | Tab 式角色切换 + 机会点列表 |
| 37 | 方向配置卡 | Direction Config Card | Step3 Right | 4 个方向 Tab 切换 |
| 38 | 节奏预览卡 | Rhythm Preview Card | Step3-01 | 三维配置(密度/速度/比例) |
| 39 | 钩子走势卡 | Hook Trend Card | Step3-02 | 二元热力图 + 三阶段分栏 |
| 40 | 选择机制预览卡 | Selection Mech Preview Card | Step3-03 | 4 类选择类型 + 降权标记 |
| 41 | 状态反馈预览卡 | State Feedback Preview Card | Step3-04 | 5 维状态系统 |
| 42 | 阶段详情卡 | Stage Detail Card | Step4 Right | 阶段意图 + 描述 + 情绪线 + 映射 |
| 43 | 分集卡片 | Episode Card | Step4 Right | 可折叠展开，8 个核心字段 |
| 44 | 点赞/点踩按钮组 | Thumbs Up/Down Buttons | Step2 M1 | 卡片级反馈机制 |
| 45 | 锁定状态卡 | Locked State Card | Step1 (确认后) | 灰色禁用态 + 「重新分析」入口 |
| 46 | 判断审核区 | Judgment Review Area | Step3 Each Dir | 3 道判断逐一审阅 |
| 47 | 警告横幅 | Warning Banner | Step4 底部 | 橙色图标 + 质量检测提示 |
| 48 | 项目摘要栏 | Project Summary Bar | Step2-4 TopRight | 标签云 + 关键参数一览 |
| 49 | 操作按钮组 | Action Button Group | 各卡片底部 | 采用/修改/@/重新生成 等 |
| 50 | 提示文字组件 | Hint Text Component | 各配置项下方 | 上下文相关的业务提示 |

### 5.4 数据可视化组件 (51-68)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 51 | 互动密度热力图网格 | Interaction Density Heatmap | Step3-01 | 30列(E01-E30) × 3级密度 = 90 按钮 |
| 52 | 二元热力图 | Binary Heatmap | Step3-02 | 30列 × 橙(升温)/灰(紧张) 双色 |
| 53 | 多色热力图(4色) | Multi-color Heatmap (4) | Step3-03 | 30列 × 4 种选择类型颜色 |
| 54 | 多色热力图(5色+) | Multi-color Heatmap (5+) | Step3-04 | 30列 × 5 维状态颜色 |
| 55 | 三栏配比可视化 | Three-column Ratio Visualization | Step1 02/05 | 甜/虐/虐甜混合 百分比条 |
| 56 | 可视化情绪曲线图 | Emotion Curve Chart | Step2 M2 | 6 阶段情绪起伏折线图 |
| 57 | 亲密度滑块 | Intimacy Slider | Step1 05/05 | −/+ 按钮，百分比显示 |
| 58 | 角色关系图 | Character Relationship Graph | Step2 M4 | 节点 + 连线 + 关系类型标签 |
| 59 | 进度条组件 | Progress Bar Component | 多处 | 橙色填充，支持分轨显示 |
| 60 | 完成态勾选 | Completion Checkmark | Step Progress | 绿色 ✓ 图标 |
| 61 | 数值化状态条 | Numeric State Bar | Step4 Episode | 橙色渐变条，好感数值显示 |
| 62 | 章节标记 | Chapter Marker | Step1 04/05 | Ch.XX 格式章节引用 |
| 63 | 图例系统 | Legend System | 热力图下方 | 颜色含义说明 |
| 64 | 关键集数标记 | Key Episode Marker | Step3-02 | 特定集数的文字标注 |
| 65 | 状态流转箭头 | State Transition Arrow | Step1 01/05 | A → B 状态变化可视化 |
| 66 | DescriptionList | Description List | 多处卡片 | 键值对形式的结构化字段展示 |
| 67 | 标签组组件 | Tag Group Component | 多处 | 圆角胶囊标签，可多选展示 |
| 68 | 阶段代号标签 | Stage Code Label | Step4 Stage Tab | 单字代号(初/试/误/修/代/结) |

### 5.5 交互控件组件 (69-89)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 69 | 选项按钮组 | Option Button Group | Step1 Settings | 16/30/60/80/100 集等选项 |
| 70 | 大橙色主按钮 | Primary CTA Button | 多处关键操作 | 橙色背景，白色文字，箭头后缀 |
| 71 | 次要按钮 | Secondary Button | 辅助操作 | 线框或灰色样式 |
| 72 | 危险/重做按钮 | Danger/Retry Button | 重置操作 | 灰色或红色调，提示积分消耗 |
| 73 | Tab 切换组件 | Tab Switch Component | Step3 Directions / Step2 M5 | 4 个方向 Tab / 角色 Tab |
| 74 | 水平阶段导航 | Horizontal Stage Nav | Step4 Top | 左右滑动 + 选中态橙色边框 |
| 75 | 分集折叠/展开 | Episode Expand/Collapse | Step4 Episode | 点击标题区域切换展开状态 |
| 76 | 选中调整按钮 | Select & Adjust Button | 各卡片 | `@` 符号 + 「选中XX调整」文案 |
| 77 | 三级密度按钮组 | Ternary Density Buttons | Step3-01 Heatmap | 每 3 个按钮一组(1/2/3 级) |
| 78 | 5 级刻度按钮 | 5-Level Scale Buttons | Step2 M3 Slider | 1/5 到 5/5 共 5 个独立按钮 |
| 79 | 定制判断入口 | Custom Judgment Entry | Step3 Each Dir | 「点开后告诉 AI 怎么改」 |
| 80 | 一键采用推荐 | One-click Adopt Recommendation | Step1 Settings | `✨ 一键采用 AI 推荐` |
| 81 | 重新分析按钮 | Re-analyze Button | Step1 Locked State | 右上角，解除锁定重新开始 |
| 82 | 全部重做按钮 | Redo All Button | Step3/4 Bottom | 重做所有已确认内容 |
| 83 | 向左/右查看阶段 | Stage Scroll Left/Right | Step4 Stage Nav | 阶段过多时的左右翻页 |
| 84 | 集数选项芯片 | Episode Count Chip | Step1 Settings | 16/30/60/80/100 橙色高亮选中 |
| 85 | 平台选项芯片 | Platform Chip | Step1 Settings | 抖音/快手/红果/番茄/其他 |
| 86 | 受众选项芯片 | Audience Chip | Step1 Settings | 年龄×性别分段 |
| 87 | 时长选项芯片 | Duration Chip | Step1 Settings | 1分钟/2-3分钟/5分钟 |
| 88 | 模式标签 | Mode Tag Label | Step2 M1 HeroCard | 「1v1 深度拉扯」橙色高亮 |
| 89 | 新功能标签 | New Feature Badge | 创建页 | `NEW` 角标徽章 |

---

## 6. 设计模式目录（69 个）

### 6.1 工作流与引导模式 (Patterns 1-12)

| # | 模式名称 | 英文名 | 应用位置 | 核心思想 |
|---|---------|--------|----------|----------|
| 01 | **对话式 AI 引导工作流** | Conversational AI-Guided Workflow | 全局 | AI 以对话方式引导用户完成复杂任务 |
| 02 | **分步骤向导** | Step-by-step Wizard | 全局 6 步 | 将复杂创作拆分为 6 个有顺序的步骤 |
| 03 | **置信度展示** | Confidence Score Display | Step1 识别结果 | 展示 AI 判断的可信程度(60%) |
| 04 | **标签系统** | Tag-based Classification | 全局多处 | 用标签快速传达分类信息 |
| 05 | **@模块提及机制** | @ Module Reference System | 全局输入框 | 通过 @ 提及特定模块进行局部修改 |
| 06 | **实时可暂停/干预** | Pause & Intervene Capability | 全局底部 | 用户可在任何时刻暂停 AI 并介入 |
| 07 | **智能默认值 + AI 推荐** | Smart Defaults with AI Recommendations | Step1 设定 | 预设行业最佳实践，一键采用 |
| 08 | **平台适配提示系统** | Contextual Hints Per Config Item | Step1 设定 | 每个配置项下方有业务逻辑提示 |
| 09 | **分组式配置面板** | Grouped Configuration Panel | Step1 设定 | 相关配置项分组展示 |
| 10 | **选中态视觉反馈** | Orange Highlight for Selected Options | 全局选项 | 橙色高亮标识当前选中项 |
| 11 | **业务逻辑联动** | Business Logic Coupling | Step1 设定 | 平台→钩子密度，受众→爽点强度 |
| 12 | **锁定机制** | Lock Mechanism After Confirmation | Step1 确认后 | 确认后不可修改，需显式解锁 |

### 6.2 数据展示与可视化模式 (Patterns 13-30)

| # | 模式名称 | 英文名 | 应用位置 | 核心思想 |
|---|---------|--------|----------|----------|
| 13 | **分析进度实时反馈** | Real-time Analysis Progress Feedback | Step1-4 | 流式生成时持续更新进度百分比 |
| 14 | **可恢复性设计** | Re-analysis Option | Step1 Locked | 允许用户撤销并重新分析 |
| 15 | **流式卡片生成** | Streaming Card Generation | Step1 Right | 逐张生成分析卡片，边看边审 |
| 16 | **双栏布局** | Dual-pane Layout (Chat + Editor) | Step1-4 Main | 左侧对话引导 + 右侧结构化编辑 |
| 17 | **模块编号系统** | Module Numbering System (M + Num) | Step1-2 | M 系列=元数据，数字系列=分析卡 |
| 18 | **卡片级独立操作** | Card-level Independent Operations | 全局卡片 | 每张卡可单独@提及/重新生成/采用/修改 |
| 19 | **DescriptionList 字段展示** | DescriptionList Field Display | 多处卡片 | 键值对形式展示结构化字段 |
| 20 | **可视化配比条** | Visual Ratio Bars | Step1 02/05 | 甜/虐/修罗场三栏百分比 |
| 21 | **进度分轨显示** | Multi-track Progress Display | Step1 Right | 模块进度 2/5 + 分析进度 2/5 |
| 22 | **HeroCard 一句话定位** | HeroCard One-line Positioning | Step2 M1 | 用一句话概括整个项目的核心体验 |
| 23 | **Promise/Thesis 叙事框架** | Promise/Thesis Narrative Framework | Step2 M1 | 承诺(用户获得)+主张(主题表达) |
| 24 | **6 阶段叙事弧可视化** | 6-stage Narrative Arc Visualization | Step2 M2 | 完整故事线的情绪起伏曲线 |
| 25 | **原文→集数映射** | Source Chapter → Target Episode Mapping | Step2 M2/Step4 | 原文章节到目标集数的双向映射 |
| 26 | **4 维体验滑块** | 4-dimension Experience Sliders | Step2 M3 | 情绪拉扯/被选择/代价/信任坍塌 |
| 27 | **人物关系图** | Character Relationship Graph | Step2 M4 | 节点+连线+关系类型可视化 |
| 28 | **角色详情卡片** | Character Detail Cards | Step2 M4 | 每个角色的名字/身份/描述/动机 |
| 29 | **Tab 式互动机会点管理** | Tab-based Interaction Opportunity Management | Step2 M5 | 按角色切换查看其互动机会点 |
| 30 | **点赞/点踩反馈** | Thumbs Up/Down Feedback | Step2 M1 | 用户对 AI 产出的质量评价 |

### 6.3 配置与决策模式 (Patterns 31-50)

| # | 模式名称 | 英文名 | 应用位置 | 核心思想 |
|---|---------|--------|----------|----------|
| 31 | **折叠式阶段详情** | Collapsible Stage Details | Step2 M2 | 阶段卡片可展开查看详细信息 |
| 32 | **Tab 式方向切换** | Tab-based Direction Switching | Step3 | 4 个方向作为 Tab 逐一确认 |
| 33 | **Per-episode 密度控制** | Per-episode Density Control | Step3-01 | 每集独立设置 1-3 级互动密度 |
| 34 | **30 集热力图可视化** | 30-column Heatmap Visualization | Step3 All | 全集维度的宏观配置视图 |
| 35 | **三级密度按钮组** | Ternary Density Button Group | Step3-01 | 每格 3 个按钮代表 3 级密度 |
| 36 | **判断审核机制** | Judgment Review Mechanism | Step3 Each | AI 做 3 个判断，用户逐一过目 |
| 37 | **图例系统** | Legend System | Step3 Heatmaps | 解释视觉编码的含义 |
| 38 | **二元热力图** | Binary Heatmap (Orange/Gray) | Step3-02 | 关系升温 vs 关系紧张的简化视图 |
| 39 | **关键集数标记** | Key Episode Markers | Step3-02 | 在热力图上标注关键转折集 |
| 40 | **三阶段分栏卡片** | 3-phase Summary Cards | Step3-02 | 开局/中段/后段的收益危机统计 |
| 41 | **收益/危机计数** | Benefit/Crisis Count | Step3-02 | 每阶段的正负情感事件统计 |
| 42 | **钩子设计哲学** | Hook Design Philosophy | Step3-02 | 把关系推到临界点的悬念设计理念 |
| 43 | **选择类型分类系统** | Choice Type Taxonomy | Step3-03 | 4 类主要选择 + 1 类降权 |
| 44 | **动作导向选项设计** | Action-oriented Choice Design | Step3-03 | 选动作而非选角色名的选项设计 |
| 45 | **多色热力图(4 色)** | Multi-color Heatmap (4 colors) | Step3-03 | 4 种选择类型的空间分布 |
| 46 | **降权标记** | Downweight Marker | Step3-03 | 明确排除非关系型选择 |
| 47 | **1vN 多对象影响规则** | 1vN Multi-character Impact Rule | Step3-03 | 一个选择至少影响两个角色 |
| 48 | **5 维状态沉淀系统** | 5-dimensional State Persistence | Step3-04 | 好感/信任/占有/风险/嫉妒 |
| 49 | **状态承接机制** | State Inheritance Across Episodes | Step3-04 | 选择后的状态在后续集承接 |
| 50 | **分支非抹平设计** | Non-reset Branch Design | Step3-04 | 分支闭合后不全部抹平状态 |

### 6.4 编辑器与交互模式 (Patterns 51-69)

| # | 模式名称 | 英文名 | 应用位置 | 核心思想 |
|---|---------|--------|----------|----------|
| 51 | **多 Agent 并行分析** | Multi-Agent Parallel Analysis | Step2 | 4 个专业 Agent 同时分析不同维度 |
| 52 | **Agent 角色分工** | Role-based Agent Specialization | Step2 | 体验设计/人物档案/空间制图/结构师 |
| 53 | **进度条 + 完成态勾选** | Progress Bar + Checkmarks | Step2 M1-M5 | 模块级进度追踪 |
| 54 | **耗时提示文案** | Time-consuming Warning | Step2 | 「这一步耗时较长，可以暂停」 |
| 55 | **项目名称顶部展示** | Project Name in Header | Step2-4 TopRight | 始终显示当前项目名 |
| 56 | **6 阶段弧线骨架生成器** | 6-stage Arc Skeleton Generator | Step4 | 按阶段推断故事骨架 |
| 57 | **单字阶段代号** | Single-character Stage Code | Step4 | 初/试/误/修/代/结 紧凑表示 |
| 58 | **分阶段流式生成进度** | Phased Streaming Progress | Step4 | 1/6 → 2/6 → ... → 6/6 |
| 59 | **自动质量检测横幅** | Auto-quality Detection Banner | Step4 | 检查选择点的反馈可见性 |
| 60 | **可感知反馈验证** | Perceptible Feedback Validation | Step4 | 确保每个选择有可见的状态变化 |
| 61 | **水平阶段 Tab 导航** | Horizontal Stage Tab Navigation | Step4 | 阶段切换的水平 Tab 栏 |
| 62 | **阶段详情卡片** | Stage Detail Card | Step4 | 意图+描述+情绪线+映射 |
| 63 | **三段式情绪流转** | Three-part Emotion Flow | Step4 Stage | 紧张→试探→好感（三段式） |
| 64 | **分集卡片列表** | Episode Card List per Stage | Step4 | 每阶段下的分集列表 |
| 65 | **选中阶段调整** | Selected Stage Adjustment via @mention | Step4 Stage | @ 提及整个阶段进行调整 |
| 66 | **原文→改编区间映射** | Source-to-adapt Range Mapping | Step4 Stage | 原文章节区间 → 改编集数区间 |
| 67 | **阶段名称语义化** | Semantic Stage Naming | Step4 | 「焦灼初遇」>「初始牵引」（更生动） |
| 68 | **分集卡片展开/折叠** | Expandable Episode Cards | Step4 Episode | 点击展开 8 个核心字段 |
| 69 | **数值化好感状态变化** | Numeric Affinity State Change | Step4 Episode | 好感基线 0.5/0.3 数值化展示 |

---

## 7. 各步骤详细逆向分析

### 7.1 Step 1：频道识别与项目设定

**URL**: `/workspace/step1?projectId=p_nnbnuvy7`  
**页面标题**: `Step 1 · 频道识别与项目设定`

#### 7.1.1 页面结构树

```
RootWebArea
├── Sidebar (左侧边栏)
│   ├── Logo (AltFlow png)
│   ├── Collapse Button
│   ├── Nav: 首页 | 剧本工作台
│   └── Footer: 语言(中) | 用户5849 | 退出登录
├── TopBar (顶部导航)
│   ├── ☰ Hamburger Menu
│   ├── [项目设定 ▾] Dropdown
│   ├── Step Progress: ① ② ③ ④ ⑤ ⑥
│   ├── Title: "Step 1 · 频道识别与项目设定"
│   └── Right: 原著素材(209字) | 积分(2000)
├── MainContent (双栏布局)
│   ├── LeftPanel (AI 对话区)
│   │   ├── AI Msg: "小Alt已经收到你的小说..."
│   │   ├── AI Msg: "下面是小Alt识别出的..."
│   │   ├── Recognition Result Card
│   │   │   ├── Title: "互动体验识别 · 主推荐"
│   │   │   ├── Confidence: 60%
│   │   │   ├── Tags: 女频/现代/都市/青春
│   │   │   ├── Driver: 恋爱
│   │   │   ├── Recommended: "情感抉择"
│   │   │   │   └── Sub: 关系走向/情绪反馈/选择与被选择
│   │   │   ├── Reason: "核心选择是寒暄还是直接提问..."
│   │   │   └── CTA: [确认主互动体验] (uid=1242)
│   │   ├── Project Settings Card (确认后出现)
│   │   │   ├── Title: "项目设定 · 进入分析前确认"
│   │   │   ├── [✨ 一键采用 AI 推荐]
│   │   │   ├── Confirmed: "情感抉择/关系走向/..."
│   │   │   ├── Config 1: Episodes (16/30*/60/80/100)
│   │   │   ├── Config 2: Duration (1min/2-3min*/5min)
│   │   │   ├── Config 3: Platform (抖音*/快手/红果/番茄/其他)
│   │   │   ├── Config 4: Audience (女18-25*/...)
│   │   │   └── CTA: [确认设定，开始解析整部小说 →]
│   │   └── Chat Input Area
│   │       ├── Textbox: "追问、修改或 @ 当前模块..."
│   │       ├── [附件] [@] [Auto ▾]
│   │       └── [Send] (disabled when AI processing)
│   └── RightPanel (分析面板)
│       ├── Project Summary Bar
│       │   └── 情感抉择 | 30集 | 2-3min | 抖音 | 男18-25
│       ├── M1: 故事类型 (Story Type)
│       │   ├── Content: 都市言情
│       │   ├── Tags: 女频/BG/都市/言情
│       │   └── Actions: [采用] [修改]
│       ├── M2: 主角困境 (Protagonist Dilemma)
│       │   ├── Subtitle: 核心伤口
│       │   ├── Content: 李明忐忑不安...
│       │   ├── Tag: 缺失情感
│       │   └── Actions: [采用] [修改]
│       ├── M3: 情绪回响 (Emotional Echo)
│       ├── M4: 转机设定 (Turning Point)
│       ├── M5: 故事种子 (Story Seed)
│       ├── 01/05: 主角成长反差 (Growth Arc)
│       │   ├── From: 忐忑等待的男主
│       │   ├── To: 主动推进关系的男主
│       │   ├── Fields: 成长类型/核心伤口/缺失情感/成长方向
│       │   └── Actions: [@] [重新生成此卡]
│       ├── 02/05: 核心情感爽点 (Emotional Payoff)
│       │   ├── Ratios: 甜35% / 虐35% / 虐甜混合30%
│       │   ├── Fields: 主爽点/失落瞬间/回应瞬间
│       │   └── Actions: [调整配比] [@] [重新生成]
│       ├── 03/05: 关键对象 (Key Characters)
│       ├── 04/05: 名场面/修罗场 (Climax Scenes)
│       └── 05/05: 情感互动维度 (Interaction Dimension)
│           ├── Dimensions: 主动vs被动 | 亲密度20%
│           ├── [Intimacy Slider: − / +]
│           └── Actions: [@] [重新生成]
└── Floating Elements
    ├── AI Assistant FAB (右下角蓝色圆形)
    ├── Notifications Region
    └── Alert Region
```

#### 7.1.2 关键交互流程

```
用户上传剧本 → AI 识别互动体验(60%置信度)
    → 用户确认互动体验(点击uid=1242)
    → 出现主线/副线确认
    → 用户确认主线/副线(点击uid=1505)
    → 出现项目设定卡片
    → 用户确认设定(点击uid=1705)
    → 设定锁定 → AI 开始深度分析
    → 右侧面板流式生成 10 张分析卡片(M1-M5 + 01-05)
    → 全部完成后出现 [进入 Step 2 →] 按钮(点击uid=3111)
```

#### 7.1.3 数据模型（推断）

```typescript
interface Step1Data {
  projectConfig: {
    interactionType: '情感抉择'        // 互动体验类型
    subTypes: ['关系走向', '情绪反馈', '选择与被选择']
    confidence: number                   // 置信度 0-100
    tags: string[]                       // ['女频', 'BG', '都市', ...]
  }
  settings: {
    episodeCount: 16|30|60|80|100        // 集数
    duration: '1min'|'2-3min'|'5min'    // 单集时长
    platform: '抖音'|'快手'|...          // 发行平台
    audience: string                     // 目标受众
  }
  analysisCards: {
    metadata: MCard[]                    // M1-M5 元数据卡
    analysis: AnalysisCard[]             // 01/05-05/05 分析卡
  }
}
```

---

### 7.2 Step 2：故事画像

**URL**: `/workspace/step2?projectId=p_nnbnuvy7`  
**页面标题**: `Step 2 · AI 深度分析中`

#### 7.2.1 核心架构：4 Agent 并行分析

| Agent 名称 | 分析维度 | 输出内容 |
|------------|----------|----------|
| **体验设计 Agent** | 关系主动权、情感拉扯、信任起点、性格象征、物品隐喻、甜虐配比 | 体验维度分析文本 |
| **人物档案 Agent** | 场景张力、心理暗示、视觉符号、关系推进节奏、CP感建立 | 角色深度档案 |
| **空间制图 Agent** | 隐喻系统、视觉符号、互动基调、情绪反馈、悬念制造 | 场景/空间设计方案 |
| **结构师 Agent** | 关系弧线、张力来源、情感燃料、选择天平、命运逆转、集数规划 | 整体叙事架构 |

#### 7.2.2 M1-M5 模块详解

**M1 · 故事概览 (HeroCard)**
```
┌─────────────────────────────────────────────────────┐
│  M1 · 故事概览  HeroCard · 一句话定位与关键人物      │
│                                                     │
│  "咖啡馆初遇，李明面临如何开启对话的选择，             │
│   关系走向由他决定"                                  │
│                                                     │
│  [女频] [BG] [都市] [言情] [初遇] [情感抉择]         │
│  [关系推进] [对话选择]                               │
│                                                     │
│  模式: 1v1 深度拉扯 (橙色高亮)                      │
│                                                     │
│  👤 李明 — 忐忑男主 — 主角                          │
│  👤 林小雨 — 暖男大叔 — 女主                         │
│                                                     │
│  ✦ Promise: 李明将在初遇中掌握主动权                │
│  ✦ Thesis: 每一次对话选择都在重塑好感与信任          │
│                                                     │
│  [👍 方向对]  [👎 有问题]                            │
└─────────────────────────────────────────────────────┘
```

**M2 · 叙事弧 (6 阶段情绪曲线)**

| 阶段 | 名称 | 章节 | 集数 | 情绪 | 趋势 |
|------|------|------|------|------|------|
| 01 | 初始牵引 | 第1-3章 | 第1-3集 | 忐忑期待 | ▼ 低谷 |
| 02 | 试探靠近 | 第4-8章 | 第4-8集 | 好奇心动 | ▼ 低谷 |
| 03 | 误会加深 | 第9-14章 | 第9-14集 | 纠结失落 | ▼ 低谷 |
| 04 | 修罗场锁线 | 第15-20章 | 第15-20集 | 紧张拉扯 | ● 平稳 |
| 05 | 代价兑现 | 第21-26章 | 第21-26集 | 痛与觉醒 | ▼ 低谷 |
| 06 | 结局落点 | 第27-30章 | 第27-30集 | 释然坚定 | ● 平稳 |

**M3 · 核心体验画像 (4 维滑块)**

| 维度 | 值 | 最大值 | 说明 |
|------|-----|--------|------|
| 情绪拉扯 | 5 | 5 | 每一次选择都带来期待与失落交织的情绪波动 |
| 被选择 | 4 | 5 | 林小雨的状态取决于李明的选择 |
| 关系代价 | 3 | 5 | 误会和隐瞒需要付出代价 |
| 信任坍塌 | 3 | 5 | 信任危机让用户揪心 |

**M4 · 人物关系网**

```
     小雅(闺蜜)
       │盟友
       │
林小雨(女主) ◄── 暧昧 ──► 李明(主角)
       │                   │渴望主动推进关系
       │盟友               │
       │              阿强(情敌)
    阿强 ──竞争──►       │对林小雨有意思
       
服务员(路人/配角) — 善解人意
```

**M5 · 互动机会点 (Tab 式角色切换)**

| 角色 | 类型 | 互动机会点数 |
|------|------|-------------|
| 李明 | 主角 | 0 |
| 林小雨 | 女主 | 3 |
| 小雅 | 闺蜜 | 0 |
| 阿强 | 情敌 | 1 |

---

### 7.3 Step 3：互动方向

**URL**: `/workspace/step3?projectId=p_nnbnuvy7`  
**页面标题**: `Step 3 · 互动方向生成中`

#### 7.3.1 四方向逐一确认工作流

```
┌─────────────────────────────────────────────────────┐
│              Step 3 · 4 个方向逐一确认                │
│                                                     │
│  01 节奏 ──✅──► 02 钩子 ──✅──► 03 选择机制 ──✅──► │
│  Rhythm        Hooks         Selection Mech          │
│                                                     │
│  04 状态与反馈 ──✅──► [生成全集大纲 →]              │
│  State & Feedback                                    │
└─────────────────────────────────────────────────────┘
```

#### 7.3.2 方向 01：节奏 (Rhythm)

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 互动密度 | 每集 1 个 | 围绕关系抉择设置核心互动点 |
| 反馈速度 | 5 秒内 | 让被选与未被选对象都有即时反应 |
| 甜虐比例 | 44% / 56% | 先虐后甜 |

**热力图**: 30 集(E01-E30) × 3 级密度 = **90 个独立按钮**

#### 7.3.3 方向 02：钩子 (Hooks)

**设计哲学**: "钩子重点不是单纯悬念，而是把关系状态推到临界点"

| 阶段 | 集数 | 主调 | 收益 | 危机 |
|------|------|------|------|------|
| 开局 | 01-08 | 关系升温 | 4 | 4 |
| 中段 | 09-23 | 关系紧张 | 6 | 9 |
| 后段 | 24-30 | 关系紧张 | 3 | 4 |

**热力图**: 30 集 × 二元(橙=升温 / 灰=紧张)

#### 7.3.4 方向 03：选择机制 (Selection Mechanism)

**核心原则**: "选项必须是接电话、坦白、靠近、拒绝、当众表态等关系动作"

| 类型 | 标签 | 动作示例 | 选项数 |
|------|------|----------|--------|
| 态度回应型 | 采用 | 坦白/冷处理/试探/拒绝 | 4 |
| 关系动作型 | 采用 | 靠近/推开/接电话/留下来 | 4 |
| 修罗场站位 | 采用 | 站A/站B/端水/中立 | 4 |
| 原谅边界型 | 采用 | 原谅/不原谅/暂缓 | 3 |
| 任务解谜型 | 降权 | 只做辅助，不抢关系主轴 | - |

#### 7.3.5 方向 04：状态与反馈 (State & Feedback)

**核心原则**: "选择后必须沉淀为可见的关系状态，不让分支闭合后全部抹平"

| 维度 | 名称 | 性质 |
|------|------|------|
| 1 | 好感 | 正向积累 |
| 2 | 信任 | 关系深度 |
| 3 | 占有 | 排他欲望 |
| 4 | 风险 | 负面累积 |
| 5 | 嫉妒 | 社会比较 |

---

### 7.4 Step 4：全集大纲

**URL**: `/workspace/step4?projectId=p_nnbnuvy7`  
**页面标题**: `Step 4 · 弧线骨架已完成，开始生成分集`

#### 7.4.1 6 阶段弧线骨架（最终版本）

| 序号 | 代号 | 阶段名称 | 集数 | 情绪线 |
|------|------|----------|------|--------|
| 01 | 初 | 焦灼初遇 | 1-8 | 紧张→好奇→好感萌芽→试探→初步信任 |
| 02 | 试 | 暧昧拉扯 | 9-20 | 误会滋生→互相试探→暧昧升温→修罗场初现→感觉确认 |
| 03 | 结 | 确认奔赴 | 21-30 | 核心矛盾爆发→误解澄清→心结解开→坦诚告白→确认关系 |

> 注：阶段数量从最初的 6 阶段演化为 3 阶段（可能因剧本长度/复杂度动态调整）

#### 7.4.2 分集卡片完整字段结构（以 Ep.01 为例）

```
┌─────────────────────────────────────────────────────────┐
│  Ep.01  红衣初见                           [▾ 展开/折叠] │
├─────────────────────────────────────────────────────────┤
│  📖 剧情推进                                             │
│  李明在咖啡馆焦灼等待，红衣女孩林小雨推门而入。确认身份   │
│  后，李明面临是直接切入主题还是先寒暄暖场的选择...       │
│                                                         │
│  🎯 本集功能                                             │
│  李明在咖啡馆等待林小雨，红衣女孩推门而入，他面临如何     │
│  开启对话的第一次情感抉择                                 │
│                                                         │
│  👥 角色状态:  [李明] [林小雨] [服务员]                   │
│                                                         │
│  📍 场景承接:  [咖啡馆角落] [咖啡馆门口]                  │
│                                                         │
│  📊 状态变化                                             │
│  好感: 李明→林小雨 0.5 | 林小雨→李明 0.3                 │
│  ████████████████░░░░░░░ (橙色渐变条)                    │
│                                                         │
│  🔀 互动节点                                             │
│  A: 用轻松语气聊聊天气...                                │
│  B: 直接问出今天见面的目的...                             │
│  → 反馈方式: [根据选择显示不同结果]                       │
│                                                         │
│  🪝 结尾钩子                                             │
│  李明说出寒暄的话，林小雨微微一笑，但眼神里闪过一丝      │
│  不易察觉的审视  [类型: 悬念/试探]                        │
│                                                         │
│  📎 原文映射回查                                         │
│  • 焦灼等待 (原文片段1)                                  │
│  • 红衣初现 (原文片段2)                                  │
│  • 首次抉择 (原文片段3)                                  │
│                                                         │
│              [选中此字段调整 @]                           │
└─────────────────────────────────────────────────────────┘
```

#### 7.4.3 右上角统计数据（实时更新）

| 指标 | 初始值 | 最终观察值 | 说明 |
|------|--------|-----------|------|
| 总集数 | 30 | 30 | 固定不变 |
| 含互动集数 | 0 | 15+ | 动态增长中 |
| 阶段数 | 6 → 3 | 3 | 可能动态合并 |

---

## 8. 数据结构与状态模型

### 8.1 全局状态模型（推断）

```typescript
interface AltFlowGlobalState {
  // 用户信息
  user: {
    id: string          // "5849"
    credits: number     // 1998 (动态扣减)
    language: 'zh' | 'en'
  }
  
  // 当前项目
  project: {
    id: string          // "p_nnbnuvy7"
    title: string       // "第一场：咖啡馆 - 日"
    originalScript: {
      content: string   // 原始剧本文本
      wordCount: number // 209
      format: 'txt' | 'docx' | 'pdf'
    }
  }
  
  // 步骤进度
  stepProgress: {
    currentStep: 1 | 2 | 3 | 4 | 5 | 6
    completedSteps: number[]
    stepStates: {
      step1: 'completed'
      step2: 'completed'
      step3: 'completed'
      step4: 'generating' | 'completed'
      step5: 'locked' | 'available'
      step6: 'locked' | 'available'
    }
  }
  
  // AI 生成状态
  generation: {
    isGenerating: boolean
    currentPhase: string    // "弧线骨架" | "分集生成"
    progress: number        // 百分比 0-100
    currentStage: number    // 当前生成的阶段序号
    episodesGenerated: number // 已生成分集数
    interactiveEpisodes: number // 含互动集数
  }
}
```

### 8.2 Step 4 分集数据模型（推断）

```typescript
interface Episode {
  id: string              // "ep-01"
  number: number          // 1
  title: string           // "红衣初见"
  stageId: string         // 所属阶段 ID
  
  // 核心内容字段
  plotProgression: string // 剧情推进（段落文本）
  episodeFunction: string // 本集功能（段落文本）
  
  // 标签组
  characterStates: string[]    // ["李明", "林小雨", "服务员"]
  sceneConnections: string[]   // ["咖啡馆角落", "咖啡馆门口"]
  
  // 状态变化
  stateChanges: {
    affinityChanges: AffinityChange[]  // 好感变化数组
  }
  
  // 互动节点
  interactionNode?: {
    optionA: { text: string; consequence: string }
    optionB: { text: string; consequence: string }
    feedbackType: string
  }
  
  // 结尾钩子
  endingHook?: {
    content: string
    type: '悬念' | '试探' | '反转' | '温暖'
  }
  
  // 原文映射
  sourceMapping?: SourceMapping[]
}

interface AffinityChange {
  from: string    // "李明"
  to: string      // "林小雨"
  baseline: number // 0.5
  delta?: number   // 选择后的增量
}

interface SourceMapping {
  label: string   // "焦灼等待"
  excerpt: string // 原文片段
}
```

---

## 9. 用户体验亮点总结

### 9.1 核心体验原则

| 原则 | 体现位置 | 设计价值 |
|------|----------|----------|
| **渐进式披露** | 6 步向导 | 降低认知负荷，每步只关注一个维度 |
| **AI 透明度** | 置信度/进度/理由展示 | 建立用户对 AI 决策的信任 |
| **可干预性** | 暂停按钮 + @提及 + 局部修改 | 用户始终保持控制权 |
| **可视优先** | 热力图/情绪曲线/关系图 | 复杂信息一目了然 |
| **上下文感知** | 每个配置项的业务提示 | 帮助非专业用户理解选项影响 |
| **防错设计** | 锁定机制 + 确认流程 | 避免误操作导致的数据丢失 |
| **即时反馈** | 含互动集数实时增长 | 让用户感受到进展 |

### 9.2 交互设计亮点

1. **热力图作为核心交互范式**: 用 30 列热力图让用户在单一视图中理解并调整全剧的互动分布，比填表单直观 10 倍
2. **@提及机制**: 在聊天框中 @特定模块即可精准定位修改目标，降低了编辑器的学习成本
3. **分集卡片折叠/展开**: 默认折叠减少信息噪音，展开后提供 8 个字段的完整编辑能力
4. **4 方向逐一确认**: 不是一次性展示所有配置，而是引导用户逐个理解每个设计维度
5. **多 Agent 人格化**: 每个 Agent 有专业领域（体验设计/人物档案/空间制图/结构师），让 AI 输出更有说服力

### 9.3 信息架构亮点

1. **M 系列 + 数字系列编号**: 元数据(M)与分析数据(数字)分离，层次清晰
2. **单字阶段代号**: 初/试/误/修/代/结 — 在窄屏空间中高效传递阶段语义
3. **Promise/Thesis 框架**: 用「承诺+主张」两句话定位整个项目的叙事内核
4. **三段式情绪线**: 每个阶段用 3-5 个关键词串联情绪流转（如：紧张→好奇→好感萌芽）

---

## 10. 复现实现指南

### 10.1 技术栈建议

| 层次 | 推荐技术 | 替代方案 |
|------|----------|----------|
| **前端框架** | React 18 + TypeScript | Vue 3 + TypeScript |
| **状态管理** | Zustand | Redux Toolkit / Pinia |
| **路由** | React Router v6 + 路由守卫 | Vue Router + beforeEach |
| **UI 组件库** | 自研（暗色主题） | Radix UI + Tailwind CSS |
| **热力图** | Canvas API / D3.js | SVG 内联 |
| **实时通信** | SSE (EventSource) | WebSocket / Socket.io |
| **AI 集成** | OpenAI API / Claude API | 自部署 LLM |
| **后端** | Node.js + Express / FastAPI | Go / Rust |

### 10.2 核心组件实现要点

#### 热力图组件 (HeatmapGrid)

```tsx
// 伪代码 - 核心思路
<HeatmapGrid
  columns={30}                    // E01-E30
  rows={3}                       // 3 级密度
  data={rhythmData}              // 每格的值 0-3
  onCellClick={(ep, level) => {
    setEpisodeDensity(ep, level) // 更新该集密度
  }}
  legend={[
    { color: '#FF6B35', label: '高互动密度' },
    { color: '#333', label: '铺垫·推进集' },
  ]}
/>
// 渲染: 30×3 = 90 个 <button>，CSS Grid 布局
```

#### 分集卡片组件 (EpisodeCard)

```tsx
<EpisodeCard
  episode={episodeData}
  isExpanded={expandedId === episode.id}
  onToggle={() => toggleExpand(episode.id)}
  fields={[
    'plotProgression',    // 剧情推进
    'episodeFunction',    // 本集功能
    'characterStates',    // 角色状态 (tags)
    'sceneConnections',   // 场景承接 (tags)
    'stateChanges',       // 状态变化 (progress bar)
    'interactionNode',    // 互动节点 (A/B options)
    'endingHook',         // 结尾钩子
    'sourceMapping',      // 原文映射
  ]}
  renderField={(field, value) => (
    <FieldRenderer field={field} value={value}>
      <AdjustButton onClick={() => @mention(field)} />
    </FieldRenderer>
  )}
/>
```

#### 步骤进度条 (StepProgress)

```tsx
<StepProgress
  steps={6}
  current={4}
  completed={[1, 2, 3]}
  labels={['频道识别', '故事画像', '互动方向', '全集大纲', '互动大纲', '?']}
  renderStep={(step, status) => (
    <StepIndicator
      number={step}
      status={status}  // 'active' | 'completed' | 'upcoming'
    />
  )}
/>
```

### 10.3 关键实现难点

| 难点 | 解决思路 |
|------|----------|
| **路由守卫防止跳步** | 在路由配置中添加 `canActivate` 守卫，检查前置步骤完成状态 |
| **AI 流式生成** | 使用 SSE 推送生成进度，前端通过 `eventSource.onmessage` 更新 UI |
| **热力图性能** | 90+ 按钮使用虚拟渲染，仅渲染可视区域内的按钮 |
| **状态持久化** | 每步确认后将状态序列化存入 localStorage / 后端 DB |
| **@提及解析** | 在输入框中监听 `@` 键，弹出模块选择浮层，插入格式化的引用标记 |
| **分集动态加载** | 30 集使用虚拟滚动 + 懒加载，仅渲染可视区域的分集卡片 |

### 10.4 待探索区域（Step 5-6）

由于 AI 分集生成过程耗时较长（30 集需数分钟），本次采集未能进入以下步骤：

| 步骤 | 推测功能 | 优先级 |
|------|----------|--------|
| **Step 5: 互动大纲** | 每个互动节点的 A/B 选项详细设计、分支逻辑、条件跳转规则 | ⭐⭐⭐ |
| **Step 6: 导出/发布** | 最终产物导出（JSON/视频脚本/互动配置文件）、发布到各平台 | ⭐⭐ |

**建议后续探索方式**：
1. 等待当前测试项目的 Step 4 生成完全完成（约 30 集全部生成）
2. 点击「进入 Step 5」按钮进入互动大纲编辑器
3. 采集互动节点的完整分支逻辑和数据结构
4. 进入 Step 6 采集导出/发布流程

---

## 附录 A：采集元数据

| 属性 | 值 |
|------|-----|
| **采集工具** | TABBIT 浏览器自动化代理 |
| **采集方法** | take_snapshot (full mode) + take_screenshot + e2b_grep |
| **采集时间** | 2026-06-18 18:00 - 18:36 (UTC+8) |
| **总快照数** | 12 次 full snapshot + 10 次 actionable snapshot |
| **总截图数** | 15 张 |
| **DOM 数据量** | 约 200KB+ (纯文本) |
| **覆盖步骤** | Step 1 (100%) / Step 2 (100%) / Step 3 (100%) / Step 4 (95%) |
| **未覆盖** | Step 5 (0%) / Step 6 (0%) |
| **测试项目 ID** | p_nnbnuvy7 |
| **测试剧本长度** | 209 字 |
| **积分消耗** | 2 积分 (2000 → 1998) |

## 附录 B：UID 索引（部分关键元素）

| UID | 元素 | 所在步骤 | 用途 |
|-----|------|----------|------|
| 1242 | 确认主互动体验 | Step 1 | 确认 AI 识别的互动体验类型 |
| 1505 | 确认主线副线 | Step 1 | 进入项目设定阶段 |
| 1705 | 确认项目设定 | Step 1 | 锁定设定并启动 AI 分析 |
| 3111 | 进入 Step 2 | Step 1 | 导航到故事画像 |
| 3812 | 进入互动方向调整 | Step 2 | 导航到 Step 3 |
| 4639 | 确认 01 节奏 | Step 3 | 确认第 1 个方向 |
| 5509 | 确认 02 钩子 | Step 3 | 确认第 2 个方向 |
| 6161 | 确认 03 选择机制 | Step 3 | 确认第 3 个方向 |
| 7062 | 确认 04 状态与反馈 | Step 3 | 确认第 4 个方向 |
| 8001 | 生成全集大纲 | Step 3 | 导航到 Step 4 |
| 8451 / 9524 | 进入 Step 5 | Step 4 | 导航到 Step 5 (需生成完成) |

---

> **文档结束**  
> 本报告基于 AltFlow 平台 (altflow.cn) Step 1-4 的全量 DOM 逆向分析编写，共识别 **89 个独立 UI 组件** 和 **69 个设计模式**。  
> 如需补充 Step 5-6 的分析，请在 Step 4 分集完全生成完成后重新进入编辑器。
