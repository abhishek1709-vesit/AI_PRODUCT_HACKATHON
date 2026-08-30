import React from 'react';
import { ArrowRight, FileText, CheckCircle } from 'lucide-react';

export default function ProductOverview() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">From Proposal Overload to Procurement Clarity</h2>
          <p className="text-lg text-slate-600">
            Vendor selection often means reviewing lengthy proposals, comparing requirements manually, calculating costs, identifying contract risks, and defending the final decision.
          </p>
          <p className="text-lg font-medium text-indigo-600 mt-4">
            ProcurementIQ brings these steps into one intelligent workflow.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Visual representation */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Input */}
            <div className="flex-1 flex flex-col gap-3 w-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3 shadow-sm opacity-80">
                  <FileText className="text-slate-400" size={24} />
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Layer */}
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                <ArrowRight className="text-indigo-600" size={24} />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Analysis</span>
            </div>

            {/* Output */}
            <div className="flex-1 w-full bg-indigo-600 rounded-xl p-6 shadow-xl text-white transform md:scale-105">
              <div className="flex items-center gap-3 mb-6 border-b border-indigo-500/50 pb-4">
                <CheckCircle className="text-emerald-400" size={28} />
                <div>
                  <h3 className="font-bold text-lg leading-tight">Recommended Vendor</h3>
                  <p className="text-indigo-200 text-sm">Clear, evidence-backed decision</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-indigo-100">Requirement Fit</span>
                  <span className="font-bold">100%</span>
                </div>
                <div className="w-full bg-indigo-900/50 rounded-full h-1.5">
                  <div className="bg-emerald-400 h-1.5 rounded-full w-full"></div>
                </div>

                <div className="flex justify-between items-center text-sm mt-4">
                  <span className="text-indigo-100">Est. TCO</span>
                  <span className="font-bold">₹11,00,000</span>
                </div>
                <div className="w-full bg-indigo-900/50 rounded-full h-1.5">
                  <div className="bg-emerald-400 h-1.5 rounded-full w-[85%]"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </section>
  );
}
