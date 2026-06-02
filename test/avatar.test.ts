import { describe, expect, it } from 'vitest';
import { renderAvatarAscii } from '../src/avatar/render';
import type { AvatarAsciiArt } from '../src/avatar/types';
import avatarAscii from '../src/assets/avatar-ascii.json';

const avatar = avatarAscii as AvatarAsciiArt;

describe('avatar ascii data', () => {
  it('generates a fixed terminal-sized grid with visible cells only', () => {
    expect(avatar.columns).toBe(96);
    expect(avatar.rows).toBe(48);
    expect(avatar.sourceWidth).toBe(1237);
    expect(avatar.sourceHeight).toBe(1236);
    expect(avatar.cells.length).toBeGreaterThan(500);
    expect(avatar.cells.length).toBeLessThan(1000);
  });

  it('stores safe coordinates, glyphs, and hex colors', () => {
    for (const cell of avatar.cells) {
      expect(cell.x).toBeGreaterThanOrEqual(0);
      expect(cell.x).toBeLessThan(avatar.columns);
      expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.y).toBeLessThan(avatar.rows);
      expect(cell.char.length).toBeGreaterThan(0);
      expect(cell.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(cell.intensity).toBeGreaterThanOrEqual(0);
      expect(cell.intensity).toBeLessThanOrEqual(1);
    }
  });
});

describe('avatar ascii renderer', () => {
  it('renders data attributes for DOM interaction and textmode enhancement', () => {
    const html = renderAvatarAscii(avatar);

    expect(html).toContain('class="ascii-avatar ascii-avatar-colored"');
    expect(html).toContain('data-columns="96"');
    expect(html).toContain('data-rows="48"');
    expect(html).toContain('class="ascii-pixel ascii-pixel-active"');
    expect(html).toContain('data-intensity=');
  });
});
