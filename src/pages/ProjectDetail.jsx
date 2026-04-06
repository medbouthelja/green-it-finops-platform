import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import {
  getProjectsData,
  saveProjectsData,
  upsertProjectInStorage,
  buildBudgetChartSeries,
} from '../utils/projectData';
import { useAuthStore } from '../store/authStore';
import {
  canViewBudgetInProject,
  canViewProgressTab,
  canManageProjectTeam,
} from '../utils/roles';
import { ArrowLeft, Calendar, DollarSign, Users, Plus, Pencil, Trash2, X } from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage, formatHours } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TimeEntryForm from '../components/TimeEntryForm';
import ExpenseForm from '../components/ExpenseForm';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

function normalizeTeam(team, memberDefault = 'Membre') {
  if (!Array.isArray(team) || team.length === 0) return [];
  return team.map((m, i) => ({
    id: m.id ?? i + 1,
    name: m.name ?? m.nom ?? memberDefault,
    role: m.role ?? '—',
  }));
}

function withStableTeamIds(members) {
  return members
    .filter((m) => String(m.name || '').trim())
    .map((m, i) => ({
      id: i + 1,
      name: String(m.name).trim(),
      role: String(m.role || '').trim() || '—',
    }));
}

function normalizeStoredTimeEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((e, i) => ({
    id: e.id ?? `local-${i}`,
    user: e.user ?? e.userName ?? '—',
    date: e.date,
    hours: Number(e.hours) || 0,
    task: e.task ?? '',
  }));
}

function normalizeStoredExpenses(raw, expenseDefault = 'Dépense') {
  if (!Array.isArray(raw)) return [];
  return raw.map((ex, i) => ({
    id: ex.id ?? `exp-${i}`,
    description: String(ex.description ?? '').trim() || expenseDefault,
    amount: Math.round((Number(ex.amount) || 0) * 100) / 100,
    category: ex.category || 'other',
    date: ex.date || new Date().toISOString().split('T')[0],
  }));
}

function defaultCurrentSprintFromProgress(progress) {
  const p = Number(progress) || 0;
  const s = Math.ceil(p / 15);
  return Math.max(1, Math.min(20, s || 1));
}

function normalizeCurrentSprint(loaded) {
  const n = Number(loaded.currentSprint);
  if (Number.isFinite(n) && n >= 1) return Math.min(99, Math.round(n));
  return defaultCurrentSprintFromProgress(loaded.progress);
}

function cycleVRowsFromProgress(progressPct, phases, statusLabels) {
  const p = Math.max(0, Math.min(100, Number(progressPct) || 0));
  const n = phases.length || 1;
  const seg = 100 / n;
  return phases.map((phase, index) => {
    const start = index * seg;
    const end = (index + 1) * seg;
    let width = 0;
    let status = statusLabels.todo;
    if (p >= end - 0.001) {
      width = 100;
      status = statusLabels.done;
    } else if (p > start) {
      width = Math.min(100, ((p - start) / seg) * 100);
      status = statusLabels.ongoing;
    }
    return { phase, width, status };
  });
}

const ProjectDetail = () => {
  const { id } = useParams();
  const { t, tm, chartMonths } = useTranslation();
  const monthLabels5 = useMemo(() => chartMonths(5), [chartMonths]);
  const buildBudgetChartDataCb = useCallback(
    (p) =>
      buildBudgetChartSeries(Number(p.budget) || 0, Number(p.consumed) || 0, monthLabels5),
    [monthLabels5]
  );
  const expenseCategoryLabel = useCallback(
    (cat) => {
      const map = {
        cloud: 'projectDetail.catCloud',
        licenses: 'projectDetail.catLicenses',
        infrastructure: 'projectDetail.catInfra',
        services: 'projectDetail.catServices',
        other: 'projectDetail.catOther',
      };
      return t(map[cat] || 'projectDetail.catOther');
    },
    [t]
  );
  const cycleVPhases = useMemo(() => tm('projectDetail.cycleVPhases'), [tm]);
  const cycleVStatus = useMemo(
    () => ({
      done: t('projectDetail.phaseDone'),
      ongoing: t('projectDetail.phaseOngoing'),
      todo: t('projectDetail.phaseTodo'),
    }),
    [t]
  );

  const user = useAuthStore((s) => s.user);
  const showBudgetUi = canViewBudgetInProject(user);
  const showProgressTab = canViewProgressTab(user);
  const canEditTeam = canManageProjectTeam(user);

  const [project, setProject] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const projectTabs = useMemo(() => {
    const tabs = [{ id: 'overview', label: t('projectDetail.overview') }];
    if (showBudgetUi) tabs.push({ id: 'budget', label: t('projectDetail.budgetTab') });
    tabs.push({ id: 'time', label: t('projectDetail.timeTab') });
    if (showProgressTab) tabs.push({ id: 'progress', label: t('projectDetail.progressTab') });
    return tabs;
  }, [showBudgetUi, showProgressTab, t]);

  useEffect(() => {
    if (!projectTabs.some((t) => t.id === activeTab)) {
      setActiveTab('overview');
    }
  }, [projectTabs, activeTab]);

  const [showTimeForm, setShowTimeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [progressTrackingForm, setProgressTrackingForm] = useState({
    sprint: 1,
    progressPct: 0,
  });

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMemberId, setEditingTeamMemberId] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', role: '' });
  const [teamSaving, setTeamSaving] = useState(false);

  const cycleVRows = useMemo(() => {
    if (!project) return [];
    return cycleVRowsFromProgress(
      progressTrackingForm.progressPct === '' || progressTrackingForm.progressPct === undefined
        ? project.progress
        : Number(progressTrackingForm.progressPct),
      cycleVPhases,
      cycleVStatus
    );
  }, [progressTrackingForm.progressPct, project, cycleVPhases, cycleVStatus]);

  const projectStatusLabel = useCallback(
    (status) => {
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
    },
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    const numericId = Number.parseInt(String(id), 10);

    async function load() {
      if (Number.isNaN(numericId)) {
        setProject(null);
        setTimeEntries([]);
        setBudgetData([]);
        setLoading(false);
        return;
      }

      setEditingExpense(null);
      setShowExpenseForm(false);

      setLoading(true);
      try {
        const localList = getProjectsData();
        let loaded = localList.find((p) => p.id === numericId) ?? null;

        if (!loaded && !DEMO_MODE) {
          try {
            const { data } = await projectService.getById(numericId);
            if (!cancelled) loaded = data;
          } catch {
            if (!cancelled) loaded = null;
          }
        }

        if (cancelled) return;

        if (!loaded) {
          setProject(null);
          setTimeEntries([]);
          setBudgetData([]);
          return;
        }

        const normalized = {
          ...loaded,
          id: loaded.id,
          team: normalizeTeam(loaded.team, t('common.memberDefault')),
          expenses: normalizeStoredExpenses(loaded.expenses, t('projectDetail.expenseDefault')),
          progress: Math.max(0, Math.min(100, Math.round(Number(loaded.progress) || 0))),
          currentSprint: normalizeCurrentSprint(loaded),
        };
        const localEntries = normalizeStoredTimeEntries(loaded.timeEntries);

        setProject(normalized);
        setBudgetData(buildBudgetChartDataCb(normalized));

        if (!DEMO_MODE) {
          try {
            const { data: entries } = await projectService.getTimeEntries(numericId);
            if (cancelled) return;
            const list = Array.isArray(entries) ? entries : [];
            const mapped = list.map((e) => ({
              id: e.id,
              user: e.user ?? e.userName ?? '—',
              date: e.date,
              hours: Number(e.hours) || 0,
              task: e.task ?? '',
            }));
            setTimeEntries(mapped.length > 0 ? mapped : localEntries);
          } catch {
            if (!cancelled) setTimeEntries(localEntries);
          }
        } else if (!cancelled) {
          setTimeEntries(localEntries);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(t('projectDetail.loadError'));
          setProject(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, t, buildBudgetChartDataCb]);

  useEffect(() => {
    if (!project) return;
    setBudgetData(
      buildBudgetChartSeries(Number(project.budget) || 0, Number(project.consumed) || 0, monthLabels5)
    );
  }, [monthLabels5, project?.id, project?.budget, project?.consumed]);

  useEffect(() => {
    if (!project) return;
    setProgressTrackingForm({
      sprint:
        project.currentSprint ?? defaultCurrentSprintFromProgress(project.progress),
      progressPct: Math.max(0, Math.min(100, Number(project.progress) || 0)),
    });
  }, [project?.id, project?.currentSprint, project?.progress]);

  const handleSaveProgressTracking = useCallback(async () => {
    if (!project) return;
    const sprint = Math.max(
      1,
      Math.min(99, Math.round(Number(progressTrackingForm.sprint)) || 1)
    );
    const prog = Math.max(
      0,
      Math.min(100, Math.round(Number(progressTrackingForm.progressPct)) || 0)
    );
    const next =
      project.methodology === 'scrum'
        ? { ...project, currentSprint: sprint, progress: prog }
        : { ...project, progress: prog };
    setProject(next);
    upsertProjectInStorage(next);

    if (!DEMO_MODE) {
      try {
        await projectService.update(project.id, { progress: prog });
        toast.success(t('projectDetail.toastProgressSaved'));
      } catch {
        toast.error(t('projectDetail.toastProgressLocal'));
      }
    } else {
      toast.success(t('projectDetail.toastProgressSaved'));
    }
  }, [project, progressTrackingForm, t]);

  const handleSaveTimeEntry = useCallback(async (data) => {
    if (!project) return;

    const payload = {
      date: data.date,
      hours: Number(data.hours),
      task: String(data.task || '').trim(),
      user: String(data.user || '').trim() || t('common.userDefault'),
    };

    if (!payload.task) {
      toast.error(t('projectDetail.taskRequired'));
      throw new Error('validation');
    }
    if (!Number.isFinite(payload.hours) || payload.hours <= 0) {
      toast.error(t('projectDetail.hoursInvalid'));
      throw new Error('validation');
    }

    let entry;
    let savedToApi = false;
    if (!DEMO_MODE) {
      try {
        const { data: created } = await projectService.addTimeEntry(project.id, payload);
        entry = {
          id: created.id,
          user: created.user ?? created.userName ?? payload.user,
          date: created.date,
          hours: Number(created.hours) || payload.hours,
          task: created.task ?? payload.task,
        };
        savedToApi = true;
      } catch {
        entry = { id: Date.now(), ...payload };
        toast.error(t('projectDetail.apiLocalTime'));
      }
    } else {
      entry = { id: Date.now(), ...payload };
    }

    const delta = Math.round(payload.hours * project.tjm * 100) / 100;
    const newConsumed = Math.round((Number(project.consumed) + delta) * 100) / 100;
    const nextProject = { ...project, consumed: newConsumed };

    setTimeEntries((prev) => [...prev, entry]);
    setProject(nextProject);
    setBudgetData(buildBudgetChartDataCb(nextProject));

    const all = getProjectsData();
    const idx = all.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      const copy = [...all];
      if (savedToApi) {
        copy[idx] = { ...copy[idx], consumed: newConsumed };
      } else {
        const prevTe = normalizeStoredTimeEntries(all[idx].timeEntries);
        const serial = {
          id: entry.id,
          user: entry.user,
          date: entry.date,
          hours: entry.hours,
          task: entry.task,
        };
        copy[idx] = { ...copy[idx], consumed: newConsumed, timeEntries: [...prevTe, serial] };
      }
      saveProjectsData(copy);
    }

    if (savedToApi || DEMO_MODE) {
      toast.success(t('projectDetail.timeSaved'));
    }
  }, [project, t]);

  const handleSaveExpense = useCallback(
    async (data) => {
      if (!project) return;
      const amount = Math.round(Number(data.amount) * 100) / 100;
      if (!Number.isFinite(amount) || amount < 0) {
        toast.error(t('projectDetail.amountInvalid'));
        throw new Error('validation');
      }
      const desc = String(data.description || '').trim();
      if (!desc) {
        toast.error(t('projectDetail.descRequired'));
        throw new Error('validation');
      }

      const expenseRow = {
        id: editingExpense?.id ?? Date.now(),
        description: desc,
        amount,
        category: data.category || 'other',
        date: data.date || new Date().toISOString().split('T')[0],
      };

      const prevExpenses = project.expenses || [];
      let nextExpenses;
      let newConsumed = Math.round(Number(project.consumed) * 100) / 100;

      if (editingExpense) {
        const oldAmt = Number(editingExpense.amount) || 0;
        nextExpenses = prevExpenses.map((e) => (e.id === editingExpense.id ? expenseRow : e));
        newConsumed = Math.round((newConsumed - oldAmt + amount) * 100) / 100;
      } else {
        nextExpenses = [...prevExpenses, expenseRow];
        newConsumed = Math.round((newConsumed + amount) * 100) / 100;
      }

      const nextProject = { ...project, expenses: nextExpenses, consumed: newConsumed };
      setProject(nextProject);
      setBudgetData(buildBudgetChartDataCb(nextProject));
      upsertProjectInStorage(nextProject);
      setEditingExpense(null);
      setShowExpenseForm(false);

      if (!DEMO_MODE) {
        try {
          await projectService.update(project.id, { consumed: newConsumed });
          toast.success(editingExpense ? t('projectDetail.expenseUpdated') : t('projectDetail.expenseAdded'));
        } catch {
          toast.error(t('projectDetail.expenseLocal'));
        }
      } else {
        toast.success(editingExpense ? t('projectDetail.expenseUpdated') : t('projectDetail.expenseAdded'));
      }
    },
    [project, editingExpense, t]
  );

  const handleDeleteExpense = useCallback(
    async (expenseId) => {
      if (!project?.expenses?.length) return;
      const ex = project.expenses.find((e) => e.id === expenseId);
      if (!ex) return;
      if (!window.confirm(t('projectDetail.confirmDeleteExpense'))) return;

      const nextExpenses = project.expenses.filter((e) => e.id !== expenseId);
      const newConsumed = Math.round((Number(project.consumed) - Number(ex.amount)) * 100) / 100;
      const nextProject = { ...project, expenses: nextExpenses, consumed: newConsumed };
      setProject(nextProject);
      setBudgetData(buildBudgetChartDataCb(nextProject));
      upsertProjectInStorage(nextProject);

      if (!DEMO_MODE) {
        try {
          await projectService.update(project.id, { consumed: newConsumed });
          toast.success(t('projectDetail.expenseDeleted'));
        } catch {
          toast.error(t('projectDetail.deleteExpenseLocal'));
        }
      } else {
        toast.success(t('projectDetail.expenseDeleted'));
      }
    },
    [project, t]
  );

  const openAddExpense = () => {
    setEditingExpense(null);
    setShowExpenseForm(true);
  };

  const openEditExpense = (exp) => {
    setEditingExpense(exp);
    setShowExpenseForm(true);
  };

  const persistTeam = useCallback(
    async (members) => {
      if (!project?.id) return;
      setTeamSaving(true);
      try {
        const team = withStableTeamIds(members);
        const nextProject = { ...project, team };
        setProject(nextProject);
        setBudgetData(buildBudgetChartDataCb(nextProject));

        const all = getProjectsData();
        const idx = all.findIndex((p) => p.id === project.id);
        if (idx >= 0) {
          const copy = [...all];
          copy[idx] = { ...copy[idx], team };
          saveProjectsData(copy);
        }

        let synced = DEMO_MODE;
        if (!DEMO_MODE) {
          try {
            await projectService.update(project.id, { team });
            synced = true;
          } catch {
            toast.error(t('projectDetail.teamSyncError'));
          }
        }
        if (synced) {
          toast.success(t('projectDetail.teamUpdated'));
        }
      } finally {
        setTeamSaving(false);
      }
    },
    [project, t]
  );

  const openAddTeamMember = () => {
    setEditingTeamMemberId(null);
    setTeamForm({ name: '', role: '' });
    setShowTeamModal(true);
  };

  const openEditTeamMember = (member) => {
    setEditingTeamMemberId(member.id);
    setTeamForm({ name: member.name, role: member.role === '—' ? '' : member.role });
    setShowTeamModal(true);
  };

  const handleDeleteTeamMember = async (memberId) => {
    if (!project?.team?.length) return;
    if (!window.confirm(t('projectDetail.confirmRemoveMember'))) return;
    await persistTeam(project.team.filter((m) => m.id !== memberId));
  };

  const handleSubmitTeamMember = async (e) => {
    e.preventDefault();
    if (!project) return;
    if (!teamForm.name.trim()) {
      toast.error(t('projectDetail.nameRequired'));
      return;
    }
    const name = teamForm.name.trim();
    const role = teamForm.role.trim() || '—';
    let next;
    if (editingTeamMemberId != null) {
      next = project.team.map((m) =>
        m.id === editingTeamMemberId ? { ...m, name, role } : m
      );
    } else {
      next = [...(project.team || []), { id: Date.now(), name, role }];
    }
    await persistTeam(next);
    setShowTeamModal(false);
  };

  if (loading) {
    return <div className="text-center py-12">{t('common.loading')}</div>;
  }

  if (!project) {
    return <div className="text-center py-12">{t('common.notFound')}</div>;
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
      <div
        className={`grid grid-cols-1 gap-6 ${
          showBudgetUi ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'
        }`}
      >
        {showBudgetUi && (
          <>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('projectDetail.budgetConsumed')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(project.consumed)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('common.of')} {formatCurrency(project.budget)}
                  </p>
                </div>
                <DollarSign className="text-primary-600" size={24} />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('projectDetail.budgetRemaining')}</p>
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
          </>
        )}

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('projectDetail.progressLabel')}</p>
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
              <p className="text-sm text-gray-600">{t('projectDetail.team')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project.team?.length || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">{t('projectDetail.members')}</p>
            </div>
            <Users className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {projectTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
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
                <h3 className="font-semibold text-gray-900 mb-4">{t('projectDetail.projectInfo')}</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('common.status')}</dt>
                    <dd className="font-medium">{projectStatusLabel(project.status)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('common.methodology')}</dt>
                    <dd className="font-medium capitalize">
                      {project.methodology === 'scrum' ? t('common.scrum') : t('common.cycleV')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('projectDetail.tjm')}</dt>
                    <dd className="font-medium">{formatCurrency(project.tjm)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('projectDetail.startDate')}</dt>
                    <dd className="font-medium">{formatDate(project.startDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">{t('projectDetail.endDate')}</dt>
                    <dd className="font-medium">{formatDate(project.endDate)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-semibold text-gray-900">{t('projectDetail.teamTitle')}</h3>
                  {canEditTeam && (
                    <button
                      type="button"
                      onClick={openAddTeamMember}
                      disabled={teamSaving}
                      className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-3"
                    >
                      <Plus size={16} />
                      {t('projectDetail.addMember')}
                    </button>
                  )}
                </div>
                {!project.team?.length && (
                  <p className="text-sm text-gray-500 mb-3">{t('projectDetail.noMembers')}</p>
                )}
                <div className="space-y-3">
                  {project.team?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      {canEditTeam && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditTeamMember(member)}
                            disabled={teamSaving}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-primary-700"
                            title={t('projectDetail.modify')}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeamMember(member.id)}
                            disabled={teamSaving}
                            className="p-2 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-700"
                            title={t('projectDetail.remove')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showBudgetUi && (
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">{t('projectDetail.budgetEvolution')}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t('projectDetail.budgetEvolutionHint')}</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="budget" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name={t('chart.budget')} />
                    <Area type="monotone" dataKey="consumed" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name={t('chart.consumed')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'budget' && showBudgetUi && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('projectDetail.budgetDetail')}</h3>
              <button
                type="button"
                onClick={openAddExpense}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                {t('projectDetail.addExpense')}
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('projectDetail.initialBudget')}</span>
                  <span className="font-semibold text-lg">{formatCurrency(project.budget)}</span>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('projectDetail.budgetConsumed')}</span>
                  <span className="font-semibold text-lg text-red-600">{formatCurrency(project.consumed)}</span>
                </div>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  remainingBudget < 0 ? 'bg-red-50' : 'bg-green-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('projectDetail.budgetRemaining')}</span>
                  <span
                    className={`font-semibold text-lg ${
                      remainingBudget < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(remainingBudget)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('projectDetail.expenseList')}</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colDate')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colDescription')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colCategory')}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colAmount')}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 w-28">{t('projectDetail.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!project.expenses || project.expenses.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                          {t('projectDetail.noExpenses')}
                        </td>
                      </tr>
                    )}
                    {(project.expenses || []).map((exp) => (
                      <tr key={exp.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(exp.date)}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{exp.description}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {expenseCategoryLabel(exp.category)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(exp.amount)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => openEditExpense(exp)}
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-primary-700"
                              title={t('projectDetail.modify')}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-2 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-700"
                              title={t('projectDetail.remove')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('projectDetail.timeTitle')}</h3>
              <button 
                onClick={() => setShowTimeForm(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                {t('projectDetail.addHours')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colDate')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colUser')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colTask')}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colHours')}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('projectDetail.colCost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center text-gray-500 text-sm">
                        {t('projectDetail.noTimeEntries')}
                      </td>
                    </tr>
                  )}
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

        {activeTab === 'progress' && showProgressTab && (
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">{t('projectDetail.progressFollowTitle')}</h3>
            {project.methodology === 'scrum' ? (
              <div className="space-y-4">
                <p className="text-gray-600">{t('projectDetail.scrumTitle')}</p>
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{t('projectDetail.currentSprint')}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {progressTrackingForm.sprint === ''
                        ? t('projectDetail.sprintDash')
                        : t('projectDetail.sprintN', { n: progressTrackingForm.sprint })}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t('projectDetail.progressLabel')}</span>
                      <span>
                        {Math.round(
                          progressTrackingForm.progressPct === ''
                            ? Number(project.progress) || 0
                            : Number(progressTrackingForm.progressPct) || 0
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              progressTrackingForm.progressPct === ''
                                ? Number(project.progress) || 0
                                : Number(progressTrackingForm.progressPct) || 0
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('projectDetail.sprintNumber')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={
                          progressTrackingForm.sprint === '' ? '' : progressTrackingForm.sprint
                        }
                        onChange={(e) =>
                          setProgressTrackingForm((f) => ({
                            ...f,
                            sprint: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('projectDetail.globalProgress')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={
                          progressTrackingForm.progressPct === ''
                            ? ''
                            : progressTrackingForm.progressPct
                        }
                        onChange={(e) =>
                          setProgressTrackingForm((f) => ({
                            ...f,
                            progressPct: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        className="input-field"
                      />
                    </div>
                  </div>
                  <button type="button" onClick={handleSaveProgressTracking} className="btn-primary">
                    {t('projectDetail.saveTracking')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">{t('projectDetail.cycleVTitle')}</p>
                <div className="p-4 bg-gray-50 rounded-lg space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('projectDetail.globalProgress')}
                    </label>
                    <div className="flex flex-wrap items-end gap-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={
                          progressTrackingForm.progressPct === ''
                            ? ''
                            : progressTrackingForm.progressPct
                        }
                        onChange={(e) =>
                          setProgressTrackingForm((f) => ({
                            ...f,
                            progressPct: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        className="input-field max-w-[140px]"
                      />
                      <button type="button" onClick={handleSaveProgressTracking} className="btn-primary">
                        {t('common.save')}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {cycleVRows.map(({ phase, width, status }) => (
                    <div key={phase} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{phase}</span>
                        <span className="text-sm text-gray-600">{status}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${width}%` }}
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
          onSave={handleSaveTimeEntry}
        />
      )}

      {showExpenseForm && project && (
        <ExpenseForm
          project={project}
          expense={editingExpense}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
        />
      )}

      {showTeamModal && canEditTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTeamMemberId != null ? t('projectDetail.teamModalEdit') : t('projectDetail.teamModalAdd')}
              </h3>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitTeamMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectDetail.fullName')}</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field w-full"
                  placeholder={t('projectDetail.memberNamePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectDetail.roleFunction')}</label>
                <input
                  type="text"
                  value={teamForm.role}
                  onChange={(e) => setTeamForm((f) => ({ ...f, role: e.target.value }))}
                  className="input-field w-full"
                  placeholder={t('projectDetail.rolePlaceholder')}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={teamSaving} className="btn-primary">
                  {teamSaving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

