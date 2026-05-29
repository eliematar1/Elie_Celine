import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">My profile</h1>
      </div>
      <div className="card form-card" style={{ maxWidth: 480 }}>
        <div className="profile-avatar-lg">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
        <div className="form-group">
          <label>First name</label>
          <input defaultValue={user?.firstName} />
        </div>
        <div className="form-group">
          <label>Last name</label>
          <input defaultValue={user?.lastName} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input defaultValue={user?.email} readOnly />
        </div>
        <div className="form-group">
          <label>Department</label>
          <input defaultValue={user?.department || ''} />
        </div>
        <button type="button" className="btn btn-primary">Save changes</button>
        <hr className="divider" />
        <h3 className="card-title">Change password</h3>
        <div className="form-group">
          <label>Current password</label>
          <input type="password" />
        </div>
        <div className="form-group">
          <label>New password</label>
          <input type="password" />
        </div>
        <button type="button" className="btn btn-secondary">Update password</button>
      </div>
    </>
  );
}
