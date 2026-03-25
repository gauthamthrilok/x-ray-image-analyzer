import React, { useState } from 'react';
import UploadBox from './components/UploadBox';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (selectedFile, objectUrl) => {
    setFile(selectedFile);
    setIsLoading(true);
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image. Ensure backend is running.');
      }

      const data = await response.json();
      // Add a slight delay for presentation purposes
      setTimeout(() => {
        setResults(data);
        setIsLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during prediction.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 selection:bg-indigo-500/30">

      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-sm">
            X-ray Analyzer
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base font-medium">
            Upload an x-ray image to detect bone type, identify fractures, and classify the anatomical view using our advanced deep learning model.
          </p>
        </header>

        {/* Main Content */}
        <main className="w-full">
          <UploadBox onFileSelect={handleUpload} />

          {error && (
            <div className="mt-8 max-w-2xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center shadow-lg backdrop-blur-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {(isLoading || results) && (
            <ResultsDisplay isLoading={isLoading} results={results} />
          )}
        </main>
      </div>

    </div>
  );
}

export default App;
