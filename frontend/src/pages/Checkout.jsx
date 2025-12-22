import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addressService } from '../services/addressService';
import { discountService } from '../services/discountService';
import { orderIntentService } from '../services/orderIntentService';
import { paymentService } from '../services/paymentService';
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
    // Wait for auth to finish loading before checking
    if (isAuthenticated === false) {
      // Store intended route before redirecting
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (cartCount === 0) {
      navigate('/cart');
      return;
    }

    if (isAuthenticated) {
      fetchAddresses();
      calculatePriceBreakdown();
    }
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

  const handleTestPayment = async () => {
    if (!selectedAddressId) {
      showError('Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      showError('Your cart is empty. Please add items to cart first.');
      navigate('/cart');
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create order intent (locks inventory and prices)
      const orderIntentData = await orderIntentService.createOrderIntent(
        selectedAddressId,
        selectedAddressId,
        appliedCoupon?.code || null
      );

      const orderIntent = orderIntentData.order_intent;

      // Step 2: Simulate payment (test mode - bypasses Razorpay)
      const result = await paymentService.simulateTestPayment(orderIntent.id);
      
      showSuccess('Test payment successful! Order confirmed.');
      await refreshCart();
      
      // Reset processing state before navigation
      setProcessing(false);
      
      // Navigate to order confirmation page
      if (result.order_id) {
        navigate(`/orders/${result.order_id}/confirmation`);
      } else {
        // Fallback to orders page if order_id not in response
        navigate(`/account/orders`);
      }
    } catch (error) {
      console.error('Error in test payment:', error);
      console.error('Error response:', error.response?.data);
      
      // Get detailed error message
      let errorMessage = 'Test payment failed. Please try again.';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
      setProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showError('Please select a delivery address');
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create order intent (locks inventory and prices)
      const orderIntentData = await orderIntentService.createOrderIntent(
        selectedAddressId,
        selectedAddressId,
        appliedCoupon?.code || null
      );

      const orderIntent = orderIntentData.order_intent;

      // Step 2: Create Razorpay payment order
      const paymentOrder = await paymentService.createPaymentOrder(orderIntent.id);

      // Step 3: Initialize Razorpay Checkout
      const options = {
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        order_id: paymentOrder.razorpay_order_id,
        name: 'Aldorado Jewells',
        description: `Order Intent ${orderIntent.intent_number}`,
        handler: async function (response) {
          try {
            // Step 4: Verify payment and convert intent to order
            const result = await paymentService.verifyPayment(orderIntent.id, response);
            
            showSuccess('Payment successful! Order confirmed.');
            await refreshCart();
            
            // Reset processing state before navigation to ensure UI is responsive
            setProcessing(false);
            
            // Navigate to order confirmation page
            if (result.order_id) {
              navigate(`/orders/${result.order_id}/confirmation`);
            } else {
              // Fallback to orders page if order_id not in response
              navigate(`/account/orders`);
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            showError('Payment verification failed. Please contact support.');
            
            // Reset processing state before navigation to ensure UI is responsive
            setProcessing(false);
            
            // Navigate to orders page - order intent will expire and release inventory
            navigate('/account/orders');
          }
        },
        prefill: {
          // You can add user email/phone if available from auth context
        },
        theme: {
          color: '#B8860B' // Rose gold color
        },
        modal: {
          ondismiss: function() {
            showError('Payment cancelled. Order intent will expire and inventory will be released.');
            setProcessing(false);
          }
        }
      };

      // Step 5: Open Razorpay Checkout
      // Check if Razorpay SDK has loaded successfully
      if (typeof window.Razorpay === 'undefined') {
        setProcessing(false);
        showError('Payment gateway failed to load. Please refresh the page and try again. If the problem persists, check your internet connection or disable ad blockers.');
        console.error('Razorpay SDK not loaded. Check if the script tag in index.html is loading correctly.');
        return;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      // Note: Don't set processing to false here
      // It will be set in the handler or on dismiss
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order. Please try again.';
      const errorDetails = error.response?.data?.details;
      
      // Show detailed error in development
      if (errorDetails && process.env.NODE_ENV === 'development') {
        console.error('Order intent creation error details:', errorDetails);
        showError(`${errorMessage}. Check console for details.`);
      } else {
        showError(errorMessage);
      }
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
    <div className="min-h-screen bg-beige-50 py-4 sm:py-6 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Delivery Address</h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">No addresses found</p>
                  <button
                    onClick={() => navigate('/account/addresses')}
                    className="px-4 py-2 text-sm sm:text-base bg-rose-600 text-white rounded hover:bg-rose-700 active:bg-rose-800 transition-colors"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-gray-900">{address.full_name}</p>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1 break-words">
                            {address.address_line1}, {address.address_line2}
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm">Phone: {address.phone}</p>
                        </div>
                        {address.is_default && (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full whitespace-nowrap">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => navigate('/account/addresses')}
                    className="text-rose-600 hover:text-rose-700 text-xs sm:text-sm font-medium"
                  >
                    + Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Payment</h2>
              
              <div className="space-y-3">
                <label className="flex items-start sm:items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    defaultChecked
                    className="mr-3 mt-1 sm:mt-0"
                  />
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-gray-900">Online Payment</p>
                    <p className="text-xs sm:text-sm text-gray-600">Pay securely with Razorpay (Cards, UPI, Net Banking, Wallets)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Order Items</h2>
              
              <div className="space-y-3 sm:space-y-4">
                {cartItems.map((item) => {
                  const product = item.products || item;
                  return (
                    <div key={item.id} className="flex gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-beige-400">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm sm:text-base text-gray-900 font-semibold mt-1">
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
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-4">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Price Summary</h2>

              {/* Coupon Code */}
              <div className="mb-4 sm:mb-6">
                {!appliedCoupon ? (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={loading}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 active:bg-rose-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {loading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-600 text-xs sm:text-sm mt-1">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-green-800">
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
                        className="text-green-700 hover:text-green-900 text-xs sm:text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                  <span>Item Total</span>
                  <span>₹{priceBreakdown.subtotal.toFixed(2)}</span>
                </div>
                
                {priceBreakdown.discount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{priceBreakdown.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                  <span>Tax (GST 18%)</span>
                  <span>₹{priceBreakdown.tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                
                <div className="border-t border-gray-200 pt-2 sm:pt-3">
                  <div className="flex justify-between text-base sm:text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{priceBreakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddressId}
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base bg-rose-600 text-white rounded-lg hover:bg-rose-700 active:bg-rose-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Proceed to Payment'}
              </button>

              {/* Test Mode Button (Only in Development) */}
              {import.meta.env.DEV && (
                <button
                  onClick={handleTestPayment}
                  disabled={processing || !selectedAddressId}
                  className="w-full py-2.5 sm:py-3 text-xs sm:text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 active:bg-yellow-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {processing ? 'Processing...' : '🧪 Test Payment (Skip Razorpay)'}
                </button>
              )}

              <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-3 sm:mt-4">
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

