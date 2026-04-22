---
title: AI 工具赋能研发 —— 从 Prompt 到 Harness 工程实践
date: 2026-04-21 10:00:00
tags: [AI, Agent, Prompt Engineering, Harness]
categories: [技术分享]
description: 面向研发中心的 AI 工具实战培训：Prompt / Context / Harness 三层工程、主流 Agent 框架浅析、完整示例与附录资料。
cover: false
toc: true
---


## 培训文档

**适用对象**：研发中心全体员工
**培训时长**：1-2 小时  
**培训形式**：理论讲解 + 现场演示  

---

## 目录

1. [AI 基础概念与名词解释](#1-AI-基础概念与名词解释)
2. [Prompt Engineering 提示词工程](#2-Prompt-Engineering-提示词工程)
3. [Context Engineering 上下文工程](#3-Context-Engineering-上下文工程)
4. [Harness Engineering 约束工程](#4-Harness-Engineering-约束工程)
5. [主流 Agent 框架浅析](#5-主流-Agent-框架浅析)
6. [总结与 Q&A](#6-总结与-Q-A)
7. [附录](#7-附录)

---

## 1. AI 基础概念与名词解释

### 1.1 核心术语详解

#### 1.1.1 Agent（智能体）

**基础定义**：
Agent 是一种能够感知环境、自主规划、执行行动并反思优化的 AI 系统，通过工具调用与外部世界交互，完成复杂任务。

**技术原理**：
Agent 的核心是"感知→规划→行动→反思"循环（PAR 循环）：  

- **感知（Perception）**：接收用户指令和环境信息，解析任务目标  
- **规划（Planning）**：将复杂任务分解为可执行的子任务，选择合适策略（如ReAct 模式、Plan-and-Execute 模式）  
- **行动（Action）**：调用工具（文件操作、代码执行、网络请求等）完成具体操作  
- **反思（Reflection）**：评估行动结果，识别错误，优化后续策略  

**Reflection（反思）机制简介**：
Reflection 是 Agent 的"元认知"能力，指对自身思维过程和行动结果的审视、评估和优化。包含三种类型：自我评估、错误分析、策略调整。通过显式 Prompt、隐式对话或工具辅助三种方式实现。

> 📖 **详细内容请参阅**：[Agent Reflection 与 Memory 机制详解](/2026/04/21/agent-reflection-memory/#1-Reflection（反思）机制详解)

Agent 与简单对话助手的本质区别在于**自主性**和**工具使用能力**。
对话助手仅生成文本，而 Agent 可以真正"做事"——修改文件、运行命令、创建 PR 等。

**示例**：  

```text
用户指令："帮我重构这个认证模块，添加 JWT 支持"

Agent 执行流程：
1. 感知：理解任务是"重构认证模块"，目标是"添加 JWT"
2. 规划：分解为 (1) 分析现有代码 (2) 设计 JWT 方案 (3) 实现代码 (4) 运行测试
3. 行动：读取文件 → 生成代码 → 写入文件 → 执行测试命令
4. 反思：测试失败 → 分析错误 → 修复代码 → 重新测试
```

**Agent Memory（智能体内存）机制简介**：
Agent Memory 是智能体存储、管理和检索信息的能力。按时间维度分为短期记忆和长期记忆；按应用场景分为会话级、项目级、工具级、全局级和技能级记忆。长期记忆可存储在向量数据库、图数据库、传统数据库或文件系统中。

> 📖 **详细内容请参阅**：[Agent Reflection 与 Memory 机制详解](/2026/04/21/agent-reflection-memory/#2-Agent-Memory（智能体内存）机制详解)

#### 1.1.2 Skills（技能）

**基础定义**：
Skills 是预定义的工作流模板，封装了特定任务的最佳实践和执行步骤，指导 AI 按标准化流程完成工作。

**技术原理**：
Skills 本质是**元提示词（Meta-Prompt）** + **执行清单**的组合：

- **元提示词**：定义 AI 在该技能下的角色、职责和行为准则
- **执行清单**：明确的任务步骤，通常包含检查点（Checkpoints）
- **触发条件**：定义何时自动或手动激活该技能
- **工具白名单**：指定该技能允许使用的工具集合

Skills 的价值在于将人类专家的经验固化为可复用的模板，确保 AI 在执行关键任务（如代码审查、测试驱动开发）时遵循经过验证的最佳实践，而非随意发挥。

**示例**：

```markdown
技能：test-driven-development（测试驱动开发）

触发时机：实现任何新功能或修复任何 bug 之前

执行流程：
1. 理解需求：明确功能规格和验收标准
2. 编写失败测试：先写测试用例，运行确认失败
3. 实现代码：编写最少代码使测试通过
4. 重构优化：在不改变行为的前提下优化代码
5. 验证完成：运行完整测试套件确认无回归
```

#### 1.1.3 MCP（Model Context Protocol）

**基础定义**：
MCP 是模型上下文协议，一种标准化的 AI 与外部数据源、工具和服务通信的接口规范，使 AI 能够安全地访问本地和远程资源。

**技术原理**：  
MCP 采用**客户端 - 服务器架构**：  

- **MCP Host（宿主）**：AI 应用本身（如 Claude Code、IDE 插件）  
- **MCP Client（客户端）**：负责与具体 MCP Server 通信  
- **MCP Server（服务器）**：提供特定能力的服务（如文件系统、数据库、API）  

MCP 定义了三类核心资源：  

1. **Tools（工具）**：AI 可调用的操作（如读取文件、执行命令）  
2. **Resources（资源）**：AI 可访问的数据（如文档、配置）  
3. **Prompts（提示词）**：预定义的交互模板  

通过 MCP，AI 可以**安全可控**地访问外部资源，而无需硬编码集成逻辑。每个 MCP Server 明确声明其能力和权限边界，宿主应用可以进行细粒度控制。

**示例**：

```yaml
# MCP 服务器配置示例
mcpServers:
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem"]
    allowedPaths: ["/Users/ranger/work_space/self_project"]
  
  git:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-git"]
    allowedRepos: ["plum-project"]
```

#### 1.1.4 TOOL（工具）

**基础定义**：  
TOOL 是 AI 可调用的具体操作函数，如读取文件、执行命令、搜索代码等，是 Agent 与外部世界交互的"手和脚"。

**技术原理**：  
工具的核心是 **函数调用（Function Calling）** 机制：  

- **工具定义**：声明工具名称、参数 schema、返回值类型  
- **工具注册**：将工具注册到 AI 运行时环境  
- **工具调用**：AI 根据任务需求选择合适的工具，生成调用参数  
- **结果返回**：工具执行后返回结果，AI 基于结果决定下一步行动  

工具分为多个层级：  

- **基础工具**：文件读写、命令执行、代码搜索（由平台提供）  
- **领域工具**：针对特定领域的专用工具（如数据库查询、API 测试）  
- **复合工具**：组合多个基础工具形成的高级工具（如"创建 PR"工具）  

**与 Skills 的关系**：  

- **Tools** 是原子操作，如"读取文件"  
- **Skills** 是工作流，如"代码审查"（可能调用读取文件、搜索代码、运行测试等多个 Tools）

**示例**：

**工具定义（JSON Schema）**：

```json
{
  "name": "read_file",
  "description": "读取文件内容",
  "parameters": {
    "filePath": { "type": "string", "description": "文件绝对路径" },
    "offset": { "type": "number", "description": "起始行号", "optional": true },
    "limit": { "type": "number", "description": "最大行数", "optional": true }
  }
}
```

**调用示例**：

```text
用户："查看 auth.ts 的认证逻辑"
  ↓
AI 调用：read_file({ filePath: "/src/auth.ts", offset: 1, limit: 100 })
```

#### 1.1.5 Prompt（提示词）

**基础定义**：  
Prompt 是用户向 AI 发出的指令文本，通过精心设计的提示词可以显著提升 AI 输出的质量和准确性。

**技术原理**：  
Prompt 的核心是**上下文注入**和**任务框定**：  

- **角色设定**：定义 AI 的专业身份（如"前端工程师"）  
- **任务描述**：清晰说明要完成的具体工作  
- **约束条件**：明确边界和限制（如"不要使用外部依赖"）  
- **输出格式**：指定期望的输出形式（如"用表格对比"）  
- **示例示范**：提供 Few-Shot 示例引导 AI 模仿  

大语言模型本质上是**模式匹配引擎**，Prompt 的质量直接决定了 AI 能否匹配到正确的"模式"。好的 Prompt 能够激活模型中相关的专业知识，抑制无关的输出。

#### 1.1.6 Context（上下文）

**基础定义**：  
Context 是 AI 在执行任务时可访问的所有背景信息，包括项目结构、技术规范、对话历史等，决定了 AI 对任务的理解深度。

**技术原理**：  
上下文分为四个层级（由宏观到微观）：  

1. **领域上下文（Domain Context）**：行业知识、业务逻辑、专业术语  
2. **项目上下文（Project Context）**：技术栈、架构设计、编码规范  
3. **会话上下文（Session Context）**：当前对话的历史记录  
4. **任务上下文（Task Context）**：具体任务的详细信息  

**上下文窗口限制**：  
AI 模型的上下文窗口（Context Window）有限，如 Claude Opus 支持 1M tokens。超过限制会导致：  

- **注意力稀释（Attention Dilution）**：过多信息分散模型注意力  
- **关键信息丢失**：早期信息被"挤出"窗口  

**上下文管理策略**：  

- **分层注入**：按优先级提供上下文，核心信息优先  
- **按需加载**：根据任务阶段动态加载相关上下文  
- **压缩摘要**：用结构化格式（表格、列表）代替长文本  

### 1.2 Agent 工作原理

#### 1.2.1 核心架构：感知→规划→行动→反思

**PAR 循环详解**：

1. **感知（Perception）**
   - 接收用户输入（自然语言指令）
   - 解析环境状态（读取相关文件、检查当前代码）
   - 识别任务目标和约束条件

2. **规划（Planning）**
   - **任务分解**：将复杂目标拆解为可执行的子任务
   - **策略选择**：根据任务类型选择合适的执行模式
     - *ReAct 模式*：Reason + Act，边思考边行动，适合探索性任务
     - *Plan-and-Execute 模式*：先制定完整计划再执行，适合确定性任务
   - **资源调度**：确定需要调用的 Skills 和 Tools

3. **行动（Action）**
   - 调用工具执行具体操作
   - 监控执行结果和副作用
   - 处理异常和错误

4. **反思（Reflection）**
   - 评估行动结果是否符合预期
   - 识别错误类型（语法错误、逻辑错误、设计错误）
   - 优化后续策略（调整计划、更换工具、请求人工介入）

#### 1.2.2 工具调用机制

**Function Calling 流程**：

```text
用户指令 → Agent 分析 → 选择工具 → 生成参数 → 执行工具 → 返回结果 → 决定下一步
```

**工具选择策略**：  

- **语义匹配**：根据工具描述与任务的语义相似度选择  
- **历史学习**：基于过往成功经验选择  
- **约束过滤**：根据权限和边界排除不可用工具  

**多工具编排模式**：  

- **链式调用**：工具 A 的输出作为工具 B 的输入
- **并行调用**：同时调用多个独立工具
- **条件调用**：根据前一个工具的结果决定是否调用下一个  

**示例**：

```text
场景：实现用户认证功能

Step 1: 读取现有代码
        read_file("app/controllers/sessions_controller.rb")

Step 2: 搜索相关测试
        search_code("describe.*sessions", pattern: "**/*_spec.rb")

Step 3: 生成新代码（基于前两步的结果）
        write_file("app/controllers/sessions_controller.rb", new_content)

Step 4: 运行测试验证
        run_command("bundle exec rspec spec/controllers/sessions_controller_spec.rb")

Step 5: 如果测试失败，分析错误并修复
        if test_failed:
          analyze_error(test_output)
          fix_code()
          retry_test()
```

#### 1.2.3 自主性与边界

**Agent 能自主决定什么**：  

- 任务分解的方式和顺序  
- 使用哪些工具和技能  
- 代码实现的具体细节  
- 错误修复的策略  

**人类监督点（Human-in-the-loop）**：  

- **关键操作确认**：删除文件、修改配置、部署生产  
- **设计决策**：架构变更、新技术引入、重大重构  
- **模糊边界**：当任务目标不明确或存在多种解释时  
- **错误升级**：连续多次修复失败后请求人工介入  

**安全约束与护栏设计**：  

- **权限控制**：定义允许/禁止的操作类型  
- **文件范围**：限制可访问的目录和文件模式  
- **资源配额**：限制工具调用次数、执行时间  
- **输出审查**：对 AI 生成内容进行自动化检查（Lint、测试、安全扫描）  

Agent 的工作流程是一个持续循环的过程，如下图所示：

![Agent 架构图](/2026/04/21/ai-tooling-harness/agent-architecture.svg)

### 1.3 技术生态全景图

```text
┌─────────────────────────────────────────────────────────────┐
│                      AI 工程化框架                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Prompt Engineering                                         │
│  └─ 如何"问"：设计有效的指令和问题                          │
│         ↓                                                   │
│  Context Engineering                                        │
│  └─ 如何"喂"：提供合适的背景和信息                          │
│         ↓                                                   │
│  Harness Engineering                                        │
│  └─ 如何"管"：建立约束、验证和纠正机制                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

三者关系：
- Prompt 是"指令"，告诉 AI 做什么
- Context 是"燃料"，给 AI 提供必要的信息
- Harness 是"护栏"，确保 AI 的输出可靠
```

---

## 2. Prompt Engineering 提示词工程

### 2.1 基础原则：CLEAR 框架

```text
C - Context（上下文）：提供足够的背景信息
L - Limit（限制）：明确约束条件和边界
E - Example（示例）：给出期望的输出样例
A - Action（行动）：清晰描述要执行的任务
R - Refine（优化）：迭代优化 prompt
```

### 2.2 核心技巧

#### 技巧 1：角色设定

```markdown
prompt：
"帮我写个函数"

优化 prompt：
"你是一位资深的 xxx工程师，擅长 xxx技术 和 xxx技术。
请帮我写一个 xxx 文件/需求/功能，需要包含 xxxx 内容。"
```

#### 技巧 2：上下文注入

```markdown
prompt：
"这 功能/代码/文件 有什么问题？"

优化 prompt（以代码优化为例）：
"这是一个 xxx 架构 应用的 User 模型，使用 PostgreSQL 数据库。
我们的编码规范要求所有查询必须有索引优化。
请审查以下代码的性能问题：
[代码内容]"
```

#### 技巧 3：输出格式化

```markdown
prompt：
"分析一下这个功能/文件/需求"

优化 prompt：
"请按以下格式输出分析结果：
1. 功能描述（50 字以内）
2. 潜在风险（列表形式，按严重程度排序）
3. 改进建议（每条建议包含：问题 + 解决方案 + 优先级）"
```

#### 技巧 4：链式思考（Chain of Thought）

```markdown
prompt：
"这个 bug 怎么修？"

优化 prompt：
"请按以下步骤分析问题：
1. 首先，描述你理解的问题现象
2. 然后，列出可能的根本原因（至少 3 个）
3. 接着，对每个原因给出验证方法
4. 最后，提供修复方案和代码示例"
```

#### 技巧 5：Few-Shot Learning

```markdown
 示例 prompt：
"请按照以下示例的风格编写 API 文档：

【示例 1】
[输入] GET /users
[输出] 获取用户列表，支持分页和筛选...

【示例 2】
[输入] POST /users
[输出] 创建新用户，需要验证邮箱唯一性...

【任务】
[输入] PUT /users/:id
[输出] ？"
```

### 2.3 常见陷阱与避免方法

| 陷阱 | 表现 | 避免方法 |
| --- | --- | --- |
| 上下文不足 | AI 理解偏差 | 提供项目背景、技术栈、约束条件 |
| 任务模糊 | 输出不符合预期 | 使用明确动词，定义验收标准 |
| 过度信任 | 忽略 AI 错误 | 始终进行人工审查和测试 |
| 信息泄露 | 敏感代码上传 | 脱敏处理，使用本地模型 |

---

## 3. Context Engineering 上下文工程

### 3.1 什么是 Context Engineering？

> **Context Engineering（上下文工程）** 是系统设计和管理上下文信息的艺术，目的是让 AI 在正确的时间获得正确的信息，从而做出更准确的决策和输出。

**为什么需要 Context Engineering？**

- AI 本身没有"记忆"，每次对话都是新的开始
- 过多的上下文会导致注意力分散（Attention Dilution）
- 过少的上下文会导致理解偏差
- 好的上下文工程能让 AI 输出质量提升 10 倍以上

### 3.2 上下文层级模型

```text
┌─────────────────────────────────────────┐
│  Level 4: 任务上下文（Task Context）     │  ← 当前具体任务
├─────────────────────────────────────────┤
│  Level 3: 会话上下文（Session Context）  │  ← 当前对话历史
├─────────────────────────────────────────┤
│  Level 2: 项目上下文（Project Context）  │  ← 项目结构、规范
├─────────────────────────────────────────┤
│  Level 1: 领域上下文（Domain Context）   │  ← 行业知识、业务逻辑
└─────────────────────────────────────────┘
```

### 3.3 上下文管理策略

#### 策略 1：分层注入法

**按优先级分层提供上下文：**

```markdown
# Level 1 - 领域上下文（1-2 句话）
"我们是一家芯片设计公司，这是内部研发管理系统"

# Level 2 - 项目上下文（关键信息）
"项目：基于 XXX 技术架构
数据库：PostgreSQL
认证：JWT + Refresh Token"

# Level 3 - 会话上下文（当前任务）
"我们正在讨论用户认证模块的优化"

# Level 4 - 任务上下文（具体指令）
"请审查这个 token 刷新逻辑的性能问题"
```

#### 策略 2：上下文窗口优化

**问题**：AI 模型的上下文窗口有限，过多信息会降低质量

**解决方案：**

```markdown
# 错误做法：一次性粘贴整个文件

#  正确做法：提取关键部分
"这是 User 模型的核心部分（省略了验证和回调）：
[只包含相关字段和方法的代码]

完整文件 500 行，以上是第 1-50 行和第 120-180 行（与认证相关的部分）"
```

**上下文压缩技巧：**

1. **代码压缩**
   - 移除注释和空白行
   - 用 `# ...` 省略不相关的代码块
   - 只保留方法签名，省略实现细节

2. **信息摘要**
   - 用表格代替长描述
   - 使用结构化格式（列表、JSON）
   - 提前总结关键信息

3. **引用代替复制**
   - "参考之前讨论的 User 模型结构"
   - "如项目规范文档第 3 节所述"

#### 策略 3：上下文文档化

**创建项目上下文文档：**

详细模板请参阅 [附录 C：Context 文档模板](#附录-C：Context-文档模板)

**使用方式：**

```markdown
# 在对话开始时引用
"请阅读项目的.ai-context.md 文件，然后帮我..."

# 或在 Claude Code 中
@.ai-context.md 帮我分析当前项目的技术债务
```

### 3.4 上下文工程实践技巧

#### 技巧 1：系统提示词（System Prompt）

**为常用场景创建系统提示词：**

```markdown
## 代码审查场景
"你是一位资深代码审查员，专注于：
1. 安全性问题（SQL 注入、XSS、CSRF）
2. 性能问题（N+1 查询、内存泄漏）
3. 可维护性（代码重复、复杂度过高）

输出格式：
- 【严重】必须修复
- 【警告】建议修复
- 【提示】可选优化"

## 文档生成场景
"你是技术文档工程师，擅长：
1. API 文档（OpenAPI/Swagger 规范）
2. 架构文档（C4 模型）
3. 用户手册（步骤清晰、示例丰富）

写作风格：简洁、准确、示例驱动"
```

#### 技巧 2：上下文链接法

**建立上下文之间的关联：**

```markdown
"参考我们之前讨论的 [用户认证方案](#session-1)，
现在需要实现 [密码重置功能](#current-task)。

约束条件：
- 复用已有的 JWT 机制
- 遵循项目的 [安全规范](docs/SECURITY.md)
- 参考 [类似功能](app/controllers/sessions_controller.rb) 的实现"
```

#### 技巧 3：动态上下文更新

**在长会话中维护上下文：**

```markdown
【会话状态】
已完成：
-  分析现有认证流程
-  识别安全问题

进行中：
- 🔄 设计密码重置 API

待完成：
- ⏳ 实现发送重置邮件
- ⏳ 添加速率限制

【当前焦点】
正在讨论：密码重置 token 的有效期设置
决策点：24 小时 vs 1 小时 vs 可配置
```

### 3.5 上下文工程与 Prompt/Harness 的关系

> 回顾 [1.3 技术生态全景图](#1-3-技术生态全景图) 中提到的三层框架：

| 层级 | 工程领域 | 核心问题 | 关注点 |
| --- | --- | --- | --- |
| 指令层 | Prompt Engineering | 如何"问" | 设计有效的指令和问题 |
| 信息层 | Context Engineering | 如何"喂" | 提供合适的背景和信息 |
| 约束层 | Harness Engineering | 如何"管" | 建立约束、验证和纠正机制 |

三者关系：

- **Prompt** 是"指令"，告诉 AI 做什么
- **Context** 是"燃料"，给 AI 提供必要的信息
- **Harness** 是"护栏"，确保 AI 的输出可靠

### 3.6 上下文工程常见陷阱

| 陷阱 | 表现 | 解决方案 |
| --- | --- | --- |
| 上下文过载 | 一次性提供过多信息 | 分层注入，按需加载 |
| 上下文不足 | AI 频繁询问背景信息 | 预先准备项目上下文文档 |
| 上下文过时 | AI 基于旧信息做决策 | 动态更新会话状态 |
| 上下文混乱 | 信息组织无结构 | 使用模板和结构化格式 |

---

## 4. Harness Engineering 约束工程

### 4.1 什么是 Harness Engineering？

> **Harness Engineering** 是设计和实施以下系统的过程：  
>
> - **约束（Constrain）**：AI 智能体可以执行的操作  
> - **告知（Inform）**：智能体应该做什么  
> - **验证（Verify）**：智能体是否正确完成了任务  
> - **纠正（Correct）**：当智能体出错时进行修复  

—— Martin Fowler

### 4.2 CIVC 框架详解

#### 4.2.1 Constrain（约束）

**目的**：建立架构边界和安全护栏

**实践方法：**

```yaml
# 示例：Claude Code 的权限配置
permissions:
  allowed_tools:
    - read_files
    - search_code
    - run_tests
  restricted_tools:
    - delete_files
    - deploy_production
    - access_secrets
  file_patterns:
    allowed: ["**/*.rb", "**/*.js", "**/*.ts"]
    denied: ["**/.env*", "**/config/credentials*"]
```

**约束层级：**

```text
Level 1: 只读模式（代码审查、分析）
Level 2: 沙盒写入（生成代码到指定目录）
Level 3: 有限执行（可运行测试、lint）
Level 4: 完整访问（需人工确认关键操作）
```

#### 4.2.2 Inform（告知）

**目的**：提供清晰的上下文和任务说明

**上下文工程实践：**

```markdown
# 项目上下文文档（PROJECT_CONTEXT.md）

## 技术栈
- Backend: Rails 7.1, Ruby 3.2
- Frontend: React 18, TypeScript 5
- Database: PostgreSQL 15

## 编码规范
- 所有模型必须有单元测试
- API 变更需要更新 Swagger 文档
- 数据库迁移必须可回滚

## 当前迭代目标
- Sprint 23: 优化用户认证模块
- 重点：性能提升 20%，零安全漏洞
```

**文档组织策略：**

```text
docs/
├── ARCHITECTURE.md      # 系统架构
├── CODING_STANDARDS.md  # 编码规范
├── API_CONTRACTS.md     # API 契约
└── AGENT_INSTRUCTIONS.md # AI 助手专用指南
```

#### 4.2.3 Verify（验证）

**目的**：确保 AI 输出符合质量标准

**验证工具链：**

```bash
#!/bin/bash
# 自动化验证脚本示例

# 1. 代码风格检查
rubocop --format clang
eslint --format compact

# 2. 类型检查
tsc --noEmit

# 3. 单元测试
rspec --format progress
jest --ci

# 4. 集成测试
rails test:system

# 5. 安全扫描
brakeman -q
bundle audit
```

**验证清单：**

```markdown
## AI 生成代码审查清单

- [ ] 代码通过所有现有测试
- [ ] 新增代码有对应的单元测试
- [ ] 符合项目编码规范（rubocop/eslint）
- [ ] 没有引入安全漏洞（brakeman）
- [ ] 数据库迁移可回滚
- [ ] API 文档已更新
- [ ] 性能回归测试通过
```

#### 4.2.4 Correct（纠正）

**目的**：建立反馈循环和自修复机制

**纠正策略：**

```markdown
# 错误处理工作流

1. **检测错误**
   - 自动化测试失败
   - Lint 检查报错
   - 人工审查发现问题

2. **分类错误**
   - 语法错误 → 直接让 AI 修复
   - 逻辑错误 → 提供测试用例，让 AI 迭代
   - 设计错误 → 人工介入，重新设计

3. **反馈循环**
   - 将错误信息 + 期望输出反馈给 AI
   - 记录常见错误模式到知识库
   - 更新 Harness 约束条件
```

**反馈 Prompt 模板：**

```markdown
【错误反馈】
任务：生成用户认证 API
错误类型：逻辑错误
失败测试：test_invalid_token_returns_401
错误信息：Expected 401, got 200

【上下文】
当前实现：[代码片段]
期望行为：无效 token 应返回 401

【修复要求】
1. 分析错误原因
2. 提供修复后的代码
3. 说明修改内容
4. 确保不破坏其他测试
```

Harness 工程的完整工作流程遵循 CIVC 框架，如下图所示：

**工作流程说明**：

1. **约束层（Constrain）**：AI 在执行任何操作前，先检查权限、文件范围、操作白名单
2. **告知层（Inform）**：读取项目上下文、任务说明、编码规范，确保理解正确
3. **执行层**：生成代码或其他产物
4. **验证层（Verify）**：运行自动化测试、代码检查、安全扫描
5. **纠正层（Correct）**：如果验证失败，分类错误类型，决定重试或人工介入

![Harness 工作流程图](/2026/04/21/ai-tooling-harness/harness-workflow.svg)

### 4.3 Oh-My-OpenAgent 多智能体编排架构

#### 4.3.1 项目概述

**Oh-My-OpenAgent**（前身 Oh-My-OpenCode）是基于 OpenCode 的多模型智能体编排框架。
它不绑定单一模型，而是为不同任务自动路由到最合适的"大脑"
——Claude 深思熟虑、GPT 架构推理、Gemini 视觉、Haiku 快速
——把单体智能体变成协同的开发团队。

整体架构如下图所示（详细角色分工见 §4.3.2）：

![Oh-My-OpenAgent 架构总览](/2026/04/21/ai-tooling-harness/oh-my-openagent-architecture.svg)

---

#### 4.3.2 核心智能体详解

##### 1. Sisyphus (主编排智能体)

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

##### 2. Hephaestus (深度工作者)

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
| --- | --- | --- |
| 模型 | GPT-5.4 | Claude Opus/Kimi/GLM |
| 方式 | 自主深度工作者 | 关键词激活的超工作模式 |
| 最佳场景 | 复杂架构工作 | 一般复杂任务 |
| 规划 | 执行中自我规划 | 使用 Prometheus 计划（如有） |
| 委托 | 大量使用 explore/librarian | 基于类别的委托 |

---

##### 3. Prometheus (战略规划师)

**职责**：

- 像真实工程师一样采访用户
- 提出澄清性问题
- 识别范围和模糊点
- 在写代码前构建详细计划
- **只读模式**：只能创建/修改 `.sisyphus/` 目录内的 markdown 文件

**采访流程**：

```text
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
| --- | --- | --- |
| 重构 | 安全性 - 行为保持 | "哪些测试验证当前行为？" "回滚策略？" |
| 从零构建 | 发现优先 - 模式优先 | "在代码库中发现模式 X。遵循还是偏离？" |
| 中型任务 | 边界 - 精确范围 | "什么绝对不能包含？硬性约束？" |
| 架构设计 | 战略性 - 长期影响 | "预期生命周期？规模需求？" |

---

##### 4. Metis (差距分析顾问)

**职责**：

- 在 Prometheus 写计划前强制进行差距分析
- 发现 Prometheus 遗漏的内容
- 识别隐藏意图和模糊点
- 检测 AI-slop 模式（过度工程化、范围蔓延）
- 找出缺失的验收标准
- 发现未解决的边缘情况

**为什么需要 Metis**：
计划作者 (Prometheus) 有"ADHD 工作记忆"问题——它建立的连接永远不会出现在纸面上。Metis 强制将隐性知识外部化。

---

##### 5. Momus (严格审查员)

**职责**：

- 对高准确度模式进行计划审查
- 验证计划是否符合四大核心标准

**四大审查标准**：

1. **清晰度 (Clarity)**：每个任务是否指定了在哪里查找实现细节？
2. **可验证性 (Verification)**：验收标准是否具体可测量？
3. **上下文 (Context)**：是否有足够的上下文以便无需>10% 猜测即可进行？
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

##### 6. Atlas (执行指挥家)

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

##### 7. Sisyphus-Junior (任务执行者)

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

**系统提醒机制**：

```text
[SYSTEM REMINDER - TODO CONTINUATION]

你有未完成的 TODO！在回复前完成所有：
- [ ] 实现用户服务 ← 进行中
- [ ] 添加验证
- [ ] 编写测试

在所有 TODO 标记完成前不要回复。
```

这个"推石头"机制正是系统以西西弗斯命名的原因。

---

##### 8. 专家智能体 (Specialists)

| 智能体 | 职责 | 推荐模型 | 适用场景 |
| --- | --- | --- | --- |
| **Oracle** | 架构顾问 | GPT-5.4 / Claude Opus | 架构决策、复杂调试 |
| **Explore** | 代码库搜索 | Grok Code Fast 1 | 发现代码模式、文件结构 |
| **Librarian** | 文档/OSS 搜索 | MiniMax M2.7 | 查找库 API、最佳实践 |
| **Multimodal-Looker** | 视觉分析 | Vision Model | 分析图像、图表、PDF |

---

#### 4.3.3 类别 + 技能系统

##### 为什么类别是革命性的

##### 问题：模型名称的局限性

```typescript
// 旧方式：模型名称创建了分布偏见
task({ agent: "gpt-5.4", prompt: "..." }); // 模型知道自己的局限
task({ agent: "claude-opus-4-6", prompt: "..." }); // 不同的自我认知
```

##### 解决方案：语义类别

```typescript
// 新方式：类别描述意图，而非实现
task({ category: "ultrabrain", prompt: "..." }); // "战略性思考"
task({ category: "visual-engineering", prompt: "..." }); // "美丽地设计"
task({ category: "quick", prompt: "..." }); // "快速完成"
```

##### 内置类别

| 类别 | 默认配置 | 适用场景 |
| --- | --- | --- |
| `visual-engineering` | gemini-3.1-pro high | 前端、UI/UX、设计、动画 |
| `ultrabrain` | gpt-5.4 xhigh | 深度逻辑推理、复杂架构决策 |
| `deep` | gpt-5.4 medium | 目标导向的自主问题解决 |
| `artistry` | gemini-3.1-pro high | 高度创意或艺术性任务 |
| `quick` | gpt-5.4-mini | 琐碎任务、单文件修改 |
| `unspecified-low` | gpt-5.4-mini | 不适合其他类别的任务，低努力 |
| `unspecified-high` | claude-opus-4-6 max | 不适合其他类别的任务，高努力 |
| `writing` | claude-opus-4-6 | 文档、散文、技术写作 |

##### 技能：领域特定指令

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

#### 4.3.4 核心特性

##### 1. 意图门控 (Intent Gate)

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

---

##### 2. 哈希锚定编辑工具 (Hashline)

**问题**：大多数智能体失败不是因为模型，而是因为编辑工具。

**解决方案**：
每行读取时带回内容哈希标签：

```text
11#VK| function hello() {
22#XJ|   return "world";
33#MB| }
```

智能体通过引用这些标签进行编辑。如果文件自上次读取后发生变化，哈希将不匹配，编辑会在损坏前被拒绝。

**效果**：
Grok Code Fast 1 成功率：**6.7% → 68.3%** （仅因编辑工具的改进）

---

##### 3. 智慧积累 (Wisdom Accumulation)

每次任务完成后：

1. 从子智能体的响应中提取学习
2. 分类为：约定、成功、失败、陷阱、命令
3. 传递给所有后续子智能体

这防止了重复错误并确保一致的模式。

**记事本系统**：

```text
.sisyphus/notepads/{plan-name}/
├── learnings.md      # 模式、约定、成功方法
├── decisions.md      # 架构选择和理由
├── issues.md         # 遇到的问题、阻碍、陷阱
├── verification.md   # 测试结果、验证结果
└── problems.md       # 未解决的问题、技术债务
```

---

##### 4. 并行执行

**默认行为**：

- 独立的读取、搜索和智能体**同时运行**
- 可以启动 5+ 个后台智能体并行工作
- 当一个智能体写代码时，另一个研究模式，第三个检查文档

**像真正的开发团队一样工作**。

---

##### 5. 深度初始化 (/init-deep)

运行 `/init-deep` 会生成层次化的 `AGENTS.md` 文件：

```text
project/
├── AGENTS.md              ← 项目级上下文
├── src/
│   ├── AGENTS.md          ← src 特定上下文
│   └── components/
│       └── AGENTS.md      ← 组件特定上下文
```

智能体自动读取相关上下文。无需手动管理。

---

#### 4.3.5 工作模式

##### Ultrawork 模式：简单设计

**使用方法**：输入 `ultrawork` 或 `ulw`

**工作原理**：

- 智能体自己弄清楚一切
- 探索代码库
- 研究模式
- 实现功能
- 用诊断验证
- 持续工作直到完成

这是"只管做"模式。全自动。你不必深入思考，因为智能体替你深入思考。

---

##### Prometheus 模式：精准设计

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

#### 4.3.6 决策流程

```text
是快速修复或简单任务吗？
  └─ 是 → 正常提示即可
  └─ 否 → 解释完整上下文很麻烦吗？
              └─ 是 → 输入 "ulw" 让智能体自己弄清楚
              └─ 否 → 需要精确、可验证的执行吗？
                         └─ 是 → 使用 @plan 进行 Prometheus 规划，然后 /start-work
                         └─ 否 → 只用 "ulw"
```

---

#### 4.3.7 与纯 Claude Code 的对比

| 特性 | Claude Code | Oh-My-OpenAgent |
| --- | --- | --- |
| 执行模式 | 单智能体单模型 | 多智能体并行执行 |
| 编辑工具 | 基于行号（易失效） | 哈希锚定（68.3% 成功率） |
| 意图理解 | 字面执行 | 意图门控分类 |
| 工具集成 | 基础 | LSP + AST-Grep + Hashline + Tmux |
| 技能系统 | 标准 | 带嵌入式 MCP 的技能 |
| 纪律执行 | 无 | TODO 执行者 + 评论检查器 + Ralph Loop（反复循环直到 100% 完成） |
| 模型选择 | 单一模型 | 按任务类型自动路由到最佳模型 |

**根本优势**：  

模型有不同的性格。Claude 深思熟虑。GPT 架构化推理。Gemini 可视化。Haiku 快速。
单模型工具强迫你为所有任务选择一个性格。
Oh My OpenAgent 利用所有模型，按任务类型路由。
这不是临时的黑客——这是随着模型进一步专业化而唯一有意义的架构。

---

## 5. 主流 Agent 框架浅析

### 5.1 OpenClaw vs Hermes Agent 对比分析

在 AI Agent 领域，OpenClaw 和 Hermes Agent 代表了两种不同的设计哲学和应用方向。本节简要分析两者的核心差异和适用场景。

#### 5.1.1 核心定位对比

| 维度 | OpenClaw | Hermes Agent |
| --- | --- | --- |
| **核心定位** | 多平台消息 Agent 框架 | 自我进化的个人 AI Agent |
| **记忆系统** | 文件系统（SOUL.md/MEMORY.md） | SQLite + FTS5 + Honcho |
| **学习机制** | 静态配置技能 | 自动创建/改进技能 |
| **平台支持** | 50+ 消息平台 | 15+ 平台 + 6 终端后端 |
| **部署方式** | 本地 Gateway | 本地/Docker/Serverless |

#### 5.1.2 技术特点浅析

**OpenClaw 的优势**：

- **简单直观**：基于文件系统的记忆，易于理解和调试
- **快速部署**：Gateway 架构简单，适合快速上线
- **生产导向**：专注于业务场景，如电商运营、客服、团队协作
- **技能丰富**：5700+ 内置技能，覆盖多种应用场景

**Hermes Agent 的优势**：

- **自我进化**：内置学习循环，能从每次对话中总结新技能
- **强大记忆**：SQLite + FTS5 全文搜索，支持跨会话召回和 LLM 摘要
- **用户建模**：Honcho 构建深化用户画像，理解用户偏好
- **研究友好**：支持轨迹导出、Atropos RL 环境，适合研究实验

#### 5.1.3 选择建议

**选择 OpenClaw，如果你需要**：

- 快速部署多平台客服机器人
- 电商业务自动化（价格监控、库存管理）
- 团队协调和日常运营自动化
- 简单直观的记忆系统

**选择 Hermes Agent，如果你需要**：

- 长期记忆积累和个人深度助手
- 自我进化能力，持续改进性能
- 研究实验（轨迹导出、RL 训练）
- 复杂任务自动化（需要技能积累）

---

### 5.2 Oh-My-OpenAgent 的定位

**Oh-My-OpenAgent** 与上述两个框架有不同的定位：

| 框架 | 核心场景 | 关键优势 |
| --- | --- | --- |
| **OpenClaw** | 消息平台集成 | 多平台支持、快速部署 |
| **Hermes Agent** | 个人助手 | 自我进化、长期记忆 |
| **Oh-My-OpenAgent** | 代码开发编排 | 多模型协作、并行执行 |

**Oh-My-OpenAgent 的核心价值**：

1. **多模型编排**：不绑定单一模型，为不同任务自动选择最佳模型
2. **并行执行**：5+ 个智能体同时工作，像真正的开发团队
3. **意图门控**：在行动前分类用户真实意图，减少误解
4. **哈希锚定编辑**：编辑成功率从 6.7% 提升到 68.3%
5. **智慧积累**：跨任务学习，防止重复错误

**与 OpenClaw/Hermes 的互补关系**：

- OpenClaw/Hermes 侧重于**消息集成**和**个人助手**
- Oh-My-OpenAgent 侧重于**代码开发**和**工程编排**
- 三者可以结合使用：OpenClaw/Hermes 处理消息和日常任务，Oh-My-OpenAgent 处理复杂开发工作

---

## 6. 总结与 Q&A

### 6.1 关键要点回顾

**基础概念：**

- Agent：感知→规划→行动→反思的循环系统
- Skills：预定义的工作流模板
- MCP：标准化的 AI 与外部资源通信协议
- Tools：AI 可调用的具体操作函数
- Prompt：向 AI 发出的指令文本
- Context：AI 执行任务时的背景信息

**Prompt Engineering：**

- 使用 CLEAR 框架设计 prompt
- 提供充足的上下文信息
- 明确输出格式和验收标准
- 采用链式思考提升质量

**Context Engineering：**

- 分层注入上下文（领域→项目→会话→任务）
- 优化上下文窗口，避免信息过载
- 创建项目上下文文档（.ai-context.md）
- 动态维护会话状态

**Harness Engineering：**

- 约束（Constrain）：建立安全边界  
- 告知（Inform）：提供清晰上下文  
- 验证（Verify）：自动化质量检查  
- 纠正（Correct）：建立反馈循环  

### 6.2 行动建议

**个人层面：**  

1. 为常用任务建立 prompt 模板  
2. 创建个人上下文文档（技术栈、常用命令、项目笔记）  
3. 对 AI 生成的代码始终保持审查  
4. 记录 AI 使用中的最佳实践和陷阱  
5. 学习使用 SuperPower 技能提升工作效率  

**团队层面：**

1. 建立团队 AI 使用规范  
2. 共享高质量的 prompt、上下文文档和 Harness 配置  
3. 定期组织 AI 工具使用经验分享  
4. 建立团队知识库，沉淀上下文信息  
5. 配置 OpenCode + Oh-My-OpenAgent 开发环境  

### 6.3 资源推荐

**学习资源：**

- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Context Engineering Guide](https://www.contextengineering.guide/)
- [Martin Fowler - AI Harness](https://martinfowler.com/articles/harnessing-ai.html)
- [Claude Code 官方文档](https://docs.anthropic.com/claude-code/)
- [Oh-My-OpenAgent GitHub](https://github.com/code-yeongyu/oh-my-openagent)

**工具推荐：**  

- 代码辅助：Cursor、GitHub Copilot  
- 终端自动化：Claude Code、Aider  
- 上下文管理：Obsidian、Notion（用于知识库）  
- 工作流编排：OpenCode + Oh-My-OpenAgent  

---

## 7. 附录

### 附录 A：Prompt 模板库

```markdown
## 代码审查模板
"你是资深 [语言] 工程师。请审查以下代码：
- 关注点：[性能/安全/可维护性]
- 项目规范：[规范要点]
- 输出格式：问题列表 + 修复建议 + 优先级"

## 文档生成模板
"根据以下代码生成 API 文档：
- 目标读者：[前端工程师/第三方开发者]
- 必需信息：[参数/返回值/错误码]
- 参考风格：[示例文档链接]"

## Bug 修复模板
"分析以下 bug：
- 现象：[错误表现]
- 环境：[系统信息]
- 已尝试：[已做的排查]
- 输出：根本原因 + 修复方案 + 验证步骤"

## 新功能开发模板
"作为 [角色]，请帮我实现 [功能]：
- 业务背景：[为什么需要这个功能]
- 技术要求：[技术栈、性能要求]
- 验收标准：[功能完成的判断标准]
- 约束条件：[不能修改的部分、兼容性要求]"
```

### 附录 B：Harness 配置示例

```yaml
# .ai-harness.yml
version: 1.0

constraints:
  allowed_operations:
    - read
    - write_test
    - run_lint
  denied_operations:
    - delete
    - deploy
    - access_secrets

verification:
  pre_commit:
    - rubocop
    - rspec
  post_commit:
    - brakeman
    - bundle_audit

feedback:
  on_failure: auto_retry
  max_retries: 3
  escalation: human_review
```

### 附录 C：Context 文档模板

```markdown
# .ai-context.md 模板

## 项目概述
- 名称：[项目名称]
- 类型：[Web 应用/API/库/其他]
- 用户：[目标用户群体]

## 技术栈
| 层级 | 技术 | 版本 |
| --- | --- | --- |
| 后端 |  |  |
| 前端 |  |  |
| 数据库 |  |  |
| 缓存 |  |  |

## 核心业务概念
- **[概念 1]**：描述
- **[概念 2]**：描述

## 关键业务规则
1. [规则 1]
2. [规则 2]

## 常用命令
# 启动服务
# 运行测试
# 数据库迁移

## AI 助手注意事项
- [特定要求 1]
- [特定要求 2]
```

### 附录 D：SuperPower 技能清单

```markdown
## 创意与规划类
- brainstorming：创意发散，探索多种方案
- writing-plans：编写详细的实施计划

## 开发流程类
- test-driven-development：测试驱动开发
- using-git-worktrees：使用 Git 工作树隔离开发
- executing-plans：执行已编写的计划

## 质量保证类
- verification-before-completion：完成前验证
- systematic-debugging：系统化调试
- requesting-code-review：请求代码审查
- receiving-code-review：接收代码审查

## 完成与整合类
- finishing-a-development-branch：完成开发分支
- subagent-driven-development：子代理驱动开发
- using-superpowers：SuperPower 使用指南
```
