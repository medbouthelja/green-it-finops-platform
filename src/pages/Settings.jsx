import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { User, Bell, Lock, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadPersistedSettings, persistSettingsPatch } from '../utils/appSettings';
import { useTranslation } from '../hooks/useTranslation';
import { useLocaleStore } from '../store/localeStore';

function buildFormState() {
  const u = authService.getCurrentUser();
  const persisted = loadPersistedSettings();
  return {
    email: u?.email || '',
    firstName: u?.firstName ?? '',
    lastName: u?.lastName ?? '',
    notifications: {
      email: persisted.notifications?.email !== false,
      budgetAlerts: persisted.notifications?.budgetAlerts !== false,
      projectUpdates: persisted.notifications?.projectUpdates !== false,
    },
    language: persisted.language || 'fr',
    timezone: persisted.timezone || 'Europe/Paris',
  };
}

const Settings = () => {
  const { t } = useTranslation();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState(() => buildFormState());

  useEffect(() => {
    setFormData(buildFormState());
  }, [user?.id, user?.email]);

  const persistLocalSettings = useCallback((patch) => {
    persistSettingsPatch(patch);
  }, []);

  const handleSaveProfile = () => {
    if (!user) {
      toast.error(t('settings.mustLogin'));
      return;
    }
    const ok = updateProfile({
      email: formData.email.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
    });
    if (ok) {
      toast.success(t('settings.toastProfile'));
    }
  };

  const handleSaveNotifications = () => {
    persistLocalSettings({ notifications: formData.notifications });
    toast.success(t('settings.toastNotif'));
  };

  const handleSavePreferences = () => {
    persistLocalSettings({
      language: formData.language,
      timezone: formData.timezone,
    });
    setLocale(formData.language);
    toast.success(t('settings.toastPrefs'));
  };

  const handleSaveSecurity = () => {
    toast(t('settings.toastPasswordInfo'), {
      icon: 'ℹ️',
    });
  };

  const onLanguageChange = (value) => {
    setLocale(value);
    setFormData((prev) => {
      persistLocalSettings({ language: value, timezone: prev.timezone });
      return { ...prev, language: value };
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <User size={20} />
                <span>{t('settings.tabs.profile')}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'notifications' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell size={20} />
                <span>{t('settings.tabs.notifications')}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'security' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock size={20} />
                <span>{t('settings.tabs.security')}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'preferences' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe size={20} />
                <span>{t('settings.tabs.preferences')}</span>
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">{t('settings.profileTitle')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.email')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.firstName')}</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.lastName')}</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.role')}</label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="input-field bg-gray-50"
                    />
                  </div>
                  {user?.company?.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.company')}</label>
                      <input
                        type="text"
                        value={user.company.name}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                  )}
                </div>
                <button type="button" onClick={handleSaveProfile} className="btn-primary">
                  {t('settings.saveProfile')}
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">{t('settings.notifTitle')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{t('settings.notifEmail')}</p>
                      <p className="text-sm text-gray-600">{t('settings.notifEmailDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: { ...formData.notifications, email: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{t('settings.notifBudget')}</p>
                      <p className="text-sm text-gray-600">{t('settings.notifBudgetDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications.budgetAlerts}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: { ...formData.notifications, budgetAlerts: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{t('settings.notifProject')}</p>
                      <p className="text-sm text-gray-600">{t('settings.notifProjectDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications.projectUpdates}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            notifications: { ...formData.notifications, projectUpdates: e.target.checked },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                </div>
                <button type="button" onClick={handleSaveNotifications} className="btn-primary">
                  {t('settings.saveProfile')}
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">{t('settings.securityTitle')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.currentPassword')}</label>
                    <input type="password" className="input-field" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.newPassword')}</label>
                    <input type="password" className="input-field" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.confirmPassword')}</label>
                    <input type="password" className="input-field" placeholder="••••••••" />
                  </div>
                </div>
                <button type="button" onClick={handleSaveSecurity} className="btn-primary">
                  {t('settings.changePassword')}
                </button>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">{t('settings.preferencesTitle')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.language')}</label>
                    <select
                      className="input-field"
                      value={formData.language}
                      onChange={(e) => onLanguageChange(e.target.value)}
                    >
                      <option value="fr">{t('settings.french')}</option>
                      <option value="en">{t('settings.english')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.timezone')}</label>
                    <select
                      className="input-field"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    >
                      <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={handleSavePreferences} className="btn-primary">
                  {t('settings.saveProfile')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
