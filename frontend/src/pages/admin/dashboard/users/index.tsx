import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Filter, RefreshCw, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchSellers, updateSellerStatus, SellerUser } from "@/lib/api/admin-seller";
import { ServiceFactory } from "@/services/service-factory";

type UserStatus = "Active" | "Inactive" | "Pending" | "Suspended";
type TabType = "seller" | "customers";
type SortOrder = "asc" | "desc";
type SortField = "userId" | "name" | "email" | "status" | "registrationDate" | "lastActive" | "totalTransactions" | "rechargeType";

interface User {
    id: string;
    userId: string;
    name: string;
    email: string;
    status: UserStatus;
    registrationDate: string;
    lastActive: string;
    rechargeType: "Regular" | "Monthly";
    totalTransactions: number;
}

interface TeamMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    lastActive: string;
    paymentType: string;
    totalTransactions: number;
}

interface TeamMembersResponse {
    success: boolean;
    message?: string;
    data: {
        users: TeamMember[];
        pagination: {
            totalResults: number;
        };
    };
}

const getStatusStyle = (status: UserStatus) => {
    return {
        Active: "bg-green-50 text-green-700",
        Inactive: "bg-neutral-100 text-neutral-700",
        Pending: "bg-yellow-50 text-yellow-700",
        Suspended: "bg-red-50 text-red-700"
    }[status];
};

const AdminUsersPage = () => {
    const [activeTab, setActiveTab] = useState<TabType>("seller");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>("userId");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sellers, setSellers] = useState<SellerUser[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalSellers, setTotalSellers] = useState(0);
    const [totalCustomers, setTotalCustomers] = useState(0);

    // Fetch users data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (activeTab === "seller") {
                    // Fetch sellers using the new API
                    const data = await fetchSellers(
                        currentPage,
                        pageSize,
                        searchQuery,
                        undefined, // status filter - not applied
                        sortField,
                        sortOrder
                    );
                    
                    setSellers(data.sellers);
                    setTotalSellers(data.totalCount);
                } else {
                    // Fetch customers using the real API
                    const response = await ServiceFactory.admin.getTeamMembers({
                        page: currentPage,
                        limit: pageSize,
                        search: searchQuery,
                        sortField,
                        sortOrder,
                        type: 'customer'
                    }) as TeamMembersResponse;
                    
                    if (response.success) {
                        setCustomers(response.data.users.map((user: TeamMember) => ({
                            id: user.id,
                            userId: user.userId,
                            name: user.name,
                            email: user.email,
                            status: user.status as UserStatus,
                            registrationDate: user.createdAt,
                            lastActive: user.lastActive,
                            rechargeType: user.paymentType === 'monthly' ? 'Monthly' : 'Regular',
                            totalTransactions: user.totalTransactions || 0
                        })));
                        setTotalCustomers(response.data.pagination.totalResults);
                    } else {
                        throw new Error(response.message || 'Failed to fetch customers');
                    }
                }
            } catch (err) {
                setError("Failed to load users. Please try again.");
                console.error("Error loading users:", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [activeTab, searchQuery, sortField, sortOrder, currentPage, pageSize]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset to first page when changing tabs
    };
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when searching
    };
    
    const handleUpdateUserStatus = async (userId: string, newStatus: UserStatus) => {
        try {
            setLoading(true);
            
            if (activeTab === "seller") {
                // Use the new API function
                await updateSellerStatus(userId, newStatus);
                
                // Refresh the data after update
                const data = await fetchSellers(
                    currentPage,
                    pageSize,
                    searchQuery,
                    undefined,
                    sortField,
                    sortOrder
                );
                
                setSellers(data.sellers);
                setTotalSellers(data.totalCount);
            } else {
                // Update customer status using the real API
                const response = await ServiceFactory.admin.updateTeamMember(userId, { status: newStatus });
                
                if (response.success) {
                    // Refresh the customer list
                    const refreshResponse = await ServiceFactory.admin.getTeamMembers() as TeamMembersResponse;
                    
                    if (refreshResponse.success) {
                        setCustomers(refreshResponse.data.users.map((user: TeamMember) => ({
                            id: user.id,
                            userId: user.userId,
                            name: user.name,
                            email: user.email,
                            status: user.status as UserStatus,
                            registrationDate: user.createdAt,
                            lastActive: user.lastActive,
                            rechargeType: user.paymentType === 'monthly' ? 'Monthly' : 'Regular',
                            totalTransactions: user.totalTransactions || 0
                        })));
                        setTotalCustomers(refreshResponse.data.pagination.totalResults);
                    }
                }
                
                toast.success(`User status updated to ${newStatus}`);
            }
        } catch (err) {
            toast.error("Failed to update user status. Please try again.");
            console.error("Error updating user status:", err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate pagination values
    const totalUsers = activeTab === "seller" ? totalSellers : totalCustomers;
    const totalPages = Math.ceil(totalUsers / pageSize);
    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalUsers);
    const endItem = Math.min(currentPage * pageSize, totalUsers);

    // Get current display data
    const displayData = activeTab === "seller" ? sellers : customers;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold">
                        User Management
                    </h1>
                    <p className="text-base lg:text-lg text-muted-foreground mt-1">
                        Manage user accounts and permissions
                    </p>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="flex gap-4">
                <button
                    onClick={() => handleTabChange("seller")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === "seller"
                            ? "bg-neutral-200"
                            : "hover:bg-neutral-100"
                    )}
                >
                    Sellers
                </button>
                <button
                    onClick={() => handleTabChange("customers")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === "customers"
                            ? "bg-neutral-200"
                            : "hover:bg-neutral-100"
                    )}
                >
                    Customers
                </button>
            </div>

            {/* Search Section */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <form onSubmit={handleSearch} className="relative w-full md:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-1" />
                        Filters
                    </Button>
                    {error && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Error display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <X className="h-5 w-5" />
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

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                        <p className="text-sm text-gray-500">Loading users...</p>
                    </div>
                </div>
            )}

            {/* Users Table */}
            {!loading && (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => handleSort("userId")} className="cursor-pointer w-[180px]">
                                    User ID
                                    {sortField === "userId" && (
                                        <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                    )}
                                </TableHead>
                                <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                                    Name
                                    {sortField === "name" && (
                                        <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                    )}
                                </TableHead>
                                <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                                    Email
                                    {sortField === "email" && (
                                        <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                    )}
                                </TableHead>
                                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                                    Status
                                    {sortField === "status" && (
                                        <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                    )}
                                </TableHead>
                                <TableHead onClick={() => handleSort("registrationDate")} className="cursor-pointer">
                                    Registration Date
                                    {sortField === "registrationDate" && (
                                        <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                    )}
                                </TableHead>
                                <TableHead onClick={() => handleSort("lastActive")} className="cursor-pointer">
                                    Last Active
                                    {sortField === "lastActive" && (
                                        <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                    )}
                                </TableHead>
                                {activeTab === "seller" && (
                                    <>
                                        <TableHead className="cursor-pointer">
                                            Company
                                        </TableHead>
                                        <TableHead className="cursor-pointer">
                                            KYC Status
                                        </TableHead>
                                    </>
                                )}
                                {activeTab === "customers" && (
                                    <>
                                        <TableHead onClick={() => handleSort("rechargeType")} className="cursor-pointer">
                                            Recharge Type
                                            {sortField === "rechargeType" && (
                                                <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                            )}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort("totalTransactions")} className="cursor-pointer">
                                            Total Transactions
                                            {sortField === "totalTransactions" && (
                                                <ArrowUpDown className={cn("ml-1 inline h-4 w-4", sortOrder === "desc" && "rotate-180")} />
                                            )}
                                        </TableHead>
                                    </>
                                )}
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayData.length === 0 ? (
                                <TableRow>
                                    <TableCell 
                                        colSpan={activeTab === "seller" ? 9 : 9} 
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No users found. Try adjusting your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayData.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.userId && user.userId !== 'undefined' && user.userId !== 'null' ? (
                                                <Link 
                                                    to={`/admin/dashboard/users/${user.userId}`} 
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {user.userId}
                                                </Link>
                                            ) : (
                                                <span className="text-gray-500">{user.userId || 'No ID'}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.name}
                                        </TableCell>
                                        <TableCell>
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {user.registrationDate}
                                        </TableCell>
                                        <TableCell>
                                            {user.lastActive}
                                        </TableCell>
                                        {activeTab === "seller" && (
                                            <>
                                                <TableCell>
                                                    {(user as SellerUser).companyName}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        (user as SellerUser).kycStatus === "Verified" 
                                                            ? "bg-green-50 text-green-700" 
                                                            : (user as SellerUser).kycStatus === "Rejected"
                                                                ? "bg-red-50 text-red-700"
                                                                : "bg-yellow-50 text-yellow-700"
                                                    }`}>
                                                        {(user as SellerUser).kycStatus}
                                                    </span>
                                                </TableCell>
                                            </>
                                        )}
                                        {activeTab === "customers" && (
                                            <>
                                                <TableCell>
                                                    {(user as User).rechargeType}
                                                </TableCell>
                                                <TableCell>
                                                    {(user as User).totalTransactions}
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {user.userId && user.userId !== 'undefined' && user.userId !== 'null' ? (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link to={`/admin/dashboard/users/${user.userId}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        disabled
                                                    >
                                                        View
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleUpdateUserStatus(
                                                        user.userId, 
                                                        user.status === "Active" ? "Inactive" : "Active"
                                                    )}
                                                    className={user.status === "Active" ? "border-red-300 text-red-600 hover:bg-red-50" : "border-green-300 text-green-600 hover:bg-green-50"}
                                                    disabled={!user.userId || user.userId === 'undefined' || user.userId === 'null'}
                                                >
                                                    {user.status === "Active" ? "Deactivate" : "Activate"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {!loading && displayData.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{startItem}</span> to{" "}
                        <span className="font-medium">{endItem}</span> of{" "}
                        <span className="font-medium">{totalUsers}</span> results
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;