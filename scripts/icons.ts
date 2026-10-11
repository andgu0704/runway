import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { palettes } from '../src/ui/theme/tokens';

/**
 * Draws the app icon, Android adaptive icon, launch-screen mark and favicon from one
 * SVG so they always match the palette. Run `npm run icons` after changing colours.
 *
 * The mark: five rising bars in the five area colours, a runway that becomes a chart.
 */
const OUT = join(process.cwd(), 'assets', 'images');
const INK = palettes.light.ink;
const BARS = [
  palettes.dark.product,
  palettes.dark.people,
  palettes.dark.money,
  palettes.dark.world,
  palettes.dark.company,
];

/** Bars inside a 1024 box, scaled to `scale` of it and centred. */
function bars(scale: number): string {
  const box = 1024 * scale;
  const origin = (1024 - box) / 2;
  const gap = box * 0.05;
  const width = (box - gap * (BARS.length - 1)) / BARS.length;
  return BARS.map((color, i) => {
    const height = box * (0.3 + (0.7 * i) / (BARS.length - 1));
    const x = origin + i * (width + gap);
    const y = origin + box - height;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${width / 2}" fill="${color}"/>`;
  }).join('');
}

function svg({
  background,
  radius = 0,
  scale,
}: {
  background: string | null;
  radius?: number;
  scale: number;
}): string {
  const bg =
    background === null
      ? ''
      : `<rect width="1024" height="1024" rx="${radius}" fill="${background}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${bg}${bars(scale)}</svg>`;
}

const ASSETS: { file: string; size: number; markup: string; transparent: boolean }[] = [
  // iOS masks the corners itself and rejects transparency.
  {
    file: 'icon.png',
    size: 1024,
    markup: svg({ background: INK, scale: 0.56 }),
    transparent: false,
  },
  // Android crops the foreground to a circle or squircle within the middle 66%.
  {
    file: 'adaptive-icon.png',
    size: 1024,
    markup: svg({ background: null, scale: 0.4 }),
    transparent: true,
  },
  {
    file: 'splash-icon.png',
    size: 512,
    markup: svg({ background: INK, radius: 228, scale: 0.56 }),
    transparent: true,
  },
  {
    file: 'favicon.png',
    size: 48,
    markup: svg({ background: INK, radius: 228, scale: 0.6 }),
    transparent: true,
  },
];

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  try {
    for (const asset of ASSETS) {
      const page = await browser.newPage({
        viewport: { width: asset.size, height: asset.size },
      });
      await page.setContent(
        `<html><body style="margin:0;background:transparent">${asset.markup.replace(
          'width="1024" height="1024">',
          `width="${asset.size}" height="${asset.size}">`,
        )}</body></html>`,
      );
      await page.screenshot({
        path: join(OUT, asset.file),
        omitBackground: asset.transparent,
      });
      await page.close();
      console.log(`  ${asset.file} ${asset.size}×${asset.size}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
