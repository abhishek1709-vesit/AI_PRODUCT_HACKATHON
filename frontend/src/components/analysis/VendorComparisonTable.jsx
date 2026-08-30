import React from 'react';
import { SectionCard } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export default function VendorComparisonTable({ data, vendors }) {
  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown';

  const recVendorId = data.recommended_vendor_id || (data.ranking && data.ranking[0]);
  const ranking = data.ranking || [];

  if (ranking.length === 0) return null;

  return (
    <SectionCard title="Vendor Comparison" subtitle="Side-by-side scoring breakdown">
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-left border-collapse min-w-[540px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-6 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-[30%]">Vendor</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Req. Fit</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. TCO</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
              <th className="px-6 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Final Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranking.map((vid, idx) => {
              const row = data.comparison?.[vid];
              if (!row) return null;
              const isTop = vid === recVendorId;
              const hasTco = row.estimated_tco != null;
              return (
                <tr
                  key={vid}
                  className={`transition-colors ${isTop ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{getVendorName(vid)}</span>
                      {isTop && (
                        <Badge variant="primary" size="xs">★ Top Choice</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Rank #{idx + 1}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-slate-800">{row.requirement_score?.toFixed(0) ?? '–'}%</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">+{row.requirement_contribution?.toFixed(1) ?? '–'} pts</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-slate-800">
                      {hasTco ? `₹${row.estimated_tco.toLocaleString('en-IN')}` : <span className="text-slate-400">Unknown</span>}
                    </p>
                    <p className="text-[11px] text-slate-500">Score: {row.commercial_score?.toFixed(0) ?? '–'}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">+{row.commercial_contribution?.toFixed(1) ?? '–'} pts</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-red-600">−{row.risk_penalty ?? '–'}</p>
                    <p className="text-[11px] text-red-500 font-semibold">−{Math.abs(row.risk_contribution)?.toFixed(1) ?? '–'} pts</p>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <p className={`text-xl font-black ${isTop ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {row.final_score?.toFixed(1) ?? '–'}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-6 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-mono">
            Final Score = Requirement Contribution + Cost Contribution + Risk Contribution
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
