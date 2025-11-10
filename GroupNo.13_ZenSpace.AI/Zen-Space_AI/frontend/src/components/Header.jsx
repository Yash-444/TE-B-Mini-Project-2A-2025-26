import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-purple-100 fixed w-full top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">Zenspace.AI</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
            🏠 Home
          </Link>
          <Link to="/help" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
            ❓ Help
          </Link>
          <Link to="/contact" className="text-gray-600 hover:text-purple-600 transition-colors font-medium">
            💬 Contact
          </Link>
        </nav>
        
        <Link 
          to="/auth" 
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}

export default Header;


