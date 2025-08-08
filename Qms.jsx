import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const currentDateTime = '2025-07-28 21:33:04';
const currentUser = 'MFakheem';
const todayStr = new Date().toISOString().slice(0, 10);

const Qms = () => {
    const [huntingView, setHuntingView] = useState("search");
    const [searchInputs, setSearchInputs] = useState({
        fromDate: "",
        toDate: "",
        portalName: "",
        bidNumber: "",
        hunterName: ""
    });
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [newEntry, setNewEntry] = useState({
        id: "",
        date: todayStr,
        portalName: "",
        portalLink: "",
        bidNumber: "",
        bidTitle: "",
        category: "",
        quantity: "",
        timeStamp: "",
        dueDate: "",
        contactName: "",
        email: "",
        huntingRemarks: "",
        hunterName: ""
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // ✅ FIXED: Use huntingEntries instead of qmsEntries
        const stored = localStorage.getItem("huntingEntries");
        if (stored) {
            const parsedEntries = JSON.parse(stored);
            setEntries(parsedEntries);
            setFilteredEntries(parsedEntries);
        }
    }, []);

    useEffect(() => {
        const section = new URLSearchParams(location.search).get("section");
        if (section === "hunting") {
            setHuntingView("search");
        }

        // Check if we're editing an entry
        if (location.state?.editEntry) {
            const editEntry = location.state.editEntry;
            setNewEntry(editEntry);
            setIsEditing(true);
            setEditingId(editEntry.id);
            setHuntingView("add");

            // Clear the state to prevent issues on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchInputs((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        setFilteredEntries(
            entries.filter((entry) => {
                const { fromDate, toDate, portalName, bidNumber, hunterName } = searchInputs;
                const entryDate = new Date(entry.date);
                const matchesFrom = !fromDate || new Date(fromDate) <= entryDate;
                const matchesTo = !toDate || entryDate <= new Date(toDate);
                const matchesPortal =
                    !portalName ||
                    entry.portalName.toLowerCase().includes(portalName.toLowerCase());
                const matchesBid =
                    !bidNumber ||
                    entry.bidNumber.toLowerCase().includes(bidNumber.toLowerCase());
                const matchesHunter =
                    !hunterName ||
                    (entry.hunterName && entry.hunterName.toLowerCase().includes(hunterName.toLowerCase()));
                return matchesFrom && matchesTo && matchesPortal && matchesBid && matchesHunter;
            })
        );
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEntry((prev) => ({ ...prev, [name]: value }));
    };

    const generateId = () => {
        const lastId = entries.length
            ? parseInt(entries[entries.length - 1].id.slice(1))
            : 0;
        return `Q${(lastId + 1).toString().padStart(4, "0")}`;
    };

    const handleAddEntry = () => {
        if (!newEntry.date || !newEntry.portalName || !newEntry.bidNumber) {
            alert("Please fill all required fields.");
            return;
        }

        let updated;

        if (isEditing) {
            // Update existing entry with timestamp
            const updatedEntry = {
                ...newEntry,
                lastModified: currentDateTime,
                lastModifiedBy: currentUser
            };
            updated = entries.map(entry =>
                entry.id === editingId ? updatedEntry : entry
            );
            alert("Entry updated successfully!");
        } else {
            // Add new entry with creation timestamp
            const id = generateId();
            const entryWithId = {
                ...newEntry,
                id,
                createdAt: currentDateTime,
                createdBy: currentUser
            };
            updated = [...entries, entryWithId];
            alert("Entry added successfully!");
        }

        setEntries(updated);
        setFilteredEntries(updated);
        // ✅ FIXED: Save to huntingEntries instead of qmsEntries
        localStorage.setItem("huntingEntries", JSON.stringify(updated));

        // ✅ FIXED: Also copy to assignmentEntries for Assignment section
        const existingAssignment = localStorage.getItem("assignmentEntries");
        let assignmentEntries = existingAssignment ? JSON.parse(existingAssignment) : [];

        if (isEditing) {
            // Update in assignment if it exists
            const updatedEntry = updated.find(e => e.id === editingId);
            assignmentEntries = assignmentEntries.map(entry =>
                entry.id === editingId ? updatedEntry : entry
            );
        } else {
            // Add new entry to assignment
            const newEntryForAssignment = updated[updated.length - 1];
            assignmentEntries.push(newEntryForAssignment);
        }

        localStorage.setItem("assignmentEntries", JSON.stringify(assignmentEntries));

        // Reset form
        setNewEntry({
            id: "",
            date: todayStr,
            portalName: "",
            portalLink: "",
            bidNumber: "",
            bidTitle: "",
            category: "",
            quantity: "",
            timeStamp: "",
            dueDate: "",
            contactName: "",
            email: "",
            huntingRemarks: "",
            hunterName: ""
        });
        setIsEditing(false);
        setEditingId(null);
        setHuntingView("search");
    };

    const handleCancel = () => {
        setNewEntry({
            id: "",
            date: todayStr,
            portalName: "",
            portalLink: "",
            bidNumber: "",
            bidTitle: "",
            category: "",
            quantity: "",
            timeStamp: "",
            dueDate: "",
            contactName: "",
            email: "",
            huntingRemarks: "",
            hunterName: ""
        });
        setIsEditing(false);
        setEditingId(null);
        setHuntingView("search");
    };

    const goToDetails = (id) => navigate(`/qms/${id}`);

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete this entry from Hunting? Note: This will NOT delete it from other sections.")) return;
        const updatedEntries = entries.filter((entry) => entry.id !== id);
        setEntries(updatedEntries);
        setFilteredEntries(filteredEntries.filter((entry) => entry.id !== id));
        // ✅ FIXED: Save to huntingEntries instead of qmsEntries
        localStorage.setItem("huntingEntries", JSON.stringify(updatedEntries));
        alert(`Entry ${id} deleted from Hunting section only.`);
    };

    return (
        <div className="qms-container">
            {/* Header Section */}
            <div className="qms-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>QMS - {huntingView === "search" ? "Search Entry" : (isEditing ? "Edit Entry" : "Add New Entry")}</h1>
                        <p>{huntingView === "search" ? "Search and manage your QMS entries" : (isEditing ? `Edit QMS entry ${editingId}` : "Create a new QMS entry")}</p>
                    </div>
                    <div className="header-right">
                        <div className="user-info">
                            <span>Current User: <strong>{currentUser}</strong></span>
                            <span>Date: <strong>{currentDateTime} UTC</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Switch */}
            <div className="qms-controls">
                <div className="qms-actions">
                    <button
                        onClick={() => setHuntingView("search")}
                        className={huntingView === "search" ? "btn-primary" : "btn-secondary"}
                    >
                        🔍 Search
                    </button>
                    <button
                        onClick={() => {
                            setHuntingView("add");
                            if (isEditing) {
                                setIsEditing(false);
                                setEditingId(null);
                                setNewEntry({
                                    id: "",
                                    date: todayStr,
                                    portalName: "",
                                    portalLink: "",
                                    bidNumber: "",
                                    bidTitle: "",
                                    category: "",
                                    quantity: "",
                                    timeStamp: "",
                                    dueDate: "",
                                    contactName: "",
                                    email: "",
                                    huntingRemarks: "",
                                    hunterName: ""
                                });
                            }
                        }}
                        className={huntingView === "add" && !isEditing ? "btn-primary" : "btn-secondary"}
                    >
                        ➕ Add New
                    </button>
                </div>
            </div>

            {/* SEARCH VIEW */}
            {huntingView === "search" && (
                <div className="qms-search-container">
                    <div className="qms-search-form">
                        <form
                            className="search-form-grid"
                            onSubmit={e => {
                                e.preventDefault();
                                handleSearch();
                            }}
                            autoComplete="off"
                        >
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input
                                    name="fromDate"
                                    type="date"
                                    className="form-input"
                                    value={searchInputs.fromDate}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input
                                    name="toDate"
                                    type="date"
                                    className="form-input"
                                    value={searchInputs.toDate}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Portal Name</label>
                                <input
                                    name="portalName"
                                    placeholder="Portal Name"
                                    className="form-input"
                                    value={searchInputs.portalName}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Bid Number</label>
                                <input
                                    name="bidNumber"
                                    placeholder="Bid Number"
                                    className="form-input"
                                    value={searchInputs.bidNumber}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hunter Name</label>
                                <input
                                    name="hunterName"
                                    placeholder="Hunter Name"
                                    className="form-input"
                                    value={searchInputs.hunterName}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </form>

                        <div className="search-form-actions">
                            <button type="submit" className="btn-search" onClick={handleSearch}>
                                🔍 Search Entries
                            </button>
                            <button type="button" className="btn-reset" onClick={() => {
                                setSearchInputs({
                                    fromDate: "",
                                    toDate: "",
                                    portalName: "",
                                    bidNumber: "",
                                    hunterName: ""
                                });
                                setFilteredEntries(entries);
                            }}>
                                🔄 Reset
                            </button>
                        </div>
                    </div>

                    <div className="qms-list-container">
                        <table className="qms-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Portal Name</th>
                                    <th>Bid Number</th>
                                    <th>Hunter Name</th>
                                    <th>Time Stamp</th>
                                    <th>Due Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{entry.date}</td>
                                        <td>{entry.portalName}</td>
                                        <td>{entry.bidNumber}</td>
                                        <td>{entry.hunterName || 'N/A'}</td>
                                        <td>{entry.timeStamp}</td>
                                        <td>{entry.dueDate}</td>
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
                                                    title="Delete Entry from Hunting only"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ADD/EDIT VIEW */}
            {huntingView === "add" && (
                <div className="qms-add-container">
                    <div className="qms-add-form">
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                handleAddEntry();
                            }}
                            autoComplete="off"
                        >
                            <div className="form-section">
                                <h3><span className="form-section-icon">📝</span>Basic Information</h3>
                                <div className="add-form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Date *</label>
                                        <input
                                            name="date"
                                            type="date"
                                            className="form-input"
                                            value={newEntry.date}
                                            onChange={handleInputChange}
                                            required
                                            readOnly={!isEditing}
                                            style={!isEditing ? { background: "#f3f4f6", color: "#555", cursor: "not-allowed" } : {}}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Portal Name *</label>
                                        <input
                                            name="portalName"
                                            placeholder="Portal Name"
                                            className="form-input"
                                            value={newEntry.portalName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Portal Link</label>
                                        <input
                                            name="portalLink"
                                            placeholder="Portal Link"
                                            className="form-input"
                                            value={newEntry.portalLink}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><span className="form-section-icon">📋</span>Bid Details</h3>
                                <div className="add-form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Bid Number *</label>
                                        <input
                                            name="bidNumber"
                                            placeholder="Bid Number"
                                            className="form-input"
                                            value={newEntry.bidNumber}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bid Title</label>
                                        <input
                                            name="bidTitle"
                                            placeholder="Bid Title"
                                            className="form-input"
                                            value={newEntry.bidTitle}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <input
                                            name="category"
                                            placeholder="Category"
                                            className="form-input"
                                            value={newEntry.category}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quantity</label>
                                        <input
                                            name="quantity"
                                            placeholder="Quantity"
                                            type="number"
                                            min="1"
                                            className="form-input"
                                            value={newEntry.quantity}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><span className="form-section-icon">📅</span>Timeline</h3>
                                <div className="add-form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Time Stamp</label>
                                        <input
                                            name="timeStamp"
                                            type="date"
                                            className="form-input"
                                            value={newEntry.timeStamp}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input
                                            name="dueDate"
                                            type="date"
                                            className="form-input"
                                            value={newEntry.dueDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><span className="form-section-icon">👤</span>Contact Information</h3>
                                <div className="add-form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Hunter Name</label>
                                        <input
                                            name="hunterName"
                                            placeholder="Hunter Name"
                                            className="form-input"
                                            value={newEntry.hunterName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Name</label>
                                        <input
                                            name="contactName"
                                            placeholder="Contact Name"
                                            className="form-input"
                                            value={newEntry.contactName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="Email"
                                            className="form-input"
                                            value={newEntry.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><span className="form-section-icon">💬</span>Additional Notes</h3>
                                <div className="form-group">
                                    <label className="form-label">Hunting Remarks</label>
                                    <textarea
                                        name="huntingRemarks"
                                        placeholder="Hunting Remarks"
                                        className="form-textarea"
                                        value={newEntry.huntingRemarks}
                                        onChange={handleInputChange}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="add-form-actions">
                                <button type="submit" className="btn-save">
                                    {isEditing ? "💾 Update Entry" : "💾 Save Entry"}
                                </button>
                                <button type="button" className="btn-cancel" onClick={handleCancel}>
                                    ❌ Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Qms;