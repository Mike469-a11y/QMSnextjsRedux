import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import IndexedDBManager from '../../utils/IndexedDBManager';
import '../../styles/SubmittedData.css';

// ✅ Entry Details Modal Component - ENHANCED WITH COMPLETE DATA & FIXES
const EntryDetailsModal = memo(({
    show,
    entry,
    onClose,
    currentUser,
    isAdmin,
    isSubAdmin,
    onEdit,
    onDelete
}) => {
    const [currentVendorIndex, setCurrentVendorIndex] = useState(0);

    if (!show || !entry) return null;

    const vendors = entry.sourcingData?.vendors || [];
    const currentVendor = vendors[currentVendorIndex];
    const vendorCount = vendors.length;

    const handlePreviousVendor = () => {
        setCurrentVendorIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextVendor = () => {
        if (vendors.length > 0) {
            setCurrentVendorIndex(prev => Math.min(vendors.length - 1, prev + 1));
        }
    };

    // ✅ FIXED: File download handler with proper error handling
    const handleFileDownload = async (attachment, vendorName) => {
        try {
            console.log('📥 Downloading attachment:', attachment);
            let downloadUrl = '';
            let fileName = attachment.name || `${vendorName}_attachment`;

            // ✅ Handle different attachment formats
            if (typeof attachment === 'string') {
                // IndexedDB reference
                const fileData = await IndexedDBManager.getAttachment(attachment);
                if (fileData && fileData.file) {
                    downloadUrl = URL.createObjectURL(fileData.file);
                    fileName = fileData.name || fileName;
                } else {
                    throw new Error('File not found in IndexedDB');
                }
            } else if (attachment.file instanceof File) {
                // Direct File object
                downloadUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.file.name || fileName;
            } else if (attachment.file instanceof Blob) {
                // Blob object
                downloadUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.name || fileName;
            } else if (attachment.file && typeof attachment.file === 'object') {
                // File-like object, convert to Blob
                const blob = new Blob([attachment.file], { type: attachment.type || 'application/octet-stream' });
                downloadUrl = URL.createObjectURL(blob);
                fileName = attachment.name || fileName;
            } else if (attachment.data) {
                // Base64 or raw data
                let blobData;
                let mimeType = attachment.type || 'application/octet-stream';

                if (typeof attachment.data === 'string') {
                    try {
                        // Handle base64 data
                        const base64Data = attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data;
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        blobData = bytes;
                    } catch (e) {
                        // Handle as text data
                        blobData = new TextEncoder().encode(attachment.data);
                        mimeType = 'text/plain';
                    }
                } else if (attachment.data instanceof ArrayBuffer) {
                    blobData = new Uint8Array(attachment.data);
                } else if (attachment.data instanceof Uint8Array) {
                    blobData = attachment.data;
                } else {
                    blobData = new TextEncoder().encode(String(attachment.data));
                }

                const blob = new Blob([blobData], { type: mimeType });
                downloadUrl = URL.createObjectURL(blob);
            } else if (attachment.url) {
                // Direct URL
                downloadUrl = attachment.url;
            } else {
                throw new Error('No valid file data found');
            }

            // Create and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup blob URL
            if (downloadUrl.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            }

            alert(`📥 Downloaded: ${fileName}`);
        } catch (error) {
            console.error('❌ Error downloading file:', error);
            alert(`❌ Error downloading file: ${attachment.name || 'Unknown'}\n\nError: ${error.message}`);
        }
    };

    // ✅ FIXED: Simple file preview handler - NO FANCY BORDERS + SUBMISSION ATTACHMENTS
    const handleFilePreview = async (attachment, vendorName) => {
        try {
            console.log('👁️ Previewing attachment:', attachment);
            let previewUrl = '';
            let fileName = attachment.name || `${vendorName}_attachment`;
            let mimeType = attachment.type || 'application/pdf';

            // ✅ ENHANCED: Handle submission attachments differently
            if (attachment.url) {
                // Direct URL (submission attachments often have this)
                previewUrl = attachment.url;
                fileName = attachment.name || fileName;
                mimeType = attachment.type || 'application/pdf';
            } else if (typeof attachment === 'string') {
                // IndexedDB reference
                const fileData = await IndexedDBManager.getAttachment(attachment);
                if (fileData && fileData.file) {
                    mimeType = fileData.file.type || fileData.type || 'application/pdf';
                    previewUrl = URL.createObjectURL(fileData.file);
                    fileName = fileData.name || fileName;
                } else {
                    throw new Error('File not found in IndexedDB');
                }
            } else if (attachment.file instanceof File) {
                // Direct File object
                mimeType = attachment.file.type || 'application/pdf';
                previewUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.file.name || fileName;
            } else if (attachment.file instanceof Blob) {
                // Blob object
                mimeType = attachment.file.type || attachment.type || 'application/pdf';
                previewUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.name || fileName;
            } else if (attachment.file && typeof attachment.file === 'object') {
                // File-like object, convert to Blob with proper MIME type
                mimeType = attachment.type || 'application/pdf';
                const blob = new Blob([attachment.file], { type: mimeType });
                previewUrl = URL.createObjectURL(blob);
                fileName = attachment.name || fileName;
            } else if (attachment.data) {
                // Base64 or raw data
                let blobData;
                mimeType = attachment.type || 'application/pdf';

                if (typeof attachment.data === 'string') {
                    try {
                        // Handle base64 data
                        const base64Data = attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data;
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        blobData = bytes;
                    } catch (e) {
                        // Handle as text data
                        blobData = new TextEncoder().encode(attachment.data);
                        mimeType = 'text/plain';
                    }
                } else if (attachment.data instanceof ArrayBuffer) {
                    blobData = new Uint8Array(attachment.data);
                } else if (attachment.data instanceof Uint8Array) {
                    blobData = attachment.data;
                } else {
                    blobData = new TextEncoder().encode(String(attachment.data));
                    mimeType = 'text/plain';
                }

                const blob = new Blob([blobData], { type: mimeType });
                previewUrl = URL.createObjectURL(blob);
            } else {
                throw new Error('No valid file data found');
            }

            console.log('🔍 Preview URL created:', previewUrl);
            console.log('📄 File type:', mimeType);

            // ✅ SIMPLIFIED: Direct browser preview - NO FANCY STYLING
            if (mimeType === 'application/pdf') {
                // ✅ Simple PDF preview - just open the blob URL directly
                const previewWindow = window.open(previewUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');

                if (!previewWindow) {
                    alert('❌ Preview blocked by browser popup blocker.\n\nPlease allow popups for this site and try again.');
                    if (previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    return;
                }

                // Set window title
                previewWindow.document.title = `Preview: ${fileName}`;

                // ✅ Cleanup blob URL after delay
                if (previewUrl.startsWith('blob:')) {
                    setTimeout(() => {
                        try {
                            URL.revokeObjectURL(previewUrl);
                        } catch (e) {
                            console.warn('Could not revoke blob URL:', e);
                        }
                    }, 30000); // 30 seconds delay
                }

            } else if (mimeType.startsWith('image/')) {
                // ✅ Simple image preview
                const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

                if (!previewWindow) {
                    alert('❌ Preview blocked by browser popup blocker.\n\nPlease allow popups for this site and try again.');
                    if (previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    return;
                }

                previewWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Preview: ${fileName}</title>
                        <style>
                            body { margin: 0; padding: 20px; text-align: center; background: #f0f0f0; }
                            img { max-width: 100%; height: auto; border: 1px solid #ddd; }
                        </style>
                    </head>
                    <body>
                        <img src="${previewUrl}" alt="${fileName}">
                    </body>
                    </html>
                `);

                // ✅ Cleanup blob URL after delay
                if (previewUrl.startsWith('blob:')) {
                    setTimeout(() => {
                        try {
                            URL.revokeObjectURL(previewUrl);
                        } catch (e) {
                            console.warn('Could not revoke blob URL:', e);
                        }
                    }, 30000); // 30 seconds delay
                }

            } else if (mimeType.startsWith('text/')) {
                // ✅ Simple text preview
                const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

                if (!previewWindow) {
                    alert('❌ Preview blocked by browser popup blocker.\n\nPlease allow popups for this site and try again.');
                    if (previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    return;
                }

                // Fetch and display text content
                fetch(previewUrl)
                    .then(response => response.text())
                    .then(text => {
                        previewWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Preview: ${fileName}</title>
                                <style>
                                    body { margin: 0; padding: 20px; font-family: monospace; background: #f8f8f8; }
                                    pre { white-space: pre-wrap; word-wrap: break-word; }
                                </style>
                            </head>
                            <body>
                                <pre>${text}</pre>
                            </body>
                            </html>
                        `);
                    })
                    .catch(error => {
                        previewWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head><title>Error</title></head>
                            <body style="padding: 20px; font-family: Arial;">
                                <h3>Error loading file</h3>
                                <p>${error.message}</p>
                            </body>
                            </html>
                        `);
                    });

                // ✅ Cleanup blob URL after delay
                if (previewUrl.startsWith('blob:')) {
                    setTimeout(() => {
                        try {
                            URL.revokeObjectURL(previewUrl);
                        } catch (e) {
                            console.warn('Could not revoke blob URL:', e);
                        }
                    }, 30000); // 30 seconds delay
                }

            } else {
                // ✅ For other file types, offer download
                const userConfirmed = window.confirm(
                    `❓ File "${fileName}" cannot be previewed in browser.\n\nFile type: ${mimeType}\n\nWould you like to download it instead?`
                );

                if (userConfirmed) {
                    await handleFileDownload(attachment, vendorName);
                }

                // Cleanup blob URL
                if (previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                }
            }

        } catch (error) {
            console.error('❌ Error previewing file:', error);
            alert(`❌ Error previewing file: ${attachment.name || 'Unknown'}\n\nError: ${error.message}\n\nTry downloading the file instead.`);
        }
    };

    // ✅ Download all files for a vendor
    const handleDownloadAllFiles = async (vendor, vendorIndex) => {
        if (!vendor.sourcingInfo?.attachments || vendor.sourcingInfo.attachments.length === 0) {
            alert('📭 No attachments found for this vendor.');
            return;
        }

        const vendorName = vendor.sourcingInfo?.vendorName || `Vendor_${vendorIndex + 1}`;
        try {
            for (let i = 0; i < vendor.sourcingInfo.attachments.length; i++) {
                const attachment = vendor.sourcingInfo.attachments[i];
                setTimeout(async () => {
                    await handleFileDownload(attachment, vendorName);
                }, i * 1000);
            }
            alert(`📥 Downloading ${vendor.sourcingInfo.attachments.length} files from ${vendorName}...`);
        } catch (error) {
            console.error('❌ Error downloading all files:', error);
            alert(`❌ Error downloading files from ${vendorName}: ${error.message}`);
        }
    };

    return (
        <div className="submitted-data-entry-details-modal-overlay">
            <div className="submitted-data-entry-details-modal">
                <div className="submitted-data-entry-details-modal-header">
                    <h3>📋 Complete Entry Details - {entry.archiveId || entry.id}</h3>
                    <div className="submitted-data-modal-header-actions">
                        {(isAdmin || isSubAdmin) && (
                            <button
                                className="submitted-data-btn-edit-entry"
                                onClick={() => onEdit(entry)}
                                title="Edit Entry"
                            >
                                ✏️ Edit
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className="submitted-data-btn-delete-entry"
                                onClick={() => onDelete(entry)}
                                title="Delete Entry"
                            >
                                🗑️ Delete
                            </button>
                        )}
                        <button
                            className="submitted-data-modal-close-btn"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="submitted-data-entry-details-modal-body">
                    {/* ✅ Archive Information */}
                    <div className="submitted-data-modal-section">
                        <h4>🗂️ Archive Information</h4>
                        <div className="submitted-data-info-grid">
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Archive ID:</span>
                                <span className="submitted-data-value">{entry.archiveId || entry.id}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">QMS ID:</span>
                                <span className="submitted-data-value">{entry.id}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Submitted At:</span>
                                <span className="submitted-data-value">{entry.submittedToArchiveAt || entry.archivedAt || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Submitted By:</span>
                                <span className="submitted-data-value">{entry.submittedToArchiveBy || entry.archivedBy || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Final Status:</span>
                                <span className="submitted-data-value submitted-data-status-approved">✅ Submitted</span>
                            </div>
                        </div>
                    </div>

                    {/* ✅ Original QMS Information */}
                    <div className="submitted-data-modal-section">
                        <h4>📋 Original QMS Information</h4>
                        <div className="submitted-data-info-grid">
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Entry ID:</span>
                                <span className="submitted-data-value">{entry.id}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Bid Title:</span>
                                <span className="submitted-data-value">{entry.bidTitle || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Bid Number:</span>
                                <span className="submitted-data-value">{entry.bidNumber || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Portal:</span>
                                <span className="submitted-data-value">{entry.portalName || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Category:</span>
                                <span className="submitted-data-value">{entry.category || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Quantity:</span>
                                <span className="submitted-data-value">{entry.quantity || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Sourcer:</span>
                                <span className="submitted-data-value">{entry.sourcerName || entry.hunterName || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Due Date:</span>
                                <span className="submitted-data-value">{entry.dueDate || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Created:</span>
                                <span className="submitted-data-value">{entry.dateCreated || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Assigned By:</span>
                                <span className="submitted-data-value">{entry.assignedBy || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Contact:</span>
                                <span className="submitted-data-value">{entry.contactName || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Email:</span>
                                <span className="submitted-data-value">{entry.email || 'N/A'}</span>
                            </div>
                            {(entry.sourcingRemarks || entry.huntingRemarks) && (
                                <div className="submitted-data-info-item submitted-data-full-width">
                                    <span className="submitted-data-label">Original Remarks:</span>
                                    <span className="submitted-data-value">{entry.sourcingRemarks || entry.huntingRemarks}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ Approval Information */}
                    {(entry.status === 'approval_approved' && entry.approvalRemarks) && (
                        <div className="submitted-data-modal-section">
                            <h4>✅ Approval Information</h4>
                            <div className="submitted-data-info-grid">
                                <div className="submitted-data-info-item">
                                    <span className="submitted-data-label">Approved By:</span>
                                    <span className="submitted-data-value">{entry.approvedBy || 'N/A'}</span>
                                </div>
                                <div className="submitted-data-info-item">
                                    <span className="submitted-data-label">Approved At:</span>
                                    <span className="submitted-data-value">{entry.approvedAt || 'N/A'}</span>
                                </div>
                                <div className="submitted-data-info-item submitted-data-full-width">
                                    <span className="submitted-data-label">Approval Remarks:</span>
                                    <div className="submitted-data-remarks-text">{entry.approvalRemarks}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ VENDOR CAROUSEL SECTION - COMPLETE WITH ALL VENDORS */}
                    {vendors.length > 0 && (
                        <div className="submitted-data-modal-section">
                            <div className="submitted-data-vendor-carousel-header">
                                <h4>🏢 Vendor Details ({vendorCount} Vendor{vendorCount > 1 ? 's' : ''})</h4>
                                {vendorCount > 1 && (
                                    <div className="submitted-data-vendor-navigation">
                                        <button
                                            className="submitted-data-vendor-nav-btn"
                                            onClick={handlePreviousVendor}
                                            disabled={currentVendorIndex === 0}
                                        >
                                            ← Prev
                                        </button>
                                        <span className="submitted-data-vendor-counter">
                                            {currentVendorIndex + 1} of {vendorCount}
                                        </span>
                                        <button
                                            className="submitted-data-vendor-nav-btn"
                                            onClick={handleNextVendor}
                                            disabled={currentVendorIndex === vendorCount - 1}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ✅ Vendor Indicators */}
                            {vendorCount > 1 && (
                                <div className="submitted-data-vendor-indicators">
                                    {vendors.map((vendor, index) => (
                                        <button
                                            key={index}
                                            className={`submitted-data-vendor-indicator ${index === currentVendorIndex ? 'active' : ''}`}
                                            onClick={() => setCurrentVendorIndex(index)}
                                            title={`Go to ${vendor.sourcingInfo?.vendorName || `Vendor ${index + 1}`}`}
                                        >
                                            {index === currentVendorIndex ? '●' : '○'}
                                            {vendor.isPrimary && <span className="submitted-data-primary-badge">⭐</span>}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ✅ Current Vendor Details */}
                            {currentVendor && (
                                <div className="submitted-data-vendor-content">
                                    <div className="submitted-data-vendor-title">
                                        <h5>
                                            📋 Vendor {currentVendorIndex + 1}: {currentVendor.sourcingInfo?.vendorName || 'Unknown'}
                                            {currentVendor.isPrimary && <span className="submitted-data-primary-tag">⭐ PRIMARY</span>}
                                        </h5>
                                    </div>

                                    {/* ✅ ENHANCED: Complete Sourcing Information with ALL Fields */}
                                    <div className="submitted-data-vendor-section">
                                        <h6>📋 Sourcing Information</h6>
                                        <div className="submitted-data-vendor-fields-complete">
                                            {/* Row 1: Vendor Name, Quoted Cost, Website */}
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Vendor Name:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.vendorName || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Quoted Cost:</span>
                                                <span className="submitted-data-field-value submitted-data-cost">${currentVendor.sourcingInfo?.productServiceQuotedCost || '0.00'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Website:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.vendorWebsite || 'N/A'}</span>
                                            </div>

                                            {/* Row 2: Vendor Address (Full Width) */}
                                            <div className="submitted-data-vendor-field submitted-data-full-width">
                                                <span className="submitted-data-field-label">Vendor Address:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.vendorAddress || 'N/A'}</span>
                                            </div>

                                            {/* Row 3: Proper Quotation, Proper Quotation (Vendor), Risk Assessment, Compliance */}
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Proper Quotation:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.properQuotationGiven || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Proper Quotation (Vendor):</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.properQuotationGivenNew || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Risk Assessment:</span>
                                                <span className={`submitted-data-field-value submitted-data-risk-${currentVendor.sourcingInfo?.riskAssessment?.toLowerCase()?.replace(' ', '-')}`}>
                                                    {currentVendor.sourcingInfo?.riskAssessment || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Compliance:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.compliance || 'N/A'}</span>
                                            </div>

                                            {/* Row 4: CC Accepted, NET Terms, CC Charges, Specs Sheet Taken */}
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">CC Accepted:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.ccAccepted || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">NET Terms:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.netTermsAvailable || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">CC Charges:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.ccCharges || 'N/A'}%</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Specs Sheet Taken:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.specsSheetTaken || 'N/A'}</span>
                                            </div>

                                            {/* Row 5: Lead Time, Stock Available, Quote Receiving Date, Quote Valid Till */}
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Lead Time:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.leadTimeOffered || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Stock Available:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.stockAvailable || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Quote Receiving Date:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.quoteReceivingDate || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Quote Valid Till:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.quoteValidTill || 'N/A'}</span>
                                            </div>

                                            {/* Row 6: Remaining Days, Item Same/Alternative, Warranty, After Sales Support */}
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Remaining Days:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.remainingDays || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Item Same/Alternative:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.itemSameAlternative || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Warranty:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.warrantyPeriod || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">After Sales Support:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.afterSalesSupport || 'N/A'}</span>
                                            </div>

                                            {/* Row 7: Support Period */}
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Support Period:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.supportPeriod || 'N/A'}</span>
                                            </div>

                                            {/* Row 8: Warranty/Support Terms (Full Width) */}
                                            <div className="submitted-data-vendor-field submitted-data-full-width">
                                                <span className="submitted-data-field-label">Warranty/Support Terms:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.warrantySupportTerms || 'N/A'}</span>
                                            </div>

                                            {/* Row 9: Shipping Cost, Applicable Taxes, Restocking Fees */}
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Shipping Cost:</span>
                                                <span className="submitted-data-field-value submitted-data-cost">${currentVendor.sourcingInfo?.estimatedShippingCost || '0.00'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Applicable Taxes:</span>
                                                <span className="submitted-data-field-value">{currentVendor.sourcingInfo?.applicableTaxes || 'N/A'}</span>
                                            </div>
                                            <div className="submitted-data-vendor-field">
                                                <span className="submitted-data-field-label">Restocking Fees:</span>
                                                <span className="submitted-data-field-value">
                                                    {currentVendor.sourcingInfo?.restockingFees || 'N/A'}
                                                    {currentVendor.sourcingInfo?.restockingFees === 'Yes' && currentVendor.sourcingInfo?.restockingFeesPercentage &&
                                                        ` (${currentVendor.sourcingInfo.restockingFeesPercentage}%)`
                                                    }
                                                </span>
                                            </div>

                                            {/* Vendor Remarks (Full Width) */}
                                            {currentVendor.sourcingInfo?.remarks && (
                                                <div className="submitted-data-vendor-field submitted-data-full-width">
                                                    <span className="submitted-data-field-label">Vendor Remarks:</span>
                                                    <div className="submitted-data-remarks-text">{currentVendor.sourcingInfo.remarks}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ✅ Pricing & Line Items */}
                                    <div className="submitted-data-vendor-section">
                                        <h6>💰 Pricing & Line Items</h6>

                                        {/* Line Items */}
                                        {currentVendor.pricing?.lineItems && currentVendor.pricing.lineItems.length > 0 && (
                                            <div className="submitted-data-line-items">
                                                <div className="submitted-data-line-items-header">
                                                    <span>Description</span>
                                                    <span>Qty</span>
                                                    <span>Unit Price</span>
                                                    <span>Total</span>
                                                </div>
                                                {currentVendor.pricing.lineItems.map((item, itemIndex) => (
                                                    <div key={item.id || itemIndex} className="submitted-data-line-item-row">
                                                        <span>{item.description || 'N/A'}</span>
                                                        <span>{item.qty || '0'}</span>
                                                        <span>${item.unitPrice || '0.00'}</span>
                                                        <span>${(item.cost || 0).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Cost Breakdown */}
                                        <div className="submitted-data-cost-breakdown">
                                            <div className="submitted-data-breakdown-item">
                                                <span>Subtotal:</span>
                                                <span>${(currentVendor.pricing?.subtotal || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>CC Charges:</span>
                                                <span>${(currentVendor.pricing?.ccChargesAmount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Tax:</span>
                                                <span>${(currentVendor.pricing?.taxAmount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Freight:</span>
                                                <span>${(currentVendor.pricing?.freightLogistics || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Extended Warranty:</span>
                                                <span>${(currentVendor.pricing?.extendedWarranty || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Installation:</span>
                                                <span>${(currentVendor.pricing?.installation || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Restocking Fees:</span>
                                                <span>${(currentVendor.pricing?.restockingFeesAmount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Other 1:</span>
                                                <span>${(currentVendor.pricing?.other1 || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Other 2:</span>
                                                <span>${(currentVendor.pricing?.other2 || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item submitted-data-grand-total">
                                                <span>Grand Total:</span>
                                                <span>${(currentVendor.pricing?.grandTotal || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Discount 1:</span>
                                                <span>-${(currentVendor.pricing?.discount1 || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item">
                                                <span>Discount 2:</span>
                                                <span>-${(currentVendor.pricing?.discount2 || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="submitted-data-breakdown-item submitted-data-final-total">
                                                <span>Final Total:</span>
                                                <span>${(currentVendor.pricing?.finalGrandTotal || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ✅ Vendor Attachments */}
                                    {currentVendor.sourcingInfo?.attachments && currentVendor.sourcingInfo.attachments.length > 0 && (
                                        <div className="submitted-data-vendor-section">
                                            <div className="submitted-data-attachments-header">
                                                <h6>📎 Vendor Attachments ({currentVendor.sourcingInfo.attachments.length})</h6>
                                                <button
                                                    className="submitted-data-btn-download-all"
                                                    onClick={() => handleDownloadAllFiles(currentVendor, currentVendorIndex)}
                                                    title="Download all files"
                                                >
                                                    📥 Download All
                                                </button>
                                            </div>
                                            <div className="submitted-data-attachments-list">
                                                {currentVendor.sourcingInfo.attachments.map((attachment, attIndex) => (
                                                    <div key={attIndex} className="submitted-data-attachment-item">
                                                        <div className="submitted-data-attachment-info">
                                                            <div className="submitted-data-attachment-name">
                                                                📄 {attachment.name || attachment.file?.name || `File ${attIndex + 1}`}
                                                                {(attachment.type || attachment.file?.type) && (
                                                                    <span className="submitted-data-file-type">
                                                                        ({(attachment.type || attachment.file?.type).split('/')[1]?.toUpperCase()})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="submitted-data-attachment-size">
                                                                {attachment.size || attachment.file?.size || 'Unknown size'}
                                                            </div>
                                                        </div>
                                                        <div className="submitted-data-attachment-actions">
                                                            <button
                                                                className="submitted-data-btn-preview"
                                                                onClick={() => handleFilePreview(attachment, currentVendor.sourcingInfo?.vendorName || `Vendor ${currentVendorIndex + 1}`)}
                                                                title={`Preview ${attachment.name || attachment.file?.name || 'file'}`}
                                                            >
                                                                👁️
                                                            </button>
                                                            <button
                                                                className="submitted-data-btn-download"
                                                                onClick={() => handleFileDownload(attachment, currentVendor.sourcingInfo?.vendorName || `Vendor ${currentVendorIndex + 1}`)}
                                                                title={`Download ${attachment.name || attachment.file?.name || 'file'}`}
                                                            >
                                                                📥
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ✅ SUBMISSION DETAILS & CALCULATIONS */}
                    {entry.submissionCalculations && (
                        <div className="submitted-data-modal-section">
                            <h4>📊 Submission Details & Calculations</h4>
                            <div className="submitted-data-submission-calculations">
                                <div className="submitted-data-calc-row">
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">📅 Submission Date:</span>
                                        <span className="submitted-data-calc-value">{entry.submissionCalculations.submissionDate || 'N/A'}</span>
                                    </div>
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">👤 Assigned Person:</span>
                                        <span className="submitted-data-calc-value">{entry.submissionCalculations.assignedPerson || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="submitted-data-calc-row">
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">💰 Vendor Cost:</span>
                                        <span className="submitted-data-calc-value submitted-data-cost">${(entry.submissionCalculations.vendorCost || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">🚚 Shipping Cost:</span>
                                        <span className="submitted-data-calc-value">${(entry.submissionCalculations.shippingCost || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="submitted-data-calc-row">
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">💳 CC Cost (%):</span>
                                        <span className="submitted-data-calc-value">{(entry.submissionCalculations.ccCostPercent || 0).toFixed(2)}%</span>
                                    </div>
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">💳 CC Cost ($):</span>
                                        <span className="submitted-data-calc-value">${(entry.submissionCalculations.ccCostAmount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="submitted-data-calc-row">
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">💵 Total Cost:</span>
                                        <span className="submitted-data-calc-value submitted-data-total">${(entry.submissionCalculations.totalCost || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">📊 1% Vendor Cost:</span>
                                        <span className="submitted-data-calc-value">${(entry.submissionCalculations.onePercentVendorCost || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="submitted-data-calc-row">
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">📈 Profit (%):</span>
                                        <span className="submitted-data-calc-value">{(entry.submissionCalculations.profitPercent || 0).toFixed(2)}%</span>
                                    </div>
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">💲 Profit ($):</span>
                                        <span className="submitted-data-calc-value">${(entry.submissionCalculations.profitAmount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="submitted-data-calc-row">
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">💎 Total Profit:</span>
                                        <span className="submitted-data-calc-value submitted-data-total">${(entry.submissionCalculations.totalProfitAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="submitted-data-calc-item">
                                        <span className="submitted-data-calc-label">🏛️ Tax Amount:</span>
                                        <span className="submitted-data-calc-value">${(entry.submissionCalculations.taxAmount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="submitted-data-calc-row">
                                    <div className="submitted-data-calc-item submitted-data-full-width">
                                        <span className="submitted-data-calc-label">🎯 Submitted with Margin:</span>
                                        <span className="submitted-data-calc-value submitted-data-final-amount">${(entry.submissionCalculations.submittedWithMargin || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ FIXED: SUBMISSION ATTACHMENTS WITH PROPER HANDLING */}
                    {entry.submissionAttachments && entry.submissionAttachments.length > 0 && (
                        <div className="submitted-data-modal-section">
                            <div className="submitted-data-attachments-header">
                                <h4>📎 Submission Attachments ({entry.submissionAttachments.length})</h4>
                            </div>
                            <div className="submitted-data-attachments-list">
                                {entry.submissionAttachments.map((attachment, index) => (
                                    <div key={attachment.id || index} className="submitted-data-attachment-item">
                                        <div className="submitted-data-attachment-info">
                                            <div className="submitted-data-attachment-name">
                                                📄 {attachment.name}
                                                {attachment.type && (
                                                    <span className="submitted-data-file-type">
                                                        ({attachment.type.split('/')[1]?.toUpperCase()})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="submitted-data-attachment-size">{attachment.size}</div>
                                        </div>
                                        <div className="submitted-data-attachment-actions">
                                            <button
                                                className="submitted-data-btn-preview"
                                                onClick={() => handleFilePreview(attachment, 'Submission')}
                                                title={`Preview ${attachment.name}`}
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className="submitted-data-btn-download"
                                                onClick={() => handleFileDownload(attachment, 'Submission')}
                                                title={`Download ${attachment.name}`}
                                            >
                                                📥
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ✅ FINAL SUBMISSION INFORMATION */}
                    <div className="submitted-data-modal-section">
                        <h4>📤 Final Submission Information</h4>
                        <div className="submitted-data-info-grid">
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Submitted By:</span>
                                <span className="submitted-data-value">{entry.finalSubmissionBy || 'N/A'}</span>
                            </div>
                            <div className="submitted-data-info-item">
                                <span className="submitted-data-label">Submission Date:</span>
                                <span className="submitted-data-value">{entry.finalSubmissionAt || 'N/A'}</span>
                            </div>
                            {entry.finalSubmissionRemarks && (
                                <div className="submitted-data-info-item submitted-data-full-width">
                                    <span className="submitted-data-label">Special Submission Remarks:</span>
                                    <div className="submitted-data-remarks-text">{entry.finalSubmissionRemarks}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ WORKFLOW TRACKING */}
                    {entry.workflowStages && (
                        <div className="submitted-data-modal-section">
                            <h4>🔄 Workflow History</h4>
                            <div className="submitted-data-workflow-stages">
                                {entry.workflowStages.map((stage, index) => (
                                    <div key={index} className="submitted-data-workflow-stage">
                                        <div className="submitted-data-stage-icon">
                                            {stage.stage === 'hunting' && '🎯'}
                                            {stage.stage === 'sourcing' && '🔍'}
                                            {stage.stage === 'approval' && '✅'}
                                            {stage.stage === 'submission' && '📤'}
                                        </div>
                                        <div className="submitted-data-stage-info">
                                            <div className="submitted-data-stage-name">{stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1)}</div>
                                            <div className="submitted-data-stage-details">
                                                Completed by: {stage.completedBy} at {stage.completedAt}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="submitted-data-entry-details-modal-footer">
                    <button
                        className="submitted-data-btn-close-modal"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
});

const SubmittedData = () => {
    const navigate = useNavigate();
    const [submittedEntries, setSubmittedEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showEntryModal, setShowEntryModal] = useState(false);

    // ✅ User role management
    const currentDateTime = '2025-08-01 20:14:45';
    const currentUser = 'Mike469-a11y';
    const isAdmin = currentUser === 'Mike469-a11y' || currentUser === 'admin';
    const isSubAdmin = currentUser === 'subadmin';
    const hasEditAccess = isAdmin || isSubAdmin;

    useEffect(() => {
        loadSubmittedEntries();
        // Initialize IndexedDB for file access
        IndexedDBManager.initDB().catch(error => {
            console.error('Failed to initialize IndexedDB:', error);
        });
    }, []);

    // ✅ FIXED: Load submitted entries with STRONG duplicate QMS ID prevention
    const loadSubmittedEntries = () => {
        try {
            console.log('📂 Loading submitted entries from localStorage...');
            const stored = localStorage.getItem("submittedDataEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                console.log(`📥 Found ${entries.length} entries in localStorage`);

                // ✅ ENHANCED: STRONG duplicate QMS ID prevention with detailed logging
                const uniqueEntries = [];
                const seenQMSIds = new Set();
                const duplicateEntries = [];

                // Sort by submission date (most recent first) to keep the latest duplicate
                const sortedEntries = entries.sort((a, b) => {
                    const dateA = new Date(a.submittedToArchiveAt || a.archivedAt || a.finalSubmissionAt || '1970-01-01');
                    const dateB = new Date(b.submittedToArchiveAt || b.archivedAt || b.finalSubmissionAt || '1970-01-01');
                    return dateB - dateA;
                });

                // Keep only unique QMS IDs (most recent first)
                sortedEntries.forEach((entry, index) => {
                    const qmsId = entry.id;
                    if (!qmsId) {
                        console.warn(`⚠️ Entry at index ${index} has no QMS ID:`, entry);
                        return;
                    }

                    if (!seenQMSIds.has(qmsId)) {
                        seenQMSIds.add(qmsId);
                        uniqueEntries.push(entry);
                        console.log(`✅ Keeping QMS ID: ${qmsId} (${entry.bidTitle || 'No title'})`);
                    } else {
                        duplicateEntries.push(entry);
                        console.warn(`❌ DUPLICATE QMS ID REMOVED: ${qmsId} (${entry.bidTitle || 'No title'})`);
                    }
                });

                // Update localStorage with deduplicated entries if duplicates were found
                if (duplicateEntries.length > 0) {
                    console.log(`🔧 REMOVING ${duplicateEntries.length} DUPLICATE ENTRIES:`);
                    duplicateEntries.forEach(duplicate => {
                        console.log(`   - QMS ID: ${duplicate.id} | Title: ${duplicate.bidTitle || 'No title'}`);
                    });

                    localStorage.setItem("submittedDataEntries", JSON.stringify(uniqueEntries));
                    console.log(`💾 Updated localStorage with ${uniqueEntries.length} unique entries`);

                    // Show user notification
                    if (duplicateEntries.length > 0) {
                        setTimeout(() => {
                            alert(`🔧 DUPLICATE CLEANUP\n\nRemoved ${duplicateEntries.length} duplicate entries with same QMS IDs.\n\n✅ Archive now contains ${uniqueEntries.length} unique entries.`);
                        }, 1000);
                    }
                }

                console.log(`📊 Final result: ${uniqueEntries.length} unique entries loaded`);
                setSubmittedEntries(uniqueEntries);
            } else {
                console.log('📭 No submitted entries found in localStorage');
                setSubmittedEntries([]);
            }
        } catch (error) {
            console.error('❌ Error loading submitted entries:', error);
            setSubmittedEntries([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Get available years from submitted data
    const availableYears = useMemo(() => {
        console.log('📅 Calculating available years from', submittedEntries.length, 'entries');
        const years = new Set();
        submittedEntries.forEach(entry => {
            const submissionDate = entry.submittedToArchiveAt || entry.archivedAt || entry.finalSubmissionAt;
            if (submissionDate) {
                const year = new Date(submissionDate).getFullYear();
                years.add(year);
                console.log(`  - Entry ${entry.id}: ${submissionDate} → Year ${year}`);
            } else {
                console.warn(`  - Entry ${entry.id}: No submission date found`);
            }
        });
        const yearArray = Array.from(years).sort((a, b) => b - a); // Latest year first
        console.log('📅 Available years:', yearArray);
        return yearArray;
    }, [submittedEntries]);

    // ✅ Get available months for selected year
    const availableMonths = useMemo(() => {
        if (!selectedYear) return [];

        console.log('📅 Calculating available months for year', selectedYear);
        const months = new Set();
        submittedEntries.forEach(entry => {
            const submissionDate = entry.submittedToArchiveAt || entry.archivedAt || entry.finalSubmissionAt;
            if (submissionDate) {
                const date = new Date(submissionDate);
                if (date.getFullYear() === selectedYear) {
                    months.add(date.getMonth());
                    console.log(`  - Entry ${entry.id}: Month ${date.getMonth()}`);
                }
            }
        });
        const monthArray = Array.from(months).sort((a, b) => b - a); // Latest month first
        console.log('📅 Available months for', selectedYear, ':', monthArray);
        return monthArray;
    }, [submittedEntries, selectedYear]);

    // ✅ UPDATED: Get entries for selected year and month with QMS ID search
    const filteredEntries = useMemo(() => {
        if (!selectedYear || selectedMonth === null) return [];

        console.log('🔍 Filtering entries for', selectedYear, 'month', selectedMonth, 'search:', searchTerm);

        const filtered = submittedEntries.filter(entry => {
            const submissionDate = entry.submittedToArchiveAt || entry.archivedAt || entry.finalSubmissionAt;
            if (!submissionDate) return false;

            const date = new Date(submissionDate);
            const yearMatch = date.getFullYear() === selectedYear;
            const monthMatch = date.getMonth() === selectedMonth;

            // ✅ ENHANCED: Include QMS ID in search
            const searchMatch = !searchTerm ||
                entry.bidTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.bidNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.portalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.sourcerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.hunterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.archiveId?.toLowerCase().includes(searchTerm.toLowerCase());

            const match = yearMatch && monthMatch && searchMatch;
            if (match) {
                console.log(`✅ Entry matches: ${entry.id} - ${entry.bidTitle}`);
            }
            return match;
        }).sort((a, b) => {
            // Sort by submission date, most recent first
            const dateA = new Date(a.submittedToArchiveAt || a.archivedAt || a.finalSubmissionAt);
            const dateB = new Date(b.submittedToArchiveAt || b.archivedAt || b.finalSubmissionAt);
            return dateB - dateA;
        });

        console.log('🔍 Filtered to', filtered.length, 'entries');
        return filtered;
    }, [submittedEntries, selectedYear, selectedMonth, searchTerm]);

    // ✅ Handle year selection
    const handleYearSelect = (year) => {
        console.log('📅 Year selected:', year);
        setSelectedYear(year);
        setSelectedMonth(null);
        setSearchTerm('');
    };

    // ✅ Handle month selection
    const handleMonthSelect = (month) => {
        console.log('📅 Month selected:', month);
        setSelectedMonth(month);
    };

    // ✅ Handle back to years
    const handleBackToYears = () => {
        console.log('🔙 Back to years');
        setSelectedYear(null);
        setSelectedMonth(null);
        setSearchTerm('');
    };

    // ✅ Handle back to months
    const handleBackToMonths = () => {
        console.log('🔙 Back to months');
        setSelectedMonth(null);
        setSearchTerm('');
    };

    // ✅ Handle entry details view
    const handleViewEntry = (entry) => {
        console.log('👁️ Viewing entry:', entry.id);
        setSelectedEntry(entry);
        setShowEntryModal(true);
    };

    // ✅ Handle edit entry (admin/subadmin only)
    const handleEditEntry = (entry) => {
        if (!hasEditAccess) return;
        console.log('✏️ Edit entry requested:', entry.id);
        // TODO: Implement edit functionality
        alert(`Edit functionality for entry ${entry.id} - Coming soon!`);
    };

    // ✅ Handle delete entry (admin only)
    const handleDeleteEntry = async (entry) => {
        if (!isAdmin) return;

        console.log('🗑️ Delete entry requested:', entry.id);
        if (window.confirm(`Are you sure you want to permanently delete archived entry ${entry.archiveId || entry.id}?\n\nThis action cannot be undone!`)) {
            try {
                const stored = localStorage.getItem("submittedDataEntries");
                if (stored) {
                    const entries = JSON.parse(stored);
                    const updatedEntries = entries.filter(e => e.id !== entry.id);
                    localStorage.setItem("submittedDataEntries", JSON.stringify(updatedEntries));
                    loadSubmittedEntries();
                    setShowEntryModal(false);
                    console.log('✅ Entry deleted:', entry.id);
                    alert(`✅ Entry ${entry.archiveId || entry.id} has been permanently deleted from the archive.`);
                }
            } catch (error) {
                console.error('❌ Error deleting entry:', error);
                alert('❌ Error deleting entry. Please try again.');
            }
        }
    };

    // ✅ Get month name
    const getMonthName = (monthIndex) => {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthNames[monthIndex];
    };

    // ✅ Get entry count for month
    const getMonthEntryCount = (year, month) => {
        const count = submittedEntries.filter(entry => {
            const submissionDate = entry.submittedToArchiveAt || entry.archivedAt || entry.finalSubmissionAt;
            if (!submissionDate) return false;
            const date = new Date(submissionDate);
            return date.getFullYear() === year && date.getMonth() === month;
        }).length;
        console.log(`📊 Month ${month} (${getMonthName(month)}) in ${year}: ${count} entries`);
        return count;
    };

    if (loading) {
        return (
            <div className="submitted-data-container">
                <div className="submitted-data-loading-container">
                    <div className="submitted-data-loading-spinner"></div>
                    <p>Loading submitted data...</p>
                </div>
            </div>
        );
    }

    console.log('🎨 Rendering SubmittedData component');
    console.log('📊 Current state:', {
        entriesCount: submittedEntries.length,
        selectedYear,
        selectedMonth,
        searchTerm,
        filteredCount: filteredEntries.length
    });

    return (
        <div className="submitted-data-container">
            {/* Entry Details Modal */}
            <EntryDetailsModal
                show={showEntryModal}
                entry={selectedEntry}
                onClose={() => setShowEntryModal(false)}
                currentUser={currentUser}
                isAdmin={isAdmin}
                isSubAdmin={isSubAdmin}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
            />

            {/* Header */}
            <div className="submitted-data-header">
                <div className="submitted-data-header-left">
                    <h1>🗂️ Submitted Data Archive</h1>
                    <p>Permanent archive of all submitted entries organized by date</p>
                </div>
                <div className="submitted-data-header-right">
                    <div className="submitted-data-user-info">
                        <span>Current User: <strong>{currentUser}</strong></span>
                        <span className="submitted-data-current-time">{currentDateTime}</span>
                        <span className="submitted-data-user-role">
                            Role: <strong>
                                {isAdmin ? '👑 Admin' : isSubAdmin ? '🛡️ SubAdmin' : '👤 User'}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Breadcrumb */}
            <div className="submitted-data-archive-navigation">
                <button
                    className={`submitted-data-nav-item ${!selectedYear ? 'submitted-data-active' : ''}`}
                    onClick={handleBackToYears}
                >
                    🗓️ Years
                </button>
                {selectedYear && (
                    <>
                        <span className="submitted-data-nav-separator">→</span>
                        <button
                            className={`submitted-data-nav-item ${selectedYear && selectedMonth === null ? 'submitted-data-active' : ''}`}
                            onClick={handleBackToMonths}
                        >
                            📅 {selectedYear} - Months
                        </button>
                    </>
                )}
                {selectedYear && selectedMonth !== null && (
                    <>
                        <span className="submitted-data-nav-separator">→</span>
                        <span className="submitted-data-nav-item submitted-data-active">
                            📋 {getMonthName(selectedMonth)} {selectedYear} - Entries
                        </span>
                    </>
                )}
            </div>

            <div className="submitted-data-content">
                {/* YEAR SELECTION VIEW */}
                {!selectedYear && (
                    <div className="submitted-data-year-selection-view">
                        <div className="submitted-data-section-header">
                            <h2>📊 Archive Overview</h2>
                            <div className="submitted-data-archive-stats">
                                <div className="submitted-data-stat-item">
                                    <span className="submitted-data-stat-number">{submittedEntries.length}</span>
                                    <span className="submitted-data-stat-label">Total Entries</span>
                                </div>
                                <div className="submitted-data-stat-item">
                                    <span className="submitted-data-stat-number">{availableYears.length}</span>
                                    <span className="submitted-data-stat-label">Years</span>
                                </div>
                            </div>
                        </div>

                        {availableYears.length === 0 ? (
                            <div className="submitted-data-no-data-state">
                                <div className="submitted-data-no-data-icon">📭</div>
                                <h3>No Submitted Data Found</h3>
                                <p>No entries have been submitted to the archive yet.</p>
                                <p className="submitted-data-help-text">
                                    Entries will appear here once they are submitted from the Submission Dashboard.
                                </p>
                            </div>
                        ) : (
                            <div className="submitted-data-years-grid">
                                {availableYears.map(year => {
                                    const yearEntryCount = submittedEntries.filter(entry => {
                                        const submissionDate = entry.submittedToArchiveAt || entry.archivedAt || entry.finalSubmissionAt;
                                        return submissionDate && new Date(submissionDate).getFullYear() === year;
                                    }).length;

                                    console.log(`📅 Year ${year}: ${yearEntryCount} entries`);

                                    return (
                                        <div
                                            key={year}
                                            className="submitted-data-year-card"
                                            onClick={() => handleYearSelect(year)}
                                        >
                                            <div className="submitted-data-year-card-header">
                                                <h3>{year}</h3>
                                                <div className="submitted-data-year-entry-count">
                                                    {yearEntryCount} entries
                                                </div>
                                            </div>
                                            <div className="submitted-data-year-card-footer">
                                                <span>Click to view months →</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* MONTH SELECTION VIEW */}
                {selectedYear && selectedMonth === null && (
                    <div className="submitted-data-month-selection-view">
                        <div className="submitted-data-section-header">
                            <h2>📅 {selectedYear} - Select Month</h2>
                        </div>

                        <div className="submitted-data-months-grid">
                            {availableMonths.map(month => {
                                const monthEntryCount = getMonthEntryCount(selectedYear, month);

                                return (
                                    <div
                                        key={month}
                                        className="submitted-data-month-card"
                                        onClick={() => handleMonthSelect(month)}
                                    >
                                        <div className="submitted-data-month-card-header">
                                            <h3>{getMonthName(month)}</h3>
                                            <div className="submitted-data-month-entry-count">
                                                {monthEntryCount} entries
                                            </div>
                                        </div>
                                        <div className="submitted-data-month-card-footer">
                                            <span>Click to view entries →</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ENTRIES VIEW */}
                {selectedYear && selectedMonth !== null && (
                    <div className="submitted-data-entries-view">
                        <div className="submitted-data-section-header">
                            <h2>📋 {getMonthName(selectedMonth)} {selectedYear} - Submitted Entries</h2>
                            <div className="submitted-data-entries-controls">
                                <div className="submitted-data-search-group">
                                    <input
                                        type="text"
                                        placeholder="Search by QMS ID, archive ID, bid title, sourcer..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="submitted-data-search-input"
                                    />
                                </div>
                                <div className="submitted-data-entries-count">
                                    {filteredEntries.length} entries found
                                </div>
                            </div>
                        </div>

                        {filteredEntries.length === 0 ? (
                            <div className="submitted-data-no-entries-state">
                                <div className="submitted-data-no-entries-icon">📭</div>
                                <h3>No Entries Found</h3>
                                <p>
                                    {searchTerm
                                        ? `No entries match your search "${searchTerm}"`
                                        : `No entries found for ${getMonthName(selectedMonth)} ${selectedYear}`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="submitted-data-entries-table">
                                <div className="submitted-data-table-header">
                                    <div className="submitted-data-header-cell">Entry Info</div>
                                    <div className="submitted-data-header-cell">Submission Details</div>
                                    <div className="submitted-data-header-cell">Vendor Info</div>
                                    <div className="submitted-data-header-cell">Actions</div>
                                </div>

                                {filteredEntries.map(entry => {
                                    const primaryVendor = entry.sourcingData?.vendors?.find(v => v.isPrimary) ||
                                        entry.sourcingData?.vendors?.[0];

                                    // ✅ REVERTED: Back to showing vendor total (not submitted with margin)
                                    const vendorTotal = primaryVendor?.pricing?.finalGrandTotal || 0;
                                    const submittedWithMargin = entry.submissionCalculations?.submittedWithMargin || 0;

                                    return (
                                        <div key={entry.id} className="submitted-data-table-row">
                                            <div className="submitted-data-cell submitted-data-entry-info">
                                                {/* ✅ ENHANCED: Show both QMS ID and Archive ID */}
                                                <div className="submitted-data-entry-ids">
                                                    <div className="submitted-data-qms-id">QMS: {entry.id}</div>
                                                    <div className="submitted-data-archive-id">Archive: {entry.archiveId || entry.id}</div>
                                                </div>
                                                <div className="submitted-data-bid-title">{entry.bidTitle || 'N/A'}</div>
                                                <div className="submitted-data-bid-details">
                                                    <span>#{entry.bidNumber}</span>
                                                    <span>{entry.portalName}</span>
                                                </div>
                                                <div className="submitted-data-sourcer-info">👤 {entry.sourcerName || entry.hunterName || 'N/A'}</div>
                                            </div>

                                            <div className="submitted-data-cell submitted-data-submission-details">
                                                <div className="submitted-data-submission-date">
                                                    📅 {entry.submittedToArchiveAt || entry.archivedAt || 'N/A'}
                                                </div>
                                                <div className="submitted-data-submission-by">
                                                    👤 {entry.submittedToArchiveBy || entry.archivedBy || 'N/A'}
                                                </div>
                                                <div className="submitted-data-submission-status">
                                                    <span className="submitted-data-status-badge submitted-data-submitted">✅ Submitted</span>
                                                </div>
                                                {/* ✅ Show final submission amount if available */}
                                                {submittedWithMargin > 0 && (
                                                    <div className="submitted-data-final-amount">
                                                        Final: ${submittedWithMargin.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="submitted-data-cell submitted-data-vendor-info">
                                                {primaryVendor ? (
                                                    <>
                                                        <div className="submitted-data-vendor-name">{primaryVendor.sourcingInfo?.vendorName || 'Unknown'}</div>
                                                        {/* ✅ REVERTED: Show vendor total (original behavior) */}
                                                        <div className="submitted-data-vendor-value">${vendorTotal.toFixed(2)}</div>
                                                        <div className="submitted-data-vendor-details">
                                                            <span>{entry.sourcingData?.vendors?.length || 0} vendor(s)</span>
                                                            <span>{primaryVendor.sourcingInfo?.attachments?.length || 0} files</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="submitted-data-no-vendor-data">No Vendor Data</div>
                                                )}
                                            </div>

                                            <div className="submitted-data-cell submitted-data-actions">
                                                <button
                                                    className="submitted-data-btn-view-entry"
                                                    onClick={() => handleViewEntry(entry)}
                                                    title="View Complete Entry Details"
                                                >
                                                    👁️ View
                                                </button>

                                                {hasEditAccess && (
                                                    <button
                                                        className="submitted-data-btn-edit-entry"
                                                        onClick={() => handleEditEntry(entry)}
                                                        title="Edit Entry"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                )}

                                                {isAdmin && (
                                                    <button
                                                        className="submitted-data-btn-delete-entry"
                                                        onClick={() => handleDeleteEntry(entry)}
                                                        title="Delete Entry"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmittedData;