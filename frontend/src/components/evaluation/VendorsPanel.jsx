import React, { useRef, useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, FileText, Upload, Loader2, Play, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { createVendor, updateVendor, deleteVendor } from '../../services/api/vendors.js';
import { uploadProposal, deleteProposal, processProposal, generateEmbeddings } from '../../services/api/proposals.js';

const PROCESSING_STATUS = {
  uploaded:   { variant: 'info',    label: 'Uploaded' },
  processing: { variant: 'warning', label: 'Processing' },
  completed:  { variant: 'success', label: 'Processed' },
  embedding:  { variant: 'purple',  label: 'Embedding' },
  ready:      { variant: 'success', label: 'Ready' },
  failed:     { variant: 'danger',  label: 'Failed' },
};

export default function VendorsPanel({
  evaluationId,
  vendors, setVendors,
  proposals, setProposals,
  chunkCounts, setChunkCounts,
  embedCounts, setEmbedCounts,
}) {
  const { addToast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: '', contact_info: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingVendorId, setUploadingVendorId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [embeddingId, setEmbeddingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef({});

  const inputCls = 'w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400';

  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) return;
    try {
      setSubmitting(true);
      const v = await createVendor(evaluationId, vendorForm);
      setVendors(prev => [...prev, v]);
      setVendorForm({ name: '', contact_info: '' });
      setFormOpen(false);
      addToast(`Vendor "${v.name}" added.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to add vendor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (vendorId) => {
    try {
      const updated = await updateVendor(vendorId, editForm);
      setVendors(prev => prev.map(v => v.id === vendorId ? updated : v));
      setEditingId(null);
      addToast('Vendor updated.', 'success');
    } catch {
      addToast('Failed to update vendor.', 'error');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Delete this vendor and all their proposals?')) return;
    try {
      await deleteVendor(vendorId);
      setVendors(prev => prev.filter(v => v.id !== vendorId));
      addToast('Vendor deleted.', 'info');
    } catch {
      addToast('Failed to delete vendor.', 'error');
    }
  };

  const handleFileUpload = async (vendorId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.type !== 'application/pdf') { addToast('Only PDF files are supported.', 'warning'); return; }
    if (file.size > 10 * 1024 * 1024) { addToast('File exceeds maximum size of 10 MB.', 'warning'); return; }
    
    let uploadedProposal = null;
    
    // 1. Upload
    try {
      setUploadingVendorId(vendorId);
      uploadedProposal = await uploadProposal(evaluationId, vendorId, file);
      setProposals(prev => [...prev, uploadedProposal]);
      addToast(`"${file.name}" uploaded successfully.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Upload failed.', 'error');
      setUploadingVendorId(null);
      return;
    } finally {
      setUploadingVendorId(null);
    }
    
    // 2. Process
    try {
      setProcessingId(uploadedProposal.id);
      setProposals(prev => prev.map(p => p.id === uploadedProposal.id ? { ...p, processing_status: 'processing' } : p));
      
      const processResult = await processProposal(uploadedProposal.id);
      setProposals(prev => prev.map(p => p.id === uploadedProposal.id ? { ...p, processing_status: processResult.status } : p));
      setChunkCounts(prev => ({ ...prev, [uploadedProposal.id]: processResult.chunk_count }));
      addToast(`Processed: ${processResult.chunk_count} chunks extracted.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Processing failed. Please retry.', 'error');
      setProposals(prev => prev.map(p => p.id === uploadedProposal.id ? { ...p, processing_status: 'failed' } : p));
      setProcessingId(null);
      return; // Stop pipeline
    } finally {
      setProcessingId(null);
    }
    
    // 3. Embed
    try {
      setEmbeddingId(uploadedProposal.id);
      setProposals(prev => prev.map(p => p.id === uploadedProposal.id ? { ...p, processing_status: 'embedding' } : p));
      
      const embedResult = await generateEmbeddings(uploadedProposal.id);
      setEmbedCounts(prev => ({ ...prev, [uploadedProposal.id]: embedResult.chunks_embedded }));
      setProposals(prev => prev.map(p => p.id === uploadedProposal.id ? { ...p, processing_status: 'ready' } : p));
      addToast(`Ready for AI analysis.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Embeddings could not be generated. Please retry.', 'error');
      // Status remains completed/failed appropriately, but UI will show the retry button
      setProposals(prev => prev.map(p => p.id === uploadedProposal.id ? { ...p, processing_status: 'completed' } : p));
    } finally {
      setEmbeddingId(null);
    }
  };

  const handleDeleteProposal = async (proposalId) => {
    if (!window.confirm('Delete this proposal document?')) return;
    try {
      await deleteProposal(proposalId);
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      addToast('Proposal deleted.', 'info');
    } catch {
      addToast('Failed to delete proposal.', 'error');
    }
  };

  const handleProcess = async (proposalId) => {
    try {
      setProcessingId(proposalId);
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, processing_status: 'processing' } : p));
      const result = await processProposal(proposalId);
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, processing_status: result.status } : p));
      setChunkCounts(prev => ({ ...prev, [proposalId]: result.chunk_count }));
      addToast(`Processed: ${result.chunk_count} chunks extracted.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Processing failed.', 'error');
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, processing_status: 'failed' } : p));
    } finally {
      setProcessingId(null);
    }
  };

  const handleEmbed = async (proposalId) => {
    try {
      setEmbeddingId(proposalId);
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, processing_status: 'embedding' } : p));
      const result = await generateEmbeddings(proposalId);
      setEmbedCounts(prev => ({ ...prev, [proposalId]: result.chunks_embedded }));
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, processing_status: 'ready' } : p));
      addToast(`Generated embeddings for ${result.chunks_embedded} chunks.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Embedding failed.', 'error');
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, processing_status: 'completed' } : p));
    } finally {
      setEmbeddingId(null);
    }
  };

  const getProposalForVendor = (vendorId) => proposals.filter(p => p.vendor_id === vendorId);

  return (
    <Card
      title={`Vendors (${vendors.length})`}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            onClick={() => setCollapsed(c => !c)}
            icon={collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            aria-label={collapsed ? 'Expand vendors' : 'Collapse vendors'}
          >
            {collapsed ? 'Show' : 'Hide'}
          </Button>
          {!collapsed && (
            <Button variant="primary" size="sm" onClick={() => setFormOpen(o => !o)} icon={<Plus size={14} />}>
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
            <form onSubmit={handleAddVendor} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">New Vendor</h4>
              <input type="text" required placeholder="Vendor name *" className={inputCls} value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} />
              <input type="text" placeholder="Contact information" className={inputCls} value={vendorForm.contact_info} onChange={e => setVendorForm({ ...vendorForm, contact_info: e.target.value })} />
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" loading={submitting}>Add Vendor</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {/* Vendor list */}
          {vendors.length === 0 ? (
            <EmptyState
              title="No vendors added yet."
              description="Add vendors to begin comparing proposals."
              ctaLabel="Add First Vendor"
              onCta={() => setFormOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {vendors.map(vendor => {
                const vendorProposals = getProposalForVendor(vendor.id);
                return (
                  <div key={vendor.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Vendor header */}
                    <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                      {editingId === vendor.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="text" className={`${inputCls} flex-1`} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                          <input type="text" className={`${inputCls} flex-1`} placeholder="Contact" value={editForm.contact_info || ''} onChange={e => setEditForm({ ...editForm, contact_info: e.target.value })} />
                          <button onClick={() => handleEditSave(vendor.id)} className="text-emerald-600 hover:text-emerald-700 p-1" aria-label="Save"><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Cancel"><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{vendor.name}</p>
                            {vendor.contact_info && <p className="text-xs text-slate-500 mt-0.5">{vendor.contact_info}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingId(vendor.id); setEditForm(vendor); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors" aria-label={`Edit ${vendor.name}`}><Edit2 size={13} /></button>
                            <button onClick={() => handleDeleteVendor(vendor.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-colors" aria-label={`Delete ${vendor.name}`}><Trash2 size={13} /></button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Proposals */}
                    <div className="p-4 space-y-2">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Proposals</p>

                      {vendorProposals.map(prop => {
                        const statusCfg = PROCESSING_STATUS[prop.processing_status] || { variant: 'neutral', label: prop.processing_status };
                        const isEmbedded = embedCounts[prop.id] > 0 && embedCounts[prop.id] === chunkCounts[prop.id];
                        const isProcessing = processingId === prop.id || prop.processing_status === 'processing';
                        const isEmbedding = embeddingId === prop.id;

                        return (
                          <div key={prop.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-md px-3 py-2.5">
                            <FileText size={14} className="text-indigo-500 flex-shrink-0" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate" title={prop.file_name}>{prop.file_name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant={statusCfg.variant} size="xs">{statusCfg.label}</Badge>
                                {chunkCounts[prop.id] !== undefined && (
                                  <span className="text-[10px] text-slate-400">{chunkCounts[prop.id]} chunks</span>
                                )}
                                {prop.processing_status === 'completed' && (
                                  <Badge variant={isEmbedded ? 'purple' : 'neutral'} size="xs">
                                    {isEmbedded ? '✓ Vectors Ready' : 'No Vectors'}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {prop.processing_status === 'completed' && (
                                <button
                                  onClick={() => handleEmbed(prop.id)}
                                  disabled={isEmbedding || isEmbedded}
                                  className="px-2 py-1 text-[10px] font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  title="Generate vector embeddings"
                                  aria-label="Generate embeddings"
                                >
                                  {isEmbedding ? <Loader2 size={12} className="animate-spin" /> : 'EMBED'}
                                </button>
                              )}
                              <button
                                onClick={() => handleProcess(prop.id)}
                                disabled={isProcessing}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Process proposal text"
                                aria-label="Process proposal"
                              >
                                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                              </button>
                              <button
                                onClick={() => handleDeleteProposal(prop.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                aria-label="Delete proposal"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Upload area */}
                      <div>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          ref={el => fileInputRefs.current[vendor.id] = el}
                          onChange={e => handleFileUpload(vendor.id, e)}
                          aria-label={`Upload proposal PDF for ${vendor.name}`}
                        />
                        <button
                          onClick={() => fileInputRefs.current[vendor.id]?.click()}
                          disabled={uploadingVendorId === vendor.id}
                          className="w-full flex flex-col items-center justify-center gap-1.5 py-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                          aria-label={`Upload PDF proposal for ${vendor.name}`}
                        >
                          {uploadingVendorId === vendor.id ? (
                            <>
                              <Loader2 size={16} className="text-indigo-500 animate-spin" />
                              <span className="text-xs text-indigo-600 font-medium">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                              <span className="text-xs text-slate-500 group-hover:text-indigo-600 font-medium transition-colors">
                                Upload PDF Proposal
                              </span>
                              <span className="text-[10px] text-slate-400">Max 10 MB</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
