import { useMemo, useEffect, useState } from 'react';
import { sellerAuthService } from '@/services/seller-auth.service';

export const usePermissions = () => {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const userPermissions = await sellerAuthService.getCurrentUserPermissions();
                setPermissions(userPermissions);
            } catch (error) {
                console.error('Error loading user permissions:', error);
                setPermissions([]);
            } finally {
                setLoading(false);
            }
        };

        loadPermissions();
    }, []);

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (permissionList: string[]): boolean => {
        return permissionList.some(permission => permissions.includes(permission));
    };

    const hasAllPermissions = (permissionList: string[]): boolean => {
        return permissionList.every(permission => permissions.includes(permission));
    };

    const canAccess = (feature: string): boolean => {
        const featurePermissions: Record<string, string[]> = {
            'dashboard': ['Dashboard access'],
            'orders': ['Order', 'Shipments', 'Manifest'],
            'users': ['Manage Users'],
            'billing': ['Fright', 'Wallet', 'Invoice', 'Ledger'],
            'support': ['Support', 'Warehouse', 'Service'],
            'settings': ['Stores', 'Priority', 'Label']
        };

        const requiredPermissions = featurePermissions[feature] || [];
        return hasAnyPermission(requiredPermissions);
    };

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccess,
        loading
    };
}; 