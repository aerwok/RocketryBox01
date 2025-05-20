import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Upload} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface BillingData {
    id: string;
    remittanceId: string;
    status: "Pending" | "Completed" | "Failed" | "Overdue";
    paymentDate: string;
    remittanceAmount: string;
    freightDeduction: string;
    convenienceFee: string;
    total: string;
    paymentRef: string;
}

const BILLING_DATA: BillingData[] = [];

type BillingKey = keyof BillingData;

const AdminEscalationBillingPage = () => {

    const [sortConfig, setSortConfig] = useState<{ key: BillingKey | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
    const [searchQuery] = useState<string>("");

    const handleSort = (key: BillingKey) => {
        let direction: 'asc' | 'desc' | null = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = null;
            }
        }

        setSortConfig({ key, direction });
    };

    const getSortedData = () => {
        if (!sortConfig.key || !sortConfig.direction) return BILLING_DATA;

        return [...BILLING_DATA].sort((a, b) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key!] > b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortIcon = (key: BillingKey) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="size-3" />;
        }
        return <ArrowUpDown className={`size-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />;
    };

    const filteredData = getSortedData().filter(item =>
        item.remittanceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paymentRef.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{status}</Badge>;
            case 'Pending':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{status}</Badge>;
            case 'Failed':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{status}</Badge>;
            case 'Overdue':
                return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">{status}</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-semibold">
                Billing & Remittance
            </h1>

            {/* Sortable Table */}
            <Table>
                <TableHeader className="bg-[#F4F2FF] h-12">
                    <TableRow className="hover:bg-[#F4F2FF]">
                        <TableHead className="w-[50px] min-w-[50px]">
                            <Checkbox />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('remittanceId')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Remittance ID {getSortIcon('remittanceId')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Status {getSortIcon('status')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('paymentDate')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Payment Date {getSortIcon('paymentDate')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('remittanceAmount')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Amount {getSortIcon('remittanceAmount')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('freightDeduction')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Deduction {getSortIcon('freightDeduction')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('convenienceFee')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Fee {getSortIcon('convenienceFee')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('total')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Total {getSortIcon('total')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('paymentRef')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Reference {getSortIcon('paymentRef')}
                            </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell>
                                <Checkbox />
                            </TableCell>
                            <TableCell className="font-medium">
                                {item.remittanceId}
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(item.status)}
                            </TableCell>
                            <TableCell>
                                {item.paymentDate}
                            </TableCell>
                            <TableCell>
                                {item.remittanceAmount}
                            </TableCell>
                            <TableCell>
                                {item.freightDeduction}
                            </TableCell>
                            <TableCell>
                                {item.convenienceFee}
                            </TableCell>
                            <TableCell className="font-medium">
                                {item.total}
                            </TableCell>
                            <TableCell>
                                {item.paymentRef}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-8 px-2">
                                        <Upload className="w-4 h-4 mr-1" />
                                        Push
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 px-2">
                                        Remarks
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 px-2">
                                        Details
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Pagination can be added here */}
        </div>
    );
};

export default AdminEscalationBillingPage;