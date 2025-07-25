import React, { useState, useEffect } from 'react';
import { loanAPI } from '../services/api';
import LoanForm from './LoanForm';
import LoanDetails from './LoanDetails';

const LoanList = ({ onNotification }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.status) params.status = filters.status;
      
      const response = await loanAPI.getAll(params);
      setLoans(response.data.data || []);
    } catch (error) {
      console.error('Loan fetch error:', error);
      setError(error.message);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to load loans: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoanCreated = () => {
    try {
      setShowForm(false);
      fetchLoans();
      
      if (onNotification) {
        onNotification({
          type: 'success',
          message: 'Loan created successfully!'
        });
      }
    } catch (error) {
      console.error('Error handling loan creation:', error);
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
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'paid_off': return 'status-paid_off';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  const filteredLoans = loans.filter(loan => {
    try {
      if (!filters.search) return true;
      
      const searchTerm = filters.search.toLowerCase();
      return (
        loan.loanId?.toLowerCase().includes(searchTerm) ||
        loan.customer?.name?.toLowerCase().includes(searchTerm) ||
        loan.customer?.email?.toLowerCase().includes(searchTerm) ||
        loan.customerId?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error filtering loans:', error);
      return true;
    }
  });

  if (showForm) {
    return (
      <LoanForm
        onSuccess={handleLoanCreated}
        onCancel={() => setShowForm(false)}
        onNotification={onNotification}
      />
    );
  }

  if (selectedLoan) {
    return (
      <LoanDetails
        loanId={selectedLoan}
        onBack={() => setSelectedLoan(null)}
        onNotification={onNotification}
        onUpdate={fetchLoans}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Loans</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          ➕ Create Loan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search loans, customers, or loan IDs..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAID_OFF">Paid Off</option>
          </select>
        </div>
        <button
          onClick={fetchLoans}
          className="btn-secondary"
          disabled={loading}
        >
          🔄 Refresh
        </button>
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
          <div className="text-error-600 mb-4">⚠️ Error Loading Loans</div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchLoans}
            className="btn-primary"
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* Loan List */}
      {!loading && !error && (
        <div className="card">
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search || filters.status ? 'No loans found' : 'No loans yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.status 
                  ? 'Try adjusting your search criteria' 
                  : 'Create your first loan to get started'
                }
              </p>
              {!filters.search && !filters.status && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  ➕ Create Loan
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.loanId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {loan.loanId}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {loan.customer ? loan.customer.name : 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.customer ? loan.customer.email : loan.customerId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(loan.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Balance: {formatCurrency(loan.remainingBalance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{loan.interestRate}% APR</div>
                        <div>{loan.term} months</div>
                        <div>{formatCurrency(loan.monthlyPayment)}/month</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusColor(loan.status)}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(loan.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedLoan(loan.loanId)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Summary */}
          {filteredLoans.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing {filteredLoans.length} of {loans.length} loans
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanList;
