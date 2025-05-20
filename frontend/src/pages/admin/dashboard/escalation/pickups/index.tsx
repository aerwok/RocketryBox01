import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface Pickup {
    id: string;
    pickupId: string;
    description: string;
    status: string;
    location: string;
}

const PICKUPS_DATA: Pickup[] = [];

type PickupKey = 'pickupId' | 'status' | 'location';

const AdminEscalationPickupsPage = () => {

    const [sortConfig, setSortConfig] = useState<{ key: PickupKey | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

    const handleSort = (key: PickupKey) => {
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
        if (!sortConfig.key || !sortConfig.direction) return PICKUPS_DATA;

        return [...PICKUPS_DATA].sort((a, b) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key!] > b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortIcon = (key: PickupKey) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="size-3" />;
        }
        return <ArrowUpDown className={`size-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />;
    };

    const sortedData = getSortedData();

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-semibold">
                Order Pickups
            </h1>

            {/* Sortable Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] min-w-[50px]">
                            <Checkbox />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('pickupId')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Pickup ID {getSortIcon('pickupId')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Status {getSortIcon('status')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('location')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Location {getSortIcon('location')}
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell><Checkbox /></TableCell>
                            <TableCell>{item.pickupId}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{item.location}</TableCell>
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
    );
};

export default AdminEscalationPickupsPage; 