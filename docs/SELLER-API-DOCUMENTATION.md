# Rocketry Box Seller API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Dashboard](#dashboard)
5. [Orders](#orders)
6. [Bulk Orders](#bulk-orders)
7. [Shipments](#shipments)
8. [NDR Management](#ndr-management)
9. [Weight Disputes](#weight-disputes)
10. [COD Management](#cod-management)
11. [Warehouse Management](#warehouse-management)
12. [Rate Calculator](#rate-calculator)
13. [Service Check](#service-check)
14. [Billing](#billing)
15. [Reports](#reports)
16. [Support](#support)
17. [Tools](#tools)
18. [Settings](#settings)
19. [Profile Management](#profile-management)
20. [Error Handling](#error-handling)
21. [Team Management](#team-management)
22. [Products Management](#products-management)
23. [Manifest Management](#manifest-management)
24. [Received Orders](#received-orders)

## Overview

The Rocketry Box Seller API provides endpoints for managing seller operations, including order management, shipping, and analytics. This API follows RESTful principles and uses JSON for request/response payloads.

### Base URL
```
Production: https://api.rocketrybox.com/v1/seller
Staging: https://staging-api.rocketrybox.com/v1/seller
```

### Authentication
All API requests must include an `Authorization` header with a valid JWT token:
```
Authorization: Bearer <access_token>
```

### Response Format
All responses follow this structure:
```typescript
{
    success: boolean,
    data?: T,
    error?: {
        code: string,
        message: string,
        details?: any
    }
}
```

## Authentication

### Login
```typescript
POST /api/v1/seller/auth/login
Content-Type: application/json

Request Body:
{
    emailOrPhone: string,  // Can be either email or phone number
    password: string,      // Required for normal login
    otp?: string,         // Required for password reset
    newPassword?: string, // Required for password reset
    confirmPassword?: string, // Required for password reset
    rememberMe: boolean   // For extended token validity
}

Response:
{
    success: boolean,
    data?: {
        accessToken: string,    // JWT token
        refreshToken: string,   // For token refresh
        expiresIn: number,      // Token validity in seconds
        seller: {
            id: string,
            name: string,
            email: string,
            phone: string,
            businessName: string,
            status: 'pending' | 'active' | 'suspended'
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Send OTP
```typescript
POST /api/v1/seller/auth/otp/send
Content-Type: application/json

Request Body:
{
    emailOrPhone: string,  // Can be either email or phone number
    purpose: 'login' | 'reset' | 'verify'
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        otp: string,      // Only in development environment
        expiresIn: number // OTP validity in seconds
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Dashboard

### Get Dashboard Summary
```typescript
GET /api/v1/seller/dashboard/summary

Response:
{
    success: boolean,
    data?: {
        stats: {
            orders: {
                total: number,
                todayCount: number
            },
            shipments: {
                total: number,
                todayCount: number
            },
            delivery: {
                total: number,
                todayCount: number
            },
            cod: {
                expected: number,
                totalDue: number
            },
            revenue: {
                total: number,
                dailyGrowth: number
            },
            ndr: {
                pending: number
            }
        },
        chartData: {
            orderStatusDistribution: {
                delivered: number,
                inTransit: number,
                pending: number
            },
            revenueTrend: Array<{
                date: string,
                value: number
            }>,
            monthlyComparison: Array<{
                month: string,
                current: number,
                previous: number
            }>
        },
        topProducts: Array<{
            id: string,
            name: string,
            quantity: number,
            revenue: number
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Orders

### List Orders
```typescript
GET /api/v1/seller/orders

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    status?: string,     // Optional, filter by status
    startDate?: string,  // Optional, ISO date
    endDate?: string,    // Optional, ISO date
    search?: string      // Optional, search in order number, customer name, etc.
}

Response:
{
    success: boolean,
    data?: {
        orders: Array<{
            orderId: string,
            orderDate: string,
            customer: {
                name: string,
                phone: string,
                email: string,
                address: {
                    street: string,
                    city: string,
                    state: string,
                    pincode: string,
                    country: string
                }
            },
            product: {
                name: string,
                sku: string,
                quantity: number,
                price: number,
                weight: string,
                dimensions: {
                    length: number,
                    width: number,
                    height: number
                }
            },
            payment: {
                method: "COD" | "Prepaid",
                amount: string,
                codCharge: string,
                shippingCharge: string,
                gst: string,
                total: string
            },
            status: string,
            awb: string,
            courier: string,
            tracking: string,
            channel: 'MANUAL' | 'EXCEL' | 'SHOPIFY' | 'WOOCOMMERCE' | 'AMAZON' | 'FLIPKART' | 'OPENCART' | 'API'
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string,
        details?: {
            field?: string,
            reason?: string
        }
    }
}
```

### Bulk Ship Orders
```typescript
POST /api/v1/seller/orders/bulk-ship
Content-Type: application/json

Request Body:
{
    orderIds: string[],  // Required, array of order IDs to ship
    shippingDetails: {
        courier: string,  // Required, selected courier
        mode: string,     // Required, shipping mode
        charges: {
            shippingCharge: number,
            codCharge: number,
            gst: number,
            total: number
        }
    }
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        shippedOrders: number,
        failedOrders: Array<{
            orderId: string,
            reason: string
        }>
    },
    error?: {
        code: string,
        message: string,
        details?: {
            field?: string,
            reason?: string
        }
    }
}
```

### Order Shipping Workflow

1. Order Creation:
   - Manual Orders: Created individually through the new order form
   - Bulk Orders: Uploaded via Excel template
   - Channel Orders: Imported from connected platforms (Shopify, Amazon, etc.)

2. Order List Features:
   - Filter orders by status, date range, and search terms
   - Select multiple orders for bulk shipping
   - View order details including customer info, products, and payment details
   - Track order status and AWB numbers
   - Cancel orders if needed

3. Shipping Process:
   - Select orders to ship
   - Choose shipping courier and mode
   - Apply shipping rates and charges
   - Generate AWB numbers
   - Print shipping labels
   - Create manifest for pickup

4. Order Status Flow:
   - Pending → Processing → In Transit → Delivered
   - Can be cancelled at any stage before delivery
   - Supports NDR (Non-Delivery Report) handling
   - Weight dispute resolution

5. Channel Integration:
   - Manual: Direct order creation
   - Excel: Bulk order upload
   - Shopify: Direct integration
   - WooCommerce: Direct integration
   - Amazon: Direct integration
   - Flipkart: Direct integration
   - OpenCart: Direct integration
   - API: Custom integration

### Common Error Codes for Orders
- `ORDER_NOT_FOUND`: Order does not exist
- `INVALID_ORDER_STATUS`: Invalid order status for operation
- `BULK_SHIP_FAILED`: Failed to ship orders in bulk
- `INVALID_SHIPPING_DETAILS`: Invalid shipping information
- `INVALID_CHANNEL`: Invalid order channel
- `ORDER_ALREADY_SHIPPED`: Order is already shipped
- `INVALID_PAYMENT`: Invalid payment information
- `INVALID_ADDRESS`: Invalid shipping address
- `INVALID_PRODUCT`: Invalid product information
- `INVALID_WEIGHT`: Invalid package weight
- `INVALID_DIMENSIONS`: Invalid package dimensions

## Bulk Orders

### Upload Bulk Orders
```typescript
POST /api/v1/seller/bulk-orders/upload
Content-Type: multipart/form-data

Request Body:
{
    file: File  // Excel file (.xlsx, .xls)
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        uploadId: string,
        totalOrders: number,
        successCount: number,
        errorCount: number,
        blankCount: number,
        errorFile?: string,  // URL to download error file
        progress: number     // Upload progress percentage
    },
    error?: {
        code: string,
        message: string,
        details?: {
            field?: string,
            reason?: string
        }
    }
}
```

### Get Upload History
```typescript
GET /api/v1/seller/bulk-orders/history

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    startDate?: string,  // ISO date
    endDate?: string     // ISO date
}

Response:
{
    success: boolean,
    data?: {
        uploads: Array<{
            id: number,
            uploadDate: string,
            originalFile: string,
            successCount: number,
            errorCount: number,
            blankCount: number,
            totalCount: number,
            errorFile?: string,
            showHide: 'Show' | 'Hide'
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Download Template
```typescript
GET /api/v1/seller/bulk-orders/template

Response:
{
    success: boolean,
    data?: {
        url: string  // URL to download template file
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Bulk Order Template Format
The bulk order template Excel file contains the following columns:

#### Grid 1 - Order Details
- Order Id * (Your store order-number)
- Payment Type * (COD/PAID/REV)
- Order Date * (YYYY/MM/DD)
- Shipping Full Name *
- Shipping Company Name
- Shipping Address Line1 *
- Shipping Address Line2 *
- Shipping Contact Number *
- Shipping City *
- Shipping Pincode *
- Billing Full Name

#### Grid 2 - Billing & Package Details
- Billing Company Name
- Billing Address1
- Billing Address2
- Billing City
- Billing Pincode
- Billing GST
- Package Weight * (in Kg)
- Package Length * (in cm)
- Package Height * (in cm)
- Package Width * (in cm)
- Purchase Amount *

#### Grid 3 - Product 1 Details
- SKU1
- Product Name1 *
- Quantity1 *
- Item Weight1 * (in Kg)
- Item Price1 *

#### Grid 3 - Product 2 Details
- SKU2
- Product Name2
- Quantity2
- Item Weight2
- Item Price2

#### Grid 4 - Product 3 Details
- SKU3
- Product Name3
- Quantity3
- Item Weight3
- Item Price3

#### Grid 4 - Product 4 Details
- SKU4
- Product Name4
- Quantity4
- Item Weight4
- Item Price4

Note: Fields marked with * are required. Each product grid can contain up to 4 items per order.

### Common Error Codes for Bulk Orders
- `INVALID_FILE_FORMAT`: File must be .xlsx or .xls
- `FILE_TOO_LARGE`: File size exceeds limit
- `MISSING_REQUIRED_FIELDS`: Required fields are missing
- `INVALID_DATA_FORMAT`: Data format is invalid
- `DUPLICATE_ORDER_ID`: Order ID already exists
- `INVALID_PAYMENT_TYPE`: Invalid payment type
- `INVALID_DATE_FORMAT`: Invalid date format
- `INVALID_PHONE_NUMBER`: Invalid phone number format
- `INVALID_PINCODE`: Invalid pincode format
- `INVALID_WEIGHT`: Invalid weight value
- `INVALID_DIMENSIONS`: Invalid package dimensions
- `INVALID_PRICE`: Invalid price value
- `INVALID_QUANTITY`: Invalid quantity value
- `INVALID_SKU_FORMAT`: Invalid SKU format
- `BULK_UPLOAD_IN_PROGRESS`: Another bulk upload is in progress
- `BULK_UPLOAD_FAILED`: Bulk upload failed
- `TEMPLATE_DOWNLOAD_FAILED`: Failed to download template

## Billing Management

### Rate Card
```typescript
GET /api/v2/seller/billing/rate-card

Query Parameters:
{
    pickupPincode: string,    // Required
    deliveryPincode: string,  // Required
    paymentType: string,      // Required, "COD" or "Prepaid"
    purchaseAmount: string,   // Required for COD
    packageLength: string,    // Required, in cm
    packageWidth: string,     // Required, in cm
    packageHeight: string,    // Required, in cm
    packageWeight: string     // Required, in kg
}

Response:
{
    success: boolean,
    data?: {
        rates: Array<{
            courier: string,
            serviceType: string,
            deliveryTime: string,
            baseRate: number,
            weightCharge: number,
            fuelSurcharge: number,
            codCharge: number,
            gst: number,
            totalCharge: number,
            isRecommended: boolean
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Invoices
```typescript
GET /api/v2/seller/billing/invoices

Query Parameters:
{
    fromDate?: string,    // Optional, YYYY-MM-DD
    toDate?: string,      // Optional, YYYY-MM-DD
    page?: number,        // Required, starts from 1
    limit?: number,       // Required, max 50
    status?: string       // Optional, "paid" | "pending" | "overdue"
}

Response:
{
    success: boolean,
    data?: {
        invoices: Array<{
            id: string,
            invoiceNumber: string,
            period: string,
            shipments: number,
            amount: string,
            status: string,
            dueDate: string,
            paidDate?: string
        }>,
        pagination: {
            total: number,
            page: number,
            limit: number,
            pages: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Invoice Details
```typescript
GET /api/v2/seller/billing/invoices/:invoiceId

Response:
{
    success: boolean,
    data?: {
        invoice: {
            id: string,
            invoiceNumber: string,
            period: string,
            shipments: number,
            amount: string,
            status: string,
            dueDate: string,
            paidDate?: string
        },
        shipments: Array<{
            id: string,
            date: string,
            trackingNumber: string,
            origin: string,
            originCity: string,
            destination: string,
            destinationCity: string,
            weight: string,
            category: string,
            courier: string,
            status: string,
            baseCharge: number,
            additionalCharge: number,
            codCharge: number,
            gst: number,
            total: number
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Ledger History
```typescript
GET /api/v2/seller/billing/ledger

Query Parameters:
{
    fromDate?: string,            // Optional, YYYY-MM-DD
    toDate?: string,              // Optional, YYYY-MM-DD
    page?: number,                // Required, starts from 1
    limit?: number,               // Required, max 50
    transactionNumber?: string,   // Optional
    transactionBy?: string,       // Optional
    transactionType?: string,     // Optional
    transactionAgainst?: string,  // Optional
    creditDebit?: "Credit" | "Debit" | "Both",  // Optional
    amount?: string,              // Optional
    remark?: string               // Optional
}

Response:
{
    success: boolean,
    data?: {
        transactions: Array<{
            id: string,
            date: string,
            type: string,
            transactionBy: string,
            credit: string | null,
            debit: string | null,
            taxableAmount: string | null,
            igst: string | null,
            cgst: string | null,
            sgst: string | null,
            totalAmount: string,
            closingBalance: string,
            transactionNumber: string,
            transactionAgainst: string,
            remark: string | null
        }>,
        summary: {
            totalRecharge: string,
            totalDebit: string,
            totalCredit: string,
            closingBalance: string
        },
        pagination: {
            total: number,
            page: number,
            limit: number,
            pages: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Shipping Zones
1. Within City:
   - Same city delivery
   - Fastest delivery time
   - Lowest base rates

2. Within State:
   - Same state delivery
   - Moderate delivery time
   - Competitive rates

3. Metro to Metro:
   - Between major cities
   - Standard delivery time
   - Standard rates

4. Rest of India:
   - Pan-India delivery
   - Longer delivery time
   - Higher rates

5. North East & Jammu & Kashmir:
   - Special zone
   - Extended delivery time
   - Premium rates

### Charge Components
1. Base Charge:
   - Zone-based rate
   - Weight-based calculation
   - Courier-specific pricing

2. Additional Charges:
   - Weight surcharge
   - Fuel surcharge
   - Handling charges

3. COD Charges:
   - Fixed charge per shipment
   - Percentage of order value
   - Minimum charge applicable

4. GST (18%):
   - Applied on subtotal
   - IGST for interstate
   - CGST + SGST for intrastate

### Common Error Codes for Billing
- `INVALID_PINCODE`: Invalid pincode format or not serviceable
- `INVALID_WEIGHT`: Weight exceeds courier limits
- `INVALID_DIMENSIONS`: Package dimensions exceed limits
- `INVALID_PAYMENT_TYPE`: Invalid payment type
- `INVALID_AMOUNT`: Invalid amount format
- `INVOICE_NOT_FOUND`: Invoice not found
- `INVALID_INVOICE_STATUS`: Invalid invoice status
- `PAYMENT_FAILED`: Payment processing failed
- `INSUFFICIENT_BALANCE`: Insufficient wallet balance
- `INVALID_TRANSACTION`: Invalid transaction details
- `DUPLICATE_TRANSACTION`: Duplicate transaction detected
- `SYSTEM_ERROR`: System error occurred
- `NETWORK_ERROR`: Network error occurred
- `TIMEOUT_ERROR`: Request timeout occurred
- `VALIDATION_ERROR`: Request validation failed
- `AUTHORIZATION_ERROR`: Authorization failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `MAINTENANCE_ERROR`: System under maintenance
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: {
            field?: string;
            reason?: string;
            [key: string]: any;
        };
    };
}
```

### Common Error Codes
- `INVALID_CREDENTIALS`: Invalid email/phone or password
- `INVALID_OTP`: Invalid or expired OTP
- `ORDER_NOT_FOUND`: Order with given AWB not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service not available for given pincodes
- `INVALID_PAYMENT`: Payment method invalid or failed
- `INVALID_ADDRESS`: Invalid pickup or delivery address
- `PACKAGE_RESTRICTED`: Package dimensions or weight exceed limits
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VALIDATION_ERROR`: Invalid request parameters
- `PARTNER_API_ERROR`: Error from delivery partner API
- `BULK_UPLOAD_ERROR`: Error in bulk order upload
- `FILE_TOO_LARGE`: Uploaded file exceeds size limit
- `INVALID_FILE_TYPE`: Invalid file type for upload
- `INSUFFICIENT_BALANCE`: Insufficient wallet balance
- `INVOICE_NOT_FOUND`: Invoice not found
- `PAYMENT_FAILED`: Payment processing failed
- `TEAM_MEMBER_NOT_FOUND`: Team member with given ID not found
- `INVALID_PERMISSIONS`: Invalid permission values provided
- `DUPLICATE_EMAIL`: Email already exists in the team
- `INVALID_STATUS`: Invalid status value provided
- `PASSWORD_RESET_FAILED`: Failed to reset password
- `TEAM_SIZE_LIMIT_EXCEEDED`: Maximum team size limit reached
- `INVALID_EMAIL_FORMAT`: Invalid email format provided
- `INVALID_PHONE_FORMAT`: Invalid phone number format provided
- `PROFILE_UPDATE_FAILED`: Failed to update profile
- `IMAGE_UPLOAD_FAILED`: Failed to upload profile image
- `INVALID_DOCUMENT`: Invalid document format or type
- `DOCUMENT_VERIFICATION_FAILED`: Document verification failed
- `BANK_DETAILS_INVALID`: Invalid bank account details
- `BANK_DETAILS_VERIFICATION_FAILED`: Bank details verification failed
- `STORE_LINK_INVALID`: Invalid store link format
- `COMPANY_DETAILS_INVALID`: Invalid company information
- `ADDRESS_VERIFICATION_FAILED`: Address verification failed
- `INVALID_CURRENCY`: Invalid currency specified
- `INVALID_TIMEZONE`: Invalid timezone specified
- `WEBHOOK_URL_INVALID`: Invalid webhook URL format
- `IP_WHITELIST_INVALID`: Invalid IP address in whitelist
- `NOTIFICATION_SETTINGS_INVALID`: Invalid notification settings
- `API_KEY_GENERATION_FAILED`: Failed to generate API key
- `API_KEY_REVOCATION_FAILED`: Failed to revoke API key
- `INVALID_WAREHOUSE`: Invalid warehouse selection
- `INVALID_COURIER`: Invalid courier selection
- `INVALID_SHIPPING_MODE`: Invalid shipping mode
- `INVALID_PRODUCT_CATEGORY`: Invalid product category
- `INVALID_SKU_FORMAT`: Invalid SKU format
- `PRODUCT_ALREADY_EXISTS`: Product with same SKU already exists
- `INVALID_PRICE`: Invalid price value
- `INVALID_STOCK`: Invalid stock quantity
- `BULK_PRODUCT_UPLOAD_ERROR`: Error in bulk product upload
- `INVALID_MANIFEST`: Invalid manifest details
- `MANIFEST_CREATION_FAILED`: Failed to create manifest
- `INVALID_PICKUP_STATUS`: Invalid pickup status
- `INVALID_RECEIVED_ORDER_STATUS`: Invalid received order status
- `INVALID_WEIGHT_DISPUTE`: Invalid weight dispute details
- `WEIGHT_DISPUTE_CREATION_FAILED`: Failed to create weight dispute
- `INVALID_EVIDENCE`: Invalid evidence format or type
- `INVALID_REVISION`: Invalid revision details
- `INVALID_ACCEPTANCE`: Invalid acceptance status
- `BULK_WEIGHT_DISPUTE_ERROR`: Error in bulk weight dispute upload

## Shipments

### List Shipments
```typescript
GET /api/v1/seller/shipments

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    status?: string,     // Optional, filter by status
    startDate?: string,  // Optional, ISO date
    endDate?: string,    // Optional, ISO date
    search?: string      // Optional, search in AWB, order number, etc.
}

Response:
{
    success: boolean,
    data?: {
        shipments: Array<{
            orderId: string,
            orderDate: string,
            booked: string,
            pickupId: string,
            customer: string,
            product: string,
            amount: string,
            payment: "COD" | "Prepaid",
            weight: string,
            channel: string,
            awb: string,
            courier: string,
            tracking: string,
            status: "Booked" | "In-transit" | "Delivered" | "Pending Pickup" | "Cancelled" | "Exception"
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string,
        details?: {
            field?: string,
            reason?: string
        }
    }
}
```

### Track Shipment
```typescript
GET /api/v2/seller/shipments/:awb/track

Response:
{
    success: boolean,
    data?: {
        awb: string,
        courier: string,
        status: string,
        expectedDelivery: string,
        origin: string,
        destination: string,
        weight: string,
        trackingHistory: Array<{
            status: string,
            location: string,
            timestamp: string,
            description: string
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Cancel Shipment
```typescript
POST /api/v1/seller/shipments/:awb/cancel

Request Body:
{
    reason: string  // Required
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        cancellationId: string
    },
    error?: {
        code: string,
        message: string,
        details?: {
            field?: string,
            reason?: string
        }
    }
}
```

### Bulk Track Shipments
```typescript
POST /api/v2/seller/shipments/bulk-track
Content-Type: application/json

Request Body:
{
    awbNumbers: string[]  // Required, array of AWB numbers
}

Response:
{
    success: boolean,
    data?: {
        results: Array<{
            awb: string,
            status: string,
            trackingInfo?: {
                currentStatus: string,
                expectedDelivery: string,
                lastUpdate: string,
                location: string
            },
            error?: string
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Shipment Details
```typescript
GET /api/v2/seller/shipments/:awb

Response:
{
    success: boolean,
    data?: {
        shipmentId: string,
        orderId: string,
        orderDate: string,
        booked: string,
        pickupId: string,
        customer: {
            name: string,
            phone: string,
            email: string,
            address: {
                street: string,
                city: string,
                state: string,
                pincode: string,
                country: string
            }
        },
        product: {
            name: string,
            sku: string,
            quantity: number,
            price: number,
            weight: string,
            dimensions: {
                length: number,
                width: number,
                height: number
            }
        },
        payment: {
            method: "COD" | "Prepaid",
            amount: string,
            codCharge: string,
            shippingCharge: string,
            gst: string,
            total: string
        },
        channel: string,
        awb: string,
        courier: {
            name: string,
            trackingUrl: string
        },
        status: string,
        trackingHistory: Array<{
            status: string,
            location: string,
            timestamp: string,
            description: string
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Shipment Status Types
1. Booked:
   - Initial state when shipment is created
   - AWB number generated
   - Awaiting pickup

2. In-transit:
   - Shipment picked up
   - Moving through courier network
   - Multiple transit points possible

3. Delivered:
   - Final state
   - Package delivered to recipient
   - Delivery confirmation received

4. Pending Pickup:
   - Awaiting courier pickup
   - Scheduled for pickup
   - Can be rescheduled

5. Cancelled:
   - Shipment cancelled
   - No further updates
   - May be refunded

6. Exception:
   - Special handling required
   - Delivery issues
   - Requires attention

### Tracking History Events
1. Shipment Events:
   - Pickup from sender
   - Arrival at facility
   - Departure from facility
   - In transit updates
   - Out for delivery
   - Delivery attempts
   - Final delivery

2. Location Updates:
   - City and state
   - Facility name
   - Transit points
   - Delivery area

3. Status Descriptions:
   - Detailed event description
   - Reason for status change
   - Additional information
   - Special instructions

### Common Error Codes for Tracking
- `INVALID_AWB`: Invalid AWB number format
- `SHIPMENT_NOT_FOUND`: Shipment not found
- `TRACKING_UNAVAILABLE`: Tracking information not available
- `BULK_TRACK_LIMIT_EXCEEDED`: Too many AWB numbers in bulk track
- `INVALID_DATE_RANGE`: Invalid date range for filtering
- `INVALID_PAGE_PARAMS`: Invalid pagination parameters
- `SYSTEM_ERROR`: System error occurred
- `NETWORK_ERROR`: Network error occurred
- `TIMEOUT_ERROR`: Request timeout occurred
- `VALIDATION_ERROR`: Request validation failed
- `AUTHORIZATION_ERROR`: Authorization failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `MAINTENANCE_ERROR`: System under maintenance
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Warehouse Management

### List Warehouses
```typescript
GET /api/v1/seller/warehouses

Response:
{
    success: boolean,
    data?: {
        warehouses: Array<{
            id: string,
            name: string,
            address: string,
            city: string,
            state: string,
            pincode: string,
            contactPerson: string,
            phone: string,
            email: string,
            isActive: boolean
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Add Warehouse
```typescript
POST /api/v1/seller/warehouses
Content-Type: application/json

Request Body:
{
    name: string,
    address: string,
    city: string,
    state: string,
    pincode: string,
    contactPerson: string,
    phone: string,
    email: string
}

Response:
{
    success: boolean,
    data?: {
        warehouse: {
            id: string,
            name: string,
            address: string,
            city: string,
            state: string,
            pincode: string,
            contactPerson: string,
            phone: string,
            email: string,
            isActive: boolean
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Tools

### Warehouse Management
```typescript
GET /api/v2/seller/warehouse/items

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    search?: string,     // Optional, search by name or SKU
    status?: 'In Stock' | 'Low Stock' | 'Out of Stock',
    location?: string
}

Response:
{
    success: boolean,
    data?: {
        items: Array<{
            id: string,
            name: string,
            sku: string,
            quantity: number,
            location: string,
            status: 'In Stock' | 'Low Stock' | 'Out of Stock',
            lastUpdated: string
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Add Stock
```typescript
POST /api/v2/seller/warehouse/items/:itemId/stock
Content-Type: application/json

Request Body:
{
    quantity: number,    // Required
    location: string,    // Required
    notes?: string      // Optional
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        item: {
            id: string,
            name: string,
            sku: string,
            quantity: number,
            location: string,
            status: string,
            lastUpdated: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Transfer Stock
```typescript
POST /api/v2/seller/warehouse/items/:itemId/transfer
Content-Type: application/json

Request Body:
{
    quantity: number,    // Required
    fromLocation: string, // Required
    toLocation: string,  // Required
    notes?: string      // Optional
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        transfer: {
            id: string,
            itemId: string,
            quantity: number,
            fromLocation: string,
            toLocation: string,
            timestamp: string,
            notes?: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Products SKU Management
```typescript
GET /api/v2/seller/products/sku

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    search?: string,     // Optional, search by name or SKU
    category?: string,
    status?: 'Active' | 'Inactive'
}

Response:
{
    success: boolean,
    data?: {
        products: Array<{
            id: string,
            name: string,
            sku: string,
            description: string,
            category: string,
            price: number,
            weight: number,
            dimensions: {
                length: number,
                width: number,
                height: number
            },
            images: string[],
            status: 'active' | 'inactive' | 'out_of_stock',
            inventory: {
                quantity: number,
                lowStockThreshold: number,
                reorderPoint: number
            },
            variants?: Array<{
                id: string,
                name: string,
                sku: string,
                price: number,
                quantity: number
            }>,
            attributes?: {
                [key: string]: string | number | boolean
            }
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Service Check
```typescript
GET /api/v2/service-check

Query Parameters:
{
    pincode: string  // Required, 6-digit pincode
}

Response:
{
    success: boolean,
    data?: {
        pincode: string,
        city: string,
        state: string,
        isAvailable: boolean,
        services: {
            standard: boolean,
            express: boolean,
            cod: boolean
        },
        deliveryTime: {
            standard: string,  // e.g., "3-5 business days"
            express: string    // e.g., "1-2 business days"
        },
        restrictions?: string[]  // Optional restrictions or special conditions
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Bulk Service Check
```typescript
POST /api/v2/service-check/bulk
Content-Type: application/json

Request Body:
{
    pincodes: string[]  // Array of 6-digit pincodes
}

Response:
{
    success: boolean,
    data?: {
        results: Array<{
            pincode: string,
            city: string,
            state: string,
            isAvailable: boolean,
            services: {
                standard: boolean,
                express: boolean,
                cod: boolean
            },
            deliveryTime: {
                standard: string,
                express: string
            },
            restrictions?: string[]
        }>,
        summary: {
            total: number,
            available: number,
            unavailable: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Service Restrictions
```typescript
GET /api/v2/service-check/restrictions

Query Parameters:
{
    pincode: string,  // Required, 6-digit pincode
    serviceType: 'standard' | 'express' | 'cod'
}

Response:
{
    success: boolean,
    data?: {
        restrictions: Array<{
            type: string,
            description: string,
            appliesTo: string[],
            effectiveFrom?: string,
            effectiveUntil?: string
        }>,
        specialInstructions?: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Service Zones
1. Within City:
   - Same city delivery
   - Fastest delivery time
   - Lowest base rates

2. Within State:
   - Same state delivery
   - Moderate delivery time
   - Competitive rates

3. Metro to Metro:
   - Between major cities
   - Standard delivery time
   - Standard rates

4. Rest of India:
   - Pan-India delivery
   - Longer delivery time
   - Higher rates

5. North East & Jammu & Kashmir:
   - Special zone
   - Extended delivery time
   - Premium rates

### Common Error Codes for Tools
- `INVALID_AWB`: Invalid AWB number format
- `INVALID_FORMAT`: Unsupported label format
- `INVALID_SIZE`: Invalid label size
- `INVALID_DATE`: Invalid manifest date
- `INVALID_WAREHOUSE`: Invalid warehouse ID
- `INVALID_COURIER`: Invalid courier selection
- `FILE_TOO_LARGE`: Logo file exceeds size limit
- `INVALID_FILE_TYPE`: Unsupported file format
- `UPLOAD_FAILED`: File upload failed
- `MANIFEST_CREATION_FAILED`: Failed to create manifest
- `LABEL_GENERATION_FAILED`: Failed to generate label
- `SETTINGS_UPDATE_FAILED`: Failed to update settings
- `INVALID_PINCODE`: Invalid pincode format
- `SERVICE_UNAVAILABLE`: Service not available for pincode
- `INVALID_SERVICE_TYPE`: Invalid service type
- `INVALID_STOCK_QUANTITY`: Invalid stock quantity
- `INVALID_LOCATION`: Invalid warehouse location
- `TRANSFER_FAILED`: Stock transfer failed
- `INVALID_SKU`: Invalid SKU format
- `PRODUCT_NOT_FOUND`: Product not found
- `INVALID_VARIANT`: Invalid product variant
- `INVALID_ATTRIBUTE`: Invalid product attribute
- `SYSTEM_ERROR`: System error occurred
- `NETWORK_ERROR`: Network error occurred
- `TIMEOUT_ERROR`: Request timeout occurred
- `VALIDATION_ERROR`: Request validation failed
- `AUTHORIZATION_ERROR`: Authorization failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `MAINTENANCE_ERROR`: System under maintenance
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Reports

### Get Order Report
```typescript
GET /api/v1/seller/reports/orders

Query Parameters:
{
    startDate: string,   // Required, ISO date
    endDate: string,     // Required, ISO date
    courier?: string,
    status?: string,
    format: 'csv' | 'excel' | 'pdf'
}

Response:
{
    success: boolean,
    data?: {
        reportUrl: string,
        summary: {
            totalOrders: number,
            totalAmount: number,
            deliveredOrders: number,
            pendingOrders: number,
            cancelledOrders: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Shipment Report
```typescript
GET /api/v1/seller/reports/shipments

Query Parameters:
{
    startDate: string,   // Required, ISO date
    endDate: string,     // Required, ISO date
    courier?: string,
    status?: string,
    format: 'csv' | 'excel' | 'pdf'
}

Response:
{
    success: boolean,
    data?: {
        reportUrl: string,
        summary: {
            totalShipments: number,
            deliveredShipments: number,
            inTransitShipments: number,
            exceptionShipments: number,
            averageDeliveryTime: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Support

### Create Support Ticket
```typescript
POST /api/v2/seller/support/tickets
Content-Type: application/json

Request Body:
{
    subject: string,          // Required, min 5 characters
    contactNumber: string,    // Required, valid Indian phone number
    category: string,         // Required, one of: ORDER, PICKUP, BILLING, REMITTANCE, WT_DISPUTE, TECH, CALLBACK, KYC, FINANCE
    details: string,          // Required, min 20 characters
    attachments?: FileList    // Optional, max 5 files, each < 5MB
}

Response:
{
    success: boolean,
    data?: {
        ticket: {
            id: string,
            subject: string,
            status: 'New' | 'In Progress' | 'Resolved',
            category: string,
            createdAt: string,
            lastUpdated: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### List Support Tickets
```typescript
GET /api/v2/seller/support/tickets

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    status?: string,     // Optional, filter by status
    category?: string,   // Optional, filter by category
    search?: string      // Optional, search in ticket ID, subject, etc.
}

Response:
{
    success: boolean,
    data?: {
        tickets: Array<{
            id: string,
            subject: string,
            status: 'New' | 'In Progress' | 'Resolved',
            category: string,
            createdAt: string,
            lastUpdated: string
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Support Ticket Details
```typescript
GET /api/v2/seller/support/tickets/:ticketId

Response:
{
    success: boolean,
    data?: {
        ticket: {
            id: string,
            subject: string,
            status: 'New' | 'In Progress' | 'Resolved',
            category: string,
            contactNumber: string,
            details: string,
            attachments?: Array<{
                name: string,
                url: string
            }>,
            createdAt: string,
            lastUpdated: string,
            responses: Array<{
                id: string,
                message: string,
                sender: 'seller' | 'support',
                createdAt: string
            }>
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Add Response to Ticket
```typescript
POST /api/v2/seller/support/tickets/:ticketId/responses
Content-Type: application/json

Request Body:
{
    message: string,     // Required
    attachments?: FileList  // Optional, max 5 files, each < 5MB
}

Response:
{
    success: boolean,
    data?: {
        response: {
            id: string,
            message: string,
            sender: 'seller',
            createdAt: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Support Categories
1. ORDER:
   - Order creation and management
   - Order status updates
   - Order cancellation
   - Bulk order issues

2. PICKUP:
   - Pickup scheduling
   - Pickup status
   - Pickup location issues
   - Courier pickup problems

3. BILLING:
   - Invoice queries
   - Payment issues
   - Rate card questions
   - Billing disputes

4. REMITTANCE:
   - COD settlement
   - Payment processing
   - Remittance delays
   - Bank account issues

5. WT_DISPUTE:
   - Weight discrepancy
   - Weight verification
   - Weight charge disputes
   - Package weight issues

6. TECH:
   - Platform technical issues
   - API integration
   - System errors
   - Performance problems

7. CALLBACK:
   - Request callback
   - Schedule meeting
   - Priority support
   - Urgent assistance

8. KYC:
   - Document verification
   - Account verification
   - KYC process
   - Compliance issues

9. FINANCE:
   - Financial queries
   - Account statements
   - Refund requests
   - Payment reconciliation

### Support Hours
- Monday - Saturday
- 9:00 AM - 6:00 PM IST
- Emergency support available 24/7 for critical issues

### Common Error Codes for Support
- `INVALID_TICKET_ID`: Invalid ticket ID format
- `TICKET_NOT_FOUND`: Support ticket not found
- `INVALID_CATEGORY`: Invalid ticket category
- `INVALID_STATUS`: Invalid ticket status
- `INVALID_PHONE`: Invalid phone number format
- `FILE_TOO_LARGE`: Attachment exceeds size limit
- `TOO_MANY_FILES`: Too many attachments
- `INVALID_FILE_TYPE`: Unsupported file format
- `UPLOAD_FAILED`: File upload failed
- `INVALID_DATE_RANGE`: Invalid date range
- `INVALID_PAGE_PARAMS`: Invalid pagination parameters
- `SYSTEM_ERROR`: System error occurred
- `NETWORK_ERROR`: Network error occurred
- `TIMEOUT_ERROR`: Request timeout occurred
- `VALIDATION_ERROR`: Request validation failed
- `AUTHORIZATION_ERROR`: Authorization failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `MAINTENANCE_ERROR`: System under maintenance
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Settings

### Get Settings
```typescript
GET /api/v2/seller/settings

Response:
{
    success: boolean,
    data?: {
        // General Settings
        general: {
            siteTitle: string,
            siteUrl: string,
            adminEmail: string,
            supportPhone: string
        },
        // Display Settings
        display: {
            timezone: string,          // UTC, GMT, EST, PST, IST
            dateFormat: string,        // DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
            timeFormat: string,        // 12, 24
            weekStart: string,         // sunday, monday
            showSeconds: boolean
        },
        // Currency Settings
        currency: {
            code: string,              // USD, EUR, GBP, INR
            symbol: string,            // $, €, £, ₹
            format: string,            // both, symbol, text
            decimalPlaces: number
        },
        // Payment Settings
        payment: {
            enabledGateways: string[], // stripe, paypal, etc.
            defaultGateway: string,
            autoRefundEnabled: boolean,
            refundPeriod: number      // in days
        },
        // Shipping Settings
        shipping: {
            defaultCouriers: string[],
            enabledCouriers: string[],
            autoAssignCourier: boolean,
            defaultWeightUnit: string, // kg, lb
            defaultDimensionUnit: string // cm, inch
        },
        // Security Settings
        security: {
            sessionTimeout: number,    // in minutes
            loginAttempts: number,
            passwordResetExpiry: number, // in hours
            twoFactorAuth: boolean
        },
        // Profile Settings
        profile: {
            name: string,
            email: string,
            phone: string,
            businessName: string,
            gstin: string
        },
        // Notification Settings
        notifications: {
            email: boolean,
            sms: boolean,
            push: boolean,
            smsProvider?: {
                method: "nexmo" | "Clickatell" | "Message Brid" | "Infobip",
                apiKey: string,
                apiSecret: string
            }
        },
        // API Settings
        api: {
            apiKey: string,
            apiSecret: string,
            enabled: boolean,
            webhookEnabled: boolean,
            webhookUrl: string
        },
        // Shipping Preferences
        preferences: {
            defaultWarehouse: string,
            defaultCourier: string,
            defaultShippingMode: "standard" | "express" | "cod",
            autoSelectCourier: boolean,
            codAvailable: boolean
        },
        // Courier Settings
        courierSettings: Array<{
            courierId: number,
            enabled: boolean,
            priority: number,
            config?: {
                accountId: string,
                apiKey: string,
                apiSecret: string,
                pickupLocation: string,
                serviceablePincodes: string[],
                maxWeight: number,
                maxValue: number
            }
        }>,
        // Label Settings
        labelSettings: {
            size: string,
            format: string,
            logo?: string,
            showLogo: boolean,
            showBarcode: boolean,
            showReturn: boolean,
            additionalText: string
        },
        // WhatsApp Settings
        whatsappSettings: {
            enabled: boolean,
            businessNumber?: string,
            apiKey?: string,
            notifications: {
                orderConfirmation: boolean,
                orderPacked: boolean,
                outForDelivery: boolean,
                deliveryConfirmation: boolean,
                deliveryFailed: boolean,
                returnInitiated: boolean,
                returnPicked: boolean,
                returnDelivered: boolean
            },
            templates?: {
                orderConfirmation?: string,
                deliveryConfirmation?: string
            }
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Update Settings
```typescript
PUT /api/v2/seller/settings
Content-Type: application/json

Request Body:
{
    general?: {
        siteTitle?: string,
        siteUrl?: string,
        adminEmail?: string,
        supportPhone?: string
    },
    display?: {
        timezone?: string,
        dateFormat?: string,
        timeFormat?: string,
        weekStart?: string,
        showSeconds?: boolean
    },
    currency?: {
        code?: string,
        symbol?: string,
        format?: string,
        decimalPlaces?: number
    },
    payment?: {
        enabledGateways?: string[],
        defaultGateway?: string,
        autoRefundEnabled?: boolean,
        refundPeriod?: number
    },
    shipping?: {
        defaultCouriers?: string[],
        enabledCouriers?: string[],
        autoAssignCourier?: boolean,
        defaultWeightUnit?: string,
        defaultDimensionUnit?: string
    },
    security?: {
        sessionTimeout?: number,
        loginAttempts?: number,
        passwordResetExpiry?: number,
        twoFactorAuth?: boolean
    },
    notifications?: {
        email?: boolean,
        sms?: boolean,
        push?: boolean,
        smsProvider?: {
            method: "nexmo" | "Clickatell" | "Message Brid" | "Infobip",
            apiKey: string,
            apiSecret: string
        }
    },
    api?: {
        webhookEnabled?: boolean,
        webhookUrl?: string
    },
    preferences?: {
        defaultWarehouse?: string,
        defaultCourier?: string,
        defaultShippingMode?: "standard" | "express" | "cod",
        autoSelectCourier?: boolean,
        codAvailable?: boolean
    },
    courierSettings?: Array<{
        courierId: number,
        enabled: boolean,
        priority: number,
        config?: {
            accountId: string,
            apiKey: string,
            apiSecret: string,
            pickupLocation: string,
            serviceablePincodes: string[],
            maxWeight: number,
            maxValue: number
        }
    }>,
    labelSettings?: {
        size?: string,
        format?: string,
        logo?: string,
        showLogo?: boolean,
        showBarcode?: boolean,
        showReturn?: boolean,
        additionalText?: string
    },
    whatsappSettings?: {
        enabled?: boolean,
        businessNumber?: string,
        apiKey?: string,
        notifications?: {
            orderConfirmation?: boolean,
            orderPacked?: boolean,
            outForDelivery?: boolean,
            deliveryConfirmation?: boolean,
            deliveryFailed?: boolean,
            returnInitiated?: boolean,
            returnPicked?: boolean,
            returnDelivered?: boolean
        },
        templates?: {
            orderConfirmation?: string,
            deliveryConfirmation?: string
        }
    }
}

Response:
{
    success: boolean,
    data?: {
        message: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Settings Components

1. General Settings:
   - Site title and URL
   - Admin email
   - Support phone
   - Basic system information

2. Display Settings:
   - Timezone options (UTC, GMT, EST, PST, IST)
   - Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
   - Time format (12/24 hour)
   - Week start (Sunday/Monday)
   - Seconds display

3. Currency Settings:
   - Currency code (USD, EUR, GBP, INR)
   - Currency symbol
   - Display format (both/symbol/text)
   - Decimal places

4. Payment Settings:
   - Payment gateway configuration
   - Default gateway selection
   - Auto-refund settings
   - Refund period

5. Shipping Settings:
   - Default courier selection
   - Enabled couriers list
   - Auto-assign courier
   - Weight and dimension units

6. Security Settings:
   - Session timeout
   - Login attempts limit
   - Password reset expiry
   - Two-factor authentication

7. Profile Settings:
   - Basic seller information
   - Business details
   - Contact information
   - GST registration

8. Notification Settings:
   - Email notifications
   - SMS notifications (with provider settings)
   - Push notifications
   - Notification preferences

9. API Settings:
   - API key management
   - Webhook configuration
   - API access control
   - Integration settings

10. Shipping Preferences:
    - Default warehouse
    - Default courier
    - Shipping mode preferences
    - COD availability
    - Auto-select courier

11. Courier Settings:
    - Courier configuration
    - Priority settings
    - Service limits
    - API credentials
    - Serviceable areas

12. Label Settings:
    - Label size options
    - Format preferences
    - Logo customization
    - Barcode display
    - Return label options
    - Additional text

13. WhatsApp Settings:
    - Business integration
    - Notification preferences
    - Message templates
    - Status updates
    - Delivery notifications

### Validation Rules

1. General Settings:
   - Site title: Required, min 1 character
   - Site URL: Required, valid URL format
   - Admin email: Required, valid email format
   - Support phone: Required, min 1 character

2. Display Settings:
   - Timezone: Required, valid timezone
   - Date format: Required, valid format
   - Time format: Required, valid format
   - Week start: Required, valid day

3. Currency Settings:
   - Currency code: Required, valid currency
   - Currency symbol: Required, valid symbol
   - Currency format: Required, valid format
   - Decimal places: Required, valid number

4. Security Settings:
   - Session timeout: Min 1 minute
   - Login attempts: Min 1 attempt
   - Password reset expiry: Min 1 hour
   - Two-factor auth: Boolean

5. SMS Provider Settings:
   - Method: Required, valid provider
   - API Key: Required, min 1 character
   - API Secret: Required, min 1 character

### Common Error Codes for Settings
- `INVALID_SETTINGS`: Invalid settings format
- `INVALID_WAREHOUSE`: Invalid warehouse selection
- `INVALID_COURIER`: Invalid courier selection
- `INVALID_WEBHOOK`: Invalid webhook URL
- `INVALID_API_KEY`: Invalid API key format
- `INVALID_NOTIFICATION`: Invalid notification settings
- `INVALID_LABEL`: Invalid label settings
- `INVALID_WHATSAPP`: Invalid WhatsApp settings
- `INVALID_CURRENCY`: Invalid currency format
- `INVALID_TIMEZONE`: Invalid timezone
- `INVALID_DATE_FORMAT`: Invalid date format
- `INVALID_TIME_FORMAT`: Invalid time format
- `INVALID_SECURITY`: Invalid security settings
- `INVALID_PAYMENT`: Invalid payment settings
- `INVALID_SMS_PROVIDER`: Invalid SMS provider
- `UPDATE_FAILED`: Failed to update settings
- `SYSTEM_ERROR`: System error occurred
- `NETWORK_ERROR`: Network error occurred
- `TIMEOUT_ERROR`: Request timeout occurred
- `VALIDATION_ERROR`: Request validation failed
- `AUTHORIZATION_ERROR`: Authorization failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `MAINTENANCE_ERROR`: System under maintenance
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Profile Management

### Get Profile
```typescript
GET /api/v1/seller/profile

Response:
{
    success: boolean,
    data?: {
        profile: {
            id: string,
            name: string,
            email: string,
            phone: string,
            companyName: string,
            companyCategory: string,
            brandName?: string,
            website?: string,
            supportContact?: string,
            supportEmail?: string,
            operationsEmail?: string,
            financeEmail?: string,
            rechargeType?: string,
            profileImage?: string,
            storeLinks?: {
                website?: string,
                amazon?: string,
                shopify?: string,
                opencart?: string
            },
            address?: {
                street: string,
                city: string,
                state: string,
                country: string,
                postalCode: string,
                landmark?: string
            },
            documents?: {
                gstin?: string,
                pan?: string,
                cin?: string,
                tradeLicense?: string,
                msmeRegistration?: string,
                aadhaar?: string,
                documents: Array<{
                    name: string,
                    type: string,
                    url: string,
                    status: "verified" | "pending" | "rejected"
                }>
            },
            bankDetails?: Array<{
                accountName: string,
                accountNumber: string,
                bankName: string,
                branch: string,
                ifscCode: string,
                swiftCode?: string,
                accountType: string,
                isDefault: boolean,
                cancelledCheque?: {
                    url: string,
                    status: "verified" | "pending"
                }
            }>
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Update Profile
```typescript
PUT /api/v1/seller/profile
Content-Type: application/json

Request Body:
{
    name?: string,
    phone?: string,
    companyName?: string,
    companyCategory?: string,
    brandName?: string,
    website?: string,
    supportContact?: string,
    supportEmail?: string,
    operationsEmail?: string,
    financeEmail?: string,
    rechargeType?: string,
    address?: {
        street: string,
        city: string,
        state: string,
        country: string,
        postalCode: string,
        landmark?: string
    }
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        profile: ProfileData  // Same as Get Profile response
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Update Profile Image
```typescript
POST /api/v1/seller/profile/image
Content-Type: multipart/form-data

Request Body:
{
    image: File  // Image file (jpg, png, jpeg)
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        imageUrl: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Team Management

### List Team Members
```typescript
GET /api/v1/seller/team

Query Parameters:
{
    page?: number,        // Optional, starts from 1
    limit?: number,       // Optional, max 50
    search?: string       // Optional, search by name or email
}

Response:
{
    success: boolean,
    data?: {
        members: Array<{
            id: string,
            name: string,
            email: string,
            contactNumber: string,
            status: 'active' | 'inactive',
            permissions: string[],
            createdAt: string,
            lastLogin?: string
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Add Team Member
```typescript
POST /api/v1/seller/team
Content-Type: application/json

Request Body:
{
    name: string,
    email: string,
    contactNumber: string,
    password: string,
    permissions: string[],
    status: 'active' | 'inactive'
}

Response:
{
    success: boolean,
    data?: {
        member: {
            id: string,
            name: string,
            email: string,
            contactNumber: string,
            status: string,
            permissions: string[],
            createdAt: string
        }
    },
    error?: {
        code: string,
        message: string,
        details?: {
            field?: string,
            reason?: string
        }
    }
}
```

### Update Team Member
```typescript
PUT /api/v1/seller/team/{memberId}
Content-Type: application/json

Request Body:
{
    name?: string,
    email?: string,
    contactNumber?: string,
    permissions?: string[],
    status?: 'active' | 'inactive'
}

Response:
{
    success: boolean,
    data?: {
        member: {
            id: string,
            name: string,
            email: string,
            contactNumber: string,
            status: string,
            permissions: string[],
            updatedAt: string
        }
    },
    error?: {
        code: string,
        message: string,
        details?: {
            field?: string,
            reason?: string
        }
    }
}
```

### Delete Team Member
```typescript
DELETE /api/v1/seller/team/{memberId}

Response:
{
    success: boolean,
    data?: {
        message: string
    },
    error?: {
        code: string,
        message: string,
        details?: {
            reason?: string
        }
    }
}
```

### Reset Team Member Password
```typescript
POST /api/v1/seller/team/{memberId}/reset-password

Response:
{
    success: boolean,
    data?: {
        message: string,
        temporaryPassword?: string  // Only returned on successful reset
    },
    error?: {
        code: string,
        message: string,
        details?: {
            reason?: string
        }
    }
}
```

### Common Error Codes for Team Management
- `TEAM_MEMBER_NOT_FOUND`: Team member with given ID not found
- `INVALID_PERMISSIONS`: Invalid permission values provided
- `DUPLICATE_EMAIL`: Email already exists in the team
- `INVALID_STATUS`: Invalid status value provided
- `PASSWORD_RESET_FAILED`: Failed to reset password
- `INSUFFICIENT_PERMISSIONS`: User doesn't have permission to perform the action
- `TEAM_SIZE_LIMIT_EXCEEDED`: Maximum team size limit reached
- `INVALID_EMAIL_FORMAT`: Invalid email format provided
- `INVALID_PHONE_FORMAT`: Invalid phone number format provided

### Available Permissions
```typescript
interface Permission {
    category: string;
    icon: string;
    options: string[];
}

const PERMISSIONS: Permission[] = [
    {
        category: "Dashboard",
        icon: "dashboard",
        options: ["Dashboard access"]
    },
    {
        category: "Order",
        icon: "order",
        options: ["Order", "Shipments", "Manifest", "Received", "New Order"]
    },
    {
        category: "NDR",
        icon: "ndr",
        options: ["NDR List", "Weight Dispute"]
    },
    {
        category: "Billing",
        icon: "billing",
        options: ["Fright", "Wallet", "Invoice", "Ledger"]
    },
    {
        category: "COD",
        icon: "cod",
        options: ["COD Remittance"]
    },
    {
        category: "Warehouse & Support",
        icon: "warehouse",
        options: ["Support", "Warehouse", "Service", "Items & SKU"]
    },
    {
        category: "Settings",
        icon: "settings",
        options: ["Stores", "Priority", "Label"]
    }
]; 
```

## Products Management

### List Products
```typescript
GET /api/v1/seller/products

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    search?: string,     // Search by name or SKU
    category?: string,
    status?: 'Active' | 'Inactive'
}

Response:
{
    success: boolean,
    data?: {
        products: Array<{
            id: string,
            name: string,
            sku: string,
            category: string,
            price: number,
            stock: number,
            status: 'Active' | 'Inactive',
            lastUpdated: string
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Add Product
```typescript
POST /api/v1/seller/products
Content-Type: application/json

Request Body:
{
    name: string,
    sku: string,
    category: string,
    price: number,
    stock: number,
    status: 'Active' | 'Inactive'
}

Response:
{
    success: boolean,
    data?: {
        product: {
            id: string,
            name: string,
            sku: string,
            category: string,
            price: number,
            stock: number,
            status: string,
            lastUpdated: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Bulk Upload Products
```typescript
POST /api/v1/seller/products/bulk-upload
Content-Type: multipart/form-data

Request Body:
{
    file: File  // Excel file (.xlsx, .xls)
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        totalProducts: number,
        successCount: number,
        errorCount: number,
        errorFile?: string  // URL to download error file
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Delete Product
```typescript
DELETE /api/v1/seller/products/{productId}

Response:
{
    success: boolean,
    data?: {
        message: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Manifest Management

### List Manifests
```typescript
GET /api/v1/seller/manifests

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    status?: 'Processing' | 'Completed' | 'Scheduled',
    courier?: string,
    warehouse?: string,
    startDate?: string,  // ISO date
    endDate?: string     // ISO date
}

Response:
{
    success: boolean,
    data?: {
        manifests: Array<{
            manifestId: string,
            date: string,
            courier: string,
            orders: number,
            pickupStatus: 'Pending' | 'In Progress' | 'Completed' | 'Scheduled',
            warehouse: string,
            status: 'Processing' | 'Completed' | 'Scheduled'
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Create Manifest
```typescript
POST /api/v1/seller/manifests
Content-Type: application/json

Request Body:
{
    courier: string,
    warehouse: string,
    date: string,  // ISO date
    orders: string[]  // Array of order IDs
}

Response:
{
    success: boolean,
    data?: {
        manifest: {
            manifestId: string,
            date: string,
            courier: string,
            orders: number,
            pickupStatus: string,
            warehouse: string,
            status: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Update Manifest Status
```typescript
PUT /api/v1/seller/manifests/{manifestId}/status
Content-Type: application/json

Request Body:
{
    status: 'Processing' | 'Completed' | 'Scheduled',
    pickupStatus: 'Pending' | 'In Progress' | 'Completed' | 'Scheduled'
}

Response:
{
    success: boolean,
    data?: {
        message: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Received Orders

### List Received Orders
```typescript
GET /api/v1/seller/received-orders

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    status?: 'Pending' | 'Processing' | 'Completed',
    warehouse?: string,
    startDate?: string,  // ISO date
    endDate?: string     // ISO date
}

Response:
{
    success: boolean,
    data?: {
        orders: Array<{
            orderId: string,
            date: string,
            customer: string,
            items: number,
            totalAmount: number,
            warehouse: string,
            status: 'Pending' | 'Processing' | 'Completed',
            receivedBy: string,
            receivedAt: string,
            notes?: string,
            items: Array<{
                name: string,
                sku: string,
                quantity: number,
                price: number,
                condition: 'Good' | 'Damaged' | 'Missing'
            }>
        }>,
        total: number,
        page: number,
        limit: number,
        totalPages: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Update Received Order Status
```typescript
PUT /api/v1/seller/received-orders/{orderId}/status
Content-Type: application/json

Request Body:
{
    status: 'Pending' | 'Processing' | 'Completed',
    notes?: string,
    items?: Array<{
        sku: string,
        condition: 'Good' | 'Damaged' | 'Missing',
        notes?: string
    }>
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        order: {
            orderId: string,
            status: string,
            updatedAt: string,
            items: Array<{
                sku: string,
                condition: string,
                notes?: string
            }>
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Received Order Details
```typescript
GET /api/v1/seller/received-orders/{orderId}

Response:
{
    success: boolean,
    data?: {
        order: {
            orderId: string,
            date: string,
            customer: {
                name: string,
                contact: string,
                email: string
            },
            warehouse: {
                name: string,
                address: string,
                contact: string
            },
            status: 'Pending' | 'Processing' | 'Completed',
            receivedBy: string,
            receivedAt: string,
            notes?: string,
            items: Array<{
                name: string,
                sku: string,
                quantity: number,
                price: number,
                condition: 'Good' | 'Damaged' | 'Missing',
                notes?: string
            }>,
            history: Array<{
                action: string,
                performedBy: string,
                timestamp: string,
                details: string
            }>
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Received Orders Workflow

1. Order Reception:
   - Orders are received at the warehouse
   - Initial status is set to 'Pending'
   - Basic order details are recorded

2. Order Processing:
   - Items are checked and verified
   - Condition of items is recorded
   - Status is updated to 'Processing'
   - Any issues or damages are noted

3. Order Completion:
   - All items are verified and processed
   - Status is updated to 'Completed'
   - Final notes and condition reports are added
   - Order is ready for shipping

4. Status Updates:
   - Each status change is recorded in history
   - Notes can be added at any stage
   - Item conditions can be updated
   - Warehouse staff can add comments

### Common Error Codes for Received Orders
- `ORDER_NOT_FOUND`: Order does not exist
- `INVALID_STATUS`: Invalid status value
- `INVALID_CONDITION`: Invalid item condition
- `WAREHOUSE_NOT_FOUND`: Warehouse does not exist
- `INVALID_ITEMS`: Invalid items data
- `UPDATE_FAILED`: Failed to update order status
- `INVALID_DATE_RANGE`: Invalid date range for filtering
- `INVALID_PAGE_PARAMS`: Invalid pagination parameters

## Service Check

### Check Service Availability
```typescript
GET /api/v2/service-check

Query Parameters:
{
    pincode: string  // Required, 6-digit pincode
}

Response:
{
    success: boolean,
    data?: {
        pincode: string,
        city: string,
        state: string,
        isAvailable: boolean,
        services: {
            standard: boolean,
            express: boolean,
            cod: boolean
        },
        deliveryTime: {
            standard: string,  // e.g., "3-5 business days"
            express: string    // e.g., "1-2 business days"
        },
        restrictions?: string[]  // Optional restrictions or special conditions
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Check Bulk Service Availability
```typescript
POST /api/v2/service-check/bulk
Content-Type: application/json

Request Body:
{
    pincodes: string[]  // Array of 6-digit pincodes
}

Response:
{
    success: boolean,
    data?: {
        results: Array<{
            pincode: string,
            city: string,
            state: string,
            isAvailable: boolean,
            services: {
                standard: boolean,
                express: boolean,
                cod: boolean
            },
            deliveryTime: {
                standard: string,
                express: string
            },
            restrictions?: string[]
        }>,
        summary: {
            total: number,
            available: number,
            unavailable: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Service Restrictions
```typescript
GET /api/v2/service-check/restrictions

Query Parameters:
{
    pincode: string,  // Required, 6-digit pincode
    serviceType: 'standard' | 'express' | 'cod'
}

Response:
{
    success: boolean,
    data?: {
        restrictions: Array<{
            type: string,
            description: string,
            appliesTo: string[],
            effectiveFrom?: string,
            effectiveUntil?: string
        }>,
        specialInstructions?: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Weight Dispute Management

### List Weight Disputes
```typescript
GET /api/v2/seller/weight-disputes

Query Parameters:
{
    fromDate?: string,        // Optional, YYYY-MM-DD
    toDate?: string,          // Optional, YYYY-MM-DD
    status?: string,          // Optional, "Action Required" | "Open Dispute" | "Closed Dispute" | "Closed Resolved"
    accepted?: boolean,       // Optional
    search?: string,          // Optional
    awbNumber?: string,       // Optional
    product?: string,         // Optional
    courierPartner?: string,  // Optional
    page?: number,            // Required, starts from 1
    limit?: number            // Required, max 50
}

Response:
{
    success: boolean,
    data?: {
        disputes: Array<{
            disputeDate: string,
            awbNumber: string,
            orderId: string,
            given: number,
            applied: number,
            revised: number,
            accepted: boolean,
            difference: number,
            product: string,
            comments: string,
            status: "Action Required" | "Open Dispute" | "Closed Dispute" | "Closed Resolved"
        }>,
        pagination: {
            total: number,
            page: number,
            limit: number,
            pages: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get Weight Dispute Details
```typescript
GET /api/v2/seller/weight-disputes/:awbNumber

Query Parameters:
{
    orderId: string  // Required
}

Response:
{
    success: boolean,
    data?: {
        disputeDate: string,
        awbNumber: string,
        orderId: string,
        given: number,
        applied: number,
        revised: number,
        accepted: boolean,
        difference: number,
        product: string,
        comments: string,
        status: "Action Required" | "Open Dispute" | "Closed Dispute" | "Closed Resolved",
        customerName?: string,
        customerPhone?: string,
        address?: string,
        price?: number,
        quantity?: number,
        courierPartner?: string,
        trackingStatus?: string,
        pickupDate?: string,
        deliveryDate?: string,
        deliveryAttempts?: number,
        paymentMethod?: string,
        codAmount?: number,
        sellerName?: string,
        sellerSKU?: string,
        shippingCharge?: number,
        weightChargeDiscount?: number,
        weightDifferenceCharge?: number
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Update Weight Dispute
```typescript
PUT /api/v2/seller/weight-disputes/:awbNumber

Query Parameters:
{
    orderId: string  // Required
}

Request Body:
{
    status: string,  // Required, "Action Required" | "Open Dispute" | "Closed Dispute" | "Closed Resolved"
    revised?: number,  // Optional, revised weight
    accepted?: boolean,  // Optional
    comments?: string  // Optional
}

Response:
{
    success: boolean,
    data?: {
        dispute: {
            disputeDate: string,
            awbNumber: string,
            orderId: string,
            given: number,
            applied: number,
            revised: number,
            accepted: boolean,
            difference: number,
            product: string,
            comments: string,
            status: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Upload Weight Dispute File
```typescript
POST /api/v2/seller/weight-disputes/upload
Content-Type: multipart/form-data

Request Body:
{
    file: File  // Required, Excel file (.xlsx, .xls)
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        totalDisputes: number,
        successCount: number,
        errorCount: number,
        errorFile?: string  // URL to download error file
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Weight Dispute Status Types
1. Action Required:
   - Initial state when weight discrepancy is detected
   - Requires seller review and action
   - Time-sensitive status

2. Open Dispute:
   - Dispute has been raised by seller
   - Under review by courier partner
   - Awaiting resolution

3. Closed Dispute:
   - Dispute has been closed without resolution
   - No further action required
   - Final state

4. Closed Resolved:
   - Dispute has been resolved
   - Weight has been adjusted
   - Charges have been updated

### Weight Dispute Charges
1. Weight Difference Charge:
   - Calculated based on weight discrepancy
   - Applied per kg difference
   - Varies by courier partner

2. Weight Charge Discount:
   - Applied when weight is revised
   - Based on revised weight difference
   - Automatically calculated

3. Shipping Charge:
   - Base shipping charge
   - May be adjusted based on dispute resolution
   - Includes all applicable surcharges

### Common Error Codes for Weight Disputes
- `INVALID_AWB`: Invalid AWB number format
- `INVALID_ORDER_ID`: Invalid order ID format
- `DISPUTE_NOT_FOUND`: Weight dispute not found
- `INVALID_STATUS`: Invalid dispute status
- `INVALID_WEIGHT`: Invalid weight value
- `FILE_TOO_LARGE`: Upload file exceeds size limit
- `INVALID_FILE_TYPE`: Unsupported file format
- `UPLOAD_FAILED`: File upload failed
- `PROCESSING_FAILED`: File processing failed
- `INVALID_DATE_RANGE`: Invalid date range
- `INVALID_PAGE_PARAMS`: Invalid pagination parameters
- `SYSTEM_ERROR`: System error occurred
- `NETWORK_ERROR`: Network error occurred
- `TIMEOUT_ERROR`: Request timeout occurred
- `VALIDATION_ERROR`: Request validation failed
- `AUTHORIZATION_ERROR`: Authorization failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `MAINTENANCE_ERROR`: System under maintenance
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## COD Remittance Management

### Get COD Remittance Summary
```typescript
GET /api/v2/seller/cod/summary

Response:
{
    success: boolean,
    data: {
        totalCOD: string,           // Total COD amount
        remittedTillDate: string,   // Total amount remitted so far
        lastRemittance: string,     // Last remittance amount
        totalRemittanceDue: string, // Total amount due for remittance
        nextRemittance: string      // Next scheduled remittance amount
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get COD Remittance History
```typescript
GET /api/v2/seller/cod/remittance-history

Query Parameters:
{
    status?: "Pending" | "Completed" | "Failed",
    from?: string,    // Optional, YYYY-MM-DD
    to?: string,      // Optional, YYYY-MM-DD
    page?: number,    // Required, starts from 1
    limit?: number    // Required, max 50
}

Response:
{
    success: boolean,
    data: {
        remittances: Array<{
            remittanceId: string,
            status: "Pending" | "Completed" | "Failed",
            paymentDate: string,
            remittanceAmount: string,
            freightDeduction: string,
            convenienceFee: string,
            total: string,
            paymentRef: string
        }>,
        pagination: {
            total: number,
            page: number,
            limit: number,
            pages: number
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Get COD Remittance Details
```typescript
GET /api/v2/seller/cod/remittance/:remittanceId

Response:
{
    success: boolean,
    data: {
        remittanceId: string,
        status: "Pending" | "Completed" | "Failed",
        paymentDate: string,
        remittanceAmount: string,
        freightDeduction: string,
        convenienceFee: string,
        total: string,
        paymentRef: string,
        orders: Array<{
            orderId: string,
            awb: string,
            orderDate: string,
            deliveryDate: string,
            customerName: string,
            amount: string
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

### COD Remittance Status Types
1. Pending:
   - Initial state when remittance is created
   - Awaiting payment processing
   - Can be updated to Completed or Failed

2. Completed:
   - Remittance has been processed
   - Payment has been transferred
   - Final state for successful remittances

3. Failed:
   - Remittance processing failed
   - Payment transfer unsuccessful
   - Can be retried or cancelled

### COD Remittance Components
1. Remittance Amount:
   - Total COD amount collected
   - Sum of all delivered orders
   - Before deductions

2. Freight Deduction:
   - Shipping charges deduction
   - Based on courier rates
   - Applied per shipment

3. Convenience Fee:
   - Platform service fee
   - Percentage of remittance amount
   - Fixed rate per transaction

4. Total Amount:
   - Final settlement amount
   - After all deductions
   - Net amount to be transferred

### Common Error Codes for COD Remittance
- `INVALID_REMITTANCE_ID`: Invalid remittance ID format
- `REMITTANCE_NOT_FOUND`: Remittance not found
- `INVALID_STATUS`: Invalid remittance status
- `INVALID_DATE_RANGE`: Invalid date range
- `INVALID_PAGE_PARAMS`: Invalid pagination parameters
- `PAYMENT_FAILED`: Payment processing failed
- `INSUFFICIENT_BALANCE`: Insufficient balance for remittance
- `PROCESSING_ERROR`: Remittance processing error
- `SYSTEM_ERROR`: System error occurred
- `NETWORK_ERROR`: Network error occurred
- `TIMEOUT_ERROR`: Request timeout occurred
- `VALIDATION_ERROR`: Request validation failed
- `AUTHORIZATION_ERROR`: Authorization failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded
- `MAINTENANCE_ERROR`: System under maintenance
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable 

## Settings Management

### Store Management
- **Store Integration**
  - Store Type (Amazon, Shopify, Flipkart, Meesho, Myntra, AJIO, Nykaa, Custom)
  - Store URL
  - API Key
  - API Secret
  - Auto-fetch orders
  - Auto-create shipping orders
  - Auto-notify customers
  - Default shipping mode (standard/express/cod)

### Courier Settings
- Enable/disable couriers
- Set courier priority
- Configure courier-specific settings:
  - Account ID
  - API Key
  - API Secret
  - Pickup Location
  - Serviceable Pincodes
  - Maximum Weight
  - Maximum Value

### Label Settings
- Label Size
- Label Format
- Logo Configuration
  - Show/Hide Logo
  - Logo Image
- Barcode Settings
  - Show/Hide Barcode
- Return Label Settings
  - Show/Hide Return Label
- Additional Text

### User Management
- Add/Edit Users
- Manage Access Levels
- Password Reset
- Permission Configuration
- User Roles and Permissions

### WhatsApp Settings
- Enable/Disable WhatsApp Integration
- Business Number Configuration
- API Key Setup
- Notification Settings:
  - Order Confirmation
  - Order Packed
  - Out for Delivery
  - Delivery Confirmation
  - Delivery Failed
  - Return Initiated
  - Return Picked
  - Return Delivered
- Message Templates:
  - Order Confirmation Template
  - Delivery Confirmation Template

### API Settings
- API Key Management
- API Secret Configuration
- Enable/Disable API Access
- Webhook Configuration:
  - Enable/Disable Webhooks
  - Webhook URL Setup

### General Settings
- Security Settings:
  - Session Timeout
  - Login Attempts
  - Password Reset Expiry
  - Two-Factor Authentication
- Profile Settings:
  - Name
  - Email
  - Phone
  - Business Name
  - GSTIN
- Notification Settings:
  - Email Notifications
  - SMS Notifications
  - Push Notifications
  - SMS Provider Configuration
- Shipping Preferences:
  - Default Warehouse
  - Default Courier
  - Default Shipping Mode
  - Auto-select Courier
  - COD Availability

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('seller', 'admin', 'customer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Sellers
```sql
CREATE TABLE sellers (
    id UUID PRIMARY KEY REFERENCES users(id),
    company_name VARCHAR(100) NOT NULL,
    company_category VARCHAR(50),
    brand_name VARCHAR(100),
    website VARCHAR(255),
    support_contact VARCHAR(15),
    support_email VARCHAR(255),
    operations_email VARCHAR(255),
    finance_email VARCHAR(255),
    recharge_type VARCHAR(20),
    profile_image VARCHAR(255),
    gstin VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Store Links
```sql
CREATE TABLE store_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id),
    platform VARCHAR(20) NOT NULL,
    store_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    auto_fetch BOOLEAN DEFAULT false,
    auto_create BOOLEAN DEFAULT false,
    auto_notify BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Orders
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    customer_email VARCHAR(255),
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    order_status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_charge DECIMAL(10,2) NOT NULL,
    cod_charge DECIMAL(10,2),
    gst_amount DECIMAL(10,2),
    channel VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Order Items
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    weight DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Shipments
```sql
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    awb_number VARCHAR(50) UNIQUE NOT NULL,
    courier_id UUID REFERENCES couriers(id),
    status VARCHAR(20) NOT NULL,
    pickup_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    weight DECIMAL(10,2),
    dimensions JSONB,
    shipping_charge DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Shipment Tracking
```sql
CREATE TABLE shipment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id),
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Couriers
```sql
CREATE TABLE couriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    api_status VARCHAR(20) NOT NULL DEFAULT 'active',
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    tracking_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Warehouses
```sql
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id),
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Products
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    weight DECIMAL(10,2),
    dimensions JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Inventory
```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER,
    reorder_point INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Settings
```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id),
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(seller_id, category, key)
);
```

#### Weight Disputes
```sql
CREATE TABLE weight_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id),
    given_weight DECIMAL(10,2) NOT NULL,
    applied_weight DECIMAL(10,2) NOT NULL,
    revised_weight DECIMAL(10,2),
    difference DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    accepted BOOLEAN DEFAULT false,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### COD Remittances
```sql
CREATE TABLE cod_remittances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id),
    remittance_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    remittance_amount DECIMAL(10,2) NOT NULL,
    freight_deduction DECIMAL(10,2) NOT NULL,
    convenience_fee DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Support Tickets
```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id),
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Ticket Responses
```sql
CREATE TABLE ticket_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id),
    sender_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- Orders
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Shipments
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_awb_number ON shipments(awb_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Products
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);

-- Inventory
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);

-- Settings
CREATE INDEX idx_settings_seller_id ON settings(seller_id);
CREATE INDEX idx_settings_category ON settings(category);

-- Weight Disputes
CREATE INDEX idx_weight_disputes_shipment_id ON weight_disputes(shipment_id);
CREATE INDEX idx_weight_disputes_status ON weight_disputes(status);

-- COD Remittances
CREATE INDEX idx_cod_remittances_seller_id ON cod_remittances(seller_id);
CREATE INDEX idx_cod_remittances_status ON cod_remittances(status);

-- Support Tickets
CREATE INDEX idx_support_tickets_seller_id ON support_tickets(seller_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
```

### Foreign Key Constraints
```sql
-- Add foreign key constraints
ALTER TABLE sellers
    ADD CONSTRAINT fk_sellers_user
    FOREIGN KEY (id) REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE store_links
    ADD CONSTRAINT fk_store_links_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE;

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE;

ALTER TABLE shipments
    ADD CONSTRAINT fk_shipments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE;

ALTER TABLE shipment_tracking
    ADD CONSTRAINT fk_shipment_tracking_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    ON DELETE CASCADE;

ALTER TABLE warehouses
    ADD CONSTRAINT fk_warehouses_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE;

ALTER TABLE products
    ADD CONSTRAINT fk_products_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE;

ALTER TABLE inventory
    ADD CONSTRAINT fk_inventory_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
    ADD CONSTRAINT fk_inventory_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    ON DELETE CASCADE;

ALTER TABLE settings
    ADD CONSTRAINT fk_settings_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE;

ALTER TABLE weight_disputes
    ADD CONSTRAINT fk_weight_disputes_shipment
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    ON DELETE CASCADE;

ALTER TABLE cod_remittances
    ADD CONSTRAINT fk_cod_remittances_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE;

ALTER TABLE support_tickets
    ADD CONSTRAINT fk_support_tickets_seller
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
    ON DELETE CASCADE;

ALTER TABLE ticket_responses
    ADD CONSTRAINT fk_ticket_responses_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
    ON DELETE CASCADE,
    ADD CONSTRAINT fk_ticket_responses_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE;
```

## API Endpoints

### Authentication

#### Register Seller
```http
POST /api/v1/auth/register
Content-Type: application/json

{
    "name": "string",
    "email": "string",
    "phone": "string",
    "password": "string",
    "company_name": "string",
    "company_category": "string",
    "brand_name": "string",
    "website": "string",
    "support_contact": "string",
    "support_email": "string",
    "operations_email": "string",
    "finance_email": "string",
    "gstin": "string"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "string",
    "password": "string"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
```

### Store Management

#### List Store Links
```http
GET /api/v1/store-links
Authorization: Bearer <token>
```

#### Add Store Link
```http
POST /api/v1/store-links
Authorization: Bearer <token>
Content-Type: application/json

{
    "platform": "string",
    "store_url": "string",
    "api_key": "string",
    "api_secret": "string",
    "auto_fetch": boolean,
    "auto_create": boolean,
    "auto_notify": boolean
}
```

#### Update Store Link
```http
PUT /api/v1/store-links/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "platform": "string",
    "store_url": "string",
    "api_key": "string",
    "api_secret": "string",
    "auto_fetch": boolean,
    "auto_create": boolean,
    "auto_notify": boolean
}
```

#### Delete Store Link
```http
DELETE /api/v1/store-links/{id}
Authorization: Bearer <token>
```

### Order Management

#### List Orders
```http
GET /api/v1/orders
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- status: string
- start_date: string
- end_date: string
- search: string
```

#### Get Order Details
```http
GET /api/v1/orders/{id}
Authorization: Bearer <token>
```

#### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
    "customer_name": "string",
    "customer_phone": "string",
    "customer_email": "string",
    "payment_method": "string",
    "items": [
        {
            "product_name": "string",
            "sku": "string",
            "quantity": number,
            "price": number,
            "weight": number
        }
    ],
    "shipping_address": {
        "address": "string",
        "city": "string",
        "state": "string",
        "pincode": "string"
    }
}
```

#### Update Order Status
```http
PATCH /api/v1/orders/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
    "status": "string"
}
```

### Shipment Management

#### Create Shipment
```http
POST /api/v1/shipments
Authorization: Bearer <token>
Content-Type: application/json

{
    "order_id": "string",
    "courier_id": "string",
    "weight": number,
    "dimensions": {
        "length": number,
        "width": number,
        "height": number
    }
}
```

#### Get Shipment Details
```http
GET /api/v1/shipments/{id}
Authorization: Bearer <token>
```

#### Update Shipment Status
```http
PATCH /api/v1/shipments/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
    "status": "string"
}
```

#### Get Shipment Tracking
```http
GET /api/v1/shipments/{id}/tracking
Authorization: Bearer <token>
```

### Warehouse Management

#### List Warehouses
```http
GET /api/v1/warehouses
Authorization: Bearer <token>
```

#### Add Warehouse
```http
POST /api/v1/warehouses
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "contact_person": "string",
    "phone": "string",
    "email": "string"
}
```

#### Update Warehouse
```http
PUT /api/v1/warehouses/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "contact_person": "string",
    "phone": "string",
    "email": "string",
    "is_active": boolean
}
```

### Product Management

#### List Products
```http
GET /api/v1/products
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- search: string
- category: string
```

#### Add Product
```http
POST /api/v1/products
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "sku": "string",
    "description": "string",
    "category": "string",
    "price": number,
    "weight": number,
    "dimensions": {
        "length": number,
        "width": number,
        "height": number
    }
}
```

#### Update Product
```http
PUT /api/v1/products/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "description": "string",
    "category": "string",
    "price": number,
    "weight": number,
    "dimensions": {
        "length": number,
        "width": number,
        "height": number
    },
    "status": "string"
}
```

### Inventory Management

#### Get Inventory
```http
GET /api/v1/inventory
Authorization: Bearer <token>
Query Parameters:
- product_id: string
- warehouse_id: string
```

#### Update Inventory
```http
PATCH /api/v1/inventory/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "quantity": number,
    "low_stock_threshold": number,
    "reorder_point": number
}
```

### Settings Management

#### Get Settings
```http
GET /api/v1/settings
Authorization: Bearer <token>
Query Parameters:
- category: string
```

#### Update Settings
```http
PUT /api/v1/settings
Authorization: Bearer <token>
Content-Type: application/json

{
    "category": "string",
    "settings": {
        "key": "value"
    }
}
```

### Weight Disputes

#### List Weight Disputes
```http
GET /api/v1/weight-disputes
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- status: string
```

#### Get Weight Dispute Details
```http
GET /api/v1/weight-disputes/{id}
Authorization: Bearer <token>
```

#### Update Weight Dispute
```http
PATCH /api/v1/weight-disputes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "revised_weight": number,
    "status": "string",
    "accepted": boolean,
    "comments": "string"
}
```

### COD Remittances

#### List COD Remittances
```http
GET /api/v1/cod-remittances
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- status: string
- start_date: string
- end_date: string
```

#### Get COD Remittance Details
```http
GET /api/v1/cod-remittances/{id}
Authorization: Bearer <token>
```

### Support Tickets

#### List Support Tickets
```http
GET /api/v1/support-tickets
Authorization: Bearer <token>
Query Parameters:
- page: number
- limit: number
- status: string
- category: string
```

#### Create Support Ticket
```http
POST /api/v1/support-tickets
Authorization: Bearer <token>
Content-Type: application/json

{
    "subject": "string",
    "category": "string",
    "priority": "string",
    "message": "string",
    "attachments": [
        {
            "name": "string",
            "url": "string"
        }
    ]
}
```

#### Get Ticket Details
```http
GET /api/v1/support-tickets/{id}
Authorization: Bearer <token>
```

#### Add Ticket Response
```http
POST /api/v1/support-tickets/{id}/responses
Authorization: Bearer <token>
Content-Type: application/json

{
    "message": "string",
    "attachments": [
        {
            "name": "string",
            "url": "string"
        }
    ]
}
```

### Common Response Formats

#### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    },
    "message": "string"
}
```

#### Error Response
```json
{
    "success": false,
    "error": {
        "code": "string",
        "message": "string",
        "details": {
            // Additional error details
        }
    }
}
```

### Common Error Codes

- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Invalid token
- `AUTH_004`: Insufficient permissions
- `VAL_001`: Validation error
- `DB_001`: Database error
- `API_001`: External API error
- `NF_001`: Resource not found
- `CONF_001`: Resource conflict