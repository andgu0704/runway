# Runway — Plan

Working title: **Runway**. A turn-based, text-driven startup simulator for iOS first, Android from the same codebase.

This document covers architecture, data model, library choices, the design system and a screen-by-screen outline. It ends with the decisions I need from you before Phase 1 starts. No app code exists yet.

---

## 1. Scope of version 1

| In v1                                                                                                                    | Later                                                              |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Garage (1–5 people) and Startup (5–30) stages, fully playable                                                            | Scale-up, Public company and Giant stages                          |
| Run ends with an ending screen on reaching Scale-up, or on failure                                                       | Retiring on top at year 15, hostile takeover, regulator break-up   |
| Endings: bankruptcy, acquisition (accept, or decline and gamble), fired by the board, scandal collapse, reached Scale-up | Unlocks and achievements, daily seeded scenario                    |
| 30+ actions, 60+ events, 25+ traits, 4 characters, negotiation, timeline                                                 | Android release pass (Android must still build and run throughout) |
| Light and dark themes, Dynamic Type, VoiceOver/TalkBack, reduced motion                                                  | Other languages (the localisation layer is in from day one)        |

The stage system, endings and score are built so that the later stages are new data and rules, not rewrites (section 4.6).

---

## 2. Architecture

Three layers with one-way dependencies:

```
content (typed data + locale strings)
        │  validated at startup
        ▼
engine (pure TypeScript, deterministic)   ← no React, no Expo, no I/O
        ▲
        │  commands in, new state + events out
app (React Native UI, store, persistence, haptics, i18n)
```

- **Engine** is a set of pure functions: `(state, command) → { state, effects }`. It never reads the clock, never calls `Math.random`, never touches storage. It is the only place game rules live.
- **Content** is plain typed data (TypeScript modules exporting objects) validated by Zod schemas. The engine consumes content through a `ContentPack` interface, so tests can inject tiny fixture packs.
- **App** owns rendering, the store, persistence, haptics, sound of nothing (no audio in v1) and localisation. It translates engine output (message keys + parameters) into text. Components never contain game strings or numbers.

ESLint enforces the boundary: `src/engine/**` may not import `react`, `react-native`, `expo*`, or anything under `src/app`, `src/ui`, `src/store`. A unit test also greps the engine bundle to keep the rule honest.

### 2.1 Determinism

- The RNG is a small, self-contained **sfc32** generator (four 32-bit words of state, ~20 lines, well-studied, fast). Its state lives inside `GameState`, so saving and loading mid-run continues the exact sequence. No library needed; it is unit-tested against known vectors.
- Every random draw goes through named helpers (`rng.int`, `rng.chance`, `rng.pick`, `rng.weighted`, `rng.normal`) that take and return state. Nothing in the engine can draw randomness any other way.
- A run is fully described by `{ seed, setup, commands[] }`. A test replays recorded command logs and asserts byte-identical final state. The simulation script relies on the same property.
- Content is iterated in a stable order (sorted ids), never in object-key insertion order from untyped sources.

### 2.2 Engine API (sketch)

```ts
type Command =
  | { type: 'performAction'; actionId: ActionId; params?: ActionParams }
  | { type: 'resolveEvent'; optionId: OptionId }
  | { type: 'negotiation'; move: NegotiationMove }
  | { type: 'endTurn' }
  | { type: 'acceptAcquisition' }
  | { type: 'declineAcquisition' };

function newRun(seed: number, setup: RunSetup, content: ContentPack): GameState;
function apply(state: GameState, cmd: Command, content: ContentPack): Result<StepOutput, RuleError>;
function availableActions(state: GameState, content: ContentPack): ActionAvailability[];
function preview(state: GameState, cmd: Command, content: ContentPack): ProjectedDeltas; // for "what will this do" hints
```

`apply` returns either a new state plus a list of `FeedEntry`s and `Signal`s (`turnEnded`, `dealClosed`, `disaster`, `stageChanged`, `runEnded`) that the app maps to animation and haptics, or a typed rule error (`notEnoughActionPoints`, `eventPending`, …). The UI never has to guess what changed.

### 2.3 Turn resolution order

`endTurn` runs a fixed pipeline. Each step is a small file with its own tests:

1. Apply queued effects of this month's actions (some actions take effect at month end, e.g. a launch).
2. Product: feature progress, bug inflow from velocity and tech debt, quality drift.
3. Users: acquisition (organic from quality and reputation, paid from marketing spend), churn (base + bugs + price pressure − quality), word of mouth.
4. Money: revenue by business model, burn (salaries, infra scaling with users, marketing, office), cash, runway.
5. People: morale drift (crunch, policies, wins and losses), resignation rolls, trait effects.
6. Hidden pressures: scandal risk, board tension, rival pressure, tech-debt "pressure" meters. Crossing thresholds writes foreshadowing feed entries.
7. Scheduled consequences that are due (delayed effects of earlier choices).
8. Event selection: at most one event, from eligible events, weighted, with cooldowns. Consequence events take priority over random ones.
9. Stage check, ending check, valuation update.
10. Advance the calendar; reset action points.

### 2.4 Effects and conditions are data

Actions, event options and consequences describe what they do with a small typed DSL rather than code, so content can grow without engine changes and every effect is inspectable (for previews, the timeline and tests).

```ts
type Effect =
  | { op: 'stat'; stat: StatId; delta: Amount } // Amount = number | { min, max } | { scale: StatId, by: number }
  | { op: 'flag'; flag: FlagId; value?: boolean | number }
  | { op: 'trust'; character: CharacterId; delta: number }
  | { op: 'schedule'; consequence: ConsequenceId; inMonths: Amount; cause: CauseKey }
  | { op: 'pressure'; meter: MeterId; delta: number }
  | { op: 'hire'; candidateId: 'fromParams' }
  | { op: 'fire'; employeeId: 'fromParams' }
  | { op: 'startNegotiation'; investor: CharacterId | InvestorArchetypeId }
  | { op: 'feed'; key: MessageKey; params?: Record<string, ParamRef> }
  | { op: 'chance'; p: number | Formula; then: Effect[]; else?: Effect[] };

type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { stat: StatId; gte?: number; lte?: number }
  | { flag: FlagId; is?: boolean | number }
  | { stage: StageId | StageId[] }
  | { trust: CharacterId; gte?: number; lte?: number }
  | { hasRole: RoleId }
  | { monthAtLeast: number }
  | { policy: PolicyId };
```

For the handful of rules that are genuinely algorithmic (churn curve, valuation, negotiation reaction) the DSL can call a **named formula** registered in the engine. Content refers to formulas by id; it never contains code.

### 2.5 Cause and effect (timeline)

Every `schedule` effect carries a `cause` (what the player did, when, and the message key describing it). When the consequence fires, its feed entry and timeline entry reference that cause, so the timeline can render "Data breach — because you skipped the security review in month 4". Causes also attach to stat changes over a threshold, so big swings in the timeline are explained, not just listed.

### 2.6 Foreshadowing

Brewing problems are **pressure meters** (e.g. `techDebt`, `burnout`, `scandal`, `boardTension`, `rivalCopy`). Each meter has thresholds in content. Crossing one writes an escalating hint to the feed ("Two engineers have started eating lunch at their desks. Silently."), and the meter's level feeds into the weight of the matching events. The player always gets at least one warning before a meter-driven disaster; a test asserts that for every disaster event.

---

## 3. Data model

### 3.1 Game state (serialisable JSON)

```ts
interface GameState {
  schema: 1; // engine state version, separate from save-file version
  seed: number;
  rng: RngState;
  calendar: { month: number; turnUnit: 'month' | 'quarter' };
  actionPoints: { current: number; max: number };
  founder: { background: BackgroundId; name: string; ownership: number /* basis points */ };
  company: { name: string; stage: StageId; valuation: Money; policies: PolicyId[] };
  stats: {
    cash: Money;
    users: number;
    quality: number;
    morale: number;
    reputation: number; // visible
    bugs: number;
    techDebt: number;
    mrr: Money;
    burn: Money;
    price: Money; // secondary
  };
  hidden: { scandalRisk: number; meters: Record<MeterId, number> };
  product: { model: BusinessModelId; roadmap: FeatureSlot[]; launched: boolean };
  team: Employee[]; // each with role, salary, traits, morale, tenure, equity
  characters: Record<CharacterId, { trust: number; state: CharacterStateId }>;
  capTable: CapTableEntry[]; // founder, co-founder, investors, option pool
  board: BoardSeat[];
  flags: Record<FlagId, boolean | number>;
  scheduled: ScheduledConsequence[];
  pendingEvent: PendingEvent | null;
  negotiation: NegotiationState | null;
  cooldowns: Record<EventId, number>;
  feed: FeedEntry[]; // capped; older entries roll into the timeline summary
  timeline: TimelineEntry[];
  ending: Ending | null;
}
```

- Money is integer **dollars** (no floats for cash), ownership is integer **basis points**. All percentages that matter for score are integers so replays cannot drift.
- Stats with natural bounds (quality, morale, reputation) are 0–100 and clamped in one place.
- Feed entries hold `{ key, params, tone, causeRef? }`, never rendered text, so a language switch re-renders the whole history.

### 3.2 Content types

| Content               | Key fields                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Action`              | id, tab, stage availability, cost in action points and cash, conditions, effects, `previewHints`, cooldown                                                        |
| `Event`               | id, trigger (`random` with weight + conditions, `meter` threshold, `consequence`), 3–4 `options` each with conditions (e.g. requires lawyer), effects, follow-ups |
| `Consequence`         | id, delayed effects, optional event to raise, timeline text key                                                                                                   |
| `Candidate archetype` | role, salary range, trait pool, ask (cash and equity)                                                                                                             |
| `Trait`               | id, effects on output/bugs/morale/scandal, interaction rules (e.g. two "Visionary" hires clash)                                                                   |
| `Character`           | id, role (co-founder, lead investor, rival founder, journalist), trust tiers, what each tier unlocks or triggers                                                  |
| `Investor archetype`  | appetite, valuation anchors, patience, board seat demand, personality lines                                                                                       |
| `Stage`               | id, entry rule, turn unit, unlocked actions and events, delegated tasks for hired executives, valuation multiples                                                 |
| `Ending`              | id, trigger condition, headline templates, score rules                                                                                                            |
| `Background`          | founder start bonuses and a unique action                                                                                                                         |
| `Policy`              | culture policies (remote, unlimited PTO, equity for all, …) with long-tail effects                                                                                |
| `ExecutiveRole`       | VP role, stage availability, standing-order options and their effects, salary and equity ranges                                                                   |
| `Market`              | user and revenue curves, price sensitivity, rival flavour text                                                                                                    |

All content text lives in `locales/en/*.json`, keyed by content id (`event.dataBreach.title`, `event.dataBreach.option.blameIntern`). Content files reference keys; a startup check fails loudly in development and tests if any key is missing.

### 3.3 Validation

- Zod schemas for every content type and for the save file.
- `validateContent()` runs at app startup (dev: throws with a readable report; production: the same check already passed in CI, so startup only runs a cheap integrity check) and in a unit test.
- Cross-reference checks beyond schemas: every referenced id exists, every event has 3–4 options, every option-gating flag can actually be set by some action, every disaster has a foreshadowing path, no unreachable events.

### 3.4 Save format

```ts
interface SaveFile {
  saveVersion: number; // bumped on breaking changes
  contentVersion: string; // hash of content ids, used to detect removed content
  createdAt: string;
  updatedAt: string;
  run: { seed: number; setup: RunSetup; commands: Command[] };
  state: GameState; // snapshot for instant resume
}
```

- Saved after every resolved command (not only end of turn), so killing the app mid-turn resumes exactly there.
- Migrations are an ordered list of pure functions `vN → vN+1`, each with a fixture test.
- On load: migrate → validate with Zod → if invalid, fall back to replaying the command log from the seed → if that fails too, show the designed "save could not be restored" state with an option to start a new run. The player never sees a blank screen.

---

## 4. Simulation design

### 4.1 Core numbers (starting point, tuned with the simulator in Phase 3)

- Start: $50,000, 1 founder, optional co-founder from onboarding, 3 action points, garage rent $0, founder salary $0.
- Burn: salaries (monthly) + infra (grows with users, step-wise) + marketing + office.
- Runway = cash ÷ net burn, shown in months; "profitable" replaces it when net burn ≤ 0.
- Valuation: stage-specific blend of revenue multiple and user multiple, scaled by growth rate, quality and reputation, with a small seeded noise term for market mood.

### 4.2 Tensions as formulas

| Tension                                       | Mechanism                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Features attract users, create bugs           | Shipping a feature adds quality and a user bump; adds bugs proportional to team velocity × (1 + tech debt). Bugs raise churn non-linearly.         |
| Hiring speeds progress, burns cash            | Each engineer adds velocity with diminishing returns (communication overhead past 8); salary hits burn immediately, output ramps over 2–3 months.  |
| Marketing a weak product buys users who leave | Paid users carry a "fit" score from quality at acquisition time; low-fit cohorts churn several times faster.                                       |
| Crunch now, resignations later                | Crunch multiplies output this month and adds to the `burnout` meter, which decays slowly and drives resignation rolls weeks later.                 |
| Funding dilutes and costs control             | Every round changes the cap table and may add board seats; board composition plus investor trust decide whether a bad quarter turns into a firing. |
| Shady shortcuts pay now                       | Immediate cash/user gains, plus hidden scandal risk and a scheduled journalist interest roll.                                                      |

### 4.3 Characters

Four recurring characters with trust 0–100 and tiered behaviour:

- **Co-founder** — high trust: covers one action point a month at stage Startup; low trust: threatens to leave with their equity (vesting matters).
- **Lead investor** — high trust: bridge loans and introductions; low trust: pushes for a "professional CEO" and is the swing vote on firing.
- **Rival founder** — trust here means grudging respect: high trust opens a partnership or acquisition offer; low trust means copycat features and poaching.
- **Journalist** — high trust: friendly coverage and a heads-up before a story drops; low trust: digs into anything with scandal risk.

### 4.4 Fundraising negotiation

- The player sets **amount** and **equity offered** with sliders; implied pre-money valuation updates live.
- Each investor has a hidden fair-value range drawn from company metrics plus personality (patience, ego, board-seat appetite).
- After each proposal the investor reacts on a five-step scale (insulted → cool → interested → keen → eager) with a written line, and may add terms (board seat, liquidation preference, pro-rata).
- The player can **push** (better terms, risk of walk-out and trust loss, chance of a competing term sheet if reputation is high) or **settle**. A walk-out locks that investor out for some months.
- Signing applies the cap-table change, board seats and trust changes, and fires the `dealClosed` signal.

### 4.5 Board and firing

Board seats are recorded per round. Each quarter a board-confidence score is computed from growth vs. plan, runway, scandals and lead investor trust. If investor-controlled seats form a majority and confidence stays below the threshold for consecutive quarters, the "Board meeting" event escalates to a vote. The player gets warning entries and can act (raise, cut burn, win back trust) before it happens.

### 4.6 Stage system (extensible)

A stage is data: entry rule, turn unit, which actions/events/policies unlock, delegated tasks, valuation multiples, ending rules. The engine only knows "evaluate the next stage's entry rule". Adding Scale-up later means adding a `Stage` record, its content and, at most, new named formulas. v1 defines `garage`, `startup`, and a terminal `scaleup` whose entry ends the run with the "Reached Scale-up" ending.

Stage entry rules (initial):

- Garage → Startup: 5+ people **and** either a priced round or $20k MRR.
- Startup → Scale-up: 30+ people **and** either $250k MRR with at least 4% monthly user growth, or a valuation of $100M+. The growth condition was added in Phase 3: a company that crawls to 30 people is not a scale-up, and that run ends as a comfortable business at year 15 instead.

Delegation is handled by executives (section 4.7).

### 4.7 Executives (VPs)

From the Startup stage the player can hire VPs. They are the main way the game hands routine work to someone else, and they are characters in their own right.

- **Roles in v1**: VP Engineering, VP Product, VP Sales, VP Marketing, VP People. (CFO, COO and General Counsel arrive with Scale-up.) Garage stage cannot hire VPs, but can hire a "first senior hire" who later expects the VP title — a classic source of drama.
- **Standing orders**: each VP owns one recurring task with a setting the player chooses once and can change later, e.g. VP Engineering splits capacity between features and bug fixing; VP Marketing runs baseline spend at a chosen level; VP Sales picks discount aggressiveness; VP People runs morale upkeep and hiring pipeline; VP Product grooms the roadmap and raises feature quality. This frees action points: the reward for hiring well.
- **Cost**: high salary plus an equity ask from the option pool (diluting the founder indirectly), plus a ramp-up period.
- **Personality**: VP candidates come with 2–3 traits (e.g. _Empire Builder_ hires without asking, _Ex-BigCo_ expects process and budget, _Operator_ is boring and excellent, _Thought Leader_ posts more than they ship). Execution quality varies, so a VP's standing order can be done better or worse than the player would do it.
- **Politics**: VPs have their own trust with the founder; low trust leads to leaks to the journalist, siding with the board, or being poached by the rival founder. A VP who clashes with the co-founder forces a choice. A strong VP team raises board confidence; a revolving door of VPs lowers it.
- **Firing a VP** is expensive (severance, morale hit, a feed story) but sometimes necessary, and the timeline remembers who hired them and why.
- Executives are data (`ExecutiveRole` records with their standing-order options and formulas), so Scale-up's C-suite is added the same way.

### 4.8 Endings and score

- Score = valuation × founder ownership + legacy rating. Legacy is computed from reputation, how employees were treated, scandals, and specific flags (e.g. "kept the free tier").
- Each ending picks a headline from several templates using run facts ("GARAGE STARTUP BURNS $2.1M ON A SMART TOASTER, CALLS IT 'A LEARNING'"). The headline card is rendered as a view and shared as an image.

### 4.9 Systems added during balancing (Phase 3)

The first balance pass showed a careful player almost never failed once launched. These rules give the mid-game real risk, each with a reason a founder would recognise:

- **Logistic growth.** Organic and paid growth slow as you approach the room the market leaves you, instead of compounding forever.
- **The rival takes the market.** Rival pressure builds every month on its own and faster when you grow loudly; it shrinks the room left for you (up to 60%) and adds churn. Slow companies find the market taken.
- **Staleness.** Users expect progress: a launched product that ships nothing for more than four months loses quality. A repeatable "major update" feature keeps the treadmill honest.
- **Board expectations.** Once investors are on the board they expect about 4% monthly growth; flat quarters build board tension. A later venture round with a board seat also adds an independent director.
- **Funding winters.** A world event that cuts valuations, raises churn and closes venture money for a year.
- **Markets sized to the goal.** Each market's room is set so $250k MRR needs roughly 40% of it; free tiers widen the market but each free user is worth less.

### 4.10 Headless simulation

`npm run sim -- --runs 5000 --bot skilled --seed 1` plays runs through the real engine and prints:

- ending distribution, months survived (p10/p50/p90), share reaching Startup and Scale-up, final score distribution;
- per-action usage and win-rate correlation, events seen, and the five most common causes of death;
- optional CSV/JSON output for deeper analysis.

Bots: `random`, `growth`, `frugal`, `shady`, `balanced` (heuristic, plays like a thoughtful human). Bots only see what a player sees: they react to foreshadowing warnings, never to hidden meter values. A test runs a small batch of each bot so balance regressions show up in CI.

Balance after Phase 3 (1,000 runs per bot, `npm run sim`):

| Bot                                                        | Outcome                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| random (a first run)                                       | 96% bankrupt; the rest are small exits                                             |
| growth (spend ahead of revenue, crunch constantly)         | ~100% bankrupt                                                                     |
| frugal (rarely hires)                                      | 92% a comfortable business at year 15, 8% bankrupt                                 |
| shady (careful, but takes shortcuts when things are tight) | 43% scandal collapse, 51% bankrupt, occasionally pays off                          |
| balanced (the stand-in for a skilled player)               | **21% reach Scale-up** (16–24% per market), 47% bankrupt, 32% comfortable business |

---

## 5. Library choices

All versions are the latest stable at the time of writing (October 2026), installed through `npx expo install` so they match the SDK.

| Need          | Choice                                                                                                                          | Why                                                                                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework     | **Expo SDK 57** (React Native 0.86, New Architecture)                                                                           | Latest stable; first-class iOS and Android from one codebase; managed native config, EAS builds.                                                                                                                                                                               |
| Routing       | **expo-router**                                                                                                                 | File-based routing as requested; native stack and tabs; typed routes; sheets via native `formSheet` presentation.                                                                                                                                                              |
| Language      | **TypeScript** (version pinned by SDK 57), `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`                   | Catches most content and engine mistakes at compile time.                                                                                                                                                                                                                      |
| State         | **Zustand 5**                                                                                                                   | Tiny, no provider boilerplate, selector-based subscriptions keep re-renders to the components that read a slice. The store holds the engine state and dispatches commands into the engine; it contains no rules.                                                               |
| Persistence   | **expo-sqlite `kv-store`** behind a `StorageAdapter` interface                                                                  | Fast, synchronous and asynchronous APIs, works in Expo Go, on Android and iOS. Save files are small (tens of KB). MMKV is faster but needs a custom dev build; the adapter makes swapping it in a one-file change if profiling ever asks for it.                               |
| Validation    | **Zod 4**                                                                                                                       | Mature, excellent type inference (content types are derived from schemas, so they cannot drift), readable error reports. Valibot is smaller but startup cost here is negligible.                                                                                               |
| Localisation  | **i18next + expo-localization**                                                                                                 | Industry standard plurals and interpolation, device locale detection. The app calls one small wrapper (`src/ui/i18n.tsx`), so react-i18next was not needed.                                                                                                                    |
| Animation     | **react-native-reanimated 4**                                                                                                   | UI-thread animations at 60 fps, layout animations for feed entries, `useReducedMotion`.                                                                                                                                                                                        |
| Gestures      | **react-native-gesture-handler**                                                                                                | Native gestures for swipe-to-dismiss and sliders.                                                                                                                                                                                                                              |
| Bottom sheets | **In-house `Sheet`** on React Native `Modal` + Reanimated + Gesture Handler; route modals for negotiation and settings          | Changed during Phase 2: @gorhom/bottom-sheet never presented in the web build this environment verifies with. The in-house sheet is ~150 lines, sizes to content, supports swipe-to-dismiss, a pinned footer and reduced motion, and behaves the same on iOS, Android and web. |
| Icons         | **phosphor-react-native**                                                                                                       | One coherent set with consistent weights (regular for UI, fill for selected states), less ubiquitous than Lucide, which helps the "not templated" goal.                                                                                                                        |
| Fonts         | **expo-font** with **@expo-google-fonts/newsreader** and **@expo-google-fonts/ibm-plex-sans**                                   | See design system. Both are open licence and bundled, so the app stays offline.                                                                                                                                                                                                |
| Haptics       | **expo-haptics**                                                                                                                | Works on iOS and Android (Android falls back to its vibration patterns). Wrapped in one `haptics` module that respects a settings toggle.                                                                                                                                      |
| Share card    | **react-native-view-shot + expo-sharing**                                                                                       | Renders the headline card view to an image and opens the native share sheet. Offline.                                                                                                                                                                                          |
| Splash/icon   | **expo-splash-screen**, app config                                                                                              | Native splash with theme-aware background.                                                                                                                                                                                                                                     |
| Tests         | **Vitest** for engine, content, store and simulation; **Playwright** against the web build for screenshots and end-to-end flows | Changed during Phase 2: UI is verified by `npm run screenshots` (every screen, both themes) and `npm run e2e` (onboarding, actions, events, a funding round, resume after reload) instead of jest-expo component tests.                                                        |
| Lint/format   | **ESLint 9 flat config** (`eslint-config-expo` + `typescript-eslint` strict) and **Prettier**                                   | Plus `no-restricted-imports` for the engine boundary and a rule banning `TODO`/`FIXME` comments.                                                                                                                                                                               |
| Scripts       | **tsx**                                                                                                                         | Runs the simulation script directly from TypeScript.                                                                                                                                                                                                                           |
| CI            | GitHub Actions: typecheck, lint, tests, a 500-run simulation smoke                                                              | Cheap, catches regressions before review.                                                                                                                                                                                                                                      |

Deliberately not used: Redux (more ceremony than the problem needs), a UI kit such as Tamagui or NativeBase (fights the bespoke design), styled-components (runtime cost; plain `StyleSheet` with tokens is enough), any analytics, ads, purchases or network library.

---

## 6. Design system

**Direction: Playroom** (chosen after the Phase 4 review: "it doesn't look like a game"). It replaces Daylight, which replaced the earlier "Soft Paper & Terracotta". It is a cosy tycoon game in look and feel:

- Your company is a little isometric office that fills with people.
- Your team are collectible character cards, and the next stage is a quest with progress bars.
- Events are illustrated cards with big coloured choice buttons.
- Everything has thick ink outlines and a raised "3D" bottom edge, so it reads like a game interface rather than a finance app.

Light is cream and sky; dark is a deep arcade purple.

### 6.1 Colour tokens

Semantic tokens live in `src/ui/theme/tokens.ts`; components never use raw values. The one exception is illustration colours (skin, hair, shirts, furniture), which live with the art in `src/ui/game/characterArt.tsx` and `OfficeScene.tsx`. Every text colour, including the five area colours, is tested to meet WCAG AA (4.5:1) on every background in both themes (`tokens.test.ts`).

| Token                                                | Light                               | Dark                   | Use                                                    |
| ---------------------------------------------------- | ----------------------------------- | ---------------------- | ------------------------------------------------------ |
| `canvas`                                             | `#FFF8EC` cream                     | `#170C3A` deep purple  | App background                                         |
| `surface` / `raised`                                 | `#FFFFFF`                           | `#231352` / `#2C1A68`  | Cards, sheets                                          |
| `ink`                                                | `#2A2140`                           | `#0B0520`              | Outlines and raised edges                              |
| `sky`                                                | `#A8DCFF`                           | `#3B22A0`              | Behind the office scene and the HUD                    |
| `accent` / `onAccent`                                | `#FFC43D` yellow / ink              | `#FFD84A` / dark brown | Primary buttons, selected tab, energy, date pill       |
| `up` / `down` / `warn`                               | green / red / amber                 | brighter equivalents   | Deltas, effects, warnings (always with a sign or icon) |
| `product` / `people` / `money` / `world` / `company` | violet / amber / green / blue / red | brighter equivalents   | Area colours: icons, chips, gauges, choice buttons     |

### 6.2 Typography

- **Rubik** throughout. ExtraBold is for titles, big figures and the wordmark, Bold for headlines and button labels, SemiBold for labels and small figures, and Medium for body text. It is clean and modern with slightly soft corners. It replaced Fredoka and Nunito after review, because those read as handwritten.

Scale (pt): display 34, title1 26, title2 19, headline 17, body 16, callout 14, footnote 12.5, label 11.5 uppercase; figures XL 40, L 24, M 17, S 12.5. Dynamic Type scales everything, with caps on dense figures.

### 6.3 Spacing, radii, outlines

- Spacing scale (pt): 2, 4, 8, 12, 16, 20, 24, 32, 40, 56; screen gutter 16; 44 pt minimum touch targets.
- Radii: 8, 12, 18, 22 (cards), 28 (sheets, turn bar), full (chips, pills, avatars).
- Outlines: 2.5 pt ink line. Cards have a 5 pt bottom edge and buttons a 6 pt one. Pressing a button drops it onto its edge. This replaces drop shadows, so it looks the same on iOS, Android and web.

### 6.3b Visual building blocks

- **Office scene** (`OfficeScene`): a cosy studio diorama drawn in SVG from the game state ("Cosy Studio", chosen after review over a side-view tower). It replaced a boxed-in isometric room the review disliked.
  - A floor slab with visible thickness and low back walls, with no box around the room or sky behind it.
  - The room grows with the team (`officeLayout.ts`). Desks sit in a k×k grid, with k the smallest that seats everyone: from 2×2 in the garage up to 6×6, which holds a full Startup. The room expands and the view zooms out as the team grows, and spare desks stay visible as room to hire. Beyond 36 people a "+N" badge shows the rest.
  - Each person sits on a chair behind their desk, facing the viewer, with a laptop, so faces are always visible.
  - The garage has a concrete floor, a roll-up door, boxes, a beanbag, string lights and a whiteboard sketch.
  - The Startup office has a wooden floor, windows, a whiteboard with a growth chart, a poster, a bookshelf, a sofa, a rug, a floor lamp, plants and a coffee machine.
  - A server rack appears in the back corner after launch.
  - Two people say a line that matches team morale, changing each month.
- **Characters** (`characterArt`): semi-realistic flat portraits. Their look is seeded by the person's name, so it is stable.
  - Natural head-to-shoulder proportions, a face with jaw, chin and neck, and soft shading on one side.
  - Almond eyes with coloured irises and lids, shaped brows, a nose and lips. Mood shows subtly: a smile with teeth, a relaxed mouth, or raised inner brows and a frown.
  - Outlines are darker tones of skin, hair and fabric, not black ink.
  - Ten hairstyles, eight hair colours, six skin tones and six eye colours, with optional glasses, beard and earrings.
  - Outfits follow the job (`outfitFor`): hoodies for engineers, collared shirts for sales and people ops, blazers with ties for executives. Shirt colour shows the area they work in.
  - **Age** (`ages.ts`): startups are mostly students.
    - Founders, the co-founder and every hire whose role opens in the Garage are young: rounder, fuller faces, bigger eyes, no grey hair or beards.
    - Roles that open at Startup bring older people as the company grows: VPs are adults or seniors (grey hair, smile lines, more glasses and beards), people partners are adults.
    - Of the other characters, the investor is senior; the rival and the journalist are adults.
    - Age comes from role and name, so a candidate looks the same after hiring.
  - Earlier chibi and cute versions were replaced after review ("scary", then "make them look more real").
- **Crew cards**: portrait, role badge, skill stars and name, in a horizontal row on Home.
- **Quest card**: the next stage's entry rule, read from the stage data, as goals with progress bars.
- **HUD**: cash and users pills, date pill and settings over the sky.
- **Event cards**: an art panel with the person involved on a sunburst, a kicker chip, then choices as big buttons in area colours with solid effect chips.
- **Shared pieces**: ring gauges, energy bolts for moves, outlined icon tiles, outlined chips.
- **Effect chips** preview what an option does ("Cash −$10k", "A gamble", "Comes back later"). Hidden pressures are hinted ("Scandal risk"), never quantified.

### 6.4 Motion

| Token     | Duration                              | Easing                | Use                         |
| --------- | ------------------------------------- | --------------------- | --------------------------- |
| `instant` | 100 ms                                | standard              | Press feedback              |
| `quick`   | 180 ms                                | standard              | Toggles, chips              |
| `base`    | 260 ms                                | emphasized-decelerate | Feed entry in, cards        |
| `slow`    | 420 ms                                | emphasized            | Stage change, ending reveal |
| `count`   | 600 ms (scaled by magnitude, max 900) | decelerate            | Number count-ups            |
| `sheet`   | spring (damping 22, stiffness 240)    | —                     | Bottom sheets               |

Easings: standard `cubic-bezier(0.2, 0, 0, 1)`, emphasized-decelerate `(0.05, 0.7, 0.1, 1)`, accelerate `(0.3, 0, 1, 1)`. With reduced motion on, translations and scales become short opacity cross-fades and numbers update without counting.

### 6.5 Haptics map

`turnEnd` medium impact · `dealClosed` success notification · `disaster` error notification · `stageChange` and run end heavy impact · taps light impact · slider detents, segmented controls, tabs and options selection tick · destructive confirm warning (when the sheet opens) · warning toasts warning. All behind one module (`src/platform/haptics.ts`) and a settings toggle; web has none.

### 6.5b Motion as built (Phase 4)

Presses shrink to 97% and spring back; rings and progress bars glide to new values; cash, users and revenue count up; new feed cards slide in one after another; the month in the turn bar slides in when time moves; a stage-up sheet celebrates reaching Startup and lists what changed; the ending reveals its headline, figures and grade in sequence; the launch screen fades out. Every one of these drops to an instant change with reduced motion (system setting or the in-app override).

### 6.6 Components (all shown on the hidden style guide)

Stat bar and stat cell (with animated value and delta), runway meter, feed entry (variants: news, foreshadow, consequence, milestone, character quote), action row and action sheet, event sheet with option buttons (including locked options showing why), candidate card with traits, employee row, character card with trust meter, slider with detents and live readout, negotiation reaction strip, timeline entry with cause link, stage progress, ownership donut (single-series, accessible), segmented control, primary/secondary/tertiary/destructive buttons, tag/chip, toggles, list section header with the editorial rule, empty state, loading skeleton, error state, toast, headline card.

The style guide is a route (`/dev/style-guide`) opened by tapping the version number in Settings seven times. It renders every component in every state, in both themes, and at large Dynamic Type sizes.

---

## 7. Screens

Every screen below has designed empty, loading and error states; listed only where they are not obvious.

### 7.1 Launch and onboarding

- **Splash** → **Title**: wordmark, "New run" and "Continue" (Continue shows company name, month and cash). If a save failed to restore: explanation, "Start fresh".
- **Founder background**: four cards, one per screen width, swipeable. Proposed: _The Engineer_ (higher quality, weaker pitch), _The Operator / MBA_ (better fundraising, worse product), _The Designer_ (reputation and user love, slower shipping), _The Second-Timer_ (investor trust, but your last startup's reputation follows you). Each shows bonuses, a drawback and its unique action.
- **The idea**: pick a market from a short list (each with a satirical one-liner and different user/revenue curves) and a business model (subscription, freemium, ads, marketplace).
- **Name your startup**: text field with a "Suggest" button drawing from a name generator (with a few deliberately terrible suggestions); validation for empty and length.
- **Co-founder**: choose one of three co-founder candidates or go solo (affects starting equity and the co-founder character).
- First turn opens with a short tutorial expressed as feed entries, not modal overlays.

### 7.1b Navigation as built

Six bottom tabs: Feed plus the five content tabs (Product, People, Money, World, Company). The stats bar sits above every tab and the turn bar (moves left, date, Next month) sits above the tab bar on every tab, so time can be advanced from anywhere.

### 7.2 Main (Feed)

- Top: stat bar — cash (with runway in months beneath), users, quality, morale, reputation. Tap any stat for a detail sheet with history sparkline and what is moving it.
- Middle: story feed, grouped by month, newest at the bottom like a ticker you read downward; the current month's entries animate in after a turn resolves. Foreshadowing entries carry a small warn marker; consequence entries link to their cause.
- Bottom: action point pips and the **Next month** button in the thumb zone above the tab bar. If an event is pending, the button becomes "Respond" and opens the event sheet. Long-press on "Next month" with points unspent asks for confirmation (with a "don't ask again" setting).
- Empty state (month 1): a founder's first-day note.

### 7.3 Product tab

Roadmap (feature slots with progress and bug cost), bug and tech-debt panel (with "fix bugs", "refactor"), pricing (slider, live preview of conversion and churn effect), business model, launch (pre-launch only; changes to "Relaunch" or "Big update" after).

### 7.4 People tab

Team list with roles, morale and traits. Hiring: candidate cards (swipe or tap) showing role, salary ask, equity ask and 2–3 traits, some hidden until hired or until you run a "reference check". Per-employee actions sheet (raise, promote, give equity, 1:1, fire). Policies (remote, crunch, unlimited PTO, equity for all, …) with long-tail effects described honestly but vaguely.

### 7.5 Money tab

Runway chart (cash projection with best/worst band), revenue vs. burn, cap table summary, investor list with trust and status, "Raise money" → negotiation. Also loans and grants at Garage stage, cost-cutting actions.

### 7.6 Negotiation (full-height sheet)

Investor portrait block and personality line; two sliders (amount, equity) with implied valuation and dilution shown live; reaction strip and quote after each proposal; added terms as chips that can be tapped for an explanation; actions: Propose, Push, Settle, Walk away. Closing animates the cap table change and fires the deal haptic.

### 7.7 World tab

Rivals (their latest moves, feature parity), press (journalist relationship, recent coverage, upcoming story warnings), the four characters with trust and current stance, and **Shady options** — a visually quieter section with a different heading treatment ("Things a reasonable founder wouldn't do"), each showing the immediate gain and a deliberately vague "risk" line.

### 7.8 Company tab

Stage and progress to next stage (requirements checklist), ownership (founder %, board seats and who holds them), culture policies in force, and the **timeline**: chronological, filterable (all / decisions / consequences), each consequence linked to its cause.

### 7.9 Event sheet

Non-dismissable for mandatory events (swipe-down nudges and bounces back; accessibility action explains why). Title (serif), body, 3–4 options. Locked options are visible, dimmed, with the reason ("Requires a lawyer on staff"), which teaches the player that earlier choices open doors. Choosing animates the immediate consequences into the stat bar.

### 7.10 Ending and run summary

Full-screen newspaper front page: masthead with fictional paper name, date, the generated headline, sub-deck, a short article written from run facts. Below: score breakdown (valuation × ownership + legacy), key moments from the timeline, and "Share headline" and "New run".

### 7.11 Settings

Theme (system/light/dark), haptics, reduced motion override, confirm before ending turn, text size preview, "Abandon run", credits and licences, version (style guide entry).

---

## 8. Repository layout

```
app/                       expo-router routes (thin: compose screens from src/ui)
  (onboarding)/ (game)/(tabs)/ ending.tsx settings.tsx dev/style-guide.tsx
src/
  engine/                  pure TS: rng, state, commands, pipeline/, formulas/, conditions, effects
  content/                 schemas/, data/ (actions, events, traits, characters, stages, ...), index.ts
  locales/en/              feed.json, events.json, actions.json, ui.json, ...
  store/                   zustand store, persistence adapter, migrations
  ui/                      tokens/, theme/, components/, screens/, hooks/
  platform/                haptics, share, storage implementations
scripts/simulate.ts        headless balance runner
tests/                     cross-cutting tests (replay determinism, content integrity)
```

Small focused files (target < 200 lines), one component or rule per file. Commits are scoped and descriptive (`engine: add churn by cohort fit`).

---

## 9. Verification

This session runs in a Linux cloud container, so I cannot run the iOS Simulator here. What I can do every phase:

- Engine and content: typecheck, lint, unit tests, simulation runs (full verification).
- UI: run the app through Expo's web target and drive it with Playwright (Chromium is available) to take screenshots of every screen in both themes and at large text sizes, and check layouts, states and flows. This catches most layout and logic problems but is not a substitute for a device: native sheets, haptics, fonts rendering and 60 fps need a real iPhone.
- Accessibility: `npm run e2e` audits every screen it visits (title, onboarding, all six tabs, an event, negotiation, settings): each control must have a spoken name and a 44 pt target, and each screen a heading.
- Performance budgets: on a 15-year run a month resolves in under 4 ms (median 0.6 ms) on the container, saving takes about 1 ms, and a test keeps the save under 300 KB because the game saves after every move.
- For device checks I will keep the app runnable in **Expo Go** (hence expo-sqlite rather than MMKV), so you can scan a QR code from `npx expo start` on your machine and play it on your phone at each review.

---

## 10. Decisions (agreed)

Phase 1 review answers (my recommendations, accepted): frugal play that survives 15 years is a modest success; shady play is a real gamble rather than a trap; balance is tuned in Phase 3.

1. **Visual direction**: first Soft Paper & Terracotta, then Daylight. After the Phase 4 review ("it doesn't look like a game") it is **Playroom** (section 6). This mixes two mockups: the living office scene from "Living Office", and the character cards, quest bar and card-style events from "Arcade Cards".
2. **Device verification**: Expo Go on your phone at each review; web + Playwright screenshots in this environment.
3. **Feed**: with the Daylight redesign, Home is a dashboard with the month's news as cards below it, newest month first. The Next month button floats above the tab bar on every tab.
4. **Markets**: four markets with different curves (B2B SaaS, consumer social, marketplace, hardware).
5. **Confirmed**: four founder backgrounds (Engineer, Operator, Designer, Second-Timer); placeholder bundle id `com.runway.game`; Scale-up (30 people and $250k MRR, or $100M valuation) ends a v1 run; acquisition offers from the Startup stage; VP executives added (section 4.7).
