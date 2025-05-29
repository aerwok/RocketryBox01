import { Outlet } from 'react-router-dom';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { ReactNode } from 'react';

interface CustomerLayoutProps {
    children?: ReactNode;
}

const CustomerLayout = ({ children }: CustomerLayoutProps) => {
    return (
        <div className="min-h-[100dvh] flex flex-col bg-white">
            <CustomerNavbar />
            <main className="flex-grow pt-16">
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default CustomerLayout;
