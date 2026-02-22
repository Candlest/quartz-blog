---
title: 博客 CHANGELOG
date: 2025-11-27
description: 孟母三迁？
tags:
  - 工具
  - DevOps
draft: false
permalink: /changelog
comments: true
---

# CHANGELOG

记录了博客的迁移记录。

#### 2026-02-22

参考朋友的[记录](https://timlin15.github.io/备忘录/使用quartz直接将obsidian库转为博客)，迁移到 Quartz。

高强度使用 ai coding agent 的我意识到，AI 亲和性好的东西才是未来。

我相信类似 obsidian-cli 的东西就是未来。
#### 2025-12-01

迁移到 Astro Paper，只需要加载速度就可以了。

最好还要美观一点，所以微调了一下字体。

#### 2025-09-26

发现了 fuwari 面对大文章的加载性能差问题 [#637](https://github.com/saicaca/fuwari/issues/637)。

但是我觉得与其去寻找一个地上天国的博客框架，不如给自己的记录需求分层。

| 类型（按文字量排序） | Note          | Blog          | Dairy                                |
| -------------------- | ------------- | ------------- | ------------------------------------ |
| 结构                 | 层状，图      | 线性，图      | 线性                                 |
| 举例                 | 课程笔记      | 解决了xx问题  | 今天很开心，打了 10 pc 舞萌          |
| 我的解决方案         | 迁移到 feishu | 继续用 fuwari | 用 tg channel，去<del>骚扰朋友</del> |

其中 Dairy 概念来源于 [swizzer](https://blog.swizzer.cc/diary/) 师傅.

至于特别长的 write-ups 我可能会附上 pdf ……

#### 2025-09-17

参照 [#37](https://github.com/saicaca/fuwari/pull/37) 和 [#405](https://github.com/saicaca/fuwari/pull/405) 两个 pull req. 完成了评论系统 giscus 的再搭建。

这种内容和 SSG 不分离的模式对我来说很新奇。

#### 2025-08-18

将博客从自己写的 [rigos](https://github.com/Candlest/rigos/) 迁移到基于 [Astro](https://astro.build/) 的 [fuwari](https://github.com/saicaca/fuwari)，并做出了一部分修改微调。

原因

1. Astro 在内存占用和加载速度上都优于 rigos，且更加灵活。
2. 睁眼看世界，看新的技术。
