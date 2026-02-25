import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  const search = useMemo(() => searchParams.get('search'), [searchParams]);
  const shape = useMemo(() => searchParams.get('shape'), [searchParams]);

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      
      let data;
      if (search) {
        data = await productService.search(search);
      } else if (category) {
        data = await productService.getByCategory(category);
      } else {
        data = await productService.getAll();
      }

      if (abortControllerRef.current?.signal.aborted) return;
      
      setProducts(data);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchProducts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  const searchTerm = searchParams.get('search');
  const categoryTitle = searchTerm 
    ? `Search Results for "${searchTerm}"`
    : category 
      ? category.charAt(0).toUpperCase() + category.slice(1) 
      : 'All Products';

  return (
    <div className="min-h-screen bg-beige-50 py-6 sm:py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">{categoryTitle}</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-rose-600"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-base sm:text-lg">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

