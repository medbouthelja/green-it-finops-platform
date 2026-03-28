import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import toast from 'react-hot-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      // Pour la démo, on simule les données
      // En production, utiliser: const response = await projectService.getAll();
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
      ];
      setProjects(mockProjects);
    } catch (err) {
      setError(err.message);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    try {
      // const response = await projectService.create(projectData);
      // setProjects([...projects, response.data]);
      toast.success('Projet créé avec succès');
      fetchProjects();
    } catch (err) {
      toast.error('Erreur lors de la création du projet');
      throw err;
    }
  };

  const updateProject = async (id, projectData) => {
    try {
      // await projectService.update(id, projectData);
      toast.success('Projet mis à jour');
      fetchProjects();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du projet');
      throw err;
    }
  };

  const deleteProject = async (id) => {
    try {
      // await projectService.delete(id);
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Projet supprimé');
    } catch (err) {
      toast.error('Erreur lors de la suppression du projet');
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

