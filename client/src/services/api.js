import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for unified error message extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      'An unexpected network error occurred.';
    
    return Promise.reject(new Error(customMessage));
  }
);

export default api;

