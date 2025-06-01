import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ArrowUp, ArrowDown, ArrowUpDown, Loader2, AlertCircle, RefreshCw, FilterX, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ServiceFactory } from "@/services/service-factory";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Order {
    date: string;
    awb: string;
    consigne: string;
    product: string;
    courier: string;
    amount: number;
    label: string;
    status: string;
    edd: string;
    pdfUrl: string;
}

const ITEMS_PER_PAGE = 10;

const CustomerOrdersPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const statusFromUrl = queryParams.get('status');

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(statusFromUrl);
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
        key: null,
        direction: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderData, setOrderData] = useState<Order[]>([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
        All: 0,
        Booked: 0,
        Processing: 0,
        "In Transit": 0,
        "Out for Delivery": 0,
        Delivered: 0,
        Returned: 0
    });

    // Update statusFilter when URL param changes
    useEffect(() => {
        setStatusFilter(statusFromUrl);
    }, [statusFromUrl]);

    // Fetch orders data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await ServiceFactory.customer.orders.getAll({
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                    search: searchQuery,
                    sortField: sortConfig.key || '',
                    sortDirection: sortConfig.direction || '',
                    status: statusFilter || undefined
                });

                if (response.success) {
                    setOrderData(response.data.orders);
                    setTotalOrders(response.data.total);
                } else {
                    throw new Error(response.message || 'Failed to fetch orders');
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
                setError("Failed to load orders. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [currentPage, searchQuery, sortConfig, statusFilter]);

    // Fetch status counts
    useEffect(() => {
        const fetchStatusCounts = async () => {
            try {
                const response = await ServiceFactory.customer.orders.getStatusCounts();
                if (response.success) {
                    setStatusCounts(response.data);
                }
            } catch (error) {
                console.error("Error fetching status counts:", error);
            }
        };
        
        fetchStatusCounts();
    }, [statusFilter]);

    const handleStatusChange = (value: string) => {
        setStatusFilter(value === "All" ? null : value);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const clearFilters = () => {
        setStatusFilter(null);
        setSearchQuery("");
        setCurrentPage(1);
        // Update the URL to remove status parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('status');
        window.history.pushState({}, '', url.toString());
    };

    const handleSort = (key: string) => {
        setSortConfig(prevConfig => {
            if (prevConfig.key === key) {
                if (prevConfig.direction === 'asc') {
                    return { key, direction: 'desc' };
                } else if (prevConfig.direction === 'desc') {
                    return { key: null, direction: null };
                }
            }
            return { key, direction: 'asc' };
        });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    };

    const handleDownloadPDF = async (awb: string) => {
        try {
            setDownloadingLabel(awb);
            
            console.log('🔄 Starting label download for AWB:', awb);
            const response = await ServiceFactory.customer.orders.downloadLabel(awb);
            
            // Check if response is a raw Blob (ServiceFactory bug) or proper ApiResponse
            const isRawBlob = response instanceof Blob;
            
            if (isRawBlob) {
                console.log('📥 Received raw Blob from ServiceFactory:', {
                    size: response.size,
                    type: response.type,
                    isValid: response.size > 0
                });
                
                if (response.size > 0) {
                    const blob = response;
                    console.log('✅ Valid raw blob received, proceeding with download');
                    
                    // Create download URL
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    
                    // We're now generating PDFs instead of HTML
                    a.download = `shipping-label-${awb}.pdf`;
                    
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    toast.success('PDF label downloaded successfully');
                } else {
                    throw new Error('Received empty blob from server');
                }
            } else {
                // Handle proper ApiResponse format
                console.log('📥 Received ApiResponse from ServiceFactory:', response);
                
                const isValidResponse = response.success || (response.data instanceof Blob && response.data.size > 0);
                
                if (isValidResponse) {
                    const blob = response.data as Blob;
                    console.log('✅ Valid ApiResponse blob received, proceeding with download');
                    
                    // Create download URL
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    
                    // We're now generating PDFs instead of HTML
                    a.download = `shipping-label-${awb}.pdf`;
                    
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    toast.success('PDF label downloaded successfully');
                } else {
                    console.error('❌ ServiceFactory returned invalid ApiResponse:', response);
                    throw new Error(response.message || 'Failed to download label - no valid data received');
                }
            }
        } catch (error: any) {
            console.error('💥 Error downloading label:', error);
            toast.error(error.message || 'Failed to download label');
        } finally {
            setDownloadingLabel(null);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when searching
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h1 className="text-2xl lg:text-3xl font-semibold">Orders History</h1>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Link to="/customer/create-order">
                            <Button className="bg-main text-white hover:bg-main/90">Create New Order</Button>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
                    <form onSubmit={handleSearch} className="relative w-full md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by AWB, name, product..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="w-48">
                            <Select
                                value={statusFilter || "All"}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Orders ({statusCounts.All})</SelectItem>
                                    <SelectItem value="Booked">Booked ({statusCounts.Booked})</SelectItem>
                                    <SelectItem value="Processing">Processing ({statusCounts.Processing})</SelectItem>
                                    <SelectItem value="In Transit">In Transit ({statusCounts["In Transit"]})</SelectItem>
                                    <SelectItem value="Out for Delivery">Out for Delivery ({statusCounts["Out for Delivery"]})</SelectItem>
                                    <SelectItem value="Delivered">Delivered ({statusCounts.Delivered})</SelectItem>
                                    <SelectItem value="Returned">Returned ({statusCounts.Returned})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {(statusFilter || searchQuery) && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={clearFilters}
                                className="h-10 w-10"
                                title="Clear filters"
                            >
                                <FilterX className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {error && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry Loading
                        </Button>
                    )}
                </div>
                
                {/* Error display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setError(null)}
                            className="border-red-300 hover:bg-red-100"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                {/* Orders Table */}
                <div className="border rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-main mb-4" />
                            <p className="text-muted-foreground">Loading orders...</p>
                        </div>
                    ) : orderData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px]">
                            <p className="text-muted-foreground mb-4">No orders found</p>
                            {searchQuery && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2"
                                    onClick={() => setSearchQuery("")}
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
                                        Date {getSortIcon("date")}
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("awb")} className="cursor-pointer">
                                        AWB Number {getSortIcon("awb")}
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("consigne")} className="cursor-pointer">
                                        Consigne {getSortIcon("consigne")}
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("product")} className="cursor-pointer hidden md:table-cell">
                                        Product {getSortIcon("product")}
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("courier")} className="cursor-pointer hidden md:table-cell">
                                        Courier {getSortIcon("courier")}
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("amount")} className="cursor-pointer hidden lg:table-cell">
                                        Amount {getSortIcon("amount")}
                                    </TableHead>
                                    <TableHead className="text-center">Label</TableHead>
                                    <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                                        Status {getSortIcon("status")}
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("edd")} className="cursor-pointer hidden lg:table-cell">
                                        EDD {getSortIcon("edd")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderData.map((order) => (
                                    <TableRow key={order.awb}>
                                        <TableCell className="whitespace-nowrap">{order.date}</TableCell>
                                        <TableCell>
                                            <Link to={`/customer/orders/${order.awb}`} className="text-main hover:underline">
                                                {order.awb}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{order.consigne}</TableCell>
                                        <TableCell className="hidden md:table-cell">{order.product}</TableCell>
                                        <TableCell className="hidden md:table-cell">{order.courier}</TableCell>
                                        <TableCell className="hidden lg:table-cell">₹{order.amount}</TableCell>
                                        <TableCell className="text-center">
                                            <button 
                                                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 hover:text-gray-900"
                                                onClick={() => handleDownloadPDF(order.awb)}
                                                disabled={downloadingLabel === order.awb}
                                                title="Download Shipping Label"
                                            >
                                                {downloadingLabel === order.awb ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                order.status === "Delivered" ? "bg-green-100 text-green-700" :
                                                order.status === "Booked" ? "bg-blue-100 text-blue-700" :
                                                order.status === "In Transit" ? "bg-yellow-100 text-yellow-700" :
                                                order.status === "Processing" ? "bg-purple-100 text-purple-700" :
                                                "bg-gray-100 text-gray-700"
                                            }`}>
                                                {order.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">{order.edd}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                
                {/* Pagination */}
                {!loading && orderData.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)} of {totalOrders} orders
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                                disabled={currentPage === 1 || loading}
                            >
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {currentPage} of {totalPages || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                                disabled={currentPage >= totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerOrdersPage; 