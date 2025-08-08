import React, { useState, useCallback, useEffect, memo } from 'react';
import IndexedDBManager from '../../utils/IndexedDBManager';
import '../../styles/AttachmentManager.css';

const AttachmentManager = memo(({ vendorId, qmsId, onAttachmentsChange }) => {
    const [attachments, setAttachments] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    // Load attachments on component mount
    useEffect(() => {
        loadAttachments();
    }, [vendorId, qmsId]);

    const loadAttachments = async () => {
        try {
            const vendorAttachments = await IndexedDBManager.getAttachmentsByVendor(vendorId, qmsId);
            setAttachments(vendorAttachments);
            onAttachmentsChange(vendorAttachments.map(att => att.id));
        } catch (error) {
            console.error('Error loading attachments:', error);
        }
    };

    const validateFile = (file) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain'
        ];

        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Invalid file type: ${file.type}`);
        }

        if (file.size > maxSize) {
            throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`);
        }

        return true;
    };

    const processFile = async (file) => {
        let processedFile = file;

        // Compress images
        if (file.type.startsWith('image/')) {
            processedFile = await IndexedDBManager.compressImage(file);
        }

        return processedFile;
    };

    const uploadFiles = useCallback(async (files) => {
        setUploading(true);
        const fileArray = Array.from(files);
        const newAttachments = [];

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];

            try {
                // Validate file
                validateFile(file);

                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { progress: 0, status: 'processing' }
                }));

                // Process file (compress if image)
                const processedFile = await processFile(file);

                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { progress: 50, status: 'saving' }
                }));

                // Create attachment object
                const attachment = {
                    id: IndexedDBManager.generateAttachmentId(),
                    vendorId,
                    qmsId,
                    name: file.name,
                    type: file.type,
                    size: processedFile.size,
                    originalSize: file.size,
                    file: processedFile,
                    uploadedAt: new Date(),
                    uploadedBy: 'MFakheem'
                };

                // Save to IndexedDB
                await IndexedDBManager.saveAttachment(attachment);
                newAttachments.push(attachment);

                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { progress: 100, status: 'complete' }
                }));

            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { progress: 0, status: 'error', error: error.message }
                }));
            }
        }

        // Update state
        setAttachments(prev => [...prev, ...newAttachments]);
        onAttachmentsChange([...attachments, ...newAttachments].map(att => att.id));

        // Clear progress after delay
        setTimeout(() => {
            setUploadProgress({});
            setUploading(false);
        }, 2000);

    }, [vendorId, qmsId, attachments, onAttachmentsChange]);

    const handleFileSelect = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            uploadFiles(files);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragOver(false);
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            uploadFiles(files);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const removeAttachment = async (attachmentId) => {
        try {
            await IndexedDBManager.deleteAttachment(attachmentId);
            const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
            setAttachments(updatedAttachments);
            onAttachmentsChange(updatedAttachments.map(att => att.id));
        } catch (error) {
            console.error('Error removing attachment:', error);
        }
    };

    const viewAttachment = async (attachmentId) => {
        try {
            const attachment = await IndexedDBManager.getAttachment(attachmentId);
            if (attachment) {
                const url = URL.createObjectURL(attachment.file);
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Error viewing attachment:', error);
        }
    };

    const downloadAttachment = async (attachmentId) => {
        try {
            const attachment = await IndexedDBManager.getAttachment(attachmentId);
            if (attachment) {
                const url = URL.createObjectURL(attachment.file);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.name;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading attachment:', error);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('image')) return '🖼️';
        if (type.includes('text')) return '📃';
        return '📎';
    };

    return (
        <div className="attachment-manager">
            <label className="attachment-label">Attachments:</label>

            {/* Upload Area */}
            <div
                className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <div className="upload-content">
                    <div className="upload-icon">📎</div>
                    <p>Drag & drop files here or click to browse</p>
                    <p className="upload-hint">
                        Supported: PDF, Excel, Word, Images (max 10MB each)
                    </p>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="file-input"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                    />
                    <button
                        type="button"
                        className="browse-btn"
                        onClick={() => document.querySelector('.file-input').click()}
                    >
                        Browse Files
                    </button>
                </div>
            </div>

            {/* Upload Progress */}
            {uploading && Object.keys(uploadProgress).length > 0 && (
                <div className="upload-progress">
                    <h4>Upload Progress:</h4>
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="progress-item">
                            <span className="file-name">{fileName}</span>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${progress.status}`}
                                    style={{ width: `${progress.progress}%` }}
                                ></div>
                            </div>
                            <span className={`status ${progress.status}`}>
                                {progress.status === 'error' ? progress.error : progress.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="attachments-list">
                    <h4>Uploaded Files ({attachments.length}):</h4>
                    <div className="attachments-grid">
                        {attachments.map((attachment) => (
                            <div key={attachment.id} className="attachment-item">
                                <div className="attachment-info">
                                    <span className="file-icon">
                                        {getFileIcon(attachment.type)}
                                    </span>
                                    <div className="file-details">
                                        <span className="file-name" title={attachment.name}>
                                            {attachment.name}
                                        </span>
                                        <span className="file-size">
                                            {formatFileSize(attachment.size)}
                                            {attachment.originalSize !== attachment.size &&
                                                ` (compressed from ${formatFileSize(attachment.originalSize)})`
                                            }
                                        </span>
                                    </div>
                                </div>
                                <div className="attachment-actions">
                                    <button
                                        type="button"
                                        className="action-btn view-btn"
                                        onClick={() => viewAttachment(attachment.id)}
                                        title="View file"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        type="button"
                                        className="action-btn download-btn"
                                        onClick={() => downloadAttachment(attachment.id)}
                                        title="Download file"
                                    >
                                        ⬇️
                                    </button>
                                    <button
                                        type="button"
                                        className="action-btn remove-btn"
                                        onClick={() => removeAttachment(attachment.id)}
                                        title="Remove file"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Statistics */}
            {attachments.length > 0 && (
                <div className="attachment-stats">
                    <span>Total: {attachments.length} files</span>
                    <span>Size: {formatFileSize(attachments.reduce((sum, att) => sum + att.size, 0))}</span>
                </div>
            )}
        </div>
    );
});

export default AttachmentManager;