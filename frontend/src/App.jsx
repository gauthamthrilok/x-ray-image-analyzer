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
      const response = await fetch('http://127.0.0.1:8000/predict', {
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
      }, 7000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during prediction.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-brand-lightest text-brand-darkest flex flex-col items-center py-16 px-4 selection:bg-brand-main/20">

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <header className="mb-14 text-center">
          <div className="inline-flex items-center justify-center p-4 mb-6 rounded-3xl bg-brand-light border border-brand-main/30 shadow-sm">
            <svg className="w-9 h-9 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-brand-darkest">
            X-ray Analysis <span className="text-brand-dark">Portal</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base font-medium leading-relaxed">
            Professional diagnostic tool for rapid orthopedic imaging. Providing clear, accurate analysis using medical-grade deep learning models.
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
