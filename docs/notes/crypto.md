# Crypto 笔记

## 古典密码

凯撒、维吉尼亚、栅栏……特征是**密文可读性差但统计特征保留**,工具:[CTFrypto](https://github.com/)、quipqiup。

## RSA 骨架

```python
from sympy import mod_inverse

# n = p * q, e = 65537
d = mod_inverse(e, (p - 1) * (q - 1))
m = pow(c, d, n)
```

常见考点:e 过小、共模攻击、n 可分解(factor.db / yafu)。

## 待补

- [ ] AES 的 ECB/CBC 模式差异
- [ ] 格密码入门(LLL)