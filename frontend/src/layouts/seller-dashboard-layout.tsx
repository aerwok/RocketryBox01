import SellerDashboardNavbar from "@/components/seller/seller-dashboard-navbar";
import SellerDashboardSidebar from "@/components/seller/seller-dashboard-sidebar";
import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const SellerDashboardLayout = () => {
    const [isDevBypass, setIsDevBypass] = useState(false);

    useEffect(() => {
        // Check if we're using the development bypass token
        const token = localStorage.getItem('seller_token');
        if (token === 'DEVELOPMENT_BYPASS_TOKEN') {
            setIsDevBypass(true);
        }
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <SellerDashboardNavbar />
            {isDevBypass && (
                <div className="bg-yellow-500 text-black py-1 text-center text-sm font-medium fixed top-16 left-0 right-0 z-50">
                    DEVELOPMENT MODE: Seller Authentication Bypassed - REMOVE BEFORE DEPLOYMENT!
                </div>
            )}
            <div className={`flex ${isDevBypass ? 'pt-[calc(4rem+24px)]' : 'pt-16'}`}>
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
        </div>
    );
};

export default SellerDashboardLayout; 