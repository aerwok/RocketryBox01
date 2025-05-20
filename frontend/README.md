# Rocketry Box

A modern e-commerce platform optimized for rocket parts and accessories.

## Overview

Rocketry Box is a specialized e-commerce platform built with React and TypeScript, designed specifically for rocket enthusiasts. The platform offers a comprehensive shopping experience with features tailored to both customers and sellers of rocket parts and accessories.

## Features

- **Customer Portal**: Browse products, manage orders, track shipments
- **Seller Dashboard**: Manage inventory, track sales, process orders
- **Admin Panel**: Moderate users, handle disputes, manage platform settings
- **Responsive Design**: Optimized for desktop and mobile devices
- **Mock API Mode**: Development and demonstration without backend dependencies

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query, Context API
- **Routing**: React Router
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rocketrybox.git
   cd rocketrybox
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Development

### Environment Variables

Create a `.env.local` file in the root directory with:

```
VITE_USE_MOCK_API=true
VITE_API_URL=
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
├── public/             # Static assets
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable UI components
│   ├── config/         # Application configuration
│   ├── features/       # Feature-specific components and logic
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Page layout components
│   ├── lib/            # Utility libraries
│   ├── pages/          # Page components
│   ├── providers/      # Context providers
│   ├── services/       # API services
│   ├── store/          # State management
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── .env.production     # Production environment variables
├── vercel.json         # Vercel deployment configuration
└── vite.config.ts      # Vite configuration
```

## License

[MIT](LICENSE)

## Documentation

- [API Documentation](./FRONTEND-API-DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)

# Rocketry Box - Frontend to Backend Integration Guide

## Marketing Section API Integration

### 1. Contact Form
**Route**: `/contact`
- **Endpoint**: POST `/api/v1/marketing/contact`
- **Request Body**:
  ```typescript
  {
    name: string,      // min: 2, max: 50 characters
    email: string,     // valid email format
    subject: string,   // min: 5, max: 100 characters
    message: string,   // min: 10, max: 1000 characters
    companyName?: string  // optional
  }
  ```
- **Success Response**: 200 OK
- **Error Response**: 
  ```typescript
  {
    status: number,
    message: string,
    errors?: Record<string, string[]>
  }
  ```

### 2. Tracking Form
**Route**: `/track`
- **Endpoint**: GET `/api/v1/shipments/track/:trackingId`
- **Parameters**:
  - trackingId: string (format: RB-XXXXX-XXXXX)
- **Success Response**:
  ```typescript
  {
    trackingId: string,
    status: string,
    currentLocation: string,
    estimatedDelivery: string,
    timeline: Array<{
      status: string,
      location: string,
      timestamp: string,
      description: string
    }>
  }
  ```

## Customer Section API Integration

### 1. Authentication
#### Login
**Route**: `/customer/login`
- **Endpoint**: POST `/api/v1/customer/auth/login`
- **Request Body**:
  ```typescript
  {
    phoneOrEmail: string,    // can be email or 10-digit phone
    password: string,        // required
    otp?: string,           // 6 digits (required for forgot password)
    rememberMe: boolean     // optional, defaults to false
  }
  ```
- **Validation Rules**:
  - phoneOrEmail: Must be either valid email or 10-digit phone number
  - password: Required for normal login
  - otp: Required only for forgot password flow, must be 6 digits
- **Success Response**: 
  ```typescript
  {
    token: string,
    user: {
      id: string,
      name: string,
      email: string,
      phone: string,
      role: 'customer'
    }
  }
  ```

#### Register
**Route**: `/customer/register`
- **Endpoint**: POST `/api/v1/customer/auth/register`
- **Request Body**:
  ```typescript
  {
    name: string,          // min 2 characters
    mobile: string,        // exactly 10 digits
    mobileOtp: string,     // exactly 6 digits
    email: string,         // valid email format
    emailOtp: string,      // exactly 6 digits
    password: string,      // see password rules below
    confirmPassword: string,// must match password
    address1: string,      // required
    address2?: string,     // optional
    city: string,         // required
    state: string,        // required
    pincode: string,      // exactly 6 digits
    acceptTerms: boolean   // must be true
  }
  ```
- **Password Rules**:
  ```typescript
  password: {
    minLength: 8,
    requirements: [
      "At least one uppercase letter",
      "At least one lowercase letter",
      "At least one number",
      "At least one special character"
    ]
  }
  ```

#### OTP Verification Endpoints
1. **Send Mobile OTP**
   - **Endpoint**: POST `/api/v1/customer/auth/send-mobile-otp`
   - **Request Body**: `{ mobile: string }`

2. **Send Email OTP**
   - **Endpoint**: POST `/api/v1/customer/auth/send-email-otp`
   - **Request Body**: `{ email: string }`

3. **Verify OTP (Forgot Password)**
   - **Endpoint**: POST `/api/v1/customer/auth/verify-otp`
   - **Request Body**:
     ```typescript
     {
       phoneOrEmail: string,
       otp: string,      // 6 digits
       type: 'mobile' | 'email'
     }
     ```

### Error Response Structure
```typescript
{
  status: number,
  message: string,
  errors?: {
    [key: string]: string[]
  }
}
```

### 2. Orders
#### Create Order
**Route**: `/customer/create-order`
- **Endpoint**: POST `/api/v1/customer/orders`
- **Request Body**:
  ```typescript
  {
    pickupAddress: {
      street: string,
      city: string,
      state: string,
      pincode: string,
      country: string,
      contactName: string,
      contactPhone: string
    },
    deliveryAddress: {
      street: string,
      city: string,
      state: string,
      pincode: string,
      country: string,
      contactName: string,
      contactPhone: string
    },
    package: {
      weight: number,  // in kg
      length: number,  // in cm
      width: number,   // in cm
      height: number,  // in cm
      items: Array<{
        name: string,
        quantity: number,
        value: number
      }>,
      totalValue: number
    },
    serviceType: 'express' | 'standard',
    paymentMethod: 'prepaid' | 'cod'
  }
  ```

#### List Orders
**Route**: `/customer/orders`
- **Endpoint**: GET `/api/v1/customer/orders`
- **Query Parameters**:
  ```typescript
  {
    page?: number,
    limit?: number,
    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  }
  ```

#### Order Details
**Route**: `/customer/orders/:id`
- **Endpoint**: GET `/api/v1/customer/orders/:orderId`
- **Success Response**:
  ```typescript
  {
    id: string,
    trackingId: string,
    status: string,
    createdAt: string,
    updatedAt: string,
    pickupAddress: Address,
    deliveryAddress: Address,
    package: PackageDetails,
    timeline: Array<{
      status: string,
      location: string,
      timestamp: string,
      description: string
    }>,
    payment: {
      status: string,
      method: string,
      amount: number
    }
  }
  ```

### 3. Profile Management
**Route**: `/customer/profile`
- **Endpoint**: GET `/api/v1/customer/profile`
- **Update Endpoint**: PUT `/api/v1/customer/profile`
- **Request Body** (for update):
  ```typescript
  {
    name?: string,
    phone?: string,
    address?: {
      street: string,
      city: string,
      state: string,
      pincode: string,
      country: string
    },
    email?: string,
    password?: {
      current: string,
      new: string
    }
  }
  ```

### 4. Payment
**Route**: `/customer/payment`
- **Endpoint**: POST `/api/v1/customer/payment/initiate`
- **Request Body**:
  ```typescript
  {
    orderId: string,
    amount: number,
    currency: string,
    paymentMethod: 'card' | 'upi' | 'netbanking'
  }
  ```
- **Success Response**:
  ```typescript
  {
    paymentId: string,
    orderId: string,
    amount: number,
    currency: string,
    paymentUrl: string  // Redirect URL for payment gateway
  }
  ```

## Environment Variables Required
```env
VITE_API_URL=http://localhost:8000  # Base URL for API calls
```
