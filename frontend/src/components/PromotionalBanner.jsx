import { useNavigate } from 'react-router-dom';

const PromotionalBanner = ({ image, title, description, buttonText, reverse = false }) => {
  const navigate = useNavigate();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-0 ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className="aspect-square md:aspect-auto md:h-[400px] bg-beige-100 overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-beige-400">
            <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="bg-white flex items-center justify-center p-8 md:p-12">
        <div className="max-w-md">
          <h3 className="font-serif text-3xl font-bold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-8 py-3 bg-rose-600 text-white rounded hover:bg-rose-700 transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-lg"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;

