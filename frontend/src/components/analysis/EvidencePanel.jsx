import React, { useState } from 'react';
import { SectionCard } from '../ui/Card.jsx';
import EvidenceCard from './EvidenceCard.jsx';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function EvidencePanel({ baseResult, vendors, vendorProposalMap = {} }) {
  const [showAll, setShowAll] = useState(false);

  if (!baseResult || !baseResult.vendor_analysis) return null;

  const recVendorId = baseResult.recommended_vendor_id || (baseResult.ranking && baseResult.ranking[0]);

  // Gather all evidence items that have real evidence text or page numbers
  let allEvidence = [];
  
  baseResult.vendor_analysis.forEach(a => {
    const hasEvidence = a.evidence && a.evidence.trim() !== '' && !a.evidence.toLowerCase().includes('see proposal chunks');
    if (a.page_number || a.section || hasEvidence) {
      allEvidence.push({
        vendor_id: a.vendor_id,
        vendorName: vendors.find(v => v.id === a.vendor_id)?.name || 'Unknown',
        requirement_name: a.requirement_name,
        explanation: a.explanation,
        status: a.status,
        page_number: a.page_number,
        section: a.section,
        evidence: a.evidence,
        // Link to the proposal PDF for this vendor
        proposalId: vendorProposalMap[a.vendor_id] || null,
      });
    }
  });

  if (allEvidence.length === 0) return null;

  // Prioritize: recommended vendor first, then strongest statuses
  allEvidence.sort((a, b) => {
    if (a.vendor_id === recVendorId && b.vendor_id !== recVendorId) return -1;
    if (a.vendor_id !== recVendorId && b.vendor_id === recVendorId) return 1;
    if (a.status === 'fully_meets' && b.status !== 'fully_meets') return -1;
    if (a.status !== 'fully_meets' && b.status === 'fully_meets') return 1;
    return 0;
  });

  const topEvidence = allEvidence.slice(0, 3);
  const remainingEvidence = allEvidence.slice(3);

  const renderItem = (item, key) => (
    <div key={key} className="border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-semibold text-slate-800 mb-1">
        {item.vendorName} — {item.requirement_name}
      </p>
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{item.explanation}</p>
      <EvidenceCard
        vendorName={item.vendorName}
        pageNumber={item.page_number}
        section={item.section}
        evidence={item.evidence}
        proposalId={item.proposalId}
      />
    </div>
  );

  return (
    <SectionCard title="Key Evidence" subtitle="Source references supporting the analysis — click to view in original proposal">
      <div className="space-y-4">
        {topEvidence.map((item, i) => renderItem(item, i))}

        {remainingEvidence.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              aria-expanded={showAll}
            >
              {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAll ? 'Hide additional evidence' : `View ${remainingEvidence.length} more evidence items`}
            </button>

            {showAll && (
              <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                {remainingEvidence.map((item, i) => renderItem(item, `rem-${i}`))}
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
