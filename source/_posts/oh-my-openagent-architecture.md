---
title: Oh-My-OpenAgent 架构总览
date: 2026-04-21 10:20:00
tags: [AI, Agent, Architecture, Open Source]
categories: [技术分享]
description: 开源 Agent 编排框架 Oh-My-OpenAgent 的架构剖析与配置参考。
cover: false
toc: true
---


## 项目概述

**Oh-My-OpenAgent** (前身为 Oh-My-OpenCode) 是一个多模型 AI 智能体编排框架，基于 OpenCode 构建。它将单个 AI 智能体转变为协调的开发团队，实现真正的并行执行和专业化分工。

**核心理念**：不绑定单一模型或提供商，通过编排不同模型的优势，为不同类型的任务自动选择最合适的"大脑"。

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层                                    │
│                    (Developer + Config)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      编排层 (Orchestration)                     │
│              Sisyphus (主编排) + Intent Gate (意图门控)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      规划层 (Planning)                          │
│     Prometheus (规划师) → Metis (差距分析) → Momus (审查员)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      执行层 (Execution)                         │
│                  Atlas (指挥家) + 智慧积累                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      工作层 (Worker)                            │
│         Sisyphus-Junior (执行者) + Hephaestus (深度工作者)       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    专家层 (Specialists)                         │
│    Oracle (架构顾问) | Explore (代码搜索) | Librarian (文档)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      工具层 (Tools & MCPs)                      │
│   LSP | AST-Grep | Hashline | Tmux | WebSearch | Context7      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 各智能体详解

### 1. Sisyphus (主编排智能体)

**名称来源**：希腊神话中永不停止推石头的西西弗斯

**职责**：
- 主编排者和协调者
- 通过意图门控 (Intent Gate) 分析用户真实需求
- 规划任务并委托给专业智能体
- 激进的并行执行策略
- 持续推动任务直到完成

**推荐模型**：
- Claude Opus 4.6 (最佳)
- Kimi K2.5 (优秀替代品)
- GLM 5 (可靠选项)

**特点**：
- 不会半途而废
- 不会被分散注意力
- 必须完成任务

---

### 2. Hephaestus (深度工作者)

**名称来源**：希腊神话中的工匠之神，带有讽刺意味（因 Anthropic 封锁 OpenCode 而诞生）

**职责**：
- 自主深度工作智能体
- 给予目标而非具体步骤
- 探索代码库、研究模式、端到端执行
- 无需手把手指导

**推荐模型**：GPT-5.4 (medium, temperature=0.1)

**适用场景**：
- 复杂架构推理
- 跨多文件的深度调试
- 跨领域知识综合
- 需要 GPT-5.4 特定推理风格的任务

**与 Sisyphus+ulw 的对比**：

| 方面 | Hephaestus | Sisyphus + ulw |
|------|------------|----------------|
| 模型 | GPT-5.4 | Claude Opus/Kimi/GLM |
| 方式 | 自主深度工作者 | 关键词激活的超工作模式 |
| 最佳场景 | 复杂架构工作 | 一般复杂任务 |
| 规划 | 执行中自我规划 | 使用 Prometheus 计划（如有） |
| 委托 | 大量使用 explore/librarian | 基于类别的委托 |

---

### 3. Prometheus (战略规划师)

**职责**：
- 像真实工程师一样采访用户
- 提出澄清性问题
- 识别范围和模糊点
- 在写代码前构建详细计划
- **只读模式**：只能创建/修改 `.sisyphus/` 目录内的 markdown 文件

**采访流程**：
```
用户描述需求
    ↓
启动 explore/librarian 智能体收集代码库上下文
    ↓
每轮对话后进行清晰度检查
    ├─ 需求不清晰 → 继续采访
    └─ 所有需求清晰 → 生成计划
    ↓
强制 Metis 差距分析
    ↓
整合发现写入计划
    ↓
高准确度模式 → Momus 审查循环
    ↓
计划完成 → 引导用户使用 /start-work
```

**意图特定策略**：

| 意图类型 | Prometheus 焦点 | 示例问题 |
|---------|----------------|---------|
| 重构 | 安全性 - 行为保持 | "哪些测试验证当前行为？" "回滚策略？" |
| 从零构建 | 发现优先 - 模式优先 | "在代码库中发现模式 X。遵循还是偏离？" |
| 中型任务 | 边界 - 精确范围 | "什么绝对不能包含？硬性约束？" |
| 架构设计 | 战略性 - 长期影响 | "预期生命周期？规模需求？" |

---

### 4. Metis (差距分析顾问)

**职责**：
- 在 Prometheus 写计划前强制进行差距分析
- 发现 Prometheus 遗漏的内容
- 识别隐藏意图和模糊点
- 检测 AI-slop 模式（过度工程化、范围蔓延）
- 找出缺失的验收标准
- 发现未解决的边缘情况

**为什么需要 Metis**：
计划作者 (Prometheus) 有"ADHD 工作记忆"问题 - 它建立的连接永远不会出现在纸面上。Metis 强制将隐性知识外部化。

---

### 5. Momus (严格审查员)

**职责**：
- 对高准确度模式进行计划审查
- 验证计划是否符合四大核心标准

**四大审查标准**：

1. **清晰度 (Clarity)**：每个任务是否指定了在哪里查找实现细节？
2. **可验证性 (Verification)**：验收标准是否具体可测量？
3. **上下文 (Context)**：是否有足够的上下文以便无需>10%猜测即可进行？
4. **全局观 (Big Picture)**：目的、背景和工作流程是否清晰？

**Momus 循环**：
Momus 只在以下条件 100% 满足时说"OKAY"：
- 100% 的文件引用已验证
- ≥80% 的任务有清晰的参考来源
- ≥90% 的任务有具体的验收标准
- 零任务需要对业务逻辑做假设
- 零关键红旗

如果被 REJECTED，Prometheus 必须修复问题并重新提交。无重试次数限制。

---

### 6. Atlas (执行指挥家)

**职责**：
- 像管弦乐队指挥一样协调执行
- 读取 Prometheus 生成的计划
- 分析任务并分配给专业智能体
- 积累跨任务的智慧
- 独立验证每个任务的完成

**能力边界**：

**Atlas 可以做的**：
- 读取文件理解上下文
- 运行命令验证结果
- 使用 lsp_diagnostics 检查错误
- 用 grep/glob/ast-grep 搜索模式

**Atlas 必须委托的**：
- 编写或编辑代码文件
- 修复 bug
- 创建测试
- Git 提交

---

### 7. Sisyphus-Junior (任务执行者)

**职责**：
- 实际编写代码的工作马
- 专注单一任务执行
- 强制 TODO 跟踪
- 完成前必须通过 lsp_diagnostics 验证

**特点**：
- **专注**：无法委托（被阻止使用 task 工具）
- **纪律**：强迫性的 TODO 跟踪
- **验证**：完成前必须通过诊断检查
- **约束**：不能修改计划文件（只读）

**为什么后备链足够**：
Junior 不需要是最聪明的——它需要的是可靠性。有了：
1. 来自 Atlas 的详细提示（50-200 行）
2. 向前传递的积累智慧
3. 清晰的 MUST DO / MUST NOT DO 约束
4. 验证要求

即使是中等水平的执行模型也能在严格的框架下工作良好。

**系统提醒机制**：
```
[SYSTEM REMINDER - TODO CONTINUATION]

你有未完成的 TODO！在回复前完成所有：
- [ ] 实现用户服务 ← 进行中
- [ ] 添加验证
- [ ] 编写测试

在所有 TODO 标记完成前不要回复。
```

这个"推石头"机制正是系统以西西弗斯命名的原因。

---

### 8. 专家智能体 (Specialists)

#### Oracle (架构顾问)
- **职责**：只读的高智商顾问
- **适用场景**：架构决策、复杂调试、不熟悉的模式
- **推荐模型**：GPT-5.4 / Claude Opus 4.6

#### Explore (代码库搜索)
- **职责**：快速的代码库 grep
- **使用场景**：发现代码模式、文件结构
- **推荐模型**：Grok Code Fast 1 / MiniMax M2.7

#### Librarian (文档/OSS 搜索)
- **职责**：文档和开源代码搜索
- **使用场景**：查找库 API、最佳实践、外部参考
- **推荐模型**：MiniMax M2.7 / Claude Haiku 4.5

#### Multimodal-Looker (视觉分析)
- **职责**：视觉和截图分析
- **使用场景**：分析图像、图表、PDF

---

## 类别 + 技能系统

### 为什么类别是革命性的

**问题：模型名称的局限性**
```typescript
// 旧方式：模型名称创建了分布偏见
task({ agent: "gpt-5.4", prompt: "..." }); // 模型知道自己的局限
task({ agent: "claude-opus-4-6", prompt: "..." }); // 不同的自我认知
```

**解决方案：语义类别**
```typescript
// 新方式：类别描述意图，而非实现
task({ category: "ultrabrain", prompt: "..." }); // "战略性思考"
task({ category: "visual-engineering", prompt: "..." }); // "美丽地设计"
task({ category: "quick", prompt: "..." }); // "快速完成"
```

### 内置类别

| 类别 | 默认配置 | 运行时后备顺序 | 适用场景 |
|------|---------|---------------|---------|
| `visual-engineering` | gemini-3.1-pro high | gemini → glm-5 → claude-opus | 前端、UI/UX、设计、动画 |
| `ultrabrain` | gpt-5.4 xhigh | gpt-5.4 → gemini → claude-opus | 深度逻辑推理、复杂架构决策 |
| `deep` | gpt-5.4 medium | gpt-5.4 → claude-opus → gemini | 目标导向的自主问题解决 |
| `artistry` | gemini-3.1-pro high | gemini → claude-opus → gpt-5.4 | 高度创意或艺术性任务 |
| `quick` | gpt-5.4-mini | gpt-5.4-mini → haiku → gemini-flash | 琐碎任务、单文件修改 |
| `unspecified-low` | gpt-5.4-mini | gpt-5.4-mini → sonnet → kimi | 不适合其他类别的任务，低努力 |
| `unspecified-high` | claude-opus-4-6 max | opus → gpt-5.4 → glm-5 | 不适合其他类别的任务，高努力 |
| `writing` | claude-opus-4-6 | opus → kimi → sonnet | 文档、散文、技术写作 |

### 技能：领域特定指令

技能为智能体提示添加专业指令：

```typescript
// 类别 + 技能组合
task(
  category="visual-engineering",
  load_skills=["frontend-ui-ux"], // 添加 UI/UX 专业知识
  prompt="..."
)

task(
  category="deep",
  load_skills=["playwright"], // 添加浏览器自动化专业知识
  prompt="..."
)
```

---

## 核心特性

### 1. 意图门控 (Intent Gate)

在采取任何行动之前，Sisyphus 会分类你的真实意图。

**意图分类**：
- 研究/理解 → explore/librarian → 综合 → 回答
- 实现（明确） → 计划 → 委托或执行
- 调查 → explore → 报告发现
- 评估 → 评估 → 提议 → **等待确认**
- 修复需要 → 诊断 → 最小化修复
- 开放式变更 → 先评估代码库

**为什么重要**：
Claude Code 没有这个功能。它拿到提示就跑。Oh My OpenAgent 先思考，再行动。

### 2. 哈希锚定编辑工具 (Hashline)

**问题**：大多数智能体失败不是因为模型，而是因为编辑工具。

**解决方案**：
每行读取时带回内容哈希标签：
```
11#VK| function hello() {
22#XJ|   return "world";
33#MB| }
```

智能体通过引用这些标签进行编辑。如果文件自上次读取后发生变化，哈希将不匹配，编辑会在损坏前被拒绝。

**效果**：
Grok Code Fast 1 成功率：**6.7% → 68.3%** （仅因编辑工具的改进）

### 3. 智慧积累 (Wisdom Accumulation)

每次任务完成后：
1. 从子智能体的响应中提取学习
2. 分类为：约定、成功、失败、陷阱、命令
3. 传递给所有后续子智能体

这防止了重复错误并确保一致的模式。

**记事本系统**：
```
.sisyphus/notepads/{plan-name}/
├── learnings.md      # 模式、约定、成功方法
├── decisions.md      # 架构选择和理由
├── issues.md         # 遇到的问题、阻碍、陷阱
├── verification.md   # 测试结果、验证结果
└── problems.md       # 未解决的问题、技术债务
```

### 4. 并行执行

**默认行为**：
- 独立的读取、搜索和智能体**同时运行**
- 可以启动 5+ 个后台智能体并行工作
- 当一个智能体写代码时，另一个研究模式，第三个检查文档

**像真正的开发团队一样工作**。

### 5. 深度初始化 (/init-deep)

运行 `/init-deep` 会生成层次化的 `AGENTS.md` 文件：

```
project/
├── AGENTS.md              ← 项目级上下文
├── src/
│   ├── AGENTS.md          ← src 特定上下文
│   └── components/
│       └── AGENTS.md      ← 组件特定上下文
```

智能体自动读取相关上下文。无需手动管理。

---

## 工作模式

### Ultrawork 模式：为懒惰者设计

**使用方法**：输入 `ultrawork` 或 `ulw`

**工作原理**：
- 智能体自己弄清楚一切
- 探索代码库
- 研究模式
- 实现功能
- 用诊断验证
- 持续工作直到完成

这是"只管做"模式。全自动。你不必深入思考，因为智能体替你深入思考。

### Prometheus 模式：为精确者设计

**使用方法**：
1. 按 Tab 键进入 Prometheus 模式
2. 或使用 `@plan "你的任务"` 命令

**工作流程**：
- Prometheus 像真正的工程师一样采访你
- 提出澄清性问题
- 识别范围和模糊点
- 构建详细计划
- （可选）通过 Momus 审查循环
- 运行 `/start-work` 让 Atlas 执行

**适用场景**：
- 多日项目
- 关键生产变更
- 复杂重构
- 需要记录的决策链

---

## 决策流程

```
是快速修复或简单任务吗？
  └─ 是 → 正常提示即可
  └─ 否 → 解释完整上下文很麻烦吗？
              └─ 是 → 输入 "ulw" 让智能体自己弄清楚
              └─ 否 → 需要精确、可验证的执行吗？
                         └─ 是 → 使用 @plan 进行 Prometheus 规划，然后 /start-work
                         └─ 否 → 只用 "ulw"
```

---

## 与纯 Claude Code 的对比

| 特性 | Claude Code | Oh-My-OpenAgent |
|------|-------------|-----------------|
| 执行模式 | 单智能体单模型 | 多智能体并行执行 |
| 编辑工具 | 基于行号（易失效） | 哈希锚定（68.3% 成功率） |
| 意图理解 | 字面执行 | 意图门控分类 |
| 工具集成 | 基础 | LSP + AST-Grep + Hashline + Tmux |
| 技能系统 | 标准 | 带嵌入式 MCP 的技能 |
| 纪律执行 | 无 | TODO 执行者 + 评论检查器 + Ralph Loop |
| 模型选择 | 单一模型 | 按任务类型自动路由到最佳模型 |

**根本优势**：
模型有不同的性格。Claude 深思熟虑。GPT 架构化推理。Gemini 可视化。Haiku 快速。单模型工具强迫你为所有任务选择一个性格。Oh My OpenAgent 利用所有模型，按任务类型路由。这不是临时的黑客——这是随着模型进一步专业化而唯一有意义的架构。

---

## 配置示例

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-openagent.schema.json",

  "agents": {
    // 主编排：Claude Opus 或 Kimi K2.5 最佳
    "sisyphus": {
      "model": "kimi-for-coding/k2p5",
      "ultrawork": { "model": "anthropic/claude-opus-4-6", "variant": "max" },
    },

    // 研究智能体：便宜模型即可
    "librarian": { "model": "google/gemini-3-flash" },
    "explore": { "model": "github-copilot/grok-code-fast-1" },

    // 架构咨询：GPT 或 Claude Opus
    "oracle": { "model": "openai/gpt-5.4", "variant": "high" },
  },

  "categories": {
    // 前端/UI 工作：Gemini 主导视觉任务
    "visual-engineering": {
      "model": "google/gemini-3.1-pro",
      "variant": "high",
    },

    // 深度逻辑和架构：GPT-5.4 xhigh
    "ultrabrain": { "model": "openai/gpt-5.4", "variant": "xhigh" },

    // 自主研究和执行
    "deep": { "model": "openai/gpt-5.4", "variant": "high" },

    // 创意和设计工作
    "artistry": { "model": "google/gemini-3.1-pro", "variant": "high" },

    // 快速任务：快速且便宜
    "quick": { "model": "openai/gpt-5.4-mini" },

    // 低努力后备：最便宜的可用
    "unspecified-low": { "model": "openai/gpt-5.4-mini" },

    // 高努力后备：最好的可用
    "unspecified-high": { "model": "anthropic/claude-opus-4-6", "variant": "max" },

    // 散文和文档
    "writing": { "model": "anthropic/claude-opus-4-6", "variant": "high" },
  },
}
```

---

## 总结

Oh-My-OpenAgent 通过**规划和执行的分离**、**专业化分工**和**智慧积累**，将单个 AI 智能体转变为协调的开发团队。

**核心价值**：
1. **并行执行** - 5+ 个智能体同时工作
2. **哈希锚定编辑** - 68.3% 成功率 vs 6.7%
3. **意图门控** - 理解真实需求而非字面意思
4. **LSP + AST 工具** - IDE 精度
5. **嵌入式 MCP 技能** - 干净的上下文窗口
6. **纪律执行** - 不让智能体偷懒
7. **多模型编排** - 为每项工作选择正确的大脑

**未来展望**：
随着模型进一步专业化，多模型编排与单模型限制之间的差距每个月都在扩大。Oh-My-OpenAgent 押注于这个未来。

---

## 参考资源

- 项目仓库：https://github.com/code-yeongyu/oh-my-openagent
- 概述文档：https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/overview.md
- 编排指南：https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/orchestration.md
- 特性参考：https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/features.md
- 配置参考：https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/reference/configuration.md
