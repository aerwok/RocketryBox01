import { ApiService } from './api.service';
import { ApiResponse } from '@/types/api';
import { AuthService } from './auth.service';
import { CustomerService } from './customer.service';
import { AdminService } from './admin.service';
import { UploadService } from './upload.service';
import { NotificationService } from './notification.service';
import { WebSocketService } from './websocket.service';
import { PoliciesService } from "./policies.service";

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

interface Seller {
    id: string;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    companyCategory: string;
    brandName?: string;
    website?: string;
    supportContact?: string;
    supportEmail?: string;
    operationsEmail?: string;
    financeEmail?: string;
    profileImage?: string;
    address?: {
        street: string;
        landmark?: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
    documents?: {
        gstin: string;
        pan: string;
        aadhaar: string;
        documents: Array<{
            name: string;
            type: string;
            status: 'verified' | 'pending' | 'rejected';
            url: string;
        }>;
    };
    bankDetails?: Array<{
        bankName: string;
        accountName: string;
        accountNumber: string;
        branch: string;
        accountType: string;
        ifscCode: string;
        cancelledCheque?: {
            status: 'verified' | 'pending';
            url: string;
        };
    }>;
    storeLinks?: {
        website?: string;
        amazon?: string;
        shopify?: string;
        opencart?: string;
    };
    editRequested?: boolean;
}

interface AgreementVersion {
    version: string;
    docLink: string;
    acceptanceDate: string;
    publishedOn: string;
    ipAddress: string;
    status: "Accepted" | "Pending" | "Rejected";
    content?: {
        serviceProvider: {
            name: string;
            address: string;
            email: string;
        };
        merchant: {
            name: string;
            address: string;
            email: string;
        };
        merchantBusiness: string;
        serviceProviderBusiness: string[];
    };
}

/**
 * Service factory that provides real API services
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private apiService: ApiService;
  private authService: AuthService;
  private customerService: CustomerService;
  private adminService: AdminService;
  private uploadService: UploadService;
  private notificationService: NotificationService;
  private webSocketService: WebSocketService;

  private constructor() {
    this.apiService = new ApiService();
    this.authService = new AuthService();
    this.customerService = new CustomerService();
    this.adminService = new AdminService();
    this.uploadService = new UploadService();
    this.notificationService = new NotificationService();
    this.webSocketService = new WebSocketService();
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

  getCustomerService(): CustomerService {
    return this.customerService;
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
    async calculateRates(rateData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/api/shipping/calculate-rates', rateData);
    },

    async getShipmentDetails(id: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/api/shipping/shipments/${id}`);
    },

    async printLabel(id: string): Promise<ApiResponse<Blob>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/api/shipping/shipments/${id}/label`, { responseType: 'blob' });
    },

    async printInvoice(id: string): Promise<ApiResponse<Blob>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/api/shipping/shipments/${id}/invoice`, { responseType: 'blob' });
    },

    async cancelShipment(id: string): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post(`/api/shipping/shipments/${id}/cancel`);
    },

    async addTag(id: string): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post(`/api/shipping/shipments/${id}/tag`);
    },

    async bookShipment(id: string): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post(`/api/shipping/shipments/${id}/book`);
    }
  };
  
  /**
   * Partners Services
   */
  static partners = {
    async getPartners(filters?: { status?: string }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/api/admin/partners', { params: filters });
    },
    
    async getPartnerById(id: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/api/admin/partners/${id}`);
    },
    
    async createPartner(partnerData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/api/admin/partners', partnerData);
    },
    
    async updatePartner(id: string, partnerData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.put(`/api/admin/partners/${id}`, partnerData);
    },
    
    async refreshPartnerAPIs(ids: string[]): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/api/admin/partners/refresh-api', { ids });
    },
    
    async deleteManyPartners(ids: string[]): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.post('/api/admin/partners/batch-delete', { ids });
    }
  };

  static policies = new PoliciesService();

  /**
   * Admin Services
   */
  static admin = {
    async getTeamMember(id: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get(`/api/admin/team/${id}`);
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
      return apiService.get('/api/admin/team', { params });
    },

    async updateTeamMember(id: string, memberData: any): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.put(`/api/admin/team/${id}`, memberData);
    },

    async updateTeamMemberStatus(id: string, status: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/api/admin/team/${id}/status`, { status });
    },

    async updateTeamPermissions(id: string, permissions: Record<string, boolean>): Promise<ApiResponse<void>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.put(`/api/admin/team/${id}/permissions`, permissions);
    },

    async uploadTeamDocument(id: string, formData: FormData): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;
      return apiService.uploadFile(`/api/admin/team/${id}/documents`, file, type);
    },

    getRateBands: () => ServiceFactory.getInstance().getApiService().get('/admin/rate-bands'),

    // Analytics methods
    async getReportStats(): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/api/admin/reports/stats');
    },

    async getRevenueData(params: {
      timeFilter?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
      from?: string;
      to?: string;
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/api/admin/reports/revenue', { params });
    },

    async getDeliveryPartners(): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/api/admin/reports/delivery-partners');
    },

    async getShipments(params: {
      from?: string;
      to?: string;
    }): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/api/admin/dashboard/shipments', { params });
    }
  };

  static tickets = {
    async getTickets(page: number, pageSize: number): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.get('/api/admin/tickets', { params: { page, pageSize } });
    },

    async updateTicketStatus(id: string, status: string): Promise<ApiResponse<any>> {
      const apiService = ServiceFactory.getInstance().getApiService();
      return apiService.patch(`/api/admin/tickets/${id}/status`, { status });
    }
  };

  static customer = {
    orders: {
      getByAwb: async (awb: string): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/api/customer/orders/${awb}`, 'GET');
      },
      submitRating: async (awb: string, data: any): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/api/customer/orders/${awb}/rating`, 'POST', data);
      },
      getAll: async (params: {
        page: number;
        limit: number;
        search?: string;
        sortField?: string;
        sortDirection?: string;
        status?: string;
      }): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/api/customer/orders?${new URLSearchParams(params as any)}`, 'GET');
      },
      getStatusCounts: async (): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/api/customer/orders/status-counts', 'GET');
      },
      downloadLabel: async (awb: string): Promise<ApiResponse<Blob>> => {
        const response = await fetch(`/api/customer/orders/${awb}/label`);
        const blob = await response.blob();
        return {
          success: true,
          data: blob,
          message: 'Label downloaded successfully',
          status: 200
        };
      }
    },
    profile: {
      get: async (): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/api/customer/profile', 'GET');
      },
      update: async (data: any): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/api/customer/profile', 'PATCH', data);
      },
      uploadImage: async (file: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append('profileImage', file);
        const response = await fetch('/api/customer/profile/image', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        return data;
      },
      addAddress: async (data: any): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi('/api/customer/addresses', 'POST', data);
      },
      deleteAddress: async (id: string): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/api/customer/addresses/${id}`, 'DELETE');
      }
    }
  };

  static seller = {
    billing: {
      getInvoices: async (params: { from: string; to: string }) => {
        return await ServiceFactory.callApi<{ invoices: Invoice[] }>(
          `/api/seller/billing/invoices?from=${params.from}&to=${params.to}`
        );
      },
      getInvoiceSummary: async (params: { from: string; to: string }) => {
        return await ServiceFactory.callApi<{ summary: InvoiceSummary }>(
          `/api/seller/billing/invoices/summary?from=${params.from}&to=${params.to}`
        );
      },
      downloadInvoice: async (invoiceId: string) => {
        return await ServiceFactory.callApi<{ pdfUrl: string }>(
          `/api/seller/billing/invoices/${invoiceId}/download`
        );
      },
      downloadShipments: async (invoiceId: string) => {
        return await ServiceFactory.callApi<Blob>(
          `/api/seller/billing/invoices/${invoiceId}/shipments?format=csv`,
          'GET',
          undefined,
          'blob'
        );
      },
      getRateCard: async () => {
        return await ServiceFactory.callApi<{ 
          lastUpdated: string;
          rates: any[];
        }>('/api/seller/billing/rate-card');
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
        }>('/api/seller/billing/calculate-rates', 'POST', data);
      },
      getWalletTransactions: async (params: WalletTransactionParams): Promise<ApiResponse<{ transactions: WalletTransaction[]; total: number }>> => {
        return ServiceFactory.callApi('GET', '/api/seller/wallet/transactions', params);
      },
      getWalletSummary: async (): Promise<ApiResponse<WalletSummary>> => {
        return ServiceFactory.callApi('GET', '/api/seller/wallet/summary');
      }
    },
    product: {
      getProducts: async (): Promise<ApiResponse<Product[]>> => {
        return ServiceFactory.callApi('/api/seller/products');
      },
      delete: async (id: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/products/${id}`, 'DELETE');
      },
      import: async (formData: FormData): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi('/api/seller/products/import', 'POST', formData);
      }
    },
    bulkOrders: {
      getUploadHistory: async (): Promise<ApiResponse<any[]>> => {
        return ServiceFactory.callApi('/api/seller/bulk-orders/history');
      },
      downloadErrorFile: async (uploadId: number): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/api/seller/bulk-orders/${uploadId}/error-file`, 'GET', undefined, 'blob');
      },
      toggleUploadDetails: async (uploadId: number): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/bulk-orders/${uploadId}/toggle-details`, 'POST');
      }
    },
    cod: {
      getSummary: async (): Promise<ApiResponse<RemittanceSummary>> => {
        return ServiceFactory.callApi('/api/seller/cod/summary');
      },
      getRemittanceHistory: async (): Promise<ApiResponse<{ remittances: RemittanceData[] }>> => {
        return ServiceFactory.callApi('/api/seller/cod/remittance-history');
      },
      downloadRemittance: async (remittanceId: string): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/api/seller/cod/export?remittanceId=${remittanceId}&format=xlsx`, 'GET', undefined, 'blob');
      }
    },
    disputes: {
      getDisputes: async (status?: 'active' | 'inactive'): Promise<ApiResponse<DisputeData[]>> => {
        return ServiceFactory.callApi(`/api/seller/disputes${status ? `?status=${status}` : ''}`);
      },
      getDisputeDetails: async (id: string): Promise<ApiResponse<DisputeDetails>> => {
        return ServiceFactory.callApi(`/api/seller/disputes/${id}`);
      },
      updateDispute: async (id: string, data: Partial<DisputeData>): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/disputes/${id}`, 'PATCH', data);
      },
      uploadBulkDisputes: async (file: File): Promise<ApiResponse<void>> => {
        const formData = new FormData();
        formData.append('file', file);
        return ServiceFactory.callApi('/api/seller/disputes/bulk-upload', 'POST', formData);
      }
    },
    manifest: {
      getManifests: async (): Promise<ApiResponse<ManifestData[]>> => {
        return ServiceFactory.callApi('/api/seller/manifests');
      },
      getManifestDetails: async (manifestId: string): Promise<ApiResponse<ManifestDetails>> => {
        return ServiceFactory.callApi(`/api/seller/manifests/${manifestId}`);
      },
      createManifest: async (data: CreateManifestData): Promise<ApiResponse<ManifestData>> => {
        return ServiceFactory.callApi('/api/seller/manifests', 'POST', data);
      },
      updateManifestStatus: async (manifestId: string, status: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/manifests/${manifestId}/status`, 'PATCH', { status });
      }
    },
    ndr: {
      getNDRs: async (status?: 'all' | 'action-required' | 'action-requested' | 'open' | 'closed'): Promise<ApiResponse<NDRData[]>> => {
        return ServiceFactory.callApi(`/api/seller/ndr${status ? `?status=${status}` : ''}`);
      },
      getNDRDetails: async (awb: string): Promise<ApiResponse<NDRDetails>> => {
        return ServiceFactory.callApi(`/api/seller/ndr/${awb}`);
      },
      updateNDRAction: async (awb: string, data: { action: string; comments: string }): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/ndr/${awb}/action`, 'POST', data);
      },
      uploadBulkNDR: async (file: File): Promise<ApiResponse<void>> => {
        const formData = new FormData();
        formData.append('file', file);
        return ServiceFactory.callApi('/api/seller/ndr/bulk-upload', 'POST', formData);
      },
      downloadNDR: async (format: 'csv' | 'xlsx'): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/api/seller/ndr/download?format=${format}`, 'GET', undefined, 'blob');
      }
    },
    order: {
      getDetails: async (id: string): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/api/seller/orders/${id}`);
      },
      getOrders: async (params: { status?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
        return ServiceFactory.callApi(`/api/seller/orders?${new URLSearchParams(params as any)}`);
      },
      updateStatus: async (id: string, status: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/orders/${id}/status`, 'PATCH', { status });
      },
      cancel: async (id: string, reason: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/orders/${id}/cancel`, 'POST', { reason });
      },
      updateTracking: async (id: string, trackingNumber: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/orders/${id}/tracking`, 'PATCH', { trackingNumber });
      },
      bulkUpdateStatus: async (orderIds: string[], status: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi('/api/seller/orders/bulk-status', 'PATCH', { orderIds, status });
      }
    },
    profile: {
      get: async (): Promise<ApiResponse<Seller>> => {
        return ServiceFactory.callApi('/api/seller/profile');
      },
      update: async (data: Partial<Seller>): Promise<ApiResponse<Seller>> => {
        return ServiceFactory.callApi('/api/seller/profile', 'PUT', data);
      },
      updateImage: async (file: File): Promise<ApiResponse<{ imageUrl: string }>> => {
        const formData = new FormData();
        formData.append('image', file);
        return ServiceFactory.callApi('/api/seller/profile/image', 'POST', formData);
      },
      updateStoreLinks: async (links: Seller['storeLinks']): Promise<ApiResponse<Seller>> => {
        return ServiceFactory.callApi('/api/seller/profile/store-links', 'PUT', { links });
      },
      getAgreements: async (): Promise<ApiResponse<AgreementVersion[]>> => {
        return ServiceFactory.callApi('/api/seller/profile/agreements');
      },
      acceptAgreement: async (version: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/profile/agreements/${version}/accept`, 'POST');
      },
      rejectAgreement: async (version: string): Promise<ApiResponse<void>> => {
        return ServiceFactory.callApi(`/api/seller/profile/agreements/${version}/reject`, 'POST');
      },
      downloadAgreement: async (version: string): Promise<ApiResponse<Blob>> => {
        return ServiceFactory.callApi(`/api/seller/profile/agreements/${version}/download`, 'GET', undefined, 'blob');
      }
    }
  };

  private static async callApi<T>(endpoint: string, method: string = 'GET', data?: any, responseType?: 'json' | 'blob'): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = responseType === 'blob' 
        ? await response.blob()
        : await response.json();

      return {
        success: true,
        data: result,
        message: 'Success',
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        data: null as unknown as T,
        message: error instanceof Error ? error.message : 'An error occurred',
        status: 500
      };
    }
  }
}

export const serviceFactory = ServiceFactory.getInstance(); 