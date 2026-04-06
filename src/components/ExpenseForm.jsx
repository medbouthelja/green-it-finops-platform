import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

const defaultForm = () => ({
  description: '',
  amount: '',
  category: 'other',
  date: new Date().toISOString().split('T')[0],
});

const ExpenseForm = ({ project, expense, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(expense);

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount != null && expense.amount !== '' ? String(expense.amount) : '',
        category: expense.category || 'other',
        date: expense.date || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData(defaultForm());
    }
  }, [expense, project?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.description || !formData.amount) {
        toast.error(t('expenseForm.required'));
        setLoading(false);
        return;
      }

      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        projectId: project.id,
      });
    } catch (error) {
      if (error?.message !== 'validation') {
        toast.error(t('expenseForm.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? t('expenseForm.editTitle') : t('expenseForm.addTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('expenseForm.description')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="input-field"
              placeholder={t('expenseForm.descPh')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('expenseForm.amount')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="input-field"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('expenseForm.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                <option value="cloud">{t('expenseForm.catCloud')}</option>
                <option value="licenses">{t('expenseForm.catLicenses')}</option>
                <option value="infrastructure">{t('expenseForm.catInfra')}</option>
                <option value="services">{t('expenseForm.catServices')}</option>
                <option value="other">{t('expenseForm.catOther')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('expenseForm.date')}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field"
            />
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
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('common.saving') : isEdit ? t('expenseForm.save') : t('expenseForm.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
