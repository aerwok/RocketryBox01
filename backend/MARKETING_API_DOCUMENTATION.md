# RocketryBox Marketing API Documentation

## Overview
This documentation details the Marketing API endpoints for the RocketryBox shipping aggregator platform. The marketing section provides tools for contact form submissions, partner registration, and tracking management.

## Base URL
```
https://api.rocketrybox.com/api/marketing
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Common Response Format
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "timestamp": "2024-03-20T10:00:00Z"
}
```

## Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Specific field error if applicable"
    }
  },
  "timestamp": "2024-03-20T10:00:00Z"
}
```

## Rate Limiting
- All endpoints are rate limited
- Default limit: 100 requests per 15 minutes
- Exceeded limit response: 429 Too Many Requests

---

## API Endpoints

### 1. Contact Form
Base path: `/contact`

#### Submit Contact Form
```http
POST /contact
```
Submits a contact form message.

**Request Body:**
```json
{
  "email": "contact@example.com",
  "message": "Your message here"
}
```

**Validation Rules:**
- Email must be valid
- Message is required

---

### 2. Partner Registration
Base path: `/partner`

#### Register Partner
```http
POST /partner/register
```
Registers a new business partner.

**Request Body:**
```json
{
  "name": "Partner Name",
  "email": "partner@example.com",
  "phone": "+1234567890",
  "businessName": "Business Name",
  "businessType": "Retail|E-commerce|Other",
  "message": "Additional information"
}
```

**Validation Rules:**
- Name is required
- Email must be valid
- Phone is required
- Business name is required
- Business type is required
- Message is required

---

### 3. Contact Management (Admin Only)
Base path: `/contacts`

#### List All Contacts
```http
GET /contacts
```
Returns a list of all contact form submissions.

**Authentication Required:** Yes
**Role Required:** Admin

#### Get Contact by ID
```http
GET /contacts/:id
```
Returns details of a specific contact submission.

**Path Parameters:**
- `id`: Contact ID

**Authentication Required:** Yes
**Role Required:** Admin

---

### 4. Partner Management (Admin Only)
Base path: `/partners`

#### List All Partners
```http
GET /partners
```
Returns a list of all registered partners.

**Authentication Required:** Yes
**Role Required:** Admin

#### Update Partner Status
```http
PATCH /partners/:id/status
```
Updates the status of a partner registration.

**Path Parameters:**
- `id`: Partner ID

**Request Body:**
```json
{
  "status": "approved|rejected|pending"
}
```

**Authentication Required:** Yes
**Role Required:** Admin

---

### 5. Tracking Management (Admin Only)
Base path: `/tracking`

#### List All Tracking
```http
GET /tracking
```
Returns a list of all tracking entries.

**Authentication Required:** Yes
**Role Required:** Admin

#### Get Tracking Info
```http
GET /tracking/:id
```
Returns details of a specific tracking entry.

**Path Parameters:**
- `id`: Tracking ID

**Authentication Required:** Yes
**Role Required:** Admin

#### Update Tracking Status
```http
PATCH /tracking/:id/status
```
Updates the status of a tracking entry.

**Path Parameters:**
- `id`: Tracking ID

**Request Body:**
```json
{
  "status": "active|inactive|completed"
}
```

**Authentication Required:** Yes
**Role Required:** Admin

---

## Frontend Integration Tips

1. **Error Handling**
   - Implement client-side validation for required fields
   - Show validation errors inline
   - Handle rate limiting errors gracefully
   - Implement retry mechanism for failed requests

2. **Form Handling**
   - Implement client-side validation
   - Show loading states during submission
   - Clear form after successful submission
   - Implement auto-save for long forms

3. **Authentication**
   - Handle unauthorized access gracefully
   - Redirect to login when needed
   - Show appropriate error messages

4. **Performance**
   - Implement request caching where appropriate
   - Use optimistic updates
   - Implement request debouncing
   - Show loading states for better UX

## Support
For API support or to report issues:
- Email: marketing-support@rocketrybox.com
- Support Portal: https://support.rocketrybox.com/marketing
- Emergency Contact: +1-XXX-XXX-XXXX 