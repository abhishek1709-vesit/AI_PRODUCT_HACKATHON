import React from 'react';

const STEPS = [
  {
    num: "01",
    title: "Define Requirements",
    desc: "Capture procurement requirements and priorities for your project."
  },
  {
    num: "02",
    title: "Upload Proposals",
    desc: "Upload vendor proposals and let ProcurementIQ process the documents."
  },
  {
    num: "03",
    title: "Analyze Vendors",
    desc: "AI evaluates requirements, commercial terms and risks using proposal evidence."
  },
  {
    num: "04",
    title: "Compare & Simulate",
    desc: "Compare vendors and test different procurement priorities."
  },
  {
    num: "05",
    title: "Decide With Confidence",
    desc: "Get an explainable recommendation, evidence, risks and negotiation insights."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How ProcurementIQ Works</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">From messy documents to a clean decision in five automated steps.</p>
        </div>

        <div className="relative">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-[45px] left-0 w-full h-[2px] bg-slate-800"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {STEPS.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-lg mb-6 shadow-lg z-10 border-4 border-slate-900">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-100">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}
