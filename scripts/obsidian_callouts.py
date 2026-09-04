# -*- coding: utf-8 -*-
"""
obsidian_callouts: 把 Obsidian 的 Callout 语法转成 Material 的 admonition。

Obsidian 写法:
    > [!NOTE] 标题
    > 内容

Material 写法:
    !!! note "标题"
        内容

支持:
  - 嵌套 callout (> > [!TYPE])
  - 类型映射 NOTE/TIP/INFO/WARNING/DANGER/QUESTION/EXAMPLE/BUG/FAILURE/SUCCESS/HINT
  - 折叠/切换后缀 [-] [=] 会被忽略(按展开渲染)
  - 代码块(```)内的内容跳过,不误转

调用时机:on_page_markdown(markdown 字符串阶段,渲染前)。
"""
import re

TYPE_MAP = {
    "NOTE": "note", "TIP": "tip", "INFO": "info", "WARNING": "warning",
    "DANGER": "danger", "QUESTION": "question", "EXAMPLE": "example",
    "BUG": "bug", "FAILURE": "failure", "SUCCESS": "success", "HINT": "tip",
    "CAUTION": "danger", "QUOTE": "quote", "CUSTOM-TITLE": "note",
}

_HDR = re.compile(r'^((?:>\s*)+)(\s*)\[!([A-Z][\w-]*)\]([-=])?\s?(.*)$')
_CONT = re.compile(r'^((?:>\s*)+)\s?(.*)$')
_FENCE = re.compile(r'^\s*`(\S+)?`{2,}')


def _convert(md):
    lines = md.split("\n")
    out = []
    i = 0
    n = len(lines)
    in_fence = False
    while i < n:
        line = lines[i]
        # 代码块边界:进/出
        if _FENCE.match(line):
            in_fence = not in_fence
            out.append(line)
            i += 1
            continue
        # 代码块内原样输出
        if in_fence:
            out.append(line)
            i += 1
            continue
        m = _HDR.match(line)
        if not m:
            out.append(line)
            i += 1
            continue
        chevrons = m.group(1)
        depth = chevrons.count(">")
        raw_type = m.group(3).upper()
        title = m.group(5).strip()
        mtype = TYPE_MAP.get(raw_type, "note")
        indent = "    " * (depth - 1)
        hdr = indent + "!!! " + mtype
        if title:
            hdr += ' "' + title.replace('"', '\\"') + '"'
        out.append(hdr)
        i += 1
        while i < n:
            l = lines[i]
            if _FENCE.match(l):
                # callout 内遇代码块,直接结束本块处理
                break
            nm = _HDR.match(l)
            if nm and nm.group(1).count(">") >= depth:
                break
            cm = _CONT.match(l)
            if cm and cm.group(1).count(">") == depth:
                out.append("    " * depth + cm.group(2))
                i += 1
            else:
                break
        out.append("")
    return "\n".join(out)


def on_page_markdown(md, page, config, files):
    return _convert(md)
