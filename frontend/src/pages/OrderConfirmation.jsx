import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { showError } from '../utils/toast';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPollAttempts = 10; // Poll for up to 10 times (50 seconds total)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!orderId) {
      setError('Invalid order ID');
      setLoading(false);
      return;
    }

    fetchOrderConfirmation();
  }, [orderId, isAuthenticated, navigate]);

  const fetchOrderConfirmation = async (isPolling = false) => {
    try {
      if (isPolling) {
        setConfirming(true);
      }

      const data = await orderService.getOrderConfirmation(orderId);
      
      // If order exists and is confirmed, set data
      if (data && data.order) {
        setOrderData(data);
        setLoading(false);
        setConfirming(false);
        setError(null);
      } else if (isPolling && pollCount < maxPollAttempts) {
        // Order might still be processing, poll again
        setTimeout(() => {
          setPollCount(prev => prev + 1);
          fetchOrderConfirmation(true);
        }, 5000); // Poll every 5 seconds
      } else {
        // Max polling attempts reached or order not found
        setError('Your order is being processed. This may take a few moments. Please check your orders page in a minute.');
        setLoading(false);
        setConfirming(false);
      }
    } catch (err) {
      // If order not found and we haven't polled yet, start polling
      if (err.response?.status === 404 && !isPolling && pollCount === 0) {
        setConfirming(true);
        setTimeout(() => {
          setPollCount(1);
          fetchOrderConfirmation(true);
        }, 5000);
      } else if (pollCount < maxPollAttempts && isPolling) {
        // Continue polling
        setTimeout(() => {
          setPollCount(prev => prev + 1);
          fetchOrderConfirmation(true);
        }, 5000);
      } else {
        setError(err.response?.data?.message || 'Failed to load order confirmation');
        setLoading(false);
        setConfirming(false);
      }
    }
  };

  const copyOrderId = () => {
    if (orderData?.order?.order_number) {
      navigator.clipboard.writeText(orderData.order.order_number);
      // You can add a toast notification here if needed
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading || confirming) {
    return (
      <div className="min-h-screen bg-beige-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {confirming ? 'Confirming your order...' : 'Loading order confirmation...'}
          </p>
          {confirming && (
            <p className="text-gray-500 text-sm mt-2">
              This may take a few moments. Please wait.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-beige-50 py-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Processing Your Order</h2>
            <p className="text-gray-600 mb-6">{error || 'Your order is being confirmed. Please check back in a moment.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/account/orders')}
              className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/products')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { order, items, shipping_address, timeline, estimated_delivery } = orderData;

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 text-center">
          <div className="mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-4 text-lg">
            Thank you for your purchase! We've received your order and will send you a confirmation email shortly.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Order ID</p>
              <button
                onClick={copyOrderId}
                className="font-mono text-lg font-semibold text-gray-900 hover:text-rose-600 transition-colors flex items-center gap-2"
              >
                {order.order_number}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Order Date</p>
              <p className="font-semibold text-gray-900">{formatDate(order.created_at)}</p>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Method</p>
              <p className="font-semibold text-gray-900 capitalize">{order.payment_method || 'Online'}</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(`/account/orders`)}
              className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
            >
              View Order
            </button>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="w-24 h-24 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
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
                  <h3 className="font-semibold text-gray-900 mb-1">{item.product_name}</h3>
                  {item.variant_info && (
                    <div className="text-sm text-gray-600 mb-2">
                      {item.variant_info.size && <span>Size: {item.variant_info.size}</span>}
                      {item.variant_info.color && (
                        <span className="ml-3">Color: {item.variant_info.color}</span>
                      )}
                      {item.variant_info.finish && (
                        <span className="ml-3">Finish: {item.variant_info.finish}</span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-gray-900 font-semibold mt-2">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Item Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>Tax (GST)</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping</span>
              <span>{order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : 'Free'}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-xl font-semibold text-gray-900">
                <span>Total Amount</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {shipping_address && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-serif font-semibold text-gray-900">Delivery Address</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                ✓ Confirmed
              </span>
            </div>
            <div className="text-gray-700 space-y-1">
              <p className="font-semibold text-gray-900">{shipping_address.full_name}</p>
              <p>{shipping_address.address_line1}</p>
              {shipping_address.address_line2 && <p>{shipping_address.address_line2}</p>}
              <p>
                {shipping_address.city}, {shipping_address.state} - {shipping_address.pincode}
              </p>
              <p className="mt-2">Phone: {shipping_address.phone}</p>
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
        {timeline && timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Order Status</h2>
            <div className="space-y-4">
              {timeline.map((status, index) => (
                <div key={status.key} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {status.completed ? (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : status.inProgress ? (
                      <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                    <p className={`font-semibold ${
                      status.completed ? 'text-green-600' : status.inProgress ? 'text-rose-600' : 'text-gray-400'
                    }`}>
                      {status.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Delivery */}
        {estimated_delivery && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Estimated Delivery</h2>
            {estimated_delivery.available ? (
              <p className="text-lg text-gray-700">
                Your order will be delivered by <span className="font-semibold text-gray-900">{estimated_delivery.display}</span>
              </p>
            ) : (
              <p className="text-gray-600">Delivery date will be updated soon.</p>
            )}
          </div>
        )}

        {/* Trust & Assurance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Your Order is Secure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-600">Your payment has been processed securely through Razorpay</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Easy Returns</h3>
              <p className="text-sm text-gray-600">7-day return policy with full refund guarantee</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">24/7 Support</h3>
              <p className="text-sm text-gray-600">Access support from your account page</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
