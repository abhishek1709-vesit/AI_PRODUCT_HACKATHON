import React, { useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import ProposalPdfViewer from './ProposalPdfViewer.jsx';

/**
 * EvidenceCard — displays evidence from vendor proposals.
 * 
 * When proposalId is provided, the card is clickable and opens
 * a PDF viewer at the cited page. This is the core evidence
 * traceability feature: AI claim → evidence → source document.
 *
 * Props:
 *   vendorName  — string
 *   fileName    — string
 *   pageNumber  — number
 *   section     — string
 *   evidence    — string, the AI-cited quote
 *   proposalId  — string (UUID) — enables PDF viewer when present
 *   className   — string
 */
export default function EvidenceCard({
  vendorName,
  fileName,
  pageNumber,
  section,
  evidence,
  proposalId,
  className = '',
}) {
  const [viewerOpen, setViewerOpen] = useState(false);

  const hasRealEvidence = evidence && evidence.trim() !== '' &&
    !evidence.toLowerCase().includes('see proposal chunks');
  
  const isClickable = Boolean(proposalId);
  const hasLocation = pageNumber || section;

  const openViewer = () => {
    if (isClickable) setViewerOpen(true);
  };

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setViewerOpen(true);
    }
  };

  return (
    <>
      <div
        className={`
          bg-slate-50 border rounded-lg overflow-hidden text-sm transition-all duration-150
          ${isClickable
            ? 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer hover:shadow-sm group'
            : 'border-slate-200'
          }
          ${className}
        `}
        onClick={openViewer}
        onKeyDown={handleKeyDown}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        aria-label={isClickable
          ? `View source: ${vendorName || 'Vendor'} proposal${pageNumber ? ` page ${pageNumber}` : ''}${section ? `, ${section}` : ''}`
          : undefined
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs">
            <FileText
              size={13}
              className={`flex-shrink-0 transition-colors ${isClickable ? 'text-indigo-500 group-hover:text-indigo-700' : 'text-indigo-500'}`}
              aria-hidden="true"
            />
            {vendorName && (
              <span className="font-semibold text-slate-700 truncate">{vendorName}</span>
            )}
            {vendorName && hasLocation && (
              <span className="text-slate-300" aria-hidden="true">·</span>
            )}
            {pageNumber && (
              <span className="text-slate-600 font-medium">Page {pageNumber}</span>
            )}
            {section && (
              <>
                {pageNumber && <span className="text-slate-300" aria-hidden="true">·</span>}
                <span className="text-slate-500 truncate max-w-[180px]">{section}</span>
              </>
            )}
            {!hasLocation && !vendorName && (
              <span className="text-slate-400 italic">Evidence location unavailable</span>
            )}
          </div>

          {isClickable && (
            <ExternalLink
              size={12}
              className="text-indigo-400 group-hover:text-indigo-600 flex-shrink-0 transition-colors"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Body */}
        <div className="px-3 py-2.5">
          {hasRealEvidence ? (
            <p className="text-xs text-slate-600 italic leading-relaxed">
              &ldquo;{evidence}&rdquo;
            </p>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText size={11} aria-hidden="true" />
              <span>Evidence unavailable</span>
            </div>
          )}

          {isClickable && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                View source →
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer modal — lazy, only rendered when open */}
      {viewerOpen && (
        <ProposalPdfViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          proposalId={proposalId}
          initialPage={pageNumber}
          vendorName={vendorName}
          evidenceSection={section}
          evidenceQuote={hasRealEvidence ? evidence : null}
        />
      )}
    </>
  );
}
