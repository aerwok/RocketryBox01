import { ApiService, ApiResponse } from './api.service';
import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';
import { secureStorage } from '@/utils/secureStorage';

export type ApiStatus = "active" | "inactive" | "maintenance";
export type ServiceType = "domestic" | "international" | "express" | "standard" | "surface" | "air" | "heavy";

export interface Zone {
  name: string;
  baseRate: number;
  additionalRate: number;
}

export interface Partner {
    id: string;
    name: string;
    logoUrl?: string;
    apiStatus: ApiStatus;
    performanceScore: string;
    lastUpdated: string;
    shipmentCount: number;
    deliverySuccess: string;
    supportContact: string;
    supportEmail: string;
    apiKey?: string;
    apiEndpoint?: string;
    serviceTypes: ServiceType[];
    serviceAreas: string[];
    weightLimits: {
      min: number;
      max: number;
    };
    dimensionLimits?: {
      maxLength: number;
      maxWidth: number;
      maxHeight: number;
      maxSum: number;
    };
    rates: {
      baseRate: number;
      weightRate: number;
      dimensionalFactor: number;
    };
    zones?: Zone[];
    trackingUrl?: string;
    integrationDate: string;
    notes?: string;
}

class PartnersService extends ApiService {
    private static instance: PartnersService;

    private constructor() {
        super();
    }

    public static getInstance(): PartnersService {
        if (!PartnersService.instance) {
            PartnersService.instance = new PartnersService();
        }
        return PartnersService.instance;
    }

    private async getAuthHeader(): Promise<Record<string, string>> {
        const token = await secureStorage.getItem('token');
        return { 'Authorization': `Bearer ${token}` };
    }

    private async getCsrfHeader(): Promise<Record<string, string>> {
        const csrfToken = await secureStorage.getItem('csrf_token');
        return { 'X-CSRF-Token': csrfToken || '' };
    }

    /**
     * Get all shipping partners
     */
    public async getAllPartners(filters?: { status?: ApiStatus }): Promise<ApiResponse<Partner[]>> {
        try {
            const url = `${API_CONFIG.baseURL}/admin/partners`;
            const params = filters ? { status: filters.status } : {};
            
            const response = await axios.get(url, { 
                params,
                headers: {
                    ...await this.getAuthHeader(),
                    ...await this.getCsrfHeader()
                }
            });
            
            return {
                data: response.data,
                status: response.status,
                message: 'Request successful',
                success: true
            };
        } catch (error) {
            console.error('Error fetching partners:', error);
            throw error;
        }
    }

    /**
     * Get a single partner by ID
     */
    public async getPartnerById(id: string): Promise<ApiResponse<Partner>> {
        try {
            const url = `${API_CONFIG.baseURL}/admin/partners/${id}`;
            
            const response = await axios.get(url, { 
                headers: {
                    ...await this.getAuthHeader(),
                    ...await this.getCsrfHeader()
                }
            });
            
            return {
                data: response.data,
                status: response.status,
                message: 'Request successful',
                success: true
            };
        } catch (error) {
            console.error(`Error fetching partner with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create a new partner
     */
    public async createPartner(partnerData: Omit<Partner, 'id'>): Promise<ApiResponse<Partner>> {
        try {
            const url = `${API_CONFIG.baseURL}/admin/partners`;
            
            const response = await axios.post(url, partnerData, { 
                headers: {
                    ...await this.getAuthHeader(),
                    ...await this.getCsrfHeader()
                }
            });
            
            return {
                data: response.data,
                status: response.status,
                message: 'Request successful',
                success: true
            };
        } catch (error) {
            console.error('Error creating partner:', error);
            throw error;
        }
    }

    /**
     * Update an existing partner
     */
    public async updatePartner(id: string, partnerData: Partial<Partner>): Promise<ApiResponse<Partner>> {
        try {
            const url = `${API_CONFIG.baseURL}/admin/partners/${id}`;
            
            const response = await axios.put(url, partnerData, { 
                headers: {
                    ...await this.getAuthHeader(),
                    ...await this.getCsrfHeader()
                }
            });
            
            return {
                data: response.data,
                status: response.status,
                message: 'Request successful',
                success: true
            };
        } catch (error) {
            console.error(`Error updating partner with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a partner
     */
    public async deletePartner(id: string): Promise<ApiResponse<void>> {
        try {
            const url = `${API_CONFIG.baseURL}/admin/partners/${id}`;
            
            const response = await axios.delete(url, { 
                headers: {
                    ...await this.getAuthHeader(),
                    ...await this.getCsrfHeader()
                }
            });
            
            return {
                data: response.data,
                status: response.status,
                message: 'Request successful',
                success: true
            };
        } catch (error) {
            console.error(`Error deleting partner with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete multiple partners
     */
    public async deleteManyPartners(ids: string[]): Promise<ApiResponse<void>> {
        try {
            const url = `${API_CONFIG.baseURL}/admin/partners/batch-delete`;
            
            const response = await axios.post(url, { ids }, { 
                headers: {
                    ...await this.getAuthHeader(),
                    ...await this.getCsrfHeader()
                }
            });
            
            return {
                data: response.data,
                status: response.status,
                message: 'Request successful',
                success: true
            };
        } catch (error) {
            console.error('Error deleting multiple partners:', error);
            throw error;
        }
    }

    /**
     * Refresh API connections for partners
     */
    public async refreshPartnerAPIs(ids: string[]): Promise<ApiResponse<{ successful: string[], failed: string[] }>> {
        try {
            const url = `${API_CONFIG.baseURL}/admin/partners/refresh-api`;
            
            const response = await axios.post(url, { ids }, { 
                headers: {
                    ...await this.getAuthHeader(),
                    ...await this.getCsrfHeader()
                }
            });
            
            return {
                data: response.data,
                status: response.status,
                message: 'Request successful',
                success: true
            };
        } catch (error) {
            console.error('Error refreshing partner APIs:', error);
            throw error;
        }
    }
}

export default PartnersService.getInstance(); 