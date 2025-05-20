import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ArrowUpDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

// Empty data array
const shipmentData: Shipment[] = [];

const getStatusStyle = (status: string) => {
    switch (status) {
        case "Booked":
            return "bg-blue-100 text-blue-800";
        case "Pending":
            return "bg-yellow-100 text-yellow-800";
        case "In-transit":
            return "bg-purple-100 text-purple-800";
        case "Delivered":
            return "bg-green-100 text-green-800";
        case "Cancelled":
            return "bg-red-100 text-red-800";
        case "Exception":
            return "bg-orange-100 text-orange-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const getPaymentStyle = (payment: string) => {
    return payment === "COD" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
};

type SortConfig = {
    key: keyof Shipment | null;
    direction: 'asc' | 'desc' | null;
};

const ShipmentsTable = ({ data }: { data: Shipment[] }) => {

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: null,
        direction: null
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

    const getSortedData = () => {
        if (!sortConfig.key || !sortConfig.direction) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key!] || '';
            const bValue = b[sortConfig.key!] || '';

            if (sortConfig.direction === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    };

    const getSortIcon = (key: keyof Shipment) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="size-3" />;
        }
        return <ArrowUpDown className="size-3" />;
    };

    const sortedData = getSortedData();

    return (
        <div className="rounded-md border w-full overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F4F2FF] hover:bg-[#F4F2FF]">
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('orderId')}
                                >
                                    Order ID
                                    {getSortIcon('orderId')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('orderDate')}
                                >
                                    Order Date
                                    {getSortIcon('orderDate')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('booked')}
                                >
                                    Booked
                                    {getSortIcon('booked')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('pickupId')}
                                >
                                    Pickup-ID
                                    {getSortIcon('pickupId')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('customer')}
                                >
                                    Customer
                                    {getSortIcon('customer')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('product')}
                                >
                                    Product
                                    {getSortIcon('product')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('amount')}
                                >
                                    Amount
                                    {getSortIcon('amount')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('payment')}
                                >
                                    Payment
                                    {getSortIcon('payment')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('weight')}
                                >
                                    Wt.(Kg)
                                    {getSortIcon('weight')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('channel')}
                                >
                                    Channel
                                    {getSortIcon('channel')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('awb')}
                                >
                                    AWB
                                    {getSortIcon('awb')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('courier')}
                                >
                                    Courier
                                    {getSortIcon('courier')}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                Tracking
                            </TableHead>
                            <TableHead className="min-w-[90px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort('status')}
                                >
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((shipment) => (
                            <TableRow key={shipment.orderId}>
                                <TableCell className="font-medium">
                                    <Link
                                        to={`/admin/dashboard/shipments/${shipment.orderId}`}
                                        className="text-purple-600 hover:underline font-medium"
                                    >
                                        {shipment.orderId}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {shipment.orderDate}
                                </TableCell>
                                <TableCell>
                                    {shipment.booked}
                                </TableCell>
                                <TableCell>
                                    {shipment.pickupId}
                                </TableCell>
                                <TableCell>
                                    {shipment.customer}
                                </TableCell>
                                <TableCell>
                                    {shipment.product}
                                </TableCell>
                                <TableCell>
                                    {shipment.amount}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStyle(shipment.payment)}`}>
                                        {shipment.payment}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {shipment.weight}
                                </TableCell>
                                <TableCell>
                                    {shipment.channel}
                                </TableCell>
                                <TableCell>
                                    {shipment.awb}
                                </TableCell>
                                <TableCell>
                                    {shipment.courier}
                                </TableCell>
                                <TableCell>
                                    <Button variant="link" className="p-0 h-auto text-violet-600">
                                        {shipment.tracking}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(shipment.status)}`}>
                                        {shipment.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

const AdminShipmentsPage = () => {

    const [searchQuery, setSearchQuery] = useState<string>("");

    const [searchParams, setSearchParams] = useSearchParams();

    const currentTab = searchParams.get("tab") || "all";

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    useEffect(() => {
        if (searchParams.get("tab")) {
            handleTabChange(searchParams.get("tab")!);
        }
    }, []);

    return (
        <div className="space-y-8 max-w-full">
            <h1 className="text-xl lg:text-2xl font-semibold">
                Shipments
            </h1>

            <Tabs defaultValue={currentTab} className="w-full" onValueChange={handleTabChange}>
                <div className="w-full">
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
                                Pending
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

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-4 w-full">
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1 px-px">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search by Order ID, AWB, Customer..."
                                className="pl-9 w-full bg-[#F8F7FF]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="whitespace-nowrap">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="w-full">
                    <TabsContent value="all" className="mt-2">
                        <ShipmentsTable data={shipmentData} />
                    </TabsContent>

                    <TabsContent value="booked" className="mt-2">
                        <ShipmentsTable data={shipmentData.filter(s => s.status === "Booked")} />
                    </TabsContent>

                    <TabsContent value="pending-pickup" className="mt-2">
                        <ShipmentsTable data={shipmentData.filter(s => s.status === "Pending")} />
                    </TabsContent>

                    <TabsContent value="in-transit" className="mt-2">
                        <ShipmentsTable data={shipmentData.filter(s => s.status === "In-transit")} />
                    </TabsContent>

                    <TabsContent value="delivered" className="mt-2">
                        <ShipmentsTable data={shipmentData.filter(s => s.status === "Delivered")} />
                    </TabsContent>

                    <TabsContent value="cancelled" className="mt-2">
                        <ShipmentsTable data={shipmentData.filter(s => s.status === "Cancelled")} />
                    </TabsContent>

                    <TabsContent value="exception" className="mt-2">
                        <ShipmentsTable data={shipmentData.filter(s => s.status === "Exception")} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default AdminShipmentsPage; 