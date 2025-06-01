import { ApiService } from './api.service';
import { ApiResponse } from '@/types/api';
import { AuthService } from './auth.service';
import { AdminService } from './admin.service';
import { UploadService } from './upload.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { PoliciesService } from "./policies.service";
import { ProfileService, DocumentType as ProfileDocumentType, CompanyDetails as ProfileCompanyDetails } from './profile.service';
import { Seller } from '@/types/api';

interface Invoice {
    id: string;
    invoiceNumber: string;
    period: string;
    shipments: number;
    amount: string;
}

interface InvoiceSummary {
    totalInvoices: number;
    pendingAmount: string;
    overdueAmount: string;
    totalPaid: string;
    totalOutstanding: string;
}

interface WalletTransaction {
    id: number;
    date: string;
    referenceNumber: string;
    orderId: string;
    type: string;
    amount: string;
    codCharge: string;
    igst: string;
    subTotal: string;
    closingBalance: string;
    remark: string;
}

interface WalletSummary {
    totalRecharge: number;
    totalUsed: number;
    lastRecharge: string;
    codToWallet: number;
    closingBalance: string;
}

interface WalletTransactionParams {
    page: number;
    limit: number;
    date?: string;
    referenceNumber?: string;
    orderId?: string;
    paymentType?: string;
    creditDebit?: string;
    amount?: string;
    remark?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

interface RemittanceSummary {
    totalCOD: string;
    remittedTillDate: string;
    lastRemittance: string;
    totalRemittanceDue: string;
    nextRemittance: string;
}

interface RemittanceData {
    remittanceId: string;
    status: "Pending" | "Completed" | "Failed";
    paymentDate: string;
    remittanceAmount: string;
    freightDeduction: string;
    convenienceFee: string;
    total: string;
    paymentRef: string;
}

interface DisputeData {
    awbNumber: string;
    disputeDate: string;
    orderId: string;
    given: string;
    applied: string;
    revised: string;
    accepted: string;
    difference: string;
    status: "Active" | "Inactive";
}

interface DisputeDetails {
    orderNo: string;
    orderPlaced: string;
    paymentType: string;
    status: string;
    estimatedDelivery: string;
    currentLocation: {
        lat: number;
        lng: number;
    };
    trackingEvents: {
        date: string;
        time: string;
        activity: string;
        location: string;
        status: string;
    }[];
    weight: string;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    volumetricWeight: string;
    chargedWeight: string;
    customerDetails: {
        name: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        phone: string;
    };
    warehouseDetails: {
        name: string;
        address1: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        phone: string;
    };
    products: {
        name: string;
        sku: string;
        quantity: number;
        price: number;
        image: string;
    }[];
}

interface ManifestData {
    manifestId: string;
    date: string;
    courier: string;
    orders: string;
    pickupStatus: string;
    warehouse: string;
    status: string;
}

interface ManifestDetails {
    manifestId: string;
    date: string;
    courier: string;
    orders: string;
    pickupStatus: string;
    warehouse: string;
    status: string;
    orderDetails: Array<{
        orderId: string;
        customerName: string;
        address: string;
        items: string;
        weight: string;
    }>;
}

interface CreateManifestData {
    courier: string;
    warehouse: string;
    orderIds: string[];
}

interface NDRData {
    awb: string;
    status: string;
    actionRequired: string;
    actionRequested: string;
    open: string;
    closed: string;
}

interface NDRDetails {
    awb: string;
    status: string;
    actionRequired: string;
    actionRequested: string;
    open: string;
    closed: string;
    details: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    status: "Active" | "Inactive";
    lastUpdated: string;
    image?: string;
}

/**
 * Service factory that provides real API services
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private apiService: ApiService;
  private authService: AuthService;
  private adminService: AdminService;
  private uploadService: UploadService;
  private notificationService: NotificationService;
  private webSocketService: WebSocketService;
  private profileService: ProfileService;

  private constructor() {
    this.apiService = new ApiService();
    this.authService = new AuthService();
    this.adminService = new AdminService();
    this.uploadService = new UploadService();
    this.notificationService = new NotificationService();
    this.webSocketService = new WebSocketService();
    this.profileService = new ProfileService();
  }

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getApiService(): ApiService {
    return this.apiService;
  }

  getAuthService(): AuthService {
    return this.authService;
  }

  getAdminService(): AdminService {
    return this.adminService;
  }

  getUploadService(): UploadService {
    return this.uploadService;
  }

  getNotificationService(): NotificationService {
    return this.notificationService;
  }

  getWebSocketService(): WebSocketService {
    return this.webSocketService;
  }
  
  /**
   * Shipping Services
   */
  static shipping = {
    // New pincode-based rate calculation (recommended for frontend usage)
    async calculateRatesFromPincodes(rateData: {
      fromPincode: string;
      toPincode: string;
      weight: number;
      length: number;
      width: number;
      height: number;
      mode?: 'Surface' | 'Air';
      orderType?: 'prepaid' | 'cod';
      codCollectableAmount?: number;
      includeRTO?: boolean;
      courier?: string;
    }): Promise<ApiResponse<{
      calculations: Array<{
        courier: string;
        productName: string;
        mode: string;
        zone: string;
        volumetricWeight: number;
        finalWeight: number;
        weightMultiplier: number;
        shippingCost: number;
        codCharges: number;
        rtoCharges: number;
        gst: number;
        total: number;
        baseRate: number;
        addlRate: number;
        rateCardId: string;
      }>;
      bestOptions: any[];
      zone: string;
      billedWeight: number;
      volumetricWeight: number;
      deliveryEstimate: string;
      inputData: any;
    }>> {
      // Use the shipping controller that handles pincode-to-zone determination
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/shipping/ratecards/calculate', rateData);
    },

    // Direct zone-based rate calculation (for admin/testing purposes)
    async calculateRatesFromDB(rateData: {
      zone: string;
      weight: number;
      length: number;
      width: number;
      height: number;
      orderType?: 'prepaid' | 'cod';
      codCollectableAmount?: number;
      includeRTO?: boolean;
      courier?: string;
    }): Promise<ApiResponse<{
      calculations: Array<{
        courier: string;
        productName: string;
        mode: string;
        zone: string;
        volumetricWeight: number;
        finalWeight: number;
        shippingCost: number;
        codCharges: number;
        rtoCharges: number;
        gst: number;
        total: number;
        rateCardId: string;
      }>;
      inputData: any;
      cheapestOption: any;
      totalOptions: number;
    }>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/shipping/ratecards/calculate', rateData);
    },

    // Get all active rate cards
    async getRateCards(filters?: {
      courier?: string;
      zone?: string;
      mode?: string;
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/shipping/ratecards', { params: filters });
    },

    // Get active couriers
    async getActiveCouriers(): Promise<ApiResponse<string[]>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/shipping/ratecards/couriers');
    },

    // Get rate cards by zone
    async getRateCardsByZone(zone: string, courier?: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      const params = courier ? { courier } : {};
      return apiService.get(`/shipping/ratecards/zone/${zone}`, { params });
    },

    // Get rate card statistics
    async getRateCardStatistics(): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/shipping/ratecards/statistics');
    },

    // Legacy method - kept for backward compatibility
    async calculateRates(rateData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/shipping/calculate-rates', rateData);
    },

    async getShipmentDetails(id: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/shipping/shipments/${id}`);
    },

    async printLabel(id: string): Promise<ApiResponse<Blob>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/shipping/shipments/${id}/label`, { responseType: 'blob' });
    },

    async printInvoice(id: string): Promise<ApiResponse<Blob>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/shipping/shipments/${id}/invoice`, { responseType: 'blob' });
    },

    async cancelShipment(id: string): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post(`/shipping/shipments/${id}/cancel`);
    },

    async addTag(id: string): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post(`/shipping/shipments/${id}/tag`);
    },

    async bookShipment(id: string): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post(`/shipping/shipments/${id}/book`);
    }
  };
  
  /**
   * Partners Services
   */
  static partners = {
    async getPartners(filters?: { status?: string }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/admin/partners', { params: filters });
    },
    
    async getPartnerById(id: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/admin/partners/${id}`);
    },
    
    async createPartner(partnerData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/admin/partners', partnerData);
    },
    
    async updatePartner(id: string, partnerData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.put(`/admin/partners/${id}`, partnerData);
    },
    
    async refreshPartnerAPIs(ids: string[]): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/admin/partners/refresh-api', { ids });
    },
    
    async deleteManyPartners(ids: string[]): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/admin/partners/batch-delete', { ids });
    }
  };

  static policies = new PoliciesService();

  /**
   * Admin Services
   */
  static admin = {
    async getTeamMember(id: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/admin/users/${id}`);
    },

    async getTeamMembers(params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      department?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      type?: string;
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      
      // Route to appropriate endpoint based on type
      let endpoint = '/admin/users';
      if (params?.type === 'seller') {
        endpoint = '/admin/users/sellers';
      } else if (params?.type === 'customer') {
        endpoint = '/admin/users/customers';
      }
      
      // Clean up params to remove 'type' since it's not needed in the query
      const cleanParams = { ...params };
      delete cleanParams.type;
      
      return apiService.get(endpoint, cleanParams);
    },

    // Team Management Methods (Admin Team Members)
    async getAdminTeamMembers(params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      department?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      
      // Filter out unsupported parameters for the backend validator
      const supportedParams: any = {};
      if (params?.page) supportedParams.page = params.page;
      if (params?.limit) supportedParams.limit = params.limit;
      if (params?.search) supportedParams.search = params.search;
      if (params?.role) supportedParams.role = params.role;
      if (params?.status) supportedParams.status = params.status;
      if (params?.department) supportedParams.department = params.department;
      
      return apiService.get('/admin/team', { params: supportedParams });
    },

    async registerAdminTeamMember(memberData: {
      fullName: string;
      email: string;
      role: string;
      department: string;
      phoneNumber: string;
      address?: string;
      designation?: string;
      remarks?: string;
      dateOfJoining?: string;
      sendInvitation?: boolean;
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/admin/team/register', memberData);
    },

    async getAdminTeamMember(userId: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/admin/team/${userId}`);
    },

    async updateAdminTeamMember(userId: string, memberData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/admin/team/${userId}`, memberData);
    },

    async updateAdminTeamMemberStatus(userId: string, status: string, reason?: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/admin/team/${userId}/status`, { status, reason });
    },

    async updateAdminTeamMemberPermissions(userId: string, permissions: Record<string, boolean>): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/admin/team/${userId}/permissions`, { permissions });
    },

    async uploadAdminTeamMemberDocument(userId: string, formData: FormData): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;
      return apiService.uploadFile(`/admin/team/${userId}/documents`, file, 'file', type);
    },

    async updateTeamMember(id: string, memberData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/admin/users/${id}`, memberData);
    },

    async updateTeamMemberStatus(id: string, status: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/admin/users/${id}/status`, { status });
    },

    async updateTeamPermissions(id: string, permissions: Record<string, boolean>): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/admin/users/${id}/permissions`, { permissions });
    },

    async uploadTeamDocument(id: string, formData: FormData): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;
      return apiService.uploadFile(`/admin/users/${id}/documents`, file, 'file', type);
    },

    getRateBands: () => ServiceFactory.getInstance().getApiService().get('/admin/rate-bands'),

    // Analytics methods
    async getReportStats(): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/admin/reports/stats');
    },

    async getRevenueData(params: {
      timeFilter?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
      from?: string;
      to?: string;
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/admin/reports/revenue', { params });
    },

    async getDeliveryPartners(): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/admin/reports/delivery-partners');
    },

    async getShipments(params: {
      from?: string;
      to?: string;
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/admin/dashboard/shipments', { params });
    }
  };

  static tickets = {
    async getTickets(page: number, pageSize: number): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/admin/tickets', { params: { page, pageSize } });
    },

    async updateTicketStatus(id: string, status: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/admin/tickets/${id}/status`, { status });
    }
  };

  static customer = {
    orders: {
      getByAwb: async (awb: string): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/customer/orders/${awb}`, 'GET');
      },
      submitRating: async (awb: string, data: any): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/customer/orders/${awb}/rating`, 'POST', data);
      },
      getAll: async (params: {
        page: number;
        limit: number;
        search?: string;
        sortField?: string;
        sortDirection?: string;
        status?: string;
      }): Promise<ApiResponse<any>> => {
        // Filter out undefined values to prevent URLSearchParams from converting them to "undefined" strings
        const cleanParams: Record<string, string> = {};
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            cleanParams[key] = String(value);
          }
        });
        
        const queryString = new URLSearchParams(cleanParams).toString();
        const endpoint = queryString ? `/customer/orders?${queryString}` : '/customer/orders';
        
        return ServiceFactory.callApi(endpoint, 'GET');
      },
      getStatusCounts: async (): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/customer/orders/status-counts', 'GET');
      },
      downloadLabel: async (awb: string): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/customer/orders/${awb}/label`, 'GET', undefined, 'blob');
      }
    },
    profile: {
      get: async (): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/customer/profile', 'GET');
      },
      update: async (data: any): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/customer/profile', 'PUT', data);
      },
      uploadImage: async (file: File): Promise<ApiResponse<any>> => {
        // Use ApiService with correct field name
        const apiService = ServiceFactory.getInstance().getApiService();
        return apiService.uploadFile('/customer/profile/image', file, 'profileImage');
      },
      addAddress: async (data: any): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/customer/address', 'POST', data);
      },
      deleteAddress: async (id: string): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/customer/address/${id}`, 'DELETE');
      }
    }
  };

  static seller = {
    billing: {
      getInvoices: async (params: { from: string; to: string }) => {
        return await ServiceFactory.callApi<{ invoices: Invoice[] }>(
          `/seller/billing/invoices?from=${params.from}&to=${params.to}`
        );
      },
      getInvoiceSummary: async (params: { from: string; to: string }) => {
        return await ServiceFactory.callApi<{ summary: InvoiceSummary }>(
          `/seller/billing/invoices/summary?from=${params.from}&to=${params.to}`
        );
      },
      downloadInvoice: async (invoiceId: string) => {
        return await ServiceFactory.callApi<{ pdfUrl: string }>(
          `/seller/billing/invoices/${invoiceId}/download`
        );
      },
      downloadShipments: async (invoiceId: string) => {
        return await ServiceFactory.callApi<Blob>(
          `/seller/billing/invoices/${invoiceId}/shipments?format=csv`,
          'GET',
          undefined,
          'blob'
        );
      },
      getRateCard: async () => {
        return await ServiceFactory.callApi<{ 
          lastUpdated: string;
          rates: any[];
        }>('/seller/billing/rate-card');
      },
      calculateRates: async (data: {
        pickupPincode: string;
        deliveryPincode: string;
        paymentType: string;
        purchaseAmount: number;
        weight: number;
      }) => {
        return await ServiceFactory.callApi<{
          zone: string;
          rates: Array<{
            name: string;
            baseCharge: number;
            codCharge: number;
            gst: number;
            total: number;
          }>;
        }>('/seller/billing/calculate-rates', 'POST', data);
      },
      getWalletTransactions: async (params: WalletTransactionParams): Promise<ApiResponse<{ transactions: WalletTransaction[]; total: number }>> => {
        return ServiceFactory.callApi('GET', '/seller/wallet/transactions', params);
      },
      getWalletSummary: async (): Promise<ApiResponse<WalletSummary>> => {
        return ServiceFactory.callApi('GET', '/seller/wallet/summary');
      }
    },
    product: {
      getProducts: async (): Promise<ApiResponse<Product[]>> => {
        return ServiceFactory.callApi('/seller/products');
      },
      delete: async (id: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/products/${id}`, 'DELETE');
      },
      import: async (formData: FormData): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi('/seller/products/import', 'POST', formData);
      }
    },
    bulkOrders: {
      getUploadHistory: async (): Promise<ApiResponse<any[]>> => {
        return ServiceFactory.callApi('/seller/bulk-orders/history');
      },
      downloadErrorFile: async (uploadId: number): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/seller/bulk-orders/${uploadId}/error-file`, 'GET', undefined, 'blob');
      },
      toggleUploadDetails: async (uploadId: number): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/bulk-orders/${uploadId}/toggle-details`, 'POST');
      }
    },
    cod: {
      getSummary: async (): Promise<ApiResponse<RemittanceSummary>> => {
        return ServiceFactory.callApi('/seller/cod/summary');
      },
      getRemittanceHistory: async (): Promise<ApiResponse<{ remittances: RemittanceData[] }>> => {
        return ServiceFactory.callApi('/seller/cod/remittance-history');
      },
      downloadRemittance: async (remittanceId: string): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/seller/cod/export?remittanceId=${remittanceId}&format=xlsx`, 'GET', undefined, 'blob');
      }
    },
    disputes: {
      getDisputes: async (status?: 'active' | 'inactive'): Promise<ApiResponse<DisputeData[]>> => {
        return ServiceFactory.callApi(`/seller/disputes${status ? `?status=${status}` : ''}`);
      },
      getDisputeDetails: async (id: string): Promise<ApiResponse<DisputeDetails>> => {
        return ServiceFactory.callApi(`/seller/disputes/${id}`);
      },
      updateDispute: async (id: string, data: Partial<DisputeData>): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/disputes/${id}`, 'PATCH', data);
      },
      uploadBulkDisputes: async (file: File): Promise<ApiResponse<void>> => {
        const formData = new FormData();
        formData.append('file', file);
        return ServiceFactory.callApi('/seller/disputes/bulk-upload', 'POST', formData);
      }
    },
    manifest: {
      getManifests: async (): Promise<ApiResponse<ManifestData[]>> => {
        return ServiceFactory.callApi('/seller/manifests');
      },
      getManifestDetails: async (manifestId: string): Promise<ApiResponse<ManifestDetails>> => {
        return ServiceFactory.callApi(`/seller/manifests/${manifestId}`);
      },
      createManifest: async (data: CreateManifestData): Promise<ApiResponse<ManifestData>> => {
        return ServiceFactory.callApi('/seller/manifests', 'POST', data);
      },
      updateManifestStatus: async (manifestId: string, status: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/manifests/${manifestId}/status`, 'PATCH', { status });
      }
    },
    ndr: {
      getNDRs: async (status?: 'all' | 'action-required' | 'action-requested' | 'open' | 'closed'): Promise<ApiResponse<NDRData[]>> => {
        return ServiceFactory.callApi(`/seller/ndr${status ? `?status=${status}` : ''}`);
      },
      getNDRDetails: async (awb: string): Promise<ApiResponse<NDRDetails>> => {
        return ServiceFactory.callApi(`/seller/ndr/${awb}`);
      },
      updateNDRAction: async (awb: string, data: { action: string; comments: string }): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/ndr/${awb}/action`, 'POST', data);
      },
      uploadBulkNDR: async (file: File): Promise<ApiResponse<void>> => {
        const formData = new FormData();
        formData.append('file', file);
        return ServiceFactory.callApi('/seller/ndr/bulk-upload', 'POST', formData);
      },
      downloadNDR: async (format: 'csv' | 'xlsx'): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/seller/ndr/download?format=${format}`, 'GET', undefined, 'blob');
      }
    },
    order: {
      getDetails: async (id: string): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/seller/orders/${id}`);
      },
      getOrders: async (params: { status?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/seller/orders?${new URLSearchParams(params as any)}`);
      },
      updateStatus: async (id: string, status: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/orders/${id}/status`, 'PATCH', { status });
      },
      cancel: async (id: string, reason: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/orders/${id}/cancel`, 'POST', { reason });
      },
      updateTracking: async (id: string, trackingNumber: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/seller/orders/${id}/tracking`, 'PATCH', { trackingNumber });
      },
      bulkUpdateStatus: async (orderIds: string[], status: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi('/seller/orders/bulk-status', 'PATCH', { orderIds, status });
      }
    },
    profile: {
      get: () => ServiceFactory.getInstance().profileService.getProfile(),
      update: (data: Partial<Seller>) => ServiceFactory.getInstance().profileService.updateProfile(data),
      uploadDocument: (file: File, type: ProfileDocumentType) => ServiceFactory.getInstance().profileService.uploadDocument(file, type),
      updateCompanyDetails: (data: ProfileCompanyDetails) => ServiceFactory.getInstance().profileService.updateCompanyDetails(data),
      updateBankDetails: (data: any) => ServiceFactory.getInstance().profileService.updateBankDetails(data),
      updateProfileImage: (file: File) => ServiceFactory.getInstance().profileService.updateProfileImage(file),
      updateStoreLinks: (links: Seller['storeLinks']) => ServiceFactory.getInstance().profileService.updateStoreLinks(links)
    }
  };

  private static async callApi<T>(endpoint: string, method: string = 'GET', data?: any, responseType?: 'json' | 'blob'): Promise<ApiResponse<T>> {
    try {
      const apiService = ServiceFactory.getInstance().getApiService();
      let response: ApiResponse<T>;

      const config = responseType ? { responseType } : undefined;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await apiService.get<T>(endpoint, data, config);
          break;
        case 'POST':
          response = await apiService.post<T>(endpoint, data, config);
          break;
        case 'PUT':
          response = await apiService.put<T>(endpoint, data, config);
          break;
        case 'PATCH':
          response = await apiService.patch<T>(endpoint, data, config);
          break;
        case 'DELETE':
          response = await apiService.delete<T>(endpoint, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response;
    } catch (error: any) {
      // Preserve the original error details instead of returning generic message
      console.error('ServiceFactory.callApi error:', error);
      
      return {
        success: false,
        data: null as unknown as T,
        message: error.message || 'An error occurred',
        status: error.status || 500
      };
    }
  }
}

export const serviceFactory = ServiceFactory.getInstance(); 