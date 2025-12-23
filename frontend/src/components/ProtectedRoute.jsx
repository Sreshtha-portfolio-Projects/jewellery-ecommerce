import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveRedirectPath } from '../utils/redirect';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store intended route before redirecting to login
    const intendedPath = location.pathname + location.search + location.hash;
    saveRedirectPath(intendedPath);
    return <Navigate to="/login" state={{ from: intendedPath }} replace />;
  }

  return children;
};

export default ProtectedRoute;
