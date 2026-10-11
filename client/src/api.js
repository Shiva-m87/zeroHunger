import axios from 'axios';

// Backend address (set VITE_API_URL when deploying).
// We pick out the http(s) URL from the setting, so extra spaces/text or a trailing "/" don't break it.
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const foundUrl = rawUrl.match(/https?:\/\/[^\s'"]+/)?.[0] || `https://${rawUrl.trim()}`;
export const API_URL = foundUrl.replace(/\/+$/, '');

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
