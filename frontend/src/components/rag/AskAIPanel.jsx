import React, { useState } from 'react';
import { Search, Loader2, MessageSquare } from 'lucide-react';
import { SectionCard } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { askProcurementAI } from '../../services/api/rag.js';

const CONFIDENCE_MAP = {
  high:   { variant: 'success',  label: 'High Confidence' },
  medium: { variant: 'warning',  label: 'Medium Confidence' },
  low:    { variant: 'danger',   label: 'Low Confidence' },
};

const SUGGESTED_QUERIES = [
  'What are the termination conditions?',
  'What SLA penalties apply?',
  'What are the payment terms?',
];

export default function AskAIPanel({ evaluationId, vendors = [], hasPendingProposals = false }) {
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown Vendor';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasPendingProposals) {
      addToast('Proposal processing is still in progress. Please wait until it is ready.', 'warning');
      return;
    }
    if (!query.trim()) return;
    try {
      setLoading(true);
      setResult(null);
      const res = await askProcurementAI(query, evaluationId);
      setResult(res);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        addToast('AI rate limit reached. Please wait a moment before trying again.', 'warning');
      } else {
        addToast(err.response?.data?.detail || 'Failed to query the AI.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard
      title="Ask Procurement AI"
      subtitle="Semantic search across all uploaded vendor proposals"
    >
      <div className="space-y-4">
        {/* Suggested queries */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q)}
              className="text-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2" role="search">
          <label htmlFor="ai-query" className="sr-only">Ask procurement AI</label>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="ai-query"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={loading || hasPendingProposals}
              placeholder={hasPendingProposals ? "Wait for proposals to finish processing..." : "e.g. What are the SLA terms for TechCloud?"}
              className="w-full border border-slate-300 rounded-md pl-8 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !query.trim() || hasPendingProposals}
            loading={loading}
            icon={!loading ? <MessageSquare size={14} /> : undefined}
          >
            {loading ? 'Searching...' : 'Ask AI'}
          </Button>
        </form>

        {/* Result */}
        {result && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            {/* Answer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Answer</p>
              {result.confidence && (
                <Badge
                  variant={CONFIDENCE_MAP[result.confidence]?.variant || 'neutral'}
                  size="xs"
                >
                  {CONFIDENCE_MAP[result.confidence]?.label || result.confidence}
                </Badge>
              )}
            </div>

            <div className="px-4 py-4">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{result.answer}</p>
            </div>

            {/* Sources */}
            {result.sources?.length > 0 && (
              <div className="border-t border-slate-200 px-4 py-3 bg-white">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Evidence Sources ({result.sources.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.sources.map((src, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-700 truncate">{getVendorName(src.vendor_id)}</p>
                        <p className="text-slate-500 mt-0.5">
                          {src.page_number && `Page ${src.page_number}`}
                          {src.page_number && src.section && ' · '}
                          {src.section && <span className="truncate">{src.section}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
