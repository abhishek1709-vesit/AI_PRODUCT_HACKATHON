import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, FileDown, Loader2 } from 'lucide-react';
import { StatusBadge } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

export default function EvalHeader({
  evaluation,
  vendors,
  requirements,
  proposals,
  graphLoading,
  generatingReport,
  graphResult,
  prioritiesValid,
  onRunAnalysis,
  onDownloadReport,
}) {
  const vendorCount = vendors?.length || 0;
  const reqCount = requirements?.length || 0;
  const propCount = proposals?.length || 0;

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        to="/evaluations"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium mb-4 transition-colors group"
      >
        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        All Evaluations
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-slate-900 leading-tight">
              {evaluation.name}
            </h1>
            <StatusBadge status={evaluation.status} />
          </div>
          {evaluation.description && (
            <p className="text-sm text-slate-500 mt-1.5 max-w-xl leading-relaxed">
              {evaluation.description}
            </p>
          )}

          {/* Chips */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
              <span className="font-semibold text-slate-800">{vendorCount}</span>
              {vendorCount === 1 ? 'Vendor' : 'Vendors'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
              <span className="font-semibold text-slate-800">{reqCount}</span>
              {reqCount === 1 ? 'Requirement' : 'Requirements'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
              <span className="font-semibold text-slate-800">{propCount}</span>
              {propCount === 1 ? 'Proposal' : 'Proposals'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownloadReport}
            disabled={generatingReport || !graphResult}
            loading={generatingReport}
            icon={!generatingReport ? <FileDown size={14} /> : undefined}
            title={!graphResult ? 'Run analysis first to generate a report' : undefined}
          >
            {generatingReport ? 'Generating...' : 'Download Report'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onRunAnalysis}
            disabled={graphLoading || !prioritiesValid}
            loading={graphLoading}
            icon={!graphLoading ? <Play size={14} /> : undefined}
            title={!prioritiesValid ? 'Priorities must sum to 100%' : undefined}
          >
            {graphLoading ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>
    </div>
  );
}
