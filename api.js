const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}
export const commentApi = {
  getByTicket: (ticketId) => apiFetch(`/api/tickets/${ticketId}/comments`),
  create: (ticketId, data) => apiFetch(`/api/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/api/comments/${id}`, { method: 'DELETE' }),
};
export const ticketApi = {
  getAll: () => apiFetch('/api/tickets'),
  create: (data) => apiFetch('/api/tickets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/api/tickets/${id}`, { method: 'DELETE' }),
};