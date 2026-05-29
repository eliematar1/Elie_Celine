import { NOTIFICATIONS } from '../data/mockData';

export default function Notifications() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">Ticket updates and assignments</p>
        </div>
        <button type="button" className="btn btn-secondary">Mark all as read</button>
      </div>
      <div className="card">
        {NOTIFICATIONS.map((n) => (
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
