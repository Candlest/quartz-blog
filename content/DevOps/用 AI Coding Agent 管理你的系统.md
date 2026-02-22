---
title: 用 AI Coding Agent 管理你的系统
date: 2025-11-27
description: 从繁琐的 Dirty work 中解放
tags:
  - DevOps
  - AI
  - Agent
draft: false
permalink: /changelog
comments: true
---
这正是我在做的。**一个系统能被命令行操作的越多，就越适合交给 AI 管理。** 

也就是说，AI 亲和度：

$$
\text{Windows} \leq \text{MacOS} \leq \text{Linux}
$$

一月爆火的 OpenClaw 也证明了我的观点：一个操作系统是可以被 AI 所管理的。一切复杂的软件和硬件的接口，最后都能被一个自然语言接口统一管理。

## 使用 OpenCode/Pi Agent 管理你的系统

在 `AGENT.md` 中写好约束条件，遇到问题从 runbook 里面找，如果没有解决方案的话，在解决问题后就把解决方法沉淀在 runbook 里面。

比如：

```markdown
# OpenCode 全局配置

## 语言

请使用中文回答用户的问题。

## 依赖管理

- **mise**: 管理 Node.js、Python 等运行时版本

- **pnpm**: 管理 JavaScript/TypeScript 依赖

- **uv**: 管理 Python 依赖和虚拟环境

- **micromamba**: 管理 Conda 环境

## 重要提示

- **禁止**使用系统自带的 Python 环境和 pip3，所有 Python 依赖必须通过 uv 管理

## 本机维护手册（Runbook）

- 路径：`~/Documents/mac-agent-system-runbook`

- 用途：把常见系统维护/工具链配置的“脏活”流程沉淀成可检索文档；处理相关问题时优先查阅并按文档执行/更新

## Subagent 调用

可以调用 subagent 分步进行复杂的、可能产生大量输出，占用大量上下文的任务。
```

这是我的实践：[mac-agent-system-runbook](https://github.com/Candlest/mac-agent-system-runbook) 一个Agent 维护，供 Agent 使用的 macOS 系统维护/工具链配置可检索手册库。它在我的 MacOS 上工作得很好。

未来的方向：

1. LRU
2. 高效共享解决方案