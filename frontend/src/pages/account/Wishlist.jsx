import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistService } from '../../services/wishlistService';
import { productService } from '../../services/productService';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const wishlistData = await wishlistService.getWishlist();
      setWishlistItems(wishlistData);

      // Fetch product details for each wishlist item
      if (wishlistData.length > 0) {
        const productIds = wishlistData.map((item) => item.product_id);
        const productPromises = productIds.map((id) => productService.getById(id));
        const productData = await Promise.all(productPromises);
        setProducts(productData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems(wishlistItems.filter((item) => item.product_id !== productId));
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❤️</div>
          <p className="text-gray-600 mb-4">Your wishlist is empty</p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link to={`/products/${product.id}`}>
                <div className="aspect-square bg-beige-100 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">💎</span>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/products/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-rose-600">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-rose-600 font-bold mb-4">{formatCurrency(product.price)}</p>
                <button
                  onClick={() => handleRemove(product.id)}
                  className="w-full py-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors text-sm font-medium"
                >
                  Remove from Wishlist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
