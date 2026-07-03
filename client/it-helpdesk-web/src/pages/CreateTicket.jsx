import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi, aiApi } from '../services/ticketsApi';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [lookups, setLookups] = useState({ categories: [], priorities: [] });
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', priorityId: '' });
  const [shortcut, setShortcut] = useState('');
  const [aiPreview, setAiPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    ticketsApi.lookups().then((res) => {
      setLookups(res.data);
      const med = res.data.priorities?.find((p) => p.name === 'Medium');
      const soft = res.data.categories?.find((c) => c.name === 'Software');
      setForm((f) => ({
        ...f,
        categoryId: soft?.id || res.data.categories?.[0]?.id || '',
        priorityId: med?.id || res.data.priorities?.[0]?.id || '',
      }));
    });
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const previewAi = async () => {
    if (!shortcut.trim()) return;
    setAiBusy(true);
    setError('');
    try {
      const { data } = await aiApi.parseTicket(shortcut);
      setAiPreview(data);
      setForm({
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        priorityId: data.priorityId,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'AI could not parse your request.');
    } finally {
      setAiBusy(false);
    }
  };

  const createWithAi = async () => {
    if (!shortcut.trim()) return;
    setAiBusy(true);
    setError('');
    try {
      const { data } = await aiApi.createTicket(shortcut);
      const ticketId = data.ticket?.id;
      navigate(`/tickets/${ticketId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'AI ticket creation failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const suggest = async () => {
    if (!form.title) return;
    const { data } = await aiApi.suggest(form.title, form.description);
    const cat = lookups.categories?.find((c) => c.name === data.suggestedCategory);
    const pri = lookups.priorities?.find((p) => p.name === data.suggestedPriority);
    if (cat) setForm((f) => ({ ...f, categoryId: cat.id }));
    if (pri) setForm((f) => ({ ...f, priorityId: pri.id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await ticketsApi.create({
        title: form.title,
        description: form.description,
        categoryId: Number(form.categoryId),
        priorityId: Number(form.priorityId),
      });
      navigate(`/tickets/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Create support ticket</h1>
        <p className="page-sub">Use AI Quick Ticket or fill the form manually</p>
      </div>

      <div className="card ai-ticket-card">
        <h3 className="card-title">⚡ AI Quick Ticket</h3>
        <p className="text-muted">Describe your issue in one line — AI sets category, priority, and deadline if mentioned.</p>
        <p className="text-muted" style={{ fontSize: '.8rem' }}>
          Example: <em>Software High tomorrow laptop won&apos;t boot after Windows update</em>
        </p>
        <textarea
          className="comment-input"
          rows={3}
          placeholder="Describe your issue…"
          value={shortcut}
          onChange={(e) => setShortcut(e.target.value)}
        />
        <div className="btn-group" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={previewAi} disabled={aiBusy || !shortcut.trim()}>
            Preview
          </button>
          <button type="button" className="btn btn-primary" onClick={createWithAi} disabled={aiBusy || !shortcut.trim()}>
            {aiBusy ? 'Creating…' : 'Create ticket with AI'}
          </button>
        </div>
        {aiPreview && (
          <div className="ai-preview" style={{ marginTop: 16 }}>
            <strong>AI analysis</strong>
            <p>Category: {aiPreview.category} · Priority: {aiPreview.priority}</p>
            <p><strong>{aiPreview.title}</strong></p>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <form className="card form-card" onSubmit={handleSubmit}>
        <h3 className="card-title">Manual ticket form</h3>
        <div className="form-group">
          <label>Title *</label>
          <input value={form.title} onChange={set('title')} required onBlur={suggest} />
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea value={form.description} onChange={set('description')} required rows={5} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select value={form.categoryId} onChange={set('categoryId')} required>
              {lookups.categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priorityId} onChange={set('priorityId')}>
              {lookups.priorities?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit ticket'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
