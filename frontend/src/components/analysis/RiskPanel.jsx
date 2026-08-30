import React, { useState } from 'react';
import { SectionCard } from '../ui/Card.jsx';
import { SeverityBadge } from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import EvidenceCard from './EvidenceCard.jsx';
import { ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export default function RiskPanel({ risks = [], vendors = [], vendorProposalMap = {} }) {
  const [showAllRisks, setShowAllRisks] = useState(false);

  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown';

  const counts = {
    high: risks.filter(r => r.severity?.toLowerCase() === 'high').length,
    medium: risks.filter(r => r.severity?.toLowerCase() === 'medium').length,
    low: risks.filter(r => r.severity?.toLowerCase() === 'low').length,
  };

  const highRisks = risks.filter(r => r.severity?.toLowerCase() === 'high');
  const mediumRisks = risks.filter(r => r.severity?.toLowerCase() === 'medium');
  const sortedRisks = [...highRisks, ...mediumRisks, ...risks.filter(r => r.severity?.toLowerCase() === 'low')];

  const topRisks = sortedRisks.slice(0, 3);
  const remainingRisks = sortedRisks.slice(3);

  const renderRisk = (risk, idx) => {
    const hasRealEvidence = risk.evidence && risk.evidence.trim() !== '' && !risk.evidence.toLowerCase().includes('see proposal chunks');
    const showEvidenceCard = risk.page_number || risk.section || hasRealEvidence;
    // Look up the proposal ID so the evidence card can open the PDF viewer
    const proposalId = vendorProposalMap[risk.vendor_id] || null;
    return (
      <div key={idx} className="mb-5 last:mb-0">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            {risk.severity?.toLowerCase() === 'high' && <span className="text-red-500 text-lg" aria-label="High severity">🔴</span>}
            {risk.severity?.toLowerCase() === 'medium' && <span className="text-amber-500 text-lg" aria-label="Medium severity">🟠</span>}
            {risk.severity?.toLowerCase() === 'low' && <span className="text-emerald-500 text-lg" aria-label="Low severity">🟢</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {risk.risk_type || risk.category || 'Risk'}
              {' '}—{' '}
              <span className="font-normal text-slate-500">{getVendorName(risk.vendor_id)}</span>
            </p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{risk.description}</p>
            {showEvidenceCard && (
              <div className="mt-2.5">
                <EvidenceCard
                  vendorName={getVendorName(risk.vendor_id)}
                  pageNumber={risk.page_number}
                  section={risk.section}
                  evidence={risk.evidence}
                  proposalId={proposalId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <SectionCard title="Risk Assessment" subtitle="Evaluation of potential risks across vendors">
      
      {/* Risk Overview */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Risk Overview</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden="true" />
            <span className="text-xl font-bold text-slate-800">{counts.high}</span>
            <span className="text-xs font-semibold text-slate-500">HIGH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-xl font-bold text-slate-800">{counts.medium}</span>
            <span className="text-xs font-semibold text-slate-500">MEDIUM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-xl font-bold text-slate-800">{counts.low}</span>
            <span className="text-xs font-semibold text-slate-500">LOW</span>
          </div>
        </div>
      </div>

      {risks.length === 0 ? (
        <EmptyState icon={<ShieldAlert size={20} />} title="No risks found." description="No risks identified across the submitted proposals." />
      ) : (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Top Risks</p>
          <div className="space-y-1">
            {topRisks.map((risk, idx) => renderRisk(risk, idx))}
          </div>

          {remainingRisks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowAllRisks(!showAllRisks)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                aria-expanded={showAllRisks}
              >
                {showAllRisks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showAllRisks ? 'Hide additional risks' : `View all ${risks.length} risks`}
              </button>

              {showAllRisks && (
                <div className="mt-5 space-y-1 animate-in fade-in duration-200">
                  {remainingRisks.map((risk, idx) => renderRisk(risk, idx + 3))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
