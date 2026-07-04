import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { aiApi, ticketsApi } from '../services/ticketsApi';

export default function TicketDetail() {
  const [aiSummary, setAiSummary] = useState('');
  const [aiTroubleshooting, setAiTroubleshooting] = useState('');
  const [loadingAI, setAiLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('Open');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [priorityMessage, setPriorityMessage] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentMessage, setCommentMessage] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');
  const { id } = useParams();

  useEffect(() => {
    let active = true;
    const loadTicket = async () => {
      if (!id) return;
      setLoadingTicket(true);
      try {
        const { data } = await ticketsApi.get(id);
        if (!active) return;
        setTicket({
          id: data.id,
          ref: data.referenceNumber,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: data.status,
          agent: data.assignedToName || 'Unassigned',
          requester: data.createdByName,
          created: new Date(data.createdAt).toLocaleDateString(),
          attachments: data.attachments || [],
          comments: (data.comments || []).map((comment) => ({
            id: comment.id,
            authorName: comment.authorName,
            body: comment.body,
            isInternal: comment.isInternal,
            createdAt: new Date(comment.createdAt).toLocaleDateString(),
          })),
          activity: [
            {
              id: `created-${data.id}`,
              label: 'Ticket created',
              detail: `Ticket created on ${new Date(data.createdAt).toLocaleDateString()}`,
              time: new Date(data.createdAt).toLocaleString(),
            },
            ...(data.statusHistory || []).map((entry, index) => ({
              id: `status-${data.id}-${index}`,
              label: 'Status updated',
              detail: `${entry.fromStatus || 'Unknown'} → ${entry.toStatus}`,
              time: new Date(entry.changedAt).toLocaleString(),
            })),
          ],
        });
        setSelectedStatus(data.status);
        setSelectedPriority(data.priority);
        setSelectedAgent(data.assignedToUserId || '');
        setAttachments((data.attachments || []).map((file) => ({ id: file.id, fileName: file.fileName })));
      } catch (err) {
        console.error('Failed to load ticket', err);
      } finally {
        if (active) setLoadingTicket(false);
      }
    };

    loadTicket();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { data } = await ticketsApi.agents();
        setAgents((data || []).map((agent) => ({
          id: agent.id,
          name: agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email,
        })));
      } catch (err) {
        console.error('Failed to load agents', err);
      }
    };

    loadAgents();
  }, []);

  const generateSummary = async () => {
    if (!ticket) return;

    setAiLoading(true);
    try {
      const { data } = await aiApi.summary(ticket.title, ticket.description, ticket.status);
      setAiSummary(data.summary);
    } catch (err) {
      console.error('Summary generation failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const generateTroubleshooting = async () => {
    if (!ticket) return;

    setAiLoading(true);
    try {
      const { data } = await aiApi.troubleshoot(ticket.title, ticket.description, ticket.category);
      setAiTroubleshooting(data.steps);
    } catch (err) {
      console.error('Troubleshooting generation failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setStatusMessage('');
  };

  const addActivityEntry = (label, detail) => {
    setTicket((prev) => prev ? {
      ...prev,
      activity: [
        ...(prev.activity || []),
        {
          id: `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          label,
          detail,
          time: new Date().toLocaleString(),
        },
      ],
    } : prev);
  };

  const handleStatusUpdate = async () => {
    if (!ticket || !selectedStatus || selectedStatus === ticket.status) return;

    setUpdatingStatus(true);
    setStatusMessage('');
    try {
      const statusMap = {
        Open: 1,
        'In Progress': 2,
        Pending: 3,
        Resolved: 4,
        Closed: 5,
      };
      const { data: updatedTicket } = await ticketsApi.update(ticket.id, { statusId: statusMap[selectedStatus] });
      setTicket((prev) => prev ? {
        ...prev,
        status: updatedTicket.status,
        agent: updatedTicket.assignedToName || prev.agent,
        requester: updatedTicket.createdByName || prev.requester,
      } : prev);
      setSelectedStatus(updatedTicket.status);
      addActivityEntry('Status updated', `Status changed to ${updatedTicket.status}.`);
      window.dispatchEvent(new Event('notifications-updated'));
      setStatusMessage(`Status updated to ${updatedTicket.status}.`);
    } catch (err) {
      console.error('Status update failed', err);
      setStatusMessage('Status update failed. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = (event) => {
    setSelectedPriority(event.target.value);
    setPriorityMessage('');
  };

  const handlePriorityUpdate = async () => {
    if (!ticket || !selectedPriority || selectedPriority === ticket.priority) return;

    setUpdatingPriority(true);
    setPriorityMessage('');
    try {
      const priorityMap = {
        Low: 1,
        Medium: 2,
        High: 3,
        Critical: 4,
      };
      const { data: updatedTicket } = await ticketsApi.update(ticket.id, { priorityId: priorityMap[selectedPriority] });
      setTicket((prev) => prev ? {
        ...prev,
        priority: updatedTicket.priority,
      } : prev);
      setSelectedPriority(updatedTicket.priority);
      addActivityEntry('Priority updated', `Priority changed to ${updatedTicket.priority}.`);
      window.dispatchEvent(new Event('notifications-updated'));
      setPriorityMessage(`Priority updated to ${updatedTicket.priority}.`);
    } catch (err) {
      console.error('Priority update failed', err);
      setPriorityMessage('Priority update failed. Please try again.');
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!ticket || !selectedAgent) return;

    setAssigningAgent(true);
    setAssignMessage('');
    try {
      await ticketsApi.assign(ticket.id, { assignedToUserId: selectedAgent });
      setTicket((prev) => prev ? { ...prev, agent: agents.find((agent) => agent.id === selectedAgent)?.name || 'Assigned' } : prev);
      addActivityEntry('Agent assigned', `Ticket assigned to ${agents.find((agent) => agent.id === selectedAgent)?.name || 'selected agent'}.`);
      window.dispatchEvent(new Event('notifications-updated'));
      setAssignMessage('Agent assigned.');
    } catch (err) {
      console.error('Agent assignment failed', err);
      setAssignMessage('Assignment failed. Please try again.');
    } finally {
      setAssigningAgent(false);
    }
  };

  const handlePostComment = async () => {
    if (!ticket || !commentBody.trim()) return;

    setPostingComment(true);
    setCommentMessage('');
    try {
      await ticketsApi.addComment(ticket.id, {
        body: commentBody.trim(),
        isInternal: isInternalComment,
      });
      const newComment = {
        id: Date.now(),
        authorName: 'You',
        body: commentBody.trim(),
        isInternal: isInternalComment,
        createdAt: 'Just now',
      };
      setTicket((prev) => prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : prev);
      addActivityEntry('Comment added', isInternalComment ? 'Internal note added.' : 'Comment added to the ticket.');
      window.dispatchEvent(new Event('notifications-updated'));
      setCommentBody('');
      setIsInternalComment(false);
      setCommentMessage('Comment posted.');
    } catch (err) {
      console.error('Comment posting failed', err);
      setCommentMessage('Comment failed to post. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile || !ticket) return;

    setUploadingFile(true);
    setUploadMessage('');
    try {
      const { data } = await ticketsApi.upload(ticket.id, selectedFile);
      setAttachments((prev) => [...prev, { id: data.fileName, fileName: data.fileName }]);
      addActivityEntry('Attachment uploaded', `Uploaded ${data.fileName}.`);
      window.dispatchEvent(new Event('notifications-updated'));
      setUploadMessage(`Uploaded ${data.fileName}`);
      setSelectedFile(null);
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadMessage('Upload failed. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loadingTicket) {
    return <div className="card"><p className="text-muted">Loading ticket…</p></div>;
  }

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="filter-input" value={selectedAgent} onChange={(event) => setSelectedAgent(event.target.value)}>
            <option value="">Select agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" disabled={assigningAgent || !selectedAgent} onClick={handleAssignAgent}>
            {assigningAgent ? 'Assigning…' : 'Assign agent'}
          </button>
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
            {(ticket.comments || []).length > 0 ? (
              (ticket.comments || []).map((comment) => (
                <div key={comment.id} className={`comment ${comment.isInternal ? 'internal' : 'public'}`}>
                  <strong>{comment.authorName}</strong> · {comment.createdAt}
                  <p>{comment.body}</p>
                </div>
              ))
            ) : (
              <p className="text-muted">No comments yet.</p>
            )}
            <textarea className="comment-input" rows={3} placeholder="Add a comment…" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} />
            <div className="comment-actions">
              <button type="button" className="btn btn-primary" onClick={handlePostComment} disabled={postingComment || !commentBody.trim()}>
                {postingComment ? 'Posting…' : 'Post comment'}
              </button>
              <label className="checkbox-label"><input type="checkbox" checked={isInternalComment} onChange={(event) => setIsInternalComment(event.target.checked)} /> Internal note</label>
            </div>
            {commentMessage && <p className="text-muted" style={{ marginTop: 8 }}>{commentMessage}</p>}
          </div>
          <div className="card">
            <h3 className="card-title">Attachments</h3>
            {attachments.length > 0 ? (
              <ul className="timeline">
                {attachments.map((file) => (
                  <li key={file.id}>{file.fileName}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No uploads yet.</p>
            )}
            <input id="ticket-file-input" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 8 }}>
              <label htmlFor="ticket-file-input" className="btn btn-secondary">Choose file</label>
              <button type="button" className="btn btn-secondary" onClick={handleUpload} disabled={!selectedFile || uploadingFile}>
                {uploadingFile ? 'Uploading…' : 'Upload file'}
              </button>
            </div>
            {selectedFile && <p className="text-muted" style={{ marginTop: 8 }}>Selected: {selectedFile.name}</p>}
            {uploadMessage && <p className="text-muted" style={{ marginTop: 8 }}>{uploadMessage}</p>}
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
            <select className="filter-input" style={{ marginTop: 12 }} value={selectedStatus} onChange={handleStatusChange}>
              {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" style={{ marginTop: 8, width: '100%' }} disabled={updatingStatus || selectedStatus === ticket.status} onClick={handleStatusUpdate}>
              {updatingStatus ? 'Updating…' : 'Update status'}
            </button>
            {statusMessage && <p className="text-muted" style={{ marginTop: 8 }}>{statusMessage}</p>}
            {assignMessage && <p className="text-muted" style={{ marginTop: 8 }}>{assignMessage}</p>}
            <select className="filter-input" style={{ marginTop: 12 }} value={selectedPriority} onChange={handlePriorityChange}>
              {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button type="button" className="btn btn-secondary" style={{ marginTop: 8, width: '100%' }} disabled={updatingPriority || selectedPriority === ticket.priority} onClick={handlePriorityUpdate}>
              {updatingPriority ? 'Updating…' : 'Update priority'}
            </button>
            {priorityMessage && <p className="text-muted" style={{ marginTop: 8 }}>{priorityMessage}</p>}
          </div>
          <div className="card">
            <h3 className="card-title">Activity</h3>
            <ul className="timeline">
              {(ticket.activity || []).slice().reverse().map((entry) => (
                <li key={entry.id}><span>{entry.time}</span> {entry.label} — {entry.detail}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">AI Assistant</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={generateSummary} disabled={loadingAI}>
            {loadingAI ? 'Loading...' : 'Generate Summary'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={generateTroubleshooting} disabled={loadingAI}>
            {loadingAI ? 'Loading...' : 'Troubleshoot'}
          </button>
        </div>
        {aiSummary && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
            <strong>Summary:</strong> {aiSummary}
          </div>
        )}
        {aiTroubleshooting && (
          <div style={{ marginTop: 12, padding: 12, background: '#fef3c7', borderRadius: 8 }}>
            <strong>Troubleshooting:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{aiTroubleshooting}</pre>
          </div>
        )}
      </div>
    </>
  );
}
