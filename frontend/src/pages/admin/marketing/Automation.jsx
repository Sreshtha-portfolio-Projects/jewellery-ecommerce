import { useState, useEffect } from 'react';

const Automation = () => {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules');

  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/automation/rules`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/automation/logs?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const toggleRule = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/automation/rules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update rule');

      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Failed to update rule');
    }
  };

  const getTriggerLabel = (trigger) => {
    const labels = {
      user_signup: 'User Signup',
      blog_published: 'Blog Published',
      cart_abandoned: 'Cart Abandoned',
      order_completed: 'Order Completed',
      custom: 'Custom'
    };
    return labels[trigger] || trigger;
  };

  const getActionLabel = (action) => {
    const labels = {
      send_email: 'Send Email',
      send_push: 'Send Push',
      both: 'Email + Push'
    };
    return labels[action] || action;
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      executed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      skipped: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Marketing Automation</h1>

      <div className="mb-6 border-b border-beige-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'rules'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Automation Rules
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'logs'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Execution Logs
          </button>
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trigger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-beige-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {rule.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getTriggerLabel(rule.trigger_type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getActionLabel(rule.action_type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {rule.delay_minutes > 0 ? `${rule.delay_minutes} min` : 'Immediate'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      rule.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => toggleRule(rule.id, rule.is_active)}
                      className={`${
                        rule.is_active 
                          ? 'text-red-600 hover:text-red-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {rule.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No automation rules found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Executed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-beige-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.marketing_automation_rules?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.executed_at ? new Date(log.executed_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {log.error_message || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No execution logs found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Automation;
