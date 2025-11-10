import React from 'react';

function UploadCard({ onFileSelect, preview, uploading }) {
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Upload Room Image
      </h3>
      
      <div
        className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors bg-purple-50"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => onFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        {preview ? (
          <div className="space-y-4">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full max-h-48 object-contain rounded-lg shadow-md mx-auto"
            />
            <p className="text-sm text-gray-600">
              Click to change image
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-purple-600 text-4xl">
              📤
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your room image here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
        
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadCard;
