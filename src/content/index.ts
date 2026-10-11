import { actions } from './data/actions';
import { consequences } from './data/consequences';
import { events } from './data/events';
import { features } from './data/features';
import { backgrounds, cofounders } from './data/founders';
import { markets, models } from './data/markets';
import { moreConsequences } from './data/moreConsequences';
import { names } from './data/names';
import { roles } from './data/roles';
import { rules } from './data/rules';
import { endings, stages } from './data/stages';
import { traits } from './data/traits';
import { characters, investors, meters, policies } from './data/world';
import type { ContentPackData } from './schema/records';

export const contentData: ContentPackData = {
  rules,
  models,
  markets,
  backgrounds,
  cofounders,
  stages,
  features,
  roles,
  traits,
  policies,
  meters,
  characters,
  investors,
  actions,
  events,
  consequences: [...consequences, ...moreConsequences],
  endings,
  names,
};
