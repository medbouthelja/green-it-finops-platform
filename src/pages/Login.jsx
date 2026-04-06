import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getHomePath } from '../utils/roles';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import AuroraBackground from '../components/AuroraBackground';
import TextType from '../components/TextType';
import { useTranslation } from '../hooks/useTranslation';
import { messages } from '../i18n/messages';

const Login = () => {
  const { t, locale } = useTranslation();
  const welcomeTexts = useMemo(
    () => messages[locale]?.login?.welcomeRotate ?? messages.fr.login.welcomeRotate,
    [locale]
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success(t('login.toastSuccess'));
      navigate(getHomePath());
    } else {
      toast.error(result.error || t('login.toastError'));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AuroraBackground />
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/20 border border-white/30 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-950/30 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/25 border border-white/40 rounded-full mb-4">
              <Leaf className="text-emerald-200" size={32} />
            </div>
            <TextType texts={welcomeTexts} className="text-emerald-100 font-medium tracking-wide mb-3" />
            <h1 className="text-3xl font-bold text-white mb-2">{t('layout.brand')}</h1>
            <p className="text-emerald-100/90">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                {t('login.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary-500 disabled:hover:to-emerald-500"
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/80 space-y-2">
            <p className="text-xs max-w-md mx-auto leading-relaxed">{t('login.accountsHint')}</p>
            <p className="text-xs max-w-sm mx-auto">{t('login.backendHint')}</p>
            <p className="text-xs max-w-sm mx-auto text-white/70">{t('login.demoUsersHint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
