import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Download, Filter, Search, Tag, Truck, X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WarehouseBookingValues, warehouseBookingSchema } from "@/lib/validations/order";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AdminShippingOptionsModal from "@/components/admin/shipping-options-modal";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DateRange } from "react-day-picker";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import * as XLSX from 'xlsx';


type OrderStatus = "Active" | "Inactive";
type TabType = "seller" | "customer";
type SortField = "id" | "name" | "email" | "status" | "registrationDate" | "transactionAmount" | "senderName" | "orderId";
type SortOrder = "asc" | "desc";

interface Order {
    id: string;
    orderId: string;
    name: string;
    email: string;
    status: OrderStatus;
    registrationDate: string;
    transactionAmount: string;
    senderName: string;
}

interface ExportHistory {
    fileName: string;
    startDate: string;
    endDate: string;
    filterApplied: string;
    exportDate: string;
    exportCount: string;
    generatedBy: string;
    status: string;
}

interface StatusButton {
    id: number;
    label: string;
    count: number;
    color: string;
    status: string;
}

// Define expanded order interface with more fields for filtering
interface OrderWithFilters extends Order {
    paymentType: "Prepaid" | "COD";
    priority: "High" | "Medium" | "Low";
    actualStatus: string; // Tracking actual status for filtering
}

// Mock data for seller orders
const SELLER_ORDERS_DATA: OrderWithFilters[] = [
    {
        id: "SE12345",
        orderId: "ORD-001",
        name: "Acme Corp",
        email: "contact@acmecorp.com",
        status: "Active",
        registrationDate: "2023-06-15",
        transactionAmount: "₹2,500",
        senderName: "John Smith",
        paymentType: "Prepaid",
        priority: "High",
        actualStatus: "Booked"
    },
    {
        id: "SE12346",
        orderId: "ORD-002",
        name: "Globex Inc",
        email: "orders@globex.com",
        status: "Active",
        registrationDate: "2023-06-16",
        transactionAmount: "₹1,850",
        senderName: "Sarah Johnson",
        paymentType: "COD",
        priority: "Medium",
        actualStatus: "Processing"
    },
    {
        id: "SE12347",
        orderId: "ORD-003",
        name: "Initech Systems",
        email: "sales@initech.com",
        status: "Active",
        registrationDate: "2023-06-17",
        transactionAmount: "₹3,200",
        senderName: "Michael Brown",
        paymentType: "Prepaid",
        priority: "Low",
        actualStatus: "In Transit"
    },
    {
        id: "SE12348",
        orderId: "ORD-004",
        name: "Umbrella Corp",
        email: "info@umbrella.com",
        status: "Inactive",
        registrationDate: "2023-06-18",
        transactionAmount: "₹4,500",
        senderName: "Emily Davis",
        paymentType: "COD",
        priority: "High",
        actualStatus: "Out for Delivery"
    },
    {
        id: "SE12349",
        orderId: "ORD-005",
        name: "Stark Industries",
        email: "orders@stark.com",
        status: "Active",
        registrationDate: "2023-06-19",
        transactionAmount: "₹6,750",
        senderName: "Tony Stark",
        paymentType: "Prepaid",
        priority: "Medium",
        actualStatus: "Delivered"
    },
    {
        id: "SE12350",
        orderId: "ORD-006",
        name: "Wayne Enterprises",
        email: "shipping@wayne.com",
        status: "Active",
        registrationDate: "2023-06-20",
        transactionAmount: "₹5,100",
        senderName: "Bruce Wayne",
        paymentType: "COD",
        priority: "Low",
        actualStatus: "Returned"
    }
];

// Mock data for customer orders
const ADDITIONAL_CUSTOMER_ORDERS_DATA: OrderWithFilters[] = [
    {
        id: "CU12345",
        orderId: "CORD-001",
        name: "Raj Sharma",
        email: "raj.sharma@email.com",
        status: "Active",
        registrationDate: "2023-06-15",
        transactionAmount: "₹1,200",
        senderName: "Raj Sharma",
        paymentType: "Prepaid",
        priority: "Medium",
        actualStatus: "Booked"
    },
    {
        id: "CU12346",
        orderId: "CORD-002",
        name: "Priya Patel",
        email: "priya.patel@email.com",
        status: "Active",
        registrationDate: "2023-06-16",
        transactionAmount: "₹950",
        senderName: "Priya Patel",
        paymentType: "COD",
        priority: "Low",
        actualStatus: "Processing"
    },
    {
        id: "CU12347",
        orderId: "CORD-003",
        name: "Amit Kumar",
        email: "amit.kumar@email.com",
        status: "Active",
        registrationDate: "2023-06-17",
        transactionAmount: "₹2,300",
        senderName: "Amit Kumar",
        paymentType: "Prepaid",
        priority: "High",
        actualStatus: "In Transit"
    },
    {
        id: "CU12348",
        orderId: "CORD-004",
        name: "Neha Singh",
        email: "neha.singh@email.com",
        status: "Inactive",
        registrationDate: "2023-06-18",
        transactionAmount: "₹1,800",
        senderName: "Neha Singh",
        paymentType: "COD",
        priority: "Medium",
        actualStatus: "Out for Delivery"
    },
    {
        id: "CU12349",
        orderId: "CORD-005",
        name: "Vikram Mehta",
        email: "vikram.mehta@email.com",
        status: "Active",
        registrationDate: "2023-06-19",
        transactionAmount: "₹3,500",
        senderName: "Vikram Mehta",
        paymentType: "Prepaid",
        priority: "Low",
        actualStatus: "Delivered"
    },
    {
        id: "CU12350",
        orderId: "CORD-006",
        name: "Ananya Gupta",
        email: "ananya.gupta@email.com",
        status: "Active",
        registrationDate: "2023-06-20",
        transactionAmount: "₹2,100",
        senderName: "Ananya Gupta",
        paymentType: "COD",
        priority: "High",
        actualStatus: "Returned"
    }
];

const EXPORT_HISTORY: ExportHistory[] = [];

// Default status buttons with static counts for development/fallback
const defaultStatusButtons: StatusButton[] = [
    { id: 6, label: "Manifested", count: 178, color: "bg-blue-500", status: "Booked" },
    { id: 5, label: "Processing", count: 89, color: "bg-[#1AA1B7]", status: "Processing" },
    { id: 4, label: "In Transit", count: 156, color: "bg-yellow-500", status: "In Transit" },
    { id: 2, label: "Out for Delivery", count: 54, color: "bg-green-400", status: "Out for Delivery" },
    { id: 1, label: "Delivered", count: 432, color: "bg-emerald-700", status: "Delivered" },
    { id: 3, label: "Returned", count: 32, color: "bg-neutral-500", status: "Returned" },
];

const getStatusStyle = (status: OrderStatus) => {
    return {
        Active: "bg-green-50 text-green-700",
        Inactive: "bg-neutral-100 text-neutral-700",
    }[status];
};

const AdminOrdersPage = () => {

    const [activeTab, setActiveTab] = useState<TabType>("seller");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>("id");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [exportHistoryOpen, setExportHistoryOpen] = useState(false);
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [statusButtons, setStatusButtons] = useState<StatusButton[]>(defaultStatusButtons);
    
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems] = useState(0);

    const [activeFilters, setActiveFilters] = useState<{
        status: string | null;
        paymentType: string | null;
        dateRange: DateRange | null;
        priority: string | null;
    }>({
        status: null,
        paymentType: null,
        dateRange: null,
        priority: null,
    });
    
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    const form = useForm<WarehouseBookingValues>({
        resolver: zodResolver(warehouseBookingSchema),
        defaultValues: {
            warehouse: "",
            rtoWarehouse: "",
            shippingMode: "",
            courier: "",
        },
    });

    // Update the count display based on actual data
    useEffect(() => {
        const allOrders = [...SELLER_ORDERS_DATA, ...ADDITIONAL_CUSTOMER_ORDERS_DATA];
        
        // Update status buttons with actual counts
        const updatedCounts = defaultStatusButtons.map(button => {
            const count = allOrders.filter(order => order.actualStatus === button.status).length;
            return {
                ...button,
                count
            };
        });
        
        setStatusButtons(updatedCounts);
    }, []);

    // Apply all filters to the data
    const applyAllFilters = (data: OrderWithFilters[]) => {
        let filteredData = [...data];
        
        // Filter by status
        if (activeFilters.status) {
            filteredData = filteredData.filter(order => order.actualStatus === activeFilters.status);
        }
        
        // Filter by payment type
        if (activeFilters.paymentType) {
            filteredData = filteredData.filter(order => order.paymentType === activeFilters.paymentType);
        }
        
        // Filter by priority
        if (activeFilters.priority) {
            filteredData = filteredData.filter(order => order.priority === activeFilters.priority);
        }
        
        // Filter by date range
        if (activeFilters.dateRange?.from && activeFilters.dateRange?.to) {
            const fromDate = new Date(activeFilters.dateRange.from);
            const toDate = new Date(activeFilters.dateRange.to);
            
            filteredData = filteredData.filter(order => {
                const orderDate = new Date(order.registrationDate);
                return orderDate >= fromDate && orderDate <= toDate;
            });
        }
        
        // Also apply search query filter if exists
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredData = filteredData.filter(order => 
                order.id.toLowerCase().includes(query) ||
                order.orderId.toLowerCase().includes(query) ||
                order.name.toLowerCase().includes(query) ||
                order.email.toLowerCase().includes(query) ||
                order.senderName.toLowerCase().includes(query)
            );
        }
        
        return filteredData;
    };

    // Get the filtered data based on active tab
    const filteredData = activeTab === "seller" 
        ? applyAllFilters(SELLER_ORDERS_DATA) 
        : applyAllFilters(ADDITIONAL_CUSTOMER_ORDERS_DATA);

    const onSubmit = (data: WarehouseBookingValues) => {
        console.log(data);
        toast.success("Orders booked successfully");
        setBookingModalOpen(false);
        setSelectedOrders([]);
        form.reset();
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleSelectOrder = (orderId: string) => {
        setSelectedOrders(prev => {
            if (prev.includes(orderId)) {
                return prev.filter(id => id !== orderId);
            }
            return [...prev, orderId];
        });
    };

    const handleCancel = () => {
        if (selectedOrders.length === 0) {
            toast.error("Please select orders to cancel");
            return;
        }
        toast.success("Orders cancelled successfully");
        setSelectedOrders([]);
    };

    const handleAddTag = () => {
        if (selectedOrders.length === 0) {
            toast.error("Please select orders to add tag");
            return;
        }
        toast.success("Tags added successfully");
        setSelectedOrders([]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrders(filteredData.map(order => order.id));
        } else {
            setSelectedOrders([]);
        }
    };

    // Update the sortedData to use the filtered data
    const sortedData = [...filteredData].sort((a, b) => {
        const aValue = String(a[sortField] ?? "");
        const bValue = String(b[sortField] ?? "");
        return sortOrder === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
    });

    const handleShipOrder = (orderId: string) => {
        setSelectedOrderForShipping(orderId);
        setShippingModalOpen(true);
    };

    const handleShipSelected = () => {
        toast.success("Order shipped successfully");
        setShippingModalOpen(false);
        setSelectedOrderForShipping("");
    };

    const handlePreviousPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalItems / pageSize) setPage(page + 1);
    };

    const handleExport = () => {
        // Create a worksheet with the filtered data
        const worksheet = XLSX.utils.json_to_sheet(
            filteredData.map(order => ({
                'User ID': order.id,
                'Order ID': order.orderId,
                'Name': order.name,
                'Email': order.email,
                'Sender Name': order.senderName,
                'Status': order.status,
                'Registration Date': order.registrationDate,
                'Transaction Amount': order.transactionAmount,
                'Payment Type': order.paymentType,
                'Priority': order.priority,
                'Order Status': order.actualStatus
            }))
        );

        // Set column widths for better readability
        const columnWidths = [
            { wch: 10 },  // User ID
            { wch: 12 },  // Order ID
            { wch: 20 },  // Name
            { wch: 25 },  // Email
            { wch: 20 },  // Sender Name
            { wch: 10 },  // Status
            { wch: 15 },  // Registration Date
            { wch: 15 },  // Transaction Amount
            { wch: 12 },  // Payment Type
            { wch: 10 },  // Priority
            { wch: 15 }   // Order Status
        ];
        worksheet['!cols'] = columnWidths;

        // Create a workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

        // Generate file name with current date
        const date = new Date().toISOString().split('T')[0];
        const fileName = `Orders_Export_${date}.xlsx`;

        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, fileName);
        
        toast.success("Orders exported successfully");
    };

    // Modify the handleFilterSelection function to apply filters immediately
    const handleFilterSelection = (filterType: keyof typeof activeFilters, value: string | null) => {
        setActiveFilters(prev => {
            const newValue = value === prev[filterType] ? null : value;
            return {
                ...prev,
                [filterType]: newValue
            };
        });
    };

    const getActiveFiltersCount = () => {
        return Object.values(activeFilters).filter(value => value !== null).length;
    };

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // In a real app, we would fetch orders from an API
                // For this example, we'll simulate a delay to match the real behavior
                setTimeout(() => {
                    setLoading(false);
                }, 1000);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                toast.error("Failed to load orders data");
                setLoading(false);
            }
        };
        
        fetchOrders();
    }, [page, pageSize]);

    const displayedOrders = sortedData.slice((page - 1) * pageSize, page * pageSize);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 p-4 text-center border rounded-lg shadow-sm">
                <p>Error loading orders: {error}</p>
                <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold">
                        Order Management
                    </h1>
                    <p className="text-base lg:text-lg text-muted-foreground mt-1">
                        Manage order accounts and permissions
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("seller")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === "seller"
                                ? "bg-neutral-200"
                                : "hover:bg-neutral-100"
                        )}
                    >
                        Seller
                    </button>
                    <button
                        onClick={() => setActiveTab("customer")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === "customer"
                                ? "bg-neutral-200"
                                : "hover:bg-neutral-100"
                        )}
                    >
                        Customer
                    </button>
                </div>

                {selectedOrders.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            {selectedOrders.length} selected
                        </Button>
                        <Button
                            variant="primary"
                            className="gap-2"
                            onClick={() => setBookingModalOpen(true)}
                        >
                            <Truck className="size-4" />
                            Book
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 bg-red-500 hover:bg-red-600 text-white hover:text-white"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 bg-green-500 hover:bg-green-600 text-white hover:text-white"
                            onClick={handleAddTag}
                        >
                            <Tag className="size-4" />
                            Add Tag
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setExportHistoryOpen(true)}
                        >
                            <Download className="size-4" />
                            Export
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search orders"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-gray-100/50"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
                <DateRangePicker
                    date={dateRange}
                    setDate={(newDateRange) => {
                        setDateRange(newDateRange);
                        setActiveFilters(prev => ({
                            ...prev,
                            dateRange: newDateRange || null
                        }));
                    }}
                />
                
                <Popover open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {getActiveFiltersCount() > 0 && (
                                <span className="flex items-center justify-center rounded-full bg-primary w-5 h-5 text-[10px] text-white font-semibold">
                                    {getActiveFiltersCount()}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Filters</h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                        setActiveFilters({
                                            status: null,
                                            paymentType: null,
                                            dateRange: null,
                                            priority: null,
                                        });
                                        setDateRange(undefined);
                                        toast.success("All filters cleared");
                                    }}
                                    className="h-8 px-2 text-xs"
                                >
                                    Clear all
                                </Button>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Order Status</h4>
                                <div className="grid grid-cols-2 gap-1">
                                    {statusButtons.map(button => (
                                        <div
                                            key={button.id}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded cursor-pointer text-sm",
                                                activeFilters.status === button.status 
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-gray-100"
                                            )}
                                            onClick={() => handleFilterSelection('status', button.status)}
                                        >
                                            {activeFilters.status === button.status && (
                                                <Check className="h-3 w-3" />
                                            )}
                                            <span>{button.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Payment Type</h4>
                                <div className="grid grid-cols-2 gap-1">
                                    {['Prepaid', 'COD'].map(type => (
                                        <div
                                            key={type}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded cursor-pointer text-sm",
                                                activeFilters.paymentType === type 
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-gray-100"
                                            )}
                                            onClick={() => handleFilterSelection('paymentType', type)}
                                        >
                                            {activeFilters.paymentType === type && (
                                                <Check className="h-3 w-3" />
                                            )}
                                            <span>{type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Priority</h4>
                                <div className="grid grid-cols-2 gap-1">
                                    {['High', 'Medium', 'Low'].map(priority => (
                                        <div
                                            key={priority}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded cursor-pointer text-sm",
                                                activeFilters.priority === priority 
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-gray-100"
                                            )}
                                            onClick={() => handleFilterSelection('priority', priority)}
                                        >
                                            {activeFilters.priority === priority && (
                                                <Check className="h-3 w-3" />
                                            )}
                                            <span>{priority}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <Button 
                                className="w-full" 
                                variant="default"
                                onClick={() => {
                                    toast.success("Filters applied");
                                    setFilterMenuOpen(false);
                                }}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
                
                <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleExport}
                >
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#F8F0FF]">
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={selectedOrders.length === sortedData.length && sortedData.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("id")}
                                >
                                    User ID
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("orderId")}
                                >
                                    Order ID
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("name")}
                                >
                                    Name
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("email")}
                                >
                                    Email
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("senderName")}
                                >
                                    Sender's Name
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("status")}
                                >
                                    Status
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("registrationDate")}
                                >
                                    Registration Date
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("transactionAmount")}
                                >
                                    Transaction Amount
                                    <ArrowUpDown className="size-3" />
                                </div>
                            </TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedOrders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-neutral-50">
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={() => handleSelectOrder(order.id)}
                                        className="rounded border-gray-300"
                                    />
                                </TableCell>
                                <TableCell>
                                    {order.id}
                                </TableCell>
                                <TableCell>
                                    <Link
                                        to={`/admin/dashboard/orders/${order.orderId}`}
                                        className="text-purple-600 hover:underline font-medium"
                                    >
                                        {order.orderId}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {order.name}
                                </TableCell>
                                <TableCell>
                                    {order.email}
                                </TableCell>
                                <TableCell>
                                    {order.senderName}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            order.status === "Active" ? "bg-green-500" : "bg-neutral-400"
                                        )} />
                                        <span className={cn(
                                            "px-2 py-1 rounded-md text-sm",
                                            getStatusStyle(order.status)
                                        )}>
                                            {order.status}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {order.registrationDate}
                                </TableCell>
                                <TableCell>
                                    {order.transactionAmount}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handleShipOrder(order.orderId)}
                                    >
                                        <Truck className="size-4" />
                                        Ship
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalItems > 0 && (
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to {Math.min(page * pageSize, totalItems)} of {totalItems} orders
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={page === 1}
                            className="flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalItems / pageSize, 5) }, (_, i) => {
                                let pageNum = i + 1;
                                
                                if (totalItems / pageSize > 5 && page > 3) {
                                    pageNum = page - 3 + i;
                                }
                                
                                if (pageNum <= totalItems / pageSize) {
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? "default" : "outline"}
                                            size="sm"
                                            className="w-9 h-9"
                                            onClick={() => setPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleNextPage}
                            disabled={page >= totalItems / pageSize}
                            className="flex items-center gap-1"
                        >
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Warehouse & Shipping Mode</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="warehouse"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Warehouse</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select warehouse" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="tes5">tes5</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rtoWarehouse"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RTO Warehouse</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select RTO warehouse" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="tes5">tes5</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shippingMode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Shipping Mode</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select shipping mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="standard">Standard</SelectItem>
                                                <SelectItem value="express">Express</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="courier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Courier (Optional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select courier" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="fedex">FedEx</SelectItem>
                                                <SelectItem value="dhl">DHL</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setBookingModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary">
                                    Save & Ship
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={exportHistoryOpen} onOpenChange={setExportHistoryOpen}>
                <DialogContent showCloseButton={false} className="max-w-4xl">
                    <DialogHeader className="flex flex-row items-center justify-between pr-0">
                        <DialogTitle>Export History</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-auto p-2"
                            onClick={() => setExportHistoryOpen(false)}
                        >
                            <X className="size-4" />
                        </Button>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-[#F8F0FF]">
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Filter Applied</TableHead>
                                    <TableHead>Export Date</TableHead>
                                    <TableHead>Export Count</TableHead>
                                    <TableHead>Generated By</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {EXPORT_HISTORY.map((item) => (
                                    <TableRow key={item.fileName}>
                                        <TableCell>{item.fileName}</TableCell>
                                        <TableCell>{item.startDate}</TableCell>
                                        <TableCell>{item.endDate}</TableCell>
                                        <TableCell>{item.filterApplied}</TableCell>
                                        <TableCell>{item.exportDate}</TableCell>
                                        <TableCell>{item.exportCount}</TableCell>
                                        <TableCell>{item.generatedBy}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-md text-sm bg-green-50 text-green-700">
                                                {item.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <AdminShippingOptionsModal
                isOpen={shippingModalOpen}
                onClose={() => setShippingModalOpen(false)}
                orderNumber={selectedOrderForShipping}
                weight={1}
                onShipSelected={handleShipSelected}
                isSellerTab={activeTab === "seller"}
            />
        </div>
    );
};

export default AdminOrdersPage; 
