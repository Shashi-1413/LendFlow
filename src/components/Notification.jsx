import React, { useEffect } from 'react';

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    try {
      if (notification) {
        const timer = setTimeout(() => {
          onClose();
        }, 5000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error in notification timer:', error);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'error':
        return 'bg-error-50 border-error-200 text-error-800';
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      default:
        return 'bg-primary-50 border-primary-200 text-primary-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const handleClose = () => {
    try {
      onClose();
    } catch (error) {
      console.error('Error closing notification:', error);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`max-w-sm w-full rounded-lg border p-4 shadow-lg ${getNotificationStyles(notification.type)}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{getIcon(notification.type)}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">Close</span>
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
