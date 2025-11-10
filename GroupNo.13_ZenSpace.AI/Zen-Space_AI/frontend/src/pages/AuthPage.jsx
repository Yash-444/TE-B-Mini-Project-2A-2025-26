import React, { useState } from 'react';
// Removed BrowserRouter from imports, as the environment is providing the Router context.
import { Routes, Route, useNavigate, Link } from 'react-router-dom';

// 1. Original AuthPage logic, renamed to AuthForm (no longer default export)
function AuthForm() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // useNavigate can now be safely called because this component is rendered inside the top-level Router provided by the environment.
  const navigate = useNavigate(); 

  function handleAuth(e) {
    e.preventDefault();
    // Place your authentication logic here (API call etc.)
    localStorage.setItem('token', 'true'); // Simulate successful authentication to enable redirection
    // On success:
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center mb-2">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center mr-2">
            {/* Sparkles/star icon for Zenspace.AI */}
            <span className="text-white text-xl">✦</span>
          </div>
          <span className="text-2xl font-bold text-purple-700 tracking-tight">Zenspace.AI</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-1">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-gray-600">
          {isSignup
            ? 'Start transforming your spaces with AI'
            : 'Sign in to continue your design journey'}
        </p>
      </div>

      <form
        onSubmit={handleAuth}
        className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 mb-8"
        autoComplete="off"
      >
        {isSignup && (
          <>
            <label className="block text-gray-800 font-medium mb-1" htmlFor="name">Full Name</label>
            <div className="mb-4">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  {/* User Icon SVG */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full bg-gray-100 pl-10 pr-4 py-3 rounded-lg mb-1 focus:outline-none focus:border-purple-400"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>
          </>
        )}

        <label className="block text-gray-800 font-medium mb-1" htmlFor="email">Email Address</label>
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              {/* Email Icon SVG */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-1 12H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2z" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="w-full bg-gray-100 pl-10 pr-4 py-3 rounded-lg mb-1 focus:outline-none focus:border-purple-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
        </div>

        <label className="block text-gray-800 font-medium mb-1" htmlFor="password">Password</label>
        <div className="mb-6">
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              {/* Lock Icon SVG */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-6v4h12V9c0-1.65-1.35-3-3-3H9c-1.65 0-3 1.35-3 3zM18 9v4a2 2 0 01-2 2H8a2 2 0 01-2-2V9m12 0H6"/>
              </svg>
            </span>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full bg-gray-100 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-purple-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-lg hover:from-purple-600 hover:to-indigo-600 transition"
        >
          {isSignup ? 'Create Account' : 'Sign In'}
        </button>

        <div className="mt-6 text-center">
          {isSignup ? (
            <span className="text-gray-600">
              Already have an account?{' '}
              <button
                className="text-purple-700 font-medium hover:underline"
                onClick={() => setIsSignup(false)}
                type="button"
              >
                Sign in
              </button>
            </span>
          ) : (
            <span className="text-gray-600">
              Don't have an account?{' '}
              <button
                className="text-purple-700 font-medium hover:underline"
                onClick={() => setIsSignup(true)}
                type="button"
              >
                Sign up
              </button>
            </span>
          )}
        </div>
      </form>

      <div className="max-w-md w-full bg-white/90 rounded-xl shadow p-5 mt-4 text-left text-sm">
        <div className="font-semibold mb-2 text-gray-800">Demo Credentials</div>
        <div>Email: <span className="text-xs text-gray-700 select-all">demo@zenspace.ai</span></div>
        <div>Password: <span className="text-xs text-gray-700 select-all">demo123</span></div>
      </div>
    </div>
  );
}

// 2. Placeholder component for the dashboard route
function DashboardPage() {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-xl w-full text-center bg-white p-10 rounded-2xl shadow-2xl border-t-4 border-purple-500">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Dashboard</h2>
                <p className="text-lg text-gray-700 mb-8">
                    You have successfully authenticated and landed on the dashboard!
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleLogout}
                        className="py-3 px-8 rounded-xl bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 transition transform hover:scale-105"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}


// 3. Main App component, which must be the default export in a single-file React app.
export default function App() {
  return (
    // Removed <BrowserRouter> here to prevent nesting error.
    <Routes>
      {/* Auth page is the default route */}
      <Route path="/" element={<AuthForm />} />
      {/* Dashboard page is the target of the successful login */}
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
