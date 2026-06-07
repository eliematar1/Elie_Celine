import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useTickets } from '../data/mockData';
import { ticketApi, commentApi } from '../api';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tickets, refetch } = useTickets();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  // Load comments - moved BEFORE any returns
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await commentApi.getByTicket(id);
        setComments(data);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setLoadingComments(false);
      }
    };
    loadComments();
  }, [id]);

  // Find ticket - moved BEFORE returns
  const ticket = tickets.find(t => String(t.id) === id);

  // Loading state - but hooks are already called above
  if (!tickets.length) return <div className="loading">Loading ticket...</div>;
  if (!ticket) {
    return (
      <div className="card">
        <h1>Ticket not found</h1>
        <Link to="/tickets">← Back to list</Link>
      </div>
    );
  }

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    setUpdating(true);
    try {
      await ticketApi.update(ticket.id, { status: selectedStatus });
      await refetch();
      alert('Status updated!');
      setSelectedStatus('');
    } catch (err) {
      alert('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this ticket permanently?')) return;
    setDeleting(true);
    try {
      await ticketApi.delete(ticket.id);
      navigate('/tickets');
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (err) {
      navigate('/tickets');
      setTimeout(() => {
        refetch();
      }, 500);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await commentApi.create(id, {
        message: newComment,
        isInternal: isInternal
      });
      setComments([...comments, comment]);
      setNewComment('');
      setIsInternal(false);
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  return (
    <>
      <Link to="/tickets" className="back-link">← Back to tickets</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">{ticket.ref || `TKT-${ticket.id}`}</h1>
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
            {loadingComments ? (
              <p>Loading comments...</p>
            ) : (
              <>
                {comments.length === 0 && <p className="text-muted">No comments yet.</p>}
                {comments.map((c) => (
                  <div key={c.id} className={`comment ${c.isInternal ? 'internal' : 'public'}`}>
                    <strong>{c.isInternal ? '🔒 Internal note' : '💬 Comment'}</strong>
                    <p>{c.message}</p>
                    <small className="text-muted">{new Date(c.createdAt).toLocaleString()}</small>
                  </div>
                ))}
              </>
            )}
            <textarea 
              className="comment-input" 
              rows={3} 
              placeholder="Add a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="comment-actions">
              <button type="button" className="btn btn-primary" onClick={handleAddComment}>
                Post comment
              </button>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                /> Internal note
              </label>
            </div>
          </div>
          <div className="card">
            <h3 className="card-title">Attachments</h3>
            <p className="text-muted">No attachments yet.</p>
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
              <dt>Assigned</dt><dd>{ticket.assignedTo || 'Unassigned'}</dd>
              <dt>Requester</dt><dd>{ticket.createdBy || 'Unknown'}</dd>
            </dl>
            <select 
              className="filter-input" 
              style={{ marginTop: 12 }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Select new status</option>
              {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ marginTop: 8, width: '100%' }}
              onClick={handleUpdateStatus}
              disabled={updating || !selectedStatus}
            >
              {updating ? 'Updating...' : 'Update status'}
            </button>
            <button 
              type="button" 
              style={{ marginTop: 8, width: '100%', background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete ticket'}
            </button>
          </div>
          <div className="card">
            <h3 className="card-title">Activity</h3>
            <ul className="timeline">
              <li><span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Unknown'}</span> Ticket created</li>
              <li><span>Current</span> Status: {ticket.status}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}