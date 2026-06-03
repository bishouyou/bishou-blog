import type { KnowledgeBaseEntry, Post } from '../content/types';
import {
  buildContentFiles,
  allDirectoryPaths,
  directoryAliases,
  normalizeToken,
  type ContentFile
} from '../content/file-system';

export const commandNames = ['help', 'ls', 'cd', 'kb', 'pwd', 'cat', 'search', 'tags', 'tag', 'about', 'clear'];

export interface TagCount {
  tag: string;
  count: number;
}

export interface CompletionContext {
  currentPath?: string[];
  knowledgeBaseEntries?: KnowledgeBaseEntry[];
}

export function completeInput(input: string, posts: Post[], tags: TagCount[], context: CompletionContext = {}): string[] {
  const trimmed = input.trimStart();
  const leading = input.slice(0, input.length - trimmed.length);
  const firstSpace = trimmed.search(/\s/);
  const command = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();
  const hasArgs = firstSpace !== -1;

  if (!hasArgs && (command === 'cat' || command === 'open')) {
    const files = buildCompletionFiles(posts, context);
    return contentCatTargets(files, context.currentPath ?? []);
  }

  if (!hasArgs) {
    return filterCandidates(input, commandNames.map((name) => `${leading}${name}`));
  }

  if (command === 'cat' || command === 'open') {
    const files = buildCompletionFiles(posts, context);
    const argPrefix = hasArgs ? trimmed.slice(firstSpace + 1) : '';
    return filterCandidates(argPrefix, contentCatTargets(files, context.currentPath ?? []));
  }

  if (command === 'cd') {
    return filterCandidates(input, directoryTargets(leading, posts, context));
  }

  if (command === 'tag') {
    return filterCandidates(input, tags.map(({ tag }) => `${leading}tag ${quoteCompletion(tag)}`));
  }

  return [];
}

function directoryTargets(leading: string, posts: Post[], context: CompletionContext): string[] {
  const files = buildCompletionFiles(posts, context);
  const currentPath = context.currentPath ?? [];

  return unique(
    allDirectoryPaths(files)
      .filter((path) => path.length > 0)
      .flatMap((path) => directoryAliases(path, currentPath).map((alias) => `${leading}cd ${quoteCompletion(alias)}`))
  ).sort();
}

function contentCatTargets(files: ContentFile[], currentPath: string[]): string[] {
  return unique(files.map((file) => quoteCompletion(preferredFileTarget(file, currentPath)))).sort();
}

function buildCompletionFiles(posts: Post[], context: CompletionContext): ContentFile[] {
  return buildContentFiles(posts, context.knowledgeBaseEntries ?? []);
}

export function getGhostSuffix(input: string, candidates: string[]): string {
  const normalized = input.toLowerCase();
  const match = candidates.find((candidate) => {
    const candidateLower = candidate.toLowerCase();
    return candidateLower.startsWith(normalized) && candidate.length > input.length;
  });

  return match ? match.slice(input.length) : '';
}

function quoteCompletion(value: string): string {
  if (!/[\s"'()]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function filterCandidates(input: string, candidates: string[]): string[] {
  const normalizedInput = normalizeToken(input);
  return unique(candidates.filter(Boolean)).filter((candidate) => {
    const normalizedCandidate = normalizeToken(candidate);
    const unquotedCandidate = normalizedCandidate.replace(/["']/g, '');
    return normalizedCandidate.startsWith(normalizedInput) || unquotedCandidate.startsWith(normalizedInput);
  });
}

function preferredFileTarget(file: ContentFile, currentPath: string[]): string {
  if (currentPath.length > 0 && startsWithPath(file.path, currentPath)) {
    return file.path.slice(currentPath.length).join('/');
  }

  return `~/${file.path.join('/')}`;
}

function startsWithPath(value: string[], prefix: string[]): boolean {
  return prefix.every((segment, index) => value[index] === segment);
}
