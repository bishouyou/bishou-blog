# -*- coding: utf-8 -*-
"""
notesnav: 构建时自动从 docs/notes/ 生成"学习笔记"导航。
- 默认 notes/ 下所有笔记都进导航(nav: true)
- front-matter 写 nav: false 则不进
- 用 title 做导航名, order 排序(小在前), 按子文件夹嵌套分组
"""
import os
import yaml

def _frontmatter(path):
    try:
        with open(path, encoding="utf-8") as f:
            txt = f.read()
        if txt.startswith("---"):
            end = txt.find("\n---")
            if end != -1:
                return yaml.safe_load(txt[3:end].strip()) or {}
    except Exception:
        pass
    return {}

def _folder_title(abs_dir):
    idx = os.path.join(abs_dir, "index.md")
    if os.path.isfile(idx):
        meta = _frontmatter(idx)
        if meta.get("title"):
            return meta["title"]
    return os.path.basename(abs_dir)

def _build(abs_dir, rel_dir):
    """返回该目录下所有笔记的导航项列表(嵌套)。"""
    items = []
    if not os.path.isdir(abs_dir):
        return items
    for entry in sorted(os.listdir(abs_dir)):
        a = os.path.join(abs_dir, entry)
        r = os.path.join(rel_dir, entry)
        if entry == "index.md":
            continue
        if os.path.isdir(a):
            children = _build(a, r)
            if children:
                title = _folder_title(a)
                items.append({"__order__": 0, "item": {title: children}})
        elif entry.endswith(".md"):
            meta = _frontmatter(a)
            if meta.get("nav") is False:
                continue
            title = meta.get("title") or os.path.splitext(entry)[0]
            order = meta.get("order", 0)
            items.append({"__order__": order, "item": {title: r}})
    items.sort(key=lambda x: x["__order__"])
    return [x["item"] for x in items]

def on_config(config):
    docs_dir = config.get("docs_dir", "docs")
    notes_dir = os.path.join(docs_dir, "notes")
    if not os.path.isdir(notes_dir):
        return config
    auto = _build(notes_dir, "notes")
    nav = config.get("nav", [])
    # 替换或新增"学习笔记"段
    new_nav = []
    replaced = False
    for item in nav:
        if isinstance(item, dict) and "学习笔记" in item:
            new_nav.append({"学习笔记": ["notes/index.md"] + auto})
            replaced = True
        else:
            new_nav.append(item)
    if not replaced:
        new_nav.append({"学习笔记": ["notes/index.md"] + auto})
    config["nav"] = new_nav
    return config
