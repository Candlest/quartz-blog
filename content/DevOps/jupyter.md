---
title: 逐渐爱上 Jupyter
date: '2025-12-07'
description: 质疑，理解，成为。
tags:
  - 工具
  - Jupyter
  - 工作流
draft: true
permalink: /jupyter
comments: true
---

## Table of contents

曾经的我很抵触把代码放在 Jupyter 这种 REPL (Read-Eval-Print loop) 环境下运行，认为这不够酷。

但是当我们面对的是这样一个代码结构呢？

```python
# init
resA = initA()
print(resA)

# do some calculate
resB = cal(resA)
print(resB)

# maybe more intermediate steps
# ...

# final print
print(res_final)
```

然而如果我们要调试这样一个脚本，我们每次

## 参考

- [Interactive Rust with jupyter](https://ratulmaharaj.com/posts/interactive-rust-with-jupyter-notebooks/)
