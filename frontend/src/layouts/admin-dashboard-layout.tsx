import AdminDashboardSidebar from '@/components/admin/admin-dashboard-sidebar';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { Outlet } from 'react-router-dom';

const AdminDashboardLayout = () => {
    
    const isExpanded = useSidebarStore((state) => state.isExpanded);

    return (
        <div className="min-h-screen bg-white">
            <div className="flex pt-16">
                {/* Sidebar */}
                <AdminDashboardSidebar />

                {/* Main Content */}
                <main className={cn(
                    "flex-1 p-4 lg:p-6 transition-all duration-300 min-h-[calc(100vh-4rem)] w-[calc(100dvw-4rem)] lg:w-full",
                    isExpanded ? "lg:pl-64" : "lg:pl-16",
                    "pl-20 lg:pl-4"
                )}>
                    <div className="lg:p-4 w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardLayout; 