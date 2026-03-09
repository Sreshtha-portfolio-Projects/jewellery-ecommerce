import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const EmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/campaigns?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id) => {
    if (!confirm('Are you sure you want to send this campaign? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to send campaign');

      alert('Campaign sent successfully!');
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
        <Link
          to="/admin/marketing/email-campaigns/new"
          className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
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
                    Campaign Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-beige-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.audience}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.status === 'sent' && (
                        <div className="text-xs">
                          <div>Sent: {campaign.sent_count || 0}</div>
                          <div>Opened: {campaign.opened_count || 0}</div>
                          <div>Clicked: {campaign.clicked_count || 0}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <>
                            <Link
                              to={`/admin/marketing/email-campaigns/edit/${campaign.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleSend(campaign.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Send
                            </button>
                          </>
                        )}
                        {campaign.status === 'sent' && (
                          <Link
                            to={`/admin/marketing/email-campaigns/${campaign.id}/analytics`}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            View Stats
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {campaigns.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No campaigns found. Create your first campaign to get started!
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

export default EmailCampaigns;
