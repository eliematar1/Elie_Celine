import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi, ticketsApi } from '../services/ticketsApi';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    priorityId: '',
  });
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [createdReference, setCreatedReference] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [askingAi, setAskingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    let active = true;
    const loadLookups = async () => {
      try {
        const { data } = await ticketsApi.lookups();
        if (!active) return;
        setCategories(data.categories || []);
        setPriorities(data.priorities || []);
        setForm((prev) => ({
          ...prev,
          categoryId: data.categories?.[0]?.id?.toString() || '',
          priorityId: data.priorities?.[1]?.id?.toString() || '',
        }));
      } catch (err) {
        console.error('Failed to load ticket lookups', err);
        setError('Could not load categories and priorities.');
      }
    };

    loadLookups();
    return () => {
      active = false;
    };
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.categoryId || !form.priorityId) {
      setError('Please fill in the required fields.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const { data } = await ticketsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: Number(form.categoryId),
        priorityId: Number(form.priorityId),
      });
      setCreatedReference(data.referenceNumber || '');
      window.dispatchEvent(new Event('notifications-updated'));
      setSubmitted(true);
      setTimeout(() => navigate(`/tickets/${data.id}`), 1200);
    } catch (err) {
      console.error('Ticket creation failed', err);
      setError('Could not create the ticket. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const askAi = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAskingAi(true);
    setAiError('');
    setAiAnswer('');

    try {
      const { data } = await aiApi.chat(aiQuestion.trim());
      setAiAnswer(data.answer || '');
    } catch (err) {
      console.error('AI assistant request failed', err);
      setAiError('Unable to reach the AI assistant right now.');
    } finally {
      setAskingAi(false);
    }
  };

  if (submitted) {
    return (
      <div className="card success-card">
        <h2>✓ Ticket created</h2>
        <p>Reference <strong>{createdReference || 'New ticket'}</strong> — redirecting…</p>
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
        <form onSubmit={askAi} style={{ marginTop: 10 }}>
          <div className="form-row">
            <input
              type="text"
              className="filter-input"
              placeholder="Ask a question…"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={askingAi}>
              {askingAi ? 'Asking…' : 'Ask'}
            </button>
          </div>
        </form>
        {aiAnswer && <p className="text-muted" style={{ marginTop: 10 }}>{aiAnswer}</p>}
        {aiError && <p className="text-muted" style={{ marginTop: 10 }}>{aiError}</p>}
      </div>

      <form className="card form-card" onSubmit={handleSubmit}>
        {error && <p className="text-muted" style={{ marginBottom: 12 }}>{error}</p>}
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
            <select value={form.categoryId} onChange={set('categoryId')}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priorityId} onChange={set('priorityId')}>
              {priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Attachments</label>
          <input type="file" multiple />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Submit ticket'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
