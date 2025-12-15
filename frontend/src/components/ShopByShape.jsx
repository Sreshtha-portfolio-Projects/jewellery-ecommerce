import { useNavigate } from 'react-router-dom';

const ShopByShape = () => {
  const navigate = useNavigate();
  
  const shapes = [
    { name: 'Round', icon: '●' },
    { name: 'Cushion', icon: '◆' },
    { name: 'Emerald', icon: '▢' },
    { name: 'Pear', icon: '◄' },
    { name: 'Oval', icon: '○' },
    { name: 'Princess', icon: '◆' },
    { name: 'Heart', icon: '♥' },
    { name: 'Marquise', icon: '◊' },
  ];

  const handleShapeClick = (shapeName) => {
    // Navigate to products page with shape filter
    navigate(`/products?shape=${shapeName.toLowerCase()}`);
  };

  return (
    <section className="py-12 bg-beige-50">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl font-bold text-center text-gray-900 mb-8">Shop By Shape</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
          {shapes.map((shape) => (
            <div
              key={shape.name}
              onClick={() => handleShapeClick(shape.name)}
              className="flex flex-col items-center cursor-pointer group hover:scale-110 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-white border-2 border-beige-300 flex items-center justify-center text-2xl text-beige-600 group-hover:border-rose-400 group-hover:text-rose-600 group-hover:shadow-lg transition-all duration-300 mb-2">
                {shape.icon}
              </div>
              <span className="text-sm text-gray-700 font-medium group-hover:text-rose-700 transition-colors">{shape.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByShape;

