const supabase = require('../config/supabase');

const getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Error fetching products' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const { applyPricingRules } = require('./adminPricingController');

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantId } = req.query; // Optional variant ID for price calculation

    // Get product with images and active offers
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get product variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    // Get selected variant if variantId provided
    let selectedVariant = null;
    if (variantId) {
      selectedVariant = variants?.find(v => v.id === variantId) || null;
    }

    // Get product images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('display_order', { ascending: true });

    // Get active offers
    const { data: offers } = await supabase
      .from('product_offers')
      .select('*')
      .eq('product_id', id)
      .eq('is_active', true)
      .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(1);

    // Apply pricing rules
    const finalPrice = await applyPricingRules(product, selectedVariant);

    // Format response
    const response = {
      ...product,
      price: finalPrice, // Override with calculated price
      variants: variants || [],
      selected_variant: selectedVariant,
      images: images && images.length > 0 ? images : [{ image_url: product.image_url, is_primary: true }],
      offer: offers && offers.length > 0 ? offers[0] : null
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
};

