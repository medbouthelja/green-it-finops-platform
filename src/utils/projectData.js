const PROJECTS_STORAGE_KEY = 'greenit.projects';

const defaultProjects = [
  {
    id: 1,
    name: 'Migration Cloud AWS',
    description: "Migration de l'infrastructure vers AWS",
    status: 'active',
    methodology: 'scrum',
    budget: 120000,
    consumed: 78000,
    progress: 65,
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    tjm: 650,
  },
  {
    id: 2,
    name: 'Refonte Application Web',
    description: "Refonte complete de l'application web",
    status: 'active',
    methodology: 'cycle-v',
    budget: 80000,
    consumed: 36000,
    progress: 45,
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    tjm: 600,
  },
  {
    id: 3,
    name: 'Optimisation Infrastructure',
    description: "Optimisation de l'infrastructure existante",
    status: 'active',
    methodology: 'scrum',
    budget: 50000,
    consumed: 45000,
    progress: 90,
    startDate: '2024-01-01',
    endDate: '2024-04-30',
    tjm: 700,
  },
  {
    id: 4,
    name: 'Developpement API REST',
    description: "Developpement d'une API REST complete",
    status: 'completed',
    methodology: 'scrum',
    budget: 40000,
    consumed: 38000,
    progress: 100,
    startDate: '2023-10-01',
    endDate: '2024-01-31',
    tjm: 550,
  },
];

export const getProjectsData = () => {
  const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(defaultProjects));
    return defaultProjects;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(defaultProjects));
    return defaultProjects;
  }
};

export const saveProjectsData = (projects) => {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('greenit-projects-updated'));
  }
};

/**
 * Courbes budget / consommé en montants cumulés sur la période.
 * Le dernier point = totaux réels (alignés avec les KPI du tableau de bord).
 */
export function buildBudgetChartSeries(totalBudget, totalConsumed, monthLabels) {
  const n = monthLabels.length;
  const tb = Number(totalBudget) || 0;
  const tc = Number(totalConsumed) || 0;
  if (!n) return [];
  return monthLabels.map((month, i) => {
    const isLast = i === n - 1;
    return {
      month,
      budget: isLast ? tb : (tb * (i + 1)) / n,
      consumed: isLast ? tc : (tc * (i + 1)) / n,
    };
  });
}

const DEFAULT_MONTHS_6 = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];

/** Agrégat tous projets pour tableaux de bord (6 mois). `monthLabels` optionnel selon la langue. */
export function buildAggregatedBudgetEvolution(projects, monthLabels) {
  const labels = Array.isArray(monthLabels) && monthLabels.length ? monthLabels : DEFAULT_MONTHS_6;
  if (!Array.isArray(projects) || projects.length === 0) {
    return buildBudgetChartSeries(0, 0, labels);
  }
  const totalBudget = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const totalConsumed = projects.reduce((s, p) => s + (Number(p.consumed) || 0), 0);
  return buildBudgetChartSeries(totalBudget, totalConsumed, labels);
}

/** Enregistre ou met à jour un projet (budget, consommé, dépenses, etc.) pour alimenter les stats globales. */
export function upsertProjectInStorage(project) {
  if (project == null || project.id == null) return;
  const all = getProjectsData();
  const pid = Number(project.id);
  const idx = all.findIndex((p) => Number(p.id) === pid);
  const row = { ...project };
  const next =
    idx >= 0 ? all.map((p, i) => (i === idx ? { ...p, ...row } : p)) : [...all, row];
  saveProjectsData(next);
}
