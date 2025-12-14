import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = ({ onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/orders', label: 'Orders', icon: '📦' },
    { path: '/admin/products', label: 'Products', icon: '💎' },
    { path: '/admin/customers', label: 'Customers', icon: '👥' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/inventory', label: 'Inventory', icon: '📋' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-beige-200 min-h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-beige-200">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Aldorado Jewels</h1>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-rose-50 text-rose-700 font-medium border-l-4 border-rose-600'
                : 'text-gray-700 hover:bg-beige-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-beige-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
