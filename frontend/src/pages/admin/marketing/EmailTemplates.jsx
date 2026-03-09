import { useState, useEffect } from 'react';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: '',
    category: 'marketing'
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html: template.html,
      category: template.category || 'marketing'
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingTemplate
        ? `${import.meta.env.VITE_API_URL}/api/admin/email/templates/${editingTemplate.id}`
        : `${import.meta.env.VITE_API_URL}/api/admin/email/templates`;

      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save template');

      setShowForm(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        html: '',
        category: 'marketing'
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (id, isSystem) => {
    if (isSystem) {
      alert('Cannot delete system templates');
      return;
    }

    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/email/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete template');

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingTemplate(null);
            setFormData({
              name: '',
              subject: '',
              html: '',
              category: 'marketing'
            });
          }}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Template'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
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
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="Use {{variable_name}} for dynamic content"
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content *
              </label>
              <textarea
                name="html"
                value={formData.html}
                onChange={handleChange}
                required
                rows={12}
                placeholder="Use {{variable_name}} for dynamic content"
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: customer_name, discount_code, blog_title, blog_url, cart_url, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-beige-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="marketing">Marketing</option>
                <option value="transactional">Transactional</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-beige-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {template.subject}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {template.category || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {template.is_system && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        System
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      {!template.is_system && (
                        <button
                          onClick={() => handleDelete(template.id, template.is_system)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {templates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No templates found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
