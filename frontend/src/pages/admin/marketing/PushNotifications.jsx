import { useState, useEffect } from 'react';

const PushNotifications = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image: '',
    redirect_url: '',
    audience: 'all'
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/push/campaigns?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendNow = async (e) => {
    e.preventDefault();
    
    if (!confirm('Send this push notification now?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to send notification');

      alert('Push notification sent successfully!');
      setShowForm(false);
      setFormData({
        title: '',
        message: '',
        image: '',
        redirect_url: '',
        audience: 'all'
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
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
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Send Notification'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Push Notification</h2>
          
          <form onSubmit={handleSendNow} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={50}
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/50 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                maxLength={150}
                rows={3}
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.message.length}/150 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redirect URL (Optional)
              </label>
              <input
                type="text"
                name="redirect_url"
                value={formData.redirect_url}
                onChange={handleChange}
                placeholder="/products or https://example.com"
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audience *
              </label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Users</option>
                <option value="logged_in">Logged-in Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="cart_abandoners">Cart Abandoners</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Now'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-beige-200">
          <h2 className="text-lg font-semibold text-gray-900">Campaign History</h2>
        </div>

        <table className="w-full">
          <thead className="bg-beige-50 border-b border-beige-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Audience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-beige-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-beige-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                  <div className="text-xs text-gray-500">{campaign.message}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {campaign.audience}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(campaign.status)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {campaign.sent_count || 0}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {campaign.click_count || 0}
                  {campaign.sent_count > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({Math.round((campaign.click_count / campaign.sent_count) * 100)}%)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {campaigns.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No campaigns sent yet. Create your first push notification!
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotifications;
