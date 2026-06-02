import { describe, expect, it } from 'vitest';
import { completeInput, getGhostSuffix } from '../src/terminal/completion';
import type { Post } from '../src/content/types';

const posts: Post[] = [
  {
    meta: {
      title: 'Hello Terminal',
      titlePinyin: 'helloterminal',
      date: '2026-06-01',
      slug: 'hello-terminal',
      tags: ['blog', 'terminal'],
      categories: ['notes'],
      summary: 'first post',
      draft: false
    },
    html: '<p>hello</p>',
    plainText: 'hello',
    readingTime: 1
  },
  {
    meta: {
      title: 'Pretext Flow',
      titlePinyin: 'pretextflow',
      date: '2026-06-01',
      slug: 'pretext-flow',
      tags: ['pretext', 'terminal'],
      categories: ['lab'],
      summary: 'flow post',
      draft: false
    },
    html: '<p>flow</p>',
    plainText: 'flow',
    readingTime: 1
  }
];

const tags = [
  { tag: 'blog', count: 1 },
  { tag: 'pretext', count: 1 },
  { tag: 'terminal', count: 2 }
];

describe('terminal completion', () => {
  it('completes command names', () => {
    expect(completeInput('h', posts, tags)).toContain('help');
    expect(getGhostSuffix('h', completeInput('h', posts, tags))).toBe('elp');
  });

  it('completes cat targets by slug and quoted title', () => {
    const candidates = completeInput('cat h', posts, tags);
    expect(candidates).toContain('cat hello-terminal');
    expect(candidates).toContain('cat "Hello Terminal"');
    expect(getGhostSuffix('cat h', candidates)).toBe('ello-terminal');
  });

  it('completes cat targets by pinyin alias', () => {
    const chinesePosts: Post[] = [
      {
        meta: {
          title: '文字潮汐',
          titlePinyin: 'wenzichaoxi',
          date: '2026-06-01',
          slug: 'pretext-flow',
          tags: ['pretext'],
          categories: ['lab'],
          summary: 'flow',
          draft: false
        },
        html: '<p>flow</p>',
        plainText: 'flow',
        readingTime: 1
      }
    ];
    const candidates = completeInput('cat w', chinesePosts, []);
    expect(candidates).toContain('cat wenzichaoxi');
    expect(getGhostSuffix('cat w', candidates)).toBe('enzichaoxi');
  });

  it('completes tag names', () => {
    const candidates = completeInput('tag p', posts, tags);
    expect(candidates).toContain('tag pretext');
    expect(getGhostSuffix('tag p', candidates)).toBe('retext');
  });

  it('does not complete free-form search text', () => {
    expect(completeInput('search pre', posts, tags)).toEqual([]);
  });
});
