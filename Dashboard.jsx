import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';
import { CATEGORY_CHART, STATS, useTickets } from '../data/mockData';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const { tickets = [] } = useTickets();
  const maxChart = Math.max(...CATEGORY_CHART.map((c) => c.value));

  const recentTickets = tickets.slice(0, 4);

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
        <Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Open tickets" value={STATS.open} icon="📋" accent="accent-blue" />
        <StatCard label="In progress" value={STATS.inProgress} icon="⚡" accent="accent-amber" />
        <StatCard label="Pending" value={STATS.pending} icon="⏳" accent="accent-purple" />
        <StatCard label="Resolved (month)" value={STATS.resolvedMonth} icon="✓" accent="accent-green" />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Tickets by category</h3>
          <div className="bar-chart">
            {CATEGORY_CHART.map((c) => (
              <div key={c.label} className="bar-row">
                <span className="bar-label">{c.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(c.value / maxChart) * 100}%`, background: c.color }} />
                </div>
                <span className="bar-val">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Tickets by priority</h3>
          <div className="priority-chart">
            <div className="donut-wrap">
              <div className="donut" />
              <div className="donut-center">100<br /><small>total</small></div>
            </div>
            <ul className="legend">
              <li><span className="dot priority-critical" /> Critical — 8</li>
              <li><span className="dot priority-high" /> High — 22</li>
              <li><span className="dot priority-medium" /> Medium — 45</li>
              <li><span className="dot priority-low" /> Low — 25</li>
            </ul>
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
              <tr>
                <th>Reference</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Agent</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id}>
                  <td><Link to={`/tickets/${t.id}`} className="ref-link">{t.ref || `TKT-${t.id}`}</Link></td>
                  <td>{t.title}</td>
                  <td>{t.category}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.assignedTo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasRole(AppRoles.Admin) && (
        <div className="card card-alert">
          <strong>Admin</strong> — Manage users, roles, and system settings in the{' '}
          <Link to="/admin">Admin panel</Link>.
        </div>
      )}
    </>
  );
}