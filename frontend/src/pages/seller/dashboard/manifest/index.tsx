import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { ServiceFactory } from "@/services/service-factory";
import { toast } from "sonner";

interface ManifestData {
    manifestId: string;
    date: string;
    courier: string;
    orders: string;
    pickupStatus: string;
    warehouse: string;
    status: string;
}

type SortConfig = {
    key: keyof ManifestData | null;
    direction: 'asc' | 'desc' | null;
};

const getStatusStyle = (status: string) => {
    switch (status) {
        case "Completed":
            return "bg-green-100 text-green-800";
        case "Processing":
            return "bg-yellow-100 text-yellow-800";
        case "Scheduled":
            return "bg-blue-100 text-blue-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const getPickupStatusStyle = (status: string) => {
    switch (status) {
        case "Completed":
            return "bg-green-100 text-green-800";
        case "In Progress":
            return "bg-yellow-100 text-yellow-800";
        case "Pending":
            return "bg-red-100 text-red-800";
        case "Scheduled":
            return "bg-blue-100 text-blue-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const ManifestTable = ({ data, loading }: { data: ManifestData[], loading: boolean }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: null,
        direction: null,
    });

    const handleSort = (key: keyof ManifestData) => {
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
        if (!sortConfig.key || !sortConfig.direction) return data;

        return [...data].sort((a, b) => {
            if (a[sortConfig.key!] < b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key!] > b[sortConfig.key!]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortIcon = (key: keyof ManifestData) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="size-3" />;
        }
        return <ArrowUpDown className="size-3" />;
    };

    const sortedData = getSortedData();

    if (loading) {
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F4F2FF] hover:bg-[#F4F2FF]">
                            <TableHead className="min-w-[120px] whitespace-nowrap text-black">MANIFEST ID</TableHead>
                            <TableHead className="min-w-[100px] whitespace-nowrap text-black">DATE</TableHead>
                            <TableHead className="min-w-[120px] whitespace-nowrap text-black">COURIER</TableHead>
                            <TableHead className="min-w-[100px] whitespace-nowrap text-black">ORDERS</TableHead>
                            <TableHead className="min-w-[140px] whitespace-nowrap text-black">PICKUP STATUS</TableHead>
                            <TableHead className="min-w-[140px] whitespace-nowrap text-black">WAREHOUSE</TableHead>
                            <TableHead className="min-w-[100px] whitespace-nowrap text-black">STATUS</TableHead>
                            <TableHead className="min-w-[50px] whitespace-nowrap text-black text-center">#</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-10">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    <p className="text-gray-500">Loading manifests...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-[#F4F2FF] hover:bg-[#F4F2FF]">
                        <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('manifestId')}
                            >
                                MANIFEST ID
                                {getSortIcon('manifestId')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('date')}
                            >
                                DATE
                                {getSortIcon('date')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('courier')}
                            >
                                COURIER
                                {getSortIcon('courier')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('orders')}
                            >
                                ORDERS
                                {getSortIcon('orders')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[140px] whitespace-nowrap text-black">
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('pickupStatus')}
                            >
                                PICKUP STATUS
                                {getSortIcon('pickupStatus')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[140px] whitespace-nowrap text-black">
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('warehouse')}
                            >
                                WAREHOUSE
                                {getSortIcon('warehouse')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div
                                className="flex items-center gap-1 cursor-pointer"
                                onClick={() => handleSort('status')}
                            >
                                STATUS
                                {getSortIcon('status')}
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[50px] whitespace-nowrap text-black text-center">
                            #
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-10">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Search className="h-10 w-10 text-gray-400" />
                                    <h3 className="font-semibold text-xl">Sorry! No Result Found</h3>
                                    <p className="text-gray-500">We've searched more than 150+ Orders We did not find any orders for you search.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedData.map((manifest) => (
                            <TableRow key={manifest.manifestId}>
                                <TableCell className="font-medium">
                                    {manifest.manifestId}
                                </TableCell>
                                <TableCell>
                                    {manifest.date}
                                </TableCell>
                                <TableCell>
                                    {manifest.courier}
                                </TableCell>
                                <TableCell>
                                    {manifest.orders}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPickupStatusStyle(manifest.pickupStatus)}`}>
                                        {manifest.pickupStatus}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {manifest.warehouse}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(manifest.status)}`}>
                                        {manifest.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="sm" className="h-auto p-0">
                                        •••
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

const SellerManifestPage = () => {
    const [manifests, setManifests] = useState<ManifestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchManifests = async () => {
        try {
            setLoading(true);
            const response = await ServiceFactory.seller.manifest.getManifests();
            setManifests(response.data);
        } catch (error) {
            toast.error('Failed to fetch manifests');
            console.error('Error fetching manifests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManifests();
    }, []);

    const filteredManifests = manifests.filter(manifest =>
        manifest.manifestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manifest.courier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manifest.warehouse.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Manifest</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search manifests..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button>Create Manifest</Button>
                </div>
            </div>
            <ManifestTable data={filteredManifests} loading={loading} />
        </div>
    );
};

export default SellerManifestPage; 