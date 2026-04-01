import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import AuroraBackground from '../components/AuroraBackground';
import TextType from '../components/TextType';

const Login = () => {
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
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Erreur de connexion');
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
            <TextType
              texts={['Bienvenue', 'Welcome', 'Heureux de vous revoir']}
              className="text-emerald-100 font-medium tracking-wide mb-3"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Green IT Platform</h1>
            <p className="text-emerald-100/90">Connectez-vous a votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Mot de passe
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/80 space-y-2">
            <p>
              Compte API (fixtures) : <span className="text-white font-medium">admin@example.com</span> /{' '}
              <span className="text-white font-medium">password</span>
            </p>
            <p className="text-xs max-w-sm mx-auto">
              Sans backend Symfony sur le port 8000, la connexion echoue. Lancez l'API depuis le dossier{' '}
              <code className="bg-white/20 border border-white/30 px-1 rounded text-white">backend</code> ou activez{' '}
              <code className="bg-white/20 border border-white/30 px-1 rounded text-white">VITE_DEMO_MODE=true</code> dans <code className="bg-white/20 border border-white/30 px-1 rounded text-white">.env</code>{' '}
              pour un login local sans serveur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

