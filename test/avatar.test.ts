import { describe, expect, it } from 'vitest';
import { renderAvatarAscii } from '../src/avatar/render';
import type { AvatarAsciiArt } from '../src/avatar/types';
import avatarAscii from '../src/assets/avatar-ascii.json';

const avatar = avatarAscii as AvatarAsciiArt;

describe('avatar ascii data', () => {
  it('generates a fixed terminal-sized full-frame grid', () => {
    expect(avatar.columns).toBe(96);
    expect(avatar.rows).toBe(48);
    expect(avatar.mode).toBe('full-frame');
    expect(avatar.sourceWidth).toBe(1237);
    expect(avatar.sourceHeight).toBe(1236);
    expect(avatar.cells.length).toBe(avatar.columns * avatar.rows);
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
  it('renders static full-frame data attributes', () => {
    const html = renderAvatarAscii(avatar);

    expect(html).toContain('class="ascii-avatar ascii-avatar-colored ascii-avatar-static"');
    expect(html).toContain('data-mode="full-frame"');
    expect(html).toContain('data-columns="96"');
    expect(html).toContain('data-rows="48"');
    expect(html).toContain('class="ascii-pixel"');
    expect(html).toContain('data-intensity=');
  });
});
