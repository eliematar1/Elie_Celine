import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { AppRoles, canCreateTickets } from '../constants/roles';
import { STATS, TICKETS, CATEGORY_CHART } from '../data/mockData';
import { dashboardApi } from '../services/ticketsApi';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      try {
        const { data } = await dashboardApi.get();
        if (active) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        if (active) {
          setLoadingDashboard(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const stats = dashboardData
    ? [
        { label: 'Open tickets', value: dashboardData.open, icon: '📋', accent: 'accent-blue' },
        { label: 'In progress', value: dashboardData.inProgress, icon: '⚡', accent: 'accent-amber' },
        { label: 'Pending', value: dashboardData.pending, icon: '⏳', accent: 'accent-purple' },
        { label: 'Resolved (month)', value: dashboardData.resolvedMonth, icon: '✓', accent: 'accent-green' },
      ]
    : [
        { label: 'Open tickets', value: STATS.open, icon: '📋', accent: 'accent-blue' },
        { label: 'In progress', value: STATS.inProgress, icon: '⚡', accent: 'accent-amber' },
        { label: 'Pending', value: STATS.pending, icon: '⏳', accent: 'accent-purple' },
        { label: 'Resolved (month)', value: STATS.resolvedMonth, icon: '✓', accent: 'accent-green' },
      ];

  const categoryData = dashboardData?.byCategory?.length ? dashboardData.byCategory.map((item) => ({ label: item.category, value: item.count })) : CATEGORY_CHART;
  const maxChart = Math.max(...categoryData.map((c) => c.value), 1);
  const priorityData = dashboardData?.byPriority?.length
    ? dashboardData.byPriority.map((item) => ({ label: item.priority, value: item.count }))
    : [
        { label: 'Critical', value: 8 },
        { label: 'High', value: 22 },
        { label: 'Medium', value: 45 },
        { label: 'Low', value: 25 },
      ];
  const recentTickets = dashboardData?.recentTickets?.length ? dashboardData.recentTickets : TICKETS.slice(0, 4);
  const isManager = hasRole(AppRoles.Manager);

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

      {loadingDashboard && <p className="text-muted">Loading analytics…</p>}

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} accent={stat.accent} />
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Tickets by category</h3>
          <div className="bar-chart">
            {categoryData.map((c) => (
              <div key={c.label} className="bar-row">
                <span className="bar-label">{c.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(c.value / maxChart) * 100}%`, background: c.color || '#4f46e5' }} />
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
              <div className="donut-center">{priorityData.reduce((sum, item) => sum + item.value, 0)}<br /><small>total</small></div>
            </div>
            <ul className="legend">
              {priorityData.map((item) => (
                <li key={item.label}><span className={`dot priority-${item.label.toLowerCase()}`} /> {item.label} — {item.value}</li>
              ))}
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
                  <td><Link to={`/tickets/${t.id}`} className="ref-link">{t.referenceNumber || t.ref}</Link></td>
                  <td>{t.title}</td>
                  <td>{t.category}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.assignedToName || t.agent || 'Unassigned'}</td>
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
