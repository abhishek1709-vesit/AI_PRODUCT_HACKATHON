import React from 'react';

/**
 * Card component
 * @param {string} title - Optional card title
 * @param {React.ReactNode} action - Optional action element rendered in header right
 * @param {React.ReactNode} footer - Optional footer content
 * @param {boolean} noPadding - If true, removes default body padding
 * @param {string} className - Additional classes for the wrapper
 */
export default function Card({ title, action, footer, noPadding = false, className = '', children }) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          {title && (
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * SectionCard - slightly more prominent card for major page sections
 */
export function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2 ml-4">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
