import React from 'react';

const Header = ({ currentView, onViewChange }) => {
  const navigation = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'customers', label: 'Customers', icon: '👥' },
    { key: 'loans', label: 'Loans', icon: '💰' },
    { key: 'payments', label: 'Payments', icon: '💳' },
    { key: 'database', label: 'Database', icon: '🗄️' },
  ];

  const handleViewChange = (newView) => {
    try {
      onViewChange(newView);
    } catch (error) {
      console.error('Error changing view:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary-600">
                🏦 LendFlow
              </h1>
            </div>
            <div className="hidden md:block ml-4">
              <p className="text-sm text-gray-600">Professional Loan Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <button
                key={item.key}
                onClick={() => handleViewChange(item.key)}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === item.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <select
              value={currentView}
              onChange={(e) => handleViewChange(e.target.value)}
              className="input-field text-sm"
            >
              {navigation.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.icon} {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
