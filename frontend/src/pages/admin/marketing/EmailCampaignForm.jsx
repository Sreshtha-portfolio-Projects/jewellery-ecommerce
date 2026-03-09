import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EmailCampaignForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    template_id: '',
    html_content: '',
    audience: 'all',
    scheduled_at: ''
  });

  useEffect(() => {
    fetchTemplates();
    if (isEdit) {
      fetchCampaign();
    }
  }, [id]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchCampaign = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/campaigns?page=1&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch campaign');

      const data = await response.json();
      const campaign = data.campaigns.find(c => c.id === id);
      
      if (campaign) {
        setFormData({
          name: campaign.name || '',
          subject: campaign.subject || '',
          template_id: campaign.template_id || '',
          html_content: campaign.html_content || '',
          audience: campaign.audience || 'all',
          scheduled_at: campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : ''
        });
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/api/admin/email/campaigns/${id}`
        : `${import.meta.env.VITE_API_URL}/api/admin/email/campaigns`;

      const method = isEdit ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) throw new Error('Failed to save campaign');

      navigate('/admin/marketing/email-campaigns');
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/marketing/email-campaigns')}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Campaigns
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Template
            </label>
            <select
              name="template_id"
              value={formData.template_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Select Template (or write custom HTML below)</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom HTML Content
            </label>
            <textarea
              name="html_content"
              value={formData.html_content}
              onChange={handleChange}
              rows={10}
              placeholder="Leave empty to use template, or write custom HTML here..."
              className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <option value="all">All Subscribers</option>
                <option value="subscribers">Newsletter Subscribers</option>
                <option value="customers">Customers Only</option>
                <option value="vip">VIP Customers</option>
                <option value="cart_abandoners">Cart Abandoners</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Send (Optional)
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-beige-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Campaign' : 'Create Campaign')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/marketing/email-campaigns')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmailCampaignForm;
