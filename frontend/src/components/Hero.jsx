import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] bg-beige-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-beige-100/80 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200')] bg-cover bg-center"></div>
      
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Unveiling the Beauty of Fine Jewelry
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-8">
            Discover our exquisite collection of handcrafted pieces that celebrate elegance and timeless beauty.
          </p>
          <button 
            onClick={() => navigate('/products')}
            className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-rose-600 text-white rounded hover:bg-rose-700 transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Shop Now
          </button>
        </div>
      </div>

      {/* Carousel Dots */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-20 flex gap-2">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/50"></div>
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/50"></div>
      </div>
    </section>
  );
};

export default Hero;

