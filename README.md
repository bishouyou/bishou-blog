# bishou terminal blog

一个终端式个人 Markdown 博客。文章放在 `content/posts/*.md`，构建时会解析 Hexo 风格 frontmatter，并生成可在终端界面中阅读的静态站点。

## Commands

```sh
npm install
npm run dev
npm run test
npm run build
```

开发地址默认是 `http://127.0.0.1:5173/`。

## Writing Posts

在 `content/posts` 中新增 Markdown 文件：

```md
---
title: "文章标题"
date: "2026-06-01"
tags: ["blog", "terminal"]
categories: ["notes"]
summary: "文章摘要"
slug: "post-slug"
draft: false
---

正文内容。
```

`draft: true` 的文章不会进入构建结果。`slug` 可用于终端命令，例如：

```sh
cat post-slug
```

## Terminal Commands

- `help`：列出命令
- `ls`：列出文章
- `cat <slug|标题>`：阅读文章
- `search <keyword>`：搜索文章
- `tags`：列出标签
- `tag <name>`：查看标签文章
- `about`：显示头像和简介
- `clear`：清屏

## Deploy

项目使用 Vite，`npm run build` 会生成 `dist/`。部署到 GitHub Pages 时发布 `dist` 目录即可；Vite `base` 已配置为相对路径，适合仓库子路径。
