import React, { useState, useEffect } from 'react';
import { loanAPI, paymentAPI } from '../services/api';
import PaymentForm from './PaymentForm';

const LoanDetails = ({ loanId, onBack, onNotification, onUpdate }) => {
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (loanId) {
      fetchLoanDetails();
      fetchPayments();
    }
  }, [loanId]);

  const fetchLoanDetails = async () => {
    try {
      const response = await loanAPI.getById(loanId);
      setLoan(response.data.data);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      setError(error.message);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to load loan details: ${error.message}`
        });
      }
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await paymentAPI.getByLoan(loanId);
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to load payments: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAdded = () => {
    try {
      setShowPaymentForm(false);
      fetchLoanDetails();
      fetchPayments();
      
      if (onUpdate) {
        onUpdate();
      }
      
      if (onNotification) {
        onNotification({
          type: 'success',
          message: 'Payment recorded successfully!'
        });
      }
    } catch (error) {
      console.error('Error handling payment addition:', error);
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'active': return 'status-active';
      case 'paid_off': return 'status-paid_off';
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      default: return 'status-pending';
    }
  };

  const calculateProgress = () => {
    try {
      if (!loan || !loan.totalAmount || loan.totalAmount === 0) return 0;
      const paid = loan.totalAmount - loan.remainingBalance;
      return Math.round((paid / loan.totalAmount) * 100);
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  const handleBack = () => {
    try {
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Error handling back:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="text-center py-12">
        <div className="text-error-600 mb-4">⚠️ Error Loading Loan</div>
        <p className="text-gray-500 mb-4">{error || 'Loan not found'}</p>
        <button
          onClick={handleBack}
          className="btn-primary"
        >
          ← Back to Loans
        </button>
      </div>
    );
  }

  if (showPaymentForm) {
    return (
      <PaymentForm
        loanId={loanId}
        loan={loan}
        onSuccess={handlePaymentAdded}
        onCancel={() => setShowPaymentForm(false)}
        onNotification={onNotification}
      />
    );
  }

  const progress = calculateProgress();
  const totalPaid = loan.totalAmount - loan.remainingBalance;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="btn-secondary"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Loan Details</h2>
        </div>
        {loan.status === 'ACTIVE' && loan.remainingBalance > 0 && (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="btn-primary"
          >
            ➕ Add Payment
          </button>
        )}
      </div>

      {/* Loan Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Loan Info */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loan {loan.loanId}
              </h3>
              <span className={getStatusColor(loan.status)}>
                {loan.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(loan.amount)}
              </p>
              <p className="text-sm text-gray-500">Principal Amount</p>
            </div>
          </div>

          {/* Customer Info */}
          {loan.customer && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{loan.customer.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{loan.customer.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-medium">{loan.customer.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Address:</span>
                  <p className="font-medium">{loan.customer.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loan Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Interest Rate:</span>
              <p className="font-semibold text-lg">{loan.interestRate}%</p>
            </div>
            <div>
              <span className="text-gray-500">Term:</span>
              <p className="font-semibold text-lg">{loan.term} months</p>
            </div>
            <div>
              <span className="text-gray-500">Monthly Payment:</span>
              <p className="font-semibold text-lg">{formatCurrency(loan.monthlyPayment)}</p>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-4">Payment Progress</h4>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Paid</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-success-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Payment Stats */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-medium">{formatCurrency(loan.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paid:</span>
              <span className="font-medium text-success-600">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Remaining:</span>
              <span className="font-medium text-warning-600">
                {formatCurrency(loan.remainingBalance)}
              </span>
            </div>
          </div>

          {loan.status === 'PAID_OFF' && (
            <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-success-800 text-sm font-medium">
                ✅ Loan fully paid!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💳</div>
            <p className="text-gray-500">No payments recorded yet</p>
            {loan.status === 'ACTIVE' && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="btn-primary mt-4"
              >
                ➕ Add First Payment
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.paymentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {payment.paymentId}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusColor(payment.status)}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanDetails;
