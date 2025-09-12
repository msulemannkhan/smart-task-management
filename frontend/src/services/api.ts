import axios from 'axios';

// Use relative URL if VITE_API_URL is empty (for Docker with nginx proxy)
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9200';
  if (apiUrl === '' || apiUrl === undefined) {
    // Use relative URL - nginx will proxy /api/ to backend
    return '/api/v1';
  }
  // Use explicit URL (with /api/v1 appended)
  return `${apiUrl}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 second timeout to handle slow Supabase auth
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  // Prefer app-managed auth token from AuthContext
  const appToken = localStorage.getItem('auth_token');
  if (appToken) {
    config.headers.Authorization = `Bearer ${appToken}`;
    return config;
  }

  // Fallback to Supabase token if present
  const supabaseToken = localStorage.getItem('supabase.auth.token');
  if (supabaseToken) {
    try {
      const parsedToken = JSON.parse(supabaseToken);
      if (parsedToken?.access_token) {
        config.headers.Authorization = `Bearer ${parsedToken.access_token}`;
      }
    } catch {}
  }
  return config;
});

// Response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshUrl = getBaseURL() + '/auth/refresh';
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (response.ok) {
            const data = await response.json();
            const newToken = data.access_token;
            
            localStorage.setItem('auth_token', newToken);
            if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token);
            }
            
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
        
        // If refresh failed, redirect to login
        processQueue(error, null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
