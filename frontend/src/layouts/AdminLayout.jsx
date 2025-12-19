import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/products', label: 'Products', icon: '💎' },
    { path: '/admin/orders', label: 'Orders', icon: '📦' },
    { path: '/admin/returns', label: 'Returns', icon: '🔄' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/discounts', label: 'Discounts', icon: '🎫' },
    { path: '/admin/pricing-rules', label: 'Pricing Rules', icon: '💰' },
    { path: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: '🛒' },
    { path: '/admin/customers', label: 'Customers', icon: '👥' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-screen">
        {/* Logo/Branding */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-2xl">
              👑
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold">Aldorado Jewells</h1>
              <p className="text-xs text-gray-400">Business Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Premium Plan CTA */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm font-semibold text-yellow-400">Premium Plan</span>
            </div>
            <p className="text-xs text-gray-400">
              Upgrade for advanced analytics and unlimited features.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Bar with Logout */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
