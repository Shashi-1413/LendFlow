import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import LoanList from './components/LoanList';
import LoanForm from './components/LoanForm';
import PaymentList from './components/PaymentList';
import PaymentForm from './components/PaymentForm';
import DatabaseManagement from './components/DatabaseManagement';
import Notification from './components/Notification';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [notification, setNotification] = useState(null);

  const handleNotification = (notificationData) => {
    try {
      setNotification(notificationData);
      // Auto-clear notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const clearNotification = () => {
    try {
      setNotification(null);
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  const renderCurrentView = () => {
    try {
      switch (currentView) {
        case 'dashboard':
          return <Dashboard onNotification={handleNotification} />;
        case 'customers':
          return <CustomerList onNotification={handleNotification} />;
        case 'add-customer':
          return <CustomerForm 
            onNotification={handleNotification} 
            onSuccess={() => setCurrentView('customers')}
            onBack={() => setCurrentView('customers')} 
          />;
        case 'loans':
          return <LoanList onNotification={handleNotification} />;
        case 'add-loan':
          return <LoanForm 
            onNotification={handleNotification} 
            onSuccess={() => setCurrentView('loans')}
            onBack={() => setCurrentView('loans')} 
          />;
        case 'payments':
          return <PaymentList onNotification={handleNotification} />;
        case 'add-payment':
          return <PaymentForm 
            onNotification={handleNotification} 
            onSuccess={() => setCurrentView('payments')}
            onBack={() => setCurrentView('payments')} 
          />;
        case 'database':
          return <DatabaseManagement onNotification={handleNotification} />;
        default:
          return <Dashboard onNotification={handleNotification} />;
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      return (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">⚠️ Application Error</div>
          <p className="text-gray-600">Something went wrong. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-4"
          >
            Refresh Page
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderCurrentView()}
      </main>

      {/* Notification */}
      <Notification 
        notification={notification} 
        onClose={clearNotification} 
      />
    </div>
  );
}

export default App;
