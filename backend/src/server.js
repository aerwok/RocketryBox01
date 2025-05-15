/**
 * This file exports the Socket.IO instance for use across the application.
 * It's a simple proxy to avoid circular dependencies between modules.
 */

import { getIO } from './utils/socketio.js';
import { logger } from './utils/logger.js';

// Export the io instance with error handling
let io;
try {
  io = getIO();
  logger.debug('Successfully obtained Socket.IO instance in server.js');
} catch (error) {
  logger.warn(`Error getting Socket.IO instance: ${error.message}`);
  // Provide fallback mock implementation
  io = {
    to: () => ({ emit: () => {} }),
    emit: () => {},
    on: () => {}
  };
}

// Export the io instance
export { io };

// Export other server-related utilities as needed
export default {
  io
}; 