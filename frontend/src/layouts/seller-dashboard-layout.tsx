import SellerDashboardNavbar from "@/components/seller/seller-dashboard-navbar";
import SellerDashboardSidebar from "@/components/seller/seller-dashboard-sidebar";
import AuthStatusIndicator from "@/components/seller/auth-status-indicator";
import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";

const SellerDashboardLayout = () => {
    return (
        <div className="min-h-screen bg-white">
            <SellerDashboardNavbar />
            <div className="flex pt-16">
                {/* Sidebar */}
                <SellerDashboardSidebar />

                {/* Main Content */}
                <main className={cn(
                    "flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)] w-[calc(100vw-4rem)] lg:w-full",
                    "pl-16 lg:pl-0"
                )}>
                    <div className="p-4 w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            {/* Debug component for development */}
            <AuthStatusIndicator />
        </div>
    );
};

export default SellerDashboardLayout; 