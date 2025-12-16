import { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }

    try {
      setLoading(true);
      const items = await cartService.getCart();
      setCartItems(items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }

    try {
      await cartService.addToCart(productId, quantity, variantId);
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      await cartService.updateQuantity(cartItemId, quantity);
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await cartService.removeFromCart(cartItemId);
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const value = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

