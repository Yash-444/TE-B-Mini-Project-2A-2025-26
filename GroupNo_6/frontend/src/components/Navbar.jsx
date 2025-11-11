import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, LogOut, Heart, History, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleAuthModalToggle = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(!isAuthModalOpen);
    setIsProfileOpen(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(loginData.email, loginData.password);
    if (!result.success) {
      toast.error(result.error || 'Login failed');
      setLoginData({ email: '', password: '' });
    } else {
      toast.success('Logged in successfully');
      setIsAuthModalOpen(false);
      setLoginData({ email: '', password: '' });
      navigate('/home.jsx');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const result = await register(
      registerData.firstname,
      registerData.lastname,
      registerData.email,
      registerData.password
    );
    if (!result.success) {
      toast.error(result.error || 'Registration failed');
    } else {
      toast.success('Account created');
      setIsAuthModalOpen(false);
      setRegisterData({ firstname: '', lastname: '', email: '', password: '' });
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent"
            >
              StyleAI
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-10 items-baseline space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link to="/quiz" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Quiz
              </Link>
              <Link to="/recommendations" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Recommendations
              </Link>
              <Link to="/closet" className="text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                My Closet
              </Link>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 bg-primary-50 hover:bg-primary-100 rounded-full px-4 py-2 transition-colors"
                  >
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-primary-300 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-sm font-bold border-2 border-primary-300">
                        {user?.firstname?.[0]?.toUpperCase()}{user?.lastname?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">{user?.firstname || 'User'}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors">
                        <User className="w-4 h-4 mr-3" /> Profile
                      </Link>
                      <Link to="/profile?tab=saved" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors">
                        <Heart className="w-4 h-4 mr-3" /> Saved Preferences
                      </Link>
                      <Link to="/profile?tab=history" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors">
                        <History className="w-4 h-4 mr-3" /> Styling History
                      </Link>
                      <Link to="/profile?tab=settings" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors">
                        <Settings className="w-4 h-4 mr-3" /> Settings
                      </Link>
                      <hr className="my-2 border-gray-100" />
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4 mr-3" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button onClick={() => handleAuthModalToggle('login')} className="text-primary-600 hover:text-primary-700 px-4 py-2 rounded-md text-sm font-medium border border-primary-200 hover:border-primary-300 transition-colors">
                    Sign In
                  </button>
                  <button onClick={() => handleAuthModalToggle('signup')} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-base font-medium">
              Home
            </Link>
            <Link to="/quiz" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-base font-medium">
              Quiz
            </Link>
            <Link to="/recommendations" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-base font-medium">
              Recommendations
            </Link>
            <Link to="/closet" onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-base font-medium">
              My Closet
            </Link>
            {!isAuthenticated && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <button onClick={() => { handleAuthModalToggle('login'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-base font-medium">
                  Sign In
                </button>
                <button onClick={() => { handleAuthModalToggle('signup'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-primary-500 px-3 py-2 rounded-md text-base font-medium">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mb-6">
              {authMode === 'login' ? 'Sign in to your account' : 'Join the StyleAI community'}
            </p>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <button type="submit" className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors">
                  Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={registerData.firstname}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, firstname: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={registerData.lastname}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, lastname: e.target.value }))}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <button type="submit" className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors">
                  Create Account
                </button>
              </form>
            )}

            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-primary-600 hover:text-primary-700 mt-6"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>

            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdowns and mobile menu */}
      {(isProfileOpen || isMobileMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setIsProfileOpen(false); setIsMobileMenuOpen(false); }} />
      )}
    </>
  );
};

export default Navbar;