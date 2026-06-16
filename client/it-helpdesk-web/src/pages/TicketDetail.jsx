import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { ticketsApi } from '../services/ticketsApi';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';
import { aiApi } from '../services/ticketsApi';

export default function TicketDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [lookups, setLookups] = useState({ statuses: [] });
  const [agents, setAgents] = useState([]);
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);
  const [statusId, setStatusId] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [aiReply, setAiReply] = useState('');

  const load = () => ticketsApi.get(id).then((res) => {
    setTicket(res.data);
    setStatusId(String(res.data.statusId));
  });

  useEffect(() => {
    load();
    ticketsApi.lookups().then((r) => setLookups(r.data));
    if (hasRole(AppRoles.Admin)) usersApi.list().then((r) => setAgents(r.data.filter((u) => u.roles?.includes('IT Support Agent'))));
  }, [id]);

  if (!ticket) return <p className="text-muted">Loading ticket…</p>;

  const postComment = async () => {
    await ticketsApi.addComment(id, { body: comment, isInternal: internal });
    setComment('');
    load();
  };

  const updateStatus = async () => {
    await ticketsApi.update(id, { statusId: Number(statusId) });
    load();
  };

  const assign = async () => {
    if (!assignTo) return;
    await ticketsApi.assign(id, { assignedToUserId: assignTo, notes: '' });
    load();
  };

  const getAiSuggestion = async () => {
    const { data } = await aiApi.suggest(ticket.title, ticket.description);
    setAiReply(data.suggestedReply);
  };

  return (
    <>
      <Link to="/tickets" className="back-link">← Back to tickets</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">{ticket.referenceNumber}</h1>
          <p className="page-sub">{ticket.title}</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="card">
            <h3 className="card-title">Description</h3>
            <p>{ticket.description}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Comments</h3>
            {ticket.comments?.map((c) => (
              <div key={c.id} className={`comment ${c.isInternal ? 'internal' : 'public'}`}>
                <strong>{c.authorName}</strong> · {new Date(c.createdAt).toLocaleString()}
                <p>{c.body}</p>
              </div>
            ))}
            <textarea className="comment-input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" />
            <div className="comment-actions">
              <button type="button" className="btn btn-primary" onClick={postComment} disabled={!comment.trim()}>Post comment</button>
              {(hasRole(AppRoles.Admin) || hasRole(AppRoles.Agent)) && (
                <label className="checkbox-label"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note</label>
              )}
            </div>
          </div>
          {ticket.attachments?.length > 0 && (
            <div className="card">
              <h3 className="card-title">Attachments</h3>
              {ticket.attachments.map((a) => <p key={a.id}>📎 {a.fileName}</p>)}
            </div>
          )}
        </div>
        <div className="detail-side">
          <div className="card">
            <h3 className="card-title">Details</h3>
            <dl className="detail-list">
              <dt>Status</dt><dd><StatusBadge status={ticket.status} /></dd>
              <dt>Priority</dt><dd><PriorityBadge priority={ticket.priority} /></dd>
              <dt>Category</dt><dd>{ticket.category}</dd>
              <dt>Assigned</dt><dd>{ticket.assignedToName || '—'}</dd>
              <dt>Requester</dt><dd>{ticket.createdByName}</dd>
            </dl>
            <select className="filter-input" style={{ marginTop: 12 }} value={statusId} onChange={(e) => setStatusId(e.target.value)}>
              {lookups.statuses?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="button" className="btn btn-primary" style={{ marginTop: 8, width: '100%' }} onClick={updateStatus}>Update status</button>
            {(hasRole(AppRoles.Admin) || hasRole(AppRoles.Agent)) && (
              <>
                <select className="filter-input" style={{ marginTop: 12 }} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                  <option value="">Assign to agent…</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                </select>
                <button type="button" className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }} onClick={assign}>Assign</button>
              </>
            )}
          </div>
          {(hasRole(AppRoles.Admin) || hasRole(AppRoles.Agent)) && (
            <div className="card">
              <h3 className="card-title">AI suggestion</h3>
              <button type="button" className="btn btn-secondary" onClick={getAiSuggestion}>Generate</button>
              {aiReply && <p style={{ marginTop: 10, fontSize: '.9rem', color: '#475569' }}>{aiReply}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
