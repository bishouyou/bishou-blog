# Reverse 笔记

## 静态分析

- IDA Free:看控制流、F5 伪代码
- Ghidra:免费全家桶
- 字符串窗口先翻一遍:`strings ./chall`

## 动态调试

- gdb + pwndbg / gdb-multiarch
- Windows: x64dbg

## 常见套路

1. 找输入点(`scanf` / `read` / GUI 输入框)
2. 定位校验函数,理解比较逻辑
3. 逆推或爆破(约束求解用 z3)

## 待补

- [ ] UPX 脱壳
- [ ] Python 逆向(uncompyle6)