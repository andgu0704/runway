import actions from './actions.json';
import eventsMore from './events.more.json';
import events from './events.json';
import feed from './feed.json';
import terms from './terms.json';
import ui from './ui.json';
import world from './world.json';

type Tree = { [key: string]: unknown };

function isTree(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Merges nested resource objects; later sources win on leaf conflicts. */
function deepMerge(...sources: Tree[]): Tree {
  const out: Tree = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      const existing = out[key];
      out[key] = isTree(existing) && isTree(value) ? deepMerge(existing, value) : value;
    }
  }
  return out;
}

export const en = deepMerge(world, actions, events, eventsMore, feed, terms, ui) as typeof world &
  typeof actions &
  typeof events &
  typeof eventsMore &
  typeof feed &
  typeof terms &
  typeof ui;
