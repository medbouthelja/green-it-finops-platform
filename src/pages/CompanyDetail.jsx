import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyService } from '../services/companyService';
import { useTranslation } from '../hooks/useTranslation';
import { getApiErrorMessage } from '../utils/apiErrorMessage';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', sector: '', country: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await companyService.getById(Number(id));
      setCompany(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        sector: data.sector || '',
        country: data.country || '',
      });
    } catch {
      setCompany(null);
      toast.error(t('companies.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { data } = await companyService.update(Number(id), {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sector: form.sector.trim() || null,
        country: form.country.trim() || null,
      });
      setCompany(data);
      setEditOpen(false);
      toast.success(t('companies.updated'));
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

  const handleDelete = async () => {
    if (!company || !window.confirm(t('companies.confirmDelete', { name: company.name }))) return;
    try {
      await companyService.delete(Number(id));
      toast.success(t('companies.deleted'));
      navigate('/companies');
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

  if (loading) {
    return <div className="text-center py-12 text-gray-600">{t('common.loading')}</div>;
  }

  if (!company) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 mb-4">{t('companies.notFound')}</p>
        <Link to="/companies" className="text-primary-600 hover:underline">
          {t('companies.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        to="/companies"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-900"
      >
        <ArrowLeft size={18} />
        {t('companies.backToList')}
      </Link>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-700">
              <Building2 size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('companies.createdAt')}{' '}
                {company.createdAt
                  ? new Date(company.createdAt).toLocaleDateString(undefined, {
                      dateStyle: 'long',
                    })
                  : '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditOpen(true)} className="btn-secondary inline-flex items-center gap-2">
              <Pencil size={18} />
              {t('common.edit')}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
            >
              <Trash2 size={18} />
              {t('common.delete')}
            </button>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <dt className="text-gray-500 font-medium">{t('companies.sector')}</dt>
            <dd className="mt-1 text-gray-900">{company.sector || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">{t('companies.country')}</dt>
            <dd className="mt-1 text-gray-900">{company.country || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">{t('companies.projects')}</dt>
            <dd className="mt-1 text-gray-900">{company.projectCount ?? 0}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500 font-medium">{t('companies.description')}</dt>
            <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{company.description || '—'}</dd>
          </div>
        </dl>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{t('companies.editTitle')}</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)} disabled={saving}>
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
