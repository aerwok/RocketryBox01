/// <reference types="cypress" />

describe('Marketing Section', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Navigation and Layout', () => {
    it('should display all navigation links', () => {
      cy.get('nav').should('be.visible');
      cy.get('nav a').contains('Home').should('be.visible');
      cy.get('nav a').contains('Features').should('be.visible');
      cy.get('nav a').contains('Services').should('be.visible');
      cy.get('nav a').contains('Pricing').should('be.visible');
      cy.get('nav a').contains('Track').should('be.visible');
      cy.get('nav a').contains('Contact').should('be.visible');
    });

    it('should display hero section with CTAs', () => {
      cy.get('[data-testid="hero-section"]').should('be.visible');
      cy.get('[data-testid="hero-section"]').contains('Get Started').should('be.visible');
      cy.get('[data-testid="hero-section"]').contains('Learn More').should('be.visible');
    });
  });

  describe('Features Page', () => {
    beforeEach(() => {
      cy.visit('/features');
    });

    it('should display all feature cards', () => {
      cy.get('[data-testid="feature-cards"]').should('be.visible');
      cy.get('[data-testid="feature-card"]').should('have.length.at.least', 4);
    });

    it('should display feature details on hover', () => {
      cy.get('[data-testid="feature-card"]').first().trigger('mouseover');
      cy.get('[data-testid="feature-details"]').should('be.visible');
    });
  });

  describe('Services Page', () => {
    beforeEach(() => {
      cy.visit('/services');
    });

    it('should display all service features', () => {
      cy.get('[data-testid="service-features"]').should('be.visible');
      cy.get('[data-testid="service-card"]').should('have.length.at.least', 3);
    });

    it('should display service details when clicked', () => {
      cy.get('[data-testid="service-card"]').first().click();
      cy.get('[data-testid="service-details"]').should('be.visible');
      cy.get('[data-testid="service-description"]').should('be.visible');
    });
  });

  describe('Tracking Page', () => {
    beforeEach(() => {
      cy.visit('/track');
    });

    it('should display tracking form', () => {
      cy.get('input[placeholder="Enter tracking ID"]').should('be.visible');
      cy.get('button').contains('Track').should('be.visible');
    });

    it('should handle invalid tracking ID', () => {
      cy.get('input[placeholder="Enter tracking ID"]').type('INVALID123');
      cy.get('button').contains('Track').click();
      cy.get('[data-testid="error-message"]').should('be.visible');
    });

    it('should display tracking details for valid ID', () => {
      cy.intercept('GET', '/api/v1/marketing/track?trackingId=TEST123', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            status: 'In Transit',
            location: 'Mumbai',
            estimatedDelivery: '2024-03-20'
          }
        }
      }).as('trackRequest');

      cy.get('input[placeholder="Enter tracking ID"]').type('TEST123');
      cy.get('button').contains('Track').click();
      cy.wait('@trackRequest');
      cy.get('[data-testid="tracking-details"]').should('be.visible');
    });
  });

  describe('Contact Page', () => {
    beforeEach(() => {
      cy.visit('/contact');
    });

    it('should display contact form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('textarea[name="message"]').should('be.visible');
    });

    it('should validate contact form', () => {
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');

      cy.get('input[name="email"]').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('contain', 'email');
    });

    it('should handle successful form submission', () => {
      cy.intercept('POST', '/api/v1/marketing/contact', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Message sent successfully'
        }
      }).as('contactRequest');

      cy.get('input[name="email"]').type('test@example.com');
      cy.get('textarea[name="message"]').type('This is a test message');
      cy.get('button[type="submit"]').click();
      cy.wait('@contactRequest');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Become a Partner Page', () => {
    beforeEach(() => {
      cy.visit('/partner/join');
    });

    it('should display partner registration form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[name="fullName"]').should('be.visible');
      cy.get('input[name="companyName"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="contact"]').should('be.visible');
      cy.get('input[name="address"]').should('be.visible');
      cy.get('select[name="service"]').should('be.visible');
      cy.get('select[name="business"]').should('be.visible');
      cy.get('select[name="timeframe"]').should('be.visible');
    });

    it('should validate partner form', () => {
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');
    });

    it('should handle successful partner registration', () => {
      cy.intercept('POST', '/api/v1/marketing/partner', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Partner registration successful'
        }
      }).as('partnerRequest');

      cy.get('input[name="fullName"]').type('Test User');
      cy.get('input[name="companyName"]').type('Test Company');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="contact"]').type('9876543210');
      cy.get('input[name="address"]').type('123 Test Street');
      cy.get('select[name="service"]').select('Logistics');
      cy.get('select[name="business"]').select('B2B');
      cy.get('select[name="timeframe"]').select('Immediate');
      cy.get('button[type="submit"]').click();
      cy.wait('@partnerRequest');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });
}); 