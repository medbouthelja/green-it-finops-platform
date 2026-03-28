import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Cloud, TrendingDown, Zap, Download, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF, exportToExcel } from '../utils/export';
import toast from 'react-hot-toast';

const FinOps = () => {
  const [cloudData, setCloudData] = useState([]);
  const [greenMetrics, setGreenMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinOpsData();
  }, []);

  const fetchFinOpsData = async () => {
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simuler les données
      setCloudData([
        { month: 'Jan', cpu: 120, storage: 500, network: 80, cost: 2500 },
        { month: 'Fév', cpu: 135, storage: 520, network: 85, cost: 2650 },
        { month: 'Mar', cpu: 140, storage: 540, network: 90, cost: 2800 },
        { month: 'Avr', cpu: 130, storage: 530, network: 88, cost: 2700 },
        { month: 'Mai', cpu: 125, storage: 510, network: 82, cost: 2550 },
        { month: 'Juin', cpu: 120, storage: 500, network: 80, cost: 2500 },
      ]);

      setGreenMetrics({
        energyEfficiency: 85,
        renewableEnergy: 60,
      });

      setRecommendations([
        {
          id: 1,
          type: 'cost',
          title: 'Optimiser les instances inactives',
          description: 'Arrêter 3 instances EC2 non utilisées',
          savings: 450,
          priority: 'high',
        },
        {
          id: 2,
          type: 'green',
          title: 'Migrer vers des régions à énergie renouvelable',
          description: 'Déplacer les ressources vers eu-west-3',
          savings: 200,
          priority: 'medium',
        },
        {
          id: 3,
          type: 'cost',
          title: 'Réduire la taille des instances',
          description: 'Downsizing de 2 instances t3.large vers t3.medium',
          savings: 300,
          priority: 'medium',
        },
      ]);
    } catch (error) {
      console.error('Error fetching FinOps data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = cloudData.reduce((sum, d) => sum + d.cost, 0);
  const avgCost = cloudData.length > 0 ? totalCost / cloudData.length : 0;
  const totalSavings = recommendations.reduce((sum, r) => sum + r.savings, 0);

  const handleExportPDF = () => {
    const columns = [
      { key: 'title', label: 'Recommandation' },
      { key: 'savings', label: 'Économies (€)' },
    ];
    exportToPDF('Rapport FinOps & Green IT', recommendations, columns);
    toast.success('Export PDF généré');
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">FinOps & Green IT</h1>
        <button onClick={handleExportPDF} className="btn-secondary inline-flex items-center gap-2">
          <Download size={16} />
          Exporter PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Coût cloud mensuel</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(avgCost)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Cloud className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Économies potentielles</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totalSavings)}
              </p>
              <p className="text-sm text-gray-500 mt-1">par mois</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingDown className="text-green-600" size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des coûts cloud</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cloudData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Coût (€)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Consommation des ressources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cloudData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cpu" fill="#22c55e" name="CPU (vCPU)" />
              <Bar dataKey="storage" fill="#3b82f6" name="Stockage (GB)" />
              <Bar dataKey="network" fill="#f59e0b" name="Réseau (GB)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Green Metrics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques Green IT</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Efficacité énergétique</span>
              <span className="text-lg font-bold text-primary-600">{greenMetrics?.energyEfficiency}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${greenMetrics?.energyEfficiency}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Énergie renouvelable</span>
              <span className="text-lg font-bold text-green-600">{greenMetrics?.renewableEnergy}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${greenMetrics?.renewableEnergy}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommandations d'optimisation</h3>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.priority === 'high' ? 'Priorité haute' :
                       rec.priority === 'medium' ? 'Priorité moyenne' :
                       'Priorité basse'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Économies: {formatCurrency(rec.savings)}/mois
                      </span>
                    </div>
                  </div>
                </div>
                <button className="btn-primary ml-4">Appliquer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinOps;

