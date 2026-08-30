import React from 'react';
import Button from './Button.jsx';

/**
 * EmptyState — intentional empty states for every list/section
 * @param {React.ReactNode} icon - lucide icon element
 * @param {string} title
 * @param {string} description
 * @param {string} ctaLabel - optional CTA button label
 * @param {function} onCta - optional CTA handler
 */
export default function EmptyState({ icon, title, description, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-700 mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {ctaLabel && onCta && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onCta}>
            {ctaLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
