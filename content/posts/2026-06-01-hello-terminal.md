---
title: "你好，终端博客"
date: "2026-06-01"
tags: ["blog", "terminal"]
categories: ["notes"]
summary: "第一篇示例文章，用来展示 bishou 的终端式博客如何通过命令阅读内容。"
slug: "hello-terminal"
draft: false
---

欢迎来到这个像命令行一样工作的个人博客。

你可以输入 `ls` 查看文章，输入 `cat hello-terminal` 阅读这篇文章，也可以直接点击文章标题。这个站点的目标不是把网页伪装成复杂系统，而是让阅读路径保持干净、直接、可键盘操作。

## 为什么是终端

终端界面天然适合个人知识库：命令短、结果明确、历史可追溯。对于博客来说，它还提供了一种非常个人化的入口，让访客先看到作者的工作方式，再进入文章。

```ts
const command = 'cat hello-terminal';
console.log(`running ${command}`);
```

首版文章都来自 `content/posts` 目录。新增 Markdown 文件后重新构建，就能发布新的内容。
