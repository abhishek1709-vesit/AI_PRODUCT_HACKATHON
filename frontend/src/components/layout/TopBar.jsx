import React from 'react';
import { Menu } from 'lucide-react';

export default function TopBar({ onMenuClick, title, breadcrumb }) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb / Title */}
        <div className="min-w-0">
          {breadcrumb && (
            <p className="text-xs text-slate-400 font-medium truncate">{breadcrumb}</p>
          )}
          {title && (
            <h1 className="text-sm font-semibold text-slate-800 truncate">{title}</h1>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5"
          aria-label="Application status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
          System Online
        </div>
      </div>
    </header>
  );
}
