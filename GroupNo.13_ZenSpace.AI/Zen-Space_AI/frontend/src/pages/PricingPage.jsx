import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedPackage, setSelectedPackage] = useState('premium');
  const [customItems, setCustomItems] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [showFinalReport, setShowFinalReport] = useState(false);

  useEffect(() => {
    if (location.state?.selectedItems) {
      setCustomItems(location.state.selectedItems);
      calculatePricing(location.state.selectedItems);
    } else {
      const mockItems = [
        { id: 1, name: 'Modern Sofa', price: 899.99, quantity: 1 },
        { id: 2, name: 'Coffee Table', price: 299.99, quantity: 1 },
        { id: 3, name: 'Floor Lamp', price: 149.99, quantity: 1 }
      ];
      setCustomItems(mockItems);
      calculatePricing(mockItems);
    }
  }, [location.state]);

  const packages = [
    {
      id: 'basic',
      name: 'Basic Room Design',
      price: 25000,
      currency: '₹',
      period: 'per room',
      popular: false,
      features: [
        'AI room analysis',
        '4 design variations',
        'Basic furniture suggestions',
        'Color palette recommendations',
        'Digital delivery'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Design Package',
      price: 50000,
      currency: '₹',
      period: 'per room',
      popular: true,
      features: [
        'Everything in Basic',
        '5+ design variations',
        'Premium furniture options',
        '3D visualization',
        'Shopping list with links',
        'Priority support'
      ]
    },
    {
      id: 'complete',
      name: 'Complete Makeover',
      price: 100000,
      currency: '₹',
      period: 'per room',
      popular: false,
      features: [
        'Everything in Premium',
        'Unlimited revisions',
        'Custom furniture design',
        'Professional consultation',
        'Implementation support',
        'Project management'
      ]
    }
  ];

  const calculatePricing = async (items) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/calculate-pricing', {
        selected_items: items
      });
      if (response.data.success) {
        setPricing(response.data.pricing);
      }
    } catch (error) {
      console.error('Failed to calculate pricing:', error);
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setPricing({
        items: items,
        subtotal: total,
        tax: total * 0.08,
        shipping: total > 0 ? 50 : 0,
        total: total + (total * 0.08) + (total > 0 ? 50 : 0)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFinalReport = async () => {
    try {
      setLoading(true);
      const designData = location.state?.designData || {};
      const designId = designData.designId || 'demo_' + Date.now();

      const response = await axios.post('http://localhost:5000/api/generate-final-report', {
        design_id: designId,
        pricing_data: pricing,
        design_data: designData
      });

      if (response.data.success) {
        setQrCodeUrl(response.data.qr_code_url);
        setPdfUrl(response.data.pdf_url);
        setShowFinalReport(true);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = customItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCustomItems(updatedItems);
    calculatePricing(updatedItems);
  };

  const removeItem = (itemId) => {
    const updatedItems = customItems.filter(item => item.id !== itemId);
    setCustomItems(updatedItems);
    calculatePricing(updatedItems);
  };

  if (loading && !pricing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating your design costs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Choose Your Design Package</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Transform your space with AI-powered interior design. Select the package that best fits your needs and budget.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPackage === pkg.id
                      ? 'bg-purple-600 text-white shadow-xl'
                      : 'bg-white border border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{pkg.currency}{pkg.price.toLocaleString()}</span>
                      <span className="text-sm ml-1">{pkg.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className={`w-5 h-5 mr-2 ${selectedPackage === pkg.id ? 'text-white' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {customItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Furniture & Items</h3>
                <div className="space-y-4">
                  {customItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">${item.price} each</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-gray-900 w-20 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {pricing && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Design Package</span>
                    <span className="font-medium">₹{packages.find(p => p.id === selectedPackage)?.price.toLocaleString()}</span>
                  </div>
                  {pricing.subtotal > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Furniture Subtotal</span>
                        <span className="font-medium">${pricing.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (8%)</span>
                        <span className="font-medium">${pricing.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">${pricing.shipping.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-purple-600">
                        ₹{packages.find(p => p.id === selectedPackage)?.price.toLocaleString()}
                        {pricing.subtotal > 0 && ` + $${pricing.total.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateFinalReport}
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Final Report & QR'}
                </button>
              </div>
            )}
          </div>
        </div>

        {showFinalReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Generated!</h3>
                <p className="text-gray-600 mb-6">Your design report and QR code have been generated successfully.</p>
                
                {qrCodeUrl && (
                  <div className="mb-4">
                    <img src={`http://localhost:5000${qrCodeUrl}`} alt="QR Code" className="w-32 h-32 mx-auto border rounded-lg" />
                    <p className="text-sm text-gray-500 mt-2">Scan to view design details</p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  {pdfUrl && (
                    <a
                      href={`http://localhost:5000${pdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700"
                    >
                      Download PDF
                    </a>
                  )}
                  <button
                    onClick={() => setShowFinalReport(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingPage;
