import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function HelpPage() {
  const [activeTab, setActiveTab] = useState('getting-started');

  const faqs = [
    {
      question: "How does ZenSpace.AI work?",
      answer: "Upload a photo of your room, describe your vision, and our AI analyzes your space to generate personalized design suggestions with furniture recommendations and 3D visualizations."
    },
    {
      question: "What file formats are supported for room images?",
      answer: "We support JPG, PNG, and GIF formats up to 10MB in size. For best results, use high-resolution images with good lighting."
    },
    {
      question: "How accurate are the pricing estimates?",
      answer: "Our AI provides estimated costs based on market analysis and room characteristics. Actual prices may vary depending on specific products, vendors, and your location."
    },
    {
      question: "Can I modify the generated designs?",
      answer: "Yes! You can customize designs by providing different prompts, changing styles, or requesting specific modifications through our AI system."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption and never share your personal information or room images with third parties."
    }
  ];

  const tutorials = [
    {
      title: "Getting Started with Your First Design",
      steps: [
        "Create your account and log in",
        "Upload a clear photo of your room",
        "Describe your design vision in detail",
        "Choose a style preference",
        "Generate and review AI suggestions",
        "Customize and refine your design"
      ]
    },
    {
      title: "Tips for Better Room Photos",
      steps: [
        "Use natural lighting when possible",
        "Capture the entire room in one shot",
        "Avoid cluttered backgrounds",
        "Take photos from multiple angles",
        "Ensure the image is in focus and well-lit"
      ]
    },
    {
      title: "Writing Effective Design Prompts",
      steps: [
        "Be specific about colors and materials",
        "Mention furniture pieces you want",
        "Describe the mood or atmosphere",
        "Include functional requirements",
        "Specify any constraints or preferences"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Help & Support
            </h1>
            <p className="text-xl text-gray-600">
              Everything you need to know about ZenSpace.AI
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-lg">
              <button
                onClick={() => setActiveTab('getting-started')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'getting-started'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Getting Started
              </button>
              <button
                onClick={() => setActiveTab('tutorials')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'tutorials'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tutorials
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'faq'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                FAQ
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            
            {activeTab === 'getting-started' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to ZenSpace.AI</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">
                          1
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Upload Your Room</h3>
                          <p className="text-gray-600 text-sm">Take a clear photo of your room and upload it to our platform. Make sure the entire room is visible.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">
                          2
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Describe Your Vision</h3>
                          <p className="text-gray-600 text-sm">Tell our AI what you want to achieve with your space. Be specific about colors, furniture, and style.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">
                          3
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Get AI Suggestions</h3>
                          <p className="text-gray-600 text-sm">Our AI analyzes your space and generates multiple design variations tailored to your preferences.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-6">
                      <h3 className="font-semibold text-purple-900 mb-4">Quick Tips</h3>
                      <ul className="space-y-2 text-sm text-purple-800">
                        <li>• Use good lighting for photos</li>
                        <li>• Be detailed in your descriptions</li>
                        <li>• Try different style combinations</li>
                        <li>• Save designs you like</li>
                        <li>• Don't hesitate to iterate</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tutorials' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step-by-Step Tutorials</h2>
                
                {tutorials.map((tutorial, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{tutorial.title}</h3>
                    <ol className="space-y-3">
                      {tutorial.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                            {stepIndex + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-purple-100 mb-6">
              Our support team is here to help you make the most of ZenSpace.AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="mailto:support@zenspace.ai"
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-400 transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default HelpPage;
