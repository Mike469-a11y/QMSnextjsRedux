import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AttachmentManager from '../shared/AttachmentManager';
import IndexedDBManager from '../../utils/IndexedDBManager';
import '../../styles/SourcingDetails.css';

// Memoized Vendor Form Component for Performance
const VendorForm = memo(({ vendor, onUpdate, onLineItemUpdate, onAddLineItem, onRemoveLineItem, qmsId }) => {
    const handleAttachmentsChange = useCallback((attachmentIds) => {
        onUpdate('sourcingInfo', 'attachments', attachmentIds);
    }, [onUpdate]);

    return (
        <>
            {/* Sourcing Information Form */}
            <div className="sourcing-form-section">
                <div className="section-header">
                    <div className="section-icon">🎯</div>
                    <h2>Sourcing Information - {vendor.vendorName}</h2>
                    {vendor.isPrimary && <span className="primary-indicator">★ PRIMARY VENDOR</span>}
                </div>

                <div className="sourcing-form-grid">

                    <div className="form-group">
                        <label>Product / Service Quoted Cost $:</label>
                        <input
                            type="number"
                            step="0.01"
                            value={vendor.sourcingInfo.productServiceQuotedCost}
                            onChange={(e) => onUpdate('sourcingInfo', 'productServiceQuotedCost', e.target.value)}
                            placeholder="Enter quoted cost"
                        />
                    </div>

                    <div className="form-group">
                        <label>Vendor Name:</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.vendorName}
                            onChange={(e) => onUpdate('sourcingInfo', 'vendorName', e.target.value)}
                            placeholder="Enter vendor name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Vendor Website / Product Link:</label>
                        <input
                            type="url"
                            value={vendor.sourcingInfo.vendorWebsite}
                            onChange={(e) => onUpdate('sourcingInfo', 'vendorWebsite', e.target.value)}
                            placeholder="https://vendor-website.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Proper Quotation Given:</label>
                        <select
                            value={vendor.sourcingInfo.properQuotationGiven}
                            onChange={(e) => onUpdate('sourcingInfo', 'properQuotationGiven', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Proper Quotation Given (Vendor):</label>
                        <select
                            value={vendor.sourcingInfo.properQuotationGivenNew}
                            onChange={(e) => onUpdate('sourcingInfo', 'properQuotationGivenNew', e.target.value)}
                            className="proper-quotation-select"
                        >
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Risk Assessment:</label>
                        <select
                            value={vendor.sourcingInfo.riskAssessment}
                            onChange={(e) => onUpdate('sourcingInfo', 'riskAssessment', e.target.value)}
                            className={`risk-assessment-select ${vendor.sourcingInfo.riskAssessment ? `risk-${vendor.sourcingInfo.riskAssessment.toLowerCase().replace(' ', '-')}` : ''}`}
                        >
                            <option value="">Select Risk Level...</option>
                            <option value="High Risk" className="risk-high">High Risk</option>
                            <option value="Medium Risk" className="risk-medium">Medium Risk</option>
                            <option value="Low Risk" className="risk-low">Low Risk</option>
                            <option value="No Risk" className="risk-none">No Risk</option>
                        </select>
                    </div>

                    <div className="form-group form-group-full">
                        <label>Vendor Address:</label>
                        <textarea
                            value={vendor.sourcingInfo.vendorAddress}
                            onChange={(e) => onUpdate('sourcingInfo', 'vendorAddress', e.target.value)}
                            placeholder="Enter vendor address"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Compliance (US-Based, Terms Met, etc.):</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.compliance}
                            onChange={(e) => onUpdate('sourcingInfo', 'compliance', e.target.value)}
                            placeholder="Enter compliance details"
                        />
                    </div>

                    <div className="form-group">
                        <label>CC Accepted:</label>
                        <select
                            value={vendor.sourcingInfo.ccAccepted}
                            onChange={(e) => onUpdate('sourcingInfo', 'ccAccepted', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>NET 30 / 60 Terms Available:</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.netTermsAvailable}
                            onChange={(e) => onUpdate('sourcingInfo', 'netTermsAvailable', e.target.value)}
                            placeholder="NET 30, NET 60, etc."
                        />
                    </div>

                    <div className="form-group">
                        <label>CC Charges (if applicable) %:</label>
                        <input
                            type="number"
                            step="0.01"
                            value={vendor.sourcingInfo.ccCharges}
                            onChange={(e) => onUpdate('sourcingInfo', 'ccCharges', e.target.value)}
                            placeholder="Enter percentage"
                        />
                    </div>

                    <div className="form-group">
                        <label>Specs Sheet / Details Taken:</label>
                        <select
                            value={vendor.sourcingInfo.specsSheetTaken}
                            onChange={(e) => onUpdate('sourcingInfo', 'specsSheetTaken', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Lead Time Offered:</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.leadTimeOffered}
                            onChange={(e) => onUpdate('sourcingInfo', 'leadTimeOffered', e.target.value)}
                            placeholder="e.g., 2-3 weeks"
                        />
                    </div>

                    <div className="form-group">
                        <label>Stock Available / Other:</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.stockAvailable}
                            onChange={(e) => onUpdate('sourcingInfo', 'stockAvailable', e.target.value)}
                            placeholder="In stock, Back order, etc."
                        />
                    </div>

                    <div className="form-group">
                        <label>Quote Receiving Date:</label>
                        <input
                            type="date"
                            value={vendor.sourcingInfo.quoteReceivingDate}
                            onChange={(e) => onUpdate('sourcingInfo', 'quoteReceivingDate', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Quote Valid Till:</label>
                        <input
                            type="date"
                            value={vendor.sourcingInfo.quoteValidTill}
                            onChange={(e) => onUpdate('sourcingInfo', 'quoteValidTill', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Remaining Days (Formula Applied):</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.remainingDays}
                            readOnly
                            placeholder="Auto-calculated"
                            className="readonly-field"
                        />
                    </div>

                    <div className="form-group">
                        <label>Item Same / Alternative:</label>
                        <select
                            value={vendor.sourcingInfo.itemSameAlternative}
                            onChange={(e) => onUpdate('sourcingInfo', 'itemSameAlternative', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="Same">Same</option>
                            <option value="Alternative">Alternative</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Warranty Period:</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.warrantyPeriod}
                            onChange={(e) => onUpdate('sourcingInfo', 'warrantyPeriod', e.target.value)}
                            placeholder="e.g., 1 year, 2 years"
                        />
                    </div>

                    <div className="form-group">
                        <label>After Sales Support:</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.afterSalesSupport}
                            onChange={(e) => onUpdate('sourcingInfo', 'afterSalesSupport', e.target.value)}
                            placeholder="Support details"
                        />
                    </div>

                    <div className="form-group">
                        <label>Support Period:</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.supportPeriod}
                            onChange={(e) => onUpdate('sourcingInfo', 'supportPeriod', e.target.value)}
                            placeholder="Support period"
                        />
                    </div>

                    <div className="form-group form-group-full">
                        <label>Warranty / Support Terms:</label>
                        <textarea
                            value={vendor.sourcingInfo.warrantySupportTerms}
                            onChange={(e) => onUpdate('sourcingInfo', 'warrantySupportTerms', e.target.value)}
                            placeholder="Warranty and support terms"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Estimated Shipping Cost $:</label>
                        <input
                            type="number"
                            step="0.01"
                            value={vendor.sourcingInfo.estimatedShippingCost}
                            onChange={(e) => onUpdate('sourcingInfo', 'estimatedShippingCost', e.target.value)}
                            placeholder="Enter shipping cost"
                        />
                    </div>

                    <div className="form-group">
                        <label>Applicable Taxes (If Any):</label>
                        <input
                            type="text"
                            value={vendor.sourcingInfo.applicableTaxes}
                            onChange={(e) => onUpdate('sourcingInfo', 'applicableTaxes', e.target.value)}
                            placeholder="Tax details"
                        />
                    </div>

                    <div className="form-group">
                        <label>Restocking Fees:</label>
                        <div className="inline-group">
                            <select
                                value={vendor.sourcingInfo.restockingFees}
                                onChange={(e) => onUpdate('sourcingInfo', 'restockingFees', e.target.value)}
                                className="inline-select"
                            >
                                <option value="">Select...</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                            {vendor.sourcingInfo.restockingFees === 'Yes' && (
                                <input
                                    type="number"
                                    step="0.01"
                                    value={vendor.sourcingInfo.restockingFeesPercentage}
                                    onChange={(e) => onUpdate('sourcingInfo', 'restockingFeesPercentage', e.target.value)}
                                    placeholder="%"
                                    className="inline-input"
                                />
                            )}
                        </div>
                    </div>

                    {/* NEW: Attachments Section */}
                    <div className="form-group form-group-full">
                        <AttachmentManager
                            vendorId={vendor.id}
                            qmsId={qmsId}
                            onAttachmentsChange={handleAttachmentsChange}
                        />
                    </div>

                    <div className="form-group form-group-full">
                        <label>Remarks / Notes:</label>
                        <textarea
                            value={vendor.sourcingInfo.remarks}
                            onChange={(e) => onUpdate('sourcingInfo', 'remarks', e.target.value)}
                            placeholder="Additional remarks or notes"
                            rows="4"
                        />
                    </div>

                </div>
            </div>

            {/* Pricing Section */}
            <div className="pricing-section">
                <div className="section-header">
                    <div className="section-icon">💰</div>
                    <h2>Pricing & Line Items - {vendor.vendorName}</h2>
                    {vendor.isPrimary && <span className="primary-indicator">★ PRIMARY VENDOR</span>}
                </div>

                {/* Line Items Table */}
                <div className="line-items-container">
                    <div className="line-items-header">
                        <h3>Line Items</h3>
                        <button
                            type="button"
                            className="btn-add-item"
                            onClick={onAddLineItem}
                        >
                            ➕ Add Line Item
                        </button>
                    </div>

                    <div className="line-items-table-container">
                        <table className="line-items-table">
                            <thead>
                                <tr>
                                    <th>LINE ITEMS</th>
                                    <th>QTY</th>
                                    <th>UNIT PRICE</th>
                                    <th>COST $</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendor.pricing.lineItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => onLineItemUpdate(item.id, 'description', e.target.value)}
                                                placeholder="Enter item description"
                                                className="table-input description-input"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => onLineItemUpdate(item.id, 'qty', e.target.value)}
                                                placeholder="0"
                                                className="table-input qty-input"
                                                min="0"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => onLineItemUpdate(item.id, 'unitPrice', e.target.value)}
                                                placeholder="0.00"
                                                className="table-input price-input"
                                                min="0"
                                            />
                                        </td>
                                        <td>
                                            <span className="calculated-cost">
                                                ${(item.cost || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td>
                                            {vendor.pricing.lineItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove-item"
                                                    onClick={() => onRemoveLineItem(item.id)}
                                                    title="Remove this line item"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="cost-breakdown">
                    <h3>Cost Breakdown</h3>
                    <div className="cost-breakdown-grid">

                        <div className="cost-item total-row">
                            <label>TOTAL:</label>
                            <span className="cost-value">
                                ${vendor.pricing.subtotal.toFixed(2)}
                            </span>
                        </div>

                        <div className="cost-item">
                            <label>CC CHARGES (If Applicable):</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.ccChargesAmount}
                                onChange={(e) => onUpdate('pricing', 'ccChargesAmount', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>TAX (If Applicable):</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.taxAmount}
                                onChange={(e) => onUpdate('pricing', 'taxAmount', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>FREIGHT / LOGISTICS:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.freightLogistics}
                                onChange={(e) => onUpdate('pricing', 'freightLogistics', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>EXTENDED WARRANTY (If Required):</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.extendedWarranty}
                                onChange={(e) => onUpdate('pricing', 'extendedWarranty', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>INSTALLATION:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.installation}
                                onChange={(e) => onUpdate('pricing', 'installation', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>Restocking Fees %:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.restockingFeesAmount}
                                onChange={(e) => onUpdate('pricing', 'restockingFeesAmount', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>OTHER:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.other1}
                                onChange={(e) => onUpdate('pricing', 'other1', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>OTHER:</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.other2}
                                onChange={(e) => onUpdate('pricing', 'other2', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item grand-total-row">
                            <label>GRAND TOTAL:</label>
                            <span className="cost-value grand-total">
                                ${vendor.pricing.grandTotal.toFixed(2)}
                            </span>
                        </div>

                        <div className="cost-item">
                            <label>DISCOUNTS (IF ANY):</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.discount1}
                                onChange={(e) => onUpdate('pricing', 'discount1', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item">
                            <label>DISCOUNTS (IF ANY):</label>
                            <input
                                type="number"
                                step="0.01"
                                value={vendor.pricing.discount2}
                                onChange={(e) => onUpdate('pricing', 'discount2', e.target.value)}
                                placeholder="0.00"
                                className="cost-input"
                            />
                        </div>

                        <div className="cost-item final-total-row">
                            <label>FINAL GRAND TOTAL:</label>
                            <span className="cost-value final-total">
                                ${vendor.pricing.finalGrandTotal.toFixed(2)}
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
});

// Main Component
const SourcingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // ✅ UPDATED: Current date time and user
    const currentDateTime = '2025-07-31 00:05:41';
    const currentUser = 'Mike469-a11y';

    // ✅ NEW: Get rejection data from navigation state
    const isRejectedRevision = location.state?.isRejectedRevision || false;
    const rejectionData = location.state?.rejectionData || null;

    const [qmsEntry, setQmsEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeVendorId, setActiveVendorId] = useState(1);
    const [isVendorSwitching, setIsVendorSwitching] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [saving, setSaving] = useState(false);

    // Enhanced data structure with attachments
    const [sourcingData, setSourcingData] = useState({
        vendors: [
            {
                id: 1,
                vendorName: "Vendor 1",
                isPrimary: true,
                sourcingInfo: {
                    productServiceQuotedCost: '',
                    vendorName: '',
                    vendorWebsite: '',
                    properQuotationGiven: '',
                    vendorAddress: '',
                    compliance: '',
                    ccAccepted: '',
                    netTermsAvailable: '',
                    ccCharges: '',
                    specsSheetTaken: '',
                    leadTimeOffered: '',
                    stockAvailable: '',
                    quoteReceivingDate: '',
                    quoteValidTill: '',
                    remainingDays: '',
                    itemSameAlternative: '',
                    warrantyPeriod: '',
                    afterSalesSupport: '',
                    supportPeriod: '',
                    warrantySupportTerms: '',
                    estimatedShippingCost: '',
                    applicableTaxes: '',
                    restockingFees: '',
                    restockingFeesPercentage: '',
                    attachments: [], // Array of attachment IDs
                    remarks: '',
                    properQuotationGivenNew: '',
                    riskAssessment: ''
                },
                pricing: {
                    lineItems: [
                        { id: 1, description: '', qty: '', unitPrice: '', cost: 0 }
                    ],
                    subtotal: 0,
                    ccChargesAmount: 0,
                    taxAmount: 0,
                    freightLogistics: 0,
                    extendedWarranty: 0,
                    installation: 0,
                    restockingFeesAmount: 0,
                    other1: 0,
                    other2: 0,
                    grandTotal: 0,
                    discount1: 0,
                    discount2: 0,
                    finalGrandTotal: 0
                }
            }
        ]
    });

    // Initialize IndexedDB on component mount
    useEffect(() => {
        IndexedDBManager.initDB().then(() => {
            loadQMSEntry();
        });
    }, [id]);

    // Auto-save functionality
    useEffect(() => {
        if (!autoSaveEnabled) return;

        const autoSaveInterval = setInterval(() => {
            handleSave(true); // Silent save
        }, 30000); // Auto-save every 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [sourcingData, autoSaveEnabled]);

    const loadQMSEntry = async () => {
        try {
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const entry = entries.find(e => e.id === id);
                if (entry) {
                    setQmsEntry(entry);

                    const indexedData = await IndexedDBManager.getSourcingData(id);
                    if (indexedData) {
                        setSourcingData(indexedData);
                        const primaryVendor = indexedData.vendors.find(v => v.isPrimary);
                        setActiveVendorId(primaryVendor ? primaryVendor.id : indexedData.vendors[0].id);
                    } else if (entry.sourcingData && entry.sourcingData.vendors) {
                        const migratedData = {
                            ...entry.sourcingData,
                            vendors: entry.sourcingData.vendors.map(vendor => ({
                                ...vendor,
                                sourcingInfo: {
                                    ...vendor.sourcingInfo,
                                    attachments: vendor.sourcingInfo.attachments || []
                                }
                            }))
                        };
                        setSourcingData(migratedData);
                        const primaryVendor = migratedData.vendors.find(v => v.isPrimary);
                        setActiveVendorId(primaryVendor ? primaryVendor.id : migratedData.vendors[0].id);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading QMS entry:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ NEW: Handle acknowledgment of rejection (clear rejection flag)
    const handleAcknowledgeRejection = useCallback(async () => {
        try {
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const updatedEntries = entries.map(entry => {
                    if (entry.id === id) {
                        return {
                            ...entry,
                            // ✅ Clear rejection acknowledgment flags
                            rejectionAcknowledged: true,
                            rejectionAcknowledgedBy: currentUser,
                            rejectionAcknowledgedAt: currentDateTime,
                            // Keep the rejection data for reference but mark as seen
                            rejectionViewed: true
                        };
                    }
                    return entry;
                });

                localStorage.setItem("sourcingEntries", JSON.stringify(updatedEntries));

                // Update local state
                setQmsEntry(prev => ({
                    ...prev,
                    rejectionAcknowledged: true,
                    rejectionAcknowledgedBy: currentUser,
                    rejectionAcknowledgedAt: currentDateTime,
                    rejectionViewed: true
                }));

                // Show success message
                alert('✅ Rejection acknowledged. You can now proceed with the revision.');
            }
        } catch (error) {
            console.error('Error acknowledging rejection:', error);
            alert('❌ Error acknowledging rejection. Please try again.');
        }
    }, [id, currentUser, currentDateTime]);

    const currentVendor = useMemo(() => {
        return sourcingData.vendors.find(vendor => vendor.id === activeVendorId);
    }, [sourcingData.vendors, activeVendorId]);

    const switchVendor = useCallback((vendorId) => {
        if (vendorId === activeVendorId) return;

        setIsVendorSwitching(true);

        requestAnimationFrame(() => {
            setTimeout(() => {
                setActiveVendorId(vendorId);
                setIsVendorSwitching(false);
            }, 150);
        });
    }, [activeVendorId]);

    const updateCurrentVendor = useCallback((section, field, value) => {
        setSourcingData(prev => ({
            ...prev,
            vendors: prev.vendors.map(vendor => {
                if (vendor.id === activeVendorId) {
                    const updatedVendor = {
                        ...vendor,
                        [section]: {
                            ...vendor[section],
                            [field]: value
                        }
                    };

                    if (field === 'quoteValidTill' && value) {
                        const today = new Date();
                        const validTill = new Date(value);
                        const diffTime = validTill - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        updatedVendor.sourcingInfo.remainingDays = diffDays > 0 ? diffDays.toString() : '0';
                    }

                    return updatedVendor;
                }
                return vendor;
            })
        }));

        if (['ccChargesAmount', 'taxAmount', 'freightLogistics', 'extendedWarranty', 'installation', 'restockingFeesAmount', 'other1', 'other2', 'discount1', 'discount2'].includes(field)) {
            setTimeout(() => calculateTotals(), 100);
        }
    }, [activeVendorId]);

    const addVendor = useCallback(() => {
        const newVendorId = Math.max(...sourcingData.vendors.map(v => v.id)) + 1;
        const newVendor = {
            id: newVendorId,
            vendorName: `Vendor ${newVendorId}`,
            isPrimary: false,
            sourcingInfo: {
                productServiceQuotedCost: '',
                vendorName: '',
                vendorWebsite: '',
                properQuotationGiven: '',
                vendorAddress: '',
                compliance: '',
                ccAccepted: '',
                netTermsAvailable: '',
                ccCharges: '',
                specsSheetTaken: '',
                leadTimeOffered: '',
                stockAvailable: '',
                quoteReceivingDate: '',
                quoteValidTill: '',
                remainingDays: '',
                itemSameAlternative: '',
                warrantyPeriod: '',
                afterSalesSupport: '',
                supportPeriod: '',
                warrantySupportTerms: '',
                estimatedShippingCost: '',
                applicableTaxes: '',
                restockingFees: '',
                restockingFeesPercentage: '',
                attachments: [],
                remarks: '',
                properQuotationGivenNew: '',
                riskAssessment: ''
            },
            pricing: {
                lineItems: [
                    { id: 1, description: '', qty: '', unitPrice: '', cost: 0 }
                ],
                subtotal: 0,
                ccChargesAmount: 0,
                taxAmount: 0,
                freightLogistics: 0,
                extendedWarranty: 0,
                installation: 0,
                restockingFeesAmount: 0,
                other1: 0,
                other2: 0,
                grandTotal: 0,
                discount1: 0,
                discount2: 0,
                finalGrandTotal: 0
            }
        };

        setSourcingData(prev => ({
            ...prev,
            vendors: [...prev.vendors, newVendor]
        }));

        switchVendor(newVendorId);
    }, [sourcingData.vendors, switchVendor]);

    const removeVendor = useCallback((vendorId) => {
        if (sourcingData.vendors.length > 1) {
            if (confirm(`Are you sure you want to remove this vendor? This action cannot be undone.`)) {
                setSourcingData(prev => ({
                    ...prev,
                    vendors: prev.vendors.filter(vendor => vendor.id !== vendorId)
                }));

                const remainingVendors = sourcingData.vendors.filter(vendor => vendor.id !== vendorId);
                switchVendor(remainingVendors[0].id);
            }
        } else {
            alert('Cannot remove the last vendor. At least one vendor is required.');
        }
    }, [sourcingData.vendors, switchVendor]);

    const copyVendorData = useCallback((fromVendorId) => {
        const sourceVendor = sourcingData.vendors.find(v => v.id === fromVendorId);
        if (sourceVendor) {
            setSourcingData(prev => ({
                ...prev,
                vendors: prev.vendors.map(vendor => {
                    if (vendor.id === activeVendorId) {
                        return {
                            ...vendor,
                            sourcingInfo: {
                                ...sourceVendor.sourcingInfo,
                                attachments: []
                            },
                            pricing: {
                                ...sourceVendor.pricing,
                                lineItems: sourceVendor.pricing.lineItems.map(item => ({ ...item }))
                            }
                        };
                    }
                    return vendor;
                })
            }));
        }
    }, [sourcingData.vendors, activeVendorId]);

    const setPrimaryVendor = useCallback((vendorId) => {
        setSourcingData(prev => ({
            ...prev,
            vendors: prev.vendors.map(vendor => ({
                ...vendor,
                isPrimary: vendor.id === vendorId
            }))
        }));
    }, []);

    const updateVendorName = useCallback((vendorId, newName) => {
        setSourcingData(prev => ({
            ...prev,
            vendors: prev.vendors.map(vendor => {
                if (vendor.id === vendorId) {
                    return {
                        ...vendor,
                        vendorName: newName,
                        sourcingInfo: {
                            ...vendor.sourcingInfo,
                            vendorName: newName
                        }
                    };
                }
                return vendor;
            })
        }));
    }, []);

    const addLineItem = useCallback(() => {
        const currentVendorData = sourcingData.vendors.find(v => v.id === activeVendorId);
        const newId = Math.max(...currentVendorData.pricing.lineItems.map(item => item.id)) + 1;

        setSourcingData(prev => ({
            ...prev,
            vendors: prev.vendors.map(vendor => {
                if (vendor.id === activeVendorId) {
                    return {
                        ...vendor,
                        pricing: {
                            ...vendor.pricing,
                            lineItems: [
                                ...vendor.pricing.lineItems,
                                { id: newId, description: '', qty: '', unitPrice: '', cost: 0 }
                            ]
                        }
                    };
                }
                return vendor;
            })
        }));
    }, [sourcingData.vendors, activeVendorId]);

    const removeLineItem = useCallback((itemId) => {
        const currentVendorData = sourcingData.vendors.find(v => v.id === activeVendorId);
        if (currentVendorData.pricing.lineItems.length > 1) {
            setSourcingData(prev => ({
                ...prev,
                vendors: prev.vendors.map(vendor => {
                    if (vendor.id === activeVendorId) {
                        return {
                            ...vendor,
                            pricing: {
                                ...vendor.pricing,
                                lineItems: vendor.pricing.lineItems.filter(item => item.id !== itemId)
                            }
                        };
                    }
                    return vendor;
                })
            }));
            setTimeout(() => calculateTotals(), 50);
        }
    }, [sourcingData.vendors, activeVendorId]);

    const updateLineItem = useCallback((itemId, field, value) => {
        setSourcingData(prev => ({
            ...prev,
            vendors: prev.vendors.map(vendor => {
                if (vendor.id === activeVendorId) {
                    const updatedItems = vendor.pricing.lineItems.map(item => {
                        if (item.id === itemId) {
                            const updatedItem = { ...item, [field]: value };

                            if (field === 'qty' || field === 'unitPrice') {
                                const qty = parseFloat(field === 'qty' ? value : item.qty) || 0;
                                const unitPrice = parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0;
                                updatedItem.cost = qty * unitPrice;
                            }

                            return updatedItem;
                        }
                        return item;
                    });

                    return {
                        ...vendor,
                        pricing: {
                            ...vendor.pricing,
                            lineItems: updatedItems
                        }
                    };
                }
                return vendor;
            })
        }));

        setTimeout(() => calculateTotals(), 50);
    }, [activeVendorId]);

    const calculateTotals = useCallback(() => {
        setSourcingData(prev => ({
            ...prev,
            vendors: prev.vendors.map(vendor => {
                if (vendor.id === activeVendorId) {
                    const subtotal = vendor.pricing.lineItems.reduce((sum, item) => sum + (item.cost || 0), 0);

                    const ccChargesAmount = parseFloat(vendor.pricing.ccChargesAmount) || 0;
                    const taxAmount = parseFloat(vendor.pricing.taxAmount) || 0;
                    const freightLogistics = parseFloat(vendor.pricing.freightLogistics) || 0;
                    const extendedWarranty = parseFloat(vendor.pricing.extendedWarranty) || 0;
                    const installation = parseFloat(vendor.pricing.installation) || 0;
                    const restockingFeesAmount = parseFloat(vendor.pricing.restockingFeesAmount) || 0;
                    const other1 = parseFloat(vendor.pricing.other1) || 0;
                    const other2 = parseFloat(vendor.pricing.other2) || 0;

                    const grandTotal = subtotal + ccChargesAmount + taxAmount + freightLogistics +
                        extendedWarranty + installation + restockingFeesAmount + other1 + other2;

                    const discount1 = parseFloat(vendor.pricing.discount1) || 0;
                    const discount2 = parseFloat(vendor.pricing.discount2) || 0;
                    const finalGrandTotal = grandTotal - discount1 - discount2;

                    return {
                        ...vendor,
                        pricing: {
                            ...vendor.pricing,
                            subtotal: subtotal,
                            grandTotal: grandTotal,
                            finalGrandTotal: finalGrandTotal
                        }
                    };
                }
                return vendor;
            })
        }));
    }, [activeVendorId]);

    const handleSave = useCallback(async (silent = false) => {
        if (saving) return; // Prevent multiple saves

        try {
            setSaving(true);

            // Save to IndexedDB
            await IndexedDBManager.saveSourcingData(id, sourcingData);

            // Update localStorage for backward compatibility
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const updatedEntries = entries.map(entry => {
                    if (entry.id === id) {
                        return {
                            ...entry,
                            sourcingData: sourcingData,
                            sourcingStarted: true,
                            lastUpdated: currentDateTime
                        };
                    }
                    return entry;
                });

                localStorage.setItem("sourcingEntries", JSON.stringify(updatedEntries));

                if (!silent) {
                    alert('✅ Sourcing data saved successfully to secure storage!');
                }
            }
        } catch (error) {
            console.error('Error saving sourcing data:', error);
            if (!silent) {
                alert('❌ Error saving data. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    }, [id, sourcingData, currentDateTime, saving]);

    // ✅ UPDATED: Redirect to Sourcing Dashboard instead of Approval
    const handleProceed = useCallback(async () => {
        if (saving) return; // Prevent multiple saves

        try {
            setSaving(true);

            // Save the data first
            await IndexedDBManager.saveSourcingData(id, sourcingData);

            // Mark sourcing as completed and ready for approval
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const updatedEntries = entries.map(entry => {
                    if (entry.id === id) {
                        return {
                            ...entry,
                            sourcingData: sourcingData,
                            sourcingStarted: true,
                            sourcingCompleted: true, // ✅ Mark as completed
                            sourcingCompletedAt: currentDateTime, // ✅ Completion timestamp
                            status: 'approval_pending', // ✅ Set status for approval
                            lastUpdated: currentDateTime,
                            completedBy: currentUser // ✅ Track who completed it
                        };
                    }
                    return entry;
                });

                localStorage.setItem("sourcingEntries", JSON.stringify(updatedEntries));

                // ✅ CHANGED: Redirect to Sourcing Dashboard instead of Approval
                navigate('/sourcing');
            }
        } catch (error) {
            console.error('Error completing sourcing:', error);
            alert('❌ Error completing sourcing. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [handleSave, navigate, id, sourcingData, currentDateTime, currentUser, saving]);

    if (loading) {
        return (
            <div className="sourcing-details-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading sourcing details...</p>
                </div>
            </div>
        );
    }

    if (!qmsEntry) {
        return (
            <div className="sourcing-details-container">
                <div className="error-container">
                    <h2>Entry Not Found</h2>
                    <p>The requested sourcing entry could not be found.</p>
                    <button className="btn-primary" onClick={() => navigate('/sourcing')}>
                        ← Back to Sourcing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="sourcing-details-container">
            {/* Header */}
            <div className="sourcing-details-header">
                <div>
                    <h1>Sourcing Details</h1>
                    <p>Job Details: <strong>{currentDateTime}</strong></p>
                </div>
                <div className="user-info">
                    <span>Current User: <strong>{currentUser}</strong></span>
                    <span className="auto-save-indicator">
                        {autoSaveEnabled ? '🔄 Auto-save ON' : '⏸️ Auto-save OFF'}
                    </span>
                    {saving && <span className="saving-indicator">💾 Saving...</span>}
                </div>
            </div>

            <div className="sourcing-details-content">
                {/* ✅ NEW: REJECTION MESSAGE SECTION AT THE TOP - COMPACT VERSION */}
                {(isRejectedRevision && rejectionData) || (qmsEntry?.status === 'approval_rejected' && qmsEntry?.rejectionReason) ? (
                    <div className="rejection-message-section">
                        <div className="rejection-header">
                            <div className="rejection-icon">❌</div>
                            <div className="rejection-title">
                                <h2>Entry Rejected</h2>
                                <p>This entry requires revision before resubmission</p>
                            </div>
                            {!qmsEntry?.rejectionAcknowledged && (
                                <button
                                    className="btn-acknowledge-rejection"
                                    onClick={handleAcknowledgeRejection}
                                >
                                    ✅ Acknowledge
                                </button>
                            )}
                        </div>

                        <div className="rejection-details-card">
                            <div className="rejection-info-grid">
                                <div className="rejection-info-item">
                                    <span className="rejection-label">Rejected By:</span>
                                    <span className="rejection-value">
                                        {rejectionData?.rejectedBy || qmsEntry?.rejectedBy || qmsEntry?.approvedBy || 'N/A'}
                                    </span>
                                </div>
                                <div className="rejection-info-item">
                                    <span className="rejection-label">Rejection Date:</span>
                                    <span className="rejection-value">
                                        {rejectionData?.rejectedAt || qmsEntry?.rejectedAt || qmsEntry?.approvedAt || 'N/A'}
                                    </span>
                                </div>
                                <div className="rejection-info-item">
                                    <span className="rejection-label">Status:</span>
                                    <span className="rejection-status-badge">
                                        {qmsEntry?.rejectionAcknowledged ? '✅ Acknowledged' : '⏳ Needs Acknowledgment'}
                                    </span>
                                </div>
                            </div>

                            <div className="rejection-reason-card">
                                <h4>📝 Rejection Reason:</h4>
                                <div className="rejection-reason-content">
                                    {rejectionData?.reason || qmsEntry?.rejectionReason || 'No reason provided'}
                                </div>
                            </div>

                            <div className="rejection-instructions">
                                <h4>📋 Next Steps:</h4>
                                <ul>
                                    <li>✅ Review the rejection reason carefully</li>
                                    <li>🔍 Address all issues mentioned in the rejection</li>
                                    <li>📝 Make necessary changes to vendor information, pricing, or documentation</li>
                                    <li>📤 Resubmit the revised sourcing for approval</li>
                                </ul>
                            </div>

                            {qmsEntry?.rejectionAcknowledged && (
                                <div className="acknowledgment-info">
                                    <p>
                                        <strong>✅ Acknowledged by:</strong> {qmsEntry.rejectionAcknowledgedBy}
                                        <strong> at</strong> {qmsEntry.rejectionAcknowledgedAt}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Fixed Original QMS Information Section */}
                <div className="qms-info-section-compressed">
                    <div className="qms-header-compressed">
                        <div className="qms-icon">📋</div>
                        <h2 className="qms-title-bold">Original QMS Information</h2>
                    </div>

                    <div className="qms-compact-grid">
                        <div className="qms-row">
                            <div className="qms-field">
                                <span className="qms-label">QMS ID</span>
                                <span className="qms-value">{qmsEntry.id || 'Q0001'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">DATE CREATED</span>
                                <span className="qms-value">{qmsEntry.dateCreated || 'N/A'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">PORTAL NAME</span>
                                <span className="qms-value">{qmsEntry.portalName || 'dawdaw'}</span>
                            </div>
                        </div>

                        <div className="qms-row">
                            <div className="qms-field">
                                <span className="qms-label">PORTAL LINK</span>
                                <span className="qms-value portal-link">{qmsEntry.portalLink || 'adsda'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">BID NUMBER</span>
                                <span className="qms-value">{qmsEntry.bidNumber || 'adsda'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">BID TITLE</span>
                                <span className="qms-value">{qmsEntry.bidTitle || 'asdas'}</span>
                            </div>
                        </div>

                        <div className="qms-row">
                            <div className="qms-field">
                                <span className="qms-label">CATEGORY</span>
                                <span className="qms-value">{qmsEntry.category || 'dasd'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">QUANTITY</span>
                                <span className="qms-value">{qmsEntry.quantity || '4'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">TIME STAMP</span>
                                <span className="qms-value">{qmsEntry.timeStamp || '07/24/2025, 06:00 PM'}</span>
                            </div>
                        </div>

                        <div className="qms-row">
                            <div className="qms-field">
                                <span className="qms-label">DUE DATE</span>
                                <span className="qms-value">{qmsEntry.dueDate || '07/23/2025'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">HUNTER NAME</span>
                                <span className="qms-value">{qmsEntry.hunterName || 'Akmal Khan'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">CONTACT NAME</span>
                                <span className="qms-value">{qmsEntry.contactName || 'DASDA'}</span>
                            </div>
                        </div>

                        <div className="qms-row">
                            <div className="qms-field">
                                <span className="qms-label">EMAIL</span>
                                <span className="qms-value">{qmsEntry.email || 'DASDA@CAFA.COM'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">ASSIGNED DATE</span>
                                <span className="qms-value">{qmsEntry.assignedDate || '07/26/2025'}</span>
                            </div>
                            <div className="qms-field">
                                <span className="qms-label">ASSIGNED BY</span>
                                <span className="qms-value">{qmsEntry.assignedBy || 'Joe'}</span>
                            </div>
                        </div>

                        <div className="qms-row qms-remarks-row">
                            <div className="qms-field qms-remarks-field">
                                <span className="qms-label">HUNTING REMARKS</span>
                                <span className="qms-value">{qmsEntry.huntingRemarks || 'ASDADFAWD'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendor Tabs Section */}
                <div className="vendor-tabs-section">
                    <div className="vendor-tabs-header">
                        <div className="vendor-tabs-left">
                            <h2>🏢 Vendor Management</h2>
                            <span className="vendor-count">{sourcingData.vendors.length} Vendor(s)</span>
                        </div>
                        <div className="vendor-tabs-actions">
                            <button className="btn-add-vendor" onClick={addVendor}>
                                ➕ Add Vendor
                            </button>
                        </div>
                    </div>

                    <div className="vendor-tabs-container">
                        {sourcingData.vendors.map((vendor) => (
                            <div
                                key={vendor.id}
                                className={`vendor-tab ${activeVendorId === vendor.id ? 'active' : ''} ${vendor.isPrimary ? 'primary' : ''}`}
                                onClick={() => switchVendor(vendor.id)}
                            >
                                <div className="vendor-tab-content">
                                    <div className="vendor-tab-name">
                                        <input
                                            type="text"
                                            value={vendor.vendorName}
                                            onChange={(e) => updateVendorName(vendor.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="vendor-name-input"
                                        />
                                        {vendor.isPrimary && <span className="primary-badge">★ PRIMARY</span>}
                                    </div>
                                    <div className="vendor-tab-actions" onClick={(e) => e.stopPropagation()}>
                                        <div className="vendor-dropdown">
                                            <button className="vendor-actions-btn">⚙️</button>
                                            <div className="vendor-dropdown-menu">
                                                <button onClick={() => setPrimaryVendor(vendor.id)}>
                                                    ⭐ Set as Primary
                                                </button>
                                                <button onClick={() => {
                                                    const otherVendors = sourcingData.vendors.filter(v => v.id !== vendor.id);
                                                    if (otherVendors.length > 0) {
                                                        const selectedVendor = prompt(`Copy data from vendor:\n${otherVendors.map((v, i) => `${i + 1}. ${v.vendorName}`).join('\n')}\n\nEnter vendor number:`);
                                                        if (selectedVendor && !isNaN(selectedVendor)) {
                                                            const vendorIndex = parseInt(selectedVendor) - 1;
                                                            if (vendorIndex >= 0 && vendorIndex < otherVendors.length) {
                                                                copyVendorData(otherVendors[vendorIndex].id);
                                                            }
                                                        }
                                                    }
                                                }}>
                                                    📋 Copy Data From...
                                                </button>
                                                <button
                                                    onClick={() => removeVendor(vendor.id)}
                                                    className="delete-action"
                                                >
                                                    🗑️ Remove Vendor
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loading State for Vendor Switching */}
                {isVendorSwitching ? (
                    <div className="vendor-switching-loader">
                        <div className="vendor-switching-spinner"></div>
                        <p>Loading vendor data...</p>
                    </div>
                ) : (
                    currentVendor && (
                        <VendorForm
                            key={activeVendorId}
                            vendor={currentVendor}
                            onUpdate={updateCurrentVendor}
                            onLineItemUpdate={updateLineItem}
                            onAddLineItem={addLineItem}
                            onRemoveLineItem={removeLineItem}
                            qmsId={id}
                        />
                    )
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button className="btn-secondary" onClick={() => navigate('/sourcing')}>
                        ← Back to Sourcing
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => handleSave()}
                        disabled={saving}
                    >
                        {saving ? '💾 Saving...' : '💾 Save Progress'}
                    </button>
                    <button
                        className="btn-success"
                        onClick={handleProceed}
                        disabled={saving}
                    >
                        {saving ? '🔄 Processing...' : '✅ Save & Proceed to Sourcing Dashboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SourcingDetails;