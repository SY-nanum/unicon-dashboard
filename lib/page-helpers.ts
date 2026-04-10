// Shared helpers to reduce boilerplate in sector chart pages.
// Each page still has its own file, but common patterns are extracted here.

import type { Lang } from '@/lib/i18n';
import { DEFAULT_LANG } from '@/lib/i18n';

/** Extract lang and region from page searchParams */
export function parseLangRegion(params: { region?: string; lang?: string }) {
  return {
    lang: (params.lang as Lang) || DEFAULT_LANG,
    countryCode: params.region || 'KOR',
  };
}

/**
 * Build localized label map + stack order + color map from i18n keys.
 *
 * Usage:
 *   const VARIABLE_KEYS = { 'Capacity|Steel|BF-BOF': 'tech.bf-bof', ... };
 *   const ORDER_KEYS = ['tech.bf-bof', 'tech.eaf', 'tech.dri-h2'];
 *   const COLOR_MAP = { 'tech.bf-bof': '#1e3a5f', ... };
 *   const { labels, order, colors } = buildLocalizedMaps(VARIABLE_KEYS, ORDER_KEYS, COLOR_MAP, lang);
 */
export function buildLocalizedMaps(
  variableKeys: Record<string, string>,
  orderKeys: string[],
  colorMap: Record<string, string>,
  lang: Lang,
  tFn: (key: string, lang: Lang) => string,
) {
  const labels: Record<string, string> = {};
  for (const [variable, i18nKey] of Object.entries(variableKeys)) {
    labels[variable] = tFn(i18nKey, lang);
  }

  const order = orderKeys.map((k) => tFn(k, lang));

  const colors: Record<string, string> = {};
  for (const [i18nKey, color] of Object.entries(colorMap)) {
    colors[tFn(i18nKey, lang)] = color;
  }

  return { labels, order, colors };
}
