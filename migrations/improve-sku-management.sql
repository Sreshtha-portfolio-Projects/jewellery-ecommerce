-- ============================================
-- IMPROVED SKU MANAGEMENT SYSTEM
-- Run this after supabase-product-variants-pricing.sql
-- ============================================

-- Function to generate SKU for products
CREATE OR REPLACE FUNCTION generate_product_sku(
  p_name VARCHAR(255),
  p_category VARCHAR(50),
  p_id UUID
)
RETURNS VARCHAR(100) AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_name_part VARCHAR(20);
  v_id_part VARCHAR(8);
  v_sku VARCHAR(100);
  v_counter INTEGER := 0;
BEGIN
  -- Get category prefix (first 3 letters, uppercase)
  v_prefix := UPPER(SUBSTRING(COALESCE(p_category, 'GEN'), 1, 3));
  
  -- Get first 3 letters of product name (uppercase, no spaces)
  v_name_part := UPPER(REGEXP_REPLACE(SUBSTRING(p_name, 1, 3), '[^A-Z0-9]', '', 'g'));
  IF LENGTH(v_name_part) < 3 THEN
    v_name_part := LPAD(v_name_part, 3, 'X');
  END IF;
  
  -- Get last 4 characters of UUID
  v_id_part := UPPER(SUBSTRING(p_id::text, 1, 4));
  
  -- Generate base SKU: CAT-PROD-XXXX
  v_sku := v_prefix || '-' || v_name_part || '-' || v_id_part;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM products WHERE sku = v_sku AND id != p_id) LOOP
    v_counter := v_counter + 1;
    v_sku := v_prefix || '-' || v_name_part || '-' || v_id_part || '-' || v_counter;
  END LOOP;
  
  RETURN v_sku;
END;
$$ LANGUAGE plpgsql;

-- Function to generate SKU for variants
CREATE OR REPLACE FUNCTION generate_variant_sku(
  p_product_sku VARCHAR(100),
  p_size VARCHAR(50),
  p_color VARCHAR(50),
  p_finish VARCHAR(50),
  p_variant_id UUID
)
RETURNS VARCHAR(100) AS $$
DECLARE
  v_size_code VARCHAR(3) := '';
  v_color_code VARCHAR(3) := '';
  v_finish_code VARCHAR(2) := '';
  v_id_part VARCHAR(4);
  v_sku VARCHAR(100);
  v_counter INTEGER := 0;
BEGIN
  -- Get size code (first 2-3 chars, uppercase)
  IF p_size IS NOT NULL THEN
    v_size_code := UPPER(REGEXP_REPLACE(SUBSTRING(p_size, 1, 3), '[^A-Z0-9]', '', 'g'));
    IF LENGTH(v_size_code) < 2 THEN
      v_size_code := LPAD(v_size_code, 2, '0');
    END IF;
  END IF;
  
  -- Get color code (first 2-3 chars, uppercase)
  IF p_color IS NOT NULL THEN
    v_color_code := UPPER(REGEXP_REPLACE(SUBSTRING(p_color, 1, 2), '[^A-Z0-9]', '', 'g'));
    IF LENGTH(v_color_code) < 2 THEN
      v_color_code := LPAD(v_color_code, 2, 'X');
    END IF;
  END IF;
  
  -- Get finish code (first 2 chars, uppercase)
  IF p_finish IS NOT NULL THEN
    v_finish_code := UPPER(REGEXP_REPLACE(SUBSTRING(p_finish, 1, 2), '[^A-Z0-9]', '', 'g'));
    IF LENGTH(v_finish_code) < 2 THEN
      v_finish_code := LPAD(v_finish_code, 2, 'X');
    END IF;
  END IF;
  
  -- Get last 2 characters of variant UUID
  v_id_part := UPPER(SUBSTRING(p_variant_id::text, 1, 2));
  
  -- Generate variant SKU: PRODUCT-SKU-SIZE-COLOR-FINISH-XX
  IF v_size_code != '' OR v_color_code != '' OR v_finish_code != '' THEN
    v_sku := p_product_sku || '-' || 
             COALESCE(v_size_code, 'XX') || '-' || 
             COALESCE(v_color_code, 'XX') || '-' || 
             COALESCE(v_finish_code, 'XX') || '-' || 
             v_id_part;
  ELSE
    -- If no variant attributes, use simpler format
    v_sku := p_product_sku || '-VAR-' || v_id_part;
  END IF;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM product_variants WHERE sku = v_sku AND id != p_variant_id) LOOP
    v_counter := v_counter + 1;
    v_sku := v_sku || '-' || v_counter;
  END LOOP;
  
  RETURN v_sku;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate product SKU if not provided
CREATE OR REPLACE FUNCTION auto_generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := generate_product_sku(NEW.name, NEW.category, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_product_sku ON products;
CREATE TRIGGER trigger_auto_generate_product_sku
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_product_sku();

-- Trigger to auto-generate variant SKU if not provided
CREATE OR REPLACE FUNCTION auto_generate_variant_sku()
RETURNS TRIGGER AS $$
DECLARE
  v_product_sku VARCHAR(100);
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    -- Get product SKU
    SELECT sku INTO v_product_sku FROM products WHERE id = NEW.product_id;
    
    IF v_product_sku IS NOT NULL THEN
      NEW.sku := generate_variant_sku(
        v_product_sku,
        NEW.size,
        NEW.color,
        NEW.finish,
        NEW.id
      );
    ELSE
      -- Fallback if product SKU not found
      NEW.sku := 'VAR-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_variant_sku ON product_variants;
CREATE TRIGGER trigger_auto_generate_variant_sku
  BEFORE INSERT ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_variant_sku();

-- Update existing products without SKU
UPDATE products 
SET sku = generate_product_sku(name, category, id)
WHERE sku IS NULL OR sku = '';

-- Update existing variants without SKU
UPDATE product_variants pv
SET sku = generate_variant_sku(
  (SELECT sku FROM products WHERE id = pv.product_id),
  pv.size,
  pv.color,
  pv.finish,
  pv.id
)
WHERE pv.sku IS NULL OR pv.sku = '';

-- Add comments
COMMENT ON FUNCTION generate_product_sku IS 'Generates unique SKU for products: CAT-PROD-XXXX format';
COMMENT ON FUNCTION generate_variant_sku IS 'Generates unique SKU for variants: PRODUCT-SKU-SIZE-COLOR-FINISH-XX format';
