import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { showSuccess, showError, showConfirm } from '../../utils/toast';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    short_description: '',
    category: 'rings',
    metal_type: 'Gold',
    purity: '',
    karat: 18,
    base_price: 0,
    is_active: true,
    is_bestseller: false
  });

  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]); // For new products - files to upload after creation
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await adminService.getProductById(id);
      setProduct({
        name: data.name || '',
        description: data.description || '',
        short_description: data.short_description || '',
        category: data.category || 'rings',
        metal_type: data.metal_type || 'Gold',
        purity: data.purity || '',
        karat: data.karat || 18,
        base_price: data.base_price || data.price || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_bestseller: data.is_bestseller || false
      });
      setVariants(data.variants || []);
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      showError('Failed to load product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (field, value) => {
    setProduct({ ...product, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: `temp-${Date.now()}`,
        size: '',
        color: '',
        finish: '',
        weight: '',
        stock_quantity: 0,
        sku: '',
        price_override: '',
        is_active: true
      }
    ]);
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleRemoveVariant = async (index) => {
    const variant = variants[index];
    if (variant.id && !variant.id.startsWith('temp-')) {
      const confirmed = await showConfirm('Delete this variant?');
      if (!confirmed) return;
      try {
        await adminService.deleteVariant(variant.id);
        showSuccess('Variant deleted successfully');
      } catch (error) {
        showError('Failed to delete variant');
        console.error('Error deleting variant:', error);
        return; // Don't remove from state if deletion failed
      }
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl && imageUrl.trim()) {
      setImages([
        ...images,
        {
          id: `temp-${Date.now()}`,
          image_url: imageUrl.trim(),
          alt_text: product.name || '',
          display_order: images.length,
          is_primary: images.length === 0
        }
      ]);
      showSuccess('Image URL added');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    // If creating new product, store file to upload after product creation
    if (!id) {
      setPendingImages([
        ...pendingImages,
        {
          file,
          alt_text: product.name || '',
          display_order: images.length + pendingImages.length,
          is_primary: images.length === 0 && pendingImages.length === 0
        }
      ]);
      showSuccess('Image will be uploaded after product is created');
      // Reset file input
      e.target.value = '';
      return;
    }

    // For existing products, upload immediately
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', product.name || '');
      formData.append('display_order', images.length);
      formData.append('is_primary', images.length === 0);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/products/${id}/images/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setImages([...images, data.image]);
      showSuccess('Image uploaded successfully!');
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      showError(error.message || 'Failed to upload image. Please try using image URL instead.');
    }
  };

  const handleRemoveImage = async (index) => {
    const image = images[index];
    if (image.id && !image.id.startsWith('temp-')) {
      const confirmed = await showConfirm('Delete this image?');
      if (!confirmed) return;
      try {
        await adminService.deleteImage(image.id);
        showSuccess('Image deleted successfully');
      } catch (error) {
        showError('Failed to delete image');
        console.error('Error deleting image:', error);
        return;
      }
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleReorderImages = (fromIndex, toIndex) => {
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updated.forEach((img, idx) => {
      img.display_order = idx;
    });
    setImages(updated);
  };

  const validate = () => {
    const newErrors = {};
    if (!product.name) newErrors.name = 'Name is required';
    if (!product.category) newErrors.category = 'Category is required';
    if (!product.base_price || product.base_price <= 0) {
      newErrors.base_price = 'Base price must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);

      // Prepare variants (remove temp IDs for new variants)
      const variantsToSave = variants.map(v => ({
        ...v,
        id: v.id?.startsWith('temp-') ? undefined : v.id,
        stock_quantity: parseInt(v.stock_quantity) || 0,
        weight: v.weight ? parseFloat(v.weight) : null,
        price_override: v.price_override ? parseFloat(v.price_override) : null
      }));

      // Prepare images (remove temp IDs for new images)
      const imagesToSave = images.map(img => ({
        ...img,
        id: img.id?.startsWith('temp-') ? undefined : img.id
      }));

      if (isEdit) {
        // Update product
        await adminService.updateProduct(id, product);

        // Update/create variants
        for (const variant of variantsToSave) {
          if (variant.id) {
            await adminService.updateVariant(variant.id, variant);
          } else {
            await adminService.createVariant(id, variant);
          }
        }

        // Update/create images
        for (const image of imagesToSave) {
          if (image.id) {
            // Image already exists, skip
          } else {
            await adminService.uploadProductImage(id, {
              image_url: image.image_url,
              alt_text: image.alt_text,
              display_order: image.display_order,
              is_primary: image.is_primary
            });
          }
        }

        // Reorder images if needed
        if (imagesToSave.length > 0) {
          const imageIds = imagesToSave
            .filter(img => img.id && !img.id.startsWith('temp-'))
            .map(img => img.id);
          if (imageIds.length > 0) {
            await adminService.reorderImages(id, imageIds);
          }
        }

        showSuccess('Product updated successfully!');
        navigate('/admin/products');
      } else {
        // Create product
        const result = await adminService.createProduct({
          ...product,
          variants: variantsToSave,
          images: imagesToSave
        });

        const newProductId = result.product.id;

        // Upload pending image files
        if (pendingImages.length > 0) {
          const uploadErrors = [];
          for (let i = 0; i < pendingImages.length; i++) {
            const pendingImage = pendingImages[i];
            try {
              const formData = new FormData();
              formData.append('image', pendingImage.file);
              formData.append('alt_text', pendingImage.alt_text || product.name || '');
              formData.append('display_order', imagesToSave.length + i);
              formData.append('is_primary', pendingImage.is_primary || false);

              const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/products/${newProductId}/images/upload`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                  },
                  body: formData
                }
              );

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `Failed to upload image ${i + 1}`;
                uploadErrors.push(errorMessage);
                console.error(`Failed to upload image ${i + 1}:`, errorMessage);
              }
            } catch (error) {
              const errorMessage = error.message || `Error uploading image ${i + 1}`;
              uploadErrors.push(errorMessage);
              console.error(`Error uploading image ${i + 1}:`, error);
            }
          }
          
          // Show error toast if any uploads failed
          if (uploadErrors.length > 0) {
            if (uploadErrors.length === pendingImages.length) {
              showError('Failed to upload all images. Please add them manually after product creation.');
            } else {
              showError(`Failed to upload ${uploadErrors.length} of ${pendingImages.length} images. Please add them manually.`);
            }
          }
        }

        showSuccess('Product created successfully!');
        navigate(`/admin/products/${newProductId}`);
        return;
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showError('Failed to save product: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/products')}
            className="text-gray-600 hover:text-rose-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => handleProductChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={product.category}
                  onChange={(e) => handleProductChange('category', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="rings">Rings</option>
                  <option value="earrings">Earrings</option>
                  <option value="necklaces">Necklaces</option>
                  <option value="bracelets">Bracelets</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metal Type
                </label>
                <select
                  value={product.metal_type}
                  onChange={(e) => handleProductChange('metal_type', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={product.base_price}
                  onChange={(e) => handleProductChange('base_price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    errors.base_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purity
                </label>
                <input
                  type="text"
                  value={product.purity}
                  onChange={(e) => handleProductChange('purity', e.target.value)}
                  placeholder="e.g., 18K, 22K, 925"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Karat
                </label>
                <input
                  type="number"
                  value={product.karat}
                  onChange={(e) => handleProductChange('karat', parseInt(e.target.value) || 18)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={product.short_description}
                onChange={(e) => handleProductChange('short_description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={product.description}
                onChange={(e) => handleProductChange('description', e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="mt-4 flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.is_active}
                  onChange={(e) => handleProductChange('is_active', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.is_bestseller}
                  onChange={(e) => handleProductChange('is_bestseller', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Bestseller</span>
              </label>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Variants</h2>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                + Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No variants added. Click "Add Variant" to create one.</p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={variant.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          placeholder="e.g., 6, 7, 8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          placeholder="e.g., Gold, Rose Gold"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Finish</label>
                        <input
                          type="text"
                          value={variant.finish}
                          onChange={(e) => handleVariantChange(index, 'finish', e.target.value)}
                          placeholder="e.g., Polished, Matte"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Weight (g)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.weight}
                          onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                        <input
                          type="number"
                          value={variant.stock_quantity}
                          onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Price Override (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price_override}
                          onChange={(e) => handleVariantChange(index, 'price_override', e.target.value)}
                          placeholder="Leave empty to use base price"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Images</h2>
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  📤 Upload File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  + Add URL
                </button>
              </div>
            </div>

            {images.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No images added. Click "Add Image" to add one.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={image.id || index} className="relative">
                    <img
                      src={image.image_url}
                      alt={image.alt_text}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {image.is_primary && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-rose-600 text-white text-xs rounded">
                        Primary
                      </span>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = images.map((img, idx) => ({
                            ...img,
                            is_primary: idx === index
                          }));
                          setImages(updated);
                        }}
                        className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                      >
                        Set Primary
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleReorderImages(index, index - 1)}
                        className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded"
                      >
                        ↑
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleReorderImages(index, index + 1)}
                        className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded"
                      >
                        ↓
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

