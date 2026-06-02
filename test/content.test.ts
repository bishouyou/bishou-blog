import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { estimateReadingTime, loadPosts, parsePost, slugify } from '../src/content/build';

describe('markdown content pipeline', () => {
  it('parses Hexo-style frontmatter and markdown body', () => {
    const post = parsePost(
      `---
title: "第一篇文章"
date: "2026-06-01"
tags: ["blog", "terminal"]
categories: ["notes"]
summary: "文章摘要"
slug: "first-post"
draft: false
---

# Hello

正文 with \`code\`.
`,
      'fallback'
    );

    expect(post.meta).toEqual({
      title: '第一篇文章',
      date: '2026-06-01',
      tags: ['blog', 'terminal'],
      categories: ['notes'],
      summary: '文章摘要',
      slug: 'first-post',
      draft: false
    });
    expect(post.html).toContain('<h1>Hello</h1>');
    expect(post.plainText).toContain('正文 with code');
    expect(post.readingTime).toBeGreaterThanOrEqual(1);
  });

  it('sorts newest posts first and skips drafts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'terminal-blog-'));
    try {
      await writeFile(
        join(dir, 'old.md'),
        `---
title: Old
date: 2026-01-01
slug: old
draft: false
---
old`
      );
      await writeFile(
        join(dir, 'new.md'),
        `---
title: New
date: 2026-02-01
slug: new
draft: false
---
new`
      );
      await writeFile(
        join(dir, 'draft.md'),
        `---
title: Draft
date: 2026-03-01
slug: draft
draft: true
---
draft`
      );

      const posts = await loadPosts(dir);
      expect(posts.map((post) => post.meta.slug)).toEqual(['new', 'old']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('normalizes slugs and estimates reading time', () => {
    expect(slugify('Hello Terminal!!')).toBe('hello-terminal');
    expect(slugify('你好 终端')).toBe('你好-终端');
    expect(estimateReadingTime('短文')).toBe(1);
  });
});
