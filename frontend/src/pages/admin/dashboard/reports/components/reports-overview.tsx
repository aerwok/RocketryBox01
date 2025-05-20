import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { DollarSign, PackageCheck, TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { useReports } from "../../../hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";

const ReportsOverview = () => {
    const { stats, statsLoading, deliveryPartners } = useReports();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const deliveredPercent = 85; // Mock data - would come from API
    const inTransitPercent = 10;
    const pendingPercent = 5;


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue Card */}
            <Card className="h-full flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle>
                        Total Revenue
                    </CardTitle>
                    <CardDescription>
                        Last 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 mt-auto flex flex-col justify-end">
                    {statsLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-semibold flex items-center">
                                <DollarSign className="h-6 w-6 mr-1 text-blue-500" />
                                {stats ? formatCurrency(stats.totalRevenue) : '₹0'}
                            </div>
                            <p className="text-main mt-2 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                                {stats && stats.totalRevenue > 0 ? "12% from last month" : "No change"}
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Total Shipments Card */}
            <Card className="h-full flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle>
                        Total Shipments
                    </CardTitle>
                    <CardDescription>
                        Last 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 mt-auto flex flex-col justify-end">
                    {statsLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-semibold flex items-center">
                                <PackageCheck className="h-6 w-6 mr-1 text-purple-500" />
                                {stats ? stats.totalShipments.toLocaleString() : '0'}
                            </div>
                            <p className="text-main mt-2 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                                {stats && stats.totalShipments > 0 ? "8% from last month" : "No change"}
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="h-full flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle>
                        Delivery Status
                    </CardTitle>
                    <CardDescription>
                        Current month progress
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 mt-auto flex flex-col justify-end">
                    {statsLoading ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-2 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-2 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-2 w-full" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Delivered</span>
                                    <span>{deliveredPercent}%</span>
                                </div>
                                <Progress value={deliveredPercent} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>In Transit</span>
                                    <span>{inTransitPercent}%</span>
                                </div>
                                <Progress value={inTransitPercent} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Pending</span>
                                    <span>{pendingPercent}%</span>
                                </div>
                                <Progress value={pendingPercent} className="h-2" />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Pie Chart Card for Delivery Partners */}
            <Card className="flex flex-col flex-1">
                <CardHeader className="pb-0">
                    <CardTitle>
                        Courier Distribution
                    </CardTitle>
                    <CardDescription>
                        Last 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    {statsLoading ? (
                        <div className="flex justify-center items-center h-[200px]">
                            <Skeleton className="h-[200px] w-[200px] rounded-full" />
                        </div>
                    ) : (
                        <ChartContainer
                            config={{
                                value: { label: "Share" },
                                Bluedart: { label: "Bluedart", color: "#8D79F6" },
                                Delhivery: { label: "Delhivery", color: "#4FBAF0" },
                                DTDC: { label: "DTDC", color: "#FEBD38" },
                                Ekart: { label: "Ekart", color: "#FF6B6B" }
                            }}
                            className="mx-auto aspect-square max-h-[200px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={deliveryPartners}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={45}
                                    strokeWidth={8}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-2xl font-semibold"
                                                        >
                                                            {stats ? stats.totalShipments.toLocaleString() : '0'}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground"
                                                        >
                                                            Shipments
                                                        </tspan>
                                                    </text>
                                                );
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium leading-none">
                        {stats && stats.totalShipments > 0 ? "10% increase this month" : "No change this month"}
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ReportsOverview; 