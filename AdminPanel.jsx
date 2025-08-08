import React, { useState, useEffect } from 'react';
import '../../styles/AdminPanel.css';

const AdminPanel = () => {
    const [qmsData, setQmsData] = useState([]);
    const [userData, setUserData] = useState([]);
    const [stats, setStats] = useState({
        totalEntries: 0,
        totalUsers: 0,
        pendingTasks: 0,
        completedTasks: 0
    });

    useEffect(() => {
        // Load data from localStorage
        const qmsEntries = JSON.parse(localStorage.getItem('qmsEntries') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        setQmsData(qmsEntries);
        setUserData(users);

        // Calculate dynamic stats
        const today = new Date();
        const pendingCount = qmsEntries.filter(entry => {
            const dueDate = entry.dueDate ? new Date(entry.dueDate) : null;
            return dueDate && dueDate >= today;
        }).length;

        const completedCount = qmsEntries.filter(entry => {
            const dueDate = entry.dueDate ? new Date(entry.dueDate) : null;
            return dueDate && dueDate < today;
        }).length;

        setStats({
            totalEntries: qmsEntries.length,
            totalUsers: users.length,
            pendingTasks: pendingCount,
            completedTasks: completedCount
        });
    }, []);

    const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+),?\s*(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');

    // Generate better recent activities
    const generateRecentActivities = () => {
        const activities = [];

        // Add QMS entries activities
        const recentQmsEntries = qmsData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        recentQmsEntries.forEach((entry, index) => {
            const entryTitle = entry.portalName || entry.bidNumber || entry.bidTitle || `QMS-${entry.id}`;
            const today = new Date();
            const dueDate = entry.dueDate ? new Date(entry.dueDate) : null;
            let status = 'active';

            if (dueDate) {
                if (dueDate < today) {
                    status = 'completed';
                } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                    status = 'pending';
                }
            }

            activities.push({
                id: `qms-${entry.id}`,
                action: `New QMS entry: ${entryTitle}`,
                user: entry.hunterName || 'MFakheem',
                time: entry.date ? new Date(entry.date).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }) + ', ' + new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : currentTime,
                status: status,
                type: 'qms'
            });
        });

        // Add user management activities
        const recentUsers = userData
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 2);

        recentUsers.forEach(user => {
            activities.push({
                id: `user-${user.id}`,
                action: `New user registered: ${user.name}`,
                user: 'MFakheem',
                time: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }) + ', ' + new Date(user.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : currentTime,
                status: 'active',
                type: 'user'
            });
        });

        // Add system activities if no real activities exist
        if (activities.length === 0) {
            activities.push(
                {
                    id: 'system-1',
                    action: 'System initialized successfully',
                    user: 'System',
                    time: currentTime.replace(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/, '$2/$3/$1, $4:$5 PM'),
                    status: 'active',
                    type: 'system'
                },
                {
                    id: 'system-2',
                    action: 'Admin panel accessed',
                    user: 'MFakheem',
                    time: currentTime.replace(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/, '$2/$3/$1, $4:$5 PM'),
                    status: 'active',
                    type: 'system'
                }
            );
        }

        // Sort by most recent and return top 5
        return activities
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5);
    };

    const recentActivities = generateRecentActivities();

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-info">
                    <span>Current User: MFakheem</span>
                    <span>Last Updated: {currentTime} UTC</span>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>Total QMS Entries</h3>
                        <p className="stat-number">{stats.totalEntries}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>Total Users</h3>
                        <p className="stat-number">{stats.totalUsers}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>Pending Tasks</h3>
                        <p className="stat-number">{stats.pendingTasks}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>Completed Tasks</h3>
                        <p className="stat-number">{stats.completedTasks}</p>
                    </div>
                </div>
            </div>

            <div className="admin-content">
                <div className="recent-activities">
                    <h2>Recent Activities</h2>
                    <div className="activity-list">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div key={activity.id} className="activity-item">
                                    <div className="activity-details">
                                        <p className="activity-action">
                                            <span className="activity-icon">
                                                {activity.type === 'qms' ? '📋' :
                                                    activity.type === 'user' ? '👤' : '⚙️'}
                                            </span>
                                            {activity.action}
                                        </p>
                                        <p className="activity-meta">
                                            by <strong>{activity.user}</strong> • {activity.time}
                                        </p>
                                    </div>
                                    <span className={`activity-status ${activity.status.toLowerCase()}`}>
                                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="no-activities">
                                <p>No recent activities found</p>
                                <p>QMS entries and user actions will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons">
                        <button className="action-btn primary" onClick={() => window.location.href = '/qms'}>
                            <span className="btn-icon">➕</span>
                            Add New Entry
                        </button>
                        <button className="action-btn secondary" onClick={() => window.location.href = '/admin/usermanagement'}>
                            <span className="btn-icon">👤</span>
                            Manage Users
                        </button>
                        <button className="action-btn tertiary" onClick={() => window.location.href = '/admin/tracking-performance'}>
                            <span className="btn-icon">📊</span>
                            View Performance
                        </button>
                        <button className="action-btn quaternary" onClick={() => window.print()}>
                            <span className="btn-icon">📋</span>
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            <div className="system-info">
                <h2>System Information</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>System Status:</label>
                        <span className="status-active">Active</span>
                    </div>
                    <div className="info-item">
                        <label>Database:</label>
                        <span>LocalStorage (Browser)</span>
                    </div>
                    <div className="info-item">
                        <label>Current Environment:</label>
                        <span>Development</span>
                    </div>
                    <div className="info-item">
                        <label>Last Backup:</label>
                        <span>{currentTime} UTC</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;