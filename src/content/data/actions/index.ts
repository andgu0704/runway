import { companyActions } from './company';
import { moneyActions } from './money';
import { peopleActions } from './people';
import { productActions } from './product';
import { worldActions } from './world';

export const actions = [
  ...productActions,
  ...peopleActions,
  ...moneyActions,
  ...worldActions,
  ...companyActions,
];
