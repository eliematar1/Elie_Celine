import { api } from './api';

export const ticketsApi = {
  list: (params) => api.get('/api/tickets', { params }),
  get: (id) => api.get(`/api/tickets/${id}`),
  create: (data) => api.post('/api/tickets', data),
  update: (id, data) => api.put(`/api/tickets/${id}`, data),
  remove: (id) => api.delete(`/api/tickets/${id}`),
  assign: (id, data) => api.post(`/api/tickets/${id}/assign`, data),
  addComment: (id, data) => api.post(`/api/tickets/${id}/comments`, data),
  upload: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/tickets/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  lookups: () => api.get('/api/tickets/lookups'),
  agents: () => api.get('/api/users/agents'),
};

export const dashboardApi = {
  get: () => api.get('/api/dashboard'),
};

export const notificationsApi = {
  list: () => api.get('/api/notifications'),
  markAllRead: () => api.post('/api/notifications/mark-all-read'),
  unreadCount: () => api.get('/api/notifications/unread-count'),
};

export const reportsApi = {
  get: () => api.get('/api/reports'),
  exportCsv: () => api.get('/api/reports/export/csv', { responseType: 'blob' }),
  exportPdf: () => api.get('/api/reports/export/pdf', { responseType: 'blob' }),
  exportExcel: () => api.get('/api/reports/export/excel', { responseType: 'blob' }),
};

export const aiApi = {
  suggest: (title, description) => api.post('/api/ai/suggest', { title, description }),
  chat: (question) => api.post('/api/ai/chat', { question }),
  summary: (title, description, statusHistory) => api.post('/api/ai/summary', { title, description, statusHistory }),
  troubleshoot: (title, description, category) => api.post('/api/ai/troubleshoot', { title, description, category }),
};