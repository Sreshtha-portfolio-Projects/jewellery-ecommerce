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
    // Note: For products with variants, stock is managed at variant level,
    // so we don't filter them out based on product stock (which is often 0)
    const validCartItems = [];
    for (const item of (data || [])) {
      if (!item.products) continue;

      // Check if product has variants
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, stock_quantity, is_active')
        .eq('product_id', item.product_id)
        .eq('is_active', true);

      if (variants && variants.length > 0) {
        // Product has variants - include it (stock is validated when adding to cart)
        // We can't check specific variant stock without variant_id in cart
        validCartItems.push(item);
      } else {
        // No variants - check product stock
        if (item.products.stock_quantity >= item.quantity) {
          validCartItems.push(item);
        }
      }
    }

    res.json(validCartItems);
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1, variantId = null } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Check product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If variant is provided, check variant stock instead of product stock
    let availableStock = product.stock_quantity;
    let stockSource = 'product';
    
    if (variantId) {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single();

      if (variantError || !variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }

      if (!variant.is_active) {
        return res.status(400).json({ message: 'Variant is not available' });
      }

      availableStock = variant.stock_quantity;
      stockSource = 'variant';
    }

    // Check existing cart item
    // Note: carts table doesn't have variant_id column yet, so we check by product_id only
    // Multiple variants of the same product will be combined in cart (limitation for now)
    const { data: existingCartItem } = await supabase
      .from('carts')
      .select('quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    const currentQuantity = existingCartItem?.quantity || 0;
    const requestedQuantity = currentQuantity + quantity;

    // Stock validation
    // Note: For variants, we check requestedQuantity (existing + new) assuming the existing
    // cart item is the same variant. Since carts table doesn't have variant_id column,
    // we can't verify this, but checking total is better than only checking new quantity.
    if (availableStock < requestedQuantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} available.`,
        availableStock: availableStock
      });
    }

    // Upsert cart item
    // Note: carts table doesn't have variant_id column yet, so variant info is not stored
    // Multiple variants of the same product will be combined (limitation for now)
    const { data: upsertData, error: upsertError } = await supabase
      .from('carts')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity: requestedQuantity,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,product_id'
      });

    if (upsertError) {
      console.error('Error upserting cart item:', upsertError);
      return res.status(500).json({ message: 'Error adding to cart', error: upsertError.message });
    }

    // Fetch the updated/inserted cart item with product details
    const { data, error } = await supabase
      .from('carts')
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
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error) {
      console.error('Error fetching cart item after upsert:', error);
      return res.status(500).json({ message: 'Error fetching cart item', error: error.message });
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

    // Check if product has variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('stock_quantity, is_active')
      .eq('product_id', cartItem.product_id)
      .eq('is_active', true);

    let availableStock = cartItem.products.stock_quantity;

    if (variants && variants.length > 0) {
      // Product has variants - use total available variant stock
      // Note: Since carts table doesn't have variant_id, we can't check specific variant
      // So we use the sum of all active variant stock as a conservative estimate
      availableStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
    }

    // Check stock availability
    if (availableStock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} available.`,
        availableStock: availableStock
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

