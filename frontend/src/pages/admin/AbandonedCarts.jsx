import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const AbandonedCarts = () => {
  const [carts, setCarts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAbandonedCarts();
    fetchStats();
  }, [selectedTab]);

  const fetchAbandonedCarts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let status = null;
      if (selectedTab === 'active') status = 'ACTIVE';
      else if (selectedTab === 'abandoned') status = 'ABANDONED';
      else if (selectedTab === 'recovered') status = 'RECOVERED';
      else if (selectedTab === 'expired') status = 'EXPIRED';
      
      const data = await adminService.getAbandonedCarts(status);
      
      const formattedCarts = (data.abandoned_carts || []).map(cart => ({
        id: cart.id,
        customer: cart.user?.email || 'Guest',
        phone: cart.user?.raw_user_meta_data?.phone || 'N/A',
        items: `${cart.item_count} items`,
        value: parseFloat(cart.cart_value || 0),
        lastActivity: formatTimeAgo(cart.last_activity_at),
        status: cart.status.toLowerCase(),
        rawData: cart
      }));
      
      setCarts(formattedCarts);
    } catch (err) {
      console.error('Error fetching abandoned carts:', err);
      setError('Failed to load abandoned carts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminService.getAbandonedCartStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching abandoned cart stats:', err);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'active', label: 'Active', count: stats?.total_active || 0 },
    { id: 'abandoned', label: 'Abandoned', count: stats?.total_abandoned || 0 },
    { id: 'recovered', label: 'Recovered', count: 0 },
    { id: 'total', label: 'All', count: (stats?.total_active || 0) + (stats?.total_abandoned || 0) },
  ];

  const filteredCarts = carts;

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAbandonedCarts}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Retry
          </button>
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
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Abandoned</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.total_abandoned}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Active Carts</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.total_active}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Abandoned Value</h3>
              <p className="text-3xl font-bold text-rose-600">{formatCurrency(stats.abandoned_value)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Abandonment Rate</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.abandonment_rate}%</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Abandoned Cart Table */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="font-semibold text-gray-900">Abandoned Cart Recovery</h2>
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
                                  : cart.status === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : cart.status === 'abandoned'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : cart.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {cart.status.charAt(0).toUpperCase() + cart.status.slice(1)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbandonedCarts;
