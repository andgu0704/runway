import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { contentData } from '../src/content';
import { validateContent } from '../src/content/validate';
import { indexContent, type GameState } from '../src/engine';
import { createI18n, renderMessage } from '../src/i18n';
import { bots } from '../src/sim/bots';
import { playRun, randomSetup } from '../src/sim/run';

const { values } = parseArgs({
  options: {
    runs: { type: 'string', default: '1000' },
    bot: { type: 'string', default: 'all' },
    seed: { type: 'string', default: '1' },
    market: { type: 'string' },
    out: { type: 'string' },
    trace: { type: 'boolean', default: false },
  },
});

const report = validateContent(contentData);
if (!report.ok) {
  console.error('Content is invalid:\n' + report.errors.join('\n'));
  process.exit(1);
}
const content = indexContent(contentData);
const runs = Number(values.runs);
const baseSeed = Number(values.seed);
const botNames = values.bot === 'all' ? Object.keys(bots) : [values.bot];

interface Summary {
  bot: string;
  runs: number;
  endings: Record<string, number>;
  reachedStartup: number;
  reachedScaleup: number;
  months: { p10: number; p50: number; p90: number };
  score: { p50: number; p90: number };
  ownershipAtEnd: number;
  causesOfFailure: Record<string, number>;
  actionUse: Record<string, number>;
  ruleErrors: number;
  byMarket: Record<string, { runs: number; scaleup: number }>;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;
}

function failureCause(state: GameState): string {
  const ending = state.ending?.id ?? 'unfinished';
  const disasters = state.timeline.filter(
    (t) =>
      t.kind === 'consequence' ||
      (t.kind === 'decision' && content.events.get(String(t.params.event))?.disaster === true),
  );
  const last = disasters[disasters.length - 1];
  if (last === undefined || (state.ending?.month ?? 0) - last.month > 6) return ending;
  const detail = last.kind === 'consequence' ? last.key.split('.')[1] : String(last.params.event);
  return `${ending} after ${detail ?? 'unknown'}`;
}

function simulate(botName: string): Summary {
  const bot = bots[botName];
  if (bot === undefined)
    throw new Error(`Unknown bot: ${botName}. Try: ${Object.keys(bots).join(', ')}`);
  const summary: Summary = {
    bot: botName,
    runs,
    endings: {},
    reachedStartup: 0,
    reachedScaleup: 0,
    months: { p10: 0, p50: 0, p90: 0 },
    score: { p50: 0, p90: 0 },
    ownershipAtEnd: 0,
    causesOfFailure: {},
    actionUse: {},
    ruleErrors: 0,
    byMarket: {},
  };
  const months: number[] = [];
  const scores: number[] = [];
  let ownership = 0;
  for (let i = 0; i < runs; i++) {
    const seed = baseSeed * 100_003 + i;
    const setup = randomSetup(seed, content);
    if (values.market !== undefined) setup.market = values.market;
    const market = content.markets.get(setup.market);
    if (market !== undefined && !market.models.some((m) => m.model === setup.model)) {
      setup.model = market.models[0]?.model ?? setup.model;
    }
    const { state, commands, errors } = playRun(seed, setup, bot, content);
    const endingId = state.ending?.id ?? 'unfinished';
    summary.endings[endingId] = (summary.endings[endingId] ?? 0) + 1;
    const reachedStartup = state.stage !== 'garage';
    if (reachedStartup) summary.reachedStartup += 1;
    const scaled = endingId === 'reachedScaleup';
    if (scaled) summary.reachedScaleup += 1;
    const byMarket = (summary.byMarket[setup.market] ??= { runs: 0, scaleup: 0 });
    byMarket.runs += 1;
    if (scaled) byMarket.scaleup += 1;
    if (content.endings.get(endingId)?.kind === 'failure' || endingId === 'unfinished') {
      const cause = failureCause(state);
      summary.causesOfFailure[cause] = (summary.causesOfFailure[cause] ?? 0) + 1;
    }
    months.push(state.month);
    scores.push(state.ending?.score ?? 0);
    ownership += state.ending?.ownershipBps ?? 0;
    summary.ruleErrors += errors;
    for (const command of commands) {
      if (command.type !== 'performAction') continue;
      summary.actionUse[command.action] = (summary.actionUse[command.action] ?? 0) + 1;
    }
  }
  summary.months = {
    p10: percentile(months, 10),
    p50: percentile(months, 50),
    p90: percentile(months, 90),
  };
  summary.score = { p50: percentile(scores, 50), p90: percentile(scores, 90) };
  summary.ownershipAtEnd = Math.round(ownership / runs) / 100;
  return summary;
}

const pct = (n: number, total: number) => `${((100 * n) / total).toFixed(1)}%`.padStart(6);
const top = (record: Record<string, number>, n: number) =>
  Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

/** Prints one run as the player would read it, month by month. */
function trace(botName: string): void {
  const bot = bots[botName];
  if (bot === undefined) throw new Error(`Unknown bot: ${botName}`);
  const seed = baseSeed;
  const setup = randomSetup(seed, content);
  if (values.market !== undefined) setup.market = values.market;
  const fullFeed = indexContent({
    ...contentData,
    rules: { ...contentData.rules, feedCap: 100_000 },
  });
  const { state } = playRun(seed, setup, bot, fullFeed);
  const i18n = createI18n();
  console.log(
    `${setup.companyName}: ${setup.background} in ${setup.market}, seed ${seed}, ${botName} bot\n`,
  );
  let month = -1;
  for (const entry of state.feed) {
    if (entry.month !== month) {
      month = entry.month;
      console.log(`\n— Month ${month + 1} —`);
    }
    const cause =
      entry.cause === undefined
        ? ''
        : `  [because you ${renderMessage(i18n, entry.cause.key, entry.cause.params)} in month ${entry.cause.month + 1}]`;
    console.log(
      `${entry.tone.padEnd(9)} ${renderMessage(i18n, entry.key, entry.params, entry.variant)}${cause}`,
    );
  }
  if (state.ending !== null) {
    const headline = renderMessage(
      i18n,
      `ending.${state.ending.id}.headline`,
      { company: setup.companyName },
      state.ending.headline,
    );
    console.log(
      `\n${headline.toUpperCase()}\nnet worth $${state.ending.netWorth.toLocaleString()} · legacy ${state.ending.legacy}/100 · score ${state.ending.score}`,
    );
  }
}

if (values.trace) {
  trace(botNames[0] === undefined || values.bot === 'all' ? 'balanced' : botNames[0]);
  process.exit(0);
}

const started = performance.now();
const summaries = botNames.map(simulate);
const seconds = ((performance.now() - started) / 1000).toFixed(1);

for (const s of summaries) {
  console.log(`\n=== ${s.bot} — ${s.runs} runs ===`);
  console.log(
    `reached Startup ${pct(s.reachedStartup, s.runs)} | reached Scale-up ${pct(s.reachedScaleup, s.runs)} | months p10/p50/p90 ${s.months.p10}/${s.months.p50}/${s.months.p90} | score p50/p90 ${s.score.p50}/${s.score.p90} | avg founder stake ${s.ownershipAtEnd}%`,
  );
  console.log(
    'endings:   ' +
      top(s.endings, 10)
        .map(([k, v]) => `${k} ${pct(v, s.runs).trim()}`)
        .join(', '),
  );
  console.log(
    'by market: ' +
      Object.entries(s.byMarket)
        .map(([k, v]) => `${k} ${pct(v.scaleup, v.runs).trim()} of ${v.runs}`)
        .join(', '),
  );
  console.log('top causes of failure:');
  for (const [cause, n] of top(s.causesOfFailure, 5)) console.log(`  ${pct(n, s.runs)}  ${cause}`);
  console.log(
    'most used actions: ' +
      top(s.actionUse, 8)
        .map(([k, v]) => `${k} ${(v / s.runs).toFixed(1)}/run`)
        .join(', '),
  );
  if (s.ruleErrors > 0) console.log(`rule errors (bot tried illegal moves): ${s.ruleErrors}`);
}
console.log(`\n${summaries.length * runs} runs in ${seconds}s`);

if (values.out !== undefined) {
  mkdirSync('sim-output', { recursive: true });
  writeFileSync(values.out, JSON.stringify(summaries, null, 2));
  console.log(`wrote ${values.out}`);
}
