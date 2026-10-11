import type { Tab } from '../../content/schema/ids';
import type { FeedEntry } from '../../engine';
import type { IconName } from '../components/Icon';
import type { Category, ColorName } from '../theme/tokens';

export interface Visual {
  icon: IconName;
  color: ColorName;
}

export const TAB_CATEGORY: Record<Tab, Category> = {
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

/** One icon per move; anything unlisted falls back to its tab's icon. */
const ACTION_ICONS: Record<string, IconName> = {
  buildFeature: 'rocket',
  bugBash: 'bug',
  refactor: 'wrench',
  crunch: 'lightning',
  userInterviews: 'chats',
  launch: 'megaphone',
  setPrice: 'target',
  securityReview: 'shield',
  switchModel: 'swap',
  hackathon: 'flask',
  allNighter: 'moon',
  designSprint: 'brush',
  openRole: 'briefcase',
  hire: 'userPlus',
  fire: 'userMinus',
  oneOnOne: 'user',
  giveRaise: 'dollar',
  grantEquity: 'percent',
  teamOffsite: 'mountains',
  setPolicy: 'scroll',
  setOrder: 'strategy',
  cofounderTalk: 'chat',
  layoffs: 'door',
  oldNetwork: 'phone',
  pitchAngels: 'sparkle',
  raiseRound: 'handshake',
  callInAFavour: 'phone',
  applyForGrant: 'bank',
  setMarketingBudget: 'megaphone',
  cutCosts: 'scissors',
  investorUpdate: 'envelope',
  bridgeLoan: 'bank',
  creditCards: 'card',
  pitchJournalist: 'newspaper',
  coffeeWithJournalist: 'coffee',
  messageRival: 'chat',
  conferenceTalk: 'mic',
  fakeReviews: 'star',
  spamGrowthHack: 'send',
  inflateMetrics: 'chartBar',
  sellUserData: 'database',
  poachFromRival: 'userSwitch',
  writeValues: 'compass',
  retainLawyer: 'scales',
  boardDinner: 'dinner',
  donateToCause: 'heart',
};

const TAB_ICONS: Record<Tab, IconName> = {
  product: 'product',
  people: 'people',
  money: 'money',
  world: 'world',
  company: 'company',
};

export function actionVisual(id: string, tab: Tab, shady: boolean): Visual {
  return { icon: ACTION_ICONS[id] ?? TAB_ICONS[tab], color: shady ? 'warn' : TAB_CATEGORY[tab] };
}

/** Feed items read as icon cards; the icon says what kind of news it is before you read it. */
export function feedVisual(entry: FeedEntry): Visual {
  const key = entry.key;
  if (entry.tone === 'warn' || key.startsWith('meter.')) return { icon: 'warning', color: 'warn' };
  if (key.startsWith('feed.monthClosed')) return { icon: 'calendar', color: 'textSecondary' };
  if (key === 'feed.shipped' || key === 'feed.autoQueued')
    return { icon: 'rocket', color: 'product' };
  if (key === 'feed.launched') return { icon: 'megaphone', color: 'product' };
  if (key === 'feed.hired' || key === 'feed.pipelineCandidates')
    return { icon: 'userPlus', color: 'people' };
  if (
    key === 'feed.resigned' ||
    key === 'feed.poached' ||
    key === 'feed.fired' ||
    key === 'feed.layoffs'
  ) {
    return { icon: 'userMinus', color: 'down' };
  }
  if (key === 'feed.traitRevealed') return { icon: 'user', color: 'people' };
  if (key === 'feed.cofounderLeft') return { icon: 'door', color: 'down' };
  if (key === 'feed.dealClosed' || key === 'feed.boardSeatAdded')
    return { icon: 'handshake', color: 'money' };
  if (
    key.startsWith('feed.negotiation') ||
    key === 'feed.investorWalked' ||
    key === 'feed.youWalked' ||
    key === 'feed.noInvestors'
  ) {
    return { icon: 'handshake', color: 'money' };
  }
  if (key === 'feed.stageReached' || key.startsWith('ending.'))
    return { icon: 'trophy', color: 'company' };
  if (key.startsWith('feed.intro')) return { icon: 'flag', color: 'company' };
  if (key.startsWith('consequence.'))
    return { icon: 'history', color: entry.tone === 'good' ? 'up' : 'down' };
  if (key.startsWith('event.'))
    return {
      icon: entry.tone === 'bad' ? 'fire' : 'lightning',
      color: entry.tone === 'bad' ? 'down' : 'world',
    };
  if (key.startsWith('action.')) {
    const id = key.split('.')[1] ?? '';
    return { icon: ACTION_ICONS[id] ?? 'check', color: 'textSecondary' };
  }
  return { icon: 'info', color: 'textSecondary' };
}

/** Event sheets get an icon from the event's mood. */
export function eventVisual(tone: FeedEntry['tone'], disaster: boolean): Visual {
  if (disaster) return { icon: 'warning', color: 'down' };
  if (tone === 'good' || tone === 'milestone') return { icon: 'star', color: 'up' };
  if (tone === 'bad') return { icon: 'fire', color: 'down' };
  if (tone === 'warn') return { icon: 'warning', color: 'warn' };
  return { icon: 'lightning', color: 'world' };
}

/** People are coloured by the part of the company they work in. */
export function roleColor(role: string): ColorName {
  if (
    role === 'engineer' ||
    role === 'vpEngineering' ||
    role === 'designer' ||
    role === 'vpProduct'
  )
    return 'product';
  if (role === 'marketer' || role === 'vpMarketing') return 'company';
  if (role === 'salesRep' || role === 'vpSales') return 'money';
  if (role === 'support') return 'world';
  return 'people';
}

export const BACKGROUND_VISUALS: Record<string, Visual> = {
  engineer: { icon: 'wrench', color: 'product' },
  operator: { icon: 'briefcase', color: 'money' },
  designer: { icon: 'brush', color: 'company' },
  secondTimer: { icon: 'history', color: 'world' },
};

export const MARKET_VISUALS: Record<string, Visual> = {
  saas: { icon: 'chartBar', color: 'product' },
  social: { icon: 'chats', color: 'company' },
  marketplace: { icon: 'storefront', color: 'money' },
  hardware: { icon: 'device', color: 'world' },
};

export const MODEL_VISUALS: Record<string, Visual> = {
  subscription: { icon: 'calendar', color: 'product' },
  freemium: { icon: 'gift', color: 'company' },
  ads: { icon: 'megaphone', color: 'world' },
  takeRate: { icon: 'percent', color: 'money' },
  deviceSubscription: { icon: 'device', color: 'people' },
};
