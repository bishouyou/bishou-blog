---
title: "写作工作流"
date: "2026-06-01"
tags: ["markdown", "workflow"]
categories: ["notes"]
summary: "这个博客采用类似 Hexo 的写作方式：Markdown 文件加 frontmatter，提交后静态构建。"
slug: "writing-workflow"
draft: false
---

这个项目的写作方式很简单：每篇文章就是一个 Markdown 文件。

文件顶部的 frontmatter 负责描述标题、日期、标签、分类、摘要和 slug。正文部分保持标准 Markdown。构建时，站点会扫描文章目录，生成终端可以读取的文章索引。

## 新增文章

创建一个文件：

```text
content/posts/2026-06-02-new-note.md
```

写入 frontmatter 和正文，然后运行构建命令。GitHub Pages 只需要托管最终生成的静态文件。

这种模式的好处是没有后台服务，也没有数据库。文章历史就是 Git 历史。
