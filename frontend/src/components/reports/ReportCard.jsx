import React from 'react';
import { FileDown, Loader2, FileText } from 'lucide-react';
import { SectionCard } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

const REPORT_SECTIONS = [
  'Executive Summary',
  'Vendor Comparison',
  'Requirements Analysis',
  'TCO Breakdown',
  'Risk Assessment',
  'Recommendation',
  'Negotiation Strategy',
  'Evidence Appendix',
];

export default function ReportCard({ evaluation, graphResult, generatingReport, onDownload, reportError }) {
  const isReady = !!graphResult;

  return (
    <SectionCard
      title="Procurement Report"
      subtitle="AI-generated decision report based on your analysis"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        {/* Status */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-indigo-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {evaluation?.name || 'Procurement Decision Report'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={isReady ? 'success' : 'neutral'} size="xs">
                  {isReady ? '● Ready to Generate' : '○ Analysis Required'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Report contents */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Report Contents</p>
            <div className="grid grid-cols-2 gap-1">
              {REPORT_SECTIONS.map((section, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isReady ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
                  {section}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download action */}
        <div className="flex-shrink-0 text-center">
          <Button
            variant="success"
            size="md"
            onClick={onDownload}
            disabled={generatingReport || !isReady}
            loading={generatingReport}
            icon={!generatingReport ? <FileDown size={15} /> : undefined}
            title={!isReady ? 'Run procurement analysis first' : undefined}
          >
            {generatingReport ? 'Generating PDF...' : 'Download PDF Report'}
          </Button>
          {!isReady && (
            <p className="text-[10px] text-slate-400 mt-1.5">Run analysis first</p>
          )}
          {reportError && (
            <p className="text-xs text-red-600 mt-2 max-w-[180px]">{reportError}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
