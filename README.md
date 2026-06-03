# bishou terminal blog

一个终端式个人 Markdown Blog。页面以 `jquery.terminal` 模拟命令行，首屏显示彩色 ASCII 头像和昵称，访客可以用 `ls`、`cd`、`cat`、`search` 等命令浏览内容，也可以点击终端里的目录和文章标题。

## Features

- 终端交互：命令输入、历史、Tab 补全、ghost hint、快捷键。
- 虚拟文件系统：根目录包含 `blog/` 和 `knowledge base/`，两者在命令层都是目录树里的文件。
- 自动拼音体系：构建 Markdown 时自动生成标题拼音、slug、路径别名；`cat`、`search`、`cd`、Tab 补全共用同一套索引。
- Markdown 写作：支持 Hexo 风格 YAML frontmatter。
- 阅读界面：`cat <name>` 打开类似 vim/nano 的覆盖层，按 `Esc` 或点击左上角退出，终端历史保留。
- Pretext 动效：欢迎语、摘要、正文段落使用 `@chenglou/pretext` 做文字行布局和流动重排。
- 彩色 ASCII 头像：构建期用 `sharp` 从头像源图生成静态 ASCII 数据。
- GitHub Pages：内置 Actions workflow，可直接部署静态站点。

## Tech Stack

- Vite
- TypeScript
- jQuery Terminal
- Markdown + `gray-matter` + `marked`
- `@chenglou/pretext`
- `pinyin-pro`
- `sharp`
- Vitest

## Local Development

```sh
npm install
npm run dev
```

本地地址：

```text
http://127.0.0.1:5173/
```

常用命令：

```sh
npm run generate:ascii
npm run test
npm run build
npm run preview
```

## Terminal Commands

| Command | Description |
| --- | --- |
| `help` | 查看可用命令 |
| `ls [path]` | 列出当前目录或指定目录 |
| `cd <path>` | 切换目录 |
| `kb` | 快速进入 `knowledge base/` |
| `pwd` | 显示当前路径 |
| `cat <slug\|拼音\|标题\|路径>` | 打开 blog 或 knowledge base 文件 |
| `open <slug\|拼音\|标题\|路径>` | `cat` 的别名 |
| `search <keyword>` | 搜索标题、拼音、路径、摘要、标签和正文 |
| `tags` | 列出 blog 标签 |
| `tag <name>` | 查看某个标签下的 blog 文章 |
| `about` | 显示头像和简介 |
| `clear` | 清屏 |

快捷键：

- `Tab`：按当前输入和当前目录补全命令、目录、文件、标签。
- `Esc`：在阅读界面中退出。
- `Ctrl+L`：清屏并重新显示欢迎内容。

## Content Model

终端命令层只有一套内容文件系统：

```text
~/
  blog/
    <post files>
  knowledge base/
    <kb folders and files>
```

`blog` 和 `knowledge base` 的区别只在内容来源和渲染元信息：

- `content/posts/*.md` 会出现在 `~/blog/`
- `content/kb/**/*.md` 会按文件夹层级出现在 `~/knowledge base/`

新增 Markdown 后，构建流程会自动生成：

- `slug`
- 标题拼音，例如 `文字潮汐` -> `wenzichaoxi`
- 文件路径别名，例如 `tools/terminal-workflow`
- 目录别名和相对路径补全

所以新增内容不需要手动维护补全表。

## Writing Blog Posts

在 `content/posts/` 下新增 Markdown：

```md
---
title: "文字潮汐"
date: "2026-06-01"
tags: ["pretext", "terminal"]
categories: ["lab"]
summary: "用 Pretext 做文字流动重排。"
slug: "pretext-flow"
draft: false
---

正文内容。
```

打开方式示例：

```sh
cd blog
cat pretext-flow
cat wenzichaoxi
cat "文字潮汐"
```

## Knowledge Base

知识库放在 `content/kb/`，目录结构会映射到终端：

```text
content/kb/
  tools/
    terminal-workflow.md
  reading/
    pretext.md
```

KB Markdown 也使用 frontmatter：

```md
---
title: "终端工作流"
date: "2026-06-02"
summary: "记录常用终端操作。"
slug: "terminal-workflow"
draft: false
---

正文内容。
```

访问方式示例：

```sh
kb
ls
cd tools
ls
cat terminal-workflow
cat zhongduangongzuoliu
cat tools/terminal-workflow
```

当前目录会影响匹配优先级：在 `~/knowledge base` 内执行 `cat <拼音>` 时，会优先匹配知识库文件，再回退到全局文件。

## Images

文章图片推荐放在 `public/images/`：

```text
public/images/example.png
```

Markdown 中引用：

```md
![图片描述](/images/example.png)
```

这种方式对 Vite 本地开发和 GitHub Pages 都稳定。

## Site Config

站点配置在 `src/site.config.ts`：

- `nickname`
- `user`
- `host`
- `homePath`
- `about`
- `theme`
- `asciiArt`
- `avatarAscii`

头像源文件在 `src/assets/avatar-source.png`。修改头像后运行：

```sh
npm run generate:ascii
```

脚本会重新生成：

```text
src/assets/avatar-ascii.json
```

## Build

```sh
npm run build
```

构建产物输出到：

```text
dist/
```

`vite.config.ts` 使用 `base: './'`，适合 GitHub Pages 仓库子路径部署。

## Deploy To GitHub Pages

仓库已配置：

```text
.github/workflows/deploy-pages.yml
```

推送到 `main` 后，GitHub Actions 会自动：

1. 使用 Node.js 24 安装依赖。
2. 运行测试。
3. 构建静态站点。
4. 上传 `dist/`。
5. 发布到 GitHub Pages。

GitHub 仓库设置里确认：

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

Pages 地址通常是：

```text
https://bishouyou.github.io/bishou-blog/
```

## Project Structure

```text
content/posts/              Blog Markdown
content/kb/                 Knowledge base Markdown
scripts/generate-ascii.mjs  头像转 ASCII 数据脚本
src/assets/                 头像源图、ASCII 文本和生成数据
src/avatar/                 ASCII 头像渲染
src/content/                Markdown 构建、命令数据、统一文件系统
src/terminal/               终端渲染、补全、Pretext 流式文本
src/main.ts                 应用入口和终端交互
src/styles.css              终端、阅读界面和主题样式
test/                       Vitest 测试
```

## Notes

- `npm run build` 会自动运行 `npm run generate:ascii`。
- `jquery.terminal` 在构建日志中可能出现 direct `eval` 警告，这是依赖自身行为，不影响当前部署。
- 阅读界面是覆盖层，不会清除终端历史。
