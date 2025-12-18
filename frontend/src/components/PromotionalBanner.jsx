import { useNavigate } from 'react-router-dom';

const PromotionalBanner = ({ image, title, description, buttonText, reverse = false }) => {
  const navigate = useNavigate();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-0 ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className="aspect-square sm:aspect-[4/3] md:aspect-auto md:h-[350px] lg:h-[400px] bg-beige-100 overflow-hidden order-2 md:order-1">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-beige-400">
            <svg className="w-24 h-24 sm:w-32 sm:h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className={`bg-white flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 order-1 md:order-2 ${reverse ? 'md:order-1' : ''}`}>
        <div className="max-w-md w-full">
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{title}</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 leading-relaxed">{description}</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-rose-600 text-white rounded hover:bg-rose-700 active:bg-rose-800 transition-all duration-300 font-medium transform hover:scale-105 active:scale-95 hover:shadow-lg w-full sm:w-auto"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;

