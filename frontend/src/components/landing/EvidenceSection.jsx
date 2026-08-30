import React from 'react';
import { Search, ExternalLink, ShieldAlert, ArrowDown } from 'lucide-react';

export default function EvidenceSection() {
  return (
    <section id="evidence" className="py-24 bg-slate-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-semibold mb-6">
            <Search size={16} /> Traceability Engine
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't Just Trust the AI. <br/>See the Evidence.</h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Every important insight can be traced back to the vendor proposal that supports it. ProcurementIQ's integrated PDF viewer takes you straight to the source.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Example AI Claim */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl mb-6 relative">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mt-1">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 mb-1">Risk Detected: Contract Lock-in</h4>
                <p className="text-slate-400 text-sm">TechCloud requires a 36-month minimum contract commitment with early termination penalties.</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <ArrowDown size={18} />
            </div>
          </div>

          {/* Example Evidence Card */}
          <div className="bg-indigo-600 rounded-xl p-6 shadow-2xl relative transform transition hover:scale-[1.02] cursor-pointer group">
            <div className="flex items-center justify-between border-b border-indigo-500 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
                📄 Vendor Proposal <span className="opacity-50">•</span> Page 12 <span className="opacity-50">•</span> Contract Terms
              </div>
              <ExternalLink size={16} className="text-indigo-200 group-hover:text-white transition-colors" />
            </div>
            
            <p className="text-white font-medium text-lg leading-relaxed mb-6">
              "The Customer agrees to a minimum commitment period of 36 months. Early termination prior to the completion of this term will result in a cancellation fee equal to 100% of the remaining balance."
            </p>
            
            <div className="flex justify-end">
              <div className="text-sm font-bold text-white bg-indigo-700 px-4 py-2 rounded-lg group-hover:bg-indigo-800 transition-colors">
                View Evidence in PDF Viewer →
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </section>
  );
}
