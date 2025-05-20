import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TableData {
    date: string;
    amount: number;
    status: "active" | "inactive";
    partner: string;
}

const TABLE_DATA: TableData[] = [];

const getStatusStyle = (status: TableData["status"]) => {
    return {
        active: "bg-green-50 text-green-700",
        inactive: "bg-neutral-100 text-neutral-700",
    }[status];
};

const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MM/dd/yy");
};

type SortField = "date" | "amount" | "status" | "partner";
type SortOrder = "asc" | "desc";

const ReportsTable = () => {
    const [sortField, setSortField] = useState<SortField>("date");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [data, setData] = useState<TableData[]>(TABLE_DATA);
    const [filteredData, setFilteredData] = useState<TableData[]>(TABLE_DATA);
    const [searchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Fetch data
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                // Replace with actual API endpoint
                // const response = await fetch(`/api/reports?page=${page}&pageSize=${pageSize}`);
                // if (!response.ok) throw new Error('Failed to fetch reports');
                // const data = await response.json();
                // setData(data.reports);
                // setTotalItems(data.totalCount);
                
                // Simulating API response while backend is not ready
                setTimeout(() => {
                    setData(TABLE_DATA);
                    setTotalItems(TABLE_DATA.length);
                    setLoading(false);
                }, 800);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                toast.error("Failed to load report data");
                setLoading(false);
            }
        };
        
        fetchReports();
    }, [page, pageSize]);

    // Filter and sort data
    useEffect(() => {
        let result = data;
        
        // Apply search filter
        if (searchQuery) {
            result = result.filter(row => 
                row.partner.toLowerCase().includes(searchQuery.toLowerCase()) || 
                row.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.date.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply sorting
        result = [...result].sort((a, b) => {
            const multiplier = sortOrder === "asc" ? 1 : -1;

            if (sortField === "date") {
                return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
            }
            if (sortField === "amount") {
                return multiplier * (a.amount - b.amount);
            }
            if (sortField === "status") {
                return multiplier * a.status.localeCompare(b.status);
            }
            return multiplier * a.partner.localeCompare(b.partner);
        });
        
        setFilteredData(result);
    }, [data, searchQuery, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowDown className="inline-block h-4 w-4 ml-1 opacity-50" />;
        return sortOrder === "asc"
            ? <ArrowUp className="inline-block h-4 w-4 ml-1" />
            : <ArrowDown className="inline-block h-4 w-4 ml-1" />;
    };
    
    // Calculate pagination values
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = Math.min((page - 1) * pageSize + 1, totalItems);
    const endItem = Math.min(page * pageSize, totalItems);

    // Get displayed data based on pagination
    const displayedData = filteredData.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-red-500 p-4 text-center border rounded-lg shadow-sm">
                <p>Error loading reports: {error}</p>
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
        <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-sky-600/20">
                        <TableRow>
                            <TableHead
                                className="font-medium cursor-pointer"
                                onClick={() => handleSort("date")}
                            >
                                Date <SortIcon field="date" />
                            </TableHead>
                            <TableHead
                                className="font-medium cursor-pointer"
                                onClick={() => handleSort("amount")}
                            >
                                Amount <SortIcon field="amount" />
                            </TableHead>
                            <TableHead
                                className="font-medium cursor-pointer"
                                onClick={() => handleSort("status")}
                            >
                                Status <SortIcon field="status" />
                            </TableHead>
                            <TableHead
                                className="font-medium cursor-pointer"
                                onClick={() => handleSort("partner")}
                            >
                                Partner <SortIcon field="partner" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedData.length > 0 ? (
                            displayedData.map((row, index) => (
                                <TableRow key={index} className="hover:bg-neutral-50">
                                    <TableCell>
                                        {formatDate(row.date)}
                                    </TableCell>
                                    <TableCell>
                                        {row.amount}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                row.status === "active" ? "bg-green-500" : "bg-neutral-400"
                                            )} />
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-sm",
                                                getStatusStyle(row.status)
                                            )}>
                                                {row.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-neutral-500">
                                        {row.partner}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No reports found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* Pagination */}
            {totalItems > 0 && (
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {startItem} to {endItem} of {totalItems} reports
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
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
                            className="flex items-center gap-1"
                        >
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsTable; 