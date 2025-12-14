import { useState, useEffect } from 'react';

const AbandonedCarts = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active');

  useEffect(() => {
    // TODO: Fetch abandoned carts from API when endpoint is available
    // For now, using mock data
    setTimeout(() => {
      setCarts([
        {
          id: 'CART-001',
          customer: 'Ajay Kumar',
          phone: '+91 9876543210',
          items: 'Diamond Earrings, Gold Chain',
          value: 67500,
          lastActivity: '3 hours ago',
          status: 'pending',
        },
        {
          id: 'CART-002',
          customer: 'Priya Sharma',
          phone: '+91 9876543211',
          items: 'Silver Bracelet',
          value: 12300,
          lastActivity: '5 hours ago',
          status: 'pending',
        },
        {
          id: 'CART-003',
          customer: 'Raj Mehta',
          phone: '+91 9876543212',
          items: 'Gold Ring, Pendant',
          value: 45200,
          lastActivity: '1 day ago',
          status: 'recovered',
        },
        {
          id: 'CART-004',
          customer: 'Sneha Patel',
          phone: '+91 9876543213',
          items: 'Diamond Necklace',
          value: 89900,
          lastActivity: '2 days ago',
          status: 'pending',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'active', label: 'Active', count: carts.filter((c) => c.status === 'pending').length },
    { id: 'recovered', label: 'Recovered', count: carts.filter((c) => c.status === 'recovered').length },
    { id: 'expired', label: 'Expired', count: carts.filter((c) => c.status === 'expired').length },
    { id: 'total', label: 'Total Uses', count: carts.length },
  ];

  const filteredCarts = carts.filter((cart) => {
    if (selectedTab === 'active') return cart.status === 'pending';
    if (selectedTab === 'recovered') return cart.status === 'recovered';
    if (selectedTab === 'expired') return cart.status === 'expired';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading abandoned carts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Abandoned Cart Recovery</h1>
        <p className="text-gray-600 mt-1">Recover lost sales from abandoned shopping carts</p>
      </header>

      <div className="p-8">
        {/* Discount Usage Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Discount Usage This Week</h2>
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
          {/* Simple line chart visualization */}
          <div className="h-64 flex items-end justify-between gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const height = [12, 8, 4, 15, 20, 28, 24][index];
              return (
                <div key={day} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                    style={{ height: `${(height / 32) * 100}%` }}
                    title={`${day}: ${height}`}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Abandoned Cart Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-6">Abandoned Cart Recovery</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cart ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCarts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          No abandoned carts found
                        </td>
                      </tr>
                    ) : (
                      filteredCarts.map((cart) => (
                        <tr key={cart.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cart.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cart.customer}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cart.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cart.items}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {formatCurrency(cart.value)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cart.lastActivity}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cart.status === 'recovered'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {cart.status === 'recovered' ? 'Recovered' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-blue-600 hover:text-blue-800">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cart Recovery Performance */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h2 className="font-semibold text-gray-900 mb-6">Cart Recovery Performance</h2>
              <div className="h-64 flex items-end justify-between gap-2 mb-6">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const greenHeight = [15000, 18000, 12000, 20000, 25000, 30000, 28000][index];
                  const orangeHeight = [10000, 12000, 8000, 15000, 20000, 25000, 22000][index];
                  const maxValue = 40000;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-1">
                        <div
                          className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600"
                          style={{ height: `${(greenHeight / maxValue) * 100}%` }}
                          title={`Recovered: ${formatCurrency(greenHeight)}`}
                        ></div>
                        <div
                          className="flex-1 bg-orange-500 rounded-t transition-all hover:bg-orange-600"
                          style={{ height: `${(orangeHeight / maxValue) * 100}%` }}
                          title={`Lost: ${formatCurrency(orangeHeight)}`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 mt-2">{day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <span>💬</span>
                  <span>Bulk WhatsApp Campaign</span>
                </button>
                <button className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2">
                  <span>📧</span>
                  <span>Email Sequence</span>
                </button>
                <button className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2">
                  <span>🔄</span>
                  <span>Auto Recovery</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Weekly Sales Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Weekly Sales</h3>
              <div className="h-48 flex items-end justify-between gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const height = [8000, 10000, 12000, 9000, 15000, 18000, 16000][index];
                  const maxValue = 20000;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${(height / maxValue) * 100}%` }}
                        title={`${day}: ${formatCurrency(height)}`}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span>🔔</span>
                  <span>Activity Feed</span>
                </h3>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                  View All
                </a>
              </div>
              <div className="space-y-4">
                <ActivityItem
                  title="5 orders pending shipping"
                  priority="High"
                  time="2 minutes ago"
                  action="Take Action"
                />
                <ActivityItem
                  title="Stock low for Rose Gold Ba..."
                  priority="Medium"
                  time="15 minutes ago"
                />
                <ActivityItem
                  title="New 10% Offer expiring in 2 d..."
                  priority="Low"
                  time="1 hour ago"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ title, priority, time, action }) => {
  const priorityColors = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority]}`}>
          {priority}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{time}</p>
        {action && (
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">{action}</button>
        )}
      </div>
    </div>
  );
};

export default AbandonedCarts;
