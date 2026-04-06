import { create } from 'zustand';
import { loadPersistedSettings, persistSettingsPatch, SETTINGS_STORAGE_KEY } from '../utils/appSettings';

function readLanguage() {
  const p = loadPersistedSettings();
  return p.language === 'en' ? 'en' : 'fr';
}

export const useLocaleStore = create((set) => ({
  locale: typeof window !== 'undefined' ? readLanguage() : 'fr',

  setLocale: (lang) => {
    const locale = lang === 'en' ? 'en' : 'fr';
    set({ locale });
    persistSettingsPatch({ language: locale });
    try {
      window.dispatchEvent(new CustomEvent('greenit-locale-changed', { detail: { locale } }));
    } catch {
      /* ignore */
    }
  },

  /** Relecture du localStorage (ex. autre onglet) */
  syncFromStorage: () => set({ locale: readLanguage() }),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_STORAGE_KEY) {
      useLocaleStore.getState().syncFromStorage();
    }
  });
}
