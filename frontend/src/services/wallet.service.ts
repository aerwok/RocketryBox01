import { secureStorage } from '@/utils/secureStorage';
import { ERROR_MESSAGES, validateAmount, validatePaymentMethod, validateTransactionId } from '@/utils/validation';
import { ApiResponse, ApiService } from './api.service';

export interface WalletBalance {
  walletBalance: number;
  lastRecharge: number;
  remittanceBalance: number;
  lastUpdated: string;
}

export interface WalletTransaction {
  _id: string;
  seller: string;
  date: string;
  referenceNumber?: string;
  orderId?: string;
  type: "Recharge" | "Debit" | "COD Credit" | "Refund";
  amount: string;
  codCharge?: string;
  igst?: string;
  subTotal?: string;
  closingBalance: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletHistoryResponse {
  data: WalletTransaction[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface RechargeRequest {
  amount: number;
  paymentMethod: string;
  transactionId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class WalletService {
  private static instance: WalletService;
  private readonly CACHE_KEY_BALANCE = 'wallet_balance';
  private readonly CACHE_KEY_HISTORY = 'wallet_history';
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly apiService: ApiService;

  private constructor() {
    this.apiService = ApiService.getInstance();
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
        const response = await this.apiService.get<WalletBalance>('/seller/wallet/balance');

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

        // Call the backend API
        const response = await this.apiService.get<any>('/seller/wallet/history', {
          page,
          limit
        });

        // Handle different response structures
        let transformedResponse: WalletHistoryResponse;

        if (Array.isArray(response.data)) {
          // Direct array format (middleware auto-extraction)
          transformedResponse = {
            data: response.data,
            pagination: {
              total: response.data.length,
              page: page,
              pages: Math.max(1, Math.ceil(response.data.length / limit))
            }
          };
        } else if (response.data && response.data.success && response.data.data) {
          // Standard backend format
          transformedResponse = {
            data: response.data.data || [],
            pagination: response.data.pagination || {
              total: response.data.data ? response.data.data.length : 0,
              page: page,
              pages: 1
            }
          };
        } else {
          // Fallback extraction
          const extractedData = response.data?.data || response.data?.transactions || response.data || [];
          const finalData = Array.isArray(extractedData) ? extractedData : [];

          transformedResponse = {
            data: finalData,
            pagination: response.data?.pagination || {
              total: finalData.length,
              page: page,
              pages: Math.max(1, Math.ceil(finalData.length / limit))
            }
          };

          // No warning for empty transactions - this is normal for new sellers
          console.log('[WALLET] Retrieved transaction history:', {
            transactionCount: finalData.length,
            page: page,
            isNewSeller: finalData.length === 0
          });
        }

        // Cache the response
        this.setCachedHistory(transformedResponse, page, limit);

        return {
          data: transformedResponse,
          status: 200,
          message: 'Request successful',
          success: true
        };
      } catch (error) {
        console.error('[WALLET] Error fetching transaction history:', error);

        // Return empty data structure instead of throwing
        const fallbackResponse: WalletHistoryResponse = {
          data: [],
          pagination: {
            total: 0,
            page: page,
            pages: 1
          }
        };

        return {
          data: fallbackResponse,
          status: 200,
          message: 'No transactions found',
          success: true
        };
      }
    });
  }

  async rechargeWallet(params: { amount: number; paymentMethod: string }): Promise<ApiResponse<WalletBalance>> {
    // Validate inputs
    if (!validateAmount(params.amount)) {
      throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
    }
    if (!validatePaymentMethod(params.paymentMethod)) {
      throw new Error(ERROR_MESSAGES.INVALID_PAYMENT_METHOD);
    }

    // Only allow Razorpay for onlineBanking payment method
    if (params.paymentMethod !== 'onlineBanking') {
      throw new Error('Razorpay integration is only available for Online Banking payment method');
    }

    try {
      // Prevent multiple concurrent payment attempts
      if ((window as any).walletRechargeInProgress) {
        throw new Error('Payment is already in progress. Please wait.');
      }

      // Set global flag to prevent concurrent recharges
      (window as any).walletRechargeInProgress = true;

      // Step 1: Initiate the recharge and get Razorpay order
      const initiateResponse = await this.apiService.post<{
        orderId: string;
        amount: number;
        currency: string;
        key: string;
        name: string;
        description: string;
        prefill: {
          name: string;
          email: string;
          contact: string;
        };
        theme: {
          color: string;
        };
      }>('/seller/wallet/recharge/initiate', {
        amount: params.amount
      });

      const razorpayData = initiateResponse.data;

      // Step 2: Open Razorpay payment modal and handle payment
      return new Promise((resolve, reject) => {
        // Check if Razorpay is loaded
        if (typeof (window as any).Razorpay === 'undefined') {
          (window as any).walletRechargeInProgress = false;
          reject(new Error('Razorpay library is not loaded. Please refresh the page and try again.'));
          return;
        }

        const handlePaymentSuccess = async (response: any) => {
          try {
            console.log('[WALLET] Payment success response:', response);

            // Step 3: Verify payment with backend
            const verificationData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: params.amount
            };

            console.log('[WALLET] Sending verification data:', verificationData);

            const verifyResponse = await this.apiService.post<{
              transaction: any;
              balance: string;
              message: string;
            }>('/seller/wallet/recharge/verify', verificationData);

            console.log('[WALLET] Verification response:', verifyResponse);

            // Clear caches
            secureStorage.removeItem(this.CACHE_KEY_BALANCE);
            const historyCacheKeys = await this.getAllHistoryCacheKeys();
            for (const key of historyCacheKeys) {
              secureStorage.removeItem(key);
            }

            // Create response
            const walletBalance: WalletBalance = {
              walletBalance: parseFloat(verifyResponse.data.balance),
              lastRecharge: params.amount,
              remittanceBalance: 0,
              lastUpdated: new Date().toISOString()
            };

            // Clear progress flag
            (window as any).walletRechargeInProgress = false;

            resolve({
              data: walletBalance,
              status: 200,
              message: verifyResponse.data.message || 'Wallet recharged successfully',
              success: true
            });
          } catch (verifyError: any) {
            console.error('[WALLET] Payment verification failed - Full error:', verifyError);
            console.error('[WALLET] Error details:', {
              message: verifyError?.message,
              status: verifyError?.status,
              code: verifyError?.code,
              data: verifyError?.data,
              stack: verifyError?.stack
            });

            (window as any).walletRechargeInProgress = false;

            // Provide more specific error messages based on error type
            let errorMessage = 'Payment verification failed. Your payment may have been processed. Please check your wallet balance.';

            if (verifyError?.status === 400) {
              errorMessage = 'Payment verification failed due to invalid data. Please contact support if the amount was debited.';
            } else if (verifyError?.status === 401) {
              errorMessage = 'Authentication failed during verification. Please login again and check your wallet balance.';
            } else if (verifyError?.status === 500) {
              errorMessage = 'Server error during verification. Your payment may have been processed. Please check your wallet balance.';
            } else if (verifyError?.message?.includes('timeout')) {
              errorMessage = 'Verification timeout. Your payment may have been processed. Please check your wallet balance.';
            } else if (verifyError?.message?.includes('network')) {
              errorMessage = 'Network error during verification. Please check your connection and wallet balance.';
            }

            reject(new Error(errorMessage));
          }
        };

        const handlePaymentError = (_error: any) => {
          (window as any).walletRechargeInProgress = false;
          reject(new Error('Payment was cancelled'));
        };

        const razorpayOptions = {
          key: razorpayData.key,
          amount: razorpayData.amount * 100,
          currency: razorpayData.currency,
          name: razorpayData.name,
          description: razorpayData.description,
          order_id: razorpayData.orderId,
          handler: handlePaymentSuccess,
          prefill: razorpayData.prefill,
          theme: razorpayData.theme,
          modal: {
            ondismiss: handlePaymentError
          }
        };

        const razorpay = new (window as any).Razorpay(razorpayOptions);
        razorpay.open();
      });

    } catch (error) {
      console.error('[WALLET] Recharge failed:', error);
      (window as any).walletRechargeInProgress = false;
      throw error;
    }
  }

  async verifyTransaction(transactionId: string): Promise<ApiResponse<{ verified: boolean }>> {
    return this.retryWithBackoff(async () => {
      if (!validateTransactionId(transactionId)) {
        throw new Error(ERROR_MESSAGES.INVALID_TRANSACTION_ID);
      }

      try {
        // Use relative path - the ApiService will add the /api/v2 prefix
        return await this.apiService.get<{ verified: boolean }>(`/seller/wallet/${transactionId}`);
      } catch (error) {
        console.error('Error verifying transaction:', error);
        throw error;
      }
    });
  }
}

export const walletService = WalletService.getInstance();
