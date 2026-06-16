import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';
import { usersApi } from '../services/api';

export default function Admin() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi.list()
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users (Admin only).'));
  }, []);

  if (!hasRole(AppRoles.Admin) && !hasRole(AppRoles.Manager)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Admin panel</h1>
        <p className="page-sub">User management &amp; system settings (RBAC — Admin role)</p>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="tabs">
        <button type="button" className="tab active">Users</button>
        <button type="button" className="tab">Roles</button>
        <button type="button" className="tab">Settings</button>
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.department || '—'}</td>
                <td>{u.roles?.join(', ')}</td>
                <td><span className="badge badge-resolved">{u.isActive !== false ? 'Active' : 'Disabled'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !error && <p className="empty-state">Loading users from API…</p>}
      </div>
      <div className="card">
        <h3 className="card-title">System settings</h3>
        <p>Auto-assign tickets: <input type="checkbox" /></p>
        <p style={{ marginTop: 8 }}>Max attachment (MB): <input type="number" defaultValue={10} style={{ width: 60 }} /></p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 12 }}>Save settings</button>
      </div>
    </>
  );
}
