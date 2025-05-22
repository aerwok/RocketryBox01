import { ApiService, ApiResponse } from './api.service';
import { secureStorage } from '@/utils/secureStorage';
import { validateAmount, validatePaymentMethod, validateTransactionId, ERROR_MESSAGES } from '@/utils/validation';
import { v4 as uuidv4 } from 'uuid';

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
    private readonly CACHE_KEY_BALANCE = 'wallet_balance';
    private readonly CACHE_KEY_HISTORY = 'wallet_history';
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
            const cached = await secureStorage.getItem(this.CACHE_KEY_BALANCE);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                await secureStorage.removeItem(this.CACHE_KEY_BALANCE);
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
            secureStorage.setItem(this.CACHE_KEY_BALANCE, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }
    
    private async getCachedHistory(page: number, limit: number): Promise<WalletHistoryResponse | null> {
        try {
            const cacheKey = `${this.CACHE_KEY_HISTORY}_${page}_${limit}`;
            const cached = await secureStorage.getItem(cacheKey);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                await secureStorage.removeItem(cacheKey);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Cache read error for history:', error);
            return null;
        }
    }

    private setCachedHistory(data: WalletHistoryResponse, page: number, limit: number): void {
        try {
            const cacheKey = `${this.CACHE_KEY_HISTORY}_${page}_${limit}`;
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            secureStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Cache write error for history:', error);
        }
    }

    private async getAllHistoryCacheKeys(): Promise<string[]> {
        // This is a helper method to find all history cache keys
        // In a real implementation, we would store references to all cache keys
        // For now, we'll use a simple prefix-based approach
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.CACHE_KEY_HISTORY)) {
                keys.push(key);
            }
        }
        return keys;
    }

    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        retries: number = this.MAX_RETRIES
    ): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            // Don't retry if we've exhausted our retries
            if (retries === 0) throw error;
            
            // Calculate exponential backoff delay
            const retryCount = this.MAX_RETRIES - retries + 1;
            let delay = this.RETRY_DELAY * Math.pow(2, retryCount - 1); // Exponential backoff
            
            // If it's a rate limit error (429), add extra delay
            if (error.status === 429) {
                delay = Math.max(delay, 5000); // At least 5 seconds for rate limit errors
                console.log(`Rate limit exceeded (retry ${retryCount}), waiting ${delay}ms before retry`);
            } else if (error.status === 404) {
                console.log(`Resource not found (retry ${retryCount}), waiting ${delay}ms before retry`);
            } else {
                console.log(`API error (retry ${retryCount}), waiting ${delay}ms before retry: ${error.message || 'Unknown error'}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.retryWithBackoff(operation, retries - 1);
        }
    }

    async getWalletBalance(): Promise<ApiResponse<WalletBalance>> {
        return this.retryWithBackoff(async () => {
            try {
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

                // Use relative path - the ApiService will add the /api/v2 prefix 
                const response = await this.get<WalletBalance>('/seller/wallet/balance');
                
                // Cache the response
                this.setCachedBalance(response.data);
                
                return response;
            } catch (error) {
                // Add increasing delay between retries
                const retryCount = this.MAX_RETRIES - (arguments[1] || this.MAX_RETRIES) + 1;
                const delay = this.RETRY_DELAY * retryCount * 2; // Exponential backoff
                
                console.error(`Error fetching wallet balance (retry ${retryCount}), waiting ${delay}ms:`, error);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                throw error;
            }
        });
    }

    async getWalletHistory(page: number = 1, limit: number = 10): Promise<ApiResponse<WalletHistoryResponse>> {
        return this.retryWithBackoff(async () => {
            try {
                // Check cache first
                const cached = await this.getCachedHistory(page, limit);
                if (cached) {
                    return {
                        data: cached,
                        status: 200,
                        message: 'Request successful',
                        success: true
                    };
                }

                // Use relative path - the ApiService will add the /api/v2 prefix
                // Pass page and limit directly to ensure they're not nested in a params object
                const response = await this.get<WalletHistoryResponse>('/seller/wallet/history', { 
                    page, 
                    limit 
                });
                
                // Cache the response
                this.setCachedHistory(response.data, page, limit);
                
                return response;
            } catch (error) {
                // Add increasing delay between retries
                const retryCount = this.MAX_RETRIES - (arguments[1] || this.MAX_RETRIES) + 1;
                const delay = this.RETRY_DELAY * retryCount * 2; // Exponential backoff
                
                console.error(`Error fetching wallet history (retry ${retryCount}), waiting ${delay}ms:`, error);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                throw error;
            }
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

            try {
                // First initiate the recharge
                const initiateResponse = await this.post<{ orderId: string }>('/seller/wallet/recharge/initiate', { 
                    amount: params.amount 
                });
                
                // For demonstration purposes, we'll immediately verify it
                // In a real app, there would be a payment UI step in between
                const verifyResponse = await this.post<WalletBalance>('/seller/wallet/recharge/verify', {
                    paymentId: rechargeRequest.transactionId,
                    orderId: initiateResponse.data.orderId,
                    signature: 'test_signature', // In real app this would come from payment gateway
                    amount: params.amount
                });
                
                // Clear balance cache after successful recharge
                secureStorage.removeItem(this.CACHE_KEY_BALANCE);
                
                // Clear history caches by finding keys with the history prefix
                const historyCacheKeys = await this.getAllHistoryCacheKeys();
                for (const key of historyCacheKeys) {
                    secureStorage.removeItem(key);
                }
                
                return verifyResponse;
            } catch (error) {
                console.error('Error recharging wallet:', error);
                throw error;
            }
        });
    }

    async verifyTransaction(transactionId: string): Promise<ApiResponse<{ verified: boolean }>> {
        return this.retryWithBackoff(async () => {
            if (!validateTransactionId(transactionId)) {
                throw new Error(ERROR_MESSAGES.INVALID_TRANSACTION_ID);
            }

            try {
                // Use relative path - the ApiService will add the /api/v2 prefix
                return await this.get<{ verified: boolean }>(`/seller/wallet/${transactionId}`);
            } catch (error) {
                console.error('Error verifying transaction:', error);
                throw error;
            }
        });
    }
}

export const walletService = WalletService.getInstance(); 