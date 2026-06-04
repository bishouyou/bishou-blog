import $ from 'jquery';
import '@fontsource/cascadia-code/latin-400.css';
import '@fontsource/cascadia-code/latin-600.css';
import '@fontsource/cascadia-code/latin-700.css';
import installTerminal from 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.min.css';
import knowledgeBaseEntries from 'virtual:knowledge-base';
import posts from 'virtual:posts';
import { listTags, parseCommand, postsByTag } from './content/commands';
import {
  buildContentFiles,
  findContentFile,
  findDirectoryPath,
  isDirectoryPath,
  listDirectories,
  listFiles,
  searchContentFiles,
  unquote,
  type ContentFile
} from './content/file-system';
import { siteConfig } from './site.config';
import { completeInput as buildCompletions, getGhostSuffix as findGhostSuffix } from './terminal/completion';
import { scheduleFlowHydration, watchFlowResize } from './terminal/flow';
import {
  type DirectoryItem,
  renderArticle,
  renderDirectoryList,
  renderError,
  renderHelp,
  renderKnowledgeEntry,
  renderPostList,
  renderTags,
  renderWelcome
} from './terminal/render';
import './styles.css';

declare global {
  interface Window {
    $: typeof $;
    jQuery: typeof $;
  }
}

window.$ = $;
window.jQuery = $;
(installTerminal as unknown as (root: Window, jquery: typeof $) => typeof $)(window, $);

type TerminalApi = {
  complete?: (commands: string[], options?: Record<string, unknown>) => boolean;
  echo: (value: string, options?: { raw?: boolean }) => void;
  clear: () => void;
  exec: (command: string) => void;
  focus?: () => void;
  get_command?: () => string;
  set_prompt: (prompt: string) => void;
};

const terminalElement = $('#terminal');
const sidebarElement = document.querySelector<HTMLElement>('#content-sidebar');
const terminalHandle = document.querySelector<HTMLButtonElement>('#terminal-handle');
const theme = siteConfig.theme;
let articleViewer: HTMLElement | undefined;
let currentPath: string[] = [];
let savedScrollY = 0;
const contentFiles = buildContentFiles(posts, knowledgeBaseEntries);

terminalElement.addClass('is-starting');
const terminal = terminalElement.terminal(
  async (input: string, term: TerminalApi) => {
    execute(input, term);
    term.focus?.();
    scrollTerminalToBottom();
  },
  {
    greetings: false,
    name: 'bishou-blog-terminal',
    prompt: buildPrompt(),
    checkArity: false,
    completion: completeInput,
    mousewheel: () => true,
    wordAutocomplete: false,
    keymap: {
      'CTRL+L': (_event: KeyboardEvent, term: TerminalApi) => {
        term.clear();
        printWelcome(term);
        term.focus?.();
        scrollTerminalToBottom();
        return false;
      },
      'CTRL+C': () => {
        return false;
      },
      'TAB': function (this: TerminalApi, event: KeyboardEvent) {
        event.preventDefault();
        const command = this.get_command?.() ?? '';
        const candidates = completeInput(command);
        if (candidates.length > 0) {
          this.complete?.(candidates, {
            caseSensitive: false,
            doubleTab: true,
            echo: true,
            echoCommand: false,
            escape: false,
            word: isArgumentCompletion(command)
          });
          window.requestAnimationFrame(scrollTerminalToBottom);
        }
        updateGhostHint();
        return false;
      }
    }
  }
) as unknown as TerminalApi;

terminal.set_prompt(buildPrompt());
watchFlowResize(document);
printWelcome(terminal);
renderSidebar();
scheduleFlowHydration(document);
installGhostHint();
installTerminalHandle();
window.setTimeout(() => {
  terminalElement.removeClass('is-starting');
}, 3200);

document.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-command]');
  if (!target) {
    return;
  }

  event.preventDefault();
  const command = target.dataset.command;
  const followupCommand = target.dataset.followupCommand;
  if (command) {
    const insideArticleViewer = Boolean(target.closest('.article-viewer'));
    terminal.exec(command);
    if (followupCommand) {
      terminal.exec(followupCommand);
    }
    if (!insideArticleViewer) {
      terminal.focus?.();
      scrollTerminalToBottom();
    }
  }
});

function execute(input: string, term: TerminalApi): void {
  const parsed = parseCommand(input);
  if (!parsed.name) {
    return;
  }

  switch (parsed.name) {
    case 'help':
      print(term, renderHelp());
      return;
    case 'ls':
      listPath(term, parsed.rawArgs);
      return;
    case 'cd':
      changeDirectory(term, parsed.rawArgs);
      return;
    case 'kb':
      setPath(['knowledge base']);
      print(term, renderDirectoryList(getDirectoryItems(currentPath), formatPath(currentPath)));
      return;
    case 'pwd':
      print(term, `<div class="path-output">${escapeHtml(formatPath(currentPath))}</div>`);
      return;
    case 'cat':
    case 'open':
      openPost(term, parsed.rawArgs);
      return;
    case 'search':
      search(term, parsed.rawArgs);
      return;
    case 'tags':
      print(term, renderTags(listTags(posts)));
      return;
    case 'tag':
      showTag(term, parsed.rawArgs);
      return;
    case 'about':
      printWelcome(term);
      return;
    case 'clear':
      term.clear();
      return;
    default:
      print(term, renderError(`未知命令: ${parsed.name}。输入 help 查看可用命令。`));
  }
}

function openPost(term: TerminalApi, query: string): void {
  const file = findContentFile(contentFiles, query, currentPath);
  if (!file) {
    print(term, renderError(`没有找到文件: ${query || '(空)'}`));
    return;
  }

  if (file.post) {
    openArticleViewer(renderArticle(file.post), file.title, `cat ${file.post.meta.titlePinyin || file.post.meta.slug}`);
  } else if (file.entry) {
    openArticleViewer(renderKnowledgeEntry(file.entry), file.title, `cat ${file.entry.meta.titlePinyin || file.entry.path}`);
  }
  term.focus?.();
}

function search(term: TerminalApi, keyword: string): void {
  if (!keyword.trim()) {
    print(term, renderError('用法: search <keyword>'));
    return;
  }

  const results = searchContentFiles(contentFiles, keyword);
  print(term, renderDirectoryList(results.map(fileToDirectoryItem), `search: ${keyword}`));
}

function showTag(term: TerminalApi, tag: string): void {
  if (!tag.trim()) {
    print(term, renderError('用法: tag <name>'));
    return;
  }

  const results = postsByTag(posts, tag);
  print(term, renderPostList(results, `tag: ${tag}`));
}

function printWelcome(term: TerminalApi): void {
  print(term, renderWelcome(siteConfig.asciiArt, siteConfig.nickname, siteConfig.about, siteConfig.avatarAscii));
}

function renderSidebar(): void {
  if (!sidebarElement) {
    return;
  }

  sidebarElement.innerHTML = renderSidebarContent();
}

function renderSidebarContent(): string {
  const blogFiles = contentFiles.filter((file) => file.root === 'blog');
  const knowledgeFiles = contentFiles.filter((file) => file.root === 'knowledge base');

  return `
    <div class="sidebar-header">
      <span>browse</span>
      <button class="link-command sidebar-root" type="button" data-command="ls ~">~</button>
    </div>
    ${renderSidebarSection('blog', blogFiles)}
    ${renderSidebarSection('knowledge base', knowledgeFiles)}
  `;
}

function renderSidebarSection(title: string, files: ContentFile[]): string {
  const items = files
    .map((file) => {
      const label = file.root === 'knowledge base' ? file.path.slice(1).join('/') : file.title;
      return `
        <button class="sidebar-item sidebar-item-${file.kind}" type="button" data-command="cat ${escapeAttr(absolutePathArg(file.path))}">
          <span>${escapeHtml(label)}</span>
          <em>${escapeHtml(file.date)}</em>
        </button>
      `;
    })
    .join('');

  return `
    <section class="sidebar-section">
      <button class="sidebar-section-title link-command" type="button" data-command="cd ${escapeAttr(absolutePathArg([title]))}" data-followup-command="ls">${escapeHtml(title)}</button>
      <div class="sidebar-items">${items}</div>
    </section>
  `;
}

function installTerminalHandle(): void {
  terminalHandle?.addEventListener('click', () => {
    terminalElement[0]?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    terminal.focus?.();
    updateGhostHint();
  });
}

function print(term: TerminalApi, html: string): void {
  term.echo(`<div class="command-output-enter">${html}</div>`, { raw: true });
  scheduleFlowHydration(document);
  scrollTerminalToBottom();
}

function scrollTerminalToBottom(): void {
  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      left: 0,
      behavior: 'auto'
    });
  });
}

function completeInput(input: string): string[] {
  return buildCompletions(input, posts, listTags(posts), {
    currentPath,
    knowledgeBaseEntries
  });
}

function installGhostHint(): void {
  updateGhostHint();
  terminalElement.on('keydown keyup input paste', () => {
    window.requestAnimationFrame(updateGhostHint);
  });
}

function updateGhostHint(): void {
  const target = document.querySelector<HTMLElement>('.cmd-cursor .end');
  if (!target) {
    return;
  }

  const command = terminal.get_command?.() ?? '';
  const hint = getGhostSuffix(command);
  if (hint) {
    target.dataset.ghost = hint;
  } else {
    delete target.dataset.ghost;
  }
}

function getGhostSuffix(command: string): string {
  const parsed = parseCommand(command);
  if (parsed.name === 'cat' || parsed.name === 'open') {
    if (!parsed.rawArgs) {
      return ' <title|pinyin|path>';
    }
    return findGhostSuffix(parsed.rawArgs, completeInput(command));
  }
  return findGhostSuffix(command, completeInput(command));
}

function isArgumentCompletion(command: string): boolean {
  const parsed = parseCommand(command);
  return parsed.name === 'cat' || parsed.name === 'open';
}

function listPath(term: TerminalApi, pathInput: string): void {
  const targetPath = pathInput.trim() ? resolvePath(pathInput) : currentPath;
  if (!targetPath || !isDirectoryPath(contentFiles, targetPath)) {
    print(term, renderError(`路径不存在: ${pathInput || formatPath(currentPath)}`));
    return;
  }

  print(term, renderDirectoryList(getDirectoryItems(targetPath), formatPath(targetPath)));
}

function changeDirectory(term: TerminalApi, pathInput: string): void {
  const targetPath = resolvePath(pathInput || '~');
  if (!targetPath || !isDirectoryPath(contentFiles, targetPath)) {
    print(term, renderError(`路径不存在: ${pathInput || '~'}`));
    return;
  }

  setPath(targetPath);
}

function setPath(path: string[]): void {
  currentPath = path;
  terminal.set_prompt(buildPrompt());
  updateGhostHint();
}

function getDirectoryItems(path: string[]): DirectoryItem[] {
  const directories = listDirectories(contentFiles, path).map((directory): DirectoryItem => ({
    command: `cd ${absolutePathArg(directory.path)}`,
    description: directory.path.length === 1 ? rootDescription(directory.path[0]) : 'folder',
    followupCommand: 'ls',
    kind: 'dir',
    label: directory.label,
    meta: `${directory.count} files`
  }));
  const files = listFiles(contentFiles, path).map(fileToDirectoryItem);
  const recentPosts = path.length === 0
    ? contentFiles.filter((file) => file.kind === 'post').slice(0, 3).map(fileToDirectoryItem)
    : [];

  return [...directories, ...files, ...recentPosts];
}

function fileToDirectoryItem(file: ContentFile): DirectoryItem {
  return {
    command: `cat ${absolutePathArg(file.path)}`,
    description: file.summary,
    kind: file.kind === 'post' ? 'post' : 'file',
    label: file.title,
    meta: file.date
  };
}

function rootDescription(root: string): string {
  if (root === 'blog') {
    return '最近上传的 blog 文章';
  }
  if (root === 'knowledge base') {
    return '分层知识库';
  }
  return 'folder';
}

function resolvePath(input: string): string[] | undefined {
  const normalizedInput = unquote(input.trim());
  if (!normalizedInput || normalizedInput === '~' || normalizedInput === '/') {
    return [];
  }

  const absolute = normalizedInput.startsWith('/') || normalizedInput.startsWith('~/');
  const base = absolute ? [] : [...currentPath];
  const cleanInput = normalizedInput.replace(/^~?\//, '');
  const parts = cleanInput.split('/').map((part) => part.trim()).filter(Boolean);
  const path = [...base];

  for (const part of parts) {
    const lowered = part.toLowerCase();
    if (lowered === '.' || lowered === '') {
      continue;
    }
    if (lowered === '..') {
      path.pop();
      continue;
    }
    if (lowered === 'kb') {
      path.push('knowledge base');
      continue;
    }
    path.push(lowered === 'knowledge-base' ? 'knowledge base' : part.toLowerCase());
  }

  return normalizePath(path);
}

function normalizePath(path: string[]): string[] | undefined {
  return findDirectoryPath(contentFiles, path.length === 0 ? '~' : path.join('/'), []);
}

function formatPath(path: string[]): string {
  return path.length === 0 ? '~' : `~/${path.join('/')}`;
}

function quotePath(path: string[]): string {
  const rendered = path.join('/');
  return /[\s"'()]/.test(rendered) ? `"${rendered.replace(/"/g, '\\"')}"` : rendered;
}

function absolutePathArg(path: string[]): string {
  return quoteArg(`~/${path.join('/')}`);
}

function quoteArg(value: string): string {
  return /[\s"'()]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

function openArticleViewer(articleHtml: string, title: string, commandLabel: string): void {
  const viewer = getArticleViewer();
  savedScrollY = window.scrollY;
  viewer.innerHTML = `
    <div class="article-viewer-layout">
      <aside class="article-browser" aria-label="content browser in reader">${renderSidebarContent()}</aside>
      <section class="article-viewer-panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
        <header class="article-viewer-bar">
          <button class="article-viewer-close" type="button" data-article-close aria-label="退出阅读">← exit</button>
          <div class="article-viewer-title">${escapeHtml(commandLabel)}</div>
          <button class="article-viewer-terminal" type="button" data-article-close aria-label="返回终端">terminal</button>
        </header>
        <main class="article-viewer-scroll">${articleHtml}</main>
        <footer class="article-viewer-status">
          <span>ESC close · click browse to switch articles</span>
          <button class="article-viewer-terminal-handle" type="button" data-article-close aria-label="返回终端">terminal</button>
        </footer>
      </section>
    </div>
  `;
  viewer.hidden = false;
  document.body.classList.add('article-open');
  scheduleFlowHydration(viewer);
  viewer.querySelector<HTMLElement>('[data-article-close]')?.focus();
}

function closeArticleViewer(): void {
  if (!articleViewer || articleViewer.hidden) {
    return;
  }

  articleViewer.hidden = true;
  articleViewer.innerHTML = '';
  document.body.classList.remove('article-open');
  window.scrollTo({ top: savedScrollY, left: 0, behavior: 'auto' });
  terminal.focus?.();
  updateGhostHint();
}

function getArticleViewer(): HTMLElement {
  if (articleViewer) {
    return articleViewer;
  }

  articleViewer = document.createElement('div');
  articleViewer.className = 'article-viewer';
  articleViewer.hidden = true;
  articleViewer.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-article-close]')) {
      closeArticleViewer();
    }
  });
  document.body.append(articleViewer);
  return articleViewer;
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && articleViewer && !articleViewer.hidden) {
    event.preventDefault();
    closeArticleViewer();
  }
});

function buildPrompt(): string {
  return [
    `[[;${theme.os};]ubuntu ]`,
    `[[;${theme.blue};]${siteConfig.user}@${siteConfig.host} ]`,
    `[[;${theme.pink};]${formatPath(currentPath)} ]`,
    `[[;${theme.os};]› ]`
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
