import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
};

export const formatHours = (hours) => {
  return `${hours.toFixed(2)}h`;
};

export const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};


