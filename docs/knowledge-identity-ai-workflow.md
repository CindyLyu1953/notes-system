# Knowledge Identity · AI Workflow

> 状态：MVP 实施基线  
> 目标：把用户的自由输入变成可追溯、可纠错、会随时间成长的 Knowledge Identity。  
> 原则：借鉴 Alfred 的清晰分层，不复制其多领域 Personal OS 的复杂度。

## 当前实施状态

| 阶段 | 状态 | 已完成 |
|---|---|---|
| Phase 1 · 可审计写入路径 | 已完成 | Graph / Node / Action、唯一 ActionExecutor、Evidence、workflow run |
| Phase 2 · 选择性确认 | 已完成 | 输入预览、原文先保存、逐条修改/接受/拒绝、依赖清理 |
| Phase 3 · 真正的 AI extraction | 已完成 | OpenAI Structured Outputs、严格 schema、Concept 去重、state signals、trace 与本地 fallback |
| Phase 4 · 持久化与检索 | 已完成 | PostgreSQL、pgvector embeddings、关键词 + 语义 hybrid ranking |
| Phase 5 · 复杂编排 | 按需评估 | 暂不引入 LangGraph |

## 一句话版本

用户自由输入，AI 提取结构化理解并提出一组修改；系统只通过统一的 Action 执行这些修改，所有结果都保留来源，重要或低置信修改先让用户确认。

```text
用户输入
  ↓
保存原始 Input
  ↓
AI 提取 Concepts / Knowledge signals / structured note
  ↓
生成 pending Actions
  ↓
安全且高置信 ──▶ 自动提交
重要或低置信 ──▶ 用户确认 / 修改
  ↓
Action Executor 唯一写入
  ↓
Knowledge Identity / Library / Growth Recap / Chat
```

## 核心结构

### Graph：决定顺序

Graph 只描述工作流的控制顺序，不直接理解内容，也不直接写数据库。

MVP 的 Capture Graph：

```text
Capture Input
  → Extract Concepts
  → Evaluate Knowledge States
  → Record Learning Event
  → Refresh Identity
```

当前流程基本线性，因此先使用普通 Python 编排。只有当出现持久化暂停、复杂分支、并行任务或失败恢复需求时，才引入 LangGraph。

### Node：完成一项 AI 判断

每个 Node 接收共享 workflow state，输出结构化结果和建议执行的 Actions。Node 不拥有控制流，也不写数据库。

| Node | 输入 | 输出 |
|---|---|---|
| `extract_concepts` | 原始 Input | 标准化 Concept candidates |
| `evaluate_states` | candidates + 历史 Evidence | Knowledge State proposals |
| `record_learning_event` | 本次变化 | Learning Event proposal |
| `generate_recap` | 时间范围内的 Events / Facts | Growth Recap |

所有 Node 输出必须通过 schema 校验。模型无法提供证据时，不得产生强结论。

### Action：唯一写入方式

Action 是系统允许执行的最小修改。AI 只能提出 Action，不能直接修改状态。

首批 Action：

```text
record_input
upsert_concept
set_knowledge_state
record_learning_event
```

`ActionExecutor` 是唯一写入入口。这样可以集中完成校验、证据检查、审计、事务和未来的数据持久化。

## Event / Fact 双真相

Knowledge Identity 同时保存“发生过什么”和“现在是什么”。

| 类型 | 回答的问题 | Knowledge Identity 中的实体 |
|---|---|---|
| Event | 发生过什么？ | Input、Learning Event、用户纠错 |
| Fact | 现在如何理解？ | Concept、Relation、Knowledge State |

例子：

```text
Event
2026-09-23：用户输入了对 RAG evaluation 的新理解

Fact
RAG evaluation：Learning
依据：input-123、input-168
当前 gap：还没有明确的 answer-quality evaluation signals
```

Event 保持不可变。Fact 可以随着新 Evidence 变化，但每次变化都必须能追溯到 Event 或 Input。

## 何时需要用户确认

让每次输入都确认会破坏记录体验，因此采用选择性确认。

### 自动提交

- 保存原始 Input
- 创建新 Concept，状态为 Aware
- 给现有 Concept 增加 Evidence
- 创建低风险 Learning Event
- 建立高置信且可撤销的 Relation

### 必须确认

- 把 Concept 提升为 Known
- 合并两个 Concepts
- 删除或覆盖现有 Relation
- AI 的解释存在多个合理版本
- 置信度低于设定阈值
- 修改会影响历史 Recap 或大量下游结果

确认不是异常，而是正常的纠错回路：

```text
pending Action → 用户确认 / 修改 / 拒绝 → 重新执行或丢弃
```

即使 Action 被拒绝，原始 Input 仍然保留。

## Chat 的上下文组装

Knowledge Identity Chat 不把全部历史塞给模型。每次回答只组装：

```text
当前问题
+ 当前主题最近几轮
+ 相关 Concept / Relation / Knowledge State
+ 相关 Learning Events
+ 原始 Evidence excerpts
```

回答必须区分：

- 用户明确表达过的内容
- 系统从多条 Evidence 推断出的模式
- 当前仍然缺少证据的 Knowledge Gap

## MVP 不实施的内容

- 不做 Alfred 的多领域四层路由；Knowledge Identity 当前只有一个核心领域。
- 不立即引入 LangGraph；先保持可理解、可测试的 Python Graph。
- 不建立通用 EAV 或 Personal OS 数据模型。
- 不让 LLM 自主循环调用任意工具。
- 不因为 AI 推断而删除用户原始内容。

## 分阶段实施

### Phase 1 · 可审计写入路径

- 建立 Graph / Node / Action 模块
- `ActionExecutor` 成为唯一写入入口
- 保存 workflow run 与 executed actions
- 确保 Concept、Relation、Learning Event 全部携带 Evidence

### Phase 2 · 选择性确认

- [x] 增加 pending Action 预览
- [x] 增加整次理解的接受 / 拒绝
- [x] 前端展示“AI 准备如何理解这条输入”
- [x] 支持修改 Concept 名称与 Knowledge State
- [x] 支持逐条接受或拒绝 Concept / Relation proposal
- [x] 拒绝 Concept 时自动拒绝依赖的 State、Relation 与下游引用

### Phase 3 · 真正的 AI extraction

- [x] 接入 OpenAI Responses API，并用 Pydantic schema 解析 Structured Output
- [x] 增加 Concept 去重与有证据的 Relation 判断
- [x] 建立 `mention / explanation / application / reflection` Knowledge State signals
- [x] 记录 provider、prompt/version、模型、response ID、耗时与 fallback 原因
- [x] 默认保持本地处理；只有显式开启环境变量时才向外部模型发送内容

### 极简 Capture 入口

首页只要求用户完成一个动作：把内容放进同一个输入框。用户不需要预先选择分类、文件夹或工作流。

- 文字、链接和问题直接输入；`Cmd/Ctrl + Enter` 快速提交。
- 浏览器支持时，语音按钮把讲话实时转写回同一个输入框。
- 附件支持选择和拖放；PDF/TXT/Markdown 由后端保存原件并提取文本，完成后才进入 extraction。
- PDF 页码或文本 section 会随 Evidence 保存；上传、提取失败和重试状态直接显示在输入框中。
- 输入类型根据内容自动判断，不向用户展示额外表单。
- AI 的结构化理解仍进入同一个 review panel，原始 Input 会先保留。

### Phase 4 · 持久化与检索

- [x] PostgreSQL 保存 Event / Fact / Evidence
- [x] pgvector embeddings + 关键词 / 语义 hybrid ranking
- [x] Chat context assembly
- [x] 周 / 月 / 年 Growth Recap

### Phase 5 · 复杂编排（满足条件时）

- 工作流可暂停恢复
- 长任务 checkpoint
- 多分支、并行或循环
- 达到上述需求后再评估 LangGraph

## 验收原则

一次 Capture 被认为正确，需要同时满足：

1. 原始 Input 被完整保留。
2. AI 输出通过 schema 校验。
3. 每个衍生结果都能找到 Evidence。
4. 所有状态修改都来自已执行 Action。
5. 高风险或低置信 Action 不会静默提交。
6. 用户纠错不会破坏历史 Event。

## 参考

- [Alfred 引擎规范](https://gavin-op.github.io/alfred-api/GRAPH/)
- [Alfred 捕获与分发工作流](https://gavin-op.github.io/alfred-api/UPLOAD_WORKFLOW/)
- [Alfred Event / Fact 双真相](https://gavin-op.github.io/alfred-api/adr/0010-event-fact-dual-truth/)
- [Alfred LangGraph 编排决策](https://gavin-op.github.io/alfred-api/adr/0012-orchestration-langgraph/)
- [Alfred 上下文分段](https://gavin-op.github.io/alfred-api/adr/0013-context-segments/)
