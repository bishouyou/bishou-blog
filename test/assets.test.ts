import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPosts, prepareContentAssets } from '../src/content/build';

describe('content assets', () => {
  it('rewrites Obsidian image embeds from any project folder', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'terminal-assets-'));

    try {
      const postsDir = join(projectRoot, 'content', 'posts');
      const pictureDir = join(projectRoot, 'picture');
      await mkdir(postsDir, { recursive: true });
      await mkdir(pictureDir, { recursive: true });
      await writeFile(join(pictureDir, 'Pasted image 20260604.png'), 'fake image');
      await writeFile(
        join(postsDir, 'image-note.md'),
        `---
title: Image Note
date: 2026-06-04
draft: false
---

![[Pasted image 20260604.png]]
`
      );

      const assetIndex = await prepareContentAssets(projectRoot);
      const posts = await loadPosts(postsDir, { assetIndex, projectRoot });

      expect(posts[0].html).toContain('content-assets/picture/Pasted%20image%2020260604.png');
      await expect(
        readFile(join(projectRoot, 'public', 'content-assets', 'picture', 'Pasted image 20260604.png'), 'utf8')
      ).resolves.toBe('fake image');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
