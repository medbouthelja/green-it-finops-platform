import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

const ProjectForm = ({ project = null, onClose, onSave, isAdmin = false, companies = [] }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    methodology: project?.methodology || 'scrum',
    budget: project?.budget || '',
    tjm: project?.tjm || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    companyId:
      project?.company?.id != null
        ? String(project.company.id)
        : companies[0]?.id != null
          ? String(companies[0].id)
          : '',
  });

  useEffect(() => {
    const cid =
      project?.company?.id != null
        ? String(project.company.id)
        : companies[0]?.id != null
          ? String(companies[0].id)
          : '';
    setFormData({
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'active',
      methodology: project?.methodology || 'scrum',
      budget: project?.budget || '',
      tjm: project?.tjm || '',
      startDate: project?.startDate || '',
      endDate: project?.endDate || '',
      companyId: cid,
    });
  }, [project, companies]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.budget || !formData.tjm) {
        toast.error(t('projectForm.requiredFields'));
        setLoading(false);
        return;
      }

      if (isAdmin && (!formData.companyId || !companies.some((c) => String(c.id) === formData.companyId))) {
        toast.error(t('projectForm.companyRequired'));
        setLoading(false);
        return;
      }

      await onSave({
        ...formData,
        budget: parseFloat(formData.budget),
        tjm: parseFloat(formData.tjm),
        companyId: isAdmin && formData.companyId ? Number(formData.companyId) : undefined,
      });

      toast.success(project ? t('projectForm.updated') : t('projectForm.created'));
      onClose();
    } catch (error) {
      toast.error(t('projectForm.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? t('projectForm.editTitle') : t('projectForm.newTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projectForm.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="input-field"
              placeholder={t('projectForm.namePh')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projectForm.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-field"
              placeholder={t('projectForm.descriptionPh')}
            />
          </div>

          {isAdmin && companies.length === 0 && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              {t('projectForm.noCompaniesHint')}
            </p>
          )}

          {isAdmin && companies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projectForm.company')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">{t('projectForm.companyPh')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projectForm.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="active">{t('projects.statusActive')}</option>
                <option value="completed">{t('projects.statusCompleted')}</option>
                <option value="on-hold">{t('projects.statusOnHold')}</option>
                <option value="cancelled">{t('projects.statusCancelled')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projectForm.methodologyLabel')}
              </label>
              <select
                value={formData.methodology}
                onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                className="input-field"
              >
                <option value="scrum">{t('common.scrum')}</option>
                <option value="cycle-v">{t('common.cycleV')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projectForm.budgetInitial')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                required
                className="input-field"
                placeholder="120000"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projectForm.tjm')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.tjm}
                onChange={(e) => setFormData({ ...formData, tjm: e.target.value })}
                required
                className="input-field"
                placeholder="650"
                min="0"
                step="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projectForm.startDate')}
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projectForm.endDate')}
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? t('common.saving') : project ? t('common.edit') : t('projectForm.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
