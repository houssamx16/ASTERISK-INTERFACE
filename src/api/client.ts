// API Client and Configuration
// Interacts with Node.js Express backend (http://localhost:5000/api/v1)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (response.status === 401 || response.status === 403) {
      console.warn(`[API] Auth error (${response.status}) on ${endpoint}. Clearing token.`);
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return response.json();
  },

  post: async <T>(endpoint: string, payload: any): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401 || response.status === 403) {
      if (endpoint !== '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return response.json();
  },

  put: async <T>(endpoint: string, payload: any): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  patch: async <T>(endpoint: string, payload: any): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.json();
  }
};
