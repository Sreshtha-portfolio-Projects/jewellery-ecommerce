import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const search = searchParams.get('search');
        const shape = searchParams.get('shape');
        
        let data;
        if (search) {
          data = await productService.search(search);
        } else if (category) {
          data = await productService.getByCategory(category);
        } else {
          data = await productService.getAll();
        }
        
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, searchParams]);

  const searchTerm = searchParams.get('search');
  const categoryTitle = searchTerm 
    ? `Search Results for "${searchTerm}"`
    : category 
      ? category.charAt(0).toUpperCase() + category.slice(1) 
      : 'All Products';

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-4xl font-bold text-gray-900 mb-8">{categoryTitle}</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

