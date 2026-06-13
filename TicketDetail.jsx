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
  const [agents, setAgents] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canAssign = currentUser.roles?.includes('Admin') || currentUser.roles?.includes('IT Support Agent');

  // Load agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/agents', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setAgents(data);
      } catch (err) {
        console.error('Failed to load agents', err);
      }
    };
    if (canAssign) {
      loadAgents();
    }
  }, [canAssign]);

  // Load comments
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

  const ticket = tickets.find(t => String(t.id) === id);

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

  const handleAssign = async () => {
    if (!selectedAgent) return;
    setAssigning(true);
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ assignedTo: selectedAgent })
      });
      if (response.ok) {
        await refetch();
        alert('Ticket assigned!');
        setSelectedAgent('');
      } else {
        alert('Assignment failed');
      }
    } catch (err) {
      alert('Assignment failed');
    } finally {
      setAssigning(false);
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

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  };

  return (
    <>
      <Link to="/tickets" className="back-link">← Back to tickets</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">{ticket.ref || `TKT-${ticket.id}`}</h1>
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
              <dt>Assigned</dt><dd>{ticket.assignedTo ? getAgentName(ticket.assignedTo) : 'Unassigned'}</dd>
              <dt>Requester</dt><dd>{ticket.createdBy || 'Unknown'}</dd>
            </dl>
            
            {canAssign && (
              <div style={{ marginTop: 12 }}>
                <select 
                  className="filter-input" 
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <option value="">Assign to agent...</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name} ({agent.role})</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ marginTop: 8, width: '100%' }}
                  onClick={handleAssign}
                  disabled={assigning || !selectedAgent}
                >
                  {assigning ? 'Assigning...' : 'Assign ticket'}
                </button>
              </div>
            )}
            
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
  <h3 className="card-title">Activity Timeline</h3>
  <ul className="timeline">
    {ticket.activityLog && ticket.activityLog.length > 0 ? (
      [...ticket.activityLog].reverse().map((log) => (
        <li key={log.id}>
          <span>{new Date(log.timestamp).toLocaleString()}</span>
          {log.action === 'ticket_created' && `Ticket created: ${log.details.title}`}
          {log.action === 'status_change' && `Status changed: ${log.details.oldValue} → ${log.details.newValue}`}
          {log.action === 'assignment' && `Assigned: ${log.details.oldValue} → ${log.details.newValue}`}
          {log.action === 'comment_added' && `Comment added: ${log.details.message} ${log.details.isInternal ? '(Internal note)' : ''}`}
        </li>
      ))
    ) : (
      <li><span>{new Date(ticket.createdAt).toLocaleDateString()}</span> Ticket created</li>
    )}
    <li><span>Current</span> Status: {ticket.status}</li>
  </ul>
</div>
        </div>
      </div>
    </>
  );
}