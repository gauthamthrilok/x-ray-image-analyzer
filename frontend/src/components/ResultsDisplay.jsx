import React from 'react';

const ResultCard = ({ title, value, confidence, colorClass }) => (
  <div className={`p-5 rounded-2xl bg-slate-800/80 border border-slate-700/50 shadow-lg backdrop-blur-xl relative overflow-hidden group hover:border-${colorClass} transition-colors duration-300`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${colorClass} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
    
    <h3 className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-1">{title}</h3>
    
    <div className="flex items-baseline gap-3 mb-2">
      <span className="text-2xl font-bold text-slate-100">{value}</span>
    </div>
    
    <div className="flex flex-col gap-1.5 mt-4">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-400">Confidence</span>
        <span className={`text-${colorClass}`}>{confidence}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${colorClass} rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  </div>
);

export default function ResultsDisplay({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-8 rounded-3xl bg-slate-800/30 border border-slate-700/50 flex flex-col items-center justify-center min-h-[250px] shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-transparent to-slate-900 opacity-50 z-0"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 border-4 border-blue-400 rounded-full border-b-transparent animate-spin animation-delay-500 opacity-60"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-200 mb-1">Analyzing Image</h3>
            <p className="text-sm text-slate-400">Running advanced diagnostics model...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-6 px-2">
        <div className="h-px bg-slate-700 flex-1"></div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Diagnostic Results</h2>
        <div className="h-px bg-slate-700 flex-1"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard 
          title="Bone Type" 
          value={results.bone.class} 
          confidence={results.bone.confidence} 
          colorClass="blue-400"
        />
        <ResultCard 
          title="Fracture Status" 
          value={results.fracture.class} 
          confidence={results.fracture.confidence} 
          colorClass={results.fracture.is_fractured ? "red-400" : "emerald-400"}
        />
        <ResultCard 
          title="View Angle" 
          value={results.view.class} 
          confidence={results.view.confidence} 
          colorClass="indigo-400"
        />
      </div>
    </div>
  );
}
