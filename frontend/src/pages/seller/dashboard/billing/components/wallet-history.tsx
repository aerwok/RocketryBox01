import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, Filter, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ServiceFactory } from "@/services/service-factory";
import { toast } from "sonner";

interface WalletTransaction {
    id: number;
    date: string;
    referenceNumber: string;
    orderId: string;
    type: string;
    amount: string;
    codCharge: string;
    igst: string;
    subTotal: string;
    closingBalance: string;
    remark: string;
}

interface WalletSummary {
    totalRecharge: number;
    totalUsed: number;
    lastRecharge: string;
    codToWallet: number;
    closingBalance: string;
}

// Type definition for DateRange
interface DateRange {
    start: Date | null;
    end: Date | null;
}

const WalletHistory = () => {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof WalletTransaction;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        date: "",
        referenceNumber: "",
        orderId: "",
        paymentType: "",
        creditDebit: "",
        amount: "",
        remark: ""
    });
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({ start: null, end: null });
    const [nextMonth, setNextMonth] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    const dateDropdownRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // API-related state
    const [isLoading, setIsLoading] = useState(false);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [summary, setSummary] = useState<WalletSummary>({
        totalRecharge: 0,
        totalUsed: 0,
        lastRecharge: "₹0",
        codToWallet: 0,
        closingBalance: "₹0"
    });
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Fetch wallet transactions
    const fetchTransactions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await ServiceFactory.seller.billing.getWalletTransactions({
                page: currentPage,
                limit: rowsPerPage,
                ...filters,
                sortBy: sortConfig?.key,
                sortDirection: sortConfig?.direction
            });

            if (response.success) {
                setTransactions(response.data.transactions);
                setTotalTransactions(response.data.total);
            } else {
                throw new Error(response.message || 'Failed to fetch transactions');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to fetch transactions. Please try again.');
            toast.error('Failed to fetch transactions');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch wallet summary
    const fetchWalletSummary = async () => {
        try {
            const response = await ServiceFactory.seller.billing.getWalletSummary();
            if (response.success) {
                setSummary(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch wallet summary');
            }
        } catch (error) {
            console.error('Error fetching wallet summary:', error);
            toast.error('Failed to fetch wallet summary');
        }
    };

    // Fetch data when component mounts or when relevant state changes
    useEffect(() => {
        fetchTransactions();
        fetchWalletSummary();
    }, [currentPage, rowsPerPage, filters, sortConfig]);

    const handleSort = (key: keyof WalletTransaction) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Function to handle Excel export
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            transactions.map(t => ({
                ID: t.id,
                Date: t.date,
                "Reference Number": t.referenceNumber,
                "Order ID": t.orderId,
                Type: t.type,
                Amount: t.amount,
                "COD Charge": t.codCharge,
                IGST: t.igst,
                "Sub-Total": t.subTotal,
                "Closing Balance": t.closingBalance,
                Remark: t.remark
            }))
        );

        // Set column widths
        const columnWidths = [
            { wch: 5 },  // ID
            { wch: 12 }, // Date
            { wch: 20 }, // Reference Number
            { wch: 15 }, // Order ID
            { wch: 12 }, // Type
            { wch: 12 }, // Amount
            { wch: 12 }, // COD Charge
            { wch: 12 }, // IGST
            { wch: 12 }, // Sub-Total
            { wch: 15 }, // Closing Balance
            { wch: 25 }  // Remark
        ];
        worksheet['!cols'] = columnWidths;

        // Create a workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Wallet History");

        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, "Wallet_History.xlsx");
    };

    // Update handleFilterChange to handle select changes
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement> | string, name?: string) => {
        if (typeof e === 'string' && name) {
            // Handle select change
            setFilters(prev => ({
                ...prev,
                [name]: e
            }));
        } else if (typeof e !== 'string') {
            // Handle input change
            const { name, value } = e.target;
            setFilters(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Apply filters to data
    const applyFilters = () => {
        fetchTransactions();
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            date: "",
            referenceNumber: "",
            orderId: "",
            paymentType: "",
            creditDebit: "",
            amount: "",
            remark: ""
        });
        fetchTransactions();
    };

    // Apply sorting to filtered data
    const sortedData = [...transactions].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Handle clicking outside of date dropdown to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node) &&
                calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowDateDropdown(false);
                setShowCalendar(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Navigate months
    const prevMonth = () => {
        setNextMonth(new Date(nextMonth.setMonth(nextMonth.getMonth() - 1)));
    };

    const nextMonthNav = () => {
        setNextMonth(new Date(nextMonth.setMonth(nextMonth.getMonth() + 1)));
    };

    // Generate calendar days
    const generateCalendarDays = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        
        const days = [];
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthDays - i),
                isCurrentMonth: false
            });
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }
        
        // Next month days to fill up the calendar
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }
        
        return days;
    };

    // Format date to YYYY-MM-DD
    const formatDate = (date: Date | null): string => {
        return date ? date.toISOString().split('T')[0] : '';
    };

    // Select date in calendar
    const selectDate = (date: Date) => {
        if (!selectedDateRange.start || (selectedDateRange.start && selectedDateRange.end)) {
            setSelectedDateRange({ start: date, end: null });
        } else if (selectedDateRange.start) {
            if (date < selectedDateRange.start) {
                setSelectedDateRange({ start: date, end: selectedDateRange.start });
            } else {
                setSelectedDateRange({ start: selectedDateRange.start, end: date });
            }
        }
    };

    // Apply selected date range
    const applyDateRange = () => {
        if (selectedDateRange?.start && selectedDateRange?.end) {
            const startStr = formatDate(selectedDateRange.start);
            const endStr = formatDate(selectedDateRange.end);
            setFilters(prev => ({
                ...prev,
                date: `${startStr} to ${endStr}`
            }));
        } else if (selectedDateRange?.start) {
            setFilters(prev => ({
                ...prev,
                date: formatDate(selectedDateRange.start)
            }));
        }
        setShowCalendar(false);
    };

    // Discard selected date range
    const discardDateRange = () => {
        setSelectedDateRange({ start: null, end: null });
        setShowCalendar(false);
    };

    // Handle date option selection
    const handleDateOptionSelect = (option: string) => {
        let dateValue = "";
        const today = new Date();
        
        if (option === "Choose Date") {
            setShowCalendar(true);
            setShowDateDropdown(false);
            return;
        }
        
        switch(option) {
            case "Today":
                dateValue = formatDate(today);
                break;
            case "Yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                dateValue = formatDate(yesterday);
                break;
            case "Last 7 Days":
                dateValue = "Last 7 Days";
                break;
            case "Last 30 Days":
                dateValue = "Last 30 Days";
                break;
            case "Last Month":
                dateValue = "Last Month";
                break;
            case "Current Month":
                dateValue = "Current Month";
                break;
            case "Lifetime":
                dateValue = "Lifetime";
                break;
            default:
                dateValue = "";
        }
        
        setFilters(prev => ({
            ...prev,
            date: dateValue
        }));
        
        setShowDateDropdown(false);
    };

    // Get day class based on selection state
    const getDayClass = (day: {date: Date, isCurrentMonth: boolean}) => {
        let classes = "flex items-center justify-center h-8 w-8 rounded-full ";
        
        if (!day.isCurrentMonth) {
            classes += "text-gray-400 ";
        } else {
            classes += "hover:bg-blue-100 ";
        }
        
        const formattedDate = formatDate(day.date);
        const start = selectedDateRange?.start ? formatDate(selectedDateRange.start) : null;
        const end = selectedDateRange?.end ? formatDate(selectedDateRange.end) : null;
        
        if (start && formattedDate === start) {
            classes += "bg-blue-500 text-white ";
        } else if (end && formattedDate === end) {
            classes += "bg-blue-500 text-white ";
        } else if (selectedDateRange.start && selectedDateRange.end && day.date > selectedDateRange.start && day.date < selectedDateRange.end) {
            classes += "bg-blue-100 ";
        }
        
        return classes;
    };

    // Inside the buttons section, update the export function to use sortedData
    const filterAndExport = () => {
        applyFilters();
        
        // Create a worksheet with the filtered transaction data
        const worksheet = XLSX.utils.json_to_sheet(
            sortedData.map(t => ({
                ID: t.id,
                Date: t.date,
                "Reference Number": t.referenceNumber,
                "Order ID": t.orderId,
                Type: t.type,
                Amount: t.amount,
                "COD Charge": t.codCharge,
                IGST: t.igst,
                "Sub-Total": t.subTotal,
                "Closing Balance": t.closingBalance,
                Remark: t.remark
            }))
        );
        
        // Set column widths
        const columnWidths = [
            { wch: 5 },  // ID
            { wch: 12 }, // Date
            { wch: 20 }, // Reference Number
            { wch: 15 }, // Order ID
            { wch: 12 }, // Type
            { wch: 12 }, // Amount
            { wch: 12 }, // COD Charge
            { wch: 12 }, // IGST
            { wch: 12 }, // Sub-Total
            { wch: 15 }, // Closing Balance
            { wch: 25 }  // Remark
        ];
        worksheet['!cols'] = columnWidths;

        // Create a workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Wallet History");

        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, "Wallet_History.xlsx");
    };

    return (
        <div className="space-y-6">
            {/* Data Mode Toggle - for testing purposes only */}
            <div className="flex justify-end">
                <Button 
                    variant="outline" 
                    onClick={fetchTransactions} 
                    className="text-xs"
                >
                    Reload
                </Button>
            </div>

            {/* API Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-center justify-center">
                    Loading wallet transactions...
                </div>
            )}

            {/* Top stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded border relative">
                    <div className="absolute top-4 right-4">
                        <button className="text-gray-400 hover:text-gray-600">
                            <span className="sr-only">Information</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <h3 className="uppercase text-xs font-semibold text-gray-500 mb-2">TOTAL RECHARGE</h3>
                    <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold">₹{summary.totalRecharge}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border relative">
                    <div className="absolute top-4 right-4">
                        <button className="text-gray-400 hover:text-gray-600">
                            <span className="sr-only">Information</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <h3 className="uppercase text-xs font-semibold text-gray-500 mb-2">TOTAL USED</h3>
                    <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold">₹{summary.totalUsed}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border relative">
                    <div className="absolute top-4 right-4">
                        <button className="text-gray-400 hover:text-gray-600">
                            <span className="sr-only">Information</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <h3 className="uppercase text-xs font-semibold text-gray-500 mb-2">LAST RECHARGE</h3>
                    <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold">{summary.lastRecharge}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border relative">
                    <div className="absolute top-4 right-4">
                        <button className="text-gray-400 hover:text-gray-600">
                            <span className="sr-only">Information</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <h3 className="uppercase text-xs font-semibold text-gray-500 mb-2">COD TO WALLET RECHARGE</h3>
                    <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold">₹{summary.codToWallet}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded border relative">
                    <div className="absolute top-4 right-4">
                        <button className="text-gray-400 hover:text-gray-600">
                            <span className="sr-only">Information</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <h3 className="uppercase text-xs font-semibold text-gray-500 mb-2">CLOSING BALANCE</h3>
                    <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold">{summary.closingBalance}</span>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" className="flex items-center gap-1" onClick={exportToExcel}>
                    <Download className="h-4 w-4" />
                    Export
                </Button>
                <Button 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="h-4 w-4" />
                    Show
                </Button>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <div className="bg-white rounded-lg border p-4 space-y-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Dates</Label>
                            <div className="relative">
                                <Input
                                    name="date"
                                    placeholder="Order Date"
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
                                    className="absolute z-30 mt-1 w-full bg-white border rounded-md shadow-lg"
                                >
                                    <ul className="py-1">
                                        {["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Last Month", "Current Month", "Lifetime", "Choose Date"].map((option) => (
                                            <li 
                                                key={option} 
                                                className="px-4 py-2 text-sm hover:bg-blue-500 hover:text-white cursor-pointer"
                                                onClick={() => handleDateOptionSelect(option)}
                                            >
                                                {option}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* Calendar */}
                            {showCalendar && (
                                <div 
                                    ref={calendarRef}
                                    className="absolute z-40 mt-1 p-4 bg-white border rounded-md shadow-lg"
                                    style={{ width: "550px" }}
                                >
                                    <div className="flex justify-between mb-4">
                                        {/* Calendar navigation */}
                                        <div className="flex items-center space-x-4">
                                            <button 
                                                className="p-1 rounded-full hover:bg-gray-100"
                                                onClick={prevMonth}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <h3 className="text-sm font-medium">
                                                {nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </h3>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <h3 className="text-sm font-medium">
                                                {nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </h3>
                                            <button 
                                                className="p-1 rounded-full hover:bg-gray-100"
                                                onClick={nextMonthNav}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-8">
                                        {/* First month */}
                                        <div className="flex-1">
                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                                    <div key={day} className="text-center text-xs font-medium text-gray-500">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {generateCalendarDays(
                                                    nextMonth.getFullYear(),
                                                    nextMonth.getMonth()
                                                ).slice(0, 35).map((day, index) => (
                                                    <div 
                                                        key={index}
                                                        className="text-center p-1"
                                                    >
                                                        <button
                                                            className={getDayClass(day)}
                                                            onClick={() => selectDate(day.date)}
                                                        >
                                                            {day.date.getDate()}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Second month */}
                                        <div className="flex-1">
                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                                    <div key={`next-${day}`} className="text-center text-xs font-medium text-gray-500">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {generateCalendarDays(
                                                    nextMonth.getFullYear(),
                                                    nextMonth.getMonth()
                                                ).slice(0, 35).map((day, index) => (
                                                    <div 
                                                        key={`next-${index}`}
                                                        className="text-center p-1"
                                                    >
                                                        <button
                                                            className={getDayClass(day)}
                                                            onClick={() => selectDate(day.date)}
                                                        >
                                                            {day.date.getDate()}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Selected date range display */}
                                    <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                        <div className="text-sm">
                                            {selectedDateRange.start && selectedDateRange.end
                                                ? `${formatDate(selectedDateRange.start)} to ${formatDate(selectedDateRange.end)}`
                                                : selectedDateRange.start
                                                ? `${formatDate(selectedDateRange.start)}`
                                                : ''
                                            }
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                onClick={discardDateRange}
                                                className="bg-orange-500 hover:bg-orange-600 px-3 py-1 h-8 text-white"
                                            >
                                                Discard
                                            </Button>
                                            <Button 
                                                size="sm"
                                                onClick={applyDateRange}
                                                className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1 h-8 text-white"
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Reference Number</Label>
                            <Input
                                name="referenceNumber"
                                placeholder="Reference Number"
                                value={filters.referenceNumber}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Order Id</Label>
                            <Input
                                name="orderId"
                                placeholder="Order Id"
                                value={filters.orderId}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Payment Type</Label>
                            <Select 
                                onValueChange={(value) => handleFilterChange(value, 'paymentType')}
                                value={filters.paymentType}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Payment Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All</SelectItem>
                                    <SelectItem value="Debit">Debit</SelectItem>
                                    <SelectItem value="Recharge">Recharge</SelectItem>
                                    <SelectItem value="COD Recharge">COD Recharge</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block text-xs font-medium text-gray-500 mb-1">Credit Debit</Label>
                            <Select 
                                onValueChange={(value) => handleFilterChange(value, 'creditDebit')}
                                value={filters.creditDebit}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Credit Debit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Credit Debit">Credit Debit</SelectItem>
                                    <SelectItem value="CR">CR</SelectItem>
                                    <SelectItem value="DR">DR</SelectItem>
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
                    <div className="flex gap-2 mt-4">
                        <Button 
                            onClick={applyFilters}
                            size="sm" 
                            className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-1 px-3 py-1 h-8 rounded"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                        <Button 
                            onClick={clearFilters}
                            size="sm"
                            variant="outline"
                            className="bg-orange-50 hover:bg-orange-100 text-orange-500 border-orange-200 flex items-center gap-1 px-3 py-1 h-8 rounded"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </Button>
                        <Button 
                            onClick={filterAndExport}
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-500 border-green-200 flex items-center gap-1 px-3 py-1 h-8 rounded"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>
            )}

            {/* Transactions table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 border-b">
                            <TableRow>
                                <TableHead className="text-center w-12">#</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                                    DATE {sortConfig?.key === 'date' && (
                                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </TableHead>
                                <TableHead>REFERENCE NUMBER</TableHead>
                                <TableHead>ORDER ID</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                                    TYPE {sortConfig?.key === 'type' && (
                                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                                    AMOUNT {sortConfig?.key === 'amount' && (
                                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </TableHead>
                                <TableHead>COD CHARGE</TableHead>
                                <TableHead>IGST</TableHead>
                                <TableHead>SUB-TOTAL</TableHead>
                                <TableHead>CLOSING BALANCE</TableHead>
                                <TableHead>REMARK</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                                        Loading transactions...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((transaction, index) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="text-center">{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{transaction.date}</TableCell>
                                        <TableCell>{transaction.referenceNumber}</TableCell>
                                        <TableCell>{transaction.orderId}</TableCell>
                                        <TableCell>{transaction.type}</TableCell>
                                        <TableCell>{transaction.amount}</TableCell>
                                        <TableCell>{transaction.codCharge}</TableCell>
                                        <TableCell>{transaction.igst}</TableCell>
                                        <TableCell>{transaction.subTotal}</TableCell>
                                        <TableCell>{transaction.closingBalance}</TableCell>
                                        <TableCell>{transaction.remark}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Rows/Page:</span>
                    <select 
                        className="border rounded py-1 px-2 text-sm"
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="250">250</option>
                    </select>
                </div>

                <div className="flex space-x-1">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-2"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                    >
                        First
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-2"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                        Previous
                    </Button>
                    {[...Array(Math.min(4, Math.ceil(totalTransactions / rowsPerPage)))].map((_, i) => (
                        <Button 
                            key={i}
                            variant="outline" 
                            size="sm" 
                            className={cn(
                                "px-2",
                                currentPage === i + 1 ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                            )}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </Button>
                    ))}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-2"
                        disabled={currentPage === Math.ceil(totalTransactions / rowsPerPage) || transactions.length === 0}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalTransactions / rowsPerPage)))}
                    >
                        Next
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-2"
                        disabled={currentPage === Math.ceil(totalTransactions / rowsPerPage) || transactions.length === 0}
                        onClick={() => setCurrentPage(Math.ceil(totalTransactions / rowsPerPage))}
                    >
                        Last
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WalletHistory; 