import React from 'react';
import { Settings2, ArrowDown } from 'lucide-react';

export default function PlanningSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 lg:max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6">
              <Settings2 size={16} /> Decision Simulator
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Plan Before You Decide</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              See how changing your procurement priorities changes the outcome.
            </p>
            <p className="text-slate-600 mb-8 leading-relaxed">
              ProcurementIQ lets you test different scenarios without rerunning the entire analysis. Change weights on the fly to see how the vendor rankings adapt to your business needs.
            </p>
            
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-slate-900">Quality First</h4>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Requirements ↑</span>
                </div>
                <p className="text-sm text-slate-600">Best for organizations prioritizing capability and compliance.</p>
              </div>
              
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-slate-900">Cost Optimized</h4>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">TCO ↑</span>
                </div>
                <p className="text-sm text-slate-600">Best for organizations prioritizing financial efficiency.</p>
              </div>
              
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-slate-900">Risk Averse</h4>
                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Risk ↑</span>
                </div>
                <p className="text-sm text-slate-600">Best for organizations prioritizing flexibility and risk reduction.</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 relative shadow-lg">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Ranking</p>
              <div className="space-y-3 mb-6">
                <div className="bg-white border-2 border-indigo-500 rounded-lg p-3 flex justify-between shadow-sm">
                  <span className="font-bold">#1 TechCloud</span>
                  <span className="text-indigo-600 font-bold">76.0</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between">
                  <span className="font-semibold text-slate-700">#2 InfraWorks</span>
                  <span className="text-slate-500">62.6</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between">
                  <span className="font-semibold text-slate-700">#3 Cloud Nova</span>
                  <span className="text-slate-500">55.0</span>
                </div>
              </div>
              
              <div className="flex justify-center my-6">
                <div className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                  Change priorities <ArrowDown size={16} />
                </div>
              </div>
              
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">New Ranking (Cost Optimized)</p>
              <div className="space-y-3">
                <div className="bg-white border-2 border-emerald-500 rounded-lg p-3 flex justify-between shadow-sm">
                  <span className="font-bold">#1 InfraWorks</span>
                  <span className="text-emerald-600 font-bold">81.2</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between">
                  <span className="font-semibold text-slate-700">#2 TechCloud</span>
                  <span className="text-slate-500">74.5</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between">
                  <span className="font-semibold text-slate-700">#3 Cloud Nova</span>
                  <span className="text-slate-500">58.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
