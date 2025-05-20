import { useState, useCallback, useEffect } from 'react';
import { walletService, WalletBalance, WalletTransaction } from '@/services/wallet.service';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/utils/validation';

interface UseWalletReturn {
    walletBalance: WalletBalance | null;
    isLoadingBalance: boolean;
    isRecharging: boolean;
    transactions: WalletTransaction[];
    isLoadingTransactions: boolean;
    hasMoreTransactions: boolean;
    currentPage: number;
    totalPages: number;
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

    const getWalletBalance = useCallback(async () => {
        try {
            setIsLoadingBalance(true);
            const response = await walletService.getWalletBalance();
            setWalletBalance(response.data);
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
        } finally {
            setIsLoadingBalance(false);
        }
    }, []);

    const rechargeWallet = useCallback(async (params: { amount: number; paymentMethod: string }) => {
        try {
            setIsRecharging(true);
            const response = await walletService.rechargeWallet(params);
            setWalletBalance(response.data);
            toast.success('Wallet recharged successfully');
        } catch (error) {
            console.error('Error recharging wallet:', error);
            toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
            throw error;
        } finally {
            setIsRecharging(false);
        }
    }, []);

    const loadTransactions = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
        try {
            setIsLoadingTransactions(true);
            const response = await walletService.getWalletHistory(page);
            const { transactions: newTransactions, totalPages: total, hasMore } = response.data;
            
            setTransactions(prev => isRefresh ? newTransactions : [...prev, ...newTransactions]);
            setCurrentPage(page);
            setTotalPages(total);
            setHasMoreTransactions(hasMore);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
        } finally {
            setIsLoadingTransactions(false);
        }
    }, []);

    const loadMoreTransactions = useCallback(async () => {
        if (!isLoadingTransactions && hasMoreTransactions) {
            await loadTransactions(currentPage + 1);
        }
    }, [currentPage, hasMoreTransactions, isLoadingTransactions, loadTransactions]);

    const refreshTransactions = useCallback(async () => {
        await loadTransactions(1, true);
    }, [loadTransactions]);

    // Initial load
    useEffect(() => {
        getWalletBalance();
        loadTransactions(1, true);
    }, [getWalletBalance, loadTransactions]);

    return {
        walletBalance,
        isLoadingBalance,
        isRecharging,
        transactions,
        isLoadingTransactions,
        hasMoreTransactions,
        currentPage,
        totalPages,
        getWalletBalance,
        rechargeWallet,
        loadMoreTransactions,
        refreshTransactions
    };
}; 