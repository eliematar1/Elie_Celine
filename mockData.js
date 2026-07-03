import { useState, useEffect } from 'react';
import { ticketApi } from '../api';

export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketApi.getAll();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return { tickets, loading, error, refetch: fetchTickets };
}

export const CATEGORIES = ['Hardware', 'Software', 'Network', 'Email', 'Access Request', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

export const CATEGORY_CHART = [
  { label: 'Software', value: 32, color: '#3b82f6' },
  { label: 'Hardware', value: 18, color: '#8b5cf6' },
  { label: 'Network', value: 14, color: '#06b6d4' },
  { label: 'Email', value: 22, color: '#f59e0b' },
  { label: 'Access', value: 9, color: '#10b981' },
  { label: 'Other', value: 5, color: '#64748b' },
];

export const STATS = {
  open: 24,
  inProgress: 12,
  pending: 5,
  resolvedMonth: 89,
};