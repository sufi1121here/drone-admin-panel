import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, UserPlus, Shield, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminManagement.css';

const AdminManagement = ({ token }) => {
  const domain = 'http://localhost:5000'; // dev
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, [token]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${domain}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      setIsCreating(true);
      await axios.post(`${domain}/api/admin/users`, 
        { username: newUsername, password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Admin ${newUsername} created successfully!`);
      setNewUsername('');
      setNewPassword('');
      fetchAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAdmin = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete admin account '${username}'?`)) return;

    try {
      await axios.delete(`${domain}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  return (
    <div className="admin-management-container">
      <div className="admin-management-grid">
        
        {/* Create Admin Form */}
        <div className="admin-card create-admin-card">
          <div className="card-header">
            <div className="icon-wrapper primary"><UserPlus size={20} /></div>
            <h3>Create New Admin</h3>
          </div>
          <p className="card-subtitle">Add a new user with full command center access.</p>
          <form onSubmit={handleCreateAdmin} className="create-admin-form">
            <div className="input-group">
              <Shield size={16} className="input-icon" />
              <input 
                type="text" 
                placeholder="Admin Username" 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <Key size={16} className="input-icon" />
              <input 
                type="password" 
                placeholder="Secure Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="create-btn" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>
        </div>

        {/* List of Admins */}
        <div className="admin-card admin-list-card">
          <div className="card-header">
            <div className="icon-wrapper secondary"><Shield size={20} /></div>
            <h3>Existing Admin Accounts</h3>
          </div>
          <p className="card-subtitle">Manage currently active admin accounts.</p>
          
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : (
            <div className="admin-list">
              {admins.map((admin) => (
                <div key={admin._id} className="admin-row">
                  <div className="admin-info">
                    <div className="admin-avatar">
                      {admin.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="admin-name">{admin.username}</span>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDeleteAdmin(admin._id, admin.username)}
                    title="Delete Admin"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {admins.length === 0 && <div className="empty-state">No other admins found.</div>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminManagement;
