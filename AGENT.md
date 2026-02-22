# AGENT.md

## 1. 项目定位

- 本仓库是一个基于 **Quartz v4** 的个人博客站点，内容源在 `content/`，构建产物在 `public/`。
- 站点主配置：
  - `/Users/candlest/Documents/pub/quartz-blog/quartz.config.ts`
  - `/Users/candlest/Documents/pub/quartz-blog/quartz.layout.ts`
- 主题语言为 `zh-CN`，站点域名配置为 `blog.candlest.cc`。

## 2. 技术栈与环境

- Node.js `>=22`
- pnpm `>=10`
- TypeScript + Preact（Quartz 内核）

安装依赖：

```bash
pnpm install
```

## 3. 常用命令

- 本地预览（推荐）：

```bash
pnpm quartz build --serve --watch
```

- 同步外部 notes 仓库并预览：

```bash
pnpm dev:notes
# 或指定来源目录
bash ./scripts/dev-sync-preview.sh ../notes-content
```

- 代码检查：

```bash
pnpm check
```

- 测试：

```bash
pnpm test
```

- 格式化：

```bash
pnpm format
```

## 4. 目录与职责

- `/Users/candlest/Documents/pub/quartz-blog/content`：博客正文与页面（核心内容源）。
- `/Users/candlest/Documents/pub/quartz-blog/quartz`：Quartz 框架源码、组件与插件。
- `/Users/candlest/Documents/pub/quartz-blog/scripts`：内容迁移与标签整理脚本。
- `/Users/candlest/Documents/pub/quartz-blog/public`：构建输出目录（自动生成，不手改）。
- `/Users/candlest/Documents/pub/quartz-blog/.github/workflows/deploy.yml`：`main` 分支发布到 GitHub Pages。

## 5. 内容编辑规范（必须遵守）

### 5.1 Frontmatter 约定

Markdown 页面建议至少包含：

```yaml
---
title: 标题
date: YYYY-MM-DD # 列表页可选，文章建议有
description: 简介
tags:
  - 主标签
  - 次标签
  - 体裁/用途
draft: false
permalink: /stable-slug
comments: true
---
```

说明：

- `permalink` 用于稳定链接，已发布页面不要随意变更。
- `comments` 在本仓库显式使用；`about`、`friends` 这类页面常设为 `false`。
- 首页 `content/index.md` 保持 `tags: []`。

### 5.2 标签策略

- 现有脚本约定标签 **最多 3 个**，并按「主标签 -> 内容域 -> 体裁/用途」排序。
- 参考脚本：
  - `/Users/candlest/Documents/pub/quartz-blog/scripts/rebalance-tags-3.mjs`
  - `/Users/candlest/Documents/pub/quartz-blog/scripts/limit-tags.mjs`

### 5.3 资源路径

- 文章内图片优先放在 `content/assets/` 下。
- 历史迁移中已将部分路径重写为 `../assets/...`（见 `scripts/migrate-frontmatter.mjs`）；新增内容保持相对路径可解析。

## 6. 配置修改注意事项

- 站点功能、插件、分析统计在 `quartz.config.ts`。
- 页面布局组件在 `quartz.layout.ts`。
- 修改 Quartz 组件或插件时，优先小步变更并本地运行预览验证。

## 7. 自动化与发布

- 发布触发条件：`main` 分支 push，且改动命中 `content/**`、`quartz/**`、配置或工作流文件。
- CI 使用 pnpm + Node 22，构建命令为 `pnpm quartz build`。

## 8. Agent 工作清单

每次改动建议按以下顺序执行：

1. 明确改动范围（内容、样式、布局、插件、脚本）。
2. 完成编辑后运行：
   - `pnpm check`
   - 必要时 `pnpm test`
3. 若涉及页面效果，运行本地预览并手动检查关键页面：
   - 首页 `/`
   - 文章页（含目录、评论、反链）
   - 标签/目录页
4. 避免提交自动生成目录（如 `public/`）中的无关噪声改动。

## 9. 不建议做的事

- 不要手工改 `public/` 产物文件。
- 不要在未确认影响范围前批量改 `permalink`、`tags`、`date`。
- 不要移除已有 frontmatter 字段（尤其 `permalink` 与 `comments`）后直接提交。
