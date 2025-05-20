import { useState, useCallback, useEffect } from 'react';
import { bulkOrderService, BulkOrderStatus, ExcelColumnConfig } from '@/services/bulkOrder.service';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/utils/validation';

interface UseBulkOrderReturn {
    isUploading: boolean;
    isDownloading: boolean;
    orderStatus: BulkOrderStatus | null;
    uploadProgress: number;
    errors: Array<{ row: number; message: string }>;
    uploadBulkOrder: (file: File, config: ExcelColumnConfig[]) => Promise<void>;
    downloadTemplate: () => Promise<void>;
    cancelOrder: () => Promise<void>;
    refreshStatus: () => Promise<void>;
}

export const useBulkOrder = (orderId?: string): UseBulkOrderReturn => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [orderStatus, setOrderStatus] = useState<BulkOrderStatus | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);
    const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);

    const uploadBulkOrder = useCallback(async (file: File, config: ExcelColumnConfig[]) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);
            setErrors([]);

            // Validate file
            const validationResult = await bulkOrderService.validateExcelFile(file, config);
            if (!validationResult.isValid) {
                setErrors(validationResult.errors.map(error => ({
                    row: error.row,
                    message: error.message
                })));
                toast.error('File validation failed');
                return;
            }

            // Upload file
            const response = await bulkOrderService.uploadBulkOrder(file);
            setOrderStatus({
                ...response.data,
                progress: 0 // Initialize progress to 0
            });
            toast.success('File uploaded successfully');

            // Start polling for status
            startStatusPolling(response.data.orderId);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, []);

    const downloadTemplate = useCallback(async () => {
        try {
            setIsDownloading(true);
            const blob = await bulkOrderService.downloadBulkOrderTemplate();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'bulk_order_template.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Template downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.DOWNLOAD_ERROR);
        } finally {
            setIsDownloading(false);
        }
    }, []);

    const cancelOrder = useCallback(async () => {
        if (!orderId) return;

        try {
            await bulkOrderService.cancelBulkOrder(orderId);
            stopStatusPolling();
            setOrderStatus(null);
            toast.success('Order cancelled successfully');
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
        }
    }, [orderId]);

    const refreshStatus = useCallback(async () => {
        if (!orderId) return;

        try {
            const response = await bulkOrderService.getBulkOrderStatus(orderId);
            setOrderStatus(response.data);
            
            // Stop polling if order is completed or failed
            if (response.data.status === 'Completed' || response.data.status === 'Failed') {
                stopStatusPolling();
            }
        } catch (error) {
            console.error('Status refresh error:', error);
            toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR);
        }
    }, [orderId]);

    const startStatusPolling = useCallback((id: string) => {
        // Clear existing interval
        stopStatusPolling();

        // Start new interval
        const interval = setInterval(async () => {
            try {
                const response = await bulkOrderService.getBulkOrderStatus(id);
                setOrderStatus(response.data);
                setUploadProgress(response.data.progress);

                // Stop polling if order is completed or failed
                if (response.data.status === 'Completed' || response.data.status === 'Failed') {
                    stopStatusPolling();
                    if (response.data.status === 'Failed') {
                        setErrors(response.data.errors || []);
                        toast.error('Order processing failed');
                    } else {
                        toast.success('Order processed successfully');
                    }
                }
            } catch (error) {
                console.error('Status polling error:', error);
                stopStatusPolling();
            }
        }, 5000); // Poll every 5 seconds

        setStatusInterval(interval);
    }, []);

    const stopStatusPolling = useCallback(() => {
        if (statusInterval) {
            clearInterval(statusInterval);
            setStatusInterval(null);
        }
    }, [statusInterval]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopStatusPolling();
        };
    }, [stopStatusPolling]);

    // Initial status load if orderId is provided
    useEffect(() => {
        if (orderId) {
            refreshStatus();
        }
    }, [orderId, refreshStatus]);

    return {
        isUploading,
        isDownloading,
        orderStatus,
        uploadProgress,
        errors,
        uploadBulkOrder,
        downloadTemplate,
        cancelOrder,
        refreshStatus
    };
}; 