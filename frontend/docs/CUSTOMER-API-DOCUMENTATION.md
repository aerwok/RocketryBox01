# Rocketry Box Customer API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Profile Management](#profile-management)
5. [Orders](#orders)
6. [Track Order](#track-order)
7. [Payment](#payment)
8. [Create Order](#create-order)
9. [Services](#services)
10. [Data Models](#data-models)
11. [Error Handling](#error-handling)
12. [Rate Calculation](#rate-calculation)
13. [Delivery Partner Integration](#delivery-partner-integration)

## Overview
The Rocketry Box Customer API provides endpoints for managing customer orders, tracking shipments, and handling payments. This API follows RESTful principles and uses JSON for request/response payloads.

## Getting Started

### Base URL
```
Production: https://api.rocketrybox.com/v1
Staging: https://staging-api.rocketrybox.com/v1
```

### Authentication
All API requests must include an `Authorization` header with a valid JWT token:
```
Authorization: Bearer <access_token>
```

### Rate Limiting
- Standard tier: 100 requests per minute
- Premium tier: 500 requests per minute

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

### Register
```typescript
POST /api/v1/customer/auth/register
Content-Type: application/json

Request Body:
{
    name: string,          // Full name
    email: string,         // Valid email address
    phone: string,         // Valid phone number
    password: string,      // Min 8 chars, 1 uppercase, 1 number
    confirmPassword: string,
    acceptTerms: boolean   // Must be true
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        user: {
            id: string,
            name: string,
            email: string,
            phone: string,
            createdAt: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Login
```typescript
POST /api/v1/customer/auth/login
Content-Type: application/json

Request Body:
{
    phoneOrEmail: string,  // Can be either phone number or email
    password: string,
    otp?: string,         // Required for password reset
    rememberMe: boolean   // For extended token validity
}

Response:
{
    success: boolean,
    data?: {
        accessToken: string,    // JWT token
        refreshToken: string,   // For token refresh
        expiresIn: number,      // Token validity in seconds
        user: {
            id: string,
            name: string,
            email: string,
            phone: string
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
POST /api/v1/customer/auth/send-otp
Content-Type: application/json

Request Body:
{
    phoneOrEmail: string,  // Can be either phone number or email
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

## Profile Management

### Get Profile
```typescript
GET /api/v1/customer/profile

Response:
{
    success: boolean,
    data?: {
        id: string,
        name: string,
        email: string,
        phone: string,
        addresses: Address[],
        preferences: {
            language: string,
            currency: string,
            notifications: {
                email: boolean,
                sms: boolean,
                push: boolean
            }
        },
        createdAt: string,
        updatedAt: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Update Profile
```typescript
PUT /api/v1/customer/profile
Content-Type: application/json

Request Body:
{
    name?: string,
    phone?: string,
    preferences?: {
        language?: string,
        currency?: string,
        notifications?: {
            email?: boolean,
            sms?: boolean,
            push?: boolean
        }
    }
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        profile: CustomerProfile
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
GET /api/v1/customer/orders

Query Parameters:
{
    page: number,        // Required, starts from 1
    limit: number,       // Required, max 50
    query?: string,      // Search query
    sortField?: string,  // Field to sort by
    sortDirection?: 'asc' | 'desc',
    status?: OrderStatus,
    startDate?: string,  // ISO date
    endDate?: string     // ISO date
}

Response:
{
    success: boolean,
    data?: {
        orders: Order[],
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

### Get Order Details
```typescript
GET /api/v1/customer/orders/:awb

Response:
{
    success: boolean,
    data?: {
        order: Order,
        tracking: {
            status: string,
            currentLocation: string,
            estimatedDelivery: string,
            timeline: TrackingEvent[]
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Download Order Label

Download the shipping label for an order.

**Endpoint:** `GET /api/v1/customer/orders/awb/:awb/label`

## Track Order

### Get Order Tracking
```typescript
GET /api/v1/customer/orders/:awb/tracking

Response:
{
    success: boolean,
    data?: {
        awb: string,
        status: string,
        currentLocation: string,
        estimatedDelivery: string,
        timeline: {
            status: string,
            location: string,
            timestamp: string,
            description: string
        }[],
        courier: {
            name: string,
            trackingUrl: string,
            phone: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Subscribe to Tracking Updates
```typescript
POST /api/v1/customer/orders/:awb/tracking/subscribe
Content-Type: application/json

Request Body:
{
    channels: ('email' | 'sms' | 'push')[],
    frequency: 'realtime' | 'daily' | 'status-change'
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        subscription: {
            id: string,
            channels: string[],
            frequency: string,
            status: 'active' | 'paused'
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Payment

### Create Payment Order
```typescript
POST /api/v1/customer/payments/create-order
Content-Type: application/json

Request Body:
{
    amount: number,      // Total amount in INR
    currency: string,    // "INR"
    awbNumber: string,   // Order AWB number
    paymentMethod: 'upi' | 'card' | 'netbanking'
}

Response:
{
    success: boolean,
    data?: {
        orderId: string,  // Razorpay order ID
        keyId: string,    // Razorpay key ID
        amount: number,
        currency: string
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Verify Payment
```typescript
POST /api/v1/customer/payments/verify
Content-Type: application/json

Request Body:
{
    awbNumber: string,
    razorpay_payment_id: string,
    razorpay_order_id: string,
    razorpay_signature: string
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        payment: {
            id: string,
            status: 'completed',
            amount: number,
            currency: string,
            orderId: string,
            timestamp: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Create Order

### Create Order
```typescript
POST /api/v1/customer/orders
Content-Type: application/json

Request Body:
{
    pickupAddress: {
        name: string,
        phone: string,
        address1: string,
        address2?: string,
        city: string,
        state: string,
        pincode: string,
        country: string
    },
    deliveryAddress: {
        name: string,
        phone: string,
        address1: string,
        address2?: string,
        city: string,
        state: string,
        pincode: string,
        country: string
    },
    package: {
        weight: number,      // in kg
        dimensions: {
            length: number,  // in cm
            width: number,   // in cm
            height: number   // in cm
        },
        items: {
            name: string,
            quantity: number,
            value: number
        }[]
    },
    serviceType: 'standard' | 'express' | 'cod',
    paymentMethod: string,
    instructions?: string,
    pickupDate: string      // ISO date
}

Response:
{
    success: boolean,
    data?: {
        message: string,
        order: {
            id: string,
            awb: string,
            status: string,
            estimatedDelivery: string,
            amount: number,
            label: string,
            createdAt: string
        }
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Services

### List Available Services
```typescript
GET /api/v1/customer/services

Response:
{
    success: boolean,
    data?: {
        services: {
            id: string,
            name: string,
            description: string,
            type: 'standard' | 'express' | 'cod',
            price: number,
            estimatedDelivery: string,
            features: string[]
        }[]
    },
    error?: {
        code: string,
        message: string
    }
}
```

### Check Service Availability
```typescript
POST /api/v1/customer/services/check-availability
Content-Type: application/json

Request Body:
{
    pickupPincode: string,
    deliveryPincode: string,
    package: {
        weight: number,
        dimensions: {
            length: number,
            width: number,
            height: number
        }
    }
}

Response:
{
    success: boolean,
    data?: {
        available: boolean,
        services: {
            id: string,
            name: string,
            price: number,
            estimatedDelivery: string
        }[]
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Data Models

### Address
```typescript
interface Address {
    id?: string;
    name: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
```

### Order
```typescript
interface Order {
    id: string;
    awb: string;
    status: OrderStatus;
    pickupAddress: Address;
    deliveryAddress: Address;
    package: {
        weight: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
        items: {
            name: string;
            quantity: number;
            value: number;
        }[];
    };
    serviceType: 'standard' | 'express' | 'cod';
    paymentMethod: string;
    amount: number;
    estimatedDelivery: string;
    createdAt: string;
    updatedAt: string;
}
```

### Order Status
```typescript
type OrderStatus = 
    | 'Booked'
    | 'Processing'
    | 'In Transit'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Failed'
    | 'Cancelled';
```

### Tracking Event
```typescript
interface TrackingEvent {
    status: string;
    location: string;
    timestamp: string;
    description: string;
    code?: string;
}
```

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
```

### Common Error Codes
- `INVALID_CREDENTIALS`: Invalid phone/email or password
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

## Rate Calculation

### Calculate Shipping Rates
```typescript
POST /api/v1/customer/rates/calculate
Content-Type: application/json

Request Body:
{
    weight: number,          // Actual weight in kg
    length: number,          // Length in cm
    width: number,          // Width in cm
    height: number,         // Height in cm
    pickupPincode: string,  // Sender's pincode
    deliveryPincode: string // Receiver's pincode
}

Response:
{
    success: boolean,
    data?: {
        rates: Array<{
            partner: {
                id: string,
                name: string,
                expressDelivery: boolean,
                estimatedDays: string
            },
            totalRate: number,
            volumetricWeight: number,
            breakdown: {
                baseRate: number,
                weightCharge: number,
                volumetricCharge: number
            }
        }>
    },
    error?: {
        code: string,
        message: string
    }
}
```

## Delivery Partner Integration

### Overview
The system integrates with multiple delivery partners to provide shipping services. Each partner has their own API for rate calculation, tracking, and label generation.

### Partner APIs
```typescript
// BlueDart API Integration
POST /api/v1/partners/bluedart/calculate-rate
Content-Type: application/json

// Delhivery API Integration
POST /api/v1/partners/delhivery/calculate-rate
Content-Type: application/json

// DTDC API Integration
POST /api/v1/partners/dtdc/calculate-rate
Content-Type: application/json

// FedEx API Integration
POST /api/v1/partners/fedex/calculate-rate
Content-Type: application/json

// DHL API Integration
POST /api/v1/partners/dhl/calculate-rate
Content-Type: application/json

// Xpressbees API Integration
POST /api/v1/partners/xpressbees/calculate-rate
Content-Type: application/json
```

### Partner API Requirements
Each delivery partner integration requires:
1. Authentication credentials
2. Rate calculation parameters
3. Service availability check
4. Real-time tracking integration
5. Label generation
6. Pickup scheduling

### Partner API Response Format
```typescript
interface PartnerApiResponse {
    success: boolean;
    data?: {
        rate: number;
        estimatedDelivery: string;
        serviceAvailable: boolean;
        error?: string;
    };
    error?: {
        code: string;
        message: string;
    };
}
```

### Partner API Error Codes
- `PARTNER_AUTH_FAILED`: Authentication failed with partner
- `PARTNER_SERVICE_UNAVAILABLE`: Partner service unavailable
- `PARTNER_RATE_CALCULATION_FAILED`: Failed to calculate rate
- `PARTNER_TRACKING_FAILED`: Failed to get tracking info
- `PARTNER_LABEL_GENERATION_FAILED`: Failed to generate label
- `PARTNER_PICKUP_SCHEDULING_FAILED`: Failed to schedule pickup 