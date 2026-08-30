import React from 'react';
import { Brain, DollarSign, ShieldAlert, BarChart, Search, Sliders, MessageSquare, Briefcase } from 'lucide-react';

const FEATURES = [
  {
    icon: <Brain size={24} className="text-indigo-600" />,
    title: "AI Vendor Analysis",
    desc: "Automatically evaluate vendor proposals against procurement requirements."
  },
  {
    icon: <DollarSign size={24} className="text-emerald-600" />,
    title: "Cost & TCO Analysis",
    desc: "Compare estimated total cost of ownership and commercial terms."
  },
  {
    icon: <ShieldAlert size={24} className="text-amber-600" />,
    title: "Risk Intelligence",
    desc: "Identify contract lock-in, termination fees, hidden costs, SLA weaknesses and other risks."
  },
  {
    icon: <BarChart size={24} className="text-sky-600" />,
    title: "Explainable Scoring",
    desc: "See exactly how requirements, cost and risk contribute to the final score."
  },
  {
    icon: <Search size={24} className="text-purple-600" />,
    title: "Evidence Traceability",
    desc: "Trace recommendations and risks directly back to the original proposal and page."
  },
  {
    icon: <Sliders size={24} className="text-pink-600" />,
    title: "Procurement Decision Simulator",
    desc: "Change priorities and instantly see how vendor rankings change."
  },
  {
    icon: <MessageSquare size={24} className="text-blue-600" />,
    title: "Procurement Copilot",
    desc: "Ask questions about the evaluation and proposals through an AI assistant with persistent evaluation-scoped memory."
  },
  {
    icon: <Briefcase size={24} className="text-orange-600" />,
    title: "Negotiation Intelligence",
    desc: "Generate vendor-specific leverage points and clarification questions."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Make the Decision</h2>
          <p className="text-lg text-slate-600">
            A complete suite of AI-powered tools designed specifically for procurement professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                {feat.icon}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
