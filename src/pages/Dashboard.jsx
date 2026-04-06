import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAlertStore } from '../store/alertStore';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Counter from '../components/Counter';
import { getProjectsData, buildAggregatedBudgetEvolution } from '../utils/projectData';
import { useTranslation } from '../hooks/useTranslation';

const FolderGlyph = () => (
  <div className="relative h-12 w-12">
    <div className="absolute left-2 top-2 h-3 w-6 rounded-t-md bg-blue-300/90" />
    <div className="absolute inset-x-1 bottom-1 top-4 rounded-lg border border-blue-300 bg-blue-100/90 shadow-inner" />
    <div className="absolute inset-x-3 bottom-3 top-6 rounded-md border border-blue-400 bg-white/80" />
  </div>
);

const shortenProjectName = (name) => {
  if (!name) return '';
  return name.length > 26 ? `${name.slice(0, 26)}...` : name;
};

const Dashboard = () => {
  const { t, chartMonths } = useTranslation();
  const months6 = useMemo(() => chartMonths(6), [chartMonths]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0,
    consumedBudget: 0,
  });
  const [allProjects, setAllProjects] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [budgetEvolution, setBudgetEvolution] = useState([]);
  const [loading, setLoading] = useState(true);
  const { alerts } = useAlertStore();

  useEffect(() => {
    const refresh = () => {
      try {
        const projectsData = getProjectsData();
        setAllProjects(projectsData);
        const topProjects = [...projectsData]
          .sort((a, b) => (b.progress || 0) - (a.progress || 0))
          .slice(0, 3);

        setRecentProjects(topProjects);

        const totalProjects = projectsData.length;
        const activeProjectsCount = projectsData.filter((project) => project.status === 'active').length;
        const totalBudget = projectsData.reduce((sum, project) => sum + (project.budget || 0), 0);
        const consumedBudget = projectsData.reduce((sum, project) => sum + (project.consumed || 0), 0);

        setStats({
          totalProjects,
          activeProjects: activeProjectsCount,
          totalBudget,
          consumedBudget,
        });

        setBudgetEvolution(buildAggregatedBudgetEvolution(projectsData, months6));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    window.addEventListener('greenit-projects-updated', refresh);
    return () => window.removeEventListener('greenit-projects-updated', refresh);
  }, [months6]);

  const budgetUsage = stats.totalBudget > 0
    ? (stats.consumedBudget / stats.totalBudget) * 100
    : 0;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.read).slice(0, 3);
  const activeProjects = allProjects.filter((project) => project.status === 'active');

  const projectStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return t('projects.statusActive');
      case 'completed':
        return t('projects.statusCompleted');
      case 'on-hold':
        return t('projects.statusOnHold');
      case 'cancelled':
        return t('projects.statusCancelled');
      default:
        return status;
    }
  };
  const activeProjectsPreview = activeProjects.slice(0, 3);

  if (loading) {
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.activeProjects')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <Counter to={stats.activeProjects} duration={900} /> / <Counter to={stats.totalProjects} duration={1100} />
              </p>
            </div>
            <div className="relative group">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderGlyph />
              </div>
              <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 flex flex-col items-end gap-1.5">
                {activeProjectsPreview.map((project, index) => (
                  <span
                    key={project.id}
                    className="whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 shadow-sm transition-all duration-300 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                    style={{ transitionDelay: `${index * 70}ms` }}
                  >
                    {project.name}
                  </span>
                ))}
                {activeProjects.length > activeProjectsPreview.length && (
                  <span
                    className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 shadow-sm transition-all duration-300 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                    style={{ transitionDelay: `${activeProjectsPreview.length * 70}ms` }}
                  >
                    +{activeProjects.length - activeProjectsPreview.length} {t('common.other')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.consumedBudget')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <Counter
                  to={stats.consumedBudget}
                  duration={1300}
                  formatValue={(value) => formatCurrency(value)}
                />
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('common.of')}{' '}
                <Counter to={stats.totalBudget} duration={1500} formatValue={(value) => formatCurrency(value)} />
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
              <p className="text-sm text-gray-600">{t('dashboard.usageRate')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <Counter
                  to={budgetUsage}
                  duration={1200}
                  decimals={1}
                  formatValue={(value) => formatPercentage(value)}
                />
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.budgetEvolution')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('dashboard.budgetEvolutionHint')}</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={budgetEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="budget" stroke="#22c55e" strokeWidth={2} name={t('chart.budget')} />
              <Line type="monotone" dataKey="consumed" stroke="#ef4444" strokeWidth={2} name={t('chart.consumed')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.byProject')}</h3>
          <ResponsiveContainer width="100%" height={330}>
            <BarChart
              data={recentProjects}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
              barCategoryGap={16}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={165}
                tick={{ fontSize: 12, fill: '#334155' }}
                tickFormatter={shortenProjectName}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `${t('dashboard.tooltipProject')}: ${label}`}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 8 }} />
              <Bar dataKey="budget" fill="#22c55e" name={t('chart.budget')} radius={[0, 8, 8, 0]} />
              <Bar dataKey="consumed" fill="#ef4444" name={t('chart.consumed')} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentProjects')}</h3>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              {t('dashboard.seeAll')} <ArrowRight size={16} />
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
                    {projectStatusLabel(project.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{t('dashboard.progressLabel')}: {formatPercentage(project.progress)}</span>
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
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.criticalAlerts')}</h3>
            <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              {t('dashboard.seeAll')}
            </Link>
          </div>
          {criticalAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="mx-auto text-gray-400 mb-2" size={32} />
              <p>{t('dashboard.noCriticalAlerts')}</p>
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
