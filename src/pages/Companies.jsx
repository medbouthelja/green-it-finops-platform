import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search, Pencil, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyService } from '../services/companyService';
import { userService } from '../services/userService';
import { useTranslation } from '../hooks/useTranslation';
import { getApiErrorMessage } from '../utils/apiErrorMessage';

const emptyForm = {
  name: '',
  description: '',
  sector: '',
  country: '',
};

export default function Companies() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const [sectors, setSectors] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [assigningUserId, setAssigningUserId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (sector.trim()) params.sector = sector.trim();
      const { data } = await companyService.getAll(params);
      const rows = Array.isArray(data) ? data : [];
      setList(rows);
      const uniq = [...new Set(rows.map((c) => c.sector).filter(Boolean))].sort();
      setSectors(uniq);
    } catch {
      toast.error(t('companies.loadError'));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [q, sector, t]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 300);
    return () => clearTimeout(id);
  }, [load]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Unable to load users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || '',
      description: c.description || '',
      sector: c.sector || '',
      country: c.country || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('companies.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sector: form.sector.trim() || null,
        country: form.country.trim() || null,
      };
      if (editing) {
        await companyService.update(editing.id, payload);
        toast.success(t('companies.updated'));
      } else {
        await companyService.create(payload);
        toast.success(t('companies.created'));
      }
      setModalOpen(false);
      await load();
      await loadUsers();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error(t('companies.saveForbidden'));
      } else if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        toast.error(t('companies.networkError'));
      } else {
        toast.error(getApiErrorMessage(err, t('companies.saveError')));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(t('companies.confirmDelete', { name: c.name }))) return;
    try {
      await companyService.delete(c.id);
      toast.success(t('companies.deleted'));
      await load();
      await loadUsers();
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error(t('companies.deleteConflict'));
      } else if (err?.response?.status === 403) {
        toast.error(t('companies.saveForbidden'));
      } else if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        toast.error(t('companies.networkError'));
      } else {
        toast.error(getApiErrorMessage(err, t('companies.deleteError')));
      }
    }
  };

  if (loading && list.length === 0) {
    return <div className="text-center py-12 text-gray-600">{t('common.loading')}</div>;
  }

  const handleAssignCompany = async (userId, companyIdValue) => {
    setAssigningUserId(userId);
    try {
      const normalizedCompanyId = companyIdValue === '' ? null : Number(companyIdValue);
      const { data } = await userService.assignCompany(userId, normalizedCompanyId);
      setUsers((prev) =>
        prev.map((u) => (Number(u.id) === Number(userId) ? data : u))
      );
      toast.success('User assignment updated');
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error(t('companies.saveForbidden'));
      } else {
        toast.error(getApiErrorMessage(err, 'Failed to assign user to company'));
      }
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-primary-600" size={32} />
            {t('companies.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('companies.subtitle')}</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus size={20} />
          {t('companies.add')}
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="search"
              className="input-field pl-10"
              placeholder={t('companies.searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:w-64">
            <Filter size={20} className="text-gray-400 shrink-0" />
            <select
              className="input-field"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <option value="">{t('companies.sectorAll')}</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="py-3 pr-4 font-medium">{t('companies.name')}</th>
              <th className="py-3 pr-4 font-medium">{t('companies.sector')}</th>
              <th className="py-3 pr-4 font-medium">{t('companies.country')}</th>
              <th className="py-3 pr-4 font-medium">{t('companies.projects')}</th>
              <th className="py-3 pr-4 font-medium w-32">{t('common.edit')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                <td className="py-3 pr-4">
                  <Link
                    to={`/companies/${c.id}`}
                    className="font-medium text-primary-700 hover:text-primary-900 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-gray-700">{c.sector || '—'}</td>
                <td className="py-3 pr-4 text-gray-700">{c.country || '—'}</td>
                <td className="py-3 pr-4 text-gray-700">{c.projectCount ?? 0}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                      aria-label={t('common.edit')}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(c)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && !loading && (
          <p className="text-center py-10 text-gray-500">{t('companies.noneFound')}</p>
        )}
      </div>

      <div className="card overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Users assignment</h2>
          <p className="text-sm text-gray-600 mt-1">Assign each user to an entreprise.</p>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="py-3 pr-4 font-medium">User</th>
              <th className="py-3 pr-4 font-medium">Role</th>
              <th className="py-3 pr-4 font-medium">Entreprise</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                <td className="py-3 pr-4">
                  <div className="font-medium text-gray-900">
                    {u.firstName || u.lastName
                      ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                      : u.email}
                  </div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="py-3 pr-4 text-gray-700">{u.role}</td>
                <td className="py-3 pr-4">
                  <select
                    className="input-field"
                    value={u.company?.id != null ? String(u.company.id) : ''}
                    onChange={(e) => void handleAssignCompany(Number(u.id), e.target.value)}
                    disabled={assigningUserId === u.id}
                  >
                    <option value="">No entreprise</option>
                    {list.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!usersLoading && users.length === 0 && (
          <p className="text-center py-8 text-gray-500">No users found.</p>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? t('companies.editTitle') : t('companies.add')}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.name')} *</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.description')}</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.sector')}</label>
                  <input
                    className="input-field"
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.country')}</label>
                  <input
                    className="input-field"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
