import React from 'react';

/**
 * Labeled range slider with percentage display
 * @param {string} label
 * @param {string} id
 * @param {number} value
 * @param {function} onChange - receives numeric value
 * @param {string} color - 'indigo'|'emerald'|'amber'
 */
export default function Slider({ label, id, value, onChange, color = 'indigo', disabled = false }) {
  const trackColors = {
    indigo: 'accent-indigo-600',
    emerald: 'accent-emerald-600',
    amber: 'accent-amber-500',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-slate-700">
          {label}
        </label>
        <span className="text-xs font-semibold text-slate-900 tabular-nums w-9 text-right">
          {value}%
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className={`w-full h-1.5 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${trackColors[color] || trackColors.indigo}`}
        aria-label={`${label}: ${value}%`}
      />
    </div>
  );
}
