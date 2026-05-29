import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';

export default function Admin() {
  const { hasRole } = useAuth();
  if (!hasRole(AppRoles.Admin) && !hasRole(AppRoles.Manager)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Admin panel</h1>
        <p className="page-sub">Users, roles, categories, system settings</p>
      </div>
      <div className="tabs">
        <button type="button" className="tab active">Users</button>
        <button type="button" className="tab">Roles</button>
        <button type="button" className="tab">Categories</button>
        <button type="button" className="tab">Settings</button>
      </div>
      <div className="card">
        <button type="button" className="btn btn-primary" style={{ marginBottom: 16 }}>+ Add user</button>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            <tr><td>Elie Matar</td><td>elie@company.com</td><td>Admin</td><td><span className="badge badge-resolved">Active</span></td><td><button type="button" className="link-btn">Edit</button></td></tr>
            <tr><td>Celine Mortada</td><td>celine@company.com</td><td>Employee</td><td><span className="badge badge-resolved">Active</span></td><td><button type="button" className="link-btn">Edit</button></td></tr>
          </tbody>
        </table>
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
