# Pwn 笔记

## 工具链

```bash
pip install pwntools
checksec ./pwn        # 查看保护机制
```

## 栈溢出最小模板

```python
from pwn import *

p = process("./pwn")
payload = b"A" * 0x28 + p64(0xdeadbeef)
p.sendline(payload)
p.interactive()
```

## 保护机制速查

| 机制 | 含义 | 常见绕过 |
| --- | --- | --- |
| NX | 栈不可执行 | ROP |
| Canary | 栈哨兵 | 泄露后拼接 |
| PIE | 地址随机化 | 泄露 libc 基址 |

## 待补

- [ ] ret2libc 全流程
- [ ] 堆基础:fastbin attack