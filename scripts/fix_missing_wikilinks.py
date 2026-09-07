#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_missing_wikilinks: 构建前预处理。

把指向"不存在笔记"的 Obsidian [[...]] 内部链接转成纯文本,避免 roamlinks 报
"unable to find" 警告导致 mkdocs build --strict 失败。已存在的 [[...]] 保留
(交给 roamlinks 正常转成 markdown 链接)。代码块与行内代码里的 [[...]] 不受
影响(不会误转文档里的语法示例)。

用法: python scripts/fix_missing_wikilinks.py
"""
import os
import re

DOCS = "docs"
LINK = re.compile(r"\[\[([^\[\]]+)\]\]")
bt = chr(96)
FENCE = re.compile(r"^\s*(" + bt + "{3,}|~{3,})")
INLINE_CODE = re.compile(bt + "[^" + bt + r"\n]+" + bt)


def _find(target):
    t = target.strip().lstrip("./")
    if "#" in t:
        t = t.split("#")[0]
    if t in ("", "."):
        return True
    if os.path.isfile(os.path.join(DOCS, t + ".md")):
        return True
    if os.path.isfile(os.path.join(DOCS, t, "index.md")):
        return True
    base = os.path.basename(t)
    if base:
        for _r, _d, files in os.walk(DOCS):
            if (base + ".md") in files:
                return True
    return False


def _fix(m):
    raw = m.group(1)
    if "|" in raw:
        tgt, alias = raw.split("|", 1)
    else:
        tgt, alias = raw, ""
    tgt = tgt.strip()
    alias = alias.strip()
    if _find(tgt):
        return m.group(0)
    return alias if alias else tgt


def process_line(line):
    """行内代码保护:stash 成占位符 -> 转链接 -> 恢复。"""
    spans = []

    def _stash(m):
        spans.append(m.group(0))
        return "%%SPAN%d%%" % (len(spans) - 1)

    line = INLINE_CODE.sub(_stash, line)
    line = LINK.sub(_fix, line)
    for i, sp in enumerate(spans):
        line = line.replace("%%SPAN%d%%" % i, sp)
    return line


def process_text(text):
    out = []
    in_fence = False
    for line in text.splitlines(True):
        if FENCE.match(line):
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence:
            out.append(line)
            continue
        out.append(process_line(line))
    return "".join(out)


def main():
    n_files = 0
    n_links = 0
    for root, _dirs, files in os.walk(DOCS):
        for f in files:
            if not f.endswith(".md"):
                continue
            path = os.path.join(root, f)
            s = open(path, encoding="utf-8").read()
            new = process_text(s)
            if new != s:
                n_files += 1
                n_links += s.count("[[") - new.count("[[")
                open(path, "w", encoding="utf-8").write(new)
    print("fix_missing_wikilinks: 修改 %d 个文件, 兜底 %d 处缺失链接" % (n_files, n_links))


if __name__ == "__main__":
    main()
