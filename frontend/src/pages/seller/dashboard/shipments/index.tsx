import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowUpDown, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Mock data - will be used when API is not available or for testing
const shipmentData = [
    {
        orderId: "ORD123456",
        orderDate: "2024-03-15",
        booked: "2024-03-15 10:30 AM",
        pickupId: "PKP789",
        customer: "John Doe",
        product: "iPhone 15 Pro",
        amount: "₹129,900",
        payment: "COD",
        weight: "0.5",
        channel: "Website",
        awb: "AWB123456789",
        courier: "Blue Dart",
        tracking: "View",
        status: "Booked"
    },
    {
        orderId: "ORD123457",
        orderDate: "2024-03-14",
        booked: "2024-03-14 11:45 AM",
        pickupId: "PKP790",
        customer: "Jane Smith",
        product: "Samsung S24 Ultra",
        amount: "₹134,999",
        payment: "Prepaid",
        weight: "0.6",
        channel: "Mobile App",
        awb: "AWB123456790",
        courier: "DTDC",
        tracking: "View",
        status: "In-transit"
    },
    {
        orderId: "ORD123458",
        orderDate: "2024-03-13",
        booked: "2024-03-13 09:15 AM",
        pickupId: "PKP791",
        customer: "Mike Johnson",
        product: "MacBook Air",
        amount: "₹114,900",
        payment: "COD",
        weight: "1.8",
        channel: "Website",
        awb: "AWB123456791",
        courier: "Delhivery",
        tracking: "View",
        status: "Delivered"
    },
    {
        orderId: "ORD123459",
        orderDate: "2024-03-15",
        booked: "2024-03-15 14:20 PM",
        pickupId: "PKP792",
        customer: "Sarah Wilson",
        product: "iPad Pro",
        amount: "₹89,900",
        payment: "Prepaid",
        weight: "0.7",
        channel: "Website",
        awb: "AWB123456792",
        courier: "Blue Dart",
        tracking: "View",
        status: "Pending Pickup"
    },
    {
        orderId: "ORD123460",
        orderDate: "2024-03-14",
        booked: "2024-03-14 16:30 PM",
        pickupId: "PKP793",
        customer: "Robert Brown",
        product: "AirPods Pro",
        amount: "₹24,900",
        payment: "COD",
        weight: "0.3",
        channel: "Mobile App",
        awb: "AWB123456793",
        courier: "DTDC",
        tracking: "View",
        status: "Cancelled"
    },
    {
        orderId: "ORD123461",
        orderDate: "2024-03-13",
        booked: "2024-03-13 12:45 PM",
        pickupId: "PKP794",
        customer: "Emily Davis",
        product: "MacBook Pro",
        amount: "₹199,900",
        payment: "Prepaid",
        weight: "2.1",
        channel: "Website",
        awb: "AWB123456794",
        courier: "Delhivery",
        tracking: "View",
        status: "Exception"
    },
    {
        orderId: "ORD123462",
        orderDate: "2024-03-15",
        booked: "2024-03-15 09:10 AM",
        pickupId: "PKP795",
        customer: "Tom Wilson",
        product: "Apple Watch",
        amount: "₹45,900",
        payment: "COD",
        weight: "0.4",
        channel: "Website",
        awb: "AWB123456795",
        courier: "Blue Dart",
        tracking: "View",
        status: "Booked"
    },
    {
        orderId: "ORD123463",
        orderDate: "2024-03-14",
        booked: "2024-03-14 13:25 PM",
        pickupId: "PKP796",
        customer: "Lisa Anderson",
        product: "Galaxy Tab S9",
        amount: "₹74,999",
        payment: "Prepaid",
        weight: "0.8",
        channel: "Mobile App",
        awb: "AWB123456796",
        courier: "DTDC",
        tracking: "View",
        status: "In-transit"
    },
    {
        orderId: "ORD123464",
        orderDate: "2024-03-13",
        booked: "2024-03-13 15:40 PM",
        pickupId: "PKP797",
        customer: "David Miller",
        product: "OnePlus 12",
        amount: "₹64,999",
        payment: "COD",
        weight: "0.5",
        channel: "Website",
        awb: "AWB123456797",
        courier: "Delhivery",
        tracking: "View",
        status: "Pending Pickup"
    },
    {
        orderId: "ORD123465",
        orderDate: "2024-03-15",
        booked: "2024-03-15 11:55 AM",
        pickupId: "PKP798",
        customer: "Emma Thompson",
        product: "Sony WH-1000XM5",
        amount: "₹34,990",
        payment: "Prepaid",
        weight: "0.4",
        channel: "Mobile App",
        awb: "AWB123456798",
        courier: "Blue Dart",
        tracking: "View",
        status: "Exception"
    }
];

// Types for the shipment data
interface Shipment {
    orderId: string;
    orderDate: string;
    booked: string;
    pickupId: string;
    customer: string;
    product: string;
    amount: string;
    payment: string;
    weight: string;
    channel: string;
    awb: string;
    courier: string;
    tracking: string;
    status: string;
}

// API Service for shipments
const ShipmentService = {
    // Set this to true to use the real API instead of mock data
    useRealApi: false,
    
    // Generic fetch function that can be reused for different endpoints
    async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        try {
            const baseUrl = process.env.REACT_APP_API_URL || 'https://api.example.com';
            const url = `${baseUrl}${endpoint}`;
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('seller_token')}`,
                    ...options?.headers,
                },
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    },
    
    // Get shipments with filters
    async getShipments(filters: { status?: string; awb?: string; }): Promise<Shipment[]> {
        // Use real API if enabled
        if (this.useRealApi) {
            const queryParams = new URLSearchParams();
            
            if (filters.status && filters.status !== 'all') {
                queryParams.append('status', filters.status);
            }
            
            if (filters.awb) {
                queryParams.append('awb', filters.awb);
            }
            
            const endpoint = `/shipments?${queryParams.toString()}`;
            return this.fetch<Shipment[]>(endpoint);
        } 
        
        // Otherwise use mock data
        return this.getMockShipments(filters);
    },
    
    // Mock implementation for testing
    async getMockShipments(filters: { status?: string; awb?: string; }): Promise<Shipment[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let filteredData = [...shipmentData];
        
        // Filter by status if provided
        if (filters.status && filters.status !== 'all') {
            const formattedStatus = filters.status
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
                
            filteredData = filteredData.filter(shipment => 
                shipment.status === formattedStatus
            );
        }
        
        // Filter by AWB if provided
        if (filters.awb && filters.awb.trim() !== '') {
            const searchTerm = filters.awb.toLowerCase().trim();
            filteredData = filteredData.filter(shipment => 
                shipment.awb.toLowerCase().includes(searchTerm)
            );
        }
        
        return filteredData;
    }
};

// Custom hook for shipment data
function useShipments(status?: string, awbSearch?: string) {
    const [data, setData] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const loadShipments = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const shipments = await ShipmentService.getShipments({
                status,
                awb: awbSearch
            });
            
            setData(shipments);
        } catch (error) {
            console.error('Failed to load shipments', error);
            setError('There was an error loading your shipments. Please try again.');
            toast.error('Failed to load shipments');
        } finally {
            setIsLoading(false);
        }
    };
    
    return { data, isLoading, error, loadShipments };
}

const getPaymentStyle = (payment: string) => {
    return payment === "COD" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
};

type SortConfig = {
    key: keyof Shipment | null;
    direction: 'asc' | 'desc' | null;
};

const ShipmentsTable = ({ 
    data,
    isLoading,
    error,
    onRefresh
}: { 
    data: Shipment[]; 
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
}) => {

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: null,
        direction: null,
    });

    const handleSort = (key: keyof Shipment) => {
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

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key || !sortConfig.direction) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                    <p className="text-muted-foreground">Loading shipments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <div>
                        <p className="font-medium text-lg">Failed to load shipments</p>
                        <p className="text-muted-foreground mt-1">{error}</p>
                    </div>
                    {onRefresh && (
                        <Button 
                            variant="outline" 
                            className="mt-2" 
                            onClick={onRefresh}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <p className="font-medium text-lg">No shipments found</p>
                    <p className="text-muted-foreground">There are no shipments matching your filters.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md border overflow-hidden bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[160px]">
                            <button 
                                className="flex items-center gap-1 hover:text-violet-600 transition-colors"
                                onClick={() => handleSort('orderId')}
                            >
                                Order ID
                                <ArrowUpDown className="h-3 w-3" />
                            </button>
                        </TableHead>
                        <TableHead>
                            <button 
                                className="flex items-center gap-1 hover:text-violet-600 transition-colors"
                                onClick={() => handleSort('orderDate')}
                            >
                                Order Date
                                <ArrowUpDown className="h-3 w-3" />
                            </button>
                        </TableHead>
                        <TableHead>
                            <button 
                                className="flex items-center gap-1 hover:text-violet-600 transition-colors"
                                onClick={() => handleSort('customer')}
                            >
                                Customer
                                <ArrowUpDown className="h-3 w-3" />
                            </button>
                        </TableHead>
                        <TableHead>
                            Product
                        </TableHead>
                        <TableHead>
                            <button 
                                className="flex items-center gap-1 hover:text-violet-600 transition-colors"
                                onClick={() => handleSort('amount')}
                            >
                                Amount
                                <ArrowUpDown className="h-3 w-3" />
                            </button>
                        </TableHead>
                        <TableHead>
                            <button 
                                className="flex items-center gap-1 hover:text-violet-600 transition-colors"
                                onClick={() => handleSort('payment')}
                            >
                                Payment
                                <ArrowUpDown className="h-3 w-3" />
                            </button>
                        </TableHead>
                        <TableHead>
                            AWB
                        </TableHead>
                        <TableHead>
                            <button 
                                className="flex items-center gap-1 hover:text-violet-600 transition-colors"
                                onClick={() => handleSort('courier')}
                            >
                                Courier
                                <ArrowUpDown className="h-3 w-3" />
                            </button>
                        </TableHead>
                        <TableHead>
                            Tracking
                        </TableHead>
                        <TableHead>
                            <button 
                                className="flex items-center gap-1 hover:text-violet-600 transition-colors"
                                onClick={() => handleSort('status')}
                            >
                                Status
                                <ArrowUpDown className="h-3 w-3" />
                            </button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.map((shipment) => (
                        <TableRow key={shipment.orderId}>
                            <TableCell className="font-medium">
                                <Link to={`/seller/dashboard/shipments/${shipment.orderId}`} className="text-blue-500 hover:underline">
                                    {shipment.orderId}
                                </Link>
                            </TableCell>
                            <TableCell>{shipment.orderDate}</TableCell>
                            <TableCell>{shipment.customer}</TableCell>
                            <TableCell className="max-w-[150px] truncate" title={shipment.product}>
                                {shipment.product}
                            </TableCell>
                            <TableCell>{shipment.amount}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-md text-xs ${getPaymentStyle(shipment.payment)}`}>
                                    {shipment.payment}
                                </span>
                            </TableCell>
                            <TableCell>{shipment.awb}</TableCell>
                            <TableCell>{shipment.courier}</TableCell>
                            <TableCell>
                                <Link to={`/seller/dashboard/shipments/${shipment.orderId}`} className="text-blue-500 hover:underline">
                                    {shipment.tracking}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={shipment.status} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "";
    let textColor = "";

    switch (status) {
        case "Booked":
            bgColor = "bg-blue-100";
            textColor = "text-blue-800";
            break;
        case "In-transit":
            bgColor = "bg-yellow-100";
            textColor = "text-yellow-800";
            break;
        case "Delivered":
            bgColor = "bg-green-100";
            textColor = "text-green-800";
            break;
        case "Cancelled":
            bgColor = "bg-red-100";
            textColor = "text-red-800";
            break;
        case "Pending Pickup":
            bgColor = "bg-purple-100";
            textColor = "text-purple-800";
            break;
        case "Exception":
            bgColor = "bg-orange-100";
            textColor = "text-orange-800";
            break;
        default:
            bgColor = "bg-gray-100";
            textColor = "text-gray-800";
    }

    return (
        <span className={`px-2 py-1 rounded-md text-xs ${bgColor} ${textColor}`}>
            {status}
        </span>
    );
};

const SellerShipmentsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get("tab") || "all";
    const awbSearch = searchParams.get("awb") || "";
    const [isSearching, setIsSearching] = useState<boolean>(false);
    
    // Use our custom hook to manage shipment data
    const { 
        data: filteredData, 
        isLoading, 
        error, 
        loadShipments
    } = useShipments(currentTab, awbSearch);

    const handleTabChange = (value: string) => {
        // Preserve the AWB search when changing tabs
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", value);
        setSearchParams(newParams);
    };
    
    // Function to handle AWB from the navbar search
    const handleAWBSearch = (awbInput: string) => {
        // Indicate search is in progress for the UI
        setIsSearching(true);
        
        const newParams = new URLSearchParams(searchParams);
        if (awbInput && awbInput.trim() !== '') {
            newParams.set("awb", awbInput.trim());
        } else {
            newParams.delete("awb");
        }
        setSearchParams(newParams);
        
        // Reset searching indicator after a short delay (for visual feedback)
        setTimeout(() => setIsSearching(false), 300);
    };

    // Listen for the navbar search event
    useEffect(() => {
        const handleNavbarSearch = (event: CustomEvent) => {
            const { query } = event.detail;
            handleAWBSearch(query);
        };

        // Add event listener for navbar search
        window.addEventListener('navbarSearch', handleNavbarSearch as EventListener);
        
        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener('navbarSearch', handleNavbarSearch as EventListener);
        };
    }, []);

    // Load shipments when tab or AWB search changes
    useEffect(() => {
        loadShipments();
    }, [currentTab, awbSearch]);

    // Load initial tab and data
    useEffect(() => {
        if (searchParams.get("tab")) {
            handleTabChange(searchParams.get("tab")!);
        }
        loadShipments();
    }, []);

    return (
        <div className="space-y-8 overflow-hidden">
            <h1 className="text-xl lg:text-2xl font-semibold">
                Shipments
            </h1>

            <Tabs defaultValue={currentTab} className="w-full" onValueChange={handleTabChange}>
                <div className="w-[calc(100vw-5rem)] lg:w-full -mr-4 lg:mr-0">
                    <div className="w-full overflow-x-auto scrollbar-hide">
                        <TabsList className="w-max min-w-full p-0 h-12 z-0 bg-white rounded-none relative">
                            <div className="absolute bottom-0 w-full h-px -z-10 bg-violet-200"></div>
                            <TabsTrigger
                                value="all"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                All
                            </TabsTrigger>
                            <TabsTrigger
                                value="booked"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                Booked
                            </TabsTrigger>
                            <TabsTrigger
                                value="pending-pickup"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                Pending Pickup
                            </TabsTrigger>
                            <TabsTrigger
                                value="in-transit"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                In-transit
                            </TabsTrigger>
                            <TabsTrigger
                                value="delivered"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                Delivered
                            </TabsTrigger>
                            <TabsTrigger
                                value="cancelled"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                Cancelled
                            </TabsTrigger>
                            <TabsTrigger
                                value="exception"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                Exception
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                {/* Show AWB search info if active or searching */}
                <div className="flex items-center justify-between py-4 w-full">
                    <div className="flex items-center gap-2">
                        {isSearching && (
                            <div className="flex items-center gap-2 text-violet-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Searching...</span>
                            </div>
                        )}
                        
                        {!isSearching && awbSearch && (
                            <>
                                <span className="text-sm text-muted-foreground">Filtering by AWB: </span>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                                    {awbSearch}
                                    <button 
                                        onClick={() => handleAWBSearch("")}
                                        className="hover:text-blue-600"
                                        title="Clear AWB filter"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </span>
                            </>
                        )}
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="icon"
                        onClick={loadShipments}
                        disabled={isLoading}
                        title="Refresh shipments"
                        className={awbSearch || isSearching ? "" : "ml-auto"}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="w-[calc(100vw-4rem)] lg:w-full -mr-4 lg:mr-0">
                    <div className="w-full overflow-x-auto">
                        <TabsContent value="all" className="mt-2 min-w-full">
                            <ShipmentsTable 
                                data={filteredData} 
                                isLoading={isLoading} 
                                error={error}
                                onRefresh={loadShipments}
                            />
                        </TabsContent>

                        {/* Keep other tab contents the same */}
                        <TabsContent value="booked" className="mt-2 min-w-full">
                            <ShipmentsTable 
                                data={filteredData} 
                                isLoading={isLoading} 
                                error={error}
                                onRefresh={loadShipments}
                            />
                        </TabsContent>

                        <TabsContent value="pending-pickup" className="mt-2 min-w-full">
                            <ShipmentsTable 
                                data={filteredData} 
                                isLoading={isLoading} 
                                error={error}
                                onRefresh={loadShipments}
                            />
                        </TabsContent>

                        <TabsContent value="in-transit" className="mt-2 min-w-full">
                            <ShipmentsTable 
                                data={filteredData} 
                                isLoading={isLoading} 
                                error={error}
                                onRefresh={loadShipments}
                            />
                        </TabsContent>

                        <TabsContent value="delivered" className="mt-2 min-w-full">
                            <ShipmentsTable 
                                data={filteredData} 
                                isLoading={isLoading} 
                                error={error}
                                onRefresh={loadShipments}
                            />
                        </TabsContent>

                        <TabsContent value="cancelled" className="mt-2 min-w-full">
                            <ShipmentsTable 
                                data={filteredData} 
                                isLoading={isLoading} 
                                error={error}
                                onRefresh={loadShipments}
                            />
                        </TabsContent>

                        <TabsContent value="exception" className="mt-2 min-w-full">
                            <ShipmentsTable 
                                data={filteredData} 
                                isLoading={isLoading} 
                                error={error}
                                onRefresh={loadShipments}
                            />
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
};

export default SellerShipmentsPage;
