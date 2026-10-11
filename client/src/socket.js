import { io } from 'socket.io-client';
import { API_URL } from './api';

// Opens a real-time connection to the backend.
// The token proves who we are (checked in server/socket.js).
// Remember to call socket.disconnect() when the page closes.
export function createSocket() {
  return io(API_URL, { auth: { token: localStorage.getItem('token') } });
}
