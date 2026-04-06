import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

const TimeEntryForm = ({ project, onClose, onSave }) => {
  const { t } = useTranslation();
  const team = Array.isArray(project?.team) ? project.team : [];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    task: '',
    user: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (team.length > 0 && !formData.user) {
        toast.error(t('timeEntry.selectTeam'));
        setLoading(false);
        return;
      }
      if (!formData.date || !formData.hours || !formData.task) {
        toast.error(t('timeEntry.required'));
        setLoading(false);
        return;
      }

      await onSave({
        ...formData,
        hours: parseFloat(formData.hours),
        projectId: project.id,
      });

      onClose();
    } catch (error) {
      toast.error(t('timeEntry.error'));
    } finally {
      setLoading(false);
    }
  };

  const estimated = formData.hours && project?.tjm
    ? t('timeEntry.estimatedCost', { amount: String(parseFloat(formData.hours) * project.tjm) })
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{t('timeEntry.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeEntry.date')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeEntry.user')} <span className="text-red-500">*</span>
            </label>
            {team.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {t('timeEntry.noTeam')}
              </p>
            ) : (
              <select
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className="input-field"
                required
              >
                <option value="">{t('timeEntry.chooseMember')}</option>
                {team.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                    {member.role && member.role !== '—' ? ` (${member.role})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeEntry.task')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              required
              className="input-field"
              placeholder={t('timeEntry.taskPh')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeEntry.hours')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              required
              className="input-field"
              placeholder="8"
              min="0.5"
              max="24"
              step="0.5"
            />
            {estimated && <p className="text-sm text-gray-500 mt-1">{estimated}</p>}
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
              disabled={loading || team.length === 0}
            >
              {loading ? t('common.saving') : t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeEntryForm;
