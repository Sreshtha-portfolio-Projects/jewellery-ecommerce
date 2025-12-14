import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AccountLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/account/profile', label: 'Profile', icon: '👤' },
    { path: '/account/orders', label: 'Orders', icon: '📦' },
    { path: '/account/wishlist', label: 'Wishlist', icon: '❤️' },
    { path: '/account/addresses', label: 'Saved Addresses', icon: '📍' },
    { path: '/account/coupons', label: 'Coupons', icon: '🎫', disabled: true },
    { path: '/account/support', label: 'Contact Support', icon: '💬', disabled: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-beige-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Welcome back, {user?.name || user?.email}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Menu */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  if (item.disabled) {
                    return (
                      <div
                        key={item.path}
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 cursor-not-allowed"
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded">Soon</span>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-rose-50 text-rose-700 font-medium'
                          : 'text-gray-700 hover:bg-beige-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors mt-4"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
