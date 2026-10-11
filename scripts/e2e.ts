import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { chromium, type Page } from 'playwright-core';
import { contentData } from '../src/content';
import { indexContent, optionState, type GameState } from '../src/engine';
import { createI18n } from '../src/i18n';
import type { SaveFile } from '../src/save/saveFile';

/**
 * Plays the exported web build like a player: onboarding, planning a feature,
 * several months with events, an angel round, then a reload to check resume.
 * Fails loudly on any page error or broken expectation. Run `npm run export:web` first.
 */
const DIST = join(process.cwd(), 'dist');
const PORT = 8125;
const content = indexContent(contentData);
const i18n = createI18n();

function serve() {
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.ttf': 'font/ttf',
    '.png': 'image/png',
  };
  return createServer((req, res) => {
    let file = join(DIST, decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/'));
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory())
      file = join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  }).listen(PORT);
}

async function state(page: Page): Promise<GameState> {
  const raw = await page.evaluate(() => localStorage.getItem('run.current'));
  if (raw === null) throw new Error('No save in storage');
  return (JSON.parse(raw) as SaveFile).state;
}

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Expectation failed: ${message}`);
  console.log(`  ✓ ${message}`);
}

/**
 * Accessibility audit of what is on screen: every control has a spoken name and a
 * 44pt target, and the screen has a heading for VoiceOver's rotor to land on.
 */
async function audit(page: Page, screen: string): Promise<void> {
  const problems = await page.evaluate(() => {
    const found: string[] = [];
    const controls = document.querySelectorAll<HTMLElement>(
      '[role="button"], [role="switch"], [role="tab"], [role="slider"], [role="link"], button, input',
    );
    for (const el of controls) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0 || el.closest('[aria-hidden="true"]') !== null)
        continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.pointerEvents === 'none') continue;
      const name = (
        el.getAttribute('aria-label') ??
        el.getAttribute('placeholder') ??
        el.innerText
      ).trim();
      const what = name === '' ? el.outerHTML.slice(0, 80) : `"${name.slice(0, 40)}"`;
      if (name === '') found.push(`unnamed control ${what}`);
      if (box.width < 43.5 || box.height < 43.5)
        found.push(`small target ${what} ${Math.round(box.width)}×${Math.round(box.height)}`);
    }
    if (document.querySelector('[role="heading"], h1, h2, h3') === null) found.push('no heading');
    return found;
  });
  check(
    problems.length === 0,
    `${screen} passes the accessibility audit${problems.length > 0 ? `: ${problems.join('; ')}` : ''}`,
  );
}

async function tap(page: Page, text: string): Promise<void> {
  await page.getByText(text, { exact: true }).last().click();
  await page.waitForTimeout(450);
}

let eventAudited = false;

async function resolveEvent(page: Page): Promise<void> {
  const game = await state(page);
  const pending = game.pendingEvent;
  if (pending === null) return;
  const event = content.events.get(pending.event);
  const option = event?.options.find((o) => {
    const s = optionState(game, content, o.id);
    return s?.visible === true && s.unlocked;
  });
  if (event === undefined || option === undefined)
    throw new Error(`No playable option for ${pending.event}`);
  const subject = game.team.find((e) => e.id === pending.subject);
  const label = i18n.t(`event.${event.id}.option.${option.id}.label`, {
    name: subject?.name ?? '',
    rival: content.markets.get(game.setup.market)?.rivalCompany ?? '',
    company: game.setup.companyName,
  });
  if (!(await page.getByText(label, { exact: true }).last().isVisible()))
    await tap(page, 'Respond to event');
  if (!eventAudited) {
    await audit(page, 'event sheet');
    eventAudited = true;
  }
  await tap(page, label);
}

async function nextMonth(page: Page): Promise<void> {
  const before = (await state(page)).month;
  await tap(page, 'Next month');
  if (await page.getByText('End the month', { exact: true }).last().isVisible())
    await tap(page, 'End the month');
  await page.waitForTimeout(500);
  const after = await state(page);
  check(
    after.month === before + 1 || after.ending !== null,
    `month advanced to ${after.month + 1}`,
  );
  await resolveEvent(page);
}

async function main(): Promise<void> {
  if (!existsSync(DIST)) throw new Error('Run `npm run export:web` first.');
  const server = serve();
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  try {
    console.log('Onboarding');
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(1500);
    await audit(page, 'title screen');
    await tap(page, 'Start a company');
    await audit(page, 'background step');
    await tap(page, 'The Engineer');
    await tap(page, 'Continue');
    await tap(page, 'B2B software');
    await tap(page, 'Continue');
    await tap(page, 'Priya Raman');
    await tap(page, 'Continue');
    await page.getByLabel('Your name').last().fill('Robin Vale');
    await page.getByLabel('Company name').last().fill('Testworks');
    await tap(page, 'Open for business');
    await page.waitForTimeout(800);
    let game = await state(page);
    check(
      game.setup.companyName === 'Testworks' && game.setup.cofounder === 'priya',
      'run started with the chosen setup',
    );
    check(await page.getByText(/^Day one\./).isVisible(), 'feed shows the first entry');
    await audit(page, 'Home');
    for (const tab of ['People', 'Money', 'World', 'Company', 'Product']) {
      await tap(page, tab);
      await audit(page, tab);
    }

    console.log('Planning a feature');
    await tap(page, 'Plan a feature');
    await tap(page, 'The thing itself');
    await tap(page, 'Do it');
    game = await state(page);
    check(game.product.roadmap[0]?.feature === 'coreProduct', 'feature is on the roadmap');
    check(game.ap.used === 1, 'one move spent');

    console.log('Playing months');
    await tap(page, 'Home');
    for (let i = 0; i < 4; i++) await nextMonth(page);

    console.log('Raising from angels');
    await tap(page, 'Money');
    await tap(page, 'Pitch angels');
    await tap(page, 'Do it');
    await page.waitForTimeout(900);
    check(
      await page.getByText('Term sheet', { exact: true }).isVisible(),
      'negotiation screen opened',
    );
    await audit(page, 'negotiation');
    const cashBefore = (await state(page)).stats.cash;
    await tap(page, 'Accept their offer');
    await page.waitForTimeout(600);
    game = await state(page);
    check(game.rounds.length === 1 && game.stats.cash > cashBefore, 'deal closed and cash arrived');
    check(await page.getByText('Deal closed', { exact: true }).isVisible(), 'deal summary shown');
    await tap(page, 'Done');

    console.log('Resuming after a reload');
    const month = game.month;
    await page.reload();
    await page.waitForTimeout(1500);
    game = await state(page);
    check(
      game.month === month && game.rounds.length === 1,
      'reload resumes the same run on the same screen',
    );
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(1500);
    check(
      await page.getByText('Testworks', { exact: true }).isVisible(),
      'title screen offers the saved company',
    );
    await tap(page, 'Continue');
    check(
      await page.getByText('Next month', { exact: true }).last().isVisible(),
      'continue returns to the game',
    );
    await tap(page, 'Home');
    await page.getByLabel('Settings').last().click();
    await page.waitForTimeout(600);
    await audit(page, 'settings');
    const toggle = page.getByRole('switch', { name: 'Haptics' }).last();
    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await page.waitForTimeout(300);
    check(
      (await toggle.getAttribute('aria-checked')) !== before,
      'tapping a settings row flips its switch',
    );

    check(
      errors.length === 0,
      `no page errors${errors.length > 0 ? `: ${errors.join(' | ')}` : ''}`,
    );
    console.log('\nAll flows passed.');
  } finally {
    await page.screenshot({ path: join(process.cwd(), 'screenshots', 'e2e-last.png') });
    await browser.close();
    server.close();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
