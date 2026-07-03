import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot password</h1>
        <p className="sub">IT Help Desk account recovery</p>
        <p style={{ marginBottom: 16, fontSize: '.9rem', color: '#64748b', lineHeight: 1.5 }}>
          For this internship demo, password resets are handled by your IT administrator.
          Contact <strong>admin@ithelpdesk.local</strong> or use the seeded admin account to reset user passwords
          from the Admin panel.
        </p>
        <p style={{ marginBottom: 16, fontSize: '.85rem', color: '#64748b' }}>
          In production, this page would send a secure reset link by email (ASP.NET Identity password reset token).
        </p>
        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textAlign: 'center' }}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
