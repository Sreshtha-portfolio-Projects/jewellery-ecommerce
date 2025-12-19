-- ============================================
-- RETURNS & INVOICE SETTINGS
-- Run this after add-returns-refunds-system.sql
-- ============================================

-- Add return window setting
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) VALUES
('return_window_days', '7', 'number', 'returns', 'Number of days after delivery that returns can be requested')
ON CONFLICT (setting_key) DO NOTHING;

-- Add invoice/seller settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) VALUES
('seller_name', 'Aldorado Jewells', 'string', 'invoice', 'Business name for invoices'),
('seller_address', 'Your Business Address', 'string', 'invoice', 'Business address for invoices'),
('seller_gstin', 'GSTIN Number', 'string', 'invoice', 'GSTIN number for invoices'),
('seller_phone', 'Customer Support Number', 'string', 'invoice', 'Business phone number for invoices'),
('seller_email', 'support@aldoradojewells.com', 'string', 'invoice', 'Business email for invoices')
ON CONFLICT (setting_key) DO NOTHING;
