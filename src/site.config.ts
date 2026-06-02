import type { AvatarAsciiArt } from './avatar/types';
import type { SiteConfig } from './content/types';
import asciiArt from './assets/ascii-art.txt?raw';
import avatarAscii from './assets/avatar-ascii.json';

export const siteConfig: SiteConfig = {
  nickname: 'bishou',
  user: 'bishou',
  host: 'blog',
  homePath: '~',
  about: 'bishou 的个人终端博客。这里记录工程、阅读、工具链和一些短小锋利的想法。',
  asciiArt: asciiArt.trimEnd(),
  avatarAscii: avatarAscii as AvatarAsciiArt,
  theme: {
    os: '#ACB0BE',
    blue: '#89B4FA',
    pink: '#F5C2E7',
    lavender: '#B4BEFE',
    text: '#CDD6F4',
    muted: '#6C7086',
    background: '#181825',
    surface: '#1E1E2E',
    green: '#A6E3A1',
    yellow: '#F9E2AF',
    red: '#F38BA8'
  }
};
