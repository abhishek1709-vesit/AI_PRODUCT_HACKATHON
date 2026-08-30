import React, { useState } from 'react';
import { CheckCircle, Shield, ChevronDown, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react';
import { SectionCard } from '../ui/Card.jsx';
import ScoreBar from '../ui/ScoreBar.jsx';
import Badge from '../ui/Badge.jsx';
import ProposalPdfViewer from './ProposalPdfViewer.jsx';

export default function DecisionSummary({ data, baseResult, vendors, vendorProposalMap = {} }) {
  const [showRationale, setShowRationale] = useState(false);
  const [viewerState, setViewerState] = useState({ open: false, item: null });

  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown';

  const recVendorId = data.recommended_vendor_id || (data.ranking && data.ranking[0]);
  if (!recVendorId) return null;

  const recVendorName = getVendorName(recVendorId);
  const row = data.comparison?.[recVendorId];
  const bestAltId = data.ranking?.length > 1 ? data.ranking[1] : null;
  const rec = baseResult?.recommendation;

  const reqScore = row?.requirement_score || 0;
  const hasTco = row?.estimated_tco != null;
  const tcoDisplay = hasTco ? `₹${row.estimated_tco.toLocaleString('en-IN')}` : 'Unknown';
  const riskPenalty = row?.risk_penalty || 0;

  // Extract strengths and tradeoffs like WhyThisVendor did
  const vendorAnalysis = baseResult?.vendor_analysis?.filter(a => a.vendor_id === recVendorId) || [];
  const strengths = vendorAnalysis.filter(a => a.status === 'fully_meets' || a.status === 'exceeds').slice(0, 3);
  const tradeoffs = vendorAnalysis.filter(a => a.status === 'partially_meets' || a.status === 'not_met').slice(0, 3);

  const proposalId = vendorProposalMap[recVendorId];

  const handleOpenViewer = (item) => {
    if (proposalId) {
      setViewerState({ open: true, item });
    }
  };

  const renderAnalysisItem = (a, idx, icon) => {
    const hasEvidence = a.page_number || a.section || (a.evidence && a.evidence.trim() !== '' && !a.evidence.toLowerCase().includes('see proposal chunks'));
    
    return (
      <li key={idx} className="flex items-start gap-2.5 text-sm">
        <span className="flex-shrink-0 mt-0.5 font-bold" aria-hidden="true">{icon}</span>
        <div className="flex-1">
          <span className="text-slate-700 leading-snug">{a.explanation || a.requirement_name}</span>
          {hasEvidence && proposalId && (
            <button
              onClick={() => handleOpenViewer(a)}
              className="inline-flex items-center gap-1 ml-2 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-sm"
              title="View source document"
            >
              View evidence <ExternalLink size={10} />
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <SectionCard
      title="Decision Summary"
      subtitle="Executive Procurement Decision Cockpit"
      action={
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
          <CheckCircle size={12} aria-hidden="true" />
          Analysis Complete
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        
        {/* Top Header: Recommended Vendor & Score & Confidence */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommended Vendor</p>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-slate-900">{recVendorName}</h2>
              <Badge variant="primary" className="text-lg px-3 py-1">
                {row?.final_score?.toFixed(1) ?? '–'} / 100
              </Badge>
            </div>
          </div>
          
          {data.decision_confidence && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Shield size={16} className={data.decision_confidence.level === 'High' ? 'text-emerald-500' : 'text-amber-500'} aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-700">Decision Confidence:</span>
              <Badge
                variant={
                  data.decision_confidence.level === 'High' ? 'success' :
                  data.decision_confidence.level === 'Medium' ? 'warning' : 'danger'
                }
                size="sm"
              >
                {data.decision_confidence.level}
              </Badge>
            </div>
          )}
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Requirement Fit</p>
            <p className="text-2xl font-bold text-slate-900 mb-2">{reqScore.toFixed(0)}%</p>
            <ScoreBar value={reqScore} color="indigo" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Est. TCO</p>
            <p className={`text-2xl font-bold mb-2 ${hasTco ? 'text-slate-900' : 'text-slate-400'}`}>{tcoDisplay}</p>
            {hasTco && <ScoreBar value={row.commercial_score || 0} color="emerald" />}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Risk Penalty</p>
            <p className="text-2xl font-bold text-amber-600 mb-2">−{riskPenalty}</p>
            <ScoreBar value={Math.min(100, riskPenalty * 10)} color="amber" />
          </div>
        </div>

        {/* Why it won & Key Risks & Best Alternative */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Why {recVendorName} Won</p>
            <ul className="space-y-2">
              {strengths.length > 0 ? strengths.map((a, i) => renderAnalysisItem(a, i, <span className="text-emerald-500">✓</span>)) : (
                <li className="text-sm text-slate-500">Strong overall performance.</li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Key Risks / Trade-offs</p>
            <ul className="space-y-2">
              {tradeoffs.length > 0 ? tradeoffs.map((a, i) => renderAnalysisItem(a, i, <span className="text-amber-500">⚠</span>)) : (
                <li className="text-sm text-slate-500">No major risks identified.</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Best Alternative</p>
            {bestAltId ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-slate-800">{getVendorName(bestAltId)}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-500">Final Score</p>
                  <Badge variant="secondary" size="xs">{data.comparison?.[bestAltId]?.final_score?.toFixed(1) ?? '–'}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No alternatives analyzed.</p>
            )}
          </div>
        </div>

        {/* Detailed Rationale Toggle */}
        {rec && rec.explanation && (
          <div className="pt-2">
            <button
              onClick={() => setShowRationale(o => !o)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              aria-expanded={showRationale}
            >
              {showRationale ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              View detailed rationale
            </button>

            {showRationale && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-200">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{rec.explanation}</p>
                {rec.trade_offs && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Additional Trade-offs</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{rec.trade_offs}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
      </div>

      {viewerState.open && viewerState.item && proposalId && (
        <ProposalPdfViewer
          isOpen={viewerState.open}
          onClose={() => setViewerState({ open: false, item: null })}
          proposalId={proposalId}
          initialPage={viewerState.item.page_number}
          vendorName={recVendorName}
          evidenceSection={viewerState.item.section}
          evidenceQuote={viewerState.item.evidence}
        />
      )}
    </SectionCard>
  );
}
