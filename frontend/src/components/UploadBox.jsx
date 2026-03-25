import React, { useState } from 'react';

export default function UploadBox({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onFileSelect(file, objectUrl);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer overflow-hidden backdrop-blur-sm
          ${dragActive ? 'border-blue-400 bg-blue-500/10 scale-105 shadow-lg shadow-blue-500/20' : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 hover:border-slate-500'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={handleChange} 
          accept="image/*"
        />
        
        {preview ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end justify-center pb-4">
              <span className="text-white font-medium drop-shadow-md">Click or drag to replace image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center z-0">
            <svg className="w-12 h-12 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="mb-2 text-sm text-slate-300 font-semibold tracking-wide">
              Click to upload <span className="font-normal text-slate-400">or drag and drop</span>
            </p>
            <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF</p>
          </div>
        )}
      </div>
    </div>
  );
}
