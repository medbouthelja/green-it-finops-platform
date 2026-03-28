import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Plus, Search, Filter, MoreVertical } from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import ProjectForm from '../components/ProjectForm';
import toast from 'react-hot-toast';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showProjectForm, setShowProjectForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, filterStatus, projects]);

  const fetchProjects = async () => {
    try {
      // Simuler les données pour la démo
      const mockProjects = [
        {
          id: 1,
          name: 'Migration Cloud AWS',
          description: 'Migration de l\'infrastructure vers AWS',
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
          description: 'Refonte complète de l\'application web',
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
          description: 'Optimisation de l\'infrastructure existante',
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
          name: 'Développement API REST',
          description: 'Développement d\'une API REST complète',
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
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
    } catch (error) {
      toast.error('Erreur lors du chargement des projets');
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
        return 'Actif';
      case 'completed':
        return 'Terminé';
      case 'on-hold':
        return 'En pause';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Projets</h1>
        <button
          onClick={() => setShowProjectForm(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau projet
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un projet..."
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
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="completed">Terminé</option>
              <option value="on-hold">En pause</option>
              <option value="cancelled">Annulé</option>
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
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Menu contextuel
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Statut</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Méthodologie</span>
                <span className="font-medium text-gray-900 capitalize">
                  {project.methodology === 'scrum' ? 'Scrum' : 'Cycle en V'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avancement</span>
                <span className="font-medium text-gray-900">{formatPercentage(project.progress)}</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Budget</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(project.consumed)} / {formatCurrency(project.budget)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Début: {formatDate(project.startDate)}</span>
                <span>Fin: {formatDate(project.endDate)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucun projet trouvé</p>
        </div>
      )}

      {showProjectForm && (
        <ProjectForm
          onClose={() => setShowProjectForm(false)}
          onSave={async (data) => {
            // Simuler la sauvegarde
            const newProject = {
              id: projects.length + 1,
              ...data,
              consumed: 0,
              progress: 0,
            };
            setProjects([...projects, newProject]);
            setShowProjectForm(false);
          }}
        />
      )}
    </div>
  );
};

export default Projects;

