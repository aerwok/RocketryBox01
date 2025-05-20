// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add Cypress global types
declare global {
  namespace Cypress {
    interface Chainable {
      // Add any custom commands you create here
    }
  }
} 