import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { useEffect } from 'react';

const MarketingLayout = () => {

    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    return (
        <div className="min-h-screen flex flex-col bg-[#EEF7FF] overflow-x-hidden">
            <Navbar />
            <main className="flex-grow relative pt-20 lg:pt-28">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MarketingLayout;
