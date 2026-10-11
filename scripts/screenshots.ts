import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium, type Page } from 'playwright-core';
import { contentData } from '../src/content';
import { applyInPlace, indexContent, newRun, type Command, type GameState } from '../src/engine';
import { createSave, serializeSave } from '../src/save/saveFile';
import { bots } from '../src/sim/bots';
import { playRun } from '../src/sim/run';

/**
 * Renders the exported web build in Chromium at phone size, in both themes,
 * with seeded saves, and writes PNGs to screenshots/. Run `npm run export:web` first.
 */
const { values } = parseArgs({
  options: {
    only: { type: 'string' },
    scale: { type: 'string', default: '1' },
    text: { type: 'string', default: '1' },
  },
});

const DIST = join(process.cwd(), 'dist');
const OUT = join(process.cwd(), 'screenshots');
const PORT = 8123;
const content = indexContent(contentData);
const SETUP = {
  founderName: 'Robin Vale',
  companyName: 'Fernworks',
  background: 'engineer',
  market: 'saas',
  model: 'subscription',
  cofounder: 'priya',
};

/** Plays a balanced run and stops after `stopAfter` commands, or when the predicate first holds. */
function fixture(seed: number, stop: (state: GameState, commands: Command[]) => boolean): string {
  const bot = bots.balanced;
  if (bot === undefined) throw new Error('missing balanced bot');
  const full = playRun(seed, SETUP, bot, content);
  const state = newRun(seed, SETUP, content);
  const commands: Command[] = [];
  for (const command of full.commands) {
    if (stop(state, commands)) break;
    applyInPlace(state, content, command);
    commands.push(command);
  }
  return serializeSave(createSave(state, commands, content, '2026-10-11T00:00:00.000Z'));
}

const fixtures: Record<string, () => string | null> = {
  none: () => null,
  fresh: () => fixture(5, (_s, c) => c.length >= 0),
  early: () => fixture(5, (s) => s.month >= 4 && s.pendingEvent === null),
  midgame: () =>
    fixture(
      5,
      (s) =>
        s.stage === 'startup' && s.month >= 30 && s.pendingEvent === null && s.negotiation === null,
    ),
  event: () => fixture(5, (s) => s.pendingEvent !== null && s.month >= 6),
  negotiation: () => fixture(5, (s) => s.negotiation !== null),
  ended: () => fixture(5, () => false),
};

interface Shot {
  name: string;
  path: string;
  save: keyof typeof fixtures;
  before?: (page: Page) => Promise<void>;
}

function tap(label: string) {
  return async (page: Page) => {
    await page.getByText(label, { exact: true }).first().click();
    await page.waitForTimeout(900);
  };
}

function tapThenTap(label: string) {
  return async (page: Page) => {
    await page.getByText(label, { exact: true }).first().scrollIntoViewIfNeeded();
    await page.getByText(label, { exact: true }).first().click();
    await page.waitForTimeout(900);
  };
}

const shots: Shot[] = [
  { name: 'title-empty', path: '/', save: 'none' },
  { name: 'title-continue', path: '/', save: 'midgame' },
  { name: 'feed-start', path: '/feed', save: 'fresh' },
  { name: 'feed-early', path: '/feed', save: 'early' },
  { name: 'feed-mid', path: '/feed', save: 'midgame' },
  { name: 'event', path: '/feed', save: 'event' },
  { name: 'action-feature', path: '/product', save: 'early', before: tap('Plan a feature') },
  { name: 'action-price', path: '/product', save: 'midgame', before: tapThenTap('Change pricing') },
  { name: 'stat-sheet', path: '/feed', save: 'midgame', before: tap('Cash') },
  { name: 'product', path: '/product', save: 'midgame' },
  { name: 'people', path: '/people', save: 'midgame' },
  { name: 'money', path: '/money', save: 'midgame' },
  { name: 'world', path: '/world', save: 'midgame' },
  { name: 'company', path: '/company', save: 'midgame' },
  { name: 'negotiation', path: '/negotiation', save: 'negotiation' },
  { name: 'ending', path: '/ending', save: 'ended' },
  { name: 'new-background', path: '/new', save: 'none' },
  { name: 'new-market', path: '/new/market', save: 'none' },
  { name: 'new-cofounder', path: '/new/cofounder', save: 'none' },
  { name: 'new-name', path: '/new/name', save: 'none' },
  { name: 'settings', path: '/settings', save: 'midgame' },
  { name: 'style-guide', path: '/style-guide', save: 'midgame' },
];

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.json': 'application/json',
  '.css': 'text/css',
};

function serve() {
  return createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    let file = join(DIST, url);
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory())
      file = join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  }).listen(PORT);
}

async function main() {
  if (!existsSync(DIST)) throw new Error('Run `npm run export:web` first.');
  mkdirSync(OUT, { recursive: true });
  const server = serve();
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const selected =
    values.only === undefined
      ? shots
      : shots.filter((s) => values.only?.split(',').includes(s.name));
  const textScale = Number(values.text);
  const cache = new Map<string, string | null>();
  try {
    for (const scheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: Number(values.scale),
        colorScheme: scheme,
        reducedMotion: 'reduce',
      });
      for (const shot of selected) {
        if (!cache.has(shot.save)) cache.set(shot.save, fixtures[shot.save]?.() ?? null);
        const save = cache.get(shot.save) ?? null;
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text());
        });
        await page.addInitScript(
          ([raw, scale]) => {
            localStorage.clear();
            if (raw !== null) localStorage.setItem('run.current', raw);
            if (scale !== 1) document.documentElement.style.fontSize = `${scale * 100}%`;
          },
          [save, textScale] as const,
        );
        await page.goto(`http://localhost:${PORT}${shot.path}`);
        await page.waitForTimeout(1200);
        if (shot.before !== undefined) await shot.before(page);
        const file = join(
          OUT,
          `${shot.name}-${scheme}${textScale === 1 ? '' : `-text${textScale}`}.png`,
        );
        await page.screenshot({ path: file, fullPage: false });
        console.log(
          `${errors.length === 0 ? 'ok   ' : 'ERROR'} ${file}${errors.length === 0 ? '' : `\n      ${errors.slice(0, 3).join('\n      ')}`}`,
        );
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
