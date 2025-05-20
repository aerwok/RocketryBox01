import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Truck, DownloadIcon} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DateRange } from "react-day-picker";
import * as XLSX from 'xlsx';

interface ShippingCharge {
    sellerId: string;
    sellerName: string;
    courierName: string;
    courierMode: string;
    airwaybillNumber: string;
    orderNumber: string;
    date: string;
    time: string;
    shipmentType: string;
    productType: string;
    originPincode: string;
    destinationPincode: string;
    originCity: string;
    destinationCity: string;
    bookedWeight: string;
    volWeight: string;
    chargeableAmount: string;
    declaredValue: string;
    collectableValue: string;
    freightCharge: string;
    codCharge: string;
    amountBeforeDiscount: string;
    discount: string;
    amountAfterDiscount: string;
    status: "delivered" | "in_transit" | "out_for_delivery" | "pickup_pending" | "rto" | "cancelled";
    billableLane: string;
    customerGstState: string;
    customerGstin: string;
}

const shippingChargesData: ShippingCharge[] = [];

const ShippingCharges = () => {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof ShippingCharge;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 2, 20),
        to: new Date(2024, 2, 26),
    });

    const stats = [
        { title: "Total Shipments", amount: "0", icon: <Truck className="size-5" /> },
        { title: "Active Sellers", amount: "0", icon: <Truck className="size-5" /> },
        { title: "Total Revenue", amount: "₹0", icon: <Truck className="size-5" /> },
        { title: "Pending COD", amount: "₹0", icon: <Truck className="size-5" /> }
    ];

    const sortedData = [...shippingChargesData].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof ShippingCharge) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const handleExport = () => {
        const headers = [
            "Seller ID",
            "Seller Name",
            "Courier Name",
            "Courier Mode",
            "Airwaybill Number",
            "Order Number",
            "Date",
            "Time",
            "Shipment Type",
            "Product Type",
            "Origin Pincode",
            "Destination Pincode",
            "Origin City",
            "Destination City",
            "Booked Weight",
            "Vol. Weight",
            "Chargeable Amount",
            "Declared Value",
            "Collectable Value",
            "Freight Charge",
            "COD Charge",
            "Amount Before Discount",
            "Discount",
            "Amount After Discount",
            "Status",
            "Billable Lane",
            "Customer GST State",
            "Customer GSTIN"
        ];

        const data = shippingChargesData.map(charge => [
            charge.sellerId,
            charge.sellerName,
            charge.courierName,
            charge.courierMode,
            charge.airwaybillNumber,
            charge.orderNumber,
            charge.date,
            charge.time,
            charge.shipmentType,
            charge.productType,
            charge.originPincode,
            charge.destinationPincode,
            charge.originCity,
            charge.destinationCity,
            charge.bookedWeight,
            charge.volWeight,
            charge.chargeableAmount,
            charge.declaredValue,
            charge.collectableValue,
            charge.freightCharge,
            charge.codCharge,
            charge.amountBeforeDiscount,
            charge.discount,
            charge.amountAfterDiscount,
            charge.status,
            charge.billableLane,
            charge.customerGstState,
            charge.customerGstin
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
        csvLink.setAttribute('download', `shipping-charges-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);

        // Export Excel
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Shipping Charges");
        XLSX.writeFile(wb, `shipping-charges-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
                        <input
                            type="text"
                            placeholder="Search shipping charges..."
                            className="px-3 py-2 border rounded-md text-sm"
                        />
                        <DateRangePicker date={date} setDate={setDate} className="w-20 md:w-auto" />
                        <Button variant="outline" className="w-full md:w-auto" onClick={handleExport}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-md">
                    <Table>
                        <TableHeader className="bg-[#F4F2FF] h-12">
                            <TableRow className="hover:bg-[#F4F2FF]">
                                <TableHead onClick={() => handleSort('sellerId')} className="cursor-pointer text-black">
                                    Seller ID <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('sellerName')} className="cursor-pointer text-black">
                                    Seller Name <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('courierName')} className="cursor-pointer text-black">
                                    Courier Name <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('courierMode')} className="cursor-pointer text-black">
                                    Courier Mode <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('airwaybillNumber')} className="cursor-pointer text-black">
                                    AWB Number <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('orderNumber')} className="cursor-pointer text-black">
                                    Order Number <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('date')} className="cursor-pointer text-black">
                                    Date <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('time')} className="cursor-pointer text-black">
                                    Time <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('shipmentType')} className="cursor-pointer text-black">
                                    Shipment Type <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('productType')} className="cursor-pointer text-black">
                                    Product Type <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('originPincode')} className="cursor-pointer text-black">
                                    Origin Pincode <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('destinationPincode')} className="cursor-pointer text-black">
                                    Destination Pincode <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('originCity')} className="cursor-pointer text-black">
                                    Origin City <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('destinationCity')} className="cursor-pointer text-black">
                                    Destination City <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('bookedWeight')} className="cursor-pointer text-black">
                                    Booked Weight <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('volWeight')} className="cursor-pointer text-black">
                                    Vol. Weight <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('chargeableAmount')} className="cursor-pointer text-black">
                                    Chargeable Amount <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('declaredValue')} className="cursor-pointer text-black">
                                    Declared Value <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('collectableValue')} className="cursor-pointer text-black">
                                    Collectable Value <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('freightCharge')} className="cursor-pointer text-black">
                                    Freight Charge <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('codCharge')} className="cursor-pointer text-black">
                                    COD Charge <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('amountBeforeDiscount')} className="cursor-pointer text-black">
                                    Amount Before Discount <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('discount')} className="cursor-pointer text-black">
                                    Discount <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('amountAfterDiscount')} className="cursor-pointer text-black">
                                    Amount After Discount <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('status')} className="cursor-pointer text-black">
                                    Status <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('billableLane')} className="cursor-pointer text-black">
                                    Billable Lane <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('customerGstState')} className="cursor-pointer text-black">
                                    Customer GST State <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                                <TableHead onClick={() => handleSort('customerGstin')} className="cursor-pointer text-black">
                                    Customer GSTIN <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.map((charge) => (
                                <TableRow key={charge.airwaybillNumber} className="h-12">
                                    <TableCell>{charge.sellerId}</TableCell>
                                    <TableCell>{charge.sellerName}</TableCell>
                                    <TableCell>{charge.courierName}</TableCell>
                                    <TableCell>{charge.courierMode}</TableCell>
                                    <TableCell>{charge.airwaybillNumber}</TableCell>
                                    <TableCell>{charge.orderNumber}</TableCell>
                                    <TableCell>{charge.date}</TableCell>
                                    <TableCell>{charge.time}</TableCell>
                                    <TableCell>{charge.shipmentType}</TableCell>
                                    <TableCell>{charge.productType}</TableCell>
                                    <TableCell>{charge.originPincode}</TableCell>
                                    <TableCell>{charge.destinationPincode}</TableCell>
                                    <TableCell>{charge.originCity}</TableCell>
                                    <TableCell>{charge.destinationCity}</TableCell>
                                    <TableCell>{charge.bookedWeight}</TableCell>
                                    <TableCell>{charge.volWeight}</TableCell>
                                    <TableCell>{charge.chargeableAmount}</TableCell>
                                    <TableCell>{charge.declaredValue}</TableCell>
                                    <TableCell>{charge.collectableValue}</TableCell>
                                    <TableCell>{charge.freightCharge}</TableCell>
                                    <TableCell>{charge.codCharge}</TableCell>
                                    <TableCell>{charge.amountBeforeDiscount}</TableCell>
                                    <TableCell>{charge.discount}</TableCell>
                                    <TableCell>{charge.amountAfterDiscount}</TableCell>
                                    <TableCell>
                                        <span
                                            className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                                {
                                                    "bg-green-100 text-green-800": charge.status === "delivered",
                                                    "bg-blue-100 text-blue-800": charge.status === "in_transit",
                                                    "bg-yellow-100 text-yellow-800": charge.status === "out_for_delivery",
                                                    "bg-orange-100 text-orange-800": charge.status === "pickup_pending",
                                                    "bg-red-100 text-red-800": charge.status === "rto",
                                                    "bg-gray-100 text-gray-800": charge.status === "cancelled"
                                                }
                                            )}
                                        >
                                            {charge.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell>{charge.billableLane}</TableCell>
                                    <TableCell>{charge.customerGstState}</TableCell>
                                    <TableCell>{charge.customerGstin}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default ShippingCharges; 