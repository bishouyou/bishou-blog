import $ from 'jquery';
import installTerminal from 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.min.css';
import posts from 'virtual:posts';
import { findPost, listTags, parseCommand, postsByTag, searchPosts } from './content/commands';
import { siteConfig } from './site.config';
import { hydrateFlowBlocks, scheduleFlowHydration, watchFlowResize } from './terminal/flow';
import {
  renderArticle,
  renderError,
  renderHelp,
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
  echo: (value: string, options?: { raw?: boolean }) => void;
  clear: () => void;
  exec: (command: string) => void;
  set_prompt: (prompt: string) => void;
};

const terminalElement = $('#terminal');
const theme = siteConfig.theme;

const terminal = terminalElement.terminal(
  async (input: string, term: TerminalApi) => {
    execute(input, term);
  },
  {
    greetings: false,
    name: 'bishou-blog-terminal',
    prompt: buildPrompt(),
    checkArity: false,
    completion: ['help', 'ls', 'cat', 'search', 'tags', 'tag', 'about', 'clear'],
    keymap: {
      'CTRL+L': (_event: KeyboardEvent, term: TerminalApi) => {
        term.clear();
        printWelcome(term);
        return false;
      }
    }
  }
) as unknown as TerminalApi;

terminal.set_prompt(buildPrompt());
watchFlowResize(document);
printWelcome(terminal);
scheduleFlowHydration(document);

document.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-command]');
  if (!target) {
    return;
  }

  event.preventDefault();
  const command = target.dataset.command;
  if (command) {
    terminal.exec(command);
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
      print(term, renderPostList(posts));
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
  const post = findPost(posts, query);
  if (!post) {
    print(term, renderError(`没有找到文章: ${query || '(空)'}`));
    return;
  }

  print(term, renderArticle(post));
}

function search(term: TerminalApi, keyword: string): void {
  if (!keyword.trim()) {
    print(term, renderError('用法: search <keyword>'));
    return;
  }

  const results = searchPosts(posts, keyword);
  print(term, renderPostList(results, `search: ${keyword}`));
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
  print(term, renderWelcome(siteConfig.asciiArt, siteConfig.nickname, siteConfig.about));
}

function print(term: TerminalApi, html: string): void {
  term.echo(html, { raw: true });
  scheduleFlowHydration(document);
}

function buildPrompt(): string {
  return [
    `[[;${theme.os};]▦ ]`,
    `[[;${theme.blue};]${siteConfig.user}@${siteConfig.host} ]`,
    `[[;${theme.pink};]${siteConfig.homePath} ]`,
    `[[;${theme.os};]› ]`
  ].join('');
}
