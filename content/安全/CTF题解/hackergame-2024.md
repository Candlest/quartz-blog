---
title: Hackergame 2024 题解
date: '2024-11-09'
description: 第一次打CTF类型的game，是特别的感觉。
tags:
  - 安全
  - CTF
  - 题解
draft: false
permalink: /hkgame2024-wp
comments: true
---

# Hackergame 2024 题解

有幸能够参加 hackergame，需要感谢 MSC 的前辈们的指引。这是我第一次尝试 CTF 类型的比赛！

虽然我并没有做出多少题，但是还是玩得很开心。

> 当前分数：1700， 总排名：364 / 2460 ，中山大学组内排名：23 / 90
>
> AI：0 ， binary：0 ， general：750 ， math：550 ， web：400

## 题解

### 签到题

#### 法一：更改 url 参数

通过直接点击 `启动` 我们发现我们进入了 `http://202.38.93.141:12024/?pass=false`

所以我们不妨直接访问：http://202.38.93.141:12024/?pass=true，拿到 flag

> flag{welcOme-T0-hAcKER94M3-4nD-ENjOY-hACkinG-ZoZ4}

#### 法二：js 脚本

```js
// 定义输入框 ID 和对应的内容，其实，其实key直接读<input>的属性
const inputData = {
  zh: "启动",
  en: "Start",
  ja: "起動",
  ko: "시작",
  fr: "Démarrer",
  de: "Starten",
  es: "Iniciar",
  ru: "Запуск",
  it: "Avviare",
  eo: "Startigi",
  vi: "Khởi động",
  ak: "𒁺",
};

// 遍历输入框 ID 和内容，填充输入框
for (const [inputId, value] of Object.entries(inputData)) {
  const inputField = document.getElementById(inputId);
  if (inputField) {
    inputField.value = value;
  }
}
```

### 喜欢做签到的 CTFer 你们好呀

这是一道信息收集题，分解成三个部分：

- 找到 USTC CTF 战队招新的页面
- 找到第一个 flag（about）
- 找到第二个 flag（没写出来）

通过科大官网、ustclug 等站点，定位到 `https://www.nebuu.la/`

站点疑似在模仿一个 NixOS 的 terminal

输入 `env` 我们可以得到第一个 flag：

```bash
ctfer@ustc-nebula:$ ~ env
---
PWD=/root/Nebula-Homepage
ARCH=loong-arch
NAME=Nebula-Dedicated-High-Performance-Workstation
OS=NixOS❄️
FLAG=flag{actually_theres_another_flag_here_trY_to_f1nD_1t_y0urself___join_us_ustc_nebula}
REQUIREMENTS=1. you must come from USTC; 2. you must be interested in security!
```

#### 赛后

`ls -a` 可以发现 `.flag` 文件

更常规的思路：找网页 js 源码里面的 base64 字符串，然后解码

### 猫咪问答（Hackergame 十周年纪念版）

> 1.  在 Hackergame 2015 比赛开始前一天晚上开展的赛前讲座是在哪个教室举行的？（30 分）

通过搜索科大官网的新闻，发现是 `3A204`

> 2.  众所周知，Hackergame 共约 25 道题目。近五年（不含今年）举办的 Hackergame 中，题目数量最接近这个数字的那一届比赛里有多少人注册参加？（30 分）

往届的题解都公布在 [ustclug](https://github.com/ustclug) 或 [ustc-hackergame](https://github.com/ustc-hackergame) 的 repos 里，确定到题目~最少的一年~数量最接近 25 的是 2020 年。

从 [ustclug](https://blog.sustcra.com/p/ustc-hackergame-2020/) 站点得到人数数据为 2682。

> 3.  Hackergame 2018 让哪个热门检索词成为了科大图书馆当月热搜第一？（20 分）

查看 Hackergame 2018 题解和参加者的博客即可倒推：`程序员的自我修养`

> 4.  在今年的 USENIX Security 学术会议上中国科学技术大学发表了一篇关于电子邮件伪造攻击的论文，在论文中作者提出了 6 种攻击方法，并在多少个电子邮件服务提供商及客户端的组合上进行了实验？（10 分）

关键词：`USTC` `USENIX Security 2024` `email`

找到这样一篇论文：[FakeBehalf: Imperceptible Email Spoofing Attacks against the Delegation Mechanism in Email Systems](https://www.usenix.org/conference/usenixsecurity24/presentation/ma-jinrui)

通过阅读，知晓有 6 种组合。

> 5.  10 月 18 日 Greg Kroah-Hartman 向 Linux 邮件列表提交的一个 patch 把大量开发者从 MAINTAINERS 文件中移除。这个 patch 被合并进 Linux mainline 的 commit id 是多少？（5 分）

~也算是恰到最新的瓜了~

在 github 上面的 [linux 内核 git 记录](https://github.com/torvalds/linux/commit/6e90b675cf942e50c70e8394dfb5862975c3b3b2) 记载的 `commit id` 为 `6e90b67`，但是题目要求 6 位，我们取`6e90b6`。

> 6.  大语言模型会把输入分解为一个一个的 token 后继续计算，请问这个网页的 HTML 源代码会被 Meta 的 Llama 3 70B 模型的 tokenizer 分解为多少个 token？（5 分）

去申请 Llama 3 70B 被拒绝了（悲）

好在在百度网盘找到了文件。我们只需要用到 `tokenizer`，不需要把整个模型全部下下来！（说的就是你！`*.safetensors`）

代码如下：

```js
from transformers import LlamaTokenizer, PreTrainedTokenizerFast

# 本地文件路径
local_tokenizer_path = "./meta-llama"

tokenizer = PreTrainedTokenizerFast.from_pretrained(local_tokenizer_path, legacy=False)

# 从 source.html 文件中读取 HTML 代码
with open("source.html", "r", encoding="utf-8") as file:
    html_code = file.read()

# 使用 tokenizer 解析 HTML 代码
tokens = tokenizer.encode(html_code)
num_tokens = len(tokens)

print(f"HTML 代码被分解为 {num_tokens} 个 token。")
```

得到答案: `1833`

自此，顺利拿下两个 flag 。

> flag{A*9ØØd*©αt*is_tHE*©@t_ωh0_cαn_p4SS_7HE_QบI2}
>
> flag{TEn*Ye4R5*Øƒ_HΛ©KERg4m3_oM3DETOU_WItH_NeK0_qบIz}

### 打不开的盒

下载 `*.stl` 文件，找一个 3D 查看器即可。

第一次输入的时候，把 `0` 错认成 `O` 了。其他的倒是还好。

> flag{Dr4W_Us!nG_fR3E_C4D!!w0W}

### 每日论文太多了(赛后)

事实上只需要删除白色矩形就好了，学校买的福昕 PDF 就可以做到。

### 比大小王

紧跟小猿口算的时事。抓包当然是最快的。

通过分析网页源代码，发现早在打开网页的时候，100 组比大小的数据已经被请求并储存在变量里面了。

在 console 输入如下代码：

```js
// 确保 state.values 已经加载
if (state.values) {
  // 获取 state.values
  let stateValues = state.values;
  let inputs = [];

  // 遍历 state.values 并根据 value1 和 value2 的大小关系选择答案
  stateValues.forEach(valuePair => {
    let value1 = valuePair[0];
    let value2 = valuePair[1];

    if (value1 < value2) {
      inputs.push("<");
    } else {
      inputs.push(">");
    }
  });

  // 自动提交结果
  fetch("/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs }),
  })
    .then(response => response.json())
    .then(data => {
      console.log("提交结果:", data.message);
      document.getElementById("dialog").textContent = data.message;
      document.getElementById("dialog").style.display = "flex";
    });
}
```

得到 flag 。

> flag{I-4m-TH3-h@Ck3R-K1NG-OF-C0MP@R!ng-Num63rs-ZOZ4}

### 旅行照片 4.0

> 问题 1: 照片拍摄的位置距离中科大的哪个校门更近？（格式：X 校区 Y 门，均为一个汉字）

查阅百度地图，“科里科气科创驿站” 离`东校区西门`最近。

> 问题 2: 话说 Leo 酱上次出现在桁架上是…… 科大今年的 ACG 音乐会？活动日期我没记错的话是？（格式：YYYYMMDD）

查阅 Bilibili，锁定日期 `20240519`

> 问题 3: 这个公园的名称是什么？（不需要填写公园所在市区等信息）

大概在合肥，穷举法得：`中央森林公园`

> 问题 4: 这个景观所在的景点的名字是？（三个汉字）

谷歌 lens 得到：`坛子岭`

题目 5~6 不会

~怎么出题人是铁道吃啊~

> flag{5UB5CR1B3_T0_L30_CH4N_0N_B1L1B1L1_PLZ_acd7ac6e30}
>
> flag{D3T41LS_M4TT3R_1F_R3V3RS3_S34RCH_1S_1MP0SS1BL3_d2c74f7b34}

### 不宽的宽字符（赛后）

比赛的时候 docker 被我玩坏了，不过就算没有玩坏这道题我大概率也做不出来（）

### PowerfulShell（赛后）

思路是通过 ~ 拼接字符

没做出来，但是得到一个比较有用的工具 [BashFuck](https://probiusofficial.github.io/bashFuck/)

同时得知这是 CTF 里面典型的 jail 问题

### PaoluGPT

第一问暴力穷举：

```js
(async function () {
  // 获取当前页面的基础 URL
  const baseUrl = window.location.origin;

  // 获取所有文章链接
  const articleLinks = [];
  document.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.includes("/view")) {
      // 将相对链接转换为绝对链接
      const absoluteUrl = new URL(href, baseUrl).href;
      articleLinks.push(absoluteUrl);
    }
  });

  // 只取前999个链接
  const limitedArticleLinks = articleLinks.slice(0, 999);

  // 遍历每个文章链接并查找"flag"
  let flag = null; // 用于存储找到的flag
  for (const link of limitedArticleLinks) {
    try {
      const response = await fetch(link);
      const html = await response.text();
      if (html.includes("flag")) {
        console.log(`Found 'flag' in article: ${link}`);
        flag = html.match(/flag\{.*?\}/)[0]; // 假设flag的格式是flag{...}
        break; // 如果找到"flag"，可以停止进一步的搜索
      } else {
        console.log("next\n");
      }
      await new Promise(resolve => setTimeout(resolve, 10)); // 延迟0.01秒
    } catch (error) {
      console.error(`Error fetching ${link}:`, error);
    }
  }

  // 输出找到的flag
  if (flag) {
    console.log(`Flag found: ${flag}`);
  } else {
    console.log("No flag found.");
  }
})();
```

> flag{zU1_xiA0_de_11m_Pa0lule!!!\_0dfe5b2d41}

#### 赛后

第二问需要用 sql 注入的方式

### 惜字如金 3.0

在 llm 的帮助下完成 de-xzrj 的操作，并通过下面的脚本填充至 80 字符：

```py
def pad_to_80_chars(line):
    """填充一行代码到 80 个字符"""
    return line.ljust(80)

def process_file(input_file, output_file):
    """处理文件，逐行填充到 80 个字符"""
    with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
        for line in infile:
            padded_line = pad_to_80_chars(line.rstrip())
            outfile.write(padded_line + '\n')

if __name__ == "__main__":
    input_file = "de-xzrj.py"  # 还原后的代码文件
    output_file = "de-xzrj-80.py"   # 填充后的代码文件
    process_file(input_file, output_file)
```

> flag{C0mpl3ted-Th3-Pyth0n-C0de-N0w}

第二问第七行始终不过：

```
poly, poly_degree = 'B', 48
```

以及

```
poly, poly_degree = 'BbbbbbBbbbBBbbbbBBBBbbbBBBbBbBBBBbBBBbbBbbBbbBbbB', 48
```

似乎都不行

### 优雅的不等式

通过 Geogebra 完成第一问的构造，大抵分为两步：

设 f(x)=1+x24​

- 找到 [0,1] 上为 8/3 的多项式定积分 g(x)
- 假如它是一次的，找出能够使 f(x)−g(x) 在 [0,1] 非负的系数

得到 g(x)=ax+b,−38​≤a≤−94​,b=38​−2a​

不妨选择：a=−58​ 的情况 `4/(1+x**2) - (-(8/5)*x + 52/15)`

解得 difficulty = 1 的情况

> flag{y0u_ar3_g0od_at_constructi0n_259fc06be3}

### 不太分布式的软总线

第一问只需要 `dbus-send` :

```bash
#!/bin/bash

# 使用 dbus-send 调用 GetFlag1 方法
response=$(dbus-send --system --dest=cn.edu.ustc.lug.hack.FlagService \
                     --type=method_call --print-reply \
                     /cn/edu/ustc/lug/hack/FlagService \
                     cn.edu.ustc.lug.hack.FlagService.GetFlag1 \
                     string:"Please give me flag1")

# 提取返回的 flag1
flag1=$(echo "$response" | grep -oP '(?<=string ")[^"]+')

echo "Flag1: $flag1"
```

> flag{every_11nuxdeskT0pU5er_uSeDBUS_bUtn0NeknOwh0w_0833b13a4e}

### 零知识数独

第一问只要会求解数独即可。~直接上数独求解器~

第二问只要能读懂电路即可，构造一个类似的 `input.json`:

```js
{
  "unsolved_grid": [
    [7, 0, 0, 0, 0, 0, 6, 0, 0],
    [0, 0, 0, 0, 0, 9, 0, 1, 0],
    [0, 8, 0, 7, 0, 2, 0, 0, 0],
    [3, 2, 0, 0, 0, 0, 4, 0, 0],
    [0, 5, 0, 0, 0, 0, 0, 0, 1],
    [0, 7, 0, 6, 9, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 8, 9, 0, 0],
    [5, 0, 1, 0, 0, 0, 0, 8, 0],
    [0, 0, 0, 2, 0, 0, 0, 6, 0]
  ],
  "solved_grid": [
    [7, 1, 3, 8, 4, 5, 6, 2, 9],
    [2, 4, 5, 3, 6, 9, 7, 1, 8],
    [9, 8, 6, 7, 1, 2, 5, 4, 3],
    [3, 2, 9, 5, 8, 1, 4, 7, 6],
    [6, 5, 8, 4, 2, 7, 3, 9, 1],
    [1, 7, 4, 6, 9, 3, 8, 5, 2],
    [4, 6, 2, 1, 5, 8, 9, 3, 7],
    [5, 3, 1, 9, 7, 6, 2, 8, 4],
    [8, 9, 7, 2, 3, 4, 1, 6, 5]
  ]
}
```

证明，并上传 `proof.json`：

```bash
snarkjs groth16 fullprove input.json sudoku.wasm sudoku.zkey proof.json public.json
snarkjs groth16 verify verification_key.json public.json proof.json
```

得到 flag ：

> flag{you_are_a_5udoku_expert_and_pr0ved_your_kn0wledge_42ffd2ccfb}
