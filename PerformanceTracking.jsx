import React, { useState, useEffect } from "react";
import "../../styles/PerformanceTracking.css";

const PerformanceTracking = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [qmsEntries, setQmsEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: ""
    });
    const [selectedMetric, setSelectedMetric] = useState("all");

    // Current date and time for display
    const currentDateTime = new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+),?\s*(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');

    useEffect(() => {
        // Load QMS entries from localStorage
        const stored = localStorage.getItem("qmsEntries");
        if (stored) {
            const entries = JSON.parse(stored);
            setQmsEntries(entries);
            generatePerformanceData(entries);
        }
    }, []);

    useEffect(() => {
        applyFilters();
    }, [performanceData, searchTerm, dateRange, selectedMetric]);

    const generatePerformanceData = (entries) => {
        // Group entries by hunter name and calculate performance metrics
        const hunterStats = {};

        entries.forEach(entry => {
            const hunter = entry.hunterName || "Unassigned";

            if (!hunterStats[hunter]) {
                hunterStats[hunter] = {
                    name: hunter,
                    totalEntries: 0,
                    completedEntries: 0,
                    overdueEntries: 0,
                    avgCompletionTime: 0,
                    totalDaysSpent: 0,
                    successRate: 0,
                    recentActivity: [],
                    categories: {},
                    monthlyStats: {}
                };
            }

            const stats = hunterStats[hunter];
            stats.totalEntries++;

            // Calculate if entry is completed/overdue
            const today = new Date();
            const dueDate = entry.dueDate ? new Date(entry.dueDate) : null;
            const createdDate = new Date(entry.date);

            if (dueDate) {
                if (dueDate < today) {
                    stats.overdueEntries++;
                } else {
                    stats.completedEntries++;
                }

                // Calculate days spent
                const daysSpent = Math.abs((dueDate - createdDate) / (1000 * 60 * 60 * 24));
                stats.totalDaysSpent += daysSpent;
            }

            // Track categories
            const category = entry.category || "Uncategorized";
            stats.categories[category] = (stats.categories[category] || 0) + 1;

            // Track monthly activity
            const month = createdDate.toISOString().slice(0, 7); // YYYY-MM
            stats.monthlyStats[month] = (stats.monthlyStats[month] || 0) + 1;

            // Recent activity
            stats.recentActivity.push({
                id: entry.id,
                portalName: entry.portalName,
                bidNumber: entry.bidNumber,
                date: entry.date,
                status: dueDate && dueDate < today ? "overdue" : "active"
            });
        });

        // Calculate derived metrics
        Object.values(hunterStats).forEach(stats => {
            stats.avgCompletionTime = stats.totalEntries > 0
                ? Math.round(stats.totalDaysSpent / stats.totalEntries)
                : 0;

            stats.successRate = stats.totalEntries > 0
                ? Math.round(((stats.totalEntries - stats.overdueEntries) / stats.totalEntries) * 100)
                : 0;

            // Sort recent activity by date (newest first)
            stats.recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
            stats.recentActivity = stats.recentActivity.slice(0, 5); // Keep only 5 most recent
        });

        const performanceArray = Object.values(hunterStats);
        setPerformanceData(performanceArray);
        setFilteredData(performanceArray);
    };

    const applyFilters = () => {
        let filtered = [...performanceData];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(hunter =>
                hunter.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Date range filter (based on recent activity)
        if (dateRange.startDate || dateRange.endDate) {
            filtered = filtered.filter(hunter => {
                const hasRecentActivity = hunter.recentActivity.some(activity => {
                    const activityDate = new Date(activity.date);
                    const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date('1900-01-01');
                    const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
                    return activityDate >= start && activityDate <= end;
                });
                return hasRecentActivity;
            });
        }

        // Metric filter
        if (selectedMetric !== "all") {
            filtered = filtered.sort((a, b) => {
                switch (selectedMetric) {
                    case "entries":
                        return b.totalEntries - a.totalEntries;
                    case "success":
                        return b.successRate - a.successRate;
                    case "speed":
                        return a.avgCompletionTime - b.avgCompletionTime;
                    case "overdue":
                        return b.overdueEntries - a.overdueEntries;
                    default:
                        return 0;
                }
            });
        }

        setFilteredData(filtered);
    };

    const getPerformanceRating = (hunter) => {
        const score = (hunter.successRate * 0.6) +
            ((hunter.totalEntries / Math.max(...performanceData.map(h => h.totalEntries))) * 40);

        if (score >= 85) return { rating: "Excellent", class: "excellent", emoji: "🌟" };
        if (score >= 70) return { rating: "Good", class: "good", emoji: "👍" };
        if (score >= 50) return { rating: "Average", class: "average", emoji: "👌" };
        return { rating: "Needs Improvement", class: "poor", emoji: "📈" };
    };

    const exportPerformanceReport = () => {
        const csvContent = [
            ["Hunter Name", "Total Entries", "Success Rate %", "Overdue Entries", "Avg Completion Days", "Performance Rating"],
            ...filteredData.map(hunter => [
                hunter.name,
                hunter.totalEntries,
                hunter.successRate,
                hunter.overdueEntries,
                hunter.avgCompletionTime,
                getPerformanceRating(hunter).rating
            ])
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `performance_report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="performance-tracking-container">
            {/* Header Section with Current User and Date */}
            <div className="performance-header">
                <div>
                    <h1>Tracking Performance</h1>
                    <p>Monitor and analyze team member performance across QMS entries</p>
                </div>
                <div style={{
                    textAlign: 'right',
                    fontSize: '0.9rem',
                    opacity: 0.9,
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '10px 15px',
                    borderRadius: '10px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div>Current User: <strong>MFakheem</strong></div>
                    <div>Date: <strong>{currentDateTime} UTC</strong></div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="performance-summary">
                <div className="summary-card">
                    <div className="summary-icon">👥</div>
                    <div className="summary-content">
                        <h3>Total Hunters</h3>
                        <div className="summary-value">{performanceData.length}</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">📊</div>
                    <div className="summary-content">
                        <h3>Total Entries</h3>
                        <div className="summary-value">{qmsEntries.length}</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">✅</div>
                    <div className="summary-content">
                        <h3>Avg Success Rate</h3>
                        <div className="summary-value">
                            {performanceData.length > 0
                                ? Math.round(performanceData.reduce((sum, h) => sum + h.successRate, 0) / performanceData.length)
                                : 0}%
                        </div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">⚠️</div>
                    <div className="summary-content">
                        <h3>Total Overdue</h3>
                        <div className="summary-value">
                            {performanceData.reduce((sum, h) => sum + h.overdueEntries, 0)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="performance-controls">
                <div className="search-filter-section">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search hunters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <div className="date-range-container">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="form-input"
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="form-input"
                            placeholder="End Date"
                        />
                    </div>

                    <div className="filter-container">
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Metrics</option>
                            <option value="entries">Most Entries</option>
                            <option value="success">Highest Success Rate</option>
                            <option value="speed">Fastest Completion</option>
                            <option value="overdue">Most Overdue</option>
                        </select>
                    </div>
                </div>

                <div className="performance-actions">
                    <button className="btn-primary" onClick={exportPerformanceReport}>
                        📊 Export Report
                    </button>
                    <button className="btn-secondary" onClick={() => generatePerformanceData(qmsEntries)}>
                        🔄 Refresh Data
                    </button>
                </div>
            </div>

            {/* Performance Table */}
            <div className="performance-list-container">
                <table className="performance-table">
                    <thead>
                        <tr>
                            <th>Hunter</th>
                            <th>Total Entries</th>
                            <th>Success Rate</th>
                            <th>Overdue</th>
                            <th>Avg Days</th>
                            <th>Performance</th>
                            <th>Top Categories</th>
                            <th>Recent Activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="no-data-message">
                                        <div className="no-data-icon">📊</div>
                                        <h3>No Performance Data</h3>
                                        <p>No hunter performance data available.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((hunter, index) => {
                                const rating = getPerformanceRating(hunter);
                                const topCategories = Object.entries(hunter.categories)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 2);

                                return (
                                    <tr key={hunter.name}>
                                        <td>
                                            <div className="hunter-info">
                                                <div className="hunter-avatar">
                                                    {hunter.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="hunter-details">
                                                    <div className="hunter-name">{hunter.name}</div>
                                                    <div className="hunter-rank">#{index + 1}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="metric-value">
                                                <strong>{hunter.totalEntries}</strong>
                                                <span className="metric-label">entries</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="success-rate">
                                                <div className="progress-circle" style={{
                                                    background: `conic-gradient(#28a745 ${hunter.successRate * 3.6}deg, #e9ecef 0deg)`
                                                }}>
                                                    <span>{hunter.successRate}%</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`overdue-count ${hunter.overdueEntries > 0 ? 'has-overdue' : ''}`}>
                                                {hunter.overdueEntries}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="completion-time">
                                                <strong>{hunter.avgCompletionTime}</strong>
                                                <span className="metric-label">days</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`performance-rating ${rating.class}`}>
                                                <span className="rating-emoji">{rating.emoji}</span>
                                                <span className="rating-text">{rating.rating}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="categories-list">
                                                {topCategories.map(([category, count]) => (
                                                    <span key={category} className="category-tag">
                                                        {category} ({count})
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="recent-activity">
                                                {hunter.recentActivity.slice(0, 3).map(activity => (
                                                    <div key={activity.id} className="activity-item">
                                                        <span className={`activity-status ${activity.status}`}></span>
                                                        <span className="activity-text">
                                                            {activity.bidNumber} - {activity.portalName}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PerformanceTracking;