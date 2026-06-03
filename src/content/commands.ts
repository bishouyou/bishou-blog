import type { Post } from './types';

export interface ParsedCommand {
  name: string;
  args: string[];
  rawArgs: string;
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) {
    return { name: '', args: [], rawArgs: '' };
  }

  const parts = trimmed.match(/"[^"]+"|'[^']+'|\S+/g) ?? [];
  const [name = '', ...args] = parts.map((part) => unquote(part));
  return {
    name: name.toLowerCase(),
    args,
    rawArgs: trimmed.slice(name.length).trim()
  };
}

export function findPost(posts: Post[], query: string): Post | undefined {
  const normalized = normalize(query);
  if (!normalized) {
    return undefined;
  }

  return posts.find((post) => {
    return (
      normalize(post.meta.slug) === normalized ||
      normalize(post.meta.title) === normalized ||
      normalize(post.meta.titlePinyin) === normalized ||
      (post.meta.aliases ?? []).some((alias) => normalize(alias) === normalized)
    );
  });
}

export function searchPosts(posts: Post[], keyword: string): Post[] {
  const normalized = normalize(keyword);
  if (!normalized) {
    return [];
  }

  return posts.filter((post) => {
    const haystack = [
      post.meta.title,
      post.meta.titlePinyin,
      post.meta.summary,
      post.meta.slug,
      ...(post.meta.aliases ?? []),
      ...post.meta.tags,
      ...post.meta.categories,
      post.plainText
    ]
      .map(normalize)
      .join(' ');

    return haystack.includes(normalized);
  });
}

export function listTags(posts: Post[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.meta.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function postsByTag(posts: Post[], tag: string): Post[] {
  const normalized = normalize(tag);
  return posts.filter((post) =>
    post.meta.tags.some((postTag) => normalize(postTag) === normalized)
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
