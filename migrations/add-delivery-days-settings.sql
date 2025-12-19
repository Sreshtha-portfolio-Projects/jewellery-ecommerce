-- ============================================
-- DELIVERY DAYS SETTINGS
-- Add configurable delivery days for estimated delivery calculation
-- ============================================

-- Add delivery days settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) VALUES
('delivery_days_min', '3', 'number', 'shipping', 'Minimum estimated delivery days (business days)'),
('delivery_days_max', '5', 'number', 'shipping', 'Maximum estimated delivery days (business days)')
ON CONFLICT (setting_key) DO NOTHING;
