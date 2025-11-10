import React, { useState } from 'react';

function CustomizePanel({ onGenerateDesigns, generating }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  
  const styles = [
    { value: '', label: 'No specific style' },
    { value: 'Modern', label: 'Modern' },
    { value: 'Minimalist', label: 'Minimalist' },
    { value: 'Boho', label: 'Boho' },
    { value: 'Rustic', label: 'Rustic' },
    { value: 'Industrial', label: 'Industrial' },
    { value: 'Scandinavian', label: 'Scandinavian' },
    { value: 'Traditional', label: 'Traditional' },
    { value: 'Contemporary', label: 'Contemporary' }
  ];

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerateDesigns(prompt, style);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Customize Your Design
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your vision
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows="4"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 resize-none"
            placeholder="e.g., Add a large comfortable sofa in the center, warm lighting, and some plants..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose a style
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
          >
            {styles.map((styleOption) => (
              <option key={styleOption.value} value={styleOption.value}>
                {styleOption.label}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            !prompt.trim() || generating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {generating ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Designs...
            </div>
          ) : (
            'Generate AI Designs ✨'
          )}
        </button>
      </div>
    </div>
  );
}

export default CustomizePanel;
