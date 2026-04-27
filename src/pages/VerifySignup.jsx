import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import AuroraBackground from '../components/AuroraBackground';
import TextType from '../components/TextType';
import { useTranslation } from '../hooks/useTranslation';
import { messages } from '../i18n/messages';

const VerifySignup = () => {
  const { t, locale } = useTranslation();
  const welcomeTexts = useMemo(
    () => messages[locale]?.login?.welcomeRotate ?? messages.fr.login.welcomeRotate,
    [locale]
  );
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifySignup } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const q = searchParams.get('email');
    if (q) setEmail(q);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await verifySignup(email.trim(), code.replace(/\D/g, ''));
    if (result.success) {
      toast.success(t('verifySignup.toastSuccess'));
      navigate('/login');
    } else {
      toast.error(result.error || t('verifySignup.toastError'));
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
            <h1 className="text-3xl font-bold text-white mb-2">{t('verifySignup.title')}</h1>
            <p className="text-emerald-100/90 text-sm">{t('verifySignup.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="vs-email" className="block text-sm font-medium text-white/90 mb-2">
                {t('login.email')}
              </label>
              <input
                id="vs-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="vs-code" className="block text-sm font-medium text-white/90 mb-2">
                {t('login.codeTitle')}
              </label>
              <input
                id="vs-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="input-field text-center text-2xl tracking-[0.4em] font-mono"
                placeholder={t('login.codePlaceholder')}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
              {loading ? t('verifySignup.submitting') : t('verifySignup.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            <Link to="/login" className="text-emerald-200 hover:text-white underline">
              {t('verifySignup.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifySignup;
