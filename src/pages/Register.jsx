import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import AuroraBackground from '../components/AuroraBackground';
import TextType from '../components/TextType';
import { useTranslation } from '../hooks/useTranslation';
import { messages } from '../i18n/messages';

const Register = () => {
  const { t, locale } = useTranslation();
  const welcomeTexts = useMemo(
    () => messages[locale]?.login?.welcomeRotate ?? messages.fr.login.welcomeRotate,
    [locale]
  );

  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, verifySignup } = useAuthStore();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register({ email, password, firstName, lastName });
    if (result.success) {
      toast.success(t('register.toastSuccess'));
      setCode('');
      setStep('code');
    } else {
      toast.error(result.error || t('register.toastError'));
    }
    setLoading(false);
  };

  const handleVerifySubmit = async (e) => {
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

  const goBackToForm = () => {
    setStep('form');
    setCode('');
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
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 'form' ? t('register.title') : t('verifySignup.title')}
            </h1>
            <p className="text-emerald-100/90 text-sm">
              {step === 'form' ? t('register.subtitle') : t('verifySignup.subtitle')}
            </p>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-white/90 mb-2">
                  {t('login.email')}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-fn" className="block text-sm font-medium text-white/90 mb-2">
                    {t('register.firstName')}
                  </label>
                  <input
                    id="reg-fn"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="reg-ln" className="block text-sm font-medium text-white/90 mb-2">
                    {t('register.lastName')}
                  </label>
                  <input
                    id="reg-ln"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-pw" className="block text-sm font-medium text-white/90 mb-2">
                  {t('login.password')}
                </label>
                <input
                  id="reg-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="input-field"
                  placeholder="••••••••"
                />
                <p className="text-xs text-emerald-100/70 mt-1">{t('register.passwordMin')}</p>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-2 disabled:opacity-50">
                {loading ? t('register.submitting') : t('register.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div>
                <label htmlFor="reg-email-readonly" className="block text-sm font-medium text-white/90 mb-2">
                  {t('login.email')}
                </label>
                <input
                  id="reg-email-readonly"
                  type="email"
                  value={email}
                  readOnly
                  className="input-field opacity-90 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="reg-code" className="block text-sm font-medium text-white/90 mb-2">
                  {t('login.codeTitle')}
                </label>
                <input
                  id="reg-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  className="input-field text-center text-2xl tracking-[0.4em] font-mono"
                  placeholder={t('login.codePlaceholder')}
                />
                <p className="text-xs text-emerald-100/75 mt-2">{t('register.codeHint')}</p>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
                {loading ? t('verifySignup.submitting') : t('verifySignup.submit')}
              </button>

              <button
                type="button"
                onClick={goBackToForm}
                className="w-full text-sm text-emerald-200/90 hover:text-white underline"
              >
                {t('register.wrongEmail')}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-white/85">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="text-emerald-200 font-medium hover:text-white underline">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
