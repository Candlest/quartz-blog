---
title: 车联网安全：CAN 总线初探
date: 2025-08-14
description: 为什么 PWN 和 车联网能连起来。
tags:
  - 信息安全
  - linux
draft: false
permalink: /car-can
comments: true
---

# CAN 总线 & 信息安全

> 让我们来了解 CAN 总线吧！这是一种广泛用于工业界汽车、自动化领域的串行通信总线。

CAN 总线的全程是 Controller Area Network Bus，是用来解决汽车内部大量电子控制单元（ECU）之间通信的复杂布线问题。

## CAN 的特点

### 速度慢

速度 1 Mbit/s，比前任 K 线快，与日常使用的百兆或千兆以太网相比似乎看来很慢？

但是要注意到它的应用场景是工业自动化领域，CAN 总线不需要用来传输动辄上百 MB 的流媒体，只需要用来传输几个字节的传感器信息。

所以它的数据帧 payload 只有 8 bytes ……

不过，最新一代 CAN， CAN FD 将 payload 扩展到了 64 bytes，大大提高了传输效率到了 5 Mit/s 。

## 分布式

任何一个节点都可以当主机

![分布式](https://blog-asserts-1258307940.cos.ap-guangzhou.myqcloud.com/can1.png)

### 高实时性、高可靠性

CAN 总线采取一种非破坏性仲裁协议机制来解决多个节点同时发送数据的冲突（即设定消息的优先级），当多个节点同时开始发送时，他们会比较自己消息的标识符，标识符越小，优先级越高，优先级低的节点会自动停止发送，稍后再试。

比如刹车的优先级要高于开门。打开气囊的优先级应该是最高的。

### 低成本

因为它是多设备共用一根线，从仲裁协议可以知道。

简化了汽车的布线。

在制造业这样的重资产行业，这样一点微小的成本足以改变太多。

## Linux 中的 CAN 总线

Linux 用于工业控制的体现。

在 Linux 内核中，有一个子系统的名字叫作 [SocketCAN](https://docs.kernel.org/networking/can.html) ，把 CAN 设备实现为一种网络接口。我们可以使用 socket API 操作它。

### 虚拟 CAN

加载模块

```bash
sudo modprobe can
sudo modprobe can-raw
sudo modprobe vcan
```

创建设备

```bash
sudo ip link add dev vcan0 type vcan
```

安装 `can-utils`

```bash
paru -S can-utils
```

使用 `cansend` 和 `candump`

```
cansend vcan0 123#11223344
candump vcan0
```

### 针对 CAN 总线的攻击

### DoS攻击之优先级

假如能够以 Arbitration ID 030h 大量发送 CAN 消息，031h~7FFh 的消息都会被拒绝。

### DoS攻击之洪水攻击

在**没有网关ID过滤策略**时最有效，尽可能快地传输 CAN 帧，占用总线带宽，致使合法帧延迟，引发系统部分故障。

### 通过漏洞伪造仲裁ID

类比 ARP 攻击

CAN 无认证机制

太逆天了这个，就像是回到了蛮荒时代的互联网。

CAN 协议没有设置 ACK 的 ID，只要它收到**一个或多个**显性位，就认为报文被正确接收，而不是必须由特定ID的ECU来发送确认。

甚至无法做接收验证工作！

### 解决方案？

### 监视器

监控 CAN 总线状态，检测到攻击/从IVI发送的错误信息（不应该出现的信息）立刻进入紧急状态

### 加密、认证

针对 Candy cream-hacking

![Candy cream-hacking](https://blog-asserts-1258307940.cos.ap-guangzhou.myqcloud.com/can2.png)

#### 加密的方案

所有有发送 CAN 消息需求的程序在发送时都要加密（最好是动态的？每个仲裁ID、每个时间段不一样？），由 bpf 在 Traffic Control 层解密

不合法的消息发出告警并过滤，这是对模糊测试的防御，也能增加破解难度

#### 认证

验证发送者程序或者用户id，**不是合法的访问，直接过滤！**

## 总结

看了一些论文，最大的感悟是安卓漏洞怎么这么多？继承安卓生态大幅度降低开发成本的后果是继承了安卓的漏洞，论文里面利用安卓漏洞获取不该获取的信息，攻击IVI，如果能够获取 CAN 的访问权限，还可以用来攻击整车的电控，CAN协议怎么也没安全措施，真是烂完了。

```
============
  安卓漏洞
============
	|
	|
  a. 最小权限避免漏洞 Seccomp 限制系统调用 减少攻击面
  b. BPF-LSM 提供更细的粒度检查文件路径、套接字参数、甚至是用户 ID 和进程的 cgroup 等上下文信息
	|
	|
  tc BPF 对 CAN 进行保护
```
