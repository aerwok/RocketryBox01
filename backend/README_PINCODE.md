# Pincode Data Import and Usage Guide

This document explains how to import and use the Indian Pincode data in the Rocketry Box backend.

## Overview

The backend includes a complete solution for importing, storing, and accessing India's pincode data, which includes:
- 6-digit pincode
- Post office name
- District
- State
- Region
- Circle
- Taluk

## Importing Pincode Data

To import the pincode data into your MongoDB database, follow these steps:

1. Ensure your MongoDB connection is properly configured in the `.env` file:
   ```
   MONGODB_ATLAS_URI=your_mongodb_connection_string
   ```

2. Run the import script:
   ```
   node src/scripts/import-pincodes.js
   ```

3. For a fresh import (overwriting existing data), use the `--force` flag:
   ```
   node src/scripts/import-pincodes.js --force
   ```

4. To force download a new copy of the source CSV, use:
   ```
   node src/scripts/import-pincodes.js --force-download
   ```

## API Endpoints

The following API endpoints are available for pincode lookups:

### Get Pincode Details

```
GET /api/pincodes/:pincode
```

Example response:
```json
{
  "success": true,
  "data": {
    "_id": "1234567890",
    "pincode": "110001",
    "officeName": "Connaught Place",
    "district": "Central Delhi",
    "state": "Delhi",
    "region": "Delhi",
    "circle": "Delhi",
    "taluk": "New Delhi"
  }
}
```

### Search Pincodes

```
GET /api/pincodes/search
```

Query parameters:
- `pincode` - Search by pincode (partial match)
- `district` - Search by district name
- `state` - Search by state name
- `officeName` - Search by post office name
- `limit` - Number of results per page (default: 50)
- `page` - Page number (default: 1)

Example response:
```json
{
  "success": true,
  "pincodes": [
    {
      "_id": "1234567890",
      "pincode": "110001",
      "officeName": "Connaught Place",
      "district": "Central Delhi",
      "state": "Delhi",
      "region": "Delhi",
      "circle": "Delhi",
      "taluk": "New Delhi"
    }
  ],
  "pagination": {
    "totalResults": 120,
    "totalPages": 3,
    "currentPage": 1,
    "limit": 50
  }
}
```

### Get All States

```
GET /api/pincodes/states
```

Example response:
```json
{
  "success": true,
  "data": [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "..."
  ]
}
```

### Get Districts by State

```
GET /api/pincodes/states/:state/districts
```

Example response:
```json
{
  "success": true,
  "data": [
    "Alipurduar",
    "Bankura",
    "Birbhum",
    "..."
  ]
}
```

## Integration in Frontend

You can use these APIs in your frontend to:
1. Create address forms with state and district dropdowns
2. Validate pincodes
3. Auto-fill district and state when a user enters a pincode
4. Search for pincodes by location

## Data Source

The pincode data is sourced from publicly available Indian pincode directories. The import script downloads the data from a GitHub repository that maintains an up-to-date collection of Indian pincodes. 