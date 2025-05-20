import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Search, MoreHorizontal, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ServiceFactory } from "@/services/service-factory";

interface Ticket {
    id: string;
    email: string;
    message: string;
    status: "New" | "In Progress" | "Resolved";
    createdAt: string;
}

type SortConfig = {
    key: keyof Ticket | null;
    direction: "asc" | "desc" | null;
};

const getStatusStyle = (status: Ticket["status"]) => {
    return {
        "New": "bg-blue-50 text-blue-700",
        "In Progress": "bg-yellow-50 text-yellow-700",
        "Resolved": "bg-green-50 text-green-700",
    }[status];
};

const TicketsTable = ({ searchQuery }: { searchQuery: string }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "createdAt",
        direction: "desc"
    });

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Fetch data
    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                const response = await ServiceFactory.tickets.getTickets(page, pageSize);
                setTickets(response.data.tickets);
                setTotalItems(response.data.totalCount);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                toast.error("Failed to load ticket data");
            } finally {
                setLoading(false);
            }
        };
        
        fetchTickets();
    }, [page, pageSize]);

    // Filter and sort tickets
    useEffect(() => {
        let result = tickets;
        
        // Apply search filter
        if (searchQuery) {
            result = result.filter(ticket => 
                ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.message.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply sorting
        if (sortConfig.key && sortConfig.direction) {
            result = [...result].sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];
                
                if (sortConfig.direction === "asc") {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });
        }
        
        setFilteredTickets(result);
    }, [tickets, searchQuery, sortConfig]);

    const handleSort = (key: keyof Ticket) => {
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

    const getSortIcon = (key: keyof Ticket) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="size-3" />;
        }
        return sortConfig.direction === "asc" 
            ? <ArrowUpDown className="size-3 text-blue-600" /> 
            : <ArrowUpDown className="size-3 text-blue-600 transform rotate-180" />;
    };

    const handleStatusUpdate = async (ticketId: string, newStatus: Ticket["status"]) => {
        try {
            // Optimistic UI update
            setTickets(prevTickets =>
                prevTickets.map(ticket =>
                    ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
                )
            );
            
            await ServiceFactory.tickets.updateTicketStatus(ticketId, newStatus);
            toast.success(`Ticket status updated to ${newStatus}`);
        } catch (err) {
            // Revert on error
            setTickets(prevTickets => [...prevTickets]);
            toast.error("Failed to update ticket status");
            console.error(err);
        }
    };

    // Calculate pagination values
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = Math.min((page - 1) * pageSize + 1, totalItems);
    const endItem = Math.min(page * pageSize, totalItems);

    // Get displayed tickets based on pagination
    const displayedTickets = filteredTickets.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-red-500 p-4 text-center border rounded-lg shadow-sm">
                <p>Error loading tickets: {error}</p>
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
                                    Ticket ID
                                    {getSortIcon("id")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[200px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("email")}
                                >
                                    Email
                                    {getSortIcon("email")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[300px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("message")}
                                >
                                    Message
                                    {getSortIcon("message")}
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
                            <TableHead className="min-w-[120px] whitespace-nowrap text-black">
                                <div
                                    className="flex items-center gap-1 cursor-pointer"
                                    onClick={() => handleSort("createdAt")}
                                >
                                    Created At
                                    {getSortIcon("createdAt")}
                                </div>
                            </TableHead>
                            <TableHead className="min-w-[100px] whitespace-nowrap text-black">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedTickets.length > 0 ? (
                            displayedTickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium">
                                        {ticket.id}
                                    </TableCell>
                                    <TableCell>
                                        {ticket.email}
                                    </TableCell>
                                    <TableCell>
                                        {ticket.message}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{ticket.createdAt}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="size-8 p-0">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusUpdate(ticket.id, "New")}
                                                    className="text-blue-600"
                                                >
                                                    Mark as New
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusUpdate(ticket.id, "In Progress")}
                                                    className="text-yellow-600"
                                                >
                                                    Mark as In Progress
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleStatusUpdate(ticket.id, "Resolved")}
                                                    className="text-green-600"
                                                >
                                                    Mark as Resolved
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No tickets found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* Pagination */}
            {totalItems > 0 && (
                <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Showing {startItem} to {endItem} of {totalItems} tickets
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum = i + 1;
                                
                                // If we have more than 5 pages and we're not at the start
                                if (totalPages > 5 && page > 3) {
                                    pageNum = page - 3 + i;
                                }
                                
                                // Make sure we don't exceed totalPages
                                if (pageNum <= totalPages) {
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? "default" : "outline"}
                                            size="sm"
                                            className="w-8 h-8"
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
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={page >= totalPages}
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminTicketsPage = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");

    return (
        <div className="space-y-8 max-w-full">
            <h1 className="text-xl lg:text-2xl font-semibold">
                Support Tickets
            </h1>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-2 w-full">
                    <div className="relative flex-1 px-px">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by Ticket ID, Email..."
                            className="pl-9 w-full bg-[#F8F7FF]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <TicketsTable searchQuery={searchQuery} />
        </div>
    );
};

export default AdminTicketsPage; 