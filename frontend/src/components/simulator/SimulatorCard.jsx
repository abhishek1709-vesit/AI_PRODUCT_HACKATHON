import React, { useState } from 'react';
import { Loader2, ShieldAlert, Info, TriangleAlert, ArrowRight } from 'lucide-react';
import { SectionCard } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import ScoreBar from '../ui/ScoreBar.jsx';
import Slider from '../ui/Slider.jsx';

const PRESETS = {
  'Balanced':       { requirements: 50, cost: 30, risk: 20 },
  'Quality First':  { requirements: 70, cost: 15, risk: 15 },
  'Cost Optimized': { requirements: 20, cost: 60, risk: 20 },
  'Risk Averse':    { requirements: 30, cost: 20, risk: 50 },
};

export default function SimulatorCard({
  result,
  baseResult,
  vendors,
  simulating,
  priorities,
  selectedScenario,
  onPriorityChange,
  onScenarioChange,
}) {
  const [expandedVendorId, setExpandedVendorId] = useState(null);

  if (!result || !baseResult) return null;

  const data = result;
  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown';

  const recVendorId = data.recommended_vendor_id || (data.ranking && data.ranking[0]);
  const baseRecVendorId = baseResult.recommended_vendor_id || (baseResult.ranking && baseResult.ranking[0]);
  const rankingChanged = recVendorId !== baseRecVendorId;

  const getVendorAnalysis = (vid) => baseResult.vendor_analysis?.filter(a => a.vendor_id === vid) || [];
  const getVendorRisks = (vid) => baseResult.risks?.filter(r => r.vendor_id === vid) || [];

  const alertIcons = {
    'HIGH PRIORITY': <ShieldAlert size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />,
    'WARNING':       <TriangleAlert size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />,
    'INFO':          <Info size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />,
  };

  const alertStyles = {
    'HIGH PRIORITY': 'bg-red-50 border-red-400 text-red-900',
    'WARNING':       'bg-amber-50 border-amber-400 text-amber-900',
    'INFO':          'bg-blue-50 border-blue-400 text-blue-900',
  };

  const total = priorities.requirements + priorities.cost + priorities.risk;
  const isValid = total === 100;

  return (
    <SectionCard
      title="Procurement Decision Simulator"
      subtitle="See how changing your priorities affects the vendor ranking — without re-running the full analysis."
    >
      <div className="space-y-6 relative">
        {/* Simulating overlay */}
        {simulating && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
            <div className="bg-white shadow-lg border border-slate-200 px-5 py-3.5 rounded-full flex items-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={20} />
              <span className="text-sm font-semibold text-slate-700">Simulating scenario...</span>
            </div>
          </div>
        )}

        {/* Sliders + presets */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Adjust Priorities</p>
            <span className={`text-xs font-semibold px-2 py-1 rounded-md tabular-nums ${
              isValid ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
            }`}>
              {total}% {isValid ? '✓' : ''}
            </span>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(PRESETS).map(name => (
              <button
                key={name}
                onClick={() => onScenarioChange(name)}
                className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all border ${
                  selectedScenario === name
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                }`}
                aria-pressed={selectedScenario === name}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Slider id="sim-req"  label="Requirements" value={priorities.requirements} onChange={v => onPriorityChange('requirements', v)} color="indigo" />
            <Slider id="sim-cost" label="Cost / TCO"   value={priorities.cost}         onChange={v => onPriorityChange('cost', v)}         color="emerald" />
            <Slider id="sim-risk" label="Risk"         value={priorities.risk}         onChange={v => onPriorityChange('risk', v)}         color="amber" />
          </div>
        </div>

        {/* Ranking change banner */}
        {data.ranking_explanation && (
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm">
            <ArrowRight size={15} className="text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-indigo-700 mb-0.5">Ranking Changed</p>
              <p className="text-indigo-800 text-xs leading-relaxed">{data.ranking_explanation}</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {data.alerts?.length > 0 && (
          <div className="space-y-2">
            {data.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 px-4 py-3 border-l-4 rounded-md text-xs ${alertStyles[alert.level] || alertStyles.INFO}`}
                role="alert"
              >
                {alertIcons[alert.level] || alertIcons.INFO}
                <div>
                  <span className="font-semibold">{alert.level}: </span>
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vendor ranking */}
        {data.ranking?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Ranking</p>
            <div className="space-y-2">
              {data.ranking.map((vid, idx) => {
                const row = data.comparison?.[vid];
                if (!row) return null;
                const isTop = idx === 0;
                const isExpanded = expandedVendorId === vid;

                return (
                  <div key={vid} className={`border rounded-lg overflow-hidden transition-all ${isTop ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className={`text-sm font-black w-6 text-center flex-shrink-0 ${isTop ? 'text-indigo-600' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${isTop ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {getVendorName(vid)}
                          </span>
                          {isTop && <Badge variant="primary" size="xs">★ Top Choice</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1.5">
                          <div className="flex-1 max-w-[160px]">
                            <ScoreBar value={row.final_score || 0} color={isTop ? 'indigo' : 'slate'} />
                          </div>
                          <span className={`text-xs font-bold tabular-nums ${isTop ? 'text-indigo-700' : 'text-slate-600'}`}>
                            {row.final_score?.toFixed(1) ?? '–'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedVendorId(isExpanded ? null : vid)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0 transition-colors"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'View'} details for ${getVendorName(vid)}`}
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 px-4 py-4 bg-white space-y-4 text-xs">
                        {/* Score breakdown */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Requirements</p>
                            <p className="text-sm font-bold text-emerald-700">+{row.requirement_contribution?.toFixed(1) ?? '–'} pts</p>
                            <p className="text-slate-500">{row.requirement_score?.toFixed(0) ?? '–'}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Cost</p>
                            <p className="text-sm font-bold text-emerald-700">+{row.commercial_contribution?.toFixed(1) ?? '–'} pts</p>
                            <p className="text-slate-500">Score {row.commercial_score?.toFixed(0) ?? '–'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Risk</p>
                            <p className="text-sm font-bold text-red-600">−{Math.abs(row.risk_contribution)?.toFixed(1) ?? '–'} pts</p>
                            <p className="text-slate-500">Penalty {row.risk_penalty ?? '–'}</p>
                          </div>
                        </div>

                        {/* Key requirements */}
                        {getVendorAnalysis(vid).filter(a => a.status === 'fully_meets' || a.status === 'exceeds').slice(0, 2).map((a, i) => (
                          <div key={i} className="flex items-start gap-2 pl-3 border-l-2 border-emerald-400">
                            <span className="text-emerald-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                            <p className="text-slate-700 leading-relaxed">{a.explanation}</p>
                          </div>
                        ))}

                        {/* Key risks */}
                        {getVendorRisks(vid).filter(r => r.severity === 'high').slice(0, 2).map((r, i) => (
                          <div key={i} className="flex items-start gap-2 pl-3 border-l-2 border-red-400">
                            <span className="text-red-500 font-bold flex-shrink-0 mt-0.5">⚠</span>
                            <p className="text-slate-700 leading-relaxed">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
