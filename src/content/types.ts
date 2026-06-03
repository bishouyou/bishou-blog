import type { AvatarAsciiArt } from '../avatar/types';

export interface SiteTheme {
  os: string;
  blue: string;
  pink: string;
  lavender: string;
  text: string;
  muted: string;
  background: string;
  surface: string;
  green: string;
  yellow: string;
  red: string;
}

export interface SiteConfig {
  nickname: string;
  user: string;
  host: string;
  homePath: string;
  about: string;
  asciiArt: string;
  avatarAscii: AvatarAsciiArt;
  theme: SiteTheme;
}

export interface PostMeta {
  title: string;
  titlePinyin: string;
  aliases?: string[];
  date: string;
  slug: string;
  tags: string[];
  categories: string[];
  summary: string;
  draft: boolean;
}

export interface Post {
  meta: PostMeta;
  html: string;
  plainText: string;
  readingTime: number;
}

export interface KnowledgeBaseEntryMeta {
  title: string;
  titlePinyin?: string;
  aliases?: string[];
  date: string;
  slug: string;
  summary: string;
  draft: boolean;
}

export interface KnowledgeBaseEntry {
  meta: KnowledgeBaseEntryMeta;
  path: string;
  pathAliases?: string[];
  segments: string[];
  html: string;
  plainText: string;
  readingTime: number;
}
