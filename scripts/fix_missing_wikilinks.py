#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_missing_wikilinks: 构建前预处理。

把指向"不存在笔记"的 [[...]] 内部链接转成纯文本,避免 roamlinks 报
"unable to find" 警告导致 mkdocs build --strict 失败。

注意:roamlinks 对原始 markdown 做 re.sub,连代码块里的 [[...]] 也会匹配。
所以这里把任何指向不存在笔记的 [[...]] 都转成纯文本(代码块也不例外)。
要展示 [[...]] 语法请用 HTML 实体(如 &#91;&#91;笔记&#93;&#93;),它不会被
roamlinks 或本脚本匹配。

用法: python scripts/fix_missing_wikilinks.py
"""
import os
import re

DOCS = "docs"
LINK = re.compile(r"\[\[([^\[\]]+)\]\]")


def _find(target):
    t = target.strip().lstrip("./")
    if "#" in t:
        t = t.split("#")[0]
    if t in ("", "."):
        return True
    # 先按原始写法找:图片/附件等非 md 资产也在这里,别误当缺失链接吃掉
    if os.path.isfile(os.path.join(DOCS, t)):
        return True
    if os.path.isfile(os.path.join(DOCS, t + ".md")):
        return True
    if os.path.isfile(os.path.join(DOCS, t, "index.md")):
        return True
    base = os.path.basename(t)
    if base:
        for _r, _d, files in os.walk(DOCS):
            # 任意文件(含图片/附件)都算找到;不带扩展名时按 .md 找
            if base in files or (base + ".md") in files:
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
    n_files = 0
    n_links = 0
    for root, _dirs, files in os.walk(DOCS):
        for f in files:
            if not f.endswith(".md"):
                continue
            path = os.path.join(root, f)
            s = open(path, encoding="utf-8").read()
            new = LINK.sub(_fix, s)
            if new != s:
                n_files += 1
                n_links += s.count("[[") - new.count("[[")
                open(path, "w", encoding="utf-8").write(new)
    print("fix_missing_wikilinks: 修改 %d 个文件, 兜底 %d 处缺失链接" % (n_files, n_links))


if __name__ == "__main__":
    main()
