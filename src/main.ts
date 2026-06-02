import $ from 'jquery';
import '@fontsource/cascadia-code/latin-400.css';
import '@fontsource/cascadia-code/latin-600.css';
import '@fontsource/cascadia-code/latin-700.css';
import installTerminal from 'jquery.terminal';
import 'jquery.terminal/css/jquery.terminal.min.css';
import posts from 'virtual:posts';
import { findPost, listTags, parseCommand, postsByTag, searchPosts } from './content/commands';
import { siteConfig } from './site.config';
import { completeInput as buildCompletions, getGhostSuffix as findGhostSuffix } from './terminal/completion';
import { scheduleFlowHydration, watchFlowResize } from './terminal/flow';
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
  complete?: (commands: string[], options?: Record<string, unknown>) => boolean;
  echo: (value: string, options?: { raw?: boolean }) => void;
  clear: () => void;
  exec: (command: string) => void;
  focus?: () => void;
  get_command?: () => string;
  set_prompt: (prompt: string) => void;
};

const terminalElement = $('#terminal');
const theme = siteConfig.theme;

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
            word: false
          });
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
scheduleFlowHydration(document);
installGhostHint();
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
  if (command) {
    terminal.exec(command);
    terminal.focus?.();
    scrollTerminalToBottom();
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
  print(term, renderWelcome(siteConfig.asciiArt, siteConfig.nickname, siteConfig.about, siteConfig.avatarAscii));
}

function print(term: TerminalApi, html: string): void {
  term.echo(html, { raw: true });
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
  return buildCompletions(input, posts, listTags(posts));
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
  return findGhostSuffix(command, completeInput(command));
}

function buildPrompt(): string {
  return [
    `[[;${theme.os};]ubuntu ]`,
    `[[;${theme.blue};]${siteConfig.user}@${siteConfig.host} ]`,
    `[[;${theme.pink};]${siteConfig.homePath} ]`,
    `[[;${theme.os};]› ]`
  ].join('');
}
