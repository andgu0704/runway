import actions from './actions.json';
import events from './events.json';
import feed from './feed.json';
import terms from './terms.json';
import ui from './ui.json';
import world from './world.json';

export const en = { ...world, ...actions, ...events, ...feed, ...terms, ...ui };
