import { ApiResponse } from './api.service';
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

class BulkOrderService {
    private static instance: BulkOrderService;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;

    private constructor() {}

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
                                data: response.data,
                                message: response.message || 'File uploaded successfully',
                                status: xhr.status,
                                success: response.success || true
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

                xhr.open('POST', '/api/v2/seller/bulk-orders/upload');
                
                Promise.all([
                    secureStorage.getItem('auth_token'),
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
                this.getAuthHeader(),
                this.getCsrfHeader()
            ]);
            return this.handleRequest<BulkOrderStatus>(
                fetch(`/api/v2/seller/bulk-orders/${orderId}/status`, {
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
                this.getAuthHeader(),
                this.getCsrfHeader()
            ]);
            return this.handleRequest<ReceivedOrder[]>(
                fetch('/api/v2/seller/orders', {
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
                this.getAuthHeader(),
                this.getCsrfHeader()
            ]);
            return this.handleRequest<Blob>(
                fetch('/api/v2/seller/bulk-orders/template', {
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
                this.getAuthHeader(),
                this.getCsrfHeader()
            ]);
            return this.handleRequest<{ success: boolean }>(
                fetch(`/api/v2/seller/bulk-orders/${orderId}/cancel`, {
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
            const [authHeader, csrfHeader] = await Promise.all([
                this.getAuthHeader(),
                this.getCsrfHeader()
            ]);
            
            const response = await fetch('/api/v2/seller/bulk-orders/template', {
                headers: {
                    ...authHeader,
                    ...csrfHeader
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            console.error('Template download error:', error);
            throw new Error(ERROR_MESSAGES.DOWNLOAD_ERROR);
        }
    }

    private async getAuthHeader(): Promise<Record<string, string>> {
        const token = await secureStorage.getItem('auth_token');
        return { 'Authorization': `Bearer ${token}` };
    }

    private async getCsrfHeader(): Promise<Record<string, string>> {
        const csrfToken = await secureStorage.getItem('csrf_token');
        return { 'X-CSRF-Token': csrfToken || '' };
    }

    private async handleRequest<T>(promise: Promise<any>): Promise<ApiResponse<T>> {
        const response = await promise;
        return {
            data: response.data || response,
            message: response.message || 'Request successful',
            status: response.status || 200,
            success: response.success !== undefined ? response.success : true
        };
    }
}

export const bulkOrderService = BulkOrderService.getInstance(); 