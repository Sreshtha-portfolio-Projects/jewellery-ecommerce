import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { showSuccess, showError } from '../../utils/toast';

const DeliveryZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ categories: [], metalTypes: [] });
  
  // Form state
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: '',
    delivery_days: 5,
    shipping_charge: 0,
    is_available: true,
    category: '',
    product_id: '',
    metal_type: '',
    priority: 0,
    notes: ''
  });

  useEffect(() => {
    fetchZones();
    fetchFilterOptions();
  }, [filters]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllDeliveryZones(
        filters.pincode,
        filters.category,
        filters.product_id
      );
      setZones(data.zones || []);
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
      showError('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const data = await adminService.getDeliveryZoneFilters();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingZone) {
        await adminService.updateDeliveryZone(editingZone.id, formData);
        showSuccess('Delivery zone updated successfully');
      } else {
        await adminService.createDeliveryZone(formData);
        showSuccess('Delivery zone created successfully');
      }
      setShowForm(false);
      setEditingZone(null);
      resetForm();
      fetchZones();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save delivery zone');
    }
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      pincode: zone.pincode || '',
      city: zone.city || '',
      state: zone.state || '',
      delivery_days: zone.delivery_days || 5,
      shipping_charge: zone.shipping_charge || 0,
      is_available: zone.is_available !== undefined ? zone.is_available : true,
      category: zone.category || '',
      product_id: zone.product_id || '',
      metal_type: zone.metal_type || '',
      priority: zone.priority || 0,
      notes: zone.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery zone?')) {
      return;
    }

    try {
      await adminService.deleteDeliveryZone(id);
      showSuccess('Delivery zone deleted successfully');
      fetchZones();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete delivery zone');
    }
  };

  const resetForm = () => {
    setFormData({
      pincode: '',
      city: '',
      state: '',
      delivery_days: 5,
      shipping_charge: 0,
      is_available: true,
      category: '',
      product_id: '',
      metal_type: '',
      priority: 0,
      notes: ''
    });
  };

  const getSpecificityLabel = (zone) => {
    if (zone.product_id) return 'Product';
    if (zone.category) return 'Category';
    if (zone.metal_type) return 'Metal Type';
    return 'Pincode';
  };

  const getSpecificityColor = (zone) => {
    if (zone.product_id) return 'bg-purple-100 text-purple-800';
    if (zone.category) return 'bg-blue-100 text-blue-800';
    if (zone.metal_type) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery zones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Delivery Zones</h1>
            <p className="text-gray-600 mt-1">Manage delivery timelines by pincode, category, or product</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingZone(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            + Add Delivery Zone
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search pincode..."
              value={filters.pincode || ''}
              onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Categories</option>
              {filterOptions.categories?.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => setFilters({})}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingZone ? 'Edit Delivery Zone' : 'Create Delivery Zone'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingZone(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode * (6 digits)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength="6"
                        pattern="[0-9]{6}"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Days *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.delivery_days}
                        onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Charge (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.shipping_charge}
                        onChange={(e) => setFormData({ ...formData, shipping_charge: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Higher priority = applied first</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., rings, necklaces"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Metal Type (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.metal_type}
                        onChange={(e) => setFormData({ ...formData, metal_type: e.target.value })}
                        placeholder="e.g., Gold, Silver"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product ID (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.product_id}
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                        placeholder="UUID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Available for delivery</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      {editingZone ? 'Update Zone' : 'Create Zone'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingZone(null);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Zones Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pincode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipping</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No delivery zones found
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {zone.pincode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {zone.city}, {zone.state}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecificityColor(zone)}`}>
                          {getSpecificityLabel(zone)}
                        </span>
                        {zone.category && (
                          <p className="text-xs text-gray-500 mt-1">Category: {zone.category}</p>
                        )}
                        {zone.metal_type && (
                          <p className="text-xs text-gray-500 mt-1">Metal: {zone.metal_type}</p>
                        )}
                        {zone.product && (
                          <p className="text-xs text-gray-500 mt-1">Product: {zone.product.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {zone.delivery_days} days
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        ₹{parseFloat(zone.shipping_charge || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          zone.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {zone.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(zone)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(zone.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryZones;
