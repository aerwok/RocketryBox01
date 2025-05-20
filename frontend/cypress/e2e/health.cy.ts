/// <reference types="cypress" />

describe('Health Check', () => {
  beforeEach(() => {
    // Increase default timeout for all commands in these tests
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('pageLoadTimeout', 120000);
  });

  it('should check backend health', () => {
    cy.request({
      url: 'http://localhost:8000/health',
      failOnStatusCode: true,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
      timeout: 30000
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status', 'ok');
    });
  });

  it('should load frontend', () => {
    // First ensure the server is up
    cy.request({
      url: 'http://localhost:5173',
      failOnStatusCode: true,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
      timeout: 30000
    }).then(() => {
      // Only proceed with visit if server is up
      cy.visit('http://localhost:5173', {
        timeout: 120000,
        failOnStatusCode: true,
        retryOnStatusCodeFailure: false,
        retryOnNetworkFailure: true,
        onBeforeLoad(win) {
          // Prevent any console errors from failing the test
          cy.stub(win.console, 'error').as('consoleError');
        }
      });

      // Basic checks for page readiness with increased timeouts
      cy.get('body', { timeout: 30000 }).should('exist');
      cy.document().its('readyState').should('eq', 'complete');
      
      // Wait for any network requests to complete
      cy.intercept('**/*').as('allRequests');
      cy.wait('@allRequests', { timeout: 120000 });
    });
  });
}); 