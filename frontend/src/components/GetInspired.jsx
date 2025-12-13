const GetInspired = () => {
  const images = [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600',
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600',
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl font-bold text-center text-gray-900 mb-12">Get Inspired</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg bg-beige-100 group cursor-pointer">
              <img
                src={image}
                alt={`Inspiration ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GetInspired;

