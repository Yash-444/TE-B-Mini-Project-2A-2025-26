import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/upload', label: 'Upload', icon: '📤' },
    { path: '/furniture-customizer', label: 'Products', icon: '🪑' },
    { path: '/favorites', label: 'Favorites', icon: '💜' },
    { path: '/style-quiz', label: 'Style Quiz', icon: '🎯' },
    { path: '/flipbook', label: 'Flipbook', icon: '📖' },
    { path: '/pricing', label: 'Pricing', icon: '💰' },
    { path: '/help', label: 'Help', icon: '❓' },
    { path: '/contact', label: 'Contact', icon: '📞' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth'); 
  };

  return (
    <>
      {/* Mobile Nav Toggle Button */}
      <button
        className="fixed top-4 left-4 z-[60] bg-purple-600 text-white p-2 rounded-md md:hidden shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      {/* Mobile Overlay/Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 md:shadow-none md:z-auto`}
      >
        {/* Site Title/Logo */}
        <div className="p-6 text-center text-xl font-bold text-gray-800 border-b border-gray-100">
          <span className="text-purple-700">ZenSpace.AI</span>
        </div>
        
        {/* Navigation */}
        <nav className="mt-4 flex flex-col justify-between h-[calc(100vh-80px)]">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors border-l-4
                  ${location.pathname.startsWith(item.path) && item.path !== '/'
                    ? 'border-purple-600 bg-purple-50 text-purple-700' 
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-purple-700'}`}
              >
                <span className="mr-3 text-lg w-6 flex justify-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <span className="mr-3 text-lg">🚪</span>
              Logout
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

export default SideNav;
