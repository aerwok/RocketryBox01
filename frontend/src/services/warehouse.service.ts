interface WarehouseData {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddWarehouseRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface WarehouseResponse {
  success: boolean;
  data?: {
    warehouses: WarehouseData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface AddWarehouseResponse {
  success: boolean;
  data?: {
    warehouse: WarehouseData;
  };
  error?: {
    code: string;
    message: string;
  };
}

class WarehouseService {
  private getAuthToken(): string | null {
    return localStorage.getItem('seller_token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getWarehouses(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<WarehouseResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.search) queryParams.set('search', params.search);

      const url = `/api/v2/seller/warehouse${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch warehouses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw error;
    }
  }

  async addWarehouse(warehouseData: AddWarehouseRequest): Promise<AddWarehouseResponse> {
    try {
      const response = await fetch('/api/v2/seller/warehouse', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(warehouseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to add warehouse');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding warehouse:', error);
      throw error;
    }
  }
}

export const warehouseService = new WarehouseService();
export type { AddWarehouseRequest, AddWarehouseResponse, WarehouseData, WarehouseResponse };
