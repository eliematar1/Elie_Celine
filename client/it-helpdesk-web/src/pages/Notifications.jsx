import { useEffect, useState } from 'react';
import { notificationsApi } from '../services/ticketsApi';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.list();
      setItems((data || []).map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        unread: !item.isRead,
        time: new Date(item.createdAt).toLocaleString(),
      })));
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const onNotificationsUpdated = () => loadNotifications();
    window.addEventListener('notifications-updated', onNotificationsUpdated);
    return () => window.removeEventListener('notifications-updated', onNotificationsUpdated);
  }, []);

  const handleMarkAllRead = async () => {
    setBusy(true);
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">Ticket updates and assignments</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleMarkAllRead} disabled={busy}>
          {busy ? 'Working…' : 'Mark all as read'}
        </button>
      </div>
      <div className="card">
        {loading ? (
          <p className="text-muted">Loading notifications…</p>
        ) : items.length === 0 ? (
          <p className="text-muted">No notifications yet.</p>
        ) : items.map((n) => (
          <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
            <div className="notif-dot" />
            <div>
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <span className="text-muted">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
