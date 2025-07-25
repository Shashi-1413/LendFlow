import React, { useState } from 'react';
import { customerAPI } from '../services/api';

const CustomerForm = ({ onSuccess, onCancel, onNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    try {
      const newErrors = {};

      // Name validation
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      // Email validation
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }

      // Phone validation
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      // Address validation
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error('Error validating form:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setErrors({});

      const trimmedData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim()
      };

      await customerAPI.create(trimmedData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to create customer: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    try {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    } catch (error) {
      console.error('Error handling form change:', error);
    }
  };

  const handleCancel = () => {
    try {
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('Error handling cancel:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
        <button
          onClick={handleCancel}
          className="btn-secondary"
          disabled={loading}
        >
          ← Back to Customers
        </button>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`input-field ${errors.name ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="Enter customer's full name"
              disabled={loading}
            />
            {errors.name && (
              <p className="error-message">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`input-field ${errors.email ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="customer@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="error-message">{errors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`input-field ${errors.phone ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
            {errors.phone && (
              <p className="error-message">{errors.phone}</p>
            )}
          </div>

          {/* Address Field */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              id="address"
              rows={3}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={`input-field ${errors.address ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="Enter complete address"
              disabled={loading}
            />
            {errors.address && (
              <p className="error-message">{errors.address}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                '✅ Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
