import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Search } from "lucide-react";
import { useState, useEffect } from "react";
import BulkDisputeUploadModal from "@/components/seller/disputes/bulk-dispute-upload-modal";
import { Link } from "react-router-dom";
import { ServiceFactory } from "@/services/service-factory";
import { toast } from "sonner";

interface DisputeData {
    awbNumber: string;
    disputeDate: string;
    orderId: string;
    given: string;
    applied: string;
    revised: string;
    accepted: string;
    difference: string;
    status: "Active" | "Inactive";
}

const DisputeTable = ({ data }: { data: DisputeData[] }) => {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof DisputeData;
        direction: 'asc' | 'desc';
    } | null>(null);

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof DisputeData) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead onClick={() => handleSort('awbNumber')} className="cursor-pointer">
                            AWB Number <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead onClick={() => handleSort('disputeDate')} className="cursor-pointer">
                            Dispute Date <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead onClick={() => handleSort('orderId')} className="cursor-pointer">
                            Order ID <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead onClick={() => handleSort('given')} className="cursor-pointer">
                            Given <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead onClick={() => handleSort('applied')} className="cursor-pointer">
                            Applied <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead onClick={() => handleSort('revised')} className="cursor-pointer">
                            Revised <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead onClick={() => handleSort('accepted')} className="cursor-pointer">
                            Accepted <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead onClick={() => handleSort('difference')} className="cursor-pointer">
                            Difference <ArrowUpDown className="inline h-4 w-4 ml-1" />
                        </TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell>{row.awbNumber}</TableCell>
                            <TableCell>{row.disputeDate}</TableCell>
                            <TableCell>{row.orderId}</TableCell>
                            <TableCell>{row.given}</TableCell>
                            <TableCell>{row.applied}</TableCell>
                            <TableCell>{row.revised}</TableCell>
                            <TableCell>{row.accepted}</TableCell>
                            <TableCell>{row.difference}</TableCell>
                            <TableCell>
                                <Link to={`/seller/dashboard/disputes/${row.awbNumber}`}>
                                    <Button variant="link" className="p-0 h-auto">
                                        View Details
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const SellerDisputePage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDisputes, setActiveDisputes] = useState<DisputeData[]>([]);
    const [inactiveDisputes, setInactiveDisputes] = useState<DisputeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDisputes = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch active disputes
                const activeResponse = await ServiceFactory.seller.disputes.getDisputes('active');
                if (activeResponse.success) {
                    setActiveDisputes(activeResponse.data);
                } else {
                    throw new Error(activeResponse.message || 'Failed to fetch active disputes');
                }

                // Fetch inactive disputes
                const inactiveResponse = await ServiceFactory.seller.disputes.getDisputes('inactive');
                if (inactiveResponse.success) {
                    setInactiveDisputes(inactiveResponse.data);
                } else {
                    throw new Error(inactiveResponse.message || 'Failed to fetch inactive disputes');
                }
            } catch (err) {
                console.error('Error fetching disputes:', err);
                setError('Failed to load disputes');
                toast.error('Failed to fetch disputes');
            } finally {
                setLoading(false);
            }
        };

        fetchDisputes();
    }, []);

    const handleBulkUpload = async (file: File) => {
        try {
            const response = await ServiceFactory.seller.disputes.uploadBulkDisputes(file);
            if (response.success) {
                toast.success('Bulk disputes uploaded successfully');
                // Refresh the disputes list
                window.location.reload();
            } else {
                throw new Error(response.message || 'Failed to upload bulk disputes');
            }
        } catch (err) {
            console.error('Error uploading bulk disputes:', err);
            toast.error('Failed to upload bulk disputes');
        }
    };

    const filteredActiveDisputes = activeDisputes.filter(item =>
        item.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredInactiveDisputes = inactiveDisputes.filter(item =>
        item.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Disputes</h1>
                <BulkDisputeUploadModal onUpload={handleBulkUpload} />
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search by AWB Number or Order ID"
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading disputes...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4">
                    {error}
                </div>
            ) : (
                <Tabs defaultValue="active" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="active">Action Required ({filteredActiveDisputes.length})</TabsTrigger>
                        <TabsTrigger value="inactive">Action Requested ({filteredInactiveDisputes.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active">
                        {filteredActiveDisputes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No active disputes found
                            </div>
                        ) : (
                            <DisputeTable data={filteredActiveDisputes} />
                        )}
                    </TabsContent>
                    <TabsContent value="inactive">
                        {filteredInactiveDisputes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No inactive disputes found
                            </div>
                        ) : (
                            <DisputeTable data={filteredInactiveDisputes} />
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default SellerDisputePage; 