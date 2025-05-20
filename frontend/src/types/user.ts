export type UserRole = 'admin' | 'seller' | 'customer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    permissions?: string[];
    profileImage?: string;
    companyName?: string;
    companyCategory?: string;
    brandName?: string;
    website?: string;
    supportContact?: string;
    supportEmail?: string;
    operationsEmail?: string;
    financeEmail?: string;
    rechargeType?: 'Prepaid' | 'Postpaid';
    storeLinks?: {
        website?: string;
        amazon?: string;
        shopify?: string;
        opencart?: string;
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
        documents?: Array<{
            name: string;
            type: string;
            url: string;
            status: 'pending' | 'verified' | 'rejected';
        }>;
    };
    bankDetails?: Array<{
        accountName: string;
        accountNumber: string;
        bankName: string;
        branch: string;
        ifscCode: string;
        swiftCode?: string;
        accountType: 'Savings' | 'Current';
        isDefault: boolean;
        cancelledCheque?: {
            url: string;
            status: 'pending' | 'verified' | 'rejected';
        };
    }>;
}

export interface UserFilters {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    dateRange?: {
        from: Date;
        to: Date;
    };
} 