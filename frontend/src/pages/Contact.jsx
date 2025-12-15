const Contact = () => {
  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
          Contact Us
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-gray-700 mb-6">
                We'd love to hear from you. Whether you have a question about our products, need assistance with an order, or simply want to share your thoughts, we're here to help.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <a href="mailto:info@aldoradojewells.com" className="text-rose-600 hover:text-rose-700">
                    info@aldoradojewells.com
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Support</h3>
                  <p className="text-gray-700">Available 24/7 for your convenience</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Send us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Your message..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="font-semibold text-gray-900 mb-4">Coming Soon</h3>
            <div className="space-y-2 text-gray-600">
              <p>• Contact Support (Live Chat)</p>
              <p>• Phone Support</p>
              <p>• Store Locations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

