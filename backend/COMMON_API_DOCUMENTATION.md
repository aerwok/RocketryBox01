# RocketryBox Common API Documentation

## Overview
This documentation details the Common API endpoints for the RocketryBox shipping aggregator platform. The common section provides shared functionality used across different parts of the application, such as pincode validation and location data.

## Base URL
```
https://api.rocketrybox.com/api/pincodes
```

## HTTP Status Codes
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
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

### 1. Pincode Search
Base path: `/search`

#### Search Pincodes
```http
GET /search
```
Searches for pincodes with optional filters.

**Query Parameters:**
- `q`: Search query (optional)
- `state`: Filter by state (optional)
- `district`: Filter by district (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "pincode": "400001",
        "state": "Maharashtra",
        "district": "Mumbai",
        "city": "Mumbai",
        "area": "Fort"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

---

### 2. States
Base path: `/states`

#### Get All States
```http
GET /states
```
Returns a list of all states in India.

**Response:**
```json
{
  "success": true,
  "data": {
    "states": [
      {
        "name": "Maharashtra",
        "code": "MH"
      }
    ]
  }
}
```

#### Get Districts by State
```http
GET /states/:state/districts
```
Returns a list of districts for a specific state.

**Path Parameters:**
- `state`: State name or code

**Response:**
```json
{
  "success": true,
  "data": {
    "districts": [
      {
        "name": "Mumbai",
        "code": "MUM"
      }
    ]
  }
}
```

---

### 3. Pincode Details
Base path: `/:pincode`

#### Get Pincode Details
```http
GET /:pincode
```
Returns detailed information for a specific pincode.

**Path Parameters:**
- `pincode`: 6-digit pincode

**Response:**
```json
{
  "success": true,
  "data": {
    "pincode": "400001",
    "state": "Maharashtra",
    "district": "Mumbai",
    "city": "Mumbai",
    "area": "Fort",
    "postOffice": "Fort Post Office",
    "isServiceable": true,
    "deliveryOptions": {
      "standard": true,
      "express": true,
      "sameDay": false
    }
  }
}
```

---

## Frontend Integration Tips

1. **Error Handling**
   - Implement client-side validation for pincode format
   - Show validation errors inline
   - Handle rate limiting errors gracefully
   - Implement retry mechanism for failed requests

2. **Form Handling**
   - Implement pincode auto-complete
   - Show loading states during search
   - Cache frequently used pincode data
   - Implement debouncing for search inputs

3. **Performance**
   - Implement request caching for static data (states, districts)
   - Use optimistic updates
   - Implement request debouncing for search
   - Show loading states for better UX

4. **UX Considerations**
   - Show pincode validation feedback in real-time
   - Provide clear error messages for invalid pincodes
   - Implement auto-suggest for pincode search
   - Show delivery options based on pincode

## Support
For API support or to report issues:
- Email: common-support@rocketrybox.com
- Support Portal: https://support.rocketrybox.com/common
- Emergency Contact: +1-XXX-XXX-XXXX 