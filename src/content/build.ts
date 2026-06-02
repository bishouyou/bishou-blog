import { readFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { marked } from 'marked';
import { pinyin } from 'pinyin-pro';
import type { KnowledgeBaseEntry, KnowledgeBaseEntryMeta, Post, PostMeta } from './types';

interface RawFrontmatter {
  title?: unknown;
  date?: unknown;
  tags?: unknown;
  categories?: unknown;
  summary?: unknown;
  slug?: unknown;
  draft?: unknown;
}

marked.setOptions({
  async: false,
  gfm: true
});

export async function loadPosts(postsDir: string): Promise<Post[]> {
  const files = await fg('**/*.md', {
    cwd: postsDir,
    absolute: true,
    onlyFiles: true
  });

  const posts = await Promise.all(files.map((file) => loadPost(file)));
  return posts
    .filter((post) => !post.meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export async function loadKnowledgeBase(kbDir: string): Promise<KnowledgeBaseEntry[]> {
  const files = await fg('**/*.md', {
    cwd: kbDir,
    absolute: true,
    onlyFiles: true
  });

  const entries = await Promise.all(files.map((file) => loadKnowledgeBaseEntry(file, kbDir)));
  return entries
    .filter((entry) => !entry.meta.draft)
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function loadPost(filePath: string): Promise<Post> {
  const source = await readFile(filePath, 'utf8');
  return parsePost(source, fallbackSlug(filePath));
}

export async function loadKnowledgeBaseEntry(filePath: string, kbDir: string): Promise<KnowledgeBaseEntry> {
  const source = await readFile(filePath, 'utf8');
  const relativePath = relative(kbDir, filePath);
  return parseKnowledgeBaseEntry(source, relativePath);
}

export function parsePost(source: string, defaultSlug: string): Post {
  const parsed = matter(source);
  const data = parsed.data as RawFrontmatter;
  const title = stringValue(data.title) ?? defaultSlug;
  const summary = stringValue(data.summary) ?? '';
  const meta: PostMeta = {
    title,
    titlePinyin: titleToPinyinSlug(title),
    date: normalizeDate(data.date),
    slug: slugify(stringValue(data.slug) ?? defaultSlug),
    tags: stringArray(data.tags),
    categories: stringArray(data.categories),
    summary,
    draft: Boolean(data.draft)
  };

  const html = marked.parse(parsed.content) as string;
  const plainText = markdownToPlainText(parsed.content);
  const readingTime = estimateReadingTime(plainText);

  return {
    meta,
    html,
    plainText,
    readingTime
  };
}

export function parseKnowledgeBaseEntry(source: string, relativePath: string): KnowledgeBaseEntry {
  const parsed = matter(source);
  const data = parsed.data as RawFrontmatter;
  const pathParts = relativePath.replace(/\\/g, '/').split('/');
  const filename = pathParts.at(-1) ?? 'note.md';
  const defaultSlug = fallbackSlug(filename);
  const title = stringValue(data.title) ?? defaultSlug;
  const summary = stringValue(data.summary) ?? '';
  const meta: KnowledgeBaseEntryMeta = {
    title,
    date: normalizeDate(data.date),
    slug: slugify(stringValue(data.slug) ?? defaultSlug),
    summary,
    draft: Boolean(data.draft)
  };
  const html = marked.parse(parsed.content) as string;
  const plainText = markdownToPlainText(parsed.content);

  return {
    meta,
    path: pathParts.join('/').replace(/\.md$/i, ''),
    segments: pathParts.map((part, index) => (index === pathParts.length - 1 ? part.replace(/\.md$/i, '') : part)),
    html,
    plainText,
    readingTime: estimateReadingTime(plainText)
  };
}

export function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'post';
}

export function estimateReadingTime(text: string): number {
  const latinWords = text.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const cjkChars = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const units = latinWords + cjkChars / 2;
  return Math.max(1, Math.ceil(units / 220));
}

export function titleToPinyinSlug(title: string): string {
  return pinyin(title, {
    toneType: 'none',
    type: 'array'
  })
    .join('')
    .replace(/[^A-Za-z0-9]/g, '')
    .toLowerCase();
}

function fallbackSlug(filePath: string): string {
  return basename(filePath, extname(filePath));
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString().slice(0, 10);
    }
    return String(value);
  }

  return '1970-01-01';
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_\-[\]()`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function postContentPath(...parts: string[]): string {
  return join(process.cwd(), 'content/posts', ...parts);
}
