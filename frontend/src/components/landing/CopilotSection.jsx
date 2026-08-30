import React from 'react';
import { Bot, User, MessageSquare } from 'lucide-react';

export default function CopilotSection() {
  return (
    <section className="py-24 bg-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 lg:max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
              <MessageSquare size={16} /> Procurement Copilot
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Your Procurement Analyst,<br/>On Demand.</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Ask questions about your vendors, requirements, risks, costs and recommendations. Procurement Copilot understands the current evaluation and remembers your investigation.
            </p>
            <ul className="space-y-3 text-slate-700 font-medium">
              <li className="flex items-center gap-2">✓ Persistent evaluation-scoped memory</li>
              <li className="flex items-center gap-2">✓ Grounded in retrieved proposal chunks (RAG)</li>
              <li className="flex items-center gap-2">✓ Live calculation integration</li>
              <li className="flex items-center gap-2">✓ Inline clickable evidence citations</li>
            </ul>
          </div>
          
          <div className="flex-1 w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px]">
              <div className="bg-indigo-600 text-white p-4 flex items-center gap-3">
                <Bot size={24} />
                <div>
                  <h4 className="font-bold">Procurement Copilot</h4>
                  <p className="text-xs text-indigo-200">AI assistant for this evaluation</p>
                </div>
              </div>
              
              <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4 bg-slate-50">
                {/* User Message */}
                <div className="flex justify-end gap-3">
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm max-w-[80%] shadow-sm">
                    Why is TechCloud recommended?
                  </div>
                </div>
                
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-indigo-600" />
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-sm">
                    <p className="text-slate-800 mb-2">TechCloud ranks first because it has the strongest requirement fit and the lowest estimated TCO of ₹11,00,000.</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex justify-end gap-3">
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm max-w-[80%] shadow-sm">
                    What are its biggest risks?
                  </div>
                </div>
                
                {/* AI Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-indigo-600" />
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-sm">
                    <p className="text-slate-800 mb-3">The main risks are hidden costs, SLA enforcement and data residency.</p>
                    
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sources</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col gap-1 cursor-pointer hover:border-indigo-300">
                      <p className="text-xs font-semibold text-slate-700">📄 TechCloud Proposal · Page 2</p>
                      <p className="text-xs text-slate-500 italic truncate">"Additional modules and usage beyond..."</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 border-t border-slate-200 bg-white">
                <div className="w-full bg-slate-100 rounded-full h-10 px-4 flex items-center text-sm text-slate-400">
                  Ask about this procurement...
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
