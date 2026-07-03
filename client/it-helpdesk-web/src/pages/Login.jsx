import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@ithelpdesk.local');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign In</h1>
        <p className="sub">IT Help Desk</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: '.9rem', textAlign: 'center' }}>
          <Link to="/forgot-password">Forgot password?</Link>
<<<<<<< HEAD
=======
          {' · '}
          No account? <Link to="/register">Register</Link>
>>>>>>> 3675464385e6088eef49584f5ff09f221b19cf98
        </p>
        <p style={{ marginTop: 8, fontSize: '.8rem', color: '#94a3b8', textAlign: 'center' }}>
          Demo (click to fill):<br />
          <button type="button" className="link-btn" onClick={() => fillDemo('admin@ithelpdesk.local', 'Admin@123')}>
            admin@ithelpdesk.local / Admin@123
          </button>
          <br />
          <button type="button" className="link-btn" onClick={() => fillDemo('manager@ithelpdesk.local', 'Manager@123')}>
            manager@ithelpdesk.local / Manager@123
          </button>
          <br />
          <button type="button" className="link-btn" onClick={() => fillDemo('agent@ithelpdesk.local', 'Agent@123')}>
            agent@ithelpdesk.local / Agent@123
          </button>
          <br />
          <button type="button" className="link-btn" onClick={() => fillDemo('employee@ithelpdesk.local', 'Employee@123')}>
            employee@ithelpdesk.local / Employee@123
          </button>
        </p>
      </div>
    </div>
  );
}
