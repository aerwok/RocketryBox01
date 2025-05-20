import { ApiService, ApiResponse } from './api.service';
import { secureStorage } from '@/utils/secureStorage';
import { validateAmount, validatePaymentMethod, validateTransactionId, ERROR_MESSAGES } from '@/utils/validation';
import { v4 as uuidv4 } from 'uuid';
import api from '@/config/api.config';

export interface WalletBalance {
    walletBalance: number;
    lastRecharge: number;
    remittanceBalance: number;
    lastUpdated: string;
}

export interface WalletTransaction {
    transactionId: string;
    date: string;
    type: "Credit" | "Debit";
    amount: number;
    balance: number;
    description: string;
    status: "Success" | "Pending" | "Failed";
    paymentMethod?: string;
    metadata?: Record<string, unknown>;
}

export interface WalletHistoryResponse {
    transactions: WalletTransaction[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
}

export interface RechargeRequest {
    amount: number;
    paymentMethod: string;
    transactionId: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

class WalletService extends ApiService {
    private static instance: WalletService;
    private readonly CACHE_KEY = 'wallet_balance';
    private readonly CACHE_DURATION = 30000; // 30 seconds
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;

    private constructor() {
        super();
    }

    public static getInstance(): WalletService {
        if (!WalletService.instance) {
            WalletService.instance = new WalletService();
        }
        return WalletService.instance;
    }

    private async getCachedBalance(): Promise<WalletBalance | null> {
        try {
            const cached = await secureStorage.getItem(this.CACHE_KEY);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                await secureStorage.removeItem(this.CACHE_KEY);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }

    private setCachedBalance(data: WalletBalance): void {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            secureStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache write error:', error);
        }
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
            data: response.data,
            message: 'Request successful',
            status: response.status,
            success: true
        };
    }

    async getWalletBalance(): Promise<ApiResponse<WalletBalance>> {
        return this.retryWithBackoff(async () => {
            // Check cache first
            const cached = await this.getCachedBalance();
            if (cached) {
                return {
                    data: cached,
                    status: 200,
                    message: 'Request successful',
                    success: true
                };
            }

            const response = await WalletService.handleRequest<WalletBalance>(
                api.get('/wallet/balance', {
                    headers: {
                        ...(await WalletService.getAuthHeader()),
                        ...(await WalletService.getCsrfHeader())
                    }
                })
            );

            // Cache the response
            this.setCachedBalance(response.data);
            
            return response;
        });
    }

    async getWalletHistory(page: number = 1, limit: number = 10): Promise<ApiResponse<WalletHistoryResponse>> {
        return this.retryWithBackoff(async () => {
            return WalletService.handleRequest<WalletHistoryResponse>(
                api.get('/wallet/history', {
                    params: { page, limit },
                    headers: {
                        ...(await WalletService.getAuthHeader()),
                        ...(await WalletService.getCsrfHeader())
                    }
                })
            );
        });
    }

    async rechargeWallet(params: { amount: number; paymentMethod: string }): Promise<ApiResponse<WalletBalance>> {
        return this.retryWithBackoff(async () => {
            // Validate inputs
            if (!validateAmount(params.amount)) {
                throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
            }
            if (!validatePaymentMethod(params.paymentMethod)) {
                throw new Error(ERROR_MESSAGES.INVALID_PAYMENT_METHOD);
            }

            const rechargeRequest: RechargeRequest = {
                amount: params.amount,
                paymentMethod: params.paymentMethod,
                transactionId: uuidv4(),
                timestamp: Date.now(),
                metadata: {
                    clientInfo: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language
                    }
                }
            };

            const response = await WalletService.handleRequest<WalletBalance>(
                api.post('/wallet/recharge', rechargeRequest, {
                    headers: {
                        ...(await WalletService.getAuthHeader()),
                        ...(await WalletService.getCsrfHeader())
                    }
                })
            );

            // Clear cache after successful recharge
            secureStorage.removeItem(this.CACHE_KEY);
            
            return response;
        });
    }

    async verifyTransaction(transactionId: string): Promise<ApiResponse<{ verified: boolean }>> {
        return this.retryWithBackoff(async () => {
            if (!validateTransactionId(transactionId)) {
                throw new Error(ERROR_MESSAGES.INVALID_TRANSACTION_ID);
            }

            return WalletService.handleRequest<{ verified: boolean }>(
                api.get(`/wallet/verify-transaction/${transactionId}`, {
                    headers: {
                        ...(await WalletService.getAuthHeader()),
                        ...(await WalletService.getCsrfHeader())
                    }
                })
            );
        });
    }
}

export const walletService = WalletService.getInstance(); 