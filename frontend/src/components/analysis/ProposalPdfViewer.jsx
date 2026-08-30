import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { getProposalPdfUrl } from '../../services/api/proposals.js';

// Configure PDF.js worker — use the CDN matching the installed pdfjs-dist version
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

/**
 * ProposalPdfViewer
 *
 * A large modal PDF viewer that opens vendor proposal PDFs at a specific page.
 * Used for evidence traceability: AI claim → evidence → source document.
 *
 * Props:
 *   isOpen          — boolean, controls visibility
 *   onClose         — () => void
 *   proposalId      — string, the proposal to load
 *   initialPage     — number, page to open at (1-indexed, defaults to 1)
 *   vendorName      — string, shown in the header
 *   evidenceSection — string, e.g. "SLA" (shown in header)
 *   evidenceQuote   — string, the AI-cited quote (shown in header)
 */
export default function ProposalPdfViewer({
  isOpen,
  onClose,
  proposalId,
  initialPage = 1,
  vendorName,
  evidenceSection,
  evidenceQuote,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [scale, setScale] = useState(1.2);
  const [pageInput, setPageInput] = useState(String(initialPage || 1));
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Reset & fetch URL when viewer opens
  useEffect(() => {
    if (!isOpen || !proposalId) return;

    setNumPages(null);
    setUrlError(null);
    setPdfUrl(null);
    const page = initialPage && initialPage > 0 ? initialPage : 1;
    setCurrentPage(page);
    setPageInput(String(page));

    setUrlLoading(true);
    getProposalPdfUrl(proposalId)
      .then(data => {
        setPdfUrl(data.pdf_url);
      })
      .catch(err => {
        console.error('Failed to get PDF URL:', err);
        setUrlError('Unable to load the proposal document. Please try again.');
      })
      .finally(() => setUrlLoading(false));
  }, [isOpen, proposalId, initialPage]);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'ArrowLeft') goToPrevPage();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentPage, numPages]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
    // Clamp to valid range
    const page = initialPage && initialPage > 0 ? Math.min(initialPage, total) : 1;
    setCurrentPage(page);
    setPageInput(String(page));
  }, [initialPage]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(p => {
      const next = Math.max(1, p - 1);
      setPageInput(String(next));
      return next;
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(p => {
      const next = numPages ? Math.min(numPages, p + 1) : p;
      setPageInput(String(next));
      return next;
    });
  }, [numPages]);

  const handlePageInput = (e) => {
    const val = e.target.value;
    setPageInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= (numPages || Infinity)) {
      setCurrentPage(parsed);
    }
  };

  const zoomIn = () => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)));

  // Click backdrop to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Evidence viewer — ${vendorName || 'Vendor'} Proposal`}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(900px, 95vw)', height: 'min(92vh, 900px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText size={18} className="text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Proposal Evidence</p>
              <h2 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                {vendorName ? `${vendorName} — Vendor Proposal` : 'Vendor Proposal'}
              </h2>
              {(evidenceSection || evidenceQuote) && (
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {evidenceSection && (
                    <p className="text-xs text-slate-500 font-medium">
                      Evidence source: <span className="font-semibold text-indigo-600">
                        {initialPage ? `Page ${initialPage}` : ''}{initialPage && evidenceSection ? ' · ' : ''}{evidenceSection}
                      </span>
                    </p>
                  )}
                  {evidenceQuote && (
                    <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-2 max-w-xl">
                      &ldquo;{evidenceQuote}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-3">
            {/* Zoom controls */}
            <button
              onClick={zoomOut}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono text-slate-600 min-w-[38px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>

            <div className="w-px h-5 bg-slate-300 mx-1" />

            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Close PDF viewer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── PDF CANVAS ─── */}
        <div className="flex-1 overflow-auto bg-slate-700 flex flex-col items-center py-6 gap-4">
          {urlLoading && (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm font-medium">Loading proposal...</p>
            </div>
          )}

          {urlError && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <p className="text-white font-semibold text-base">Unable to load document</p>
              <p className="text-slate-300 text-sm leading-relaxed">{urlError}</p>
            </div>
          )}

          {pdfUrl && !urlLoading && !urlError && (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => {
                console.error('PDF load error:', err);
                setUrlError('The PDF document could not be rendered. It may be damaged or unavailable.');
              }}
              loading={
                <div className="flex flex-col items-center justify-center h-64 text-slate-300 gap-3">
                  <Loader2 size={28} className="animate-spin" />
                  <p className="text-sm">Rendering document...</p>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-64 text-center px-8 gap-2 text-white">
                  <AlertCircle size={24} className="text-red-400" />
                  <p className="text-sm">Failed to render PDF.</p>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center h-64 text-slate-300 gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    <p className="text-sm">Loading page {currentPage}...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-64 text-center gap-2 text-white px-4">
                    <AlertCircle size={20} className="text-red-400" />
                    <p className="text-sm">
                      {numPages && currentPage > numPages
                        ? `Page ${currentPage} is not available in this document (${numPages} pages total).`
                        : `Could not load page ${currentPage}.`}
                    </p>
                  </div>
                }
              />
            </Document>
          )}
        </div>

        {/* ─── FOOTER NAVIGATION ─── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={pageInput}
              onChange={handlePageInput}
              onBlur={() => {
                // Reset to valid value on blur
                const parsed = parseInt(pageInput, 10);
                if (isNaN(parsed) || parsed < 1 || (numPages && parsed > numPages)) {
                  setPageInput(String(currentPage));
                }
              }}
              className="w-12 text-center px-1 py-0.5 border border-slate-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Current page number"
            />
            <span>of</span>
            <span className="font-semibold text-slate-800">{numPages ?? '—'}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={!numPages || currentPage >= numPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
