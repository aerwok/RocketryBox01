# RocketryBox Customer API Documentation

## Overview
This documentation details the Customer API endpoints for the RocketryBox shipping aggregator platform. The customer section provides tools for registration, profile management, order placement, payment, tracking, and serviceability.

## Base URL
```
https://api.rocketrybox.com/api/customer
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Token Management
- Tokens expire after 24 hours by default
- Extended validity (30 days) available with `rememberMe` option
- Refresh token is provided in the login response
- Use refresh token to get new access token before expiry
- Store tokens securely (preferably in HTTP-only cookies)

## Rate Limiting
- Default endpoints: 100 requests per 15 minutes
- Auth endpoints: 20 requests per 15 minutes
- Payment endpoints: 20 requests per 15 minutes
- Tracking endpoints: 20 requests per 15 minutes
- Refund endpoints: 20 requests per 15 minutes

## Common Response Format
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "error": null
}
```

## Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Common Validation Errors
- `INVALID_EMAIL`: Invalid email format
- `INVALID_PHONE`: Invalid phone number format
- `REQUIRED_FIELD`: Required field missing
- `INVALID_DATE`: Invalid date format (use YYYY-MM-DD)
- `INVALID_STATUS`: Invalid status value
- `DUPLICATE_ENTRY`: Resource already exists
- `INVALID_FILE`: Invalid file type or size
- `INVALID_PINCODE`: Invalid pincode format

## Pagination
All list endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination response format:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

## Date/Time Format
- Use ISO 8601 format for all dates: `YYYY-MM-DDTHH:mm:ssZ`
- Timezone: UTC
- Date-only format: `YYYY-MM-DD`

## API Endpoints

### 1. Authentication
Base path: `/auth`

#### Register
```http
POST /auth/register
```
Registers a new customer account.

**Request Body:**
```json
{
  "name": "string",          // Required, 2-50 characters
  "email": "string",         // Required, valid email
  "phone": "string",         // Required, valid Indian phone number
  "password": "string",      // Required, min 8 chars, 1 uppercase, 1 number
  "confirmPassword": "string", // Required, must match password
  "acceptTerms": boolean     // Required, must be true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "createdAt": "string"
    }
  }
}
```

#### Login
```http
POST /auth/login
```
Authenticates a customer.

**Request Body:**
```json
{
  "phoneOrEmail": "string",  // Required, can be phone or email
  "password": "string",      // Required
  "otp": "string",          // Optional, for password reset
  "rememberMe": boolean     // Optional, for extended token validity
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": "string",   // "1d" or "30d"
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string"
    }
  }
}
```

#### Send OTP
```http
POST /auth/otp/send
```
Sends an OTP for verification.

**Request Body:**
```json
{
  "phoneOrEmail": "string",  // Required, can be phone or email
  "purpose": "string"        // Required, one of: "login", "reset", "verify"
}
```

#### Verify OTP
```http
POST /auth/otp/verify
```
Verifies the OTP sent to the customer.

**Request Body:**
```json
{
  "phoneOrEmail": "string",  // Required, can be phone or email
  "otp": "string"           // Required
}
```

### 2. Profile Management
Base path: `/profile`

#### Get Profile
```http
GET /profile
```
Returns the current customer's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "preferences": {
      "language": "string",    // "en" or "hi"
      "currency": "string",    // "INR" or "USD"
      "notifications": {
        "email": boolean,
        "sms": boolean,
        "push": boolean
      }
    },
    "isEmailVerified": boolean,
    "isPhoneVerified": boolean,
    "status": "string",        // "active", "inactive", "suspended"
    "addresses": [
      {
        "name": "string",
        "phone": "string",
        "address1": "string",
        "address2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string",
        "isDefault": boolean
      }
    ],
    "lastLogin": "string",
    "lastActive": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

#### Update Profile
```http
PUT /profile
```
Updates the customer's profile.

**Request Body:**
```json
{
  "name": "string",           // Optional, 2-50 characters
  "phone": "string",          // Optional, valid Indian phone number
  "preferences": {
    "language": "string",     // Optional, "en" or "hi"
    "currency": "string",     // Optional, "INR" or "USD"
    "notifications": {
      "email": boolean,       // Optional
      "sms": boolean,         // Optional
      "push": boolean         // Optional
    }
  }
}
```

### 3. Order Management
Base path: `/orders`

#### Calculate Shipping Rates
```http
POST /orders/rates
```
Calculates shipping rates for a new order.

**Request Body:**
```json
{
  "pickup": {
    "pincode": "string",
    "city": "string",
    "state": "string"
  },
  "delivery": {
    "pincode": "string",
    "city": "string",
    "state": "string"
  },
  "package": {
    "weight": "number",      // in grams
    "length": "number",      // in cm
    "breadth": "number",     // in cm
    "height": "number"       // in cm
  },
  "serviceType": "string",   // "standard", "express", "priority"
  "cod": boolean            // Cash on delivery required
}
```

#### Create Order
```http
POST /orders
```
Creates a new order.

**Request Body:**
```json
{
  "pickup": {
    "name": "string",
    "phone": "string",
    "address1": "string",
    "address2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "string"
  },
  "delivery": {
    "name": "string",
    "phone": "string",
    "address1": "string",
    "address2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "string"
  },
  "package": {
    "weight": "number",
    "length": "number",
    "breadth": "number",
    "height": "number",
    "description": "string"
  },
  "serviceType": "string",
  "cod": boolean,
  "amount": "number",
  "paymentMethod": "string"
}
```

#### List Orders
```http
GET /orders
```
Lists customer's orders.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 10, max: 50
- `status` (optional): Filter by status
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `search` (optional): Search by order ID or AWB

#### Get Order Details
```http
GET /orders/:id
```
Gets details of a specific order.

#### Download Label
```http
GET /orders/:id/label
```
Downloads the shipping label for an order.

### 4. Payment Management
Base path: `/orders/:id/payment`

#### Create Payment
```http
POST /orders/:id/payment
```
Initiates payment for an order.

#### Verify Payment
```http
POST /orders/:id/payment/verify
```
Verifies payment status.

#### Check Payment Status
```http
GET /orders/:id/payment/status
```
Checks the current payment status.

### 5. Tracking Management
Base path: `/orders/:id/tracking`

#### Subscribe to Tracking
```http
POST /orders/:id/tracking
```
Subscribes to order tracking updates.

### 6. Service Management
Base path: `/services`

#### List Services
```http
GET /services
```
Lists available shipping services.

#### Check Availability
```http
POST /services/check
```
Checks service availability for a location.

### 7. Webhooks
Base path: `/webhooks`

#### Tracking Webhook
```http
POST /webhooks/tracking
```
Receives tracking updates from courier partners.

## Frontend Integration Tips

1. **Error Handling**
   - Implement global error handler for API responses
   - Show user-friendly error messages
   - Handle token expiration and refresh flow
   - Implement retry mechanism for failed requests

2. **Form Handling**
   - Implement client-side validation
   - Show validation errors inline
   - Handle form submission states
   - Implement auto-save for long forms

3. **Authentication**
   - Implement secure token storage
   - Handle token refresh flow
   - Redirect to login on authentication errors
   - Show session timeout warnings

4. **Performance**
   - Implement request caching
   - Use optimistic updates
   - Implement request debouncing
   - Show loading states for better UX

## Support
For API support or to report issues:
- Email: customer-support@rocketrybox.com
- Support Portal: https://support.rocketrybox.com/customer
- Emergency Contact: +1-XXX-XXX-XXXX 