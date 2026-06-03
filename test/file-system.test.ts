import { describe, expect, it } from 'vitest';
import {
  buildContentFiles,
  findContentFile,
  findDirectoryPath,
  searchContentFiles
} from '../src/content/file-system';
import type { KnowledgeBaseEntry, Post } from '../src/content/types';

const posts: Post[] = [
  {
    meta: {
      title: '文字潮汐',
      titlePinyin: 'wenzichaoxi',
      aliases: ['文字潮汐', 'wenzichaoxi', 'pretext-flow'],
      date: '2026-06-01',
      slug: 'pretext-flow',
      tags: ['pretext'],
      categories: ['lab'],
      summary: 'flow post',
      draft: false
    },
    html: '<p>flow</p>',
    plainText: 'flow',
    readingTime: 1
  }
];

const knowledgeBaseEntries: KnowledgeBaseEntry[] = [
  {
    meta: {
      title: '终端工作流',
      titlePinyin: 'zhongduangongzuoliu',
      aliases: ['终端工作流', 'zhongduangongzuoliu', 'terminal-workflow'],
      date: '2026-06-02',
      slug: 'terminal-workflow',
      summary: 'shell notes',
      draft: false
    },
    path: 'tools/terminal-workflow',
    pathAliases: ['tools/terminal-workflow', 'terminal-workflow', 'toolsterminalworkflow'],
    segments: ['tools', 'terminal-workflow'],
    html: '<p>shell notes</p>',
    plainText: 'terminal workflow',
    readingTime: 1
  }
];

describe('content file system', () => {
  it('finds blog and knowledge base files through the same alias matcher', () => {
    const files = buildContentFiles(posts, knowledgeBaseEntries);

    expect(findContentFile(files, 'wenzichaoxi', [])?.kind).toBe('post');
    expect(findContentFile(files, 'zhongduangongzuoliu', [])?.kind).toBe('knowledge');
    expect(findContentFile(files, 'tools/terminal-workflow', [])?.kind).toBe('knowledge');
  });

  it('searches knowledge base aliases and body text', () => {
    const files = buildContentFiles(posts, knowledgeBaseEntries);

    expect(searchContentFiles(files, 'zhongduan').map((file) => file.kind)).toEqual(['knowledge']);
    expect(searchContentFiles(files, 'shell').map((file) => file.kind)).toEqual(['knowledge']);
  });

  it('resolves directory aliases from the generated tree', () => {
    const files = buildContentFiles(posts, knowledgeBaseEntries);

    expect(findDirectoryPath(files, 'kb', [])).toEqual(['knowledge base']);
    expect(findDirectoryPath(files, 'tools', ['knowledge base'])).toEqual(['knowledge base', 'tools']);
    expect(findDirectoryPath(files, 'knowledge base/tools', [])).toEqual(['knowledge base', 'tools']);
  });
});
