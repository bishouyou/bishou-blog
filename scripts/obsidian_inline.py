# -*- coding: utf-8 -*-
"""
obsidian_inline: 把 Obsidian 的行内语法转成 HTML,行为与 Obsidian 对齐
(前后紧贴文字也能渲染;pymdownx.tilde/mark 在贴字边界会失效,故用 hook 处理)。

处理:
  ~~删除线~~  -> <del>删除线</del>
  ==高亮==    -> <mark>高亮</mark>
  %%注释%%    -> <!-- 注释 -->(页面上不显示,同 Obsidian 阅读视图)

保护:
  - 代码块(```)内的内容原样跳过
  - 行内代码内(`...`)的内容原样跳过

调用时机:on_page_markdown(markdown 字符串阶段,渲染前)。
"""
import re

_DEL = re.compile(r"~~([^~\n]+?)~~")
_MARK = re.compile(r"==([^=\n]+?)==")
_NOTE = re.compile(r"%%([^%\n]+?)%%")
_FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
_INLINE = re.compile(r"`[^`\n]+`")


def _convert_line(line):
    # 行内代码保护:先 stash,转换后再还原
    spans = []

    def _stash(m):
        spans.append(m.group(0))
        return "\x00%d\x00" % (len(spans) - 1)

    line = _INLINE.sub(_stash, line)
    line = _DEL.sub(r"<del>\1</del>", line)
    line = _MARK.sub(r"<mark>\1</mark>", line)
    line = _NOTE.sub(lambda m: "<!-- " + m.group(1) + " -->", line)
    for i, sp in enumerate(spans):
        line = line.replace("\x00%d\x00" % i, sp)
    return line


def on_page_markdown(md, page, config, files):
    lines = md.split("\n")
    out = []
    in_fence = False
    for line in lines:
        if _FENCE.match(line):
            in_fence = not in_fence
            out.append(line)
            continue
        out.append(line if in_fence else _convert_line(line))
    return "\n".join(out)
