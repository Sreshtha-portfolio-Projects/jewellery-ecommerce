import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { returnService } from '../../services/returnService';
import { showError, showSuccess } from '../../utils/toast';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [returnRequest, setReturnRequest] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnNote, setReturnNote] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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

    fetchOrderDetail();
    fetchReturnRequest();
  }, [orderId, isAuthenticated, navigate]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId);
      setOrderData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnRequest = async () => {
    try {
      const data = await returnService.getReturnRequestByOrder(orderId);
      setReturnRequest(data);
    } catch (err) {
      // Return request doesn't exist yet, which is fine
      if (err.response?.status !== 404) {
        console.error('Error fetching return request:', err);
      }
    }
  };

  const handleRequestReturn = async () => {
    if (!returnReason) {
      showError('Please select a return reason');
      return;
    }

    try {
      setSubmittingReturn(true);
      const data = await returnService.createReturnRequest(orderId, returnReason, returnNote);
      setReturnRequest(data);
      setShowReturnModal(false);
      setReturnReason('');
      setReturnNote('');
      showSuccess('Return request submitted successfully');
    } catch (err) {
      console.error('Error creating return request:', err);
      showError(err.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
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

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      paid: 'bg-blue-100 text-blue-800 border-blue-300',
      shipped: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      returned: 'bg-red-100 text-red-800 border-red-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      paid: 'Paid',
      shipped: 'Shipped',
      delivered: 'Delivered',
      returned: 'Returned',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const handleDownloadInvoice = async () => {
    try {
      const invoiceData = await orderService.getOrderInvoice(orderId);
      
      if (invoiceData.invoice_url) {
        // Open PDF in new tab for download
        window.open(invoiceData.invoice_url, '_blank');
      } else {
        showError('Invoice URL not available');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      const errorMessage = error.response?.data?.message || 'Failed to download invoice';
      showError(errorMessage);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      await orderService.cancelOrder(orderId, cancelReason);
      showSuccess('Order cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      fetchOrderDetail();
    } catch (error) {
      console.error('Error cancelling order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel order';
      showError(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  // Check if order can be cancelled
  const canCancelOrder = orderData && (
    (orderData.order.status === 'CREATED' || orderData.order.status === 'paid' || orderData.order.status === 'pending' || orderData.order.status === 'processing') &&
    (!orderData.order.shipment_status || orderData.order.shipment_status === 'NOT_SHIPPED')
  ) && orderData.order.status !== 'cancelled';

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-beige-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Unable to Load Order</h2>
            <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/account/orders')}
                className="w-full max-w-xs mx-auto block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { order, items, shipping_address, payment, shipping, timeline, estimated_delivery } = orderData;
  
  // Fallback to order_items if items is not available
  const orderItems = items || orderData.order_items || [];

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/account/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-serif font-bold text-gray-900">
                  Order #{order.order_number}
                </h1>
                <span className={`px-4 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-gray-600">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(order.total_amount)}
              </p>
            </div>
          </div>

          {/* Help CTA */}
          <div className="pt-4 border-t border-gray-200">
            <button className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Need help with this order?
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            {timeline && timeline.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Order Status</h2>
                <div className="space-y-4">
                  {timeline.map((status, index) => (
                    <div key={status.key} className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {status.completed ? (
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : status.inProgress ? (
                          <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 border-2 border-gray-300 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                        <p className={`font-semibold text-lg ${
                          status.completed ? 'text-green-600' : status.inProgress ? 'text-rose-600' : 'text-gray-400'
                        }`}>
                          {status.label}
                        </p>
                        {status.timestamp && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(status.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-semibold ${
                    payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {payment.status === 'paid' ? '✓ Paid' : payment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {payment.method || 'Online Payment'}
                  </span>
                </div>
                {payment.payment_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm text-gray-900">{payment.payment_id}</span>
                  </div>
                )}
                {payment.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date</span>
                    <span className="text-gray-900">{formatDate(payment.paid_at)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-600 font-semibold">Amount Paid</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                </div>
              </div>
            </div>

            {/* Shipping & Delivery Tracking */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Shipping & Delivery</h2>
              
              {/* Shipping Status Badge */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Current Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    shipping.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    shipping.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                    shipping.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-800' :
                    shipping.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800' :
                    shipping.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {shipping.status ? shipping.status.replace(/_/g, ' ') : 'Not Shipped'}
                  </span>
                </div>
                {shipping.status && shipping.status !== 'NOT_SHIPPED' && (
                  <p className="text-sm text-gray-600 mt-2">
                    {shipping.status === 'PROCESSING' && 'Your jewellery is being carefully prepared and quality-checked.'}
                    {shipping.status === 'SHIPPED' && 'Your jewellery has been shipped and is on its way.'}
                    {shipping.status === 'IN_TRANSIT' && 'Your jewellery is in transit and will reach you soon.'}
                    {shipping.status === 'OUT_FOR_DELIVERY' && 'Your jewellery is out for delivery and will arrive today.'}
                    {shipping.status === 'DELIVERED' && 'Your jewellery has been delivered successfully.'}
                  </p>
                )}
              </div>

              {/* Shipping Timeline */}
              {shipping.history && shipping.history.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Timeline</h3>
                  <div className="space-y-4">
                    {shipping.history.map((entry, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                          <p className="font-semibold text-gray-900">
                            {entry.to_status ? entry.to_status.replace(/_/g, ' ') : 'Status Updated'}
                          </p>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                          )}
                          {entry.courier_name && (
                            <p className="text-sm text-gray-500 mt-1">Courier: {entry.courier_name}</p>
                          )}
                          {entry.tracking_number && (
                            <p className="text-sm text-gray-500 mt-1">Tracking: {entry.tracking_number}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Details */}
              {shipping.status && shipping.status !== 'NOT_SHIPPED' ? (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  {shipping.courier_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Courier</span>
                      <span className="font-semibold text-gray-900">{shipping.courier_name}</span>
                    </div>
                  )}
                  {shipping.tracking_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tracking Number</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shipping.tracking_number);
                          // You could add a toast notification here
                        }}
                        className="font-mono text-sm text-rose-600 hover:text-rose-700 cursor-pointer hover:underline"
                        title="Click to copy"
                      >
                        {shipping.tracking_number}
                      </button>
                    </div>
                  )}
                  {shipping.shipped_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipped On</span>
                      <span className="text-gray-900">{formatDate(shipping.shipped_at)}</span>
                    </div>
                  )}
                  {shipping.last_updated && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="text-gray-900">{formatDate(shipping.last_updated)}</span>
                    </div>
                  )}
                  {estimated_delivery && estimated_delivery.available && !estimated_delivery.delivered && (
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-gray-600 font-semibold">Estimated Delivery</span>
                      <span className="font-semibold text-gray-900">{estimated_delivery.display}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Your order is being prepared for shipment</p>
                  <p className="text-sm text-gray-500 mt-2">We'll update you once your order is shipped</p>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            {shipping_address && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Delivery Address</h2>
                <div className="text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900 text-lg">{shipping_address.full_name}</p>
                  <p>{shipping_address.address_line1}</p>
                  {shipping_address.address_line2 && <p>{shipping_address.address_line2}</p>}
                  <p>
                    {shipping_address.city}, {shipping_address.state} - {shipping_address.pincode}
                  </p>
                  <p className="mt-2">Phone: {shipping_address.phone}</p>
                </div>
              </div>
            )}

            {/* Order Notes / Status Messages */}
            {order.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {order.notes}
                </p>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-6">
                {orderItems && orderItems.length > 0 ? orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="w-24 h-24 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
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
                    </Link>
                    <div className="flex-1">
                      <Link
                        to={`/product/${item.product_id}`}
                        className="font-semibold text-gray-900 hover:text-rose-600 transition-colors text-lg"
                      >
                        {item.product_name}
                      </Link>
                      {item.variant_info && (
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          {item.variant_info.size && <p>Size: {item.variant_info.size}</p>}
                          {item.variant_info.color && <p>Metal/Color: {item.variant_info.color}</p>}
                          {item.variant_info.finish && <p>Finish: {item.variant_info.finish}</p>}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-2">Quantity: {item.quantity}</p>
                      <p className="text-gray-900 font-semibold text-lg mt-2">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-8">No items found in this order</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Price Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Items Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.discount_code && `(${order.discount_code})`}</span>
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

              {/* Invoice Download */}
              {payment.status === 'paid' && (
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2 mb-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice
                </button>
              )}

              {/* Request Return Button */}
              {shipping.status === 'DELIVERED' && !returnRequest && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2 border border-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 13H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Request Return
                </button>
              )}

              {/* Return Request Status */}
              {returnRequest && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-blue-900">Return Request</h3>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">
                    Status: <span className="font-semibold">{returnRequest.return_status.replace(/_/g, ' ')}</span>
                  </p>
                  {returnRequest.return_reason && (
                    <p className="text-sm text-blue-700">Reason: {returnRequest.return_reason}</p>
                  )}
                  {returnRequest.return_instructions && (
                    <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Return Instructions:</p>
                      <p className="text-xs text-blue-800">{returnRequest.return_instructions}</p>
                      {returnRequest.return_address && (
                        <p className="text-xs text-blue-800 mt-1">{returnRequest.return_address}</p>
                      )}
                    </div>
                  )}
                  {returnRequest.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                      <p className="text-xs text-red-800">{returnRequest.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Cancel Order</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                placeholder="Please provide a reason for cancellation..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Request Return</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Return Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="">Select a reason</option>
                <option value="Size issue">Size issue</option>
                <option value="Damaged item">Damaged item</option>
                <option value="Not as expected">Not as expected</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                placeholder="Please provide any additional details about your return request..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason('');
                  setReturnNote('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submittingReturn}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={submittingReturn || !returnReason}
                className="flex-1 py-2 px-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReturn ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
