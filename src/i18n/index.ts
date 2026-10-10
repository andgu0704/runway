import i18next, { type i18n } from 'i18next';
import { en } from '../locales/en';
import { formatBps, formatDelta, formatMoney, formatNumber } from './format';

export const resources = { en: { translation: en } } as const;

/** Message params that hold content ids and are shown by their translated name. */
const ID_PARAMS: Record<string, string> = {
  role: 'role',
  trait: 'trait',
  feature: 'feature',
  policy: 'policy',
  investor: 'investor',
  stage: 'stage',
  model: 'model',
  market: 'market',
  background: 'background',
};

const RUNWAY_INFINITE = 999;

export function createI18n(language = 'en'): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    lng: language,
    fallbackLng: 'en',
    resources,
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  const fmt = instance.services.formatter;
  if (fmt !== undefined) {
    fmt.add('money', (v: number, lng?: string) => formatMoney(v, lng ?? 'en'));
    fmt.add('number', (v: number, lng?: string) => formatNumber(v, lng ?? 'en'));
    fmt.add('delta', (v: number, lng?: string) => formatDelta(v, lng ?? 'en'));
    fmt.add('bps', (v: number, lng?: string) => formatBps(v, lng ?? 'en'));
    fmt.add('runway', (v: number) =>
      v >= RUNWAY_INFINITE
        ? instance.t('ui.runway.profitable')
        : instance.t('ui.runway.months', { count: v }),
    );
  }
  return instance;
}

/** Turns stored params into display params: content ids become names. */
export function displayParams(
  instance: i18n,
  params: Record<string, string | number>,
): Record<string, string | number> {
  const out: Record<string, string | number> = { ...params };
  for (const [key, value] of Object.entries(params)) {
    const ns = ID_PARAMS[key];
    if (ns !== undefined && typeof value === 'string') out[key] = instance.t(`${ns}.${value}.name`);
  }
  if (typeof params.event === 'string') {
    out.event = instance.t(`event.${params.event}.title`, out);
    if (typeof params.option === 'string') {
      out.option = instance.t(`event.${params.event}.option.${params.option}.label`, out);
    }
  }
  return out;
}

/** Renders a message, choosing a wording variant when the key holds several. */
export function renderMessage(
  instance: i18n,
  key: string,
  params: Record<string, string | number>,
  variant = 0,
): string {
  const values = displayParams(instance, params);
  const raw: unknown = instance.t(key, { returnObjects: true });
  if (Array.isArray(raw) && raw.length > 0) {
    return instance.t(`${key}.${variant % raw.length}`, values);
  }
  return instance.t(key, values);
}
