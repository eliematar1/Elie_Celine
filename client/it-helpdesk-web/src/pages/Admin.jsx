import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';
import { usersApi, settingsApi } from '../services/api';

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  department: '',
  role: AppRoles.Employee,
};

export default function Admin() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(AppRoles.Admin);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [settings, setSettings] = useState({ autoAssignEnabled: false, maxAttachmentSizeMb: 10 });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const loadUsers = () => {
    usersApi
      .list()
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users.'));
  };

  useEffect(() => {
    loadUsers();
    if (isAdmin) {
      usersApi.roles().then((res) => setRoles(res.data)).catch(() => {});
      settingsApi.get()
        .then((res) => {
          setSettings(res.data);
          setSettingsLoaded(true);
        })
        .catch(() => setSettingsLoaded(true));
    }
  }, [isAdmin]);

  if (!isAdmin && !hasRole(AppRoles.Manager)) {
    return <Navigate to="/dashboard" replace />;
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await usersApi.create(form);
      setSuccess(`User ${form.email} created successfully.`);
      setForm(emptyForm);
      setShowForm(false);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.join?.(', ')
        || 'Failed to create user.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (targetUser) => {
    const nextActive = targetUser.isActive === false;
    setError('');
    setSuccess('');
    setTogglingId(targetUser.id);
    try {
      await usersApi.setStatus(targetUser.id, nextActive);
      setSuccess(`${targetUser.email} ${nextActive ? 'activated' : 'deactivated'}.`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteUser = async (targetUser) => {
    if (!window.confirm(`Delete ${targetUser.email}? This cannot be undone.`)) return;
    setError('');
    setSuccess('');
    setTogglingId(targetUser.id);
    try {
      await usersApi.remove(targetUser.id);
      setSuccess(`User ${targetUser.email} deleted.`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete this user.');
    } finally {
      setTogglingId(null);
    }
  };

  const canDeleteUser = (u) => !u.lastLoginAt;

  const saveSettings = async () => {
    setError('');
    setSuccess('');
    setSettingsBusy(true);
    try {
      const { data } = await settingsApi.update(settings);
      setSettings(data);
      setSuccess('System settings saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSettingsBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Admin panel' : 'Team overview'}</h1>
          <p className="page-sub">
            {isAdmin
              ? 'User management & system settings (RBAC)'
              : 'Monitor team users — read-only access (Manager role)'}
          </p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Create user'}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {isAdmin && showForm && (
        <div className="card form-card">
          <h3 className="card-title">Create new user</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>
            Admins can create accounts with any role: Employee, IT Agent, Manager, or Admin.
          </p>
          <form onSubmit={handleCreate} className="admin-user-form">
            <div className="form-row">
              <div className="form-group">
                <label>First name</label>
                <input value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="form-group">
                <label>Last name</label>
                <input value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input value={form.department} onChange={set('department')} placeholder="e.g. IT, Sales" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={set('role')} required>
                  {(roles.length ? roles : Object.values(AppRoles)).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">All users ({users.length})</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>{u.department || '—'}</td>
                  <td>{u.roles?.join(', ')}</td>
                  <td>
                    <span className={`badge ${u.isActive !== false ? 'badge-resolved' : 'badge-closed'}`}>
                      {u.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      {u.id === user?.id ? (
                        <span className="text-muted">You</span>
                      ) : (
                        <div className="btn-group">
                          {canDeleteUser(u) ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              disabled={togglingId === u.id}
                              onClick={() => deleteUser(u)}
                            >
                              Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`btn btn-sm ${u.isActive !== false ? 'btn-danger' : 'btn-secondary'}`}
                              disabled={togglingId === u.id}
                              onClick={() => toggleStatus(u)}
                            >
                              {togglingId === u.id ? '…' : u.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && !error && <p className="empty-state">Loading users…</p>}
      </div>

      {isAdmin && (
        <div className="card">
          <h3 className="card-title">System settings</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>
            Control auto-assignment for new tickets and the maximum attachment size allowed on tickets.
          </p>
          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={settings.autoAssignEnabled}
              onChange={(e) => setSettings((s) => ({ ...s, autoAssignEnabled: e.target.checked }))}
              disabled={!settingsLoaded || settingsBusy}
            />
            Auto-assign new tickets to the least-loaded IT agent
          </label>
          <p style={{ marginTop: 8 }}>
            Max attachment (MB):{' '}
            <input
              type="number"
              min={1}
              max={50}
              value={settings.maxAttachmentSizeMb}
              onChange={(e) => setSettings((s) => ({ ...s, maxAttachmentSizeMb: Number(e.target.value) }))}
              style={{ width: 72 }}
              disabled={!settingsLoaded || settingsBusy}
            />
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={saveSettings}
            disabled={!settingsLoaded || settingsBusy}
          >
            {settingsBusy ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      )}
    </>
  );
}
