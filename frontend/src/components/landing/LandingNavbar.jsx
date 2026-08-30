import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';

export default function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <BrainCircuit size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 leading-none">ProcurementIQ</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Procurement Intelligence</span>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#evidence" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Evidence</a>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-4">
            <Link 
              to="/evaluations" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow"
            >
              Open Dashboard
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
