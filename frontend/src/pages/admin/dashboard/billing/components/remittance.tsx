import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, DollarSign, DownloadIcon, EyeIcon, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DateRange } from "react-day-picker";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface RemittanceTransaction {
    id: string;
    transactionId: string;
    transactionType: string;
    date: string;
    sellerId: string;
    sellerName: string;
    amount: string;
    paymentType: "credit" | "wallet";
    status: "paid" | "due";
    reference: string;
    description: string;
}

interface Seller {
    id: string;
    name: string;
}

// Empty initial data arrays
const sellers: Seller[] = [];
const remittanceData: RemittanceTransaction[] = [];

// Update the stats with empty defaults
const stats = [
    { title: "Total Remitted", amount: "₹0", icon: <DollarSign className="size-5" /> },
    { title: "Pending Remittances", amount: "₹0", icon: <DollarSign className="size-5" /> },
    { title: "Failed Transactions", amount: "₹0", icon: <DollarSign className="size-5" /> },
    { title: "Active Sellers", amount: "0", icon: <DollarSign className="size-5" /> }
];

const Remittance = () => {
    // State setup
    const [sortConfig, setSortConfig] = useState<{
        key: keyof RemittanceTransaction;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");

    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 2, 20),
        to: new Date(2024, 2, 26),
    });

    const [isInitiateDialogOpen, setIsInitiateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        transactionType: '',
        transactionId: '',
        sellerId: '',
        sellerName: '',
        amount: '',
        paymentType: '',
        paymentStatus: '',
        excelFile: null as File | null
    });

    // Add state for transactions from Initiate Remittance
    const [savedTransactions, setSavedTransactions] = useState<any[]>([]);

    // Use useEffect to load saved transactions on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('remittanceTransactions');
            if (stored) {
                const parsed = JSON.parse(stored);
                setSavedTransactions(parsed);
            }
        } catch (e) {
            console.error('Error loading transactions:', e);
        }
    }, []);

    // Update the combinedData processing to properly handle status
    const combinedData = [
        ...remittanceData, 
        ...savedTransactions.map(tx => {
            // Create a properly formatted transaction object
            const normalized: RemittanceTransaction = {
                id: String(tx.id || Date.now()),
                transactionId: String(tx.transactionId || tx.id || Date.now()),
                transactionType: String(tx.transactionType || "Unknown"),
                date: String(tx.date || new Date().toISOString().slice(0, 10)),
                sellerId: String(tx.sellerId || "Unknown"),
                sellerName: String(tx.sellerName || "Unknown"),
                amount: String(tx.amount || "₹0"),
                paymentType: "credit",
                status: "due", 
                reference: String(tx.reference || "-"),
                description: String(tx.description || "-"),
            };
            
            // Special handling for payment type - use the correct values
            if (tx.paymentType === "credit" || tx.paymentType === "Bank Transfer") {
                normalized.paymentType = "credit";
            } else if (tx.paymentType === "wallet" || tx.paymentType === "Wallet") {
                normalized.paymentType = "wallet";
            }
            
            // Special handling for status - use the correct values
            if ((tx.status as any) === "paid" || (tx.status as any) === "completed") {
                normalized.status = "paid";
            } else {
                normalized.status = "due";
            }
            
            return normalized;
        })
    ];

    // Apply filtering and sorting to combined data
    const filteredData = combinedData.filter(transaction => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
            (transaction.transactionId || '').toLowerCase().includes(searchLower) ||
            (transaction.transactionType || '').toLowerCase().includes(searchLower) ||
            (transaction.date || '').toLowerCase().includes(searchLower) ||
            (transaction.sellerId || '').toLowerCase().includes(searchLower) ||
            (transaction.sellerName || '').toLowerCase().includes(searchLower) ||
            (transaction.amount || '').toLowerCase().includes(searchLower) ||
            (transaction.paymentType || '').toLowerCase().includes(searchLower) ||
            (transaction.status || '').toLowerCase().includes(searchLower) ||
            (transaction.reference || '').toLowerCase().includes(searchLower) ||
            (transaction.description || '').toLowerCase().includes(searchLower)
        );

        // Date range filter
        let transactionDate = new Date(transaction.date);
        const matchesDateRange = !date?.from || !date?.to || 
            (transactionDate >= date.from && transactionDate <= date.to);

        return matchesSearch && matchesDateRange;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;

        // Handle different property names between data sources
        const getProperty = (obj: any, key: string) => {
            // Map properties between different data structures
            const propertyMap: Record<string, string[]> = {
                'transactionId': ['transactionId', 'id'],
                'transactionType': ['transactionType'],
                'sellerId': ['sellerId'],
                'sellerName': ['sellerName'],
                'amount': ['amount'],
                'paymentType': ['paymentType'],
                'status': ['status'],
                'reference': ['reference'],
                'description': ['description']
            };
            
            // Try to get property using mapped names
            const possibleKeys = propertyMap[key] || [key];
            for (const possibleKey of possibleKeys) {
                if (obj[possibleKey] !== undefined) {
                    return obj[possibleKey];
                }
            }
            
            return '';
        };

        const keyA = getProperty(a, sortConfig.key as string);
        const keyB = getProperty(b, sortConfig.key as string);

        if (keyA < keyB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (keyA > keyB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof RemittanceTransaction) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleExport = () => {
        const headers = [
            "Transaction ID",
            "Transaction Type",
            "Date",
            "Seller ID",
            "Seller Name",
            "Amount",
            "Payment Type",
            "Status",
            "Reference",
            "Description",
            "Account Number",
            "IFSC Code",
            "Bank Name",
            "Account Holder",
            "Transaction Fee",
            "Net Amount",
            "Processing Time",
            "Batch Number",
            "Wallet Balance After",
            "Approval By"
        ];

        const data = remittanceData.map(transaction => [
            transaction.transactionId,
            transaction.transactionType,
            transaction.date,
            transaction.sellerId,
            transaction.sellerName,
            transaction.amount,
            transaction.paymentType === "credit" ? "Credit" : "Wallet",
            transaction.status === "paid" ? "Paid" : "Due",
            transaction.reference,
            transaction.description,
            "123456789012", // Account Number
            "SBIN0001234", // IFSC Code
            "State Bank of India", // Bank Name
            transaction.sellerName + " Ltd", // Account Holder
            "₹25", // Transaction Fee
            transaction.amount.replace("₹", ""), // Net Amount
            "1 working day", // Processing Time
            "BATCH" + transaction.date.replace(/-/g, ""), // Batch Number
            "₹5,000", // Wallet Balance After
            "Admin User 1" // Approval By
        ]);

        // Export CSV
        const csvContent = [
            headers.join(","),
            ...data.map(row => row.join(","))
        ].join("\n");

        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.setAttribute('href', csvUrl);
        csvLink.setAttribute('download', `remittance-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Export Excel
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Remittance");
        XLSX.writeFile(wb, `remittance-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportSingleRow = (transaction: RemittanceTransaction) => {
        const headers = [
            "Transaction ID",
            "Transaction Type",
            "Date",
            "Seller ID",
            "Seller Name",
            "Amount",
            "Payment Type",
            "Status",
            "Reference Number",
            "Description",
            "Account Number",
            "IFSC Code",
            "Bank Name",
            "Account Holder",
            "Transaction Fee",
            "Net Amount",
            "Processing Time",
            "Batch Number",
            "Wallet Balance After",
            "Approval By"
        ];

        const rowData = [
            transaction.transactionId,
            transaction.transactionType,
            transaction.date,
            transaction.sellerId,
            transaction.sellerName,
            transaction.amount,
            transaction.paymentType === "credit" ? "Credit" : "Wallet",
            transaction.status === "paid" ? "Paid" : "Due",
            transaction.reference,
            transaction.description,
            "123456789012", // Account Number
            "SBIN0001234", // IFSC Code
            "State Bank of India", // Bank Name
            transaction.sellerName + " Ltd", // Account Holder
            "₹25", // Transaction Fee
            transaction.amount.replace("₹", ""), // Net Amount
            transaction.status === "paid" ? "Processed" : "Pending", // Processing Time
            "BATCH" + transaction.date.replace(/-/g, ""), // Batch Number
            "₹5,000", // Wallet Balance After
            "Admin User 1" // Approval By
        ];

        // Export CSV
        const csvContent = [
            headers.join(","),
            rowData.join(",")
        ].join("\n");

        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.setAttribute('href', csvUrl);
        csvLink.setAttribute('download', `remittance-${transaction.transactionId}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Export Excel
        const ws = XLSX.utils.aoa_to_sheet([headers, rowData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Transaction ${transaction.transactionId}`);
        XLSX.writeFile(wb, `remittance-${transaction.transactionId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'sellerId') {
            // Auto-fill seller name when seller ID is selected
            const seller = sellers.find(s => s.id === value);
            setFormData(prev => ({
                ...prev,
                [field]: value,
                sellerName: seller?.name || ''
            }));
        } else if (field === 'paymentType') {
            // Set payment status based on payment type
            setFormData(prev => ({
                ...prev,
                [field]: value,
                paymentStatus: value === 'wallet' ? 'paid' : prev.paymentStatus
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            excelFile: file
        }));
    };

    const handleInitiateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.transactionType || !formData.sellerId || !formData.amount || !formData.paymentType) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            // Generate unique ID
            const transactionId = formData.transactionId || `TXN${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            
            // Use the payment type directly without mapping
            const paymentType = formData.paymentType as "credit" | "wallet";
            
            // Set status based on payment type and paymentStatus
            let status: "paid" | "due" = "due";
            if (formData.paymentType === "wallet" || formData.paymentStatus === "paid") {
                status = "paid";
            }
            
            // Create new transaction with proper structure
            const newTransaction: RemittanceTransaction = {
                id: String(Date.now()),
                transactionId: transactionId,
                transactionType: formData.transactionType,
                date: new Date().toISOString().slice(0, 10),
                sellerId: formData.sellerId,
                sellerName: formData.sellerName,
                amount: formData.amount.startsWith('₹') ? formData.amount : `₹${formData.amount}`,
                paymentType: paymentType,
                status: status,
                reference: `REM-${new Date().getTime().toString().slice(-6)}`,
                description: "Transaction created from remittance form"
            };
            
            // Create a new array with the combined data
            const updatedRemittanceData = [...remittanceData, newTransaction];
            
            // Update remittanceData by reference
            remittanceData.length = 0; 
            updatedRemittanceData.forEach(item => remittanceData.push(item));
            
            // Store in localStorage (this is what's displayed in the debug section)
            const currentSavedData = savedTransactions.length > 0 ? [...savedTransactions] : [];
            const updatedSavedData = [...currentSavedData, newTransaction];
            localStorage.setItem('remittanceTransactions', JSON.stringify(updatedSavedData));
            
            // Update state and force re-render
            setSavedTransactions(updatedSavedData);
            setSearchQuery(" ");
            setTimeout(() => setSearchQuery(""), 10);
            
            // Show success notification
            toast.success(`Transaction initiated successfully! ID: ${transactionId}`);
            
            // Reset form and close dialog
            setFormData({
                transactionType: '',
                transactionId: '',
                sellerId: '',
                sellerName: '',
                amount: '',
                paymentType: '',
                paymentStatus: '',
                excelFile: null
            });
            setIsInitiateDialogOpen(false);
            
            // Force additional re-render
            setTimeout(() => {
                setSortConfig(null);
            }, 100);
        } catch (error) {
            console.error('Error creating transaction:', error);
            toast.error("Failed to create transaction. Please try again.");
        }
    };

    return (
        <div className="space-y-8">
            {/* Show only the data relevant UI elements, removing debug displays */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-[#BCDDFF] p-4 rounded-lg"
                    >
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-medium">
                                {stat.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                {stat.icon}
                                <span className="text-lg font-semibold">
                                    {stat.amount}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search remittances..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full md:w-auto"
                            onClick={() => setIsInitiateDialogOpen(true)}
                        >
                            Initiate Remittance
                        </Button>
                        <DateRangePicker date={date} setDate={setDate} className="w-20 md:w-auto hidden md:flex" />
                        <Button variant="outline" className="w-full md:w-auto" onClick={handleExport}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total Remitted:
                        <span className="font-semibold text-green-600 ml-1">
                            ₹0
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-md">
                    <Table>
                        <TableHeader className="bg-[#F4F2FF] h-12">
                            <TableRow className="hover:bg-[#F4F2FF]">
                                <TableHead
                                    onClick={() => handleSort('transactionId')}
                                    className="cursor-pointer text-black"
                                >
                                    Transaction ID
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('transactionType')}
                                    className="cursor-pointer text-black"
                                >
                                    Transaction Type
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('date')}
                                    className="cursor-pointer text-black"
                                >
                                    Date
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('sellerId')}
                                    className="cursor-pointer text-black"
                                >
                                    Seller ID
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('sellerName')}
                                    className="cursor-pointer text-black"
                                >
                                    Seller Name
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('amount')}
                                    className="cursor-pointer text-black"
                                >
                                    Amount (₹)
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('paymentType')}
                                    className="cursor-pointer text-black"
                                >
                                    Payment Type
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('status')}
                                    className="cursor-pointer text-black"
                                >
                                    Status
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('reference')}
                                    className="cursor-pointer text-black"
                                >
                                    Reference Number
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('description')}
                                    className="cursor-pointer text-black"
                                >
                                    Description
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead className="text-black">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-4">
                                        No remittance transactions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedData.map((transaction, index) => (
                                    <TableRow key={transaction.id || index}>
                                        <TableCell>{transaction.transactionId}</TableCell>
                                        <TableCell>{transaction.transactionType}</TableCell>
                                        <TableCell>{transaction.date}</TableCell>
                                        <TableCell>{transaction.sellerId}</TableCell>
                                        <TableCell>{transaction.sellerName}</TableCell>
                                        <TableCell>{transaction.amount}</TableCell>
                                        <TableCell>{transaction.paymentType}</TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-2 py-1 rounded text-xs",
                                                {
                                                    "bg-green-100 text-green-700": transaction.status === 'paid',
                                                    "bg-orange-100 text-orange-700": transaction.status === 'due'
                                                }
                                            )}>
                                                {transaction.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{transaction.reference}</TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleExportSingleRow(transaction)}
                                                >
                                                    <DownloadIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Dialog open={isInitiateDialogOpen} onOpenChange={setIsInitiateDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Billing & Notes Management</DialogTitle>
                            <DialogDescription>
                                Add New Transaction
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInitiateSubmit} className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="transactionType" className="text-sm font-normal">Transaction Type:</Label>
                                    <Select
                                        value={formData.transactionType}
                                        onValueChange={(value) => handleInputChange('transactionType', value)}
                                    >
                                        <SelectTrigger className="bg-white h-9">
                                            <SelectValue placeholder="Select transaction type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="invoice">Invoice</SelectItem>
                                            <SelectItem value="debit_note">Debit Note</SelectItem>
                                            <SelectItem value="credit_note">Credit Note</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="transactionId" className="text-sm font-normal">Transaction ID:</Label>
                                    <Input
                                        id="transactionId"
                                        value={formData.transactionId}
                                        onChange={(e) => handleInputChange('transactionId', e.target.value)}
                                        placeholder="BRV/23/03/497"
                                        className="bg-white h-9"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="sellerId" className="text-sm font-normal">Seller ID:</Label>
                                    <Select
                                        value={formData.sellerId}
                                        onValueChange={(value) => handleInputChange('sellerId', value)}
                                    >
                                        <SelectTrigger className="bg-white h-9">
                                            <SelectValue placeholder="Select seller ID" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sellers.map((seller) => (
                                                <SelectItem key={seller.id} value={seller.id}>
                                                    {seller.id}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="sellerName" className="text-sm font-normal">Seller Name:</Label>
                                    <Input
                                        id="sellerName"
                                        value={formData.sellerName}
                                        readOnly
                                        className="bg-gray-50 h-9"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="amount" className="text-sm font-normal">Amount (₹):</Label>
                                    <Input
                                        id="amount"
                                        type="text"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                        placeholder="Enter Amount"
                                        className="bg-white h-9"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="paymentType" className="text-sm font-normal">Payment Type:</Label>
                                    <Select
                                        value={formData.paymentType}
                                        onValueChange={(value) => handleInputChange('paymentType', value)}
                                    >
                                        <SelectTrigger className="bg-white h-9">
                                            <SelectValue placeholder="Select payment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="credit">Credit</SelectItem>
                                            <SelectItem value="wallet">Wallet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="paymentStatus" className="text-sm font-normal">Payment Status:</Label>
                                    <Select
                                        value={formData.paymentStatus}
                                        onValueChange={(value) => handleInputChange('paymentStatus', value)}
                                        disabled={formData.paymentType === 'wallet'}
                                    >
                                        <SelectTrigger className={cn("h-9", {
                                            "bg-white": formData.paymentType !== 'wallet',
                                            "bg-gray-50": formData.paymentType === 'wallet'
                                        })}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.paymentType === 'credit' ? (
                                                <>
                                                    <SelectItem value="due">Due</SelectItem>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                </>
                                            ) : (
                                                <SelectItem value="paid">Paid</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="excelFile" className="text-sm font-normal">Upload Excel:</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="excelFile"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="bg-white h-9 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-500">No file chosen</span>
                                    </div>
                                </div>

                                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white h-9">
                                    Initiate
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Remittance; 