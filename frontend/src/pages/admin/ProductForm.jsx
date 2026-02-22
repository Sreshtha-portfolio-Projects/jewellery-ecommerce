import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { showSuccess, showError, showConfirm } from '../../utils/toast';

const ITEM_TYPES = [
  { code: 'RN', label: 'Ring' },
  { code: 'BR', label: 'Bracelet' },
  { code: 'NK', label: 'Necklace' },
  { code: 'ER', label: 'Earring' },
  { code: 'PD', label: 'Pendant' },
  { code: 'BN', label: 'Bangle' },
  { code: 'AN', label: 'Anklet' },
  { code: 'CH', label: 'Chain' },
  { code: 'OT', label: 'Other' },
];

const STONE_UNITS = ['CTS', 'g', 'pc'];

const DEFAULT_VISIBILITY = {
  metalSection: true,
  stoneSection: true,
  labourSection: false,
  addCharge: false,
  costPrice: false,
  overhead: false,
  margin: false,
  priceBreakdown: false,
  itemCode: true,
  grossWeight: true,
};

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

const VisibilityBtn = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    title={value ? 'Visible to customers — click to hide' : 'Hidden from customers — click to show'}
    className={`ml-2 p-1 rounded-full transition-colors ${
      value ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-500'
    }`}
  >
    <EyeIcon visible={value} />
  </button>
);

const SectionHeader = ({ title, visKey, visibility, onVisibility, children }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-1">
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {visKey && (
        <VisibilityBtn
          value={visibility[visKey]}
          onChange={(v) => onVisibility(visKey, v)}
        />
      )}
    </div>
    {children}
  </div>
);

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
    is_active: true,
    is_bestseller: false,
    item_code: '',
    family: '',
    item_type: 'RN',
    pieces: 1,
    add_charge: 0,
    overhead_percent: 0,
    margin_percent: 0,
    net_weight: '',
    visibility: { ...DEFAULT_VISIBILITY },
  });

  const [metals, setMetals] = useState([]);
  const [stones, setStones] = useState([]);
  const [labour, setLabour] = useState([]);
  const [images, setImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [errors, setErrors] = useState({});

  // ── Derived totals (mirrors backend calculatePricing exactly) ───────────
  //
  //   overhead_amount       = labour_cost_internal × overhead_percent / 100
  //   subtotal              = metal + stone + labour_cost_internal + overhead_amount
  //   margin_amount         = subtotal × margin_percent / 100
  //   final_total_price     = subtotal + margin_amount
  //   labour_charge_visible = final_total_price − metal − stone
  //
  const metalTotalWeight = useMemo(
    () => metals.reduce((s, m) => s + (parseFloat(m.gross_weight) || 0), 0),
    [metals]
  );
  const metalTotalAmount = useMemo(
    () => metals.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0),
    [metals]
  );
  const stoneTotalAmount = useMemo(
    () => stones.reduce((s, st) => s + (parseFloat(st.amount) || 0), 0),
    [stones]
  );
  // Internal labour cost — what admin pays, never shown to customer
  const labourCostInternal = useMemo(
    () => labour.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0),
    [labour]
  );
  // Overhead applied only to labour cost
  const overheadAmount = useMemo(
    () => labourCostInternal * (parseFloat(product.overhead_percent) || 0) / 100,
    [labourCostInternal, product.overhead_percent]
  );
  // Margin applied to the full subtotal
  const subtotal = useMemo(
    () => metalTotalAmount + stoneTotalAmount + labourCostInternal + overheadAmount,
    [metalTotalAmount, stoneTotalAmount, labourCostInternal, overheadAmount]
  );
  const marginAmount = useMemo(
    () => subtotal * (parseFloat(product.margin_percent) || 0) / 100,
    [subtotal, product.margin_percent]
  );
  const finalTotalPrice = useMemo(
    () => subtotal + marginAmount,
    [subtotal, marginAmount]
  );
  // Derived visible labour charge — absorbs overhead + margin, keeps pricing clean
  const labourChargeVisible = useMemo(
    () => finalTotalPrice - metalTotalAmount - stoneTotalAmount,
    [finalTotalPrice, metalTotalAmount, stoneTotalAmount]
  );

  // ── Metal helpers ───────────────────────────────────────────────────────
  const calcMetalAmount = (row) =>
    (parseFloat(row.gross_weight) || 0) * (parseFloat(row.rate) || 0);

  const handleMetalChange = (i, field, value) => {
    setMetals((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      updated[i].amount = calcMetalAmount(updated[i]);
      return updated;
    });
  };
  const addMetal = () =>
    setMetals((prev) => [
      ...prev,
      { name: 'Gold', purity: '18K', gross_weight: '', rate: '', amount: 0, visible: true },
    ]);
  const removeMetal = (i) => setMetals((prev) => prev.filter((_, idx) => idx !== i));

  // ── Stone helpers ───────────────────────────────────────────────────────
  const calcStoneAmount = (row) => {
    const w = parseFloat(row.weight) || 0;
    const pcs = parseFloat(row.pieces) || 0;
    const price = parseFloat(row.price) || 0;
    return row.unit === 'pc' ? pcs * price : w * price;
  };

  const handleStoneChange = (i, field, value) => {
    setStones((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      updated[i].amount = calcStoneAmount(updated[i]);
      return updated;
    });
  };
  const addStone = () =>
    setStones((prev) => [
      ...prev,
      { name: '', type: '', size: '', weight: '', pieces: '', price: '', unit: 'CTS', amount: 0, visible: true },
    ]);
  const removeStone = (i) => setStones((prev) => prev.filter((_, idx) => idx !== i));

  // ── Labour helpers ──────────────────────────────────────────────────────
  const calcLabourAmount = (row) =>
    (parseFloat(row.weight) || 0) * (parseFloat(row.rate) || 0);

  const handleLabourChange = (i, field, value) => {
    setLabour((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      updated[i].amount = calcLabourAmount(updated[i]);
      return updated;
    });
  };
  const addLabour = () =>
    setLabour((prev) => [...prev, { description: 'Labour', weight: '', rate: '', amount: 0 }]);
  const removeLabour = (i) => setLabour((prev) => prev.filter((_, idx) => idx !== i));

  // ── Visibility helper ───────────────────────────────────────────────────
  const setVis = (key, val) =>
    setProduct((p) => ({ ...p, visibility: { ...p.visibility, [key]: val } }));

  // ── Field change ────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setProduct((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  // ── Load for edit ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isEdit) fetchProduct();
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
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_bestseller: data.is_bestseller || false,
        item_code: data.item_code || '',
        family: data.family || '',
        item_type: data.item_type || 'RN',
        pieces: data.pieces || 1,
        add_charge: data.add_charge || 0,
        overhead_percent: data.overhead_percent || 0,
        margin_percent: data.margin_percent || 0,
        net_weight: data.net_weight || '',
        visibility: { ...DEFAULT_VISIBILITY, ...(data.visibility || {}) },
      });
      setMetals(data.metals || []);
      setStones(data.stones || []);
      setLabour(data.labour || []);
      setImages(data.images || []);
    } catch {
      showError('Failed to load product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  // ── Image handlers ──────────────────────────────────────────────────────
  const handleAddImage = () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl?.trim()) {
      setImages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          image_url: imageUrl.trim(),
          alt_text: product.name || '',
          display_order: prev.length,
          is_primary: prev.length === 0,
        },
      ]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { showError('File size must be less than 5MB'); return; }

    if (!id) {
      setPendingImages((prev) => [
        ...prev,
        {
          file,
          alt_text: product.name || '',
          display_order: images.length + prev.length,
          is_primary: images.length === 0 && prev.length === 0,
        },
      ]);
      showSuccess('Image will be uploaded after product is created');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('alt_text', product.name || '');
      formData.append('display_order', images.length);
      formData.append('is_primary', images.length === 0);
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const response = await fetch(
        `${apiBaseUrl}/api/admin/products/${id}/images/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          body: formData,
        }
      );
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Upload failed');
      const data = await response.json();
      setImages((prev) => [...prev, data.image]);
      showSuccess('Image uploaded!');
      e.target.value = '';
    } catch (error) {
      showError(error.message || 'Failed to upload image');
    }
  };

  const handleRemoveImage = async (index) => {
    const image = images[index];
    if (image.id && !image.id.startsWith('temp-')) {
      const confirmed = await showConfirm('Delete this image?');
      if (!confirmed) return;
      try {
        await adminService.deleteImage(image.id);
      } catch {
        showError('Failed to delete image');
        return;
      }
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!product.name) newErrors.name = 'Product name is required';
    if (!product.category) newErrors.category = 'Category is required';
    // Require at least one pricing component on create (avoid saving products with ₹0 price)
    if (!isEdit && parseFloat(finalTotalPrice || 0) <= 0) {
      newErrors.pricing = 'Add metals, stones, or labour so the selling price is greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      const productData = {
        ...product,
        metals,
        stones,
        labour,
        // Internal (backend will recalculate authoritatively, but we pass inputs)
        cost_price: metalTotalAmount + stoneTotalAmount + labourCostInternal,
        overhead_amount: overheadAmount,
        margin_amount: marginAmount,
        labour_cost_internal: labourCostInternal,
        labour_charge_visible: labourChargeVisible,
        selling_price: finalTotalPrice,
        gross_weight: metalTotalWeight,
        base_price: finalTotalPrice,
        price: finalTotalPrice,
        images: images.map((img) => ({
          ...img,
          id: img.id?.startsWith('temp-') ? undefined : img.id,
        })),
      };

      if (isEdit) {
        await adminService.updateProduct(id, productData);
        showSuccess('Product updated successfully!');
        navigate('/admin/products');
      } else {
        const result = await adminService.createProduct(productData);
        const newProductId = result.product.id;
        for (let i = 0; i < pendingImages.length; i++) {
          try {
            const formData = new FormData();
            formData.append('image', pendingImages[i].file);
            formData.append('alt_text', pendingImages[i].alt_text || product.name || '');
            formData.append('display_order', i);
            formData.append('is_primary', pendingImages[i].is_primary || false);
            const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
            await fetch(`${apiBaseUrl}/api/admin/products/${newProductId}/images/upload`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
              body: formData,
            });
          } catch {}
        }
        showSuccess('Product created successfully!');
        navigate(`/admin/products/${newProductId}`);
      }
    } catch (error) {
      showError('Failed to save: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back nav */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/products')}
            className="text-gray-600 hover:text-rose-700 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <EyeIcon visible /> green eye
            </span>
            {' '}= visible to customers &nbsp;|&nbsp;
            <span className="inline-flex items-center gap-1 text-gray-400">
              <EyeIcon visible={false} /> grey eye
            </span>
            {' '}= hidden from customers
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── LEFT / MAIN ── */}
            <div className="xl:col-span-2 space-y-6">

              {/* ── Item Header ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <SectionHeader title="Item Header" visKey="itemCode" visibility={product.visibility} onVisibility={setVis} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Item Code</label>
                    <input
                      type="text"
                      value={product.item_code}
                      onChange={(e) => handleChange('item_code', e.target.value)}
                      placeholder="e.g., AL 0001 R"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Family</label>
                    <input
                      type="text"
                      value={product.family}
                      onChange={(e) => handleChange('family', e.target.value)}
                      placeholder="e.g., KM"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Item Type</label>
                    <select
                      value={product.item_type}
                      onChange={(e) => handleChange('item_type', e.target.value)}
                      className={inputCls}
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t.code} value={t.code}>{t.code} – {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pieces (Pcs)</label>
                    <input
                      type="number"
                      min="1"
                      value={product.pieces}
                      onChange={(e) => handleChange('pieces', parseInt(e.target.value) || 1)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* ── Metal Costing ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <SectionHeader
                  title="Metal Costing"
                  visKey="metalSection"
                  visibility={product.visibility}
                  onVisibility={setVis}
                >
                  <button
                    type="button"
                    onClick={addMetal}
                    className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    + Add Metal
                  </button>
                </SectionHeader>

                {metals.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    No metals added. Click "+ Add Metal" to start.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-amber-50 text-amber-800">
                          <th className="px-3 py-2 text-left font-semibold">Metal</th>
                          <th className="px-3 py-2 text-left font-semibold">Purity</th>
                          <th className="px-3 py-2 text-right font-semibold">Gr. Wt (g)</th>
                          <th className="px-3 py-2 text-right font-semibold">Rate (₹/g)</th>
                          <th className="px-3 py-2 text-right font-semibold">Amount (₹)</th>
                          <th className="px-3 py-2 text-center font-semibold">Visible</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {metals.map((m, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => handleMetalChange(i, 'name', e.target.value)}
                                placeholder="Gold"
                                className={inputCls}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={m.purity}
                                onChange={(e) => handleMetalChange(i, 'purity', e.target.value)}
                                placeholder="18K"
                                className={`${inputCls} w-20`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.001"
                                value={m.gross_weight}
                                onChange={(e) => handleMetalChange(i, 'gross_weight', e.target.value)}
                                placeholder="0.000"
                                className={`${inputCls} text-right w-24`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={m.rate}
                                onChange={(e) => handleMetalChange(i, 'rate', e.target.value)}
                                placeholder="0"
                                className={`${inputCls} text-right w-28`}
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-800">
                              ₹{fmt(m.amount)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <VisibilityBtn
                                value={m.visible !== false}
                                onChange={(v) => handleMetalChange(i, 'visible', v)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => removeMetal(i)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Remove row"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-amber-50 font-semibold text-amber-900">
                          <td colSpan={2} className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right">{fmt(metalTotalWeight)} g</td>
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2 text-right">₹{fmt(metalTotalAmount)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Stone Costing ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <SectionHeader
                  title="Stone Costing"
                  visKey="stoneSection"
                  visibility={product.visibility}
                  onVisibility={setVis}
                >
                  <button
                    type="button"
                    onClick={addStone}
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    + Add Stone
                  </button>
                </SectionHeader>

                {stones.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    No stones added. Click "+ Add Stone" to start.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-50 text-blue-800">
                          <th className="px-3 py-2 text-left font-semibold">Stone</th>
                          <th className="px-3 py-2 text-left font-semibold">Type</th>
                          <th className="px-3 py-2 text-left font-semibold">Size</th>
                          <th className="px-3 py-2 text-right font-semibold">Weight</th>
                          <th className="px-3 py-2 text-right font-semibold">Pcs</th>
                          <th className="px-3 py-2 text-right font-semibold">Price</th>
                          <th className="px-3 py-2 text-center font-semibold">Unit</th>
                          <th className="px-3 py-2 text-right font-semibold">Amount (₹)</th>
                          <th className="px-3 py-2 text-center font-semibold">Visible</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stones.map((st, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={st.name}
                                onChange={(e) => handleStoneChange(i, 'name', e.target.value)}
                                placeholder="Diamond"
                                className={`${inputCls} w-24`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={st.type}
                                onChange={(e) => handleStoneChange(i, 'type', e.target.value)}
                                placeholder="—"
                                className={`${inputCls} w-20`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={st.size}
                                onChange={(e) => handleStoneChange(i, 'size', e.target.value)}
                                placeholder="—"
                                className={`${inputCls} w-20`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.001"
                                value={st.weight}
                                onChange={(e) => handleStoneChange(i, 'weight', e.target.value)}
                                placeholder="0"
                                className={`${inputCls} text-right w-20`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={st.pieces}
                                onChange={(e) => handleStoneChange(i, 'pieces', e.target.value)}
                                placeholder="0"
                                className={`${inputCls} text-right w-16`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={st.price}
                                onChange={(e) => handleStoneChange(i, 'price', e.target.value)}
                                placeholder="0"
                                className={`${inputCls} text-right w-24`}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <select
                                value={st.unit}
                                onChange={(e) => handleStoneChange(i, 'unit', e.target.value)}
                                className={`${inputCls} w-16 text-center px-1`}
                              >
                                {STONE_UNITS.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-800">
                              ₹{fmt(st.amount)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <VisibilityBtn
                                value={st.visible !== false}
                                onChange={(v) => handleStoneChange(i, 'visible', v)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => removeStone(i)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-50 font-semibold text-blue-900">
                          <td colSpan={7} className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right">₹{fmt(stoneTotalAmount)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Labour ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <SectionHeader
                  title="Labour"
                  visKey="labourSection"
                  visibility={product.visibility}
                  onVisibility={setVis}
                >
                  <button
                    type="button"
                    onClick={addLabour}
                    className="px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                  >
                    + Add Labour
                  </button>
                </SectionHeader>

                {labour.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">
                    No labour rows added. Click "+ Add Labour" to start.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-violet-50 text-violet-800">
                          <th className="px-3 py-2 text-left font-semibold">Description</th>
                          <th className="px-3 py-2 text-right font-semibold">Weight (g)</th>
                          <th className="px-3 py-2 text-right font-semibold">Rate (₹/g)</th>
                          <th className="px-3 py-2 text-right font-semibold">Amount (₹)</th>
                          <th className="px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {labour.map((l, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={l.description}
                                onChange={(e) => handleLabourChange(i, 'description', e.target.value)}
                                placeholder="Labour"
                                className={inputCls}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.001"
                                value={l.weight}
                                onChange={(e) => handleLabourChange(i, 'weight', e.target.value)}
                                placeholder="0"
                                className={`${inputCls} text-right`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={l.rate}
                                onChange={(e) => handleLabourChange(i, 'rate', e.target.value)}
                                placeholder="0"
                                className={`${inputCls} text-right`}
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-800">
                              ₹{fmt(l.amount)}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => removeLabour(i)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-violet-50 font-semibold text-violet-900">
                          <td colSpan={3} className="px-3 py-2">Total (Internal)</td>
                          <td className="px-3 py-2 text-right">₹{fmt(labourCostInternal)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Basic Info ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Product Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`${inputCls} ${errors.name ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                    <select
                      value={product.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className={`${inputCls} ${errors.category ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value="rings">Rings</option>
                      <option value="earrings">Earrings</option>
                      <option value="necklaces">Necklaces</option>
                      <option value="bracelets">Bracelets</option>
                      <option value="pendants">Pendants</option>
                      <option value="bangles">Bangles</option>
                      <option value="anklets">Anklets</option>
                      <option value="chains">Chains</option>
                    </select>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Net Weight (g)
                      <VisibilityBtn
                        value={product.visibility.grossWeight}
                        onChange={(v) => setVis('grossWeight', v)}
                      />
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={product.net_weight}
                      onChange={(e) => handleChange('net_weight', e.target.value)}
                      placeholder="Optional"
                      className={inputCls}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
                    <input
                      type="text"
                      value={product.short_description}
                      onChange={(e) => handleChange('short_description', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Description</label>
                    <textarea
                      value={product.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                      className="w-4 h-4 accent-rose-600"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.is_bestseller}
                      onChange={(e) => handleChange('is_bestseller', e.target.checked)}
                      className="w-4 h-4 accent-rose-600"
                    />
                    <span className="text-sm text-gray-700">Bestseller</span>
                  </label>
                </div>
              </div>

              {/* ── Images ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Images</h2>
                  <div className="flex gap-2">
                    <label className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                      📤 Upload
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      + URL
                    </button>
                  </div>
                </div>

                {pendingImages.length > 0 && (
                  <p className="text-xs text-amber-600 mb-3">
                    {pendingImages.length} image(s) queued — will upload after product is saved.
                  </p>
                )}

                {images.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">
                    No images added yet.
                  </p>
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
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600 text-white text-xs rounded">
                            Primary
                          </span>
                        )}
                        <div className="mt-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setImages(images.map((img, idx) => ({ ...img, is_primary: idx === index })))
                            }
                            className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          >
                            Set Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="space-y-6 xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto xl:pb-4">

              {/* ── Cost Sheet Summary ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-1">Cost Sheet</h2>
                <p className="text-xs text-gray-400 mb-4">Overhead + margin are embedded into Labour Charge shown to customers.</p>

                {/* ── INTERNAL BREAKDOWN (admin only) ── */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Internal</span>
                    <span className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Admin only</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Metal</span>
                      <span className="font-medium">₹{fmt(metalTotalAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Stone</span>
                      <span className="font-medium">₹{fmt(stoneTotalAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Labour (cost)</span>
                      <span className="font-medium">₹{fmt(labourCostInternal)}</span>
                    </div>

                    {/* Overhead % */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-gray-500 text-xs">Overhead % on Labour</label>
                        <span className="text-gray-400 text-xs">= ₹{fmt(overheadAmount)}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.overhead_percent}
                        onChange={(e) => handleChange('overhead_percent', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className={`${inputCls} text-right`}
                      />
                    </div>

                    <div className="flex justify-between py-1 bg-gray-50 px-2 rounded text-xs text-gray-500">
                      <span>Subtotal (excl. margin)</span>
                      <span>₹{fmt(subtotal)}</span>
                    </div>

                    {/* Margin % */}
                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-gray-500 text-xs">Margin % on Subtotal</label>
                        <span className="text-gray-400 text-xs">= ₹{fmt(marginAmount)}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.margin_percent}
                        onChange={(e) => handleChange('margin_percent', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className={`${inputCls} text-right`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── CUSTOMER VIEW PREVIEW ── */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Customer View</span>
                    <span className="flex-1 border-t border-dashed border-emerald-100" />
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Metal</span>
                      <span className="font-medium">₹{fmt(metalTotalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stone</span>
                      <span className="font-medium">₹{fmt(stoneTotalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labour Charge
                        <span className="ml-1 text-xs text-gray-400">(incl. overhead + margin)</span>
                      </span>
                      <span className="font-medium text-emerald-700">₹{fmt(labourChargeVisible)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-emerald-200 font-bold text-base">
                      <span className="text-gray-800">Total</span>
                      <span className="text-emerald-700">₹{fmt(finalTotalPrice)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Gross Weight</span>
                    <span>{fmt(metalTotalWeight)} g</span>
                  </div>
                </div>

                {/* Show breakdown toggle */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Show breakdown on product page</span>
                  <VisibilityBtn
                    value={product.visibility.priceBreakdown}
                    onChange={(v) => setVis('priceBreakdown', v)}
                  />
                </div>
              </div>

              {/* ── Visibility Summary ── */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Customer Visibility</h2>
                <p className="text-xs text-gray-400 mb-3">Toggle what customers see on the product page.</p>
                <div className="space-y-2">
                  {[
                    { key: 'metalSection',    label: 'Metal breakdown (per row)' },
                    { key: 'stoneSection',    label: 'Stone breakdown (per row)' },
                    { key: 'labourSection',   label: 'Labour Charge line item' },
                    { key: 'priceBreakdown',  label: 'Full price breakdown table' },
                    { key: 'itemCode',        label: 'Item Code & Family' },
                    { key: 'grossWeight',     label: 'Gross / Net Weight' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <span className="text-sm text-gray-700">{label}</span>
                      <button
                        type="button"
                        onClick={() => setVis(key, !product.visibility[key])}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          product.visibility[key] ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            product.visibility[key] ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
