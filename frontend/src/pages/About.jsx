const About = () => {
  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
          About Aldorado Jewells
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-6">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-700 leading-relaxed">
              At Aldorado Jewells, we believe that fine jewelry is more than an accessory—it's a reflection of your unique style and a celebration of life's most precious moments. With a passion for craftsmanship and an eye for timeless elegance, we curate exquisite pieces that speak to the discerning taste of our clientele.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Our mission is to bring you the finest collection of handcrafted jewelry, where every piece tells a story. We combine traditional artistry with contemporary design, ensuring that each creation is not just beautiful, but also meaningful and enduring.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Quality & Craftsmanship</h2>
            <p className="text-gray-700 leading-relaxed">
              Every piece in our collection is carefully selected for its quality, design, and craftsmanship. We work with skilled artisans who share our commitment to excellence, ensuring that each piece meets our high standards for beauty, durability, and elegance.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Our Promise</h2>
            <p className="text-gray-700 leading-relaxed">
              When you choose Aldorado Jewells, you're choosing more than jewelry—you're choosing a trusted partner in celebrating life's special moments. We stand behind every piece with our commitment to quality, service, and your complete satisfaction.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;

