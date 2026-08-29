# Misc 笔记

## 隐写

```bash
binwalk -e img.png     # 提取嵌入文件
zsteg img.png          # PNG LSB(需装 ruby)
exiftool img.jpg       # 元数据
```

## 编码速查

| 特征 | 可能是 |
| --- | --- |
| `flag{}` 里全字母偏移 | 凯撒 |
| 长串 Base64 后还有 = | 多层 Base |
| `\u` 开头 | Unicode 转义 |

## 待补

- [ ] 流量分析:Wireshark 常用过滤式
- [ ] 取证:volatility 基础