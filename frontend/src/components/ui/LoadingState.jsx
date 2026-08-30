import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingState — full page and inline variants
 * @param {'full'|'section'|'inline'} variant
 * @param {string} message
 */
export default function LoadingState({ variant = 'section', message = 'Loading...' }) {
  if (variant === 'full') {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <Loader2 className="animate-spin text-indigo-600 mb-3" size={32} />
        <p className="text-sm text-slate-600 font-medium">{message}</p>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="animate-spin" size={12} />
        {message}
      </span>
    );
  }

  // section (default)
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <Loader2 className="animate-spin text-indigo-500 mb-3" size={28} />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

/**
 * AnalysisLoadingState — honest analysis loading display
 */
export function AnalysisLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">
        Running Procurement Analysis
      </h4>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
        The multi-agent system is analyzing vendor proposals, scoring requirements, assessing risks, and generating recommendations. This may take a minute.
      </p>
    </div>
  );
}
