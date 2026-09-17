# -*- coding: utf-8 -*-
"""
obsidian_title: 让"文章标题"稳定出现在正文顶部(渲染层全局修复)。

背景
----
Material 的 partials/content.html 只在整页内容里**完全没有** <h1> 时,
才用 frontmatter 的 title 兜底注入一个标题:

    {% if "<h1" not in page.content %}<h1>{{ page.title }}</h1>{% endif %}

于是在 Obsidian 里写的笔记会遇到两种翻车:
  1. 正文任何位置出现过 `# 小标题`(哪怕在文章中部)
     -> 兜底不触发, 页面顶部没有标题, 且那个中途的 `#` 会霸占页面 h1 和右侧目录首项;
  2. 完全没用 `#` 的笔记 -> 标题是模板注入的, 没有 id/锚点, 也不进目录。

策略
----
只要 frontmatter 里有 title 且正文首个内容块不是一级标题, 就:
  - 在正文最前面补一行 `# {title}`
  - 把正文里已有的一级标题降级为二级(保证全页只有文章标题一个 h1, 目录层级正确)

已以一级标题开头的文章、没有 title 的文章、以及 blog/ 下的文章(标题由 blog 插件渲染)一律不动。
代码块(``` / ~~~)与 frontmatter 内的内容不受影响。
"""
import re

_FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
_H1 = re.compile(r"^(\s*)#\s+(.*)$")


def _split(md):
    """把 markdown 切成 (frontmatter, body)。frontmatter 原样保留。"""
    if md.startswith("---"):
        end = md.find("\n---", 3)
        if end != -1:
            nl = md.find("\n", end + 1)
            fm = md[: nl + 1] if nl != -1 else md
            return fm, md[len(fm) :]
    return "", md


def _first_content_line(body):
    """返回正文第一个非空行(跳过代码块内), 没有则 None。"""
    in_fence = None
    for line in body.splitlines():
        f = _FENCE.match(line)
        if f:
            token = f.group(1)[0]
            if in_fence is None:
                in_fence = token
            elif in_fence == token:
                in_fence = None
            continue
        if in_fence is not None:
            continue
        if line.strip():
            return line
    return None


def _demote_h1(body):
    """把代码块外的一级标题降为二级。"""
    out, in_fence = [], None
    for line in body.splitlines(True):
        f = _FENCE.match(line)
        if f:
            token = f.group(1)[0]
            if in_fence is None:
                in_fence = token
            elif in_fence == token:
                in_fence = None
            out.append(line)
            continue
        if in_fence is None:
            m = _H1.match(line.rstrip("\n"))
            if m:
                line = m.group(1) + "## " + m.group(2) + "\n"
        out.append(line)
    return "".join(out)


def on_page_markdown(markdown, page, config, files):
    src = getattr(getattr(page, "file", None), "src_path", "") or ""
    if src.startswith("blog/"):          # blog 插件自己渲染标题
        return markdown

    title = (getattr(page, "meta", None) or {}).get("title")
    if not title:
        return markdown

    fm, body = _split(markdown)
    first = _first_content_line(body)
    if first is None:
        return markdown

    # 已经以一级标题开头: 尊重作者写法, 什么都不做
    if _H1.match(first):
        return markdown

    body = "# " + str(title).strip() + "\n\n" + _demote_h1(body.lstrip("\n"))
    return fm + body
