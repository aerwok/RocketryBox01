import DateRangePicker from "@/components/admin/date-range-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import ReportsCharts from "./components/reports-charts";
import ReportsOverview from "./components/reports-overview";
import ReportsTable from "./components/reports-table";
import { useReports } from "../../hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";

const AdminReportsPage = () => {
    const { loading, updateFilters, downloadReport } = useReports();
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(2024, 0, 20),
        to: new Date(2024, 1, 7),
    });

    const handleDateChange = (newDate: DateRange | undefined) => {
        setDate(newDate);
        updateFilters({ dateRange: newDate });
    };

    const handleDownload = () => {
        downloadReport("csv");
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Reports & Analytics
                </h1>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <DateRangePicker 
                        date={date} 
                        setDate={handleDateChange} 
                        className="w-20 md:w-auto" 
                    />
                    <Button 
                        variant="outline" 
                        className="w-full md:w-auto"
                        onClick={handleDownload}
                        disabled={loading}
                    >
                        {loading ? (
                            <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Download
                    </Button>
                </div>
            </div>

            {/* Tab Section */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                    {/* Overview Cards */}
                    <ReportsOverview />

                    {/* Reports Table */}
                    <ReportsTable />

                    {/* Charts Section */}
                    <ReportsCharts date={date} />
                </TabsContent>
                
                <TabsContent value="reports" className="space-y-6">
                    <ReportsTable />
                </TabsContent>
                
                <TabsContent value="analytics" className="space-y-6">
                    <ReportsCharts date={date} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminReportsPage;
