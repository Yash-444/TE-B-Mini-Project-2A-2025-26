import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function UploadPage({ setCurrentStep, setDesignData }) {
  // State variables
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [designStyle, setDesignStyle] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('zenspace_ai_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // File Handling functions
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const handleFileUpload = (selectedFile) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-purple-400');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('border-purple-400');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-400');
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  // AI Image generation: Pollinations free API helper
  const getFreeAiImage = (prompt) => {
    const seed = Math.floor(Math.random() * 100000);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?width=1024&height=1024&nologo=true&seed=${seed}`;
  };

  // Generate AI designs from prompt
  const handleGenerateImages = async () => {
    if (!file || !userPrompt.trim()) {
      alert('Please upload an image and describe your vision!');
      return;
    }

    setGenerating(true);
    setGeneratedImages([]);
    const styleText = designStyle ? ` in ${designStyle} style` : '';
    const fullPrompt = `${userPrompt.trim()}${styleText}, modern interior design, photorealistic, high quality`;

    const imageCount = 4;
    const newImages = Array.from({ length: imageCount }).map((_, i) => ({
      id: Date.now() + i,
      url: getFreeAiImage(fullPrompt),
      prompt: userPrompt.trim() + styleText,
    }));

    setGeneratedImages(newImages);

    try {
      const newHistoryItem = {
        prompt: userPrompt.trim() + styleText,
        generatedImageUrls: newImages.map((img) => img.url).slice(0, 2),
        date: new Date().toISOString(),
      };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 3);
      const dataSize = JSON.stringify(updatedHistory).length;
      const maxSize = 500 * 1024;
      if (dataSize < maxSize) {
        setHistory(updatedHistory);
        localStorage.setItem('zenspace_ai_history', JSON.stringify(updatedHistory));
      } else {
        const minimalHistory = [newHistoryItem];
        setHistory(minimalHistory);
        localStorage.setItem('zenspace_ai_history', JSON.stringify(minimalHistory));
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      localStorage.removeItem('zenspace_ai_history');
      setHistory([]);
    }

    setTimeout(() => {
      setGenerating(false);
    }, 2000);
  };

  // Upload image and prompt for backend processing
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', userPrompt);
    formData.append('style', designStyle);
    formData.append('room_name', 'My Room Design');

    try {
      const response = await axios.post('http://localhost:5000/api/upload-and-analyze', formData);
      if (response.data.success) {
        const designData = {
          designId: response.data.design_id,
          filePath: response.data.file_path,
          roomAnalysis: response.data.room_analysis,
          aiAnalysis: response.data.ai_analysis,
          generatedImages: generatedImages,
        };
        if (setDesignData) setDesignData(designData);
        if (setCurrentStep) setCurrentStep(2);
        navigate(`/visualize/${response.data.design_id}`, { state: { designData } });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Form readiness status
  const isFormReady = file && userPrompt.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
              ✨ AI-Powered Interior Design
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your
            <span className="block text-purple-600">Living Space</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Upload your room, describe your vision, and let AI generate stunning design possibilities.
          </p>
        </div>
      </div>

      <div className="pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Upload Section */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-purple-700">1. Upload Your Room</label>
                <div
                  className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors bg-purple-50"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg shadow-lg mx-auto"
                    />
                  ) : (
                    <>
                      <div className="text-purple-600 text-5xl mb-4">📤</div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">Click or drag an image here</p>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Vision and Style Section */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-purple-700">2. Describe Your Vision</label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 mb-4"
                  placeholder="e.g., A large green velvet sofa in the middle, or a modern oak desk near the window..."
                />

                <label className="block text-lg font-semibold mb-4 text-purple-700">3. Choose Design Style</label>
                <select
                  value={designStyle}
                  onChange={(e) => setDesignStyle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 mb-4"
                >
                  <option value="">No specific style</option>
                  <option value="Modern">Modern</option>
                  <option value="Minimalist">Minimalist</option>
                  <option value="Boho">Boho</option>
                  <option value="Rustic">Rustic</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Scandinavian">Scandinavian</option>
                </select>

                <button
                  onClick={handleGenerateImages}
                  disabled={!isFormReady || generating}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white text-lg transition-colors mb-4 ${
                    !isFormReady || generating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {generating ? 'Generating Images...' : 'Generate AI Designs →'}
                </button>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors ${
                    !file || uploading
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {uploading ? 'Processing...' : 'Continue to 3D View →'}
                </button>
              </div>
            </div>

            {/* Generated Images */}
            {(generating || generatedImages.length > 0) && (
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">AI Generated Designs</h3>
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Creating your designs...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {generatedImages.map((image) => (
                      <div key={image.id} className="relative group aspect-square">
                        <img
                          src={image.url}
                          alt={`Generated design ${image.id}`}
                          className="w-full h-full object-cover rounded-lg shadow-lg"
                        />
                        <a
                          href={image.url}
                          download={`zenspace_ai_design_${image.id}.jpg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 bg-black bg-opacity-60 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Download Image"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Section */}
            {history.length > 0 && (
              <div className="border-t border-gray-200 pt-8 mt-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">🔁 Recent Designs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {history.slice(0, 3).map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {(item.generatedImageUrls || item.generatedImages?.slice(0, 2) || []).map((imgData, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={typeof imgData === 'string' ? imgData : imgData.url}
                            alt={`History ${index}-${imgIndex}`}
                            className="w-full h-20 object-cover rounded"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{new Date(item.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-700 truncate">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
