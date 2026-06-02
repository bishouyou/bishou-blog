import { describe, expect, it } from 'vitest';
import {
  findPost,
  listTags,
  parseCommand,
  postsByTag,
  searchPosts
} from '../src/content/commands';
import type { Post } from '../src/content/types';

const posts: Post[] = [
  {
    meta: {
      title: '你好，终端博客',
      titlePinyin: 'nihaozhongduanboke',
      date: '2026-06-01',
      slug: 'hello-terminal',
      tags: ['blog', 'terminal'],
      categories: ['notes'],
      summary: '第一篇示例文章',
      draft: false
    },
    html: '<p>hello</p>',
    plainText: '欢迎来到终端博客',
    readingTime: 1
  },
  {
    meta: {
      title: '文字潮汐',
      titlePinyin: 'wenzichaoxi',
      date: '2026-06-01',
      slug: 'pretext-flow',
      tags: ['pretext', 'terminal'],
      categories: ['lab'],
      summary: '流动重排动画',
      draft: false
    },
    html: '<p>flow</p>',
    plainText: 'Pretext 计算每一行',
    readingTime: 1
  }
];

describe('terminal command helpers', () => {
  it('parses commands with quoted arguments', () => {
    expect(parseCommand('cat "你好，终端博客"')).toEqual({
      name: 'cat',
      args: ['你好，终端博客'],
      rawArgs: '"你好，终端博客"'
    });
    expect(parseCommand('  search pretext  ')).toEqual({
      name: 'search',
      args: ['pretext'],
      rawArgs: 'pretext'
    });
  });

  it('finds posts by slug, exact title, or title pinyin', () => {
    expect(findPost(posts, 'hello-terminal')?.meta.title).toBe('你好，终端博客');
    expect(findPost(posts, '文字潮汐')?.meta.slug).toBe('pretext-flow');
    expect(findPost(posts, 'wenzichaoxi')?.meta.slug).toBe('pretext-flow');
    expect(findPost(posts, 'missing')).toBeUndefined();
  });

  it('searches title, summary, tags, categories, and body text', () => {
    expect(searchPosts(posts, 'Pretext').map((post) => post.meta.slug)).toEqual(['pretext-flow']);
    expect(searchPosts(posts, '示例').map((post) => post.meta.slug)).toEqual(['hello-terminal']);
    expect(searchPosts(posts, 'terminal').map((post) => post.meta.slug)).toEqual([
      'hello-terminal',
      'pretext-flow'
    ]);
  });

  it('lists and filters tags', () => {
    expect(listTags(posts)).toEqual([
      { tag: 'blog', count: 1 },
      { tag: 'pretext', count: 1 },
      { tag: 'terminal', count: 2 }
    ]);
    expect(postsByTag(posts, 'terminal')).toHaveLength(2);
    expect(postsByTag(posts, 'pretext')).toHaveLength(1);
  });
});
