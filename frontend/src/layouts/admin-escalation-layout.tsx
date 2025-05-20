import EscalationHeader from "@/components/admin/escalation-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

const ESCALATION_LINKS = [
    { to: "search", label: "Search" },
    { to: "statistics", label: "Statistics" },
    { to: "pickups", label: "Pickups" },
    { to: "shipments", label: "Shipments" },
    { to: "billing", label: "Billing & Remittance" },
    { to: "weight-issues", label: "Weight issues" },
    { to: "tech-issues", label: "Tech issues" },
];

const AdminEscalationLayout = () => {

    const { pathname } = useLocation();

    if (pathname === "/admin/dashboard/escalation") {
        return <Navigate to="/admin/dashboard/escalation/search" replace />;
    }

    return (
        <div className="flex flex-col w-full">
            {/* Dynamic Header */}
            <EscalationHeader />

            <div className="bg-white mt-2">
                <div className="relative flex flex-col lg:flex-row items-start lg:items-center lg:justify-between">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 w-full">
                        {ESCALATION_LINKS.map((link) => {
                            const isActive = pathname.includes(link.to);

                            return (
                                <Link
                                    to={link.to}
                                    key={link.label}
                                    className={cn(
                                        "flex items-center border-2 border-transparent rounded-lg px-4 py-1 hover:text-neutral-900 transition-colors whitespace-nowrap font-medium",
                                        isActive
                                            ? "border-main bg-main text-white hover:text-white"
                                            : "border-transparent text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Export and Filter Buttons */}
                    <div className="flex justify-end gap-4">
                        <Button variant="outline">
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <div className="py-6">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminEscalationLayout; 