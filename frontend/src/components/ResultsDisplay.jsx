import React from 'react';

const ResultCard = ({ title, value, confidence, colorClass }) => (
  <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
    <h3 className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5">{title}</h3>
    
    <div className="flex items-baseline gap-3 mb-4">
      <span className="text-2xl font-semibold text-slate-700">{value}</span>
    </div>
    
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[11px] font-bold">
        <span className="text-slate-400">Reliability Score</span>
        <span className={colorClass === 'brand-dark' ? 'text-brand-dark' : `text-${colorClass}`}>{confidence}%</span>
      </div>
      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass === 'brand-dark' ? 'bg-brand-dark' : `bg-${colorClass}`} rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  </div>
);

export default function ResultsDisplay({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-10 p-12 rounded-[40px] bg-white border border-slate-100 flex flex-col items-center justify-center min-h-75 shadow-sm">
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-slate-50 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-main rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Analysing Diagnostics</h3>
            <p className="text-sm text-slate-500 font-medium">Our system is reviewing your medical image...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 animate-fade-in">
      <div className="flex items-center gap-6 mb-8 px-4">
        <div className="h-px bg-slate-100 flex-1"></div>
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Clinical Assessment</h2>
        <div className="h-px bg-slate-100 flex-1"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <ResultCard 
          title="Bone Type" 
          value={results.bone.class} 
          confidence={results.bone.confidence} 
          colorClass="brand-dark"
        />
        <ResultCard 
          title="Fracture Detection" 
          value={results.fracture.class} 
          confidence={results.fracture.confidence} 
          colorClass={results.fracture.is_fractured ? "red-400" : "brand-main"}
        />
        <ResultCard 
          title="View Direction" 
          value={results.view.class} 
          confidence={results.view.confidence} 
          colorClass="slate-300"
        />
      </div>

      {results.recovery_plan && (
        <div className="p-8 rounded-[40px] bg-brand-light border border-brand-main/20 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2.5 rounded-2xl bg-white text-brand-dark shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{results.recovery_plan.title}</h3>
          </div>
          
          <div className="space-y-4 mb-8">
            {results.recovery_plan.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 text-[15px] text-slate-600 leading-relaxed">
                <span className="text-brand-dark font-black shrink-0">{idx + 1}</span>
                <p className="font-medium">{step}</p>
              </div>
            ))}
          </div>
          
          <div className="pt-6 border-t border-brand-main/10 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimated Window</span>
            <span className="px-4 py-1.5 rounded-full bg-white text-brand-dark text-[11px] font-bold shadow-sm border border-brand-main/10">
              {results.recovery_plan.estimated_recovery}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
