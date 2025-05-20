import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Download } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { DateRange } from "react-day-picker";
import { useReports } from "../../../hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportsChartsProps {
    date?: DateRange;
}

const ReportsCharts = ({ date }: ReportsChartsProps) => {
    const { revenueData, deliveryPartners, revenueLoading, partnersLoading, updateFilters } = useReports();

    // Handle time filter changes
    const handleTimeFilterChange = (filter: string) => {
        updateFilters({ timeFilter: filter as "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL" });
    };
    
    const getDateRangeTitle = (dateRange?: DateRange) => {
        if (!dateRange?.from || !dateRange?.to) return "This Month's";

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const fromMonth = monthNames[dateRange.from.getMonth()];
        const toMonth = monthNames[dateRange.to.getMonth()];

        if (fromMonth === toMonth && dateRange.from.getFullYear() === dateRange.to.getFullYear()) {
            return `${fromMonth}'s`;
        }

        return `${fromMonth}-${toMonth}'s`;
    };

    const getDateRangeDescription = (dateRange?: DateRange) => {
        if (!dateRange?.from || !dateRange?.to) return "Revenue growth over time";

        return `Revenue from ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-lg lg:text-xl font-semibold">
                    Performance Charts
                </h2>
                <div className="flex items-center gap-2 border rounded-md p-1">
                    {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((filter) => (
                        <Button 
                            key={filter}
                            variant="ghost" 
                            size="sm"
                            className="rounded-sm text-xs"
                            onClick={() => handleTimeFilterChange(filter)}
                        >
                            {filter}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends Chart */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>
                            {getDateRangeTitle(date)} Revenue Trends
                        </CardTitle>
                        <CardDescription>
                            {getDateRangeDescription(date)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {revenueLoading ? (
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <Skeleton className="h-[250px] w-full rounded" />
                            </div>
                        ) : (
                            <ChartContainer
                                config={{
                                    revenue: {
                                        label: "Revenue",
                                        color: "#8D79F6"
                                    }
                                }}
                                className="min-h-[300px]"
                            >
                                <AreaChart
                                    data={revenueData}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8D79F6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8D79F6" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="time"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tickMargin={10}
                                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent />}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8D79F6"
                                        fill="url(#revenueGradient)"
                                        fillOpacity={1}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Delivery Partners Share Chart */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>
                            {getDateRangeTitle(date)} Delivery Partners Share
                        </CardTitle>
                        <CardDescription>
                            Distribution from {date?.from?.toLocaleDateString() || "start"} to {date?.to?.toLocaleDateString() || "end"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        {partnersLoading ? (
                            <div className="h-[250px] w-full flex items-center justify-center">
                                <Skeleton className="h-[200px] w-[200px] rounded-full" />
                            </div>
                        ) : (
                            <div className="w-full h-[250px] flex items-center justify-center">
                                <ChartContainer
                                    config={{
                                        value: { label: "Share" },
                                        Bluedart: { label: "Bluedart", color: "#8D79F6" },
                                        Delhivery: { label: "Delhivery", color: "#4FBAF0" },
                                        DTDC: { label: "DTDC", color: "#FEBD38" },
                                        Ekart: { label: "Ekart", color: "#FF6B6B" }
                                    }}
                                    className="w-full h-full"
                                >
                                    <PieChart>
                                        <Pie
                                            data={deliveryPartners}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {deliveryPartners.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Critical Insight */}
            <div className="bg-[#0058AA1A] p-4 lg:p-6 rounded-lg">
                <h2 className="text-xl font-semibold">
                    Critical Insight
                </h2>
                <p className="text-lg mt-2">
                    {revenueData.length > 0 
                        ? "Delivery efficiency has improved by 15% since implementing the new courier selection algorithm."
                        : "Delivery delays increased by 20% this week."
                    }
                </p>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <Button 
                    variant="primary" 
                    className="bg-[#0058AA1A] text-black hover:bg-[#b9d6f1]"
                    onClick={() => window.alert("Export as CSV feature will be connected to the API")}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                </Button>
                <Button 
                    variant="primary"
                    onClick={() => window.alert("Export as PDF feature will be connected to the API")}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF
                </Button>
            </div>
        </div>
    );
};

export default ReportsCharts; 