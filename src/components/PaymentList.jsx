import React, { useState, useEffect } from 'react';
import { loanAPI, paymentAPI } from '../services/api';

const PaymentList = ({ onNotification }) => {
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: '',
    status: ''
  });

  useEffect(() => {
    fetchAllPayments();
  }, []);

  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get all loans
      const loansResponse = await loanAPI.getAll();
      const loans = loansResponse.data.data || [];
      
      // Then, fetch payments for each loan
      const paymentsPromises = loans.map(async (loan) => {
        try {
          const paymentResponse = await paymentAPI.getByLoan(loan.loanId);
          const payments = paymentResponse.data.data || [];
          
          // Add loan info to each payment
          return payments.map(payment => ({
            ...payment,
            loan: {
              loanId: loan.loanId,
              customer: loan.customer
            }
          }));
        } catch (error) {
          console.error(`Error fetching payments for loan ${loan.loanId}:`, error);
          return [];
        }
      });

      const allPaymentArrays = await Promise.all(paymentsPromises);
      const flattenedPayments = allPaymentArrays.flat();
      
      // Sort by payment date (newest first)
      flattenedPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      
      setAllPayments(flattenedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message);
      
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

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `$${amount || 0}`;
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
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      default: return 'status-pending';
    }
  };

  const filteredPayments = allPayments.filter(payment => {
    try {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = (
          payment.paymentId?.toLowerCase().includes(searchTerm) ||
          payment.loan?.loanId?.toLowerCase().includes(searchTerm) ||
          payment.loan?.customer?.name?.toLowerCase().includes(searchTerm) ||
          payment.loan?.customer?.email?.toLowerCase().includes(searchTerm) ||
          payment.reference?.toLowerCase().includes(searchTerm)
        );
        if (!matchesSearch) return false;
      }

      // Payment method filter
      if (filters.paymentMethod && payment.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // Status filter
      if (filters.status && payment.status !== filters.status) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error filtering payments:', error);
      return true;
    }
  });

  // Calculate statistics
  const stats = {
    totalPayments: filteredPayments.length,
    totalAmount: filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    completedPayments: filteredPayments.filter(p => p.status === 'completed').length,
    pendingPayments: filteredPayments.filter(p => p.status === 'pending').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
        <button
          onClick={fetchAllPayments}
          className="btn-secondary"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search payments, loans, customers, or references..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="input-field"
          >
            <option value="">All Methods</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
          </select>
        </div>
        <div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Total Payments</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalPayments}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="text-2xl font-bold text-success-600">{formatCurrency(stats.totalAmount)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-success-600">{stats.completedPayments}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-warning-600">{stats.pendingPayments}</div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="text-error-600 mb-4">⚠️ Error Loading Payments</div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchAllPayments}
            className="btn-primary"
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* Payment List */}
      {!loading && !error && (
        <div className="card">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.paymentMethod || filters.status ? 'No payments found' : 'No payments yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.paymentMethod || filters.status 
                  ? 'Try adjusting your search criteria' 
                  : 'Payments will appear here once loans are created and payments are made'
                }
              </p>
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
                      Loan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
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
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.paymentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {payment.paymentId}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                          {payment.loan?.loanId || 'Unknown'}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.loan?.customer?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.loan?.customer?.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paymentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paymentMethod?.replace('_', ' ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
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
          
          {/* Summary */}
          {filteredPayments.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing {filteredPayments.length} of {allPayments.length} payments
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentList;
