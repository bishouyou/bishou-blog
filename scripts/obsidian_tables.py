# -*- coding: utf-8 -*-
"""
obsidian_tables: 抹平 Obsidian/Enveloppe 导出与 Python-Markdown 的表格/代码块差异。

背景
----
Enveloppe 从 Obsidian 导出的正文里,元素之间普遍夹着空行,包括:

    | 提示长度 | 生成 t/s | 显示 t/s |
                                  <- 空行
    |---|---|---|
                                  <- 空行
    | ~150 tok | ~46 | **29** |

CommonMark / Obsidian 能容忍表格行之间的空行,但 **Python-Markdown 不能**:
空行会终止表格块,导致表格断裂成一段段纯文本(整张表散架)。
同理,代码围栏紧跟/紧贴空行会在代码块里留下多余的空行。

策略(仅这两类,不做其它改动)
  1. 删除"上一行与下一行都是表格行"的空行 -> 表格恢复成标准写法;
  2. 删除代码围栏开口后的空行、收口前的空行 -> 代码块首尾不留空行。

代码块内容、正文段落、表格内容本身一概不动。缩进表格同样适用。
"""
import re

_FENCE = re.compile(r"^(\s*)(`{3,}|~{3,})")
_ROW = re.compile(r"^\s*\|.*\|\s*$")      # 形如 | a | b | 的表格行


def _normalize(md):
    lines = md.splitlines()
    out = []
    in_fence = None
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        f = _FENCE.match(line)
        if f:
            token = f.group(2)[0]
            if in_fence is None:
                in_fence = token
                out.append(line)
                i += 1
                # 丢弃开口围栏之后紧跟的空行
                while i < n and not lines[i].strip():
                    i += 1
                continue
            else:
                if token == in_fence:
                    # 丢弃收口围栏之前的空行(已被 out 收录的尾部空行)
                    while out and not out[-1].strip():
                        out.pop()
                    in_fence = None
                out.append(line)
                i += 1
                continue

        if in_fence is not None:
            out.append(line)
            i += 1
            continue

        # 表格行之间的空行:上一行(已输出)与下一非空行都是表格行 -> 丢弃
        if not line.strip():
            prev = next((x for x in reversed(out) if x.strip()), None)
            nxt = None
            j = i + 1
            while j < n and not lines[j].strip():
                j += 1
            if j < n:
                nxt = lines[j]
            if prev is not None and nxt is not None and _ROW.match(prev) and _ROW.match(nxt):
                i += 1
                continue

        out.append(line)
        i += 1

    return "\n".join(out)


def on_page_markdown(markdown, page, config, files):
    # 笔记与博客都来自 Obsidian/Enveloppe,规则一视同仁
    return _normalize(markdown)
