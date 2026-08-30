import apiClient from './client';

export const getVendors = async (evaluationId) => {
  const response = await apiClient.get(`/api/evaluations/${evaluationId}/vendors`);
  return response.data;
};

export const getVendor = async (id) => {
  const response = await apiClient.get(`/api/vendors/${id}`);
  return response.data;
};

export const createVendor = async (evaluationId, data) => {
  const response = await apiClient.post(`/api/evaluations/${evaluationId}/vendors`, data);
  return response.data;
};

export const updateVendor = async (id, data) => {
  const response = await apiClient.put(`/api/vendors/${id}`, data);
  return response.data;
};

export const deleteVendor = async (id) => {
  await apiClient.delete(`/api/vendors/${id}`);
};
