import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { createRequirement, updateRequirement, deleteRequirement } from '../../services/api/requirements.js';

const PRIORITY_CONFIG = {
  must_have:    { variant: 'danger',  label: 'Must Have' },
  nice_to_have: { variant: 'info',    label: 'Nice to Have' },
  optional:     { variant: 'neutral', label: 'Optional' },
};

const EMPTY_FORM = {
  name: '', description: '', priority: 'must_have',
  category: '', weight: 1.0, minimum_value: '', preferred_value: ''
};

export default function RequirementsPanel({ evaluationId, requirements, setRequirements }) {
  const { addToast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [reqForm, setReqForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!reqForm.name.trim()) return;
    try {
      setSubmitting(true);
      const newReq = await createRequirement(evaluationId, reqForm);
      setRequirements(prev => [...prev, newReq]);
      setReqForm(EMPTY_FORM);
      setFormOpen(false);
      addToast('Requirement added.', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to add requirement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (req) => { setEditingId(req.id); setEditForm(req); };

  const handleEditSave = async (reqId) => {
    try {
      const updated = await updateRequirement(reqId, editForm);
      setRequirements(prev => prev.map(r => r.id === reqId ? updated : r));
      setEditingId(null);
      addToast('Requirement updated.', 'success');
    } catch {
      addToast('Failed to update requirement.', 'error');
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm('Delete this requirement?')) return;
    try {
      await deleteRequirement(reqId);
      setRequirements(prev => prev.filter(r => r.id !== reqId));
      addToast('Requirement deleted.', 'info');
    } catch {
      addToast('Failed to delete requirement.', 'error');
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400';
  const selectCls = 'border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white';

  return (
    <Card
      title={`Requirements (${requirements.length})`}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(c => !c)}
            icon={collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            aria-label={collapsed ? 'Expand requirements' : 'Collapse requirements'}
          >
            {collapsed ? 'Show' : 'Hide'}
          </Button>
          {!collapsed && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(o => !o)}
              icon={<Plus size={14} />}
            >
              Add
            </Button>
          )}
        </div>
      }
    >
      {!collapsed && (
        <div className="space-y-4">
          {/* Add form */}
          {formOpen && (
            <form
              onSubmit={handleAdd}
              className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3"
            >
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">New Requirement</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text" required placeholder="Name *"
                  className={`${inputCls} sm:col-span-2`}
                  value={reqForm.name}
                  onChange={e => setReqForm({ ...reqForm, name: e.target.value })}
                />
                <input
                  type="text" placeholder="Description"
                  className={`${inputCls} sm:col-span-2`}
                  value={reqForm.description}
                  onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                />
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Priority</label>
                  <select className={`${selectCls} w-full`} value={reqForm.priority} onChange={e => setReqForm({ ...reqForm, priority: e.target.value })}>
                    <option value="must_have">Must Have</option>
                    <option value="nice_to_have">Nice to Have</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Category</label>
                  <input type="text" placeholder="e.g. Security" className={inputCls} value={reqForm.category} onChange={e => setReqForm({ ...reqForm, category: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Weight</label>
                  <input type="number" step="0.1" min="0" placeholder="1.0" className={inputCls} value={reqForm.weight} onChange={e => setReqForm({ ...reqForm, weight: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Minimum Value</label>
                  <input type="text" placeholder="Minimum acceptable" className={inputCls} value={reqForm.minimum_value} onChange={e => setReqForm({ ...reqForm, minimum_value: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Preferred Value</label>
                  <input type="text" placeholder="Ideal value" className={inputCls} value={reqForm.preferred_value} onChange={e => setReqForm({ ...reqForm, preferred_value: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  Add Requirement
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setFormOpen(false); setReqForm(EMPTY_FORM); }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* List */}
          {requirements.length === 0 ? (
            <EmptyState
              title="No requirements defined yet."
              description="Add requirements to define what you expect from vendor proposals."
              ctaLabel="Add First Requirement"
              onCta={() => setFormOpen(true)}
            />
          ) : (
            <div className="space-y-2">
              {requirements.map(req => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                  {editingId === req.id ? (
                    <div className="space-y-2">
                      <input
                        type="text" className={inputCls} value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <div className="flex items-center gap-2">
                        <select className={selectCls} value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                          <option value="must_have">Must Have</option>
                          <option value="nice_to_have">Nice to Have</option>
                          <option value="optional">Optional</option>
                        </select>
                        <input
                          type="text" placeholder="Category" className={`${inputCls} flex-1`}
                          value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        />
                        <button onClick={() => handleEditSave(req.id)} className="text-emerald-600 hover:text-emerald-700 p-1" aria-label="Save"><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Cancel"><X size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-800">{req.name}</span>
                          <Badge variant={PRIORITY_CONFIG[req.priority]?.variant || 'neutral'} size="xs">
                            {PRIORITY_CONFIG[req.priority]?.label || req.priority}
                          </Badge>
                          {req.category && (
                            <Badge variant="neutral" size="xs">{req.category}</Badge>
                          )}
                          {req.weight && req.weight !== 1 && (
                            <Badge variant="neutral" size="xs">Weight {req.weight}</Badge>
                          )}
                        </div>
                        {req.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{req.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditInit(req)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          aria-label={`Edit ${req.name}`}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          aria-label={`Delete ${req.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
