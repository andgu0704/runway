# Runway

A turn-based startup simulator for iOS and Android. You start with $50,000 and an idea and try to grow a garage project into a company that matters, one month at a time.

See [PLAN.md](PLAN.md) for the architecture, design system and roadmap.

## Status

Phase 1 (engine) is complete: the Garage and Startup stages play fully headlessly. The app interface arrives in Phase 2.

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

## Commands

```sh
npm install
npm test                 # unit tests
npm run check            # typecheck, lint, format check and tests
npm run sim              # 1,000 runs per bot, outcome distributions
npm run sim -- --runs 5000 --bot balanced --market saas --out sim-output/balanced.json
```

The same seed and the same commands always produce the same run, so any run can be replayed exactly from its command log.
