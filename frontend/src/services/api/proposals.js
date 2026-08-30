import apiClient from './client';

export const getProposalsByEvaluation = async (evaluationId) => {
  const response = await apiClient.get(`/api/evaluations/${evaluationId}/proposals`);
  return response.data;
};

export const getProposalsByVendor = async (vendorId) => {
  const response = await apiClient.get(`/api/vendors/${vendorId}/proposals`);
  return response.data;
};

export const uploadProposal = async (evaluationId, vendorId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post(
    `/api/evaluations/${evaluationId}/vendors/${vendorId}/proposals`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
};

export const deleteProposal = async (id) => {
  await apiClient.delete(`/api/proposals/${id}`);
};

export const processProposal = async (proposalId) => {
  const response = await apiClient.post(`/api/proposals/${proposalId}/process`);
  return response.data;
};

export const getProposalStatus = async (proposalId) => {
  const response = await apiClient.get(`/api/proposals/${proposalId}/status`);
  return response.data;
};

export const generateEmbeddings = async (proposalId) => {
  const response = await apiClient.post(`/api/proposals/${proposalId}/embed`);
  return response.data;
};

export const getEmbeddingStatus = async (proposalId) => {
  const response = await apiClient.get(`/api/proposals/${proposalId}/embedding-status`);
  return response.data;
};

/**
 * Get a short-lived signed URL for viewing a vendor proposal PDF.
 * Returns { proposal_id, vendor_id, file_name, pdf_url }
 */
export const getProposalPdfUrl = async (proposalId) => {
  const response = await apiClient.get(`/api/proposals/${proposalId}/pdf-url`);
  return response.data;
};

