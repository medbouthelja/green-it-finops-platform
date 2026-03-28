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

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { alerts, unreadCount, fetchAlerts, markAsRead } = useAlertStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user, fetchAlerts]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER, ROLES.TECH_LEAD] },
    { path: '/projects', icon: FolderKanban, label: 'Projets', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER, ROLES.TECH_LEAD, ROLES.CONSULTANT] },
    { path: '/budget', icon: DollarSign, label: 'Budget', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER] },
    { path: '/finops', icon: Leaf, label: 'FinOps & Green IT', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.TECH_LEAD] },
    { path: '/simulation', icon: Calculator, label: 'Simulation', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.PROJECT_MANAGER] },
  ].filter(item => !item.roles || item.roles.includes(user?.role));

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600">Green IT Platform</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          flex flex-col
        `}>
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary-600">Green IT Platform</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role?.toLowerCase()}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive(item.path)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={20} />
              <span>Paramètres</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-0">
          {/* Top bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold">Notifications</h3>
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
    </div>
  );
};

export default Layout;

