import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { showError } from '../../utils/toast';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

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
      
      // Create a printable invoice HTML
      const invoiceHTML = generateInvoiceHTML(invoiceData);
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } catch (error) {
      console.error('Error downloading invoice:', error);
      const errorMessage = error.response?.data?.message || 'Failed to download invoice';
      showError(errorMessage);
    }
  };

  const generateInvoiceHTML = (invoice) => {
    // Helper functions for invoice HTML
    const formatInvoiceDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    const formatInvoiceCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${invoice.invoice_number}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      border-bottom: 2px solid #B8860B;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #B8860B;
      margin: 0;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .seller-info, .buyer-info {
      flex: 1;
    }
    .seller-info {
      margin-right: 20px;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #B8860B;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      margin-top: 20px;
      border-top: 2px solid #B8860B;
      padding-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .grand-total {
      font-size: 1.2em;
      font-weight: bold;
      color: #B8860B;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Aldorado Jewells</h1>
    <p>Invoice ${invoice.invoice_number}</p>
  </div>

  <div class="invoice-info">
    <div class="seller-info">
      <div class="section-title">Sold By:</div>
      <p><strong>${invoice.seller.name}</strong></p>
      <p>${invoice.seller.address}</p>
      <p>GSTIN: ${invoice.seller.gstin}</p>
      <p>Phone: ${invoice.seller.phone}</p>
      <p>Email: ${invoice.seller.email}</p>
    </div>
    <div class="buyer-info">
      <div class="section-title">Bill To:</div>
      <p><strong>${invoice.buyer.name}</strong></p>
      <p>${invoice.buyer.address}</p>
      <p>Phone: ${invoice.buyer.phone}</p>
    </div>
  </div>

  <div>
    <p><strong>Order Number:</strong> ${invoice.order_number}</p>
    <p><strong>Invoice Date:</strong> ${formatInvoiceDate(invoice.invoice_date)}</p>
    <p><strong>Order Date:</strong> ${formatInvoiceDate(invoice.order_date)}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Variant</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.variant || '-'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatInvoiceCurrency(item.unit_price)}</td>
          <td class="text-right">${formatInvoiceCurrency(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatInvoiceCurrency(invoice.pricing.subtotal)}</span>
    </div>
    ${invoice.pricing.discount_amount > 0 ? `
    <div class="total-row">
      <span>Discount ${invoice.pricing.discount_code ? `(${invoice.pricing.discount_code})` : ''}:</span>
      <span>-${formatInvoiceCurrency(invoice.pricing.discount_amount)}</span>
    </div>
    ` : ''}
    <div class="total-row">
      <span>Tax (GST):</span>
      <span>${formatInvoiceCurrency(invoice.pricing.tax_amount)}</span>
    </div>
    <div class="total-row">
      <span>Shipping:</span>
      <span>${invoice.pricing.shipping_cost > 0 ? formatInvoiceCurrency(invoice.pricing.shipping_cost) : 'Free'}</span>
    </div>
    <div class="total-row grand-total">
      <span>Total Amount:</span>
      <span>${formatInvoiceCurrency(invoice.pricing.total_amount)}</span>
    </div>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
    <p><strong>Payment Details:</strong></p>
    <p>Payment Method: ${invoice.payment.method}</p>
    ${invoice.payment.transaction_id ? `<p>Transaction ID: ${invoice.payment.transaction_id}</p>` : ''}
    <p>Payment Date: ${formatInvoiceDate(invoice.payment.paid_at)}</p>
  </div>

  <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
    <p>Thank you for your purchase!</p>
    <p>This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
    `;
  };

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
              {shipping.status === 'NOT_SHIPPED' || !shipping.status ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Your order is being prepared for shipment</p>
                  <p className="text-sm text-gray-500 mt-2">We'll update you once your order is shipped</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Status</span>
                    <span className={`font-semibold capitalize ${
                      shipping.status === 'DELIVERED' ? 'text-green-600' : 
                      shipping.status === 'SHIPPED' || shipping.status === 'IN_TRANSIT' ? 'text-blue-600' : 
                      'text-gray-600'
                    }`}>
                      {shipping.status.replace('_', ' ')}
                    </span>
                  </div>
                  {shipping.courier_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Courier</span>
                      <span className="font-semibold text-gray-900">{shipping.courier_name}</span>
                    </div>
                  )}
                  {shipping.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number</span>
                      <span className="font-mono text-sm text-rose-600 hover:text-rose-700 cursor-pointer">
                        {shipping.tracking_number}
                      </span>
                    </div>
                  )}
                  {shipping.shipped_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipped On</span>
                      <span className="text-gray-900">{formatDate(shipping.shipped_at)}</span>
                    </div>
                  )}
                  {estimated_delivery && estimated_delivery.available && !estimated_delivery.delivered && (
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-gray-600">Estimated Delivery</span>
                      <span className="font-semibold text-gray-900">{estimated_delivery.display}</span>
                    </div>
                  )}
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
                  className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
