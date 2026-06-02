# bishou terminal blog

一个终端式个人 Markdown 博客。首屏展示彩色 ASCII 头像和昵称，访客可以像使用命令行一样通过 `ls`、`cat`、`search` 等命令浏览文章，也可以点击文章标题打开阅读界面。

当前站点面向静态部署设计，文章放在 `content/posts/*.md`，构建时解析 frontmatter 并生成前端可用的文章数据。

## Features

- 终端交互：基于 `jquery.terminal` 实现命令输入、历史、Tab 补全和快捷键。
- Markdown 写作：支持 Hexo 风格 YAML frontmatter。
- 独立阅读界面：`cat <文章>` 会打开类似 vim/nano 的全屏阅读层，按 `Esc` 或点击左上角 `exit` 返回终端，终端历史保留。
- 拼音打开文章：中文标题会生成连续拼音别名，例如 `文字潮汐` 可用 `cat wenzichaoxi` 打开。
- 输入虚影提示：输入行会显示命令补全 ghost hint，并和 Tab 补全联动。
- Pretext 动效：摘要、欢迎语和正文段落使用 `@chenglou/pretext` 做文字行布局与进入动画。
- 彩色 ASCII 头像：构建期用 `sharp` 从头像图生成静态 ASCII JSON。
- GitHub Pages：内置 Actions workflow，可直接部署静态站点。

## Tech Stack

- Vite
- TypeScript
- jQuery Terminal
- Markdown + `gray-matter` + `marked`
- `@chenglou/pretext`
- `sharp`
- `pinyin-pro`
- Vitest

## Local Development

```sh
npm install
npm run dev
```

开发地址：

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
| `ls` | 列出文章 |
| `cat <slug\|拼音\|标题>` | 打开文章阅读界面 |
| `open <slug\|拼音\|标题>` | `cat` 的别名 |
| `search <keyword>` | 搜索标题、摘要、标签、分类和正文 |
| `tags` | 列出所有标签 |
| `tag <name>` | 查看某个标签下的文章 |
| `about` | 显示头像和简介 |
| `clear` | 清屏 |

快捷键：

- `Tab`：按当前输入上下文补全命令、文章或标签。
- `Esc`：在文章阅读界面中退出。
- `Ctrl+L`：清屏并重新显示欢迎内容。

## Writing Posts

在 `content/posts/` 下新增 Markdown 文件：

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

字段说明：

- `title`：文章标题，也会用于生成拼音别名。
- `date`：文章日期，建议使用 `YYYY-MM-DD`。
- `tags`：标签数组。
- `categories`：分类数组。
- `summary`：摘要，会显示在文章列表和文章页。
- `slug`：命令行打开文章时使用的稳定英文标识。
- `draft`：为 `true` 时不会进入构建结果。

打开文章的三种方式：

```sh
cat post-slug
cat wenzichaoxi
cat "文字潮汐"
```

## Images

文章图片推荐放在 `public/images/`：

```text
public/images/example.png
```

Markdown 中这样引用：

```md
![图片描述](/images/example.png)
```

这种方式对 Vite 本地开发和 GitHub Pages 都稳定。远程图片 URL 也可以使用，但可能受防盗链、跨域策略或远端服务可用性影响。

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

`vite.config.ts` 使用 `base: './'`，适合 GitHub Pages 的仓库子路径部署。

## Deploy To GitHub Pages

仓库已配置：

```text
.github/workflows/deploy-pages.yml
```

推送到 `main` 或 `master` 后，GitHub Actions 会自动：

1. 使用 Node.js 24 安装依赖。
2. 运行测试。
3. 构建静态站点。
4. 上传 `dist/`。
5. 发布到 GitHub Pages。

在 GitHub 仓库中确认：

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

当前仓库地址：

```text
https://github.com/bishouyou/bishou-blog
```

Pages 地址通常为：

```text
https://bishouyou.github.io/bishou-blog/
```

## Project Structure

```text
content/posts/              Markdown 文章
scripts/generate-ascii.mjs  头像转 ASCII 数据脚本
src/assets/                 头像源图、ASCII 文本和生成数据
src/avatar/                 ASCII 头像渲染
src/content/                Markdown 构建与命令数据逻辑
src/terminal/               终端渲染、补全、Pretext 流式文本
src/main.ts                 应用入口和终端交互
src/styles.css              终端、文章阅读界面和主题样式
test/                       Vitest 测试
```

## Notes

- 构建时会自动运行 `npm run generate:ascii`。
- `jquery.terminal` 在构建日志中可能出现 direct `eval` 警告，这是依赖自身行为，不影响当前部署。
- 文章阅读界面是覆盖层，不会清除终端历史。
