import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi, aiApi } from '../services/ticketsApi';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [lookups, setLookups] = useState({ categories: [], priorities: [] });
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', priorityId: '' });
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  const askAi = async () => {
    const { data } = await aiApi.chat(aiQuestion);
    setAiAnswer(data.answer);
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
        <p className="page-sub">Describe your issue and we will assign an agent</p>
      </div>

      <div className="card ai-hint">
        <strong>💬 AI assistant</strong> — Ask before opening a ticket
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="text" className="filter-input" style={{ flex: 1 }} placeholder="How do I connect to VPN?" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} />
          <button type="button" className="btn btn-secondary" onClick={askAi}>Ask</button>
        </div>
        {aiAnswer && <p style={{ marginTop: 10, fontSize: '.9rem' }}>{aiAnswer}</p>}
      </div>

      {error && <div className="error">{error}</div>}

      <form className="card form-card" onSubmit={handleSubmit}>
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
