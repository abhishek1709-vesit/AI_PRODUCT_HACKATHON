import React from 'react';
import { Loader2, ShieldAlert, CheckCircle, Info, TriangleAlert, Handshake, ChevronDown, ChevronRight, FileText } from 'lucide-react';

export default function ProcurementSimulator({ 
  result, 
  baseResult, 
  vendors,
  simulating,
  expandedVendorId,
  setExpandedVendorId
}) {
  if (!result || !baseResult) return null;

  const data = result;
  
  // Helpers
  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown';
  
  const recVendorId = data.recommended_vendor_id || (data.ranking && data.ranking[0]);
  const recVendorName = getVendorName(recVendorId);
  const bestAlternativeId = data.ranking && data.ranking.length > 1 ? data.ranking[1] : null;

  // Analysis for expanding panel
  const getVendorAnalysis = (vid) => baseResult.vendor_analysis?.filter(a => a.vendor_id === vid) || [];
  const getVendorRisks = (vid) => baseResult.risks?.filter(r => r.vendor_id === vid) || [];

  return (
    <div className="space-y-6 relative">
      {simulating && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
          <div className="bg-white shadow-lg border border-gray-200 px-6 py-4 rounded-full flex items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
            <span className="font-semibold text-indigo-900">Simulating scenario...</span>
          </div>
        </div>
      )}

      {/* FEATURE 10: ALERTS */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.alerts.map((alert, idx) => (
            <div key={idx} className={`p-3 border-l-4 rounded shadow-sm flex gap-3 text-sm ${
              alert.level === 'HIGH PRIORITY' ? 'bg-red-50 border-red-500 text-red-900' :
              alert.level === 'WARNING' ? 'bg-yellow-50 border-yellow-500 text-yellow-900' :
              'bg-blue-50 border-blue-500 text-blue-900'
            }`}>
              {alert.level === 'HIGH PRIORITY' && <ShieldAlert size={18} className="mt-0.5 flex-shrink-0" />}
              {alert.level === 'WARNING' && <TriangleAlert size={18} className="mt-0.5 flex-shrink-0" />}
              {alert.level === 'INFO' && <Info size={18} className="mt-0.5 flex-shrink-0" />}
              <div>
                <strong>{alert.level}:</strong> {alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FEATURE 5: RANKING CHANGE EXPLANATION */}
      {data.ranking_explanation && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-lg shadow-sm">
          <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2">Why Did the Ranking Change?</h4>
          <p className="text-sm font-medium text-purple-900">{data.ranking_explanation}</p>
        </div>
      )}

      {/* FEATURE 1 & 9: DECISION SUMMARY & CONFIDENCE */}
      {recVendorId && (
        <div className="bg-white border-2 border-indigo-100 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" />
              Recommended Vendor
            </h3>
            {data.decision_confidence && (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-gray-500">Decision Confidence:</span>
                <span className={`px-2 py-1 rounded-full ${
                  data.decision_confidence.level === 'High' ? 'bg-green-100 text-green-700' :
                  data.decision_confidence.level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{data.decision_confidence.level}</span>
              </div>
            )}
          </div>
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-3xl font-black text-gray-900 mb-1">{recVendorName}</div>
                <div className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-full border border-indigo-100">
                  Final Score: {data.comparison[recVendorId]?.final_score?.toFixed(1)} / 100
                </div>
              </div>
              
              {bestAlternativeId && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Best Alternative</div>
                  <div className="text-sm font-bold text-gray-800">{getVendorName(bestAlternativeId)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Score: {data.comparison[bestAlternativeId]?.final_score?.toFixed(1)}</div>
                </div>
              )}
            </div>

            {/* If graphResult has recommendation logic, show it. Otherwise rely on confidence reasons. */}
            {baseResult.recommendation && baseResult.recommendation.recommended_vendor_id === recVendorId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">Why {recVendorName}?</h4>
                  <p className="text-gray-600">{baseResult.recommendation.explanation}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">Trade-offs</h4>
                  <p className="text-gray-600">{baseResult.recommendation.trade_offs}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Confidence Factors:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {data.decision_confidence?.reasons?.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            
            {/* FEATURE 3 & 8: WHY THIS VENDOR PANEL & EVIDENCE TRACEABILITY */}
            <div className="mt-4 border-t pt-4">
              <button 
                onClick={() => setExpandedVendorId(expandedVendorId === recVendorId ? null : recVendorId)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {expandedVendorId === recVendorId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {expandedVendorId === recVendorId ? "Hide Evidence details" : "Why this vendor? (View Evidence)"}
              </button>
              
              {expandedVendorId === recVendorId && (
                <div className="mt-4 p-5 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-6">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">Key Requirements Satisfied</h5>
                    <div className="space-y-3">
                      {getVendorAnalysis(recVendorId).filter(a => a.status === 'fully_meets' || a.status === 'exceeds').slice(0,3).map((a, i) => (
                        <div key={i} className="pl-3 border-l-2 border-green-500">
                          <p className="text-gray-700">{a.explanation}</p>
                          {(() => {
                            const hasRealEvidence = a.evidence && a.evidence.trim() !== '' && !a.evidence.toLowerCase().includes('see proposal chunks');
                            if (!a.page_number && !a.section && !hasRealEvidence) return null;
                            
                            return (
                              <div className="mt-2 bg-white p-2 border border-gray-200 rounded text-xs text-gray-600">
                                {hasRealEvidence ? (
                                  <>
                                    <div className="flex items-center gap-1 font-semibold text-gray-700 mb-1">
                                      <FileText size={12} />
                                      <span>Evidence &mdash; Page {a.page_number || 'N/A'} &middot; {a.section || 'Unknown Section'}</span>
                                    </div>
                                    <p className="italic text-gray-500">"{a.evidence}"</p>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1 font-semibold text-gray-400">
                                    <FileText size={12} />
                                    <span>Evidence unavailable</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">Major Risks</h5>
                    <div className="space-y-3">
                      {getVendorRisks(recVendorId).filter(r => r.severity === 'high' || r.severity === 'medium').slice(0,3).map((r, i) => (
                        <div key={i} className="pl-3 border-l-2 border-red-500">
                          <p className="text-gray-700">{r.description}</p>
                          {(() => {
                            const hasRealEvidence = r.evidence && r.evidence.trim() !== '' && !r.evidence.toLowerCase().includes('see proposal chunks');
                            if (!r.page_number && !r.section && !hasRealEvidence) return null;
                            
                            return (
                              <div className="mt-2 bg-white p-2 border border-gray-200 rounded text-xs text-gray-600">
                                {hasRealEvidence ? (
                                  <>
                                    <div className="flex items-center gap-1 font-semibold text-gray-700 mb-1">
                                      <FileText size={12} />
                                      <span>Evidence &mdash; Page {r.page_number || 'N/A'} &middot; {r.section || 'Unknown Section'}</span>
                                    </div>
                                    <p className="italic text-gray-500">"{r.evidence}"</p>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1 font-semibold text-gray-400">
                                    <FileText size={12} />
                                    <span>Evidence unavailable</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                      {getVendorRisks(recVendorId).length === 0 && <p className="text-gray-500 italic">No major risks identified.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 2 & 6: EXPLAINABLE SCORE BREAKDOWN & COMPARISON */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Vendor Score Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-3 border-b font-medium">Vendor</th>
                <th className="p-3 border-b font-medium">Requirements<br/><span className="text-[10px] text-gray-400">Score &rarr; Contrib</span></th>
                <th className="p-3 border-b font-medium">Cost / TCO<br/><span className="text-[10px] text-gray-400">Score &rarr; Contrib</span></th>
                <th className="p-3 border-b font-medium">Risk<br/><span className="text-[10px] text-gray-400">Penalty &rarr; Contrib</span></th>
                <th className="p-3 border-b font-bold text-gray-900 text-right">Final Score</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.ranking && data.ranking.map((vid) => {
                const row = data.comparison[vid];
                if (!row) return null;
                const isTop = vid === recVendorId;
                return (
                  <tr key={vid} className={`border-b last:border-b-0 hover:bg-gray-50 ${isTop ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-3 font-semibold text-gray-900">
                      {getVendorName(vid)}
                      {isTop && <div className="mt-1"><span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Top Choice</span></div>}
                    </td>
                    <td className="p-3 text-gray-600">
                      <div className="flex flex-col">
                        <span>{row.requirement_score?.toFixed(1)}%</span>
                        <span className="text-xs font-semibold text-green-600">+{row.requirement_contribution?.toFixed(1)} pts</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {row.estimated_tco 
                            ? "₹" + row.estimated_tco.toLocaleString('en-IN') 
                            : "Unknown"}
                        </span>
                        <span className="text-[11px] text-gray-500">Score: {row.commercial_score?.toFixed(1)}</span>
                        <span className="text-xs font-semibold text-green-600">+{row.commercial_contribution?.toFixed(1)} pts</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      <div className="flex flex-col">
                        <span className="text-red-500">Penalty: -{row.risk_penalty}</span>
                        <span className="text-xs font-semibold text-red-600">-{Math.abs(row.risk_contribution)?.toFixed(1)} pts</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-xl font-black text-indigo-700">{row.final_score?.toFixed(1)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
             <span className="text-[11px] text-gray-500 font-mono">Final Score = Requirement Contrib + Cost Contrib + Risk Contrib</span>
          </div>
        </div>
      </div>

      {/* FEATURE 7: NEGOTIATION INSIGHTS */}
      {baseResult.negotiation && baseResult.negotiation.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
            <Handshake size={18} className="text-blue-600" />
            <h3 className="font-bold text-gray-900">Negotiation Strategy</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {baseResult.negotiation.map((neg, idx) => (
                <div key={idx} className="bg-blue-50/30 p-4 rounded-lg border border-blue-100 text-sm">
                  <h4 className="font-bold text-blue-900 mb-3 text-base">{getVendorName(neg.vendor_id)}</h4>
                  
                  {neg.leverage_points && neg.leverage_points.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wider">Leverage Points</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {neg.leverage_points.map((pt, i) => <li key={i}>{pt}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  {neg.clarification_questions && neg.clarification_questions.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wider">Clarification Questions</h5>
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {neg.clarification_questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
