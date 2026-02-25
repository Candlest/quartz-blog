---
title: 程序设计I
date: 2026-02-21
description: 最基础的一集
tags:
  - 学习
  - 课程笔记
  - 程序设计
draft: false
permalink: /course-C-2025
comments: true
---
## 笔记

参考课程 PPT，考察基础语法。

### 一些偷鸡的方法

#### 字符串处理

使用 `strtok()` 分词：

> [!tip]
> 这个方法还是蛮好用的，在 24 智工 C 语言和 25 网安 C 语言期末考试都可以使用。

```C
token = strtok(sentence, " ");
while (token != NULL) {
	// 处理逻辑
	token = strtok(NULL, " ");
}
```

#### 常见算法

使用 `qsort()` 排序：

> [!warning]
> 这个函数经常被反制，比如让你输出某一种排序的某一个中间状态。

```C
int cmp(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return x - y;   // 升序
}

int main() {
    int arr[] = {5, 2, 8, 1, 9};
    qsort(arr, sizeof(arr) / sizeof(arr[0], sizeof(int), cmp);
    return 0;
}
```
### 一些没考但是讲过，我觉得很好玩的算法

全排列算法：`next_permutation`

```C
int next_permutation(int a[], int n) {  
	if (n <= 1) return 0;  
	// 1) 从右往左找第一个 a[i] < a[i+1] 的位置 i（pivot）  
	int i = n - 2;  
	while (i >= 0 && a[i] >= a[i + 1]) i--;  
	  // 若没找到，说明是最后一个排列（整体非递增）  
	if (i < 0) {  
		reverse(a, 0, n - 1);  // 回到最小排列  
		return false;  
	}   
	// 从右往左找第一个 a[j] > a[i] 的位置 j（右侧最小的大于 pivot 的数）  
	int j = n - 1;  
	while (a[j] <= a[i]) j--;  
	// 交换 pivot 和 a[j]
	swap(&a[i], &a[j]);  
	// 4) 反转 i+1..n-1 后缀（变成最小的升序后缀）  
	reverse(a, i + 1, n - 1);  
	return true;  
}
```


## 真题

### 理论

忘光了，记得有个写错了的是数组指针指针数组。

可以看看这个视频：[顺时针螺旋移动法｜彻底弄懂复杂C/C++嵌套声明 const常量声明](https://www.bilibili.com/video/BV1jKhYzjEgE)

![[Pasted image 20260223173854.png]]
### 实验

#### 模板题
  1.   链表翻转
#### 代码题
  1.   矩阵乘法
  2.   冒泡排序前K步
  3.   循环数组
  4.   计算当月天数
  5.   汉诺塔的前K步
  6.   带通配符的括号匹配
  7.   区间内的回文素数
  8.   最长最短单词

> [!NOTE]
> 提前一个半小时出考场，感恩题量和弱样例。

