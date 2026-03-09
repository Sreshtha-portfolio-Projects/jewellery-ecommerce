import { useState, useEffect } from 'react';

const MarketingAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [emailAnalytics, setEmailAnalytics] = useState([]);
  const [pushAnalytics, setPushAnalytics] = useState([]);
  const [subscriberStats, setSubscriberStats] = useState(null);
  const [blogStats, setBlogStats] = useState([]);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [emailRes, pushRes, subsRes, blogsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/analytics`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/push/analytics`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/subscribers/stats`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/blogs?status=published&limit=5`, { headers })
      ]);

      if (emailRes.ok) {
        const data = await emailRes.json();
        setEmailAnalytics(data.slice(0, 5));
      }

      if (pushRes.ok) {
        const data = await pushRes.json();
        setPushAnalytics(data.slice(0, 5));
      }

      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubscriberStats(data);
      }

      if (blogsRes.ok) {
        const data = await blogsRes.json();
        setBlogStats(data.blogs || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Marketing Analytics</h1>

      {subscriberStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
            <div className="text-sm text-gray-500 mb-1">Total Subscribers</div>
            <div className="text-3xl font-bold text-gray-900">{subscriberStats.total || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
            <div className="text-sm text-gray-500 mb-1">Active Subscribers</div>
            <div className="text-3xl font-bold text-green-600">{subscriberStats.active || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
            <div className="text-sm text-gray-500 mb-1">Email Campaigns</div>
            <div className="text-3xl font-bold text-gray-900">{emailAnalytics.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
            <div className="text-sm text-gray-500 mb-1">Push Campaigns</div>
            <div className="text-3xl font-bold text-gray-900">{pushAnalytics.length}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Campaign Performance</h2>
          {emailAnalytics.length > 0 ? (
            <div className="space-y-4">
              {emailAnalytics.map((campaign) => (
                <div key={campaign.id} className="border-b border-beige-200 pb-4 last:border-0">
                  <div className="font-medium text-gray-900 mb-2">{campaign.name}</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Sent</div>
                      <div className="font-semibold">{campaign.sent_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Open Rate</div>
                      <div className="font-semibold text-green-600">{campaign.open_rate || 0}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Click Rate</div>
                      <div className="font-semibold text-blue-600">{campaign.click_rate || 0}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No email campaigns sent yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Push Notification Performance</h2>
          {pushAnalytics.length > 0 ? (
            <div className="space-y-4">
              {pushAnalytics.map((campaign) => (
                <div key={campaign.id} className="border-b border-beige-200 pb-4 last:border-0">
                  <div className="font-medium text-gray-900 mb-2">{campaign.title}</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Sent</div>
                      <div className="font-semibold">{campaign.sent_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Clicks</div>
                      <div className="font-semibold">{campaign.click_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Click Rate</div>
                      <div className="font-semibold text-blue-600">{campaign.click_rate || 0}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No push campaigns sent yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Blogs</h2>
        {blogStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-beige-50 border-b border-beige-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Views
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-200">
                {blogStats.map((blog) => (
                  <tr key={blog.id} className="hover:bg-beige-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{blog.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{blog.category || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{blog.views || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {blog.publish_date ? new Date(blog.publish_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No published blogs yet</p>
        )}
      </div>
    </div>
  );
};

export default MarketingAnalytics;
