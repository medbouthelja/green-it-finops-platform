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
};
