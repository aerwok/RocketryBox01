export interface WeightDisputeData {
    awbNumber: string;
    orderId: string;
    declaredWeight: number;
    actualWeight: number;
    status: 'pending' | 'resolved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    courier: string;
    reason?: string;
    resolution?: string;
    resolvedBy?: string;
    resolvedAt?: string;
} 