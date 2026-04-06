import { messages } from '../i18n/messages';

export function getMockAlerts(locale) {
  const lang = locale === 'en' ? 'en' : 'fr';
  const a = messages[lang].alerts;
  const now = Date.now();
  return [
    {
      id: 1,
      title: a.budgetTitle,
      message: a.budgetMsg,
      severity: 'critical',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: a.optimizeTitle,
      message: a.optimizeMsg,
      severity: 'high',
      read: false,
      createdAt: new Date(now - 3600000).toISOString(),
    },
    {
      id: 3,
      title: a.slowTitle,
      message: a.slowMsg,
      severity: 'medium',
      read: true,
      createdAt: new Date(now - 7200000).toISOString(),
    },
  ];
}
