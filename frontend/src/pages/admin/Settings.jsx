import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSettings();
      setSettings(response.settings || {});
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category, key, value) => {
    try {
      setSaving(true);
      await adminService.updateSetting(key, value);
      setMessage({ type: 'success', text: 'Setting updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating setting:', error);
      setMessage({ type: 'error', text: 'Failed to update setting' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async (categorySettings) => {
    try {
      setSaving(true);
      const settingsObj = {};
      Object.keys(categorySettings).forEach(key => {
        settingsObj[key] = categorySettings[key].value;
      });
      await adminService.bulkUpdateSettings({ settings: settingsObj });
      setMessage({ type: 'success', text: 'Settings updated successfully' });
      setTimeout(() => setMessage(null), 3000);
      loadSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const SettingInput = ({ category, key, setting }) => {
    const [value, setValue] = useState(setting.value);

    useEffect(() => {
      setValue(setting.value);
    }, [setting.value]);

    const handleChange = (e) => {
      const newValue = setting.type === 'boolean' 
        ? e.target.checked 
        : setting.type === 'number'
        ? parseFloat(e.target.value) || 0
        : e.target.value;
      setValue(newValue);
    };

    const handleSaveClick = () => {
      handleSave(category, key, value);
    };

    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </label>
          {setting.description && (
            <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
          )}
          {setting.type === 'boolean' ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value}
                onChange={handleChange}
                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="text-sm text-gray-700">{value ? 'Enabled' : 'Disabled'}</span>
            </label>
          ) : setting.type === 'number' ? (
            <input
              type="number"
              value={value}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            />
          )}
        </div>
        <button
          onClick={handleSaveClick}
          disabled={saving || value === setting.value}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  const categories = ['pricing', 'tax', 'shipping', 'inventory', 'checkout'];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
        <p className="text-gray-600">Configure system-wide settings</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 capitalize">
            {category} Settings
          </h2>
          <div className="space-y-4">
            {settings[category] && Object.keys(settings[category]).map(key => (
              <SettingInput
                key={key}
                category={category}
                setting={settings[category][key]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Settings;
