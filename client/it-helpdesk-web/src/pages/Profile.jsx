import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    department: user?.department || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authApi.updateProfile(form);
      await refreshUser();
      setMessage('Profile saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authApi.changePassword(passwords);
      setMessage('Password updated successfully.');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.join?.(', ') || 'Failed to change password.');
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My profile</h1>
        <p className="page-sub">{user?.email}</p>
      </div>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <form className="card form-card" style={{ maxWidth: 480 }} onSubmit={saveProfile}>
        <div className="profile-avatar-lg">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        <div className="form-group">
          <label>First name</label>
          <input value={form.firstName} onChange={set('firstName')} required />
        </div>
        <div className="form-group">
          <label>Last name</label>
          <input value={form.lastName} onChange={set('lastName')} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input value={user?.email} readOnly />
        </div>
        <div className="form-group">
          <label>Department</label>
          <input value={form.department} onChange={set('department')} />
        </div>
        <p style={{ marginBottom: 12 }}>
          {user?.roles?.map((r) => <span key={r} className="role-pill">{r}</span>)}
        </p>
        <button type="submit" className="btn btn-primary">Save changes</button>
      </form>

      <form className="card form-card" style={{ maxWidth: 480, marginTop: 20 }} onSubmit={savePassword}>
        <h3 className="card-title">Change password</h3>
        <div className="form-group">
          <label>Current password</label>
          <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>New password</label>
          <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} />
        </div>
        <button type="submit" className="btn btn-secondary">Update password</button>
      </form>
    </>
  );
}
