const boundShells = new WeakSet<HTMLElement>();

type PixelPoint = {
  element: HTMLElement;
  x: number;
  y: number;
};

export function installAsciiAvatarInteraction(root: ParentNode = document): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const shells = root.querySelectorAll<HTMLElement>('.ascii-avatar-shell');
  for (const shell of shells) {
    if (boundShells.has(shell)) {
      continue;
    }

    const avatar = shell.querySelector<HTMLElement>('.ascii-avatar-colored');
    if (!avatar) {
      continue;
    }

    const pixels = [...avatar.querySelectorAll<HTMLElement>('.ascii-pixel-active')]
      .map((element) => ({
        element,
        x: Number(element.dataset.x || 0),
        y: Number(element.dataset.y || 0)
      }))
      .filter((pixel) => Number.isFinite(pixel.x) && Number.isFinite(pixel.y));

    if (pixels.length === 0) {
      continue;
    }

    bindShell(shell, avatar, pixels);
    boundShells.add(shell);
  }
}

function bindShell(shell: HTMLElement, avatar: HTMLElement, pixels: PixelPoint[]): void {
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const maxX = Math.max(...pixels.map((pixel) => pixel.x)) + 1;
  const maxY = Math.max(...pixels.map((pixel) => pixel.y)) + 1;

  const schedule = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    shell.classList.add('is-gathering');
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        updatePixels(avatar, pixels, maxX, maxY, pointerX, pointerY);
      });
    }
  };

  const reset = () => {
    shell.classList.remove('is-gathering');
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    for (const { element } of pixels) {
      element.style.removeProperty('--gather-x');
      element.style.removeProperty('--gather-y');
      element.style.removeProperty('--gather-scale');
      element.style.removeProperty('--gather-brightness');
      element.style.removeProperty('--gather-saturation');
    }
  };

  shell.addEventListener('pointerenter', schedule);
  shell.addEventListener('pointermove', schedule);
  shell.addEventListener('pointerleave', reset);
  shell.addEventListener('pointercancel', reset);
}

function updatePixels(
  avatar: HTMLElement,
  pixels: PixelPoint[],
  columns: number,
  rows: number,
  clientX: number,
  clientY: number
): void {
  const rect = avatar.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const cellWidth = rect.width / columns;
  const cellHeight = rect.height / rows;
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const radius = Math.min(rect.width, rect.height) * 0.42;

  for (const { element, x, y } of pixels) {
    const pixelX = (x + 0.5) * cellWidth;
    const pixelY = (y + 0.5) * cellHeight;
    const dx = localX - pixelX;
    const dy = localY - pixelY;
    const distance = Math.hypot(dx, dy);

    if (distance > radius) {
      element.style.removeProperty('--gather-x');
      element.style.removeProperty('--gather-y');
      element.style.removeProperty('--gather-scale');
      element.style.removeProperty('--gather-brightness');
      element.style.removeProperty('--gather-saturation');
      continue;
    }

    const force = (1 - distance / radius) ** 2;
    element.style.setProperty('--gather-x', `${(dx * force * 0.16).toFixed(2)}px`);
    element.style.setProperty('--gather-y', `${(dy * force * 0.16).toFixed(2)}px`);
    element.style.setProperty('--gather-scale', (1 + force * 0.18).toFixed(3));
    element.style.setProperty('--gather-brightness', (1 + force * 0.34).toFixed(3));
    element.style.setProperty('--gather-saturation', (1 + force * 0.26).toFixed(3));
  }
}
