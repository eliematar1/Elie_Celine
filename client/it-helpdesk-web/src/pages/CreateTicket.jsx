import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, PRIORITIES } from '../data/mockData';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Software',
    priority: 'Medium',
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate('/tickets/1'), 1200);
  };

  if (submitted) {
    return (
      <div className="card success-card">
        <h2>✓ Ticket created</h2>
        <p>Reference <strong>TKT-2026-00043</strong> — redirecting…</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create support ticket</h1>
          <p className="page-sub">Describe your issue and we will assign an agent</p>
        </div>
      </div>

      <div className="card ai-hint">
        <strong>💬 AI assistant</strong> — Ask a quick question before opening a ticket, e.g. &quot;How do I connect to VPN?&quot;
        <input type="text" className="filter-input" placeholder="Ask a question…" style={{ marginTop: 10 }} />
      </div>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input value={form.title} onChange={set('title')} required placeholder="Brief summary" />
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea value={form.description} onChange={set('description')} required rows={5} placeholder="Detailed description…" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Attachments</label>
          <input type="file" multiple />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Submit ticket</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
