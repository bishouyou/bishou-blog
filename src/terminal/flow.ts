import {
  layoutWithLines,
  prepareWithSegments,
  type PreparedTextWithSegments
} from '@chenglou/pretext';

const preparedCache = new Map<string, PreparedTextWithSegments>();
const blockState = new WeakMap<HTMLElement, { layoutKey: string }>();
const observedWidths = new WeakMap<HTMLElement, number>();
const queuedBlocks = new Set<HTMLElement>();

let resizeObserver: ResizeObserver | undefined;
let flushScheduled = false;

export function flowBlock(text: string, className = ''): string {
  const encoded = encodeURIComponent(text);
  return `<div class="pretext-flow ${className}" data-source="${encoded}"></div>`;
}

export function hydrateFlowBlocks(root: ParentNode = document): void {
  const blocks = root.querySelectorAll<HTMLElement>('.pretext-flow[data-source]');
  for (const block of blocks) {
    observeFlowBlock(block);
    queueFlowBlock(block);
  }
}

export function scheduleFlowHydration(root: ParentNode = document): void {
  hydrateFlowBlocks(root);
}

export function watchFlowResize(root: ParentNode = document): () => void {
  const observer = new MutationObserver((mutations) => {
    const hasFlowAddition = mutations.some((mutation) =>
      [...mutation.addedNodes].some((node) => containsFlowBlock(node))
    );
    if (hasFlowAddition) {
      scheduleFlowHydration(root);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
  };
}

function containsFlowBlock(node: Node): boolean {
  if (!(node instanceof Element)) {
    return false;
  }

  return node.matches('.pretext-flow') || Boolean(node.querySelector('.pretext-flow'));
}

function observeFlowBlock(block: HTMLElement): void {
  if (observedWidths.has(block)) {
    return;
  }

  observedWidths.set(block, 0);
  if (!resizeObserver && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (target instanceof HTMLElement) {
          observedWidths.set(target, entry.contentRect.width);
          queueFlowBlock(target);
        }
      }
    });
  }

  resizeObserver?.observe(block);
}

function queueFlowBlock(block: HTMLElement): void {
  queuedBlocks.add(block);
  if (flushScheduled) {
    return;
  }

  flushScheduled = true;
  window.setTimeout(flushQueuedBlocks, 0);
  requestAnimationFrame(flushQueuedBlocks);
}

function flushQueuedBlocks(): void {
  if (!flushScheduled) {
    return;
  }

  flushScheduled = false;
  const blocks = [...queuedBlocks];
  queuedBlocks.clear();
  for (const block of blocks) {
    renderFlowBlock(block);
  }
}

function renderFlowBlock(block: HTMLElement): void {
  const encoded = block.dataset.source;
  if (!encoded) {
    return;
  }

  const text = decodeURIComponent(encoded);
  const style = window.getComputedStyle(block);
  const width = Math.max(
    80,
    Math.floor(observedWidths.get(block) || block.clientWidth || block.parentElement?.clientWidth || 640)
  );
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.6;
  const letterSpacing = parseFloat(style.letterSpacing) || 0;
  const layoutKey = `${encoded}|${font}|${letterSpacing}|${width}|${lineHeight}`;
  if (blockState.get(block)?.layoutKey === layoutKey) {
    return;
  }

  const prepared = getPreparedText(text, font, letterSpacing);
  const { lines } = layoutWithLines(prepared, width, lineHeight);

  block.innerHTML = lines
    .map(({ text: line }, index) => {
      const safe = escapeHtml(line || ' ');
      return `<span class="flow-line" style="--flow-index:${index}">${safe}</span>`;
    })
    .join('');
  blockState.set(block, { layoutKey });
}

function getPreparedText(text: string, font: string, letterSpacing: number): PreparedTextWithSegments {
  const key = `${font}\n${letterSpacing}\n${text}`;
  const cached = preparedCache.get(key);
  if (cached) {
    return cached;
  }

  const prepared = prepareWithSegments(text, font, {
    letterSpacing,
    whiteSpace: 'normal'
  });
  preparedCache.set(key, prepared);
  return prepared;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
