import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { TICKETS } from '../data/mockData';

export default function TicketDetail() {
  const { id } = useParams();
  const ticket = TICKETS.find((t) => String(t.id) === id);

  if (!ticket) {
    return (
      <div className="card">
        <h1>Ticket not found</h1>
        <Link to="/tickets">← Back to list</Link>
      </div>
    );
  }

  return (
    <>
      <Link to="/tickets" className="back-link">← Back to tickets</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">{ticket.ref}</h1>
          <p className="page-sub">{ticket.title}</p>
        </div>
        <button type="button" className="btn btn-primary">Assign agent</button>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="card">
            <h3 className="card-title">Description</h3>
            <p>{ticket.description}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Comments</h3>
            <div className="comment public">
              <strong>{ticket.requester}</strong> · {ticket.created}
              <p>Issue started after recent update. Please advise.</p>
            </div>
            <div className="comment internal">
              <strong>Agent (internal)</strong> · Today
              <p>Checking logs and VPN configuration.</p>
            </div>
            <textarea className="comment-input" rows={3} placeholder="Add a comment…" />
            <div className="comment-actions">
              <button type="button" className="btn btn-primary">Post comment</button>
              <label className="checkbox-label"><input type="checkbox" /> Internal note</label>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Attachments</h3>
            <p className="text-muted">📎 screenshot.png · 📎 error-log.txt</p>
            <button type="button" className="btn btn-secondary">Upload file</button>
          </div>
        </div>
        <div className="detail-side">
          <div className="card">
            <h3 className="card-title">Details</h3>
            <dl className="detail-list">
              <dt>Status</dt><dd><StatusBadge status={ticket.status} /></dd>
              <dt>Priority</dt><dd><PriorityBadge priority={ticket.priority} /></dd>
              <dt>Category</dt><dd>{ticket.category}</dd>
              <dt>Assigned</dt><dd>{ticket.agent}</dd>
              <dt>Requester</dt><dd>{ticket.requester}</dd>
            </dl>
            <select className="filter-input" style={{ marginTop: 12 }}>
              {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" style={{ marginTop: 8, width: '100%' }}>Update status</button>
          </div>
          <div className="card">
            <h3 className="card-title">Activity</h3>
            <ul className="timeline">
              <li><span>May 24</span> Status → {ticket.status}</li>
              <li><span>May 23</span> Ticket created</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
