import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { simulationService } from '../services/simulationService';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Simulation = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [scenario, setScenario] = useState({
    tjmVariation: 0,
    progressVariation: 0,
    cloudConsumptionVariation: 0,
    teamSizeVariation: 0,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Simuler les données
      const mockProjects = [
        { id: 1, name: 'Migration Cloud AWS', budget: 120000, consumed: 78000, progress: 65, tjm: 650 },
        { id: 2, name: 'Refonte Application Web', budget: 80000, consumed: 36000, progress: 45, tjm: 600 },
        { id: 3, name: 'Optimisation Infrastructure', budget: 50000, consumed: 45000, progress: 90, tjm: 700 },
      ];
      setProjects(mockProjects);
      if (mockProjects.length > 0) {
        setSelectedProject(mockProjects[0]);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des projets');
    }
  };

  const runSimulation = async () => {
    if (!selectedProject) {
      toast.error('Veuillez sélectionner un projet');
      return;
    }

    setLoading(true);
    try {
      // Simuler les résultats
      const baseCost = selectedProject.consumed;
      const baseProgress = selectedProject.progress;
      const baseTjm = selectedProject.tjm;
      const remainingBudget = selectedProject.budget - baseCost;

      const newTjm = baseTjm * (1 + scenario.tjmVariation / 100);
      const newProgress = Math.min(100, baseProgress + scenario.progressVariation);
      const remainingWork = 100 - newProgress;
      const estimatedHours = (remainingWork / 100) * (selectedProject.budget / baseTjm);
      const newCost = baseCost + (estimatedHours * newTjm);
      const cloudCostVariation = scenario.cloudConsumptionVariation * 100; // € par mois

      const finalCost = newCost + cloudCostVariation;
      const variance = finalCost - selectedProject.budget;
      const variancePercent = (variance / selectedProject.budget) * 100;

      setResults({
        original: {
          budget: selectedProject.budget,
          consumed: baseCost,
          progress: baseProgress,
          remaining: remainingBudget,
        },
        simulated: {
          budget: selectedProject.budget,
          consumed: finalCost,
          progress: newProgress,
          remaining: selectedProject.budget - finalCost,
          tjm: newTjm,
        },
        impact: {
          costVariance: variance,
          costVariancePercent: variancePercent,
          progressChange: scenario.progressVariation,
          tjmChange: scenario.tjmVariation,
        },
        timeline: [
          { month: 'Mois 1', original: baseCost, simulated: baseCost + (finalCost - baseCost) * 0.2 },
          { month: 'Mois 2', original: baseCost + (finalCost - baseCost) * 0.3, simulated: baseCost + (finalCost - baseCost) * 0.4 },
          { month: 'Mois 3', original: baseCost + (finalCost - baseCost) * 0.5, simulated: baseCost + (finalCost - baseCost) * 0.6 },
          { month: 'Mois 4', original: baseCost + (finalCost - baseCost) * 0.7, simulated: baseCost + (finalCost - baseCost) * 0.8 },
          { month: 'Mois 5', original: baseCost + (finalCost - baseCost) * 0.9, simulated: finalCost },
        ],
      });
    } catch (error) {
      toast.error('Erreur lors de la simulation');
    } finally {
      setLoading(false);
    }
  };

  const resetScenario = () => {
    setScenario({
      tjmVariation: 0,
      progressVariation: 0,
      cloudConsumptionVariation: 0,
      teamSizeVariation: 0,
    });
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Simulation "Et si"</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de simulation</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projet
                </label>
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === parseInt(e.target.value));
                    setSelectedProject(project);
                    setResults(null);
                  }}
                  className="input-field"
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variation TJM (%)
                </label>
                <input
                  type="number"
                  value={scenario.tjmVariation}
                  onChange={(e) => setScenario({ ...scenario, tjmVariation: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variation avancement (%)
                </label>
                <input
                  type="number"
                  value={scenario.progressVariation}
                  onChange={(e) => setScenario({ ...scenario, progressVariation: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variation consommation cloud (€/mois)
                </label>
                <input
                  type="number"
                  value={scenario.cloudConsumptionVariation}
                  onChange={(e) => setScenario({ ...scenario, cloudConsumptionVariation: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="0"
                  step="10"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={runSimulation}
                  disabled={loading || !selectedProject}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Calcul...' : 'Lancer simulation'}
                </button>
                <button
                  onClick={resetScenario}
                  className="btn-secondary"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Impact Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`card ${results.impact.costVariance < 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Écart budgétaire</p>
                      <p className={`text-2xl font-bold mt-1 ${results.impact.costVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(results.impact.costVariance))}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatPercentage(Math.abs(results.impact.costVariancePercent))}
                      </p>
                    </div>
                    {results.impact.costVariance < 0 ? (
                      <TrendingDown className="text-green-600" size={24} />
                    ) : (
                      <TrendingUp className="text-red-600" size={24} />
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Coût final estimé</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(results.simulated.consumed)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Budget: {formatCurrency(results.simulated.budget)}
                      </p>
                    </div>
                    <DollarSign className="text-blue-600" size={24} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avancement simulé</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatPercentage(results.simulated.progress)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Variation: {scenario.progressVariation > 0 ? '+' : ''}{scenario.progressVariation}%
                      </p>
                    </div>
                    <Clock className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison scénario</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={results.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="original" stroke="#22c55e" strokeWidth={2} name="Scénario actuel" />
                    <Line type="monotone" dataKey="simulated" stroke="#ef4444" strokeWidth={2} name="Scénario simulé" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Comparison */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison détaillée</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Indicateur</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Scénario actuel</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Scénario simulé</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Écart</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4">Budget total</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(results.original.budget)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(results.simulated.budget)}</td>
                        <td className="py-3 px-4 text-right text-gray-500">-</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4">Coût consommé</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(results.original.consumed)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(results.simulated.consumed)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${results.impact.costVariance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(results.impact.costVariance)}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4">Avancement</td>
                        <td className="py-3 px-4 text-right">{formatPercentage(results.original.progress)}</td>
                        <td className="py-3 px-4 text-right">{formatPercentage(results.simulated.progress)}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {scenario.progressVariation > 0 ? '+' : ''}{scenario.progressVariation}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">TJM</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(selectedProject.tjm)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(results.simulated.tjm)}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {scenario.tjmVariation > 0 ? '+' : ''}{scenario.tjmVariation}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-12">
              <Calculator className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Configurez les paramètres et lancez une simulation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;

