import apiClient from './client';

export const getEvaluations = async () => {
  const response = await apiClient.get('/api/evaluations');
  return response.data;
};

export const getEvaluation = async (id) => {
  const response = await apiClient.get(`/api/evaluations/${id}`);
  return response.data;
};

export const createEvaluation = async (data) => {
  const response = await apiClient.post('/api/evaluations', data);
  return response.data;
};

export const updateEvaluation = async (id, data) => {
  const response = await apiClient.put(`/api/evaluations/${id}`, data);
  return response.data;
};

export const deleteEvaluation = async (id) => {
  await apiClient.delete(`/api/evaluations/${id}`);
};

export const analyzeEvaluation = async (id, query, priorities = null) => {
  const payload = { query };
  if (priorities) {
    payload.priorities = priorities;
  }
  const response = await apiClient.post(`/api/evaluations/${id}/analyze`, payload);
  return response.data;
};

export const simulateEvaluation = async (id, priorities, previous_priorities = null) => {
  const payload = { priorities };
  if (previous_priorities) {
    payload.previous_priorities = previous_priorities;
  }
  const response = await apiClient.post(`/api/evaluations/${id}/simulate`, payload);
  return response.data;
};

export const downloadReport = async (id) => {
  const response = await apiClient.get(`/api/evaluations/${id}/report`, {
    responseType: 'blob', // Important for handling binary data
  });
  
  // Create a URL for the blob
  const url = window.URL.createObjectURL(new Blob([response.data]));
  
  // Create a temporary anchor tag to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `procurement_report_${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const sendCopilotMessage = async (evaluationId, message) => {
  const response = await apiClient.post(`/api/evaluations/${evaluationId}/chat`, { message });
  return response.data;
};

export const getCopilotHistory = async (evaluationId) => {
  const response = await apiClient.get(`/api/evaluations/${evaluationId}/chat/history`);
  return response.data;
};
