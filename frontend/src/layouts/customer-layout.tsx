import { Outlet } from 'react-router-dom';
import CustomerNavbar from '@/components/customer/customer-navbar';
import { ReactNode, useEffect, useState } from 'react';

interface CustomerLayoutProps {
    children?: ReactNode;
}

const CustomerLayout = ({ children }: CustomerLayoutProps) => {
    const [isDevBypass, setIsDevBypass] = useState(false);

    useEffect(() => {
        // Check if we're using the development bypass token
        const token = localStorage.getItem('customer_token');
        if (token === 'DEVELOPMENT_BYPASS_TOKEN') {
            setIsDevBypass(true);
        }
    }, []);

    return (
        <div className="min-h-[100dvh] flex flex-col bg-white">
            <CustomerNavbar />
            {isDevBypass && (
                <div className="bg-yellow-500 text-black py-1 text-center text-sm font-medium">
                    DEVELOPMENT MODE: Customer Authentication Bypassed - REMOVE BEFORE DEPLOYMENT!
                </div>
            )}
            <main className={`flex-grow ${isDevBypass ? 'pt-[calc(4rem+24px)]' : 'pt-16'}`}>
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default CustomerLayout;
