import React, { useState } from 'react';
import { Handshake, ChevronDown, ChevronRight } from 'lucide-react';
import { SectionCard } from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';

function NumberedItem({ number, text }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold flex items-center justify-center"
        aria-hidden="true"
      >
        {String(number).padStart(2, '0')}
      </span>
      <span className="text-sm text-slate-700 leading-relaxed pt-0.5">{text}</span>
    </li>
  );
}

function NegotiationVendorBlock({ neg, vendorName, isExpanded, onToggle, isRecommended }) {
  return (
    <div className={`border ${isRecommended ? 'border-indigo-200 shadow-sm' : 'border-slate-200'} rounded-lg overflow-hidden transition-all duration-200`}>
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-3 ${isRecommended ? 'bg-indigo-50/50' : 'bg-slate-50 hover:bg-slate-100'} transition-colors`}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
          <p className="text-sm font-semibold text-slate-800">
            {vendorName}
            {isRecommended && <span className="ml-2 text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Recommended</span>}
          </p>
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-5 space-y-6 animate-in slide-in-from-top-2 duration-200 border-t border-slate-100">
          {neg.leverage_points?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Leverage Points
              </p>
              <ul className="space-y-3">
                {neg.leverage_points.map((pt, i) => (
                  <NumberedItem key={i} number={i + 1} text={pt} />
                ))}
              </ul>
            </div>
          )}

          {neg.negotiation_priorities?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Negotiation Priorities
              </p>
              <ul className="space-y-3">
                {neg.negotiation_priorities.map((pt, i) => (
                  <NumberedItem key={i} number={i + 1} text={pt} />
                ))}
              </ul>
            </div>
          )}

          {neg.clarification_questions?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Clarification Questions
              </p>
              <ul className="space-y-3">
                {neg.clarification_questions.map((q, i) => (
                  <NumberedItem key={i} number={i + 1} text={q} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NegotiationPanel({ negotiation = [], vendors = [], recVendorId }) {
  const [expandedVendorId, setExpandedVendorId] = useState(recVendorId || (negotiation.length > 0 ? negotiation[0].vendor_id : null));

  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown';

  if (!negotiation || negotiation.length === 0) {
    return (
      <SectionCard title="Negotiation Strategy" subtitle="Leverage points and clarification questions">
        <EmptyState
          icon={<Handshake size={20} />}
          title="No negotiation strategy generated."
          description="Run a full procurement analysis to generate negotiation insights."
        />
      </SectionCard>
    );
  }

  // Sort so recommended vendor is first
  const sortedNegotiation = [...negotiation].sort((a, b) => {
    if (a.vendor_id === recVendorId) return -1;
    if (b.vendor_id === recVendorId) return 1;
    return 0;
  });

  return (
    <SectionCard
      title="Negotiation Strategy"
      subtitle="Leverage points, priorities, and clarification questions per vendor"
    >
      <div className="space-y-3">
        {sortedNegotiation.map((neg, idx) => (
          <NegotiationVendorBlock
            key={idx}
            neg={neg}
            vendorName={getVendorName(neg.vendor_id)}
            isRecommended={neg.vendor_id === recVendorId}
            isExpanded={expandedVendorId === neg.vendor_id}
            onToggle={() => setExpandedVendorId(expandedVendorId === neg.vendor_id ? null : neg.vendor_id)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
