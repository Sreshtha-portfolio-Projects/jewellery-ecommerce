const Hero = () => {
  return (
    <section className="relative h-[600px] md:h-[700px] bg-beige-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-beige-100/80 to-transparent z-10"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200')] bg-cover bg-center"></div>
      
      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Unveiling the Beauty of Fine Jewelry
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Discover our exquisite collection of handcrafted pieces that celebrate elegance and timeless beauty.
          </p>
          <button className="px-8 py-3 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors font-medium">
            Shop Now
          </button>
        </div>
      </div>

      {/* Carousel Dots */}
      <div className="absolute bottom-8 right-8 z-20 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-white"></div>
        <div className="w-2 h-2 rounded-full bg-white/50"></div>
        <div className="w-2 h-2 rounded-full bg-white/50"></div>
      </div>
    </section>
  );
};

export default Hero;

