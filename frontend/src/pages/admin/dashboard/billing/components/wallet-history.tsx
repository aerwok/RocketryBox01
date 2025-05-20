import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Building2, DownloadIcon, EyeIcon, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DateRange } from "react-day-picker";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";

interface WalletTransaction {
    transactionId: string;
    sellerId: string;
    sellerName: string;
    date: string;
    type: "Credit" | "Debit";
    amount: string;
    balance: string;
    description: string;
    status: "completed" | "pending" | "failed";
}

const transactionData: WalletTransaction[] = [];

const WalletHistory = () => {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof WalletTransaction;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");

    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 2, 20),
        to: new Date(2024, 2, 26),
    });

    const stats = [
        { title: "Total Recharges", amount: "₹0", icon: <Building2 className="size-5" /> },
        { title: "Total Used", amount: "₹0", icon: <Building2 className="size-5" /> },
        { title: "Pending Transactions", amount: "₹0", icon: <Building2 className="size-5" /> },
        { title: "Total Sellers", amount: "0", icon: <Building2 className="size-5" /> }
    ];

    const filteredData = transactionData.filter(transaction => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
            transaction.transactionId.toLowerCase().includes(searchLower) ||
            transaction.sellerId.toLowerCase().includes(searchLower) ||
            transaction.sellerName.toLowerCase().includes(searchLower) ||
            transaction.date.toLowerCase().includes(searchLower) ||
            transaction.type.toLowerCase().includes(searchLower) ||
            transaction.amount.toLowerCase().includes(searchLower) ||
            transaction.balance.toLowerCase().includes(searchLower) ||
            transaction.description.toLowerCase().includes(searchLower) ||
            transaction.status.toLowerCase().includes(searchLower)
        );

        // Date range filter
        const transactionDate = new Date(transaction.date);
        const matchesDateRange = !date?.from || !date?.to || 
            (transactionDate >= date.from && transactionDate <= date.to);

        return matchesSearch && matchesDateRange;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof WalletTransaction) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleExport = () => {
        const headers = [
            "Transaction ID",
            "Seller ID",
            "Seller Name",
            "Date",
            "Type",
            "Amount",
            "Balance",
            "Description",
            "Status",
            "Payment Method",
            "Reference Number",
            "Transaction Fee",
            "Net Amount",
            "Processing Time",
            "Batch Number",
            "Wallet Balance After",
            "Approval By"
        ];

        const data = transactionData.map(transaction => [
            transaction.transactionId,
            transaction.sellerId,
            transaction.sellerName,
            transaction.date,
            transaction.type,
            transaction.amount,
            transaction.balance,
            transaction.description,
            transaction.status,
            "Bank Transfer", // Payment Method
            "REF" + transaction.transactionId, // Reference Number
            "₹25", // Transaction Fee
            transaction.amount.replace("₹", ""), // Net Amount
            "1 working day", // Processing Time
            "BATCH" + transaction.date.replace(/-/g, ""), // Batch Number
            transaction.balance, // Wallet Balance After
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
        csvLink.setAttribute('download', `wallet-history-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Export Excel
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Wallet History");
        XLSX.writeFile(wb, `wallet-history-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportSingleRow = (transaction: WalletTransaction) => {
        const headers = [
            "Transaction ID",
            "Seller ID",
            "Seller Name",
            "Date",
            "Type",
            "Amount",
            "Balance",
            "Description",
            "Status",
            "Payment Method",
            "Reference Number",
            "Transaction Fee",
            "Net Amount",
            "Processing Time",
            "Batch Number",
            "Wallet Balance After",
            "Approval By"
        ];

        const rowData = [
            transaction.transactionId,
            transaction.sellerId,
            transaction.sellerName,
            transaction.date,
            transaction.type,
            transaction.amount,
            transaction.balance,
            transaction.description,
            transaction.status,
            "", // Payment Method
            "", // Reference Number
            "", // Transaction Fee
            "", // Net Amount
            "", // Processing Time
            "", // Batch Number
            transaction.balance, // Wallet Balance After
            "" // Approval By
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
        csvLink.setAttribute('download', `transaction-${transaction.transactionId}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Export Excel
        const ws = XLSX.utils.aoa_to_sheet([headers, rowData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Transaction ${transaction.transactionId}`);
        XLSX.writeFile(wb, `transaction-${transaction.transactionId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="space-y-8">
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
                                placeholder="Search transactions..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <DateRangePicker date={date} setDate={setDate} className="w-20 md:w-auto" />
                        <Button variant="outline" className="w-full md:w-auto" onClick={handleExport}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Balance:
                        <span className="font-semibold text-green-600 ml-1">
                            ₹10,000
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
                                    onClick={() => handleSort('date')}
                                    className="cursor-pointer text-black"
                                >
                                    Date
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('type')}
                                    className="cursor-pointer text-black"
                                >
                                    Type
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('amount')}
                                    className="cursor-pointer text-black"
                                >
                                    Amount
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('balance')}
                                    className="cursor-pointer text-black"
                                >
                                    Balance
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('description')}
                                    className="cursor-pointer text-black"
                                >
                                    Description
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('status')}
                                    className="cursor-pointer text-black"
                                >
                                    Status
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead className="text-black">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.map((transaction) => (
                                <TableRow key={transaction.transactionId} className="h-12">
                                    <TableCell>
                                        {transaction.transactionId}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.sellerId}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.sellerName}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.date}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                                transaction.type === 'Credit'
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            )}
                                        >
                                            {transaction.type}
                                        </span>
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "font-medium",
                                            transaction.type === 'Credit' ? "text-green-600" : "text-red-600"
                                        )}
                                    >
                                        {transaction.amount}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.balance}
                                    </TableCell>
                                    <TableCell>
                                        {transaction.description}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                                {
                                                    "bg-green-100 text-green-800": transaction.status === "completed",
                                                    "bg-yellow-100 text-yellow-800": transaction.status === "pending",
                                                    "bg-red-100 text-red-800": transaction.status === "failed"
                                                }
                                            )}
                                        >
                                            {transaction.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <EyeIcon className="size-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleExportSingleRow(transaction)}
                                        >
                                            <DownloadIcon className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default WalletHistory; 