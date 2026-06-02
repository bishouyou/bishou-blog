import type { KnowledgeBaseEntry, Post } from '../content/types';

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

  if (!hasArgs) {
    return commandNames.map((name) => `${leading}${name}`);
  }

  if (command === 'cat' || command === 'open') {
    return unique(
      [
        ...posts.flatMap((post) => [
        `${leading}${command} ${quoteCompletion(post.meta.slug)}`,
        `${leading}${command} ${quoteCompletion(post.meta.titlePinyin)}`,
        `${leading}${command} ${quoteCompletion(post.meta.title)}`
        ]),
        ...knowledgeBaseCatTargets(command, leading, context)
      ]
    );
  }

  if (command === 'cd') {
    return directoryTargets(leading, context);
  }

  if (command === 'tag') {
    return tags.map(({ tag }) => `${leading}tag ${quoteCompletion(tag)}`);
  }

  return [];
}

function directoryTargets(leading: string, context: CompletionContext): string[] {
  const entries = context.knowledgeBaseEntries ?? [];
  const folders = new Set(['blog', 'knowledge base']);
  for (const entry of entries) {
    const folderParts = entry.segments.slice(0, -1);
    for (let index = 0; index < folderParts.length; index += 1) {
      folders.add(['knowledge base', ...folderParts.slice(0, index + 1)].join('/'));
    }
  }

  return [...folders].sort().map((folder) => `${leading}cd ${quoteCompletion(folder)}`);
}

function knowledgeBaseCatTargets(command: string, leading: string, context: CompletionContext): string[] {
  const entries = context.knowledgeBaseEntries ?? [];
  const currentPath = context.currentPath ?? [];
  const scopedEntries = currentPath[0] === 'knowledge base'
    ? entries.filter((entry) => startsWithSegments(entry.segments, currentPath.slice(1)))
    : entries;

  return scopedEntries.flatMap((entry) => [
    `${leading}${command} ${quoteCompletion(entry.path)}`,
    `${leading}${command} ${quoteCompletion(entry.meta.slug)}`,
    `${leading}${command} ${quoteCompletion(entry.meta.title)}`
  ]);
}

function startsWithSegments(value: string[], prefix: string[]): boolean {
  return prefix.every((segment, index) => value[index] === segment);
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
