import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import SideNav from './components/SideNav';
import StepsIndicator from './components/StepsIndicator';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FlipbookPage from './pages/FlipbookPage';
import UploadPage from './pages/UploadPage';
import FavoritesPage from './pages/FavoritesPage';
import StyleQuiz from './pages/StyleQuiz';
import PricingPage from './pages/PricingPage';
import DashboardPage from './pages/DashboardPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';
import FurnitureCustomizer from './pages/FurnitureCustomizer';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [designData, setDesignData] = useState(null);

  const isAuthenticated = () => localStorage.getItem('token') !== null;

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/auth" />;
  };

  const AppLayout = ({ children }) => (
    <div className="flex h-screen w-screen overflow-x-hidden">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="px-6 py-4 w-full max-w-full min-w-0">{children}</main>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StepsIndicator currentStep={currentStep} />
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StepsIndicator currentStep={currentStep} />
                <UploadPage setCurrentStep={setCurrentStep} setDesignData={setDesignData} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        {/* REMOVED: /visualize and /customize routes */}
        
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StepsIndicator currentStep={currentStep} />
                <PricingPage designData={designData} setCurrentStep={setCurrentStep} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/flipbook"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FlipbookPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* NEW: Favorites Page */}
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FavoritesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* NEW: Style Quiz Page */}
        <Route
          path="/style-quiz"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StyleQuiz />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/furniture-customizer"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StepsIndicator currentStep={currentStep} />
                <FurnitureCustomizer />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HelpPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ContactPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
