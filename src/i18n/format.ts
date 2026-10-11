/** Number formatting shared by every locale-aware surface. */
export function formatMoney(value: number, locale: string): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const digits = millions >= 100 ? 0 : millions >= 10 ? 1 : 2;
    return `${sign}$${millions.toLocaleString(locale, { maximumFractionDigits: digits })}M`;
  }
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000).toLocaleString(locale)}k`;
  return `${sign}$${Math.round(abs).toLocaleString(locale)}`;
}

export function formatNumber(value: number, locale: string): string {
  return Math.round(value).toLocaleString(locale);
}

export function formatDelta(value: number, locale: string): string {
  const rounded = Math.round(value);
  if (rounded === 0) return '±0';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toLocaleString(locale)}`;
}

export function formatBps(bps: number, locale: string): string {
  return `${(bps / 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
}

/** Short counts for tight spaces: 950, 12.3k, 4.1M. */
export function formatCompact(value: number, locale: string): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}M`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 1000).toLocaleString(locale)}k`;
  if (abs >= 1000)
    return `${sign}${(abs / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}k`;
  return `${sign}${Math.round(abs).toLocaleString(locale)}`;
}
