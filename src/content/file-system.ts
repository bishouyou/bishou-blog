import type { KnowledgeBaseEntry, Post } from './types';
import { pinyin } from 'pinyin-pro';

export type ContentRoot = 'blog' | 'knowledge base';
export type ContentFileKind = 'post' | 'knowledge';

export interface ContentFile {
  kind: ContentFileKind;
  root: ContentRoot;
  path: string[];
  title: string;
  date: string;
  summary: string;
  aliases: string[];
  plainText: string;
  post?: Post;
  entry?: KnowledgeBaseEntry;
}

export interface ContentDirectory {
  path: string[];
  label: string;
  count: number;
}

export function buildContentFiles(posts: Post[], knowledgeBaseEntries: KnowledgeBaseEntry[]): ContentFile[] {
  return [
    ...posts.map((post): ContentFile => ({
      kind: 'post',
      root: 'blog',
      path: ['blog', post.meta.slug],
      title: post.meta.title,
      date: post.meta.date,
      summary: post.meta.summary,
      aliases: unique([
        post.meta.slug,
        post.meta.title,
        post.meta.titlePinyin,
        ...(post.meta.aliases ?? []),
        `blog/${post.meta.slug}`,
        `blog/${post.meta.titlePinyin}`
      ]),
      plainText: [
        post.meta.title,
        post.meta.titlePinyin,
        post.meta.slug,
        post.meta.summary,
        ...post.meta.tags,
        ...post.meta.categories,
        post.plainText
      ].join(' '),
      post
    })),
    ...knowledgeBaseEntries.map((entry): ContentFile => ({
      kind: 'knowledge',
      root: 'knowledge base',
      path: ['knowledge base', ...entry.segments],
      title: entry.meta.title,
      date: entry.meta.date,
      summary: entry.meta.summary,
      aliases: unique([
        entry.path,
        entry.meta.slug,
        entry.meta.title,
        entry.meta.titlePinyin ?? '',
        ...(entry.meta.aliases ?? []),
        ...(entry.pathAliases ?? []),
        `knowledge base/${entry.path}`,
        `kb/${entry.path}`
      ]),
      plainText: [
        entry.meta.title,
        entry.meta.titlePinyin ?? '',
        entry.meta.slug,
        entry.path,
        (entry.pathAliases ?? []).join(' '),
        entry.meta.summary,
        entry.plainText
      ].join(' '),
      entry
    }))
  ];
}

export function listDirectories(files: ContentFile[], path: string[]): ContentDirectory[] {
  if (path.length === 0) {
    return [
      { path: ['blog'], label: 'blog', count: files.filter((file) => file.root === 'blog').length },
      {
        path: ['knowledge base'],
        label: 'knowledge base',
        count: files.filter((file) => file.root === 'knowledge base').length
      }
    ];
  }

  const folders = new Map<string, ContentDirectory>();
  for (const file of files) {
    if (!startsWithSegments(file.path, path)) {
      continue;
    }

    const nextSegment = file.path[path.length];
    if (!nextSegment || file.path.length === path.length + 1) {
      continue;
    }

    const folderPath = [...path, nextSegment];
    const key = folderPath.join('/');
    folders.set(key, {
      path: folderPath,
      label: nextSegment,
      count: (folders.get(key)?.count ?? 0) + 1
    });
  }

  return [...folders.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function listFiles(files: ContentFile[], path: string[]): ContentFile[] {
  return files
    .filter((file) => file.path.length === path.length + 1 && startsWithSegments(file.path, path))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export function isDirectoryPath(files: ContentFile[], path: string[]): boolean {
  if (path.length === 0) {
    return true;
  }
  return files.some((file) => file.path.length > path.length && startsWithSegments(file.path, path));
}

export function findDirectoryPath(files: ContentFile[], query: string, currentPath: string[]): string[] | undefined {
  const normalized = normalizeToken(query);
  if (!normalized || normalized === '~' || normalized === '/') {
    return [];
  }

  const directories = allDirectoryPaths(files);
  return directories.find((path) =>
    directoryAliases(path, currentPath).some((alias) => normalizeToken(alias) === normalized)
  );
}

export function findContentFile(files: ContentFile[], query: string, currentPath: string[]): ContentFile | undefined {
  const normalized = normalizeToken(query);
  if (!normalized) {
    return undefined;
  }

  const scopedFiles = currentPath.length > 0
    ? files.filter((file) => startsWithSegments(file.path, currentPath))
    : files;
  return findMatchingFile(scopedFiles, normalized, currentPath) ?? findMatchingFile(files, normalized, currentPath);
}

function findMatchingFile(files: ContentFile[], normalizedQuery: string, currentPath: string[]): ContentFile | undefined {
  return files.find((file) => {
    const aliases = fileAliases(file, currentPath);
    return aliases.some((alias) => normalizeToken(alias) === normalizedQuery);
  });
}

export function searchContentFiles(files: ContentFile[], keyword: string): ContentFile[] {
  const normalized = normalizeToken(keyword);
  if (!normalized) {
    return [];
  }

  return files.filter((file) => {
    const haystack = [file.plainText, ...file.aliases, file.path.join('/')]
      .map(normalizeToken)
      .join(' ');
    return haystack.includes(normalized);
  });
}

export function fileAliases(file: ContentFile, currentPath: string[] = []): string[] {
  const relativePath = startsWithSegments(file.path, currentPath)
    ? file.path.slice(currentPath.length).join('/')
    : '';
  const fileName = file.path.at(-1) ?? '';

  return unique([
    file.path.join('/'),
    `~/${file.path.join('/')}`,
    fileName,
    relativePath,
    ...file.aliases
  ].filter(Boolean));
}

export function directoryAliases(path: string[], currentPath: string[] = []): string[] {
  const relativePath = startsWithSegments(path, currentPath)
    ? path.slice(currentPath.length).join('/')
    : '';
  const rendered = path.join('/');
  const segmentPinyin = path.map(toPinyinSlug).filter(Boolean);
  const pinyinPath = segmentPinyin.join('/');

  return unique([
    rendered,
    `~/${rendered}`,
    path.at(-1) ?? '',
    relativePath,
    pinyinPath,
    segmentPinyin.join(''),
    path[0] === 'knowledge base' ? rendered.replace(/^knowledge base/, 'kb') : '',
    path[0] === 'knowledge base' ? pinyinPath.replace(/^knowledgebase/, 'kb') : ''
  ].filter(Boolean));
}

export function allDirectoryPaths(files: ContentFile[]): string[][] {
  const folders = new Map<string, string[]>();
  folders.set('', []);
  for (const file of files) {
    for (let index = 1; index < file.path.length; index += 1) {
      const path = file.path.slice(0, index);
      folders.set(path.join('/'), path);
    }
  }
  return [...folders.values()];
}

export function startsWithSegments(value: string[], prefix: string[]): boolean {
  return prefix.every((segment, index) => normalizeToken(value[index] ?? '') === normalizeToken(segment));
}

export function normalizeToken(value: string): string {
  return unquote(value).trim().toLowerCase();
}

export function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function toPinyinSlug(value: string): string {
  return pinyin(value, {
    toneType: 'none',
    type: 'array'
  })
    .join('')
    .replace(/[^A-Za-z0-9]/g, '')
    .toLowerCase();
}
