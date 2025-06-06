import DateRangePicker from "@/components/admin/date-range-picker";
import AdminShippingOptionsModal from "@/components/admin/shipping-options-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { WarehouseBookingValues, warehouseBookingSchema } from "@/lib/validations/order";
import { AdminService } from "@/services/admin.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, ArrowUpDown, Check, Download, Filter, Search, Tag, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

type TabType = "seller" | "customer";
type SortField = "createdAt" | "orderId" | "status" | "amount" | "customer" | "awb";
type SortOrder = "asc" | "desc";

interface OrderData {
  id: string;
  orderId?: string;
  awb?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderType: 'seller' | 'customer';
  // Seller order specific fields
  customer?: {
    name: string;
    email: string;
    phone: string;
    address?: any;
  };
  payment?: {
    method: string;
    total: string;
    amount?: string;
  };
  product?: {
    name: string;
    sku: string;
    quantity: number;
    price: number;
    weight: string;
  };
  seller?: {
    id: string;
    name: string;
    businessName: string;
    email: string;
    phone: string;
  };
  channel?: string;
  courier?: string;
  tracking?: string;
  orderDate?: string;
  // Customer order specific fields
  amount?: number;
  paymentMethod?: string;
  serviceType?: string;
  estimatedDelivery?: string;
  pickupAddress?: any;
  deliveryAddress?: any;
  package?: {
    weight: number;
    dimensions: any;
    items: any[];
  };
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

const EXPORT_HISTORY: ExportHistory[] = [];

// Status buttons for order filtering
const STATUS_BUTTONS: StatusButton[] = [
  { id: 1, label: "Booked", count: 0, color: "bg-blue-500", status: "Booked" },
  { id: 2, label: "Processing", count: 0, color: "bg-[#1AA1B7]", status: "Processing" },
  { id: 3, label: "In Transit", count: 0, color: "bg-yellow-500", status: "In Transit" },
  { id: 4, label: "Out for Delivery", count: 0, color: "bg-green-400", status: "Out for Delivery" },
  { id: 5, label: "Delivered", count: 0, color: "bg-emerald-700", status: "Delivered" },
  { id: 6, label: "Cancelled", count: 0, color: "bg-red-500", status: "Cancelled" },
  { id: 7, label: "Returned", count: 0, color: "bg-neutral-500", status: "Returned" },
];

const getStatusStyle = (status: string) => {
  const statusStyles: Record<string, string> = {
    'Active': "bg-green-50 text-green-700",
    'Inactive': "bg-neutral-100 text-neutral-700",
    'Booked': "bg-blue-50 text-blue-700",
    'Processing': "bg-yellow-50 text-yellow-700",
    'In Transit': "bg-orange-50 text-orange-700",
    'Out for Delivery': "bg-green-50 text-green-700",
    'Delivered': "bg-emerald-50 text-emerald-700",
    'Cancelled': "bg-red-50 text-red-700",
    'Returned': "bg-gray-50 text-gray-700",
    'Pending': "bg-blue-50 text-blue-700",
    'Shipped': "bg-indigo-50 text-indigo-700",
    'Failed': "bg-red-50 text-red-700"
  };
  return statusStyles[status] || "bg-gray-50 text-gray-700";
};

const AdminOrdersPage = () => {
  // Services
  const adminService = new AdminService();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("seller");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [exportHistoryOpen, setExportHistoryOpen] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusButtons, setStatusButtons] = useState<StatusButton[]>(STATUS_BUTTONS);

  // Orders data
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [activeFilters, setActiveFilters] = useState<{
    status: string | null;
    paymentType: string | null;
    dateRange: DateRange | null;
  }>({
    status: null,
    paymentType: null,
    dateRange: null,
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

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Check if user is logged in
    const authToken = await import('@/utils/secureStorage').then(m => m.secureStorage.getItem('auth_token'));
    console.log('Auth token exists:', !!authToken);

    try {
      const params: any = {
        page,
        limit: pageSize,
        sortBy: sortField,
        sortOrder,
        type: activeTab, // 'seller' or 'customer'
      };

      // Add search if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add status filter
      if (activeFilters.status) {
        params.status = activeFilters.status;
      }

      // Add payment type filter
      if (activeFilters.paymentType) {
        params.paymentType = activeFilters.paymentType;
      }

      // Add date range filter
      if (activeFilters.dateRange?.from) {
        params.from = activeFilters.dateRange.from.toISOString().split('T')[0];
      }
      if (activeFilters.dateRange?.to) {
        params.to = activeFilters.dateRange.to.toISOString().split('T')[0];
      }

      const response = await adminService.getOrders(params);

      console.log('API Parameters:', params); // Debug log
      console.log('API Response:', response); // Debug log

      // Handle different response formats
      if (Array.isArray(response)) {
        // If response is directly an array (unexpected format)
        console.log('Response is array, treating as empty result');
        setOrders([]);
        setTotalItems(0);
        setTotalPages(0);
      } else if (response && response.success) {
        // Expected format: { success: true, data: { data: [...], pagination: {...} } }
        setOrders(response.data?.data || []);
        setTotalItems(response.data?.pagination?.total || 0);
        setTotalPages(response.data?.pagination?.pages || 0);
      } else if (response && response.data) {
        // Alternative format: { data: [...], pagination: {...} }
        setOrders(response.data || []);
        setTotalItems(response.pagination?.total || 0);
        setTotalPages(response.pagination?.pages || 0);
      } else {
        console.error('API Response Error:', response); // Debug log
        throw new Error(response?.error || response?.message || 'Failed to fetch orders');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);

      // Handle authentication errors
      if (err.status === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('You need to login as admin to view orders');
        toast.error('Please login as admin to access orders');
        // Optionally redirect to login
        // window.location.href = '/admin/login';
      } else if (err.status === 403 || err.message?.includes('403') || err.message?.includes('Forbidden')) {
        setError('You do not have permission to view orders');
        toast.error('Access denied: Admin permission required');
      } else {
        setError(err.message || 'Failed to load orders');
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [
    adminService,
    page,
    pageSize,
    sortField,
    sortOrder,
    activeTab,
    searchQuery,
    activeFilters.status,
    activeFilters.paymentType,
    activeFilters.dateRange
  ]);

  // Fetch order status counts
  const fetchStatusCounts = useCallback(async () => {
    try {
      const params: any = {
        type: activeTab, // Pass the current tab (seller/customer)
      };

      if (activeFilters.dateRange?.from) {
        params.from = activeFilters.dateRange.from.toISOString().split('T')[0];
      }
      if (activeFilters.dateRange?.to) {
        params.to = activeFilters.dateRange.to.toISOString().split('T')[0];
      }

      const response = await adminService.getOrderStatusCounts(params);

      if (response.success) {
        // The backend returns stats.byStatus, not just status counts
        const stats = response.data;
        const statusCounts = stats.byStatus || {};

        const updatedButtons = STATUS_BUTTONS.map(button => ({
          ...button,
          count: statusCounts[button.status] || 0
        }));
        setStatusButtons(updatedButtons);
      }
    } catch (err) {
      console.error('Error fetching status counts:', err);
    }
  }, [adminService, activeTab, activeFilters.dateRange]);

  // Effects
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, activeFilters.status, activeFilters.paymentType, activeFilters.dateRange]);

  // Helper functions
  const formatOrderForDisplay = (order: OrderData) => {
    if (order.orderType === 'seller') {
      return {
        id: order.id,
        orderId: order.orderId || '-',
        awb: order.awb || '-',
        name: order.customer?.name || order.seller?.businessName || '-',
        email: order.customer?.email || order.seller?.email || '-',
        senderName: order.seller?.name || order.customer?.name || '-',
        status: order.status,
        registrationDate: new Date(order.createdAt).toLocaleDateString(),
        transactionAmount: order.payment?.total || order.payment?.amount || '₹0',
        paymentType: order.payment?.method || '-',
        actualStatus: order.status
      };
    } else {
      return {
        id: order.id,
        orderId: order.awb || '-',
        awb: order.awb || '-',
        name: order.customer?.name || order.deliveryAddress?.name || '-',
        email: order.customer?.email || '-',
        senderName: order.pickupAddress?.name || '-',
        status: order.status,
        registrationDate: new Date(order.createdAt).toLocaleDateString(),
        transactionAmount: order.amount ? `₹${order.amount}` : '₹0',
        paymentType: order.paymentMethod || '-',
        actualStatus: order.status
      };
    }
  };

  // Event handlers
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
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

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
    if (page < totalPages) setPage(page + 1);
  };

  const handleExport = () => {
    // Create a worksheet with the current orders data
    const exportData = orders.map(order => {
      const formatted = formatOrderForDisplay(order);
      return {
        'User ID': formatted.id,
        'Order ID': formatted.orderId,
        'AWB': formatted.awb,
        'Name': formatted.name,
        'Email': formatted.email,
        'Sender Name': formatted.senderName,
        'Status': formatted.status,
        'Registration Date': formatted.registrationDate,
        'Transaction Amount': formatted.transactionAmount,
        'Payment Type': formatted.paymentType,
        'Order Type': order.orderType
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 },  // User ID
      { wch: 15 },  // Order ID
      { wch: 15 },  // AWB
      { wch: 20 },  // Name
      { wch: 25 },  // Email
      { wch: 20 },  // Sender Name
      { wch: 15 },  // Status
      { wch: 15 },  // Registration Date
      { wch: 15 },  // Transaction Amount
      { wch: 12 },  // Payment Type
      { wch: 12 }   // Order Type
    ];
    worksheet['!cols'] = columnWidths;

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Generate file name with current date
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${activeTab}_Orders_Export_${date}.xlsx`;

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, fileName);

    toast.success("Orders exported successfully");
  };

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

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="text-red-500 p-4 text-center border rounded-lg shadow-sm">
        <p>Error loading orders: {error}</p>
        {error.includes('login') || error.includes('permission') ? (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.href = '/admin/login'}
          >
            Go to Login
          </Button>
        ) : (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => fetchOrders()}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Show empty state if no orders and no error
  if (!loading && !error && orders.length === 0) {
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

        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            No orders found
          </div>
          <p className="text-gray-400 mb-6">
            {activeTab === 'seller' ? 'No seller orders in the system.' : 'No customer orders in the system.'}
          </p>
          <Button
            variant="outline"
            onClick={() => fetchOrders()}
          >
            Refresh
          </Button>
        </div>
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
              variant="default"
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
                      <span>{button.label} ({button.count})</span>
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
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => handleSort("orderId")}
                >
                  Order ID / AWB
                  <ArrowUpDown className="size-3" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => handleSort("customer")}
                >
                  Name
                  <ArrowUpDown className="size-3" />
                </div>
              </TableHead>
              <TableHead>
                Email
              </TableHead>
              <TableHead>
                Sender's Name
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
                  onClick={() => handleSort("createdAt")}
                >
                  Date
                  <ArrowUpDown className="size-3" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  Amount
                  <ArrowUpDown className="size-3" />
                </div>
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const formatted = formatOrderForDisplay(order);
              return (
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
                    <Link
                      to={`/admin/dashboard/orders/${order.id}`}
                      className="text-purple-600 hover:underline font-medium"
                    >
                      {formatted.orderId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {formatted.name}
                  </TableCell>
                  <TableCell>
                    {formatted.email}
                  </TableCell>
                  <TableCell>
                    {formatted.senderName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        order.status === "Delivered" ? "bg-green-500" :
                          order.status === "Cancelled" || order.status === "Failed" ? "bg-red-500" :
                            "bg-blue-500"
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
                    {formatted.registrationDate}
                  </TableCell>
                  <TableCell>
                    {formatted.transactionAmount}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleShipOrder(order.id)}
                    >
                      <Truck className="size-4" />
                      Ship
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;

                if (totalPages > 5 && page > 3) {
                  pageNum = page - 3 + i;
                }

                if (pageNum <= totalPages) {
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
              disabled={page >= totalPages}
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
                    <FormLabel>Warehouse *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warehouse1">Warehouse 1</SelectItem>
                          <SelectItem value="warehouse2">Warehouse 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rtoWarehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RTO Warehouse *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select RTO warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rto1">RTO Warehouse 1</SelectItem>
                          <SelectItem value="rto2">RTO Warehouse 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Mode *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shipping mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="express">Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Courier *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select courier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="courier1">Courier 1</SelectItem>
                          <SelectItem value="courier2">Courier 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Book Orders
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AdminShippingOptionsModal
        isOpen={shippingModalOpen}
        onClose={() => setShippingModalOpen(false)}
        onShip={handleShipSelected}
        orderId={selectedOrderForShipping}
      />
    </div>
  );
};

export default AdminOrdersPage;
