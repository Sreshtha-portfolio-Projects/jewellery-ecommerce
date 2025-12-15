import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white">
      {/* Top Footer Bar */}
      <div className="bg-rose-50 border-t border-rose-100 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl mb-2">🚚</div>
              <h3 className="font-semibold text-gray-900 mb-1">Free Shipping</h3>
              <p className="text-sm text-gray-600">On orders over $100</p>
            </div>
            <div>
              <div className="text-2xl mb-2">↩️</div>
              <h3 className="font-semibold text-gray-900 mb-1">15 Days Return</h3>
              <p className="text-sm text-gray-600">Easy returns</p>
            </div>
            <div>
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-gray-900 mb-1">Customer Support</h3>
              <p className="text-sm text-gray-600">24/7 assistance</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-600">Protected transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Footer Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Get in Touch */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">GET IN TOUCH</h3>
            <p className="text-gray-600">info@aldoradojewells.com</p>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">Let's Get In Touch!</h3>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your Email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button className="px-6 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors">
                SUBSCRIBE
              </button>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">SOCIAL MEDIA</h3>
            <div className="flex gap-4">
              <a 
                href="https://www.instagram.com/aldoradojewells" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-rose-600 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/aldoradojewells" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-rose-600 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://www.pinterest.com/aldoradojewells" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-rose-600 transition-colors"
                aria-label="Pinterest"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.487.535 6.624 0 12-5.373 12-12C24 5.372 18.627.001 12 .001z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Bar */}
      <div className="bg-rose-50 border-t border-rose-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">© 2023 Aldorado Jewells. All rights reserved.</div>
            <div className="text-2xl font-serif font-bold text-gray-900">Aldorado Jewells</div>
            <div className="flex items-center gap-6">
              <div className="flex gap-4 text-sm">
                <Link to="/products" className="text-gray-600 hover:text-rose-700">SHOP</Link>
                <Link to="/about" className="text-gray-600 hover:text-rose-700">ABOUT US</Link>
                <Link to="/contact" className="text-gray-600 hover:text-rose-700">CONTACT US</Link>
                <Link to="/privacy" className="text-gray-600 hover:text-rose-700">PRIVACY POLICY</Link>
              </div>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>Visa</span>
                <span>•</span>
                <span>Mastercard</span>
                <span>•</span>
                <span>Amex</span>
                <span>•</span>
                <span>PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

