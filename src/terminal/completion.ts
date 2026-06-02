import type { Post } from '../content/types';

export const commandNames = ['help', 'ls', 'cat', 'search', 'tags', 'tag', 'about', 'clear'];

export interface TagCount {
  tag: string;
  count: number;
}

export function completeInput(input: string, posts: Post[], tags: TagCount[]): string[] {
  const trimmed = input.trimStart();
  const leading = input.slice(0, input.length - trimmed.length);
  const firstSpace = trimmed.search(/\s/);
  const command = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();
  const hasArgs = firstSpace !== -1;

  if (!hasArgs) {
    return commandNames.map((name) => `${leading}${name}`);
  }

  if (command === 'cat' || command === 'open') {
    return posts.flatMap((post) => [
      `${leading}${command} ${quoteCompletion(post.meta.slug)}`,
      `${leading}${command} ${quoteCompletion(post.meta.title)}`
    ]);
  }

  if (command === 'tag') {
    return tags.map(({ tag }) => `${leading}tag ${quoteCompletion(tag)}`);
  }

  return [];
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
