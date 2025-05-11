# Rocketry Box Admin API Documentation

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [User Management](#user-management)
3. [Product Management](#product-management)
4. [Order Management](#order-management)
5. [Category Management](#category-management)
6. [Dashboard & Analytics](#dashboard--analytics)
7. [Settings & Configuration](#settings--configuration)
8. [Error Handling & Validation](#error-handling--validation)
9. [Admin Team Management](#admin-team-management)
10. [Shipping Partner Management](#shipping-partner-management)
11. [Shipment Management](#shipment-management)
12. [Support Ticket Management](#support-ticket-management)
13. [NDR Management](#ndr-management)
14. [Billing Management](#billing-management)
15. [Escalation Management](#escalation-management)

## Authentication & Authorization

### Overview
The Admin API uses JWT (JSON Web Token) based authentication. All API requests must include a valid authentication token in the Authorization header.

### Authentication Methods

#### 1. Bearer Token Authentication
```typescript
// Request Header
Authorization: Bearer ${token}

// Token Format
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ
```

### Authentication Endpoints

#### Login
```typescript
POST /api/v2/admin/auth/login

Request Body:
{
    email: string;          // Email or mobile number
    password: string;       // Password
    rememberMe?: boolean;   // Optional: Remember me flag
}

Response:
{
    success: boolean;
    data: {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: "Admin" | "Manager" | "Support" | "Agent";
            department: string;
            isSuperAdmin: boolean;
            permissions: string[];
        }
    }
}
```

#### Register
```typescript
POST /api/v2/admin/auth/register

Request Body:
{
    fullName: string;
    email: string;
    role: "Admin" | "Manager" | "Support" | "Agent";
    department: string;
    phoneNumber: string;
    address: string;
    dateOfJoining: string;  // Format: YYYY-MM-DD
    employeeId: string;
    isSuperAdmin: boolean;
    remarks?: string;
    password: string;
    confirmPassword: string;
    profileImage?: File;    // Optional: Max size 5MB, formats: jpg, jpeg, png, webp
}

Response:
{
    success: boolean;
    data: {
        id: string;
        name: string;
        email: string;
        role: string;
        department: string;
        isSuperAdmin: boolean;
        createdAt: string;
    }
}
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Role-Based Access Control

#### Available Roles
1. **Super Admin**
   - Full system access with all privileges
   - Can manage all users and settings
   - Can view and manage all data
   - Can modify system configurations
   - Can manage other admin permissions
   - Has access to all features and modules

2. **Admin**
   - Can manage team members
   - Can view and manage orders
   - Can access reports and analytics
   - Limited system configuration access
   - Can manage assigned modules

3. **Manager**
   - Can handle team operations
   - Can view and manage orders
   - Can access reports and analytics
   - Limited access to system settings
   - Can manage assigned team members

4. **Support**
   - Can handle customer support tickets
   - Can view order details
   - Limited access to system settings
   - Can access basic reports
   - Can manage customer queries

5. **Agent**
   - Basic system access
   - Can view assigned orders
   - Limited to specific functions
   - Can handle basic customer support
   - Can access assigned modules only

#### Permission Modules
Each admin role can be assigned specific permissions for the following modules:

1. **Dashboard Access**
   - View analytics and performance reports
   - Access dashboard widgets
   - View system status

2. **User Management**
   - View and manage customer accounts
   - Handle user verification
   - Manage user permissions

3. **Team Management**
   - Add, edit and remove team members
   - Assign roles and permissions
   - Manage team structure

4. **Orders & Shipping**
   - Manage orders and shipping processes
   - Handle order modifications
   - Process shipping labels

5. **Financial Operations**
   - Process refunds, payments and transactions
   - Handle financial reports
   - Manage billing operations

6. **System Configuration**
   - Modify system settings and configurations
   - Update system parameters
   - Manage integrations

7. **Seller Management**
   - Onboard and manage seller profiles
   - Handle seller verification
   - Manage seller accounts

8. **Support Tickets**
   - Handle customer support requests
   - Manage ticket priorities
   - Resolve customer issues

9. **Reports & Analytics**
   - Generate and export detailed reports
   - Access analytics dashboard
   - Create custom reports

10. **Marketing & Promotions**
    - Manage campaigns and promotional offers
    - Handle marketing materials
    - Track campaign performance

#### Permission Management
```typescript
// Update Admin Permissions
PATCH /api/v2/admin/users/:userId/permissions

Request Body:
{
    permissions: {
        dashboardAccess: boolean;
        userManagement: boolean;
        teamManagement: boolean;
        ordersShipping: boolean;
        financialOperations: boolean;
        systemConfig: boolean;
        sellerManagement: boolean;
        supportTickets: boolean;
        reportsAnalytics: boolean;
        marketingPromotions: boolean;
    }
}

Response:
{
    success: boolean;
    data: {
        id: string;
        name: string;
        email: string;
        role: string;
        permissions: {
            dashboardAccess: boolean;
            userManagement: boolean;
            teamManagement: boolean;
            ordersShipping: boolean;
            financialOperations: boolean;
            systemConfig: boolean;
            sellerManagement: boolean;
            supportTickets: boolean;
            reportsAnalytics: boolean;
            marketingPromotions: boolean;
        };
        updatedAt: string;
    }
}
```

### Security Features

#### 1. Token Security
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Tokens are signed using RS256 algorithm
- Tokens include standard JWT claims (iss, sub, exp, iat)

#### 2. Session Management
```typescript
// Get Active Sessions
GET /api/v2/admin/auth/sessions

Response:
{
    success: boolean;
    data: Array<{
        id: string;
        deviceInfo: {
            deviceId: string;
            deviceType: string;
            os: string;
            browser: string;
        };
        lastActive: string;
        ipAddress: string;
    }>;
}

// Revoke Session
DELETE /api/v2/admin/auth/sessions/:sessionId

// Revoke All Sessions
DELETE /api/v2/admin/auth/sessions
```

### Error Responses

#### Invalid Token
```typescript
{
    success: false;
    error: {
        code: "INVALID_TOKEN";
        message: "Invalid or expired token";
        status: 401;
    }
}
```

#### Insufficient Permissions
```typescript
{
    success: false;
    error: {
        code: "INSUFFICIENT_PERMISSIONS";
        message: "You don't have permission to access this resource";
        status: 403;
    }
}
```

#### Rate Limit Exceeded
```typescript
{
    success: false;
    error: {
        code: "RATE_LIMIT_EXCEEDED";
        message: "Too many authentication attempts";
        status: 429;
        details: {
            retryAfter: number;  // Seconds to wait before retrying
        }
    }
}
```

### Best Practices

1. **Token Storage**
   - Store tokens securely
   - Never expose tokens in client-side code
   - Use secure HTTP-only cookies when possible

2. **Token Refresh**
   - Implement automatic token refresh
   - Refresh tokens before they expire
   - Handle refresh token expiration

3. **Error Handling**
   - Handle 401 and 403 responses
   - Implement proper logout on authentication errors
   - Clear tokens on logout

4. **Security**
   - Use HTTPS for all requests
   - Implement rate limiting
   - Monitor for suspicious activity
   - Log authentication attempts

5. **Session Management**
   - Track active sessions
   - Allow session revocation
   - Implement session timeout
   - Handle concurrent logins 

## Dashboard & Analytics

### Overview
The admin dashboard provides comprehensive analytics and insights for both seller and customer data. It includes real-time statistics, performance metrics, and detailed reports.

### Dashboard Endpoints

#### Get Dashboard Overview
```typescript
GET /api/v2/admin/dashboard/overview

Response:
{
    data: {
        users: {
            total: number,
            sellers: number,
            customers: number,
            newToday: number,
            activeToday: number
        },
        orders: {
            total: number,
            pending: number,
            processing: number,
            shipped: number,
            delivered: number,
            cancelled: number,
            todayCount: number
        },
        revenue: {
            total: number,
            today: number,
            growth: number
        },
        shipments: {
            total: number,
            inTransit: number,
            delivered: number,
            returned: number,
            todayCount: number
        },
        disputes: {
            total: number,
            open: number,
            resolved: number
        },
        tickets: {
            total: number,
            open: number,
            closed: number
        }
    }
}
```

#### Get Key Performance Indicators
```typescript
GET /api/v2/admin/dashboard/kpi

Query Parameters:
  from?: string (ISO date)
  to?: string (ISO date)

Response:
{
    data: {
        averageOrderValue: number,
        orderCompletionRate: number,
        returnRate: number,
        averageDeliveryTime: number,
        userAcquisitionCost: number,
        revenueGrowth: number,
        activeSellers: number,
        topPerformingSellers: [
            {
                id: string,
                name: string,
                orderCount: number,
                revenue: number
            }
        ],
        topCouriers: [
            {
                name: string,
                shipmentCount: number,
                performanceScore: number
            }
        ]
    }
}
```

### Seller Dashboard

#### Statistics Overview
1. **Orders**
   - Total orders
   - Pending orders
   - Processing orders
   - Shipped orders
   - Delivered orders
   - Cancelled orders
   - Today's order count

2. **Shipments**
   - Total shipments
   - Today's shipment count
   - Status distribution (Not Shipped, Pending Pickup, In Transit, OFD, Delivered)

3. **Delivery**
   - Total delivered
   - Today's delivery count
   - Delivery performance metrics

4. **COD (Cash on Delivery)**
   - Expected COD amount
   - Total due COD
   - Remittance statistics

5. **Revenue**
   - Total revenue
   - Daily growth percentage
   - Revenue trends

6. **NDR (Non-Delivery Reports)**
   - Pending NDR count
   - Action required count
   - Resolution status

#### Performance Metrics
1. **Order Status Distribution**
   - Delivered
   - In Transit
   - Pending
   - Cancelled
   - Returned

2. **Shipment Trends**
   - Daily/Weekly/Monthly shipment volumes
   - Courier-wise performance
   - Delivery success rates

3. **Top Products**
   - Product-wise order distribution
   - Quantity sold
   - Revenue generated
   - Return rates

### Customer Dashboard

#### Statistics Overview
1. **Customer Metrics**
   - Total customers
   - New customers today
   - Active customers
   - Customer retention rate

2. **Order Analytics**
   - Total orders
   - Average order value
   - Order completion rate
   - Return rate

3. **Revenue Analysis**
   - Total revenue
   - Revenue growth
   - Revenue per customer
   - Payment method distribution

4. **Activity Tracking**
   - Customer engagement
   - Login frequency
   - Cart abandonment rate
   - Wishlist activity

#### Customer Insights
1. **Recent Customers**
   - New registrations
   - Profile completion rate
   - Verification status
   - Account activity

2. **Recent Orders**
   - Order status
   - Payment status
   - Delivery status
   - Customer feedback

3. **Customer Activity**
   - Login history
   - Search patterns
   - Product views
   - Purchase history

### Data Export
```typescript
GET /api/v2/admin/dashboard/export

Query Parameters:
  type: "seller" | "customer"
  format: "csv" | "excel"
  from?: string (ISO date)
  to?: string (ISO date)

Response:
{
    data: {
        downloadUrl: string,
        expiresAt: string
    }
}
```

### Real-time Updates
The dashboard supports real-time updates for:
- Order status changes
- New customer registrations
- Payment confirmations
- Shipment status updates
- Support ticket updates

### Best Practices
1. **Data Refresh**
   - Implement automatic refresh every 5 minutes
   - Allow manual refresh option
   - Cache data for better performance

2. **Data Visualization**
   - Use appropriate chart types for different metrics
   - Implement responsive design
   - Support dark/light mode

3. **Performance**
   - Implement pagination for large datasets
   - Use lazy loading for charts
   - Optimize API calls

4. **Security**
   - Implement role-based access control
   - Log all dashboard access
   - Encrypt sensitive data

5. **Error Handling**
   - Implement proper error logging
   - Use consistent error response format
   - Include detailed error messages
   - Handle validation errors gracefully
   - Implement proper error recovery
   - Monitor error patterns

6. **Data Validation**
   - Validate all input data
   - Implement server-side validation
   - Use type checking
   - Sanitize user inputs
   - Validate file uploads
   - Check data integrity

7. **Security Measures**
   - Implement rate limiting
   - Use input sanitization
   - Validate file types
   - Check file sizes
   - Implement proper access controls
   - Monitor suspicious activities

### Dashboard Tables

#### 1. Seller Dashboard Tables

##### Recent Orders Table
```typescript
interface OrderData {
    orderId: string;
    awbNumber: string;
    date: string;
    customer: string;
    contact: string;
    items: number;
    amount: string;
    payment: string;
    channel: string;
    weight: string;
    tags: string[];
    whatsapp: string;
    status: "Booked" | "Processing" | "In Transit" | "Out for Delivery" | "Delivered" | "Returned";
}

Table Columns:
- Order ID (sortable)
- AWB Number (sortable)
- Date (sortable)
- Customer (sortable)
- Contact (sortable)
- Items (sortable)
- Amount (sortable)
- Payment (sortable)
- Channel (sortable)
- Weight (sortable)
- Tags (sortable)
- WhatsApp (sortable)
- Status (sortable)
```

##### Shipments Table
```typescript
interface Shipment {
    orderId: string;
    trackingNumber: string;
    status: string;
    origin: string;
    destination: string;
    date: string;
    courier: string;
}

Table Columns:
- Shipment ID (sortable)
- Tracking Number (sortable)
- Status (sortable)
- Origin (sortable)
- Destination (sortable)
- Date (sortable)
- Courier (sortable)
```

##### Courier Loads Table
```typescript
interface CourierLoad {
    carrier: string;
    activeOrders: number;
    delivered: number;
    inTransit: number;
    pending: number;
    status: string;
}

Table Columns:
- Carrier (sortable)
- Active Orders (sortable)
- Delivered (sortable)
- In Transit (sortable)
- Pending (sortable)
- Status (sortable)
```

##### Courier Status Table
```typescript
interface CourierStatus {
    courier: string;
    total: number;
    notShipped: number;
    pendingPickup: number;
    inTransit: number;
    ofd: number;
    delivered: {
        count: number;
        percentage: string;
    };
    cancelled: {
        count: number;
        percentage: string;
    };
    exception: {
        count: number;
        percentage: string;
    };
}

Table Columns:
- Courier (sortable)
- Total (sortable)
- Not Shipped (sortable)
- Pending Pickup (sortable)
- In Transit (sortable)
- OFD (sortable)
- Delivered (sortable)
- Cancelled (sortable)
- Exception (sortable)
```

#### 2. Customer Dashboard Tables

##### Recent Customers Table
```typescript
interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    orders: number;
    totalSpent: string;
    lastOrder: string;
    status: "Active" | "New" | "Inactive";
}

Table Columns:
- Customer ID (sortable)
- Name (sortable)
- Email (sortable)
- Phone (sortable)
- Orders (sortable)
- Total Spent (sortable)
- Last Order (sortable)
- Status (sortable)
```

##### Recent Orders Table
```typescript
interface Order {
    id: string;
    customerId: string;
    customerName: string;
    date: string;
    amount: string;
    status: "Delivered" | "In Transit" | "Processing" | "Cancelled";
    paymentMethod: string;
}

Table Columns:
- Order ID (sortable)
- Customer (sortable)
- Date (sortable)
- Amount (sortable)
- Payment Method (sortable)
- Status (sortable)
```

##### Customer Activity Table
```typescript
interface CustomerActivity {
    id: string;
    customerId: string;
    customerName: string;
    activity: string;
    timestamp: string;
    details: string;
}

Table Columns:
- Activity ID (sortable)
- Customer (sortable)
- Activity (sortable)
- Timestamp (sortable)
- Details (sortable)
```

### Table Features

1. **Sorting**
   - All columns support sorting (ascending/descending)
   - Sort indicators show current sort direction
   - Multi-column sorting supported

2. **Filtering**
   - Date range filtering
   - Status filtering
   - Search functionality
   - Advanced filters for specific columns

3. **Pagination**
   - Configurable page size
   - Page navigation
   - Total count display
   - Current page indicator

4. **Actions**
   - Bulk actions support
   - Individual row actions
   - Export to CSV/Excel
   - Print functionality

5. **Responsive Design**
   - Mobile-friendly layout
   - Column visibility toggle
   - Horizontal scrolling for small screens
   - Responsive typography

6. **Data Export**
   - Export selected rows
   - Export all data
   - Multiple format support (CSV, Excel)
   - Custom export templates

## User Management

### Overview
The admin can manage two types of users: sellers and customers. Each type has its own set of management features and permissions.

### User Types

1. **Seller Users**
   - Business accounts with selling capabilities
   - Can manage their own team members
   - Have KYC and document verification requirements
   - Access to seller dashboard and features
   - Rate band and payment type management
   - Agreement management

2. **Customer Users**
   - Individual consumer accounts
   - Can place orders and track shipments
   - Access to customer dashboard and features

### User Management Endpoints

#### List Users
```typescript
GET /api/v2/admin/users

Query Parameters:
  type: "seller" | "customer"
  page: number
  limit: number
  search?: string
  status?: "active" | "inactive" | "suspended"
  sortField?: string
  sortOrder?: "asc" | "desc"

Response:
{
  data: [
    {
      id: string;
      userId: string;
      name: string;
      email: string;
      phone: string;
      status: "Active" | "Inactive" | "Pending" | "Suspended";
      registrationDate: string;
      lastActive: string;
      // Seller specific fields
      companyName?: string;
      companyCategory?: string;
      paymentType?: "wallet" | "credit";
      rateBand?: string;
      creditLimit?: number;
      creditPeriod?: number;
      kycStatus?: "Pending" | "Verified" | "Rejected";
      documentApprovals?: {
        pan: "Pending" | "Verified" | "Rejected";
        gst: "Pending" | "Verified" | "Rejected";
        identity: "Pending" | "Verified" | "Rejected";
        bankDetails: "Pending" | "Verified" | "Rejected";
      };
    }
  ];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}
```

#### Get User Details
```typescript
GET /api/v2/admin/users/:userId

Response:
{
  data: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "customer" | "seller" | "admin";
    status: "active" | "inactive" | "suspended";
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
    verificationStatus: {
      email: boolean;
      phone: boolean;
      documents: boolean;
    };
    walletBalance?: number;
    orderCount?: number;
    address?: object;
    permissions?: string[];
    notes?: string;
  }
}
```

#### Update User Status
```typescript
PATCH /api/v2/admin/users/:userId/status

Request Body:
{
  status: "active" | "inactive" | "suspended";
  reason?: string;
}

Response:
{
  data: {
    id: string;
    status: string;
    message: string;
  }
}
```

#### Update User Permissions
```typescript
PATCH /api/v2/admin/users/:userId/permissions

Request Body:
{
  permissions: string[]  // Array of permission keys
}

Response:
{
  data: {
    id: string;
    permissions: string[];
    message: string;
  }
}
```

#### Add Admin Notes
```typescript
POST /api/v2/admin/users/:userId/notes

Request Body:
{
  note: string;
}

Response:
{
  data: {
    id: string;
    note: string;
    createdAt: string;
    createdBy: string;
  }
}
```

#### Get Seller Profile Details
```typescript
GET /api/v2/admin/users/:userId/profile

Response:
{
  data: {
    id: string;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    companyCategory: string;
    brandName?: string;
    website?: string;
    supportContact?: string;
    supportEmail?: string;
    operationsEmail?: string;
    financeEmail?: string;
    rechargeType?: string;
    profileImage?: string;
    storeLinks?: {
      website?: string;
      amazon?: string;
      shopify?: string;
      opencart?: string;
    };
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      landmark?: string;
    };
    documents?: {
      gstin?: string;
      pan?: string;
      cin?: string;
      tradeLicense?: string;
      msmeRegistration?: string;
      aadhaar?: string;
      documents: Array<{
        name: string;
        type: string;
        url: string;
        status: "verified" | "pending" | "rejected";
      }>;
    };
    bankDetails?: Array<{
      accountName: string;
      accountNumber: string;
      bankName: string;
      branch: string;
      ifscCode: string;
      swiftCode?: string;
      accountType: string;
      isDefault: boolean;
      cancelledCheque?: {
        url: string;
        status: "verified" | "pending";
      };
    }>;
  }
}
```

#### Update KYC Document Status
```typescript
PATCH /api/v2/admin/users/:userId/documents/:documentType

Request Body:
{
  status: "verified" | "rejected";
  remarks?: string;
}

Response:
{
  data: {
    id: string;
    documentType: string;
    status: string;
    message: string;
  }
}
```

#### Manage Seller Agreements
```typescript
GET /api/v2/admin/users/:userId/agreements

Response:
{
  data: Array<{
    version: string;
    docLink: string;
    acceptanceDate: string;
    publishedOn: string;
    ipAddress: string;
    status: "Accepted" | "Pending" | "Rejected";
  }>
}

POST /api/v2/admin/users/:userId/agreements
Request Body:
{
  version: string;
  documentUrl: string;
  publishDate: string;
}

Response:
{
  data: {
    id: string;
    version: string;
    status: "Pending";
    message: string;
  }
}
```

#### Rate Band Management
```typescript
GET /api/v2/admin/users/:userId/rate-band

Response:
{
  data: {
    rateBandId: string;
    rateBandName: string;
    couriers: Array<{
      name: string;
      rates: {
        withinCity: number;
        withinState: number;
        metroToMetro: number;
        restOfIndia: number;
        northEastJK: number;
      };
      codCharge: number;
      codPercent: number;
    }>;
    lastUpdated: string;
  }
}

POST /api/v2/admin/users/:userId/rate-band
Request Body:
{
  rateBandId: string;
}

Response:
{
  data: {
    success: boolean;
    message: string;
    userId: string;
    rateBandId: string;
    rateBandName: string;
  }
}
```

### User Management Features

#### 1. Seller Management
- View seller profiles and details
- Manage seller verification status
- Review and approve KYC documents:
  - PAN Card
  - GST Registration
  - Identity Proof
  - Bank Details
  - Trade License
  - MSME Registration
- Set credit limits and payment terms
- Monitor seller performance
- Manage seller permissions
- Handle seller disputes and issues
- Manage seller agreements:
  - View agreement history
  - Push new agreements
  - Track agreement acceptance
  - Monitor agreement status
- Rate Band Management:
  - Assign rate bands
  - Set custom rates
  - Manage courier partnerships
  - Configure COD charges
  - Set weight-based pricing

#### 2. Customer Management
- View customer profiles and details
- Monitor customer activity
- Handle customer support requests
- Manage customer accounts
- View order history
- Track customer feedback
- Handle customer disputes

#### 3. Common Features
- Search and filter users
- Sort by various fields
- Bulk actions
- Export user data
- View user activity logs
- Manage user permissions
- Add admin notes
- Track user status changes

### User Status Management

#### Available Statuses
1. **Active**
   - Full access to platform features
   - Can perform all allowed actions
   - Regular account status

2. **Inactive**
   - Limited access to features
   - Cannot place new orders
   - Account under review

3. **Suspended**
   - No access to platform
   - Account temporarily disabled
   - Requires admin review

4. **Pending**
   - Awaiting verification
   - Limited access
   - Requires document submission
   - KYC verification pending

### Best Practices

1. **User Verification**
   - Verify email and phone numbers
   - Review KYC documents thoroughly
   - Maintain verification records
   - Regular status updates
   - Document verification checklist:
     - PAN Card authenticity
     - GST Registration validity
     - Bank account verification
     - Identity proof validation
     - Business registration verification

2. **Permission Management**
   - Follow principle of least privilege
   - Regular permission audits
   - Document permission changes
   - Monitor permission usage

3. **Data Security**
   - Encrypt sensitive information
   - Regular security audits
   - Monitor suspicious activities
   - Maintain access logs

4. **Communication**
   - Notify users of status changes
   - Document all admin actions
   - Maintain communication history
   - Follow up on pending issues
   - Agreement update notifications
   - Rate band change notifications

5. **Rate Band Management**
   - Regular rate reviews
   - Monitor courier performance
   - Track delivery success rates
   - Analyze pricing competitiveness
   - Maintain rate band documentation

### Validation Rules

#### 1. User Registration Validation
```typescript
{
  fullName: {
    required: true,
    type: "string",
    minLength: 1,
    message: "Full name is required"
  },
  email: {
    required: true,
    type: "string",
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    message: "Invalid email address"
  },
  role: {
    required: true,
    type: "string",
    enum: ["Admin", "Manager", "Support", "Agent"],
    message: "Please select a valid role"
  },
  department: {
    required: true,
    type: "string",
    minLength: 1,
    message: "Department is required"
  },
  phoneNumber: {
    required: true,
    type: "string",
    minLength: 10,
    maxLength: 15,
    message: "Phone number must be between 10 and 15 digits"
  },
  password: {
    required: true,
    type: "string",
    minLength: 8,
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
  }
}
```

#### 2. Seller Profile Validation
```typescript
{
  companyDetails: {
    companyCategory: {
      required: true,
      type: "string",
      minLength: 1,
      message: "Company category is required"
    },
    companyName: {
      required: true,
      type: "string",
      minLength: 1,
      message: "Company name is required"
    },
    sellerName: {
      required: true,
      type: "string",
      minLength: 1,
      message: "Seller name is required"
    }
  },
  documents: {
    panNumber: {
      required: true,
      type: "string",
      minLength: 10,
      maxLength: 10,
      message: "PAN number must be 10 characters"
    },
    gstNumber: {
      required: false,
      type: "string",
      minLength: 15,
      maxLength: 15,
      message: "GST number should be 15 characters"
    }
  },
  bankDetails: {
    bankName: {
      required: true,
      type: "string",
      minLength: 1,
      message: "Bank name is required"
    },
    accountNumber: {
      required: true,
      type: "string",
      minLength: 1,
      message: "Account number is required"
    },
    ifscCode: {
      required: true,
      type: "string",
      minLength: 1,
      message: "IFSC code is required"
    }
  }
}
```

#### 3. Document Validation
```typescript
{
  fileSize: {
    maxSize: 5000000, // 5MB
    message: "Max file size is 5MB"
  },
  fileTypes: {
    allowed: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    message: "Only .jpg, .jpeg, .png and .webp formats are supported"
  }
}
```

### Error Handling

#### 1. Common Error Responses
```typescript
{
  // Validation Errors
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    message: "Validation error occurred",
    status: 400,
    details: {
      field: string;
      message: string;
    }[]
  },

  // Authentication Errors
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    message: "Unauthorized access",
    status: 401
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    message: "Access forbidden",
    status: 403
  },

  // Resource Errors
  NOT_FOUND: {
    code: "NOT_FOUND",
    message: "Resource not found",
    status: 404
  },
  DUPLICATE_ENTITY: {
    code: "DUPLICATE_ENTITY",
    message: "Entity already exists",
    status: 409
  },

  // System Errors
  SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "Server error occurred",
    status: 500
  },
  RATE_LIMIT_EXCEEDED: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later",
    status: 429
  }
}
```

#### 2. Field-Specific Error Messages
```typescript
{
  // User Related
  INVALID_NAME: "Name must be between 2 and 50 characters",
  INVALID_EMAIL: "Invalid email format",
  INVALID_PHONE: "Invalid phone number format",
  INVALID_PASSWORD: "Password must be 8-50 characters long and contain uppercase, lowercase, numbers, and special characters",
  INVALID_ROLE: "Invalid user role",
  INVALID_STATUS: "Invalid user status",

  // Document Related
  INVALID_GSTIN: "Invalid GSTIN format",
  INVALID_PAN: "Invalid PAN format",
  INVALID_CIN: "Invalid CIN format",
  INVALID_AADHAAR: "Invalid Aadhaar number",
  INVALID_DOCUMENT_STATUS: "Invalid document status",

  // System Related
  NETWORK_ERROR: "Network error occurred",
  SERVER_ERROR: "Server error occurred",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  DOWNLOAD_ERROR: "Failed to download file",
  FILE_PROCESSING_ERROR: "Failed to process file"
}
```

## Admin Team Management

### Overview
The Admin Team Management system allows super admins to manage team members, their roles, permissions, and access levels within the platform.

### Team Member Structure

#### Team Member Interface
```typescript
interface TeamMember {
    userId: string;
    name: string;
    email: string;
    role: "Admin" | "Manager" | "Support" | "Agent";
    registrationDate: string;
    status: "Active" | "Inactive" | "On Leave";
    phone: string;
    remarks: string;
    department: string;
    designation: string;
    permissions: string[];
    notes?: string;
    documents?: {
        idProof: {
            name: string;
            url: string;
        };
        employmentContract: {
            name: string;
            url: string;
        };
    };
}
```

### Team Management Endpoints

#### List Team Members
```typescript
GET /api/v2/admin/team

Query Parameters:
  page: number
  limit: number
  search?: string
  role?: "Admin" | "Manager" | "Support" | "Agent"
  status?: "Active" | "Inactive" | "On Leave"
  department?: string
  sortField?: string
  sortOrder?: "asc" | "desc"

Response:
{
    data: TeamMember[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}
```

#### Get Team Member Details
```typescript
GET /api/v2/admin/team/:userId

Response:
{
    data: TeamMember
}
```

#### Update Team Member
```typescript
PATCH /api/v2/admin/team/:userId

Request Body:
{
    fullName: string;
    employeeId: string;
    email: string;
    phone: string;
    address: string;
    role: "Admin" | "Manager" | "Support" | "Agent";
    status: "Active" | "Inactive" | "On Leave";
    remarks: string;
    department: string;
    designation: string;
}

Response:
{
    data: TeamMember;
    message: string;
}
```

#### Update Team Member Status
```typescript
PATCH /api/v2/admin/team/:userId/status

Request Body:
{
    status: "Active" | "Inactive" | "On Leave";
    reason?: string;
}

Response:
{
    data: {
        userId: string;
        status: string;
        message: string;
    }
}
```

#### Update Team Member Permissions
```typescript
PATCH /api/v2/admin/team/:userId/permissions

Request Body:
{
    permissions: {
        dashboardAccess: boolean;
        userManagement: boolean;
        teamManagement: boolean;
        ordersShipping: boolean;
        financialOperations: boolean;
        systemConfig: boolean;
        sellerManagement: boolean;
        supportTickets: boolean;
        reportsAnalytics: boolean;
        marketingPromotions: boolean;
    }
}

Response:
{
    data: {
        userId: string;
        permissions: Record<string, boolean>;
        message: string;
    }
}
```

#### Upload Team Member Documents
```typescript
POST /api/v2/admin/team/:userId/documents

Request Body:
FormData {
    documentType: "idProof" | "employmentContract";
    file: File;  // Max size: 5MB, Allowed formats: jpg, jpeg, png, webp
}

Response:
{
    data: {
        documentType: string;
        name: string;
        url: string;
        message: string;
    }
}
```

### Role-Based Access Control

#### Available Roles
1. **Admin**
   - Full system access
   - Can manage team members
   - Can view and manage orders
   - Can access reports and analytics
   - Limited system configuration access

2. **Manager**
   - Can handle team operations
   - Can view and manage orders
   - Can access reports and analytics
   - Limited access to system settings

3. **Support**
   - Can handle customer support tickets
   - Can view order details
   - Limited access to system settings
   - Can access basic reports

4. **Agent**
   - Basic system access
   - Can view assigned orders
   - Limited to specific functions
   - Can handle basic customer support

### Permission Modules

1. **Dashboard Access**
   - View analytics and performance reports
   - Access dashboard widgets
   - View system status

2. **User Management**
   - View and manage customer accounts
   - Handle user verification
   - Manage user permissions

3. **Team Management**
   - Add, edit and remove team members
   - Assign roles and permissions
   - Manage team structure

4. **Orders & Shipping**
   - Manage orders and shipping processes
   - Handle order modifications
   - Process shipping labels

5. **Financial Operations**
   - Process refunds, payments and transactions
   - Handle financial reports
   - Manage billing operations

6. **System Configuration**
   - Modify system settings and configurations
   - Update system parameters
   - Manage integrations

7. **Seller Management**
   - Onboard and manage seller profiles
   - Handle seller verification
   - Manage seller accounts

8. **Support Tickets**
   - Handle customer support requests
   - Manage ticket priorities
   - Resolve customer issues

9. **Reports & Analytics**
   - Generate and export detailed reports
   - Access analytics dashboard
   - Create custom reports

10. **Marketing & Promotions**
    - Manage campaigns and promotional offers
    - Handle marketing materials
    - Track campaign performance

### Best Practices

1. **Role Assignment**
   - Follow principle of least privilege
   - Assign roles based on responsibilities
   - Regular role review and updates
   - Document role changes

2. **Permission Management**
   - Regular permission audits
   - Document permission changes
   - Monitor permission usage
   - Implement permission inheritance

3. **Document Management**
   - Secure document storage
   - Regular document verification
   - Maintain document history
   - Implement document expiry

4. **Team Communication**
   - Regular team updates
   - Clear communication channels
   - Document important decisions
   - Maintain team records

5. **Security Measures**
   - Regular security audits
   - Monitor suspicious activities
   - Implement access logs
   - Regular password updates

### Validation Rules

#### Team Member Validation
```typescript
{
    fullName: {
        required: true,
        type: "string",
        minLength: 2,
        maxLength: 50,
        message: "Name must be between 2 and 50 characters"
    },
    email: {
        required: true,
        type: "string",
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        message: "Invalid email format"
    },
    phone: {
        required: true,
        type: "string",
        minLength: 10,
        maxLength: 15,
        message: "Phone number must be between 10 and 15 digits"
    },
    role: {
        required: true,
        type: "string",
        enum: ["Admin", "Manager", "Support", "Agent"],
        message: "Please select a valid role"
    },
    department: {
        required: true,
        type: "string",
        minLength: 1,
        message: "Department is required"
    },
    designation: {
        required: true,
        type: "string",
        minLength: 1,
        message: "Designation is required"
    }
}
```

#### Document Validation
```typescript
{
    fileSize: {
        maxSize: 5000000, // 5MB
        message: "Max file size is 5MB"
    },
    fileTypes: {
        allowed: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        message: "Only .jpg, .jpeg, .png and .webp formats are supported"
    }
}
```

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // Permission Errors
    INSUFFICIENT_PERMISSIONS: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "You don't have permission to perform this action",
        status: 403
    },

    // Resource Errors
    TEAM_MEMBER_NOT_FOUND: {
        code: "TEAM_MEMBER_NOT_FOUND",
        message: "Team member not found",
        status: 404
    },

    // Document Errors
    INVALID_DOCUMENT: {
        code: "INVALID_DOCUMENT",
        message: "Invalid document format or size",
        status: 400
    }
}
```

## Shipping Partner Management

### Overview
The Shipping Partner Management system allows administrators to manage courier partners, their services, rate cards, and performance metrics.

### Partner Structure

#### Partner Interface
```typescript
interface Partner {
    id: string;
    name: string;
    logoUrl?: string;
    apiStatus: "active" | "inactive" | "maintenance";
    performanceScore: string;
    lastUpdated: string;
    shipmentCount: number;
    deliverySuccess: string;
    supportContact: string;
    supportEmail: string;
    apiKey?: string;
    apiEndpoint?: string;
    serviceTypes: string[];
    serviceAreas: string[];
    weightLimits: {
        min: number;
        max: number;
    };
    dimensionLimits?: {
        maxLength: number;
        maxWidth: number;
        maxHeight: number;
        maxSum: number;
    };
    rates: {
        baseRate: number;
        weightRate: number;
        dimensionalFactor: number;
    };
    zones?: Zone[];
    trackingUrl?: string;
    integrationDate: string;
    notes?: string;
}

interface Zone {
    name: string;
    baseRate: number;
    additionalRate: number;
}
```

### UI Components

#### Add Partner Button
```typescript
// Button Component
<Button variant="primary" onClick={handleAddPartner}>
    <Plus className="mr-2 h-4 w-4" />
    Add Partner
</Button>

// Add Partner Modal
<Dialog open={showAddPartnerModal} onOpenChange={setShowAddPartnerModal}>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>Add New Shipping Partner</DialogTitle>
        </DialogHeader>
        
        {/* Form Fields */}
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Partner Name *</Label>
                        <Input
                            id="name"
                            value={newPartner.name}
                            onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter partner name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="supportEmail">Support Email *</Label>
                        <Input
                            id="supportEmail"
                            type="email"
                            value={newPartner.supportEmail}
                            onChange={(e) => setNewPartner(prev => ({ ...prev, supportEmail: e.target.value }))}
                            placeholder="Enter support email"
                        />
                    </div>
                    <div>
                        <Label htmlFor="supportContact">Support Contact *</Label>
                        <Input
                            id="supportContact"
                            value={newPartner.supportContact}
                            onChange={(e) => setNewPartner(prev => ({ ...prev, supportContact: e.target.value }))}
                            placeholder="Enter support contact"
                        />
                    </div>
                </div>
            </div>

            {/* API Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">API Configuration</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="apiEndpoint">API Endpoint</Label>
                        <Input
                            id="apiEndpoint"
                            value={newPartner.apiEndpoint}
                            onChange={(e) => setNewPartner(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                            placeholder="Enter API endpoint"
                        />
                    </div>
                    <div>
                        <Label htmlFor="trackingUrl">Tracking URL</Label>
                        <Input
                            id="trackingUrl"
                            value={newPartner.trackingUrl}
                            onChange={(e) => setNewPartner(prev => ({ ...prev, trackingUrl: e.target.value }))}
                            placeholder="Enter tracking URL"
                        />
                    </div>
                </div>
            </div>

            {/* Service Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">Service Configuration</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="serviceTypes">Service Types</Label>
                        <Input
                            id="serviceTypes"
                            value={newPartner.serviceTypes?.join(", ")}
                            onChange={(e) => setNewPartner(prev => ({ 
                                ...prev, 
                                serviceTypes: e.target.value.split(",").map(type => type.trim())
                            }))}
                            placeholder="Enter service types (comma-separated)"
                        />
                    </div>
                    <div>
                        <Label htmlFor="serviceAreas">Service Areas</Label>
                        <Input
                            id="serviceAreas"
                            value={newPartner.serviceAreas?.join(", ")}
                            onChange={(e) => setNewPartner(prev => ({ 
                                ...prev, 
                                serviceAreas: e.target.value.split(",").map(area => area.trim())
                            }))}
                            placeholder="Enter service areas (comma-separated)"
                        />
                    </div>
                </div>
            </div>

            {/* Weight & Dimensions */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">Weight & Dimensions</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="minWeight">Min Weight (kg)</Label>
                            <Input
                                id="minWeight"
                                type="number"
                                value={newPartner.weightLimits?.min}
                                onChange={(e) => setNewPartner(prev => ({ 
                                    ...prev, 
                                    weightLimits: { ...prev.weightLimits!, min: Number(e.target.value) }
                                }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                            <Input
                                id="maxWeight"
                                type="number"
                                value={newPartner.weightLimits?.max}
                                onChange={(e) => setNewPartner(prev => ({ 
                                    ...prev, 
                                    weightLimits: { ...prev.weightLimits!, max: Number(e.target.value) }
                                }))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Rate Configuration */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">Rate Configuration</h3>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="baseRate">Base Rate (₹)</Label>
                        <Input
                            id="baseRate"
                            type="number"
                            value={newPartner.rates?.baseRate}
                            onChange={(e) => setNewPartner(prev => ({ 
                                ...prev, 
                                rates: { ...prev.rates!, baseRate: Number(e.target.value) }
                            }))}
                        />
                    </div>
                    <div>
                        <Label htmlFor="weightRate">Weight Rate (₹/kg)</Label>
                        <Input
                            id="weightRate"
                            type="number"
                            value={newPartner.rates?.weightRate}
                            onChange={(e) => setNewPartner(prev => ({ 
                                ...prev, 
                                rates: { ...prev.rates!, weightRate: Number(e.target.value) }
                            }))}
                        />
                    </div>
                </div>
            </div>
        </div>
        
        <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPartnerModal(false)}>
                Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePartner} disabled={isSaving}>
                {isSaving ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    "Add Partner"
                )}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

### Partner Management Endpoints

#### List Partners
```typescript
GET /api/v2/admin/partners

Query Parameters:
  page: number
  limit: number
  search?: string
  status?: "active" | "inactive" | "maintenance"
  serviceType?: string
  sortField?: string
  sortOrder?: "asc" | "desc"

Response:
{
    data: Partner[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}
```

#### Get Partner Details
```typescript
GET /api/v2/admin/partners/:id

Response:
{
    data: Partner
}
```

#### Create Partner
```typescript
POST /api/v2/admin/partners

Request Body:
{
    name: string;
    logoUrl?: string;
    apiStatus: "active" | "inactive" | "maintenance";
    supportContact: string;
    supportEmail: string;
    apiKey?: string;
    apiEndpoint?: string;
    serviceTypes: string[];
    serviceAreas: string[];
    weightLimits: {
        min: number;
        max: number;
    };
    dimensionLimits?: {
        maxLength: number;
        maxWidth: number;
        maxHeight: number;
        maxSum: number;
    };
    rates: {
        baseRate: number;
        weightRate: number;
        dimensionalFactor: number;
    };
    zones?: [
        {
            name: string;
            baseRate: number;
            additionalRate: number;
        }
    ];
    trackingUrl?: string;
    notes?: string;
}

Response:
{
    data: {
        id: string;
        name: string;
        apiStatus: string;
        createdAt: string;
        message: string;
    }
}
```

#### Update Partner
```typescript
PUT /api/v2/admin/partners/:id

Request Body:
{
    // Same as Create Partner
}

Response:
{
    data: Partner;
    message: string;
}
```

#### Update Partner Status
```typescript
PATCH /api/v2/admin/partners/:id/status

Request Body:
{
    status: "active" | "inactive" | "maintenance";
    reason?: string;
}

Response:
{
    data: {
        id: string;
        status: string;
        message: string;
    }
}
```

### Rate Card Management

#### Rate Card Structure
```typescript
interface RateCard {
    rateBand: string;
    lastUpdated: string;
    couriers: Array<{
        name: string;
        rates: {
            withinCity: number;
            withinState: number;
            metroToMetro: number;
            restOfIndia: number;
            northEastJK: number;
        };
        codCharge: number;
        codPercent: number;
    }>;
}

interface DetailedRateObject {
    courier: string;
    rates: {
        withinCity: ZoneRate;
        withinState: ZoneRate;
        metroToMetro: ZoneRate;
        restOfIndia: ZoneRate;
        northEastJK: ZoneRate;
    };
    cod: string;
    codPercent: string;
}

interface ZoneRate {
    base: string;
    additional: string;
    rto: string;
}
```

#### Rate Card Endpoints

##### Get Rate Card
```typescript
GET /api/v2/admin/partners/:id/rate-card

Response:
{
    data: RateCard
}
```

##### Update Rate Card
```typescript
PUT /api/v2/admin/partners/:id/rate-card

Request Body:
{
    rateBand: string;
    couriers: Array<{
        name: string;
        rates: {
            withinCity: number;
            withinState: number;
            metroToMetro: number;
            restOfIndia: number;
            northEastJK: number;
        };
        codCharge: number;
        codPercent: number;
    }>;
}

Response:
{
    data: RateCard;
    message: string;
}
```

### Performance Monitoring

#### Performance Metrics
1. **Delivery Success Rate**
   - Successful deliveries
   - Failed deliveries
   - Return rate
   - Average delivery time

2. **Service Quality**
   - On-time delivery rate
   - Customer satisfaction
   - Complaint resolution time
   - Service availability

3. **Operational Metrics**
   - Shipment volume
   - Pickup success rate
   - Transit time
   - Exception handling

#### Performance Endpoints

##### Get Partner Performance
```typescript
GET /api/v2/admin/partners/:id/performance

Query Parameters:
  from?: string (ISO date)
  to?: string (ISO date)

Response:
{
    data: {
        deliverySuccess: string;
        onTimeDelivery: string;
        averageDeliveryTime: string;
        complaintResolutionTime: string;
        shipmentVolume: number;
        pickupSuccess: string;
        exceptionRate: string;
        customerSatisfaction: string;
    }
}
```

### Form Validation
```typescript
const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newPartner.name?.trim()) {
        errors.name = "Partner name is required";
    }
    
    if (!newPartner.supportEmail?.trim()) {
        errors.supportEmail = "Support email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPartner.supportEmail)) {
        errors.supportEmail = "Invalid email format";
    }
    
    if (newPartner.apiEndpoint && !newPartner.apiEndpoint.startsWith('http')) {
        errors.apiEndpoint = "API endpoint must start with http:// or https://";
    }
    
    if (newPartner.trackingUrl && !newPartner.trackingUrl.startsWith('http')) {
        errors.trackingUrl = "Tracking URL must start with http:// or https://";
    }
    
    if (newPartner.weightLimits?.min && newPartner.weightLimits?.max && 
        newPartner.weightLimits.min >= newPartner.weightLimits.max) {
        errors.weightLimits = "Minimum weight must be less than maximum weight";
    }
    
    if (newPartner.rates?.baseRate && newPartner.rates.baseRate < 0) {
        errors.baseRate = "Base rate cannot be negative";
    }
    
    if (newPartner.rates?.weightRate && newPartner.rates.weightRate < 0) {
        errors.weightRate = "Weight rate cannot be negative";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
};
```

### Error Handling

#### Form Errors
```typescript
interface FormErrors {
    name?: string;
    supportEmail?: string;
    apiEndpoint?: string;
    trackingUrl?: string;
    weightLimits?: string;
    baseRate?: string;
    weightRate?: string;
}
```

#### API Errors
```typescript
interface ApiError {
    code: string;
    message: string;
    details?: {
        field: string;
        message: string;
    }[];
}
```

### Best Practices

1. **Partner Onboarding**
   - Verify partner credentials
   - Test API integration
   - Validate service areas
   - Set up monitoring
   - Document integration details

2. **Rate Management**
   - Regular rate reviews
   - Monitor market rates
   - Update rate cards
   - Track rate changes
   - Maintain rate history

3. **Performance Monitoring**
   - Track key metrics
   - Set performance thresholds
   - Regular performance reviews
   - Address issues promptly
   - Maintain performance history

4. **Service Quality**
   - Monitor delivery times
   - Track customer feedback
   - Handle complaints
   - Regular service audits
   - Maintain quality standards

5. **Integration Management**
   - Regular API testing
   - Monitor API health
   - Update integration details
   - Maintain documentation
   - Handle API changes

## Product Management

## Order Management

### Overview
The Order Management system allows administrators to manage and monitor orders from both sellers and customers. It provides comprehensive tools for order tracking, status updates, and analytics.

### Order Types

1. **Seller Orders**
   - Orders placed by sellers
   - Bulk order management
   - Warehouse integration
   - Shipping partner assignment
   - Rate card management

2. **Customer Orders**
   - Direct customer purchases
   - Individual order tracking
   - Customer support integration
   - Payment processing
   - Delivery status updates

### Order Management Endpoints

#### List Orders
```typescript
GET /api/v2/admin/orders

Query Parameters:
  type: "seller" | "customer"
  page: number
  limit: number
  search?: string
  status?: "Booked" | "Processing" | "In Transit" | "Out for Delivery" | "Delivered" | "Returned"
  paymentType?: "COD" | "Prepaid"
  priority?: "High" | "Medium" | "Low"
  from?: string (ISO date)
  to?: string (ISO date)
  sortField?: string
  sortOrder?: "asc" | "desc"

Response:
{
    data: Order[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}
```

#### Get Order Details
```typescript
GET /api/v2/admin/orders/:orderId

Response:
{
    data: {
        id: string;
        orderId: string;
        date: string;
        customer: {
            name: string;
            email: string;
            phone: string;
            address: string;
        };
        items: Array<{
            name: string;
            sku: string;
            quantity: number;
            price: number;
            total: number;
            image: string;
        }>;
        amount: string;
        payment: "COD" | "Prepaid";
        channel: "MANUAL" | "EXCEL" | "SHOPIFY" | "WOOCOMMERCE" | "AMAZON" | "FLIPKART" | "OPENCART" | "API";
        weight: string;
        status: "Booked" | "Processing" | "In Transit" | "Out for Delivery" | "Delivered" | "Returned";
        awbNumber?: string;
        courier?: string;
        priority: "High" | "Medium" | "Low";
        tags: string[];
        whatsapp: string;
        warehouse?: {
            name: string;
            address: string;
            phone: string;
        };
    }
}
```

#### Update Order Status
```typescript
PATCH /api/v2/admin/orders/:orderId/status

Request Body:
{
    status: "Booked" | "Processing" | "In Transit" | "Out for Delivery" | "Delivered" | "Returned";
    reason?: string;
}

Response:
{
    data: {
        id: string;
        status: string;
        message: string;
    }
}
```

#### Bulk Update Orders
```typescript
PATCH /api/v2/admin/orders/bulk

Request Body:
{
    orderIds: string[];
    status: "Booked" | "Processing" | "In Transit" | "Out for Delivery" | "Delivered" | "Returned";
    reason?: string;
}

Response:
{
    data: {
        updated: number;
        failed: number;
        message: string;
    }
}
```

### Order Status Management

#### Available Statuses
1. **Booked**
   - Initial order state
   - Awaiting processing
   - Ready for warehouse assignment

2. **Processing**
   - Order being prepared
   - Warehouse processing
   - Label generation

3. **In Transit**
   - Shipment picked up
   - In courier network
   - Tracking active

4. **Out for Delivery**
   - Local delivery
   - Final delivery attempt
   - Customer contact

5. **Delivered**
   - Successful delivery
   - Order completed
   - Customer confirmation

6. **Returned**
   - Failed delivery
   - Customer return
   - Return processing

### Order Management Features

#### 1. Seller Order Management
- View seller orders
- Process bulk orders
- Assign warehouses
- Manage shipping partners
- Track order status
- Handle returns
- Process refunds
- Generate reports

#### 2. Customer Order Management
- View customer orders
- Track order status
- Handle customer support
- Process refunds
- Manage returns
- Generate invoices
- Track delivery

#### 3. Common Features
- Search and filter orders
- Sort by various fields
- Bulk actions
- Export order data
- View order history
- Track order status
- Generate reports
- Handle disputes

### Order Tracking

#### Tracking Interface
```typescript
interface OrderTracking {
    orderId: string;
    awbNumber: string;
    status: string;
    updates: Array<{
        status: string;
        location: string;
        timestamp: string;
        description: string;
    }>;
    estimatedDelivery: string;
    actualDelivery?: string;
    courier: {
        name: string;
        contact: string;
        trackingUrl: string;
    };
}
```

#### Tracking Endpoints

##### Get Order Tracking
```typescript
GET /api/v2/admin/orders/:orderId/tracking

Response:
{
    data: OrderTracking
}
```

##### Update Tracking
```typescript
POST /api/v2/admin/orders/:orderId/tracking

Request Body:
{
    status: string;
    location: string;
    description: string;
}

Response:
{
    data: {
        id: string;
        status: string;
        message: string;
    }
}
```

### Order Analytics

#### Analytics Metrics
1. **Order Volume**
   - Total orders
   - Orders by status
   - Orders by channel
   - Orders by payment type

2. **Performance Metrics**
   - Average order value
   - Order completion rate
   - Return rate
   - Delivery success rate

3. **Financial Metrics**
   - Total revenue
   - Revenue by channel
   - Payment method distribution
   - Refund rate

#### Analytics Endpoints

##### Get Order Analytics
```typescript
GET /api/v2/admin/orders/analytics

Query Parameters:
  from?: string (ISO date)
  to?: string (ISO date)
  type?: "seller" | "customer"

Response:
{
    data: {
        orderVolume: {
            total: number;
            byStatus: Record<string, number>;
            byChannel: Record<string, number>;
            byPaymentType: Record<string, number>;
        };
        performance: {
            averageOrderValue: number;
            orderCompletionRate: number;
            returnRate: number;
            deliverySuccessRate: number;
        };
        financial: {
            totalRevenue: number;
            revenueByChannel: Record<string, number>;
            paymentMethodDistribution: Record<string, number>;
            refundRate: number;
        };
    }
}
```

### Best Practices

1. **Order Processing**
   - Validate order details
   - Check inventory
   - Verify payment
   - Assign warehouse
   - Generate shipping label

2. **Status Management**
   - Regular status updates
   - Customer notifications
   - Exception handling
   - Return processing
   - Refund management

3. **Customer Support**
   - Quick response time
   - Clear communication
   - Issue resolution
   - Customer feedback
   - Support ticket management

4. **Data Management**
   - Regular backups
   - Data validation
   - Error logging
   - Audit trails
   - Performance monitoring

5. **Security**
   - Access control
   - Data encryption
   - Secure payments
   - Fraud prevention
   - Compliance checks

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // Order Errors
    ORDER_NOT_FOUND: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
        status: 404
    },
    INVALID_STATUS: {
        code: "INVALID_STATUS",
        message: "Invalid order status",
        status: 400
    },
    UPDATE_FAILED: {
        code: "UPDATE_FAILED",
        message: "Failed to update order",
        status: 500
    },

    // System Errors
    SERVER_ERROR: {
        code: "SERVER_ERROR",
        message: "Server error occurred",
        status: 500
    }
}
```

## Category Management

## Settings & Configuration

### Overview
The Settings & Configuration system allows administrators to manage various system-wide settings, notifications, policy pages, and maintenance mode. The system is organized into four main sections: System Configuration, Notification Settings, Policy Pages, and Maintenance Mode.

### System Configuration

#### System Settings Interface
```typescript
interface SystemConfig {
    // General Settings
    siteTitle: string;
    siteUrl: string;
    adminEmail: string;
    supportPhone: string;
    
    // Display Settings
    timezone: string;          // UTC, GMT, EST, PST, IST
    dateFormat: string;        // DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    timeFormat: string;        // 12, 24
    weekStart: string;         // sunday, monday
    showSeconds: boolean;
    
    // Currency Settings
    currency: string;          // USD, EUR, GBP, INR
    currencySymbol: string;    // $, €, £, ₹
    currencyFormat: string;    // both, symbol, text
    
    // Payment Settings
    enabledGateways: string[]; // stripe, paypal, etc.
    defaultGateway: string;
    autoRefundEnabled: boolean;
    refundPeriod: number;      // in days
    
    // Shipping Settings
    defaultCouriers: string[];
    enabledCouriers: string[];
    autoAssignCourier: boolean;
    defaultWeightUnit: string;     // kg, g, lb
    defaultDimensionUnit: string;  // cm, inch
    
    // Security Settings
    sessionTimeout: number;        // in minutes
    loginAttempts: number;
    passwordResetExpiry: number;   // in hours
    twoFactorAuth: boolean;
}
```

#### Endpoints
```typescript
// Get System Configuration
GET /api/v2/admin/settings/system

Response:
{
    data: SystemConfig
}

// Update System Configuration
PUT /api/v2/admin/settings/system

Request Body: SystemConfig

Response:
{
    data: SystemConfig;
    message: string;
}
```

### Notification Settings

#### Notification Types
1. **Email Notifications**
   - Email templates
   - SMTP configuration
   - Delivery methods
   - Test functionality

2. **SMS Notifications**
   - SMS templates
   - API configuration
   - Delivery methods
   - Test functionality

#### Email Configuration
```typescript
interface EmailConfig {
    emailMethod: "php" | "smtp" | "sendgrid" | "mailjet";
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpEncryption?: "tls" | "ssl";
    sendgridApiKey?: string;
    mailjetApiKey?: string;
    mailjetSecretKey?: string;
    emailSentFromName: string;
    emailSentFromEmail: string;
    emailBody: string;
}
```

#### SMS Configuration
```typescript
interface SMSConfig {
    smsMethod: "nexmo" | "Clickatell" | "Message Brid" | "Infobip";
    apiKey: string;
    apiSecret: string;
    smsSentFrom: string;
    smsBody: string;
}
```

#### System Configuration
```typescript
interface NotificationSystemConfig {
    emailNotification: boolean;
    smsNotification: boolean;
    languageOption: boolean;
}
```

#### Endpoints
```typescript
// Get Email Configuration
GET /api/v2/admin/settings/notification/email

// Update Email Configuration
PUT /api/v2/admin/settings/notification/email

// Get SMS Configuration
GET /api/v2/admin/settings/notification/sms

// Update SMS Configuration
PUT /api/v2/admin/settings/notification/sms

// Get System Configuration
GET /api/v2/admin/settings/notification/system

// Update System Configuration
PUT /api/v2/admin/settings/notification/system

// Send Test Email
POST /api/v2/admin/settings/notification/email/test

// Send Test SMS
POST /api/v2/admin/settings/notification/sms/test
```

### Policy Pages

#### Policy Interface
```typescript
interface Policy {
    id: string;
    title: string;
    slug: string;
    content: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status: "draft" | "published";
    createdAt: string;
    updatedAt: string;
}
```

#### Available Policy Types
1. **Terms of Service**
2. **Privacy Policy**
3. **Shipping Policy**
4. **Return Policy**
5. **Refund Policy**
6. **Cookie Policy**
7. **User Agreement**
8. **Seller Agreement**

#### Endpoints
```typescript
// List Policies
GET /api/v2/admin/settings/policy

Response:
{
    data: Policy[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}

// Get Policy Details
GET /api/v2/admin/settings/policy/:slug

// Create Policy
POST /api/v2/admin/settings/policy

// Update Policy
PUT /api/v2/admin/settings/policy/:slug

// Delete Policy
DELETE /api/v2/admin/settings/policy/:slug
```

### Maintenance Mode

#### Maintenance Settings Interface
```typescript
interface MaintenanceConfig {
    isEnabled: boolean;
    analyticsEnabled: boolean;
    title: string;
    description: string;
    image?: string;
    whitelistedIPs: string[];
    customCSS?: string;
    customJS?: string;
}
```

#### Features
1. **Status Control**
   - Enable/disable maintenance mode
   - Analytics tracking
   - IP whitelisting

2. **Customization**
   - Custom title and description
   - Custom image
   - Custom CSS and JavaScript
   - IP whitelist management

#### Endpoints
```typescript
// Get Maintenance Settings
GET /api/v2/admin/settings/maintenance

// Update Maintenance Settings
PUT /api/v2/admin/settings/maintenance

// Add Whitelisted IP
POST /api/v2/admin/settings/maintenance/whitelist

// Remove Whitelisted IP
DELETE /api/v2/admin/settings/maintenance/whitelist/:ip
```

### Best Practices

1. **System Configuration**
   - Regular backup of settings
   - Test changes in staging
   - Document configuration changes
   - Monitor system performance

2. **Notification Settings**
   - Test email/SMS delivery
   - Monitor delivery rates
   - Update templates regularly
   - Maintain API credentials securely

3. **Policy Pages**
   - Regular content updates
   - SEO optimization
   - Legal compliance
   - Version control

4. **Maintenance Mode**
   - Plan maintenance windows
   - Notify users in advance
   - Test whitelisted IPs
   - Monitor analytics

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // Configuration Errors
    INVALID_CONFIG: {
        code: "INVALID_CONFIG",
        message: "Invalid configuration",
        status: 400
    },
    UPDATE_FAILED: {
        code: "UPDATE_FAILED",
        message: "Failed to update settings",
        status: 500
    },

    // Notification Errors
    EMAIL_SEND_FAILED: {
        code: "EMAIL_SEND_FAILED",
        message: "Failed to send email",
        status: 500
    },
    SMS_SEND_FAILED: {
        code: "SMS_SEND_FAILED",
        message: "Failed to send SMS",
        status: 500
    },

    // Policy Errors
    POLICY_NOT_FOUND: {
        code: "POLICY_NOT_FOUND",
        message: "Policy not found",
        status: 404
    },
    DUPLICATE_SLUG: {
        code: "DUPLICATE_SLUG",
        message: "Policy slug already exists",
        status: 409
    }
}
```

## Error Handling & Validation

## Shipment Management

### Overview
The Shipment Management system allows administrators to track, manage, and monitor all shipments across the platform. It provides comprehensive tools for shipment tracking, status updates, and performance analytics.

### Shipment Types

1. **Regular Shipments**
   - Standard delivery service
   - Normal processing time
   - Standard tracking
   - Regular updates

2. **Express Shipments**
   - Priority delivery service
   - Faster processing
   - Real-time tracking
   - Enhanced updates

3. **Bulk Shipments**
   - Multiple package handling
   - Batch processing
   - Consolidated tracking
   - Bulk status updates

### Shipment Management Endpoints

#### List Shipments
```typescript
GET /api/v2/admin/shipments

Query Parameters:
  page: number
  limit: number
  search?: string
  status?: "Booked" | "Pending Pickup" | "In Transit" | "Out for Delivery" | "Delivered" | "Cancelled" | "Exception"
  courier?: string
  from?: string (ISO date)
  to?: string (ISO date)
  sortField?: string
  sortOrder?: "asc" | "desc"

Response:
{
    data: Array<{
        orderId: string;
        orderDate: string;
        booked: string;
        pickupId: string;
        customer: string;
        product: string;
        amount: string;
        payment: "COD" | "Prepaid";
        weight: string;
        channel: string;
        awb: string;
        courier: string;
        tracking: string;
        status: string;
    }>;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}
```

#### Get Shipment Details
```typescript
GET /api/v2/admin/shipments/:shipmentId

Response:
{
    data: {
        shipmentId: string;
        orderId: string;
        orderDate: string;
        booked: string;
        pickupId: string;
        customer: {
            name: string;
            phone: string;
            email: string;
            address: {
                street: string;
                city: string;
                state: string;
                pincode: string;
                country: string;
            }
        };
        product: {
            name: string;
            sku: string;
            quantity: number;
            price: number;
            weight: string;
            dimensions: {
                length: number;
                width: number;
                height: number;
            }
        };
        payment: {
            method: "COD" | "Prepaid";
            amount: string;
            codCharge: string;
            shippingCharge: string;
            gst: string;
            total: string;
        };
        channel: string;
        awb: string;
        courier: {
            name: string;
            trackingUrl: string;
        };
        status: string;
        trackingHistory: Array<{
            status: string;
            location: string;
            timestamp: string;
            description: string;
        }>;
    }
}
```

#### Update Shipment Status
```typescript
PATCH /api/v2/admin/shipments/:shipmentId/status

Request Body:
{
    status: "Booked" | "Pending Pickup" | "In Transit" | "Out for Delivery" | "Delivered" | "Cancelled" | "Exception";
    reason?: string;
    location?: string;
    description?: string;
}

Response:
{
    data: {
        id: string;
        status: string;
        message: string;
    }
}
```

#### Bulk Update Shipments
```typescript
PATCH /api/v2/admin/shipments/bulk

Request Body:
{
    shipmentIds: string[];
    status: "Booked" | "Pending Pickup" | "In Transit" | "Out for Delivery" | "Delivered" | "Cancelled" | "Exception";
    reason?: string;
}

Response:
{
    data: {
        updated: number;
        failed: number;
        message: string;
    }
}
```

### Shipment Status Management

#### Available Statuses
1. **Booked**
   - Initial shipment state
   - AWB number generated
   - Awaiting pickup

2. **Pending Pickup**
   - Awaiting courier pickup
   - Scheduled for pickup
   - Can be rescheduled

3. **In Transit**
   - Shipment picked up
   - Moving through courier network
   - Multiple transit points possible

4. **Out for Delivery**
   - Local delivery
   - Final delivery attempt
   - Customer contact

5. **Delivered**
   - Final state
   - Package delivered to recipient
   - Delivery confirmation received

6. **Cancelled**
   - Shipment cancelled
   - No further updates
   - May be refunded

7. **Exception**
   - Special handling required
   - Delivery issues
   - Requires attention

### Shipment Tracking

#### Tracking Interface
```typescript
interface ShipmentTracking {
    awbNumber: string;
    currentStatus: string;
    expectedDelivery: string;
    origin: string;
    destination: string;
    courier: string;
    events: Array<{
        status: string;
        location: string;
        timestamp: string;
        description: string;
    }>;
}
```

#### Tracking Endpoints

##### Get Shipment Tracking
```typescript
GET /api/v2/admin/shipments/:awb/track

Response:
{
    data: ShipmentTracking
}
```

##### Update Tracking
```typescript
POST /api/v2/admin/shipments/:awb/tracking

Request Body:
{
    status: string;
    location: string;
    description: string;
}

Response:
{
    data: {
        id: string;
        status: string;
        message: string;
    }
}
```

### Shipment Analytics

#### Analytics Metrics
1. **Volume Metrics**
   - Total shipments
   - Shipments by status
   - Shipments by courier
   - Shipments by channel

2. **Performance Metrics**
   - Average delivery time
   - On-time delivery rate
   - Exception rate
   - Return rate

3. **Courier Metrics**
   - Courier-wise performance
   - Service quality score
   - Delivery success rate
   - Customer satisfaction

#### Analytics Endpoints

##### Get Shipment Analytics
```typescript
GET /api/v2/admin/shipments/analytics

Query Parameters:
  from?: string (ISO date)
  to?: string (ISO date)
  courier?: string

Response:
{
    data: {
        volume: {
            total: number;
            byStatus: Record<string, number>;
            byCourier: Record<string, number>;
            byChannel: Record<string, number>;
        };
        performance: {
            averageDeliveryTime: number;
            onTimeDeliveryRate: number;
            exceptionRate: number;
            returnRate: number;
        };
        courier: {
            performance: Record<string, {
                successRate: number;
                averageDeliveryTime: number;
                exceptionRate: number;
                customerSatisfaction: number;
            }>;
        };
    }
}
```

### Best Practices

1. **Shipment Processing**
   - Validate shipment details
   - Verify courier assignment
   - Check pickup scheduling
   - Monitor transit status
   - Track delivery progress

2. **Status Management**
   - Regular status updates
   - Customer notifications
   - Exception handling
   - Return processing
   - Delivery confirmation

3. **Customer Support**
   - Quick response time
   - Clear communication
   - Issue resolution
   - Customer feedback
   - Support ticket management

4. **Data Management**
   - Regular backups
   - Data validation
   - Error logging
   - Audit trails
   - Performance monitoring

5. **Security**
   - Access control
   - Data encryption
   - Secure tracking
   - Fraud prevention
   - Compliance checks

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // Shipment Errors
    SHIPMENT_NOT_FOUND: {
        code: "SHIPMENT_NOT_FOUND",
        message: "Shipment not found",
        status: 404
    },
    INVALID_STATUS: {
        code: "INVALID_STATUS",
        message: "Invalid shipment status",
        status: 400
    },
    UPDATE_FAILED: {
        code: "UPDATE_FAILED",
        message: "Failed to update shipment",
        status: 500
    },

    // Tracking Errors
    TRACKING_UNAVAILABLE: {
        code: "TRACKING_UNAVAILABLE",
        message: "Tracking information not available",
        status: 404
    },
    INVALID_AWB: {
        code: "INVALID_AWB",
        message: "Invalid AWB number",
        status: 400
    },

    // System Errors
    SERVER_ERROR: {
        code: "SERVER_ERROR",
        message: "Server error occurred",
        status: 500
    }
}
```

## Support Ticket Management

### Overview
The Support Ticket Management system allows administrators to handle customer and seller support requests, manage ticket priorities, and track issue resolution.

### Ticket Structure

#### Ticket Interface
```typescript
interface SupportTicket {
    id: string;
    subject: string;
    category: "ORDER" | "PICKUP" | "BILLING" | "REMITTANCE" | "WT_DISPUTE" | "TECH" | "CALLBACK" | "KYC" | "FINANCE";
    priority: "Low" | "Medium" | "High" | "Urgent";
    status: "New" | "In Progress" | "Resolved" | "Closed";
    customer: {
        id: string;
        name: string;
        email: string;
        phone: string;
        type: "seller" | "customer";
    };
    details: string;
    attachments?: Array<{
        name: string;
        url: string;
        type: string;
        size: number;
    }>;
    assignedTo?: {
        id: string;
        name: string;
        role: string;
    };
    createdAt: string;
    updatedAt: string;
    responses: Array<{
        id: string;
        message: string;
        sender: "admin" | "customer" | "seller";
        attachments?: Array<{
            name: string;
            url: string;
        }>;
        createdAt: string;
    }>;
}
```

### Ticket Management Endpoints

#### List Tickets
```typescript
GET /api/v2/admin/support/tickets

Query Parameters:
  page: number
  limit: number
  search?: string
  status?: "New" | "In Progress" | "Resolved" | "Closed"
  category?: string
  priority?: "Low" | "Medium" | "High" | "Urgent"
  assignedTo?: string
  from?: string (ISO date)
  to?: string (ISO date)
  sortField?: string
  sortOrder?: "asc" | "desc"

Response:
{
    data: SupportTicket[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}
```

#### Get Ticket Details
```typescript
GET /api/v2/admin/support/tickets/:ticketId

Response:
{
    data: SupportTicket
}
```

#### Update Ticket Status
```typescript
PATCH /api/v2/admin/support/tickets/:ticketId/status

Request Body:
{
    status: "New" | "In Progress" | "Resolved" | "Closed";
    reason?: string;
}

Response:
{
    data: {
        id: string;
        status: string;
        message: string;
    }
}
```

#### Assign Ticket
```typescript
PATCH /api/v2/admin/support/tickets/:ticketId/assign

Request Body:
{
    assignedTo: string;  // Admin user ID
}

Response:
{
    data: {
        id: string;
        assignedTo: {
            id: string;
            name: string;
            role: string;
        };
        message: string;
    }
}
```

#### Add Response
```typescript
POST /api/v2/admin/support/tickets/:ticketId/responses

Request Body:
{
    message: string;
    attachments?: File[];  // Max 5 files, each < 5MB
}

Response:
{
    data: {
        id: string;
        message: string;
        sender: "admin";
        attachments?: Array<{
            name: string;
            url: string;
        }>;
        createdAt: string;
    }
}
```

### Ticket Categories

1. **ORDER**
   - Order creation and management
   - Order status updates
   - Order cancellation
   - Bulk order issues

2. **PICKUP**
   - Pickup scheduling
   - Pickup status
   - Pickup location issues
   - Courier pickup problems

3. **BILLING**
   - Invoice queries
   - Payment issues
   - Rate card questions
   - Billing disputes

4. **REMITTANCE**
   - COD settlement
   - Payment processing
   - Remittance delays
   - Bank account issues

5. **WT_DISPUTE**
   - Weight discrepancy
   - Weight verification
   - Weight charge disputes
   - Package weight issues

6. **TECH**
   - Platform technical issues
   - API integration
   - System errors
   - Performance problems

7. **CALLBACK**
   - Request callback
   - Schedule meeting
   - Priority support
   - Urgent assistance

8. **KYC**
   - Document verification
   - Account verification
   - KYC process
   - Compliance issues

9. **FINANCE**
   - Financial queries
   - Account statements
   - Refund requests
   - Payment reconciliation

### Ticket Priority Levels

1. **Urgent**
   - Critical system issues
   - Security concerns
   - Payment failures
   - Service disruptions

2. **High**
   - Order processing delays
   - Payment issues
   - Account access problems
   - Time-sensitive requests

3. **Medium**
   - General inquiries
   - Non-critical issues
   - Feature requests
   - Documentation needs

4. **Low**
   - General feedback
   - Minor issues
   - Enhancement requests
   - Non-urgent queries

### Ticket Status Management

#### Available Statuses
1. **New**
   - Initial ticket state
   - Awaiting assignment
   - Needs review

2. **In Progress**
   - Assigned to admin
   - Being handled
   - Active resolution

3. **Resolved**
   - Issue resolved
   - Awaiting confirmation
   - Pending closure

4. **Closed**
   - Ticket completed
   - No further action
   - Archived state

### Best Practices

1. **Ticket Processing**
   - Quick initial response
   - Proper categorization
   - Priority assessment
   - Regular updates
   - Clear communication

2. **Response Management**
   - Timely responses
   - Clear explanations
   - Professional tone
   - Follow-up actions
   - Resolution tracking

3. **Customer Support**
   - Empathetic approach
   - Clear communication
   - Regular updates
   - Issue resolution
   - Customer satisfaction

4. **Data Management**
   - Regular backups
   - Data validation
   - Error logging
   - Audit trails
   - Performance monitoring

5. **Security**
   - Access control
   - Data encryption
   - Secure attachments
   - Fraud prevention
   - Compliance checks

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // Ticket Errors
    TICKET_NOT_FOUND: {
        code: "TICKET_NOT_FOUND",
        message: "Support ticket not found",
        status: 404
    },
    INVALID_STATUS: {
        code: "INVALID_STATUS",
        message: "Invalid ticket status",
        status: 400
    },
    UPDATE_FAILED: {
        code: "UPDATE_FAILED",
        message: "Failed to update ticket",
        status: 500
    },

    // Attachment Errors
    FILE_TOO_LARGE: {
        code: "FILE_TOO_LARGE",
        message: "File size exceeds limit",
        status: 400
    },
    INVALID_FILE_TYPE: {
        code: "INVALID_FILE_TYPE",
        message: "Invalid file type",
        status: 400
    },

    // System Errors
    SERVER_ERROR: {
        code: "SERVER_ERROR",
        message: "Server error occurred",
        status: 500
    }
}
```

## NDR Management

### Overview
The NDR (Non-Delivery Report) Management system allows administrators to track, manage, and resolve failed delivery attempts. It provides tools for monitoring delivery attempts, handling customer communication, and managing return-to-origin (RTO) processes.

### NDR Structure

#### NDR Interface
```typescript
interface NDR {
    id: string;
    orderId: string;
    awb: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        address: {
            fullName: string;
            contactNumber: string;
            addressLine1: string;
            addressLine2?: string;
            landmark?: string;
            pincode: string;
            city: string;
            state: string;
        }
    };
    seller: {
        id: string;
        name: string;
        contact: string;
    };
    courier: {
        name: string;
        trackingUrl: string;
    };
    attempts: number;
    attemptHistory: Array<{
        date: string;
        time: string;
        status: string;
        reason: string;
        agentRemarks?: string;
    }>;
    status: "Pending" | "In Progress" | "Resolved" | "RTO Initiated";
    reason: string;
    recommendedAction: string;
    currentLocation?: {
        lat: number;
        lng: number;
    };
    products: Array<{
        name: string;
        sku: string;
        quantity: number;
        price: number;
        image: string;
    }>;
}
```

### NDR Management Endpoints

#### List NDRs
```typescript
GET /api/v2/admin/ndr

Query Parameters:
  page: number
  limit: number
  search?: string
  status?: "Pending" | "In Progress" | "Resolved" | "RTO Initiated"
  courier?: string
  from?: string (ISO date)
  to?: string (ISO date)
  sortField?: string
  sortOrder?: "asc" | "desc"

Response:
{
    data: NDR[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    }
}
```

#### Get NDR Details
```typescript
GET /api/v2/admin/ndr/:id

Response:
{
    data: NDR
}
```

#### Update NDR Status
```typescript
PATCH /api/v2/admin/ndr/:id/status

Request Body:
{
    status: "Pending" | "In Progress" | "Resolved" | "RTO Initiated";
    reason?: string;
    agentRemarks?: string;
}

Response:
{
    data: {
        id: string;
        status: string;
        message: string;
    }
}
```

#### Add Delivery Attempt
```typescript
POST /api/v2/admin/ndr/:id/attempts

Request Body:
{
    status: string;
    reason: string;
    agentRemarks?: string;
    location?: {
        lat: number;
        lng: number;
    };
}

Response:
{
    data: {
        id: string;
        attemptId: string;
        message: string;
    }
}
```

#### Initiate RTO
```typescript
POST /api/v2/admin/ndr/:id/rto

Request Body:
{
    reason: string;
    remarks?: string;
}

Response:
{
    data: {
        id: string;
        rtoId: string;
        status: "RTO Initiated";
        message: string;
    }
}
```

### NDR Status Management

#### Available Statuses
1. **Pending**
   - Initial NDR state
   - Awaiting action
   - Needs review

2. **In Progress**
   - Active resolution
   - Delivery attempts ongoing
   - Customer communication active

3. **Resolved**
   - Issue resolved
   - Delivery successful
   - Case closed

4. **RTO Initiated**
   - Return to origin started
   - Return tracking active
   - Return processing

### NDR Categories

1. **Customer Not Available**
   - Customer not at location
   - Contact number issues
   - Wrong timing

2. **Address Issues**
   - Incorrect address
   - Address not found
   - Location inaccessible

3. **Delivery Issues**
   - Package damaged
   - Wrong package
   - Delivery restrictions

4. **Customer Refusal**
   - Product rejected
   - Price issues
   - Quality concerns

### Best Practices

1. **NDR Processing**
   - Quick initial response
   - Proper categorization
   - Priority assessment
   - Regular updates
   - Clear communication

2. **Customer Communication**
   - Timely notifications
   - Clear explanations
   - Multiple contact attempts
   - Follow-up actions
   - Resolution tracking

3. **Delivery Management**
   - Optimize delivery attempts
   - Track delivery history
   - Monitor courier performance
   - Handle exceptions
   - Manage returns

4. **Data Management**
   - Regular backups
   - Data validation
   - Error logging
   - Audit trails
   - Performance monitoring

5. **Security**
   - Access control
   - Data encryption
   - Secure tracking
   - Fraud prevention
   - Compliance checks

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // NDR Errors
    NDR_NOT_FOUND: {
        code: "NDR_NOT_FOUND",
        message: "NDR not found",
        status: 404
    },
    INVALID_STATUS: {
        code: "INVALID_STATUS",
        message: "Invalid NDR status",
        status: 400
    },
    UPDATE_FAILED: {
        code: "UPDATE_FAILED",
        message: "Failed to update NDR",
        status: 500
    },

    // RTO Errors
    RTO_INITIATION_FAILED: {
        code: "RTO_INITIATION_FAILED",
        message: "Failed to initiate RTO",
        status: 500
    },
    INVALID_RTO_REASON: {
        code: "INVALID_RTO_REASON",
        message: "Invalid RTO reason",
        status: 400
    },

    // System Errors
    SERVER_ERROR: {
        code: "SERVER_ERROR",
        message: "Server error occurred",
        status: 500
    }
}
```

## Billing Management

### Overview
The Billing Management system allows administrators to handle all financial operations, including invoice management, payment processing, rate card management, shipping charge tracking, wallet history, and financial reporting. The system is organized into several key components accessible through a tabbed interface.

### Dashboard Structure

#### Main Components
1. **Wallet History**
2. **Invoices**
3. **Remittance**
4. **Shipping Charges**
5. **Rate Card**

---

### 1. Wallet History

#### Wallet Transaction Interface
```typescript
interface WalletTransaction {
    id: string;
    date: string; // YYYY-MM-DD
    referenceNumber: string;
    orderId?: string;
    type: "Recharge" | "Debit" | "COD Credit" | "Refund";
    amount: string; // e.g., "₹5000"
    codCharge: string; // e.g., "₹50"
    igst: string; // e.g., "₹45"
    subTotal: string; // e.g., "₹945"
    closingBalance: string; // e.g., "₹4055"
    remark: string;
}
```

#### Endpoints
- **List Wallet Transactions**
```typescript
GET /api/v2/admin/billing/wallet-history
Query Parameters:
  page?: number
  limit?: number
  from?: string (YYYY-MM-DD)
  to?: string (YYYY-MM-DD)
  type?: string ("Recharge" | "Debit" | "COD Credit" | "Refund")
  orderId?: string
  referenceNumber?: string
  remark?: string
Response:
{
  data: WalletTransaction[];
  pagination: { total: number; page: number; limit: number; pages: number; }
}
```
- **Export Wallet Transactions**
```typescript
GET /api/v2/admin/billing/wallet-history/export
Query Parameters: (same as above + format: "csv" | "xlsx")
Response: Blob (file download)
```
- **Get Wallet Transaction Details**
```typescript
GET /api/v2/admin/billing/wallet-history/:transactionId
Response: { data: WalletTransaction }
```

---

### 2. Invoices

#### Invoice Interface
```typescript
interface Invoice {
    id: string;
    invoiceNumber: string;
    date: string; // YYYY-MM-DD
    sellerId: string;
    sellerName: string;
    amount: string;
    status: "paid" | "due" | "cancelled";
    dueDate: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: string;
        total: string;
    }>;
    tax: string;
    total: string;
    paymentReference?: string;
    remarks?: string;
}
```

#### Endpoints
- **List Invoices**
```typescript
GET /api/v2/admin/billing/invoices
Query Parameters:
  page?: number
  limit?: number
  sellerId?: string
  status?: "paid" | "due" | "cancelled"
  from?: string (YYYY-MM-DD)
  to?: string (YYYY-MM-DD)
Response:
{
  data: Invoice[];
  pagination: { total: number; page: number; limit: number; pages: number; }
}
```
- **Export Invoices**
```typescript
GET /api/v2/admin/billing/invoices/export
Query Parameters: (same as above + format: "csv" | "xlsx")
Response: Blob (file download)
```
- **Get Invoice Details**
```typescript
GET /api/v2/admin/billing/invoices/:invoiceId
Response: { data: Invoice }
```

---

### 3. Remittance

#### Remittance Transaction Interface
```typescript
interface RemittanceTransaction {
    id: string;
    transactionId: string;
    transactionType: "invoice" | "debit_note" | "credit_note";
    date: string;
    sellerId: string;
    sellerName: string;
    amount: string;
    paymentType: "credit" | "wallet";
    status: "paid" | "due";
    reference: string;
    description: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolder?: string;
    transactionFee?: string;
    netAmount?: string;
    processingTime?: string;
    batchNumber?: string;
    walletBalanceAfter?: string;
    approvalBy?: string;
}
```

#### Endpoints
- **List Remittance Transactions**
```typescript
GET /api/v2/admin/billing/remittance
Query Parameters:
  page?: number
  limit?: number
  sellerId?: string
  status?: "paid" | "due"
  from?: string (YYYY-MM-DD)
  to?: string (YYYY-MM-DD)
  transactionType?: "invoice" | "debit_note" | "credit_note"
Response:
{
  data: RemittanceTransaction[];
  pagination: { total: number; page: number; limit: number; pages: number; }
}
```
- **Export Remittance Transactions**
```typescript
GET /api/v2/admin/billing/remittance/export
Query Parameters: (same as above + format: "csv" | "xlsx")
Response: Blob (file download)
```
- **Get Remittance Transaction Details**
```typescript
GET /api/v2/admin/billing/remittance/:transactionId
Response: { data: RemittanceTransaction }
```

---

### 4. Shipping Charges

#### Shipping Charge Interface
```typescript
interface ShippingCharge {
    id: string;
    sellerId: string;
    sellerName: string;
    courierName: string;
    courierMode: string;
    airwaybillNumber: string;
    orderNumber: string;
    date: string;
    time: string;
    shipmentType: string;
    productType: string;
    originPincode: string;
    destinationPincode: string;
    originCity: string;
    destinationCity: string;
    bookedWeight: string;
    volWeight: string;
    chargeableAmount: string;
    declaredValue: string;
    collectableValue: string;
    freightCharge: string;
    codCharge: string;
    amountBeforeDiscount: string;
    discount: string;
    amountAfterDiscount: string;
    status: "delivered" | "in_transit" | "out_for_delivery" | "pickup_pending" | "rto" | "cancelled";
    billableLane: string;
    customerGstState: string;
    customerGstin: string;
}
```

#### Endpoints
- **List Shipping Charges**
```typescript
GET /api/v2/admin/billing/shipping-charges
Query Parameters:
  page?: number
  limit?: number
  sellerId?: string
  courierName?: string
  status?: string
  from?: string (YYYY-MM-DD)
  to?: string (YYYY-MM-DD)
  orderNumber?: string
  airwaybillNumber?: string
Response:
{
  data: ShippingCharge[];
  pagination: { total: number; page: number; limit: number; pages: number; }
}
```
- **Export Shipping Charges**
```typescript
GET /api/v2/admin/billing/shipping-charges/export
Query Parameters: (same as above + format: "csv" | "xlsx")
Response: Blob (file download)
```
- **Get Shipping Charge Details**
```typescript
GET /api/v2/admin/billing/shipping-charges/:id
Response: { data: ShippingCharge }
```

---

### 5. Rate Card

#### Rate Card Interface
```typescript
interface RateCard {
    rateBand: string;
    lastUpdated: string;
    couriers: Array<{
        name: string;
        rates: {
            withinCity: number;
            withinState: number;
            metroToMetro: number;
            restOfIndia: number;
            northEastJK: number;
        };
        codCharge: number;
        codPercent: number;
    }>;
}
```

#### Endpoints
- **List Rate Cards**
```typescript
GET /api/v2/admin/billing/rate-cards
Query Parameters:
  page?: number
  limit?: number
  rateBand?: string
  courierName?: string
Response:
{
  data: RateCard[];
  pagination: { total: number; page: number; limit: number; pages: number; }
}
```
- **Get Rate Card Details**
```typescript
GET /api/v2/admin/billing/rate-cards/:rateCardId
Response: { data: RateCard }
```
- **Update Rate Card**
```typescript
PUT /api/v2/admin/billing/rate-cards/:rateCardId
Request Body:
{
  rateBand: string;
  couriers: Array<{
    name: string;
    rates: {
      withinCity: number;
      withinState: number;
      metroToMetro: number;
      restOfIndia: number;
      northEastJK: number;
    };
    codCharge: number;
    codPercent: number;
  }>;
}
Response: { data: RateCard; message: string; }
```

---

### Best Practices
- Validate all billing data before processing.
- Ensure all exports are secure and authorized.
- Regularly review rate cards and remittance records for accuracy.
- Maintain audit logs for all billing operations.
- Use pagination and filtering for large data sets.

## Reports & Analytics

### Overview
The Reports & Analytics system provides comprehensive insights into platform performance, revenue, shipments, and delivery metrics. The system is organized into three main tabs: Overview, Reports, and Analytics.

### Dashboard Structure

#### Main Components
1. **Overview Tab**
   - Total Revenue tracking
   - Total Shipments tracking
   - Delivery Status progress
   - Courier Distribution visualization

2. **Reports Tab**
   - Detailed reports table
   - Date range filtering
   - Export functionality
   - Performance metrics

3. **Analytics Tab**
   - Revenue trends
   - Delivery partner share
   - Critical insights
   - Time-based filtering

### Reports Interface

```typescript
interface ReportStats {
    totalRevenue: number;
    totalShipments: number;
    monthlyGrowth: {
        revenue: number;
        shipments: number;
    };
}

interface ReportChartData {
    date: string;
    value: number;
}

interface DeliveryPartnerShare {
    name: string;
    value: number;
    fill: string;
}

interface ReportFilters {
    dateRange?: DateRange;
    timeFilter?: "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
}
```

### Endpoints

#### Get Report Statistics
```typescript
GET /api/v2/admin/reports/stats

Response:
{
    data: ReportStats
}
```

#### Get Revenue Data
```typescript
GET /api/v2/admin/reports/revenue

Query Parameters:
  timeFilter?: "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL"
  from?: string (ISO date)
  to?: string (ISO date)

Response:
{
    data: ReportChartData[]
}
```

#### Get Delivery Partner Distribution
```typescript
GET /api/v2/admin/reports/delivery-partners

Response:
{
    data: DeliveryPartnerShare[]
}
```

#### Export Reports
```typescript
GET /api/v2/admin/reports/export

Query Parameters:
  format: "csv" | "pdf"
  type: "revenue" | "shipments" | "delivery-partners"
  from?: string (ISO date)
  to?: string (ISO date)

Response:
{
    data: {
        downloadUrl: string;
        expiresAt: string;
    }
}
```

### Features

#### 1. Overview Tab
- **Total Revenue Card**
  - Current month's revenue
  - Month-over-month growth
  - Currency formatting
  - Loading states

- **Total Shipments Card**
  - Current month's shipments
  - Month-over-month growth
  - Loading states

- **Delivery Status Card**
  - Progress bars for:
    - Delivered shipments
    - In Transit shipments
    - Pending shipments
  - Percentage indicators
  - Loading states

- **Courier Distribution Card**
  - Pie chart visualization
  - Partner-wise distribution
  - Percentage labels
  - Loading states

#### 2. Reports Tab
- **Reports Table**
  - Pagination support
  - Date range filtering
  - Export functionality
  - Loading states
  - Error handling

#### 3. Analytics Tab
- **Revenue Trends Chart**
  - Area chart visualization
  - Time-based filtering
  - Date range selection
  - Loading states

- **Delivery Partner Share**
  - Pie chart visualization
  - Partner-wise distribution
  - Interactive tooltips
  - Loading states

- **Critical Insights**
  - Performance highlights
  - Key metrics
  - Trend analysis

### Best Practices

1. **Data Refresh**
   - Implement automatic refresh every 5 minutes
   - Allow manual refresh option
   - Cache data for better performance

2. **Data Visualization**
   - Use appropriate chart types for different metrics
   - Implement responsive design
   - Support dark/light mode

3. **Performance**
   - Implement pagination for large datasets
   - Use lazy loading for charts
   - Optimize API calls

4. **Security**
   - Implement role-based access control
   - Log all dashboard access
   - Encrypt sensitive data

5. **Error Handling**
   - Implement proper error logging
   - Use consistent error response format
   - Include detailed error messages
   - Handle validation errors gracefully
   - Implement proper error recovery
   - Monitor error patterns

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // Data Errors
    DATA_NOT_FOUND: {
        code: "DATA_NOT_FOUND",
        message: "Requested data not found",
        status: 404
    },
    EXPORT_FAILED: {
        code: "EXPORT_FAILED",
        message: "Failed to export report",
        status: 500
    },

    // System Errors
    SERVER_ERROR: {
        code: "SERVER_ERROR",
        message: "Server error occurred",
        status: 500
    }
}
```

## Escalation Management

### Overview
The Escalation Management system allows administrators to handle and track various types of escalations across the platform. The system is organized into seven main sections: Search, Statistics, Pickups, Shipments, Billing & Remittance, Weight Issues, and Tech Issues.

### Escalation Structure

#### Main Components
1. **Search Escalation**
   - Search functionality for escalation tickets
   - Filter by various parameters
   - View escalation details

2. **Statistics**
   - Escalation metrics and analytics
   - Performance tracking
   - Trend analysis

3. **Pickups**
   - Pickup-related escalations
   - Location tracking
   - Status management

4. **Shipments**
   - Shipment-related escalations
   - Order tracking
   - Delivery issues

5. **Billing & Remittance**
   - Payment-related escalations
   - Remittance tracking
   - Financial disputes

6. **Weight Issues**
   - Weight discrepancy escalations
   - Package weight verification
   - Resolution tracking

7. **Tech Issues**
   - Technical support escalations
   - System-related issues
   - Platform maintenance

### Interfaces

#### Pickup Escalation Interface
```typescript
interface Pickup {
    id: string;
    pickupId: string;
    description: string;
    status: string;
    location: string;
}
```

#### Shipment Escalation Interface
```typescript
interface ShipmentData {
    id: string;
    orderId: string;
    orderDate: string;
    bookedDate: string;
    pickupId: string;
    customer: string;
    product: string;
    amount: string;
    paymentType: 'COD' | 'Prepaid';
    weight: string;
    channel: string;
    awb: string;
    courier: string;
}
```

#### Billing Escalation Interface
```typescript
interface BillingData {
    id: string;
    remittanceId: string;
    status: "Pending" | "Completed" | "Failed" | "Overdue";
    paymentDate: string;
    remittanceAmount: string;
    freightDeduction: string;
    convenienceFee: string;
    total: string;
    paymentRef: string;
}
```

#### Weight Issue Interface
```typescript
interface WeightIssue {
    id: string;
    issueId: string;
    description: string;
    status: string;
}
```

#### Tech Issue Interface
```typescript
interface TechIssue {
    id: string;
    escId: string;
    escTime: string;
    escCloseDate: string;
    seller: {
        id: string;
        name: string;
    };
    time: string;
    status: "re-opened" | "assigned" | "pending" | "closed" | "canceled";
}
```

### Features

#### 1. Search Escalation
- Advanced search functionality
- Filter by multiple parameters
- View detailed escalation information
- Export search results

#### 2. Statistics
- Track escalation metrics
- View performance analytics
- Monitor resolution times
- Generate reports

#### 3. Pickups
- Manage pickup escalations
- Track pickup locations
- Update pickup status
- Handle pickup issues

#### 4. Shipments
- Monitor shipment escalations
- Track order status
- Handle delivery issues
- Manage courier problems

#### 5. Billing & Remittance
- Track payment escalations
- Monitor remittance status
- Handle financial disputes
- Process refund requests

#### 6. Weight Issues
- Track weight discrepancies
- Verify package weights
- Handle weight disputes
- Update weight records

#### 7. Tech Issues
- Manage technical escalations
- Track system issues
- Handle platform maintenance
- Monitor resolution status

### Status Management

#### Available Statuses
1. **Pending**
   - Initial escalation state
   - Awaiting review
   - Needs attention

2. **In Progress**
   - Active resolution
   - Being handled
   - Updates ongoing

3. **Resolved**
   - Issue resolved
   - Awaiting confirmation
   - Ready for closure

4. **Closed**
   - Escalation completed
   - No further action
   - Case archived

5. **Re-opened**
   - Issue reoccurred
   - Needs attention
   - Requires review

### Best Practices

1. **Escalation Processing**
   - Quick initial response
   - Proper categorization
   - Priority assessment
   - Regular updates
   - Clear communication

2. **Status Management**
   - Regular status updates
   - Clear status transitions
   - Proper documentation
   - Resolution tracking

3. **Communication**
   - Timely notifications
   - Clear explanations
   - Regular updates
   - Follow-up actions

4. **Data Management**
   - Regular backups
   - Data validation
   - Error logging
   - Audit trails

5. **Security**
   - Access control
   - Data encryption
   - Secure tracking
   - Compliance checks

### Error Handling

#### Common Error Responses
```typescript
{
    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation error occurred",
        status: 400,
        details: {
            field: string;
            message: string;
        }[]
    },

    // Escalation Errors
    ESCALATION_NOT_FOUND: {
        code: "ESCALATION_NOT_FOUND",
        message: "Escalation not found",
        status: 404
    },
    INVALID_STATUS: {
        code: "INVALID_STATUS",
        message: "Invalid escalation status",
        status: 400
    },
    UPDATE_FAILED: {
        code: "UPDATE_FAILED",
        message: "Failed to update escalation",
        status: 500
    },

    // System Errors
    SERVER_ERROR: {
        code: "SERVER_ERROR",
        message: "Server error occurred",
        status: 500
    }
}
```

// ... existing code ... 