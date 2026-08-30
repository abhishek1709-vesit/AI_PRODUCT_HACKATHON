import React, { useState } from 'react';
import { Search, Loader2, MessageSquare } from 'lucide-react';
import { SectionCard } from '../ui/Card.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
              <div className="markdown-body text-sm text-slate-800 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-slate-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-4 first:mt-0 text-slate-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-slate-900" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                    a: ({node, ...props}) => <a className="text-indigo-600 hover:underline font-medium" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-slate-100 p-2 rounded text-[13px] text-slate-700 overflow-x-auto mb-3 last:mb-0" {...props} />,
                    code: ({node, className, children, ...props}) => <code className={`${className || ''} bg-slate-100 px-1.5 py-0.5 rounded text-[13px] text-slate-700`} {...props}>{children}</code>,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-3 italic text-slate-600 mb-3 last:mb-0" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto mb-3 last:mb-0"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
                    th: ({node, ...props}) => <th className="px-3 py-2 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />,
                    td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 border-b border-slate-100" {...props} />
                  }}
                >
                  {result.answer}
                </ReactMarkdown>
              </div>
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
                        <p className="font-semibold text-slate-700 truncate">{src.vendor_name || getVendorName(src.vendor_id)}</p>
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
