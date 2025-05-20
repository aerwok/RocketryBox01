/// <reference types="cypress" />

describe('Customer Section', () => {
  describe('Authentication', () => {
    beforeEach(() => {
      cy.visit('/customer/login');
    });

    it('should handle customer registration', () => {
      cy.visit('/customer/register');
      
      // Test form validation
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');

      // Test successful registration
      cy.intercept('POST', '**/api/v2/customer/auth/register', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Registration successful'
        }
      }).as('registerRequest');

      cy.get('input[name="name"]').type('Test Customer');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('input[name="phone"]').type('1234567890');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@registerRequest');
      cy.url().should('include', '/customer/otp');
    });

    it('should handle customer login', () => {
      // Test form validation
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');

      // Test successful login
      cy.intercept('POST', '**/api/v2/customer/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Customer',
              email: 'customer@example.com',
              role: 'Customer'
            }
          }
        }
      }).as('loginRequest');

      cy.get('input[placeholder="Enter email address/ mobile number"]').type('customer@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
      cy.url().should('include', '/customer/dashboard');
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/customer/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Customer',
              email: 'customer@example.com',
              role: 'Customer'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/customer/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('customer@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should display customer profile', () => {
      cy.get('[data-testid="customer-profile"]').should('be.visible');
      cy.get('[data-testid="customer-name"]').should('contain', 'Test Customer');
      cy.get('[data-testid="customer-email"]').should('contain', 'customer@example.com');
    });

    it('should display order history', () => {
      cy.intercept('GET', '**/api/v2/customer/orders', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              orderId: 'ORD001',
              date: '2024-03-15',
              status: 'Delivered',
              total: 1000
            }
          ]
        }
      }).as('ordersRequest');

      cy.get('[data-testid="order-history"]').should('be.visible');
      cy.wait('@ordersRequest');
      cy.get('[data-testid="order-card"]').should('have.length.at.least', 1);
    });

    it('should handle order tracking', () => {
      cy.intercept('GET', '**/api/v2/customer/orders/*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orderId: 'ORD001',
            status: 'In-transit',
            trackingId: 'TRK001',
            estimatedDelivery: '2024-03-20',
            history: [
              {
                status: 'Order Created',
                location: 'Mumbai',
                timestamp: '2024-03-15T10:00:00Z'
              }
            ]
          }
        }
      }).as('orderDetails');

      cy.get('[data-testid="order-card"]').first().click();
      cy.wait('@orderDetails');
      cy.get('[data-testid="order-details"]').should('be.visible');
      cy.get('[data-testid="tracking-info"]').should('be.visible');
    });
  });

  describe('Shipping and Order Creation', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/customer/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Customer',
              email: 'customer@example.com',
              role: 'Customer'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/customer/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('customer@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should create a new shipping order', () => {
      cy.intercept('POST', '**/api/v2/customer/orders', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: 'ORD001',
            awb: 'AWB001',
            status: 'Booked',
            estimatedDelivery: '2024-03-20'
          }
        }
      }).as('createOrder');

      cy.visit('/customer/create-order');
      
      // Fill pickup address
      cy.get('input[name="senderName"]').type('John Doe');
      cy.get('input[name="senderMobile"]').type('9876543210');
      cy.get('input[name="senderAddress1"]').type('123 Test Street');
      cy.get('input[name="senderCity"]').type('Mumbai');
      cy.get('input[name="senderState"]').type('Maharashtra');
      cy.get('input[name="senderPincode"]').type('400001');

      // Fill delivery address
      cy.get('input[name="receiverName"]').type('Jane Smith');
      cy.get('input[name="receiverMobile"]').type('9876543211');
      cy.get('input[name="receiverAddress1"]').type('456 Test Avenue');
      cy.get('input[name="receiverCity"]').type('Delhi');
      cy.get('input[name="receiverState"]').type('Delhi');
      cy.get('input[name="receiverPincode"]').type('110001');

      // Fill package details
      cy.get('input[name="weight"]').type('1');
      cy.get('input[name="length"]').type('10');
      cy.get('input[name="width"]').type('10');
      cy.get('input[name="height"]').type('10');
      cy.get('input[name="packageContent"]').type('Test Package');
      cy.get('input[name="packageValue"]').type('1000');
      cy.get('select[name="packagingType"]').select('Box / Carton');
      cy.get('input[name="pickupDate"]').type('2024-03-20');

      cy.get('button[type="submit"]').click();
      cy.wait('@createOrder');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should check service availability', () => {
      cy.intercept('POST', '**/api/v1/customer/services/check-availability', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            available: true,
            services: [
              {
                id: 'standard',
                name: 'Standard Delivery',
                price: 100,
                estimatedDelivery: '2-3 days'
              },
              {
                id: 'express',
                name: 'Express Delivery',
                price: 200,
                estimatedDelivery: '1-2 days'
              }
            ]
          }
        }
      }).as('checkAvailability');

      cy.visit('/customer/create-order');
      cy.get('input[name="senderPincode"]').type('400001');
      cy.get('input[name="receiverPincode"]').type('110001');
      cy.get('input[name="weight"]').type('1');
      cy.get('button').contains('Check Availability').click();
      cy.wait('@checkAvailability');
      cy.get('[data-testid="service-options"]').should('be.visible');
    });

    it('should track order status', () => {
      cy.intercept('GET', '**/api/v1/customer/orders/*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'ORD001',
            awb: 'AWB001',
            status: 'In Transit',
            pickupAddress: {
              name: 'John Doe',
              phone: '9876543210',
              address1: '123 Test Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            },
            deliveryAddress: {
              name: 'Jane Smith',
              phone: '9876543211',
              address1: '456 Test Avenue',
              city: 'Delhi',
              state: 'Delhi',
              pincode: '110001'
            },
            package: {
              weight: 1,
              dimensions: {
                length: 10,
                width: 10,
                height: 10
              }
            },
            serviceType: 'standard',
            paymentMethod: 'online',
            amount: 1000,
            estimatedDelivery: '2024-03-20',
            tracking: {
              status: 'In Transit',
              currentLocation: 'Mumbai',
              timeline: [
                {
                  status: 'Order Created',
                  location: 'Mumbai',
                  timestamp: '2024-03-15T10:00:00Z',
                  description: 'Shipment booked successfully'
                }
              ]
            }
          }
        }
      }).as('getOrderDetails');

      cy.visit('/customer/orders');
      cy.get('[data-testid="order-card"]').first().click();
      cy.wait('@getOrderDetails');
      cy.get('[data-testid="tracking-timeline"]').should('be.visible');
      cy.get('[data-testid="current-status"]').should('contain', 'In Transit');
    });

    it('should handle invalid address', () => {
      cy.intercept('POST', '**/api/v1/customer/services/check-availability', {
        statusCode: 400,
        body: {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Invalid pickup or delivery address'
          }
        }
      }).as('checkAvailability');

      cy.visit('/customer/create-order');
      cy.get('input[name="senderPincode"]').type('000000');
      cy.get('input[name="receiverPincode"]').type('000000');
      cy.get('input[name="weight"]').type('1');
      cy.get('button').contains('Check Availability').click();
      cy.wait('@checkAvailability');
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid pickup or delivery address');
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/customer/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Customer',
              email: 'customer@example.com',
              role: 'Customer'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/customer/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('customer@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should update profile information', () => {
      cy.intercept('PUT', '**/api/v2/customer/profile', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Profile updated successfully'
        }
      }).as('updateProfile');

      cy.visit('/customer/profile');
      cy.get('input[name="name"]').clear().type('Updated Name');
      cy.get('input[name="phone"]').clear().type('9876543210');
      cy.get('button[type="submit"]').click();
      cy.wait('@updateProfile');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should change password', () => {
      cy.intercept('PUT', '**/api/v2/customer/change-password', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Password changed successfully'
        }
      }).as('changePassword');

      cy.visit('/customer/change-password');
      cy.get('input[name="currentPassword"]').type('password123');
      cy.get('input[name="newPassword"]').type('newpassword123');
      cy.get('input[name="confirmPassword"]').type('newpassword123');
      cy.get('button[type="submit"]').click();
      cy.wait('@changePassword');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Support', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/customer/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Customer',
              email: 'customer@example.com',
              role: 'Customer'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/customer/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('customer@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should submit support ticket', () => {
      cy.intercept('POST', '**/api/v2/customer/support', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Support ticket created successfully'
        }
      }).as('createTicket');

      cy.visit('/customer/support');
      cy.get('select[name="category"]').select('Order Issue');
      cy.get('textarea[name="message"]').type('Test support message');
      cy.get('button[type="submit"]').click();
      cy.wait('@createTicket');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should view support ticket history', () => {
      cy.intercept('GET', '**/api/v2/customer/support', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              ticketId: 'TICKET001',
              category: 'Order Issue',
              status: 'Open',
              createdAt: '2024-03-15'
            }
          ]
        }
      }).as('ticketsRequest');

      cy.visit('/customer/support');
      cy.wait('@ticketsRequest');
      cy.get('[data-testid="ticket-card"]').should('have.length.at.least', 1);
    });
  });
}); 