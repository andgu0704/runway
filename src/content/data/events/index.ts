import { businessEvents } from './business';
import { characterEvents } from './characters';
import { crisisEvents } from './crises';
import { garageEvents } from './garage';
import { peopleEvents } from './people';
import { pressureEvents } from './pressure';
import { startupEvents } from './startup';

export const events = [
  ...crisisEvents,
  ...pressureEvents,
  ...peopleEvents,
  ...businessEvents,
  ...characterEvents,
  ...startupEvents,
  ...garageEvents,
];
