import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, Package, Boxes, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface WarehouseItem {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    location: string;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    lastUpdated: string;
}

const mockWarehouseItems: WarehouseItem[] = [
    {
        id: "1",
        name: "Premium Laptop",
        sku: "LAP001",
        quantity: 50,
        location: "A-123",
        status: "In Stock",
        lastUpdated: "2024-03-25"
    },
    {
        id: "2",
        name: "Wireless Mouse",
        sku: "MOU001",
        quantity: 5,
        location: "B-456",
        status: "Low Stock",
        lastUpdated: "2024-03-25"
    },
    {
        id: "3",
        name: "Mechanical Keyboard",
        sku: "KEY001",
        quantity: 0,
        location: "C-789",
        status: "Out of Stock",
        lastUpdated: "2024-03-24"
    },
    {
        id: "4",
        name: "4K Monitor",
        sku: "MON001",
        quantity: 20,
        location: "D-012",
        status: "In Stock",
        lastUpdated: "2024-03-23"
    },
    {
        id: "5",
        name: "USB-C Hub",
        sku: "HUB001",
        quantity: 75,
        location: "E-345",
        status: "In Stock",
        lastUpdated: "2024-03-22"
    }
];

const SellerWarehousePage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{
        key: keyof WarehouseItem;
        direction: "asc" | "desc";
    } | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSort = (key: keyof WarehouseItem) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleAddStock = (itemId: string) => {
        console.log("Add stock for item:", itemId);
        toast.info("Add stock functionality coming soon!");
    };

    const handleTransfer = (itemId: string) => {
        console.log("Transfer item:", itemId);
        toast.info("Transfer functionality coming soon!");
    };

    const filteredItems = mockWarehouseItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const getStatusColor = (status: WarehouseItem["status"]) => {
        switch (status) {
            case "In Stock":
                return "bg-green-100 text-green-800";
            case "Low Stock":
                return "bg-yellow-100 text-yellow-800";
            case "Out of Stock":
                return "bg-red-100 text-red-800";
        }
    };

    const getStatusIcon = (status: WarehouseItem["status"]) => {
        switch (status) {
            case "In Stock":
                return <CheckCircle2 className="size-4" />;
            case "Low Stock":
                return <AlertTriangle className="size-4" />;
            case "Out of Stock":
                return <Boxes className="size-4" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Warehouse
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="size-4" />
                    <span>Manage your inventory</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Items
                        </CardTitle>
                        <Package className="size-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockWarehouseItems.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Low Stock Items
                        </CardTitle>
                        <AlertTriangle className="size-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mockWarehouseItems.filter(item => item.status === "Low Stock").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Out of Stock Items
                        </CardTitle>
                        <Boxes className="size-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mockWarehouseItems.filter(item => item.status === "Out of Stock").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                {/* Search and Actions */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search inventory..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    <Button className="w-full lg:w-auto" asChild>
                        <Link to="/seller/dashboard/new-order">
                        <Plus className="size-4 mr-2" />
                        Add New Item
                        </Link>
                    </Button>
                </div>

                {/* Inventory Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("name")}
                                >
                                    Item Name
                                    {sortConfig?.key === "name" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("sku")}
                                >
                                    SKU
                                    {sortConfig?.key === "sku" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("quantity")}
                                >
                                    Quantity
                                    {sortConfig?.key === "quantity" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("location")}
                                >
                                    Location
                                    {sortConfig?.key === "location" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("status")}
                                >
                                    Status
                                    {sortConfig?.key === "status" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("lastUpdated")}
                                >
                                    Last Updated
                                    {sortConfig?.key === "lastUpdated" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No items found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.sku}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.location}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    item.status
                                                )}`}
                                            >
                                                {getStatusIcon(item.status)}
                                                {item.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{item.lastUpdated}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddStock(item.id)}
                                                >
                                                    Add Stock
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTransfer(item.id)}
                                                >
                                                    Transfer
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default SellerWarehousePage; 