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
        className={`relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-[40px] transition-all duration-500 ease-out cursor-pointer overflow-hidden
          ${dragActive ? 'border-brand-main bg-brand-light scale-[1.02] shadow-xl' : 'border-slate-100 bg-white hover:border-brand-main/40'}
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
          <div className="absolute inset-0 z-0 group">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-[12px] font-bold text-white bg-brand-dark px-6 py-2.5 rounded-full shadow-lg">Replace Document</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center z-0">
            <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand-dark mb-6 shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <p className="mb-2 text-base text-slate-700 font-bold tracking-tight">
              Select medical image <span className="font-medium text-slate-400">to analyze</span>
            </p>
            <p className="text-[11px] text-slate-400 font-medium">DICOM, JPEG, or PNG supported</p>
          </div>
        )}
      </div>
    </div>
  );
}
