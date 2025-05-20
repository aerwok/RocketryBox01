import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, FileText, Download, Info, Filter, X, Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import * as XLSX from 'xlsx';

interface LedgerTransaction {
    id: string;
    date: string;
    type: string;
    transactionBy: string;
    credit: string | null;
    debit: string | null;
    taxableAmount: string | null;
    igst: string | null;
    cgst: string | null;
    sgst: string | null;
    totalAmount: string;
    closingBalance: string;
    transactionNumber: string;
    transactionAgainst: string;
    remark: string | null;
}

interface LedgerSummary {
    totalRecharge: string;
    totalDebit: string;
    totalCredit: string;
    closingBalance: string;
}

// Empty data to use as default
const emptyTransactionData: LedgerTransaction[] = [];

const emptySummary: LedgerSummary = {
    totalRecharge: "₹0",
    totalDebit: "₹0",
    totalCredit: "₹0",
    closingBalance: "₹0"
};

const LedgerHistory = () => {
    const [transactions, setTransactions] = useState<LedgerTransaction[]>(emptyTransactionData);
    const [summary, setSummary] = useState<LedgerSummary>(emptySummary);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const [sortConfig, setSortConfig] = useState<{
        key: keyof LedgerTransaction;
        direction: 'asc' | 'desc';
    } | null>(null);

    const date: DateRange = {
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date(),
    };

    const visibleColumns: Record<string, boolean> = {
        date: true,
        type: true,
        transactionBy: true,
        credit: true,
        debit: true,
        taxableAmount: true,
        igst: true,
        cgst: true,
        sgst: true,
        totalAmount: true,
        closingBalance: true,
        transactionNumber: true,
        transactionAgainst: true,
        remark: true
    };

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        date: "",
        transactionNumber: "",
        transactionBy: "",
        transactionType: "",
        transactionAgainst: "",
        creditDebit: "",
        amount: "",
        remark: ""
    });
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({
        start: null,
        end: null
    });
    const dateDropdownRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
                setShowDateDropdown(false);
            }
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Move the fetchLedgerData function declaration before the useEffect that uses it
    const fetchLedgerData = useCallback(async () => {
        // Only attempt to fetch real data in production
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log('Development mode detected, using empty data');
            setTransactions(emptyTransactionData);
            setSummary(emptySummary);
            return;
        }

        // Don't fetch if user is offline
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setError('You are currently offline. Using cached data.');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Format dates for API query
            const fromDate = date?.from ? date.from.toISOString().split('T')[0] : '';
            const toDate = date?.to ? date.to.toISOString().split('T')[0] : '';
            
            // Create separate controllers for each request
            const ledgerController = new AbortController();
            const summaryController = new AbortController();
            const timeoutId = setTimeout(() => {
                ledgerController.abort();
                summaryController.abort();
            }, 20000); // Increase timeout to 20 seconds
            
            try {
                // Use Promise.all instead of sequential requests
                const [ledgerResponse, summaryResponse] = await Promise.all([
                    // Direct call to avoid interception
                    fetch(`/api/seller/billing/ledger?from=${fromDate}&to=${toDate}&page=${currentPage}&limit=${rowsPerPage}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                        },
                        signal: ledgerController.signal
                    }).then(res => {
                        if (!res.ok) throw new Error(`API error: ${res.status}`);
                        return res.json();
                    }),
                    
                    // Direct call to avoid interception
                    fetch(`/api/seller/billing/ledger/summary`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                        },
                        signal: summaryController.signal
                    }).then(res => {
                        if (!res.ok) throw new Error(`API error: ${res.status}`);
                        return res.json();
                    })
                ]);
                
                clearTimeout(timeoutId);
                
                if (ledgerResponse.success && summaryResponse.success) {
                    setTransactions(ledgerResponse.transactions || []);
                    setSummary(summaryResponse.summary || emptySummary);
                    return;
                } else {
                    throw new Error(ledgerResponse.message || summaryResponse.message || 'Failed to fetch ledger data');
                }
            } catch (apiError: any) {
                clearTimeout(timeoutId);
                console.error('API Error:', apiError);
                throw apiError;
            }
        } catch (err: any) {
            console.error('Error fetching ledger data:', err);
            
            // More detailed error message based on the specific error
            let errorMessage = 'Failed to load ledger data.';
            if (err.name === 'AbortError') {
                errorMessage = 'API request timed out.';
            } else if (err.message?.includes('Network Error')) {
                errorMessage = 'Network error occurred.';
            } else {
                errorMessage = `Error: ${err.message || 'Unknown error'}`;
            }
            
            setError(errorMessage);
            
            // Use empty data on failure
            setTransactions(emptyTransactionData);
            setSummary(emptySummary);
        } finally {
            setLoading(false);
        }
    }, [currentPage, date, rowsPerPage]);

    // Add enhanced error handling for API
    useEffect(() => {
        // Add event listener for offline/online status changes
        const handleOnline = () => {
            if (!loading) {
                fetchLedgerData();
            }
        };

        window.addEventListener('online', handleOnline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [fetchLedgerData, loading]);

    useEffect(() => {
        fetchLedgerData();
    }, [fetchLedgerData]);

    // Memoize expensive computations
    const sortedData = useMemo(() => {
        if (!sortConfig) return transactions;
        
        return [...transactions].sort((a, b) => {
        const { key, direction } = sortConfig;
            const aValue = a[key] ?? '';
            const bValue = b[key] ?? '';
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    }, [transactions, sortConfig]);

    const handleSort = useCallback((key: keyof LedgerTransaction) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    const handleRefresh = useCallback(() => {
        fetchLedgerData();
    }, [fetchLedgerData]);

    const handlePageChange = useCallback((pageNumber: number) => {
        setCurrentPage(pageNumber);
    }, []);

    // Calculate total pages
    const totalPages = 4; // This would normally come from API

    const exportToExcel = () => {
        // Create a worksheet with filtered data
        const worksheet = XLSX.utils.json_to_sheet(
            sortedData.map(t => ({
                ID: t.id,
                Date: t.date,
                "Transaction Type": t.type,
                "Transaction By": t.transactionBy,
                Credit: t.credit || "",
                Debit: t.debit || "",
                "Taxable Amount": t.taxableAmount || "",
                IGST: t.igst || "",
                CGST: t.cgst || "",
                SGST: t.sgst || "",
                "Total Amount": t.totalAmount,
                "Closing Balance": t.closingBalance,
                "Transaction Number": t.transactionNumber,
                "Transaction Against": t.transactionAgainst,
                Remark: t.remark || ""
            }))
        );

        // Set column widths
        const columnWidths = [
            { wch: 5 },   // ID
            { wch: 12 },  // Date
            { wch: 20 },  // Transaction Type
            { wch: 20 },  // Transaction By
            { wch: 12 },  // Credit
            { wch: 12 },  // Debit
            { wch: 15 },  // Taxable Amount
            { wch: 10 },  // IGST
            { wch: 10 },  // CGST
            { wch: 10 },  // SGST
            { wch: 15 },  // Total Amount
            { wch: 15 },  // Closing Balance
            { wch: 20 },  // Transaction Number
            { wch: 20 },  // Transaction Against
            { wch: 30 }   // Remark
        ];

        worksheet['!cols'] = columnWidths;

        // Create a workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Transactions");

        // Generate and download the Excel file
        XLSX.writeFile(workbook, "ledger-transactions.xlsx");
    };

    const exportSingleTransactionToExcel = (transaction: LedgerTransaction) => {
        // Create a worksheet with just this transaction
        const worksheet = XLSX.utils.json_to_sheet([{
            ID: transaction.id,
            Date: transaction.date,
            "Transaction Type": transaction.type,
            "Transaction By": transaction.transactionBy,
            Credit: transaction.credit || "",
            Debit: transaction.debit || "",
            "Taxable Amount": transaction.taxableAmount || "",
            IGST: transaction.igst || "",
            CGST: transaction.cgst || "",
            SGST: transaction.sgst || "",
            "Total Amount": transaction.totalAmount,
            "Closing Balance": transaction.closingBalance,
            "Transaction Number": transaction.transactionNumber,
            "Transaction Against": transaction.transactionAgainst,
            Remark: transaction.remark || ""
        }]);

        // Set column widths
        const columnWidths = [
            { wch: 5 },   // ID
            { wch: 12 },  // Date
            { wch: 20 },  // Transaction Type
            { wch: 20 },  // Transaction By
            { wch: 12 },  // Credit
            { wch: 12 },  // Debit
            { wch: 15 },  // Taxable Amount
            { wch: 10 },  // IGST
            { wch: 10 },  // CGST
            { wch: 10 },  // SGST
            { wch: 15 },  // Total Amount
            { wch: 15 },  // Closing Balance
            { wch: 20 },  // Transaction Number
            { wch: 20 },  // Transaction Against
            { wch: 30 }   // Remark
        ];

        worksheet['!cols'] = columnWidths;

        // Create a workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction Details");

        // Generate and download the Excel file with transaction number as filename
        XLSX.writeFile(workbook, `transaction-${transaction.id}.xlsx`);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement> | string, name?: string) => {
        if (typeof e === 'string' && name) {
            // Handle Select component value changes
            setFilters(prev => {
                const newFilters = {
                    ...prev,
                    [name]: e
                };
                // Apply filters automatically
                applyFiltersWithState(newFilters);
                return newFilters;
            });
        } else if (typeof e !== 'string') {
            // Handle Input component value changes
            const { name, value } = e.target;
            setFilters(prev => {
                const newFilters = {
                    ...prev,
                    [name]: value
                };
                // Apply filters automatically
                applyFiltersWithState(newFilters);
                return newFilters;
            });
        }
    };

    // Updated function that accepts filters state as parameter
    const applyFiltersWithState = (filterState = filters) => {
        // Reset to page 1 when applying filters
        setCurrentPage(1);
        // In a real application, this would call the API with new filters
        // For now, we'll just filter our current transactions
        let filtered = [...transactions];

        // Filter by date
        if (filterState.date) {
            if (filterState.date === "Today") {
                const today = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(item => item.date === today);
            } else if (filterState.date === "Yesterday") {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                filtered = filtered.filter(item => item.date === yesterdayStr);
            } else if (filterState.date === "This Week") {
                const today = new Date();
                const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
                filtered = filtered.filter(item => new Date(item.date) >= firstDay);
            } else if (filterState.date === "This Month") {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                filtered = filtered.filter(item => new Date(item.date) >= firstDay);
            } else if (filterState.date === "Custom" && customDateRange.start && customDateRange.end) {
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.date);
                    return itemDate >= customDateRange.start! && 
                           itemDate <= customDateRange.end!;
                });
            }
        }

        // Filter by transaction number
        if (filterState.transactionNumber) {
            filtered = filtered.filter(item => 
                item.transactionNumber.toLowerCase().includes(filterState.transactionNumber.toLowerCase())
            );
        }

        // Filter by transaction by
        if (filterState.transactionBy) {
            filtered = filtered.filter(item => 
                item.transactionBy.toLowerCase().includes(filterState.transactionBy.toLowerCase())
            );
        }

        // Filter by transaction type
        if (filterState.transactionType && filterState.transactionType !== "All") {
            filtered = filtered.filter(item => item.type === filterState.transactionType);
        }

        // Filter by transaction against
        if (filterState.transactionAgainst) {
            filtered = filtered.filter(item => 
                item.transactionAgainst.toLowerCase().includes(filterState.transactionAgainst.toLowerCase())
            );
        }

        // Filter by credit/debit
        if (filterState.creditDebit && filterState.creditDebit !== "Both") {
            if (filterState.creditDebit === "Credit") {
                filtered = filtered.filter(item => item.credit !== null);
            } else if (filterState.creditDebit === "Debit") {
                filtered = filtered.filter(item => item.debit !== null);
            }
        }

        // Filter by amount
        if (filterState.amount) {
            const amountValue = filterState.amount.replace(/[₹,]/g, "");
            filtered = filtered.filter(item => {
                const itemAmount = (item.credit || item.debit || "").replace(/[₹,]/g, "");
                return itemAmount.includes(amountValue);
            });
        }

        // Filter by remark
        if (filterState.remark) {
            filtered = filtered.filter(item => 
                (item.remark || "").toLowerCase().includes(filterState.remark.toLowerCase())
            );
        }

        setTransactions(filtered);
    };

    // Keep original function for backward compatibility, but use the new implementation
    const applyFilters = () => {
        applyFiltersWithState();
    };

    const clearFilters = () => {
        const emptyFilters = {
            date: "",
            transactionNumber: "",
            transactionBy: "",
            transactionType: "",
            transactionAgainst: "",
            creditDebit: "",
            amount: "",
            remark: ""
        };
        setFilters(emptyFilters);
        setCustomDateRange({ start: null, end: null });
        applyFiltersWithState(emptyFilters);
    };

    const prevMonth = () => {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - 1);
        setCustomDateRange({
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        });
    };

    const nextMonth = () => {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + 1);
        setCustomDateRange({
            start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        });
    };

    const generateCalendarDays = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        // Add empty days for padding at the start
        for (let i = 0; i < firstDay; i++) {
            days.push({ date: new Date(year, month, -firstDay + i + 1), isCurrentMonth: false });
        }

        // Add days for the current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Add padding at the end if needed to complete the grid
        const remainingSpaces = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingSpaces; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split('T')[0];
    };

    const selectDate = (date: Date) => {
        if (!customDateRange.start || (customDateRange.start && customDateRange.end)) {
            // Start a new range
            setCustomDateRange({ start: date, end: null });
        } else {
            // Complete the range
            if (date < customDateRange.start) {
                setCustomDateRange({ start: date, end: customDateRange.start });
            } else {
                setCustomDateRange({ start: customDateRange.start, end: date });
            }
        }
    };

    const applyDateRange = () => {
        if (customDateRange.start && customDateRange.end) {
            // Update filters and automatically apply
            setFilters(prev => {
                const newFilters = {
                    ...prev,
                    date: "Custom"
                };
                applyFiltersWithState(newFilters);
                return newFilters;
            });
            
            setShowCalendar(false);
            setShowDateDropdown(false);
        }
    };

    const discardDateRange = () => {
        setCustomDateRange({ start: null, end: null });
        setShowCalendar(false);
    };

    const handleDateOptionSelect = (option: string) => {
        // Update filters and automatically apply
        setFilters(prev => {
            const newFilters = {
                ...prev,
                date: option
            };
            applyFiltersWithState(newFilters);
            return newFilters;
        });

        if (option === "Custom") {
            setShowCalendar(true);
        } else {
            setShowDateDropdown(false);
        }
    };

    const getDayClass = (day: {date: Date, isCurrentMonth: boolean}) => {
        if (!day.isCurrentMonth) {
            return "text-gray-400 bg-gray-50";
        }

        const isToday = new Date().toDateString() === day.date.toDateString();
        const isSelected = 
            (customDateRange.start && day.date.toDateString() === customDateRange.start.toDateString()) ||
            (customDateRange.end && day.date.toDateString() === customDateRange.end.toDateString());
        const isInRange = 
            customDateRange.start && 
            customDateRange.end && 
            day.date >= customDateRange.start && 
            day.date <= customDateRange.end;

        if (isSelected) {
            return "bg-purple-600 text-white";
        } else if (isInRange) {
            return "bg-purple-100 text-purple-800";
        } else if (isToday) {
            return "bg-blue-100 text-blue-800";
        }

        return "";
    };

    return (
        <div className="space-y-4">
            {/* Stats Cards - Made more compact */}
            <div className="flex justify-between items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-grow">
                    <div className="bg-white p-3 rounded-lg border">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
                                TOTAL RECHARGE
                            </h3>
                            <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="text-base font-semibold">
                                    {summary.totalRecharge}
                                </span>
                                <Info className="h-3 w-3 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
                                TOTAL DEBIT
                            </h3>
                            <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="text-base font-semibold">
                                    {summary.totalDebit}
                                </span>
                                <Info className="h-3 w-3 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
                                TOTAL CREDIT
                            </h3>
                            <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="text-base font-semibold">
                                    {summary.totalCredit}
                                </span>
                                <Info className="h-3 w-3 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">
                                CLOSING BALANCE
                            </h3>
                            <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="text-base font-semibold">
                                    {summary.closingBalance}
                                </span>
                                <Info className="h-3 w-3 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons - Made more compact */}
                <div className="flex gap-2 ml-3">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className={cn(
                            "flex items-center gap-1 h-8 px-3",
                            showFilters ? "bg-purple-600 text-white hover:bg-purple-700 hover:text-white" : ""
                        )}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-3 w-3" />
                        Show
                    </Button>
                </div>
            </div>

            {/* Filter Section - Made more compact */}
            {showFilters && (
                <div className="bg-white rounded-lg border p-3 space-y-3 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative">
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Dates</Label>
                            <div className="relative">
                                <Input
                                    name="date"
                                    placeholder="Transaction Date"
                                    value={filters.date}
                                    onChange={handleFilterChange}
                                    className="w-full pr-10"
                                    onClick={() => setShowDateDropdown(true)}
                                    readOnly
                                />
                                <div 
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                                >
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            
                            {/* Date dropdown */}
                            {showDateDropdown && (
                                <div 
                                    ref={dateDropdownRef}
                                    className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20"
                                >
                                    <div className="py-1">
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            onClick={() => handleDateOptionSelect("Today")}
                                        >
                                            Today
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            onClick={() => handleDateOptionSelect("Yesterday")}
                                        >
                                            Yesterday
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            onClick={() => handleDateOptionSelect("This Week")}
                                        >
                                            This Week
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            onClick={() => handleDateOptionSelect("This Month")}
                                        >
                                            This Month
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            onClick={() => handleDateOptionSelect("Custom")}
                                        >
                                            Custom Range
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Calendar for custom range */}
                            {showCalendar && (
                                <div 
                                    ref={calendarRef}
                                    className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-md shadow-lg z-20"
                                >
                                    <div className="mb-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <button onClick={prevMonth} className="p-1">
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <span className="text-sm font-medium">
                                                {customDateRange.start ? formatDate(customDateRange.start) : "Select Date"}
                        </span>
                                            <button onClick={nextMonth} className="p-1">
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                <div key={day} className="text-xs font-medium text-gray-500 h-6 flex items-center justify-center">
                                                    {day}
                                                </div>
                                            ))}
                                            {generateCalendarDays(
                                                customDateRange.start ? customDateRange.start.getFullYear() : new Date().getFullYear(),
                                                customDateRange.start ? customDateRange.start.getMonth() : new Date().getMonth()
                                            ).map((day, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => selectDate(day.date)}
                                                    className={cn(
                                                        "w-6 h-6 text-xs rounded-full flex items-center justify-center",
                                                        getDayClass(day)
                                                    )}
                                                >
                                                    {day.date.getDate()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex text-xs mb-2">
                                        <div className="flex-1">
                                            <div className="font-medium mb-1">From</div>
                                            <div>{customDateRange.start ? formatDate(customDateRange.start) : ""}</div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium mb-1">To</div>
                                            <div>{customDateRange.end ? formatDate(customDateRange.end) : ""}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            className="text-xs h-7 px-2 py-1"
                                            onClick={applyDateRange}
                                            disabled={!customDateRange.start || !customDateRange.end}
                                        >
                                            Apply
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7 px-2 py-1"
                                            onClick={discardDateRange}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Reference Number</Label>
                            <Input
                                name="transactionNumber"
                                placeholder="Reference Number"
                                value={filters.transactionNumber}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Order Id</Label>
                            <Input
                                name="transactionAgainst"
                                placeholder="Order Id"
                                value={filters.transactionAgainst}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Transactions Type</Label>
                            <Select 
                                onValueChange={(value) => handleFilterChange(value, 'transactionType')}
                                value={filters.transactionType}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Transaction Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Wallet Recharge">Wallet Recharge</SelectItem>
                                    <SelectItem value="Shipping Charge">Shipping Charge</SelectItem>
                                    <SelectItem value="COD Charges">COD Charges</SelectItem>
                                    <SelectItem value="Refund">Refund</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Credit/Debit</Label>
                            <Select 
                                onValueChange={(value) => handleFilterChange(value, 'creditDebit')}
                                value={filters.creditDebit}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Credit/Debit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Both">Both</SelectItem>
                                    <SelectItem value="Credit">Credit</SelectItem>
                                    <SelectItem value="Debit">Debit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Amount</Label>
                            <Input
                                name="amount"
                                placeholder="Amount"
                                value={filters.amount}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Remark</Label>
                            <Input
                                name="remark"
                                placeholder="Remark"
                                value={filters.remark}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button 
                            onClick={applyFilters}
                            size="sm"
                            variant="default"
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 px-3 py-1 h-8 rounded"
                        >
                            <Filter className="h-3 w-3" />
                            Filter
                        </Button>
                        <Button 
                            onClick={clearFilters}
                            size="sm"
                            variant="outline"
                            className="bg-orange-50 hover:bg-orange-100 text-orange-500 border-orange-200 flex items-center gap-1 px-3 py-1 h-8 rounded"
                        >
                            <X className="h-3 w-3" />
                            Clear
                        </Button>
                        <Button 
                            onClick={exportToExcel}
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-500 border-green-200 flex items-center gap-1 px-3 py-1 h-8 rounded"
                        >
                            <Download className="h-3 w-3" />
                            Export
                        </Button>
                    </div>
                </div>
            )}

            {/* Table Controls - Made more compact */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows/Page</span>
                    <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(parseInt(value))}>
                        <SelectTrigger className="w-14 h-7">
                            <SelectValue placeholder="50" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="h-7 px-3"
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
                </Button>
            </div>

            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-2 rounded-md text-xs">
                    {error}
                </div>
            )}

            {/* Table Section - Optimized header and cell sizes */}
            <div className="overflow-x-auto border rounded-md">
                <Table className="border-collapse w-full">
                    <TableHeader>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableHead className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 w-8">
                                #
                                    </TableHead>
                            {visibleColumns.date && (
                                    <TableHead
                                        onClick={() => handleSort('date')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        TRANSACTION DATE
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.type && (
                                <TableHead 
                                    onClick={() => handleSort('type')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        TRANSACTION TYPE
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.transactionBy && (
                                <TableHead 
                                    onClick={() => handleSort('transactionBy')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        TRANSACTION BY
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.credit && (
                                <TableHead 
                                    onClick={() => handleSort('credit')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        CREDIT
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.debit && (
                                <TableHead 
                                    onClick={() => handleSort('debit')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        DEBIT
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.taxableAmount && (
                                <TableHead 
                                    onClick={() => handleSort('taxableAmount')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        TAXABLE AMOUNT
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.igst && (
                                <TableHead 
                                    onClick={() => handleSort('igst')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        IGST
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.cgst && (
                                <TableHead
                                    onClick={() => handleSort('cgst')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        CGST
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.sgst && (
                                <TableHead
                                    onClick={() => handleSort('sgst')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        SGST
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                </TableHead>
                            )}
                            {visibleColumns.totalAmount && (
                                <TableHead
                                    onClick={() => handleSort('totalAmount')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        TOTAL AMOUNT
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                    </TableHead>
                            )}
                            {visibleColumns.closingBalance && (
                                    <TableHead
                                    onClick={() => handleSort('closingBalance')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        CLOSING BALANCE
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                    </TableHead>
                            )}
                            {visibleColumns.transactionNumber && (
                                    <TableHead
                                    onClick={() => handleSort('transactionNumber')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        TRANSACTION NUMBER
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                    </TableHead>
                            )}
                            {visibleColumns.transactionAgainst && (
                                    <TableHead
                                    onClick={() => handleSort('transactionAgainst')}
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2 cursor-pointer"
                                >
                                    <div className="flex items-center justify-center whitespace-nowrap">
                                        TRANSACTION AGAINST
                                        <ArrowUpDown className="ml-1 h-3 w-3" />
                                    </div>
                                    </TableHead>
                            )}
                            {visibleColumns.remark && (
                                    <TableHead
                                    className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] border-r p-2"
                                    >
                                    REMARK
                                    </TableHead>
                            )}
                                    <TableHead
                                className="font-medium text-xs h-8 uppercase text-center bg-[#f8f8fa] p-2"
                                    >
                                ACTION
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="h-20 text-center">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span className="text-sm">Loading transactions...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedData.length > 0 ? (
                            sortedData.map((transaction, index) => (
                                <TableRow key={transaction.id} className="border-b hover:bg-gray-50">
                                    <TableCell className="p-2 text-center border-r text-sm">
                                        {index + 1}
                                        </TableCell>
                                    {visibleColumns.date && (
                                        <TableCell className="p-2 border-r">
                                            {transaction.date}
                                        </TableCell>
                                    )}
                                    {visibleColumns.type && (
                                        <TableCell className="p-2 border-r">
                                            {transaction.type}
                                        </TableCell>
                                    )}
                                    {visibleColumns.transactionBy && (
                                        <TableCell className="p-2 border-r">
                                            {transaction.transactionBy}
                                        </TableCell>
                                    )}
                                    {visibleColumns.credit && (
                                        <TableCell className="p-2 text-right border-r">
                                            {transaction.credit}
                                        </TableCell>
                                    )}
                                    {visibleColumns.debit && (
                                        <TableCell className="p-2 text-right border-r">
                                            {transaction.debit}
                                        </TableCell>
                                    )}
                                    {visibleColumns.taxableAmount && (
                                        <TableCell className="p-2 text-right border-r">
                                            {transaction.taxableAmount}
                                        </TableCell>
                                    )}
                                    {visibleColumns.igst && (
                                        <TableCell className="p-2 text-right border-r">
                                            {transaction.igst}
                                        </TableCell>
                                    )}
                                    {visibleColumns.cgst && (
                                        <TableCell className="p-2 text-right border-r">
                                            {transaction.cgst}
                                        </TableCell>
                                    )}
                                    {visibleColumns.sgst && (
                                        <TableCell className="p-2 text-right border-r">
                                            {transaction.sgst}
                                        </TableCell>
                                    )}
                                    {visibleColumns.totalAmount && (
                                        <TableCell className="p-2 text-right font-medium border-r">
                                            {transaction.totalAmount}
                                        </TableCell>
                                    )}
                                    {visibleColumns.closingBalance && (
                                        <TableCell className="p-2 text-right font-medium border-r">
                                            {transaction.closingBalance}
                                        </TableCell>
                                    )}
                                    {visibleColumns.transactionNumber && (
                                        <TableCell className="p-2 border-r">
                                            {transaction.transactionNumber}
                                        </TableCell>
                                    )}
                                    {visibleColumns.transactionAgainst && (
                                        <TableCell className="p-2 border-r">
                                            {transaction.transactionAgainst}
                                        </TableCell>
                                    )}
                                    {visibleColumns.remark && (
                                        <TableCell className="p-2 border-r">
                                            {transaction.remark || ""}
                                        </TableCell>
                                    )}
                                    <TableCell className="p-2 text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                                            onClick={() => exportSingleTransactionToExcel(transaction)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="h-20 text-center text-sm">
                                    No transactions found
                                        </TableCell>
                                    </TableRow>
                        )}
                            </TableBody>
                        </Table>
                    </div>

            {/* Pagination - Made more compact */}
            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                    Showing {sortedData.length > 0 ? 1 : 0} to {Math.min(rowsPerPage, sortedData.length)} of {sortedData.length} entries
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="h-7 px-2 text-xs"
                    >
                        First
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-7 px-2 text-xs"
                    >
                        Previous
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 4) }).map((_, i) => (
                        <Button
                            key={i}
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(i + 1)}
                            className="h-7 w-7 text-xs"
                        >
                            {i + 1}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-7 px-2 text-xs"
                    >
                        Next
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-7 px-2 text-xs"
                    >
                        Last
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LedgerHistory; 