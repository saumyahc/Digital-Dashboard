import axios from 'axios';

// Set base URL for all API requests
axios.defaults.baseURL = 'http://localhost:5000';

// Request interceptor for adding token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions for users
export const userAPI = {
  login: (credentials) => axios.post('/api/users/login', credentials),
  register: (userData) => axios.post('/api/users/register', userData),
  getCurrentUser: () => axios.get('/api/users/me'),
  updateProfile: (userData) => axios.put('/api/users/updatedetails', userData),
  updatePassword: (passwordData) => axios.put('/api/users/updatepassword', passwordData),
  getAllUsers: () => axios.get('/api/users'),
  getUserById: (id) => axios.get(`/api/users/${id}`),
  updateUser: (id, userData) => axios.put(`/api/users/${id}`, userData),
  deleteUser: (id) => axios.delete(`/api/users/${id}`)
};

// API functions for products
export const productAPI = {
  getAllProducts: (query = '') => axios.get(`/api/products${query}`),
  getProductById: (id) => axios.get(`/api/products/${id}`),
  createProduct: (productData) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(productData).forEach(key => {
      if (key !== 'image') {
        formData.append(key, productData[key]);
      }
    });
    
    // Append image if exists
    if (productData.image && productData.image instanceof File) {
      formData.append('image', productData.image);
    }
    
    return axios.post('/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updateProduct: (id, productData) => {
    // Check if we have a file to upload
    if (productData.image && productData.image instanceof File) {
      const formData = new FormData();
      
      // Append text fields
      Object.keys(productData).forEach(key => {
        if (key !== 'image') {
          formData.append(key, productData[key]);
        }
      });
      
      // Append image
      formData.append('image', productData.image);
      
      return axios.put(`/api/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    
    // No file, regular update
    return axios.put(`/api/products/${id}`, productData);
  },
  deleteProduct: (id) => axios.delete(`/api/products/${id}`),
  uploadProductImage: (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return axios.put(`/api/products/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getLowStockProducts: () => axios.get('/api/products/low-stock'),
  getInventoryValue: () => axios.get('/api/products/inventory-value')
};

// API functions for customers
export const customerAPI = {
  getAllCustomers: (query = '') => axios.get(`/api/customers${query}`),
  getCustomerById: (id) => axios.get(`/api/customers/${id}`),
  createCustomer: (customerData) => axios.post('/api/customers', customerData),
  updateCustomer: (id, customerData) => axios.put(`/api/customers/${id}`, customerData),
  deleteCustomer: (id) => axios.delete(`/api/customers/${id}`),
  getCustomerPurchaseHistory: (id) => axios.get(`/api/customers/${id}/purchases`),
  searchCustomers: (query) => axios.get(`/api/customers/search?q=${query}`)
};

// API functions for sales
export const saleAPI = {
  getAllSales: (query = '') => axios.get(`/api/sales${query}`),
  getSaleById: (id) => axios.get(`/api/sales/${id}`),
  createSale: (saleData) => axios.post('/api/sales', saleData),
  generateInvoice: (id) => axios.get(`/api/sales/${id}/invoice`, { responseType: 'blob' }),
  getSalesReport: (params) => axios.get('/api/sales/report', { params })
};