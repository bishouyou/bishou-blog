import type { SiteConfig } from './content/types';
import asciiArt from './assets/ascii-art.txt?raw';

export const siteConfig: SiteConfig = {
  nickname: 'bishou',
  user: 'bishou',
  host: 'blog',
  homePath: '~',
  about: 'bishou 的个人终端博客。这里记录工程、阅读、工具链和一些短小锋利的想法。',
  asciiArt: asciiArt.trimEnd(),
  theme: {
    os: '#ACB0BE',
    blue: '#00D4FF',
    pink: '#FF00FF',
    lavender: '#A855F7',
    text: '#E0E0E0',
    muted: '#666666',
    background: '#0A0A0A',
    surface: '#0D1117',
    green: '#00FF41',
    yellow: '#FFB000',
    red: '#FF3333'
  }
};
