// API configuration
const API_BASE_URL = '/api/v1';
const API_TIMEOUT = 10000;

// Helper function to make fetch requests with error handling
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Customer API
export const customerAPI = {
  getAll: () => apiRequest('/customers'),
  getById: (id) => apiRequest(`/customers/${id}`),
  create: (customerData) => apiRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  }),
  update: (id, customerData) => apiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  }),
  delete: (id) => apiRequest(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Loan API
export const loanAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/loans?${queryString}` : '/loans';
    return apiRequest(endpoint);
  },
  getById: (loanId) => apiRequest(`/loans/${loanId}`),
  create: (loanData) => apiRequest('/loans', {
    method: 'POST',
    body: JSON.stringify(loanData),
  }),
  updateStatus: (loanId, status) => apiRequest(`/loans/${loanId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  update: (id, loanData) => apiRequest(`/loans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(loanData),
  }),
  delete: (id) => apiRequest(`/loans/${id}`, {
    method: 'DELETE',
  }),
};

// Payment API
export const paymentAPI = {
  getAll: () => apiRequest('/payments'),
  getById: (id) => apiRequest(`/payments/${id}`),
  getByLoan: (loanId) => apiRequest(`/loans/${loanId}/payments`),
  getByLoanId: (loanId) => apiRequest(`/payments/loan/${loanId}`),
  create: (loanId, paymentData) => apiRequest(`/loans/${loanId}/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),
  update: (id, paymentData) => apiRequest(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paymentData),
  }),
  delete: (id) => apiRequest(`/payments/${id}`, {
    method: 'DELETE',
  }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiRequest('/dashboard'),
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health'),
};

export default { customerAPI, loanAPI, paymentAPI, dashboardAPI, healthAPI };
