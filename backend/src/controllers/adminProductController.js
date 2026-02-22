const supabase = require('../config/supabase');

/**
 * Pricing model:
 *   overhead_amount       = labour_cost_internal × overhead_percent / 100
 *   subtotal              = metal + stone + labour_cost_internal + overhead_amount
 *   margin_amount         = subtotal × margin_percent / 100
 *   final_total_price     = subtotal + margin_amount
 *   labour_charge_visible = final_total_price − metal − stone
 *
 * Customers only ever see: metal_amount, stone_amount, labour_charge_visible, final_total_price.
 * overhead_amount, margin_amount, labour_cost_internal are admin-only.
 */
function calculatePricing({ metals = [], stones = [], labour = [], overhead_percent = 0, margin_percent = 0 }) {
  const metal_amount = metals.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const stone_amount = stones.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const labour_cost_internal = labour.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  const overhead_amount = labour_cost_internal * (parseFloat(overhead_percent) || 0) / 100;
  const subtotal = metal_amount + stone_amount + labour_cost_internal + overhead_amount;
  const margin_amount = subtotal * (parseFloat(margin_percent) || 0) / 100;
  const final_total_price = subtotal + margin_amount;
  const labour_charge_visible = final_total_price - metal_amount - stone_amount;

  return {
    metal_amount,
    stone_amount,
    labour_cost_internal,
    overhead_amount,
    margin_amount,
    final_total_price,
    labour_charge_visible,
    cost_price: metal_amount + stone_amount + labour_cost_internal,
    selling_price: final_total_price,
  };
}

/**
 * Get all products (admin view with full details)
 */
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, is_active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(count),
        images:product_images(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (is_active !== undefined && is_active !== '') {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Error fetching products' });
    }

    // Calculate total stock from variants
    const productsWithStock = await Promise.all(
      (products || []).map(async (product) => {
        const { data: variants } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('product_id', product.id);

        const totalStock = variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;

        return {
          ...product,
          total_stock: totalStock,
          variant_count: variants?.length || 0
        };
      })
    );

    res.json({
      products: productsWithStock,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get single product with variants and images
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: true });

    // Get product images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('display_order', { ascending: true });

    // Get variant images
    const variantIds = variants?.map(v => v.id) || [];
    const { data: variantImages } = variantIds.length > 0
      ? await supabase
          .from('variant_images')
          .select('*')
          .in('variant_id', variantIds)
          .order('display_order', { ascending: true })
      : { data: [] };

    res.json({
      ...product,
      variants: variants || [],
      images: images || [],
      variant_images: variantImages || []
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create new product
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      short_description,
      category,
      metal_type,
      purity,
      karat,
      base_price,
      is_active = true,
      is_bestseller = false,
      variants = [],
      images = [],
      // Jewellery costing fields
      item_code,
      family,
      item_type,
      pieces,
      metals = [],
      stones = [],
      labour = [],
      add_charge = 0,
      cost_price = 0,
      overhead_percent = 0,
      overhead_amount = 0,
      margin_percent = 0,
      margin_amount = 0,
      selling_price = 0,
      gross_weight = 0,
      net_weight,
      visibility
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    // Run authoritative pricing calculation
    const pricing = calculatePricing({
      metals,
      stones,
      labour,
      overhead_percent,
      margin_percent,
    });

    const effectivePrice = pricing.final_total_price > 0 ? pricing.final_total_price : (parseFloat(base_price) || 0);

    // Require a non-zero effective price so products are not created with selling_price = 0
    if (!(effectivePrice > 0)) {
      return res.status(400).json({
        message: 'Provide a base_price or at least one costing component (metals, stones, or labour) so selling price is greater than 0'
      });
    }

    const defaultVisibility = {
      metalSection: true,
      stoneSection: true,
      labourSection: false,
      addCharge: false,
      costPrice: false,
      overhead: false,
      margin: false,
      priceBreakdown: false,
      itemCode: true,
      grossWeight: true
    };

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description,
        short_description,
        category,
        metal_type,
        purity,
        karat,
        base_price: effectivePrice,
        price: effectivePrice,
        is_active,
        is_bestseller,
        item_code: item_code || null,
        family: family || null,
        item_type: item_type || null,
        pieces: parseInt(pieces) || 1,
        metals: metals || [],
        stones: stones || [],
        labour: labour || [],
        add_charge: parseFloat(add_charge) || 0,
        cost_price: pricing.cost_price,
        overhead_percent: parseFloat(overhead_percent) || 0,
        overhead_amount: pricing.overhead_amount,
        margin_percent: parseFloat(margin_percent) || 0,
        margin_amount: pricing.margin_amount,
        labour_cost_internal: pricing.labour_cost_internal,
        labour_charge_visible: pricing.labour_charge_visible,
        selling_price: effectivePrice,
        gross_weight: parseFloat(gross_weight) || 0,
        net_weight: net_weight ? parseFloat(net_weight) : null,
        visibility: { ...defaultVisibility, ...(visibility || {}) }
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return res.status(500).json({ message: 'Error creating product', error: productError.message });
    }

    // Create variants if provided
    if (variants && variants.length > 0) {
      const variantData = variants.map(v => ({
        product_id: product.id,
        size: v.size || null,
        color: v.color || null,
        finish: v.finish || null,
        weight: v.weight ? parseFloat(v.weight) : null,
        stock_quantity: parseInt(v.stock_quantity || 0),
        sku: v.sku || null,
        price_override: v.price_override ? parseFloat(v.price_override) : null,
        is_active: v.is_active !== undefined ? v.is_active : true
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantData);

      if (variantError) {
        console.error('Error creating variants:', variantError);
        // Continue even if variants fail - product is created
      }
    }

    // Create images if provided
    if (images && images.length > 0) {
      const imageData = images.map((img, index) => ({
        product_id: product.id,
        image_url: img.image_url,
        alt_text: img.alt_text || name,
        display_order: img.display_order !== undefined ? img.display_order : index,
        is_primary: img.is_primary || index === 0
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageData);

      if (imageError) {
        console.error('Error creating images:', imageError);
      }
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'product_created',
      entity_type: 'product',
      entity_id: product.id,
      new_values: { name, category, base_price }
    });

    // Fetch complete product with relations
    const { data: completeProduct } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('id', product.id)
      .single();

    res.status(201).json({ message: 'Product created successfully', product: completeProduct });
  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      short_description,
      category,
      metal_type,
      purity,
      karat,
      base_price,
      is_active,
      is_bestseller,
      // Jewellery costing fields
      item_code,
      family,
      item_type,
      pieces,
      metals,
      stones,
      labour,
      add_charge,
      cost_price,
      overhead_percent,
      overhead_amount,
      margin_percent,
      margin_amount,
      selling_price,
      gross_weight,
      net_weight,
      visibility
    } = req.body;

    // Get old product for audit
    const { data: oldProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!oldProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (category !== undefined) updateData.category = category;
    if (metal_type !== undefined) updateData.metal_type = metal_type;
    if (purity !== undefined) updateData.purity = purity;
    if (karat !== undefined) updateData.karat = karat;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_bestseller !== undefined) updateData.is_bestseller = is_bestseller;

    // Costing fields
    if (item_code !== undefined) updateData.item_code = item_code || null;
    if (family !== undefined) updateData.family = family || null;
    if (item_type !== undefined) updateData.item_type = item_type || null;
    if (pieces !== undefined) updateData.pieces = parseInt(pieces) || 1;
    if (add_charge !== undefined) updateData.add_charge = parseFloat(add_charge) || 0;
    if (gross_weight !== undefined) updateData.gross_weight = parseFloat(gross_weight) || 0;
    if (net_weight !== undefined) updateData.net_weight = net_weight ? parseFloat(net_weight) : null;
    if (visibility !== undefined) updateData.visibility = visibility;

    // Recalculate pricing whenever any cost input changes
    const recalcNeeded =
      metals !== undefined ||
      stones !== undefined ||
      labour !== undefined ||
      overhead_percent !== undefined ||
      margin_percent !== undefined;

    if (recalcNeeded) {
      const currentMetals  = metals  !== undefined ? metals  : (oldProduct.metals  || []);
      const currentStones  = stones  !== undefined ? stones  : (oldProduct.stones  || []);
      const currentLabour  = labour  !== undefined ? labour  : (oldProduct.labour  || []);
      const currentOvPct   = overhead_percent !== undefined ? overhead_percent : (oldProduct.overhead_percent || 0);
      const currentMgPct   = margin_percent   !== undefined ? margin_percent   : (oldProduct.margin_percent   || 0);

      if (metals   !== undefined) updateData.metals  = metals;
      if (stones   !== undefined) updateData.stones  = stones;
      if (labour   !== undefined) updateData.labour  = labour;
      if (overhead_percent !== undefined) updateData.overhead_percent = parseFloat(overhead_percent) || 0;
      if (margin_percent   !== undefined) updateData.margin_percent   = parseFloat(margin_percent)   || 0;

      const pricing = calculatePricing({
        metals:           currentMetals,
        stones:           currentStones,
        labour:           currentLabour,
        overhead_percent: currentOvPct,
        margin_percent:   currentMgPct,
      });

      updateData.cost_price            = pricing.cost_price;
      updateData.overhead_amount       = pricing.overhead_amount;
      updateData.margin_amount         = pricing.margin_amount;
      updateData.labour_cost_internal  = pricing.labour_cost_internal;
      updateData.labour_charge_visible = pricing.labour_charge_visible;

      // Use a safe effective price: prefer calculated final_total_price, otherwise fall back to existing product price
      const effectivePrice = pricing.final_total_price > 0
        ? pricing.final_total_price
        : (oldProduct.base_price || oldProduct.price || 0);

      updateData.selling_price = effectivePrice;
      updateData.base_price    = effectivePrice;
      updateData.price         = effectivePrice;
    }

    updateData.updated_at = new Date().toISOString();

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ message: 'Error updating product' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'product_updated',
      entity_type: 'product',
      entity_id: id,
      old_values: oldProduct,
      new_values: updateData
    });

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete product (soft delete by setting is_active = false)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ message: 'Error deleting product' });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: req.user.userId,
      action: 'product_deleted',
      entity_type: 'product',
      entity_id: id
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

