import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { ArrowLeft, Calendar, DollarSign, Users, Settings, Plus } from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage, formatHours } from '../utils/formatters';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TimeEntryForm from '../components/TimeEntryForm';
import ExpenseForm from '../components/ExpenseForm';
import toast from 'react-hot-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      // Simuler les données
      setProject({
        id: parseInt(id),
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
        team: [
          { id: 1, name: 'Jean Dupont', role: 'Tech Lead' },
          { id: 2, name: 'Marie Martin', role: 'Développeur' },
          { id: 3, name: 'Pierre Durand', role: 'Chef de projet' },
        ],
      });

      setTimeEntries([
        { id: 1, user: 'Jean Dupont', date: '2024-01-15', hours: 8, task: 'Architecture' },
        { id: 2, user: 'Marie Martin', date: '2024-01-16', hours: 6, task: 'Développement' },
        { id: 3, user: 'Pierre Durand', date: '2024-01-17', hours: 4, task: 'Gestion projet' },
      ]);

      setBudgetData([
        { month: 'Jan', budget: 20000, consumed: 15000 },
        { month: 'Fév', budget: 20000, consumed: 18000 },
        { month: 'Mar', budget: 20000, consumed: 19000 },
        { month: 'Avr', budget: 20000, consumed: 16000 },
        { month: 'Mai', budget: 20000, consumed: 11000 },
      ]);
    } catch (error) {
      toast.error('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  if (!project) {
    return <div className="text-center py-12">Projet non trouvé</div>;
  }

  const remainingBudget = project.budget - project.consumed;
  const budgetUsage = (project.consumed / project.budget) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget consommé</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(project.consumed)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                sur {formatCurrency(project.budget)}
              </p>
            </div>
            <DollarSign className="text-primary-600" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget restant</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(remainingBudget)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatPercentage(100 - budgetUsage)}
              </p>
            </div>
            <Calendar className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avancement</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercentage(project.progress)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold">{project.progress}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Équipe</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project.team?.length || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">membres</p>
            </div>
            <Users className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'budget', 'time', 'progress'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' && 'Vue d\'ensemble'}
              {tab === 'budget' && 'Budget'}
              {tab === 'time' && 'Temps'}
              {tab === 'progress' && 'Avancement'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Informations du projet</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Statut</dt>
                    <dd className="font-medium">{project.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Méthodologie</dt>
                    <dd className="font-medium capitalize">{project.methodology === 'scrum' ? 'Scrum' : 'Cycle en V'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">TJM</dt>
                    <dd className="font-medium">{formatCurrency(project.tjm)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Date de début</dt>
                    <dd className="font-medium">{formatDate(project.startDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Date de fin</dt>
                    <dd className="font-medium">{formatDate(project.endDate)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Équipe</h3>
                <div className="space-y-3">
                  {project.team?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Évolution du budget</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="budget" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Budget" />
                  <Area type="monotone" dataKey="consumed" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Consommé" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Détail budgétaire</h3>
              <button 
                onClick={() => setShowExpenseForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Ajouter une dépense
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Budget initial</span>
                  <span className="font-semibold text-lg">{formatCurrency(project.budget)}</span>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Budget consommé</span>
                  <span className="font-semibold text-lg text-red-600">{formatCurrency(project.consumed)}</span>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Budget restant</span>
                  <span className="font-semibold text-lg text-green-600">{formatCurrency(remainingBudget)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Saisie des heures</h3>
              <button 
                onClick={() => setShowTimeForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Ajouter des heures
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateur</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tâche</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Heures</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(entry.date)}</td>
                      <td className="py-3 px-4">{entry.user}</td>
                      <td className="py-3 px-4">{entry.task}</td>
                      <td className="py-3 px-4 text-right">{formatHours(entry.hours)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(entry.hours * project.tjm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Suivi de l'avancement</h3>
            {project.methodology === 'scrum' ? (
              <div>
                <p className="text-gray-600 mb-4">Méthodologie Scrum</p>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Sprint actuel</span>
                      <span className="text-sm text-gray-600">Sprint 5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Méthodologie Cycle en V</p>
                <div className="space-y-3">
                  {['Spécification', 'Conception', 'Développement', 'Tests', 'Déploiement'].map((phase, index) => (
                    <div key={phase} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{phase}</span>
                        <span className="text-sm text-gray-600">
                          {index < 2 ? 'Terminé' : index === 2 ? 'En cours' : 'À venir'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: index < 2 ? '100%' : index === 2 ? '45%' : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showTimeForm && project && (
        <TimeEntryForm
          project={project}
          onClose={() => setShowTimeForm(false)}
          onSave={async (data) => {
            const newEntry = {
              id: timeEntries.length + 1,
              ...data,
              user: data.user || 'Utilisateur',
            };
            setTimeEntries([...timeEntries, newEntry]);
            // Mettre à jour le budget consommé
            const newConsumed = project.consumed + (data.hours * project.tjm);
            setProject({ ...project, consumed: newConsumed });
            setShowTimeForm(false);
          }}
        />
      )}

      {showExpenseForm && project && (
        <ExpenseForm
          project={project}
          onClose={() => setShowExpenseForm(false)}
          onSave={async (data) => {
            // Mettre à jour le budget consommé
            const newConsumed = project.consumed + data.amount;
            setProject({ ...project, consumed: newConsumed });
            setShowExpenseForm(false);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetail;

