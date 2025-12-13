const supabase = require('../config/supabase');

const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          category,
          is_bestseller,
          stock_quantity,
          metal_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist:', error);
      return res.status(500).json({ message: 'Error fetching wishlist' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in getWishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          category,
          stock_quantity
        )
      `)
      .single();

    if (error) {
      console.error('Error adding to wishlist:', error);
      return res.status(500).json({ message: 'Error adding to wishlist' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from wishlist:', error);
      return res.status(500).json({ message: 'Error removing from wishlist' });
    }

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const isInWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking wishlist:', error);
      return res.status(500).json({ message: 'Error checking wishlist' });
    }

    res.json({ inWishlist: !!data });
  } catch (error) {
    console.error('Error in isInWishlist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist
};

