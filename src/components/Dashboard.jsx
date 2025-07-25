import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const Dashboard = ({ onNotification }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getStats();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error.message);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to load dashboard: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="text-error-600 mb-4">⚠️ Dashboard Error</div>
        <p className="text-gray-500 mb-4">{error || 'Failed to load dashboard data'}</p>
        <button
          onClick={fetchDashboardData}
          className="btn-primary"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  const { stats, recentLoans, recentPayments } = dashboardData;

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers || 0,
      icon: '👥',
      color: 'bg-primary-500'
    },
    {
      title: 'Total Loans',
      value: stats.totalLoans || 0,
      icon: '💰',
      color: 'bg-success-500'
    },
    {
      title: 'Active Loans',
      value: stats.activeLoans || 0,
      icon: '📈',
      color: 'bg-warning-500'
    },
    {
      title: 'Paid Off Loans',
      value: stats.paidOffLoans || 0,
      icon: '✅',
      color: 'bg-success-600'
    },
    {
      title: 'Total Loan Amount',
      value: formatCurrency(stats.totalLoanAmount),
      icon: '💵',
      color: 'bg-indigo-500'
    },
    {
      title: 'Total Collected',
      value: formatCurrency(stats.totalCollected),
      icon: '💳',
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={fetchDashboardData}
          className="btn-secondary"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Loans</h3>
          {!recentLoans || recentLoans.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent loans</p>
          ) : (
            <div className="space-y-3">
              {recentLoans.map((loan) => (
                <div key={loan.loanId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{loan.loanId}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(loan.amount)} • {formatDate(loan.createdAt)}
                    </p>
                  </div>
                  <span className={`status-${loan.status.toLowerCase()}`}>
                    {loan.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          {!recentPayments || recentPayments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent payments</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.paymentId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.paymentId}</p>
                    <p className="text-sm text-gray-500">
                      {payment.loanId} • {formatDate(payment.paymentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success-600">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{payment.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
