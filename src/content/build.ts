import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
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

interface AssetCandidate {
  absolutePath: string;
  relativePath: string;
  url: string;
}

interface AssetIndex {
  byBasename: Map<string, AssetCandidate[]>;
  byRelativePath: Map<string, AssetCandidate>;
  projectRoot: string;
}

interface ContentBuildOptions {
  assetIndex?: AssetIndex;
  projectRoot?: string;
}

const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const generatedAssetDir = 'content-assets';

marked.setOptions({
  async: false,
  gfm: true
});

export async function prepareContentAssets(projectRoot = process.cwd()): Promise<AssetIndex> {
  const normalizedRoot = resolve(projectRoot);
  const files = await fg('**/*.{avif,gif,jpeg,jpg,png,svg,webp}', {
    cwd: normalizedRoot,
    absolute: true,
    caseSensitiveMatch: false,
    dot: false,
    ignore: [
      '.git/**',
      'dist/**',
      'node_modules/**',
      `public/${generatedAssetDir}/**`
    ],
    onlyFiles: true
  });

  const index: AssetIndex = {
    byBasename: new Map(),
    byRelativePath: new Map(),
    projectRoot: normalizedRoot
  };

  await mkdir(join(normalizedRoot, 'public', generatedAssetDir), { recursive: true });

  for (const file of files) {
    const relativePath = normalizePath(relative(normalizedRoot, file));
    const url = assetUrl(relativePath);
    const candidate: AssetCandidate = {
      absolutePath: file,
      relativePath,
      url
    };

    index.byRelativePath.set(relativePath.toLowerCase(), candidate);
    const basenameKey = basename(relativePath).toLowerCase();
    index.byBasename.set(basenameKey, [...(index.byBasename.get(basenameKey) ?? []), candidate]);

    const outputPath = join(normalizedRoot, 'public', generatedAssetDir, ...relativePath.split('/'));
    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(file, outputPath);
  }

  return index;
}

export function isContentImagePath(filePath: string): boolean {
  return imageExtensions.has(extname(filePath).toLowerCase());
}

export async function loadPosts(postsDir: string, options: ContentBuildOptions = {}): Promise<Post[]> {
  const files = await fg('**/*.md', {
    cwd: postsDir,
    absolute: true,
    onlyFiles: true
  });

  const assetIndex = options.assetIndex;
  const posts = await Promise.all(files.map((file) => loadPost(file, { ...options, assetIndex })));
  return posts
    .filter((post) => !post.meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export async function loadKnowledgeBase(kbDir: string, options: ContentBuildOptions = {}): Promise<KnowledgeBaseEntry[]> {
  const files = await fg('**/*.md', {
    cwd: kbDir,
    absolute: true,
    onlyFiles: true
  });

  const assetIndex = options.assetIndex;
  const entries = await Promise.all(files.map((file) => loadKnowledgeBaseEntry(file, kbDir, { ...options, assetIndex })));
  return entries
    .filter((entry) => !entry.meta.draft)
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function loadPost(filePath: string, options: ContentBuildOptions = {}): Promise<Post> {
  const source = await readFile(filePath, 'utf8');
  return parsePost(source, fallbackSlug(filePath), { ...options, projectRoot: options.projectRoot ?? process.cwd(), sourcePath: filePath });
}

export async function loadKnowledgeBaseEntry(
  filePath: string,
  kbDir: string,
  options: ContentBuildOptions = {}
): Promise<KnowledgeBaseEntry> {
  const source = await readFile(filePath, 'utf8');
  const relativePath = relative(kbDir, filePath);
  return parseKnowledgeBaseEntry(source, relativePath, { ...options, projectRoot: options.projectRoot ?? process.cwd(), sourcePath: filePath });
}

export function parsePost(source: string, defaultSlug: string, options: ContentBuildOptions & { sourcePath?: string } = {}): Post {
  const parsed = matter(source);
  const data = parsed.data as RawFrontmatter;
  const title = stringValue(data.title) ?? defaultSlug;
  const summary = stringValue(data.summary) ?? '';
  const markdown = rewriteMarkdownAssets(parsed.content, options);
  const meta: PostMeta = {
    title,
    titlePinyin: titleToPinyinSlug(title),
    aliases: contentAliases(title, stringValue(data.slug) ?? defaultSlug),
    date: normalizeDate(data.date),
    slug: slugify(stringValue(data.slug) ?? defaultSlug),
    tags: stringArray(data.tags),
    categories: stringArray(data.categories),
    summary,
    draft: Boolean(data.draft)
  };

  const html = marked.parse(markdown) as string;
  const plainText = markdownToPlainText(markdown);
  const readingTime = estimateReadingTime(plainText);

  return {
    meta,
    html,
    plainText,
    readingTime
  };
}

export function parseKnowledgeBaseEntry(
  source: string,
  relativePath: string,
  options: ContentBuildOptions & { sourcePath?: string } = {}
): KnowledgeBaseEntry {
  const parsed = matter(source);
  const data = parsed.data as RawFrontmatter;
  const pathParts = relativePath.replace(/\\/g, '/').split('/');
  const filename = pathParts.at(-1) ?? 'note.md';
  const defaultSlug = fallbackSlug(filename);
  const title = stringValue(data.title) ?? defaultSlug;
  const summary = stringValue(data.summary) ?? '';
  const markdown = rewriteMarkdownAssets(parsed.content, options);
  const meta: KnowledgeBaseEntryMeta = {
    title,
    titlePinyin: titleToPinyinSlug(title),
    aliases: contentAliases(title, stringValue(data.slug) ?? defaultSlug),
    date: normalizeDate(data.date),
    slug: slugify(stringValue(data.slug) ?? defaultSlug),
    summary,
    draft: Boolean(data.draft)
  };
  const html = marked.parse(markdown) as string;
  const plainText = markdownToPlainText(markdown);

  return {
    meta,
    path: pathParts.join('/').replace(/\.md$/i, ''),
    pathAliases: pathAliases(pathParts.map((part, index) => (index === pathParts.length - 1 ? part.replace(/\.md$/i, '') : part))),
    segments: pathParts.map((part, index) => (index === pathParts.length - 1 ? part.replace(/\.md$/i, '') : part)),
    html,
    plainText,
    readingTime: estimateReadingTime(plainText)
  };
}

export function rewriteMarkdownAssets(
  markdown: string,
  options: ContentBuildOptions & { sourcePath?: string } = {}
): string {
  const withObsidianImages = markdown.replace(/!\[\[([^\]]+)]]/g, (match, rawTarget: string) => {
    const target = rawTarget.split('|')[0]?.trim() ?? '';
    if (!isImageReference(target)) {
      return match;
    }

    const url = resolveAssetUrl(target, options);
    return url ? `![${basename(target)}](${url})` : match;
  });

  return withObsidianImages.replace(/!\[([^\]]*)]\(([^)]+)\)/g, (match, alt: string, rawTarget: string) => {
    const target = rawTarget.trim().replace(/^["']|["']$/g, '');
    if (!isImageReference(target) || isExternalReference(target)) {
      return match;
    }

    const url = resolveAssetUrl(target, options);
    return url ? `![${alt}](${url})` : match;
  });
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

export function contentAliases(title: string, slug: string): string[] {
  return unique([
    slugify(slug),
    title,
    slugify(title),
    titleToPinyinSlug(title)
  ].filter(Boolean));
}

export function pathAliases(segments: string[]): string[] {
  const normalizedSegments = segments.map((segment) => segment.trim()).filter(Boolean);
  const fileName = normalizedSegments.at(-1) ?? '';
  const joined = normalizedSegments.join('/');
  const joinedPinyin = normalizedSegments.map(titleToPinyinSlug).filter(Boolean).join('/');
  const compactPinyin = normalizedSegments.map(titleToPinyinSlug).filter(Boolean).join('');

  return unique([
    joined,
    fileName,
    slugify(fileName),
    titleToPinyinSlug(fileName),
    joinedPinyin,
    compactPinyin
  ].filter(Boolean));
}

function resolveAssetUrl(target: string, options: ContentBuildOptions & { sourcePath?: string }): string | undefined {
  if (!options.assetIndex) {
    return undefined;
  }

  const normalizedTarget = normalizePath(decodeURIComponentSafe(target));
  const relativeCandidate = resolveRelativeAsset(normalizedTarget, options);
  if (relativeCandidate) {
    return relativeCandidate.url;
  }

  const rootCandidate = options.assetIndex.byRelativePath.get(normalizedTarget.replace(/^\/+/, '').toLowerCase());
  if (rootCandidate) {
    return rootCandidate.url;
  }

  const basenameKey = basename(normalizedTarget).toLowerCase();
  const basenameCandidates = options.assetIndex.byBasename.get(basenameKey) ?? [];
  return chooseNearestAsset(basenameCandidates, options)?.url;
}

function resolveRelativeAsset(
  target: string,
  options: ContentBuildOptions & { sourcePath?: string }
): AssetCandidate | undefined {
  if (!options.assetIndex || !options.sourcePath) {
    return undefined;
  }

  const sourceDir = dirname(options.sourcePath);
  const absoluteCandidate = resolve(sourceDir, target);
  const relativeCandidate = normalizePath(relative(options.assetIndex.projectRoot, absoluteCandidate));

  if (relativeCandidate.startsWith('..')) {
    return undefined;
  }

  return options.assetIndex.byRelativePath.get(relativeCandidate.toLowerCase());
}

function chooseNearestAsset(
  candidates: AssetCandidate[],
  options: ContentBuildOptions & { sourcePath?: string }
): AssetCandidate | undefined {
  if (candidates.length <= 1 || !options.sourcePath || !options.assetIndex) {
    return candidates[0];
  }

  const sourceDir = normalizePath(relative(options.assetIndex.projectRoot, dirname(options.sourcePath)));
  return [...candidates].sort((a, b) => assetDistance(a.relativePath, sourceDir) - assetDistance(b.relativePath, sourceDir))[0];
}

function assetDistance(assetPath: string, sourceDir: string): number {
  const assetParts = assetPath.split('/').slice(0, -1);
  const sourceParts = sourceDir.split('/').filter(Boolean);
  let shared = 0;
  while (assetParts[shared] === sourceParts[shared] && shared < assetParts.length && shared < sourceParts.length) {
    shared += 1;
  }

  return assetParts.length + sourceParts.length - shared * 2;
}

function isImageReference(target: string): boolean {
  return imageExtensions.has(extname(target.split('?')[0] ?? '').toLowerCase());
}

function isExternalReference(target: string): boolean {
  return /^(?:https?:|data:|blob:|#)/i.test(target);
}

function assetUrl(relativePath: string): string {
  return `${generatedAssetDir}/${normalizePath(relativePath)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
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
    .replace(/!\[\[[^\]]+]]/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_\-[\]()`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function postContentPath(...parts: string[]): string {
  return join(process.cwd(), 'content/posts', ...parts);
}
