# bishou terminal blog

这是 bishou 的终端式个人博客。内容用 Markdown 管理，页面用命令行方式浏览，部署到 GitHub Pages。

## 怎么更新网站

### 1. 新增 blog

把 Markdown 放到：

```text
content/posts/
```

推荐格式：

```md
---
title: "文章标题"
date: "2026-06-04"
tags: ["tag1", "tag2"]
categories: ["notes"]
summary: "一句话摘要"
slug: "optional-slug"
draft: false
---

正文内容。
```

如果不写 `slug`，系统会按文件名和标题自动生成可搜索、可补全的别名。

### 2. 新增 knowledge base

把 Markdown 放到：

```text
content/kb/
```

文件夹层级会直接变成终端路径。例如：

```text
content/kb/linux/shell.md
```

在网站里就是：

```sh
kb
cd linux
cat shell
```

### 3. 插入图片

图片可以放在仓库任意位置，例如：

```text
picture/demo.png
content/kb/linux/assets/shell.png
content/posts/notes/image.jpg
```

Markdown 里支持 Obsidian 写法：

```md
![[demo.png]]
![[shell.png]]
```

也支持普通 Markdown 相对路径：

```md
![说明](./assets/shell.png)
![说明](../../picture/demo.png)
```

构建时会自动扫描仓库里的图片，复制到 `public/content-assets/`，并把文章里的图片链接改成 GitHub Pages 可访问的路径。`public/content-assets/` 是生成目录，不需要手动维护，也不要提交。

远程图片可以直接写：

```md
![说明](https://example.com/image.png)
```

## 本地预览

第一次安装：

```sh
npm install
```

启动本地开发服务：

```sh
npm run dev
```

打开：

```text
http://127.0.0.1:5173/
```

## 发布到 GitHub Pages

提交并推送到 `main`：

```sh
git add .
git commit -m "Update content"
git push origin main
```

GitHub Actions 会自动：

1. 安装依赖
2. 运行测试
3. 构建站点
4. 发布 `dist/` 到 GitHub Pages

网站地址：

```text
https://bishouyou.github.io/bishou-blog/
```

## 常用维护命令

```sh
npm run test
npm run build
npm run generate:ascii
```

- `npm run test`：检查内容解析、命令补全和构建逻辑。
- `npm run build`：完整构建静态网站，发布前建议跑一次。
- `npm run generate:ascii`：头像源图变化后重新生成 ASCII 头像数据。

## 终端命令

网站里可用：

```sh
help
ls
cd <path>
kb
pwd
cat <标题|拼音|路径>
open <标题|拼音|路径>
search <keyword>
tags
tag <name>
about
clear
```

`blog` 和 `knowledge base` 底层是一套统一文件系统，所以拼音、路径、标题搜索和 Tab 补全都会自动生成，不需要手动维护补全表。

## 项目结构

```text
content/posts/      blog Markdown
content/kb/         knowledge base Markdown
picture/            可选图片目录，也可以换成任意名字
src/content/        Markdown、图片和虚拟文件系统构建逻辑
src/terminal/       终端渲染、补全、Pretext 动效
src/assets/         头像源图和 ASCII 数据
test/               自动测试
```
