import { useState, useEffect } from "react";
import { ServiceFactory } from "@/services/service-factory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReportStats {
    totalRevenue: number;
    totalShipments: number;
    monthlyGrowth: {
        revenue: number;
        shipments: number;
    };
}

interface ReportChartData {
    date: string;
    value: number;
}

interface DeliveryPartnerShare {
    name: string;
    value: number;
    fill: string;
}

const DashboardAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "ALL">("1M");
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [revenueData, setRevenueData] = useState<ReportChartData[]>([]);
    const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerShare[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch report statistics
                const statsResponse = await ServiceFactory.admin.getReportStats();
                if (statsResponse.success) {
                    setStats(statsResponse.data);
                }

                // Fetch revenue data
                const revenueResponse = await ServiceFactory.admin.getRevenueData({
                    timeFilter,
                    from: getDateFromTimeFilter(timeFilter),
                    to: new Date().toISOString()
                });
                if (revenueResponse.success) {
                    setRevenueData(revenueResponse.data);
                }

                // Fetch delivery partner data
                const partnersResponse = await ServiceFactory.admin.getDeliveryPartners();
                if (partnersResponse.success) {
                    setDeliveryPartners(partnersResponse.data);
                }
            } catch (err) {
                console.error("Error fetching analytics data:", err);
                setError("Failed to load analytics data. Please try again.");
                toast.error("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeFilter]);

    const getDateFromTimeFilter = (filter: string): string => {
        const now = new Date();
        switch (filter) {
            case "1D":
                return new Date(now.setDate(now.getDate() - 1)).toISOString();
            case "1W":
                return new Date(now.setDate(now.getDate() - 7)).toISOString();
            case "1M":
                return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
            case "3M":
                return new Date(now.setMonth(now.getMonth() - 3)).toISOString();
            case "1Y":
                return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
            default:
                return new Date(0).toISOString();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading analytics data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-red-50 border-red-200 p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Analytics</h3>
                <p className="text-red-700 text-center mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1D">Last 24 Hours</SelectItem>
                        <SelectItem value="1W">Last 7 Days</SelectItem>
                        <SelectItem value="1M">Last 30 Days</SelectItem>
                        <SelectItem value="3M">Last 3 Months</SelectItem>
                        <SelectItem value="1Y">Last Year</SelectItem>
                        <SelectItem value="ALL">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.monthlyGrowth?.revenue ? (stats.monthlyGrowth.revenue > 0 ? '+' : '') + stats.monthlyGrowth.revenue : 0}% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalShipments?.toLocaleString() ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.monthlyGrowth?.shipments ? (stats.monthlyGrowth.shipments > 0 ? '+' : '') + stats.monthlyGrowth.shipments : 0}% from last month
                        </p>
                    </CardContent>
                </Card>

                {/* Add more cards for other metrics */}
            </div>

            {/* Revenue Chart */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {revenueData.length > 0 ? (
                            <div className="flex items-end h-full gap-2">
                                {revenueData.map((item, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div 
                                            className="w-full bg-blue-500 rounded-t"
                                            style={{ 
                                                height: `${(item.value / Math.max(...revenueData.map(d => d.value))) * 100}%`,
                                                minHeight: '4px'
                                            }}
                                        />
                                        <span className="text-xs mt-2 text-muted-foreground">
                                            {new Date(item.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No revenue data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Partners Distribution */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Delivery Partner Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {deliveryPartners.length > 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="grid grid-cols-2 gap-4">
                                    {deliveryPartners.map((partner, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: partner.fill }}
                                            />
                                            <span className="text-sm">{partner.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                ({partner.value}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No delivery partner data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardAnalytics; 