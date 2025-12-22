import { useState, useEffect } from 'react';
import { discountService } from '../../services/discountService';
import { showSuccess, showError } from '../../utils/toast';

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumCartValue: '',
    maxUses: '',
    expiresAt: ''
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Populate form when editing discount
  useEffect(() => {
    if (editingDiscount) {
      // Format expires_at for datetime-local input (YYYY-MM-DDTHH:mm)
      let formattedExpiresAt = '';
      if (editingDiscount.expires_at) {
        const date = new Date(editingDiscount.expires_at);
        // Convert to local datetime string in format YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formattedExpiresAt = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        code: editingDiscount.code || '',
        description: editingDiscount.description || '',
        discountType: editingDiscount.discount_type || 'percentage',
        discountValue: editingDiscount.discount_value?.toString() || '',
        minimumCartValue: editingDiscount.minimum_cart_value?.toString() || '',
        maxUses: editingDiscount.max_uses?.toString() || '',
        expiresAt: formattedExpiresAt
      });
      setShowForm(true);
    }
  }, [editingDiscount]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await discountService.getAll();
      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
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
    });
  };

  const getStatus = (discount) => {
    if (!discount.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    if (discount.expires_at && new Date(discount.expires_at) > new Date()) {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumCartValue: '',
      maxUses: '',
      expiresAt: ''
    });
    setEditingDiscount(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discountValue) {
      showError('Code and discount value are required');
      return;
    }

    try {
      setSubmitting(true);
      const discountData = {
        code: formData.code,
        description: formData.description || null,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minimumCartValue: formData.minimumCartValue ? parseFloat(formData.minimumCartValue) : 0,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        expiresAt: formData.expiresAt || null
      };

      if (editingDiscount) {
        await discountService.update(editingDiscount.id, discountData);
        showSuccess('Discount updated successfully');
      } else {
        await discountService.create(discountData);
        showSuccess('Discount created successfully');
      }

      setShowForm(false);
      resetForm();
      fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save discount';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading discounts...</p>
        </div>
      </div>
    );
  }

  const activeCount = discounts.filter((d) => getStatus(d).label === 'Active').length;
  const upcomingCount = discounts.filter((d) => {
    const status = getStatus(d);
    return status.label !== 'Active' && status.label !== 'Expired';
  }).length;
  const expiredCount = discounts.filter((d) => getStatus(d).label === 'Expired').length;
  const totalUses = discounts.reduce((sum, d) => sum + (d.used_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Discount & Promotions</h1>
            <p className="text-gray-600 mt-1">Manage discount codes and promotional offers</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
          >
            <span>+</span>
            <span>Add Discount</span>
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Upcoming</p>
            <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Expired</p>
            <p className="text-2xl font-bold text-gray-900">{expiredCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Uses</p>
            <p className="text-2xl font-bold text-gray-900">{totalUses}</p>
          </div>
        </div>

        {/* Discount Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 mb-4">No discounts found</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Create Your First Discount
              </button>
            </div>
          ) : (
            discounts.map((discount) => {
              const status = getStatus(discount);
              const usagePercentage = discount.max_uses
                ? Math.round((discount.used_count / discount.max_uses) * 100)
                : 0;

              return (
                <div
                  key={discount.id}
                  className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{discount.code}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{discount.description || 'No description'}</p>
                      <p className="font-semibold text-gray-900">
                        {discount.discount_type === 'percentage'
                          ? `${discount.discount_value}% Off`
                          : `${formatCurrency(discount.discount_value)} Flat Off`}
                      </p>
                    </div>
                    <div className="text-2xl">
                      {status.label === 'Active' ? '✅' : status.label === 'Expired' ? '❌' : '⏰'}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm font-medium text-gray-700">
                        {discount.discount_type === 'percentage' ? 'Percentage' : 'Flat Amount'}
                      </p>
                    </div>
                    {discount.minimum_cart_value > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Minimum Cart Value</p>
                        <p className="text-sm font-medium text-gray-700">
                          {formatCurrency(discount.minimum_cart_value)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Usage</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {discount.used_count || 0} / {discount.max_uses || '∞'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{usagePercentage}% used</p>
                    </div>
                    {discount.expires_at && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(discount.expires_at)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setEditingDiscount(discount)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                      View
                    </button>
                    <button
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                        status.label === 'Active'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {status.label === 'Active' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Discount Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDiscount ? 'Edit Discount' : 'Create Discount'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Discount Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="SAVE20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Optional description for this discount"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="flat">Flat Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Value <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      required
                      min="0"
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Cart Value
                    </label>
                    <input
                      type="number"
                      value={formData.minimumCartValue}
                      onChange={(e) => setFormData({ ...formData, minimumCartValue: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Uses
                    </label>
                    <input
                      type="number"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingDiscount ? 'Update Discount' : 'Create Discount'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discounts;
