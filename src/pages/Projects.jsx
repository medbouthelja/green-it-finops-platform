import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import ProjectForm from '../components/ProjectForm';
import toast from 'react-hot-toast';
import { getProjectsData, saveProjectsData, upsertProjectInStorage } from '../utils/projectData';
import { useAuthStore } from '../store/authStore';
import { canManageProjectsCrud, canViewBudgetInProject, ROLES } from '../utils/roles';
import { companyService } from '../services/companyService';
import { useTranslation } from '../hooks/useTranslation';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

function mergeApiProjectsWithLocal(apiList, localList) {
  return apiList.map((p) => {
    const localRow = localList.find((x) => Number(x.id) === Number(p.id));
    if (!localRow) return p;
    return {
      ...p,
      ...(localRow.expenses != null ? { expenses: localRow.expenses } : {}),
      ...(localRow.currentSprint != null ? { currentSprint: localRow.currentSprint } : {}),
    };
  });
}

const Projects = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const canEditProjects = canManageProjectsCrud(user);
  const showBudgetSummary = canViewBudgetInProject(user);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      const localList = getProjectsData();
      if (DEMO_MODE) {
        setProjects(localList);
        return;
      }
      try {
        const { data } = await projectService.getAll();
        const apiList = Array.isArray(data) ? data : [];
        setProjects(mergeApiProjectsWithLocal(apiList, localList));
      } catch {
        toast.error(t('projects.loadError'));
        setProjects([]);
      }
    } catch (error) {
      toast.error(t('projects.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const filterProjects = useCallback(() => {
    let filtered = projects;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, filterStatus, projects]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (DEMO_MODE || !showProjectForm || user?.role !== ROLES.ADMIN) {
      return undefined;
    }
    let cancelled = false;
    companyService
      .getAll()
      .then(({ data }) => {
        if (!cancelled) setCompanyOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCompanyOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showProjectForm, user?.role]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const handleDeleteProject = async (projectId, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const target = projects.find((project) => Number(project.id) === Number(projectId));
    if (!target) return;

    const shouldDelete = window.confirm(t('projects.confirmDelete', { name: target.name }));
    if (!shouldDelete) return;

    if (!DEMO_MODE) {
      try {
        await projectService.delete(Number(projectId));
      } catch (err) {
        if (err?.response?.status !== 404) {
          toast.error(t('projects.deleteError'));
          setMenuOpenId(null);
          return;
        }
        /* 404 : projet absent en base — on retire la copie locale */
      }
    }

    const updatedProjects = projects.filter((project) => Number(project.id) !== Number(projectId));
    setProjects(updatedProjects);
    saveProjectsData(updatedProjects);
    setMenuOpenId(null);
    toast.success(t('projects.deleted'));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
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

  if (loading) {
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {user?.role !== ROLES.ADMIN && !user?.company && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          Your account is not assigned to an entreprise yet. Ask an admin to assign your entreprise.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">{t('projects.title')}</h1>
        {canEditProjects && (
          <button
            onClick={() => setShowProjectForm(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            {t('projects.newProject')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('projects.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">{t('projects.allStatuses')}</option>
              <option value="active">{t('projects.statusActive')}</option>
              <option value="completed">{t('projects.statusCompleted')}</option>
              <option value="on-hold">{t('projects.statusOnHold')}</option>
              <option value="cancelled">{t('projects.statusCancelled')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="relative">
            <Link
              to={`/projects/${project.id}`}
              className="card spotlight-card hover:shadow-md transition-shadow block"
              onClick={() => setMenuOpenId(null)}
            >
              <div className="flex items-start justify-between mb-4 pr-10">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                </div>
              </div>

              <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('common.status')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('common.methodology')}</span>
                <span className="font-medium text-gray-900 capitalize">
                  {project.methodology === 'scrum' ? t('common.scrum') : t('common.cycleV')}
                </span>
              </div>

              {project.company?.name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('projects.companyLabel')}</span>
                  <span className="font-medium text-gray-900 truncate max-w-[60%] text-right">
                    {project.company.name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('common.progress')}</span>
                <span className="font-medium text-gray-900">{formatPercentage(project.progress)}</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              {showBudgetSummary && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">{t('common.budget')}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(project.consumed)} / {formatCurrency(project.budget)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{t('common.start')}: {formatDate(project.startDate)}</span>
                <span>{t('common.end')}: {formatDate(project.endDate)}</span>
              </div>
            </div>
            </Link>

            {canEditProjects && (
              <div className="absolute right-3 top-3 z-20">
                <button
                  type="button"
                  aria-label={t('common.menu')}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpenId((current) => (current === project.id ? null : project.id));
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                >
                  <MoreVertical size={18} />
                </button>
                {menuOpenId === project.id && (
                  <div
                    className="absolute right-0 top-full mt-1 z-30 w-40 rounded-xl border border-gray-200 bg-white shadow-lg p-1"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingProject(project);
                        setShowProjectForm(true);
                        setMenuOpenId(null);
                      }}
                    >
                      <Pencil size={15} />
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      onClick={(e) => void handleDeleteProject(project.id, e)}
                    >
                      <Trash2 size={15} />
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">{t('projects.noneFound')}</p>
        </div>
      )}

      {showProjectForm && (
        <ProjectForm
          key={editingProject ? editingProject.id : 'new'}
          project={editingProject}
          isAdmin={user?.role === ROLES.ADMIN}
          companies={companyOptions}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
          onSave={async (data) => {
            if (DEMO_MODE) {
              let updatedProjects = projects;
              if (editingProject) {
                updatedProjects = projects.map((project) =>
                  Number(project.id) === Number(editingProject.id) ? { ...project, ...data } : project
                );
              } else {
                const nextId = projects.length
                  ? Math.max(...projects.map((project) => Number(project.id) || 0)) + 1
                  : 1;
                updatedProjects = [
                  ...projects,
                  {
                    id: nextId,
                    ...data,
                    consumed: 0,
                    progress: 0,
                  },
                ];
              }
              setProjects(updatedProjects);
              saveProjectsData(updatedProjects);
              setEditingProject(null);
              setShowProjectForm(false);
              return;
            }

            if (editingProject) {
              const payload = {
                name: data.name,
                description: data.description ?? '',
                status: data.status,
                methodology: data.methodology,
                budget: data.budget,
                tjm: data.tjm,
                startDate: data.startDate,
                endDate: data.endDate,
                consumed: Number(editingProject.consumed) || 0,
                progress: Math.max(0, Math.min(100, Math.round(Number(editingProject.progress) || 0))),
                team: Array.isArray(editingProject.team) ? editingProject.team : [],
              };
              if (user?.role === ROLES.ADMIN && data.companyId != null) {
                payload.companyId = data.companyId;
              }
              const { data: updated } = await projectService.update(Number(editingProject.id), payload);
              const merged = {
                ...updated,
                expenses: editingProject.expenses,
                currentSprint: editingProject.currentSprint,
              };
              setProjects(
                projects.map((p) => (Number(p.id) === Number(editingProject.id) ? merged : p))
              );
              upsertProjectInStorage(merged);
            } else {
              const payload = {
                name: data.name,
                description: data.description ?? '',
                status: data.status,
                methodology: data.methodology,
                budget: data.budget,
                tjm: data.tjm,
                startDate: data.startDate,
                endDate: data.endDate,
                consumed: 0,
                progress: 0,
                team: [],
              };
              if (user?.role === ROLES.ADMIN && data.companyId != null) {
                payload.companyId = data.companyId;
              }
              const { data: created } = await projectService.create(payload);
              const merged = { ...created, expenses: [], timeEntries: [] };
              setProjects([...projects, merged]);
              upsertProjectInStorage(merged);
            }
            setEditingProject(null);
            setShowProjectForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Projects;

