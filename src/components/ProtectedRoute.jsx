import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { canAccess, getHomePath } from '../utils/roles';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !canAccess(user, requiredRoles)) {
    return <Navigate to={getHomePath()} replace />;
  }

  return children;
};

export default ProtectedRoute;

