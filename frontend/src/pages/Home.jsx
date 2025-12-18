import Hero from '../components/Hero';
import ShopByCategory from '../components/ShopByCategory';
import ShopByShape from '../components/ShopByShape';
import BestsellerProducts from '../components/BestsellerProducts';
import PromotionalBanner from '../components/PromotionalBanner';
import Testimonials from '../components/Testimonials';
import GetInspired from '../components/GetInspired';

const Home = () => {
  return (
    <div>
      <Hero />
      <ShopByCategory />
      <ShopByShape />
      <BestsellerProducts />
      
      {/* Promotional Banners */}
      <div className="py-8 sm:py-12 md:py-16 bg-white">
        <PromotionalBanner
          image="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800"
          title="Jewelry That Tells Your Story in Sparkling Detail"
          description="Each piece in our collection is crafted with precision and care, designed to become a cherished part of your personal story. Discover timeless elegance that speaks to your unique style."
          buttonText="SHOP NOW"
        />
        <PromotionalBanner
          image="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"
          title="Adorn Yourself with Jewelry That Captures Your Essence"
          description="From delicate everyday pieces to statement jewelry for special occasions, find the perfect expression of your individuality in our curated collection."
          buttonText="SHOP NOW"
          reverse={true}
        />
      </div>

      {/* Elevate Your Look Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-beige-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative h-[300px] sm:h-[400px] md:h-[500px] rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-beige-100/90 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1200')] bg-cover bg-center"></div>
            <div className="relative z-20 h-full flex items-center px-4 sm:px-6 md:px-8 lg:px-16">
              <div className="max-w-2xl">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Elevate Your Everyday Look with Stunning Jewelry
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-8">
                  Transform your daily style with our carefully selected pieces that blend sophistication with everyday wearability.
                </p>
                <button className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-rose-600 text-white rounded hover:bg-rose-700 active:bg-rose-800 transition-colors font-medium">
                  SHOP NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <GetInspired />
    </div>
  );
};

export default Home;

