import React, { useState, useEffect } from 'react';

const AddUser = ({ onAddUser, onCancel, editingUser }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        department: '',
        status: 'Active'
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roles = ['Admin', 'Manager', 'Employee', 'Viewer'];
    const departments = [
        'IT Department',
        'Human Resources',
        'Finance',
        'Marketing',
        'Operations',
        'Sales',
        'Legal',
        'Research & Development'
    ];
    const statuses = ['Active', 'Inactive'];

    useEffect(() => {
        if (editingUser) {
            setFormData({
                name: editingUser.name || '',
                email: editingUser.email || '',
                password: editingUser.password || '',
                role: editingUser.role || '',
                department: editingUser.department || '',
                status: editingUser.status || 'Active'
            });
        }
    }, [editingUser]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.role) {
            newErrors.role = 'Please select a role';
        }

        if (!formData.department) {
            newErrors.department = 'Please select a department';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        onAddUser(formData);
        setIsSubmitting(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <div className="add-user-container">
            {/* Header Section */}
            <div className="add-user-header">
                <div className="header-left">
                    <h1 className="header-title">
                        {editingUser ? 'Edit User' : 'Add New User'}
                    </h1>
                    <div className="header-info">
                        <span className="info-text">Current User: MFakheem</span>
                        <span className="info-divider">|</span>
                        <span className="info-text">Date: 2025-07-28 20:18:02</span>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="close-button"
                    title="Close"
                >
                    ✕
                </button>
            </div>

            {/* Form Section */}
            <div className="add-user-form-container">
                <form onSubmit={handleSubmit} className="add-user-form">
                    {/* User Information Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">👤</div>
                            <h2 className="section-title">User Information</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label required">FULL NAME</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    className={`form-input ${errors.name ? 'error' : ''}`}
                                />
                                {errors.name && <div className="error-message">{errors.name}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label required">EMAIL ADDRESS</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                    className={`form-input ${errors.email ? 'error' : ''}`}
                                />
                                {errors.email && <div className="error-message">{errors.email}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label required">PASSWORD</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    className={`form-input ${errors.password ? 'error' : ''}`}
                                />
                                {errors.password && <div className="error-message">{errors.password}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Role & Department Section */}
                    <div className="form-section">
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label required">ROLE</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={`form-select ${errors.role ? 'error' : ''}`}
                                >
                                    <option value="">Select a role</option>
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                {errors.role && <div className="error-message">{errors.role}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label required">DEPARTMENT</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className={`form-select ${errors.department ? 'error' : ''}`}
                                >
                                    <option value="">Select a department</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                                {errors.department && <div className="error-message">{errors.department}</div>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">STATUS</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-cancel"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner"></span>
                                    {editingUser ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">➕</span>
                                    {editingUser ? 'Update User' : 'Add User'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUser;