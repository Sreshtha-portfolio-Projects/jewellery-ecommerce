import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addressService } from '../services/addressService';
import { discountService } from '../services/discountService';
import { orderService } from '../services/orderService';
import { showError, showSuccess } from '../utils/toast';

const Checkout = () => {
  const { cartItems, cartCount, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cartCount === 0) {
      navigate('/cart');
      return;
    }

    fetchAddresses();
    calculatePriceBreakdown();
  }, [isAuthenticated, cartCount, navigate, appliedCoupon]);

  const fetchAddresses = async () => {
    try {
      const data = await addressService.getAll();
      setAddresses(data);
      const defaultAddress = data.find(addr => addr.is_default) || data[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const calculatePriceBreakdown = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.products?.price || item.price || 0);
      const qty = item.quantity || 0;
      return sum + (price * qty);
    }, 0);

    const discount = appliedCoupon?.amount || 0;
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * 0.18; // 18% GST
    const shipping = 0; // Free shipping
    const total = afterDiscount + tax + shipping;

    setPriceBreakdown({
      subtotal,
      discount,
      tax,
      shipping,
      total: Math.max(0, total)
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponError('');
    setLoading(true);

    try {
      const subtotal = cartItems.reduce((sum, item) => {
        const price = parseFloat(item.products?.price || item.price || 0);
        const qty = item.quantity || 0;
        return sum + (price * qty);
      }, 0);

      const result = await discountService.validateDiscount(couponCode, subtotal);
      
      if (result.valid) {
        setAppliedCoupon(result.discount);
        setCouponError('');
      } else {
        setCouponError('Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Failed to apply coupon');
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showError('Please select a delivery address');
      return;
    }

    setProcessing(true);

    try {
      // Create order via backend (no payment processing)
      const orderData = {
        shippingAddressId: selectedAddressId,
        billingAddressId: selectedAddressId,
        discountCode: appliedCoupon?.code || null
      };

      const order = await orderService.createOrder(orderData);

      // Navigate to orders page
      navigate('/account/orders');
      await refreshCart();
    } catch (error) {
      console.error('Error placing order:', error);
      showError(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-beige-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="font-serif text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No addresses found</p>
                  <button
                    onClick={() => navigate('/account/addresses')}
                    className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-rose-600 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{address.full_name}</p>
                          <p className="text-gray-600 text-sm mt-1">
                            {address.address_line1}, {address.address_line2}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-gray-600 text-sm">Phone: {address.phone}</p>
                        </div>
                        {address.is_default && (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => navigate('/account/addresses')}
                    className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                  >
                    + Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Notice */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Payment</h2>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Payment processing coming soon.</strong> Your order will be created as an enquiry, and our team will contact you to confirm payment details.
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = item.products || item;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-beige-400">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-gray-900 font-semibold mt-1">
                          ₹{((parseFloat(product.price) || 0) * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-6">Price Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                {!appliedCoupon ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={loading}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-600 text-sm mt-1">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {appliedCoupon.code} Applied
                        </p>
                        <p className="text-xs text-green-600">
                          {appliedCoupon.type === 'percentage' 
                            ? `${appliedCoupon.value}% off`
                            : `₹${appliedCoupon.value} off`}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-green-700 hover:text-green-900 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Item Total</span>
                  <span>₹{priceBreakdown.subtotal.toFixed(2)}</span>
                </div>
                
                {priceBreakdown.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{priceBreakdown.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-700">
                  <span>Tax (GST 18%)</span>
                  <span>₹{priceBreakdown.tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{priceBreakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddressId}
                className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Submit Order'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing this order, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

