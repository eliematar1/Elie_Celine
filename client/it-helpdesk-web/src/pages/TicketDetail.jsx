import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { ticketsApi } from '../services/ticketsApi';
import { usersApi, settingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';

function formatDuration(hours) {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24 * 10) / 10} days`;
}

function timelineIcon(type) {
  const map = { status: '◉', assignment: '👤', comment: '💬', attachment: '📎' };
  return map[type] ?? '•';
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [lookups, setLookups] = useState({ statuses: [], categories: [], priorities: [] });
  const [agents, setAgents] = useState([]);
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);
  const [statusId, setStatusId] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [escalate, setEscalate] = useState(false);
  const [assignNotes, setAssignNotes] = useState('');
  const [editForm, setEditForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [maxAttachmentMb, setMaxAttachmentMb] = useState(10);

  const load = () => ticketsApi.get(id).then((res) => {
    setTicket(res.data);
    setStatusId(String(res.data.statusId));
    setEditForm({
      title: res.data.title,
      description: res.data.description,
      categoryId: res.data.categoryId,
      priorityId: res.data.priorityId,
    });
  }).catch(() => setError('Failed to load ticket.'));

  useEffect(() => {
    load();
    ticketsApi.lookups().then((r) => setLookups(r.data));
    settingsApi.get().then((r) => setMaxAttachmentMb(r.data.maxAttachmentSizeMb)).catch(() => {});
    if (hasRole(AppRoles.Admin) || hasRole(AppRoles.Agent)) {
      usersApi.agents().then((r) => setAgents(r.data)).catch(() => {});
    }
  }, [id]);

  if (!ticket) return <p className="text-muted">Loading ticket…</p>;

  const p = ticket.permissions || {};
  const isStaff = hasRole(AppRoles.Admin) || hasRole(AppRoles.Agent);
  const isManagerView = hasRole(AppRoles.Manager) && !hasRole(AppRoles.Admin);

  const postComment = async () => {
    setError('');
    try {
      await ticketsApi.addComment(id, { body: comment, isInternal: internal });
      setComment('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.');
    }
  };

  const updateStatus = async () => {
    setError('');
    try {
      await ticketsApi.update(id, { statusId: Number(statusId) });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const assign = async () => {
    if (!assignTo) return;
    setError('');
    try {
      await ticketsApi.assign(id, { assignedToUserId: assignTo, notes: assignNotes, isEscalation: escalate });
      setAssignTo('');
      setAssignNotes('');
      setEscalate(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign ticket.');
    }
  };

  const saveEdit = async () => {
    setError('');
    setBusy(true);
    try {
      await ticketsApi.update(id, editForm);
      setEditing(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setBusy(false);
    }
  };

  const deleteTicket = async () => {
    if (!window.confirm('Delete this ticket permanently?')) return;
    setError('');
    try {
      await ticketsApi.remove(id);
      navigate('/tickets');
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete this ticket.');
    }
  };

  const reopenTicket = async () => {
    setError('');
    try {
      await ticketsApi.reopen(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reopen ticket.');
    }
  };

  const duplicateTicket = async () => {
    setError('');
    try {
      const { data } = await ticketsApi.duplicate(id);
      navigate(`/tickets/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to duplicate ticket.');
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const maxBytes = maxAttachmentMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File exceeds ${maxAttachmentMb} MB limit.`);
      e.target.value = '';
      return;
    }
    try {
      await ticketsApi.upload(id, file);
      e.target.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    }
  };

  const closedStatuses = lookups.statuses?.filter((s) => s.isClosed || s.name === 'Resolved') || [];
  const activeStatuses = lookups.statuses?.filter((s) => !s.isClosed && s.name !== 'Resolved') || [];

  return (
    <>
      <Link to="/tickets" className="back-link">← Back to tickets</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">{ticket.referenceNumber}</h1>
          <p className="page-sub">{ticket.title}</p>
        </div>
        <div className="btn-group">
          {p.canDuplicate && (
            <button type="button" className="btn btn-secondary" onClick={duplicateTicket}>Duplicate</button>
          )}
          {p.canReopen && (
            <button type="button" className="btn btn-primary" onClick={reopenTicket}>Reopen</button>
          )}
          {p.canDelete && (
            <button type="button" className="btn btn-danger" onClick={deleteTicket}>Delete</button>
          )}
        </div>
      </div>

      {isManagerView && (
        <div className="card card-alert" style={{ marginBottom: 16 }}>
          <strong>Manager view</strong> — Read-only monitoring. Use <Link to="/reports">Reports</Link> for team analytics.
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {p.isReadOnly && (
        <div className="alert-success">This ticket is closed — read-only. Use Reopen or Duplicate to continue work.</div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div><div className="stat-label">Time to resolve</div><div className="stat-value">{formatDuration(ticket.resolutionHours)}</div></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Agents involved</div><div className="stat-value">{ticket.agentsInvolved ?? 0}</div></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Created</div><div className="stat-value" style={{ fontSize: '1rem' }}>{new Date(ticket.createdAt).toLocaleString()}</div></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Comments</div><div className="stat-value">{ticket.comments?.length ?? 0}</div></div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Description</h3>
              {p.canEditDetails && !editing && (
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditing(true)}>Edit</button>
              )}
            </div>
            {editing ? (
              <div className="form-card">
                <div className="form-group">
                  <label>Title</label>
                  <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows={4} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: Number(e.target.value) })}>
                      {lookups.categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={editForm.priorityId} onChange={(e) => setEditForm({ ...editForm, priorityId: Number(e.target.value) })}>
                      {lookups.priorities?.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="btn-group">
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={saveEdit}>Save</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <p>{ticket.description}</p>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Timeline</h3>
            <div className="ticket-timeline">
              {(ticket.timeline || []).map((ev, i) => (
                <div key={`${ev.type}-${ev.at}-${i}`} className={`timeline-item timeline-${ev.type}`}>
                  <span className="timeline-icon">{timelineIcon(ev.type)}</span>
                  <div className="timeline-body">
                    <strong>{ev.title}</strong>
                    {ev.actorName && <span className="text-muted"> · {ev.actorName}</span>}
                    <p>{ev.detail}</p>
                    <small className="text-muted">{new Date(ev.at).toLocaleString()}</small>
                  </div>
                </div>
              ))}
              {(!ticket.timeline || ticket.timeline.length === 0) && (
                <p className="text-muted">No activity yet.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Comments</h3>
            {ticket.comments?.map((c) => (
              <div key={c.id} className={`comment ${c.isInternal ? 'internal' : 'public'}`}>
                <strong>{c.authorName}</strong> · {new Date(c.createdAt).toLocaleString()}
                {c.isInternal && <span className="badge badge-pending" style={{ marginLeft: 8 }}>Internal</span>}
                <p>{c.body}</p>
              </div>
            ))}
            {p.canComment && (
              <>
                <textarea className="comment-input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" />
                <div className="comment-actions">
                  <button type="button" className="btn btn-primary" onClick={postComment} disabled={!comment.trim()}>Post comment</button>
                  {isStaff && (
                    <label className="checkbox-label"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note</label>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Attachments</h3>
            <p className="text-muted" style={{ marginBottom: 12 }}>
              PNG, JPG, WEBP, PDF, TXT, LOG — max {maxAttachmentMb} MB, up to 5 files
            </p>
            {ticket.attachments?.map((a) => (
              <p key={a.id}>📎 {a.fileName} <span className="text-muted">({Math.round(a.fileSizeBytes / 1024)} KB)</span></p>
            ))}
            {p.canUpload && (
              <input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.log" onChange={uploadFile} />
            )}
          </div>
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

            {p.canChangeStatus && (
              <>
                <select className="filter-input" style={{ marginTop: 12, width: '100%' }} value={statusId} onChange={(e) => setStatusId(e.target.value)}>
                  {(p.isReadOnly ? lookups.statuses : [...activeStatuses, ...closedStatuses]).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary" style={{ marginTop: 8, width: '100%' }} onClick={updateStatus}>Update status</button>
              </>
            )}

            {p.canAssign && (
              <>
                <select className="filter-input" style={{ marginTop: 12, width: '100%' }} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                  <option value="">Assign to agent…</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                </select>
                <input className="filter-input" style={{ marginTop: 8, width: '100%' }} placeholder="Notes (optional)" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
                {p.canEscalate && (
                  <label className="checkbox-label" style={{ marginTop: 8, display: 'block' }}>
                    <input type="checkbox" checked={escalate} onChange={(e) => setEscalate(e.target.checked)} /> Escalate to another agent
                  </label>
                )}
                <button type="button" className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }} onClick={assign}>
                  {escalate ? 'Escalate' : 'Assign'}
                </button>
              </>
            )}
          </div>

          {ticket.assignmentHistory?.length > 0 && (
            <div className="card">
              <h3 className="card-title">Assignment history</h3>
              {ticket.assignmentHistory.map((a, i) => (
                <div key={i} className="timeline-mini">
                  <strong>{a.assignedToName}</strong>
                  {a.isEscalation && <span className="badge badge-pending">Escalated</span>}
                  <p className="text-muted">By {a.assignedByName} · {new Date(a.assignedAt).toLocaleString()}</p>
                  {a.notes && <p>{a.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
