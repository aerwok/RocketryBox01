import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, FileText, DownloadIcon, EyeIcon, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DateRange } from "react-day-picker";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";

interface Invoice {
    id: string;
    invoiceNumber: string;
    sellerId: string;
    sellerName: string;
    date: string;
    dueDate: string;
    amount: string;
    customer: string;
    type: string;
    status: "paid" | "pending" | "overdue";
}

const invoiceData: Invoice[] = [];

const Invoices = () => {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Invoice;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");

    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 2, 20),
        to: new Date(2024, 2, 26),
    });

    const stats = [
        { title: "Total Invoices", amount: "0", icon: <FileText className="size-5" /> },
        { title: "Pending Amount", amount: "₹0", icon: <FileText className="size-5" /> },
        { title: "Overdue Amount", amount: "₹0", icon: <FileText className="size-5" /> },
        { title: "Active Sellers", amount: "0", icon: <FileText className="size-5" /> }
    ];

    const filteredData = invoiceData.filter(invoice => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
            invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
            invoice.sellerId.toLowerCase().includes(searchLower) ||
            invoice.sellerName.toLowerCase().includes(searchLower) ||
            invoice.date.toLowerCase().includes(searchLower) ||
            invoice.dueDate.toLowerCase().includes(searchLower) ||
            invoice.amount.toLowerCase().includes(searchLower) ||
            invoice.customer.toLowerCase().includes(searchLower) ||
            invoice.type.toLowerCase().includes(searchLower) ||
            invoice.status.toLowerCase().includes(searchLower)
        );

        // Date range filter
        const invoiceDate = new Date(invoice.date);
        const matchesDateRange = !date?.from || !date?.to || 
            (invoiceDate >= date.from && invoiceDate <= date.to);

        return matchesSearch && matchesDateRange;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof Invoice) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleExport = () => {
        const headers = [
            "Invoice Number",
            "Seller ID",
            "Seller Name",
            "Date",
            "Due Date",
            "Amount",
            "Customer",
            "Type",
            "Status",
            "GSTIN",
            "PAN",
            "Payment Method",
            "Description",
            "Tax Rate",
            "Tax Amount",
            "Subtotal",
            "Discount",
            "Total",
            "Terms",
            "Notes"
        ];

        const data: string[][] = [];

        // Export CSV
        const csvContent = [
            headers.join(","),
            ...data.map(row => row.join(","))
        ].join("\n");

        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.setAttribute('href', csvUrl);
        csvLink.setAttribute('download', `invoices-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Export Excel
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoices");
        XLSX.writeFile(wb, `invoices-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleExportSingleInvoice = (invoice: Invoice) => {
        const headers = [
            "Invoice Number",
            "Seller ID",
            "Seller Name",
            "Date",
            "Due Date",
            "Amount",
            "Customer",
            "Type",
            "Status",
            "GSTIN",
            "PAN",
            "Payment Method",
            "Description",
            "Tax Rate",
            "Tax Amount",
            "Subtotal",
            "Discount",
            "Total",
            "Terms",
            "Notes"
        ];

        const rowIndex = parseInt(invoice.id) - 1;
        const dataIndex = (rowIndex >= 0 && rowIndex < 3) ? rowIndex : 0;

        const invoiceDetails = [
            ["INV-2024-001", "SLR001", "Prime Merchants", "2024-03-26", "2024-04-26", "₹5000", "Acme Corp", "Shipping", "paid", "29AADCB2230M1ZP", "AADCB2230M", "Bank Transfer", "Shipping Services", "18%", "₹762.71", "₹4,237.29", "₹0", "₹5,000", "Net 30 days", "Thank you for your business"],
            ["INV-2024-002", "SLR002", "Express Retail", "2024-03-25", "2024-04-25", "₹7500", "Tech Solutions", "Service", "pending", "07AAACP3682N1ZD", "AAACP3682N", "Credit Card", "Packaging Services", "18%", "₹1,144.07", "₹6,355.93", "₹0", "₹7,500", "Net 30 days", "Thank you for your business"],
            ["INV-2024-003", "SLR003", "Global Trade", "2024-03-24", "2024-04-24", "₹12500", "Global Industries", "Shipping", "overdue", "33AAACR4849R1ZL", "AAACR4849R", "Bank Transfer", "Shipping and Handling", "18%", "₹1,906.78", "₹10,593.22", "₹0", "₹12,500", "Net 30 days", "Thank you for your business"],
        ][dataIndex];

        // Export CSV
        const csvContent = [
            headers.join(","),
            invoiceDetails.join(",")
        ].join("\n");

        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.setAttribute('href', csvUrl);
        csvLink.setAttribute('download', `invoice-${invoice.invoiceNumber}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Export Excel
        const ws = XLSX.utils.aoa_to_sheet([headers, invoiceDetails]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Invoice ${invoice.invoiceNumber}`);
        XLSX.writeFile(wb, `invoice-${invoice.invoiceNumber}-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
                                placeholder="Search invoices..."
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
                        Total Outstanding:
                        <span className="font-semibold text-amber-600 ml-1">
                            ₹25,000
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-md">
                    <Table>
                        <TableHeader className="bg-[#F4F2FF] h-12">
                            <TableRow className="hover:bg-[#F4F2FF]">
                                <TableHead
                                    onClick={() => handleSort('invoiceNumber')}
                                    className="cursor-pointer text-black"
                                >
                                    Invoice Number
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
                                    onClick={() => handleSort('dueDate')}
                                    className="cursor-pointer text-black"
                                >
                                    Due Date
                                    <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('customer')}
                                    className="cursor-pointer text-black"
                                >
                                    Customer
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
                            {sortedData.map((invoice) => (
                                <TableRow key={invoice.id} className="h-12">
                                    <TableCell>
                                        {invoice.invoiceNumber}
                                    </TableCell>
                                    <TableCell>
                                        {invoice.sellerId}
                                    </TableCell>
                                    <TableCell>
                                        {invoice.sellerName}
                                    </TableCell>
                                    <TableCell>
                                        {invoice.date}
                                    </TableCell>
                                    <TableCell>
                                        {invoice.dueDate}
                                    </TableCell>
                                    <TableCell>
                                        {invoice.customer}
                                    </TableCell>
                                    <TableCell>
                                        {invoice.type}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {invoice.amount}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                                {
                                                    "bg-green-100 text-green-800": invoice.status === "paid",
                                                    "bg-yellow-100 text-yellow-800": invoice.status === "pending",
                                                    "bg-red-100 text-red-800": invoice.status === "overdue"
                                                }
                                            )}
                                        >
                                            {invoice.status}
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
                                            onClick={() => handleExportSingleInvoice(invoice)}
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

export default Invoices; 