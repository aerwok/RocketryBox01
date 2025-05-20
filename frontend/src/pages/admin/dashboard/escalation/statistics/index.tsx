import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface Statistic {
    id: string;
    escId: string;
    escTime: string;
    escCloseDate: string;
    seller: { name: string; id: string };
    time: string;
}

const STATISTICS_DATA: Statistic[] = [];

type EscalationKey = 'escId' | 'escTime' | 'escCloseDate' | 'seller' | 'time';

const AdminEscalationStatisticsPage = () => {
    
    const [sortConfig, setSortConfig] = useState<{ key: EscalationKey | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

    const handleSort = (key: EscalationKey) => {
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
        if (!sortConfig.key || !sortConfig.direction) return STATISTICS_DATA;

        return [...STATISTICS_DATA].sort((a, b) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key!] > b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortIcon = (key: EscalationKey) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="size-3" />;
        }
        return <ArrowUpDown className={`size-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />;
    };

    const sortedData = getSortedData();

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-semibold">
                Order Statistics
            </h1>

            {/* Sortable Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] min-w-[50px]">
                            <Checkbox />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('escId')}>
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('escId')}
                            >

                                ESC ID {getSortIcon('escId')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('escTime')}>
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('escTime')}
                            >

                                ESC TIME {getSortIcon('escTime')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('escCloseDate')}>
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('escCloseDate')}
                            >

                                ESC CLOSE DATE {getSortIcon('escCloseDate')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('seller')}>
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('seller')}
                            >

                                SELLER {getSortIcon('seller')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('time')}>
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('time')}
                            >

                                Time {getSortIcon('time')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer">
                            Action
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <Checkbox />
                            </TableCell>
                            <TableCell>
                                {item.escId}
                            </TableCell>
                            <TableCell>
                                {item.escTime}
                            </TableCell>
                            <TableCell>
                                {item.escCloseDate}
                            </TableCell>
                            <TableCell>
                                {item.seller.name}
                            </TableCell>
                            <TableCell>
                                {item.time}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">Remarks</Button>
                                    <Button variant="outline" size="sm">Details</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default AdminEscalationStatisticsPage; 