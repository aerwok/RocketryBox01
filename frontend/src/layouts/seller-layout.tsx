import { Outlet } from 'react-router-dom';
import SellerNavbar from "@/components/seller/seller-navbar";

const SellerLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <main className="flex-grow">
                <SellerNavbar />
                <Outlet />
            </main>
        </div>
    );
};

export default SellerLayout; 