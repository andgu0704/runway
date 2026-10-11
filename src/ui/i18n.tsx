import { getLocales } from 'expo-localization';
import { useCallback, useMemo } from 'react';
import { loadContent } from '../content/runtime';
import { createI18n, renderMessage } from '../i18n';
import { formatBps, formatCompact, formatDelta, formatMoney, formatNumber } from '../i18n/format';
import { useGame } from '../store/game';

const SUPPORTED = ['en'];
const deviceLanguage = getLocales().at(0)?.languageCode ?? 'en';
const language = SUPPORTED.includes(deviceLanguage) ? deviceLanguage : 'en';

export const i18n = createI18n(language);

export type Params = Record<string, string | number>;

/** Text helpers bound to the current run, so messages can use company and rival names. */
export function useText() {
  const setup = useGame((s) => s.game?.setup);
  const base = useMemo<Params>(() => {
    if (setup === undefined) return {};
    const rival = loadContent().markets.get(setup.market)?.rivalCompany ?? '';
    return { company: setup.companyName, founder: setup.founderName, rival };
  }, [setup]);

  const t = useCallback(
    (key: string, params: Params = {}) => renderMessage(i18n, key, { ...base, ...params }),
    [base],
  );
  const msg = useCallback(
    (key: string, params: Params, variant: number) =>
      renderMessage(i18n, key, { ...base, ...params }, variant),
    [base],
  );
  const name = useCallback(
    (kind: string, id: string) => i18n.t(`${kind}.${id}.name`, base),
    [base],
  );
  return {
    t,
    msg,
    name,
    money: (v: number) => formatMoney(v, language),
    number: (v: number) => formatNumber(v, language),
    compact: (v: number) => formatCompact(v, language),
    delta: (v: number) => formatDelta(v, language),
    percent: (bps: number) => formatBps(bps, language),
  };
}
