/// <reference types="cypress" />
import 'cypress-file-upload';

describe('Seller Section', () => {
  describe('Authentication', () => {
    beforeEach(() => {
      cy.visit('/seller/login');
    });

    it('should handle seller registration', () => {
      cy.visit('/seller/register');
      
      // Test form validation
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');

      // Test successful registration
      cy.intercept('POST', '**/api/v2/seller/auth/register', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Registration successful'
        }
      }).as('registerRequest');

      cy.get('input[name="name"]').type('Test Seller');
      cy.get('input[name="email"]').type('seller@example.com');
      cy.get('input[name="phone"]').type('1234567890');
      cy.get('input[name="password"]').type('password123');
      cy.get('select[name="monthlyShipments"]').select('101-500');
      cy.get('button[type="submit"]').click();
      cy.wait('@registerRequest');
      cy.url().should('include', '/seller/otp');
    });

    it('should handle seller login', () => {
      // Test form validation
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');

      // Test successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
      cy.url().should('include', '/seller/dashboard');
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should display seller metrics', () => {
      cy.intercept('GET', '**/api/v2/seller/dashboard/metrics', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalOrders: 100,
            pendingOrders: 20,
            completedOrders: 80,
            revenue: 50000
          }
        }
      }).as('metricsRequest');

      cy.get('[data-testid="seller-metrics"]').should('be.visible');
      cy.wait('@metricsRequest');
      cy.get('[data-testid="metric-card"]').should('have.length', 4);
    });

    it('should display recent orders', () => {
      cy.intercept('GET', '**/api/v2/seller/dashboard/recent-orders', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              orderId: 'ORD001',
              customerName: 'Test Customer',
              date: '2024-03-15',
              status: 'Pending',
              amount: 1000
            }
          ]
        }
      }).as('recentOrdersRequest');

      cy.get('[data-testid="recent-orders"]').should('be.visible');
      cy.wait('@recentOrdersRequest');
      cy.get('[data-testid="order-row"]').should('have.length.at.least', 1);
    });
  });

  describe('Order Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should create a new order', () => {
      cy.visit('/seller/create-order');
      
      // Test form validation
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="form-error"]').should('be.visible');

      // Test successful order creation
      cy.intercept('POST', '**/api/v2/seller/orders', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orderId: 'ORD001',
            status: 'Created',
            trackingId: 'TRK001'
          }
        }
      }).as('createOrder');

      cy.get('input[name="customerName"]').type('Test Customer');
      cy.get('input[name="customerPhone"]').type('1234567890');
      cy.get('input[name="customerAddress"]').type('Test Address');
      cy.get('input[name="productName"]').type('Test Product');
      cy.get('input[name="weight"]').type('0.5');
      cy.get('select[name="paymentMode"]').select('Prepaid');
      cy.get('button[type="submit"]').click();
      cy.wait('@createOrder');
      cy.url().should('include', '/seller/orders');
    });

    it('should list and filter orders', () => {
      cy.intercept('GET', '**/api/v2/seller/orders', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              orderId: 'ORD001',
              customerName: 'Test Customer',
              date: '2024-03-15',
              status: 'Pending',
              amount: 1000
            }
          ]
        }
      }).as('ordersRequest');

      cy.visit('/seller/orders');
      cy.wait('@ordersRequest');
      cy.get('[data-testid="orders-table"]').should('be.visible');
      cy.get('[data-testid="order-row"]').should('have.length.at.least', 1);

      // Test status filter
      cy.get('[data-testid="status-filter"]').select('Pending');
      cy.wait('@ordersRequest');

      // Test date filter
      cy.get('[data-testid="date-filter"]').click();
      cy.get('[data-testid="date-picker"]').should('be.visible');
      cy.get('[data-testid="date-picker"]').contains('15').click();
      cy.wait('@ordersRequest');
    });

    it('should view and update order details', () => {
      cy.intercept('GET', '**/api/v2/seller/orders/ORD001', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orderId: 'ORD001',
            customerName: 'Test Customer',
            customerPhone: '1234567890',
            customerAddress: 'Test Address',
            productName: 'Test Product',
            weight: '0.5 kg',
            status: 'Pending',
            trackingId: 'TRK001',
            date: '2024-03-15'
          }
        }
      }).as('orderDetails');

      cy.intercept('PUT', '**/api/v2/seller/orders/ORD001', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Order updated successfully'
        }
      }).as('updateOrder');

      cy.visit('/seller/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.wait('@orderDetails');
      cy.get('[data-testid="order-details"]').should('be.visible');

      // Update order status
      cy.get('[data-testid="status-select"]').select('In Transit');
      cy.get('[data-testid="update-button"]').click();
      cy.wait('@updateOrder');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle bulk order creation', () => {
      cy.intercept('POST', '**/api/v2/seller/orders/bulk', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orders: [
              { orderId: 'ORD001', status: 'Created' },
              { orderId: 'ORD002', status: 'Created' }
            ]
          }
        }
      }).as('bulkCreateOrder');

      cy.visit('/seller/bulk-create-order');
      cy.get('input[type="file"]').attachFile('bulk-orders.csv');
      cy.get('button[type="submit"]').click();
      cy.wait('@bulkCreateOrder');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should process order cancellation', () => {
      cy.intercept('POST', '**/api/v2/seller/orders/*/cancel', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Order cancelled successfully'
        }
      }).as('cancelOrder');

      cy.visit('/seller/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="cancel-order"]').click();
      cy.get('[data-testid="cancel-reason"]').type('Customer request');
      cy.get('[data-testid="confirm-cancel"]').click();
      cy.wait('@cancelOrder');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle order refunds', () => {
      cy.intercept('POST', '**/api/v2/seller/orders/*/refund', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Refund processed successfully'
        }
      }).as('processRefund');

      cy.visit('/seller/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="process-refund"]').click();
      cy.get('[data-testid="refund-amount"]').type('1000');
      cy.get('[data-testid="refund-reason"]').type('Product damaged');
      cy.get('[data-testid="confirm-refund"]').click();
      cy.wait('@processRefund');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should generate shipping labels', () => {
      cy.intercept('GET', '**/api/v2/seller/orders/*/label', {
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename=shipping-label.pdf'
        },
        body: 'mock-pdf-content'
      }).as('generateLabel');

      cy.visit('/seller/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="generate-label"]').click();
      cy.wait('@generateLabel');
    });

    it('should schedule order pickup', () => {
      cy.intercept('POST', '**/api/v2/seller/orders/*/pickup', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Pickup scheduled successfully'
        }
      }).as('schedulePickup');

      cy.visit('/seller/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="schedule-pickup"]').click();
      cy.get('[data-testid="pickup-date"]').type('2024-03-20');
      cy.get('[data-testid="pickup-time"]').type('10:00');
      cy.get('[data-testid="confirm-pickup"]').click();
      cy.wait('@schedulePickup');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Profile Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view company details', () => {
      // Mock profile data
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com',
              phone: '+1234567890',
              companyName: 'Test Company',
              companyCategory: 'Retail',
              brandName: 'Test Brand',
              website: 'https://test.com',
              supportContact: '+1234567890',
              supportEmail: 'support@test.com',
              operationsEmail: 'operations@test.com',
              financeEmail: 'finance@test.com'
            }
          }
        }
      }).as('getProfile');

      cy.visit('/seller/dashboard/profile');
      cy.wait('@getProfile');

      // Verify company details
      cy.get('[data-testid="company-name"]').should('contain', 'Test Company');
      cy.get('[data-testid="company-category"]').should('contain', 'Retail');
      cy.get('[data-testid="brand-name"]').should('contain', 'Test Brand');
      cy.get('[data-testid="website"]').should('contain', 'https://test.com');
    });

    it('should view address details', () => {
      // Mock profile data with address
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com',
              address: {
                street: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                country: 'Test Country',
                postalCode: '123456',
                landmark: 'Test Landmark'
              }
            }
          }
        }
      }).as('getProfile');

      cy.visit('/seller/dashboard/profile');
      cy.wait('@getProfile');

      // Switch to address tab
      cy.get('[data-testid="address-tab"]').click();

      // Verify address details
      cy.get('[data-testid="street"]').should('contain', '123 Test St');
      cy.get('[data-testid="city"]').should('contain', 'Test City');
      cy.get('[data-testid="state"]').should('contain', 'Test State');
      cy.get('[data-testid="country"]').should('contain', 'Test Country');
      cy.get('[data-testid="postal-code"]').should('contain', '123456');
      cy.get('[data-testid="landmark"]').should('contain', 'Test Landmark');
    });

    it('should view document details', () => {
      // Mock profile data with documents
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com',
              documents: {
                gstin: 'GST123456789',
                pan: 'PAN123456789',
                cin: 'CIN123456789',
                tradeLicense: 'TL123456789',
                msmeRegistration: 'MSME123456789',
                aadhaar: 'AADHAAR123456789',
                documents: [
                  {
                    name: 'GST Certificate',
                    type: 'pdf',
                    url: 'https://test.com/documents/gst.pdf',
                    status: 'verified'
                  }
                ]
              }
            }
          }
        }
      }).as('getProfile');

      cy.visit('/seller/dashboard/profile');
      cy.wait('@getProfile');

      // Switch to documents tab
      cy.get('[data-testid="documents-tab"]').click();

      // Verify document details
      cy.get('[data-testid="gstin"]').should('contain', 'GST123456789');
      cy.get('[data-testid="pan"]').should('contain', 'PAN123456789');
      cy.get('[data-testid="cin"]').should('contain', 'CIN123456789');
      cy.get('[data-testid="trade-license"]').should('contain', 'TL123456789');
      cy.get('[data-testid="msme-registration"]').should('contain', 'MSME123456789');
      cy.get('[data-testid="aadhaar"]').should('contain', 'AADHAAR123456789');
    });

    it('should view bank details', () => {
      // Mock profile data with bank details
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com',
              bankDetails: [
                {
                  accountName: 'Test Company',
                  accountNumber: '1234567890',
                  bankName: 'Test Bank',
                  branch: 'Test Branch',
                  ifscCode: 'TEST1234567',
                  swiftCode: 'TESTUS123',
                  accountType: 'Current',
                  isDefault: true,
                  cancelledCheque: {
                    url: 'https://test.com/documents/cheque.pdf',
                    status: 'verified'
                  }
                }
              ]
            }
          }
        }
      }).as('getProfile');

      cy.visit('/seller/dashboard/profile');
      cy.wait('@getProfile');

      // Switch to bank details tab
      cy.get('[data-testid="bank-details-tab"]').click();

      // Verify bank details
      cy.get('[data-testid="account-name"]').should('contain', 'Test Company');
      cy.get('[data-testid="account-number"]').should('contain', '1234567890');
      cy.get('[data-testid="bank-name"]').should('contain', 'Test Bank');
      cy.get('[data-testid="branch"]').should('contain', 'Test Branch');
      cy.get('[data-testid="ifsc-code"]').should('contain', 'TEST1234567');
      cy.get('[data-testid="swift-code"]').should('contain', 'TESTUS123');
      cy.get('[data-testid="account-type"]').should('contain', 'Current');
    });

    it('should request profile edit', () => {
      // Mock profile data
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com',
              companyName: 'Test Company'
            }
          }
        }
      }).as('getProfile');

      // Mock edit request
      cy.intercept('POST', '/api/v1/seller/profile/edit-request', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Edit request submitted successfully'
          }
        }
      }).as('editRequest');

      cy.visit('/seller/dashboard/profile');
      cy.wait('@getProfile');

      // Click edit request button
      cy.get('[data-testid="edit-request-button"]').click();
      cy.wait('@editRequest');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Edit request submitted successfully');
    });
  });

  describe('Reports', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should generate sales report', () => {
      cy.intercept('GET', '**/api/v2/seller/reports/sales', {
        statusCode: 200,
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename=sales-report.csv'
        },
        body: 'date,orders,revenue\n2024-03-15,10,5000'
      }).as('salesReport');

      cy.visit('/seller/reports');
      cy.get('[data-testid="date-range-picker"]').click();
      cy.get('[data-testid="date-range-calendar"]').contains('15').click();
      cy.get('[data-testid="date-range-calendar"]').contains('20').click();
      cy.get('[data-testid="generate-report"]').click();
      cy.wait('@salesReport');
    });

    it('should view performance metrics', () => {
      cy.intercept('GET', '**/api/v2/seller/reports/performance', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalOrders: 100,
            averageOrderValue: 500,
            deliverySuccessRate: 95,
            customerSatisfaction: 4.5
          }
        }
      }).as('performanceMetrics');

      cy.visit('/seller/reports/performance');
      cy.wait('@performanceMetrics');
      cy.get('[data-testid="performance-metrics"]').should('be.visible');
      cy.get('[data-testid="metric-card"]').should('have.length', 4);
    });
  });

  describe('Inventory Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should manage product inventory', () => {
      cy.intercept('GET', '**/api/v2/seller/inventory', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Product',
              sku: 'SKU001',
              stock: 100,
              price: 1000
            }
          ]
        }
      }).as('getInventory');

      cy.intercept('PUT', '**/api/v2/seller/inventory/*', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Inventory updated successfully'
        }
      }).as('updateInventory');

      cy.visit('/seller/inventory');
      cy.wait('@getInventory');
      cy.get('[data-testid="inventory-table"]').should('be.visible');
      
      // Update stock
      cy.get('[data-testid="product-row"]').first().click();
      cy.get('[data-testid="stock-input"]').clear().type('150');
      cy.get('[data-testid="update-stock"]').click();
      cy.wait('@updateInventory');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should manage product categories', () => {
      cy.intercept('GET', '**/api/v2/seller/categories', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              name: 'Electronics',
              productCount: 10
            }
          ]
        }
      }).as('getCategories');

      cy.intercept('POST', '**/api/v2/seller/categories', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Category created successfully'
        }
      }).as('createCategory');

      cy.visit('/seller/categories');
      cy.wait('@getCategories');
      cy.get('[data-testid="categories-table"]').should('be.visible');
      
      // Create new category
      cy.get('[data-testid="add-category"]').click();
      cy.get('[data-testid="category-name"]').type('New Category');
      cy.get('[data-testid="save-category"]').click();
      cy.wait('@createCategory');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Analytics', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view sales trends', () => {
      cy.intercept('GET', '**/api/v2/seller/analytics/sales-trends', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            daily: [
              { date: '2024-03-15', sales: 5000 },
              { date: '2024-03-16', sales: 6000 }
            ],
            monthly: [
              { month: '2024-03', sales: 150000 }
            ]
          }
        }
      }).as('getSalesTrends');

      cy.visit('/seller/analytics/sales');
      cy.wait('@getSalesTrends');
      cy.get('[data-testid="sales-chart"]').should('be.visible');
      cy.get('[data-testid="trend-toggle"]').click();
      cy.wait('@getSalesTrends');
    });

    it('should view customer demographics', () => {
      cy.intercept('GET', '**/api/v2/seller/analytics/customer-demographics', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            ageGroups: [
              { group: '18-24', percentage: 30 },
              { group: '25-34', percentage: 40 }
            ],
            locations: [
              { city: 'Mumbai', orders: 100 },
              { city: 'Delhi', orders: 80 }
            ]
          }
        }
      }).as('getDemographics');

      cy.visit('/seller/analytics/customers');
      cy.wait('@getDemographics');
      cy.get('[data-testid="demographics-chart"]').should('be.visible');
    });

    it('should view product performance', () => {
      cy.intercept('GET', '**/api/v2/seller/analytics/product-performance', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              productId: '1',
              name: 'Test Product',
              sales: 100,
              revenue: 10000,
              rating: 4.5
            }
          ]
        }
      }).as('getProductPerformance');

      cy.visit('/seller/analytics/products');
      cy.wait('@getProductPerformance');
      cy.get('[data-testid="product-performance-table"]').should('be.visible');
    });
  });

  describe('Payment Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view payment history', () => {
      cy.intercept('GET', '**/api/v2/seller/payments', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              date: '2024-03-15',
              amount: 50000,
              status: 'Completed',
              type: 'Settlement'
            }
          ]
        }
      }).as('getPayments');

      cy.visit('/seller/payments');
      cy.wait('@getPayments');
      cy.get('[data-testid="payments-table"]').should('be.visible');
      cy.get('[data-testid="payment-row"]').should('have.length.at.least', 1);
    });

    it('should view settlement reports', () => {
      cy.intercept('GET', '**/api/v2/seller/payments/settlements', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalSettled: 500000,
            pendingSettlement: 50000,
            settlements: [
              {
                id: '1',
                period: '2024-03',
                amount: 150000,
                status: 'Completed'
              }
            ]
          }
        }
      }).as('getSettlements');

      cy.visit('/seller/payments/settlements');
      cy.wait('@getSettlements');
      cy.get('[data-testid="settlements-table"]').should('be.visible');
      cy.get('[data-testid="settlement-summary"]').should('be.visible');
    });

    it('should handle payment disputes', () => {
      cy.intercept('GET', '**/api/v2/seller/payments/disputes', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              orderId: 'ORD001',
              amount: 1000,
              reason: 'Product not received',
              status: 'Open'
            }
          ]
        }
      }).as('getDisputes');

      cy.intercept('POST', '**/api/v2/seller/payments/disputes/*/resolve', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Dispute resolved successfully'
        }
      }).as('resolveDispute');

      cy.visit('/seller/payments/disputes');
      cy.wait('@getDisputes');
      cy.get('[data-testid="disputes-table"]').should('be.visible');
      
      // Resolve dispute
      cy.get('[data-testid="dispute-row"]').first().click();
      cy.get('[data-testid="resolve-dispute"]').click();
      cy.get('[data-testid="resolution-note"]').type('Customer received refund');
      cy.get('[data-testid="confirm-resolution"]').click();
      cy.wait('@resolveDispute');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Wallet Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view wallet balance', () => {
      cy.intercept('GET', '**/api/v2/seller/wallet/balance', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            walletBalance: 5000,
            lastRecharge: 3000,
            remittanceBalance: 2000,
            lastUpdated: '2024-01-01T00:00:00.000Z'
          }
        }
      }).as('getWalletBalance');

      cy.visit('/seller/wallet');
      cy.wait('@getWalletBalance');
      cy.get('[data-testid="wallet-balance"]').should('contain', '5000');
      cy.get('[data-testid="last-recharge"]').should('contain', '3000');
      cy.get('[data-testid="remittance-balance"]').should('contain', '2000');
    });

    it('should recharge wallet', () => {
      cy.intercept('POST', '**/api/v2/seller/wallet/recharge/initiate', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orderId: 'rzp_123456',
            amount: 5000,
            currency: 'INR',
            key: 'rzp_test_key',
            name: 'Wallet Recharge',
            description: 'Recharge of Rs 5000',
            prefill: {
              name: 'Test Seller',
              email: 'seller@example.com',
              contact: '9876543210'
            }
          }
        }
      }).as('initiateRecharge');

      cy.intercept('POST', '**/api/v2/seller/wallet/recharge/verify', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            transaction: {
              id: '1',
              referenceNumber: 'PAY_123456',
              type: 'Recharge',
              amount: '5000',
              closingBalance: '10000',
              remark: 'Wallet recharge via Razorpay'
            },
            balance: '10000'
          }
        }
      }).as('verifyRecharge');

      cy.visit('/seller/wallet');
      cy.get('[data-testid="recharge-wallet"]').click();
      cy.get('[data-testid="recharge-amount"]').type('5000');
      cy.get('[data-testid="payment-method"]').select('razorpay');
      cy.get('[data-testid="submit-recharge"]').click();
      cy.wait('@initiateRecharge');
      // Mock Razorpay payment success
      cy.window().then((win) => {
        win.postMessage({ type: 'razorpay_payment_success', paymentId: 'PAY_123456' }, '*');
      });
      cy.wait('@verifyRecharge');
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="wallet-balance"]').should('contain', '10000');
    });

    it('should view transaction history', () => {
      cy.intercept('GET', '**/api/v2/seller/wallet/transactions*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            transactions: [
              {
                id: '1',
                date: '2024-01-01',
                referenceNumber: 'REF123456',
                type: 'Recharge',
                amount: '5000',
                closingBalance: '5000',
                remark: 'Wallet recharge'
              },
              {
                id: '2',
                date: '2024-01-02',
                referenceNumber: 'REF789012',
                type: 'Debit',
                amount: '1000',
                closingBalance: '4000',
                remark: 'Shipping charges'
              }
            ],
            pagination: {
              total: 2,
              page: 1,
              pages: 1
            }
          }
        }
      }).as('getTransactions');

      cy.visit('/seller/wallet/transactions');
      cy.wait('@getTransactions');
      cy.get('[data-testid="transaction-row"]').should('have.length', 2);
      cy.get('[data-testid="transaction-type"]').first().should('contain', 'Recharge');
      cy.get('[data-testid="transaction-amount"]').first().should('contain', '5000');
    });

    it('should filter transactions', () => {
      cy.intercept('GET', '**/api/v2/seller/wallet/transactions*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            transactions: [
              {
                id: '1',
                date: '2024-01-01',
                referenceNumber: 'REF123456',
                type: 'Recharge',
                amount: '5000',
                closingBalance: '5000',
                remark: 'Wallet recharge'
              }
            ],
            pagination: {
              total: 1,
              page: 1,
              pages: 1
            }
          }
        }
      }).as('getFilteredTransactions');

      cy.visit('/seller/wallet/transactions');
      cy.get('[data-testid="filter-type"]').select('Recharge');
      cy.get('[data-testid="filter-date-from"]').type('2024-01-01');
      cy.get('[data-testid="filter-date-to"]').type('2024-01-31');
      cy.get('[data-testid="apply-filters"]').click();
      cy.wait('@getFilteredTransactions');
      cy.get('[data-testid="transaction-row"]').should('have.length', 1);
      cy.get('[data-testid="transaction-type"]').should('contain', 'Recharge');
    });

    it('should export transaction history', () => {
      cy.intercept('GET', '**/api/v2/seller/wallet/transactions/export*', {
        statusCode: 200,
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': 'attachment; filename=wallet-transactions.xlsx'
        },
        body: 'mock-excel-content'
      }).as('exportTransactions');

      cy.visit('/seller/wallet/transactions');
      cy.get('[data-testid="export-transactions"]').click();
      cy.get('[data-testid="export-format"]').select('xlsx');
      cy.get('[data-testid="export-date-from"]').type('2024-01-01');
      cy.get('[data-testid="export-date-to"]').type('2024-01-31');
      cy.get('[data-testid="generate-export"]').click();
      cy.wait('@exportTransactions');
    });
  });

  describe('NDR Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should list and filter NDRs', () => {
      cy.intercept('GET', '**/api/v2/seller/ndr', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              awb: 'NDR001',
              orderDate: '2024-03-15',
              courier: 'Delhivery',
              customer: 'Test Customer',
              attempts: 2,
              lastAttemptDate: '2024-03-16',
              status: 'Pending',
              reason: 'Customer not available',
              action: 'Reattempt delivery'
            }
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1
          }
        }
      }).as('getNDRs');

      cy.visit('/seller/ndr');
      cy.wait('@getNDRs');
      cy.get('[data-testid="ndr-table"]').should('be.visible');
      cy.get('[data-testid="ndr-row"]').should('have.length.at.least', 1);

      // Test status filter
      cy.get('[data-testid="status-filter"]').select('Pending');
      cy.wait('@getNDRs');

      // Test date filter
      cy.get('[data-testid="date-filter"]').click();
      cy.get('[data-testid="date-picker"]').should('be.visible');
      cy.get('[data-testid="date-picker"]').contains('15').click();
      cy.wait('@getNDRs');
    });

    it('should handle NDR reattempt', () => {
      cy.intercept('POST', '**/api/v2/seller/ndr/*/reattempt', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'NDR001',
            awb: 'NDR001',
            status: 'reattempt_scheduled',
            message: 'Reattempt scheduled successfully',
            reattempt_id: 'REA001',
            scheduled_date: '2024-03-20'
          }
        }
      }).as('reattemptNDR');

      cy.visit('/seller/ndr');
      cy.get('[data-testid="ndr-row"]').first().click();
      cy.get('[data-testid="reattempt-button"]').click();
      cy.get('[data-testid="preferred-date"]').type('2024-03-20');
      cy.get('[data-testid="remarks"]').type('Customer requested evening delivery');
      cy.get('[data-testid="confirm-reattempt"]').click();
      cy.wait('@reattemptNDR');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle NDR return', () => {
      cy.intercept('POST', '**/api/v2/seller/ndr/*/return', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'NDR001',
            awb: 'NDR001',
            status: 'return_initiated',
            message: 'Return initiated successfully',
            return_id: 'RET001'
          }
        }
      }).as('returnNDR');

      cy.visit('/seller/ndr');
      cy.get('[data-testid="ndr-row"]').first().click();
      cy.get('[data-testid="return-button"]').click();
      cy.get('[data-testid="return-reason"]').type('Customer refused delivery');
      cy.get('[data-testid="remarks"]').type('Product damaged');
      cy.get('[data-testid="confirm-return"]').click();
      cy.wait('@returnNDR');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should handle bulk NDR upload', () => {
      cy.intercept('POST', '**/api/v2/seller/ndr/bulk-upload', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            upload_id: 'UPL001',
            total: 10,
            processed: 8,
            failed: 2,
            message: 'Bulk upload processed successfully',
            errors: [
              {
                awb: 'NDR002',
                error: 'Invalid AWB number'
              }
            ]
          }
        }
      }).as('bulkUploadNDR');

      cy.visit('/seller/ndr');
      cy.get('[data-testid="bulk-upload-button"]').click();
      cy.get('input[type="file"]').attachFile('bulk-ndr.csv');
      cy.get('[data-testid="action-select"]').select('return');
      cy.get('[data-testid="upload-button"]').click();
      cy.wait('@bulkUploadNDR');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should generate NDR report', () => {
      cy.intercept('GET', '**/api/v2/seller/ndr/report', {
        statusCode: 200,
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': 'attachment; filename=ndr-report.xlsx'
        },
        body: 'mock-excel-content'
      }).as('generateNDRReport');

      cy.visit('/seller/ndr');
      cy.get('[data-testid="date-range-picker"]').click();
      cy.get('[data-testid="date-range-calendar"]').contains('1').click();
      cy.get('[data-testid="date-range-calendar"]').contains('15').click();
      cy.get('[data-testid="generate-report"]').click();
      cy.wait('@generateNDRReport');
    });
  });

  describe('Rate Card Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view rate card', () => {
      cy.intercept('GET', '**/api/v2/seller/rate-card', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            rateBand: 'Premium',
            lastUpdated: '2024-03-15T10:00:00Z',
            couriers: [
              {
                name: 'Delhivery Surface',
                rates: {
                  withinCity: 32,
                  withinState: 34,
                  metroToMetro: 46,
                  restOfIndia: 49,
                  northEastJK: 68
                },
                codCharge: 35,
                codPercent: 1.75
              }
            ]
          }
        }
      }).as('getRateCard');

      cy.visit('/seller/billing/rate-card');
      cy.wait('@getRateCard');
      cy.get('[data-testid="rate-card-table"]').should('be.visible');
      cy.get('[data-testid="rate-card-row"]').should('have.length.at.least', 1);
      cy.get('[data-testid="last-updated"]').should('be.visible');
    });

    it('should calculate shipping rates', () => {
      cy.intercept('POST', '**/api/v2/seller/rate-card/calculate', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            rates: [
              {
                courier: 'Delhivery Surface',
                serviceType: 'Surface',
                deliveryTime: '2-3 days',
                baseRate: 46,
                weightCharge: 0,
                fuelSurcharge: 4.6,
                codCharge: 0,
                gst: 9.08,
                totalCharge: 59.68,
                isRecommended: true
              }
            ]
          }
        }
      }).as('calculateRates');

      cy.visit('/seller/rate-calculator');
      cy.get('[data-testid="pickup-pincode"]').type('400001');
      cy.get('[data-testid="delivery-pincode"]').type('110001');
      cy.get('[data-testid="package-weight"]').type('0.5');
      cy.get('[data-testid="package-length"]').type('10');
      cy.get('[data-testid="package-width"]').type('10');
      cy.get('[data-testid="package-height"]').type('10');
      cy.get('[data-testid="calculate-rates"]').click();
      cy.wait('@calculateRates');
      cy.get('[data-testid="rates-table"]').should('be.visible');
      cy.get('[data-testid="rate-row"]').should('have.length.at.least', 1);
    });

    it('should calculate COD shipping rates', () => {
      cy.intercept('POST', '**/api/v2/seller/rate-card/calculate', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            rates: [
              {
                courier: 'Delhivery Surface',
                serviceType: 'Surface',
                deliveryTime: '2-3 days',
                baseRate: 46,
                weightCharge: 0,
                fuelSurcharge: 4.6,
                codCharge: 35,
                gst: 15.38,
                totalCharge: 100.98,
                isRecommended: true
              }
            ]
          }
        }
      }).as('calculateCODRates');

      cy.visit('/seller/rate-calculator');
      cy.get('[data-testid="pickup-pincode"]').type('400001');
      cy.get('[data-testid="delivery-pincode"]').type('110001');
      cy.get('[data-testid="package-weight"]').type('0.5');
      cy.get('[data-testid="package-length"]').type('10');
      cy.get('[data-testid="package-width"]').type('10');
      cy.get('[data-testid="package-height"]').type('10');
      cy.get('[data-testid="payment-type"]').select('COD');
      cy.get('[data-testid="purchase-amount"]').type('1000');
      cy.get('[data-testid="calculate-rates"]').click();
      cy.wait('@calculateCODRates');
      cy.get('[data-testid="rates-table"]').should('be.visible');
      cy.get('[data-testid="rate-row"]').should('have.length.at.least', 1);
      cy.get('[data-testid="cod-charge"]').should('be.visible');
    });

    it('should handle rate calculation errors', () => {
      cy.intercept('POST', '**/api/v2/seller/rate-card/calculate', {
        statusCode: 400,
        body: {
          success: false,
          error: {
            code: 'INVALID_PINCODE',
            message: 'Invalid pickup or delivery pincode'
          }
        }
      }).as('calculateRatesError');

      cy.visit('/seller/rate-calculator');
      cy.get('[data-testid="pickup-pincode"]').type('12345');
      cy.get('[data-testid="delivery-pincode"]').type('12345');
      cy.get('[data-testid="package-weight"]').type('0.5');
      cy.get('[data-testid="calculate-rates"]').click();
      cy.wait('@calculateRatesError');
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('Manifest Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should list and filter manifests', () => {
      cy.intercept('GET', '**/api/v2/seller/manifests', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            manifests: [
              {
                manifestId: 'MF123456',
                date: '2024-03-15',
                courier: 'Delhivery',
                orders: 5,
                pickupStatus: 'Pending',
                warehouse: 'Mumbai Central',
                status: 'Processing'
              }
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        }
      }).as('getManifests');

      cy.visit('/seller/manifests');
      cy.wait('@getManifests');
      cy.get('[data-testid="manifest-table"]').should('be.visible');
      cy.get('[data-testid="manifest-row"]').should('have.length.at.least', 1);

      // Test status filter
      cy.get('[data-testid="status-filter"]').select('Processing');
      cy.wait('@getManifests');

      // Test date filter
      cy.get('[data-testid="date-filter"]').click();
      cy.get('[data-testid="date-picker"]').should('be.visible');
      cy.get('[data-testid="date-picker"]').contains('15').click();
      cy.wait('@getManifests');
    });

    it('should create a new manifest', () => {
      cy.intercept('POST', '**/api/v2/seller/manifests', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            manifest: {
              manifestId: 'MF123457',
              date: '2024-03-16',
              courier: 'Delhivery',
              orders: 3,
              pickupStatus: 'Scheduled',
              warehouse: 'Mumbai Central',
              status: 'Processing'
            }
          }
        }
      }).as('createManifest');

      cy.visit('/seller/manifests');
      cy.get('[data-testid="create-manifest"]').click();
      cy.get('[data-testid="courier-select"]').select('Delhivery');
      cy.get('[data-testid="warehouse-select"]').select('Mumbai Central');
      cy.get('[data-testid="pickup-date"]').type('2024-03-16');
      cy.get('[data-testid="order-checkbox"]').first().check();
      cy.get('[data-testid="create-button"]').click();
      cy.wait('@createManifest');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should update manifest status', () => {
      cy.intercept('PUT', '**/api/v2/seller/manifests/*/status', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Manifest status updated successfully'
          }
        }
      }).as('updateManifestStatus');

      cy.visit('/seller/manifests');
      cy.get('[data-testid="manifest-row"]').first().click();
      cy.get('[data-testid="update-status"]').click();
      cy.get('[data-testid="status-select"]').select('Completed');
      cy.get('[data-testid="pickup-status-select"]').select('Completed');
      cy.get('[data-testid="confirm-update"]').click();
      cy.wait('@updateManifestStatus');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should download manifest', () => {
      cy.intercept('GET', '**/api/v2/seller/manifests/*/download', {
        statusCode: 200,
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': 'attachment; filename=manifest.xlsx'
        },
        body: 'mock-excel-content'
      }).as('downloadManifest');

      cy.visit('/seller/manifests');
      cy.get('[data-testid="manifest-row"]').first().click();
      cy.get('[data-testid="download-manifest"]').click();
      cy.wait('@downloadManifest');
    });
  });

  describe('Shipment Tracking', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should track single shipment', () => {
      cy.intercept('GET', '**/api/v2/seller/shipments/*/track', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            awb: 'SHIP001',
            courier: 'Delhivery',
            status: 'In-transit',
            expectedDelivery: '2024-03-20',
            origin: 'Mumbai',
            destination: 'Delhi',
            weight: '1.5 kg',
            trackingHistory: [
              {
                status: 'Booked',
                location: 'Mumbai',
                timestamp: '2024-03-15T10:00:00Z',
                description: 'Shipment booked'
              },
              {
                status: 'In-transit',
                location: 'Mumbai Hub',
                timestamp: '2024-03-15T14:00:00Z',
                description: 'Shipment in transit'
              }
            ]
          }
        }
      }).as('trackShipment');

      cy.visit('/seller/shipments');
      cy.get('[data-testid="track-shipment"]').first().click();
      cy.wait('@trackShipment');
      cy.get('[data-testid="tracking-details"]').should('be.visible');
      cy.get('[data-testid="tracking-history"]').should('have.length.at.least', 2);
    });

    it('should track multiple shipments', () => {
      cy.intercept('POST', '**/api/v2/seller/shipments/bulk-track', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              awb: 'SHIP001',
              courier: 'Delhivery',
              status: 'In-transit',
              lastUpdated: '2024-03-15T14:00:00Z'
            },
            {
              awb: 'SHIP002',
              courier: 'Blue Dart',
              status: 'Delivered',
              lastUpdated: '2024-03-15T16:00:00Z'
            }
          ]
        }
      }).as('bulkTrackShipments');

      cy.visit('/seller/shipments');
      cy.get('[data-testid="bulk-track"]').click();
      cy.get('[data-testid="awb-input"]').type('SHIP001,SHIP002');
      cy.get('[data-testid="track-button"]').click();
      cy.wait('@bulkTrackShipments');
      cy.get('[data-testid="tracking-results"]').should('be.visible');
      cy.get('[data-testid="tracking-row"]').should('have.length', 2);
    });

    it('should print shipping label', () => {
      cy.intercept('GET', '**/api/v2/seller/shipments/*/label', {
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename=shipping-label.pdf'
        },
        body: 'mock-pdf-content'
      }).as('printLabel');

      cy.visit('/seller/shipments');
      cy.get('[data-testid="shipment-row"]').first().click();
      cy.get('[data-testid="print-label"]').click();
      cy.get('[data-testid="label-format"]').select('A4');
      cy.get('[data-testid="print-button"]').click();
      cy.wait('@printLabel');
    });

    it('should cancel shipment', () => {
      cy.intercept('POST', '**/api/v2/seller/shipments/*/cancel', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Shipment cancelled successfully',
            cancellationId: 'CANC001'
          }
        }
      }).as('cancelShipment');

      cy.visit('/seller/shipments');
      cy.get('[data-testid="shipment-row"]').first().click();
      cy.get('[data-testid="cancel-shipment"]').click();
      cy.get('[data-testid="cancel-reason"]').type('Customer requested cancellation');
      cy.get('[data-testid="confirm-cancel"]').click();
      cy.wait('@cancelShipment');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Warehouse Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view warehouse inventory', () => {
      // Mock warehouse items
      cy.intercept('GET', '/api/v1/seller/warehouse/items*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: [
              {
                id: '1',
                name: 'Premium Laptop',
                sku: 'LAP001',
                quantity: 50,
                location: 'A-123',
                status: 'In Stock',
                lastUpdated: '2024-03-25'
              },
              {
                id: '2',
                name: 'Wireless Mouse',
                sku: 'MOU001',
                quantity: 5,
                location: 'B-456',
                status: 'Low Stock',
                lastUpdated: '2024-03-25'
              }
            ],
            total: 2,
            page: 1,
            limit: 20,
            totalPages: 1
          }
        }
      }).as('getWarehouseItems');

      cy.visit('/seller/dashboard/warehouse');
      cy.wait('@getWarehouseItems');

      // Verify inventory stats
      cy.get('[data-testid="total-items"]').should('contain', '2');
      cy.get('[data-testid="low-stock-items"]').should('contain', '1');
      cy.get('[data-testid="out-of-stock-items"]').should('contain', '0');

      // Verify inventory table
      cy.get('[data-testid="inventory-table"]').should('be.visible');
      cy.get('[data-testid="inventory-row"]').should('have.length', 2);
      cy.get('[data-testid="item-name"]').first().should('contain', 'Premium Laptop');
      cy.get('[data-testid="item-sku"]').first().should('contain', 'LAP001');
      cy.get('[data-testid="item-quantity"]').first().should('contain', '50');
      cy.get('[data-testid="item-location"]').first().should('contain', 'A-123');
      cy.get('[data-testid="item-status"]').first().should('contain', 'In Stock');
    });

    it('should search and filter inventory', () => {
      // Mock warehouse items
      cy.intercept('GET', '/api/v1/seller/warehouse/items*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: [
              {
                id: '1',
                name: 'Premium Laptop',
                sku: 'LAP001',
                quantity: 50,
                location: 'A-123',
                status: 'In Stock',
                lastUpdated: '2024-03-25'
              }
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1
          }
        }
      }).as('getWarehouseItems');

      cy.visit('/seller/dashboard/warehouse');
      cy.wait('@getWarehouseItems');

      // Search by name
      cy.get('[data-testid="search-input"]').type('Laptop');
      cy.wait('@getWarehouseItems');
      cy.get('[data-testid="inventory-row"]').should('have.length', 1);

      // Filter by status
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="status-in-stock"]').click();
      cy.wait('@getWarehouseItems');
      cy.get('[data-testid="inventory-row"]').should('have.length', 1);

      // Filter by location
      cy.get('[data-testid="location-filter"]').click();
      cy.get('[data-testid="location-A-123"]').click();
      cy.wait('@getWarehouseItems');
      cy.get('[data-testid="inventory-row"]').should('have.length', 1);
    });

    it('should add stock to inventory item', () => {
      // Mock warehouse items
      cy.intercept('GET', '/api/v1/seller/warehouse/items*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: [
              {
                id: '1',
                name: 'Premium Laptop',
                sku: 'LAP001',
                quantity: 50,
                location: 'A-123',
                status: 'In Stock',
                lastUpdated: '2024-03-25'
              }
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1
          }
        }
      }).as('getWarehouseItems');

      // Mock add stock
      cy.intercept('POST', '/api/v1/seller/warehouse/items/1/stock', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Stock added successfully',
            item: {
              id: '1',
              name: 'Premium Laptop',
              sku: 'LAP001',
              quantity: 60,
              location: 'A-123',
              status: 'In Stock',
              lastUpdated: '2024-03-25'
            }
          }
        }
      }).as('addStock');

      cy.visit('/seller/dashboard/warehouse');
      cy.wait('@getWarehouseItems');

      // Add stock
      cy.get('[data-testid="add-stock-button"]').first().click();
      cy.get('[data-testid="quantity-input"]').type('10');
      cy.get('[data-testid="location-input"]').type('A-123');
      cy.get('[data-testid="notes-input"]').type('Restocking inventory');
      cy.get('[data-testid="submit-button"]').click();
      cy.wait('@addStock');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Stock added successfully');
      cy.get('[data-testid="item-quantity"]').first().should('contain', '60');
    });

    it('should transfer stock between locations', () => {
      // Mock warehouse items
      cy.intercept('GET', '/api/v1/seller/warehouse/items*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: [
              {
                id: '1',
                name: 'Premium Laptop',
                sku: 'LAP001',
                quantity: 50,
                location: 'A-123',
                status: 'In Stock',
                lastUpdated: '2024-03-25'
              }
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1
          }
        }
      }).as('getWarehouseItems');

      // Mock transfer stock
      cy.intercept('POST', '/api/v1/seller/warehouse/items/1/transfer', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Stock transferred successfully',
            transfer: {
              id: '1',
              itemId: '1',
              quantity: 20,
              fromLocation: 'A-123',
              toLocation: 'B-456',
              timestamp: '2024-03-25T10:00:00Z',
              notes: 'Moving to new location'
            }
          }
        }
      }).as('transferStock');

      cy.visit('/seller/dashboard/warehouse');
      cy.wait('@getWarehouseItems');

      // Transfer stock
      cy.get('[data-testid="transfer-button"]').first().click();
      cy.get('[data-testid="quantity-input"]').type('20');
      cy.get('[data-testid="from-location-input"]').type('A-123');
      cy.get('[data-testid="to-location-input"]').type('B-456');
      cy.get('[data-testid="notes-input"]').type('Moving to new location');
      cy.get('[data-testid="submit-button"]').click();
      cy.wait('@transferStock');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Stock transferred successfully');
    });
  });

  describe('Authentication Features', () => {
    it('should handle login with valid credentials', () => {
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
      cy.url().should('include', '/seller/dashboard');
    });

    it('should handle login with invalid credentials', () => {
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          error: 'Invalid credentials'
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('wrong-password');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
    });

    it('should handle password reset flow', () => {
      // Mock OTP send request
      cy.intercept('POST', '/api/v1/seller/auth/otp/send', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'OTP sent successfully',
            otp: '123456',
            expiresIn: 600
          }
        }
      }).as('sendOtpRequest');

      // Mock OTP verify request
      cy.intercept('POST', '/api/v1/seller/auth/otp/verify', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'OTP verified successfully'
          }
        }
      }).as('verifyOtpRequest');

      // Mock password reset request
      cy.intercept('POST', '/api/v1/seller/auth/reset-password', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Password reset successful'
          }
        }
      }).as('resetPasswordRequest');

      cy.visit('/seller/auth/login');
      cy.get('[data-testid="forgot-password"]').click();
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('[data-testid="send-otp"]').click();
      cy.wait('@sendOtpRequest');

      cy.get('input[name="otp"]').type('123456');
      cy.get('[data-testid="verify-otp"]').click();
      cy.wait('@verifyOtpRequest');

      cy.get('input[name="newPassword"]').type('NewTest@123');
      cy.get('input[name="confirmPassword"]').type('NewTest@123');
      cy.get('[data-testid="reset-password"]').click();
      cy.wait('@resetPasswordRequest');
      cy.get('[data-testid="success-message"]').should('contain', 'Password reset successful');
    });

    it('should handle session timeout', () => {
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      // Mock session timeout
      cy.intercept('GET', '/api/v1/seller/auth/check-session', {
        statusCode: 401,
        body: {
          success: false,
          error: 'Session expired'
        }
      }).as('checkSession');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');

      // Wait for session timeout
      cy.wait('@checkSession');
      cy.url().should('include', '/seller/auth/login');
      cy.get('[data-testid="error-message"]').should('contain', 'Session expired');
    });
  });

  describe('Store Settings Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should configure store type and API credentials', () => {
      // Mock store settings
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              storeLinks: {
                website: 'https://test.com',
                amazon: 'https://amazon.com/test'
              }
            }
          }
        }
      }).as('getProfile');

      // Mock update profile
      cy.intercept('PUT', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Store settings updated successfully'
          }
        }
      }).as('updateProfile');

      cy.visit('/seller/dashboard/settings/manage-store');
      cy.wait('@getProfile');

      // Select store type
      cy.get('[data-testid="store-type-select"]').click();
      cy.get('[data-testid="store-type-amazon"]').click();

      // Enter store URL
      cy.get('[data-testid="store-url-input"]').clear().type('https://amazon.com/test');

      // Enter API credentials
      cy.get('[data-testid="api-key-input"]').clear().type('test-api-key');
      cy.get('[data-testid="api-secret-input"]').clear().type('test-api-secret');

      // Save changes
      cy.get('[data-testid="save-button"]').click();
      cy.wait('@updateProfile');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Store settings updated successfully');
    });

    it('should configure automation settings', () => {
      // Mock store settings
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              settings: {
                autoFetch: false,
                autoCreate: false,
                autoNotify: false
              }
            }
          }
        }
      }).as('getProfile');

      // Mock update profile
      cy.intercept('PUT', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Automation settings updated successfully'
          }
        }
      }).as('updateProfile');

      cy.visit('/seller/dashboard/settings/manage-store');
      cy.wait('@getProfile');

      // Enable automation settings
      cy.get('[data-testid="auto-fetch-switch"]').click();
      cy.get('[data-testid="auto-create-switch"]').click();
      cy.get('[data-testid="auto-notify-switch"]').click();

      // Save changes
      cy.get('[data-testid="save-button"]').click();
      cy.wait('@updateProfile');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Automation settings updated successfully');
    });

    it('should configure default shipping mode', () => {
      // Mock store settings
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              settings: {
                defaultShippingMode: 'standard'
              }
            }
          }
        }
      }).as('getProfile');

      // Mock update profile
      cy.intercept('PUT', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Shipping mode updated successfully'
          }
        }
      }).as('updateProfile');

      cy.visit('/seller/dashboard/settings/manage-store');
      cy.wait('@getProfile');

      // Select shipping mode
      cy.get('[data-testid="shipping-mode-select"]').click();
      cy.get('[data-testid="shipping-mode-express"]').click();

      // Save changes
      cy.get('[data-testid="save-button"]').click();
      cy.wait('@updateProfile');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Shipping mode updated successfully');
    });

    it('should test store connection', () => {
      // Mock store settings
      cy.intercept('GET', '/api/v1/seller/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            profile: {
              id: 'mock-seller-id',
              storeLinks: {
                amazon: 'https://amazon.com/test'
              }
            }
          }
        }
      }).as('getProfile');

      // Mock connection test
      cy.intercept('POST', '/api/v1/seller/store/test-connection', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Connection successful'
          }
        }
      }).as('testConnection');

      cy.visit('/seller/dashboard/settings/manage-store');
      cy.wait('@getProfile');

      // Enter API credentials
      cy.get('[data-testid="api-key-input"]').clear().type('test-api-key');
      cy.get('[data-testid="api-secret-input"]').clear().type('test-api-secret');

      // Test connection
      cy.get('[data-testid="test-connection-button"]').click();
      cy.wait('@testConnection');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Connection successful');
    });
  });

  describe('Label Settings Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should configure label settings', () => {
      // Mock label settings
      cy.intercept('GET', '/api/v1/seller/settings/label', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            labelSize: 'A4',
            format: 'PDF',
            showLogo: false,
            showBarcode: true,
            showReturnLabel: false,
            additionalText: ''
          }
        }
      }).as('getLabelSettings');

      // Mock update label settings
      cy.intercept('PUT', '/api/v1/seller/settings/label', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Label settings updated successfully'
          }
        }
      }).as('updateLabelSettings');

      cy.visit('/seller/dashboard/settings/labels');
      cy.wait('@getLabelSettings');

      // Configure label settings
      cy.get('[data-testid="label-size-select"]').click();
      cy.get('[data-testid="label-size-A5"]').click();
      cy.get('[data-testid="format-select"]').click();
      cy.get('[data-testid="format-PNG"]').click();
      cy.get('[data-testid="show-logo-switch"]').click();
      cy.get('[data-testid="show-barcode-switch"]').click();
      cy.get('[data-testid="show-return-label-switch"]').click();
      cy.get('[data-testid="additional-text"]').type('Handle with care');
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@updateLabelSettings');
      cy.get('[data-testid="success-message"]').should('contain', 'Label settings updated successfully');
    });

    it('should upload and manage logo', () => {
      // Mock logo upload
      cy.intercept('POST', '/api/v1/seller/settings/label/logo', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            logoUrl: 'https://example.com/logo.png'
          }
        }
      }).as('uploadLogo');

      cy.visit('/seller/dashboard/settings/labels');
      cy.get('[data-testid="upload-logo"]').click();
      cy.get('input[type="file"]').attachFile('logo.png');
      cy.get('[data-testid="confirm-upload"]').click();
      cy.wait('@uploadLogo');
      cy.get('[data-testid="success-message"]').should('contain', 'Logo uploaded successfully');
    });
  });

  describe('Display and Currency Settings', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should configure display settings', () => {
      // Mock display settings
      cy.intercept('GET', '/api/v1/seller/settings/display', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            timezone: 'UTC',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24',
            weekStart: 'monday',
            showSeconds: false
          }
        }
      }).as('getDisplaySettings');

      // Mock update display settings
      cy.intercept('PUT', '/api/v1/seller/settings/display', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Display settings updated successfully'
          }
        }
      }).as('updateDisplaySettings');

      cy.visit('/seller/dashboard/settings/display');
      cy.wait('@getDisplaySettings');

      // Configure display settings
      cy.get('[data-testid="timezone-select"]').click();
      cy.get('[data-testid="timezone-IST"]').click();
      cy.get('[data-testid="date-format-select"]').click();
      cy.get('[data-testid="date-format-MM-DD-YYYY"]').click();
      cy.get('[data-testid="time-format-select"]').click();
      cy.get('[data-testid="time-format-12"]').click();
      cy.get('[data-testid="week-start-select"]').click();
      cy.get('[data-testid="week-start-sunday"]').click();
      cy.get('[data-testid="show-seconds-switch"]').click();
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@updateDisplaySettings');
      cy.get('[data-testid="success-message"]').should('contain', 'Display settings updated successfully');
    });

    it('should configure currency settings', () => {
      // Mock currency settings
      cy.intercept('GET', '/api/v1/seller/settings/currency', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            code: 'USD',
            symbol: '$',
            format: 'both',
            decimalPlaces: 2
          }
        }
      }).as('getCurrencySettings');

      // Mock update currency settings
      cy.intercept('PUT', '/api/v1/seller/settings/currency', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'Currency settings updated successfully'
          }
        }
      }).as('updateCurrencySettings');

      cy.visit('/seller/dashboard/settings/currency');
      cy.wait('@getCurrencySettings');

      // Configure currency settings
      cy.get('[data-testid="currency-code-select"]').click();
      cy.get('[data-testid="currency-code-INR"]').click();
      cy.get('[data-testid="currency-symbol"]').clear().type('₹');
      cy.get('[data-testid="currency-format-select"]').click();
      cy.get('[data-testid="currency-format-symbol"]').click();
      cy.get('[data-testid="decimal-places"]').clear().type('2');
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@updateCurrencySettings');
      cy.get('[data-testid="success-message"]').should('contain', 'Currency settings updated successfully');
    });
  });

  describe('General Settings Management', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should configure general settings', () => {
      // Mock general settings
      cy.intercept('GET', '/api/v1/seller/settings/general', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            siteTitle: 'Test Store',
            siteUrl: 'https://test.com',
            adminEmail: 'admin@test.com',
            supportPhone: '1234567890'
          }
        }
      }).as('getGeneralSettings');

      // Mock update general settings
      cy.intercept('PUT', '/api/v1/seller/settings/general', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            message: 'General settings updated successfully'
          }
        }
      }).as('updateGeneralSettings');

      cy.visit('/seller/dashboard/settings/general');
      cy.wait('@getGeneralSettings');

      // Configure general settings
      cy.get('[data-testid="site-title"]').clear().type('New Store Name');
      cy.get('[data-testid="site-url"]').clear().type('https://newstore.com');
      cy.get('[data-testid="admin-email"]').clear().type('newadmin@test.com');
      cy.get('[data-testid="support-phone"]').clear().type('9876543210');
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@updateGeneralSettings');
      cy.get('[data-testid="success-message"]').should('contain', 'General settings updated successfully');
    });
  });

  describe('Dashboard Analytics', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '/api/v1/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 86400,
            seller: {
              id: 'mock-seller-id',
              name: 'Test Seller',
              email: 'test@example.com'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/auth/login');
      cy.get('input[name="emailOrPhone"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test@123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should display dashboard statistics', () => {
      // Mock dashboard stats
      cy.intercept('GET', '/api/v1/seller/dashboard/stats', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orders: {
              total: 100,
              pending: 10,
              processing: 15,
              shipped: 20,
              delivered: 50,
              cancelled: 5,
              todayCount: 8
            },
            shipments: {
              total: 80,
              todayCount: 5
            },
            delivery: {
              total: 50,
              todayCount: 3
            },
            cod: {
              expected: 5000,
              totalDue: 2000
            },
            revenue: {
              total: 10000,
              dailyGrowth: 5.2
            },
            ndr: {
              pending: 2,
              actionRequired: 1
            }
          }
        }
      }).as('getDashboardStats');

      cy.visit('/seller/dashboard');
      cy.wait('@getDashboardStats');

      // Verify statistics display
      cy.get('[data-testid="total-orders"]').should('contain', '100');
      cy.get('[data-testid="today-orders"]').should('contain', '8');
      cy.get('[data-testid="total-revenue"]').should('contain', '10,000');
      cy.get('[data-testid="revenue-growth"]').should('contain', '5.2%');
      cy.get('[data-testid="pending-ndr"]').should('contain', '2');
    });

    it('should display performance charts', () => {
      // Mock chart data
      cy.intercept('GET', '/api/v1/seller/dashboard/charts', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orderStatusDistribution: {
              delivered: 50,
              inTransit: 20,
              pending: 10
            },
            shipmentTrends: [
              { day: '2024-01-01', current: 10, previous: 8 },
              { day: '2024-01-02', current: 12, previous: 9 }
            ],
            revenueTrends: [
              { month: 'Jan 2024', value: 5000 },
              { month: 'Feb 2024', value: 6000 }
            ],
            topProducts: [
              { month: 'Jan 2024', desktop: 100 },
              { month: 'Feb 2024', desktop: 120 }
            ]
          }
        }
      }).as('getChartData');

      cy.visit('/seller/dashboard');
      cy.wait('@getChartData');

      // Verify charts are displayed
      cy.get('[data-testid="order-status-chart"]').should('be.visible');
      cy.get('[data-testid="shipment-trends-chart"]').should('be.visible');
      cy.get('[data-testid="revenue-trends-chart"]').should('be.visible');
      cy.get('[data-testid="top-products-chart"]').should('be.visible');
    });

    it('should display courier performance data', () => {
      // Mock courier performance data
      cy.intercept('GET', '/api/v1/seller/dashboard/courier-performance', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              courier: 'Courier A',
              total: 100,
              notShipped: 5,
              pendingPickup: 10,
              inTransit: 20,
              ofd: 15,
              delivered: { count: 45, percentage: '45%' },
              cancelled: { count: 3, percentage: '3%' },
              exception: { count: 2, percentage: '2%' },
              rto: 5,
              lostDamage: 0
            }
          ]
        }
      }).as('getCourierPerformance');

      cy.visit('/seller/dashboard');
      cy.wait('@getCourierPerformance');

      // Verify courier performance table
      cy.get('[data-testid="courier-performance-table"]').should('be.visible');
      cy.get('[data-testid="courier-name"]').should('contain', 'Courier A');
      cy.get('[data-testid="delivery-rate"]').should('contain', '45%');
    });

    it('should download dashboard reports', () => {
      // Mock report download
      cy.intercept('GET', '/api/v1/seller/dashboard/report*', {
        statusCode: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename=report.pdf'
        },
        body: 'mock-pdf-content'
      }).as('downloadReport');

      cy.visit('/seller/dashboard');

      // Download PDF report
      cy.get('[data-testid="download-pdf"]').click();
      cy.wait('@downloadReport');

      // Download CSV report
      cy.get('[data-testid="download-csv"]').click();
      cy.wait('@downloadReport');

      // Download Excel report
      cy.get('[data-testid="download-excel"]').click();
      cy.wait('@downloadReport');
    });

    it('should filter dashboard data by date range', () => {
      // Mock filtered data
      cy.intercept('GET', '/api/v1/seller/dashboard/stats*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            orders: {
              total: 50,
              pending: 5,
              processing: 8,
              shipped: 10,
              delivered: 25,
              cancelled: 2,
              todayCount: 4
            },
            shipments: {
              total: 40,
              todayCount: 3
            },
            delivery: {
              total: 25,
              todayCount: 2
            },
            cod: {
              expected: 2500,
              totalDue: 1000
            },
            revenue: {
              total: 5000,
              dailyGrowth: 3.5
            },
            ndr: {
              pending: 1,
              actionRequired: 0
            }
          }
        }
      }).as('getFilteredStats');

      cy.visit('/seller/dashboard');

      // Select date range
      cy.get('[data-testid="date-range-picker"]').click();
      cy.get('[data-testid="date-range-last-30-days"]').click();
      cy.wait('@getFilteredStats');

      // Verify filtered data
      cy.get('[data-testid="total-orders"]').should('contain', '50');
      cy.get('[data-testid="total-revenue"]').should('contain', '5,000');
    });
  });

  describe('Marketing & Promotions', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should create a new promotion', () => {
      cy.intercept('POST', '**/api/v2/seller/promotions', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: '1',
            name: 'Summer Sale',
            type: 'discount',
            value: 20,
            startDate: '2024-06-01',
            endDate: '2024-06-30'
          }
        }
      }).as('createPromotion');

      cy.visit('/seller/marketing/promotions');
      cy.get('[data-testid="create-promotion-btn"]').click();
      cy.get('input[name="name"]').type('Summer Sale');
      cy.get('select[name="type"]').select('discount');
      cy.get('input[name="value"]').type('20');
      cy.get('input[name="startDate"]').type('2024-06-01');
      cy.get('input[name="endDate"]').type('2024-06-30');
      cy.get('button[type="submit"]').click();
      cy.wait('@createPromotion');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should view active promotions', () => {
      cy.intercept('GET', '**/api/v2/seller/promotions', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              name: 'Summer Sale',
              type: 'discount',
              value: 20,
              startDate: '2024-06-01',
              endDate: '2024-06-30',
              status: 'active'
            }
          ]
        }
      }).as('getPromotions');

      cy.visit('/seller/marketing/promotions');
      cy.wait('@getPromotions');
      cy.get('[data-testid="promotions-list"]').should('be.visible');
      cy.get('[data-testid="promotion-card"]').should('have.length', 1);
    });

    it('should create a marketing campaign', () => {
      cy.intercept('POST', '**/api/v2/seller/campaigns', {
        statusCode: 201,
        body: {
          success: true,
          data: {
            id: '1',
            name: 'New Product Launch',
            type: 'email',
            status: 'draft'
          }
        }
      }).as('createCampaign');

      cy.visit('/seller/marketing/campaigns');
      cy.get('[data-testid="create-campaign-btn"]').click();
      cy.get('input[name="name"]').type('New Product Launch');
      cy.get('select[name="type"]').select('email');
      cy.get('textarea[name="content"]').type('Check out our new products!');
      cy.get('button[type="submit"]').click();
      cy.wait('@createCampaign');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should view campaign analytics', () => {
      cy.intercept('GET', '**/api/v2/seller/campaigns/1/analytics', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            opens: 150,
            clicks: 75,
            conversions: 25,
            revenue: 5000
          }
        }
      }).as('getCampaignAnalytics');

      cy.visit('/seller/marketing/campaigns/1/analytics');
      cy.wait('@getCampaignAnalytics');
      cy.get('[data-testid="campaign-stats"]').should('be.visible');
      cy.get('[data-testid="campaign-chart"]').should('be.visible');
    });

    it('should manage customer segments', () => {
      cy.intercept('GET', '**/api/v2/seller/segments', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: '1',
              name: 'High Value Customers',
              criteria: {
                minOrders: 5,
                minSpend: 1000
              },
              customerCount: 50
            }
          ]
        }
      }).as('getSegments');

      cy.visit('/seller/marketing/segments');
      cy.wait('@getSegments');
      cy.get('[data-testid="segments-list"]').should('be.visible');
      cy.get('[data-testid="segment-card"]').should('have.length', 1);
    });
  });

  describe('Advanced Analytics', () => {
    beforeEach(() => {
      // Mock successful login
      cy.intercept('POST', '**/api/v2/seller/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            token: 'mock_token',
            user: {
              id: '1',
              name: 'Test Seller',
              email: 'seller@example.com',
              role: 'Seller'
            }
          }
        }
      }).as('loginRequest');

      cy.visit('/seller/login');
      cy.get('input[placeholder="Enter email address/ mobile number"]').type('seller@example.com');
      cy.get('input[placeholder="Enter password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should view revenue analytics', () => {
      cy.intercept('GET', '**/api/v2/seller/analytics/revenue', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            total: 100000,
            growth: 15,
            byCategory: [
              { category: 'Electronics', revenue: 50000 },
              { category: 'Fashion', revenue: 30000 }
            ],
            trend: [
              { date: '2024-03-01', revenue: 5000 },
              { date: '2024-03-02', revenue: 6000 }
            ]
          }
        }
      }).as('getRevenueAnalytics');

      cy.visit('/seller/analytics/revenue');
      cy.wait('@getRevenueAnalytics');
      cy.get('[data-testid="revenue-summary"]').should('be.visible');
      cy.get('[data-testid="revenue-chart"]').should('be.visible');
    });

    it('should view inventory analytics', () => {
      cy.intercept('GET', '**/api/v2/seller/analytics/inventory', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            totalProducts: 100,
            lowStock: 10,
            outOfStock: 5,
            byCategory: [
              { category: 'Electronics', count: 50 },
              { category: 'Fashion', count: 30 }
            ],
            turnover: [
              { product: 'Product 1', turnover: 30 },
              { product: 'Product 2', turnover: 25 }
            ]
          }
        }
      }).as('getInventoryAnalytics');

      cy.visit('/seller/analytics/inventory');
      cy.wait('@getInventoryAnalytics');
      cy.get('[data-testid="inventory-summary"]').should('be.visible');
      cy.get('[data-testid="inventory-chart"]').should('be.visible');
    });

    it('should view marketing performance', () => {
      cy.intercept('GET', '**/api/v2/seller/analytics/marketing', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            roi: 250,
            costPerAcquisition: 50,
            conversionRate: 3.5,
            byChannel: [
              { channel: 'Email', conversions: 100 },
              { channel: 'Social', conversions: 80 }
            ],
            campaignPerformance: [
              { campaign: 'Summer Sale', revenue: 10000 },
              { campaign: 'New Launch', revenue: 8000 }
            ]
          }
        }
      }).as('getMarketingAnalytics');

      cy.visit('/seller/analytics/marketing');
      cy.wait('@getMarketingAnalytics');
      cy.get('[data-testid="marketing-summary"]').should('be.visible');
      cy.get('[data-testid="marketing-chart"]').should('be.visible');
    });

    it('should export analytics report', () => {
      cy.intercept('POST', '**/api/v2/seller/analytics/export', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            downloadUrl: '/reports/analytics-report-2024-03.csv'
          }
        }
      }).as('exportReport');

      cy.visit('/seller/analytics');
      cy.get('[data-testid="export-report-btn"]').click();
      cy.get('select[name="reportType"]').select('sales');
      cy.get('input[name="startDate"]').type('2024-03-01');
      cy.get('input[name="endDate"]').type('2024-03-31');
      cy.get('button[type="submit"]').click();
      cy.wait('@exportReport');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });
});