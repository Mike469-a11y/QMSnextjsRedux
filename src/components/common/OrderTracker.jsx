import React, { useState, useEffect, useRef } from 'react';
import IndexedDBManager from '../../utils/IndexedDBManager';
import '../../styles/OrderTracker.css';

const OrderTracker = ({ onBack, currentUser, currentDateTime }) => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        orderDate: new Date().toISOString().split('T')[0],
        attentionCategory: '',
        qmsId: '',
        customer: '',
        customerPO: '',
        qmsPO: '',
        qmsInvoice: '',
        itemDescription: '',
        vendorName: '',
        customerName: '',
        email: '',
        sourcedBy: '',
        poAmount: '',
        paymentPlanFakheem: '',
        paymentApprovalAkmal: '',
        qmsCost: '',
        profit: '',
        paymentMethod: '',
        status: 'initial-coord',
        qmsInvoiceDate: '',
        expectedReturnDate: '',
        customerPaymentMode: '',
        creditDebit: '',
        creditNotes: '',
        grossProfitTotaling: '',
        netProfitFromPOs: '',
        notes: '',
        fareedAkmalComments: '',
        transactionCompletionDays: ''
    });
    const [formErrors, setFormErrors] = useState({});

    // Status Categories
    const statusCategories = [
        { id: 'initial-coord', name: 'Initial Coord with Supplier For Shipment', color: '#4299e1' },
        { id: 'customer-po-received', name: 'Customer PO Received', color: '#48bb78' },
        { id: 'vendor-assessment', name: 'Vendor Assessment', color: '#ed8936' },
        { id: 're-sourcing', name: 'Re-Sourcing', color: '#9f7aea' },
        { id: 'qms-po-sent', name: 'QMS PO sent', color: '#38b2ac' },
        { id: 'payment-to-supplier', name: 'Payment to Supplier', color: '#f56565' },
        { id: 'shipped-from-supplier', name: 'Shipped From Supplier', color: '#4299e1' },
        { id: 'in-transit', name: 'In Transit', color: '#ed8936' },
        { id: 'shipment-received-customer', name: 'Shipment Received Customer', color: '#48bb78' },
        { id: 'qms-invoice-to-customer', name: 'QMS Invoice To Customer', color: '#9f7aea' },
        { id: 'order-completed', name: 'Order Completed', color: '#38a169' },
        { id: 'other', name: 'Other', color: '#718096' },
        { id: 'cancelled', name: 'Cancelled', color: '#e53e3e' }
    ];

    // Dropdown Options
    const dropdownOptions = {
        attentionCategory: [
            'OK', 'Follow Up', 'Completed', 'Closed', 'Cancelled', 'In Process', 'PO Recieved', 'Cheque Awaited'
        ],
        paymentPlanFakheem: [
            'Due', 'Paid', 'Due Today', 'PO Recieved.', 'Anticipated PO', 'Due Tomorrow', 'Due this week', 'Cancelled', 'On Hold'
        ],
        paymentApprovalAkmal: [
            'Discuss', 'Hold', 'Approved', 'Not Approved', 'Other'
        ],
        paymentMethod: [
            'CC-Community Trust Bank', 'Chase Business CC-9869', 'Chase Personal CC-0597', 'AMEX Line of Credit', 'CC-5364', 'ACH', 'WIRE', 'NET', 'N/A'
        ],
        customerPaymentMode: [
            'Cheque', 'Wire', 'ACH', 'Cancelled'
        ]
    };

    // Helper function to get input field CSS class based on field name
    const getInputFieldClass = (fieldName) => {
        const skyBlueFields = [
            'attentionCategory', 'paymentApprovalAkmal', 'creditDebit', 'creditNotes', 'grossProfitTotaling', 'netProfitFromPOs'
        ];
        const lightGreyFields = ['transactionCompletionDays'];

        if (skyBlueFields.includes(fieldName)) {
            return 'order-tracker-form-input sky-blue';
        } else if (lightGreyFields.includes(fieldName)) {
            return 'order-tracker-form-input light-grey';
        } else {
            return 'order-tracker-form-input';
        }
    };

    // Initialize IndexedDB on component mount
    useEffect(() => {
        const initDB = async () => {
            try {
                await IndexedDBManager.initDB();
                console.log('✅ IndexedDB initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize IndexedDB:', error);
            }
        };
        initDB();
        loadOrders();
    }, []);

    // Load attachments when editing/viewing an order
    useEffect(() => {
        if ((editingOrder || viewingOrder) && (editingOrder?.qmsId || viewingOrder?.qmsId)) {
            loadAttachments(editingOrder?.qmsId || viewingOrder?.qmsId);
        }
    }, [editingOrder, viewingOrder]);

    // Load orders from localStorage
    const loadOrders = () => {
        try {
            const storedOrders = localStorage.getItem('executionOrders');
            if (storedOrders) {
                setOrders(JSON.parse(storedOrders));
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    };

    const saveOrders = (updatedOrders) => {
        setOrders(updatedOrders);
        localStorage.setItem('executionOrders', JSON.stringify(updatedOrders));
    };

    // Load attachments with better error handling
    const loadAttachments = async (qmsId) => {
        if (!qmsId || qmsId.trim() === '') {
            console.log('No QMS ID provided, clearing attachments');
            setAttachments([]);
            return;
        }

        try {
            console.log('🔍 Loading attachments for QMS ID:', qmsId);
            const attachmentData = await IndexedDBManager.getAttachmentsByVendor('', qmsId.trim());
            console.log('📎 Found attachments:', attachmentData?.length || 0);
            setAttachments(attachmentData || []);
        } catch (error) {
            console.error('❌ Error loading attachments:', error);
            setAttachments([]);
        }
    };

    // Handle file selection
    const handleFileSelect = (files) => {
        Array.from(files).forEach(file => {
            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert(`❌ File "${file.name}" is too large. Maximum size is 10MB.`);
                return;
            }

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert(`❌ File type "${file.type}" is not supported. Please use PDF, Excel, Word, or Image files.`);
                return;
            }

            uploadFile(file);
        });
    };

    // Upload file to IndexedDB with better error handling
    const uploadFile = async (file) => {
        try {
            // Check if QMS ID exists
            const qmsId = formData.qmsId || editingOrder?.qmsId;
            if (!qmsId || qmsId.trim() === '') {
                alert('⚠️ Please enter a QMS ID before uploading files.');
                return;
            }

            console.log('📤 Uploading file:', file.name, 'for QMS ID:', qmsId);

            let fileToStore = file;

            // Compress images if needed
            if (file.type.startsWith('image/')) {
                console.log('🖼️ Compressing image:', file.name);
                fileToStore = await IndexedDBManager.compressImage(file, 1920, 0.8);
                console.log('✅ Image compressed from', formatFileSize(file.size), 'to', formatFileSize(fileToStore.size));
            }

            // Convert file to ArrayBuffer for storage
            const arrayBuffer = await fileToStore.arrayBuffer();

            const attachment = {
                id: IndexedDBManager.generateAttachmentId(),
                qmsId: qmsId.trim(),
                vendorId: (formData.vendorName || editingOrder?.vendorName || '').trim(),
                fileName: file.name,
                fileType: file.type,
                fileSize: fileToStore.size,
                fileData: arrayBuffer,
                uploadedAt: new Date().toISOString(),
                uploadedBy: currentUser || 'Mike469-a11y'
            };

            console.log('💾 Saving attachment to IndexedDB:', attachment.id);
            await IndexedDBManager.saveAttachment(attachment);

            // Reload attachments
            console.log('🔄 Reloading attachments for QMS ID:', qmsId);
            await loadAttachments(qmsId);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            console.log(`✅ File "${file.name}" uploaded successfully`);

        } catch (error) {
            console.error('❌ Error uploading file:', error);
            alert(`❌ Failed to upload file "${file.name}". Error: ${error.message}`);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    // Handle file input change
    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files) {
            handleFileSelect(files);
        }
    };

    // Delete attachment
    const deleteAttachment = async (attachmentId) => {
        if (window.confirm('🗑️ Are you sure you want to delete this attachment?')) {
            try {
                await IndexedDBManager.deleteAttachment(attachmentId);
                await loadAttachments(formData.qmsId || editingOrder?.qmsId);
                console.log('✅ Attachment deleted successfully');
            } catch (error) {
                console.error('❌ Error deleting attachment:', error);
                alert('❌ Failed to delete attachment. Please try again.');
            }
        }
    };

    // ✅ FIXED: Download attachment with proper error handling
    const downloadAttachment = async (attachmentId, fileName) => {
        try {
            console.log('📥 Downloading attachment:', attachmentId);
            const attachment = await IndexedDBManager.getAttachment(attachmentId);
            if (attachment && attachment.fileData) {
                const blob = new Blob([attachment.fileData], { type: attachment.fileType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log('✅ File downloaded successfully:', fileName);
            } else {
                alert('❌ File not found or corrupted.');
            }
        } catch (error) {
            console.error('❌ Error downloading attachment:', error);
            alert('❌ Failed to download attachment. Please try again.');
        }
    };

    // ✅ FIXED: View attachment with proper PDF handling
    const viewAttachment = async (attachmentId) => {
        try {
            console.log('👁️ Viewing attachment:', attachmentId);
            const attachment = await IndexedDBManager.getAttachment(attachmentId);
            if (attachment && attachment.fileData) {
                const blob = new Blob([attachment.fileData], { type: attachment.fileType });
                const url = URL.createObjectURL(blob);

                // Open in new window
                const newWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
                if (newWindow) {
                    newWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>${attachment.fileName}</title>
                            <style>body { margin: 0; padding: 0; }</style>
                        </head>
                        <body>
                            <embed src="${url}" type="${attachment.fileType}" width="100%" height="100%">
                        </body>
                        </html>
                    `);
                    setTimeout(() => URL.revokeObjectURL(url), 30000);
                } else {
                    alert('❌ Popup blocked. Please allow popups and try again.');
                    URL.revokeObjectURL(url);
                }
            } else {
                alert('❌ File not found or corrupted.');
            }
        } catch (error) {
            console.error('❌ Error viewing attachment:', error);
            alert('❌ Failed to view attachment. Please try again.');
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get file icon
    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('image')) return '🖼️';
        return '📎';
    };

    // Get count for each status
    const getStatusCount = (statusId) => {
        if (statusId === 'all') return orders.length;
        return orders.filter(order => order.status === statusId).length;
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = !searchTerm ||
            order.qmsId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.itemDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }

        // If QMS ID changes, reload attachments
        if (field === 'qmsId' && value.trim()) {
            loadAttachments(value.trim());
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};
        const requiredFields = ['qmsId', 'customer', 'itemDescription', 'vendorName'];

        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                errors[field] = 'This field is required';
            }
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = () => {
        if (!validateForm()) return;

        const orderData = {
            ...formData,
            id: editingOrder ? editingOrder.id : Date.now().toString(),
            createdAt: editingOrder ? editingOrder.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        let updatedOrders;
        if (editingOrder) {
            updatedOrders = orders.map(order =>
                order.id === editingOrder.id ? orderData : order
            );
        } else {
            updatedOrders = [...orders, orderData];
        }

        saveOrders(updatedOrders);
        handleCloseModal();
    };

    // Handle edit order
    const handleEditOrder = (order) => {
        setEditingOrder(order);
        setFormData(order);
        setShowModal(true);
    };

    // Handle view order
    const handleViewOrder = (order) => {
        setViewingOrder(order);
        setShowViewModal(true);
    };

    // Handle delete order
    const handleDeleteOrder = (orderId) => {
        if (window.confirm('🗑️ Are you sure you want to delete this order?')) {
            const updatedOrders = orders.filter(order => order.id !== orderId);
            saveOrders(updatedOrders);
        }
    };

    // Handle close modal
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOrder(null);
        setAttachments([]);
        setFormData({
            orderDate: new Date().toISOString().split('T')[0],
            attentionCategory: '', qmsId: '', customer: '', customerPO: '', qmsPO: '', qmsInvoice: '',
            itemDescription: '', vendorName: '', customerName: '', email: '', sourcedBy: '', poAmount: '',
            paymentPlanFakheem: '', paymentApprovalAkmal: '', qmsCost: '', profit: '', paymentMethod: '',
            status: 'initial-coord', qmsInvoiceDate: '', expectedReturnDate: '', customerPaymentMode: '',
            creditDebit: '', creditNotes: '', grossProfitTotaling: '', netProfitFromPOs: '',
            notes: '', fareedAkmalComments: '', transactionCompletionDays: ''
        });
        setFormErrors({});
    };

    // Handle close view modal
    const handleCloseViewModal = () => {
        setShowViewModal(false);
        setViewingOrder(null);
        setAttachments([]);
    };

    // Helper function to format field values for display
    const formatFieldValue = (value, fieldName = '') => {
        if (!value && value !== 0) return 'Not specified';

        if (fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('cost') || fieldName.toLowerCase().includes('profit')) {
            return `$${value}`;
        }

        if (fieldName.toLowerCase().includes('date')) {
            return new Date(value).toLocaleDateString();
        }

        return value;
    };

    return (
        <div className="order-tracker-container">
            {/* Header */}
            <div className="order-tracker-header">
                <div className="order-tracker-header-left">
                    <button className="order-tracker-back-btn" onClick={onBack}>
                        ← Back to Execution
                    </button>
                    <div className="order-tracker-title-section">
                        <h1>📋 Order Tracker</h1>
                        <p>Track orders through 13 status stages</p>
                    </div>
                </div>
                <div className="order-tracker-header-right">
                    <div className="order-tracker-user-info">
                        <span>Current User: <strong>{currentUser || 'Mike469-a11y'}</strong></span>
                        <span className="order-tracker-current-time">{currentDateTime || '2025-08-03 00:37:57'}</span>
                    </div>
                </div>
            </div>

            {/* Search & Stats Section */}
            <div className="order-tracker-controls">
                <div className="order-tracker-stats-search">
                    <div className="order-tracker-total-entries">
                        <span className="order-tracker-total-number">{getStatusCount('all')}</span>
                        <span className="order-tracker-total-label">Total Entries</span>
                    </div>
                    <div className="order-tracker-search-container">
                        <input
                            type="text"
                            placeholder="Search by QMS ID, Customer, Vendor, Item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="order-tracker-search-input"
                        />
                        <div className="order-tracker-search-icon">🔍</div>
                    </div>
                </div>
            </div>

            {/* Status Categories Grid */}
            <div className="order-tracker-status-categories">
                <h2>📊 Order Status Categories</h2>
                <div className="order-tracker-categories-grid">
                    <div
                        className={`order-tracker-status-card ${selectedStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedStatus('all')}
                        style={{ borderColor: '#667eea' }}
                    >
                        <div className="order-tracker-status-icon" style={{ backgroundColor: '#667eea' }}>📊</div>
                        <div className="order-tracker-status-content">
                            <div className="order-tracker-status-name">All Orders</div>
                            <div className="order-tracker-status-count">{getStatusCount('all')}</div>
                        </div>
                    </div>

                    {statusCategories.map((status) => (
                        <div
                            key={status.id}
                            className={`order-tracker-status-card ${selectedStatus === status.id ? 'active' : ''}`}
                            onClick={() => setSelectedStatus(status.id)}
                            style={{ borderColor: status.color }}
                        >
                            <div className="order-tracker-status-icon" style={{ backgroundColor: status.color }}>
                                {status.id === 'initial-coord' && '🚀'}
                                {status.id === 'customer-po-received' && '📋'}
                                {status.id === 'vendor-assessment' && '🔍'}
                                {status.id === 're-sourcing' && '🔄'}
                                {status.id === 'qms-po-sent' && '📤'}
                                {status.id === 'payment-to-supplier' && '💳'}
                                {status.id === 'shipped-from-supplier' && '📦'}
                                {status.id === 'in-transit' && '🚛'}
                                {status.id === 'shipment-received-customer' && '📥'}
                                {status.id === 'qms-invoice-to-customer' && '🧾'}
                                {status.id === 'order-completed' && '✅'}
                                {status.id === 'other' && '📋'}
                                {status.id === 'cancelled' && '❌'}
                            </div>
                            <div className="order-tracker-status-content">
                                <div className="order-tracker-status-name">{status.name}</div>
                                <div className="order-tracker-status-count">{getStatusCount(status.id)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Orders List/Table */}
            <div className="order-tracker-orders-section">
                <div className="order-tracker-orders-header">
                    <h2>
                        {selectedStatus === 'all'
                            ? `📋 All Orders (${filteredOrders.length})`
                            : `📋 ${statusCategories.find(s => s.id === selectedStatus)?.name} (${filteredOrders.length})`
                        }
                    </h2>
                    <button className="order-tracker-add-order-btn" onClick={() => setShowModal(true)}>
                        ➕ Add New Order
                    </button>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="order-tracker-no-orders">
                        <div className="order-tracker-no-orders-icon">📦</div>
                        <h3>No Orders Found</h3>
                        <p>
                            {searchTerm
                                ? `No orders match your search "${searchTerm}"`
                                : selectedStatus === 'all'
                                    ? 'No orders available. Click "Add New Order" to get started.'
                                    : `No orders with status "${statusCategories.find(s => s.id === selectedStatus)?.name}"`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="order-tracker-orders-table">
                        <div className="order-tracker-table-header">
                            <div className="order-tracker-header-cell">SR</div>
                            <div className="order-tracker-header-cell">QMS ID</div>
                            <div className="order-tracker-header-cell">Customer</div>
                            <div className="order-tracker-header-cell">Item Description</div>
                            <div className="order-tracker-header-cell">Vendor</div>
                            <div className="order-tracker-header-cell">Status</div>
                            <div className="order-tracker-header-cell">Order Date</div>
                            <div className="order-tracker-header-cell">PO Amount</div>
                            <div className="order-tracker-header-cell">QMS Cost</div>
                            <div className="order-tracker-header-cell">Profit</div>
                            <div className="order-tracker-header-cell">Actions</div>
                        </div>

                        {filteredOrders.map((order, index) => (
                            <div key={order.id} className="order-tracker-table-row">
                                <div className="order-tracker-cell order-tracker-sr">{index + 1}</div>
                                <div className="order-tracker-cell font-weight-bold">{order.qmsId}</div>
                                <div className="order-tracker-cell">{order.customer}</div>
                                <div className="order-tracker-cell">{order.itemDescription}</div>
                                <div className="order-tracker-cell">{order.vendorName}</div>
                                <div className="order-tracker-cell">
                                    <span
                                        className="order-tracker-status-badge"
                                        style={{
                                            backgroundColor: statusCategories.find(s => s.id === order.status)?.color || '#718096',
                                            color: 'white'
                                        }}
                                    >
                                        {statusCategories.find(s => s.id === order.status)?.name || 'Unknown'}
                                    </span>
                                </div>
                                <div className="order-tracker-cell">{order.orderDate}</div>
                                <div className="order-tracker-cell order-tracker-amount">${order.poAmount || '0'}</div>
                                <div className="order-tracker-cell order-tracker-amount">${order.qmsCost || '0'}</div>
                                <div className="order-tracker-cell order-tracker-amount">${order.profit || '0'}</div>
                                <div className="order-tracker-cell order-tracker-actions">
                                    <button
                                        className="order-tracker-edit-btn"
                                        title="Edit Order"
                                        onClick={() => handleEditOrder(order)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="order-tracker-view-btn"
                                        title="View Details"
                                        onClick={() => handleViewOrder(order)}
                                    >
                                        👁️
                                    </button>
                                    <button
                                        className="order-tracker-delete-btn"
                                        title="Delete Order"
                                        onClick={() => handleDeleteOrder(order.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* VIEW ORDER MODAL - READ-ONLY WITH ATTACHMENTS */}
            {showViewModal && viewingOrder && (
                <div className="order-tracker-modal-overlay" onClick={handleCloseViewModal}>
                    <div className="order-tracker-modal order-tracker-view-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="order-tracker-modal-header order-tracker-view-header">
                            <h2>👁️ View Order Details - {viewingOrder.qmsId}</h2>
                            <button className="order-tracker-modal-close" onClick={handleCloseViewModal}>✕</button>
                        </div>

                        <div className="order-tracker-modal-content">
                            <div className="order-tracker-view-grid">
                                {/* Basic Order Information */}
                                <div className="order-tracker-view-section">
                                    <h3>📋 Basic Order Information</h3>
                                    <div className="order-tracker-view-content">
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Order Date:</label>
                                                <span>{formatFieldValue(viewingOrder.orderDate, 'date')}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Attention Category:</label>
                                                <span>{formatFieldValue(viewingOrder.attentionCategory)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>QMS ID:</label>
                                                <span className="order-tracker-view-highlight">{formatFieldValue(viewingOrder.qmsId)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Customer:</label>
                                                <span className="order-tracker-view-highlight">{formatFieldValue(viewingOrder.customer)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Customer PO #:</label>
                                                <span>{formatFieldValue(viewingOrder.customerPO)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>QMS PO #:</label>
                                                <span>{formatFieldValue(viewingOrder.qmsPO)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>QMS Invoice #:</label>
                                                <span>{formatFieldValue(viewingOrder.qmsInvoice)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Item Description:</label>
                                                <span className="order-tracker-view-highlight">{formatFieldValue(viewingOrder.itemDescription)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Vendor Name:</label>
                                                <span className="order-tracker-view-highlight">{formatFieldValue(viewingOrder.vendorName)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Customer Name:</label>
                                                <span>{formatFieldValue(viewingOrder.customerName)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Email:</label>
                                                <span>{formatFieldValue(viewingOrder.email)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Sourced By:</label>
                                                <span>{formatFieldValue(viewingOrder.sourcedBy)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div className="order-tracker-view-section">
                                    <h3>💰 Financial Information</h3>
                                    <div className="order-tracker-view-content">
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>PO Amount:</label>
                                                <span className="order-tracker-view-amount">{formatFieldValue(viewingOrder.poAmount, 'amount')}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Payment Plan (Fakheem):</label>
                                                <span>{formatFieldValue(viewingOrder.paymentPlanFakheem)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Payment Approval (Initial Akmal):</label>
                                                <span>{formatFieldValue(viewingOrder.paymentApprovalAkmal)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>QMS Cost:</label>
                                                <span className="order-tracker-view-amount">{formatFieldValue(viewingOrder.qmsCost, 'cost')}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Profit:</label>
                                                <span className="order-tracker-view-profit">{formatFieldValue(viewingOrder.profit, 'profit')}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Payment Method:</label>
                                                <span>{formatFieldValue(viewingOrder.paymentMethod)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>QMS Invoice Date:</label>
                                                <span>{formatFieldValue(viewingOrder.qmsInvoiceDate, 'date')}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Expected Return Date:</label>
                                                <span>{formatFieldValue(viewingOrder.expectedReturnDate, 'date')}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Customer Payment Mode:</label>
                                                <span>{formatFieldValue(viewingOrder.customerPaymentMode)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Credit / Debit:</label>
                                                <span>{formatFieldValue(viewingOrder.creditDebit)}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Credit Notes:</label>
                                                <span>{formatFieldValue(viewingOrder.creditNotes)}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Gross Profit (GP) Totaling:</label>
                                                <span className="order-tracker-view-profit">{formatFieldValue(viewingOrder.grossProfitTotaling, 'profit')}</span>
                                            </div>
                                        </div>
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Net Profit From PO's:</label>
                                                <span className="order-tracker-view-profit">{formatFieldValue(viewingOrder.netProfitFromPOs, 'profit')}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Transaction Completion Time:</label>
                                                <span>{formatFieldValue(viewingOrder.transactionCompletionDays)} {viewingOrder.transactionCompletionDays ? 'days' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments Section in View Modal */}
                                {attachments.length > 0 && (
                                    <div className="order-tracker-view-section">
                                        <h3>📎 Attachments ({attachments.length})</h3>
                                        <div className="order-tracker-view-content">
                                            <div className="order-tracker-attachments-list">
                                                {attachments.map((attachment) => (
                                                    <div key={attachment.id} className="order-tracker-attachment-item">
                                                        <div className="order-tracker-attachment-info">
                                                            <span className="order-tracker-file-icon">
                                                                {getFileIcon(attachment.fileType)}
                                                            </span>
                                                            <div className="order-tracker-file-details">
                                                                <span className="order-tracker-file-name">{attachment.fileName}</span>
                                                                <span className="order-tracker-file-size">{formatFileSize(attachment.fileSize)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="order-tracker-attachment-actions">
                                                            <button
                                                                onClick={() => viewAttachment(attachment.id)}
                                                                className="order-tracker-attachment-view-btn"
                                                                title="View File"
                                                            >
                                                                👁️
                                                            </button>
                                                            <button
                                                                onClick={() => downloadAttachment(attachment.id, attachment.fileName)}
                                                                className="order-tracker-attachment-download-btn"
                                                                title="Download File"
                                                            >
                                                                📥
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="order-tracker-attachments-summary">
                                                <span>Total: {attachments.length} files</span>
                                                <span>Size: {formatFileSize(attachments.reduce((total, att) => total + att.fileSize, 0))}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Status & Tracking */}
                                <div className="order-tracker-view-section">
                                    <h3>📊 Status & Tracking</h3>
                                    <div className="order-tracker-view-content">
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field order-tracker-view-field-wide">
                                                <label>Current Status:</label>
                                                <span
                                                    className="order-tracker-view-status-badge"
                                                    style={{
                                                        backgroundColor: statusCategories.find(s => s.id === viewingOrder.status)?.color || '#718096'
                                                    }}
                                                >
                                                    {statusCategories.find(s => s.id === viewingOrder.status)?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                        {viewingOrder.notes && (
                                            <div className="order-tracker-view-row">
                                                <div className="order-tracker-view-field order-tracker-view-field-full">
                                                    <label>Notes:</label>
                                                    <div className="order-tracker-view-notes">{viewingOrder.notes}</div>
                                                </div>
                                            </div>
                                        )}
                                        {viewingOrder.fareedAkmalComments && (
                                            <div className="order-tracker-view-row">
                                                <div className="order-tracker-view-field order-tracker-view-field-full">
                                                    <label>Fareed Bhai / Akmal Comments:</label>
                                                    <div className="order-tracker-view-notes">{viewingOrder.fareedAkmalComments}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Metadata */}
                                <div className="order-tracker-view-section">
                                    <h3>📅 Order Metadata</h3>
                                    <div className="order-tracker-view-content">
                                        <div className="order-tracker-view-row">
                                            <div className="order-tracker-view-field">
                                                <label>Created At:</label>
                                                <span>{viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString() : 'Not available'}</span>
                                            </div>
                                            <div className="order-tracker-view-field">
                                                <label>Last Updated:</label>
                                                <span>{viewingOrder.updatedAt ? new Date(viewingOrder.updatedAt).toLocaleString() : 'Not available'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-tracker-modal-footer order-tracker-view-footer">
                            <button className="order-tracker-view-close-btn" onClick={handleCloseViewModal}>
                                Close
                            </button>
                            <button
                                className="order-tracker-view-edit-btn"
                                onClick={() => {
                                    handleCloseViewModal();
                                    handleEditOrder(viewingOrder);
                                }}
                            >
                                ✏️ Edit Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT/ADD ORDER MODAL - WITH ATTACHMENTS SECTION */}
            {showModal && (
                <div className="order-tracker-modal-overlay" onClick={handleCloseModal}>
                    <div className="order-tracker-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="order-tracker-modal-header">
                            <h2>{editingOrder ? '✏️ Edit Order' : '➕ Add New Order'}</h2>
                            <button className="order-tracker-modal-close" onClick={handleCloseModal}>✕</button>
                        </div>

                        <div className="order-tracker-modal-content">
                            <div className="order-tracker-form-grid">
                                {/* Basic Order Information Section */}
                                <div className="order-tracker-form-section">
                                    <h3>📋 Basic Order Information</h3>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Order Date *</label>
                                            <input
                                                type="date"
                                                value={formData.orderDate}
                                                onChange={(e) => handleInputChange('orderDate', e.target.value)}
                                                className={getInputFieldClass('orderDate')}
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Attention Category</label>
                                            <select
                                                value={formData.attentionCategory}
                                                onChange={(e) => handleInputChange('attentionCategory', e.target.value)}
                                                className={getInputFieldClass('attentionCategory')}
                                            >
                                                <option value="">Select Attention Category</option>
                                                {dropdownOptions.attentionCategory.map((option, index) => (
                                                    <option key={index} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>QMS ID *</label>
                                            <input
                                                type="text"
                                                value={formData.qmsId}
                                                onChange={(e) => handleInputChange('qmsId', e.target.value)}
                                                className={`${getInputFieldClass('qmsId')} ${formErrors.qmsId ? 'error' : ''}`}
                                                placeholder="Enter QMS ID"
                                            />
                                            {formErrors.qmsId && <span className="order-tracker-error">{formErrors.qmsId}</span>}
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Customer *</label>
                                            <input
                                                type="text"
                                                value={formData.customer}
                                                onChange={(e) => handleInputChange('customer', e.target.value)}
                                                className={`${getInputFieldClass('customer')} ${formErrors.customer ? 'error' : ''}`}
                                                placeholder="Enter customer"
                                            />
                                            {formErrors.customer && <span className="order-tracker-error">{formErrors.customer}</span>}
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Customer PO #</label>
                                            <input
                                                type="text"
                                                value={formData.customerPO}
                                                onChange={(e) => handleInputChange('customerPO', e.target.value)}
                                                className={getInputFieldClass('customerPO')}
                                                placeholder="Enter customer PO #"
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>QMS PO #</label>
                                            <input
                                                type="text"
                                                value={formData.qmsPO}
                                                onChange={(e) => handleInputChange('qmsPO', e.target.value)}
                                                className={getInputFieldClass('qmsPO')}
                                                placeholder="Enter QMS PO #"
                                            />
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>QMS Invoice #</label>
                                            <input
                                                type="text"
                                                value={formData.qmsInvoice}
                                                onChange={(e) => handleInputChange('qmsInvoice', e.target.value)}
                                                className={getInputFieldClass('qmsInvoice')}
                                                placeholder="Enter QMS invoice #"
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Item Description *</label>
                                            <input
                                                type="text"
                                                value={formData.itemDescription}
                                                onChange={(e) => handleInputChange('itemDescription', e.target.value)}
                                                className={`${getInputFieldClass('itemDescription')} ${formErrors.itemDescription ? 'error' : ''}`}
                                                placeholder="Enter item description"
                                            />
                                            {formErrors.itemDescription && <span className="order-tracker-error">{formErrors.itemDescription}</span>}
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Vendor Name *</label>
                                            <input
                                                type="text"
                                                value={formData.vendorName}
                                                onChange={(e) => handleInputChange('vendorName', e.target.value)}
                                                className={`${getInputFieldClass('vendorName')} ${formErrors.vendorName ? 'error' : ''}`}
                                                placeholder="Enter vendor name"
                                            />
                                            {formErrors.vendorName && <span className="order-tracker-error">{formErrors.vendorName}</span>}
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Customer Name</label>
                                            <input
                                                type="text"
                                                value={formData.customerName}
                                                onChange={(e) => handleInputChange('customerName', e.target.value)}
                                                className={getInputFieldClass('customerName')}
                                                placeholder="Enter customer name"
                                            />
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className={`${getInputFieldClass('email')} ${formErrors.email ? 'error' : ''}`}
                                                placeholder="Enter email address"
                                            />
                                            {formErrors.email && <span className="order-tracker-error">{formErrors.email}</span>}
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Sourced By</label>
                                            <input
                                                type="text"
                                                value={formData.sourcedBy}
                                                onChange={(e) => handleInputChange('sourcedBy', e.target.value)}
                                                className={getInputFieldClass('sourcedBy')}
                                                placeholder="Enter sourced by"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Information Section */}
                                <div className="order-tracker-form-section">
                                    <h3>💰 Financial Information</h3>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>PO Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.poAmount}
                                                onChange={(e) => handleInputChange('poAmount', e.target.value)}
                                                className={getInputFieldClass('poAmount')}
                                                placeholder="Enter PO amount"
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Payment Plan (Fakheem)</label>
                                            <select
                                                value={formData.paymentPlanFakheem}
                                                onChange={(e) => handleInputChange('paymentPlanFakheem', e.target.value)}
                                                className={getInputFieldClass('paymentPlanFakheem')}
                                            >
                                                <option value="">Select Payment Plan</option>
                                                {dropdownOptions.paymentPlanFakheem.map((option, index) => (
                                                    <option key={index} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Payment Approval (Initial Akmal)</label>
                                            <select
                                                value={formData.paymentApprovalAkmal}
                                                onChange={(e) => handleInputChange('paymentApprovalAkmal', e.target.value)}
                                                className={getInputFieldClass('paymentApprovalAkmal')}
                                            >
                                                <option value="">Select Payment Approval</option>
                                                {dropdownOptions.paymentApprovalAkmal.map((option, index) => (
                                                    <option key={index} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>QMS Cost</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.qmsCost}
                                                onChange={(e) => handleInputChange('qmsCost', e.target.value)}
                                                className={getInputFieldClass('qmsCost')}
                                                placeholder="Enter QMS cost"
                                            />
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Profit</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.profit}
                                                onChange={(e) => handleInputChange('profit', e.target.value)}
                                                className={getInputFieldClass('profit')}
                                                placeholder="Enter profit"
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Payment Method</label>
                                            <select
                                                value={formData.paymentMethod}
                                                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                                className={getInputFieldClass('paymentMethod')}
                                            >
                                                <option value="">Select Payment Method</option>
                                                {dropdownOptions.paymentMethod.map((option, index) => (
                                                    <option key={index} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>QMS Invoice Date</label>
                                            <input
                                                type="date"
                                                value={formData.qmsInvoiceDate}
                                                onChange={(e) => handleInputChange('qmsInvoiceDate', e.target.value)}
                                                className={getInputFieldClass('qmsInvoiceDate')}
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Expected Return Date</label>
                                            <input
                                                type="date"
                                                value={formData.expectedReturnDate}
                                                onChange={(e) => handleInputChange('expectedReturnDate', e.target.value)}
                                                className={getInputFieldClass('expectedReturnDate')}
                                            />
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Customer Payment Mode</label>
                                            <select
                                                value={formData.customerPaymentMode}
                                                onChange={(e) => handleInputChange('customerPaymentMode', e.target.value)}
                                                className={getInputFieldClass('customerPaymentMode')}
                                            >
                                                <option value="">Select Customer Payment Mode</option>
                                                {dropdownOptions.customerPaymentMode.map((option, index) => (
                                                    <option key={index} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Credit / Debit</label>
                                            <input
                                                type="text"
                                                value={formData.creditDebit}
                                                onChange={(e) => handleInputChange('creditDebit', e.target.value)}
                                                className={getInputFieldClass('creditDebit')}
                                                placeholder="Enter credit or debit"
                                            />
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Credit Notes</label>
                                            <input
                                                type="text"
                                                value={formData.creditNotes}
                                                onChange={(e) => handleInputChange('creditNotes', e.target.value)}
                                                className={getInputFieldClass('creditNotes')}
                                                placeholder="Enter credit notes"
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Gross Profit (GP) Totaling</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.grossProfitTotaling}
                                                onChange={(e) => handleInputChange('grossProfitTotaling', e.target.value)}
                                                className={getInputFieldClass('grossProfitTotaling')}
                                                placeholder="Enter gross profit totaling"
                                            />
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Net Profit From PO's</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.netProfitFromPOs}
                                                onChange={(e) => handleInputChange('netProfitFromPOs', e.target.value)}
                                                className={getInputFieldClass('netProfitFromPOs')}
                                                placeholder="Enter net profit from PO's"
                                            />
                                        </div>
                                        <div className="order-tracker-form-group">
                                            <label>Transaction Completion Time (Days)</label>
                                            <input
                                                type="number"
                                                value={formData.transactionCompletionDays}
                                                onChange={(e) => handleInputChange('transactionCompletionDays', e.target.value)}
                                                className={getInputFieldClass('transactionCompletionDays')}
                                                placeholder="Enter completion days"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments Section */}
                                <div className="order-tracker-form-section">
                                    <h3>📎 Attachments</h3>

                                    {/* Debug Info */}
                                    {(editingOrder || formData.qmsId) && (
                                        <div style={{
                                            background: '#f0f9ff',
                                            border: '1px solid #0ea5e9',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            marginBottom: '12px'
                                        }}>
                                            <strong>📋 QMS ID:</strong> "{formData.qmsId || editingOrder?.qmsId || 'EMPTY'}"
                                            {attachments.length > 0 && ` | 📎 ${attachments.length} attachments loaded`}
                                        </div>
                                    )}

                                    {/* File Upload Area */}
                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group full-width">
                                            {(formData.qmsId || editingOrder?.qmsId) ? (
                                                <div
                                                    className={`order-tracker-upload-area ${isDragging ? 'dragging' : ''}`}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <div className="order-tracker-upload-icon">📎</div>
                                                    <div className="order-tracker-upload-text">
                                                        Drag & drop files here or click to browse
                                                    </div>
                                                    <div className="order-tracker-upload-subtext">
                                                        Supported: PDF, Excel, Word, Images (max 10MB each)
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="order-tracker-browse-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            fileInputRef.current?.click();
                                                        }}
                                                    >
                                                        Browse Files
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="order-tracker-upload-disabled">
                                                    <div className="order-tracker-upload-icon" style={{ opacity: 0.5 }}>📎</div>
                                                    <div className="order-tracker-upload-text" style={{ color: '#6b7280' }}>
                                                        Please enter a QMS ID first to upload files
                                                    </div>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.gif"
                                                onChange={handleFileInputChange}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Uploaded Files List */}
                                    {attachments.length > 0 && (
                                        <div className="order-tracker-form-row">
                                            <div className="order-tracker-form-group full-width">
                                                <label>Uploaded Files ({attachments.length}):</label>
                                                <div className="order-tracker-attachments-list">
                                                    {attachments.map((attachment) => (
                                                        <div key={attachment.id} className="order-tracker-attachment-item">
                                                            <div className="order-tracker-attachment-info">
                                                                <span className="order-tracker-file-icon">
                                                                    {getFileIcon(attachment.fileType)}
                                                                </span>
                                                                <div className="order-tracker-file-details">
                                                                    <span className="order-tracker-file-name">{attachment.fileName}</span>
                                                                    <span className="order-tracker-file-size">{formatFileSize(attachment.fileSize)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="order-tracker-attachment-actions">
                                                                <button
                                                                    onClick={() => viewAttachment(attachment.id)}
                                                                    className="order-tracker-attachment-view-btn"
                                                                    title="View File"
                                                                >
                                                                    👁️
                                                                </button>
                                                                <button
                                                                    onClick={() => downloadAttachment(attachment.id, attachment.fileName)}
                                                                    className="order-tracker-attachment-download-btn"
                                                                    title="Download File"
                                                                >
                                                                    📥
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteAttachment(attachment.id)}
                                                                    className="order-tracker-attachment-delete-btn"
                                                                    title="Delete File"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="order-tracker-attachments-summary">
                                                    <span>Total: {attachments.length} files</span>
                                                    <span>Size: {formatFileSize(attachments.reduce((total, att) => total + att.fileSize, 0))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Status & Tracking Section */}
                                <div className="order-tracker-form-section">
                                    <h3>📊 Status & Tracking</h3>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group">
                                            <label>Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => handleInputChange('status', e.target.value)}
                                                className={getInputFieldClass('status')}
                                            >
                                                {statusCategories.map(status => (
                                                    <option key={status.id} value={status.id}>
                                                        {status.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group full-width">
                                            <label>Notes</label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                                className="order-tracker-form-textarea"
                                                placeholder="Enter notes..."
                                                rows="4"
                                            />
                                        </div>
                                    </div>

                                    <div className="order-tracker-form-row">
                                        <div className="order-tracker-form-group full-width">
                                            <label>Fareed Bhai / Akmal Comments</label>
                                            <textarea
                                                value={formData.fareedAkmalComments}
                                                onChange={(e) => handleInputChange('fareedAkmalComments', e.target.value)}
                                                className="order-tracker-form-textarea"
                                                placeholder="Enter comments..."
                                                rows="4"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-tracker-modal-footer">
                            <button className="order-tracker-cancel-btn" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button className="order-tracker-save-btn" onClick={handleSubmit}>
                                {editingOrder ? 'Update Order' : 'Add Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTracker;