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

项目使用 Vite，`npm run build` 会生成 `dist/`。Vite `base` 已配置为相对路径，适合 GitHub Pages 的仓库子路径。

### GitHub Pages

1. 在 GitHub 创建一个仓库，例如 `terminal-blog`。
2. 本地绑定远端并推送当前分支：

```sh
git remote add origin https://github.com/<你的用户名>/terminal-blog.git
git push -u origin codex/terminal-markdown-blog
```

3. 如果你希望直接作为正式站点发布，把当前分支合并到 `main` 或 `master`，或者在 GitHub 上把默认分支切到当前分支。
4. 打开仓库的 `Settings -> Pages`。
5. `Build and deployment` 的 `Source` 选择 `GitHub Actions`。
6. 推送到 `main` 或 `master` 后，`.github/workflows/deploy-pages.yml` 会自动运行测试、构建并发布 `dist/`。

发布完成后访问：

```text
https://<你的用户名>.github.io/terminal-blog/
```

如果仓库名是 `<你的用户名>.github.io`，访问地址就是：

```text
https://<你的用户名>.github.io/
```
