import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface ShipmentData {
    id: string;
    orderId: string;
    orderDate: string;
    bookedDate: string;
    pickupId: string;
    customer: string;
    product: string;
    amount: string;
    paymentType: 'COD' | 'Prepaid';
    weight: string;
    channel: string;
    awb: string;
    courier: string;
}

const SHIPMENT_DATA: ShipmentData[] = [];

const AdminEscalationShipmentsPage = () => {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof ShipmentData | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });

    const handleSort = (key: keyof ShipmentData) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    const getSortedData = () => {
        if (!sortConfig.key) return SHIPMENT_DATA;

        return [...SHIPMENT_DATA].sort((a, b) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key!] > b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Shipments</h1>
            </div>

            {/* Shipments Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-[#F4F2FF]">
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('orderId')}>
                                <div className="flex items-center gap-1">
                                    Order ID <ArrowUpDown className="h-4 w-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('orderDate')}>
                                <div className="flex items-center gap-1">
                                    Order Date
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('bookedDate')}>
                                <div className="flex items-center gap-1">
                                    Booked
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('pickupId')}>
                                <div className="flex items-center gap-1">
                                    Pickup-ID
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('customer')}>
                                <div className="flex items-center gap-1">
                                    Customer
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('product')}>
                                <div className="flex items-center gap-1">
                                    Product
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                                <div className="flex items-center gap-1">
                                    Amount
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('paymentType')}>
                                <div className="flex items-center gap-1">
                                    Payment
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('weight')}>
                                <div className="flex items-center gap-1">
                                    Wt.(Kg)
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('channel')}>
                                <div className="flex items-center gap-1">
                                    Channel
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('awb')}>
                                <div className="flex items-center gap-1">
                                    AWB
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('courier')}>
                                <div className="flex items-center gap-1">
                                    Courier
                                    <ArrowUpDown className="size-4" />
                                </div>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {getSortedData().map((shipment) => (
                            <TableRow key={shipment.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{shipment.orderId}</TableCell>
                                <TableCell>
                                    {shipment.orderDate}
                                </TableCell>
                                <TableCell>
                                    {shipment.bookedDate}
                                </TableCell>
                                <TableCell>
                                    {shipment.pickupId}
                                </TableCell>
                                <TableCell>
                                    {shipment.customer}
                                </TableCell>
                                <TableCell>
                                    {shipment.product}
                                </TableCell>
                                <TableCell>
                                    {shipment.amount}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={shipment.paymentType === 'COD' ? 'default' : 'secondary'}>
                                        {shipment.paymentType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {shipment.weight}
                                </TableCell>
                                <TableCell>
                                    {shipment.channel}
                                </TableCell>
                                <TableCell>
                                    {shipment.awb}
                                </TableCell>
                                <TableCell>
                                    {shipment.courier}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm">
                                            Remarks
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            Details
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminEscalationShipmentsPage;