import { businessEvents } from './business';
import { crisisEvents } from './crises';
import { peopleEvents } from './people';
import { pressureEvents } from './pressure';

export const events = [...crisisEvents, ...pressureEvents, ...peopleEvents, ...businessEvents];
