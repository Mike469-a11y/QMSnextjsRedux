import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/CreditBalanceOverview.css';

const CreditBalanceOverview = ({ onBack, currentUser, currentDateTime }) => {
    // ✅ Credit/Balance State
    const [creditData, setCreditData] = useState({
        communityTrustBank: { available: '', used: '' },
        communityTrustBankCC: { available: '', used: '' },
        chasePersonalCC: { available: '', used: '' },
        chaseBusinessCC: { available: '', used: '' },
        amexLineOfCredit: ''
    });

    // ✅ Load data from localStorage on component mount
    useEffect(() => {
        loadCreditData();
    }, []);

    // ✅ Load credit data from localStorage
    const loadCreditData = () => {
        try {
            const storedCreditData = localStorage.getItem('executionCreditData');
            if (storedCreditData) {
                setCreditData(JSON.parse(storedCreditData));
            }
        } catch (error) {
            console.error('Error loading credit data:', error);
        }
    };

    // ✅ Save credit data to localStorage
    const saveCreditData = (newCreditData) => {
        setCreditData(newCreditData);
        localStorage.setItem('executionCreditData', JSON.stringify(newCreditData));
    };

    // ✅ Handle credit data input changes
    const handleCreditChange = (section, field, value) => {
        const numValue = value === '' ? '' : parseFloat(value) || 0;
        const newCreditData = {
            ...creditData,
            [section]: typeof creditData[section] === 'object'
                ? { ...creditData[section], [field]: numValue }
                : numValue
        };
        saveCreditData(newCreditData);
    };

    // ✅ Calculate financial totals
    const calculations = useMemo(() => {
        const ctbAvailable = parseFloat(creditData.communityTrustBank.available) || 0;
        const ctbUsed = parseFloat(creditData.communityTrustBank.used) || 0;
        const ctbCCAvailable = parseFloat(creditData.communityTrustBankCC.available) || 0;
        const ctbCCUsed = parseFloat(creditData.communityTrustBankCC.used) || 0;
        const chasePersonalAvailable = parseFloat(creditData.chasePersonalCC.available) || 0;
        const chasePersonalUsed = parseFloat(creditData.chasePersonalCC.used) || 0;
        const chaseBusinessAvailable = parseFloat(creditData.chaseBusinessCC.available) || 0;
        const chaseBusinessUsed = parseFloat(creditData.chaseBusinessCC.used) || 0;
        const amexCredit = parseFloat(creditData.amexLineOfCredit) || 0;

        const totalCredit = ctbCCAvailable + chasePersonalAvailable + chaseBusinessAvailable;
        const totalUsed = Math.abs(ctbCCUsed) + Math.abs(chasePersonalUsed) + Math.abs(chaseBusinessUsed);
        const remainingCredit = totalCredit - totalUsed;
        const netWorth = (ctbAvailable + ctbCCAvailable + chasePersonalAvailable + chaseBusinessAvailable) -
            (Math.abs(ctbUsed) + Math.abs(ctbCCUsed) + Math.abs(chasePersonalUsed) + Math.abs(chaseBusinessUsed));
        const totalAvailable = remainingCredit + amexCredit;

        return {
            totalCredit,
            totalUsed: -totalUsed,
            remainingCredit,
            netWorth,
            totalAvailable
        };
    }, [creditData]);

    return (
        <div className="credit-balance-container">
            {/* Header */}
            <div className="credit-balance-header">
                <div className="credit-balance-header-left">
                    <button className="credit-balance-back-btn" onClick={onBack}>
                        ← Back to Execution
                    </button>
                    <div className="credit-balance-title-section">
                        <h1>💳 Credit & Balance Overview</h1>
                        <p>Monitor financial accounts and credit utilization</p>
                    </div>
                </div>
                <div className="credit-balance-header-right">
                    <div className="credit-balance-user-info">
                        <span>Current User: <strong>{currentUser}</strong></span>
                        <span className="credit-balance-current-time">{currentDateTime}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="credit-balance-content">
                {/* Date Indicator */}
                <div className="credit-balance-date-section">
                    <div className="credit-balance-date-indicator">
                        📅 {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>

                <div className="credit-balance-main-grid">
                    {/* Left Side - Input Forms */}
                    <div className="credit-balance-inputs-section">
                        <h2>💰 Account Management</h2>

                        <div className="credit-balance-inputs-grid">
                            {/* Community Trust Bank */}
                            <div className="credit-balance-input-group">
                                <label className="credit-balance-label">Community Trust Bank</label>
                                <div className="credit-balance-dual-inputs">
                                    <input
                                        type="number"
                                        placeholder="Available"
                                        value={creditData.communityTrustBank.available}
                                        onChange={(e) => handleCreditChange('communityTrustBank', 'available', e.target.value)}
                                        className="credit-balance-input available"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Used"
                                        value={creditData.communityTrustBank.used}
                                        onChange={(e) => handleCreditChange('communityTrustBank', 'used', e.target.value)}
                                        className="credit-balance-input used"
                                    />
                                </div>
                            </div>

                            {/* Community Trust Bank Credit Card */}
                            <div className="credit-balance-input-group">
                                <label className="credit-balance-label">Community Trust Bank Credit Card</label>
                                <div className="credit-balance-dual-inputs">
                                    <input
                                        type="number"
                                        placeholder="Available"
                                        value={creditData.communityTrustBankCC.available}
                                        onChange={(e) => handleCreditChange('communityTrustBankCC', 'available', e.target.value)}
                                        className="credit-balance-input available"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Used"
                                        value={creditData.communityTrustBankCC.used}
                                        onChange={(e) => handleCreditChange('communityTrustBankCC', 'used', e.target.value)}
                                        className="credit-balance-input used"
                                    />
                                </div>
                            </div>

                            {/* Chase Personal Credit Card */}
                            <div className="credit-balance-input-group">
                                <label className="credit-balance-label">Chase Personal Credit Card</label>
                                <div className="credit-balance-dual-inputs">
                                    <input
                                        type="number"
                                        placeholder="Available"
                                        value={creditData.chasePersonalCC.available}
                                        onChange={(e) => handleCreditChange('chasePersonalCC', 'available', e.target.value)}
                                        className="credit-balance-input available"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Used"
                                        value={creditData.chasePersonalCC.used}
                                        onChange={(e) => handleCreditChange('chasePersonalCC', 'used', e.target.value)}
                                        className="credit-balance-input used"
                                    />
                                </div>
                            </div>

                            {/* Chase Business Credit Card */}
                            <div className="credit-balance-input-group">
                                <label className="credit-balance-label">Chase Business Credit Card</label>
                                <div className="credit-balance-dual-inputs">
                                    <input
                                        type="number"
                                        placeholder="Available"
                                        value={creditData.chaseBusinessCC.available}
                                        onChange={(e) => handleCreditChange('chaseBusinessCC', 'available', e.target.value)}
                                        className="credit-balance-input available"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Used"
                                        value={creditData.chaseBusinessCC.used}
                                        onChange={(e) => handleCreditChange('chaseBusinessCC', 'used', e.target.value)}
                                        className="credit-balance-input used"
                                    />
                                </div>
                            </div>

                            {/* AMEX Line of Credit */}
                            <div className="credit-balance-input-group">
                                <label className="credit-balance-label">AMEX Line of Credit</label>
                                <div className="credit-balance-single-input">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={creditData.amexLineOfCredit}
                                        onChange={(e) => handleCreditChange('amexLineOfCredit', '', e.target.value)}
                                        className="credit-balance-input single"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Calculated Totals */}
                    <div className="credit-balance-totals-section">
                        <h2>📊 Financial Summary</h2>

                        <div className="credit-balance-totals-grid">
                            <div className="credit-balance-total-item net-worth">
                                <div className="credit-balance-total-icon">💎</div>
                                <div className="credit-balance-total-content">
                                    <span className="credit-balance-total-label">Net Worth (Cash - Debts)</span>
                                    <span className={`credit-balance-total-value ${calculations.netWorth >= 0 ? 'positive' : 'negative'}`}>
                                        ${calculations.netWorth.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="credit-balance-total-item">
                                <div className="credit-balance-total-icon">💳</div>
                                <div className="credit-balance-total-content">
                                    <span className="credit-balance-total-label">Total Credit</span>
                                    <span className="credit-balance-total-value">${calculations.totalCredit.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="credit-balance-total-item">
                                <div className="credit-balance-total-icon">📉</div>
                                <div className="credit-balance-total-content">
                                    <span className="credit-balance-total-label">Used Credit</span>
                                    <span className="credit-balance-total-value negative">${calculations.totalUsed.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="credit-balance-total-item">
                                <div className="credit-balance-total-icon">📈</div>
                                <div className="credit-balance-total-content">
                                    <span className="credit-balance-total-label">Remaining Credit</span>
                                    <span className="credit-balance-total-value positive">${calculations.remainingCredit.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="credit-balance-total-item final-total">
                                <div className="credit-balance-total-icon">🎯</div>
                                <div className="credit-balance-total-content">
                                    <span className="credit-balance-total-label">Total Available</span>
                                    <span className="credit-balance-total-value highlight">${calculations.totalAvailable.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Credit Utilization Chart */}
                        <div className="credit-balance-utilization-chart">
                            <h3>📊 Credit Utilization</h3>
                            <div className="credit-balance-chart-bar">
                                <div
                                    className="credit-balance-chart-fill"
                                    style={{
                                        width: `${Math.min((Math.abs(calculations.totalUsed) / calculations.totalCredit) * 100, 100)}%`
                                    }}
                                ></div>
                            </div>
                            <div className="credit-balance-chart-labels">
                                <span>Used: ${Math.abs(calculations.totalUsed).toFixed(2)}</span>
                                <span>Available: ${calculations.remainingCredit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditBalanceOverview;