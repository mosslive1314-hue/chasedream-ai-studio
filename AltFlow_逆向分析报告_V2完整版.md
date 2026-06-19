# AltFlow · 互动影视游戏开发平台 — 完整逆向工程分析报告 V2

> **文档目的**: 供编程智能体阅读的通俗技术文档，用于复现 AltFlow 平台的页面 UI 布局、功能设计、交互逻辑与深度编辑机制  
> **版本**: V2 完整版（含 Step 1-6 全流程 + 深度交互探索）  
> **分析日期**: 2026-06-18  
> **平台地址**: https://altflow.cn  
> **采集深度**: Step 1-6 全量 DOM 采集 + 关键交互操作验证  
> **项目 ID**: p_nnbnuvy7（测试项目）  

---

## 目录

1. [平台概览](#1-平台概览)
2. [技术架构推断](#2-技术架构推断)
3. [全局布局系统](#3-全局布局系统)
4. [完整工作流：6 步引导模式（全量解析）](#4-完整工作流6步引导模式全量解析)
5. [UI 组件完整清单（102 个）](#5-ui-组件完整清单102-个)
6. [设计模式目录（82 个）](#6-设计模式目录82-个)
7. [各步骤详细逆向分析（Step 1-6 全量）](#7-各步骤详细逆向分析step-1-6-全量)
8. [三层局部编辑机制（核心发现）](#8-三层局部编辑机制核心发现)
9. [数据结构与状态模型](#9-数据结构与状态模型)
10. [用户体验亮点总结](#10-用户体验亮点总结)
11. [复现实现指南](#11-复现实现指南)

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
│ txt/docx/pdf│ 多Agent并行│ 热力图编辑 │ 互动画板（节点分支图）  │
│ 50万字支持  │ 故事画像   │ 选择机制定义│ 互动剧本（逐集生成）    │
│             │ 叙事弧线   │ 钩子设计   │ 预览/导出              │
│             │ 角色关系网 │ 反馈规则   │ Diff保留编辑           │
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
│  左侧面板(AI 对话) │ 右侧面板(结构化编辑器/画布/脚本编辑器)   │
└────────────────────────────────────────────────────────────┘
```

### 2.2 各步骤渲染架构差异

| 步骤 | 右侧面板类型 | 渲染技术 | 交互范式 |
|------|-------------|----------|----------|
| Step 1-3 | 结构化卡片列表 | DOM 元素 | 表单填写 + 确认按钮 |
| Step 4 | 分集卡片编辑器 | DOM + 虚拟滚动 | @选中调整 + 展开/折叠 |
| Step 5 | **SVG 节点画布** | Canvas/SVG 内联 | **节点拖拽 + 连线 + 弹窗编辑** |
| Step 6 | **富文本脚本编辑器** | ContentEditable/CodeMirror | **Diff 编辑 + 打回重写** |

### 2.3 AI 引擎架构（推断）

```
用户输入剧本 (209字 → AI扩展至1万字)
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
│  • 6(3) 阶段弧线骨架推断                     │
│  • 30 集分逐一集展开                         │
│  • 自动标记含互动集数                        │
│  • 互动节点 A/B 选项生成                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│     Step 5: 互动画板生成引擎                │
│  • 将分集大纲转化为节点式分支叙事图            │
│  • 场景→互动节点→A/B选项→分支反馈→合流锁定   │
│  • 状态变化数值化(好感/信任/误会)            │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│     Step 6: 逐集剧本生成引擎                 │
│  • 每集独立生成(~6.4k tokens/集)             │
│  • 带入前后集上下文保证连贯性                 │
│  • 支持直接编辑(diff保留) + 打回重写          │
└─────────────────────────────────────────────┘
```

---

## 3. 全局布局系统

### 3.1 页面骨架 (Page Skeleton)

```
╔══════════════════════════════════════════════════════════╗
║  ┌────┐  ┌──────────────────────────────────────────┐  ║
║  │Side│  │  Top Bar: [☰] [模块名 ▾] · ①②③④⑤⑥      │  ║
║  │bar │  │  Step N · 状态描述    项目名 数据 积分    │  ║
║  │    │  └──────────────────────────────────────────┘  ║
║  │Logo│  ┌─────────────────┬─────────────────────────┐ ║
║  │    │  │                 │                         │ ║
║  │首页│  │   Left Panel    │    Right Panel          │ ║
║  │    │  │   (AI Chat)    │    (随步骤变化)         │ ║
║  │工作台│  │                 │  Step1-3: 卡片列表      │ ║
║  │    │  │  [AI Messages]  │  Step4:  分集卡片编辑器  │ ║
║  │────│  │                 │  Step5:  SVG节点画布     │ ║
║  │语言│  │  [Input Box]    │  Step6:  脚本编辑器+Dock │ ║
║  │用户│  │  [@提及][附件]  │                         │ ║
║  │退出│  └─────────────────┴─────────────────────────┘ ║
║  └────┘                                                 ║
║  ┌──────────────────────────────────────────────────┐  ║
║  │ Bottom Bar: 状态文本  [||暂停]  [下一步 →]        │  ║
║  └──────────────────────────────────────────────────┘  ║
║  ┌──────────────────────────────────────────────────┐  ║
║  │ [🤖] AI Assistant (FAB, 右下角悬浮按钮)          │  ║
║  └──────────────────────────────────────────────────┘  ║
╚════════════════════════════════════════════════════════╝
```

### 3.2 色彩系统 (Color System)

| 用途 | 色值（推断） | 使用场景 |
|------|-------------|----------|
| **品牌主色** | `#FF6B35` (橙色) | 激活态 Tab、主按钮、高亮标签 |
| **成功色** | `#22C55E` (绿色) | 已完成步骤 (✓)、确认状态 |
| **背景色** | `#0F0F0F` (深黑) | 主背景（暗色主题） |
| **卡片背景** | `#1A1A1A` (深灰) | 卡片容器、面板背景 |
| **文字主色** | `#F5F5F5` (近白) | 标题、正文 |
| **文字次色** | `#999999` (中灰) | 辅助说明、提示文字 |
| **边框色** | `#333333` (暗灰) | 卡片边框、分割线 |
| **@提及紫色** | `#A78BFA` (淡紫) | @选中调整标签、范围标记 |
| **警告色** | `#FF9500` (橙黄) | 警告横幅、质量检测提示 |

---

## 4. 完整工作流：6 步引导模式（全量解析）

### 4.1 工作流总览

```
Step 1          Step 2          Step 3          Step 4          Step 5          Step 6
频道识别  ──→   故事画像  ──→   互动方向  ──→   全集大纲  ──→   互动画板  ──→   互动剧本
  │              │              │              │              │              │
  ▼              ▼              ▼              ▼              ▼              ▼
识别互动体验    多Agent分析    4方向×12判断   6阶段×30集     节点式分支图    逐集生成+编辑
确认项目设定    M1-M5模块     热力图配置     分集卡片展开    A/B选项连线    Diff保留+打回
AI深度分析      故事画像确认   逐方向确认     弧线骨架完成    节点弹窗编辑    预览+导出
```

### 4.2 各步骤输入输出与 UI 范式

| 步骤 | 核心输入 | 核心输出 | 右侧面板 UI 范式 | 下一步依赖 |
|------|----------|----------|-----------------|------------|
| **Step 1** | 原始剧本文本 (209字) | 互动体验类型 + 项目设定 + 10张分析卡 | **结构化卡片列表** (M系列+数字系列) | 设定锁定后触发 AI 分析 |
| **Step 2** | Step 1 的分析结果 | M1-M5 五大故事画像模块 + 4 Agent 并行输出 | **多模块卡片** (HeroCard/叙事弧/滑块/关系图/Tab) | 故事画像确认后解锁 Step 3 |
| **Step 3** | Step 2 的故事画像 | 4 个互动方向配置 + 360 个热力图按钮 | **Tab 切换 + 热力图网格** (4个方向逐一确认) | 4 方向全部确认后解锁 Step 4 |
| **Step 4** | Step 3 的方向配置 | 6(3) 阶段弧线 + 30 集分集卡片(每集 8 字段) | **分集卡片编辑器** (@选中调整+展开折叠) | 全部生成完成后解锁 Step 5 |
| **Step 5** | Step 4 的全集大纲 | 节点式互动分支叙事图 (SVG 画布) | **SVG 节点画布** (场景→节点→选项→反馈→合流) | 画板生成完成后解锁 Step 6 |
| **Step 6** | Step 5 的互动画板 | 逐集可编辑互动剧本 (带 Diff) | **脚本编辑器 + Dock 导航** (预览/导出/打回) | 最终交付物 |

---

## 5. UI 组件完整清单（102 个）

### 5.1 导航与布局组件 (1-15)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 01 | 左侧边栏 | Sidebar | 全局固定 | Logo + 导航项 + 用户信息 + 可收起 |
| 02 | 顶部导航栏 | TopBar | 全局固定 | 汉堡菜单 + 模块下拉 + Step 进度条 |
| 03 | Step 进度指示器 | Step Progress Indicator | TopBar | ①②③④⑤⑥ 圆形编号，完成态绿色✓ |
| 04 | 底部操作栏 | BottomBar | 页面底部 | 状态文本 + 暂停按钮 + 下一步按钮 |
| 05 | 双栏布局 | Dual-Pane Layout | Step1-4 Main | 左侧对话 + 右侧结构化编辑器 |
| 06 | 三栏布局 | Triple-Pane Layout | Step6 Main | 左对话 + 中脚本编辑器 + 右Dock导航 |
| 07 | 模块下拉选择器 | Module Dropdown | TopBar 左侧 | 「互动剧本」/「互动大纲画板」/「全集大纲」等 |
| 08 | 账户积分按钮 | Credits Button | TopBar 右侧 | 显示当前积分余额(1940) |
| 09 | AI 助手悬浮按钮 | AI Assistant FAB | 右下角 | 蓝色圆形，点击打开 AI 助手 |
| 10 | 通知区域 | Notifications Region | 右上角 | `live=polite` |
| 11 | Alert 区域 | Alert Region | 页面底部 | `live=assertive` |
| 12 | 侧边栏收起按钮 | Collapse Sidebar Button | Sidebar 顶部 | 图标按钮 |
| 13 | 语言切换按钮 | Language Switcher | Sidebar 底部 | 中/英 切换 |
| 14 | 用户信息按钮 | User Profile Button | Sidebar 底部 | 显示「用户5849」 |
| 15 | 退出登录按钮 | Logout Button | Sidebar 底部 | 文本按钮 |

### 5.2 AI 对话组件 (16-27)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 16 | AI 消息气泡 | AI Message Bubble | Left Panel | 支持 Markdown 格式，带加载动画 |
| 17 | 用户消息气泡 | User Message Bubble | Left Panel | 用户发送的消息展示 |
| 18 | 聊天输入框 | Chat Input | LeftPanel 底部 | 支持 @提及、附件上传 |
| 19 | 发送按钮 | Send Button | Input 右侧 | Enter 发送，默认 disabled |
| 20 | 附件按钮 | Attachment Button | Input 左侧 | 上传文件附件 |
| 21 | @提及按钮 | @Mention Button | Input 左侧 | @ 模块进行局部调整 |
| 22 | 模式选择下拉 | Mode Selector | Input 右侧 | Auto / Manual 模式切换 |
| 23 | 快捷键提示 | Shortcut Hint | Input 下方 | Enter 发送 / Shift+Enter 换行 |
| 24 | 暂停按钮 | Pause Button | BottomBar 中央 | `\|\|` 图标，橙色激活态 |
| 25 | 状态标签 | Status Label | LeftPanel 顶部 | 橙色标签显示当前锁定状态 |
| 26 | 加载动画 | Loading Animation | AI 消息内 | 旋转图标 + 「正在分析中...」 |
| 27 | 进度卡片 | Progress Card | LeftPanel | 显示当前生成阶段和百分比 |

### 5.3 结构化卡片组件 (28-52)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 28 | 识别结果卡 | Recognition Result Card | Step1 Right | 置信度 + 标签组 + 推荐按钮 |
| 29 | 项目设定卡 | Project Settings Card | Step1 Right | 4 组配置项(集数/时长/平台/受众) |
| 30 | 元数据卡(M系列) | Metadata Card (M-Series) | Step1/2 Right | M1-M5 编号系统，[采用]/[修改] |
| 31 | 分析卡(数字系列) | Analysis Card (Numbered) | Step1 Right | 01/05-05/05，[@]/[重新生成] |
| 32 | HeroCard | Hero Card | Step2 M1 | 一句话定位 + Promise/Thesis |
| 33 | 叙事弧卡 | Narrative Arc Card | Step2 M2 | 6 阶段情绪曲线可视化 |
| 34 | 体验画像卡 | Experience Profile Card | Step2 M3 | 4 维滑块控件(1-5 刻度) |
| 35 | 人物关系网卡 | Relationship Graph Card | Step2 M4 | 角色节点 + 关系连线图 |
| 36 | 互动机会点卡 | Interaction Opportunity Card | Step2 M5 | Tab 式角色切换 |
| 37 | 方向配置卡 | Direction Config Card | Step3 Right | 4 个方向 Tab 切换 |
| 38 | 节奏预览卡 | Rhythm Preview Card | Step3-01 | 三维配置(密度/速度/比例) |
| 39 | 钩子走势卡 | Hook Trend Card | Step3-02 | 二元热力图 + 三阶段分栏 |
| 40 | 选择机制预览卡 | Selection Mech Preview Card | Step3-03 | 4 类选择类型 + 降权标记 |
| 41 | 状态反馈预览卡 | State Feedback Preview Card | Step3-04 | 5 维状态系统 |
| 42 | 阶段详情卡 | Stage Detail Card | Step4 Right | 意图+描述+情绪线+映射 |
| 43 | **分集卡片** | **Episode Card** | **Step4 Right** | **可折叠展开，8 个核心字段** |
| 44 | 点赞/点踩按钮组 | Thumbs Up/Down Buttons | Step2 M1 | 卡片级反馈 |
| 45 | 锁定状态卡 | Locked State Card | Step1 (确认后) | 灰色禁用态 + 「重新分析」 |
| 46 | 判断审核区 | Judgment Review Area | Step3 Each Dir | 3 道判断逐一审阅 |
| 47 | 警告横幅 | Warning Banner | Step4 底部 | 橙色图标 + 质量检测提示 |
| 48 | 项目摘要栏 | Project Summary Bar | Step2-4 TopRight | 标签云 + 关键参数一览 |
| 49 | 操作按钮组 | Action Button Group | 各卡片底部 | 采用/修改/@/重新生成 等 |
| 50 | 提示文字组件 | Hint Text Component | 各配置项下方 | 上下文相关的业务提示 |
| **51** | **@选中调整按钮** | **@Select & Adjust Button** | **Step4 Each Field** | **每个字段右下角，点击触发左侧@提及** |
| **52** | **字段容器** | **Field Container** | **Step4 Episode Card** | **8种字段类型：剧情推进/本集功能/角色状态/场景承接/状态变化/互动节点/结尾钩子/原文映射** |

### 5.4 画布与节点组件 (53-68) — Step 5 新增

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| **53** | **SVG 互动画布** | **Interactive Canvas** | **Step5 Right** | **节点式分支叙事编辑器，支持拖拽平移** |
| **54** | **场景节点** | **Scene Node** | **Step5 Canvas** | **起始节点，显示场景描述** |
| **55** | **互动节点** | **Interaction Node** | **Step5 Canvas** **菱形** | **核心决策点，含 A/B 选项** |
| **56** | **选项节点** | **Option Node (A/B)** | **Step5 Canvas** | **具体选择内容 + 反馈方式** |
| **57** | **分支反馈节点** | **Branch Feedback Node** | **Step5 Canvas** | **选择后的结果描述 + 状态变化数值** |
| **58** | **合流锁定节点** | **Convergence Lock Node** | **Step5 Canvas** | **分支合并点，无论选择如何的后续走向** |
| **59** | **状态承接节点** | **State Inheritance Node** | **Step5 Canvas** | **CP 数值变化延续到下一集** |
| **60** | **节点连线** | **Node Connection Line** | **Step5 Canvas** | **SVG path/line 连接各节点** |
| **61** | **节点操作按钮组** | **Node Action Buttons** | **Each Node** | **让AI调整 / 删除节点 / 拖出连线 (3种)** |
| **62** | **布局切换** | **Layout Toggle** | **Step5 Canvas Top** | **横向 / 竖向 两种布局模式** |
| **63** | **集数横向导航** | **Episode Horizontal Nav** | **Step5 Canvas Top** | **Ep.01, Ep.04 ... 可滑动切换查看不同集** |
| **64** | **添加分支按钮** | **Add Branch Button** | **Option Node** | **为当前选项增加新分支路径** |
| **65** | **节点级编辑弹窗** | **Node Edit Modal** | **Step5 Overlay** | **点击「调整方向」弹出，含快捷芯片** |
| **66** | **快捷操作芯片** | **Quick Action Chips** | **Edit Modal** | **5个预设指令芯片** |
| **67** | **Token 成本估算** | **Token Cost Estimate** | **Edit Modal Footer** | **~3.2k tokens 预估显示** |
| **68** | **级联影响提示** | **Cascade Impact Hint** | **Edit Modal Footer** | **"完成后会展示级联影响"** |

### 5.5 脚本编辑器组件 (69-85) — Step 6 新增

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| **69** | **Dock 集数导航** | **Episode Dock Navigator** | **Step6 Right** | **垂直列表，30集按钮，hover预览+点击载入** |
| **70** | **集数 Dock 按钮** | **Episode Dock Button** | **Step6 Dock** | **格式: "Ep.01 红外套的初见 待生成 — 可生成本集"** |
| **71** | **集状态指示器** | **Episode Status Indicator** | **Each Dock Btn** | **待生成/已通过/待审核 三种状态** |
| **72** | **脚本编辑区** | **Script Editor Area** | **Step6 Center** | **富文本/代码编辑器，支持直接改字** |
| **73** | **生成剧本按钮** | **Generate Script Button** | **Step6 Center** | **"✨ 生成 Ep.01 剧本 ~6.4k tokens"** |
| **74** | **预览按钮** | **Preview Button** | **Step6 TopRight** | **👁 预览 生成的剧本效果** |
| **75** | **导出按钮** | **Export Button** | **Step6 TopRight** | **⬇ 导出 "0 / 30" 计数器** |
| **76** | **集元数据栏** | **Episode Meta Bar** | **Step6 TopRight** | **集名 + 状态标签(待生成) + 时长 + 预计积分** |
| **77** | **Diff 保留标识** | **Diff Badge** | **Edited Episodes** | **表示该集有未提交的修改 diff** |
| **78** | **打回重写按钮** | **Reject & Rewrite Button** | **Step6 Bottom** | **整集不合格时让AI重新写** |
| **79** | **前后集上下文提示** | **Context Hint** | **Step6 AI Msg** | **"带着前后集上下文单独写这一集"** |
| **80** | **脚本生成规则提示** | **Script Generation Rules** | **Step6 Left Panel** | **8条AI写作规则(眼神/停顿/误会/拉扯等)** |
| **81** | **通过/审核计数** | **Pass/Review Counter** | **Step6 TopBar** | **"已通过 0 / 30 · 待审核 0"** |
| **82** | **集名标题** | **Episode Title Display** | **Step6 Center Top** | **"Ep.01 红外套的初见" 大标题** |
| **83** | **空状态展示** | **Empty State** | **Step6 Center** | **AI机器人动画 + "Ep.01 还没生成"** |
| **84** | **顺序锁机制** | **Sequential Lock** | **Step6 Dock** | **Ep.02-30 显示"请先通过 Ep.01"** |
| **85** | **@集数提及标签** | **@Episode Mention Tag** | **Step6 Input** | **输入框自带 "@Ep.01 红外套的初见" 标签** |

### 5.6 交互控件组件 (86-102)

| # | 组件名称 | 英文名 | 所在位置 | 关键属性 |
|---|---------|--------|----------|----------|
| 86 | 选项按钮组 | Option Button Group | Step1 Settings | 16/30/60/80/100 集等选项 |
| 87 | 大橙色主按钮 | Primary CTA Button | 多处关键操作 | 橙色背景，白色文字，箭头后缀 |
| 88 | 次要按钮 | Secondary Button | 辅助操作 | 线框或灰色样式 |
| 89 | 危险/重做按钮 | Danger/Retry Button | 重置操作 | 灰色或红色调，提示积分消耗 |
| 90 | Tab 切换组件 | Tab Switch Component | Step3 Directions / Step2 M5 | 4 个方向 Tab / 角色 Tab |
| 91 | 水平阶段导航 | Horizontal Stage Nav | Step4 Top | 左右滑动 + 选中态橙色边框 |
| 92 | 分集折叠/展开 | Episode Expand/Collapse | Step4 Episode | 点击标题区域切换展开状态 |
| 93 | 三级密度按钮组 | Ternary Density Buttons | Step3-01 Heatmap | 每 3 个按钮一组(1/2/3 级) |
| 94 | 5 级刻度按钮 | 5-Level Scale Buttons | Step2 M3 Slider | 1/5 到 5/5 共 5 个独立按钮 |
| 95 | 定制判断入口 | Custom Judgment Entry | Step3 Each Dir | 「点开后告诉 AI 怎么改」 |
| 96 | 一键采用推荐 | One-click Adopt Recommendation | Step1 Settings | `✨ 一键采用 AI 推荐` |
| 97 | 重新分析按钮 | Re-analyze Button | Step1 Locked State | 右上角，解除锁定重新开始 |
| 98 | 全部重做按钮 | Redo All Button | Step3/4 Bottom | 重做所有已确认内容 |
| 99 | 向左/右查看阶段 | Stage Scroll Left/Right | Step4 Stage Nav | 阶段过多时的左右翻页 |
| 100 | 集数选项芯片 | Episode Count Chip | Step1 Settings | 16/30/60/80/100 橙色高亮选中 |
| 101 | 平台选项芯片 | Platform Chip | Step1 Settings | 抖音/快手/红果/番茄/其他 |
| 102 | 新功能标签 | New Feature Badge | 创建页 | `NEW` 角标徽章 |

---

## 6. 设计模式目录（82 个）

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

### 6.2 数据展示与可视化模式 (Patterns 13-32)

| # | 模式名称 | 英文名 | 应用位置 | 核心思想 |
|---|---------|--------|----------|----------|
| 13 | **分析进度实时反馈** | Real-time Analysis Progress Feedback | Step1-6 | 流式生成时持续更新进度百分比 |
| 14 | **可恢复性设计** | Re-analysis Option | Step1 Locked | 允许用户撤销并重新分析 |
| 15 | **流式卡片生成** | Streaming Card Generation | Step1 Right | 逐张生成分析卡片，边看边审 |
| 16 | **双栏布局** | Dual-pane Layout (Chat + Editor) | Step1-4 Main | 左侧对话引导 + 右侧结构化编辑 |
| 17 | **三栏布局** | Triple-pane Layout (Chat + Editor + Dock) | Step6 Main | 左对话 + 中编辑器 + 右导航 |
| 18 | **模块编号系统** | Module Numbering System (M + Num) | Step1-2 | M 系列=元数据，数字系列=分析卡 |
| 19 | **卡片级独立操作** | Card-level Independent Operations | 全局卡片 | 每张卡可单独@提及/重新生成/采用/修改 |
| 20 | **DescriptionList 字段展示** | DescriptionList Field Display | 多处卡片 | 键值对形式展示结构化字段 |
| 21 | **可视化配比条** | Visual Ratio Bars | Step1 02/05 | 甜/虐/修罗场三栏百分比 |
| 22 | **进度分轨显示** | Multi-track Progress Display | Step1 Right | 模块进度 2/5 + 分析进度 2/5 |
| 23 | **HeroCard 一句话定位** | HeroCard One-line Positioning | Step2 M1 | 用一句话概括整个项目的核心体验 |
| 24 | **Promise/Thesis 叙事框架** | Promise/Thesis Narrative Framework | Step2 M1 | 承诺(用户获得)+主张(主题表达) |
| 25 | **6 阶段叙事弧可视化** | 6-stage Narrative Arc Visualization | Step2 M2 | 完整故事线的情绪起伏曲线 |
| 26 | **原文→集数映射** | Source Chapter → Target Episode Mapping | Step2 M2/Step4 | 原文章节到目标集数的双向映射 |
| 27 | **4 维体验滑块** | 4-dimension Experience Sliders | Step2 M3 | 情绪拉扯/被选择/代价/信任坍塌 |
| 28 | **人物关系图** | Character Relationship Graph | Step2 M4 | 节点+连线+关系类型可视化 |
| 29 | **角色详情卡片** | Character Detail Cards | Step2 M4 | 每个角色的名字/身份/描述/动机 |
| 30 | **Tab 式互动机会点管理** | Tab-based Interaction Opportunity Management | Step2 M5 | 按角色切换查看其互动机会点 |
| 31 | **点赞/点踩反馈** | Thumbs Up/Down Feedback | Step2 M1 | 用户对 AI 产出的质量评价 |
| 32 | **折叠式阶段详情** | Collapsible Stage Details | Step2 M2 | 阶段卡片可展开查看详细信息 |

### 6.3 配置与决策模式 (Patterns 33-54)

| # | 模式名称 | 英文名 | 应用位置 | 核心思想 |
|---|---------|--------|----------|----------|
| 33 | **Tab 式方向切换** | Tab-based Direction Switching | Step3 | 4 个方向作为 Tab 逐一确认 |
| 34 | **Per-episode 密度控制** | Per-episode Density Control | Step3-01 | 每集独立设置 1-3 级互动密度 |
| 35 | **30 集热力图可视化** | 30-column Heatmap Visualization | Step3 All | 全集维度的宏观配置视图 |
| 36 | **三级密度按钮组** | Ternary Density Button Group | Step3-01 | 每格 3 个按钮代表 3 级密度 |
| 37 | **判断审核机制** | Judgment Review Mechanism | Step3 Each | AI 做 3 个判断，用户逐一过目 |
| 38 | **图例系统** | Legend System | Step3 Heatmaps | 解释视觉编码的含义 |
| 39 | **二元热力图** | Binary Heatmap (Orange/Gray) | Step3-02 | 关系升温 vs 关系紧张的简化视图 |
| 40 | **关键集数标记** | Key Episode Markers | Step3-02 | 在热力图上标注关键转折集 |
| 41 | **三阶段分栏卡片** | 3-phase Summary Cards | Step3-02 | 开局/中段/后段的收益危机统计 |
| 42 | **收益/危机计数** | Benefit/Crisis Count | Step3-02 | 每阶段的正负情感事件统计 |
| 43 | **钩子设计哲学** | Hook Design Philosophy | Step3-02 | 把关系推到临界点的悬念设计理念 |
| 44 | **选择类型分类系统** | Choice Type Taxonomy | Step3-03 | 4 类主要选择 + 1 类降权 |
| 45 | **动作导向选项设计** | Action-oriented Choice Design | Step3-03 | 选动作而非选角色名的选项设计 |
| 46 | **多色热力图(4 色)** | Multi-color Heatmap (4 colors) | Step3-03 | 4 种选择类型的空间分布 |
| 47 | **降权标记** | Downweight Marker | Step3-03 | 明确排除非关系型选择 |
| 48 | **1vN 多对象影响规则** | 1vN Multi-character Impact Rule | Step3-03 | 一个选择至少影响两个角色 |
| 49 | **5 维状态沉淀系统** | 5-dimensional State Persistence | Step3-04 | 好感/信任/占有/风险/嫉妒 |
| 50 | **状态承接机制** | State Inheritance Across Episodes | Step3-04 | 选择后的状态在后续集承接 |
| 51 | **分支非抹平设计** | Non-reset Branch Design | Step3-04 | 分支闭合后不全部抹平状态 |
| 52 | **水平阶段 Tab 导航** | Horizontal Stage Tab Navigation | Step4 | 阶段切换的水平 Tab 栏 |
| 53 | **阶段名称语义化** | Semantic Stage Naming | Step4 | 「焦灼初遇」>「初始牵引」（更生动） |
| 54 | **分集卡片展开/折叠** | Expandable Episode Cards | Step4 Episode | 点击展开 8 个核心字段 |

### 6.4 深度编辑与交互模式 (Patterns 55-82) — V2 核心新增

| # | 模式名称 | 英文名 | 应用位置 | 核心思想 |
|---|---------|--------|----------|----------|
| **55** | **字段级 @选中调整** | **Field-level @Select & Adjust** | **Step4 Episode Fields** | **鼠标悬停字段→出现"选中调整"→点击→左侧聊天框出现@范围标签** |
| **56** | **紫色 @范围标签** | **Purple @Scope Tag** | **Step4 Left Panel** | **"@ 第2集 / 情节描述 \| 内容摘要..." 橙/紫色标签** |
| **57** | **范围隔离编辑** | **Scoped Editing Isolation** | **Step4 Left Panel** | **"现在发出的修改，会只作用在这个范围"** |
| **58** | **节点级弹窗编辑** | **Node-level Modal Editing** | **Step5 Canvas Nodes** | **点击节点"调整方向"→弹出模态框→自然语言+快捷芯片** |
| **59** | **快捷操作芯片组** | **Quick Action Chip Group** | **Step5 Edit Modal** | **5个预设指令: 加强代价/提高爽点/合流后挪/改成3选1/增加隐藏分支** |
| **60** | **Token 成本预估算** | **Token Cost Pre-estimation** | **Step5 Edit Modal** | ** "~3.2k tokens" 提前告知本次修改消耗** |
| **61** | **级联影响预览承诺** | **Cascade Impact Preview Promise** | **Step5 Edit Modal** | **"完成后会展示级联影响"(跨集联动!)** |
| **62** | **节点操作三件套** | **Node Action Triad** | **Step5 Each Node** | **让AI调整 / 删除节点 / 拖出连线** |
| **63** | **SVG 画布拖拽平移** | **Canvas Pan & Zoom** | **Step5 Canvas** | **鼠标拖拽移动画布视图(非普通滚动)** |
| **64** | **双布局模式切换** | **Dual Layout Mode Toggle** | **Step5 Canvas** | **横向(左到右流程图) / 竖向(上到下)两种** |
| **65** | **逐集生成模式** | **Per-Episode Generation Mode** | **Step6** | **每集独立生成(~6.4k tokens)，非一次性全部生成** |
| **66** | **Dock 式集数浏览器** | **Dock-style Episode Browser** | **Step6 Right** | **垂直列表 + hover预览 + 点击载入** |
| **67** | **顺序锁机制** | **Sequential Generation Lock** | **Step6 Dock** | **必须先通过 Ep.01 才能生成 Ep.02** |
| **68** | **Diff 保留编辑** | **Diff-Preserving Direct Edit** | **Step6 Editor** | **直接在文档里改字，改完会保留 diff 记录** |
| **69** | **打回重写机制** | **Reject & Rewrite Mechanism** | **Step6 Bottom** | **整集不合格时可打回让AI完全重写** |
| **70** | **前后集上下文注入** | **Neighbor Context Injection** | **Step6 Generation** | **生成时自动带入相邻集的上下文保证连贯性** |
| **71** | **预览+导出双通道** | **Preview & Export Dual Channel** | **Step6 TopRight** | **每集可预览效果 + 导出文件(0/30计数)** |
| **72** | **积分成本预估** | **Credit Cost Pre-estimate** | **Step6 Episode** | **"预计消耗² 积分" 提前告知** |
| **73** | **脚本生成规则可见** | **Script Generation Rules Visibility** | **Step6 Left Panel** | **8条AI写作规则对用户透明(眼神/停顿/误会/拉扯)** |
| **74** | **小改 vs 大改分流** | **Small Edit vs Major Revise Bifurcation** | **Step6 | **小改: 直接在文档改字; 大改: 用对话告诉AI** |
| **75** | **通过/审核双轨制** | **Pass/Review Dual-track** | **Step6 TopBar** | **"已通过 0/30 · 待审核 0" 双状态追踪** |
| **76** | **@集数自动带入** | **Auto @Episode Mention** | **Step6 Input | **切换集数时输入框自动更新@提及标签** |
| **77** | **状态变化数值化展示** | **Numeric State Change Display** | **Step4/5 | **好感+0.1 / 信任+0.1 / 误会-0.3 行内标签** |
| **78** | **合流方式展示** | **Convergence Method Display** | **Step4/5 | **"无论选择如何，李明都会..." 合流描述** |
| **79** | **反馈方式结构化** | **Feedback Method Structured** | **Step4/5 | **即时反馈: 林小雨会给出简短回应...** |
| **80** | **结尾钩子类型标注** | **Ending Hook Type Tag** | **Step4 Episode | **悬念/试探/反转/温暖 类型标签** |
| **81** | **原文映射回查** | **Source Mapping Traceback** | **Step4 Episode | **原文章节片段→改编内容的双向追溯** |
| **82** | **三段式情绪流转** | **Three-part Emotion Flow** | **Stage Cards | **紧张→好奇→好感萌芽（三段式关键词串联）** |

---

## 7. 各步骤详细逆向分析（Step 1-6 全量）

### 7.1 Step 1：频道识别与项目设定

**URL**: `/workspace/step1?projectId=p_nnbnuvy7`  
**右侧面板类型**: 结构化卡片列表 (10 张卡)

**核心流程**:
```
上传剧本(209字) → AI 识别互动体验(60%置信度) 
  → 用户确认(点击uid=1242) → 主线/副线确认(uid=1505) 
  → 项目设定卡出现(集数/时长/平台/受众) 
  → 确认设定(uid=1705) → 锁定 → AI 流式生成 10 张分析卡
  → 完成 → 进入 Step 2(uid=3111)
```

**10 张分析卡片完整清单**:

| 编号 | 类型 | 标题 | 核心内容 | 操作 |
|------|------|------|----------|------|
| M1 | 元数据 | 故事类型 | 都市言情 / 女频BG都市言情 | 采用/修改 |
| M2 | 元数据 | 主角困境 | 李明忐忑不安，关系尚未明确 | 采用/修改 |
| M3 | 元数据 | 情绪回响 | 初遇紧张与试探，选择决定走向 | 采用/修改 |
| M4 | 元数据 | 转机设定 | 无金手指，靠社交直觉与勇气 | 采用/修改 |
| M5 | 元数据 | 故事种子 | 咖啡馆等待，面临如何开启对话 | 采用/修改 |
| 01/05 | 分析 | 主角成长反差 | 忐忑等待→主动推进(状态流转箭头) | @/重新生成 |
| 02/05 | 分析 | 核心情感爽点 | 甜35%/虐35%/虐甜混合30%(配比条) | 调整配比/@/重新生成 |
| 03/05 | 分析 | 关键对象 | 林小雨(女主)/暖男大叔 | @/重新生成 |
| 04/05 | 分析 | 名场面/修罗场 | Ch.01 咖啡馆初遇选择 | @/重新生成 |
| 05/05 | 分析 | 情感互动维度 | 主动vs被动 / 亲密度20%(滑块) | @/重新生成 |

### 7.2 Step 2：故事画像

**URL**: `/workspace/step2?projectId=p_nnbnuvy7`  
**右侧面板类型**: 多模块卡片 (M1-M5)

**4 Agent 并行分析架构**:

| Agent | 分析维度 | 输出 |
|-------|----------|------|
| 体验设计 Agent | 关系主动权/情感拉扯/信任起点/性格象征/物品隐喻 | 体验维度分析 |
| 人物档案 Agent | 场景张力/心理暗示/视觉符号/关系推进节奏/CP感建立 | 角色深度档案 |
| 空间制图 Agent | 隐喻系统/视觉符号/互动基调/情绪反馈/悬念制造 | 场景设计方案 |
| 结构师 Agent | 关系弧线/张力来源/情感燃料/选择天平/命运逆转/集数规划 | 整体叙事架构 |

**M1-M5 模块详解**:

- **M1 HeroCard**: 一句话定位 + Promise/Thesis + 8 标签 + 角色列表 + 点赞/点踩
- **M2 叙事弧**: 6 阶段情绪曲线(初始牵引→结局落点) + 可视化折线图 + 原文→集数映射
- **M3 核心体验画像**: 4 维滑块(情绪拉扯5/被选择4/关系代价3/信任坍塌3)
- **M4 人物关系网**: 5 角色节点(李明/林小雨/服务员/小雅/阿强) + 关系连线
- **M5 互动机会点**: Tab 式角色切换(李明0/林小雨3/小雅0/阿强1)

### 7.3 Step 3：互动方向

**URL**: `/workspace/step3?projectId=p_nnbnuvy7`  
**右侧面板类型**: Tab 切换 + 热力图网格

**4 方向逐一确认工作流**:

| 方向 | 名称 | 核心问题 | 热力图 | 判断数 | 确认按钮 UID |
|------|------|----------|--------|--------|-------------|
| 01 | 节奏 | 关系抉择何时出现/多少/反馈多快 | 30集×3级密度(90按钮) | 3 | uid=4639 |
| 02 | 钩子 | 每集结尾制造期待 | 30集×二元(橙/灰) | 3 | uid=5509 |
| 03 | 选择机制 | 用户做动作而非选名字 | 30集×4色(4类型) | 3 | uid=6161 |
| 04 | 状态与反馈 | 好感/信任/嫉妒/占有/风险承接 | 30集×5色+(5维) | 3 | uid=7062 |

**总判断点**: 12 个 (4方向 × 3判断/方向)  
**热力图按钮总数**: 360 个 (4方向 × 30集 × 3级)

### 7.4 Step 4：全集大纲（含深度交互探索）

**URL**: `/workspace/step4?projectId=p_nnbnuvy7`  
**右侧面板类型**: 分集卡片编辑器 (阶段 Tab + 可折叠分集卡片)

**阶段结构** (最终版本: 3 阶段):

| 阶段 | 代号 | 名称 | 集数 | 情绪线 |
|------|------|------|------|--------|
| 01 | 初遇破冰 | 焦灼初遇 | 1-8 | 紧张→好奇→好感萌芽→试探→初步信任 |
| 02 | 暧昧拉扯 | 试探升温 | 9-20 | 误会滋生→互相试探→暧昧升温→修罗场初现→感觉确认 |
| 03 | 确认奔赴 | 坦诚落定 | 21-30 | 核心矛盾爆发→误解澄清→心结解开→坦诚告白→确认关系 |

**分集卡片 8 大字段完整结构** (以 Ep.02 为实测样本):

| # | 字段名 | 内容示例 | 类型 | 是否有@选中调整 |
|---|--------|----------|------|----------------|
| 1 | **剧情推进** | 李明在咖啡馆等到林小雨...面对林小雨直接的询问，李明选择先进行轻松的寒暄... | 段落文本 | ✅ uid=10172 |
| 2 | **本集功能** | 林小雨在咖啡馆找到李明...李明选择先寒暄暖场，试图打破沉默... | 段落文本 | ✅ uid=10177 |
| 3 | **角色状态** | 李明 / 林小雨 | 标签组 | ✅ uid=10182 |
| 4 | **场景承接** | 咖啡馆角落座位 / 咖啡馆吧台区域 | 标签组 | ✅ uid=10187 |
| 5 | **状态变化** | 好感: 选择A：林小雨好感+0.1；选择B：林小雨好感+0.1，信任+0.1 | 数值化状态条 | ✅ uid=10192 |
| 6 | **互动节点** | A:先问"路上堵不堵"轻松破冰 / B:直接提议"要不要换杯热的"+ 反馈方式 + 合流方式 | 双选项+结构化 | ✅ uid=10197 |
| 7 | **结尾钩子** | 林小雨低头搅动咖啡，轻声问："所以，你约我出来……到底是为了什么？" [悬念/试探] | 悬念文本+类型标签 | ✅ uid=10211 |
| 8 | **原文映射回查** | 开场等待(0)/目标出现(0)/坐下试探(0) — 3段原文片段列表 | 原文片段列表 | ✅ uid=10221 |

**额外操作**: 「选中此集进行调整」按钮 (uid=10239) — 一次性选中整集所有字段

### 7.5 Step 5：互动画板（全新 UI 范式）

**URL**: `/workspace/step5?projectId=p_nnbnuvy7`  
**右侧面板类型**: **SVG 节点式分支叙事画布** (革命性变化!)

**画布节点类型与流程**:

```
[场景节点] → [互动节点 ◇] → [选项A] ──→ [分支反馈A] ─┐
                                         │              │
                                     [选项B] ──→ [分支反馈B] ─┤
                                                            │
                                                   [合流锁定节点] → [状态承接节点]
```

**每种节点的内部结构**:

| 节点类型 | 形状 | 内容 | 操作按钮 |
|----------|------|------|----------|
| 场景节点 | 圆角矩形 | 场景描述文本 | 让AI调整 / 删除 |
| 互动节点 | **菱形◇** | 决策问题描述 | **让AI调整 / 删除 / 拖出连线** |
| 选项节点 | 圆角矩形 | 选项文本(A/B) | **添加分支(+)** / 删除 |
| 分支反馈节点 | 圆角矩形 | 反馈描述 + 状态变化数值(好感/信任/误会) | 让AI调整 / 删除 |
| 合流锁定节点 | 圆角矩形 | "无论选择如何..." 合流描述 | 让AI调整 / 删除 |
| 状态承接节点 | 圆角矩形 | CP 数值延续到下一集 | 让AI调整 / 删除 |

**节点级编辑弹窗完整结构** (点击「让AI调整」触发):

```
┌─────────────────────────────────────────────────────────┐
│  ×                                                    │
│  调整 Ep.01 的「...面临如何开启对话的选择」              │
│  [局部修改 · 当前节点] 橙色标签                          │
│                                                         │
│  本次只修改当前节点；要改其他节点请重新选择。              │
│  提交后会先展示了影响了哪些集。                           │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ Ep.01 | 暂无摘要 | interaction (灰色标签)     │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ 比如：把 A 选项的反馈做得更狠一点 · ...       │       │
│  │                                             │       │
│  │ [加强代价] [提高爽点] [合流后挪] [改成3选1]   │       │
│  │ [增加隐藏分支]                               │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ~3.2k tokens · 完成后会展示级联影响    [取消] [提交→]  │
└─────────────────────────────────────────────────────────┘
```

**画布控制功能**:
- **布局切换**: 横向(左到右) / 竖向(上到下)
- **集数导航**: Ep.01, Ep.04 ... 横向滑动切换不同集的画布
- **拖拽平移**: 鼠标拖拽移动画布(非滚动条)

### 7.6 Step 6：互动剧本（最终交付）

**URL**: `/workspace/step6?projectId=p_nnbnuvy7`  
**右侧面板类型**: **脚本编辑器 + Dock 集数导航**

**三栏布局**:
```
┌─────────────┬──────────────────────┬──────────────┐
│  Left Panel │   Center Panel       │ Right Panel  │
│  (AI 对话)  │   (脚本编辑器)        │  (Dock 导航)  │
│             │                      │              │
│  8条生成规则 │  "Ep.01 红外套的初见" │  集数 0/30   │
│  AI消息气泡  │  ● 待生成            │  [01] ●●●    │
│             │                      │  [02] ○○○    │
│  @Ep.01标签  │  [✨生成 Ep.01 剧本]   │  [03] ○○○    │
│  输入框      │  ~6.4k tokens        │  ...         │
│             │                      │  [30] ○○○    │
└─────────────┴──────────────────────┴──────────────┘
```

**Dock 导航完整结构** (30 集):

| 按钮 | 格式 | Ep.01 状态 | Ep.02-30 状态 |
|------|------|-----------|---------------|
| uid=12800 | `01 Ep.01 红外套的初见 待生成 — 可生成本集` | 可点击(橙色选中) | — |
| uid=12807 | `02 Ep.02 咖啡初见 待生成 — 请先通过 Ep.01` | — | 禁用(顺序锁) |
| uid=12814~13003 | `03-30 Ep.xx xxx 待生成 — 请先通过 Ep.01` | — | 禁用(顺序锁) |

**顶部操作栏**:
- **预览按钮** (uid=13013): 👁 预览
- **导出按钮** (uid=13015): ⬇ 导出 0 / 30
- **集名**: "红外套的初见"
- **状态**: ● 待生成
- **时长**: ≈ — (生成后才显示)
- **预计消耗**: ² 积分

**AI 脚本生成规则** (左侧面板 8 条):
1. 强调眼神 / 停顿 / 误会 / 拉扯
2. 互动表达情绪回应 / 关系推进
3. 分支里 CP 数值变化必须延续
4. 钩子分爽 / 虐 / 修罗场 / 反转
5. 右侧集数 dock · hover 看预览 · 点击载入
6. 直接在文档里改字 · 改完会保留 diff
7. 大改用对话告诉我
8. 整集不对 · 点底部「打回 · 需重写」

**编辑范式三分流**:
| 修改规模 | 方式 | 位置 |
|----------|------|------|
| 小改(个别词句) | 直接在文档里改字 | 脚本编辑器 (Diff 保留) |
| 中改(某段不满意) | 用对话告诉 AI | 左侧输入框 + @集数提及 |
| 大改(整集不合格) | 点底部「打回·需重写」 | 底部操作按钮 |

---

## 8. 三层局部编辑机制（核心发现）

这是 AltFlow 最具创新性的设计——**三层粒度的局部编辑体系**，贯穿 Step 4-6：

```
┌─────────────────────────────────────────────────────────────┐
│                  三层局部编辑体系                             │
├─────────────┬───────────────────┬───────────────────────────┤
│  Layer 1     │  Layer 2          │  Layer 3                  │
│  字段级      │  节点级            │  集级                      │
│  Step 4      │  Step 5           │  Step 6                   │
├─────────────┼───────────────────┼───────────────────────────┤
│  @选中调整    │  调整方向弹窗      │  @集数提及 + 对话指令       │
│  (8种字段×1) │  (每节点1个)       │  (每集1个输入框)           │
├─────────────┼───────────────────┼───────────────────────────┤
│  触发: 悬停   │  触发: 点击节点    │  触发: 切换Dock集数       │
│  字段→点击    │  "让AI调整"按钮   │  或手动@提及              │
├─────────────┼───────────────────┼───────────────────────────┤
│  作用范围:   │  作用范围:        │  作用范围:               │
│  单个字段    │  整个互动节点      │  整集                     │
│  (如剧情推进) │  (A/B选项+反馈)   │  (全部内容)               │
├─────────────┼───────────────────┼───────────────────────────┤
│  编辑方式:   │  编辑方式:        │  编辑方式:               │
│  左侧聊天框   │  独立模态框        │  左侧聊天框 OR            │
│  @范围标签   │  +快捷芯片        │  直接编辑(Diff)           │
├─────────────┼───────────────────┼───────────────────────────┤
│  成本提示:   │  成本提示:        │  成本提示:               │
│  无          │  ~3.2k tokens     │  ~6.4k tokens/集         │
├─────────────┼───────────────────┼───────────────────────────┤
│  级联影响:   │  级联影响:        │  级联影响:               │
│  无明确提示   │  承诺展示受影响的集 │  "复杂改动会列出影响哪几集" │
└─────────────┴───────────────────┴───────────────────────────┘
```

**设计精妙之处**:
1. **粒度递进**: 字段→节点→集，三层覆盖从微观到宏观的所有修改需求
2. **零摩擦入口**: 悬停即现"选中调整"，无需寻找编辑入口
3. **成本透明**: Layer 2/3 都提前告知 Token/积分成本
4. **级联感知**: Layer 2/3 都承诺展示跨集影响，避免"改了一处坏了一片"
5. **范式自适应**: 小改用 GUI(Diff)，大改用对话(NLP)，各得其所

---

## 9. 数据结构与状态模型

### 9.1 全局状态模型（推断）

```typescript
interface AltFlowGlobalState {
  user: {
    id: string          // "5849"
    credits: number     // 1940 (动态扣减)
    language: 'zh' | 'en'
  }
  project: {
    id: string          // "p_nnbnuvy7"
    title: string       // "第一场：咖啡馆 - 日"
    originalScript: { content: string; wordCount: number; format: string }
    expandedWordCount: number // ~10000 (AI 扩展后)
  }
  stepProgress: {
    currentStep: 1|2|3|4|5|6
    completedSteps: number[]
    stepStates: Record<number, 'locked'|'available'|'completed'|'generating'>
  }
}
```

### 9.2 Step 4 分集数据模型

```typescript
interface Episode {
  id: string              // "ep-02"
  number: number          // 2
  title: string           // "咖啡初见"
  stageId: string         // 所属阶段 ID
  
  // 8 大字段 (每个都有独立的 @选中调整能力)
  fields: {
    plotProgression: { text: string }       // 剧情推进
    episodeFunction: { text: string }        // 本集功能
    characterStates: string[]               // 角色状态标签
    sceneConnections: string[]              // 场景承接标签
    stateChanges: StateChange[]             // 状态变化(数值化)
    interactionNode: InteractionNode | null  // 互动节点(A/B选项)
    endingHook: EndingHook | null           // 结尾钩子
    sourceMapping: SourceMapping[]          // 原文映射回查
  }
}

interface StateChange {
  dimension: '好感' | '信任' | '误会' | ...
  optionA: { delta: number; description: string }
  optionB: { delta: number; description: string }
}

interface InteractionNode {
  question: string                           // 决策问题
  options: {
    A: { text: string; feedback: string; convergence: string }
    B: { text: string; feedback: string; convergence: string }
  }
}
```

### 9.3 Step 5 画布节点数据模型

```typescript
interface CanvasNode {
  id: string
  type: 'scene' | 'interaction' | 'option' | 'feedback' | 'convergence' | 'state'
  position: { x: number; y: number }
  content: string | InteractionContent | FeedbackContent
  
  // 每个节点都有 3 种操作
  actions: ['ai_adjust', 'delete', 'disconnect']
}

// 互动节点(菱形)的特殊内容
interface InteractionContent {
  episodeId: string
  question: string
  options: Option[]
}

// 分支反馈节点的特殊内容
interface FeedbackContent {
  optionLabel: 'A' | 'B'
  feedbackDescription: string
  stateChanges: { dimension: string; delta: number }[]
  convergenceDescription: string  // 合流方式
}
```

### 9.4 Step 6 脚本数据模型

```typescript
interface ScriptEpisode {
  id: string
  number: number          // 1-30
  title: string           // "红外套的初见"
  status: 'pending' | 'generating' | 'generated' | 'approved' | 'rejected'
  
  // 元数据
  meta: {
    duration: string      // "2分30秒" (生成后才有)
    creditCost: number     // 2
    tokenCost: number     // ~6400
  }
  
  // 脚本内容
  script?: {
    content: string       // 富文本/Markdown 格式的剧本
    diff?: DiffRecord[]   // 用户直接修改的 diff 记录
  }
  
  // 上下文
  context: {
    prevEpisodeId: string | null
    nextEpisodeId: string | null
  }
  
  // 顺序锁
  lockReason?: string    // "请先通过 Ep.01"
}
```

---

## 10. 用户体验亮点总结

### 10.1 核心体验原则 (7 大原则)

| 原则 | 体现位置 | 设计价值 |
|------|----------|----------|
| **渐进式披露** | 6 步向导 | 降低认知负荷，每步只关注一个维度 |
| **AI 透明度** | 置信度/进度/Token 成本/级联影响 | 建立用户对 AI 决策的信任 |
| **可干预性** | 暂停按钮 + @提及 + 局部编辑(三层) | 用户始终保持控制权 |
| **可视优先** | 热力图/情绪曲线/关系图/SVG 画布 | 复杂信息一目了然 |
| **上下文感知** | 配置项提示/前后集上下文/Diff 保留 | 帮助非专业用户理解选项影响 |
| **防错设计** | 锁定机制 + 确认流程 + 顺序锁 | 避免误操作导致的数据丢失 |
| **即时反馈** | 含互动集数实时增长/状态标签/Diff 标记 | 让用户感受到进展 |

### 10.2 交互设计亮点 (Top 10)

1. **三层局部编辑体系** (Layer 1-3): 字段级@选中调整 → 节点级弹窗编辑 → 集级对话/Diff编辑，粒度递进、零摩擦入口
2. **热力图作为核心交互范式**: 30 列热力图让用户在单一视图中理解并调整全剧的互动分布
3. **SVG 节点画布** (Step 5): 从卡片列表跃升为可视化分支叙事编辑器，降低互动设计的认知门槛
4. **Token/积分成本预估算**: 每次修改前都告知成本，避免用户"意外破产"
5. **级联影响预览承诺**: 修改节点/集数前承诺展示跨集影响，解决"牵一发动全身"的恐惧
6. **Dock 式集数浏览器** (Step 6): 垂直列表 + hover 预览 + 顺序锁，30 集管理清晰高效
7. **Diff 保留直接编辑**: 小改无需走 AI，直接在文档中改字，系统保留修改记录
8. **打回重写安全网**: 整集不合格可以一键打回让 AI 重写，降低试错成本
9. **快捷操作芯片** (Step 5 弹窗): 5 个预设指令芯片覆盖最常见修改模式，减少输入成本
10. **@提及自动带入**: 切换集数时输入框自动更新 @提及标签，减少操作步骤

### 10.3 信息架构亮点

1. **M 系列 + 数字系列编号**: 元数据(M)与分析数据(数字)分离
2. **单字阶段代号**: 初/试/误/修/代/结 — 窄屏高效语义传递
3. **Promise/Thesis 框架**: 承诺+主张两句话定位叙事内核
4. **三段式情绪流转**: 紧张→试探→好感（关键词串联）
5. **8 条 AI 写作规则透明化**: 让用户了解 AI 的"写作标准"

---

## 11. 复现实现指南

### 11.1 技术栈建议

| 层次 | 推荐技术 | 替代方案 |
|------|----------|----------|
| **前端框架** | React 18 + TypeScript | Vue 3 + TypeScript |
| **状态管理** | Zustand | Redux Toolkit / Pinia |
| **路由** | React Router v6 + 守卫 | Vue Router + beforeEach |
| **UI 组件库** | 自研（暗色主题） | Radix UI + Tailwind CSS |
| **Step 5 画布** | **@xyflow/react (React Flow)** | **Fabric.js / Konva.js** |
| **Step 6 编辑器** | **CodeMirror / Monaco Editor** | **Tiptap (ProseMirror)** |
| **热力图** | Canvas API / D3.js | SVG 内联 |
| **实时通信** | SSE (EventSource) | WebSocket |
| **AI 集成** | OpenAI API / Claude API | 自部署 LLM |
| **后端** | Node.js + Express / FastAPI | Go / Rust |

### 11.2 核心组件实现要点

#### Step 5 画布组件 (基于 React Flow)

```tsx
// 伪代码 - 核心思路
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'

<ReactFlow
  nodes={canvasNodes}      // 场景/互动/选项/反馈/合流/状态 6 种节点
  edges={canvasEdges}      // SVG 连线
  nodeTypes={nodeTypes}    // 自定义节点渲染器(菱形互动节点等)
  onNodeClick={handleNodeClick}  // 点击弹出编辑窗口
  onConnect={handleConnect}      // 拖出连线
  fitView
  minZoom={0.3}
  maxZoom={2}
>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>

// 节点点击 → 弹出编辑模态框
const handleNodeClick = (_: MouseEvent, node: Node) => {
  if (node.type === 'interaction') {
    setEditModal({
      isOpen: true,
      nodeId: node.id,
      episodeId: node.data.episodeId,
      content: node.data.question,
      estimatedTokens: '~3.2k',
    })
  }
}
```

#### Step 4 分集卡片 @选中调整

```tsx
// 伪代码 - 字段级 @选中调整
function EpisodeField({ field, value, episodeId }: Props) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="episode-field"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FieldLabel>{field}</FieldLabel>
      <FieldValue>{value}</FieldValue>
      
      {isHovered && (
        <AdjustButton 
          onClick={() => onAdjustField(episodeId, field, value)}
        >
          选中调整
        </AdjustButton>
      )}
    </div>
  )
}

// 点击后 → 左侧聊天框插入 @范围标签
const onAdjustField = (epId, field, value) => {
  chatPanel.insertMention({
    type: 'scope',
    label: `${epId} / ${field}`,
    scope: { episodeId: epId, field, value },
    hint: '现在发出的修改，会只作用在这个范围',
  })
}
```

#### Step 6 Dock 导航 + 顺序锁

```tsx
// 伪代码 - Dock 集数浏览器
function EpisodeDock({ episodes, currentEp, onSwitch }) {
  return (
    <nav className="episode-dock">
      <div className="dock-header">集数 <span>{approvedCount}/30</span></div>
      {episodes.map(ep => (
        <DockButton
          key={ep.number}
          episode={ep}
          isCurrent={ep.number === currentEp}
          isLocked={ep.number > currentEp + 1}  // 顺序锁!
          lockReason={ep.number > 1 ? '请先通过 Ep.01' : undefined}
          onClick={() => !isLocked && onSwitch(ep.number)}
        />
      ))}
    </nav>
  )
}
```

### 11.3 关键实现难点

| 难点 | 解决思路 |
|------|----------|
| **路由守卫防止跳步** | `canActivate` 守卫检查前置步骤完成状态 |
| **AI 流式生成** | SSE 推送进度，前端 `eventSource.onmessage` 更新 UI |
| **画布性能(30集×N节点)** | React Flow 虚拟渲染，仅渲染可视区域内的节点 |
| **@提及解析** | 监听 `@` 键 → 弹出模块/集数选择浮层 → 插入格式化引用标记 |
| **Diff 保留编辑** | CodeMirror 的 `updateDiff` API 或自定义 diff 算法 |
| **级联影响计算** | 后端维护节点/集数的依赖图(DAG)，修改时遍历计算影响范围 |
| **Token 成本估算** | 基于 prompt 模板 + 内容长度的线性估算公式 |
| **顺序锁状态机** | 每集状态: pending→generating→generated→(approved|rejected) |

### 11.4 完整数据流

```
用户输入(209字)
    ↓
[Step 1] 频道识别 → 项目设定 → 10张分析卡
    ↓ (确认)
[Step 2] 4 Agent 并行 → M1-M5 故事画像
    ↓ (确认)
[Step 3] 4方向×12判断 → 360热力图按钮配置
    ↓ (确认)
[Step 4] 6阶段弧线 → 30集分集卡片(每集8字段)
    ↓ (生成完成)
[Step 5] 节点式互动画布(SVG) → A/B选项连线 → 状态变化
    ↓ (生成完成)
[Step 6] 逐集剧本生成(~6.4k tokens/集) → Diff编辑 → 预览/导出
    ↓
最终交付物: 30集互动影视剧本 + 可运行的互动配置文件
```

---

## 附录 A：采集元数据

| 属性 | V1 | V2 (本次) |
|------|-----|-----------|
| **采集工具** | TABBIT 浏览器自动化代理 | 同左 |
| **采集方法** | take_snapshot (full) + screenshot + e2b_grep | 同左 + **深度交互操作验证** |
| **总快照数** | 12 full + 10 actionable | **+6 full (Step4深交/Step5/Step6)** |
| **总截图数** | 15 张 | **+12 张 (含交互操作截图)** |
| **DOM 数据量** | ~200KB+ | **~350KB+ (新增 Step5 61KB + Step6 65KB)** |
| **覆盖步骤** | Step 1-4 (95%) | **Step 1-6 (100%)** |
| **UI 组件识别** | 89 个 | **102 个 (+13 新增)** |
| **设计模式提取** | 69 个 | **82 个 (+13 新增)** |
| **测试项目 ID** | p_nnbnuvy7 | 同左 |
| **测试剧本长度** | 209 字 | 同左 (AI 扩展至 ~1 万字) |
| **积分消耗** | 2 积分 (2000→1998) | **60 积分 (2000→1940)** |
| **关键新增发现** | — | **三层局部编辑机制 / SVG 画布 / 节点弹窗 / Dock 导航 / Diff 编辑 / 打回重写 / 顺序锁 / Token 预估**

## 附录 B：UID 索引（关键元素）

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
| **10172** | **@选中调整·剧情推进** | **Step 4** | **Layer 1 字段级编辑(已验证)** |
| **10192** | **@选中调整·状态变化** | **Step 4** | **Layer 1 字段级编辑(已验证)** |
| **10239** | **选中此集进行调整** | **Step 4** | **一次性选中整集** |
| **11372** | **调整方向(节点)** | **Step 5** | **Layer 2 节点级弹窗编辑(已验证)** |
| **11591** | **进入 Step 6** | **Step 5** | **导航到最后一步** |
| **12800** | **Dock Ep.01 按钮** | **Step 6** | **Dock 集数导航(已验证)** |
| **13030** | **生成 Ep.01 剧本** | **Step 6** | **逐集生成 CTA** |

---

> **文档结束**  
> 本报告基于 AltFlow 平台 (altflow.cn) **Step 1-6 全流程**的深度逆向分析编写，共识别 **102 个独立 UI 组件** 和 **82 个设计模式**。  
> **V2 相比 V1 的核心增量**: Step 5-6 完整探索 + 三层局部编辑机制深度解析 + SVG 画布/节点弹窗/Dock导航/Diff编辑/打回重写/顺序锁/Token预估 等全新组件和模式的发现。
