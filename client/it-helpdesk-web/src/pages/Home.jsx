import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="auth-page">
      <div className="home-hero">
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛠</div>
        <h1>IT Help Desk &amp; Ticketing</h1>
        <p>Submit and track IT support requests for your organization</p>
        <div className="actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
          <Link to="/login" className="btn btn-primary" style={{ width: 'auto', padding: '12px 28px' }}>Sign In</Link>
<<<<<<< HEAD
=======
          <Link to="/register" className="btn btn-outline" style={{ width: 'auto', padding: '12px 28px', background: 'rgba(255,255,255,.1)', color: '#fff', border: '2px solid rgba(255,255,255,.4)' }}>
            Create Account
          </Link>
>>>>>>> 3675464385e6088eef49584f5ff09f221b19cf98
        </div>
        <p style={{ marginTop: 32, fontSize: '.85rem', color: '#64748b' }}>
          Demo: admin@ithelpdesk.local / Admin@123
        </p>
      </div>
    </div>
  );
}
