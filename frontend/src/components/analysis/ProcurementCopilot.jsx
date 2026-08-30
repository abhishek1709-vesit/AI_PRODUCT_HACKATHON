import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, ChevronDown, ChevronUp, FileText, MinusSquare, PlusSquare } from 'lucide-react';
import { useToast } from '../ui/ToastContext.jsx';
import { sendCopilotMessage, getCopilotHistory } from '../../services/api/evaluations.js';
import EvidenceCard from './EvidenceCard.jsx';
import ProposalPdfViewer from './ProposalPdfViewer.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ProcurementCopilot({ evaluationId, vendors = [], hasPendingProposals = false, vendorProposalMap = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const { addToast } = useToast();
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      loadHistory();
    }
  }, [isOpen, historyLoaded, evaluationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await getCopilotHistory(evaluationId);
      setMessages(history);
      setHistoryLoaded(true);
    } catch (err) {
      console.error(err);
      addToast('Failed to load chat history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const query = customQuery || input;
    
    if (hasPendingProposals) {
      addToast('Proposal processing is still in progress.', 'warning');
      return;
    }
    if (!query.trim()) return;

    const userMessage = {
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendCopilotMessage(evaluationId, query);
      
      const assistantMessage = {
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        addToast('AI rate limit reached. Please wait a moment.', 'warning');
      } else {
        addToast(err.response?.data?.detail || 'Failed to get a response.', 'error');
      }
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I couldn't process that question right now. Please try again.",
        isError: true,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getVendorName = (vid) => vendors.find(v => v.id === vid)?.name || 'Unknown Vendor';

  const SUGGESTIONS = [
    "Why was this vendor recommended?",
    "What are the biggest risks?",
    "Compare the top two vendors",
    "What should I negotiate?"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105"
        aria-label="Open Procurement Copilot"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col w-[380px] sm:w-[450px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" style={{ height: '600px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <div>
            <h3 className="font-semibold text-sm">Procurement Copilot</h3>
            <p className="text-[10px] text-indigo-200">AI assistant for this evaluation</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-indigo-700 rounded-md transition-colors text-indigo-100 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4 opacity-70">
            <Bot size={40} className="text-slate-400" />
            <p className="text-sm text-slate-500">Ask anything about the current evaluation, vendors, scores, or proposals.</p>
            
            <div className="flex flex-col gap-2 w-full mt-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(null, s)}
                  className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 px-3 py-2 rounded-lg text-left transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} className="text-indigo-600" />
              </div>
            )}
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && !msg.isError ? (
                  <div className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
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
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>
              
              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 w-full max-w-sm">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-1">Sources</p>
                  {msg.sources.map((src, idx) => (
                    <EvidenceCard
                      key={idx}
                      vendorName={src.vendor_name || getVendorName(src.vendor_id)}
                      pageNumber={src.page_number}
                      section={src.section}
                      evidence={src.evidence}
                      proposalId={vendorProposalMap[src.vendor_id]}
                      className="!bg-white"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs font-medium">Analyzing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={e => handleSubmit(e)} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || hasPendingProposals}
            placeholder={hasPendingProposals ? "Wait for processing..." : "Ask about this procurement..."}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || hasPendingProposals}
            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shrink-0"
          >
            <Send size={16} className={input.trim() && !loading ? 'ml-0.5' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
}
