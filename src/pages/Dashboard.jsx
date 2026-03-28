import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { finopsService } from '../services/finopsService';
import { useAlertStore } from '../store/alertStore';
import { 
  FolderKanban, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Leaf,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0,
    consumedBudget: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [budgetEvolution, setBudgetEvolution] = useState([]);
  const [loading, setLoading] = useState(true);
  const { alerts } = useAlertStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simuler les données pour la démo
      setStats({
        totalProjects: 12,
        activeProjects: 8,
        totalBudget: 450000,
        consumedBudget: 285000,
      });

      setRecentProjects([
        { id: 1, name: 'Migration Cloud AWS', progress: 65, budget: 120000, consumed: 78000, status: 'active' },
        { id: 2, name: 'Refonte Application Web', progress: 45, budget: 80000, consumed: 36000, status: 'active' },
        { id: 3, name: 'Optimisation Infrastructure', progress: 90, budget: 50000, consumed: 45000, status: 'active' },
      ]);

      setBudgetEvolution([
        { month: 'Jan', budget: 120000, consumed: 95000 },
        { month: 'Fév', budget: 125000, consumed: 110000 },
        { month: 'Mar', budget: 130000, consumed: 115000 },
        { month: 'Avr', budget: 135000, consumed: 120000 },
        { month: 'Mai', budget: 140000, consumed: 130000 },
        { month: 'Juin', budget: 145000, consumed: 140000 },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const budgetUsage = stats.totalBudget > 0 
    ? (stats.consumedBudget / stats.totalBudget) * 100 
    : 0;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.read).slice(0, 3);

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Projets actifs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.activeProjects} / {stats.totalProjects}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderKanban className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget consommé</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.consumedBudget)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                sur {formatCurrency(stats.totalBudget)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux d'utilisation</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercentage(budgetUsage)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du budget</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={budgetEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="budget" stroke="#22c55e" strokeWidth={2} name="Budget" />
              <Line type="monotone" dataKey="consumed" stroke="#ef4444" strokeWidth={2} name="Consommé" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par projet</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentProjects}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="budget" fill="#22c55e" name="Budget" />
              <Bar dataKey="consumed" fill="#ef4444" name="Consommé" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Projects and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Projets récents</h3>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Avancement: {formatPercentage(project.progress)}</span>
                  <span>•</span>
                  <span>{formatCurrency(project.consumed)} / {formatCurrency(project.budget)}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alertes critiques</h3>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Voir tout
            </Link>
          </div>
          {criticalAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="mx-auto text-gray-400 mb-2" size={32} />
              <p>Aucune alerte critique</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">{alert.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

