import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { showSuccess, showError } from '../../utils/toast';

const Returns = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? null : statusFilter;
      const data = await adminService.getAllReturnRequests(status);
      setReturns(data.returns || data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      showError('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      REQUESTED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      RECEIVED: 'bg-purple-100 text-purple-800',
      REFUND_INITIATED: 'bg-indigo-100 text-indigo-800',
      REFUNDED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ');
  };

  const handleAction = (returnItem, action) => {
    setSelectedReturn(returnItem);
    setActionType(action);
    setFormData({});
    setShowActionModal(true);
  };

  const handleSubmitAction = async () => {
    try {
      let result;
      switch (actionType) {
        case 'approve':
          if (!formData.returnInstructions || !formData.returnAddress) {
            showError('Return instructions and address are required');
            return;
          }
          result = await adminService.approveReturnRequest(
            selectedReturn.id,
            formData.returnInstructions,
            formData.returnAddress
          );
          showSuccess('Return request approved');
          break;
        case 'reject':
          if (!formData.rejectionReason) {
            showError('Rejection reason is required');
            return;
          }
          result = await adminService.rejectReturnRequest(
            selectedReturn.id,
            formData.rejectionReason
          );
          showSuccess('Return request rejected');
          break;
        case 'received':
          result = await adminService.markReturnReceived(selectedReturn.id);
          showSuccess('Return marked as received');
          break;
        case 'initiate-refund':
          result = await adminService.initiateRefund(selectedReturn.id);
          showSuccess('Refund initiated');
          break;
        case 'complete-refund':
          if (!formData.refundReference) {
            showError('Refund reference is required');
            return;
          }
          result = await adminService.completeRefund(
            selectedReturn.id,
            formData.refundReference
          );
          showSuccess('Refund completed');
          break;
        default:
          return;
      }
      setShowActionModal(false);
      fetchReturns();
    } catch (error) {
      console.error('Error performing action:', error);
      showError(error.response?.data?.message || 'Failed to perform action');
    }
  };

  const getAvailableActions = (returnItem) => {
    const status = returnItem.returnStatus;
    const actions = [];

    if (status === 'REQUESTED') {
      actions.push({ type: 'approve', label: 'Approve', color: 'bg-blue-600 hover:bg-blue-700' });
      actions.push({ type: 'reject', label: 'Reject', color: 'bg-red-600 hover:bg-red-700' });
    } else if (status === 'APPROVED') {
      actions.push({ type: 'received', label: 'Mark Received', color: 'bg-purple-600 hover:bg-purple-700' });
    } else if (status === 'RECEIVED') {
      actions.push({ type: 'initiate-refund', label: 'Initiate Refund', color: 'bg-indigo-600 hover:bg-indigo-700' });
    } else if (status === 'REFUND_INITIATED') {
      actions.push({ type: 'complete-refund', label: 'Complete Refund', color: 'bg-green-600 hover:bg-green-700' });
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading return requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Returns & Refunds</h1>
          <p className="text-gray-600 mt-2">Manage return requests and refunds</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            >
              <option value="all">All</option>
              <option value="REQUESTED">Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="RECEIVED">Received</option>
              <option value="REFUND_INITIATED">Refund Initiated</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No return requests found
                    </td>
                  </tr>
                ) : (
                  returns.map((returnItem) => {
                    const actions = getAvailableActions(returnItem);
                    return (
                      <tr key={returnItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/admin/orders/${returnItem.orderId}`)}
                            className="text-rose-600 hover:text-rose-700 font-medium"
                          >
                            {returnItem.orderNumber}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {returnItem.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {returnItem.returnReason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(returnItem.requestDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(returnItem.returnStatus)}`}>
                            {getStatusLabel(returnItem.returnStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(returnItem.refundAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/admin/returns/${returnItem.id}`)}
                              className="text-rose-600 hover:text-rose-700 font-medium"
                            >
                              View
                            </button>
                            {actions.map((action) => (
                              <button
                                key={action.type}
                                onClick={() => handleAction(returnItem, action.type)}
                                className={`px-3 py-1 text-xs text-white rounded ${action.color}`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {actionType === 'approve' && 'Approve Return Request'}
              {actionType === 'reject' && 'Reject Return Request'}
              {actionType === 'received' && 'Mark Return as Received'}
              {actionType === 'initiate-refund' && 'Initiate Refund'}
              {actionType === 'complete-refund' && 'Complete Refund'}
            </h2>

            {actionType === 'approve' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Return Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.returnInstructions || ''}
                    onChange={(e) => setFormData({ ...formData, returnInstructions: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="Provide return instructions for the customer..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Return Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.returnAddress || ''}
                    onChange={(e) => setFormData({ ...formData, returnAddress: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="Enter the return address..."
                  />
                </div>
              </>
            )}

            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.rejectionReason || ''}
                  onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Provide a reason for rejecting this return request..."
                />
              </div>
            )}

            {actionType === 'complete-refund' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Refund Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.refundReference || ''}
                  onChange={(e) => setFormData({ ...formData, refundReference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Enter refund reference/transaction ID..."
                />
              </div>
            )}

            {(actionType === 'received' || actionType === 'initiate-refund') && (
              <p className="mb-4 text-gray-600">
                Are you sure you want to proceed with this action?
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setFormData({});
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                className="flex-1 py-2 px-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
