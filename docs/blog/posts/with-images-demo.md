---
date: 2026-02-16
categories:
  - 教程
comments: true
---

# 在 Markdown 中引用图片和文件

本站图片统一放在 `docs/assets/images/`,这篇演示各种图片、附件、流程图的引用写法。

<!-- more -->

本站的图片统一放在 `docs/assets/images/` 目录下。

## 基本图片

相对路径(推荐):

```markdown
![截图描述](../../assets/images/screenshot.png)
```

效果:

![示意图片](https://placehold.co/600x200/indigo/white?text=放一张截图在这里)

## 带标题的图片(Material 特性)

```markdown
<figure markdown>
  ![密码题解密界面](../../assets/images/screenshot.png)
  <figcaption>题目:已知 n e c,求 m</figcaption>
</figure>
```

<figure markdown>
  ![密码题](https://placehold.co/600x150/indigo/white?text=题目截图)
  <figcaption>这就是一张带说明的图片</figcaption>
</figure>

## 调整大小

```markdown
![缩小](https://placehold.co/300x100/indigo/white?text=300px){: width="300"}
```

![缩小](https://placehold.co/300x100/indigo/white?text=300px){: width="300"}

## 图片合并(lightbox 点击放大)

Material 默认支持 lightbox:点击图片即可放大查看,无需额外配置。

## 外链图片

直接填 URL 即可:

```markdown
![CTFtime 截图](https://ctftime.org/static/bolt-oct-2024.png)
```

## 附件文件(非图片)

链接到仓库里的文件:

```markdown
[下载题目附件](../../assets/challs/example.zip)
```

或者直接链接到 GitHub 的 Releases:

```markdown
[下载: chall.zip](https://github.com/bishouyou/bishou-blog/releases/download/v1.0/chall.zip)
```

## 结合 Mermaid 画图(已配置)

MkDocs 已经配置了 mermaid 支持,可以画流程图:

```mermaid
graph LR
  A[拿到题目] --> B[分析]
  B --> C{类型?}
  C -->|Pwn| D[调试]
  C -->|Crypto| E[解方程]
  C -->|Reverse| F[逆算法]
  D --> G[GOT!]
  E --> G
  F --> G
```

## 最佳实践总结

| 资源类型 | 存放位置 | 引用方式 | 要点 |
| --- | --- | --- | --- |
| 截图/素材 | `docs/assets/images/` | `../../assets/images/xxx.png` | 相对路径,注意层级 |
| 附件 | `docs/assets/challs/` | `../../assets/challs/xxx.zip` | 小心仓库大小,大文件扔 Release |
| 外链图 | 任何 URL | `![alt](url)` | 服务下线后会失效 |
| 流程图 | 内嵌 | ````mermaid ...```` | 零依赖,纯文本 |
| 大文件 | GitHub Releases | 外部链接 | 避免仓库膨胀 |

> 提示:GitHub Pages 单文件最大 **100 MB**,建议图片控制在 1-2 MB 以内,用 TinyPNG 或类似工具压缩后上传。