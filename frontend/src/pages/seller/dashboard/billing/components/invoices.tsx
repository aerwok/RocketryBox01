import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Download, Search, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DateRange } from "react-day-picker";
import { Loader2 } from "lucide-react";
import { ServiceFactory } from "@/services/service-factory";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => any;
        lastAutoTable: {
            finalY: number;
        };
    }
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    period: string;
    shipments: number;
    amount: string;
}

interface InvoiceSummary {
    totalInvoices: number;
    pendingAmount: string;
    overdueAmount: string;
    totalPaid: string;
    totalOutstanding: string;
}

const Invoices = () => {
    const [invoiceData, setInvoiceData] = useState<Invoice[]>([]);
    const [summary, setSummary] = useState<InvoiceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sortConfig, setSortConfig] = useState<{
        key: keyof Invoice;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState("");

    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 3)), // Last 3 months
        to: new Date(),
    });

    useEffect(() => {
        fetchInvoiceData();
    }, [date]);

    const fetchInvoiceData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Format dates for API query
            const fromDate = date?.from ? date.from.toISOString().split('T')[0] : '';
            const toDate = date?.to ? date.to.toISOString().split('T')[0] : '';
            
            const response = await ServiceFactory.seller.billing.getInvoices({
                from: fromDate,
                to: toDate
            });
            
            const summaryResponse = await ServiceFactory.seller.billing.getInvoiceSummary({
                from: fromDate,
                to: toDate
            });
            
            if (response.success && summaryResponse.success) {
                setInvoiceData(response.data.invoices);
                setSummary(summaryResponse.data.summary);
            } else {
                throw new Error(response.message || 'Failed to fetch invoice data');
            }
        } catch (err) {
            console.error('Error fetching invoice data:', err);
            setError('Failed to load invoice data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { title: "Total Invoices", amount: summary ? summary.totalInvoices.toString() : "0", icon: <FileText className="size-5" /> },
        { title: "Pending Amount", amount: summary ? summary.pendingAmount : "₹0", icon: <FileText className="size-5" /> },
        { title: "Overdue Amount", amount: summary ? summary.overdueAmount : "₹0", icon: <FileText className="size-5" /> },
        { title: "Total Paid", amount: summary ? summary.totalPaid : "₹0", icon: <FileText className="size-5" /> }
    ];

    const filteredData = invoiceData.filter(invoice => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (
            invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
            invoice.period.toLowerCase().includes(searchLower) ||
            invoice.shipments.toString().includes(searchLower) ||
            invoice.amount.toLowerCase().includes(searchLower)
        );

        return matchesSearch;
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

    const handleDownloadInvoice = async (invoice: Invoice) => {
        try {
            setLoading(true);
            
            const response = await ServiceFactory.seller.billing.downloadInvoice(invoice.id);
            if (response.success) {
                // Generate PDF invoice
                generatePdfInvoice(invoice);
                
                // Download shipment data
                const shipmentResponse = await ServiceFactory.seller.billing.downloadShipments(invoice.id);
                if (shipmentResponse.success) {
                    const blob = new Blob([shipmentResponse.data], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `invoice-${invoice.invoiceNumber}-shipments.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);
                }
            } else {
                throw new Error(response.message || 'Failed to download invoice');
            }
        } catch (err) {
            console.error('Error downloading invoice:', err);
            alert('Failed to download invoice. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Function to generate PDF invoice
    const generatePdfInvoice = (invoice: Invoice) => {
        try {
            // Initialize jsPDF
            const doc = new jsPDF();
            
            // Add logo and header
            doc.setFillColor(255, 255, 255);
            doc.rect(10, 10, 190, 45, 'F');
            
            // Logo and company details
            doc.setFontSize(22);
            doc.setTextColor(76, 29, 149); // Purple color
            doc.text("RocketryBox", 55, 25);
            
            // Company details
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("BigFoot Retail Solutions Pvt. Ltd.", 15, 35);
            doc.text("Plot No. B, Khasra-360, Sultanpur, MG Road, New Delhi, Delhi 110030", 15, 40);
            doc.text("Phone: +91-9266623006", 15, 45);
            doc.text("Email: support@rocketrybox.in", 15, 50);
            
            // TAX INVOICE and PAID status
            doc.setFontSize(12);
            doc.text("TAX INVOICE", 150, 35);
            doc.setTextColor(0, 128, 0); // Green for PAID
            doc.setFontSize(16);
            doc.text("PAID", 150, 45);
            
            // Company identifiers
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("PAN Number:", 15, 60);
            doc.text("AAECB7131Q", 55, 60);
            
            doc.text("CIN Number:", 15, 65);
            doc.text("U72900DL2011PTC225614", 55, 65);
            
            doc.text("GSTIN:", 15, 70);
            doc.text("07AAECB7131Q1ZC", 55, 70);
            
            // Invoice details
            doc.text("Invoice No.:", 130, 60);
            doc.text(`RKB/20-21/${invoice.id.padStart(5, '0')}`, 160, 60);
            
            // Generate a date in the format DD/MM/YYYY based on the period
            const periodParts = invoice.period.split(' - ');
            const invoiceDate = new Date(periodParts[1]);
            const invoiceDateStr = `${invoiceDate.getDate().toString().padStart(2, '0')}/${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}/${invoiceDate.getFullYear()}`;
            
            doc.text("Invoice Date:", 130, 65);
            doc.text(invoiceDateStr, 160, 65);
            
            // Due date (7 days after invoice date)
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 7);
            const dueDateStr = `${dueDate.getDate().toString().padStart(2, '0')}/${(dueDate.getMonth() + 1).toString().padStart(2, '0')}/${dueDate.getFullYear()}`;
            
            doc.text("Due Date:", 130, 70);
            doc.text(dueDateStr, 160, 70);
            
            // Line separator
            doc.setDrawColor(0, 0, 0);
            doc.line(10, 75, 200, 75);
            
            // Invoice To section
            doc.text("Invoice To:", 15, 85);
            
            // Generate a random client name and address
            const clientNames = ["RAUSHAN DWIVEDI", "RAJESH KUMAR", "PRIYA SHARMA", "AMIT PATEL", "VIKRAM SINGH"];
            const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
            
            doc.setFontSize(10);
            doc.text(clientName, 15, 90);
            doc.text("Barwat Prasarain Near Badal Hotel West Champaran", 15, 95);
            doc.text("Bihar - 845438", 15, 100);
            
            // State code and supply details
            doc.text("State Code:", 130, 85);
            doc.text("10", 160, 85);
            
            doc.text("Place of Supply:", 130, 90);
            doc.text("Bihar", 160, 90);
            
            doc.text("Reverse Charge:", 130, 95);
            doc.text("No", 160, 95);
            
            // Line separator
            doc.line(10, 105, 200, 105);
            
            // Calculate GST (18%)
            const amountValue = parseFloat(invoice.amount.replace(/[₹,]/g, ''));
            const gstAmount = amountValue * 0.18;
            const total = amountValue + gstAmount;
            
            // Manual table creation without autoTable
            // Table header
            doc.setFillColor(244, 242, 255);
            doc.rect(10, 110, 180, 10, 'F');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text("SAC No.", 15, 117);
            doc.text("Description", 60, 117);
            doc.text("Total", 170, 117, {align: 'right'});
            
            // Line after header
            doc.line(10, 120, 190, 120);
            
            // Table data rows
            const sacNumber = `${996800 + Math.floor(Math.random() * 100)}`;
            doc.text(sacNumber, 15, 130);
            doc.text("RocketryBox V2 Freight", 60, 130);
            doc.text(`₹${(amountValue - gstAmount).toFixed(2)}`, 170, 130, {align: 'right'});
            
            // Line after first row
            doc.line(10, 135, 190, 135);
            
            // GST row
            doc.text("", 15, 145);
            doc.text("18.00% IGST", 60, 145);
            doc.text(`₹${gstAmount.toFixed(2)}`, 170, 145, {align: 'right'});
            
            // Line after GST row
            doc.line(10, 150, 190, 150);
            
            // Total row
            doc.text("", 15, 160);
            doc.text("Grand Total Value", 60, 160);
            // Set font to bold for the total amount
            doc.setFont('helvetica', 'bold');
            doc.text(`₹${total.toFixed(2)}`, 170, 160, {align: 'right'});
            // Reset font back to normal
            doc.setFont('helvetica', 'normal');
            
            // Line after total row
            doc.line(10, 165, 190, 165);
            
            // Transaction details section 
            doc.setFillColor(244, 242, 255);
            doc.rect(10, 180, 180, 10, 'F');
            doc.text("Transaction Date", 15, 187);
            doc.text("Gateway", 60, 187);
            doc.text("Transaction ID", 105, 187);
            doc.text("Amount", 170, 187, {align: 'right'});
            
            // Line after transaction header
            doc.line(10, 190, 190, 190);
            
            // Transaction data
            doc.text(invoiceDateStr, 15, 200);
            doc.text("Credit Balance", 60, 200);
            doc.text("NA", 105, 200);
            doc.text(`₹${total.toFixed(2)}`, 170, 200, {align: 'right'});
            
            // Line after transaction row
            doc.line(10, 205, 190, 205);
            
            // Amount due row
            doc.text("", 15, 215);
            doc.text("", 60, 215);
            doc.text("Amount Due", 105, 215);
            doc.text("₹0.00", 170, 215, {align: 'right'});
            
            // Bank details section
            doc.text("Bank and Other Commercial Details", 15, 230);
            doc.line(10, 235, 190, 235);
            
            doc.text("All Payments by transfer/check/DD should be draw in favour of", 15, 245);
            doc.text("Entity Name:", 15, 255);
            doc.text("RocketryBox", 70, 255);
            
            doc.text("Account number:", 15, 265);
            doc.text("BFRS827787", 70, 265);
            
            doc.text("Bank:", 15, 275);
            doc.text("others", 70, 275);
            
            doc.text("Branch:", 15, 285);
            doc.text("others", 70, 285);
            
            doc.text("RTGS/NEFT/IFSC Code:", 15, 295);
            doc.text("ICIC0000104", 70, 295);
            
            // Footer note
            doc.text("* Indicates taxable item", 140, 305);
            
            // Add download instructions with a link
            doc.setDrawColor(0, 0, 0);
            doc.line(10, 315, 190, 315);
            doc.setTextColor(76, 29, 149); // Purple color
            doc.setFontSize(11);
            doc.text("To download shipment data as Excel:", 15, 325);
            
            // Create a clickable link to download Excel
            const downloadUrl = `/api/seller/billing/invoices/${invoice.id}/shipments?format=excel`;
            doc.setTextColor(0, 0, 255); // Blue for link
            doc.textWithLink("Click here to download Excel file", 15, 335, { url: downloadUrl });
            
            // Add manual URL for copying
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.text("Or visit:", 15, 345);
            doc.text(`${window.location.origin}${downloadUrl}`, 40, 345);
            
            // Add explanation text
            doc.text("Note: Excel file contains detailed shipment data for this invoice period.", 15, 355);
            
            // Generate invoice name with invoice number
            const fileName = `Invoice-${invoice.invoiceNumber}.pdf`;
            
            // Save the PDF
            doc.save(fileName);
            
        } catch (error) {
            console.error('Error generating PDF invoice:', error);
            throw new Error('Failed to generate PDF invoice');
        }
    };

    const handleRefresh = () => {
        fetchInvoiceData();
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
                        <DateRangePicker date={date} setDate={setDate} className="w-full md:w-auto" />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total Outstanding:
                        <span className="font-semibold text-amber-600 ml-1">
                            {summary ? summary.totalOutstanding : "₹0"}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-md flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-medium">{error}</p>
                            <p className="text-sm mt-1">You are viewing mock data for demonstration purposes. Real data will be available when the API connection is restored.</p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto border rounded-md">
                    <Table>
                        <TableHeader className="bg-[#F4F2FF] h-12">
                            <TableRow className="hover:bg-[#F4F2FF] border-b border-purple-100">
                                <TableHead className="text-black w-[5%] whitespace-nowrap font-semibold text-sm">
                                    #
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('period')}
                                    className="cursor-pointer text-black w-[30%] whitespace-nowrap font-semibold text-sm"
                                >
                                    <div className="flex items-center">
                                        INVOICE PERIOD
                                        <ArrowUpDown className="ml-1 h-4 w-4 text-purple-500" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('shipments')}
                                    className="cursor-pointer text-black w-[15%] whitespace-nowrap font-semibold text-sm text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        SHIPMENTS
                                        <ArrowUpDown className="ml-1 h-4 w-4 text-purple-500" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('invoiceNumber')}
                                    className="cursor-pointer text-black w-[20%] whitespace-nowrap font-semibold text-sm"
                                >
                                    <div className="flex items-center">
                                        INVOICE NUMBER
                                        <ArrowUpDown className="ml-1 h-4 w-4 text-purple-500" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    onClick={() => handleSort('amount')}
                                    className="cursor-pointer text-black w-[15%] whitespace-nowrap font-semibold text-sm text-right"
                                >
                                    <div className="flex items-center justify-end">
                                        AMOUNT
                                        <ArrowUpDown className="ml-1 h-4 w-4 text-purple-500" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-black w-[15%] whitespace-nowrap font-semibold text-sm text-center">
                                    DOWNLOAD
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                            Loading invoices...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedData.length > 0 ? (
                                sortedData.map((invoice, index) => (
                                    <TableRow key={invoice.id} className="h-12">
                                        <TableCell className="w-[5%] text-center">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="w-[30%]">
                                            {invoice.period}
                                        </TableCell>
                                        <TableCell className="w-[15%] text-center">
                                            {invoice.shipments}
                                        </TableCell>
                                        <TableCell className="font-medium w-[20%]">
                                            {invoice.invoiceNumber}
                                        </TableCell>
                                        <TableCell className="font-medium w-[15%] text-right">
                                            {invoice.amount}
                                        </TableCell>
                                        <TableCell className="w-[15%] text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:text-purple-600 flex items-center gap-1"
                                                    onClick={() => handleDownloadInvoice(invoice)}
                                                    title="Download PDF Invoice"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    PDF
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No invoices found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default Invoices; 