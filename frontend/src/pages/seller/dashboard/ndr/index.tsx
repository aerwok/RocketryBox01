import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Search, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BulkNDRUploadModal from "@/components/seller/ndr/bulk-ndr-upload-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReturnOrderModal from "@/components/seller/return-order-modal";
import ReattemptOrderModal from "@/components/seller/reattempt-order-modal";
import { ServiceFactory } from "@/services/service-factory";
import { toast } from "sonner";

interface NDRData {
    awb: string;
    orderDate: string;
    courier: string;
    customer: string;
    attempts: number;
    lastAttemptDate: string;
    status: string;
    reason: string;
    action: string;
    address?: {
        fullName: string;
        contactNumber: string;
        addressLine1: string;
        addressLine2?: string;
        landmark?: string;
        pincode: string;
        city: string;
        state: string;
    };
}

const NDRTable = ({ data, showActions = false }: { data: NDRData[], showActions?: boolean }) => {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof NDRData;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [selectedAwb, setSelectedAwb] = useState<string>("");
    const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
    const [isReattemptModalOpen, setIsReattemptModalOpen] = useState<boolean>(false);
    const [selectedNDR, setSelectedNDR] = useState<NDRData | null>(null);

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;

        // Handle potentially undefined values safely
        const aValue = a[key] ?? '';
        const bValue = b[key] ?? '';

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof NDRData) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleReturnClick = (ndr: NDRData) => {
        setSelectedAwb(ndr.awb);
        setSelectedNDR(ndr);
        setIsReturnModalOpen(true);
    };

    const handleReattemptClick = (ndr: NDRData) => {
        setSelectedAwb(ndr.awb);
        setSelectedNDR(ndr);
        setIsReattemptModalOpen(true);
    };

    return (
        <>
            {data.length === 0 ? (
                <div className="py-12 text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search query to find what you're looking for.
                    </p>
                </div>
            ) : (
                <Table>
                    <TableHeader className="bg-[#F4F2FF] h-12">
                        <TableRow className="hover:bg-[#F4F2FF]">
                            <TableHead onClick={() => handleSort('awb')} className="cursor-pointer text-black min-w-[120px] whitespace-nowrap">
                                AWB <ArrowUpDown className="inline h-4 w-4 ml-1" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('orderDate')} className="cursor-pointer text-black min-w-[120px] whitespace-nowrap">
                                Order Date <ArrowUpDown className="inline h-4 w-4 ml-1" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('courier')} className="cursor-pointer text-black min-w-[140px] whitespace-nowrap">
                                Courier <ArrowUpDown className="inline h-4 w-4 ml-1" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('customer')} className="cursor-pointer text-black min-w-[140px] whitespace-nowrap">
                                Customer <ArrowUpDown className="inline h-4 w-4 ml-1" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('status')} className="cursor-pointer text-black min-w-[120px] whitespace-nowrap">
                                Status <ArrowUpDown className="inline h-4 w-4 ml-1" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('reason')} className="cursor-pointer text-black min-w-[160px] whitespace-nowrap">
                                Reason <ArrowUpDown className="inline h-4 w-4 ml-1" />
                            </TableHead>
                            {showActions && (
                                <TableHead className="text-black min-w-[80px] whitespace-nowrap text-right">
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((row, index) => (
                            <TableRow key={index} className="h-12">
                                <TableCell className="whitespace-nowrap">
                                    <Link
                                        to={`/seller/dashboard/ndr/${row.awb}`}
                                        className="text-violet-600 hover:underline"
                                    >
                                        {row.awb}
                                    </Link>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{row.orderDate}</TableCell>
                                <TableCell className="whitespace-nowrap">{row.courier}</TableCell>
                                <TableCell className="whitespace-nowrap">{row.customer}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                        {
                                            "bg-red-100 text-red-800": row.status === "Action Required",
                                            "bg-orange-100 text-orange-800": row.status === "Action Requested",
                                            "bg-blue-100 text-blue-800": row.status === "In Transit",
                                            "bg-purple-100 text-purple-800": row.status === "Out for Delivery",
                                            "bg-green-100 text-green-800": row.status === "Delivered",
                                        }
                                    )}>
                                        {row.status}
                                    </span>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{row.reason}</TableCell>
                                {showActions && (
                                    <TableCell className="whitespace-nowrap text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleReturnClick(row)}>
                                                    Return
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleReattemptClick(row)}>
                                                    Reattempt
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Return Order Modal */}
            <ReturnOrderModal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                orderId={selectedAwb}
            />

            {/* Reattempt Order Modal */}
            <ReattemptOrderModal
                isOpen={isReattemptModalOpen}
                onClose={() => setIsReattemptModalOpen(false)}
                orderId={selectedAwb}
                currentAddress={selectedNDR?.address || null}
            />
        </>
    );
};

const SellerNDRPage = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [ndrData, setNdrData] = useState<{
        all: NDRData[];
        actionRequired: NDRData[];
        actionRequested: NDRData[];
        open: NDRData[];
        closed: NDRData[];
    }>({
        all: [],
        actionRequired: [],
        actionRequested: [],
        open: [],
        closed: []
    });
    const [loading, setLoading] = useState(true);

    const fetchNDRData = async (status?: string) => {
        try {
            setLoading(true);
            const response = await ServiceFactory.seller.ndr.getNDRs(status as any);
            const data = response.data as unknown as NDRData[];
            if (status) {
                setNdrData(prev => ({
                    ...prev,
                    [status]: data
                }));
            } else {
                setNdrData(prev => ({
                    ...prev,
                    all: data
                }));
            }
        } catch (error) {
            toast.error('Failed to fetch NDR data');
            console.error('Error fetching NDR data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNDRData();
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value !== 'all' && ndrData[value as keyof typeof ndrData].length === 0) {
            fetchNDRData(value);
        }
    };

    const handleUpload = async (file: File) => {
        try {
            await ServiceFactory.seller.ndr.uploadBulkNDR(file);
            toast.success('NDR data uploaded successfully');
            fetchNDRData();
        } catch (error) {
            toast.error('Failed to upload NDR data');
            console.error('Error uploading NDR data:', error);
        }
    };

    const handleDownloadNDR = async () => {
        try {
            const response = await ServiceFactory.seller.ndr.downloadNDR('xlsx');
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ndr-report-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('NDR report downloaded successfully');
        } catch (error) {
            toast.error('Failed to download NDR report');
            console.error('Error downloading NDR report:', error);
        }
    };

    const filterDataBySearch = (data: NDRData[]) => {
        if (!searchQuery) return data;
        const query = searchQuery.toLowerCase();
        return data.filter(item =>
            item.awb.toLowerCase().includes(query) ||
            item.customer.toLowerCase().includes(query) ||
            item.courier.toLowerCase().includes(query) ||
            item.reason.toLowerCase().includes(query)
        );
    };

    const renderTabContent = (tabId: string, showActions = false) => {
        const data = filterDataBySearch(ndrData[tabId as keyof typeof ndrData] || []);
        return <NDRTable data={data} showActions={showActions} />;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Non-Delivery Reports</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search NDRs..."
                            className="pl-8 pr-4 py-2 border rounded-md w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setIsUploadModalOpen(true)}>Upload NDR</Button>
                    <Button variant="outline" onClick={handleDownloadNDR}>Download Report</Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="all">All NDRs</TabsTrigger>
                    <TabsTrigger value="action-required">Action Required</TabsTrigger>
                    <TabsTrigger value="action-requested">Action Requested</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                        </div>
                    ) : (
                        renderTabContent("all")
                    )}
                </TabsContent>

                <TabsContent value="action-required" className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                        </div>
                    ) : (
                        renderTabContent("action-required", true)
                    )}
                </TabsContent>

                <TabsContent value="action-requested" className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                        </div>
                    ) : (
                        renderTabContent("action-requested", true)
                    )}
                </TabsContent>

                <TabsContent value="open" className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                        </div>
                    ) : (
                        renderTabContent("open", true)
                    )}
                </TabsContent>

                <TabsContent value="closed" className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                        </div>
                    ) : (
                        renderTabContent("closed")
                    )}
                </TabsContent>
            </Tabs>

            <BulkNDRUploadModal
                open={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
            />
        </div>
    );
};

export default SellerNDRPage; 