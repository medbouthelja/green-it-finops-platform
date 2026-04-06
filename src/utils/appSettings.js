export const SETTINGS_STORAGE_KEY = 'greenit_app_settings_v1';

export function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function persistSettingsPatch(patch) {
  const prev = loadPersistedSettings();
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...prev, ...patch }));
}
