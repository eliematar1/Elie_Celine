import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { ticketsApi } from '../services/ticketsApi';
import { useAuth } from '../context/AuthContext';
import { canCreateTickets } from '../constants/roles';

export default function TicketList() {
  const { hasRole } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [lookups, setLookups] = useState({ statuses: [], categories: [] });
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    ticketsApi.list({
      search: search || undefined,
      statusId: statusId || undefined,
      categoryId: categoryId || undefined,
    })
      .then((res) => setTickets(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    ticketsApi.lookups().then((res) => setLookups(res.data));
    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-sub">Manage and track support requests</p>
        </div>
        {canCreateTickets(hasRole) && (
          <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
        )}
      </div>

      <div className="card filters-card">
        <input type="search" className="filter-input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusId} onChange={(e) => setStatusId(e.target.value)}>
          <option value="">All statuses</option>
          {lookups.statuses?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {lookups.categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" className="btn btn-primary" onClick={load}>Filter</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setStatusId(''); setCategoryId(''); setTimeout(load, 0); }}>Clear</button>
      </div>

      <div className="card">
        {loading ? <p className="empty-state">Loading…</p> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Reference</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Created</th></tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td><Link to={`/tickets/${t.id}`} className="ref-link">{t.referenceNumber}</Link></td>
                    <td>{t.title}</td>
                    <td>{t.category}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.assignedToName || '—'}</td>
                    <td className="text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && <p className="empty-state">No tickets found.</p>}
          </div>
        )}
      </div>
    </>
  );
}
