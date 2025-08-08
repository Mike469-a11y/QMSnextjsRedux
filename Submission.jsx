import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import IndexedDBManager from '../../utils/IndexedDBManager';
import '../../styles/Submission.css';

const Submission = () => {
    const navigate = useNavigate();
    const { reviewId } = useParams();
    const [submissionEntries, setSubmissionEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showReviewPage, setShowReviewPage] = useState(false);
    const [reviewData, setReviewData] = useState(null);

    // ✅ Vendor carousel state
    const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
    const [showFloatingNav, setShowFloatingNav] = useState(false);
    const [scrollTimeout, setScrollTimeout] = useState(null);
    const [isScrolling, setIsScrolling] = useState(false);

    // ✅ NEW: Submission details state
    const [submissionDetails, setSubmissionDetails] = useState({
        submissionDate: '',
        assignedPerson: '',
        vendorCost: 0,
        shippingCost: 0,
        ccCostPercent: 0,
        ccCostAmount: 0,
        totalCost: 0,
        onePercentVendorCost: 0,
        profitPercent: 0,
        profitAmount: 0,
        totalProfitAmount: 0,
        taxAmount: 0,
        submittedWithMargin: 0,
        submittedBy: '',
        specialRemarks: ''
    });

    // ✅ NEW: Submission attachments state
    const [submissionAttachments, setSubmissionAttachments] = useState([]);

    // ✅ NEW: Save/Submit status
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ Current date time and user
    const currentDateTime = '2025-08-01 17:50:24';
    const currentUser = 'Mike469-a11y';

    // ✅ NEW: Generate Archive ID
    const generateArchiveId = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `ARCH-${year}-${month}-${day}-${randomSuffix}`;
    };

    // ✅ NEW: Transfer to Submitted Data Archive
    const transferToSubmittedDataArchive = async (entryData) => {
        try {
            // Create archive entry with all metadata
            const archiveEntry = {
                ...entryData,
                // Archive metadata
                archiveId: generateArchiveId(),
                submittedToArchiveAt: currentDateTime,
                submittedToArchiveBy: currentUser,
                isArchived: true,

                // Final submission metadata
                finalSubmissionBy: submissionDetails.submittedBy || currentUser,
                finalSubmissionAt: currentDateTime,
                finalSubmissionRemarks: submissionDetails.specialRemarks || '',

                // Submission calculation data
                submissionCalculations: {
                    submissionDate: submissionDetails.submissionDate,
                    assignedPerson: submissionDetails.assignedPerson,
                    vendorCost: submissionDetails.vendorCost,
                    shippingCost: submissionDetails.shippingCost,
                    ccCostPercent: submissionDetails.ccCostPercent,
                    ccCostAmount: submissionDetails.ccCostAmount,
                    totalCost: submissionDetails.totalCost,
                    onePercentVendorCost: submissionDetails.onePercentVendorCost,
                    profitPercent: submissionDetails.profitPercent,
                    profitAmount: submissionDetails.profitAmount,
                    totalProfitAmount: submissionDetails.totalProfitAmount,
                    taxAmount: submissionDetails.taxAmount,
                    submittedWithMargin: submissionDetails.submittedWithMargin
                },

                // Submission attachments
                submissionAttachments: submissionAttachments,

                // Workflow tracking
                workflowStages: [
                    {
                        stage: 'hunting',
                        completedAt: entryData.dateCreated || currentDateTime,
                        completedBy: entryData.hunterName || 'N/A'
                    },
                    {
                        stage: 'sourcing',
                        completedAt: entryData.sourcingCompletedAt || currentDateTime,
                        completedBy: entryData.sourcerName || 'N/A'
                    },
                    {
                        stage: 'approval',
                        completedAt: entryData.approvedAt || currentDateTime,
                        completedBy: entryData.approvedBy || 'N/A'
                    },
                    {
                        stage: 'submission',
                        completedAt: currentDateTime,
                        completedBy: currentUser
                    }
                ]
            };

            // Get existing submitted data entries
            const existingArchiveData = localStorage.getItem("submittedDataEntries");
            const existingEntries = existingArchiveData ? JSON.parse(existingArchiveData) : [];

            // Add new entry to archive
            existingEntries.push(archiveEntry);

            // Save back to localStorage
            localStorage.setItem("submittedDataEntries", JSON.stringify(existingEntries));

            console.log('✅ Entry successfully transferred to Submitted Data archive:', archiveEntry.archiveId);
            return archiveEntry.archiveId;

        } catch (error) {
            console.error('❌ Error transferring to archive:', error);
            throw error;
        }
    };

    // ✅ Initialize IndexedDB
    useEffect(() => {
        IndexedDBManager.initDB().catch(error => {
            console.error('Failed to initialize IndexedDB:', error);
        });
    }, []);

    // ✅ FIX: Reset review state when navigating back to submission dashboard from sidebar
    useEffect(() => {
        // If we're back on the main submission path (not review), reset review state
        if (window.location.pathname === '/submission' && showReviewPage) {
            setShowReviewPage(false);
            setReviewData(null);
            setCurrentVendorIndex(0);
            setShowFloatingNav(false);
            setIsScrolling(false);
        }
    }, [window.location.pathname, showReviewPage]);

    // ✅ FIX: Handle navigation to submission dashboard from anywhere
    useEffect(() => {
        const handleSubmissionNavigation = () => {
            // Check if we're not already on submission dashboard
            if (window.location.pathname.includes('/submission/review/')) {
                return; // Stay on review page
            }

            // If we're on submission path but not dashboard, go to dashboard
            if (window.location.pathname === '/submission' && showReviewPage) {
                handleBackToSubmission();
            }
        };

        // Listen for popstate (browser back/forward)
        window.addEventListener('popstate', handleSubmissionNavigation);
        return () => window.removeEventListener('popstate', handleSubmissionNavigation);
    }, [showReviewPage]);

    // ✅ Handle scroll for floating navigation
    useEffect(() => {
        const handleScroll = () => {
            if (showReviewPage && reviewData?.sourcingData?.vendors?.length > 1) {
                setIsScrolling(true);
                setShowFloatingNav(false);

                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }

                const newTimeout = setTimeout(() => {
                    setIsScrolling(false);
                    setShowFloatingNav(true);
                }, 1500);

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

    // ✅ Keyboard navigation
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

    // ✅ NEW: Auto-populate submission details when review data loads
    useEffect(() => {
        if (reviewData && reviewData.sourcingData?.vendors) {
            const primaryVendor = reviewData.sourcingData.vendors.find(v => v.isPrimary) || reviewData.sourcingData.vendors[0];
            if (primaryVendor) {
                const vendorCost = primaryVendor.pricing?.subtotal || 0;
                const shippingCost = primaryVendor.sourcingInfo?.estimatedShippingCost || 0;
                const ccPercent = primaryVendor.sourcingInfo?.ccCharges || 0;

                setSubmissionDetails(prev => ({
                    ...prev,
                    submissionDate: new Date().toISOString().split('T')[0],
                    assignedPerson: reviewData.sourcerName || reviewData.hunterName || '',
                    vendorCost: vendorCost,
                    shippingCost: shippingCost,
                    ccCostPercent: ccPercent,
                    taxAmount: primaryVendor.pricing?.taxAmount || 0,
                    submittedBy: currentUser,
                    profitPercent: 10 // Default 10% profit
                }));
            }
        }
    }, [reviewData, currentUser]);

    // ✅ NEW: Auto-calculate submission details
    useEffect(() => {
        const vendorCost = parseFloat(submissionDetails.vendorCost) || 0;
        const shippingCost = parseFloat(submissionDetails.shippingCost) || 0;
        const ccPercent = parseFloat(submissionDetails.ccCostPercent) || 0;
        const profitPercent = parseFloat(submissionDetails.profitPercent) || 0;
        const taxAmount = parseFloat(submissionDetails.taxAmount) || 0;

        // Calculate CC Amount
        const ccCostAmount = (vendorCost * ccPercent) / 100;

        // Calculate Total Cost
        const totalCost = vendorCost + shippingCost + ccCostAmount;

        // Calculate 1% of Vendor Cost
        const onePercentVendorCost = vendorCost * 0.01;

        // Calculate Profit Amount
        const profitAmount = (vendorCost * profitPercent) / 100;

        // Calculate Total Profit Amount
        const totalProfitAmount = profitAmount + onePercentVendorCost;

        // Calculate Submitted with Margin
        const submittedWithMargin = totalCost + totalProfitAmount + taxAmount;

        setSubmissionDetails(prev => ({
            ...prev,
            ccCostAmount: ccCostAmount,
            totalCost: totalCost,
            onePercentVendorCost: onePercentVendorCost,
            profitAmount: profitAmount,
            totalProfitAmount: totalProfitAmount,
            submittedWithMargin: submittedWithMargin
        }));
    }, [
        submissionDetails.vendorCost,
        submissionDetails.shippingCost,
        submissionDetails.ccCostPercent,
        submissionDetails.profitPercent,
        submissionDetails.taxAmount
    ]);

    useEffect(() => {
        loadSubmissionEntries();
        if (reviewId) {
            handleReviewEntry(reviewId);
        }
    }, [reviewId]);

    // ✅ Load submission entries
    const loadSubmissionEntries = () => {
        try {
            const stored = localStorage.getItem("submissionEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                setSubmissionEntries(entries);
            }
        } catch (error) {
            console.error('Error loading submission entries:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ NEW: Get entry category for filtering
    const getEntryCategory = (entry) => {
        const dueDate = new Date(entry.dueDate);
        const today = new Date();
        const timeDiff = dueDate - today;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Check if entry has been started (accessed)
        const isStarted = entry.isStarted || false;

        if (!isStarted) return 'not_started';
        if (daysLeft < 0) return 'expired';
        if (daysLeft <= 2) return 'urgent';

        // Return original submission status for other cases
        return entry.submissionStatus;
    };

    // ✅ UPDATED: Filter entries with new categories
    const filteredEntries = useMemo(() => {
        return submissionEntries.filter(entry => {
            let matchesStatus = true;

            if (filterStatus !== 'all') {
                const entryCategory = getEntryCategory(entry);
                if (filterStatus === 'not_started') {
                    matchesStatus = entryCategory === 'not_started';
                } else if (filterStatus === 'expired') {
                    matchesStatus = entryCategory === 'expired';
                } else if (filterStatus === 'urgent') {
                    matchesStatus = entryCategory === 'urgent';
                } else {
                    matchesStatus = entry.submissionStatus === filterStatus;
                }
            }

            const matchesSearch = entry.bidTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.bidNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.portalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.sourcerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.hunterName?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [submissionEntries, filterStatus, searchTerm]);

    // ✅ Get status badge
    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending_submission': { label: 'Pending', class: 'status-pending', icon: '📋' },
            'processing': { label: 'Processing', class: 'status-processing', icon: '⚙️' },
            'submitted': { label: 'Submitted', class: 'status-approved', icon: '✅' }
        };
        const config = statusConfig[status] || statusConfig['pending_submission'];
        return (
            <span className={`status-badge ${config.class}`}>
                {config.icon} {config.label}
            </span>
        );
    };

    // ✅ Get primary vendor info
    const getPrimaryVendorInfo = (entry) => {
        if (!entry.sourcingData?.vendors) return null;
        const primaryVendor = entry.sourcingData.vendors.find(v => v.isPrimary) || entry.sourcingData.vendors[0];
        return primaryVendor;
    };

    // ✅ Calculate total value
    const calculateTotalValue = (vendor) => {
        if (!vendor?.pricing) return 0;
        return vendor.pricing.finalGrandTotal || vendor.pricing.grandTotal || 0;
    };

    // ✅ NEW: Handle submission details input change
    const handleSubmissionDetailsChange = (field, value) => {
        setSubmissionDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // ✅ FIXED: Handle submission file upload with proper IndexedDB structure
    const handleSubmissionFileUpload = async (files) => {
        const fileArray = Array.from(files);
        const newAttachments = [];

        for (const file of fileArray) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert(`❌ File "${file.name}" is too large. Maximum size is 10MB.`);
                continue;
            }

            try {
                // ✅ FIXED: Create proper attachment object with unique ID
                const attachmentId = `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                const attachmentData = {
                    id: attachmentId,
                    name: file.name,
                    type: file.type,
                    size: `${(file.size / 1024).toFixed(1)} KB`,
                    file: file,
                    uploadedAt: new Date().toISOString(),
                    section: 'submission'
                };

                // ✅ FIXED: Save to IndexedDB with proper key structure
                await IndexedDBManager.saveAttachment(attachmentData);

                newAttachments.push(attachmentData);

                console.log('✅ File uploaded successfully:', file.name);
            } catch (error) {
                console.error('❌ Error saving attachment:', error);
                alert(`❌ Error uploading "${file.name}": ${error.message}`);
            }
        }

        if (newAttachments.length > 0) {
            setSubmissionAttachments(prev => [...prev, ...newAttachments]);
            alert(`✅ Successfully uploaded ${newAttachments.length} file(s)`);
        }
    };

    // ✅ NEW: Handle submission file remove
    const handleSubmissionFileRemove = async (attachmentId) => {
        try {
            await IndexedDBManager.deleteAttachment(attachmentId);
            setSubmissionAttachments(prev => prev.filter(att => att.id !== attachmentId));
            alert('🗑️ File removed successfully');
        } catch (error) {
            console.error('Error removing attachment:', error);
            alert(`❌ Error removing file: ${error.message}`);
        }
    };

    // ✅ NEW: Save Progress Function
    const handleSaveProgress = async () => {
        if (isSaving) return;

        try {
            setIsSaving(true);

            // Update the current entry with submission details and attachments
            const stored = localStorage.getItem("submissionEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const entryIndex = entries.findIndex(e => e.id === reviewData.id);

                if (entryIndex !== -1) {
                    entries[entryIndex] = {
                        ...entries[entryIndex],
                        submissionStatus: 'processing',
                        submissionDetails: submissionDetails,
                        submissionAttachments: submissionAttachments,
                        lastSaved: currentDateTime,
                        savedBy: currentUser
                    };

                    localStorage.setItem("submissionEntries", JSON.stringify(entries));
                    setSubmissionEntries(entries);
                    setReviewData(entries[entryIndex]);

                    alert('💾 Progress saved successfully!');
                }
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            alert('❌ Error saving progress. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ UPDATED: Submit Function with Archive Transfer
    const handleSubmit = async () => {
        if (isSubmitting) return;

        // ✅ Validation
        if (!submissionDetails.submittedBy.trim()) {
            alert('❌ Please enter the "Submitted By" field before submitting.');
            return;
        }

        if (!submissionDetails.submissionDate) {
            alert('❌ Please select a submission date before submitting.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Update the current entry to submitted status
            const stored = localStorage.getItem("submissionEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const entryIndex = entries.findIndex(e => e.id === reviewData.id);

                if (entryIndex !== -1) {
                    const updatedEntry = {
                        ...entries[entryIndex],
                        submissionStatus: 'submitted',
                        submissionDetails: submissionDetails,
                        submissionAttachments: submissionAttachments,
                        submittedAt: currentDateTime,
                        submittedBy: currentUser
                    };

                    entries[entryIndex] = updatedEntry;
                    localStorage.setItem("submissionEntries", JSON.stringify(entries));

                    // ✅ NEW: Transfer to Submitted Data Archive
                    try {
                        const archiveId = await transferToSubmittedDataArchive(updatedEntry);

                        // ✅ FORCE IMMEDIATE UPDATE
                        setSubmissionEntries(entries);

                        alert(`✅ Submission completed successfully!\n\n📁 Entry archived with ID: ${archiveId}\n\n🗂️ You can now view this entry in the "Submitted Data" section.`);

                        // Redirect to dashboard with forced refresh
                        handleBackToSubmission();

                        // ✅ FORCE RE-RENDER AFTER NAVIGATION
                        setTimeout(() => {
                            loadSubmissionEntries();
                        }, 100);

                    } catch (archiveError) {
                        console.error('❌ Error transferring to archive:', archiveError);
                        alert('⚠️ Submission completed but failed to archive.\n\nEntry status updated but not transferred to Submitted Data section.');

                        // Still update the entry status even if archive fails
                        setSubmissionEntries(entries);
                        handleBackToSubmission();
                        setTimeout(() => {
                            loadSubmissionEntries();
                        }, 100);
                    }
                }
            }
        } catch (error) {
            console.error('Error submitting:', error);
            alert('❌ Error submitting. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ FIXED: Implement Delete Function
    const handleDelete = async (entryId) => {
        if (window.confirm('⚠️ Are you sure you want to delete this submission entry?\n\nThis action cannot be undone!')) {
            try {
                const stored = localStorage.getItem("submissionEntries");
                if (stored) {
                    const entries = JSON.parse(stored);
                    const updatedEntries = entries.filter(e => e.id !== entryId);

                    localStorage.setItem("submissionEntries", JSON.stringify(updatedEntries));
                    setSubmissionEntries(updatedEntries);

                    alert('🗑️ Entry deleted successfully!');
                }
            } catch (error) {
                console.error('Error deleting entry:', error);
                alert('❌ Error deleting entry. Please try again.');
            }
        }
    };

    // ✅ UPDATED: Handle review entry with "Started" tracking
    const handleReviewEntry = async (entryId) => {
        try {
            setLoading(true);
            const stored = localStorage.getItem("submissionEntries");
            if (stored) {
                const entries = JSON.parse(stored);
                const entryIndex = entries.findIndex(e => e.id === entryId);
                const entry = entries[entryIndex];

                if (entry) {
                    // ✅ NEW: Mark entry as started
                    if (!entry.isStarted) {
                        entry.isStarted = true;
                        entries[entryIndex] = entry;
                        localStorage.setItem("submissionEntries", JSON.stringify(entries));
                        setSubmissionEntries(entries);
                    }

                    setReviewData(entry);
                    setShowReviewPage(true);
                    setCurrentVendorIndex(0);
                    setShowFloatingNav(false);
                    setIsScrolling(false);

                    // ✅ Load existing submission data if available
                    if (entry.submissionDetails) {
                        setSubmissionDetails(entry.submissionDetails);
                    }
                    if (entry.submissionAttachments) {
                        setSubmissionAttachments(entry.submissionAttachments);
                    } else {
                        setSubmissionAttachments([]);
                    }

                    window.history.pushState({}, '', `/submission/review/${entryId}`);
                }
            }
        } catch (error) {
            console.error('Error loading review data:', error);
            alert('❌ Error loading review data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Back to submission dashboard with refresh
    const handleBackToSubmission = () => {
        setShowReviewPage(false);
        setReviewData(null);
        setCurrentVendorIndex(0);
        setShowFloatingNav(false);
        setIsScrolling(false);
        setSubmissionAttachments([]);
        navigate('/submission');

        // ✅ FORCE REFRESH AFTER NAVIGATION
        setTimeout(() => {
            loadSubmissionEntries();
        }, 50);
    };

    // ✅ Vendor carousel functions
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

    // ✅ File download (reuse from approval)
    const handleFileDownload = async (attachment, vendorName) => {
        try {
            console.log('📥 Downloading attachment:', attachment);
            let downloadUrl = '';
            let fileName = attachment.name || `${vendorName}_attachment`;

            if (typeof attachment === 'string') {
                const fileData = await IndexedDBManager.getAttachment(attachment);
                if (fileData && fileData.file) {
                    downloadUrl = URL.createObjectURL(fileData.file);
                    fileName = fileData.name || fileName;
                } else {
                    throw new Error('File not found in IndexedDB');
                }
            } else if (attachment.file && attachment.file instanceof File) {
                downloadUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.file.name || fileName;
            } else if (attachment.file) {
                downloadUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.name || fileName;
            } else if (attachment.data) {
                let blobData;
                let mimeType = attachment.type || 'application/octet-stream';
                if (typeof attachment.data === 'string') {
                    try {
                        const base64Data = attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data;
                        blobData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    } catch (e) {
                        blobData = attachment.data;
                        mimeType = 'text/plain';
                    }
                } else {
                    blobData = attachment.data;
                }
                const blob = new Blob([blobData], { type: mimeType });
                downloadUrl = URL.createObjectURL(blob);
            } else if (attachment.url) {
                downloadUrl = attachment.url;
            } else {
                throw new Error('No valid file data found');
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (downloadUrl.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            }

            alert(`📥 Downloaded: ${fileName}`);
        } catch (error) {
            console.error('❌ Error downloading file:', error);
            alert(`❌ Error downloading file: ${attachment.name || 'Unknown'}\n\nError: ${error.message}`);
        }
    };

    // ✅ File preview (reuse from approval)
    const handleFilePreview = async (attachment, vendorName) => {
        try {
            let previewUrl = '';
            let fileName = attachment.name || `${vendorName}_attachment`;

            if (typeof attachment === 'string') {
                const fileData = await IndexedDBManager.getAttachment(attachment);
                if (fileData && fileData.file) {
                    previewUrl = URL.createObjectURL(fileData.file);
                    fileName = fileData.name || fileName;
                } else {
                    throw new Error('File not found in IndexedDB');
                }
            } else if (attachment.file && attachment.file instanceof File) {
                previewUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.file.name || fileName;
            } else if (attachment.file) {
                previewUrl = URL.createObjectURL(attachment.file);
                fileName = attachment.name || fileName;
            } else if (attachment.data) {
                let blobData;
                let mimeType = attachment.type || 'application/pdf';
                if (typeof attachment.data === 'string') {
                    try {
                        const base64Data = attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data;
                        blobData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    } catch (e) {
                        blobData = attachment.data;
                        mimeType = 'text/plain';
                    }
                } else {
                    blobData = attachment.data;
                }
                const blob = new Blob([blobData], { type: mimeType });
                previewUrl = URL.createObjectURL(blob);
            } else if (attachment.url) {
                previewUrl = attachment.url;
            } else {
                throw new Error('No valid file data found');
            }

            const previewWindow = window.open(previewUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
            if (!previewWindow) {
                alert('❌ Preview blocked by browser popup blocker.\n\nPlease allow popups for this site and try again.');
            } else {
                previewWindow.document.title = `Preview: ${fileName}`;
            }

            if (previewUrl.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
            }
        } catch (error) {
            console.error('❌ Error previewing file:', error);
            alert(`❌ Error previewing file: ${attachment.name || 'Unknown'}\n\nError: ${error.message}`);
        }
    };

    // ✅ Download all files
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

    if (loading) {
        return (
            <div className="submission-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading submission entries...</p>
                </div>
            </div>
        );
    }

    // ✅ Review Page View with MOVED APPROVAL STATUS + NEW SUBMISSION DETAILS + BUTTONS
    if (showReviewPage && reviewData) {
        const vendors = reviewData.sourcingData?.vendors || [];
        const currentVendor = vendors[currentVendorIndex];
        const vendorCount = vendors.length;

        return (
            <div className="submission-container">
                {/* ✅ Floating Vendor Navigation */}
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
                    {/* ✅ UPDATED: APPROVAL STATUS SECTION WITH APPROVAL REMARKS */}
                    {(reviewData.status === 'approval_approved' || reviewData.status === 'approval_rejected') && (
                        <div className="review-status-display">
                            <div className="section-header">
                                <div className="section-icon">📋</div>
                                <h3>Approval Status</h3>
                            </div>
                            <div className={`status-display ${reviewData.status}`}>
                                <span className={`status-badge ${reviewData.status === 'approval_approved' ? 'status-approved' : 'status-rejected'}`}>
                                    {reviewData.status === 'approval_approved' ? '✅ Approved' : '❌ Rejected'}
                                </span>
                                <div className="status-details">
                                    <p><strong>Date:</strong> {reviewData.approvedAt || reviewData.rejectedAt || 'N/A'}</p>
                                    {/* ✅ NEW: Display Approval Remarks */}
                                    {reviewData.status === 'approval_approved' && reviewData.approvalRemarks && (
                                        <div className="approval-remarks-display">
                                            <p><strong>Approval Remarks:</strong></p>
                                            <div className="approval-remarks-text">{reviewData.approvalRemarks}</div>
                                        </div>
                                    )}
                                    {/* ✅ EXISTING: Display Rejection Reason */}
                                    {reviewData.rejectionReason && (
                                        <div className="rejection-reason-display">
                                            <p><strong>Rejection Reason:</strong></p>
                                            <div className="rejection-reason-text">{reviewData.rejectionReason}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ QMS INFORMATION SECTION */}
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

                    {/* ✅ VENDOR CAROUSEL SECTION */}
                    {vendors.length > 0 && (
                        <div className="review-section vendor-carousel-section">
                            <div className="section-header">
                                <div className="section-icon">🏢</div>
                                <h3>Vendor Details ({vendorCount} Vendor{vendorCount > 1 ? 's' : ''})</h3>
                            </div>

                            <div className="vendor-carousel-container">
                                {/* ✅ Carousel Header */}
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
                                        {/* ✅ SOURCING INFORMATION */}
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
                                            </div>
                                        </div>

                                        {/* ✅ PRICING SECTION */}
                                        <div className="pricing-card">
                                            <h5>💰 Pricing & Line Items</h5>

                                            {/* Line Items */}
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

                                            {/* Cost Breakdown */}
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

                                        {/* ✅ REMARKS SECTION AFTER FINAL TOTAL */}
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

                    {/* ✅ ATTACHMENTS SECTION */}
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
                                                <button
                                                    className="btn-preview-file"
                                                    onClick={() => handleFilePreview(attachment, currentVendor.sourcingInfo?.vendorName || `Vendor ${currentVendorIndex + 1}`)}
                                                    title={`Preview ${attachment.name || attachment.file?.name || 'file'}`}
                                                >
                                                    👁️
                                                </button>
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

                    {/* ✅ NEW: SUBMISSION DETAILS SECTION */}
                    <div className="review-section submission-details-section">
                        <div className="section-header">
                            <div className="section-icon">📊</div>
                            <h3>Submission Details & Calculations</h3>
                        </div>

                        <div className="submission-details-form">
                            {/* ✅ 1. Submission Date */}
                            <div className="submission-field">
                                <label className="submission-label">📅 Submission Date</label>
                                <input
                                    type="date"
                                    value={submissionDetails.submissionDate}
                                    onChange={(e) => handleSubmissionDetailsChange('submissionDate', e.target.value)}
                                    className="submission-input"
                                />
                            </div>

                            {/* ✅ 2. Assigned Person */}
                            <div className="submission-field">
                                <label className="submission-label">👤 Assigned Person</label>
                                <input
                                    type="text"
                                    value={submissionDetails.assignedPerson}
                                    onChange={(e) => handleSubmissionDetailsChange('assignedPerson', e.target.value)}
                                    className="submission-input"
                                    placeholder="Enter assigned person name"
                                />
                            </div>

                            {/* ✅ 3. Vendor Cost (auto-fetched) */}
                            <div className="submission-field">
                                <label className="submission-label">💰 Vendor Cost (Line Items Total)</label>
                                <input
                                    type="number"
                                    value={submissionDetails.vendorCost}
                                    onChange={(e) => handleSubmissionDetailsChange('vendorCost', e.target.value)}
                                    className="submission-input auto-calculated"
                                    step="0.01"
                                />
                                <span className="field-note">Auto-fetched from sourcing data</span>
                            </div>

                            {/* ✅ 4. Shipping Cost */}
                            <div className="submission-field">
                                <label className="submission-label">🚚 Shipping Cost</label>
                                <input
                                    type="number"
                                    value={submissionDetails.shippingCost}
                                    onChange={(e) => handleSubmissionDetailsChange('shippingCost', e.target.value)}
                                    className="submission-input"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* ✅ 5. Credit Card Cost (%) */}
                            <div className="submission-field">
                                <label className="submission-label">💳 Credit Card Cost (%)</label>
                                <input
                                    type="number"
                                    value={submissionDetails.ccCostPercent}
                                    onChange={(e) => handleSubmissionDetailsChange('ccCostPercent', e.target.value)}
                                    className="submission-input"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* ✅ 6. Credit Card Cost (Amount) - auto-calculated */}
                            <div className="submission-field">
                                <label className="submission-label">💳 Credit Card Cost (Amount)</label>
                                <input
                                    type="number"
                                    value={submissionDetails.ccCostAmount.toFixed(2)}
                                    readOnly
                                    className="submission-input auto-calculated"
                                    step="0.01"
                                />
                                <span className="field-note">Auto-calculated: Vendor Cost × CC %</span>
                            </div>

                            {/* ✅ 7. TOTAL COST - auto-calculated */}
                            <div className="submission-field">
                                <label className="submission-label">💵 TOTAL COST</label>
                                <input
                                    type="number"
                                    value={submissionDetails.totalCost.toFixed(2)}
                                    readOnly
                                    className="submission-input auto-calculated total-field"
                                    step="0.01"
                                />
                                <span className="field-note">Auto-calculated: Vendor Cost + Shipping + CC Amount</span>
                            </div>

                            {/* ✅ 8. 1% of Vendor Cost - auto-calculated */}
                            <div className="submission-field">
                                <label className="submission-label">📊 1% of Vendor Cost</label>
                                <input
                                    type="number"
                                    value={submissionDetails.onePercentVendorCost.toFixed(2)}
                                    readOnly
                                    className="submission-input auto-calculated"
                                    step="0.01"
                                />
                                <span className="field-note">Auto-calculated: Vendor Cost × 1%</span>
                            </div>

                            {/* ✅ 9. PROFIT % */}
                            <div className="submission-field">
                                <label className="submission-label">📈 PROFIT %</label>
                                <input
                                    type="number"
                                    value={submissionDetails.profitPercent}
                                    onChange={(e) => handleSubmissionDetailsChange('profitPercent', e.target.value)}
                                    className="submission-input"
                                    step="0.01"
                                    placeholder="10.00"
                                />
                            </div>

                            {/* ✅ 10. PROFIT $ - auto-calculated */}
                            <div className="submission-field">
                                <label className="submission-label">💲 PROFIT $</label>
                                <input
                                    type="number"
                                    value={submissionDetails.profitAmount.toFixed(2)}
                                    readOnly
                                    className="submission-input auto-calculated"
                                    step="0.01"
                                />
                                <span className="field-note">Auto-calculated: Vendor Cost × Profit %</span>
                            </div>

                            {/* ✅ 11. Total Profit Amount - auto-calculated */}
                            <div className="submission-field">
                                <label className="submission-label">💎 Total Profit Amount</label>
                                <input
                                    type="number"
                                    value={submissionDetails.totalProfitAmount.toFixed(2)}
                                    readOnly
                                    className="submission-input auto-calculated total-field"
                                    step="0.01"
                                />
                                <span className="field-note">Auto-calculated: PROFIT $ + 1% of Vendor Cost</span>
                            </div>

                            {/* ✅ 12. TAX Amount */}
                            <div className="submission-field">
                                <label className="submission-label">🏛️ TAX Amount</label>
                                <input
                                    type="number"
                                    value={submissionDetails.taxAmount}
                                    onChange={(e) => handleSubmissionDetailsChange('taxAmount', e.target.value)}
                                    className="submission-input"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* ✅ 13. Submitted with Margin - auto-calculated */}
                            <div className="submission-field">
                                <label className="submission-label">🎯 Submitted with Margin</label>
                                <input
                                    type="number"
                                    value={submissionDetails.submittedWithMargin.toFixed(2)}
                                    readOnly
                                    className="submission-input auto-calculated final-total"
                                    step="0.01"
                                />
                                <span className="field-note">Auto-calculated: Total Cost + Total Profit + TAX</span>
                            </div>

                            {/* ✅ 14. NEW: SUBMISSION ATTACHMENTS SECTION */}
                            <div className="submission-field full-width">
                                <label className="submission-label">📎 Attachments</label>
                                <div className="submission-attachments-card">
                                    <div
                                        className="submission-upload-area"
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            handleSubmissionFileUpload(e.dataTransfer.files);
                                        }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onClick={() => document.getElementById('submission-file-input').click()}
                                    >
                                        <div className="submission-upload-icon">📎</div>
                                        <div className="submission-upload-text">Drag & drop files here or click to browse</div>
                                        <div className="submission-upload-note">Supported: PDF, Excel, Word, Images (max 10MB each)</div>
                                        <button type="button" className="submission-browse-btn">Browse Files</button>
                                    </div>
                                    <input
                                        id="submission-file-input"
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                                        onChange={(e) => handleSubmissionFileUpload(e.target.files)}
                                        style={{ display: 'none' }}
                                    />

                                    {/* ✅ Uploaded Files List */}
                                    {submissionAttachments.length > 0 && (
                                        <div className="submission-uploaded-files">
                                            <h6>Uploaded Files ({submissionAttachments.length}):</h6>
                                            <div className="submission-file-list">
                                                {submissionAttachments.map((file, index) => (
                                                    <div key={file.id || index} className="submission-file-item">
                                                        <div className="submission-file-info">
                                                            <div className="submission-file-name">
                                                                📄 {file.name}
                                                                <span className="submission-file-type">
                                                                    ({file.type?.split('/')[1]?.toUpperCase()})
                                                                </span>
                                                            </div>
                                                            <div className="submission-file-size">{file.size}</div>
                                                        </div>
                                                        <div className="submission-file-actions">
                                                            <button
                                                                type="button"
                                                                className="submission-btn-preview"
                                                                onClick={() => handleFilePreview(file, 'Submission')}
                                                                title={`Preview ${file.name}`}
                                                            >
                                                                👁️
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="submission-btn-download"
                                                                onClick={() => handleFileDownload(file, 'Submission')}
                                                                title={`Download ${file.name}`}
                                                            >
                                                                📥
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="submission-btn-remove"
                                                                onClick={() => handleSubmissionFileRemove(file.id)}
                                                                title={`Remove ${file.name}`}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ✅ 15. Submitted By */}
                            <div className="submission-field">
                                <label className="submission-label">✍️ Submitted By</label>
                                <input
                                    type="text"
                                    value={submissionDetails.submittedBy}
                                    onChange={(e) => handleSubmissionDetailsChange('submittedBy', e.target.value)}
                                    className="submission-input"
                                    placeholder="Enter submitter name"
                                />
                            </div>

                            {/* ✅ 16. SPECIAL SUBMISSION REMARKS */}
                            <div className="submission-field full-width">
                                <label className="submission-label">📝 SPECIAL SUBMISSION REMARKS</label>
                                <textarea
                                    value={submissionDetails.specialRemarks}
                                    onChange={(e) => handleSubmissionDetailsChange('specialRemarks', e.target.value)}
                                    className="submission-textarea"
                                    placeholder="Enter any special remarks or notes for this submission..."
                                    rows="4"
                                />
                            </div>
                        </div>

                        {/* ✅ NEW: ACTION BUTTONS - Save Progress & Submit */}
                        <div className="submission-action-buttons">
                            <button
                                className="btn-save-progress"
                                onClick={handleSaveProgress}
                                disabled={isSaving}
                            >
                                {isSaving ? '💾 Saving...' : '💾 Save Progress'}
                            </button>

                            <button
                                className="btn-submit-final"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '📤 Submitting...' : '📤 Submit'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ✅ REVIEW PAGE NAVIGATION */}
                <div className="review-page-navigation">
                    <button
                        className="btn-back-to-approval"
                        onClick={handleBackToSubmission}
                    >
                        ← Back to Submission Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Main Submission Dashboard View
    return (
        <div className="submission-container">
            {/* Header */}
            <div className="submission-header">
                <div className="header-left">
                    <h1>📤 Submission Dashboard</h1>
                    <p>Manage final submissions and documentation processes</p>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <span>Current User: <strong>{currentUser}</strong></span>
                        <span className="current-time">{currentDateTime}</span>
                    </div>
                </div>
            </div>

            {/* ✅ UPDATED: Filters and Search with new options */}
            <div className="approval-filters">
                <div className="filter-group">
                    <label>Filter by Status:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending_submission">Pending Submission</option>
                        <option value="processing">Processing</option>
                        <option value="submitted">Submitted</option>
                        <option value="not_started">Not Started</option>
                        <option value="expired">Expired</option>
                        <option value="urgent">Urgent</option>
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
                    onClick={loadSubmissionEntries}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* ✅ UPDATED: Statistics with new categories */}
            <div className="approval-stats">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{filteredEntries.length}</h3>
                        <p>Total Entries</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <h3>{submissionEntries.filter(e => e.submissionStatus === 'pending_submission').length}</h3>
                        <p>Pending</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚙️</div>
                    <div className="stat-content">
                        <h3>{submissionEntries.filter(e => e.submissionStatus === 'processing').length}</h3>
                        <p>Processing</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{submissionEntries.filter(e => e.submissionStatus === 'submitted').length}</h3>
                        <p>Submitted</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🆕</div>
                    <div className="stat-content">
                        <h3>{submissionEntries.filter(e => getEntryCategory(e) === 'not_started').length}</h3>
                        <p>Not Started</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                        <h3>{submissionEntries.filter(e => getEntryCategory(e) === 'expired').length}</h3>
                        <p>Expired</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-content">
                        <h3>{submissionEntries.filter(e => getEntryCategory(e) === 'urgent').length}</h3>
                        <p>Urgent</p>
                    </div>
                </div>
            </div>

            {/* ✅ SEPARATE SUBMISSION TABLE WITH NEW CSS CLASSES */}
            <div className="submission-table-container">
                {filteredEntries.length === 0 ? (
                    <div className="no-entries">
                        <div className="no-entries-icon">📭</div>
                        <h3>No Submission Entries Found</h3>
                        <p>
                            {submissionEntries.length === 0
                                ? "No entries have been submitted for processing yet. Approved entries from the Approval section will appear here."
                                : "No entries match your current filter criteria."}
                        </p>
                        {submissionEntries.length === 0 && (
                            <p className="help-text">
                                Entries will appear here once they are submitted from the Approval Dashboard.
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ✅ SEPARATE: 10-COLUMN HEADER ROW */}
                        <div className="submission-table-header">
                            <div className="submission-header-cell">QMS ID</div>
                            <div className="submission-header-cell">Sourcer</div>
                            <div className="submission-header-cell">Due Date</div>
                            <div className="submission-header-cell">Due Status</div>
                            <div className="submission-header-cell">Priority</div>
                            <div className="submission-header-cell">Days Left</div>
                            <div className="submission-header-cell">Vendor Info</div>
                            <div className="submission-header-cell">Status</div>
                            <div className="submission-header-cell">Total Value</div>
                            <div className="submission-header-cell">Actions</div>
                        </div>

                        {/* ✅ SEPARATE: 10-COLUMN DATA ROWS */}
                        {filteredEntries.map((entry) => {
                            const primaryVendor = getPrimaryVendorInfo(entry);
                            const totalValue = primaryVendor ? calculateTotalValue(primaryVendor) : 0;

                            // ✅ Calculate Due Status and Days Left with CORRECT LOGIC
                            const dueDate = new Date(entry.dueDate);
                            const today = new Date();
                            const timeDiff = dueDate - today;
                            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                            // ✅ Due Status Logic
                            const getDueStatus = () => {
                                if (daysLeft < 0) return { label: 'Overdue', class: 'due-overdue' };
                                if (daysLeft === 0) return { label: 'Due Today', class: 'due-today' };
                                if (daysLeft <= 3) return { label: 'Due Soon', class: 'due-soon' };
                                return { label: 'On Time', class: 'due-ontime' };
                            };

                            // ✅ Priority Logic Based on Requirements
                            const getPriority = () => {
                                if (daysLeft < 0) return { label: 'Expired', class: 'priority-expired', icon: '🔴' };
                                if (daysLeft <= 2) return { label: 'Urgent', class: 'priority-urgent', icon: '🟠' };
                                if (daysLeft <= 4) return { label: 'Medium', class: 'priority-medium', icon: '🟡' };
                                return { label: 'Normal', class: 'priority-normal', icon: '🟢' };
                            };

                            // ✅ Days Left Text with Correct Grammar
                            const getDaysLeftText = () => {
                                if (daysLeft < 0) {
                                    const overdueDays = Math.abs(daysLeft);
                                    return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`;
                                }
                                if (daysLeft === 0) return 'Due today';
                                return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
                            };

                            const dueStatus = getDueStatus();
                            const priority = getPriority();

                            return (
                                <div key={entry.id} className="submission-table-row">
                                    {/* 1. QMS ID Cell */}
                                    <div className="submission-cell qms-id-cell">
                                        <div className="qms-id">{entry.id}</div>
                                    </div>

                                    {/* 2. Sourcer Cell */}
                                    <div className="submission-cell sourcer-cell">
                                        <div className="sourcer-name">👤 {entry.sourcerName || entry.hunterName || 'Not Assigned'}</div>
                                    </div>

                                    {/* 3. Due Date Cell */}
                                    <div className="submission-cell due-date-cell">
                                        <div className="due-date">📅 {entry.dueDate || 'N/A'}</div>
                                    </div>

                                    {/* 4. Due Status Cell */}
                                    <div className="submission-cell due-status-cell">
                                        <span className={`due-status-badge ${dueStatus.class}`}>
                                            {dueStatus.label}
                                        </span>
                                    </div>

                                    {/* 5. Priority Cell */}
                                    <div className="submission-cell priority-cell">
                                        <span className={`priority-badge ${priority.class}`}>
                                            {priority.icon} {priority.label}
                                        </span>
                                    </div>

                                    {/* 6. Days Left Cell */}
                                    <div className="submission-cell days-left-cell">
                                        <div className={`days-left ${daysLeft < 0 ? 'negative' : daysLeft <= 2 ? 'warning' : 'normal'}`}>
                                            {getDaysLeftText()}
                                        </div>
                                    </div>

                                    {/* 7. Vendor Info Cell */}
                                    <div className="submission-cell vendor-info">
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

                                    {/* 8. Status Cell */}
                                    <div className="submission-cell status-info">
                                        {getStatusBadge(entry.submissionStatus)}
                                    </div>

                                    {/* 9. Total Value Cell */}
                                    <div className="submission-cell value-info">
                                        <div className="total-value">${totalValue.toFixed(2)}</div>
                                        <div className="value-breakdown">
                                            <div>Subtotal: ${(primaryVendor?.pricing?.subtotal || 0).toFixed(2)}</div>
                                            <div>Tax: ${(primaryVendor?.pricing?.taxAmount || 0).toFixed(2)}</div>
                                            <div>Final: ${(primaryVendor?.pricing?.finalGrandTotal || totalValue).toFixed(2)}</div>
                                        </div>
                                    </div>

                                    {/* ✅ 10. UPDATED: Actions Cell with dynamic buttons */}
                                    <div className="submission-cell actions">
                                        {entry.submissionStatus === 'submitted' ? (
                                            <div className="submitted-actions">
                                                <button
                                                    className="btn-review btn-submitted"
                                                    onClick={() => handleReviewEntry(entry.id)}
                                                    title="View Submission"
                                                >
                                                    📋 Submitted
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDelete(entry.id)}
                                                    title="Delete Entry"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ) : entry.submissionStatus === 'processing' ? (
                                            <button
                                                className="btn-review btn-processing"
                                                onClick={() => handleReviewEntry(entry.id)}
                                                title="Continue Processing"
                                            >
                                                ⚙️ Processing
                                            </button>
                                        ) : entry.isStarted ? (
                                            <button
                                                className="btn-review btn-started"
                                                onClick={() => handleReviewEntry(entry.id)}
                                                title="Continue Review"
                                            >
                                                📝 Started
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-review"
                                                onClick={() => handleReviewEntry(entry.id)}
                                                title="Start Review"
                                            >
                                                🚀 Start
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Navigation */}
            <div className="approval-navigation">
                <button
                    className="btn-secondary"
                    onClick={() => navigate('/approval')}
                >
                    ← Back to Approval
                </button>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/execution')}
                >
                    Proceed to Execution →
                </button>
            </div>
        </div>
    );
};

export default Submission;