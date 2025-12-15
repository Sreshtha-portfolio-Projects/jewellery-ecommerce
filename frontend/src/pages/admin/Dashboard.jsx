import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { discountService } from '../../services/discountService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [orders, setOrders] = useState([]);
  const [revenueByMetal, setRevenueByMetal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpisData, ordersData, revenueData] = await Promise.all([
        adminService.getDashboardKPIs().catch(() => null),
        adminService.getAllOrders().catch(() => ({ orders: [] })),
        adminService.getRevenueByMetalType().catch(() => null),
      ]);
      setKpis(kpisData);
      setOrders(ordersData?.orders || ordersData || []);
      setRevenueByMetal(revenueData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty defaults on error
      setKpis(null);
      setOrders([]);
      setRevenueByMetal(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      returned: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Jewelry Business Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your luxury jewelry e-commerce operations</p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Orders"
            value={kpis?.totalOrders || 0}
            icon="📦"
            color="blue"
          />
          <KPICard
            title="Pending Orders"
            value={kpis?.pendingOrders || 0}
            icon="⏰"
            color="yellow"
            tag="Pending"
          />
          <KPICard
            title="Delivered Orders"
            value={kpis?.deliveredOrders || 0}
            icon="✅"
            color="green"
            tag="Complete"
          />
          <KPICard
            title="Returned/Rejected"
            value={kpis?.returnedOrders || 0}
            icon="❌"
            color="red"
            tag="Action Required"
          />
          <KPICard
            title="Shipped Orders"
            value={kpis?.shippedOrders || 0}
            icon="🚚"
            color="blue"
            tag="In Transit"
          />
          <KPICard
            title="Total Revenue"
            value="Coming Soon"
            icon="💰"
            color="green"
            description="Payment integration will enable revenue tracking"
          />
          <KPICard
            title="Conversion Rate"
            value={kpis?.conversionRate ? `${kpis.conversionRate}%` : '0%'}
            icon="📊"
            color="purple"
            trend={kpis?.conversionGrowth ? `+${kpis.conversionGrowth}%` : null}
          />
          <KPICard
            title="Abandoned Carts"
            value={kpis?.abandonedCarts || 0}
            icon="🛒"
            color="red"
            tag="Recovery Needed"
            description="Carts inactive for 24+ hours (Recovery automation coming soon)"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Management */}
          <div className="lg:col-span-2">
            <OrderManagement
              orders={orders}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
            />
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            <RevenueBreakdown revenueByMetal={revenueByMetal} formatCurrency={formatCurrency} />
            <OnlineVsOfflineSales kpis={kpis} />
          </div>
        </div>

        {/* Discount & Promotions */}
        <div className="mt-8">
          <DiscountPromotions navigate={navigate} />
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color, tag, trend, description }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  const tagColors = {
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className={`bg-white rounded-lg border-2 p-6 ${colorClasses[color] || 'bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{icon}</div>
        {tag && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tagColors[color] || 'bg-gray-100'}`}>
            {tag}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            ↗ {trend}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
};

const OrderManagement = ({
  orders,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  formatCurrency,
  formatDate,
  getStatusColor,
}) => {
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">📦</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-gray-900">Order Management</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
        </select>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
          <span>🔍</span>
          <span>More Filters</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {order.id?.slice(0, 8) || 'ORD-' + order.id?.substring(0, 4)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.customer_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(order.total_amount || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View
                      </button>
                      <button className="text-rose-600 hover:text-rose-800 text-sm font-medium">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RevenueBreakdown = ({ revenueByMetal, formatCurrency }) => {
  const data = revenueByMetal || [
    { metal_type: 'Gold', revenue: 136170, percentage: 45 },
    { metal_type: 'Diamond', revenue: 105910, percentage: 35 },
    { metal_type: 'Silver', revenue: 60520, percentage: 20 },
  ];

  const total = data.reduce((sum, item) => sum + (item.revenue || 0), 0);

  const colors = {
    Gold: 'bg-yellow-400',
    Diamond: 'bg-purple-400',
    Silver: 'bg-gray-400',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <h3 className="font-semibold text-gray-900">Revenue Breakdown</h3>
        </div>
        <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
          <option>7 Days</option>
          <option>30 Days</option>
          <option>90 Days</option>
        </select>
      </div>

      {/* Pie Chart Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {data.map((item, index) => {
                const prevPercentage = data
                  .slice(0, index)
                  .reduce((sum, i) => sum + (i.percentage || 0), 0);
                const percentage = item.percentage || 0;
                const circumference = 2 * Math.PI * 45;
                const offset = circumference - (prevPercentage / 100) * circumference;
                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

                return (
                  <circle
                    key={item.metal_type}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={item.metal_type === 'Gold' ? '#fbbf24' : item.metal_type === 'Diamond' ? '#a855f7' : '#9ca3af'}
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={offset}
                    className="transition-all"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.metal_type} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  colors[item.metal_type] || 'bg-gray-400'
                }`}
              ></div>
              <span className="text-sm font-medium text-gray-700">{item.metal_type}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {item.percentage || 0}%
              </p>
              <p className="text-xs text-gray-500">
                {formatCurrency(item.revenue || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OnlineVsOfflineSales = ({ kpis }) => {
  // Use real data from KPIs
  const onlineRevenue = kpis?.onlineRevenue || 0;
  const offlineRevenue = kpis?.offlineRevenue || 0;
  const totalRevenue = onlineRevenue + offlineRevenue;
  
  // For chart visualization, show last 7 days (simplified)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Distribute revenue across days (simplified - in production, fetch daily data)
  const onlineData = days.map(() => onlineRevenue / 7);
  const offlineData = days.map(() => offlineRevenue / 7);
  const maxValue = Math.max(...onlineData, ...offlineData, 1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Online vs Offline Sales</h3>
      <div className="space-y-2">
        {days.map((day, index) => (
          <div key={month} className="flex items-center gap-2">
            <div className="w-12 text-xs text-gray-600">{day}</div>
            <div className="flex-1 flex gap-1">
              <div
                className="bg-blue-500 rounded"
                style={{ width: `${(onlineData[index] / maxValue) * 100}%`, height: '24px' }}
                title={`Online: ${onlineData[index]}`}
              ></div>
              <div
                className="bg-orange-500 rounded"
                style={{ width: `${(offlineData[index] / maxValue) * 100}%`, height: '24px' }}
                title={`Offline: ${offlineData[index]}`}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-xs text-gray-600">
            Online: ₹{onlineRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-xs text-gray-600">
            Offline: ₹{offlineRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Online: Orders placed via website. Offline: Manual orders (coming soon).
      </p>
    </div>
  );
};

const DiscountPromotions = ({ navigate }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await discountService.getAll();
      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeDiscounts = discounts.filter(d => d.is_active && (!d.expires_at || new Date(d.expires_at) > new Date()));
  const expiredDiscounts = discounts.filter(d => !d.is_active || (d.expires_at && new Date(d.expires_at) <= new Date()));
  const percentageDiscounts = activeDiscounts.filter(d => d.discount_type === 'percentage');
  const flatDiscounts = activeDiscounts.filter(d => d.discount_type === 'flat');

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">🎫</span>
          </div>
          <h3 className="font-semibold text-gray-900">Discount & Promotions</h3>
        </div>
        <button 
          onClick={() => navigate('/admin/discounts')}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          + Create Discount
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-900">{percentageDiscounts.length} Active</p>
              <p className="text-xs text-gray-600">Percentage discounts</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            Active
          </span>
        </div>
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">@</span>
            <div>
              <p className="font-semibold text-gray-900">{flatDiscounts.length} Active</p>
              <p className="text-xs text-gray-600">Flat discount codes</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            Active
          </span>
        </div>
        <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="font-semibold text-gray-900">{expiredDiscounts.length} Expired</p>
              <p className="text-xs text-gray-600">Expired discounts</p>
            </div>
          </div>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
            Expired
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
