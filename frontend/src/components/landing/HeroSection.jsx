import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, ArrowRight, ShieldCheck, Search, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-slate-50">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Turn Vendor Proposals Into <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">
            Confident Procurement Decisions.
          </span>
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          ProcurementIQ analyzes vendor proposals, compares requirements, costs and risks, and gives you evidence-backed recommendations you can trust.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/evaluations" 
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Start Evaluating <ArrowRight size={18} />
          </Link>
          <a 
            href="#how-it-works" 
            className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-base font-semibold px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center"
          >
            Explore How It Works
          </a>
        </div>

        {/* Value Strip */}
        <div className="mt-16 pt-8 border-t border-slate-200/60 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-semibold text-slate-500">
            <div className="flex items-center gap-2"><Zap size={16} className="text-indigo-500"/> AI-Powered Analysis</div>
            <div className="flex items-center gap-2"><Search size={16} className="text-sky-500"/> Evidence-Backed</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500"/> Explainable Decisions</div>
            <div className="flex items-center gap-2"><FileText size={16} className="text-amber-500"/> Scenario Planning</div>
          </div>
        </div>

      </div>
    </section>
  );
}
