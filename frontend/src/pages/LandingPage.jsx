import React from 'react';
import LandingNavbar from '../components/landing/LandingNavbar.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import ProductOverview from '../components/landing/ProductOverview.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import FeaturesSection from '../components/landing/FeaturesSection.jsx';
import PlanningSection from '../components/landing/PlanningSection.jsx';
import EvidenceSection from '../components/landing/EvidenceSection.jsx';
import CopilotSection from '../components/landing/CopilotSection.jsx';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200 selection:text-indigo-900">
      <LandingNavbar />
      
      <main>
        <HeroSection />
        <ProductOverview />
        <HowItWorks />
        <FeaturesSection />
        <PlanningSection />
        <EvidenceSection />
        <CopilotSection />
        
        {/* Explainability Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Know Why the Decision Was Made</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-16">
              ProcurementIQ doesn't just recommend a vendor. It shows exactly how the recommendation was produced based on a transparent, deterministic scoring system.
            </p>
            
            <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-4">TechCloud Score Breakdown</h3>
              
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Requirements Contribution</span>
                  <span className="font-bold text-indigo-600">100%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Cost/TCO Score</span>
                  <span className="font-bold text-emerald-600">100%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Risk Penalty</span>
                  <span className="font-bold text-amber-600">-20</span>
                </div>
              </div>
              
              <div className="border-t border-slate-300 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Final Score</span>
                <span className="text-2xl font-black text-slate-900">76.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* Differentiators */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-10 text-center">Why ProcurementIQ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-indigo-400 mb-2">Evidence, Not Guesswork</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Recommendations are explicitly grounded in vendor proposal evidence, reducing AI hallucination risks.</p>
              </div>
              <div>
                <h4 className="font-bold text-indigo-400 mb-2">Decisions, Not Just Summaries</h4>
                <p className="text-sm text-slate-400 leading-relaxed">The system converts complex proposal information into comparable numerical procurement scores.</p>
              </div>
              <div>
                <h4 className="font-bold text-indigo-400 mb-2">Explore Before Committing</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Scenario simulation lets procurement teams test different priorities instantly.</p>
              </div>
              <div>
                <h4 className="font-bold text-indigo-400 mb-2">AI That Remembers</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Procurement Copilot maintains context throughout the evaluation for deep analytical Q&A.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-indigo-600 text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-4xl font-extrabold mb-6">Ready to make your next procurement decision smarter?</h2>
            <p className="text-xl text-indigo-100 mb-10">
              Upload your vendor proposals and let ProcurementIQ turn them into actionable procurement intelligence.
            </p>
            <Link 
              to="/evaluations"
              className="inline-block bg-white text-indigo-600 font-bold text-lg px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors shadow-lg hover:shadow-xl"
            >
              Start an Evaluation →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-lg text-white">ProcurementIQ</span>
            <span className="text-sm">AI-powered procurement intelligence.</span>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link to="/evaluations" className="hover:text-white transition-colors">Product</Link>
            <Link to="/evaluations" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-xs text-center md:text-left text-slate-600 flex flex-col md:flex-row justify-between">
          <p>Built for smarter procurement decisions.</p>
          <p className="mt-2 md:mt-0">Built for Product Space Hackathon</p>
        </div>
      </footer>
    </div>
  );
}
