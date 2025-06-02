import { useState, useCallback, useEffect } from 'react';
import { walletService, WalletBalance, WalletTransaction } from '@/services/wallet.service';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/utils/validation';
import { usePermissions } from '@/hooks/usePermissions';

interface UseWalletReturn {
    walletBalance: WalletBalance | null;
    isLoadingBalance: boolean;
    isRecharging: boolean;
    transactions: WalletTransaction[];
    isLoadingTransactions: boolean;
    hasMoreTransactions: boolean;
    currentPage: number;
    totalPages: number;
    hasWalletAccess: boolean;
    getWalletBalance: () => Promise<void>;
    rechargeWallet: (params: { amount: number; paymentMethod: string }) => Promise<void>;
    loadMoreTransactions: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
}

export const useWallet = (): UseWalletReturn => {
    const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isRecharging, setIsRecharging] = useState(false);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
    
    const { hasPermission } = usePermissions();
    const hasWalletAccess = hasPermission('Wallet');

    const getWalletBalance = useCallback(async () => {
        // Don't fetch wallet data if user doesn't have wallet permission
        if (!hasWalletAccess) {
            console.log('User does not have wallet access, skipping wallet balance fetch');
            setWalletBalance({ walletBalance: 0, lastRecharge: 0, remittanceBalance: 0, lastUpdated: new Date().toISOString() });
            return;
        }

        try {
            setIsLoadingBalance(true);
            const response = await walletService.getWalletBalance();
            setWalletBalance(response.data);
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            // Don't show error toast for users without wallet access
            if (hasWalletAccess) {
                toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
            }
        } finally {
            setIsLoadingBalance(false);
        }
    }, [hasWalletAccess]);

    const rechargeWallet = useCallback(async (params: { amount: number; paymentMethod: string }) => {
        // Don't allow recharge if user doesn't have wallet permission
        if (!hasWalletAccess) {
            toast.error('You do not have permission to recharge wallet');
            return;
        }

        // Prevent multiple concurrent recharge attempts
        if (isRecharging) {
            return;
        }

        try {
            setIsRecharging(true);
            
            const response = await walletService.rechargeWallet(params);
            
            // Update wallet balance immediately
            setWalletBalance(response.data);
            
            // Refresh wallet balance from server to ensure consistency
            try {
                await getWalletBalance();
            } catch (balanceError) {
                console.warn('[WALLET] Failed to refresh balance from server:', balanceError);
            }
            
            // Refresh transaction history
            try {
                // Force refresh by clearing current data
                setTransactions([]);
                setCurrentPage(1);
                setHasMoreTransactions(false);
                
                // Load fresh transactions
                const historyResponse = await walletService.getWalletHistory(1, 10);
                const historyData = historyResponse?.data || {};
                const newTransactions = historyData.data || [];
                const pagination = historyData.pagination || { total: 0, page: 1, pages: 1 };
                
                setTransactions(newTransactions);
                setCurrentPage(pagination.page);
                setTotalPages(pagination.pages);
                setHasMoreTransactions(pagination.page < pagination.pages);
                
            } catch (historyError) {
                console.warn('[WALLET] Failed to refresh transaction history:', historyError);
            }
            
            toast.success(`Wallet recharged successfully with ₹${params.amount}! 🎉`);
            
        } catch (error) {
            console.error('[WALLET] Error recharging wallet:', error);
            
            // Handle different error types
            if (error instanceof Error) {
                if (error.message.includes('cancelled') || error.message.includes('dismissed')) {
                    // Don't show error for user cancellation
                } else if (error.message.includes('already in progress')) {
                    toast.error('Payment is already in progress. Please wait.');
                } else {
                    toast.error(error.message || 'Failed to recharge wallet. Please try again.');
                }
            } else {
                toast.error('Failed to recharge wallet. Please try again.');
            }
            
            throw error;
        } finally {
            setIsRecharging(false);
        }
    }, [isRecharging, getWalletBalance, hasWalletAccess]);

    const loadTransactions = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
        // Don't fetch transactions if user doesn't have wallet permission
        if (!hasWalletAccess) {
            console.log('User does not have wallet access, skipping transaction fetch');
            setTransactions([]);
            setCurrentPage(1);
            setTotalPages(1);
            setHasMoreTransactions(false);
            return;
        }

        try {
            setIsLoadingTransactions(true);
            
            const response = await walletService.getWalletHistory(page);
            
            // Safely extract data with fallbacks
            const responseData = response?.data || {};
            const newTransactions = responseData.data || [];
            const pagination = responseData.pagination || {
                total: 0,
                page: page,
                pages: 1
            };
            
            // Update state
            setTransactions(prev => isRefresh ? newTransactions : [...prev, ...newTransactions]);
            setCurrentPage(pagination.page || page);
            setTotalPages(pagination.pages || 1);
            setHasMoreTransactions((pagination.page || page) < (pagination.pages || 1));
            
        } catch (error) {
            console.error('[WALLET] Error fetching transactions:', error);
            
            // Set empty state on error
            if (isRefresh) {
                setTransactions([]);
                setCurrentPage(1);
                setTotalPages(1);
                setHasMoreTransactions(false);
            }
            
            // Show user-friendly error message only for users with wallet access
            if (hasWalletAccess) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to load wallet transactions. Please try again.';
                
                toast.error(errorMessage);
            }
        } finally {
            setIsLoadingTransactions(false);
        }
    }, [hasWalletAccess]);

    const loadMoreTransactions = useCallback(async () => {
        if (!isLoadingTransactions && hasMoreTransactions && hasWalletAccess) {
            await loadTransactions(currentPage + 1);
        }
    }, [currentPage, hasMoreTransactions, isLoadingTransactions, loadTransactions, hasWalletAccess]);

    const refreshTransactions = useCallback(async () => {
        if (hasWalletAccess) {
            await loadTransactions(1, true);
        }
    }, [loadTransactions, hasWalletAccess]);

    // Initial load - only if user has wallet access
    useEffect(() => {
        if (hasWalletAccess) {
            getWalletBalance();
            loadTransactions(1, true);
        } else {
            // Set default values for users without wallet access
            setWalletBalance({ walletBalance: 0, lastRecharge: 0, remittanceBalance: 0, lastUpdated: new Date().toISOString() });
            setTransactions([]);
            setCurrentPage(1);
            setTotalPages(1);
            setHasMoreTransactions(false);
        }
    }, [getWalletBalance, loadTransactions, hasWalletAccess]);

    return {
        walletBalance,
        isLoadingBalance,
        isRecharging,
        transactions,
        isLoadingTransactions,
        hasMoreTransactions,
        currentPage,
        totalPages,
        hasWalletAccess,
        getWalletBalance,
        rechargeWallet,
        loadMoreTransactions,
        refreshTransactions
    };
}; 