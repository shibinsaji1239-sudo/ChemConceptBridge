import React, { useEffect, useMemo, useState } from 'react';
import api from '../../apiClient';
import './AdminUsers.css';
import { toast } from 'react-toastify';

// Admin user management: list, create teacher/student, change role, delete
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher', assignedTeacher: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const totals = { all: users.length, admin: 0, teacher: 0, student: 0 };
    users.forEach(u => {
      if (u.role in totals) totals[u.role] += 1;
    });
    return totals;
  }, [users]);

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    else if (!/[A-Z]/.test(form.password)) errors.password = 'Password must contain at least one uppercase letter';
    else if (!/[0-9]/.test(form.password)) errors.password = 'Password must contain at least one number';
    
    if (form.role === 'student' && !form.assignedTeacher) errors.assignedTeacher = 'Assign a teacher';
    
    return errors;
  };

  const onCreate = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setSubmitting(true);
    setError('');
    
    try {
      const body = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === 'student' && form.assignedTeacher) body.assignedTeacher = form.assignedTeacher;
      const { data } = await api.post('/admin/users', body);
      setUsers(prev => [data, ...prev]);
      setCreating(false);
      setForm({ name: '', email: '', password: '', role: 'teacher', assignedTeacher: '' });
      toast.success(`User ${data.name} created successfully`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user');
      toast.error(e.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted successfully');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete user');
      toast.error(e.response?.data?.message || 'Failed to delete user');
    }
  };

  const onChangeRole = async (id, role) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => (u._id === id ? data : u)));
      toast.success(`User role updated to ${role}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update role');
      toast.error(e.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="admin-users">
      <div className="au-header">
        <div>
          <h3>User Management</h3>
          <p className="au-sub">Create teachers/students, update roles, and remove users.</p>
        </div>
        <button className="btn primary" onClick={() => setCreating(true)}>+ New User</button>
      </div>

      {error && <div className="au-alert error">{error}</div>}

      <div className="au-stats">
        <div className="stat"><span className="label">Total</span><span className="value">{counts.all}</span></div>
        <div className="stat"><span className="label">Admins</span><span className="value">{counts.admin}</span></div>
        <div className="stat"><span className="label">Teachers</span><span className="value">{counts.teacher}</span></div>
        <div className="stat"><span className="label">Students</span><span className="value">{counts.student}</span></div>
      </div>

      {creating && (
        <form className="au-form" onSubmit={onCreate}>
          <div className="row">
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  setForm({ ...form, name: e.target.value });
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: '' });
                  }
                }}
                placeholder="Full name"
                required
                className={formErrors.name ? 'error' : ''}
              />
              {formErrors.name && <div className="error-text">{formErrors.name}</div>}
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => {
                  setForm({ ...form, email: e.target.value });
                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: '' });
                  }
                }}
                placeholder="user@example.com"
                required
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <div className="error-text">{formErrors.email}</div>}
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => {
                  setForm({ ...form, password: e.target.value });
                  if (formErrors.password) {
                    setFormErrors({ ...formErrors, password: '' });
                  }
                }}
                placeholder="Min 6 chars, 1 uppercase, 1 number"
                minLength={6}
                required
                className={formErrors.password ? 'error' : ''}
              />
              {formErrors.password && <div className="error-text">{formErrors.password}</div>}
            </div>
          <div className="field">
            <label>Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className={formErrors.role ? 'error' : ''}
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          {form.role === 'student' && (
            <div className="field">
              <label>Assign to Teacher</label>
              <select
                value={form.assignedTeacher}
                onChange={e => setForm({ ...form, assignedTeacher: e.target.value })}
                className={formErrors.assignedTeacher ? 'error' : ''}
                required
              >
                <option value="">Select teacher…</option>
                {users.filter(u => u.role === 'teacher').map(t => (
                  <option key={t._id} value={t._id}>{t.name || t.email}</option>
                ))}
              </select>
              {formErrors.assignedTeacher && <div className="error-text">{formErrors.assignedTeacher}</div>}
            </div>
          )}
          </div>
          <div className="row end">
            <button type="button" className="btn" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      <div className="au-table-wrapper">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <table className="au-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="role-select"
                      value={u.role}
                      onChange={e => onChangeRole(u._id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn danger" onClick={() => onDelete(u._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
