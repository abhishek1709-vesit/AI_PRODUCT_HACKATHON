import apiClient from './client';

export const askProcurementAI = async (query, evaluationId) => {
  const response = await apiClient.post(`/api/rag/query`, {
    query,
    evaluation_id: evaluationId,
    top_k: 5
  });
  return response.data;
};
