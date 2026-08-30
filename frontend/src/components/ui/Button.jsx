import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-500',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus-visible:ring-slate-400',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400',
  danger:    'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
};

/**
 * Button component
 * @param {'primary'|'secondary'|'ghost'|'danger'|'success'} variant
 * @param {'sm'|'md'|'lg'} size
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconRight = null,
  children,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-md
        transition-colors duration-150 select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin flex-shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="flex-shrink-0" aria-hidden="true">{iconRight}</span>
      )}
    </button>
  );
}
