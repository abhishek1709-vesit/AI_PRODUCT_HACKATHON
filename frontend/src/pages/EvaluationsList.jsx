import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, Edit2, X, Check, ClipboardList, Loader2 } from 'lucide-react';
import { getEvaluations, createEvaluation, updateEvaluation, deleteEvaluation } from '../services/api/evaluations.js';
import { useToast } from '../components/ui/ToastContext.jsx';
import Button from '../components/ui/Button.jsx';
import Badge, { StatusBadge } from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

export default function EvaluationsList() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  const fetchEvals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError({ message: err.response?.data?.detail || 'Failed to load evaluations.', status: err.response?.status });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      setIsCreating(true);
      setError(null);
      const newEval = await createEvaluation(formData);
      addToast(`"${newEval.name}" created successfully.`, 'success');
      navigate(`/evaluations/${newEval.id}`);
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create evaluation.', 'error');
      setIsCreating(false);
    }
  };

  const handleEditSave = async (id) => {
    try {
      const updated = await updateEvaluation(id, editFormData);
      setEvaluations(evaluations.map(e => e.id === id ? updated : e));
      setEditingId(null);
      addToast('Evaluation updated.', 'success');
    } catch {
      addToast('Failed to update evaluation.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteEvaluation(id);
      setEvaluations(evaluations.filter(e => e.id !== id));
      addToast('Evaluation deleted.', 'info');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete.', 'error');
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Procurement Evaluations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage vendor comparisons and procurement decisions.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowForm(o => !o)}
          icon={<Plus size={15} />}
        >
          New Evaluation
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Create New Evaluation</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="eval-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Evaluation Name <span className="text-red-500">*</span>
              </label>
              <input
                id="eval-name"
                type="text"
                required
                className={inputCls}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. CRM Software Selection 2026"
              />
            </div>
            <div>
              <label htmlFor="eval-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                id="eval-desc"
                className={inputCls}
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional — describe the scope, timeline, or context of this evaluation."
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" size="md" loading={isCreating} icon={!isCreating ? <Plus size={14} /> : undefined}>
                {isCreating ? 'Creating...' : 'Create Evaluation'}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => { setShowForm(false); setFormData({ name: '', description: '' }); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading evaluations..." />
      ) : error ? (
        <ErrorState statusCode={error.status} message={error.message} onRetry={fetchEvals} />
      ) : evaluations.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl">
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="No procurement evaluations yet."
            description="Create your first evaluation to start comparing vendor proposals and making data-driven procurement decisions."
            ctaLabel="Create Evaluation"
            onCta={() => setShowForm(true)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map(ev => (
            <div
              key={ev.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-150"
            >
              {editingId === ev.id ? (
                <div className="p-5 space-y-3">
                  <input type="text" className={inputCls} value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                  <input type="text" className={inputCls} placeholder="Description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
                  <div className="flex gap-2">
                    <button onClick={() => handleEditSave(ev.id)} className="flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 font-medium px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200"><Check size={14} /> Save</button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-sm text-slate-600 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50"><X size={14} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        to={`/evaluations/${ev.id}`}
                        className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {ev.name}
                      </Link>
                      <StatusBadge status={ev.status} />
                    </div>
                    {ev.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{ev.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      Created {new Date(ev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingId(ev.id); setEditFormData({ name: ev.name, description: ev.description || '' }); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      aria-label={`Edit ${ev.name}`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id, ev.name)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      aria-label={`Delete ${ev.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                    <Link
                      to={`/evaluations/${ev.id}`}
                      className="flex items-center gap-1.5 ml-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-md transition-colors"
                    >
                      Open <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
