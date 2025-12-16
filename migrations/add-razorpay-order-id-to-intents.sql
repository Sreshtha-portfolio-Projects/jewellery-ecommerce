-- Add razorpay_order_id column to order_intents table
-- This allows linking Razorpay orders to order intents

ALTER TABLE order_intents 
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_order_intents_razorpay_order 
ON order_intents(razorpay_order_id);

 