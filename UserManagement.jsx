import React, { useState, useEffect } from 'react';
import AddUser from './AddUser';
import '../../styles/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  const currentDateTime = '2025-07-28 20:06:28';
  const currentUser = 'MFakheem';

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  const loadUsers = () => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(savedUsers);
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  };

  const handleAddUser = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
      status: 'Active'
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setShowAddUser(false);
  };

  const handleEditUser = (userData) => {
    const updatedUsers = users.map(user =>
      user.id === editingUser.id
        ? { ...user, ...userData, updatedAt: new Date().toISOString() }
        : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setEditingUser(null);
    setShowAddUser(false);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'Admin': '#e74c3c',
      'Manager': '#f39c12',
      'Employee': '#3498db',
      'Viewer': '#95a5a6'
    };
    return colors[role] || '#95a5a6';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const uniqueRoles = [...new Set(users.map(user => user.role))];

  if (showAddUser) {
    return (
      <AddUser
        onAddUser={editingUser ? handleEditUser : handleAddUser}
        onCancel={() => {
          setShowAddUser(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
      />
    );
  }

  return (
    <div className="user-management-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage users, roles, and permissions</p>
        </div>
        <div className="header-info">
          <div className="info-item">
            <span className="info-label">Current User:</span>
            <span className="info-value">{currentUser}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Date:</span>
            <span className="info-value">{currentDateTime} UTC</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-number">{filteredUsers.length}</div>
            <div className="stat-label">Displayed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{users.filter(u => u.status === 'Active').length}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-number">{uniqueRoles.length}</div>
            <div className="stat-label">Roles</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-panel">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users by name, email, department, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="search-icon">🔍</div>
          </div>

          <div className="filter-box">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAddUser(true)}
          className="add-button"
        >
          <span className="button-icon">+</span>
          Add New User
        </button>
      </div>

      {/* Users Grid */}
      <div className="users-section">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3 className="empty-title">No users found</h3>
            <p className="empty-text">
              {users.length === 0
                ? "Start by adding your first user to the system"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            <button
              onClick={() => setShowAddUser(true)}
              className="empty-action-button"
            >
              Add User
            </button>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-card-header">
                  <div className="user-avatar">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="user-basic-info">
                    <h3 className="user-name">{user.name}</h3>
                    <p className="user-id">ID: {user.id}</p>
                  </div>
                  <div className="user-actions">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowAddUser(true);
                      }}
                      className="action-btn edit-btn"
                      title="Edit User"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="action-btn delete-btn"
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="user-card-body">
                  <div className="user-detail">
                    <span className="detail-label">Email</span>
                    <a href={`mailto:${user.email}`} className="detail-value email-link">
                      {user.email}
                    </a>
                  </div>

                  <div className="user-detail">
                    <span className="detail-label">Department</span>
                    <span className="detail-value">{user.department || 'N/A'}</span>
                  </div>

                  <div className="user-detail">
                    <span className="detail-label">Role</span>
                    <span
                      className="role-badge"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="user-detail">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${(user.status || 'active').toLowerCase()}`}>
                      {user.status || 'Active'}
                    </span>
                  </div>

                  <div className="user-detail">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredUsers.length > 0 && (
        <div className="results-footer">
          <div className="results-text">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;