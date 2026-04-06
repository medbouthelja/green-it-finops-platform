import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/export';
import toast from 'react-hot-toast';
import Counter from '../components/Counter';
import { getProjectsData, buildAggregatedBudgetEvolution } from '../utils/projectData';
import { useTranslation } from '../hooks/useTranslation';

function enrichProjectForBudget(p) {
  const budget = Number(p.budget) || 0;
  const consumed = Number(p.consumed) || 0;
  const forecast =
    p.forecast != null && p.forecast !== ''
      ? Number(p.forecast)
      : Math.round(budget * ((Number(p.progress) || 0) / 100) || budget);
  return { ...p, budget, consumed, forecast };
}

const Budget = () => {
  const { t, chartMonths } = useTranslation();
  const months6 = useMemo(() => chartMonths(6), [chartMonths]);
  const [budgetData, setBudgetData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      try {
        const raw = getProjectsData();
        const enriched = raw.map(enrichProjectForBudget);
        setProjects(enriched);
        setBudgetData(buildAggregatedBudgetEvolution(raw, months6));
      } catch (error) {
        toast.error(t('budget.loadError'));
      } finally {
        setLoading(false);
      }
    };

    load();
    window.addEventListener('greenit-projects-updated', load);
    return () => window.removeEventListener('greenit-projects-updated', load);
  }, [months6, t]);

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalConsumed = projects.reduce((sum, p) => sum + p.consumed, 0);
  const totalForecast = projects.reduce((sum, p) => sum + p.forecast, 0);
  const variance = totalForecast - totalBudget;
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

  const pieData = projects.map(p => ({
    name: p.name,
    value: p.consumed,
  }));

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleExportPDF = () => {
    const columns = [
      { key: 'name', label: t('budget.colProject') },
      { key: 'budget', label: t('budget.colBudget') },
      { key: 'consumed', label: t('budget.colConsumed') },
      { key: 'forecast', label: t('budget.colForecast') },
    ];
    exportToPDF(t('budget.reportTitle'), projects, columns);
    toast.success(t('budget.exportPdfOk'));
  };

  const handleExportExcel = () => {
    const columns = [
      { key: 'name', label: t('budget.colProject') },
      { key: 'budget', label: t('budget.colBudget') },
      { key: 'consumed', label: t('budget.colConsumed') },
      { key: 'forecast', label: t('budget.colForecast') },
    ];
    exportToExcel(t('budget.reportTitle'), projects, columns);
    toast.success(t('budget.exportExcelOk'));
  };

  if (loading) {
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('budget.title')}</h1>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-secondary inline-flex items-center gap-2">
            <Download size={16} />
            {t('budget.exportPdf')}
          </button>
          <button onClick={handleExportExcel} className="btn-secondary inline-flex items-center gap-2">
            <Download size={16} />
            {t('budget.exportExcel')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('budget.totalBudget')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <Counter to={totalBudget} duration={1200} formatValue={(value) => formatCurrency(value)} />
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('budget.consumed')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <Counter to={totalConsumed} duration={1300} formatValue={(value) => formatCurrency(value)} />
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <Counter
                  to={totalBudget > 0 ? (totalConsumed / totalBudget) * 100 : 0}
                  duration={1100}
                  decimals={1}
                  formatValue={(value) => formatPercentage(value)}
                />
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('budget.finalForecast')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <Counter to={totalForecast} duration={1400} formatValue={(value) => formatCurrency(value)} />
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className={`card ${variance < 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('budget.forecastVariance')}</p>
              <p className={`text-2xl font-bold mt-1 ${variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                <Counter to={Math.abs(variance)} duration={1400} formatValue={(value) => formatCurrency(value)} />
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <Counter
                  to={Math.abs(variancePercent)}
                  duration={1200}
                  decimals={1}
                  formatValue={(value) => formatPercentage(value)}
                />
              </p>
            </div>
            <div className={`p-3 rounded-lg ${variance < 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {variance < 0 ? (
                <TrendingDown className="text-green-600" size={24} />
              ) : (
                <TrendingUp className="text-red-600" size={24} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('budget.monthlyEvolution')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('budget.evolutionHint')}</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={budgetData}>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('budget.byProject')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('budget.detailByProject')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('budget.colProject')}</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('budget.colBudget')}</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('budget.colConsumed')}</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('budget.colForecast')}</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('common.variance')}</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('common.pctUsed')}</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const projectVariance = project.forecast - project.budget;
                const usagePercent = (project.consumed / project.budget) * 100;
                const isOverBudget = project.forecast > project.budget;
                const isHighUsage = usagePercent > 80;

                return (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link to={`/projects/${project.id}`} className="font-medium text-primary-600 hover:text-primary-700">
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(project.budget)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(project.consumed)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(project.forecast)}</td>
                    <td className={`py-3 px-4 text-right font-medium ${projectVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(projectVariance))}
                    </td>
                    <td className="py-3 px-4 text-right">{formatPercentage(usagePercent)}</td>
                    <td className="py-3 px-4 text-center">
                      {isOverBudget || isHighUsage ? (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <AlertTriangle size={16} />
                          <span className="text-xs">{t('budget.tableAlert')}</span>
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs">{t('common.ok')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Budget;
