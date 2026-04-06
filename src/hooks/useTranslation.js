import { useCallback } from 'react';
import { useLocaleStore } from '../store/localeStore';
import { messages } from '../i18n/messages';

function getValue(tree, path) {
  const parts = path.split('.');
  let node = tree;
  for (const p of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[p];
  }
  return node;
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const t = useCallback(
    (key, vars) => {
      const primary = locale === 'en' ? messages.en : messages.fr;
      const fallback = locale === 'en' ? messages.fr : messages.en;
      let value = getValue(primary, key) ?? getValue(fallback, key);
      if (typeof value !== 'string') return typeof value === 'number' ? String(value) : key;
      if (vars && typeof value === 'string') {
        return value.replace(/\{(\w+)\}/g, (_, k) =>
          vars[k] != null ? String(vars[k]) : `{${k}}`
        );
      }
      return value;
    },
    [locale]
  );

  /** Tableaux (mois, phases…) */
  const tm = useCallback(
    (key) => {
      const primary = locale === 'en' ? messages.en : messages.fr;
      const fallback = locale === 'en' ? messages.fr : messages.en;
      const value = getValue(primary, key) ?? getValue(fallback, key);
      return Array.isArray(value) ? value : [];
    },
    [locale]
  );

  const chartMonths = useCallback(
    (count) => {
      const key = count >= 6 ? 'chart.months6' : 'chart.months5';
      const arr = tm(key);
      if (arr.length) return arr;
      return count >= 6
        ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin']
        : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];
    },
    [tm]
  );

  return { t, tm, chartMonths, locale, setLocale };
}
