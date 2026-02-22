---
title: Linux 的未来
date: 2026-02-22
description:
tags:
  - DevOps
  - linux
draft: false
permalink: /linux-feature
comments: true
---

从 2018 开始玩 Linux 也有了 7 年，下面是一些个人的看法.

目前我认知里的 Linux 发行版分为四类：

- deb系：最有开源基因，也是很多面向 Linux 的软件默认适配的环境. 国产信创社区的主流环境.
- redhat系：服务器大厂红帽撑腰的、面向企业的、有充足资金支持的. 国内也有 OpenEuler 等作为衍生.
- arch系：滚动发行版的代表，孩子最多的发行版.
- nixos系：不可变发行版的代表.
- 其他：alpine, gentoo

目前我的想法是：

- 系统基座将会是不可变的：nix, fedora ostree
- 系统上层的应用生态应该是被统一的：flatpak, appimage
- 系统更新应该是滚动的：arch, opensuse tumbleweed
- 软件构建/服务运行环境应该是更加容器化、虚拟化、轻量化的：docker, apline

目前我的做法：

1. 逐步脱离 arch linux，去到社区主流的 deb 系.
2. 支持虚拟化，容器化，积极使用 docker, uv, flatpak 这类工具