import { useState, useEffect } from 'react';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    search: ''
  });

  useEffect(() => {
    fetchSubscribers();
    fetchStats();
  }, [page, filters]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.status && { status: filters.status }),
        ...(filters.source && { source: filters.source }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/subscribers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch subscribers');

      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/subscribers/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      unsubscribed: 'bg-gray-100 text-gray-800',
      bounced: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || colors.active}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Subscribers</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-4">
            <div className="text-sm text-gray-500">Total Subscribers</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.active || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-4">
            <div className="text-sm text-gray-500">Unsubscribed</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">{stats.unsubscribed || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-4">
            <div className="text-sm text-gray-500">Bounced</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.bounced || 0}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>

          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Sources</option>
            <option value="signup">Signup</option>
            <option value="newsletter">Newsletter</option>
            <option value="checkout">Checkout</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-beige-50 border-b border-beige-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-200">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-beige-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {subscriber.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {subscriber.source || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(subscriber.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {subscriber.tags && subscriber.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {subscriber.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(subscriber.subscribed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {subscribers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No subscribers found.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-beige-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-beige-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-beige-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-beige-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Subscribers;
