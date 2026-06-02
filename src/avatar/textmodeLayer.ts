import type { AvatarAsciiCell } from './types';

const layers = new WeakMap<HTMLElement, { destroy: () => void }>();

type TextmodeModule = typeof import('textmode.js');

type CanvasCell = AvatarAsciiCell & {
  rgb: [number, number, number];
};

export function scheduleTextmodeAvatarLayer(root: ParentNode = document): void {
  if (!canUseTextmodeLayer()) {
    return;
  }

  const run = () => installTextmodeAvatarLayer(root);
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    globalThis.setTimeout(run, 240);
  }
}

function canUseTextmodeLayer(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl2'));
}

async function installTextmodeAvatarLayer(root: ParentNode): Promise<void> {
  const shells = root.querySelectorAll<HTMLElement>('.ascii-avatar-shell');
  if (shells.length === 0) {
    return;
  }

  let textmodeModule: TextmodeModule | undefined;

  for (const shell of shells) {
    if (layers.has(shell)) {
      continue;
    }

    const avatar = shell.querySelector<HTMLElement>('.ascii-avatar-colored');
    if (!avatar) {
      continue;
    }

    const cells = readCells(avatar);
    const columns = Number(avatar.dataset.columns || 0);
    const rows = Number(avatar.dataset.rows || 0);
    if (!Number.isFinite(columns) || !Number.isFinite(rows) || columns <= 0 || rows <= 0 || cells.length === 0) {
      continue;
    }

    textmodeModule ??= await import('textmode.js');
    installLayer(shell, avatar, cells, columns, rows, textmodeModule).catch(() => {
      shell.classList.remove('has-textmode', 'is-textmode-ready');
      shell.querySelector('.ascii-avatar-textmode')?.remove();
    });
  }
}

async function installLayer(
  shell: HTMLElement,
  avatar: HTMLElement,
  cells: CanvasCell[],
  columns: number,
  rows: number,
  { textmode }: TextmodeModule
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.className = 'ascii-avatar-textmode';
  canvas.setAttribute('aria-hidden', 'true');
  shell.appendChild(canvas);
  shell.classList.add('has-textmode');

  const size = getAvatarSize(avatar);
  const instance = textmode.create({
    canvas,
    width: size.width,
    height: size.height,
    fontSize: size.fontSize,
    frameRate: 24,
    loadingScreen: { transition: 'none' }
  });

  const resizeObserver = new ResizeObserver(() => {
    const next = getAvatarSize(avatar);
    canvas.style.width = `${next.width}px`;
    canvas.style.height = `${next.height}px`;
    instance.resizeCanvas(next.width, next.height);
    instance.fontSize(next.fontSize);
    if (instance.grid) {
      instance.grid.cols = columns;
      instance.grid.rows = rows;
    }
  });

  await instance.setup(() => {
    if (instance.grid) {
      instance.grid.cols = columns;
      instance.grid.rows = rows;
    }
  });

  instance.draw(() => {
    instance.clear();
    const frame = instance.frameCount;
    for (const cell of cells) {
      const shimmer = Math.sin((cell.x * 0.22 + cell.y * 0.35 + frame * 0.08)) * 0.42;
      const alpha = Math.round(55 + cell.intensity * 105);
      instance.push();
      instance.char(cell.char);
      instance.charColor(cell.rgb[0], cell.rgb[1], cell.rgb[2], alpha);
      instance.translate(cell.x - columns / 2, cell.y - rows / 2 + shimmer, 0);
      instance.point();
      instance.pop();
    }
  });

  resizeObserver.observe(avatar);
  shell.classList.add('is-textmode-ready');
  layers.set(shell, {
    destroy() {
      resizeObserver.disconnect();
      instance.destroy();
      canvas.remove();
      shell.classList.remove('has-textmode', 'is-textmode-ready');
    }
  });
}

function readCells(avatar: HTMLElement): CanvasCell[] {
  return [...avatar.querySelectorAll<HTMLElement>('.ascii-pixel-active')]
    .map((element): CanvasCell | undefined => {
      const color = element.style.color;
      const rgb = parseHexColor(color);
      if (!rgb) {
        return undefined;
      }

      return {
        x: Number(element.dataset.x || 0),
        y: Number(element.dataset.y || 0),
        char: element.textContent || '▓',
        color,
        intensity: Number(element.dataset.intensity || 0.5),
        rgb
      };
    })
    .filter((cell): cell is CanvasCell => cell !== undefined && Number.isFinite(cell.x) && Number.isFinite(cell.y));
}

function getAvatarSize(avatar: HTMLElement): { width: number; height: number; fontSize: number } {
  const rect = avatar.getBoundingClientRect();
  const style = window.getComputedStyle(avatar);
  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
    fontSize: Math.max(4, parseFloat(style.fontSize) || 10)
  };
}

function parseHexColor(color: string): [number, number, number] | undefined {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) {
    return undefined;
  }

  const value = match[1];
  return [Number.parseInt(value.slice(0, 2), 16), Number.parseInt(value.slice(2, 4), 16), Number.parseInt(value.slice(4, 6), 16)];
}
