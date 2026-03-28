import toast from 'react-hot-toast';

export const handleError = (error, defaultMessage = 'Une erreur est survenue') => {
  const message = error?.response?.data?.message || error?.message || defaultMessage;
  toast.error(message);
  console.error('Error:', error);
};

export const handleSuccess = (message = 'Opération réussie') => {
  toast.success(message);
};

