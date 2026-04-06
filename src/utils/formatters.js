import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocaleStore } from '../store/localeStore';

function uiLocale() {
  return useLocaleStore.getState().locale === 'en' ? 'en' : 'fr';
}

function dfLocale() {
  return uiLocale() === 'en' ? enUS : fr;
}

export const formatCurrency = (amount) => {
  const loc = uiLocale() === 'en' ? 'en-US' : 'fr-FR';
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'P', { locale: dfLocale() });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'Pp', { locale: dfLocale() });
};

export const formatHours = (hours) => {
  return `${hours.toFixed(2)}h`;
};

export const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};


