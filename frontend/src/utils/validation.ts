// Constants
export const MAX_RECHARGE_AMOUNT = 100000; // ₹1,00,000
export const MIN_RECHARGE_AMOUNT = 10; // ₹10 (matching backend validation)
export const VALID_PAYMENT_METHODS = ['remittance', 'onlineBanking'] as const;
export const VALID_USER_ROLES = ['customer', 'seller', 'admin', 'super-admin'] as const;
export const VALID_USER_STATUSES = ['active', 'inactive', 'suspended', 'pending_verification'] as const;
export const VALID_DOCUMENT_STATUSES = ['verified', 'pending', 'rejected'] as const;
export const VALID_PAYMENT_TYPES = ['COD', 'Prepaid'] as const;
export const VALID_ORDER_STATUSES = ['not-booked', 'processing', 'booked', 'cancelled', 'shipment-cancelled', 'error'] as const;
export const VALID_SHIPPING_MODES = ['surface', 'air'] as const;

// Field length limits
export const FIELD_LIMITS = {
    name: { min: 2, max: 100 },
    email: { max: 255 },
    phone: { min: 10, max: 15 },
    password: { min: 8, max: 50 },
    address: {
        street: { max: 200 },
        city: { max: 100 },
        state: { max: 100 },
        pincode: { min: 6, max: 10 },
        country: { max: 100 }
    },
    company: {
        name: { max: 200 },
        category: { max: 100 },
        brand: { max: 100 },
        website: { max: 255 }
    },
    document: {
        gstin: { min: 15, max: 15 },
        pan: { min: 10, max: 10 },
        cin: { min: 21, max: 21 },
        aadhaar: { min: 12, max: 12 }
    }
} as const;

// Validation functions
export const validateAmount = (amount: number): boolean => {
    return amount >= MIN_RECHARGE_AMOUNT && amount <= MAX_RECHARGE_AMOUNT;
};

export const validatePaymentMethod = (method: string): boolean => {
    return VALID_PAYMENT_METHODS.includes(method as typeof VALID_PAYMENT_METHODS[number]);
};

export const validateTransactionId = (transactionId: string): boolean => {
    // UUID v4 format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(transactionId);
};

export const validateName = (name: string): boolean => {
    const { min, max } = FIELD_LIMITS.name;
    return name.length >= min && name.length <= max;
};

export const validateEmail = (email: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email) && email.length <= FIELD_LIMITS.email.max;
};

export const validatePhone = (phone: string): boolean => {
    const phonePattern = /^\+?[0-9]{10,15}$/;
    return phonePattern.test(phone);
};

export const validatePassword = (password: string): boolean => {
    const { min, max } = FIELD_LIMITS.password;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= min && 
           password.length <= max && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
};

export const validateGSTIN = (gstin: string): boolean => {
    const { min, max } = FIELD_LIMITS.document.gstin;
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstin.length >= min && gstin.length <= max && gstinPattern.test(gstin);
};

export const validatePAN = (pan: string): boolean => {
    const { min, max } = FIELD_LIMITS.document.pan;
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return pan.length >= min && pan.length <= max && panPattern.test(pan);
};

export const validateCIN = (cin: string): boolean => {
    const { min, max } = FIELD_LIMITS.document.cin;
    const cinPattern = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    return cin.length >= min && cin.length <= max && cinPattern.test(cin);
};

export const validateAadhaar = (aadhaar: string): boolean => {
    const { min, max } = FIELD_LIMITS.document.aadhaar;
    const aadhaarPattern = /^[0-9]{12}$/;
    return aadhaar.length >= min && aadhaar.length <= max && aadhaarPattern.test(aadhaar);
};

// Error messages
export const ERROR_MESSAGES = {
    // Amount related
    INVALID_AMOUNT: `Amount must be between ₹${MIN_RECHARGE_AMOUNT} and ₹${MAX_RECHARGE_AMOUNT}`,
    INVALID_PAYMENT_METHOD: 'Invalid payment method',
    INVALID_TRANSACTION_ID: 'Invalid transaction ID',
    INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
    
    // User related
    INVALID_NAME: `Name must be between ${FIELD_LIMITS.name.min} and ${FIELD_LIMITS.name.max} characters`,
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PHONE: 'Invalid phone number format',
    INVALID_PASSWORD: 'Password must be 8-50 characters long and contain uppercase, lowercase, numbers, and special characters',
    INVALID_ROLE: 'Invalid user role',
    INVALID_STATUS: 'Invalid user status',
    
    // Document related
    INVALID_GSTIN: 'Invalid GSTIN format',
    INVALID_PAN: 'Invalid PAN format',
    INVALID_CIN: 'Invalid CIN format',
    INVALID_AADHAAR: 'Invalid Aadhaar number',
    INVALID_DOCUMENT_STATUS: 'Invalid document status',
    
    // Order related
    INVALID_PAYMENT_TYPE: 'Invalid payment type',
    INVALID_ORDER_STATUS: 'Invalid order status',
    INVALID_SHIPPING_MODE: 'Invalid shipping mode',
    
    // System related
    NETWORK_ERROR: 'Network error occurred',
    SERVER_ERROR: 'Server error occurred',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    DOWNLOAD_ERROR: 'Failed to download file',
    FILE_PROCESSING_ERROR: 'Failed to process file',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
    VALIDATION_ERROR: 'Validation error occurred',
    DUPLICATE_ENTITY: 'Entity already exists',
    RESOURCE_EXHAUSTED: 'Resource limit exceeded',
    ENCRYPTION_FAILED: 'Failed to encrypt data',
    DECRYPTION_FAILED: 'Failed to decrypt data',
    STORAGE_ERROR: 'Failed to access storage'
} as const; 