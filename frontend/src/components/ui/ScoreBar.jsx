import React from 'react';

/**
 * ScoreBar — thin horizontal progress bar
 * @param {number} value - 0 to 100
 * @param {'indigo'|'emerald'|'red'|'amber'|'slate'} color
 * @param {string} className
 */
export default function ScoreBar({ value = 0, color = 'indigo', className = '' }) {
  const clamped = Math.min(100, Math.max(0, value));

  const fills = {
    indigo:  'bg-indigo-500',
    emerald: 'bg-emerald-500',
    red:     'bg-red-500',
    amber:   'bg-amber-500',
    slate:   'bg-slate-400',
    blue:    'bg-blue-500',
  };

  return (
    <div
      className={`w-full h-1.5 bg-slate-100 rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${fills[color] || fills.indigo}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
