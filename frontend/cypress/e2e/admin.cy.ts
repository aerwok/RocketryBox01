/// <reference types="cypress" />

describe('Admin Section', () => {
  describe('Authentication', () => {
    beforeEach(() => {
      cy.visit('/admin/login');
    });

    it('should handle admin login', () => {
      // Test form validation
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');

      // Test successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
      cy.url().should('include', '/admin/dashboard');
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should display shipping metrics', () => {
      cy.intercept('GET', '**/api/v2/admin/dashboard/metrics', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalShipments: 1000,
            activeCouriers: 5,
            pendingPickups: 50,
            inTransit: 200,
            deliveredToday: 100,
            exceptionShipments: 10
          }
        }
      }).as('metricsRequest');

      cy.get('[data-testid="dashboard-metrics"]').should('be.visible');
      cy.wait('@metricsRequest');
      cy.get('[data-testid="metric-card"]').should('have.length', 6);
    });

    it('should display courier performance', () => {
      cy.intercept('GET', '**/api/v2/admin/dashboard/courier-performance', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            couriers: [
              {
                name: 'BlueDart',
                totalShipments: 300,
                delivered: 280,
                inTransit: 15,
                exceptions: 5,
                successRate: 93.3
              },
              {
                name: 'Delhivery',
                totalShipments: 250,
                delivered: 230,
                inTransit: 18,
                exceptions: 2,
                successRate: 92.0
              }
            ]
          }
        }
      }).as('courierPerformance');

      cy.get('[data-testid="courier-performance"]').should('be.visible');
      cy.wait('@courierPerformance');
      cy.get('[data-testid="courier-card"]').should('have.length.at.least', 2);
    });
  });

  describe('Shipment Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should list and filter shipments', () => {
      cy.intercept('GET', '**/api/v2/admin/shipments', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              awb: 'AWB001',
              courier: 'BlueDart',
              status: 'In Transit',
              pickupAddress: {
                city: 'Mumbai',
                pincode: '400001'
              },
              deliveryAddress: {
                city: 'Delhi',
                pincode: '110001'
              },
              createdAt: '2024-03-15'
            }
          ]
        }
      }).as('shipmentsRequest');

      cy.visit('/admin/shipments');
      cy.wait('@shipmentsRequest');
      cy.get('[data-testid="shipments-table"]').should('be.visible');
      cy.get('[data-testid="shipment-row"]').should('have.length.at.least', 1);

      // Test status filter
      cy.get('[data-testid="status-filter"]').select('In Transit');
      cy.wait('@shipmentsRequest');

      // Test courier filter
      cy.get('[data-testid="courier-filter"]').select('BlueDart');
      cy.wait('@shipmentsRequest');
    });

    it('should update shipment status', () => {
      cy.intercept('PUT', '**/api/v2/admin/shipments/*/status', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Shipment status updated successfully'
        }
      }).as('updateStatus');

      cy.visit('/admin/shipments');
      cy.get('[data-testid="shipment-row"]').first().click();
      cy.get('[data-testid="status-select"]').select('Out for Delivery');
      cy.get('[data-testid="update-button"]').click();
      cy.wait('@updateStatus');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should track shipment', () => {
      cy.intercept('GET', '**/api/v2/admin/shipments/*/track', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            awbNumber: 'AWB001',
            currentStatus: 'In Transit',
            expectedDelivery: '2024-03-20',
            origin: 'Mumbai',
            destination: 'Delhi',
            courier: 'BlueDart',
            events: [
              {
                status: 'Order Created',
                location: 'Mumbai',
                timestamp: '2024-03-15T10:00:00Z',
                description: 'Shipment booked successfully'
              }
            ]
          }
        }
      }).as('trackShipment');

      cy.visit('/admin/shipments');
      cy.get('[data-testid="shipment-row"]').first().click();
      cy.wait('@trackShipment');
      cy.get('[data-testid="tracking-timeline"]').should('be.visible');
      cy.get('[data-testid="current-status"]').should('contain', 'In Transit');
    });
  });

  describe('Rate Card Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage rate cards', () => {
      cy.intercept('GET', '**/api/v2/admin/billing/rate-cards', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              rateBand: 'Standard',
              lastUpdated: '2024-03-15',
              couriers: [
                {
                  name: 'BlueDart',
                  rates: {
                    withinCity: 37,
                    withinState: 45,
                    metroToMetro: 48,
                    restOfIndia: 49,
                    northEastJK: 64
                  },
                  codCharge: 35,
                  codPercent: 1.5
                }
              ]
            }
          ]
        }
      }).as('getRateCards');

      cy.intercept('PUT', '**/api/v2/admin/billing/rate-cards/*', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Rate card updated successfully'
        }
      }).as('updateRateCard');

      cy.visit('/admin/rate-cards');
      cy.wait('@getRateCards');
      cy.get('[data-testid="rate-cards-table"]').should('be.visible');
      
      // Update rate card
      cy.get('[data-testid="rate-card-row"]').first().click();
      cy.get('[data-testid="within-city-rate"]').clear().type('40');
      cy.get('[data-testid="save-rate-card"]').click();
      cy.wait('@updateRateCard');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Courier Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage courier partners', () => {
      cy.intercept('GET', '**/api/v2/admin/couriers', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              name: 'BlueDart',
              status: 'Active',
              apiStatus: 'Active',
              serviceTypes: ['air', 'surface'],
              weightLimits: {
                min: 0.5,
                max: 10
              }
            }
          ]
        }
      }).as('getCouriers');

      cy.intercept('PUT', '**/api/v2/admin/couriers/*', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Courier updated successfully'
        }
      }).as('updateCourier');

      cy.visit('/admin/couriers');
      cy.wait('@getCouriers');
      cy.get('[data-testid="couriers-table"]').should('be.visible');
      
      // Update courier status
      cy.get('[data-testid="courier-row"]').first().click();
      cy.get('[data-testid="status-toggle"]').click();
      cy.get('[data-testid="confirm-status-change"]').click();
      cy.wait('@updateCourier');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Service Area Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage service areas', () => {
      cy.intercept('GET', '**/api/v2/admin/service-areas', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincodes: ['400001', '400002'],
              status: 'Active'
            }
          ]
        }
      }).as('getServiceAreas');

      cy.intercept('POST', '**/api/v2/admin/service-areas', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Service area added successfully'
        }
      }).as('addServiceArea');

      cy.visit('/admin/service-areas');
      cy.wait('@getServiceAreas');
      cy.get('[data-testid="service-areas-table"]').should('be.visible');
      
      // Add new service area
      cy.get('[data-testid="add-service-area"]').click();
      cy.get('[data-testid="city-input"]').type('Delhi');
      cy.get('[data-testid="state-input"]').type('Delhi');
      cy.get('[data-testid="pincodes-input"]').type('110001,110002');
      cy.get('[data-testid="save-service-area"]').click();
      cy.wait('@addServiceArea');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Analytics', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view shipping analytics', () => {
      cy.intercept('GET', '**/api/v2/admin/analytics/shipping', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalShipments: 1000,
            deliveredShipments: 800,
            inTransitShipments: 150,
            exceptionShipments: 50,
            averageDeliveryTime: '2.5',
            courierPerformance: [
              {
                courier: 'BlueDart',
                totalShipments: 400,
                successRate: 95,
                averageDeliveryTime: '2.3'
              },
              {
                courier: 'Delhivery',
                totalShipments: 300,
                successRate: 92,
                averageDeliveryTime: '2.7'
              }
            ],
            zoneWiseDistribution: [
              {
                zone: 'Metro to Metro',
                shipments: 500,
                successRate: 94
              },
              {
                zone: 'Rest of India',
                shipments: 300,
                successRate: 90
              }
            ]
          }
        }
      }).as('getShippingAnalytics');

      cy.visit('/admin/analytics/shipping');
      cy.wait('@getShippingAnalytics');
      cy.get('[data-testid="shipping-metrics"]').should('be.visible');
      cy.get('[data-testid="courier-performance"]').should('be.visible');
      cy.get('[data-testid="zone-distribution"]').should('be.visible');
    });
  });

  describe('Support Ticket Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should list and filter support tickets', () => {
      cy.intercept('GET', '**/api/v2/admin/support/tickets', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'TICKET001',
              subject: 'Shipment Delay',
              category: 'ORDER',
              priority: 'High',
              status: 'New',
              customer: {
                id: '1',
                name: 'Test Seller',
                email: 'seller@example.com',
                phone: '1234567890',
                type: 'seller'
              },
              details: 'Shipment AWB001 is delayed',
              createdAt: '2024-03-15'
            }
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1
          }
        }
      }).as('getTickets');

      cy.visit('/admin/support/tickets');
      cy.wait('@getTickets');
      cy.get('[data-testid="tickets-table"]').should('be.visible');
      cy.get('[data-testid="ticket-row"]').should('have.length.at.least', 1);

      // Test filters
      cy.get('[data-testid="status-filter"]').select('New');
      cy.get('[data-testid="category-filter"]').select('ORDER');
      cy.get('[data-testid="priority-filter"]').select('High');
      cy.wait('@getTickets');
    });

    it('should handle ticket responses', () => {
      cy.intercept('GET', '**/api/v2/admin/support/tickets/TICKET001', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'TICKET001',
            subject: 'Shipment Delay',
            category: 'ORDER',
            priority: 'High',
            status: 'New',
            customer: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              phone: '1234567890',
              type: 'seller'
            },
            details: 'Shipment AWB001 is delayed',
            responses: []
          }
        }
      }).as('getTicketDetails');

      cy.intercept('POST', '**/api/v2/admin/support/tickets/TICKET001/responses', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Response added successfully'
        }
      }).as('addResponse');

      cy.visit('/admin/support/tickets');
      cy.get('[data-testid="ticket-row"]').first().click();
      cy.wait('@getTicketDetails');
      cy.get('[data-testid="ticket-details"]').should('be.visible');
      
      // Add response
      cy.get('[data-testid="response-input"]').type('We are looking into this issue');
      cy.get('[data-testid="send-response"]').click();
      cy.wait('@addResponse');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Weight Dispute Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should list and handle weight disputes', () => {
      cy.intercept('GET', '**/api/v2/admin/disputes/weight', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'WD001',
              shipment: 'SHIP001',
              awbNumber: 'AWB001',
              orderId: 'ORD001',
              given: 1.5,
              applied: 2.0,
              difference: 0.5,
              status: 'Open Dispute',
              seller: {
                id: '1',
                name: 'Test Seller'
              }
            }
          ]
        }
      }).as('getDisputes');

      cy.intercept('PUT', '**/api/v2/admin/disputes/weight/WD001', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Dispute updated successfully'
        }
      }).as('updateDispute');

      cy.visit('/admin/disputes/weight');
      cy.wait('@getDisputes');
      cy.get('[data-testid="disputes-table"]').should('be.visible');
      
      // Update dispute
      cy.get('[data-testid="dispute-row"]').first().click();
      cy.get('[data-testid="revised-weight"]').clear().type('1.8');
      cy.get('[data-testid="update-dispute"]').click();
      cy.wait('@updateDispute');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('NDR Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage NDR cases', () => {
      cy.intercept('GET', '**/api/v2/admin/ndr', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'NDR001',
              awb: 'AWB001',
              status: 'Pending',
              attempts: 1,
              customer: {
                name: 'John Doe',
                phone: '1234567890',
                address: {
                  fullName: 'John Doe',
                  contactNumber: '1234567890',
                  addressLine1: '123 Main St',
                  city: 'Mumbai',
                  pincode: '400001'
                }
              },
              seller: {
                id: '1',
                name: 'Test Seller',
                business: 'Test Business'
              }
            }
          ]
        }
      }).as('getNDR');

      cy.intercept('PUT', '**/api/v2/admin/ndr/NDR001', {
        statusCode: 200,
        body: {
          success: true,
          message: 'NDR updated successfully'
        }
      }).as('updateNDR');

      cy.visit('/admin/ndr');
      cy.wait('@getNDR');
      cy.get('[data-testid="ndr-table"]').should('be.visible');
      
      // Add attempt
      cy.get('[data-testid="ndr-row"]').first().click();
      cy.get('[data-testid="add-attempt"]').click();
      cy.get('[data-testid="attempt-status"]').select('Not Available');
      cy.get('[data-testid="attempt-reason"]').type('Customer not available');
      cy.get('[data-testid="save-attempt"]').click();
      cy.wait('@updateNDR');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Seller Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage seller accounts', () => {
      cy.intercept('GET', '**/api/v2/admin/sellers', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              userId: 'USER001',
              name: 'Test Seller',
              email: 'seller@example.com',
              phone: '1234567890',
              status: 'Active',
              registrationDate: '2024-03-01',
              lastActive: '2024-03-15',
              companyName: 'Test Company',
              companyCategory: 'Electronics',
              paymentType: 'wallet',
              rateBand: 'Standard',
              kycStatus: 'Verified',
              documentApprovals: {
                pan: 'Verified',
                gst: 'Verified',
                identity: 'Verified',
                bankDetails: 'Verified'
              }
            }
          ]
        }
      }).as('getSellers');

      cy.intercept('PUT', '**/api/v2/admin/sellers/1', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Seller updated successfully'
        }
      }).as('updateSeller');

      cy.visit('/admin/sellers');
      cy.wait('@getSellers');
      cy.get('[data-testid="sellers-table"]').should('be.visible');
      
      // Update seller
      cy.get('[data-testid="seller-row"]').first().click();
      cy.get('[data-testid="rate-band"]').select('Premium');
      cy.get('[data-testid="save-seller"]').click();
      cy.wait('@updateSeller');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should manage seller wallet', () => {
      cy.intercept('GET', '**/api/v2/admin/sellers/1/wallet', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            balance: 50000,
            transactions: [
              {
                referenceNumber: 'TXN001',
                type: 'Recharge',
                amount: 10000,
                closingBalance: 50000,
                createdAt: '2024-03-15'
              }
            ]
          }
        }
      }).as('getWallet');

      cy.intercept('POST', '**/api/v2/admin/sellers/1/wallet/transactions', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Transaction added successfully'
        }
      }).as('addTransaction');

      cy.visit('/admin/sellers');
      cy.get('[data-testid="seller-row"]').first().click();
      cy.get('[data-testid="view-wallet"]').click();
      cy.wait('@getWallet');
      cy.get('[data-testid="wallet-details"]').should('be.visible');
      
      // Add transaction
      cy.get('[data-testid="add-transaction"]').click();
      cy.get('[data-testid="transaction-type"]').select('Recharge');
      cy.get('[data-testid="transaction-amount"]').type('5000');
      cy.get('[data-testid="save-transaction"]').click();
      cy.wait('@addTransaction');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Escalation Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage pickup escalations', () => {
      cy.intercept('GET', '**/api/v2/admin/escalations/pickup', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'ESC001',
              referenceId: 'PICK001',
              description: 'Pickup not completed',
              status: 'Pending',
              priority: 'High',
              pickup: {
                id: 'PICK001',
                location: 'Mumbai',
                scheduledDate: '2024-03-15',
                courierPartner: 'BlueDart'
              },
              seller: {
                id: '1',
                name: 'Test Seller',
                businessName: 'Test Business'
              }
            }
          ]
        }
      }).as('getPickupEscalations');

      cy.intercept('PUT', '**/api/v2/admin/escalations/pickup/ESC001', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Escalation updated successfully'
        }
      }).as('updatePickupEscalation');

      cy.visit('/admin/escalations/pickup');
      cy.wait('@getPickupEscalations');
      cy.get('[data-testid="escalations-table"]').should('be.visible');
      
      // Update escalation
      cy.get('[data-testid="escalation-row"]').first().click();
      cy.get('[data-testid="status-select"]').select('In Progress');
      cy.get('[data-testid="priority-select"]').select('Urgent');
      cy.get('[data-testid="add-comment"]').type('Rescheduling pickup');
      cy.get('[data-testid="save-escalation"]').click();
      cy.wait('@updatePickupEscalation');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should manage billing escalations', () => {
      cy.intercept('GET', '**/api/v2/admin/escalations/billing', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'ESC002',
              referenceId: 'BILL001',
              description: 'Payment dispute',
              status: 'Pending',
              priority: 'High',
              billing: {
                remittanceId: 'REM001',
                status: 'Failed',
                paymentDate: '2024-03-15',
                remittanceAmount: '5000',
                freightDeduction: '500',
                convenienceFee: '100',
                total: '4400'
              }
            }
          ]
        }
      }).as('getBillingEscalations');

      cy.intercept('PUT', '**/api/v2/admin/escalations/billing/ESC002', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Escalation updated successfully'
        }
      }).as('updateBillingEscalation');

      cy.visit('/admin/escalations/billing');
      cy.wait('@getBillingEscalations');
      cy.get('[data-testid="escalations-table"]').should('be.visible');
      
      // Update escalation
      cy.get('[data-testid="escalation-row"]').first().click();
      cy.get('[data-testid="status-select"]').select('Resolved');
      cy.get('[data-testid="resolution-input"]').type('Payment processed manually');
      cy.get('[data-testid="save-escalation"]').click();
      cy.wait('@updateBillingEscalation');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Refund and Settlement Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should process refunds', () => {
      cy.intercept('GET', '**/api/v2/admin/refunds', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'REF001',
              orderId: 'ORD001',
              amount: 1000,
              reason: 'Product damaged',
              status: 'Pending',
              customer: {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com'
              },
              seller: {
                id: '1',
                name: 'Test Seller'
              }
            }
          ]
        }
      }).as('getRefunds');

      cy.intercept('PUT', '**/api/v2/admin/refunds/REF001', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Refund processed successfully'
        }
      }).as('processRefund');

      cy.visit('/admin/refunds');
      cy.wait('@getRefunds');
      cy.get('[data-testid="refunds-table"]').should('be.visible');
      
      // Process refund
      cy.get('[data-testid="refund-row"]').first().click();
      cy.get('[data-testid="refund-amount"]').should('have.value', '1000');
      cy.get('[data-testid="process-refund"]').click();
      cy.wait('@processRefund');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle settlements', () => {
      cy.intercept('GET', '**/api/v2/admin/settlements', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 'SET001',
              sellerId: '1',
              sellerName: 'Test Seller',
              period: '2024-03',
              amount: 50000,
              status: 'Pending',
              transactions: [
                {
                  type: 'cod_credit',
                  amount: 30000,
                  date: '2024-03-15'
                },
                {
                  type: 'shipping_charge',
                  amount: -5000,
                  date: '2024-03-15'
                }
              ]
            }
          ]
        }
      }).as('getSettlements');

      cy.intercept('PUT', '**/api/v2/admin/settlements/SET001', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Settlement processed successfully'
        }
      }).as('processSettlement');

      cy.visit('/admin/settlements');
      cy.wait('@getSettlements');
      cy.get('[data-testid="settlements-table"]').should('be.visible');
      
      // Process settlement
      cy.get('[data-testid="settlement-row"]').first().click();
      cy.get('[data-testid="settlement-amount"]').should('have.value', '50000');
      cy.get('[data-testid="process-settlement"]').click();
      cy.wait('@processSettlement');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Enhanced NDR Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage multiple delivery attempts', () => {
      cy.intercept('GET', '**/api/v2/admin/ndr/NDR001', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'NDR001',
            awb: 'AWB001',
            status: 'Pending',
            attempts: [
              {
                attemptNumber: 1,
                status: 'Failed',
                reason: 'Customer not available',
                timestamp: '2024-03-15T10:00:00Z'
              }
            ],
            contactHistory: [
              {
                method: 'Phone',
                timestamp: '2024-03-15T11:00:00Z',
                status: 'No Response',
                notes: 'Called customer'
              }
            ]
          }
        }
      }).as('getNDRDetails');

      cy.intercept('POST', '**/api/v2/admin/ndr/NDR001/attempts', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Delivery attempt added successfully'
        }
      }).as('addAttempt');

      cy.visit('/admin/ndr');
      cy.get('[data-testid="ndr-row"]').first().click();
      cy.wait('@getNDRDetails');
      
      // Add new attempt
      cy.get('[data-testid="add-attempt"]').click();
      cy.get('[data-testid="attempt-status"]').select('Failed');
      cy.get('[data-testid="attempt-reason"]').type('Address not found');
      cy.get('[data-testid="save-attempt"]').click();
      cy.wait('@addAttempt');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle RTO process', () => {
      cy.intercept('GET', '**/api/v2/admin/ndr/NDR001', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'NDR001',
            awb: 'AWB001',
            status: 'Pending',
            attempts: [
              {
                attemptNumber: 1,
                status: 'Failed',
                reason: 'Customer not available',
                timestamp: '2024-03-15T10:00:00Z'
              }
            ],
            rtoDetails: null
          }
        }
      }).as('getNDRDetails');

      cy.intercept('POST', '**/api/v2/admin/ndr/NDR001/rto', {
        statusCode: 200,
        body: {
          success: true,
          message: 'RTO initiated successfully'
        }
      }).as('initiateRTO');

      cy.visit('/admin/ndr');
      cy.get('[data-testid="ndr-row"]').first().click();
      cy.wait('@getNDRDetails');
      
      // Initiate RTO
      cy.get('[data-testid="initiate-rto"]').click();
      cy.get('[data-testid="rto-reason"]').type('Multiple delivery attempts failed');
      cy.get('[data-testid="confirm-rto"]').click();
      cy.wait('@initiateRTO');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Reports & Analytics', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view revenue trends with time filters', () => {
      cy.intercept('GET', '**/api/v2/admin/reports/revenue', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            stats: {
              totalRevenue: 1000000,
              totalShipments: 5000,
              monthlyGrowth: {
                revenue: 15,
                shipments: 10
              }
            },
            chartData: [
              { date: '2024-03-01', value: 50000 },
              { date: '2024-03-02', value: 55000 }
            ],
            courierShare: [
              { name: 'BlueDart', value: 40, fill: '#1E88E5' },
              { name: 'Delhivery', value: 30, fill: '#43A047' }
            ]
          }
        }
      }).as('getRevenueData');

      cy.visit('/admin/reports');
      cy.wait('@getRevenueData');
      
      // Test time filters
      cy.get('[data-testid="time-filter"]').select('1M');
      cy.wait('@getRevenueData');
      cy.get('[data-testid="revenue-chart"]').should('be.visible');
      
      // Test date range
      cy.get('[data-testid="date-range"]').click();
      cy.get('[data-testid="start-date"]').type('2024-03-01');
      cy.get('[data-testid="end-date"]').type('2024-03-31');
      cy.get('[data-testid="apply-date-range"]').click();
      cy.wait('@getRevenueData');
      
      // Test export
      cy.get('[data-testid="export-report"]').click();
      cy.get('[data-testid="export-success"]').should('be.visible');
    });

    it('should view delivery partner analytics', () => {
      cy.intercept('GET', '**/api/v2/admin/reports/courier-performance', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            couriers: [
              {
                name: 'BlueDart',
                totalShipments: 2000,
                successRate: 95,
                averageDeliveryTime: '2.3',
                serviceQualityScore: 4.5,
                customerSatisfaction: 4.2,
                exceptionRate: 2.5
              },
              {
                name: 'Delhivery',
                totalShipments: 1500,
                successRate: 92,
                averageDeliveryTime: '2.7',
                serviceQualityScore: 4.2,
                customerSatisfaction: 4.0,
                exceptionRate: 3.0
              }
            ]
          }
        }
      }).as('getCourierPerformance');

      cy.visit('/admin/reports/courier-performance');
      cy.wait('@getCourierPerformance');
      cy.get('[data-testid="courier-performance-table"]').should('be.visible');
      cy.get('[data-testid="service-quality-chart"]').should('be.visible');
      cy.get('[data-testid="satisfaction-chart"]').should('be.visible');
    });
  });

  describe('Shipment Status Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should handle bulk status updates', () => {
      cy.intercept('GET', '**/api/v2/admin/shipments', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              awb: 'AWB001',
              status: 'In Transit',
              courier: 'BlueDart'
            },
            {
              awb: 'AWB002',
              status: 'In Transit',
              courier: 'Delhivery'
            }
          ]
        }
      }).as('getShipments');

      cy.intercept('PUT', '**/api/v2/admin/shipments/bulk-status', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            updated: 2,
            failed: 0,
            message: 'Status updated successfully'
          }
        }
      }).as('updateBulkStatus');

      cy.visit('/admin/shipments');
      cy.wait('@getShipments');
      
      // Select multiple shipments
      cy.get('[data-testid="shipment-checkbox"]').first().click();
      cy.get('[data-testid="shipment-checkbox"]').last().click();
      
      // Update status
      cy.get('[data-testid="bulk-status-select"]').select('Out for Delivery');
      cy.get('[data-testid="update-bulk-status"]').click();
      cy.wait('@updateBulkStatus');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should track status history', () => {
      cy.intercept('GET', '**/api/v2/admin/shipments/AWB001/history', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            awb: 'AWB001',
            history: [
              {
                status: 'Booked',
                timestamp: '2024-03-15T10:00:00Z',
                location: 'Mumbai',
                updatedBy: 'System'
              },
              {
                status: 'In Transit',
                timestamp: '2024-03-15T11:00:00Z',
                location: 'Mumbai',
                updatedBy: 'Admin'
              }
            ]
          }
        }
      }).as('getStatusHistory');

      cy.visit('/admin/shipments');
      cy.get('[data-testid="shipment-row"]').first().click();
      cy.get('[data-testid="view-history"]').click();
      cy.wait('@getStatusHistory');
      cy.get('[data-testid="status-history"]').should('be.visible');
      cy.get('[data-testid="history-entry"]').should('have.length', 2);
    });
  });

  describe('Courier Performance Metrics', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view service quality metrics', () => {
      cy.intercept('GET', '**/api/v2/admin/couriers/performance', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            couriers: [
              {
                name: 'BlueDart',
                serviceQualityScore: 4.5,
                customerSatisfaction: 4.2,
                onTimeDelivery: 95,
                exceptionRate: 2.5,
                feedback: {
                  positive: 85,
                  neutral: 10,
                  negative: 5
                }
              }
            ]
          }
        }
      }).as('getServiceQuality');

      cy.visit('/admin/couriers/performance');
      cy.wait('@getServiceQuality');
      cy.get('[data-testid="quality-metrics"]').should('be.visible');
      cy.get('[data-testid="satisfaction-chart"]').should('be.visible');
      cy.get('[data-testid="feedback-distribution"]').should('be.visible');
    });

    it('should monitor exception rates', () => {
      cy.intercept('GET', '**/api/v2/admin/couriers/exceptions', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            couriers: [
              {
                name: 'BlueDart',
                totalShipments: 1000,
                exceptions: 25,
                exceptionRate: 2.5,
                exceptionTypes: [
                  {
                    type: 'Delivery Failed',
                    count: 15,
                    percentage: 60
                  },
                  {
                    type: 'Address Not Found',
                    count: 10,
                    percentage: 40
                  }
                ]
              }
            ]
          }
        }
      }).as('getExceptions');

      cy.visit('/admin/couriers/exceptions');
      cy.wait('@getExceptions');
      cy.get('[data-testid="exception-metrics"]').should('be.visible');
      cy.get('[data-testid="exception-types"]').should('be.visible');
      cy.get('[data-testid="exception-chart"]').should('be.visible');
    });
  });

  describe('Manifest and Label Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should generate and export manifest', () => {
      cy.intercept('GET', '**/api/v2/admin/shipments/manifest', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            shipments: [
              {
                awb: 'AWB001',
                orderId: 'ORD001',
                courier: 'BlueDart',
                status: 'In Transit',
                pickupDate: '2024-03-15',
                deliveryDate: '2024-03-17',
                weight: 1.5,
                dimensions: '10x10x5',
                shippingCharge: 100
              }
            ]
          }
        }
      }).as('getManifest');

      cy.visit('/admin/shipments/manifest');
      cy.wait('@getManifest');
      
      // Test date range
      cy.get('[data-testid="start-date"]').type('2024-03-01');
      cy.get('[data-testid="end-date"]').type('2024-03-31');
      cy.get('[data-testid="generate-manifest"]').click();
      
      // Test export
      cy.get('[data-testid="export-manifest"]').click();
      cy.get('[data-testid="export-success"]').should('be.visible');
    });

    it('should handle label printing', () => {
      cy.intercept('GET', '**/api/v2/admin/shipments/AWB001/label', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            labelUrl: 'https://example.com/labels/AWB001.pdf',
            labelData: {
              awb: 'AWB001',
              sender: {
                name: 'Test Sender',
                address: '123 Test St',
                city: 'Mumbai',
                pincode: '400001'
              },
              receiver: {
                name: 'Test Receiver',
                address: '456 Test Ave',
                city: 'Delhi',
                pincode: '110001'
              },
              weight: 1.5,
              dimensions: '10x10x5'
            }
          }
        }
      }).as('getLabel');

      cy.visit('/admin/shipments');
      cy.get('[data-testid="shipment-row"]').first().click();
      cy.get('[data-testid="print-label"]').click();
      cy.wait('@getLabel');
      cy.get('[data-testid="label-preview"]').should('be.visible');
    });
  });

  describe('System Settings and Notifications', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage email notifications', () => {
      cy.intercept('GET', '**/api/v2/admin/settings/notifications/email', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            emailMethod: 'smtp',
            smtpHost: 'smtp.example.com',
            smtpPort: 587,
            smtpUsername: 'admin@example.com',
            smtpEncryption: 'tls',
            emailSentFromName: 'Admin',
            emailSentFromEmail: 'admin@example.com'
          }
        }
      }).as('getEmailSettings');

      cy.intercept('PUT', '**/api/v2/admin/settings/notifications/email', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Email settings updated successfully'
        }
      }).as('updateEmailSettings');

      cy.visit('/admin/settings/notifications');
      cy.wait('@getEmailSettings');
      
      // Update SMTP settings
      cy.get('[data-testid="smtp-host"]').clear().type('new.smtp.example.com');
      cy.get('[data-testid="smtp-port"]').clear().type('465');
      cy.get('[data-testid="save-email-settings"]').click();
      cy.wait('@updateEmailSettings');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should manage notification templates', () => {
      cy.intercept('GET', '**/api/v2/admin/settings/notifications/templates', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            templates: [
              {
                name: 'Order Confirmation',
                subject: 'Your order has been confirmed',
                body: 'Dear {{customerName}}, your order {{orderId}} has been confirmed.'
              }
            ]
          }
        }
      }).as('getTemplates');

      cy.intercept('PUT', '**/api/v2/admin/settings/notifications/templates/Order Confirmation', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Template updated successfully'
        }
      }).as('updateTemplate');

      cy.visit('/admin/settings/notifications/templates');
      cy.wait('@getTemplates');
      
      // Edit template
      cy.get('[data-testid="template-row"]').first().click();
      cy.get('[data-testid="template-subject"]').clear().type('Order #{{orderId}} Confirmed');
      cy.get('[data-testid="save-template"]').click();
      cy.wait('@updateTemplate');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Audit and Logging', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/admin/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: 'Admin'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/admin/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('admin@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view activity logs', () => {
      cy.intercept('GET', '**/api/v2/admin/audit/logs', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            logs: [
              {
                id: 'LOG001',
                action: 'UPDATE_SHIPMENT',
                entity: 'Shipment',
                entityId: 'AWB001',
                user: {
                  id: '1',
                  name: 'Test Admin'
                },
                changes: {
                  status: {
                    from: 'In Transit',
                    to: 'Out for Delivery'
                  }
                },
                timestamp: '2024-03-15T10:00:00Z'
              }
            ]
          }
        }
      }).as('getLogs');

      cy.visit('/admin/audit/logs');
      cy.wait('@getLogs');
      cy.get('[data-testid="logs-table"]').should('be.visible');
      cy.get('[data-testid="log-row"]').should('have.length.at.least', 1);
    });

    it('should track system changes', () => {
      cy.intercept('GET', '**/api/v2/admin/audit/system-changes', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            changes: [
              {
                id: 'CHG001',
                type: 'SETTINGS_UPDATE',
                section: 'Notifications',
                user: {
                  id: '1',
                  name: 'Test Admin'
                },
                details: {
                  field: 'smtpHost',
                  oldValue: 'smtp.example.com',
                  newValue: 'new.smtp.example.com'
                },
                timestamp: '2024-03-15T10:00:00Z'
              }
            ]
          }
        }
      }).as('getSystemChanges');

      cy.visit('/admin/audit/system-changes');
      cy.wait('@getSystemChanges');
      cy.get('[data-testid="changes-table"]').should('be.visible');
      cy.get('[data-testid="change-row"]').should('have.length.at.least', 1);
    });
  });
}); 