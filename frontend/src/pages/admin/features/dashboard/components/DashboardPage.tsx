import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import DateRangePicker from "@/components/admin/date-range-picker";
import { DashboardCard } from "../../../components/common/DashboardCard";
import { DataTable, Column } from "../../../components/common/DataTable";
import { LoadingState } from "../../../components/common/LoadingState";
import { ErrorState } from "../../../components/common/ErrorState";
import { useDashboard } from "../../../hooks/useDashboard";
import { Order, Shipment } from "../../../types/dashboard";

const orderColumns: Column<Order>[] = [
    { key: "id", header: "Order ID", sortable: true },
    { key: "userId", header: "Customer Name", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "status", header: "Status", sortable: true },
    { key: "amount", header: "Amount", sortable: true }
];

const shipmentColumns: Column<Shipment>[] = [
    { key: "id", header: "Shipment ID", sortable: true },
    { key: "trackingNumber", header: "Tracking Number", sortable: true },
    { key: "status", header: "Status", sortable: true },
    { key: "origin", header: "Origin", sortable: true },
    { key: "destination", header: "Destination", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "courier", header: "Courier", sortable: true }
];

export const DashboardPage = () => {
    const {
        loading,
        error,
        stats,
        filters,
        orders,
        shipments,
        updateFilters,
        downloadReport,
        refresh
    } = useDashboard();

    if (loading) {
        return <LoadingState message="Loading dashboard data..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={refresh} />;
    }

    const dashboardCards = stats ? [
        {
            title: "Total Shipments",
            value: stats.totalShipments,
            change: `${stats.monthlyGrowth.shipments}% from last month`,
            icon: "📦"
        },
        {
            title: "Revenue",
            value: `$${stats.revenue.toLocaleString()}`,
            change: `${stats.monthlyGrowth.revenue}% from last month`,
            icon: "💰"
        },
        {
            title: "Pending Orders",
            value: stats.pendingOrders,
            change: "Orders awaiting processing",
            icon: "⏳"
        },
        {
            title: "Active Users",
            value: stats.activeUsers,
            change: `${stats.monthlyGrowth.users}% from last month`,
            icon: "👥"
        },
        {
            title: "New Users",
            value: stats.newUsers,
            change: "This month",
            icon: "✨"
        }
    ] : [];

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Dashboard
                </h1>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <DateRangePicker
                        date={filters.dateRange}
                        setDate={(date) => updateFilters({ dateRange: date })}
                        className="w-20 md:w-auto"
                    />
                    <Button
                        variant="outline"
                        className="w-full md:w-auto"
                        onClick={() => downloadReport("csv")}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {dashboardCards.map((card) => (
                    <DashboardCard key={card.title} card={card} />
                ))}
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="space-y-4">
                    <h2 className="text-lg lg:text-xl font-semibold">
                        Recent Orders
                    </h2>
                    <DataTable
                        data={orders}
                        columns={orderColumns}
                        searchKey="userId"
                    />
                </div>

                {/* Shipments */}
                <div className="space-y-4">
                    <h2 className="text-lg lg:text-xl font-semibold">
                        Shipments
                    </h2>
                    <DataTable
                        data={shipments}
                        columns={shipmentColumns}
                        searchKey="trackingNumber"
                    />
                </div>
            </div>
        </div>
    );
}; 