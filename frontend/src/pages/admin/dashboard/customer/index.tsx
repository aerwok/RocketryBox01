import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import DateRangePicker from "@/components/admin/date-range-picker";

interface DashboardCard {
    title: string;
    value: string | number;
    change: string;
}

const DASHBOARD_CARDS: DashboardCard[] = [
    {
        title: "Total Customers",
        value: "1,234",
        change: "+12% from last month"
    },
    {
        title: "Active Customers",
        value: "856",
        change: "+8% from last month"
    },
    {
        title: "New Customers",
        value: "156",
        change: "+15% from last month"
    },
    {
        title: "Customer Retention",
        value: "92%",
        change: "+3% from last month"
    }
];

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    orders: number;
    totalSpent: string;
    lastOrder: string;
    status: string;
}

const CUSTOMERS: Customer[] = [
    {
        id: "CUST001",
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+91 98765 43210",
        orders: 12,
        totalSpent: "₹24,500",
        lastOrder: "2024-02-15",
        status: "Active"
    },
    {
        id: "CUST002",
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        phone: "+91 98765 43211",
        orders: 8,
        totalSpent: "₹18,200",
        lastOrder: "2024-02-10",
        status: "Active"
    },
    {
        id: "CUST003",
        name: "Michael Brown",
        email: "michael.b@example.com",
        phone: "+91 98765 43212",
        orders: 3,
        totalSpent: "₹6,800",
        lastOrder: "2024-01-28",
        status: "New"
    },
    {
        id: "CUST004",
        name: "Emily Davis",
        email: "emily.d@example.com",
        phone: "+91 98765 43213",
        orders: 0,
        totalSpent: "₹0",
        lastOrder: "Never",
        status: "Inactive"
    },
    {
        id: "CUST005",
        name: "David Wilson",
        email: "david.w@example.com",
        phone: "+91 98765 43214",
        orders: 15,
        totalSpent: "₹32,100",
        lastOrder: "2024-02-18",
        status: "Active"
    }
];

interface Order {
    id: string;
    customerId: string;
    customerName: string;
    date: string;
    amount: string;
    status: "Delivered" | "In Transit" | "Processing" | "Cancelled";
    paymentMethod: string;
}

const RECENT_ORDERS: Order[] = [
    {
        id: "ORD001",
        customerId: "CUST001",
        customerName: "John Smith",
        date: "2024-02-15",
        amount: "₹2,500",
        status: "Delivered",
        paymentMethod: "Credit Card"
    },
    {
        id: "ORD002",
        customerId: "CUST002",
        customerName: "Sarah Johnson",
        date: "2024-02-14",
        amount: "₹1,800",
        status: "In Transit",
        paymentMethod: "UPI"
    },
    {
        id: "ORD003",
        customerId: "CUST005",
        customerName: "David Wilson",
        date: "2024-02-13",
        amount: "₹3,200",
        status: "Processing",
        paymentMethod: "Net Banking"
    },
    {
        id: "ORD004",
        customerId: "CUST003",
        customerName: "Michael Brown",
        date: "2024-02-12",
        amount: "₹1,500",
        status: "Cancelled",
        paymentMethod: "Credit Card"
    },
    {
        id: "ORD005",
        customerId: "CUST001",
        customerName: "John Smith",
        date: "2024-02-11",
        amount: "₹4,200",
        status: "Delivered",
        paymentMethod: "UPI"
    }
];

interface CustomerActivity {
    id: string;
    customerId: string;
    customerName: string;
    activity: string;
    timestamp: string;
    details: string;
}

const CUSTOMER_ACTIVITIES: CustomerActivity[] = [
    {
        id: "ACT001",
        customerId: "CUST001",
        customerName: "John Smith",
        activity: "Order Placed",
        timestamp: "2024-02-15 14:30",
        details: "Order #ORD001"
    },
    {
        id: "ACT002",
        customerId: "CUST002",
        customerName: "Sarah Johnson",
        activity: "Account Created",
        timestamp: "2024-02-14 10:15",
        details: "New registration"
    },
    {
        id: "ACT003",
        customerId: "CUST005",
        customerName: "David Wilson",
        activity: "Payment Made",
        timestamp: "2024-02-13 16:45",
        details: "₹3,200 via Net Banking"
    },
    {
        id: "ACT004",
        customerId: "CUST003",
        customerName: "Michael Brown",
        activity: "Order Cancelled",
        timestamp: "2024-02-12 09:20",
        details: "Order #ORD004"
    },
    {
        id: "ACT005",
        customerId: "CUST001",
        customerName: "John Smith",
        activity: "Review Posted",
        timestamp: "2024-02-11 11:30",
        details: "5-star rating"
    }
];

const getStatusStyle = (status: string) => {
    switch (status) {
        case "Active":
            return "bg-green-100 text-green-800";
        case "Inactive":
            return "bg-red-100 text-red-800";
        case "New":
            return "bg-blue-100 text-blue-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const getOrderStatusStyle = (status: Order["status"]) => {
    switch (status) {
        case "Delivered":
            return "bg-green-100 text-green-800";
        case "In Transit":
            return "bg-blue-100 text-blue-800";
        case "Processing":
            return "bg-yellow-100 text-yellow-800";
        case "Cancelled":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const CustomersTable = ({ data }: { data: Customer[] }) => {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-[#F4F2FF] hover:bg-[#F4F2FF]">
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Customer ID
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Name
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[200px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Email
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Phone
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Orders
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Total Spent
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Last Order
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Status
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((customer) => (
                        <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                                <Link to={`/admin/dashboard/customers/${customer.id}`} className="text-main hover:underline">
                                    {customer.id}
                                </Link>
                            </TableCell>
                            <TableCell>
                                {customer.name}
                            </TableCell>
                            <TableCell>
                                {customer.email}
                            </TableCell>
                            <TableCell>
                                {customer.phone}
                            </TableCell>
                            <TableCell>
                                {customer.orders}
                            </TableCell>
                            <TableCell>
                                {customer.totalSpent}
                            </TableCell>
                            <TableCell>
                                {customer.lastOrder}
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(customer.status)}`}>
                                    {customer.status}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const OrdersTable = ({ data }: { data: Order[] }) => {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-[#F4F2FF] hover:bg-[#F4F2FF]">
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Order ID
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Customer
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Date
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Amount
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Payment Method
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Status
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">
                                <Link to={`/admin/dashboard/orders/${order.id}`} className="text-main hover:underline">
                                    {order.id}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Link to={`/admin/dashboard/customers/${order.customerId}`} className="text-main hover:underline">
                                    {order.customerName}
                                </Link>
                            </TableCell>
                            <TableCell>
                                {order.date}
                            </TableCell>
                            <TableCell>
                                {order.amount}
                            </TableCell>
                            <TableCell>
                                {order.paymentMethod}
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusStyle(order.status)}`}>
                                    {order.status}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const ActivityTable = ({ data }: { data: CustomerActivity[] }) => {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-[#F4F2FF] hover:bg-[#F4F2FF]">
                        <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Activity ID
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Customer
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Activity
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Timestamp
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[200px] whitespace-nowrap text-black">
                            <div className="flex items-center gap-1 cursor-pointer">
                                Details
                                <ArrowUpDown className="size-3" />
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((activity) => (
                        <TableRow key={activity.id}>
                            <TableCell className="font-medium">
                                {activity.id}
                            </TableCell>
                            <TableCell>
                                <Link to={`/admin/dashboard/customers/${activity.customerId}`} className="text-main hover:underline">
                                    {activity.customerName}
                                </Link>
                            </TableCell>
                            <TableCell>
                                {activity.activity}
                            </TableCell>
                            <TableCell>
                                {activity.timestamp}
                            </TableCell>
                            <TableCell>
                                {activity.details}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

// Helper function to filter by date range
function filterByDateRange<T>(data: T[], dateRange: DateRange | undefined, getDate: (item: T) => string | undefined) {
    if (!dateRange?.from || !dateRange?.to) return data;
    const from = dateRange.from.getTime();
    const to = dateRange.to.getTime();
    return data.filter(item => {
        const value = getDate(item);
        if (!value || value === "Never") return false;
        const itemDate = new Date(value).getTime();
        return itemDate >= from && itemDate <= to;
    });
}

// Helper to convert array of objects to CSV
function arrayToCSV<T>(data: T[], columns: string[]): string {
    const header = columns.join(",");
    const rows = data.map(row => columns.map(col => `"${(row as any)[col] ?? ''}"`).join(","));
    return [header, ...rows].join("\n");
}

function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const AdminCustomerDashboardPage = () => {
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 1, 1),
        to: new Date(2024, 1, 28),
    });

    // Filtered data
    const filteredOrders = filterByDateRange(RECENT_ORDERS, date, (order) => order.date);
    const filteredActivities = filterByDateRange(CUSTOMER_ACTIVITIES, date, (activity) => activity.timestamp.split(' ')[0]);
    const filteredCustomers = filterByDateRange(CUSTOMERS, date, (customer) => customer.lastOrder);

    // Download handler
    const handleDownload = () => {
        // Download all three tables as separate CSVs
        const customerCSV = arrayToCSV(filteredCustomers, [
            'id', 'name', 'email', 'phone', 'orders', 'totalSpent', 'lastOrder', 'status'
        ]);
        downloadCSV('customers.csv', customerCSV);

        const ordersCSV = arrayToCSV(filteredOrders, [
            'id', 'customerId', 'customerName', 'date', 'amount', 'status', 'paymentMethod'
        ]);
        downloadCSV('orders.csv', ordersCSV);

        const activitiesCSV = arrayToCSV(filteredActivities, [
            'id', 'customerId', 'customerName', 'activity', 'timestamp', 'details'
        ]);
        downloadCSV('customer_activities.csv', activitiesCSV);
    };

    return (
        <div className="space-y-6">
            {/* Date Range Picker and Download Button */}
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <DateRangePicker date={date} setDate={setDate} className="w-20 md:w-auto" />
                <Button variant="outline" className="w-full md:w-auto" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
            </div>
            {/* Cards Grid - match seller dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {DASHBOARD_CARDS.map((card) => (
                    <Card
                        key={card.title}
                        className="bg-neutral-200"
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base lg:text-lg font-medium">
                                {card.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl lg:text-3xl font-bold">
                                {card.value}
                            </p>
                            <p className="text-main text-sm mt-1">
                                {card.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Customers */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recent Customers</h2>
                    <Button variant="link" className="text-main">View All</Button>
                </div>
                <CustomersTable data={filteredCustomers} />
            </div>

            {/* Recent Orders and Customer Activity in a grid like seller dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent Orders</h2>
                        <Button variant="link" className="text-main">View All</Button>
                    </div>
                    <OrdersTable data={filteredOrders} />
                </div>
                {/* Customer Activity */}
                <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Customer Activity</h2>
                        <Button variant="link" className="text-main">View All</Button>
                    </div>
                    <ActivityTable data={filteredActivities} />
                </div>
            </div>
        </div>
    );
};

export default AdminCustomerDashboardPage; 