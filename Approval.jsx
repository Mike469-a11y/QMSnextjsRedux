import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import IndexedDBManager from '../../utils/IndexedDBManager'; // ✅ PDF FIX: Import IndexedDB manager
import './../../styles/Approval.css';

// ✅ FIXED: Move RejectionModal OUTSIDE the main component to prevent recreation
const RejectionModal = memo(({
    show,
    reason,
    onReasonChange,
    onSubmit,
    onCancel,
    isSubmitting
}) => {
    if (!show) return null;

    return (
        <div className="rejection-modal-overlay">
            <div className="rejection-modal">
                <div className="rejection-modal-header">
                    <h3>❌ Rejection Reason Required</h3>
                    <button
                        className="modal-close-btn"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        ×
                    </button>
                </div>

                <div className="rejection-modal-body">
                    <p>Please provide a reason for rejecting this sourcing request:</p>
                    <p className="rejection-note">
                        <strong>Note:</strong> This reason will be visible to the sourcer in the Sourcing page and Sourcing Details.
                    </p>

                    <textarea
                        className="rejection-reason-input"
                        placeholder="Enter detailed reason for rejection..."
                        value={reason}
                        onChange={onReasonChange}
                        rows={4}
                        maxLength={500}
                        autoFocus
                        disabled={isSubmitting}
                    />

                    <div className={`character-count ${reason.length > 450 ? 'warning' : ''} ${reason.length >= 500 ? 'danger' : ''}`}>
                        {reason.length}/500 characters
                    </div>
                </div>

                <div className="rejection-modal-footer">
                    <button
                        className="btn-cancel-rejection"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-submit-rejection"
                        onClick={onSubmit}
                        disabled={!reason.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Rejection'}
                    </button>
                </div>
            </div>
        </div>
    );
});

// ✅ NEW: Approval Remarks Modal Component
const ApprovalRemarksModal = memo(({
    show,
    remarks,
    onRemarksChange,
    onSubmit,
    onCancel,
    isSubmitting,
    entryData
}) => {
    if (!show) return null;

    return (
        <div className="rejection-modal-overlay">
            <div className="rejection-modal">
                <div className="rejection-modal-header">
                    <h3>✅ Approval Remarks</h3>
                    <button
                        className="modal-close-btn"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        ×
                    </button>
                </div>

                <div className="rejection-modal-body">
                    <p>Please provide remarks for approving this entry:</p>
                    <div className="entry-info">
                        <p><strong>Entry ID:</strong> {entryData?.id}</p>
                        <p><strong>Bid Title:</strong> {entryData?.bidTitle}</p>
                    </div>

                    <textarea
                        className="rejection-reason-input"
                        placeholder="Enter your approval remarks and comments here..."
                        value={remarks}
                        onChange={onRemarksChange}
                        rows={4}
                        maxLength={500}
                        autoFocus
                        disabled={isSubmitting}
                    />

                    <div className={`character-count ${remarks.length > 450 ? 'warning' : ''} ${remarks.length >= 500 ? 'danger' : ''}`}>
                        {remarks.length}/500 characters
                    </div>
                </div>

                <div className="rejection-modal-footer">
                    <button
                        className="btn-cancel-rejection"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-submit-approval"
                        onClick={onSubmit}
                        disabled={!remarks.trim() || isSubmitting}
                        style={{
                            background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
                            color: 'white'
                        }}
                    >
                        {isSubmitting ? 'Approving...' : '✅ Approve with Remarks'}
                    </button>
                </div>
            </div>
        </div>
    );
});

const Approval = () => {
    const navigate = useNavigate();
    const { reviewId } = useParams();
    const [approvalEntries, setApprovalEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showReviewPage, setShowReviewPage] = useState(false);
    const [reviewData, setReviewData] = useState(null);

    // ✅ NEW: Vendor carousel state
    const [currentVendorIndex, setCurrentVendorIndex] = useState(0);

    // ✅ FIXED: Floating vendor navigation state - better behavior
    const [showFloatingNav, setShowFloatingNav] = useState(false);
    const [scrollTimeout, setScrollTimeout] = useState(null);
    const [isScrolling, setIsScrolling] = useState(false);

    // ✅ FIXED: Simplified rejection modal state
    const [rejectionModal, setRejectionModal] = useState({
        show: false,
        reason: '',
        entryId: null,
        isSubmitting: false
    });

    // ✅ NEW: Approval remarks modal state
    const [approvalRemarksModal, setApprovalRemarksModal] = useState({
        show: false,
        remarks: '',
        entryData: null,
        isSubmitting: false
    });

    // ✅ UPDATED: Current date time and user
    const currentDateTime = '2025-08-01 16:32:01';
    const currentUser = 'Mike469-a11y';

    // ✅ PDF FIX: Initialize IndexedDB on component mount
    useEffect(() => {
        IndexedDBManager.initDB().catch(error => {
            console.error('Failed to initialize IndexedDB:', error);
        });
    }, []);

    // ✅ FIX: Reset review state when navigating back to approval dashboard from sidebar
    useEffect(() => {
        // If we're back on the main approval path (not review), reset review state
        if (window.location.pathname === '/approval' && showReviewPage) {
            setShowReviewPage(false);
            setReviewData(null);
            setCurrentVendorIndex(0);
            setShowFloatingNav(false);
            setIsScrolling(false);
        }
    }, [window.location.pathname, showReviewPage]);

    // ✅ FIXED: Handle scroll for floating navigation - better behavior
    useEffect(() => {
        const handleScroll = () => {
            if (showReviewPage && reviewData?.sourcingData?.vendors?.length > 1) {
                // Set scrolling state
                setIsScrolling(true);
                setShowFloatingNav(false);

                // Clear existing timeout
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }

                // Set new timeout to show nav after scrolling stops
                const newTimeout = setTimeout(() => {
                    setIsScrolling(false);
                    setShowFloatingNav(true);
                }, 1500); // Show after 1.5 seconds of no scrolling

                setScrollTimeout(newTimeout);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
        };
    }, [showReviewPage, reviewData, scrollTimeout]);

    // ✅ FIXED: Handle navigation to approval dashboard from anywhere
    useEffect(() => {
        const handleApprovalNavigation = () => {
            // Check if we're not already on approval dashboard
            if (window.location.pathname.includes('/approval/review/')) {
                return; // Stay on review page
            }

            // If we're on approval path but not dashboard, go to dashboard
            if (window.location.pathname === '/approval' && showReviewPage) {
                handleBackToApproval();
            }
        };

        // Listen for popstate (browser back/forward)
        window.addEventListener('popstate', handleApprovalNavigation);
        return () => window.removeEventListener('popstate', handleApprovalNavigation);
    }, [showReviewPage]);

    useEffect(() => {
        loadApprovalEntries();

        // Check if we have a reviewId in URL params
        if (reviewId) {
            handleReviewEntry(reviewId);
        }
    }, [reviewId]);

    // ✅ NEW: Keyboard navigation for vendor carousel
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (showReviewPage && reviewData?.sourcingData?.vendors) {
                const vendorCount = reviewData.sourcingData.vendors.length;
                if (e.key === 'ArrowLeft' && currentVendorIndex > 0) {
                    setCurrentVendorIndex(prev => prev - 1);
                } else if (e.key === 'ArrowRight' && currentVendorIndex < vendorCount - 1) {
                    setCurrentVendorIndex(prev => prev + 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showReviewPage, reviewData, currentVendorIndex]);

    // ✅ CHANGE 1: Updated loadApprovalEntries to filter out hidden entries
    const loadApprovalEntries = () => {
        try {
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                // Filter entries that are ready for approval AND not hidden from approval
                const approvalReadyEntries = entries.filter(entry =>
                    entry.sourcingCompleted &&
                    (entry.status === 'approval_pending' ||
                        entry.status === 'approval_approved' ||
                        entry.status === 'approval_rejected') &&
                    !entry.hiddenFromApproval // ✅ NEW: Filter out hidden entries
                );
                setApprovalEntries(approvalReadyEntries);
            }
        } catch (error) {
            console.error('Error loading approval entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = useMemo(() => {
        return approvalEntries.filter(entry => {
            const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
            const matchesSearch = entry.bidTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.bidNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.portalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.sourcerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.hunterName?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [approvalEntries, filterStatus, searchTerm]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            'approval_pending': { label: 'Pending Review', class: 'status-pending', icon: '⏳' },
            'approval_approved': { label: 'Approved', class: 'status-approved', icon: '✅' },
            'approval_rejected': { label: 'Rejected', class: 'status-rejected', icon: '❌' }
        };
        const config = statusConfig[status] || statusConfig['approval_pending'];
        return (
            <span className={`status-badge ${config.class}`}>
                {config.icon} {config.label}
            </span>
        );
    };

    const getPrimaryVendorInfo = (entry) => {
        if (!entry.sourcingData?.vendors) return null;
        const primaryVendor = entry.sourcingData.vendors.find(v => v.isPrimary) || entry.sourcingData.vendors[0];
        return primaryVendor;
    };

    const calculateTotalValue = (vendor) => {
        if (!vendor?.pricing) return 0;
        return vendor.pricing.finalGrandTotal || vendor.pricing.grandTotal || 0;
    };

    // ✅ FIXED: Vendor carousel navigation functions - don't hide floating nav on click
    const handlePreviousVendor = () => {
        setCurrentVendorIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextVendor = () => {
        if (reviewData?.sourcingData?.vendors) {
            const maxIndex = reviewData.sourcingData.vendors.length - 1;
            setCurrentVendorIndex(prev => Math.min(maxIndex, prev + 1));
        }
    };

    const handleVendorIndicatorClick = (index) => {
        setCurrentVendorIndex(index);
    };

    // ✅ PDF FIX: File download functionality - properly access IndexedDB files
    const handleFileDownload = async (attachment, vendorName) => {
        try {
            console.log('📥 Downloading attachment:', attachment);

            let downloadUrl = '';
            let fileName = attachment.name || `${vendorName}_attachment`;

            // ✅ PDF FIX: Check if attachment is an ID (string) that needs to be fetched from IndexedDB
            if (typeof attachment === 'string') {
                console.log('📄 Fetching file from IndexedDB with ID:', attachment);
                const fileData = await IndexedDBManager.getAttachment(attachment);
                if (fileData && fileData.file) {
                    downloadUrl = URL.createObjectURL(fileData.file);
                    fileName = fileData.name || fileName;
                    console.log('✅ Retrieved file from IndexedDB');
                } else {
                    throw new Error('File not found in IndexedDB');
                }
            }
            // ✅ Handle File object directly
            else if (attachment.file && attachment.file instanceof File) {
                downloadUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.file.name || fileName;
                console.log('📄 Using File object for download');
            }
            // ✅ Handle attachment object with file property
            else if (attachment.file) {
                downloadUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.name || fileName;
                console.log('📄 Using attachment file property');
            }
            // ✅ Handle base64 data
            else if (attachment.data) {
                let blobData;
                let mimeType = attachment.type || 'application/octet-stream';

                if (typeof attachment.data === 'string') {
                    try {
                        const base64Data = attachment.data.includes(',') ?
                            attachment.data.split(',')[1] : attachment.data;
                        blobData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        console.log('📄 Converting base64 to blob');
                    } catch (e) {
                        blobData = attachment.data;
                        mimeType = 'text/plain';
                        console.log('📄 Using text data');
                    }
                } else {
                    blobData = attachment.data;
                    console.log('📄 Using binary data');
                }

                const blob = new Blob([blobData], { type: mimeType });
                downloadUrl = URL.createObjectURL(blob);
            }
            // ✅ Handle URL
            else if (attachment.url) {
                downloadUrl = attachment.url;
                console.log('📄 Using URL for download');
            }
            else {
                throw new Error('No valid file data found');
            }

            // Create download link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up URL if created
            if (downloadUrl.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            }

            console.log(`✅ Downloaded: ${fileName} from ${vendorName}`);
            alert(`📥 Downloaded: ${fileName}`);
        } catch (error) {
            console.error('❌ Error downloading file:', error);
            alert(`❌ Error downloading file: ${attachment.name || 'Unknown'}\n\nError: ${error.message}\n\nPlease ensure the file was uploaded correctly in SourcingDetails.`);
        }
    };

    // ✅ PDF FIX: File preview functionality - properly access IndexedDB files
    const handleFilePreview = async (attachment, vendorName) => {
        try {
            console.log('👁️ Previewing attachment:', attachment);

            let previewUrl = '';
            let fileName = attachment.name || `${vendorName}_attachment`;

            // ✅ PDF FIX: Check if attachment is an ID (string) that needs to be fetched from IndexedDB
            if (typeof attachment === 'string') {
                console.log('📄 Fetching file from IndexedDB with ID:', attachment);
                const fileData = await IndexedDBManager.getAttachment(attachment);
                if (fileData && fileData.file) {
                    previewUrl = URL.createObjectURL(fileData.file);
                    fileName = fileData.name || fileName;
                    console.log('✅ Retrieved file from IndexedDB for preview');
                } else {
                    throw new Error('File not found in IndexedDB');
                }
            }
            // ✅ Handle File object directly
            else if (attachment.file && attachment.file instanceof File) {
                previewUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.file.name || fileName;
                console.log('📄 Using File object for preview');
            }
            // ✅ Handle attachment object with file property
            else if (attachment.file) {
                previewUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.name || fileName;
                console.log('📄 Using attachment file property');
            }
            // ✅ Handle base64 data
            else if (attachment.data) {
                let blobData;
                let mimeType = attachment.type || 'application/pdf';

                if (typeof attachment.data === 'string') {
                    try {
                        const base64Data = attachment.data.includes(',') ?
                            attachment.data.split(',')[1] : attachment.data;
                        blobData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        console.log('📄 Converting base64 to blob for preview');
                    } catch (e) {
                        blobData = attachment.data;
                        mimeType = 'text/plain';
                        console.log('📄 Using text data for preview');
                    }
                } else {
                    blobData = attachment.data;
                    console.log('📄 Using binary data for preview');
                }

                const blob = new Blob([blobData], { type: mimeType });
                previewUrl = URL.createObjectURL(blob);
            }
            // ✅ Handle URL
            else if (attachment.url) {
                previewUrl = attachment.url;
                console.log('📄 Using URL for preview');
            }
            else {
                throw new Error('No valid file data found');
            }

            // Open preview in new window/tab
            const previewWindow = window.open(previewUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
            if (!previewWindow) {
                alert('❌ Preview blocked by browser popup blocker.\n\nPlease:\n1. Allow popups for this site\n2. Try again\n\nAlternatively, download the file to view it.');
            } else {
                console.log(`✅ Previewing: ${fileName} from ${vendorName}`);
                previewWindow.document.title = `Preview: ${fileName}`;
            }

            // Clean up URL after some time
            if (previewUrl.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(previewUrl), 60000); // 1 minute
            }
        } catch (error) {
            console.error('❌ Error previewing file:', error);
            alert(`❌ Error previewing file: ${attachment.name || 'Unknown'}\n\nError: ${error.message}\n\nTry downloading the file instead, or check if it was uploaded correctly in SourcingDetails.`);
        }
    };

    // ✅ Handle Download All Files for Vendor
    const handleDownloadAllFiles = async (vendor, vendorIndex) => {
        if (!vendor.sourcingInfo?.attachments || vendor.sourcingInfo.attachments.length === 0) {
            alert('📭 No attachments found for this vendor.');
            return;
        }

        const vendorName = vendor.sourcingInfo?.vendorName || `Vendor_${vendorIndex + 1}`;

        try {
            // Download each file with delay
            for (let i = 0; i < vendor.sourcingInfo.attachments.length; i++) {
                const attachment = vendor.sourcingInfo.attachments[i];
                setTimeout(async () => {
                    await handleFileDownload(attachment, vendorName);
                }, i * 1000); // 1 second delay between downloads
            }

            alert(`📥 Downloading ${vendor.sourcingInfo.attachments.length} files from ${vendorName}...\n\nFiles will download with 1 second intervals to prevent browser blocking.`);
        } catch (error) {
            console.error('❌ Error downloading all files:', error);
            alert(`❌ Error downloading files from ${vendorName}: ${error.message}`);
        }
    };

    // ✅ Handle Review Entry - Show New Page
    const handleReviewEntry = async (entryId) => {
        try {
            setLoading(true);
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const entry = entries.find(e => e.id === entryId);

                if (entry) {
                    setReviewData(entry);
                    setShowReviewPage(true);
                    setCurrentVendorIndex(0); // ✅ Reset to first vendor
                    setShowFloatingNav(false); // ✅ Reset floating nav
                    setIsScrolling(false);
                    // Update URL without navigation
                    window.history.pushState({}, '', `/approval/review/${entryId}`);
                }
            }
        } catch (error) {
            console.error('Error loading review data:', error);
            alert('❌ Error loading review data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Back to Approval List - proper navigation
    const handleBackToApproval = () => {
        setShowReviewPage(false);
        setReviewData(null);
        setCurrentVendorIndex(0); // ✅ Reset vendor index
        setShowFloatingNav(false); // ✅ Reset floating nav
        setIsScrolling(false);

        // ✅ FIXED: Proper navigation to approval dashboard
        navigate('/approval');
    };

    // ✅ CHANGE 1: NEW Delete function for approval entries only
    const handleDeleteFromApproval = useCallback(async (entryId) => {
        if (window.confirm(`Are you sure you want to delete entry ${entryId} from Approval Dashboard?\n\nNote: This will NOT affect the Sourcing section.`)) {
            try {
                const stored = localStorage.getItem("sourcingEntries");
                if (stored) {
                    const entries = JSON.parse(stored);
                    const updatedEntries = entries.map(entry => {
                        if (entry.id === entryId) {
                            return {
                                ...entry,
                                hiddenFromApproval: true, // ✅ Just hide from approval view
                                hiddenFromApprovalAt: currentDateTime,
                                hiddenFromApprovalBy: currentUser
                            };
                        }
                        return entry;
                    });
                    localStorage.setItem("sourcingEntries", JSON.stringify(updatedEntries));
                    loadApprovalEntries(); // Reload to remove hidden entry
                    alert(`✅ Entry ${entryId} removed from Approval Dashboard.\n\n📋 Entry remains available in Sourcing section.`);
                }
            } catch (error) {
                console.error('Error hiding entry from approval:', error);
                alert('❌ Error removing entry. Please try again.');
            }
        }
    }, [currentDateTime, currentUser]);

    // ✅ NEW: Handle Submit to Submission WITH APPROVAL REMARKS
    const handleSubmitToSubmission = useCallback(async (entry) => {
        // Show approval remarks modal instead of direct confirmation
        setApprovalRemarksModal({
            show: true,
            remarks: '',
            entryData: entry,
            isSubmitting: false
        });
    }, []);

    // ✅ NEW: Handle approval remarks submit
    const handleApprovalRemarksSubmit = useCallback(async () => {
        if (!approvalRemarksModal.remarks.trim()) {
            alert('❌ Please provide approval remarks.');
            return;
        }

        setApprovalRemarksModal(prev => ({ ...prev, isSubmitting: true }));

        try {
            const entryId = approvalRemarksModal.entryData.id;
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const entryToSubmit = entries.find(e => e.id === entryId);

                if (entryToSubmit) {
                    // Update entry with approval remarks
                    const updatedEntries = entries.map(entry => {
                        if (entry.id === entryId) {
                            return {
                                ...entry,
                                status: 'approval_approved',
                                approvalAction: 'approve',
                                approvedBy: currentUser,
                                approvedAt: currentDateTime,
                                approvalRemarks: approvalRemarksModal.remarks.trim(),
                                approvalComments: `Approved by ${currentUser}: ${approvalRemarksModal.remarks.trim()}`,
                                lastActionBy: currentUser,
                                lastActionAt: currentDateTime,
                                lastAction: 'approved_from_approval'
                            };
                        }
                        return entry;
                    });

                    localStorage.setItem("sourcingEntries", JSON.stringify(updatedEntries));

                    // Get existing submission entries
                    const submissionStored = localStorage.getItem("submissionEntries");
                    let submissionEntries = submissionStored ? JSON.parse(submissionStored) : [];

                    // Check if already submitted
                    const alreadySubmitted = submissionEntries.find(e => e.id === entryId);
                    if (alreadySubmitted) {
                        // Update existing submission entry with approval remarks
                        const updatedSubmissionEntries = submissionEntries.map(e => {
                            if (e.id === entryId) {
                                return {
                                    ...e,
                                    ...updatedEntries.find(ue => ue.id === entryId),
                                    submissionStatus: 'pending_submission'
                                };
                            }
                            return e;
                        });
                        localStorage.setItem("submissionEntries", JSON.stringify(updatedSubmissionEntries));
                    } else {
                        // Create submission entry with approval remarks
                        const submissionEntry = {
                            ...updatedEntries.find(ue => ue.id === entryId),
                            submittedToSubmission: true,
                            submittedAt: currentDateTime,
                            submittedBy: currentUser,
                            submissionStatus: 'pending_submission',
                            originalApprovalStatus: 'approval_approved',
                            submissionId: `SUB-${entryId}`,
                            lastSubmissionAction: 'submitted_from_approval'
                        };

                        submissionEntries.push(submissionEntry);
                        localStorage.setItem("submissionEntries", JSON.stringify(submissionEntries));
                    }

                    // Update local state
                    loadApprovalEntries();

                    // If we're on review page, update the review data
                    if (showReviewPage && reviewData && reviewData.id === entryId) {
                        const updatedEntry = updatedEntries.find(e => e.id === entryId);
                        setReviewData(updatedEntry);
                    }

                    alert(`✅ Entry ${entryId} approved with remarks and submitted to Submission Dashboard!\n\n📋 You can now find it in the Submission section for final processing.`);
                }
            }
        } catch (error) {
            console.error('Error submitting to submission:', error);
            alert('❌ Error submitting entry. Please try again.');
        } finally {
            setApprovalRemarksModal({
                show: false,
                remarks: '',
                entryData: null,
                isSubmitting: false
            });
        }
    }, [approvalRemarksModal.remarks, approvalRemarksModal.entryData, currentDateTime, currentUser, showReviewPage, reviewData, loadApprovalEntries]);

    // ✅ NEW: Handle approval remarks cancel
    const handleApprovalRemarksCancel = useCallback(() => {
        setApprovalRemarksModal({
            show: false,
            remarks: '',
            entryData: null,
            isSubmitting: false
        });
    }, []);

    // ✅ NEW: Handle approval remarks change
    const handleApprovalRemarksChange = useCallback((e) => {
        const newRemarks = e.target.value;
        setApprovalRemarksModal(prev => ({
            ...prev,
            remarks: newRemarks
        }));
    }, []);

    // ✅ FIXED: Optimized rejection handlers
    const handleRejectClick = useCallback((entryId, location = 'table') => {
        setRejectionModal({
            show: true,
            reason: '',
            entryId,
            isSubmitting: false
        });
    }, []);

    // ✅ FIXED: Stable reason change handler
    const handleRejectionReasonChange = useCallback((e) => {
        const newReason = e.target.value;
        setRejectionModal(prev => ({
            ...prev,
            reason: newReason
        }));
    }, []);

    // ✅ UPDATED: Submit rejection handler - STAYS on approval dashboard and sends message to sourcing
    const handleSubmitRejection = useCallback(async () => {
        if (!rejectionModal.reason.trim()) {
            alert('❌ Please provide a reason for rejection.');
            return;
        }

        // Set submitting state
        setRejectionModal(prev => ({ ...prev, isSubmitting: true }));

        try {
            const stored = localStorage.getItem("sourcingEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const updatedEntries = entries.map(entry => {
                    if (entry.id === rejectionModal.entryId) {
                        return {
                            ...entry,
                            // ✅ UPDATED: Enhanced rejection data for sourcing section
                            status: 'approval_rejected',
                            approvalAction: 'reject',
                            approvedBy: currentUser,
                            approvedAt: currentDateTime,
                            rejectionReason: rejectionModal.reason.trim(),
                            approvalComments: `Rejected by ${currentUser}: ${rejectionModal.reason.trim()}`,
                            // ✅ NEW: Additional fields for sourcing section visibility
                            rejectedBy: currentUser,
                            rejectedAt: currentDateTime,
                            rejectionDetails: {
                                reason: rejectionModal.reason.trim(),
                                rejectedBy: currentUser,
                                rejectedAt: currentDateTime,
                                fromSection: 'approval',
                                needsRevision: true
                            },
                            // ✅ NEW: Mark as needing sourcing attention
                            sourcingStatus: 'needs_revision',
                            needsRevision: true,
                            revisionRequired: true,
                            lastActionBy: currentUser,
                            lastActionAt: currentDateTime,
                            lastAction: 'rejected_from_approval',
                            // ✅ NEW: Reset acknowledgment when rejecting
                            rejectionAcknowledged: false,
                            rejectionAcknowledgedBy: null,
                            rejectionAcknowledgedAt: null,
                            rejectionViewed: false
                        };
                    }
                    return entry;
                });

                localStorage.setItem("sourcingEntries", JSON.stringify(updatedEntries));

                // Update local state
                loadApprovalEntries();

                // If we're on review page, update the review data
                if (showReviewPage && reviewData && reviewData.id === rejectionModal.entryId) {
                    const updatedEntry = updatedEntries.find(e => e.id === rejectionModal.entryId);
                    setReviewData(updatedEntry);
                }

                // Close modal
                setRejectionModal({
                    show: false,
                    reason: '',
                    entryId: null,
                    isSubmitting: false
                });

                // ✅ UPDATED: Show success message and STAY on approval dashboard
                alert(`✅ Entry rejected successfully!\n\n` +
                    `Reason: ${rejectionModal.reason.trim()}\n\n` +
                    `✨ The rejection has been sent to the Sourcing section for revision.\n` +
                    `✨ The sourcer will see this rejection message in Sourcing Details.`);
            }
        } catch (error) {
            console.error('Error rejecting entry:', error);
            alert('❌ Error rejecting entry. Please try again.');
        } finally {
            // Reset submitting state
            setRejectionModal(prev => ({ ...prev, isSubmitting: false }));
        }
    }, [rejectionModal.reason, rejectionModal.entryId, currentUser, currentDateTime, showReviewPage, reviewData, loadApprovalEntries]);

    // ✅ FIXED: Cancel rejection handler
    const handleCancelRejection = useCallback(() => {
        setRejectionModal({
            show: false,
            reason: '',
            entryId: null,
            isSubmitting: false
        });
    }, []);

    // ✅ UPDATED: Quick Approve to use approval remarks
    const handleQuickApprove = async (entryId) => {
        const entry = approvalEntries.find(e => e.id === entryId);
        if (entry) {
            handleSubmitToSubmission(entry);
        }
    };

    if (loading) {
        return (
            <div className="approval-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading approval entries...</p>
                </div>
            </div>
        );
    }

    // ✅ Review Page View with Vendor Carousel
    if (showReviewPage && reviewData) {
        const vendors = reviewData.sourcingData?.vendors || [];
        const currentVendor = vendors[currentVendorIndex];
        const vendorCount = vendors.length;

        return (
            <div className="approval-container">
                {/* Rejection Modal */}
                <RejectionModal
                    show={rejectionModal.show}
                    reason={rejectionModal.reason}
                    onReasonChange={handleRejectionReasonChange}
                    onSubmit={handleSubmitRejection}
                    onCancel={handleCancelRejection}
                    isSubmitting={rejectionModal.isSubmitting}
                />

                {/* ✅ NEW: Approval Remarks Modal */}
                <ApprovalRemarksModal
                    show={approvalRemarksModal.show}
                    remarks={approvalRemarksModal.remarks}
                    onRemarksChange={handleApprovalRemarksChange}
                    onSubmit={handleApprovalRemarksSubmit}
                    onCancel={handleApprovalRemarksCancel}
                    isSubmitting={approvalRemarksModal.isSubmitting}
                    entryData={approvalRemarksModal.entryData}
                />

                {/* ✅ FIXED: Floating Vendor Navigation - better positioning and behavior */}
                {showFloatingNav && vendorCount > 1 && !isScrolling && (
                    <div className="floating-vendor-nav">
                        <button
                            className="floating-nav-btn floating-prev"
                            onClick={handlePreviousVendor}
                            disabled={currentVendorIndex === 0}
                            title="Previous Vendor"
                        >
                            ← Prev
                        </button>
                        <div className="floating-nav-info">
                            {currentVendorIndex + 1} of {vendorCount}
                        </div>
                        <button
                            className="floating-nav-btn floating-next"
                            onClick={handleNextVendor}
                            disabled={currentVendorIndex === vendorCount - 1}
                            title="Next Vendor"
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* Review Page Header */}
                <div className="review-page-header">
                    <div className="header-left">
                        <h1>📋 Sourcing Review - {reviewData.id}</h1>
                        <p>Complete sourcing details and vendor comparison</p>
                    </div>
                    <div className="header-right">
                        <div className="user-info">
                            <span>Current User: <strong>{currentUser}</strong></span>
                            <span className="current-time">{currentDateTime}</span>
                        </div>
                    </div>
                </div>

                <div className="review-page-content">
                    {/* ✅ FIXED: COMPACT QMS INFORMATION SECTION */}
                    <div className="review-section qms-section-compact">
                        <div className="section-header">
                            <div className="section-icon">📋</div>
                            <h3>Original QMS Information</h3>
                        </div>

                        <div className="qms-compact-grid">
                            <div className="qms-compact-item">
                                <span className="qms-label">Entry ID:</span>
                                <span className="qms-value">{reviewData.id}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Sourcer:</span>
                                <span className="qms-value">{reviewData.sourcerName || reviewData.hunterName || 'Not Assigned'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Bid Title:</span>
                                <span className="qms-value">{reviewData.bidTitle || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Portal:</span>
                                <span className="qms-value">{reviewData.portalName || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Bid Number:</span>
                                <span className="qms-value">{reviewData.bidNumber || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Category:</span>
                                <span className="qms-value">{reviewData.category || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Quantity:</span>
                                <span className="qms-value">{reviewData.quantity || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Due Date:</span>
                                <span className="qms-value">{reviewData.dueDate || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Created:</span>
                                <span className="qms-value">{reviewData.dateCreated || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Assigned By:</span>
                                <span className="qms-value">{reviewData.assignedBy || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Contact:</span>
                                <span className="qms-value">{reviewData.contactName || 'N/A'}</span>
                            </div>
                            <div className="qms-compact-item">
                                <span className="qms-label">Email:</span>
                                <span className="qms-value">{reviewData.email || 'N/A'}</span>
                            </div>
                            {(reviewData.sourcingRemarks || reviewData.huntingRemarks) && (
                                <div className="qms-compact-item qms-full-width">
                                    <span className="qms-label">Remarks:</span>
                                    <span className="qms-value">{reviewData.sourcingRemarks || reviewData.huntingRemarks}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ NEW: VENDOR CAROUSEL SECTION */}
                    {vendors.length > 0 && (
                        <div className="review-section vendor-carousel-section">
                            <div className="section-header">
                                <div className="section-icon">🏢</div>
                                <h3>Vendor Details ({vendorCount} Vendor{vendorCount > 1 ? 's' : ''})</h3>
                            </div>

                            {/* ✅ Vendor Carousel Container */}
                            <div className="vendor-carousel-container">
                                {/* ✅ Carousel Header with Navigation */}
                                <div className="carousel-header">
                                    <button
                                        className="carousel-nav-btn carousel-prev"
                                        onClick={handlePreviousVendor}
                                        disabled={currentVendorIndex === 0}
                                        title="Previous Vendor (← Arrow Key)"
                                    >
                                        ← Previous
                                    </button>

                                    <div className="carousel-title">
                                        <h4>
                                            Vendor {currentVendorIndex + 1} of {vendorCount}
                                            {currentVendor?.isPrimary && <span className="primary-badge">⭐ PRIMARY</span>}
                                        </h4>
                                        <div className="vendor-name-display">
                                            {currentVendor?.sourcingInfo?.vendorName || currentVendor?.vendorName || 'Unknown Vendor'}
                                        </div>
                                    </div>

                                    <button
                                        className="carousel-nav-btn carousel-next"
                                        onClick={handleNextVendor}
                                        disabled={currentVendorIndex === vendorCount - 1}
                                        title="Next Vendor (→ Arrow Key)"
                                    >
                                        Next →
                                    </button>
                                </div>

                                {/* ✅ Vendor Indicators */}
                                <div className="carousel-indicators">
                                    {vendors.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`carousel-indicator ${index === currentVendorIndex ? 'active' : ''}`}
                                            onClick={() => handleVendorIndicatorClick(index)}
                                            title={`Go to Vendor ${index + 1}`}
                                        >
                                            {index === currentVendorIndex ? '●' : '○'}
                                        </button>
                                    ))}
                                </div>

                                {/* ✅ Current Vendor Details */}
                                {currentVendor && (
                                    <div className="carousel-vendor-content">
                                        {/* ✅ SOURCING INFORMATION SECTION (WITHOUT ATTACHMENTS AND REMARKS) */}
                                        <div className="sourcing-info-card">
                                            <h5>📋 Sourcing Information</h5>
                                            <div className="sourcing-fields-list">
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Vendor Name:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.vendorName || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Quoted Cost:</span>
                                                    <span className="field-value-compact cost-value">${currentVendor.sourcingInfo?.productServiceQuotedCost || '0.00'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Website:</span>
                                                    <span className="field-value-compact website-link">{currentVendor.sourcingInfo?.vendorWebsite || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact full-width-compact">
                                                    <span className="field-label-compact">Vendor Address:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.vendorAddress || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Proper Quotation:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.properQuotationGiven || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Proper Quotation (Vendor):</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.properQuotationGivenNew || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Risk Assessment:</span>
                                                    <span className={`field-value-compact risk-indicator risk-${currentVendor.sourcingInfo?.riskAssessment?.toLowerCase()?.replace(' ', '-')}`}>
                                                        {currentVendor.sourcingInfo?.riskAssessment || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Compliance:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.compliance || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">CC Accepted:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.ccAccepted || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">NET Terms:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.netTermsAvailable || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">CC Charges:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.ccCharges || 'N/A'}%</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Specs Sheet Taken:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.specsSheetTaken || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Lead Time:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.leadTimeOffered || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Stock Available:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.stockAvailable || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Quote Receiving Date:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.quoteReceivingDate || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Quote Valid Till:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.quoteValidTill || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Remaining Days:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.remainingDays || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Item Same/Alternative:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.itemSameAlternative || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Warranty:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.warrantyPeriod || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">After Sales Support:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.afterSalesSupport || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Support Period:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.supportPeriod || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact full-width-compact">
                                                    <span className="field-label-compact">Warranty/Support Terms:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.warrantySupportTerms || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Shipping Cost:</span>
                                                    <span className="field-value-compact cost-value">${currentVendor.sourcingInfo?.estimatedShippingCost || '0.00'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Applicable Taxes:</span>
                                                    <span className="field-value-compact">{currentVendor.sourcingInfo?.applicableTaxes || 'N/A'}</span>
                                                </div>
                                                <div className="sourcing-field-compact">
                                                    <span className="field-label-compact">Restocking Fees:</span>
                                                    <span className="field-value-compact">
                                                        {currentVendor.sourcingInfo?.restockingFees || 'N/A'}
                                                        {currentVendor.sourcingInfo?.restockingFees === 'Yes' && currentVendor.sourcingInfo?.restockingFeesPercentage &&
                                                            ` (${currentVendor.sourcingInfo.restockingFeesPercentage}%)`
                                                        }
                                                    </span>
                                                </div>
                                                {/* ✅ CHANGE 2: REMOVED REMARKS FROM HERE - will be moved after final total */}
                                            </div>
                                        </div>

                                        {/* ✅ PRICING SECTION */}
                                        <div className="pricing-card">
                                            <h5>💰 Pricing & Line Items</h5>

                                            {/* Line Items Compact */}
                                            {currentVendor.pricing?.lineItems && currentVendor.pricing.lineItems.length > 0 && (
                                                <div className="line-items-compact">
                                                    <h6>Line Items</h6>
                                                    <div className="line-items-list">
                                                        {currentVendor.pricing.lineItems.map((item, itemIndex) => (
                                                            <div key={item.id || itemIndex} className="line-item-row">
                                                                <div className="line-item-desc">{item.description || 'N/A'}</div>
                                                                <div className="line-item-details">
                                                                    Qty: {item.qty || '0'} | Unit: ${item.unitPrice || '0.00'} | Total: ${(item.cost || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cost Breakdown Compact */}
                                            <div className="cost-breakdown-compact">
                                                <h6>Cost Breakdown</h6>
                                                <div className="breakdown-list">
                                                    <div className="breakdown-item-compact">
                                                        <span>Total:</span>
                                                        <span>${(currentVendor.pricing?.subtotal || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>CC Charges:</span>
                                                        <span>${(currentVendor.pricing?.ccChargesAmount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Tax:</span>
                                                        <span>${(currentVendor.pricing?.taxAmount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Freight:</span>
                                                        <span>${(currentVendor.pricing?.freightLogistics || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Extended Warranty:</span>
                                                        <span>${(currentVendor.pricing?.extendedWarranty || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Installation:</span>
                                                        <span>${(currentVendor.pricing?.installation || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Restocking Fees:</span>
                                                        <span>${(currentVendor.pricing?.restockingFeesAmount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Other 1:</span>
                                                        <span>${(currentVendor.pricing?.other1 || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Other 2:</span>
                                                        <span>${(currentVendor.pricing?.other2 || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact grand-total-compact">
                                                        <span>Grand Total:</span>
                                                        <span>${(currentVendor.pricing?.grandTotal || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Discount 1:</span>
                                                        <span>-${(currentVendor.pricing?.discount1 || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact">
                                                        <span>Discount 2:</span>
                                                        <span>-${(currentVendor.pricing?.discount2 || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="breakdown-item-compact final-total-compact">
                                                        <span>Final Total:</span>
                                                        <span>${(currentVendor.pricing?.finalGrandTotal || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ✅ CHANGE 2: NEW POSITION - REMARKS SECTION AFTER FINAL TOTAL */}
                                        {currentVendor.sourcingInfo?.remarks && (
                                            <div className="sourcing-info-card" style={{ marginTop: '20px' }}>
                                                <h5>📝 Vendor Remarks/Notes</h5>
                                                <div className="sourcing-fields-list">
                                                    <div className="sourcing-field-compact full-width-compact">
                                                        <span className="field-label-compact">🆕 Remarks / Notes:</span>
                                                        <span className="field-value-compact">{currentVendor.sourcingInfo.remarks}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ✅ MOVED: ATTACHMENTS SECTION - NOW AFTER FINAL TOTAL AND REMARKS */}
                    {vendors.length > 0 && currentVendor?.sourcingInfo?.attachments && currentVendor.sourcingInfo.attachments.length > 0 && (
                        <div className="review-section">
                            <div className="section-header">
                                <div className="section-icon">📎</div>
                                <h3>Vendor Attachments - {currentVendor.sourcingInfo?.vendorName || `Vendor ${currentVendorIndex + 1}`}</h3>
                            </div>
                            <div className="attachments-card">
                                <div className="attachments-header">
                                    <h6>📎 Attachments ({currentVendor.sourcingInfo.attachments.length})</h6>
                                    <button
                                        className="btn-download-all"
                                        onClick={() => handleDownloadAllFiles(currentVendor, currentVendorIndex)}
                                        title="Download all files"
                                    >
                                        📥 Download All
                                    </button>
                                </div>
                                <div className="attachments-list-compact">
                                    {currentVendor.sourcingInfo.attachments.map((attachment, attIndex) => (
                                        <div key={attIndex} className="attachment-item-compact">
                                            <div className="attachment-info-compact">
                                                <div className="attachment-name-compact">
                                                    {attachment.name || attachment.file?.name || `File ${attIndex + 1}`}
                                                    {(attachment.type || attachment.file?.type) && (
                                                        <span className="file-type-indicator">
                                                            ({(attachment.type || attachment.file?.type).split('/')[1]?.toUpperCase()})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="attachment-details-compact">
                                                    <span className="attachment-size-compact">
                                                        {attachment.size || attachment.file?.size || 'Unknown size'}
                                                    </span>
                                                    <span className="attachment-type-compact">
                                                        {attachment.type || attachment.file?.type || 'Unknown type'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="attachment-actions-compact">
                                                {/* ✅ PDF FIX: Eye Button for Preview */}
                                                <button
                                                    className="btn-preview-file"
                                                    onClick={() => handleFilePreview(attachment, currentVendor.sourcingInfo?.vendorName || `Vendor ${currentVendorIndex + 1}`)}
                                                    title={`Preview ${attachment.name || attachment.file?.name || 'file'}`}
                                                >
                                                    👁️
                                                </button>
                                                {/* ✅ PDF FIX: Download Button */}
                                                <button
                                                    className="btn-download-file"
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
                        </div>
                    )}

                    {/* ✅ APPROVAL ACTIONS */}
                    {reviewData.status === 'approval_pending' && (
                        <div className="review-approval-actions">
                            <div className="section-header">
                                <div className="section-icon">⚖️</div>
                                <h3>Approval Decision</h3>
                            </div>
                            <div className="approval-buttons">
                                <button
                                    className="btn-approve-review"
                                    onClick={() => handleQuickApprove(reviewData.id)}
                                >
                                    ✅ Approve Request
                                </button>
                                <button
                                    className="btn-reject-review"
                                    onClick={() => handleRejectClick(reviewData.id, 'review')}
                                >
                                    ❌ Reject Request
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ✅ UPDATED: Status Display for Approved/Rejected */}
                    {(reviewData.status === 'approval_approved' || reviewData.status === 'approval_rejected') && (
                        <div className="review-status-display">
                            <div className="section-header">
                                <div className="section-icon">📋</div>
                                <h3>Approval Status</h3>
                            </div>
                            <div className={`status-display ${reviewData.status}`}>
                                {getStatusBadge(reviewData.status)}
                                <div className="status-details">
                                    <p><strong>Action:</strong> {reviewData.status === 'approval_approved' ? 'Approved' : 'Rejected'}</p>
                                    <p><strong>By:</strong> {reviewData.approvedBy || reviewData.rejectedBy || 'N/A'}</p>
                                    <p><strong>Date:</strong> {reviewData.approvedAt || reviewData.rejectedAt || 'N/A'}</p>
                                    {/* ✅ NEW: Display Approval Remarks */}
                                    {reviewData.status === 'approval_approved' && reviewData.approvalRemarks && (
                                        <div className="approval-remarks-display">
                                            <p><strong>Approval Remarks:</strong></p>
                                            <div className="approval-remarks-text">{reviewData.approvalRemarks}</div>
                                        </div>
                                    )}
                                    {reviewData.rejectionReason && (
                                        <div className="rejection-reason-display">
                                            <p><strong>Rejection Reason:</strong></p>
                                            <div className="rejection-reason-text">{reviewData.rejectionReason}</div>
                                            <div className="rejection-flow-info">
                                                <p><strong>📨 Sent to Sourcing:</strong> This rejection message has been sent to the Sourcing section for revision.</p>
                                            </div>
                                            {reviewData.rejectionAcknowledged && (
                                                <div className="acknowledgment-status-display">
                                                    <p><strong>✅ Acknowledged by:</strong> {reviewData.rejectionAcknowledgedBy} at {reviewData.rejectionAcknowledgedAt}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {reviewData.approvalComments && !reviewData.rejectionReason && (
                                        <p><strong>Comments:</strong> {reviewData.approvalComments}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ✅ REVIEW PAGE NAVIGATION */}
                <div className="review-page-navigation">
                    <button
                        className="btn-back-to-approval"
                        onClick={handleBackToApproval}
                    >
                        ← Back to Approval Dashboard
                    </button>

                    {/* ❌ REMOVED: Proceed to Submission button as requested */}
                </div>
            </div>
        );
    }

    // ✅ FIXED: ORIGINAL APPROVAL DASHBOARD VIEW WITH CSS GRID STRUCTURE
    return (
        <div className="approval-container">
            {/* Rejection Modal */}
            <RejectionModal
                show={rejectionModal.show}
                reason={rejectionModal.reason}
                onReasonChange={handleRejectionReasonChange}
                onSubmit={handleSubmitRejection}
                onCancel={handleCancelRejection}
                isSubmitting={rejectionModal.isSubmitting}
            />

            {/* ✅ NEW: Approval Remarks Modal */}
            <ApprovalRemarksModal
                show={approvalRemarksModal.show}
                remarks={approvalRemarksModal.remarks}
                onRemarksChange={handleApprovalRemarksChange}
                onSubmit={handleApprovalRemarksSubmit}
                onCancel={handleApprovalRemarksCancel}
                isSubmitting={approvalRemarksModal.isSubmitting}
                entryData={approvalRemarksModal.entryData}
            />

            {/* Header */}
            <div className="approval-header">
                <div className="header-left">
                    <h1>📋 Approval Dashboard</h1>
                    <p>Review and approve completed sourcing requests</p>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <span>Current User: <strong>{currentUser}</strong></span>
                        <span className="current-time">{currentDateTime}</span>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="approval-filters">
                <div className="filter-group">
                    <label>Filter by Status:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Statuses</option>
                        <option value="approval_pending">Pending Review</option>
                        <option value="approval_approved">Approved</option>
                        <option value="approval_rejected">Rejected</option>
                    </select>
                </div>

                <div className="search-group">
                    <label>Search:</label>
                    <input
                        type="text"
                        placeholder="Search by bid title, number, portal, or sourcer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <button
                    className="btn-refresh"
                    onClick={loadApprovalEntries}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Statistics */}
            <div className="approval-stats">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{filteredEntries.length}</h3>
                        <p>Total Entries</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>{filteredEntries.filter(e => e.status === 'approval_pending').length}</h3>
                        <p>Pending</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{filteredEntries.filter(e => e.status === 'approval_approved').length}</h3>
                        <p>Approved</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                        <h3>{filteredEntries.filter(e => e.status === 'approval_rejected').length}</h3>
                        <p>Rejected</p>
                    </div>
                </div>
            </div>

            {/* ✅ FIXED: Entries Table with CSS Grid Structure (matches your original CSS) */}
            <div className="approval-table-container">
                {filteredEntries.length === 0 ? (
                    <div className="no-entries">
                        <div className="no-entries-icon">📭</div>
                        <h3>No Approval Entries Found</h3>
                        <p>
                            {approvalEntries.length === 0
                                ? "There are no sourcing requests ready for approval."
                                : "No entries match your current filter criteria."}
                        </p>
                        {approvalEntries.length === 0 && (
                            <p className="help-text">
                                Entries will appear here once sourcing is completed and marked as "Ready for Approval".
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ✅ Header Row with CSS Grid */}
                        <div className="table-header">
                            <div className="header-cell">QMS Info</div>
                            <div className="header-cell">Vendor Info</div>
                            <div className="header-cell">Status</div>
                            <div className="header-cell">Total Value</div>
                            <div className="header-cell">Actions</div>
                        </div>

                        {/* ✅ Data Rows with CSS Grid */}
                        {filteredEntries.map((entry) => {
                            const primaryVendor = getPrimaryVendorInfo(entry);
                            const totalValue = primaryVendor ? calculateTotalValue(primaryVendor) : 0;

                            return (
                                <div key={entry.id} className="table-row">
                                    {/* QMS Info Cell */}
                                    <div className="cell qms-info">
                                        <div className="qms-id">{entry.id}</div>
                                        <div className="bid-title">{entry.bidTitle || 'N/A'}</div>
                                        <div className="bid-number">#{entry.bidNumber}</div>
                                        <div className="portal-name">{entry.portalName}</div>
                                        <div className="sourcer-name">👤 {entry.sourcerName || entry.hunterName || 'N/A'}</div>
                                        <div className="due-date">📅 {entry.dueDate || 'N/A'}</div>
                                    </div>

                                    {/* Vendor Info Cell */}
                                    <div className="cell vendor-info">
                                        {primaryVendor ? (
                                            <>
                                                <div className="vendor-name">{primaryVendor.sourcingInfo?.vendorName || 'Unknown'}</div>
                                                <div className="vendor-details">
                                                    <div className="vendor-website">🌐 {primaryVendor.sourcingInfo?.vendorWebsite || 'N/A'}</div>
                                                    <div className="vendor-items">📦 {entry.sourcingData?.vendors?.length || 0} vendor(s)</div>
                                                    <div className="vendor-attachments">📎 {primaryVendor.sourcingInfo?.attachments?.length || 0} files</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="no-vendor">No Vendor Data</div>
                                        )}
                                    </div>

                                    {/* Status Cell */}
                                    <div className="cell status-info">
                                        {getStatusBadge(entry.status)}
                                        <div className="status-details">
                                            <div>By: {entry.approvedBy || entry.rejectedBy || 'Pending'}</div>
                                            <div>{entry.approvedAt || entry.rejectedAt || ''}</div>
                                        </div>
                                        {entry.rejectionReason && (
                                            <>
                                                <div className="rejection-reason-summary">{entry.rejectionReason.substring(0, 50)}...</div>
                                                <div className="rejection-sent-indicator">📨 Sent to Sourcing</div>
                                                {entry.rejectionAcknowledged && (
                                                    <div className="acknowledgment-status-badge">✅ Acknowledged</div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Value Cell */}
                                    <div className="cell value-info">
                                        <div className="total-value">${totalValue.toFixed(2)}</div>
                                        <div className="value-breakdown">
                                            <div>Subtotal: ${(primaryVendor?.pricing?.subtotal || 0).toFixed(2)}</div>
                                            <div>Tax: ${(primaryVendor?.pricing?.taxAmount || 0).toFixed(2)}</div>
                                            <div>Final: ${(primaryVendor?.pricing?.finalGrandTotal || totalValue).toFixed(2)}</div>
                                        </div>
                                    </div>

                                    {/* ✅ UPDATED: Actions Cell - REMOVED SUBMIT BUTTON */}
                                    <div className="cell actions">
                                        <button
                                            className="btn-review"
                                            onClick={() => handleReviewEntry(entry.id)}
                                            title="Review Details"
                                        >
                                            👁️ Review
                                        </button>

                                        {entry.status === 'approval_pending' && (
                                            <div className="quick-actions">
                                                <button
                                                    className="btn-quick-approve"
                                                    onClick={() => handleQuickApprove(entry.id)}
                                                >
                                                    ✅ Approve
                                                </button>
                                                <button
                                                    className="btn-quick-reject"
                                                    onClick={() => handleRejectClick(entry.id, 'table')}
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        )}

                                        {entry.status === 'approval_approved' && (
                                            <div className="approved-actions">
                                                {/* ❌ REMOVED: Submit button as requested */}
                                                {/* ✅ CHANGE 1: DELETE BUTTON AFTER APPROVAL */}
                                                <button
                                                    className="btn-delete-from-approval"
                                                    onClick={() => handleDeleteFromApproval(entry.id)}
                                                    title="Delete from Approval Dashboard"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s ease',
                                                        marginTop: '5px'
                                                    }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        )}

                                        {entry.status === 'approval_rejected' && (
                                            <div className="rejected-actions">
                                                <button
                                                    className="btn-view-in-sourcing"
                                                    onClick={() => navigate(`/sourcing/${entry.id}`)}
                                                    title="View in Sourcing for Revision"
                                                >
                                                    🔄 View in Sourcing
                                                </button>
                                                {/* ✅ CHANGE 1: DELETE BUTTON AFTER REJECTION */}
                                                <button
                                                    className="btn-delete-from-approval"
                                                    onClick={() => handleDeleteFromApproval(entry.id)}
                                                    title="Delete from Approval Dashboard"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s ease',
                                                        marginTop: '5px'
                                                    }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* ❌ REMOVED: Bottom Navigation buttons as requested */}
        </div>
    );
};

export default Approval;