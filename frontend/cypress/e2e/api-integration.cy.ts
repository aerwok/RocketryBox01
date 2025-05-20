/// <reference types="cypress" />

// Example of an integration test between frontend and backend
describe('API Integration Tests', () => {
  it('should correctly handle backend API calls', () => {
    // Intercepting an API call
    cy.intercept('GET', '**/api/**').as('apiCall');
    
    // Visit a page that makes API calls on load
    cy.visit('/');
    
    // Wait for the API call to complete
    cy.wait('@apiCall').then((interception) => {
      // Check API response
      expect(interception.response.statusCode).to.be.oneOf([200, 304]);
    });
  });
  
  // Example for login flow (if applicable)
  it('should handle login process correctly', () => {
    // Visit the admin login page
    cy.visit('/admin/login');
    
    // Mock the login API response
    cy.intercept('POST', '**/api/v2/admin/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          token: 'mock_token',
          user: {
            id: '1',
            name: 'Test Admin',
            email: 'test@example.com',
            role: 'Admin',
            department: 'IT',
            isSuperAdmin: false,
            permissions: []
          }
        }
      }
    }).as('loginRequest');
    
    // Fill in login form using the correct selectors
    cy.get('form').within(() => {
      // Find input by its placeholder text
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('test@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
    });
    
    // Wait for the login API call
    cy.wait('@loginRequest').then((interception) => {
      // Verify the request payload
      expect(interception.request.body).to.deep.equal({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });
      
      // If login succeeds, we should be redirected to the dashboard
      if (interception.response.statusCode === 200) {
        cy.url().should('include', '/admin/dashboard');
      }
    });
  });
}); 