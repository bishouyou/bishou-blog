# bishou terminal blog

这是 bishou 的终端式个人博客。你只需要维护 Markdown、文件夹和图片；提交到 GitHub 后，GitHub Pages 会自动构建并发布。

## 站点地址

```text
https://bishouyou.github.io/bishou-blog/
```

## 一次更新的标准流程

```powershell
git status
git add .
git commit -m "Update content"
git push origin main
```

推送到 `main` 后，GitHub Actions 会自动部署。进入 GitHub 仓库的 `Actions` 页面可以查看部署是否成功。

## 上传 blog 文章

把 Markdown 放到：

```text
content/posts/
```

示例：

```text
content/posts/2026-06-04-my-note.md
```

推荐 frontmatter：

```md
---
title: "文章标题"
date: "2026-06-04"
tags: ["tag1", "tag2"]
categories: ["notes"]
summary: "一句话摘要"
slug: "my-note"
draft: false
---

正文内容。
```

说明：

- `title` 是网站中显示的标题。
- `date` 是发布日期。
- `tags` 和 `categories` 用于分类。
- `summary` 会显示在 `ls` 列表里。
- `slug` 可选；不写时系统会按文件名和标题生成别名。
- `draft: true` 表示草稿，不会发布。

## 上传 knowledge base

把 Markdown 放到：

```text
content/kb/
```

文件夹层级会直接变成网站里的终端路径。

示例：

```text
content/kb/linux/shell.md
content/kb/web/upload/image-upload.md
content/kb/reverse/python/pyinstaller.md
```

网站里可以这样访问：

```sh
kb
cd linux
ls
cat shell
```

也可以用拼音、标题、路径补全打开。补全和搜索会自动生成，不需要手动维护。

## 上传文件夹

直接在 `content/kb/` 或 `content/posts/` 下创建文件夹即可。

适合 Obsidian 风格管理：

```text
content/kb/
  Linux基础/
    Ubuntu虚拟机下载、安装、配置.md
  web/
    文件上传.md
  MISC/
    压缩包考点/
      常见考点.md
```

这些目录会在网站终端中显示成可 `cd`、`ls`、`cat` 的路径。

## 上传图片

图片可以放在仓库任意位置，不要求固定目录。

推荐放法：

```text
picture/demo.png
content/kb/web/assets/upload.png
content/posts/assets/note-image.jpg
```

支持 Obsidian 图片语法：

```md
![[demo.png]]
![[upload.png]]
```

支持普通 Markdown 相对路径：

```md
![图片说明](./assets/upload.png)
![图片说明](../../picture/demo.png)
```

构建时会自动：

1. 扫描仓库里的图片。
2. 复制到 `public/content-assets/`。
3. 把 Markdown 里的图片链接改成 GitHub Pages 可访问路径。

`public/content-assets/` 是生成目录，不需要手动管理，也不要提交。

支持的图片格式：

```text
avif gif jpeg jpg png svg webp
```

远程图片也可以直接写：

```md
![图片说明](https://example.com/image.png)
```

## 本地预览

第一次安装依赖：

```powershell
npm install
```

启动本地服务：

```powershell
npm run dev
```

打开：

```text
http://127.0.0.1:5173/
```

构建前检查：

```powershell
npm run test
npm run build
```

当前项目已清除测试文件，`npm run test` 只用于保证 CI 流程兼容。

## 网站里的常用命令

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

## 让 AI 帮你上传内容时怎么说

你可以把桌面的 `bishou-blog-upload-guide.md` 发给 AI，然后补充：

```text
请按照这个指南，把我的 Markdown、文件夹和图片整理到 bishou-blog 仓库中。
blog 文章放 content/posts/
知识库放 content/kb/
图片可以保持原目录或放 picture/
最后帮我 npm run build，提交并推送 main。
```

## 项目结构

```text
content/posts/      blog Markdown
content/kb/         knowledge base Markdown
picture/            推荐图片目录，也可以使用任意目录
public/content-assets/  构建生成的图片目录，不提交
src/content/        Markdown、图片和虚拟文件系统构建逻辑
src/terminal/       终端渲染、补全、Pretext 动效
src/assets/         头像源图和 ASCII 数据
```
