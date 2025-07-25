import React, { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import CustomerForm from './CustomerForm';

const CustomerList = ({ onNotification }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    search: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerAPI.getAll();
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Customer fetch error:', error);
      setError(error.message);
      
      if (onNotification) {
        onNotification({
          type: 'error',
          message: `Failed to load customers: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCreated = () => {
    try {
      setShowForm(false);
      fetchCustomers();
      
      if (onNotification) {
        onNotification({
          type: 'success',
          message: 'Customer created successfully!'
        });
      }
    } catch (error) {
      console.error('Error handling customer creation:', error);
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

  const filteredCustomers = customers.filter(customer => {
    try {
      if (!filters.search) return true;
      
      const searchTerm = filters.search.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(searchTerm) ||
        customer.customerId?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error filtering customers:', error);
      return true;
    }
  });

  if (showForm) {
    return (
      <CustomerForm
        onSuccess={handleCustomerCreated}
        onCancel={() => setShowForm(false)}
        onNotification={onNotification}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <span>👤</span>
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search customers by name, email, phone, or ID..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="input-field"
          />
        </div>
        <button
          onClick={fetchCustomers}
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
          <div className="text-error-600 mb-4">⚠️ Error Loading Customers</div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchCustomers}
            className="btn-primary"
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* Customer List */}
      {!loading && !error && (
        <div className="card">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filters.search ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.search 
                  ? 'Try adjusting your search criteria' 
                  : 'Add your first customer to get started'
                }
              </p>
              {!filters.search && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  ➕ Add Customer
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.customerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {customer.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {customer.customerId}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Summary */}
          {filteredCustomers.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing {filteredCustomers.length} of {customers.length} customers
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerList;
