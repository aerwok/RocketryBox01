import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize Socket.IO client connection
 * @param {string} token - JWT access token
 * @returns {Object} Socket.IO client instance
 */
export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_BASE_URL, {
    auth: {
      token
    },
    query: {
      token // Fallback for compatibility
    },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    forceNew: true,
    upgrade: true
  });

  // Connection event handling
  socket.on('connect', () => {
    console.log('Socket connected');
    reconnectAttempts = 0;
    
    // When reconnecting, automatically rejoin relevant rooms
    if (socket._autoJoinAdminDashboard) {
      joinAdminDashboard();
    }
    
    if (socket._subscribedSections && socket._subscribedSections.length > 0) {
      socket._subscribedSections.forEach(section => {
        subscribeToSection(section);
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Maximum reconnection attempts reached');
      // Implement custom reconnection strategy or notify user
    }
  });
  
  // Listen for server-side errors
  socket.on('error', (error) => {
    console.error('Socket error from server:', error);
  });
  
  // Listen for explicit refresh requests
  socket.on('refresh-requested', (data) => {
    console.log('Server requested dashboard refresh at', data.timestamp);
    // If we have a refresh callback registered, call it
    if (typeof socket._refreshCallback === 'function') {
      socket._refreshCallback(data);
    }
  });

  // Store reconnection information for tracking
  socket._autoJoinAdminDashboard = false;
  socket._subscribedSections = [];
  socket._refreshCallback = null;

  return socket;
};

/**
 * Get the Socket.IO client instance
 * @returns {Object} Socket.IO client instance
 */
export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initSocket() first.');
  }
  return socket;
};

/**
 * Join the admin dashboard room to receive real-time updates
 */
export const joinAdminDashboard = () => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initSocket() first.');
  }
  
  // Flag for auto-rejoin on reconnection
  socket._autoJoinAdminDashboard = true;
  
  socket.emit('join-admin-dashboard');
};

/**
 * Subscribe to a specific dashboard section
 * @param {string} section - Section name (users, orders, revenue, etc.)
 */
export const subscribeToSection = (section) => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initSocket() first.');
  }
  
  // Track subscribed sections for reconnection
  if (!socket._subscribedSections.includes(section)) {
    socket._subscribedSections.push(section);
  }
  
  socket.emit('subscribe-section', section);
};

/**
 * Request explicit dashboard refresh from server
 * @param {Function} callback - Callback function when refresh is acknowledged
 */
export const requestDashboardRefresh = (callback = null) => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initSocket() first.');
  }
  
  if (callback) {
    socket._refreshCallback = callback;
  }
  
  socket.emit('refresh-dashboard');
};

/**
 * Subscribe to real-time dashboard updates
 * @param {Function} callback - Function to call when a dashboard update is received
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDashboardUpdates = (callback) => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initSocket() first.');
  }

  // Subscribe to full dashboard updates
  socket.on('dashboard-update', callback);

  // Return unsubscribe function
  return () => {
    socket.off('dashboard-update', callback);
  };
};

/**
 * Subscribe to section-specific dashboard updates
 * @param {string} section - Section name (users, orders, revenue, etc.)
 * @param {Function} callback - Function to call when a section update is received
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDashboardSectionUpdates = (callback) => {
  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initSocket() first.');
  }

  // Subscribe to section-specific updates
  socket.on('dashboard-section-update', callback);

  // Return unsubscribe function
  return () => {
    socket.off('dashboard-section-update', callback);
  };
};

/**
 * Check if socket is connected
 * @returns {boolean} True if connected, false otherwise
 */
export const isSocketConnected = () => {
  if (!socket) {
    return false;
  }
  return socket.connected;
};

/**
 * Disconnect Socket.IO client
 */
export const disconnectSocket = () => {
  if (socket) {
    // Clear tracked subscription state
    socket._autoJoinAdminDashboard = false;
    socket._subscribedSections = [];
    socket._refreshCallback = null;
    
    socket.disconnect();
    socket = null;
  }
}; 