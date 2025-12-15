const supabase = require('../config/supabase');

/**
 * Create variant for a product
 */
const createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color, finish, weight, stock_quantity, sku, price_override, is_active = true } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Verify product exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        size: size || null,
        color: color || null,
        finish: finish || null,
        weight: weight ? parseFloat(weight) : null,
        stock_quantity: parseInt(stock_quantity || 0),
        sku: sku || null,
        price_override: price_override ? parseFloat(price_override) : null,
        is_active
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint
        return res.status(400).json({ message: 'Variant with these attributes already exists' });
      }
      console.error('Error creating variant:', error);
      return res.status(500).json({ message: 'Error creating variant' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'variant_created',
      entity_type: 'product_variant',
      entity_id: variant.id,
      new_values: { product_id: productId, size, color, stock_quantity }
    });

    res.status(201).json({ message: 'Variant created successfully', variant });
  } catch (error) {
    console.error('Error in createVariant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update variant
 */
const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { size, color, finish, weight, stock_quantity, sku, price_override, is_active } = req.body;

    const updateData = {};
    if (size !== undefined) updateData.size = size;
    if (color !== undefined) updateData.color = color;
    if (finish !== undefined) updateData.finish = finish;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (stock_quantity !== undefined) updateData.stock_quantity = parseInt(stock_quantity);
    if (sku !== undefined) updateData.sku = sku;
    if (price_override !== undefined) updateData.price_override = price_override ? parseFloat(price_override) : null;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    const { data: variant, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating variant:', error);
      return res.status(500).json({ message: 'Error updating variant' });
    }

    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    res.json({ message: 'Variant updated successfully', variant });
  } catch (error) {
    console.error('Error in updateVariant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete variant
 */
const deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) {
      console.error('Error deleting variant:', error);
      return res.status(500).json({ message: 'Error deleting variant' });
    }

    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Error in deleteVariant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createVariant,
  updateVariant,
  deleteVariant,
};

