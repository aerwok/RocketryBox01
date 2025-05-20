import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Download, FileText, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const reportTypes = [
    {
        id: "sales",
        title: "Sales Report",
        description: "View your sales performance and revenue trends",
        icon: TrendingUp,
    },
    {
        id: "shipments",
        title: "Shipment Report",
        description: "Track shipment status and delivery performance",
        icon: Package,
    },
    {
        id: "ndr",
        title: "NDR Report",
        description: "Monitor non-delivery reports and resolution status",
        icon: AlertTriangle,
    },
    {
        id: "billing",
        title: "Billing Report",
        description: "View billing history and payment status",
        icon: FileText,
    },
];

const SellerReportsPage = () => {
    const [selectedReport, setSelectedReport] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const handleGenerateReport = () => {
        if (!selectedReport) {
            toast.error("Please select a report type");
            return;
        }

        if (!dateRange?.from || !dateRange?.to) {
            toast.error("Please select a date range");
            return;
        }

        // Simulate report generation
        toast.success("Report generated successfully!");
    };

    const handleDownloadReport = () => {
        if (!selectedReport) {
            toast.error("Please select a report type");
            return;
        }

        // Simulate report download
        toast.success("Report downloaded successfully!");
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Reports
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="size-4" />
                    <span>Generate and download reports</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report) => (
                    <Card
                        key={report.id}
                        className={cn(
                            "cursor-pointer transition-colors",
                            selectedReport === report.id && "border-primary"
                        )}
                        onClick={() => setSelectedReport(report.id)}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <report.icon className="size-5" />
                                {report.title}
                            </CardTitle>
                            <CardDescription>{report.description}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>
                        Select report type and date range to generate a report
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Report Type</label>
                            <Select
                                value={selectedReport}
                                onValueChange={setSelectedReport}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select report type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map((report) => (
                                        <SelectItem key={report.id} value={report.id}>
                                            {report.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Range</label>
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={handleGenerateReport}>
                            Generate Report
                        </Button>
                        <Button variant="outline" onClick={handleDownloadReport}>
                            <Download className="size-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerReportsPage; 