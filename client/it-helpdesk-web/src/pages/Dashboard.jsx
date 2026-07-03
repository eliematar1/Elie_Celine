import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { AppRoles, canCreateTickets } from '../constants/roles';
import { dashboardApi } from '../services/ticketsApi';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard.'));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="text-muted">Loading dashboard…</p>;

  const maxChart = Math.max(...(data.byCategory?.map((c) => c.count) || [1]), 1);
<<<<<<< HEAD
  const isManager = hasRole(AppRoles.Manager);
=======
>>>>>>> 3675464385e6088eef49584f5ff09f221b19cf98

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            Welcome back, <strong>{user?.firstName} {user?.lastName}</strong>
            <span className="role-pill">{user?.roles?.[0]}</span>
          </p>
        </div>
        {canCreateTickets(hasRole) ? (
          <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
        ) : isManager && !hasRole(AppRoles.Admin) ? (
          <Link to="/reports" className="btn btn-primary">View Reports</Link>
        ) : null}
      </div>

      <div className="stats-grid">
        <StatCard label="Open tickets" value={data.open} icon="📋" accent="accent-blue" />
        <StatCard label="In progress" value={data.inProgress} icon="⚡" accent="accent-amber" />
        <StatCard label="Pending" value={data.pending} icon="⏳" accent="accent-purple" />
        <StatCard label="Resolved (month)" value={data.resolvedMonth} icon="✓" accent="accent-green" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Tickets by category</h3>
          <div className="bar-chart">
            {(data.byCategory || []).map((c) => (
              <div key={c.category} className="bar-row">
                <span className="bar-label">{c.category}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(c.count / maxChart) * 100}%`, background: '#3b82f6' }} />
                </div>
                <span className="bar-val">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Tickets by priority</h3>
          <div className="bar-chart">
            {(data.byPriority || []).map((p) => (
              <div key={p.priority} className="bar-row">
                <span className="bar-label">{p.priority}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(p.count / maxChart) * 100}%`, background: '#8b5cf6' }} />
                </div>
                <span className="bar-val">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">Recent tickets</h3>
          <Link to="/tickets" className="link-sm">View all →</Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Reference</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Agent</th></tr>
            </thead>
            <tbody>
              {(data.recentTickets || []).map((t) => (
                <tr key={t.id}>
                  <td><Link to={`/tickets/${t.id}`} className="ref-link">{t.referenceNumber}</Link></td>
                  <td>{t.title}</td>
                  <td>{t.category}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.assignedToName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasRole(AppRoles.Admin) && (
        <div className="card card-alert">
          <strong>Admin</strong> — Manage users and settings in the <Link to="/admin">Admin panel</Link>.
        </div>
      )}

      {hasRole(AppRoles.Manager) && !hasRole(AppRoles.Admin) && (
        <div className="card card-alert">
          <strong>Manager</strong> — Monitor all team tickets, assign agents, and open{' '}
          <Link to="/reports">Reports &amp; analytics</Link> for performance charts and exports.
        </div>
      )}
    </>
  );
}
