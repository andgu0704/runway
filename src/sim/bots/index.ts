import { randomBot } from './random';
import { balancedBot, frugalBot, growthBot, shadyBot } from './strategies';
import type { Bot } from './types';

export const bots: Record<string, Bot> = {
  random: randomBot,
  growth: growthBot,
  frugal: frugalBot,
  shady: shadyBot,
  balanced: balancedBot,
};

export type { Bot } from './types';
