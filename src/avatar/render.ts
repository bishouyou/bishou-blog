import type { AvatarAsciiArt, AvatarAsciiCell } from './types';

export function renderAvatarAscii(art: AvatarAsciiArt): string {
  const cells = art.cells.map(renderCell).join('');

  return `<pre class="ascii-avatar ascii-avatar-colored ascii-avatar-static" style="--ascii-cols:${art.columns};--ascii-rows:${art.rows}" data-mode="${escapeAttr(art.mode)}" data-columns="${art.columns}" data-rows="${art.rows}">${cells}</pre>`;
}

function renderCell(cell: AvatarAsciiCell): string {
  return [
    `<span class="ascii-pixel"`,
    ` data-x="${cell.x}"`,
    ` data-y="${cell.y}"`,
    ` data-intensity="${cell.intensity}"`,
    ` style="--x:${cell.x};--y:${cell.y};--intensity:${cell.intensity};grid-column:${cell.x + 1};grid-row:${cell.y + 1};color:${escapeAttr(cell.color)}"`,
    `>${escapeHtml(cell.char)}</span>`
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
