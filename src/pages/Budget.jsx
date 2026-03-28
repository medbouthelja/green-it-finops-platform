import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/export';
import toast from 'react-hot-toast';

const Budget = () => {
  const [budgetData, setBudgetData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      // Simuler les données
      const mockProjects = [
        { id: 1, name: 'Migration Cloud AWS', budget: 120000, consumed: 78000, forecast: 115000 },
        { id: 2, name: 'Refonte Application Web', budget: 80000, consumed: 36000, forecast: 75000 },
        { id: 3, name: 'Optimisation Infrastructure', budget: 50000, consumed: 45000, forecast: 48000 },
        { id: 4, name: 'Développement API REST', budget: 40000, consumed: 38000, forecast: 38000 },
      ];

      setProjects(mockProjects);

      setBudgetData([
        { month: 'Jan', budget: 120000, consumed: 95000 },
        { month: 'Fév', budget: 125000, consumed: 110000 },
        { month: 'Mar', budget: 130000, consumed: 115000 },
        { month: 'Avr', budget: 135000, consumed: 120000 },
        { month: 'Mai', budget: 140000, consumed: 130000 },
        { month: 'Juin', budget: 145000, consumed: 140000 },
      ]);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

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
      { key: 'name', label: 'Projet' },
      { key: 'budget', label: 'Budget' },
      { key: 'consumed', label: 'Consommé' },
      { key: 'forecast', label: 'Prévision' },
    ];
    exportToPDF('Rapport Budget', projects, columns);
    toast.success('Export PDF généré');
  };

  const handleExportExcel = () => {
    const columns = [
      { key: 'name', label: 'Projet' },
      { key: 'budget', label: 'Budget' },
      { key: 'consumed', label: 'Consommé' },
      { key: 'forecast', label: 'Prévision' },
    ];
    exportToExcel('Rapport Budget', projects, columns);
    toast.success('Export Excel généré');
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion Budgétaire</h1>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-secondary inline-flex items-center gap-2">
            <Download size={16} />
            PDF
          </button>
          <button onClick={handleExportExcel} className="btn-secondary inline-flex items-center gap-2">
            <Download size={16} />
            Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalBudget)}
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
              <p className="text-sm text-gray-600">Budget consommé</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalConsumed)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatPercentage((totalConsumed / totalBudget) * 100)}
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
              <p className="text-sm text-gray-600">Prévision finale</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalForecast)}
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
              <p className="text-sm text-gray-600">Écart prévisionnel</p>
              <p className={`text-2xl font-bold mt-1 ${variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(variance))}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatPercentage(Math.abs(variancePercent))}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={budgetData}>
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

      {/* Projects Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail par projet</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Projet</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Budget</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Consommé</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Prévision</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Écart</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">% Utilisé</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
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
                          <span className="text-xs">Alerte</span>
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs">OK</span>
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

