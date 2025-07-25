import React, { useState } from 'react';
import { paymentAPI } from '../services/api';

const PaymentForm = ({ loanId, loan, onSuccess, onCancel, onNotification }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentType: 'EMI',
    paymentMethod: 'bank_transfer',
    reference: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    try {
      const newErrors = {};

      // Amount validation
      if (!formData.amount) {
        newErrors.amount = 'Payment amount is required';
      } else {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
          newErrors.amount = 'Amount must be a positive number';
        } else if (amount < 1) {
          newErrors.amount = 'Minimum payment amount is ₹1';
        } else if (amount > loan.remainingBalance) {
          newErrors.amount = `Payment cannot exceed remaining balance of ${formatCurrency(loan.remainingBalance)}`;
        }
      }

      // Payment type validation
      if (!formData.paymentType) {
        newErrors.paymentType = 'Payment type is required';
      }

      // Payment method validation
      if (!formData.paymentMethod) {
        newErrors.paymentMethod = 'Payment method is required';
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

      const paymentData = {
        amount: parseFloat(formData.amount),
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference.trim() || undefined
      };

      await paymentAPI.create(loanId, paymentData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to record payment: ${error.message}`
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

  const getPaymentTypeDescription = (type) => {
    switch (type) {
      case 'EMI':
        return 'Regular monthly installment payment';
      case 'LUMP_SUM':
        return 'One-time bulk payment towards loan';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Add Payment</h2>
        <button
          onClick={handleCancel}
          className="btn-secondary"
          disabled={loading}
        >
          ← Back to Loan Details
        </button>
      </div>

      {/* Loan Summary */}
      <div className="card bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Loan ID:</span>
            <p className="font-medium">{loan.loanId}</p>
          </div>
          <div>
            <span className="text-gray-500">Remaining Balance:</span>
            <p className="font-medium text-warning-600">{formatCurrency(loan.remainingBalance)}</p>
          </div>
          <div>
            <span className="text-gray-500">Monthly Payment:</span>
            <p className="font-medium">{formatCurrency(loan.monthlyPayment)}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <p className="font-medium">{loan.status}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="1"
                max={loan.remainingBalance}
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className={`input-field ${errors.amount ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.amount && (
                <p className="error-message">{errors.amount}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Maximum: {formatCurrency(loan.remainingBalance)}
              </p>
            </div>

            {/* Payment Type */}
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type *
              </label>
              <select
                id="paymentType"
                value={formData.paymentType}
                onChange={(e) => handleChange('paymentType', e.target.value)}
                className={`input-field ${errors.paymentType ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                disabled={loading}
              >
                <option value="EMI">EMI - Regular Monthly Payment</option>
                <option value="LUMP_SUM">Lump Sum - One-time Payment</option>
              </select>
              {errors.paymentType && (
                <p className="error-message">{errors.paymentType}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {getPaymentTypeDescription(formData.paymentType)}
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className={`input-field ${errors.paymentMethod ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                disabled={loading}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
              </select>
              {errors.paymentMethod && (
                <p className="error-message">{errors.paymentMethod}</p>
              )}
            </div>

            {/* Reference */}
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                Reference (Optional)
              </label>
              <input
                type="text"
                id="reference"
                value={formData.reference}
                onChange={(e) => handleChange('reference', e.target.value)}
                className="input-field"
                placeholder="Transaction ID, check number, etc."
                disabled={loading}
                maxLength={100}
              />
              <p className="text-sm text-gray-500 mt-1">
                Add any reference information for this payment
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
                className="btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Recording...
                  </>
                ) : (
                  '✅ Record Payment'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Payment Options</h3>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleChange('amount', loan.monthlyPayment.toString())}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <div className="font-medium text-gray-900">Monthly EMI Payment</div>
              <div className="text-sm text-gray-500">{formatCurrency(loan.monthlyPayment)}</div>
            </button>
            
            <button
              type="button"
              onClick={() => handleChange('amount', loan.remainingBalance.toString())}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <div className="font-medium text-gray-900">Pay Full Balance</div>
              <div className="text-sm text-gray-500">{formatCurrency(loan.remainingBalance)}</div>
            </button>
            
            <button
              type="button"
              onClick={() => handleChange('amount', (loan.remainingBalance / 2).toFixed(2))}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <div className="font-medium text-gray-900">Pay Half Balance</div>
              <div className="text-sm text-gray-500">{formatCurrency(loan.remainingBalance / 2)}</div>
            </button>
          </div>

          {/* Payment Impact */}
          {formData.amount && !isNaN(parseFloat(formData.amount)) && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <h4 className="font-medium text-primary-900 mb-2">Payment Impact</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-700">New Balance:</span>
                  <span className="font-medium text-primary-900">
                    {formatCurrency(Math.max(0, loan.remainingBalance - parseFloat(formData.amount)))}
                  </span>
                </div>
                {parseFloat(formData.amount) >= loan.remainingBalance && (
                  <div className="text-success-600 font-medium">
                    ✅ This payment will fully pay off the loan!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
