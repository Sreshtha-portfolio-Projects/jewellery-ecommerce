import { Link } from 'react-router-dom';

const ShopByCategory = () => {
  const categories = [
    { name: 'Rings', path: '/products/rings', active: true },
    { name: 'Earrings', path: '/products/earrings' },
    { name: 'Bracelets', path: '/products/bracelets' },
    { name: 'Pendants', path: '/products/pendants' },
    { name: 'Necklaces', path: '/products/necklaces' },
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Category List */}
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Shop By Category</h2>
            <div className="space-y-3 sm:space-y-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  className={`flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base ${
                    category.active
                      ? 'bg-rose-50 text-rose-700 border-l-4 border-rose-600'
                      : 'text-gray-700 hover:bg-beige-50'
                  }`}
                >
                  <span className="font-medium">{category.name}</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Category Image */}
          <div className="hidden md:block">
            <div className="aspect-square rounded-lg overflow-hidden bg-beige-100">
              <img
                src="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800"
                alt="Jewelry rings"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;

