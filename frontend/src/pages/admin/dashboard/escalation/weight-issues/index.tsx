import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface WeightIssue {
    id: string;
    issueId: string;
    description: string;
    status: string;
}

const WEIGHT_ISSUES_DATA: WeightIssue[] = [];

type WeightIssueKey = 'issueId' | 'description' | 'status';

const AdminEscalationWeightIssuesPage = () => {
    
    const [sortConfig, setSortConfig] = useState<{ key: WeightIssueKey | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

    const handleSort = (key: WeightIssueKey) => {
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
        if (!sortConfig.key || !sortConfig.direction) return WEIGHT_ISSUES_DATA;

        return [...WEIGHT_ISSUES_DATA].sort((a, b) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key!] > b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortIcon = (key: WeightIssueKey) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="size-3" />;
        }
        return <ArrowUpDown className={`size-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />;
    };

    const sortedData = getSortedData();

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-semibold">
                Weight Issues
            </h1>

            {/* Sortable Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] min-w-[50px]">
                            <Checkbox />
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('issueId')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Issue ID {getSortIcon('issueId')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Description {getSortIcon('description')}
                            </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                            <div className="flex items-center gap-1 cursor-pointer">
                                Status {getSortIcon('status')}
                            </div>
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
                                {item.issueId}
                            </TableCell>
                            <TableCell>
                                {item.description}
                            </TableCell>
                            <TableCell>
                                {item.status}
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
    );
};

export default AdminEscalationWeightIssuesPage; 