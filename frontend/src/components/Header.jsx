import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AccountDropdown from './account/AccountDropdown';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-rose-50 border-b border-rose-100 py-2">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="text-rose-800 font-medium text-xs sm:text-sm truncate">Aldorado Jewells</div>
            <div className="text-rose-700 hidden sm:block text-xs sm:text-sm">DISCOVER OUR NEW ARRIVALS</div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="text-rose-700 hover:text-rose-900 transition-colors p-1 sm:p-0"
                  aria-label="Search"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                {isSearchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-xs bg-white rounded-lg shadow-lg p-3 sm:p-4 z-50">
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
                      >
                        Search
                      </button>
                    </form>
                  </div>
                )}
              </div>
              <Link 
                to="/cart" 
                className="text-rose-700 hover:text-rose-900 transition-colors relative p-1 sm:p-0"
                aria-label="Shopping cart"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-rose-600 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <AccountDropdown />
              ) : (
                <Link to="/login" className="text-rose-700 hover:text-rose-900 p-1 sm:p-0" aria-label="Login">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-gray-900 hover:text-rose-700 transition-colors">
          Aldorado Jewells
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-8">
            <Link to="/" className="text-sm xl:text-base text-gray-700 hover:text-rose-700 font-medium transition-colors">HOME</Link>
            <Link to="/products/earrings" className="text-sm xl:text-base text-gray-700 hover:text-rose-700 font-medium transition-colors">EARRINGS</Link>
            <Link to="/products/bracelets" className="text-sm xl:text-base text-gray-700 hover:text-rose-700 font-medium transition-colors">BRACELETS</Link>
            <Link to="/products/rings" className="text-sm xl:text-base text-gray-700 hover:text-rose-700 font-medium transition-colors">RINGS</Link>
            <Link to="/products/necklaces" className="text-sm xl:text-base text-gray-700 hover:text-rose-700 font-medium transition-colors">NECKLACES</Link>
            <Link to="/about" className="text-sm xl:text-base text-gray-700 hover:text-rose-700 font-medium transition-colors">ABOUT US</Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700 p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 animate-in slide-in-from-top">
            <div className="flex flex-col gap-3 sm:gap-4 pt-4">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-base sm:text-lg text-gray-700 hover:text-rose-700 font-medium py-2">HOME</Link>
              <Link to="/products/earrings" onClick={() => setIsMenuOpen(false)} className="text-base sm:text-lg text-gray-700 hover:text-rose-700 font-medium py-2">EARRINGS</Link>
              <Link to="/products/bracelets" onClick={() => setIsMenuOpen(false)} className="text-base sm:text-lg text-gray-700 hover:text-rose-700 font-medium py-2">BRACELETS</Link>
              <Link to="/products/rings" onClick={() => setIsMenuOpen(false)} className="text-base sm:text-lg text-gray-700 hover:text-rose-700 font-medium py-2">RINGS</Link>
              <Link to="/products/necklaces" onClick={() => setIsMenuOpen(false)} className="text-base sm:text-lg text-gray-700 hover:text-rose-700 font-medium py-2">NECKLACES</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-base sm:text-lg text-gray-700 hover:text-rose-700 font-medium py-2">ABOUT US</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

