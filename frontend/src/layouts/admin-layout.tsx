import AdminNavbar from '@/components/admin/admin-navbar';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-white">
            <AdminNavbar />
            <Outlet />
        </div>
    );
};

export default AdminLayout;