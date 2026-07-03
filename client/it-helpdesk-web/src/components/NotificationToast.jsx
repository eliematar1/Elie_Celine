import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/ticketsApi';

export default function NotificationToast({ onCountChange }) {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const lastPollRef = useRef(new Date().toISOString());
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    const poll = async () => {
      try {
        const since = lastPollRef.current;
        const { data } = await notificationsApi.poll(since);
        onCountChange?.(data.count);

        const fresh = (data.items || []).filter((n) => !n.isRead && !seenIdsRef.current.has(n.id));
        if (fresh.length) {
          fresh.forEach((n) => seenIdsRef.current.add(n.id));
          setToasts((prev) => [...fresh.map((n) => ({ ...n, key: n.id })), ...prev].slice(0, 4));
        }
        lastPollRef.current = new Date().toISOString();
      } catch {
        /* ignore poll errors */
      }
    };

    poll();
    const id = setInterval(poll, 12000);
    return () => clearInterval(id);
  }, [onCountChange]);

  const dismiss = (key) => setToasts((prev) => prev.filter((t) => t.key !== key));

  const open = (toast) => {
    dismiss(toast.key);
    if (toast.ticketId) navigate(`/tickets/${toast.ticketId}`);
    else navigate('/notifications');
  };

  useEffect(() => {
    if (!toasts.length) return undefined;
    const t = setTimeout(() => setToasts((prev) => prev.slice(0, -1)), 8000);
    return () => clearTimeout(t);
  }, [toasts]);

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.key} className="toast-card" role="alert">
          <button type="button" className="toast-close" onClick={() => dismiss(t.key)} aria-label="Dismiss">×</button>
          <strong>{t.title}</strong>
          <p>{t.message}</p>
          <button type="button" className="toast-action" onClick={() => open(t)}>View</button>
        </div>
      ))}
    </div>
  );
}
