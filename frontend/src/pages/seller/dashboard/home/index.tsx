import StatCard from "@/components/seller/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Box, IndianRupee, Package, TrendingUp, Truck, Download } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DateRange } from "react-day-picker";
import useDashboardData from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
    current: {
        label: "Current Week",
        color: "#8D79F6",
    },
    previous: {
        label: "Previous Week",
        color: "#B09FFF",
    },
} satisfies ChartConfig;

const pieChartConfig = {
    delivered: {
        label: "Delivered",
        color: "#8D79F6",
    },
    inTransit: {
        label: "In Transit",
        color: "#FEBD38",
    },
    pending: {
        label: "Pending",
        color: "#4FBAF0",
    },
} satisfies ChartConfig;

const lineChartConfig = {
    value: {
        label: "Revenue",
        color: "#B09FFF",
    },
} satisfies ChartConfig;

const SellerDashboardPage = () => {
    const {
        loading,
        error,
        stats,
        chartData,
        courierData,
        topProducts,
        filters,
        updateDateRange,
        downloadReport,
        refresh
    } = useDashboardData();

    const getBarChartTitle = () => {
        return "Monthly";
    };

    const getBarChartDescription = () => {
        if (filters.dateRange?.from && filters.dateRange?.to) {
            return `Current vs Previous Month (${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()})`;
        }
        return "Current vs Previous Month";
    };

    const getTopProductsTitle = () => {
        if (filters.dateRange?.from && filters.dateRange?.to) {
            const fromMonth = filters.dateRange.from.toLocaleString('default', { month: 'short' });
            const toMonth = filters.dateRange.to.toLocaleString('default', { month: 'short' });
            if (fromMonth === toMonth) {
                return `${fromMonth}'s`;
            }
            return `${fromMonth}-${toMonth}`;
        }
        return "This Month's";
    };

    const getDateRangeText = (dateObj?: DateRange) => {
        if (!dateObj?.from || !dateObj?.to) return "1M Overview";

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const fromMonth = monthNames[dateObj.from.getMonth()];
        const toMonth = monthNames[dateObj.to.getMonth()];

        if (fromMonth === toMonth) {
            return `${fromMonth} ${dateObj.from.getFullYear()} Overview`;
        }
        return `${fromMonth}-${toMonth} ${dateObj.from.getFullYear()} Overview`;
    };

    if (loading && !stats) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Array(6).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded" />
                <Skeleton className="h-80 rounded" />
                <Skeleton className="h-80 rounded" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px]">
                <div className="text-red-500 text-xl mb-4">
                    {error}
                </div>
                <Button onClick={refresh}>Retry</Button>
            </div>
        );
    }

    // Convert API data to chart format if needed
    const pieData = chartData?.orderStatusDistribution ? [
        { name: "Delivered", value: chartData.orderStatusDistribution.delivered, fill: "#8D79F6" },
        { name: "In Transit", value: chartData.orderStatusDistribution.inTransit, fill: "#FEBD38" },
        { name: "Pending", value: chartData.orderStatusDistribution.pending, fill: "#4FBAF0" },
    ] : [];

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Column 1 */}
                <div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="grid lg:grid-cols-2 gap-2">
                            <StatCard
                                title="Orders"
                                subtitle="Cancelled not included"
                                value={stats?.orders?.total?.toString() || "0"}
                                todayValue={stats?.orders?.todayCount?.toString() || "0"}
                                icon={Package}
                                href="/seller/dashboard/orders"
                            />
                            <StatCard
                                title="Shipments"
                                subtitle="Cancelled not included"
                                value={stats?.shipments?.total?.toString() || "0"}
                                todayValue={stats?.shipments?.todayCount?.toString() || "0"}
                                icon={Truck}
                                href="/seller/dashboard/shipments"
                            />
                        </div>
                    </div>
                </div>

                {/* Column 2 */}
                <div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="grid lg:grid-cols-2 gap-2">
                            <StatCard
                                title="Delivered"
                                subtitle="Successfully delivered orders"
                                value={stats?.delivery?.total?.toString() || "0"}
                                todayValue={stats?.delivery?.todayCount?.toString() || "0"}
                                icon={Box}
                                href="/seller/dashboard/shipments?tab=delivered"
                            />
                            <StatCard
                                title="Expected COD"
                                subtitle="Pending cash on delivery"
                                value={`₹${stats?.cod?.expected?.toFixed(2) || "0.00"}`}
                                additionalValue={{
                                    label: "Total Due COD",
                                    value: `₹${stats?.cod?.totalDue?.toFixed(2) || "0.00"}`
                                }}
                                icon={IndianRupee}
                                href="/seller/dashboard/cod"
                            />
                        </div>
                    </div>
                </div>

                {/* Column 3 */}
                <div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="grid lg:grid-cols-2 gap-2">
                            <StatCard
                                title="Total Revenue"
                                subtitle="Total of Delivered Shipments"
                                value={`₹${stats?.revenue?.total?.toFixed(2) || "0.00"}`}
                                additionalValue={{
                                    label: "vs. Yesterday",
                                    value: `${stats?.revenue?.dailyGrowth?.toFixed(1) || "0.0"}%`
                                }}
                                icon={TrendingUp}
                                href="/seller/dashboard/billing?tab=wallet-history"
                            />
                            <StatCard
                                title="Pending NDR"
                                subtitle="Action required + Action requested"
                                value={stats?.ndr?.pending?.toString() || "0"}
                                additionalValue={{
                                    label: "Action required",
                                    value: stats?.ndr?.actionRequired?.toString() || "0"
                                }}
                                icon={AlertTriangle}
                                href="/seller/dashboard/ndr"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h2 className="text-lg lg:text-xl font-semibold">
                        Performance Overview
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <DateRangePicker date={filters.dateRange} setDate={updateDateRange} className="w-20 md:w-auto" />
                        <Button variant="outline" className="w-full md:w-auto" onClick={() => downloadReport('pdf')}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Bar Chart */}
                    <Card className="p-2 md:p-4">
                        <CardHeader className="p-2 md:p-4">
                            <CardTitle>
                                {getBarChartTitle()} Shipment Chart
                            </CardTitle>
                            <CardDescription>
                                {getBarChartDescription()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 md:p-4">
                            <ChartContainer config={chartConfig}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData?.shipmentTrends || []}>
                                        <defs>
                                            <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#B09FFF" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#8D79F6" stopOpacity={0.4} />
                                            </linearGradient>
                                            <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#B09FFF" />
                                                <stop offset="100%" stopColor="#8D79F6" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="day"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={10}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="dashed" />}
                                        />
                                        <Bar
                                            dataKey="previous"
                                            fill="url(#previousGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="current"
                                            fill="url(#currentGradient)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2 text-sm p-2 md:p-4">
                            <div className="flex gap-2 font-medium leading-none">
                                Trending up by 35% this period <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="leading-none text-muted-foreground">
                                {getBarChartDescription()}
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Pie Chart */}
                    <Card className="flex flex-col p-2 md:p-4">
                        <CardHeader className="items-center pb-0 p-2 md:p-4">
                            <CardTitle>
                                Delivery Growth
                            </CardTitle>
                            <CardDescription>
                                {getDateRangeText(filters.dateRange)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-0 p-2 md:p-4">
                            <ChartContainer
                                config={pieChartConfig}
                                className="mx-auto aspect-square max-h-[250px]"
                            >
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col gap-2 text-sm p-2 md:p-4">
                            <div className="flex items-center gap-2 font-medium leading-none">
                                Delivery success rate up by 8.5% <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="leading-none text-muted-foreground">
                                Showing delivery status breakdown for selected period
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Line Chart */}
                    <Card className="col-span-1 p-2 md:p-4">
                        <CardHeader className="p-2 md:p-4">
                            <CardTitle>
                                Revenue Report
                            </CardTitle>
                            <CardDescription>
                                {getDateRangeText(filters.dateRange)} revenue
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 md:p-4">
                            <ChartContainer config={lineChartConfig}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart
                                        data={chartData?.revenueTrends || []}
                                        margin={{
                                            left: 12,
                                            right: 12,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#B09FFF" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#B09FFF" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="month"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={10}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent />}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#B09FFF"
                                            fill="url(#revenueGradient)"
                                            fillOpacity={1}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="p-2 md:p-4">
                            <div className="flex w-full items-start gap-2 text-sm">
                                <div className="grid gap-2">
                                    <div className="flex items-center gap-2 font-medium leading-none">
                                        Revenue up by 15% <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <div className="leading-none text-muted-foreground">
                                        {filters.dateRange?.from && filters.dateRange?.to
                                            ? `${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()}`
                                            : "January - July 2024"
                                        }
                                    </div>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Courier Wise Details Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">
                        Courier Wise Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-purple-900 hover:bg-purple-900">
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Courier
                                    </TableHead>
                                    <TableHead className="min-w-[80px] font-medium text-white">
                                        Total
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-medium text-white">
                                        Not Shipped
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Pending Pickup
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-medium text-white">
                                        In Transit
                                    </TableHead>
                                    <TableHead className="min-w-[80px] font-medium text-white">
                                        OFD
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Delivered
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Cancelled
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Exception
                                    </TableHead>
                                    <TableHead className="min-w-[80px] font-medium text-white">
                                        RTO
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Lost/Damage
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courierData?.map((row) => (
                                    <TableRow key={row.courier}>
                                        <TableCell className="font-medium">
                                            {row.courier}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {row.total}
                                        </TableCell>
                                        <TableCell>
                                            {row.notShipped}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {row.pendingPickup}
                                        </TableCell>
                                        <TableCell>
                                            {row.inTransit}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {row.ofd}
                                        </TableCell>
                                        <TableCell>
                                            {row.delivered.count} {row.delivered.percentage}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {row.cancelled.count} {row.cancelled.percentage}
                                        </TableCell>
                                        <TableCell>
                                            {row.exception.count} {row.exception.percentage}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {row.rto}
                                        </TableCell>
                                        <TableCell>
                                            {row.lostDamage}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Charts */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h2 className="text-lg lg:text-xl font-semibold">
                        Product Analysis
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <DateRangePicker date={filters.dateRange} setDate={updateDateRange} className="w-20 md:w-auto" />
                        <Button variant="outline" className="w-full md:w-auto" onClick={() => downloadReport('csv')}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Products Chart */}
                    <Card className="p-2 md:p-4">
                        <CardHeader className="p-2 md:p-4">
                            <CardTitle>{getTopProductsTitle()} Top 5 Products</CardTitle>
                            <CardDescription>Best performing products</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 md:p-4">
                            <ChartContainer config={{
                                desktop: {
                                    label: "Sales",
                                    color: "#8D79F6",
                                },
                            }}>
                                <BarChart
                                    data={chartData?.topProducts || []}
                                    accessibilityLayer
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value.slice(0, 15)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar
                                        dataKey="desktop"
                                        fill="var(--color-desktop)"
                                        radius={8}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2 text-sm p-2 md:p-4">
                            <div className="flex gap-2 font-medium leading-none">
                                iPhone 15 leads with 450 units <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="leading-none text-muted-foreground">
                                Showing top 5 products by sales volume
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Delivery Performance Chart */}
                    <Card className="p-2 md:p-4">
                        <CardHeader className="p-2 md:p-4">
                            <CardTitle>Delivery Performance</CardTitle>
                            <CardDescription>{getDateRangeText(filters.dateRange)} performance</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 md:p-4">
                            <ChartContainer config={{
                                desktop: {
                                    label: "Deliveries",
                                    color: "#8D79F6"
                                }
                            }}>
                                <LineChart
                                    data={chartData?.deliveryPerformance || []}
                                    accessibilityLayer
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => value.length > 3 ? value.slice(0, 3) : value}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Line
                                        dataKey="desktop"
                                        type="natural"
                                        stroke="var(--color-desktop)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-2 text-sm p-2 md:p-4">
                            <div className="flex gap-2 font-medium leading-none">
                                Performance improved by 18% <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="leading-none text-muted-foreground">
                                Average delivery performance: 87%
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Top 10 Products Status Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">
                        Top 10 Products Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-purple-900 hover:bg-purple-900">
                                    <TableHead className="min-w-[200px] font-medium text-white">
                                        Product Name
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-medium text-white">
                                        Quantity
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Total Shipments
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Not Shipped
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-medium text-white">
                                        Cancelled
                                    </TableHead>
                                    <TableHead className="min-w-[120px] font-medium text-white">
                                        Pending Pickup
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-medium text-white">
                                        In Transit
                                    </TableHead>
                                    <TableHead className="min-w-[100px] font-medium text-white">
                                        Delivered
                                    </TableHead>
                                    <TableHead className="min-w-[80px] font-medium text-white">
                                        RTO
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProducts?.map((product) => (
                                    <TableRow key={product.productName}>
                                        <TableCell className="font-medium">
                                            {product.productName}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {product.quantity}
                                        </TableCell>
                                        <TableCell>
                                            {product.totalShipments}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {product.notShipped}
                                        </TableCell>
                                        <TableCell>
                                            {product.cancelled}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {product.pendingPickup}
                                        </TableCell>
                                        <TableCell>
                                            {product.inTransit}
                                        </TableCell>
                                        <TableCell className="bg-purple-50">
                                            {product.delivered}
                                        </TableCell>
                                        <TableCell>
                                            {product.rto}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerDashboardPage; 