import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { showSuccess, showError } from '../../utils/toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [nextStatuses, setNextStatuses] = useState(null);
  const [error, setError] = useState(null);
  
  // Shipping form state
  const [showCreateShipment, setShowCreateShipment] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showUpdateDetails, setShowUpdateDetails] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
    fetchNextStatuses();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrderDetails(id);
      setOrderData(data);
      setCourierName(data.courier_name || '');
      setTrackingNumber(data.tracking_number || '');
      setError(null);
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextStatuses = async () => {
    try {
      const data = await adminService.getNextValidStatuses(id);
      setNextStatuses(data);
    } catch (err) {
      console.error('Error fetching next statuses:', err);
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

  const getStatusColor = (status) => {
    const colors = {
      NOT_SHIPPED: 'bg-gray-100 text-gray-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-green-100 text-green-800',
      RETURNED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateShipment = async () => {
    if (!courierName.trim() || !trackingNumber.trim()) {
      showError('Courier name and tracking number are required');
      return;
    }

    try {
      setUpdating(true);
      await adminService.createShipment(id, courierName, trackingNumber, shippingNotes);
      showSuccess('Shipment created successfully');
      setShowCreateShipment(false);
      setCourierName('');
      setTrackingNumber('');
      setShippingNotes('');
      fetchOrderDetail();
      fetchNextStatuses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create shipment');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      showError('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      await adminService.updateShippingStatus(id, selectedStatus, shippingNotes);
      showSuccess('Shipping status updated successfully');
      setShowUpdateStatus(false);
      setSelectedStatus('');
      setShippingNotes('');
      fetchOrderDetail();
      fetchNextStatuses();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update shipping status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateDetails = async () => {
    if (!courierName.trim() && !trackingNumber.trim()) {
      showError('At least courier name or tracking number must be provided');
      return;
    }

    if (!updateReason.trim()) {
      showError('Please provide a reason for updating shipment details');
      return;
    }

    try {
      setUpdating(true);
      await adminService.updateShipmentDetails(id, courierName, trackingNumber, shippingNotes, updateReason);
      showSuccess('Shipment details updated successfully');
      setShowUpdateDetails(false);
      setUpdateReason('');
      setShippingNotes('');
      fetchOrderDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update shipment details');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Order</h2>
            <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentShippingStatus = orderData.shipment_status || 'NOT_SHIPPED';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/orders')}
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
              <h1 className="text-3xl font-serif font-bold text-gray-900">
                Order #{orderData.order_number || orderData.id?.slice(0, 8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(orderData.created_at)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Customer: {orderData.customerEmail || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(orderData.total_amount || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Controls Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Shipping Management</h2>
          
          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Current Shipping Status</span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(currentShippingStatus)}`}>
                {currentShippingStatus.replace(/_/g, ' ')}
              </span>
            </div>
            {orderData.courier_name && (
              <p className="text-sm text-gray-600 mt-2">Courier: {orderData.courier_name}</p>
            )}
            {orderData.tracking_number && (
              <p className="text-sm text-gray-600">Tracking: {orderData.tracking_number}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {nextStatuses?.canCreateShipment && (
              <button
                onClick={() => {
                  setShowCreateShipment(true);
                  setShowUpdateStatus(false);
                  setShowUpdateDetails(false);
                }}
                className="px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
              >
                Create Shipment
              </button>
            )}
            {nextStatuses?.nextValidStatuses && nextStatuses.nextValidStatuses.length > 0 && (
              <button
                onClick={() => {
                  setShowUpdateStatus(true);
                  setShowCreateShipment(false);
                  setShowUpdateDetails(false);
                  setSelectedStatus(nextStatuses.nextValidStatuses[0]);
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Update Status
              </button>
            )}
            {(orderData.courier_name || orderData.tracking_number) && (
              <button
                onClick={() => {
                  setShowUpdateDetails(true);
                  setShowCreateShipment(false);
                  setShowUpdateStatus(false);
                }}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Update Details
              </button>
            )}
          </div>

          {/* Create Shipment Form */}
          {showCreateShipment && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">Create Shipment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name *</label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g., BlueDart, FedEx, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number *</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    placeholder="Internal notes about the shipment"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateShipment}
                    disabled={updating}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Creating...' : 'Create Shipment'}
                  </button>
                  <button
                    onClick={() => setShowCreateShipment(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Update Status Form */}
          {showUpdateStatus && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">Update Shipping Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Status *</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select status</option>
                    {nextStatuses?.nextValidStatuses?.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {currentShippingStatus.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    placeholder="Internal notes about this status change"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    onClick={() => setShowUpdateStatus(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Update Details Form */}
          {showUpdateDetails && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">Update Shipment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder={orderData.courier_name || "Enter courier name"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={orderData.tracking_number || "Enter tracking number"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Update *</label>
                  <input
                    type="text"
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    placeholder="e.g., Tracking number correction, Courier change"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    placeholder="Additional notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateDetails}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Details'}
                  </button>
                  <button
                    onClick={() => setShowUpdateDetails(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Shipping History */}
          {orderData.shippingHistory && orderData.shippingHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Shipping History</h3>
              <div className="space-y-3">
                {orderData.shippingHistory.map((entry, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {entry.from_status ? `${entry.from_status} → ${entry.to_status}` : entry.to_status}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(entry.created_at)}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                    )}
                    {entry.courier_name && (
                      <p className="text-xs text-gray-500 mt-1">Courier: {entry.courier_name}</p>
                    )}
                    {entry.tracking_number && (
                      <p className="text-xs text-gray-500">Tracking: {entry.tracking_number}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Updated by: {entry.updated_by_email || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {orderData.order_items && orderData.order_items.length > 0 ? (
              orderData.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No items found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
