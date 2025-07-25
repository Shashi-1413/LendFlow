import React, { useState, useEffect } from 'react';
import { loanAPI, customerAPI } from '../services/api';

const LoanForm = ({ onSuccess, onCancel, onNotification }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    interestRate: '',
    term: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [errors, setErrors] = useState({});
  const [calculatedPayment, setCalculatedPayment] = useState(null);
  
  // Customer creation state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerErrors, setCustomerErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (formData.amount && formData.interestRate && formData.term) {
      calculatePayment();
    } else {
      setCalculatedPayment(null);
    }
  }, [formData.amount, formData.interestRate, formData.term]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to load customers: ${error.message}`
        });
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  const calculatePayment = () => {
    try {
      const principal = parseFloat(formData.amount);
      const annualRate = parseFloat(formData.interestRate);
      const termMonths = parseInt(formData.term);

      if (isNaN(principal) || isNaN(annualRate) || isNaN(termMonths)) {
        setCalculatedPayment(null);
        return;
      }

      const monthlyRate = annualRate / 100 / 12;
      let monthlyPayment;

      if (monthlyRate === 0) {
        monthlyPayment = principal / termMonths;
      } else {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);
      }

      const totalAmount = monthlyPayment * termMonths;

      setCalculatedPayment({
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalInterest: Math.round((totalAmount - principal) * 100) / 100
      });
    } catch (error) {
      console.error('Error calculating payment:', error);
      setCalculatedPayment(null);
    }
  };

  // Customer creation functions
  const validateCustomerForm = () => {
    try {
      const newErrors = {};

      if (!customerFormData.name.trim()) {
        newErrors.name = 'Customer name is required';
      } else if (customerFormData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters long';
      }

      if (!customerFormData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(customerFormData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!customerFormData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-()]+$/.test(customerFormData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      if (!customerFormData.address.trim()) {
        newErrors.address = 'Address is required';
      }

      setCustomerErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error('Error validating customer form:', error);
      return false;
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    
    try {
      if (!validateCustomerForm()) {
        return;
      }

      setCustomerLoading(true);
      setCustomerErrors({});

      const response = await customerAPI.create(customerFormData);
      const newCustomer = response.data.data;
      
      // Add new customer to the list
      setCustomers(prev => [newCustomer, ...prev]);
      
      // Select the new customer
      setFormData(prev => ({
        ...prev,
        customerId: newCustomer.customerId
      }));
      
      // Reset and hide customer form
      setCustomerFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      setShowCustomerForm(false);
      
      if (onNotification) {
        onNotification({
          type: 'success',
          message: `Customer "${newCustomer.name}" created successfully!`
        });
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
      setCustomerLoading(false);
    }
  };

  const handleCustomerFormChange = (field, value) => {
    try {
      setCustomerFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear error for this field when user starts typing
      if (customerErrors[field]) {
        setCustomerErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    } catch (error) {
      console.error('Error handling customer form change:', error);
    }
  };

  const validateForm = () => {
    try {
      const newErrors = {};

      // Customer validation
      if (!formData.customerId) {
        newErrors.customerId = 'Please select a customer';
      }

      // Amount validation
      if (!formData.amount) {
        newErrors.amount = 'Loan amount is required';
      } else {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
          newErrors.amount = 'Amount must be a positive number';
        } else if (amount < 1000) {
          newErrors.amount = 'Minimum loan amount is ₹1,000';
        } else if (amount > 100000000) {
          newErrors.amount = 'Maximum loan amount is ₹10,00,00,000';
        }
      }

      // Interest rate validation
      if (!formData.interestRate) {
        newErrors.interestRate = 'Interest rate is required';
      } else {
        const rate = parseFloat(formData.interestRate);
        if (isNaN(rate) || rate <= 0) {
          newErrors.interestRate = 'Interest rate must be a positive number';
        } else if (rate < 0.1) {
          newErrors.interestRate = 'Minimum interest rate is 0.1%';
        } else if (rate > 50) {
          newErrors.interestRate = 'Maximum interest rate is 50%';
        }
      }

      // Term validation
      if (!formData.term) {
        newErrors.term = 'Loan term is required';
      } else {
        const term = parseInt(formData.term);
        if (isNaN(term) || term <= 0) {
          newErrors.term = 'Term must be a positive number';
        } else if (term < 1) {
          newErrors.term = 'Minimum term is 1 month';
        } else if (term > 360) {
          newErrors.term = 'Maximum term is 360 months';
        }
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

      const loanData = {
        customerId: formData.customerId,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate),
        term: parseInt(formData.term)
      };

      await loanAPI.create(loanData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating loan:', error);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to create loan: ${error.message}`
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

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount || 0);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `₹${amount || 0}`;
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
        <h2 className="text-2xl font-bold text-gray-900">Create New Loan</h2>
        <button
          onClick={handleCancel}
          className="btn-secondary"
          disabled={loading}
        >
          ← Back to Loans
        </button>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Fields */}
        <div className="lg:col-span-2">
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                    Customer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomerForm(!showCustomerForm)}
                    className={`text-sm font-medium transition-colors ${showCustomerForm 
                      ? 'text-gray-600 hover:text-gray-800' 
                      : 'text-blue-600 hover:text-blue-800'
                    }`}
                    disabled={loading || customerLoading}
                  >
                    {showCustomerForm ? '← Back to Selection' : '👤 + Add New Customer'}
                  </button>
                </div>
                
                {showCustomerForm ? (
                  // Inline Customer Creation Form
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">👤</span>
                      </div>
                      <h3 className="text-lg font-medium text-blue-900">Create New Customer</h3>
                    </div>
                    <form onSubmit={handleCreateCustomer} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="customerName"
                            value={customerFormData.name}
                            onChange={(e) => handleCustomerFormChange('name', e.target.value)}
                            className={`input-field ${customerErrors.name ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                            placeholder="Enter full name"
                            disabled={customerLoading}
                          />
                          {customerErrors.name && (
                            <p className="error-message">{customerErrors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            id="customerEmail"
                            value={customerFormData.email}
                            onChange={(e) => handleCustomerFormChange('email', e.target.value)}
                            className={`input-field ${customerErrors.email ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                            placeholder="email@example.com"
                            disabled={customerLoading}
                          />
                          {customerErrors.email && (
                            <p className="error-message">{customerErrors.email}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            id="customerPhone"
                            value={customerFormData.phone}
                            onChange={(e) => handleCustomerFormChange('phone', e.target.value)}
                            className={`input-field ${customerErrors.phone ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                            placeholder="+91-XXXXXXXXXX"
                            disabled={customerLoading}
                          />
                          {customerErrors.phone && (
                            <p className="error-message">{customerErrors.phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">
                            Address *
                          </label>
                          <input
                            type="text"
                            id="customerAddress"
                            value={customerFormData.address}
                            onChange={(e) => handleCustomerFormChange('address', e.target.value)}
                            className={`input-field ${customerErrors.address ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                            placeholder="Full address"
                            disabled={customerLoading}
                          />
                          {customerErrors.address && (
                            <p className="error-message">{customerErrors.address}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomerForm(false);
                            setCustomerFormData({ name: '', email: '', phone: '', address: '' });
                            setCustomerErrors({});
                          }}
                          className="btn-secondary text-sm"
                          disabled={customerLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary text-sm"
                          disabled={customerLoading}
                        >
                          {customerLoading ? (
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
                ) : (
                  // Customer Selection Dropdown
                  <>
                    {loadingCustomers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="loading-spinner"></div>
                      </div>
                    ) : (
                      <select
                        id="customerId"
                        value={formData.customerId}
                        onChange={(e) => handleChange('customerId', e.target.value)}
                        className={`input-field ${errors.customerId ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                        disabled={loading}
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.customerId} value={customer.customerId}>
                            {customer.name} ({customer.email})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.customerId && (
                      <p className="error-message">{errors.customerId}</p>
                    )}
                    {customers.length === 0 && !loadingCustomers && (
                      <div className="text-sm text-blue-600 mt-1 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium">No customers found</p>
                        <p>Click "Add New Customer" above to create your first customer.</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Loan Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Amount (₹) *
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="1000"
                  max="100000000"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={`input-field ${errors.amount ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="500000"
                  disabled={loading}
                />
                {errors.amount && (
                  <p className="error-message">{errors.amount}</p>
                )}
              </div>

              {/* Interest Rate */}
              <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Interest Rate (%) *
                </label>
                <input
                  type="number"
                  id="interestRate"
                  step="0.01"
                  min="0.1"
                  max="50"
                  value={formData.interestRate}
                  onChange={(e) => handleChange('interestRate', e.target.value)}
                  className={`input-field ${errors.interestRate ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="5.5"
                  disabled={loading}
                />
                {errors.interestRate && (
                  <p className="error-message">{errors.interestRate}</p>
                )}
              </div>

              {/* Loan Term */}
              <div>
                <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Term (months) *
                </label>
                <input
                  type="number"
                  id="term"
                  min="1"
                  max="360"
                  value={formData.term}
                  onChange={(e) => handleChange('term', e.target.value)}
                  className={`input-field ${errors.term ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="60"
                  disabled={loading}
                />
                {errors.term && (
                  <p className="error-message">{errors.term}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {formData.term && !isNaN(parseInt(formData.term)) && (
                    <>Equivalent to {Math.round(parseInt(formData.term) / 12 * 10) / 10} years</>
                  )}
                </p>
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
                  disabled={loading || customers.length === 0}
                >
                  {loading ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    '✅ Create Loan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Payment Calculation Preview */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Calculation</h3>
            
            {calculatedPayment ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                  <p className="text-2xl font-bold text-primary-700">
                    {formatCurrency(calculatedPayment.monthlyPayment)}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Principal:</span>
                    <span className="font-medium">{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Interest:</span>
                    <span className="font-medium">{formatCurrency(calculatedPayment.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-bold">{formatCurrency(calculatedPayment.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🧮</div>
                <p>Enter loan details to see payment calculation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanForm;
