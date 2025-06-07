// Common Types
export type UserRole = 'customer' | 'seller' | 'admin' | 'super-admin' | 'support' | 'operations' | 'finance';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type DocumentStatus = 'verified' | 'pending' | 'rejected';
export type PaymentType = 'COD' | 'Prepaid';
export type OrderStatus = 'not-booked' | 'processing' | 'booked' | 'cancelled' | 'shipment-cancelled' | 'error';
export type ShippingMode = 'surface' | 'air';

// User Types
export interface BaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Customer extends BaseUser {
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  wallet?: {
    balance: number;
    lastRecharge: number;
  };
}

export interface Seller extends BaseUser {
  companyName: string;
  businessName?: string;
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
  settings?: {
    autoFetch?: boolean;
    autoCreate?: boolean;
    autoNotify?: boolean;
    defaultShippingMode?: "surface" | "air";
    autoSelectCourier?: boolean;
    codAvailable?: boolean;
    courierSettings?: {
      courierId: number;
      enabled: boolean;
      priority: number;
    }[];
    labelSettings?: {
      size: string;
      format: string;
      logo?: string;
      showLogo: boolean;
      showBarcode: boolean;
      showReturn: boolean;
      additionalText: string;
    };
    whatsappSettings?: {
      enabled: boolean;
      businessNumber?: string;
      apiKey?: string;
      notifications: {
        orderConfirmation: boolean;
        orderPacked: boolean;
        outForDelivery: boolean;
        deliveryConfirmation: boolean;
        deliveryFailed: boolean;
        returnInitiated: boolean;
        returnPicked: boolean;
        returnDelivered: boolean;
      };
      templates?: {
        orderConfirmation?: string;
        deliveryConfirmation?: string;
      };
    };
    apiSettings?: {
      apiKey: string;
      apiSecret: string;
      enabled: boolean;
      webhookEnabled: boolean;
      webhookUrl: string;
    };
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
    documents: {
      name: string;
      type: string;
      url: string;
      status: DocumentStatus;
    }[];
  };
  bankDetails?: {
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
      status: DocumentStatus;
    };
  }[];
}

export interface Admin extends BaseUser {
  department: string;
  designation: string;
  permissions: string[];
  notes?: string;
}

// Order Types
export interface Order {
  id: string;
  orderId: string;
  date: string;
  customer: string;
  contact: string;
  items: {
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }[];
  amount: string;
  payment: PaymentType;
  channel: 'MANUAL' | 'EXCEL' | 'SHOPIFY' | 'WOOCOMMERCE' | 'AMAZON' | 'FLIPKART' | 'OPENCART' | 'API';
  weight: string;
  tags: string;
  action: 'Ship' | 'Processing' | 'In Transit' | 'Cancelled' | 'Error' | 'Pending';
  whatsapp: 'Message Delivered' | 'Message Read' | 'Order Confirm' | 'Order Cancelled';
  status: OrderStatus;
  awbNumber?: string;
  pincode?: string;
  pickupAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };
  package?: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    declaredValue: number;
    description: string;
  };
}

// Shipping Types
export interface ShippingOptions {
  warehouse: string;
  rtoWarehouse: string;
  shippingMode: ShippingMode;
  courier: string;
}

export interface ShippingRate {
  courier: string;
  mode: string;
  zone: string;
  baseCharge: number;
  codCharge: number;
  gst: number;
  total: number;
  expectedDelivery: string;
}

// Wallet Types
export interface WalletBalance {
  walletBalance: number;
  lastRecharge: number;
  remittanceBalance: number;
  lastUpdated: string;
}

export interface WalletTransaction {
  transactionId: string;
  date: string;
  type: 'Credit' | 'Debit';
  amount: number;
  balance: number;
  description: string;
  status: 'Success' | 'Pending' | 'Failed';
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: unknown;
  data?: any; // Raw error response data
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// WebSocket Types
export type WebSocketEvent =
  | 'order_status_changed'
  | 'payment_received'
  | 'notification'
  | 'system_alert'
  | 'chat_message';

export interface WebSocketMessage<T> {
  event: WebSocketEvent;
  data: T;
  timestamp: string;
}

// File Upload Types
export type FileType = 'invoice' | 'evidence' | 'profile' | 'product' | 'document';

export interface UploadResponse {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

// Error Types
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'DUPLICATE_ENTITY'
  | 'RESOURCE_EXHAUSTED';

// Rate Limiting Types
export interface RateLimitHeaders {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
}

// Validation Rules
export interface ValidationRule {
  field: string;
  required: boolean;
  type: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
}

// WebSocket Types
export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: string;
}

export interface NewOrder {
  orderId: string;
  customer: {
    name: string;
    email: string;
  };
  total: number;
  timestamp: string;
}

export interface LedgerTransaction {
  transactionId: string;
  transactionNumber: string;
  transactionType: string;
  amount: string;
  creditDebit: 'Credit' | 'Debit';
  closingBalance: string;
  timestamp: string;
}

export interface WeightDisputeUpdate {
  disputeId: string;
  orderId: string;
  awbNumber: string;
  status: 'Raised' | 'Under Review' | 'Resolved' | 'Rejected';
  originalWeight: string;
  chargedWeight: string;
  difference: string;
  timestamp: string;
}

// Error Codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
} as const;

// Rate Limits
export const RATE_LIMITS = {
  authenticated: 100,
  unauthenticated: 20,
} as const;
