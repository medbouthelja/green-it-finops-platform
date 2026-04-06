import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import ProjectForm from '../components/ProjectForm';
import toast from 'react-hot-toast';
import { getProjectsData, saveProjectsData } from '../utils/projectData';
import { useAuthStore } from '../store/authStore';
import { canManageProjectsCrud, canViewBudgetInProject } from '../utils/roles';
import { useTranslation } from '../hooks/useTranslation';

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

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, filterStatus, projects]);

  const fetchProjects = async () => {
    try {
      const projectsData = getProjectsData();
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (error) {
      toast.error(t('projects.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    setFilteredProjects(filtered);
  };

  const handleDeleteProject = (projectId) => {
    const target = projects.find((project) => project.id === projectId);
    if (!target) return;

    const shouldDelete = window.confirm(t('projects.confirmDelete', { name: target.name }));
    if (!shouldDelete) return;

    const updatedProjects = projects.filter((project) => project.id !== projectId);
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
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="card spotlight-card hover:shadow-md transition-shadow relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
              </div>
              {canEditProjects && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpenId((current) => (current === project.id ? null : project.id));
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical size={18} className="text-gray-400" />
              </button>
              )}
              {canEditProjects && menuOpenId === project.id && (
                <div
                  className="absolute right-4 top-12 z-20 w-40 rounded-xl border border-gray-200 bg-white shadow-lg p-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      setEditingProject(project);
                      setShowProjectForm(true);
                      setMenuOpenId(null);
                    }}
                  >
                    <Pencil size={15} />
                    {t('common.edit')}
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 size={15} />
                    {t('common.delete')}
                  </button>
                </div>
              )}
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
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">{t('projects.noneFound')}</p>
        </div>
      )}

      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
          onSave={async (data) => {
            let updatedProjects = projects;

            if (editingProject) {
              updatedProjects = projects.map((project) =>
                project.id === editingProject.id
                  ? { ...project, ...data }
                  : project
              );
            } else {
              const nextId = projects.length ? Math.max(...projects.map((project) => project.id)) + 1 : 1;
              const newProject = {
                id: nextId,
                ...data,
                consumed: 0,
                progress: 0,
              };
              updatedProjects = [...projects, newProject];
            }

            setProjects(updatedProjects);
            saveProjectsData(updatedProjects);
            setEditingProject(null);
            setShowProjectForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Projects;

