import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../services/ticketsApi';

export default function Notifications() {
  const [items, setItems] = useState([]);

  const load = () => notificationsApi.list().then((res) => setItems(res.data));

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await notificationsApi.markAllRead();
    load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">Updates for tickets you are involved in</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={markAll}>Mark all as read</button>
      </div>
      <div className="card">
        {items.map((n) => (
          <div key={n.id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
            <div className="notif-dot" />
            <div>
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <span className="text-muted">{new Date(n.createdAt).toLocaleString()}</span>
              {n.ticketId && (
                <p style={{ marginTop: 6 }}>
                  <Link to={`/tickets/${n.ticketId}`} className="link-sm">Open ticket →</Link>
                </p>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="empty-state">No notifications.</p>}
      </div>
    </>
  );
}
