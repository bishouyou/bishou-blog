#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_missing_wikilinks: 构建前预处理。

把指向"不存在笔记"的 Obsidian [[...]] 内部链接转成纯文本,
避免 roamlinks 报 "unable to find" 警告导致 mkdocs build --strict 失败。

已存在的 [[...]] 保留(交给 roamlinks 正常转成 markdown 链接)。

用法(构建前运行):
    python scripts/fix_missing_wikilinks.py

注意:会原地修改 docs/**/*.md(CI 工作树里跑,不影响 GitHub 上的源文件)。
"""
import os
import re
import sys

DOCS = "docs"
LINK = re.compile(r"\[\[([^\[\]]+)\]\]")


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


def main():
    fixed_files = 0
    fixed_links = 0
    for root, _dirs, files in os.walk(DOCS):
        for f in files:
            if not f.endswith(".md"):
                continue
            path = os.path.join(root, f)
            s = open(path, encoding="utf-8").read()
            new = LINK.sub(_fix, s)
            if new != s:
                fixed_links += 1
                open(path, "w", encoding="utf-8").write(new)
                fixed_files += 1
    print("fix_missing_wikilinks: 处理 %d 个文件, 转换 %d 处缺失链接" % (fixed_files, fixed_links))


if __name__ == "__main__":
    main()
