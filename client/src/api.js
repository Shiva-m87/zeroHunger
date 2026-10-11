import axios from 'axios';

// Backend address (set VITE_API_URL when deploying).
// Render gives just the host name ("my-api.onrender.com"), so add https:// when missing.
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

// One axios instance for the whole app
const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach the login token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns an axios error into a readable message
export const getErrorMessage = (err) => err.response?.data?.message || 'Something went wrong. Is the server running?';

export default api;
