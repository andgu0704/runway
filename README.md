# Runway

A turn-based startup simulator for iOS and Android. You start with $50,000 and an idea and try to grow a garage project into a company that matters, one month at a time.

See [PLAN.md](PLAN.md) for the architecture, design system and roadmap.

## Status

Phases 1–4 are complete: the engine, the full app interface, the content and balance pass for the Garage and Startup stages, and the polish pass (motion, haptics, accessibility audit, app icon and launch screen, performance budgets). After review the interface was restyled as a game ("Playroom"): a living office scene, character cards, a stage quest and card-style events. What remains for version 1 is checking feel and frame rate on a real iPhone through Expo Go.

## Layout

| Path                  | What lives there                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/engine`          | The game rules. Pure, deterministic TypeScript driven by a seeded RNG. No UI or platform code.         |
| `src/content`         | Typed game content (actions, events, traits, characters, stages) and the Zod schemas that validate it. |
| `src/locales`         | Every player-facing string, keyed by content id.                                                       |
| `src/i18n`            | Rendering of engine messages into text, with number and money formatting.                              |
| `src/save`            | Versioned save format, migrations and recovery by replay.                                              |
| `src/sim`             | Bot strategies and the run loop used by the simulator and tests.                                       |
| `scripts/simulate.ts` | Headless balance runner.                                                                               |
| `scripts/icons.ts`    | Draws the app icon, adaptive icon, launch mark and favicon into `assets/images`.                       |

## Commands

```sh
npm install
npx expo start           # then scan the QR code with Expo Go on your phone
npm test                 # unit tests
npm run check            # typecheck, lint, format check and tests
npm run sim              # 1,000 runs per bot, outcome distributions
npm run sim -- --runs 5000 --bot balanced --market saas --out sim-output/balanced.json
npm run sim -- --trace --bot balanced --seed 4   # read one run as a story
npm run export:web && npm run screenshots && npm run e2e   # e2e includes an accessibility audit
npm run icons            # redraw the app icon, launch mark and favicon from the palette
```

The same seed and the same commands always produce the same run, so any run can be replayed exactly from its command log.
