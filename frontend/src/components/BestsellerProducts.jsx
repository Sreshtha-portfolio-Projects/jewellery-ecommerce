import { useEffect, useState } from 'react';
import { productService } from '../services/productService';
import ProductCard from './ProductCard';

const BestsellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        // Filter bestsellers or take first 8
        const bestsellers = data.filter(p => p.is_bestseller).slice(0, 8);
        setProducts(bestsellers.length > 0 ? bestsellers : data.slice(0, 8));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Bestseller Products</h2>
          <a href="/products" className="text-sm sm:text-base text-rose-600 hover:text-rose-700 font-medium whitespace-nowrap">
            Shop All →
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestsellerProducts;

