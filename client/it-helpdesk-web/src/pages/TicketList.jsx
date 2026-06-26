import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { ticketsApi } from '../services/ticketsApi';

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadTickets = async () => {
      try {
        const [{ data: ticketData }, { data: lookupData }] = await Promise.all([ticketsApi.list(), ticketsApi.lookups()]);
        if (!active) return;
        setTickets((ticketData || []).map((item) => ({
          id: item.id,
          ref: item.referenceNumber,
          title: item.title,
          category: item.category,
          priority: item.priority,
          status: item.status,
          agent: item.assignedToName || 'Unassigned',
          created: new Date(item.createdAt).toLocaleDateString(),
        })));
        setCategories((lookupData.categories || []).map((c) => c.name));
        setStatuses((lookupData.statuses || []).map((s) => s.name));
      } catch (err) {
        console.error('Failed to load tickets', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTickets();
    return () => {
      active = false;
    };
  }, []);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchCat = !categoryFilter || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-sub">Manage and track support requests</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      <div className="card filters-card">
        <input
          type="search"
          className="filter-input"
          placeholder="Search reference or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}>
          Clear
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-muted">Loading tickets…</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td><Link to={`/tickets/${t.id}`} className="ref-link">{t.ref}</Link></td>
                    <td>{t.title}</td>
                    <td>{t.category}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.agent}</td>
                    <td className="text-muted">{t.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && <p className="empty-state">No tickets match your filters.</p>}
      </div>
    </>
  );
}
