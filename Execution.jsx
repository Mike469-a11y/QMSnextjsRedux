import React, { useState, useEffect } from 'react';
import CreditBalanceOverview from '../shared/CreditBalanceOverview';
import OrderTracker from '../shared/OrderTracker';
import '../../styles/Execution.css';

const Execution = () => {
    const [currentView, setCurrentView] = useState('main'); // 'main', 'credit', 'orders'
    const currentDateTime = '2025-08-01 20:56:35';
    const currentUser = 'Mike469-a11y';

    // ✅ Navigation handlers
    const handleNavigateToCredit = () => {
        setCurrentView('credit');
    };

    const handleNavigateToOrders = () => {
        setCurrentView('orders');
    };

    const handleBackToMain = () => {
        setCurrentView('main');
    };

    // ✅ Main Landing Page
    if (currentView === 'main') {
        return (
            <div className="execution-container">
                {/* Header */}
                <div className="execution-header">
                    <div className="execution-header-left">
                        <h1>⚡ Execution Dashboard</h1>
                        <p>Financial tracking and order management system</p>
                    </div>
                    <div className="execution-header-right">
                        <div className="execution-user-info">
                            <span>Current User: <strong>{currentUser}</strong></span>
                            <span className="execution-current-time">{currentDateTime}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content - Two Sections */}
                <div className="execution-main-content">
                    <div className="execution-sections-grid">

                        {/* Credit & Balance Overview Section */}
                        <div
                            className="execution-section-card credit-section"
                            onClick={handleNavigateToCredit}
                        >
                            <div className="execution-section-icon">💳</div>
                            <div className="execution-section-content">
                                <h2>Credit & Balance Overview</h2>
                                <p>Manage credit accounts, track balances, and monitor financial health</p>
                                <div className="execution-section-features">
                                    <span className="execution-feature">📊 Live Balance Tracking</span>
                                    <span className="execution-feature">💰 Credit Calculations</span>
                                    <span className="execution-feature">📈 Financial Overview</span>
                                </div>
                            </div>
                            <div className="execution-section-arrow">→</div>
                        </div>

                        {/* Order Tracker Section */}
                        <div
                            className="execution-section-card orders-section"
                            onClick={handleNavigateToOrders}
                        >
                            <div className="execution-section-icon">📋</div>
                            <div className="execution-section-content">
                                <h2>Order Tracker</h2>
                                <p>Track orders through 13 status stages from initial coordination to completion</p>
                                <div className="execution-section-features">
                                    <span className="execution-feature">🔍 Smart Search</span>
                                    <span className="execution-feature">📊 Status Categories</span>
                                    <span className="execution-feature">📈 Progress Tracking</span>
                                </div>
                            </div>
                            <div className="execution-section-arrow">→</div>
                        </div>

                    </div>

                    {/* Quick Stats */}
                    <div className="execution-quick-stats">
                        <div className="execution-stat-card">
                            <div className="execution-stat-number">0</div>
                            <div className="execution-stat-label">Active Orders</div>
                        </div>
                        <div className="execution-stat-card">
                            <div className="execution-stat-number">$0.00</div>
                            <div className="execution-stat-label">Total Available</div>
                        </div>
                        <div className="execution-stat-card">
                            <div className="execution-stat-number">0</div>
                            <div className="execution-stat-label">Completed Today</div>
                        </div>
                        <div className="execution-stat-card">
                            <div className="execution-stat-number">0</div>
                            <div className="execution-stat-label">Pending Actions</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Credit & Balance Overview Page
    if (currentView === 'credit') {
        return <CreditBalanceOverview onBack={handleBackToMain} currentUser={currentUser} currentDateTime={currentDateTime} />;
    }

    // ✅ Order Tracker Page
    if (currentView === 'orders') {
        return <OrderTracker onBack={handleBackToMain} currentUser={currentUser} currentDateTime={currentDateTime} />;
    }

    return null;
};

export default Execution;