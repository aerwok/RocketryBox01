import { ApiService, ApiResponse } from './api.service';
import { ExcelValidator, ExcelValidationResult } from '@/utils/excel';
import { secureStorage } from '@/utils/secureStorage';
import { ERROR_MESSAGES } from '@/utils/validation';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export interface ExcelColumnConfig {
    name: string;
    required: boolean;
    type: 'string' | 'number' | 'date' | 'email' | 'phone';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidation?: (value: any) => boolean;
    customErrorMessage?: string;
}

export interface BulkOrderRequest {
    fileId: string;
    fileName: string;
    totalRows: number;
    metadata: {
        uploadedAt: string;
        uploadedBy: string;
        clientInfo: {
            userAgent: string;
            platform: string;
            language: string;
        };
    };
}

export interface BulkOrderResponse {
    orderId: string;
    status: 'Processing' | 'Completed' | 'Failed';
    totalRows: number;
    processedRows: number;
    failedRows: number;
    errors?: Array<{
        row: number;
        message: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface BulkOrderStatus {
    orderId: string;
    status: 'Processing' | 'Completed' | 'Failed';
    progress: number;
    totalRows: number;
    processedRows: number;
    failedRows: number;
    errors?: Array<{
        row: number;
        message: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface ReceivedOrder {
    awb: string;
    receivedAt: string;
    receivedBy: string;
    status: string;
    notes: string;
    items: {
        name: string;
        sku: string;
        quantity: number;
        price: number;
        condition: string;
        notes: string;
    }[];
}

class BulkOrderService extends ApiService {
    private static instance: BulkOrderService;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;

    private constructor() {
        super();
    }

    public static getInstance(): BulkOrderService {
        if (!BulkOrderService.instance) {
            BulkOrderService.instance = new BulkOrderService();
        }
        return BulkOrderService.instance;
    }

    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        retries: number = this.MAX_RETRIES
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
            return this.retryWithBackoff(operation, retries - 1);
        }
    }

    async validateExcelFile(
        file: File,
        config: ExcelColumnConfig[]
    ): Promise<ExcelValidationResult> {
        return this.retryWithBackoff(async () => {
            // Validate file
            const fileError = ExcelValidator.validateFile(file);
            if (fileError) {
                return {
                    isValid: false,
                    errors: [{
                        row: 0,
                        column: 'ALL',
                        message: fileError
                    }],
                    data: []
                };
            }

            // Validate data
            return ExcelValidator.validateExcelData(file, config);
        });
    }

    private handleErrorResponse(response: Response | XMLHttpRequest): Error {
        const status = response instanceof Response ? response.status : response.status;
        const statusText = response instanceof Response ? response.statusText : response.statusText;

        switch (status) {
            case 400:
                return new Error('Invalid request data');
            case 401:
                return new Error(ERROR_MESSAGES.UNAUTHORIZED);
            case 403:
                return new Error(ERROR_MESSAGES.FORBIDDEN);
            case 413:
                return new Error('File size too large');
            case 415:
                return new Error('Unsupported file type');
            case 429:
                return new Error('Too many requests. Please try again later.');
            case 500:
                return new Error(ERROR_MESSAGES.SERVER_ERROR);
            default:
                return new Error(`Error: ${statusText}`);
        }
    }

    async uploadBulkOrder(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponse<BulkOrderResponse>> {
        return this.retryWithBackoff(async () => {
            // Create FormData
            const formData = new FormData();
            const fileId = uuidv4();
            formData.append('file', file);
            formData.append('fileId', fileId);

            // Create request metadata
            const metadata = {
                uploadedAt: new Date().toISOString(),
                uploadedBy: await secureStorage.getItem('user_id') || 'unknown',
                clientInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language
                }
            };
            formData.append('metadata', JSON.stringify(metadata));

            // Use XMLHttpRequest for upload progress tracking
            return new Promise<ApiResponse<BulkOrderResponse>>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && onProgress) {
                        const progress = (event.loaded / event.total) * 100;
                        onProgress(progress);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve({
                                data: response,
                                message: 'File uploaded successfully',
                                status: xhr.status,
                                success: true
                            });
                        } catch (error) {
                            reject(new Error(ERROR_MESSAGES.SERVER_ERROR));
                        }
                    } else {
                        reject(this.handleErrorResponse(xhr));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
                });

                xhr.open('POST', '/api/bulk-orders/upload');
                
                Promise.all([
                    secureStorage.getItem('token'),
                    secureStorage.getItem('csrf_token')
                ]).then(([token, csrfToken]) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.setRequestHeader('X-CSRF-Token', csrfToken || '');
                    xhr.send(formData);
                });
            });
        });
    }

    async getBulkOrderStatus(orderId: string): Promise<ApiResponse<BulkOrderStatus>> {
        return this.retryWithBackoff(async () => {
            const [authHeader, csrfHeader] = await Promise.all([
                BulkOrderService.getAuthHeader(),
                BulkOrderService.getCsrfHeader()
            ]);
            return BulkOrderService.handleRequest<BulkOrderStatus>(
                fetch(`/api/bulk-orders/${orderId}/status`, {
                    headers: {
                        ...authHeader,
                        ...csrfHeader
                    }
                }).then(response => response.json())
            );
        });
    }

    async getReceivedOrders(): Promise<ApiResponse<ReceivedOrder[]>> {
        return this.retryWithBackoff(async () => {
            const [authHeader, csrfHeader] = await Promise.all([
                BulkOrderService.getAuthHeader(),
                BulkOrderService.getCsrfHeader()
            ]);
            return BulkOrderService.handleRequest<ReceivedOrder[]>(
                fetch('/api/seller/received-orders', {
                    headers: {
                        ...authHeader,
                        ...csrfHeader
                    }
                }).then(response => response.json())
            );
        });
    }

    async downloadSampleTemplate(): Promise<ApiResponse<Blob>> {
        return this.retryWithBackoff(async () => {
            const [authHeader, csrfHeader] = await Promise.all([
                BulkOrderService.getAuthHeader(),
                BulkOrderService.getCsrfHeader()
            ]);
            return BulkOrderService.handleRequest<Blob>(
                fetch('/api/seller/received-orders/template', {
                    headers: {
                        ...authHeader,
                        ...csrfHeader
                    }
                }).then(response => response.blob())
            );
        });
    }

    async cancelBulkOrder(orderId: string): Promise<ApiResponse<{ success: boolean }>> {
        return this.retryWithBackoff(async () => {
            const [authHeader, csrfHeader] = await Promise.all([
                BulkOrderService.getAuthHeader(),
                BulkOrderService.getCsrfHeader()
            ]);
            return BulkOrderService.handleRequest<{ success: boolean }>(
                fetch(`/api/bulk-orders/${orderId}/cancel`, {
                    method: 'POST',
                    headers: {
                        ...authHeader,
                        ...csrfHeader
                    }
                }).then(response => response.json())
            );
        });
    }

    async downloadBulkOrderTemplate(): Promise<Blob> {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Define headers and descriptions
            const headers = [
                // Grid 1
                'Order Id *',
                'Payment Type *',
                'Order Date *',
                'Shipping Full Name *',
                'Shipping Company Name',
                'Shipping Address Line1 *',
                'Shipping Address Line2 *',
                'Shipping Contact Number *',
                'Shipping City *',
                'Shipping Pincode *',
                'Billing Full Name',
                
                // Grid 2
                'Billing Company Name',
                'Billing Address1',
                'Billing Address2',
                'Billing City',
                'Billing Pincode',
                'Billing GST',
                'Package Weight *',
                'Package Length *',
                'Package Height *',
                'Package Width *',
                'Purchase Amount *',
                
                // Grid 3 - Product 1
                'SKU1',
                'Product Name1 *',
                'Quantity1 *',
                'Item Weight1 *',
                'Item Price1 *',
                
                // Grid 3 - Product 2
                'SKU2',
                'Product Name2',
                'Quantity2',
                'Item Weight2',
                'Item Price2',
                
                // Grid 4 - Product 3
                'SKU3',
                'Product Name3',
                'Quantity3',
                'Item Weight3',
                'Item Price3',
                
                // Grid 4 - Product 4
                'SKU4',
                'Product Name4',
                'Quantity4',
                'Item Weight4',
                'Item Price4'
            ];

            const descriptions = [
                // Grid 1
                'NT0075 (Your store order-number)',
                'COD/PAID/REV',
                '2022/07/20',
                'Sangeeta Singh',
                'Test Company',
                'Shipping address - 1',
                'Shipping address - 2',
                '8989898989',
                'New Delhi',
                '110062',
                'Test',
                
                // Grid 2
                'Test Company',
                'Test Billing address - 1',
                'Test Billing address - 2',
                'New Delhi',
                '122001',
                '22AAAAA0000A1Z5',
                '0.5Kg',
                '10',
                '10',
                '3Kg (Total Weight)',
                '1000',
                
                // Grid 3 - Product 1
                'DLR_RED (Product-1 SKU)',
                'T-shirt - 32 Red',
                '1',
                '0.5Kg',
                '230',
                
                // Grid 3 - Product 2
                'DLR_GRN',
                'T-shirt - 32 Green',
                '1',
                '0.5Kg',
                '100',
                
                // Grid 4 - Product 3
                'DLR_BLU (Product-3 SKU)',
                'T-shirt - 32 Blue',
                '3',
                '1.5Kg',
                '290',
                
                // Grid 4 - Product 4
                'DLR_YLO',
                'T-shirt - 32 Yellow',
                '10',
                '0.5Kg',
                '100'
            ];

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet([headers, descriptions]);

            // Add column widths
            const colWidths = headers.map(() => ({ wch: 20 }));
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Bulk Order Template');

            // Generate Excel file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            return blob;
        } catch (error) {
            console.error('Template generation error:', error);
            throw new Error(ERROR_MESSAGES.DOWNLOAD_ERROR);
        }
    }

    private static async getAuthHeader(): Promise<Record<string, string>> {
        const token = await secureStorage.getItem('token');
        return { 'Authorization': `Bearer ${token}` };
    }

    private static async getCsrfHeader(): Promise<Record<string, string>> {
        const csrfToken = await secureStorage.getItem('csrf_token');
        return { 'X-CSRF-Token': csrfToken || '' };
    }

    private static async handleRequest<T>(promise: Promise<any>): Promise<ApiResponse<T>> {
        const response = await promise;
        return {
            data: response,
            message: 'Request successful',
            status: 200,
            success: true
        };
    }
}

export const bulkOrderService = BulkOrderService.getInstance(); 