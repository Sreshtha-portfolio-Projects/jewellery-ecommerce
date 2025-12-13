const supabase = require('../config/supabase');

const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('carts')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          stock_quantity,
          metal_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart:', error);
      return res.status(500).json({ message: 'Error fetching cart' });
    }

    // Filter out products that are out of stock
    const validCartItems = (data || []).filter(item => {
      if (!item.products) return false;
      return item.products.stock_quantity >= item.quantity;
    });

    res.json(validCartItems);
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Check product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    const { data: existingCartItem } = await supabase
      .from('carts')
      .select('quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    const currentQuantity = existingCartItem?.quantity || 0;
    const requestedQuantity = currentQuantity + quantity;

    if (product.stock_quantity < requestedQuantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${product.stock_quantity} available.`,
        availableStock: product.stock_quantity
      });
    }

    // Upsert cart item
    const { data, error } = await supabase
      .from('carts')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity: requestedQuantity
      }, {
        onConflict: 'user_id,product_id'
      })
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          stock_quantity
        )
      `)
      .single();

    if (error) {
      console.error('Error adding to cart:', error);
      return res.status(500).json({ message: 'Error adding to cart' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Get cart item with product info
    const { data: cartItem, error: fetchError } = await supabase
      .from('carts')
      .select(`
        *,
        products (
          id,
          stock_quantity
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check stock availability
    if (cartItem.products.stock_quantity < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${cartItem.products.stock_quantity} available.`,
        availableStock: cartItem.products.stock_quantity
      });
    }

    const { data, error } = await supabase
      .from('carts')
      .update({ quantity })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          stock_quantity
        )
      `)
      .single();

    if (error) {
      console.error('Error updating cart:', error);
      return res.status(500).json({ message: 'Error updating cart' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing from cart:', error);
      return res.status(500).json({ message: 'Error removing from cart' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing cart:', error);
      return res.status(500).json({ message: 'Error clearing cart' });
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error in clearCart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};

