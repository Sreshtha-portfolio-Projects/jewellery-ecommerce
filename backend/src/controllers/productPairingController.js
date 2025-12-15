const supabase = require('../config/supabase');

/**
 * Get paired/related products for a product
 */
const getPairedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type = 'related', limit = 4 } = req.query;

    // Get paired products
    const { data: pairings, error } = await supabase
      .from('product_pairings')
      .select(`
        paired_product_id,
        pairing_type,
        display_order,
        product:products!paired_product_id (
          id,
          name,
          price,
          category,
          image_url,
          is_bestseller
        )
      `)
      .eq('product_id', productId)
      .eq('pairing_type', type)
      .order('display_order', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching paired products:', error);
      return res.status(500).json({ message: 'Error fetching paired products' });
    }

    // If no pairings found, get products from same category
    if (!pairings || pairings.length === 0) {
      // Get product category first
      const { data: product } = await supabase
        .from('products')
        .select('category')
        .eq('id', productId)
        .single();

      if (product) {
        const { data: relatedProducts } = await supabase
          .from('products')
          .select('id, name, price, category, image_url, is_bestseller')
          .eq('category', product.category)
          .neq('id', productId)
          .limit(parseInt(limit));

        return res.json({
          products: relatedProducts || [],
          source: 'category'
        });
      }
    }

    // Format paired products
    const products = pairings
      .map(p => p.product)
      .filter(p => p !== null);

    res.json({
      products,
      source: 'pairings'
    });
  } catch (error) {
    console.error('Error in getPairedProducts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create product pairing (admin only)
 */
const createPairing = async (req, res) => {
  try {
    const { productId, pairedProductId, pairingType = 'related', displayOrder = 0 } = req.body;

    if (!productId || !pairedProductId) {
      return res.status(400).json({ message: 'productId and pairedProductId are required' });
    }

    if (productId === pairedProductId) {
      return res.status(400).json({ message: 'Product cannot be paired with itself' });
    }

    const { data, error } = await supabase
      .from('product_pairings')
      .insert({
        product_id: productId,
        paired_product_id: pairedProductId,
        pairing_type: pairingType,
        display_order: displayOrder
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: 'This pairing already exists' });
      }
      console.error('Error creating pairing:', error);
      return res.status(500).json({ message: 'Error creating pairing' });
    }

    res.status(201).json({ message: 'Pairing created successfully', pairing: data });
  } catch (error) {
    console.error('Error in createPairing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete product pairing (admin only)
 */
const deletePairing = async (req, res) => {
  try {
    const { pairingId } = req.params;

    const { error } = await supabase
      .from('product_pairings')
      .delete()
      .eq('id', pairingId);

    if (error) {
      console.error('Error deleting pairing:', error);
      return res.status(500).json({ message: 'Error deleting pairing' });
    }

    res.json({ message: 'Pairing deleted successfully' });
  } catch (error) {
    console.error('Error in deletePairing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPairedProducts,
  createPairing,
  deletePairing,
};

