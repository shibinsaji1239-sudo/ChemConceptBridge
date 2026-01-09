// frontend/src/apiClient.js
// Axios instance with auth header from localStorage

import axios from 'axios';

// Backend is running on port 10000
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:10000/api',
});

// Automatically attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens or unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        // Clear token and redirect to login page
        localStorage.removeItem('token');
        const isLoginRoute = window.location.pathname === '/login';
        if (!isLoginRoute) {
          window.location.href = '/login';
        }
      } catch {
        console.error('Error clearing auth token.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
