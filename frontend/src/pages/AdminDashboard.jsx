import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';

const AdminDashboard = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    const checkHealth = async () => {
      try {
        const data = await adminService.checkHealth();
        setHealthStatus(data);
      } catch (error) {
        console.error('Error checking health:', error);
        setHealthStatus({ status: 'error', message: 'Failed to connect to API' });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome to the Poor Gem admin panel</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="space-y-6">
            {/* Authentication Status */}
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Admin Authenticated</h3>
                  <p className="text-sm text-gray-600">You are successfully logged in as an administrator.</p>
                </div>
              </div>
            </div>

            {/* API Connection Status */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">API Connection Status</h3>
              {healthStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${healthStatus.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-700">
                      Status: <span className="font-medium">{healthStatus.status || 'Unknown'}</span>
                    </span>
                  </div>
                  {healthStatus.message && (
                    <p className="text-sm text-gray-600 ml-6">{healthStatus.message}</p>
                  )}
                  {healthStatus.timestamp && (
                    <p className="text-xs text-gray-500 ml-6">Last checked: {new Date(healthStatus.timestamp).toLocaleString()}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Unable to fetch API status</p>
              )}
            </div>

            {/* Future Features Placeholder */}
            <div className="p-6 bg-beige-50 border border-beige-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-sm text-gray-600">
                Product management, order tracking, and analytics features will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

