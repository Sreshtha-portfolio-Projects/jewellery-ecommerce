import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminService } from '../../services/adminService';

const Analytics = () => {
  const [revenueByMetal, setRevenueByMetal] = useState([]);
  const [salesComparison, setSalesComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [revenueData, salesData] = await Promise.all([
        adminService.getRevenueByMetalType(),
        adminService.getSalesComparison('monthly'),
      ]);
      setRevenueByMetal(revenueData || []);
      setSalesComparison(salesData || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const COLORS = ['#fbbf24', '#a855f7', '#9ca3af', '#3b82f6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const displayRevenueData = revenueByMetal;
  const displaySalesData = salesComparison;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Revenue by Metal Type */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-6">Revenue by Metal Type</h2>
          {displayRevenueData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-4 text-lg font-medium">No revenue data available</p>
                <p className="mt-1 text-sm">Data will appear once orders are placed</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={displayRevenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ metal_type, percentage }) => `${metal_type}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {displayRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {displayRevenueData.map((item, index) => (
                  <div key={item.metal_type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-gray-900">{item.metal_type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.percentage || 0}%</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.revenue || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sales Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-6">Online vs Offline Sales</h2>
          {displaySalesData.length === 0 ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-4 text-lg font-medium">No sales data available</p>
                <p className="mt-1 text-sm">Data will appear once orders are placed</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={displaySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="online" fill="#3b82f6" name="Online" />
                <Bar dataKey="offline" fill="#f97316" name="Offline" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sales Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-6">Sales Trend</h2>
          {displaySalesData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="mt-4 text-lg font-medium">No sales trend data available</p>
                <p className="mt-1 text-sm">Trends will appear once orders are placed</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={displaySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="online" stroke="#3b82f6" name="Online Sales" />
                <Line type="monotone" dataKey="offline" stroke="#f97316" name="Offline Sales" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
