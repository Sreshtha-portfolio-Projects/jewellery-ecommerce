import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating({ ...updating, [cartItemId]: true });
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating({ ...updating, [cartItemId]: false });
    }
  };

  const handleRemove = async (cartItemId) => {
    setUpdating({ ...updating, [cartItemId]: true });
    try {
      await removeFromCart(cartItemId);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating({ ...updating, [cartItemId]: false });
    }
  };

  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.products?.price || item.price || 0);
    const qty = item.quantity || 0;
    return sum + (price * qty);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="font-serif text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart.</p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.products || item;
                const price = parseFloat(product.price || 0);
                const itemTotal = price * (item.quantity || 0);

                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex gap-4">
                      <Link to={`/product/${product.id}`} className="flex-shrink-0">
                        <div className="w-24 h-24 bg-beige-100 rounded-lg overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-beige-400">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex-1">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2 hover:text-rose-700 transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-gray-600 mb-4">${price.toFixed(2)}</p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                              disabled={updating[item.id] || item.quantity <= 1}
                              className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="px-4 py-1">{item.quantity || 1}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                              disabled={updating[item.id]}
                              className="px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={updating[item.id]}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="block w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium mb-4 text-center"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  to="/products"
                  className="block text-center text-rose-600 hover:text-rose-700 font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

