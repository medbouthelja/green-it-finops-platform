import { useEffect, useState, useMemo, useCallback } from 'react';
import { Cloud, TrendingDown, Download, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF } from '../utils/export';
import toast from 'react-hot-toast';
import Counter from '../components/Counter';
import { useTranslation } from '../hooks/useTranslation';
import { getProjectsData } from '../utils/projectData';
import {
  buildFinOpsRecommendationsFromProjects,
  deriveGreenKpisFromProjects,
  scaleCloudRow,
} from '../utils/finopsRecommendations';
import { finopsService } from '../services/finopsService';
import { projectService } from '../services/projectService';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const CLOUD_ROWS = [
  { cpu: 120, storage: 500, network: 80, cost: 2500 },
  { cpu: 135, storage: 520, network: 85, cost: 2650 },
  { cpu: 140, storage: 540, network: 90, cost: 2800 },
  { cpu: 130, storage: 530, network: 88, cost: 2700 },
  { cpu: 125, storage: 510, network: 82, cost: 2550 },
  { cpu: 120, storage: 500, network: 80, cost: 2500 },
];

const APPLIED_KEY = 'greenit_finops_applied_v2';

function loadAppliedIds() {
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function saveAppliedIds(set) {
  try {
    localStorage.setItem(APPLIED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function recommendationDescription(rec, t, format) {
  const extra = {};
  if (rec.amounts) {
    extra.consumedStr = format(rec.amounts.consumed);
    extra.budgetStr = format(rec.amounts.budget);
  }
  if (rec.remaining != null) {
    extra.remainingStr = format(rec.remaining);
  }
  return t(rec.descKey, { ...rec.descVars, ...extra });
}

const FinOps = () => {
  const { t, chartMonths } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [appliedIds, setAppliedIds] = useState(loadAppliedIds);
  const [projects, setProjects] = useState([]);

  const months6 = useMemo(() => chartMonths(6), [chartMonths]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const rows = DEMO_MODE
          ? getProjectsData()
          : (await projectService.getAll()).data || [];
        setProjects(Array.isArray(rows) ? rows : []);
      } catch {
        setProjects([]);
      }
    };
    void loadProjects();
  }, [refreshKey]);

  const portfolioRatio = useMemo(() => {
    const tb = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
    const tc = projects.reduce((s, p) => s + (Number(p.consumed) || 0), 0);
    return tb > 0 ? tc / tb : 0.64;
  }, [projects]);

  const cloudData = useMemo(
    () =>
      months6.map((month, i) => ({
        month,
        ...scaleCloudRow(CLOUD_ROWS[i] || CLOUD_ROWS[0], portfolioRatio),
      })),
    [months6, portfolioRatio]
  );

  const greenMetrics = useMemo(() => deriveGreenKpisFromProjects(projects), [projects]);

  const baseRecommendations = useMemo(
    () => buildFinOpsRecommendationsFromProjects(projects),
    [projects]
  );

  const recommendations = useMemo(
    () => baseRecommendations.map((r) => ({ ...r, applied: appliedIds.has(String(r.id)) })),
    [baseRecommendations, appliedIds]
  );

  useEffect(() => {
    const onProjects = () => setRefreshKey((k) => k + 1);
    window.addEventListener('greenit-projects-updated', onProjects);
    return () => window.removeEventListener('greenit-projects-updated', onProjects);
  }, []);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          toast.error(t('finops.loadError'));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const totalCost = cloudData.reduce((sum, d) => sum + d.cost, 0);
  const avgCost = cloudData.length > 0 ? totalCost / cloudData.length : 0;
  const totalSavings = recommendations
    .filter((r) => !r.applied)
    .reduce((sum, r) => sum + r.savings, 0);

  const applyRecommendation = useCallback(
    async (recommendationId) => {
      const target = recommendations.find((rec) => String(rec.id) === String(recommendationId));
      if (!target || target.applied) return;

      setAppliedIds((prev) => {
        const next = new Set(prev);
        next.add(String(recommendationId));
        saveAppliedIds(next);
        return next;
      });

      const title = t(target.titleKey, target.titleVars);
      toast.success(t('finops.applied', { title }));

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        return;
      }

      try {
        await finopsService.applyRecommendation({
          recommendationId: String(recommendationId),
          title,
          type: target.type || 'cost',
          priority: target.priority || 'medium',
          savings: Number(target.savings) || 0,
        });
      } catch {
        toast.error(t('finops.applySyncError'));
      }
    },
    [recommendations, t]
  );

  const handleExportPDF = () => {
    const rowsForExport = recommendations.map((rec) => ({
      title: t(rec.titleKey, rec.titleVars),
      savings: rec.savings,
    }));
    const columns = [
      { key: 'title', label: t('finops.recColTitle') },
      { key: 'savings', label: t('finops.recColSavings') },
    ];
    exportToPDF(t('finops.reportTitle'), rowsForExport, columns);
    toast.success(t('finops.exportOk'));
  };

  const priorityLabel = (p) => {
    if (p === 'high') return t('finops.priorityHigh');
    if (p === 'medium') return t('finops.priorityMedium');
    return t('finops.priorityLow');
  };

  if (loading) {
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('finops.title')}</h1>
        <button onClick={handleExportPDF} className="btn-secondary inline-flex items-center gap-2">
          <Download size={16} />
          {t('finops.exportPdf')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('finops.monthlyCloudCost')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <Counter to={avgCost} duration={1200} formatValue={(value) => formatCurrency(value)} />
              </p>
              <p className="text-xs text-gray-500 mt-1">{t('finops.cloudScaledHint')}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Cloud className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('finops.potentialSavings')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                <Counter to={totalSavings} duration={1300} formatValue={(value) => formatCurrency(value)} />
              </p>
              <p className="text-sm text-gray-500 mt-1">{t('finops.perMonth')}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingDown className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('finops.cloudCostTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cloudData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name={t('finops.costEuro')} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('finops.resourceUsage')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cloudData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cpu" fill="#22c55e" name={t('finops.cpuVcpu')} />
              <Bar dataKey="storage" fill="#3b82f6" name={t('finops.storageGb')} />
              <Bar dataKey="network" fill="#f59e0b" name={t('finops.networkGb')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('finops.greenTitle')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('finops.greenDerivedHint')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('finops.energyEff')}</span>
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
              <span className="text-sm font-medium text-gray-700">{t('finops.renewable')}</span>
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

      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('finops.recsOptimTitle')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('finops.recsDerivedHint')}</p>
        </div>
        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-600 py-4">{t('finops.recsEmpty')}</p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const title = t(rec.titleKey, rec.titleVars);
              const description = recommendationDescription(rec, t, formatCurrency);
              return (
                <div
                  key={rec.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{title}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            rec.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : rec.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {priorityLabel(rec.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{description}</p>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-600 shrink-0" />
                        <span className="text-sm font-medium text-green-600">
                          {t('finops.savingsPerMonth', { amount: formatCurrency(rec.savings) })}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyRecommendation(rec.id)}
                      className="btn-primary shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={rec.applied}
                    >
                      {rec.applied ? t('finops.appliedBadge') : t('finops.apply')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinOps;
