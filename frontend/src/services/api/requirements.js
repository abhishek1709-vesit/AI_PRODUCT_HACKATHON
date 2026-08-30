import apiClient from './client';

export const getRequirements = async (evaluationId) => {
  const response = await apiClient.get(`/api/evaluations/${evaluationId}/requirements`);
  return response.data;
};

export const createRequirement = async (evaluationId, data) => {
  const response = await apiClient.post(`/api/evaluations/${evaluationId}/requirements`, data);
  return response.data;
};

export const updateRequirement = async (id, data) => {
  const response = await apiClient.put(`/api/requirements/${id}`, data);
  return response.data;
};

export const deleteRequirement = async (id) => {
  await apiClient.delete(`/api/requirements/${id}`);
};
