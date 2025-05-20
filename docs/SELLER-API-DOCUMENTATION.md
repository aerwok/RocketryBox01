# RocketryBox Seller API Documentation

## Base URL
```
https://api.rocketrybox.com/api/v1/seller
```

## Authentication
All seller endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Register
```typescript
POST /auth/register

Request Body:
{
    name: string;
    email: string;
    phone: string;
    password: string;
    businessName: string;
    gstin?: string;
}

Response:
{
    success: boolean;
    data?: {
        id: string;
        name: string;
        email: string;
        businessName: string;
        token: string;
        refreshToken: string;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

#### Login
```typescript
POST /auth/login

Request Body:
{
    email: string;
    password: string;
}

Response:
{
    success: boolean;
    data?: {
        id: string;
        name: string;
        email: string;
        businessName: string;
        token: string;
        refreshToken: string;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

#### Send OTP
```typescript
POST /auth/otp/send

Request Body:
{
    email: string;
}

Response:
{
    success: boolean;
    data?: {
        message: string;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

#### Verify OTP
```typescript
POST /auth/otp/verify

Request Body:
{
    email: string;
    otp: string;
}

Response:
{
    success: boolean;
    data?: {
        message: string;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

#### Reset Password
```typescript
POST /auth/reset-password

Request Body:
{
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}

Response:
{
    success: boolean;
    data?: {
        message: string;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

#### Refresh Token
```typescript
POST /auth/refresh-token

Request Body:
{
    refreshToken: string;
}

Response:
{
    success: boolean;
    data?: {
        token: string;
        refreshToken: string;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

## Order Management

### Create Order
```http
POST /orders
```

Request Body:
```json
{
  "customer": {
    "name": "string",
    "phone": "string",
    "email": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "country": "string"
    }
  },
  "items": [
    {
      "productId": "string",
      "name": "string",
      "quantity": "number",
      "price": "number",
      "metadata": {}
    }
  ],
  "payment": {
    "method": "string",
    "amount": "number",
    "status": "string"
  },
  "shipping": {
    "method": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "country": "string"
    }
  },
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "orderNumber": "string",
    "status": "string",
    "customer": {
      "name": "string",
      "phone": "string",
      "email": "string",
      "address": {
        "line1": "string",
        "line2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string"
      }
    },
    "items": [
      {
        "productId": "string",
        "name": "string",
        "quantity": "number",
        "price": "number",
        "metadata": {}
      }
    ],
    "payment": {
      "method": "string",
      "amount": "number",
      "status": "string"
    },
    "shipping": {
      "method": "string",
      "address": {
        "line1": "string",
        "line2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string"
      }
    },
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

### List Orders
```http
GET /orders
```

Query Parameters:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `status` (optional): Filter by status
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `search` (optional): Search by order number or customer details

Response:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "string",
        "orderNumber": "string",
        "status": "string",
        "customer": {
          "name": "string",
          "phone": "string",
          "email": "string"
        },
        "items": [
          {
            "name": "string",
            "quantity": "number",
            "price": "number"
          }
        ],
        "payment": {
          "method": "string",
          "amount": "number",
          "status": "string"
        },
        "shipping": {
          "method": "string",
          "address": {
            "city": "string",
            "state": "string",
            "pincode": "string"
          }
        },
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  },
  "error": null
}
```

### Get Order Details
```http
GET /orders/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "orderNumber": "string",
    "status": "string",
    "customer": {
      "name": "string",
      "phone": "string",
      "email": "string",
      "address": {
        "line1": "string",
        "line2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string"
      }
    },
    "items": [
      {
        "productId": "string",
        "name": "string",
        "quantity": "number",
        "price": "number",
        "metadata": {}
      }
    ],
    "payment": {
      "method": "string",
      "amount": "number",
      "status": "string"
    },
    "shipping": {
      "method": "string",
      "address": {
        "line1": "string",
        "line2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string"
      }
    },
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

### Update Order Status
```http
PATCH /orders/:id/status
```

Request Body:
```json
{
  "status": "string",
  "reason": "string",
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

### Cancel Order
```http
POST /orders/:id/cancel
```

Request Body:
```json
{
  "reason": "string",
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

### Get Order Stats
```http
GET /orders/stats
```

Query Parameters:
- `startDate` (optional): Start date for stats
- `endDate` (optional): End date for stats

Response:
```json
{
  "success": true,
  "data": {
    "total": "number",
    "status": {
      "pending": "number",
      "processing": "number",
      "shipped": "number",
      "delivered": "number",
      "cancelled": "number"
    },
    "revenue": {
      "total": "number",
      "byStatus": {
        "pending": "number",
        "processing": "number",
        "shipped": "number",
        "delivered": "number",
        "cancelled": "number"
      }
    },
    "metadata": {}
  },
  "error": null
}
```

### Export Orders
```http
POST /orders/export
```

Request Body:
```json
{
  "startDate": "string",
  "endDate": "string",
  "status": "string",
  "format": "string"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "url": "string",
    "expiresAt": "string"
  },
  "error": null
}
```

### Import Orders
```http
POST /orders/import
```

Request Body:
- `file` (required): Excel/CSV file containing order data

Response:
```json
{
  "success": true,
  "data": {
    "imported": "number",
    "failed": [
      {
        "row": "number",
        "error": "string"
      }
    ]
  },
    "results": [
      {
        "pincode": "string",
        "serviceable": boolean,
        "courier": "string",
        "estimatedDelivery": "string",
        "restrictions": ["string"],
        "metadata": {}
      }
    ]
  },
  "error": null
}
```

#### Get Service Restrictions
```http
GET /restrictions
```

Query Parameters:
- `courier` (required): Courier name
- `pincode` (required): Pincode to check
- `weight` (optional): Weight in grams
- `cod` (optional): Whether COD is required

Response:
```json
{
  "success": true,
  "data": {
    "restrictions": ["string"],
    "metadata": {}
  },
  "error": null
}
```

## Store Management

### List Stores
```http
GET /stores
```

Query Parameters:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `search` (optional): Search by name or address
- `status` (optional): Filter by status

Response:
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "id": "string",
        "name": "string",
        "type": "string",
        "status": "string",
        "address": {
          "line1": "string",
          "line2": "string",
          "city": "string",
          "state": "string",
          "pincode": "string",
          "country": "string"
        },
        "contact": {
          "name": "string",
          "phone": "string",
          "email": "string"
        },
        "metadata": {},
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  },
  "error": null
}
```

#### Add Store
```http
POST /stores
```

Request Body:
```json
{
  "name": "string",
  "type": "string",
  "address": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "string"
  },
  "contact": {
    "name": "string",
    "phone": "string",
    "email": "string"
  },
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "type": "string",
    "status": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "country": "string"
    },
    "contact": {
      "name": "string",
      "phone": "string",
      "email": "string"
    },
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Get Store Details
```http
GET /stores/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "type": "string",
    "status": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "country": "string"
    },
    "contact": {
      "name": "string",
      "phone": "string",
      "email": "string"
    },
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Update Store
```http
PUT /stores/:id
```

Request Body:
```json
{
  "name": "string",
  "type": "string",
  "address": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "string"
  },
  "contact": {
    "name": "string",
    "phone": "string",
    "email": "string"
  },
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "type": "string",
    "status": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "country": "string"
    },
    "contact": {
      "name": "string",
      "phone": "string",
      "email": "string"
    },
    "metadata": {},
    "updatedAt": "string"
  },
  "error": null
}
```

#### Delete Store
```http
DELETE /stores/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "message": "Store deleted successfully"
  },
  "error": null
}
```

## Wallet Management

### Get Wallet Balance
```typescript
GET /wallet

Response:
{
    success: boolean;
    data?: {
        wallet: {
            balance: number;
            currency: string;
            lastUpdated: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Get Wallet Transactions
```typescript
GET /

Query Parameters:
{
    page: number;        // Required, starts from 1
    limit: number;       // Required, max 50
    startDate?: string;  // Optional, ISO date
    endDate?: string;    // Optional, ISO date
    type?: string;       // Optional, filter by transaction type
}

Response:
{
    success: boolean;
    data?: {
        transactions: Array<{
            id: string;
            type: string;
            amount: number;
            balance: number;
            description: string;
            reference?: string;
            createdAt: string;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Get Wallet Transaction Details
```typescript
GET /:id

Response:
{
    success: boolean;
    data?: {
        transaction: {
            id: string;
            type: string;
            amount: number;
            balance: number;
            description: string;
            reference?: string;
            metadata?: {
                orderId?: string;
                awb?: string;
                invoiceId?: string;
                paymentId?: string;
            };
            createdAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Export Wallet Transactions
```typescript
GET /export

Query Parameters:
{
    startDate?: string;  // Optional, ISO date
    endDate?: string;    // Optional, ISO date
    type?: string;       // Optional, filter by transaction type
    format: "csv" | "excel" | "pdf";
}

Response:
{
    success: boolean;
    data?: {
        downloadUrl: string;
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Initiate Wallet Recharge
```typescript
POST /recharge/initiate

Request Body:
{
    amount: number;
    currency: string;
}

Response:
{
    success: boolean;
    data?: {
        payment: {
            id: string;
            amount: string;
            currency: string;
            paymentUrl: string;
            expiresAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Verify Wallet Recharge
```typescript
POST /recharge/verify

Request Body:
{
    paymentId: string;
    transactionId: string;
    status: string;
}

Response:
{
    success: boolean;
    data?: {
        payment: {
            id: string;
            status: string;
            amount: string;
            paidAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Credit COD to Wallet
```typescript
POST /cod-credit

Request Body:
{
    remittanceId: string;
    amount: number;
    orders: Array<{
        orderId: string;
        awb: string;
        amount: number;
    }>;
}

Response:
{
    success: boolean;
    data?: {
        transaction: {
            id: string;
            type: string;
            amount: number;
            balance: number;
            description: string;
            reference: string;
            createdAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Credit to Wallet
```typescript
POST /credit

Request Body:
{
    amount: number;
    description: string;
    reference?: string;
    metadata?: {
        orderId?: string;
        awb?: string;
        invoiceId?: string;
        paymentId?: string;
    };
}

Response:
{
    success: boolean;
    data?: {
        transaction: {
            id: string;
            type: string;
            amount: number;
            balance: number;
            description: string;
            reference?: string;
            createdAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

## Warehouse Management

#### List Warehouse Items
```http
GET /warehouse/items
```

Query Parameters:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `search` (optional): Search by name or SKU
- `category` (optional): Filter by category
- `status` (optional): Filter by status

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "sku": "string",
        "category": "string",
        "stock": {
          "available": "number",
          "reserved": "number",
          "total": "number"
        },
        "status": "string",
        "metadata": {},
        "lastUpdated": "string",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  },
  "error": null
}
```

#### Add Stock to Item
```http
POST /warehouse/items/:itemId/stock
```

Request Body:
```json
{
  "quantity": "number",
  "type": "string",
  "reason": "string",
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "sku": "string",
    "category": "string",
    "stock": {
      "available": "number",
      "reserved": "number",
      "total": "number"
    },
    "transaction": {
      "id": "string",
      "type": "string",
      "quantity": "number",
      "reason": "string",
      "timestamp": "string",
      "metadata": {}
    },
    "status": "string",
    "metadata": {},
    "lastUpdated": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

## API Settings

### Get API Settings
```typescript
GET /

Response:
{
    success: boolean;
    data?: {
        settings: {
            id: string;
            enabled: boolean;
            credentials: {
                apiKey: string;
                apiSecret: string;
                lastGenerated: string;
            };
            permissions: {
                orders: boolean;
                shipments: boolean;
                products: boolean;
                inventory: boolean;
                reports: boolean;
            };
            rateLimits: {
                requestsPerMinute: number;
                requestsPerHour: number;
            };
            webhooks?: Array<{
                url: string;
                events: string[];
                status: string;
                lastTriggered?: string;
            }>;
            updatedAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Generate New API Credentials
```typescript
POST /generate

Response:
{
    success: boolean;
    data?: {
        credentials: {
            apiKey: string;
            apiSecret: string;
            generatedAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### Update API Status
```typescript
PATCH /status

Request Body:
{
    enabled: boolean;
}

Response:
{
    success: boolean;
    data?: {
        settings: {
            id: string;
            enabled: boolean;
            updatedAt: string;
        };
    };
    error?: {
        code: string;
        message: string;
    }
}
```

### COD Remittance Management

#### List COD Remittances
```http
GET /seller/cod-remittances
```

Query Parameters:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `status` (optional): Filter by status
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering

Response:
```json
{
  "success": true,
  "data": {
    "remittances": [
      {
        "id": "string",
        "amount": "number",
        "status": "string",
        "period": {
          "start": "string",
          "end": "string"
        },
        "orders": {
          "total": "number",
          "count": "number"
        },
        "metadata": {},
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  },
  "error": null
}
```

#### Get COD Remittance Details
```http
GET /seller/cod-remittances/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "amount": "number",
    "status": "string",
    "period": {
      "start": "string",
      "end": "string"
    },
    "orders": [
      {
        "id": "string",
        "orderNumber": "string",
        "amount": "number",
        "status": "string",
        "createdAt": "string"
      }
    ],
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Create COD Remittance (Admin Only)
```http
POST /admin/cod-remittances
```

Request Body:
```json
{
  "period": {
    "start": "string",
    "end": "string"
  },
  "amount": "number",
  "orders": ["string"],
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "amount": "number",
    "status": "string",
    "period": {
      "start": "string",
      "end": "string"
    },
    "orders": {
      "total": "number",
      "count": "number"
    },
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Update COD Remittance (Admin Only)
```http
PATCH /admin/cod-remittances/:id
```

Request Body:
```json
{
  "status": "string",
  "amount": "number",
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "amount": "number",
    "status": "string",
    "period": {
      "start": "string",
      "end": "string"
    },
    "orders": {
      "total": "number",
      "count": "number"
    },
    "metadata": {},
    "updatedAt": "string"
  },
  "error": null
}
```

### NDR Management

#### List NDRs
```http
GET /ndrs
```

Query Parameters:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `status` (optional): Filter by status
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `search` (optional): Search by AWB or order ID

Response:
```json
{
  "success": true,
  "data": {
    "ndrs": [
      {
        "id": "string",
        "awb": "string",
        "orderId": "string",
        "courier": "string",
        "reason": "string",
        "status": "string",
        "customer": {
          "name": "string",
          "phone": "string",
          "email": "string"
        },
        "attempts": "number",
        "lastAttempt": "string",
        "metadata": {},
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  },
  "error": null
}
```

#### Get NDR Details
```http
GET /ndrs/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "awb": "string",
    "orderId": "string",
    "courier": "string",
    "reason": "string",
    "status": "string",
    "customer": {
      "name": "string",
      "phone": "string",
      "email": "string",
      "address": {
        "line1": "string",
        "line2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string"
      }
    },
    "attempts": [
      {
        "number": "number",
        "status": "string",
        "reason": "string",
        "timestamp": "string",
        "metadata": {}
      }
    ],
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Update NDR Status
```http
PUT /ndrs/:id/status
```

Request Body:
```json
{
  "status": "string",
  "reason": "string",
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Create NDR
```http
POST /ndrs
```

Request Body:
```json
{
  "awb": "string",
  "orderId": "string",
  "courier": "string",
  "reason": "string",
  "customer": {
    "name": "string",
    "phone": "string",
    "email": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "pincode": "string",
      "country": "string"
    }
  },
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "awb": "string",
    "orderId": "string",
    "courier": "string",
    "reason": "string",
    "status": "string",
    "customer": {
      "name": "string",
      "phone": "string",
      "email": "string",
      "address": {
        "line1": "string",
        "line2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string"
      }
    },
    "attempts": [],
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

### Team User Management

#### List Team Users
```http
GET /team-users
```

Query Parameters:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `search` (optional): Search by name or email
- `role` (optional): Filter by role
- `status` (optional): Filter by status

Response:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "string",
        "status": "string",
        "permissions": ["string"],
        "lastLogin": "string",
        "metadata": {},
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  },
  "error": null
}
```

#### Add Team User
```http
POST /team-users
```

Request Body:
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "permissions": ["string"],
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string",
    "permissions": ["string"],
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Get Team User Details
```http
GET /team-users/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string",
    "permissions": ["string"],
    "lastLogin": "string",
    "metadata": {},
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null
}
```

#### Update Team User
```http
PUT /team-users/:id
```

Request Body:
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "status": "string",
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "status": "string",
    "permissions": ["string"],
    "metadata": {},
    "updatedAt": "string"
  },
  "error": null
}
```

#### Delete Team User
```http
DELETE /team-users/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "message": "Team user deleted successfully"
  },
  "error": null
}
```

#### Update Team User Permissions
```http
PATCH /team-users/:id/permissions
```

Request Body:
```json
{
  "permissions": ["string"],
  "metadata": {}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "permissions": ["string"],
    "updatedAt": "string"
  },
  "error": null
}
```