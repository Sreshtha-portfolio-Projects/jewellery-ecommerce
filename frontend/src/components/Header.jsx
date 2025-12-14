import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AccountDropdown from './account/AccountDropdown';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-rose-50 border-b border-rose-100 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-rose-800 font-medium">Aldorado Jewells</div>
            <div className="text-rose-700">DISCOVER OUR NEW ARRIVALS</div>
            <div className="flex items-center gap-4">
              <button className="text-rose-700 hover:text-rose-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="text-rose-700 hover:text-rose-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              {isAuthenticated ? (
                <AccountDropdown />
              ) : (
                <Link to="/login" className="text-rose-700 hover:text-rose-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-serif font-bold text-gray-900 hover:text-rose-700 transition-colors">
          Aldorado Jewells
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-rose-700 font-medium transition-colors">HOME</Link>
            <Link to="/products/earrings" className="text-gray-700 hover:text-rose-700 font-medium transition-colors">EARRINGS</Link>
            <Link to="/products/bracelets" className="text-gray-700 hover:text-rose-700 font-medium transition-colors">BRACELETS</Link>
            <Link to="/products/rings" className="text-gray-700 hover:text-rose-700 font-medium transition-colors">RINGS</Link>
            <Link to="/products/necklaces" className="text-gray-700 hover:text-rose-700 font-medium transition-colors">NECKLACES</Link>
            <Link to="/about" className="text-gray-700 hover:text-rose-700 font-medium transition-colors">ABOUT US</Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col gap-4 pt-4">
              <Link to="/" className="text-gray-700 hover:text-rose-700 font-medium">HOME</Link>
              <Link to="/products/earrings" className="text-gray-700 hover:text-rose-700 font-medium">EARRINGS</Link>
              <Link to="/products/bracelets" className="text-gray-700 hover:text-rose-700 font-medium">BRACELETS</Link>
              <Link to="/products/rings" className="text-gray-700 hover:text-rose-700 font-medium">RINGS</Link>
              <Link to="/products/necklaces" className="text-gray-700 hover:text-rose-700 font-medium">NECKLACES</Link>
              <Link to="/about" className="text-gray-700 hover:text-rose-700 font-medium">ABOUT US</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

