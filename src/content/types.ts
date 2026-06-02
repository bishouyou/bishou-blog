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
  asciiArtHtmlUrl?: string;
  theme: SiteTheme;
}

export interface PostMeta {
  title: string;
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
