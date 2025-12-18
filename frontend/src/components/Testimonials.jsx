import { useState } from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah M.',
      quote: 'Luxury and elegance in every piece!',
      text: 'The quality and craftsmanship exceeded my expectations. I receive compliments every time I wear my pieces.',
      rating: 5,
    },
    {
      name: 'Jessica T.',
      quote: 'Perfect gift for my loved ones!',
      text: 'I purchased several pieces as gifts and everyone was thrilled. The packaging was beautiful too.',
      rating: 5,
    },
    {
      name: 'Emily R.',
      quote: 'Absolutely stunning jewelry!',
      text: 'The attention to detail is remarkable. These pieces have become my go-to for special occasions.',
      rating: 5,
    },
    {
      name: 'Maria L.',
      quote: 'Exquisite quality and service!',
      text: 'From browsing to delivery, every step was seamless. The jewelry is even more beautiful in person.',
      rating: 5,
    },
    {
      name: 'Sophie K.',
      quote: 'A true treasure!',
      text: 'I found the perfect engagement ring here. The staff was incredibly helpful and the ring is absolutely stunning.',
      rating: 5,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const maxIndex = Math.max(0, testimonials.length - itemsPerPage);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-beige-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Testimonials</h2>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="text-rose-600 hover:text-rose-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors p-1"
              aria-label="Previous testimonials"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className="text-rose-600 hover:text-rose-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors p-1"
              aria-label="Next testimonials"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 transition-all duration-300">
          {visibleTestimonials.map((testimonial, index) => (
            <div key={currentIndex + index} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-semibold text-sm sm:text-base mr-3 sm:mr-4">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900">{testimonial.name}</h4>
                  <div className="flex text-gold-500">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="font-semibold text-sm sm:text-base text-gray-900 mb-2">"{testimonial.quote}"</p>
              <p className="text-gray-600 text-xs sm:text-sm">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

