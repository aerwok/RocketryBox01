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
 * Uses singleton pattern to ensure consistent service instances
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
    // Use singleton instances for all services to prevent multiple initialization
    this.apiService = ApiService.getInstance();
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
      return apiService.post('/seller/rate-card/calculate', rateData);
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
      // Import the tickets API
      const { getAllTickets } = await import('@/lib/api/support-tickets');
      
      try {
        const result = await getAllTickets(page, pageSize);
        return {
          success: true,
          data: result,
          message: "Tickets fetched successfully",
          status: 200
        };
      } catch (error) {
        throw new Error('Failed to fetch tickets');
      }
    },

    async updateTicketStatus(id: string, status: string): Promise<ApiResponse<any>> {
      // Import the tickets API
      const { updateTicketStatus } = await import('@/lib/api/support-tickets');
      
      try {
        const updatedTicket = await updateTicketStatus(id, status as any);
        return {
          success: true,
          data: updatedTicket,
          message: "Ticket status updated successfully",
          status: 200
        };
      } catch (error) {
        throw new Error('Failed to update ticket status');
      }
    }
  };

  static customer = {
    orders: {
      getByAwb: async (awb: string): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/customer/orders/awb/${awb}`, 'GET');
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
        try {
          console.log('ServiceFactory: Downloading shipping label for AWB:', awb);
          
          // Call the updated backend endpoint that uses PDFKit
          const response = await ServiceFactory.callApi<Blob>(`/customer/orders/awb/${awb}/label`, 'GET', undefined, 'blob');
          
          console.log('ServiceFactory: API response received:', {
            success: response.success,
            status: response.status,
            message: response.message,
            hasData: !!response.data,
            dataType: response.data ? typeof response.data : 'no data'
          });
          
          if (response.success && response.data) {
            console.log('ServiceFactory: PDF label downloaded successfully');
            
            // Validate that we received a valid PDF
            const blob = response.data;
            if (blob.type === 'application/pdf' || blob.size > 0) {
              return response;
            } else {
              console.warn('ServiceFactory: Downloaded file may not be a valid PDF', {
                type: blob.type,
                size: blob.size
              });
              // Still return the response, let the UI handle it
              return response;
            }
          } else {
            const errorMessage = response.message || 'Unknown error occurred while downloading shipping label';
            console.error('ServiceFactory: Failed to download PDF label:', errorMessage);
            return {
              success: false,
              data: null as unknown as Blob,
              message: errorMessage,
              status: response.status || 500
            };
          }
        } catch (error: any) {
          console.error('ServiceFactory: PDF download error:', error);
          console.error('ServiceFactory: Error details:', {
            message: error?.message,
            status: error?.status,
            response: error?.response,
            name: error?.name
          });
          
          // Enhanced error handling with better default messages
          let errorMessage = 'Failed to download shipping label. Please try again.';
          
          if (error?.message) {
            errorMessage = error.message;
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.status === 404) {
            errorMessage = 'Shipping label not found. The label may not have been generated yet.';
          } else if (error?.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error?.status >= 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          }
          
          return {
            success: false,
            data: null as unknown as Blob,
            message: errorMessage,
            status: error?.status || 500
          };
        }
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
        const queryParams = new URLSearchParams();
        if (params.from) queryParams.append('startDate', params.from);
        if (params.to) queryParams.append('endDate', params.to);
        
        const response = await ServiceFactory.callApi<any[]>(
          `/seller/invoices?${queryParams.toString()}`
        );
        
        // Transform response to match expected format
        if (response.success) {
          return {
            ...response,
            data: { invoices: response.data }
          };
        }
        return response;
      },
      getInvoiceSummary: async (params: { from: string; to: string }) => {
        // Since summary endpoint doesn't exist, we'll calculate from invoices
        const invoicesResponse = await ServiceFactory.seller.billing.getInvoices(params);
        
        if (invoicesResponse.success) {
          const invoices = (invoicesResponse.data as { invoices: any[] }).invoices;
          const summary = {
            totalInvoices: invoices.length,
            pendingAmount: `₹${invoices.filter((inv: any) => inv.status === 'pending').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0).toFixed(2)}`,
            overdueAmount: `₹${invoices.filter((inv: any) => inv.status === 'overdue').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0).toFixed(2)}`,
            totalPaid: `₹${invoices.filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0).toFixed(2)}`,
            totalOutstanding: `₹${invoices.filter((inv: any) => inv.status !== 'paid').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0).toFixed(2)}`
          };
          
          return {
            success: true,
            data: { summary },
            message: 'Summary calculated successfully',
            status: 200
          };
        }
        
        return invoicesResponse;
      },
      downloadInvoice: async (invoiceId: string) => {
        return await ServiceFactory.callApi<{ pdfUrl: string }>(
          `/seller/invoices/${invoiceId}/pdf`
        );
      },
      downloadShipments: async (invoiceId: string) => {
        return await ServiceFactory.callApi<Blob>(
          `/seller/invoices/${invoiceId}/shipments?format=csv`,
          'GET',
          undefined,
          'blob'
        );
      },
      getRateCard: async () => {
        return await ServiceFactory.callApi<{ 
          lastUpdated: string;
          rates: any[];
        }>('/seller/rate-card');
      },
      calculateRates: async (data: {
        pickupPincode: string;
        deliveryPincode: string;
        paymentType: string;
        purchaseAmount: number;
        weight: number;
        packageLength?: number;
        packageWidth?: number;
        packageHeight?: number;
        includeRTO?: boolean;
      }) => {
        return await ServiceFactory.callApi<{
          zone: string;
          billedWeight: string;
          volumetricWeight: string;
          rates: Array<{
            name: string;
            courier: string;
            productName: string;
            mode: string;
            baseCharge: number;
            codCharge: number;
            rtoCharges: number;
            gst: number;
            total: number;
            finalWeight: string;
            weightMultiplier: number;
            rateCardId: string;
          }>;
        }>('/seller/rate-card/calculate', 'POST', data);
      },
      getWalletTransactions: async (params: WalletTransactionParams): Promise<ApiResponse<{ transactions: WalletTransaction[]; total: number }>> => {
        return ServiceFactory.callApi('/seller/wallet/transactions', 'GET', params);
      },
      getWalletSummary: async (): Promise<ApiResponse<WalletSummary>> => {
        return ServiceFactory.callApi('/seller/wallet/summary', 'GET');
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
      createOrder: async (orderData: {
        orderId: string;
        customer: {
          name: string;
          phone: string;
          email: string;
          address: {
            street: string;
            city: string;
            state: string;
            pincode: string;
            country?: string;
          };
        };
        product: {
          name: string;
          sku: string;
          quantity: number;
          price: number;
          weight: string;
          dimensions: {
            length: number;
            width: number;
            height: number;
          };
        };
        payment: {
          method: 'COD' | 'Prepaid';
          amount: string;
          codCharge?: string;
          shippingCharge: string;
          gst: string;
          total: string;
        };
        channel?: string;
      }): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/seller/orders', 'POST', orderData);
      },
      getOrders: async (params: { status?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
        // Filter out undefined values to prevent URLSearchParams from converting them to "undefined" strings
        const cleanParams: Record<string, string> = {};
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            cleanParams[key] = String(value);
          }
        });
        
        const queryString = new URLSearchParams(cleanParams).toString();
        const endpoint = queryString ? `/seller/orders?${queryString}` : '/seller/orders';
        
        return ServiceFactory.callApi(endpoint);
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
      // Check if current user is a team member and if they have permission for this endpoint
      const permissionRequired = ServiceFactory.getRequiredPermission(endpoint);
      if (permissionRequired) {
        try {
          const { sellerAuthService } = await import('@/services/seller-auth.service');
          const currentUser = await sellerAuthService.getCurrentUser();
          
          if (currentUser?.userType === 'team_member') {
            const hasPermission = await sellerAuthService.hasPermission(permissionRequired);
            if (!hasPermission) {
              console.log(`Team member doesn't have permission "${permissionRequired}" for ${endpoint}, returning empty response`);
              return ServiceFactory.getEmptyResponse<T>(endpoint);
            }
          }
        } catch (permError) {
          console.warn('Permission check failed, proceeding with API call:', permError);
          // Continue with API call if permission check fails
        }
      }

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
      console.error('ServiceFactory.callApi error:', error);
      
      // For blob responses, try a direct fetch fallback if the main call fails
      if (responseType === 'blob' && method.toUpperCase() === 'GET') {
        try {
          console.log('ServiceFactory: Attempting direct fetch fallback for PDF download...');
          const { secureStorage } = await import('@/utils/secureStorage');
          const authToken = await secureStorage.getItem('auth_token');
          
          if (!authToken) {
            throw new Error('No authentication token found. Please log in again.');
          }
          
          const fallbackResponse = await fetch(`/api/v2${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (fallbackResponse.ok) {
            const blob = await fallbackResponse.blob();
            
            // Additional validation for PDF downloads
            if (endpoint.includes('/label') && blob.size > 0) {
              console.log('ServiceFactory: Fallback PDF download successful', {
                size: blob.size,
                type: blob.type
              });
              
              // Ensure the blob has the correct MIME type
              const pdfBlob = blob.type === 'application/pdf' 
                ? blob 
                : new Blob([blob], { type: 'application/pdf' });
              
              return {
                success: true,
                data: pdfBlob as unknown as T,
                message: 'PDF downloaded successfully (fallback)',
                status: fallbackResponse.status
              };
            } else {
              return {
                success: true,
                data: blob as unknown as T,
                message: 'Request successful (fallback)',
                status: fallbackResponse.status
              };
            }
          } else if (fallbackResponse.status === 404) {
            throw new Error('Shipping label not found. The label may not have been generated yet.');
          } else if (fallbackResponse.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else {
            throw new Error(`Server error: ${fallbackResponse.status}. Please try again later.`);
          }
        } catch (fallbackError: any) {
          console.error('ServiceFactory fallback error:', fallbackError);
          
          // Enhanced error messages for PDF downloads
          let errorMessage = fallbackError.message || 'Failed to download shipping label';
          if (endpoint.includes('/label')) {
            errorMessage = 'Unable to download shipping label. This may be due to network issues or the label not being ready yet. Please try again in a few moments.';
          }
          
          return {
            success: false,
            data: null as unknown as T,
            message: errorMessage,
            status: fallbackError.status || 500
          };
        }
      }
      
      return {
        success: false,
        data: null as unknown as T,
        message: error.message || 'An error occurred',
        status: error.status || 500
      };
    }
  }

  // Helper method to get required permission for an endpoint
  private static getRequiredPermission(endpoint: string): string | null {
    // Map endpoints to required permissions
    const permissionMap: Record<string, string> = {
      '/seller/orders': 'Order',
      '/seller/ndr': 'NDR List',
      '/seller/disputes': 'Weight Dispute',
      '/seller/manifests': 'Manifest',
      '/seller/cod': 'COD Remittance',
      '/seller/products': 'Items & SKU',
      '/seller/invoices': 'Fright',
      '/seller/wallet': 'Wallet',
      '/seller/bulk-orders': 'New Order',
      '/seller/shipments': 'Shipments',
    };

    // Check if endpoint starts with any of the mapped paths
    for (const [path, permission] of Object.entries(permissionMap)) {
      if (endpoint.startsWith(path)) {
        return permission;
      }
    }

    return null; // No permission required (e.g., profile endpoints)
  }

  // Helper method to return appropriate empty responses
  private static getEmptyResponse<T>(endpoint: string): ApiResponse<T> {
    let emptyData: any = [];

    // Provide appropriate empty data based on endpoint
    if (endpoint.includes('/orders')) {
      emptyData = [];
    } else if (endpoint.includes('/ndr')) {
      emptyData = [];
    } else if (endpoint.includes('/disputes')) {
      emptyData = [];
    } else if (endpoint.includes('/manifests')) {
      emptyData = [];
    } else if (endpoint.includes('/cod/summary')) {
      emptyData = {
        totalCOD: '0',
        remittedTillDate: '0',
        lastRemittance: '0',
        totalRemittanceDue: '0',
        nextRemittance: 'N/A'
      };
    } else if (endpoint.includes('/cod')) {
      emptyData = { remittances: [] };
    } else if (endpoint.includes('/products')) {
      emptyData = [];
    } else if (endpoint.includes('/invoices/summary')) {
      emptyData = {
        summary: {
          totalInvoices: 0,
          pendingAmount: '0',
          overdueAmount: '0',
          totalPaid: '0',
          totalOutstanding: '0'
        }
      };
    } else if (endpoint.includes('/invoices')) {
      emptyData = { invoices: [] };
    } else if (endpoint.includes('/wallet/transactions')) {
      emptyData = { transactions: [], total: 0 };
    } else if (endpoint.includes('/wallet/summary')) {
      emptyData = {
        totalRecharge: 0,
        totalUsed: 0,
        lastRecharge: '0',
        codToWallet: 0,
        closingBalance: '0'
      };
    }

    return {
      success: true,
      data: emptyData as T,
      message: 'Access restricted - Empty data returned',
      status: 200
    };
  }
}

export const serviceFactory = ServiceFactory.getInstance(); 