import React from 'react';

export default function StickyNav({ sections }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md border-y border-slate-200 py-2.5 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => scrollTo(sec.id)}
            className="whitespace-nowrap px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            {sec.label}
          </button>
        ))}
      </div>
    </div>
  );
}
