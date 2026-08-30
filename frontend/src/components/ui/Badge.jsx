import React from 'react';

const variants = {
  primary:  'bg-indigo-50 text-indigo-700 border border-indigo-200',
  success:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:  'bg-amber-50 text-amber-700 border border-amber-200',
  danger:   'bg-red-50 text-red-700 border border-red-200',
  neutral:  'bg-slate-100 text-slate-600 border border-slate-200',
  info:     'bg-blue-50 text-blue-700 border border-blue-200',
  purple:   'bg-purple-50 text-purple-700 border border-purple-200',
};

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

/**
 * Badge component
 * @param {'primary'|'success'|'warning'|'danger'|'neutral'|'info'|'purple'} variant
 * @param {'xs'|'sm'|'md'} size
 */
export default function Badge({ variant = 'neutral', size = 'sm', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${variants[variant] || variants.neutral} ${sizes[size] || sizes.sm} ${className}`}
    >
      {children}
    </span>
  );
}

/** Dot indicator for severity */
export function SeverityDot({ level }) {
  const colors = {
    high:   'bg-red-500',
    medium: 'bg-amber-500',
    low:    'bg-emerald-500',
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[level?.toLowerCase()] || 'bg-slate-400'}`}
      aria-hidden="true"
    />
  );
}

/** Status badge for evaluation status */
export function StatusBadge({ status }) {
  const map = {
    draft:    { variant: 'neutral', label: 'Draft' },
    active:   { variant: 'info', label: 'Active' },
    analysis_complete: { variant: 'success', label: 'Analysis Complete' },
    completed: { variant: 'success', label: 'Completed' },
  };
  const { variant, label } = map[status] || { variant: 'neutral', label: status };
  return <Badge variant={variant} size="sm">{label}</Badge>;
}

/** Severity badge for risks */
export function SeverityBadge({ severity }) {
  const map = {
    high:   { variant: 'danger', label: 'High' },
    medium: { variant: 'warning', label: 'Medium' },
    low:    { variant: 'success', label: 'Low' },
  };
  const { variant, label } = map[severity?.toLowerCase()] || { variant: 'neutral', label: severity };
  return (
    <Badge variant={variant} size="sm">
      <SeverityDot level={severity?.toLowerCase()} />
      {label}
    </Badge>
  );
}
