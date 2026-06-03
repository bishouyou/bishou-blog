import { renderAvatarAscii } from '../avatar/render';
import type { AvatarAsciiArt } from '../avatar/types';
import type { KnowledgeBaseEntry, Post } from '../content/types';
import { flowBlock } from './flow';

export interface DirectoryItem {
  command: string;
  description: string;
  kind: 'dir' | 'file' | 'post';
  label: string;
  meta?: string;
}

export function renderWelcome(
  asciiArt: string,
  nickname: string,
  about: string,
  avatarAscii?: AvatarAsciiArt
): string {
  return renderWelcomeParts(asciiArt, nickname, about, avatarAscii).join('');
}

export function renderWelcomeParts(
  asciiArt: string,
  nickname: string,
  about: string,
  avatarAscii?: AvatarAsciiArt
): string[] {
  const avatar = avatarAscii
    ? renderAvatarAscii(avatarAscii)
    : `<pre class="ascii-avatar">${escapeHtml(asciiArt)}</pre>`;

  return [
    `<div class="boot-line boot-step-avatar"><div class="ascii-avatar-shell" aria-label="${escapeAttr(nickname)} avatar">${avatar}</div></div>`,
    `<div class="boot-line boot-step-name welcome-name">${escapeHtml(nickname)}</div>`,
    `<div class="boot-line boot-step-about">${flowBlock(about, 'welcome-flow')}</div>`,
    `<div class="boot-line boot-step-hint hint">输入 <button class="link-command" data-command="help">help</button> 查看命令，或输入 <button class="link-command" data-command="ls">ls</button> 浏览目录。</div>`
  ];
}

export function renderHelp(): string {
  return `<div class="command-help">
      <div><span>help</span><em>列出可用命令</em></div>
      <div><span>ls [path]</span><em>列出当前目录或指定目录</em></div>
      <div><span>cd &lt;path&gt;</span><em>切换目录</em></div>
      <div><span>kb</span><em>进入 knowledge base</em></div>
      <div><span>cat &lt;slug|拼音|标题&gt;</span><em>阅读文章</em></div>
      <div><span>pwd</span><em>显示当前路径</em></div>
      <div><span>search &lt;keyword&gt;</span><em>搜索标题、摘要、标签和正文</em></div>
      <div><span>tags</span><em>列出标签</em></div>
      <div><span>tag &lt;name&gt;</span><em>查看某个标签下的文章</em></div>
      <div><span>about</span><em>显示头像和简介</em></div>
      <div><span>clear</span><em>清屏</em></div>
    </div>`;
}

export function renderDirectoryList(items: DirectoryItem[], heading: string): string {
  if (items.length === 0) {
    return `<div class="empty">当前目录为空。</div>`;
  }

  const rows = items
    .map((item) => {
      const marker = item.kind === 'dir' ? '/' : '';
      return `
        <div class="directory-row directory-row-${item.kind}">
          <button class="directory-name link-command" data-command="${escapeAttr(item.command)}">${escapeHtml(item.label)}${marker}</button>
          <span class="directory-kind">${item.kind}</span>
          <span class="directory-meta">${escapeHtml(item.meta ?? '')}</span>
          <div class="directory-description">${escapeHtml(item.description)}</div>
        </div>
      `;
    })
    .join('');

  return `<section class="directory-list"><h2>${escapeHtml(heading)}</h2>${rows}</section>`;
}

export function renderPostList(posts: Post[], heading = 'posts'): string {
  if (posts.length === 0) {
    return `<div class="empty">没有找到文章。</div>`;
  }

  const rows = posts
    .map((post) => {
      const tags = post.meta.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
      return `
        <article class="post-row">
          <button class="post-title link-command" data-command="cat ${escapeAttr(post.meta.slug)}">${escapeHtml(post.meta.title)}</button>
          <span class="post-date">${escapeHtml(post.meta.date)}</span>
          <span class="post-reading">${formatReadingTime(post.readingTime)}</span>
          <div class="post-summary">${flowBlock(post.meta.summary, 'summary-flow')}</div>
          <div class="post-tags">${tags}</div>
        </article>
      `;
    })
    .join('');

  return `<section class="post-list"><h2>${escapeHtml(heading)}</h2>${rows}</section>`;
}

export function renderTags(tags: Array<{ tag: string; count: number }>): string {
  if (tags.length === 0) {
    return `<div class="empty">还没有标签。</div>`;
  }

  return `
    <div class="tag-cloud">
      ${tags
        .map(
          ({ tag, count }) =>
            `<button class="tag-pill link-command" data-command="tag ${escapeAttr(tag)}">${escapeHtml(tag)} <span>${count}</span></button>`
        )
        .join('')}
    </div>
  `;
}

export function renderArticle(post: Post): string {
  return `
    <article class="article">
      <header>
        <h1>${escapeHtml(post.meta.title)}</h1>
        <div class="article-meta">${escapeHtml(post.meta.date)} · ${formatReadingTime(post.readingTime)} · ${post.meta.tags
          .map(escapeHtml)
          .join(', ')}</div>
        ${flowBlock(post.meta.summary, 'article-summary')}
      </header>
      <div class="article-body">${decorateArticleHtml(post.html)}</div>
    </article>
  `;
}

export function renderKnowledgeEntry(entry: KnowledgeBaseEntry): string {
  return `
    <article class="article">
      <header>
        <h1>${escapeHtml(entry.meta.title)}</h1>
        <div class="article-meta">${escapeHtml(entry.meta.date)} · ${formatReadingTime(entry.readingTime)} · ${escapeHtml(entry.path)}</div>
        ${flowBlock(entry.meta.summary, 'article-summary')}
      </header>
      <div class="article-body">${decorateArticleHtml(entry.html)}</div>
    </article>
  `;
}

function decorateArticleHtml(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;

  const paragraphs = template.content.querySelectorAll('p');
  for (const paragraph of paragraphs) {
    const text = paragraph.textContent?.trim();
    if (!text) {
      continue;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = flowBlock(text, 'article-flow');
    paragraph.replaceWith(wrapper.firstElementChild as Element);
  }

  return template.innerHTML;
}

export function renderError(message: string): string {
  return `<div class="error">${escapeHtml(message)}</div>`;
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

function formatReadingTime(minutes: number): string {
  return `约 ${minutes} 分钟`;
}
