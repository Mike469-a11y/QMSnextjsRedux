import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Sourcing.css';

const Sourcing = () => {
    const [sourcingEntries, setSourcingEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const currentDateTime = '2025-07-31 23:40:15';
    const currentUser = 'Mike469-a11y';
    const navigate = useNavigate();

    // ✅ UPDATED: Load sourcing entries function - filter out hidden entries
    const loadSourcingEntries = () => {
        const stored = localStorage.getItem("sourcingEntries");
        if (stored) {
            try {
                const parsedEntries = JSON.parse(stored);
                // ✅ Filter out entries hidden from sourcing
                const visibleEntries = parsedEntries.filter(entry => !entry.hiddenFromSourcing);
                setSourcingEntries(visibleEntries);
                console.log('Loaded sourcing entries:', visibleEntries); // Debug log
            } catch (error) {
                console.error('Error parsing sourcing entries:', error);
                setSourcingEntries([]);
            }
        } else {
            console.log('No sourcing entries found in localStorage'); // Debug log
            setSourcingEntries([]);
        }
    };

    // Initial load and storage listener
    useEffect(() => {
        loadSourcingEntries();

        // Listen for localStorage changes from other tabs only
        const handleStorageChange = (e) => {
            if (e.key === 'sourcingEntries') {
                loadSourcingEntries();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Empty dependency array - only run once

    // ✅ Enhanced status detection for workflow
    const getEntryWorkflowStatus = (entry) => {
        if (entry.status === 'approval_approved') return 'approved';
        if (entry.status === 'approval_rejected') return 'rejected';
        if (entry.sourcingCompleted && entry.status === 'approval_pending') return 'requested';
        if (entry.sourcingStarted && !entry.sourcingCompleted) return 'in_progress';
        return 'not_started';
    };

    // ✅ ENHANCED: Updated filtering with workflow status
    const filteredEntries = useMemo(() => {
        let filtered = [...sourcingEntries]; // Create a copy to avoid mutations

        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(entry =>
                (entry.portalName && entry.portalName.toLowerCase().includes(searchLower)) ||
                (entry.bidNumber && entry.bidNumber.toLowerCase().includes(searchLower)) ||
                (entry.id && entry.id.toLowerCase().includes(searchLower)) ||
                (entry.hunterName && entry.hunterName.toLowerCase().includes(searchLower)) ||
                (entry.assignedBy && entry.assignedBy.toLowerCase().includes(searchLower)) ||
                (entry.bidTitle && entry.bidTitle.toLowerCase().includes(searchLower))
            );
        }

        // ✅ ENHANCED: Apply status filter with workflow awareness
        if (filterStatus !== "all") {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for consistent comparison

            filtered = filtered.filter(entry => {
                // ✅ Workflow status filtering
                if (filterStatus === "workflow-not-started") {
                    return getEntryWorkflowStatus(entry) === 'not_started';
                }
                if (filterStatus === "workflow-in-progress") {
                    return getEntryWorkflowStatus(entry) === 'in_progress';
                }
                if (filterStatus === "workflow-requested") {
                    return getEntryWorkflowStatus(entry) === 'requested';
                }
                if (filterStatus === "workflow-approved") {
                    return getEntryWorkflowStatus(entry) === 'approved';
                }
                if (filterStatus === "workflow-rejected") {
                    return getEntryWorkflowStatus(entry) === 'rejected';
                }

                // Original date-based filtering
                if (!entry.dueDate) return filterStatus === "active"; // No due date entries go to active

                const dueDate = new Date(entry.dueDate);
                dueDate.setHours(0, 0, 0, 0); // Reset time for consistent comparison

                const diffTime = dueDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

        return filtered;
    }, [sourcingEntries, searchTerm, filterStatus]); // Memoized based on these dependencies

    // ✅ UPDATED: Enhanced navigation - Approved entries can be edited
    const handleStartSourcing = (entry) => {
        const workflowStatus = getEntryWorkflowStatus(entry);

        console.log(`Navigating for entry ${entry.id} with status: ${workflowStatus}`); // Debug log

        // ✅ ALL statuses navigate to sourcing details for editing
        navigate(`/sourcing/${entry.id}`);
    };

    // ✅ UPDATED: Hide entry from sourcing instead of deleting from localStorage
    const handleDeleteEntry = (entryId) => {
        if (window.confirm(`Are you sure you want to remove entry ${entryId} from Sourcing Dashboard?\n\nNote: This will NOT affect the Approval section.`)) {
            try {
                const stored = localStorage.getItem("sourcingEntries");
                if (stored) {
                    const entries = JSON.parse(stored);
                    const updatedEntries = entries.map(entry => {
                        if (entry.id === entryId) {
                            return {
                                ...entry,
                                hiddenFromSourcing: true, // ✅ Just hide from sourcing view
                                hiddenAt: currentDateTime,
                                hiddenBy: currentUser
                            };
                        }
                        return entry;
                    });
                    localStorage.setItem("sourcingEntries", JSON.stringify(updatedEntries));
                    setSourcingEntries(updatedEntries.filter(entry => !entry.hiddenFromSourcing));
                    alert(`✅ Entry ${entryId} removed from Sourcing Dashboard.\n\n📋 Entry remains available in Approval section.`);
                }
            } catch (error) {
                console.error('Error hiding entry:', error);
                alert('❌ Error removing entry. Please try again.');
            }
        }
    };

    // ✅ UPDATED: Action button for enhanced workflow with delete button
    const getActionButton = (entry) => {
        const workflowStatus = getEntryWorkflowStatus(entry);

        switch (workflowStatus) {
            case 'approved':
                return (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                            className="btn-approved"
                            onClick={() => handleStartSourcing(entry)}
                            title="Edit approved sourcing details"
                        >
                            ✅ Approved - Edit
                        </button>
                        <button
                            className="btn-danger"
                            onClick={() => handleDeleteEntry(entry.id)}
                            title="Remove from Sourcing Dashboard"
                            style={{
                                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.2)',
                                minWidth: '60px',
                                height: '36px'
                            }}
                        >
                            🗑️
                        </button>
                    </div>
                );

            case 'rejected':
                return (
                    <button
                        className="btn-rejected"
                        onClick={() => handleStartSourcing(entry)}
                        title="Revise and resubmit"
                    >
                        ❌ Rejected - Revise
                    </button>
                );

            case 'requested':
                return (
                    <button
                        className="btn-requested"
                        disabled
                        title="Awaiting approval"
                    >
                        📋 Requested
                    </button>
                );

            case 'in_progress':
                return (
                    <button
                        className="btn-started"
                        onClick={() => handleStartSourcing(entry)}
                        title="Continue sourcing process"
                    >
                        📝 Continue
                    </button>
                );

            default: // not_started
                return (
                    <button
                        className="btn-start"
                        onClick={() => handleStartSourcing(entry)}
                        title="Start sourcing process for this entry"
                    >
                        🚀 Start
                    </button>
                );
        }
    };

    // ✅ Workflow status badge
    const getWorkflowStatusBadge = (entry) => {
        const workflowStatus = getEntryWorkflowStatus(entry);

        switch (workflowStatus) {
            case 'approved':
                return <span className="workflow-status-badge status-approved">✅ Approved</span>;
            case 'rejected':
                return <span className="workflow-status-badge status-rejected">❌ Rejected</span>;
            case 'requested':
                return <span className="workflow-status-badge status-requested">📋 Requested</span>;
            case 'in_progress':
                return <span className="workflow-status-badge status-in-progress">🔄 In Progress</span>;
            default:
                return <span className="workflow-status-badge status-not-started">⭕ Not Started</span>;
        }
    };

    // Date calculation functions with better error handling
    const calculateDaysLeft = (dueDate) => {
        if (!dueDate) return "No due date";

        try {
            const today = new Date();
            const due = new Date(dueDate);

            if (isNaN(due.getTime())) return "Invalid date";

            const diffTime = due - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays >= 0 ? `${diffDays} days` : `Overdue by ${Math.abs(diffDays)} days`;
        } catch (error) {
            console.error('Error calculating days left:', error);
            return "Invalid date";
        }
    };

    const getDaysLeftStatus = (dueDate) => {
        if (!dueDate) return "";

        try {
            const today = new Date();
            const due = new Date(dueDate);

            if (isNaN(due.getTime())) return "";

            const diffTime = due - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return "overdue";
            if (diffDays <= 3) return "due-soon";
            return "";
        } catch (error) {
            console.error('Error getting days left status:', error);
            return "";
        }
    };

    const getPriorityBadge = (dueDate) => {
        if (!dueDate) return null;

        try {
            const today = new Date();
            const due = new Date(dueDate);

            if (isNaN(due.getTime())) return null;

            const diffTime = due - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return <span className="priority-badge priority-critical">Overdue</span>;
            if (diffDays <= 3) return <span className="priority-badge priority-high">Urgent</span>;
            if (diffDays <= 7) return <span className="priority-badge priority-medium">Soon</span>;
            return <span className="priority-badge priority-low">Normal</span>;
        } catch (error) {
            console.error('Error getting priority badge:', error);
            return <span className="priority-badge priority-low">Normal</span>;
        }
    };

    const getStatusBadge = (entry) => {
        if (!entry.dueDate) return <span className="status-badge status-not-started">Active</span>;

        try {
            const today = new Date();
            const dueDate = new Date(entry.dueDate);

            if (isNaN(dueDate.getTime())) return <span className="status-badge status-not-started">Active</span>;

            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return <span className="status-badge status-overdue">Overdue</span>;
            if (diffDays <= 3) return <span className="status-badge status-review">Critical</span>;
            if (diffDays <= 7) return <span className="status-badge status-in-progress">In Progress</span>;
            return <span className="status-badge status-not-started">Active</span>;
        } catch (error) {
            console.error('Error getting status badge:', error);
            return <span className="status-badge status-not-started">Active</span>;
        }
    };

    // Handle search with debouncing to prevent excessive filtering
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        setFilterStatus(e.target.value);
    };

    // ✅ Calculate workflow statistics
    const workflowStats = useMemo(() => {
        const stats = {
            total: sourcingEntries.length,
            notStarted: 0,
            inProgress: 0,
            requested: 0,
            approved: 0,
            rejected: 0
        };

        sourcingEntries.forEach(entry => {
            const status = getEntryWorkflowStatus(entry);
            switch (status) {
                case 'not_started':
                    stats.notStarted++;
                    break;
                case 'in_progress':
                    stats.inProgress++;
                    break;
                case 'requested':
                    stats.requested++;
                    break;
                case 'approved':
                    stats.approved++;
                    break;
                case 'rejected':
                    stats.rejected++;
                    break;
            }
        });

        return stats;
    }, [sourcingEntries]);

    return (
        <div className="sourcing-container">
            <div className="sourcing-header">
                <div>
                    <h1>Sourcing Dashboard</h1>
                    <p>Manage sourcing activities and vendor relationships</p>
                </div>
                <div className="user-info">
                    <span>Current User: <strong>{currentUser}</strong></span>
                    <span>Date: <strong>{currentDateTime} UTC</strong></span>
                </div>
            </div>

            {/* ✅ Workflow Statistics */}
            <div className="workflow-stats">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{workflowStats.total}</h3>
                        <p>Total Entries</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⭕</div>
                    <div className="stat-content">
                        <h3>{workflowStats.notStarted}</h3>
                        <p>Not Started</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-content">
                        <h3>{workflowStats.inProgress}</h3>
                        <p>In Progress</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <h3>{workflowStats.requested}</h3>
                        <p>Requested</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{workflowStats.approved}</h3>
                        <p>Approved</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                        <h3>{workflowStats.rejected}</h3>
                        <p>Rejected</p>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="sourcing-controls">
                <div className="search-filter-section">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search by Portal, Bid Number, QMS ID, Hunter, or Assigned By..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <div className="filter-container">
                        <select
                            value={filterStatus}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            <option value="all">All Entries</option>
                            <optgroup label="Workflow Status">
                                <option value="workflow-not-started">⭕ Not Started</option>
                                <option value="workflow-in-progress">🔄 In Progress</option>
                                <option value="workflow-requested">📋 Requested</option>
                                <option value="workflow-approved">✅ Approved</option>
                                <option value="workflow-rejected">❌ Rejected</option>
                            </optgroup>
                            <optgroup label="Due Date Status">
                                <option value="overdue">Overdue</option>
                                <option value="due-soon">Due Soon (≤7 days)</option>
                                <option value="active">Active (&gt;7 days)</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                {/* ✅ FIXED: REMOVED ALL 4 BUTTONS - NOW EMPTY ACTIONS DIV */}
                <div className="sourcing-actions">
                    {/* All buttons deleted as requested */}
                </div>
            </div>

            {/* Debug Info - Remove this in production */}
            <div style={{ padding: '10px', background: '#f0f0f0', margin: '10px 0', borderRadius: '5px', fontSize: '12px' }}>
                <strong>Debug Info:</strong> Found {sourcingEntries.length} sourcing entries in localStorage
                <br />
                <strong>Filtered:</strong> Showing {filteredEntries.length} entries (Filter: {filterStatus}, Search: "{searchTerm}")
                <br />
                <strong>Workflow Stats:</strong> Not Started: {workflowStats.notStarted}, In Progress: {workflowStats.inProgress}, Requested: {workflowStats.requested}, Approved: {workflowStats.approved}, Rejected: {workflowStats.rejected}
                {sourcingEntries.length > 0 && (
                    <div>
                        <strong>Latest Entry:</strong> {sourcingEntries[sourcingEntries.length - 1]?.id} - {sourcingEntries[sourcingEntries.length - 1]?.portalName}
                    </div>
                )}
            </div>

            {/* Sourcing Table Section */}
            <div className="sourcing-list-container">
                <table className="sourcing-table">
                    <thead>
                        <tr>
                            <th>QMS ID</th>
                            <th>Portal Name</th>
                            <th>Bid Number</th>
                            <th>Due Date</th>
                            <th>Due Status</th>
                            <th>Workflow Status</th>
                            <th>Priority</th>
                            <th>Days Left</th>
                            <th>Assign To</th>
                            <th>Assigned By</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={11}>
                                    <div className="no-sourcing-message">
                                        <div className="no-sourcing-icon">📋</div>
                                        <h3>No Sourcing Entries Found</h3>
                                        <p>
                                            {sourcingEntries.length === 0
                                                ? "No entries have been assigned for sourcing yet. Complete assignments in the Assignment section to see them here."
                                                : `No entries match your current search criteria. (Filter: ${filterStatus}, Search: "${searchTerm}")`
                                            }
                                        </p>
                                        {sourcingEntries.length === 0 && (
                                            <button
                                                className="btn-create-first"
                                                onClick={() => navigate('/assignment')}
                                            >
                                                Go to Assignment Dashboard
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id} className={`workflow-status-${getEntryWorkflowStatus(entry)}`}>
                                    <td>
                                        <div className="sourcing-id-cell">
                                            {entry.id}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="sourcing-title">
                                            {entry.portalName || 'N/A'}
                                        </div>
                                        {/* ✅ Show bid title if available */}
                                        {entry.bidTitle && (
                                            <div className="sourcing-subtitle">
                                                {entry.bidTitle}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <strong>{entry.bidNumber || 'N/A'}</strong>
                                    </td>
                                    <td>
                                        <span className={`due-date ${getDaysLeftStatus(entry.dueDate)}`}>
                                            {entry.dueDate || 'No due date'}
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(entry)}</td>
                                    <td>{getWorkflowStatusBadge(entry)}</td>
                                    <td>{getPriorityBadge(entry.dueDate)}</td>
                                    <td>
                                        <strong className={getDaysLeftStatus(entry.dueDate)}>
                                            {calculateDaysLeft(entry.dueDate)}
                                        </strong>
                                    </td>
                                    <td>
                                        <div className="assigned-name">
                                            {entry.hunterName || 'Not Assigned'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="assigned-by-name">
                                            {entry.assignedBy || 'Not Set'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="source-actions">
                                            {getActionButton(entry)}
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
                            Showing {filteredEntries.length} of {sourcingEntries.length} sourcing entries
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sourcing;