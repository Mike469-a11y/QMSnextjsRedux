import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Assignment.css";

const Assignment = () => {
    const [entries, setEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [users, setUsers] = useState([]);

    const currentDateTime = '2025-07-28 21:04:14';
    const currentUser = 'MFakheem';
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ FIXED: Use assignmentEntries instead of qmsEntries
        const stored = localStorage.getItem("assignmentEntries");
        if (stored) {
            const parsedEntries = JSON.parse(stored);
            setEntries(parsedEntries);
            setFilteredEntries(parsedEntries);
            console.log('Loaded Assignment entries:', parsedEntries);
        }

        loadUsers();

        const handleStorageChange = (e) => {
            if (e.key === 'users') {
                loadUsers();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(loadUsers, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const loadUsers = () => {
        const storedUsers = localStorage.getItem("users");
        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            setUsers(parsedUsers);
            console.log('Loaded users:', parsedUsers);
        } else {
            console.log('No users found in localStorage');
        }
    };

    useEffect(() => {
        let filtered = entries;

        if (searchTerm) {
            filtered = filtered.filter(entry =>
                entry.portalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.bidNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (entry.hunterName && entry.hunterName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filterStatus !== "all") {
            const today = new Date();
            filtered = filtered.filter(entry => {
                const dueDate = new Date(entry.dueDate);
                const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                switch (filterStatus) {
                    case "overdue":
                        return diffDays < 0;
                    case "due-soon":
                        return diffDays >= 0 && diffDays <= 7;
                    case "active":
                        return diffDays > 7;
                    default:
                        return true;
                }
            });
        }

        setFilteredEntries(filtered);
    }, [entries, searchTerm, filterStatus]);

    const goToDetails = (id) => navigate(`/qms/${id}`);

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete this entry from Assignment? Note: This will NOT delete it from other sections.")) return;

        console.log(`Attempting to delete entry ${id} from Assignment`);

        const updatedEntries = entries.filter((entry) => entry.id !== id);
        setEntries(updatedEntries);
        // ✅ FIXED: Save to assignmentEntries instead of qmsEntries
        localStorage.setItem("assignmentEntries", JSON.stringify(updatedEntries));

        console.log(`Entry ${id} deleted from Assignment. Remaining entries:`, updatedEntries);

        alert(`Entry ${id} has been deleted from Assignment section only.`);
    };

    const transferToSourcing = (entry) => {
        console.log('Transferring entry to sourcing:', entry);

        const existingSourcing = localStorage.getItem("sourcingEntries");
        let sourcingEntries = existingSourcing ? JSON.parse(existingSourcing) : [];

        console.log('Existing sourcing entries:', sourcingEntries);

        const existingIndex = sourcingEntries.findIndex(item => item.id === entry.id);

        if (existingIndex >= 0) {
            sourcingEntries[existingIndex] = {
                ...entry,
                transferredAt: currentDateTime,
                transferredBy: currentUser
            };
            console.log('Updated existing entry in sourcing');
        } else {
            sourcingEntries.push({
                ...entry,
                transferredAt: currentDateTime,
                transferredBy: currentUser
            });
            console.log('Added new entry to sourcing');
        }

        localStorage.setItem("sourcingEntries", JSON.stringify(sourcingEntries));
        console.log('Saved to localStorage:', sourcingEntries);

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `✅ Entry ${entry.id} transferred to Sourcing!`;
        document.body.appendChild(notification);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    };

    const handleAssignUser = (entryId, selectedUserId) => {
        if (!selectedUserId) return;

        console.log(`Assigning user ${selectedUserId} to entry ${entryId}`);

        const selectedUser = users.find(user => user.id.toString() === selectedUserId);
        if (!selectedUser) {
            console.log('User not found:', selectedUserId);
            return;
        }

        console.log('Selected user:', selectedUser);

        const updatedEntries = entries.map(entry => {
            if (entry.id === entryId) {
                const updatedEntry = {
                    ...entry,
                    hunterName: selectedUser.name,
                    assignedUserId: selectedUser.id,
                    assignedAt: currentDateTime,
                    assignedBy: entry.assignedBy || ''
                };

                console.log('Updated entry:', updatedEntry);

                if (updatedEntry.hunterName && updatedEntry.assignedBy) {
                    console.log('Both Assign To and Assigned By are set, transferring to sourcing');
                    transferToSourcing(updatedEntry);
                } else {
                    console.log('Not transferring to sourcing. hunterName:', updatedEntry.hunterName, 'assignedBy:', updatedEntry.assignedBy);
                }

                return updatedEntry;
            }
            return entry;
        });

        setEntries(updatedEntries);
        // ✅ FIXED: Save to assignmentEntries instead of qmsEntries
        localStorage.setItem("assignmentEntries", JSON.stringify(updatedEntries));

        alert(`Successfully assigned "${selectedUser.name}" to entry ${entryId}`);
    };

    const handleAssignedBy = (entryId, assignedByValue) => {
        console.log(`Setting assignedBy for entry ${entryId} to:`, assignedByValue);

        const updatedEntries = entries.map(entry => {
            if (entry.id === entryId) {
                const updatedEntry = {
                    ...entry,
                    assignedBy: assignedByValue,
                    assignedByAt: currentDateTime,
                    assignedByUser: currentUser
                };

                console.log('Updated entry:', updatedEntry);

                if (updatedEntry.hunterName && updatedEntry.assignedBy) {
                    console.log('Both Assign To and Assigned By are set, transferring to sourcing');
                    transferToSourcing(updatedEntry);
                } else {
                    console.log('Not transferring to sourcing. hunterName:', updatedEntry.hunterName, 'assignedBy:', updatedEntry.assignedBy);
                }

                return updatedEntry;
            }
            return entry;
        });

        setEntries(updatedEntries);
        // ✅ FIXED: Save to assignmentEntries instead of qmsEntries
        localStorage.setItem("assignmentEntries", JSON.stringify(updatedEntries));
    };

    const calculateDaysLeft = (dueDate) => {
        if (!dueDate) return "No due date";
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? `${diffDays} days` : `Overdue by ${Math.abs(diffDays)} days`;
    };

    const getDaysLeftStatus = (dueDate) => {
        if (!dueDate) return "";
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "overdue";
        if (diffDays <= 3) return "due-soon";
        return "";
    };

    const getPriorityBadge = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return <span className="priority-badge priority-critical">Overdue</span>;
        if (diffDays <= 3) return <span className="priority-badge priority-high">Urgent</span>;
        if (diffDays <= 7) return <span className="priority-badge priority-medium">Soon</span>;
        return <span className="priority-badge priority-low">Normal</span>;
    };

    const getStatusBadge = (entry) => {
        const today = new Date();
        const dueDate = new Date(entry.dueDate);
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return <span className="status-badge status-overdue">Overdue</span>;
        if (diffDays <= 3) return <span className="status-badge status-review">Critical</span>;
        if (diffDays <= 7) return <span className="status-badge status-in-progress">In Progress</span>;
        return <span className="status-badge status-not-started">Active</span>;
    };

    return (
        <div className="assignment-container">
            {/* Header Section */}
            <div className="assignment-header">
                <div>
                    <h1>Assignment Dashboard</h1>
                    <p>Track and manage your QMS entries with deadlines and priorities</p>
                </div>
                <div className="user-info">
                    <span>Current User: <strong>{currentUser}</strong></span>
                    <span>Date: <strong>{currentDateTime} UTC</strong></span>
                </div>
            </div>

            {/* Debug Info Panel - Remove this in production */}
            <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '10px',
                margin: '10px 0',
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                <strong>🐛 Debug Info:</strong><br />
                Assignment Entries: {entries.length} |
                Users Loaded: {users.length} |
                Filtered Results: {filteredEntries.length}<br />
                <small>Check browser console for detailed logs</small>
            </div>

            {/* Controls Section */}
            <div className="assignment-controls">
                <div className="search-filter-section">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search by Portal, Bid Number, QMS ID, or Hunter Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <div className="filter-container">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Entries</option>
                            <option value="overdue">Overdue</option>
                            <option value="due-soon">Due Soon (≤7 days)</option>
                            <option value="active">Active (7 days)</option>
                        </select>
                    </div>
                </div>

                <div className="assignment-actions">
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/')}
                    >
                        ➕ Add New Entry
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => window.print()}
                    >
                        🖨️ Print Report
                    </button>
                    <button
                        className="btn-sourcing"
                        onClick={() => navigate('/sourcing')}
                    >
                        🎯 Go to Sourcing
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="assignment-list-container">
                <table className="assignment-table">
                    <thead>
                        <tr>
                            <th>QMS ID</th>
                            <th>Date</th>
                            <th>Portal Name</th>
                            <th>Bid Number</th>
                            <th>Hunter</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Days Left</th>
                            <th>Actions</th>
                            <th>Assign To</th>
                            <th>Assigned By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={12}>
                                    <div className="no-assignments-message">
                                        <div className="no-assignments-icon">📋</div>
                                        <h3>No Entries Found</h3>
                                        <p>
                                            {entries.length === 0
                                                ? "No QMS entries have been created yet."
                                                : "No entries match your current search criteria."
                                            }
                                        </p>
                                        {entries.length === 0 && (
                                            <button
                                                className="btn-create-first"
                                                onClick={() => navigate('/')}
                                            >
                                                Create Your First Entry
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td>
                                        <div className="assignment-id-cell">
                                            {entry.id}
                                        </div>
                                    </td>
                                    <td>{entry.date || 'N/A'}</td>
                                    <td>
                                        <div className="assignment-title">
                                            {entry.portalName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{entry.bidNumber || 'N/A'}</strong>
                                    </td>
                                    <td>
                                        <div className="hunter-name">
                                            {entry.hunterName || 'Not Assigned'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`due-date ${getDaysLeftStatus(entry.dueDate)}`}>
                                            {entry.dueDate || 'No due date'}
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(entry)}</td>
                                    <td>{getPriorityBadge(entry.dueDate)}</td>
                                    <td>
                                        <strong className={getDaysLeftStatus(entry.dueDate)}>
                                            {calculateDaysLeft(entry.dueDate)}
                                        </strong>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-view"
                                                onClick={() => goToDetails(entry.id)}
                                                title="View Details"
                                            >
                                                View
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(entry.id)}
                                                title="Delete Entry from Assignment only"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="assign-to-container">
                                            <select
                                                className="assign-to-select"
                                                value={entry.assignedUserId || ""}
                                                onChange={(e) => handleAssignUser(entry.id, e.target.value)}
                                                title="Assign this entry to a user"
                                            >
                                                <option value="">Select User...</option>
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name} ({user.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="assigned-by-container">
                                            <select
                                                className="assigned-by-select"
                                                value={entry.assignedBy || ""}
                                                onChange={(e) => handleAssignedBy(entry.id, e.target.value)}
                                                title="Select who assigned this entry"
                                            >
                                                <option value="">Select...</option>
                                                <option value="Joe">Joe</option>
                                                <option value="Jack">Jack</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {filteredEntries.length > 0 && (
                    <div className="table-footer">
                        <div className="results-info">
                            Showing {filteredEntries.length} of {entries.length} entries
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Assignment;