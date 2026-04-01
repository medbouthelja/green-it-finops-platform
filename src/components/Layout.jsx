import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import { 
  LayoutDashboard, 
  FolderKanban, 
  DollarSign, 
  Leaf, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  Calculator
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ROLES } from '../utils/roles';
import AuroraBackground from './AuroraBackground';
import AiChatWidget from './AiChatWidget';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { alerts, unreadCount, fetchAlerts, markAsRead } = useAlertStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuAnimated, setMenuAnimated] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user, fetchAlerts]);

  useEffect(() => {
    setMenuAnimated(false);
    const timer = setTimeout(() => setMenuAnimated(true), 40);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Vue globale', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER, ROLES.TECH_LEAD] },
    { path: '/projects', icon: FolderKanban, label: 'Projets', description: 'Suivi delivery', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER, ROLES.TECH_LEAD, ROLES.CONSULTANT] },
    { path: '/budget', icon: DollarSign, label: 'Budget', description: 'Suivi financier', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER] },
    { path: '/finops', icon: Leaf, label: 'FinOps & Green IT', description: 'Impact carbone', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECH_LEAD] },
    { path: '/simulation', icon: Calculator, label: 'Simulation', description: 'Forecasting', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER] },
  ].filter(item => !item.roles || item.roles.includes(user?.role));

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      {/* Mobile header */}
      <div className="lg:hidden relative z-10 bg-slate-950/35 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Green IT Platform</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white/90 hover:text-white">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-950/35 backdrop-blur-xl border-r border-white/20
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          flex flex-col
        `}>
          <div className="p-6 border-b border-white/20">
            <h1 className="text-2xl font-bold text-white">Green IT Platform</h1>
            <p className="text-sm text-emerald-100/85 mt-1">{user?.email}</p>
            <p className="text-xs text-emerald-100/70 mt-1 capitalize">{user?.role?.toLowerCase()}</p>
          </div>

          <nav className="flex-1 p-4 space-y-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    transitionDelay: `${index * 75}ms`,
                    opacity: menuAnimated ? 1 : 0,
                    transform: menuAnimated ? 'translateX(0)' : 'translateX(-16px)',
                  }}
                  className={`
                    group relative overflow-hidden flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-500 border
                    ${isActive(item.path)
                      ? 'bg-white/30 text-white font-medium border-white/35 shadow-lg shadow-black/20'
                      : 'text-emerald-50/90 bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/20'
                    }
                  `}
                >
                  <span
                    className={`
                      absolute left-0 top-2/4 -translate-y-2/4 h-6 w-1 rounded-r-full transition-all duration-300
                      ${isActive(item.path) ? 'bg-emerald-300' : 'bg-transparent group-hover:bg-emerald-200/70'}
                    `}
                  />
                  <div className={`
                    h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isActive(item.path) ? 'bg-white/25 scale-105' : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-105'}
                  `}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate tracking-wide">{item.label}</p>
                    <p className="text-xs text-emerald-100/70 truncate transition-colors duration-300 group-hover:text-emerald-100/90">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/20 space-y-2">
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-50/90 hover:bg-white/15 transition-all"
            >
              <Settings size={20} />
              <span>Paramètres</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-200 hover:bg-red-500/20 transition-all"
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-0">
          {/* Top bar */}
          <div className="relative z-40 bg-slate-950/25 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-white/85 hover:text-white"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/70 z-[80]">
                    <div className="p-4 border-b border-gray-200/70">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Aucune notification</div>
                      ) : (
                        alerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !alert.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={async () => {
                              if (!alert.read) {
                                await markAsRead(alert.id);
                              }
                              setNotificationsOpen(false);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{alert.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(alert.createdAt).toLocaleString('fr-FR')}
                                </p>
                              </div>
                              {!alert.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <AiChatWidget />
    </div>
  );
};

export default Layout;

