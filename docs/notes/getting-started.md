# 入门指南

## CTF 是什么

CTF(Capture The Flag,夺旗赛)是网络安全技术人员之间的竞技比赛:选手从题目环境中找到隐藏的「flag」(通常形如 `flag{...}`)并提交得分。

## 常见方向

- **Web**:SQL 注入、XSS、文件上传等 Web 安全
- **Pwn**:二进制漏洞利用
- **Reverse**:逆向工程
- **Crypto**:密码学
- **Misc**:杂项,隐写、取证、社工等

## 环境清单

| 用途 | 推荐 |
| --- | --- |
| 虚拟机 | VMware / VirtualBox + Ubuntu |
| 逆向 | IDA Free、Ghidra |
| 调试 | pwndbg + GDB |
| Python 库 | pwntools、sympy、pycryptodome |

## 去哪练

- 刷题平台: NSSCTF、BUUCTF、picoCTF(新手友好)
- 赛事日历:本站 [赛事日程](../events.md)(自动同步 CTFtime)

> 深入学习推荐阅读 [Hello-CTF](https://hello-ctf.com/) 的系统教程。