import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface NDR {
    id: string;
    orderId: string;
    awb: string;
    customer: string;
    seller: string;
    courier: string;
    attempts: number;
    lastAttempt: string;
    status: "Pending" | "In Progress" | "Resolved" | "RTO Initiated";
    reason: string;
}

type SortConfig = {
    key: keyof NDR | null;
    direction: "asc" | "desc" | null;
};

const NDR_DATA: NDR[] = [];

const getStatusStyle = (status: NDR["status"]) => {
    return {
        "Pending": "bg-yellow-50 text-yellow-700",
        "In Progress": "bg-blue-50 text-blue-700",
        "Resolved": "bg-green-50 text-green-700",
        "RTO Initiated": "bg-red-50 text-red-700"
    }[status];
};

const NDRTable = ({ data }: { data: NDR[] }) => {

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: null,
        direction: null
    });

    const handleSort = (key: keyof NDR) => {
        let direction: "asc" | "desc" | null = "asc";

        if (sortConfig.key === key) {
            if (sortConfig.direction === "asc") {
                direction = "desc";
            } else if (sortConfig.direction === "desc") {
                direction = null;
            }
        }

        setSortConfig({ key, direction });
    };

    const getSortedData = () => {
        if (!sortConfig.key || !sortConfig.direction) return data;

        return [...data].sort((a, b) => {
            const aValue = String(a[sortConfig.key!] || "");
            const bValue = String(b[sortConfig.key!] || "");

            if (sortConfig.direction === "asc") {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    };

    const getSortIcon = (key: keyof NDR) => {
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
                            <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("id")}
                                >
                                    NDR ID
                                    {getSortIcon("id")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("orderId")}
                                >
                                    Order ID
                                    {getSortIcon("orderId")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("awb")}
                                >
                                    AWB
                                    {getSortIcon("awb")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("customer")}
                                >
                                    Customer
                                    {getSortIcon("customer")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[150px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("seller")}
                                >
                                    Seller
                                    {getSortIcon("seller")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("courier")}
                                >
                                    Courier
                                    {getSortIcon("courier")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("attempts")}
                                >
                                    Attempts
                                    {getSortIcon("attempts")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("lastAttempt")}
                                >
                                    Last Attempt
                                    {getSortIcon("lastAttempt")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("status")}
                                >
                                    Status
                                    {getSortIcon("status")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[200px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("reason")}
                                >
                                    Reason
                                    {getSortIcon("reason")}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((ndr) => (
                            <TableRow key={ndr.id}>
                                <TableCell className="font-medium">
                                    {ndr.id}
                                </TableCell>
                                <TableCell>
                                    <Link
                                        to={`/admin/dashboard/ndr/${ndr.orderId}`}
                                        className="text-purple-600 hover:underline font-medium"
                                    >
                                        {ndr.orderId}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {ndr.awb}
                                </TableCell>
                                <TableCell>
                                    {ndr.customer}
                                </TableCell>
                                <TableCell>
                                    {ndr.seller}
                                </TableCell>
                                <TableCell>
                                    {ndr.courier}
                                </TableCell>
                                <TableCell>
                                    {ndr.attempts}
                                </TableCell>
                                <TableCell>
                                    {ndr.lastAttempt}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(ndr.status)}`}>
                                        {ndr.status}
                                    </span>
                                </TableCell>
                                <TableCell>{ndr.reason}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

const AdminNDRPage = () => {

    const [searchQuery, setSearchQuery] = useState<string>("");

    return (
        <div className="space-y-8 max-w-full">
            <h1 className="text-xl lg:text-2xl font-semibold">
                NDR Management
            </h1>

            <Tabs defaultValue="all" className="w-full">
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
                                value="pending"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                Pending
                            </TabsTrigger>
                            <TabsTrigger
                                value="in-progress"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                In Progress
                            </TabsTrigger>
                            <TabsTrigger
                                value="resolved"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                Resolved
                            </TabsTrigger>
                            <TabsTrigger
                                value="rto"
                                className="flex-1 items-center gap-2 h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black whitespace-nowrap px-4"
                            >
                                RTO Initiated
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-4 w-full">
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1 px-px">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search by NDR ID, Order ID, AWB..."
                                className="pl-9 w-full bg-[#F8F7FF]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <TabsContent value="all" className="mt-2">
                        <NDRTable data={NDR_DATA} />
                    </TabsContent>

                    <TabsContent value="pending" className="mt-2">
                        <NDRTable data={NDR_DATA.filter(n => n.status === "Pending")} />
                    </TabsContent>

                    <TabsContent value="in-progress" className="mt-2">
                        <NDRTable data={NDR_DATA.filter(n => n.status === "In Progress")} />
                    </TabsContent>

                    <TabsContent value="resolved" className="mt-2">
                        <NDRTable data={NDR_DATA.filter(n => n.status === "Resolved")} />
                    </TabsContent>

                    <TabsContent value="rto" className="mt-2">
                        <NDRTable data={NDR_DATA.filter(n => n.status === "RTO Initiated")} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default AdminNDRPage; 