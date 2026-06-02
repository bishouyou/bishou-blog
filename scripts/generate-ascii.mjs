import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const inputPath = resolve(projectRoot, 'src/assets/avatar-source.png');
const outputPath = resolve(projectRoot, 'src/assets/avatar-ascii.json');

const columns = 96;
const rows = 48;
const backgroundLuminance = 215;
const backgroundSaturation = 48;
const glyphs = ['░', '▒', '▓', '█'];

const image = sharp(inputPath, { failOn: 'error' }).ensureAlpha();
const metadata = await image.metadata();
const { data } = await image
  .resize(columns, rows, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .raw()
  .toBuffer({ resolveWithObject: true });

const cells = [];

for (let y = 0; y < rows; y += 1) {
  for (let x = 0; x < columns; x += 1) {
    if (isSourceEdge(x, y)) {
      continue;
    }

    const index = (y * columns + x) * 4;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];
    const luminance = getLuminance(r, g, b);
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    if (a < 20 || (luminance >= backgroundLuminance && saturation <= backgroundSaturation)) {
      continue;
    }

    const intensity = clamp(1 - luminance / 255, 0, 1);
    cells.push({
      x,
      y,
      char: glyphs[Math.min(glyphs.length - 1, Math.floor(intensity * glyphs.length))],
      color: toHex(r, g, b),
      intensity: Number(intensity.toFixed(3))
    });
  }
}

const output = {
  columns,
  rows,
  sourceWidth: metadata.width ?? 0,
  sourceHeight: metadata.height ?? 0,
  transparentBackground: {
    luminance: backgroundLuminance,
    saturation: backgroundSaturation
  },
  cells
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(
  `Generated ${cells.length} ASCII cells from ${metadata.width ?? '?'}x${metadata.height ?? '?'} into ${outputPath}`
);

function getLuminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toHex(r, g, b) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isSourceEdge(x, y) {
  return x <= 3 || x >= columns - 2 || y <= 1 || y >= rows - 1;
}
