import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { deliveryService } from '../services/deliveryService';
import { reviewService } from '../services/reviewService';
import { productPairingService } from '../services/productPairingService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { showSuccess, showError } from '../utils/toast';
import ProductCard from '../components/ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const [productData, reviewsData, relatedData] = await Promise.all([
        productService.getById(id),
        reviewService.getProductReviews(id).catch(() => ({ reviews: [], summary: null })),
        productPairingService.getPairedProducts(id).catch(() => ({ products: [] }))
      ]);
      
      setProduct(productData);
      setReviews(reviewsData.reviews || []);
      setReviewSummary(reviewsData.summary);
      setRelatedProducts(relatedData.products || []);
      
      // Set default variant if available
      if (productData.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showError('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDelivery = async () => {
    if (!pincode || pincode.length !== 6) {
      setMessage('Please enter a valid 6-digit pincode');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setCheckingDelivery(true);
      // Pass category and product_id for specific delivery times
      const info = await deliveryService.checkDelivery(
        pincode,
        product?.category || null,
        product?.id || null,
        product?.metal_type || null
      );
      setDeliveryInfo(info);
    } catch (error) {
      setMessage('Error checking delivery. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setCheckingDelivery(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if variant is required but not selected
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      showError('Please select a variant');
      return;
    }

    // Check stock
    if (selectedVariant && selectedVariant.stock_quantity < quantity) {
      showError('Insufficient stock');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity, selectedVariant?.id);
      showSuccess('Added to cart successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add to cart';
      showError(errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if variant is required but not selected
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      showError('Please select a variant');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity, selectedVariant?.id);
      navigate('/checkout');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add to cart';
      showError(errorMessage);
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewService.createReview(id, reviewRating, reviewText);
      setMessage('Review submitted successfully!');
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(5);
      // Refresh reviews
      const reviewsData = await reviewService.getProductReviews(id);
      setReviews(reviewsData.reviews || []);
      setReviewSummary(reviewsData.summary);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit review');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSubmittingReview(false);
    }
  };

  const images = product?.images || (product?.image_url ? [{ image_url: product.image_url, is_primary: true }] : []);
  const primaryImage = images[selectedImageIndex]?.image_url || product?.image_url;

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product || message === 'Product not found') {
    return (
      <div className="min-h-screen bg-beige-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // Calculate price - use variant price if selected, otherwise base price
  const basePrice = selectedVariant?.price_override 
    ? parseFloat(selectedVariant.price_override) 
    : parseFloat(product.price || product.base_price || 0);
  
  const originalPrice = basePrice;
  let finalPrice = originalPrice;
  let discountAmount = 0;
  if (product.offer) {
    if (product.offer.discount_percentage) {
      discountAmount = (originalPrice * product.offer.discount_percentage) / 100;
      finalPrice = originalPrice - discountAmount;
    } else if (product.offer.discount_amount) {
      discountAmount = parseFloat(product.offer.discount_amount);
      finalPrice = originalPrice - discountAmount;
    }
  }

  return (
    <div className="min-h-screen bg-beige-50 py-4 sm:py-6 md:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 hover:text-rose-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8">
            {/* Product Images */}
            <div>
              {/* Main Image */}
              <div className="aspect-square overflow-hidden bg-beige-100 rounded-lg mb-4">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-beige-400">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-rose-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                {product.name}
              </h1>

              {/* Rating Display */}
              {reviewSummary && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(reviewSummary.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {reviewSummary.averageRating} ({reviewSummary.totalReviews} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-4 sm:mb-6">
                {product.offer && (
                  <div className="mb-2">
                    <span className="text-base sm:text-lg text-gray-500 line-through mr-2">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs sm:text-sm font-medium">
                      {product.offer.discount_percentage
                        ? `${product.offer.discount_percentage}% OFF`
                        : `₹${discountAmount.toLocaleString('en-IN')} OFF`}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-semibold text-gray-900">
                    ₹{finalPrice.toLocaleString('en-IN')}
                  </span>
                  {product.offer?.offer_text && (
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                      {product.offer.offer_text}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              {product.category && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-sm font-medium">
                    {product.category}
                  </span>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Variant Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Variant</h3>
                  <div className="space-y-3">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const isOutOfStock = variant.stock_quantity <= 0;
                      const variantLabel = [
                        variant.size && `Size: ${variant.size}`,
                        variant.color && `Color: ${variant.color}`,
                        variant.finish && `Finish: ${variant.finish}`,
                        variant.weight && `Weight: ${variant.weight}g`
                      ].filter(Boolean).join(' • ') || 'Default';

                      return (
                        <button
                          key={variant.id}
                          onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                          disabled={isOutOfStock}
                          className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'border-rose-600 bg-rose-50'
                              : isOutOfStock
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{variantLabel}</div>
                              {variant.price_override && (
                                <div className="text-sm text-gray-600">
                                  Price: ₹{parseFloat(variant.price_override).toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                isOutOfStock ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {isOutOfStock ? 'Out of Stock' : `${variant.stock_quantity} available`}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              {(!product.variants || product.variants.length === 0) && product.stock_quantity !== undefined && (
                <div className="mb-6">
                  <p className={`text-sm font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} available)` : 'Out of Stock'}
                  </p>
                </div>
              )}
              
              {selectedVariant && (
                <div className="mb-6">
                  <p className={`text-sm font-medium ${
                    selectedVariant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedVariant.stock_quantity > 0 
                      ? `In Stock (${selectedVariant.stock_quantity} available)` 
                      : 'Out of Stock'}
                  </p>
                </div>
              )}

              {/* Delivery Check */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Check Delivery</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    maxLength="6"
                  />
                  <button
                    onClick={handleCheckDelivery}
                    disabled={checkingDelivery || !pincode}
                    className="px-4 py-2 text-sm sm:text-base bg-rose-600 text-white rounded-lg hover:bg-rose-700 active:bg-rose-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {checkingDelivery ? 'Checking...' : 'Check'}
                  </button>
                </div>
                {deliveryInfo && (
                  <div className={`mt-3 p-3 rounded ${deliveryInfo.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {deliveryInfo.available ? (
                      <div>
                        <p className="font-medium">✓ Delivery available</p>
                        <p className="text-sm">
                          {deliveryInfo.city}, {deliveryInfo.state} - {deliveryInfo.estimatedDays} business days
                        </p>
                        {deliveryInfo.estimatedDate && (
                          <p className="text-xs mt-1">
                            Estimated delivery: {new Date(deliveryInfo.estimatedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>{deliveryInfo.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Message */}
              {message && (
                <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Quantity:
                </label>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2 sm:px-3 py-1 hover:bg-gray-100 active:bg-gray-200 transition-colors text-lg sm:text-base"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 sm:w-16 px-2 py-1 text-center border-0 focus:outline-none text-sm sm:text-base"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2 sm:px-3 py-1 hover:bg-gray-100 active:bg-gray-200 transition-colors text-lg sm:text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    addingToCart || 
                    (product.variants && product.variants.length > 0 && !selectedVariant) ||
                    (selectedVariant && selectedVariant.stock_quantity === 0) ||
                    (!selectedVariant && product.stock_quantity !== undefined && product.stock_quantity === 0)
                  }
                  className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={
                    addingToCart || 
                    (product.variants && product.variants.length > 0 && !selectedVariant) ||
                    (selectedVariant && selectedVariant.stock_quantity === 0) ||
                    (!selectedVariant && product.stock_quantity !== undefined && product.stock_quantity === 0)
                  }
                  className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base bg-rose-600 text-white rounded-lg hover:bg-rose-700 active:bg-rose-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Reviews</h2>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 text-sm sm:text-base bg-rose-600 text-white rounded-lg hover:bg-rose-700 active:bg-rose-800 transition-colors w-full sm:w-auto"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${rating <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Share your experience with this product..."
                />
              </div>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {review.is_verified_purchase && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Verified Purchase</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-gray-700">{review.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
          )}
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
