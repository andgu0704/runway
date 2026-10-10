import actions from './actions.json';
import events from './events.json';
import feed from './feed.json';
import world from './world.json';

export const en = { ...world, ...actions, ...events, ...feed };
