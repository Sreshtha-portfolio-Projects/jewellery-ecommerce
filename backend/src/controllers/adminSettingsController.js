const supabase = require('../config/supabase');
const configService = require('../services/configService');

/**
 * Get all admin settings
 */
const getSettings = async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('admin_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('setting_key', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: settings, error } = await query;

    if (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ message: 'Error fetching settings' });
    }

    // Format settings by category
    const formatted = {};
    (settings || []).forEach(setting => {
      if (!formatted[setting.category]) {
        formatted[setting.category] = {};
      }
      
      let value = setting.setting_value;
      if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === true;
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = setting.setting_value;
        }
      }

      formatted[setting.category][setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });

    res.json({ settings: formatted, raw: settings });
  } catch (error) {
    console.error('Error in getSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update admin setting
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ message: 'Value is required' });
    }

    // Get existing setting to check type
    const { data: existing } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    if (!existing) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    // Validate and convert value based on type
    let validatedValue = value;
    if (existing.setting_type === 'number') {
      validatedValue = parseFloat(value);
      if (isNaN(validatedValue)) {
        return res.status(400).json({ message: 'Invalid number value' });
      }
    } else if (existing.setting_type === 'boolean') {
      validatedValue = value === true || value === 'true' || value === '1' ? 'true' : 'false';
    } else if (existing.setting_type === 'json') {
      try {
        validatedValue = typeof value === 'string' ? value : JSON.stringify(value);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON value' });
      }
    } else {
      validatedValue = String(value);
    }

    const { data: setting, error } = await supabase
      .from('admin_settings')
      .update({
        setting_value: validatedValue,
        updated_by: req.user.userId,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', key)
      .select()
      .single();

    if (error) {
      console.error('Error updating setting:', error);
      return res.status(500).json({ message: 'Error updating setting' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'setting_updated',
      entity_type: 'admin_setting',
      entity_id: setting.id,
      old_values: { value: existing.setting_value },
      new_values: { value: validatedValue }
    });

    // Clear config cache for this setting
    configService.clearCache(key);

    res.json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    console.error('Error in updateSetting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Bulk update settings
 */
const bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // { key: value, ... }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Settings object is required' });
    }

    const updates = [];
    const errors = [];

    for (const [key, value] of Object.entries(settings)) {
      try {
        // Get existing setting
        const { data: existing } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('setting_key', key)
          .single();

        if (!existing) {
          errors.push({ key, error: 'Setting not found' });
          continue;
        }

        // Validate value
        let validatedValue = value;
        if (existing.setting_type === 'number') {
          validatedValue = parseFloat(value);
          if (isNaN(validatedValue)) {
            errors.push({ key, error: 'Invalid number' });
            continue;
          }
        } else if (existing.setting_type === 'boolean') {
          validatedValue = value === true || value === 'true' || value === '1' ? 'true' : 'false';
        } else if (existing.setting_type === 'json') {
          validatedValue = typeof value === 'string' ? value : JSON.stringify(value);
        } else {
          validatedValue = String(value);
        }

        updates.push({
          key,
          value: validatedValue
        });
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }

    // Perform updates
    for (const update of updates) {
      await supabase
        .from('admin_settings')
        .update({
          setting_value: update.value,
          updated_by: req.user.userId,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', update.key);
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'settings_bulk_updated',
      entity_type: 'admin_settings',
      new_values: { updated_keys: updates.map(u => u.key) }
    });

    // Clear config cache for all updated settings
    updates.forEach(update => {
      configService.clearCache(update.key);
    });

    res.json({
      message: 'Settings updated',
      updated: updates.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in bulkUpdateSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSettings,
  updateSetting,
  bulkUpdateSettings,
};

