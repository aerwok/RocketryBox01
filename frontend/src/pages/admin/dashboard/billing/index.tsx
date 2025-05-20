import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import WalletHistory from "./components/wallet-history";
import Invoices from "./components/invoices";
import Remittance from "./components/remittance";
import ShippingCharges from "./components/shipping-charges";
import RateCard from "./components/rate-card";

const AdminBillingPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get("tab") || "wallet-history";

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    useEffect(() => {
        if (searchParams.get("tab")) {
            handleTabChange(searchParams.get("tab")!);
        }
    }, []);

    return (
        <div className="w-full space-y-8">
            <h1 className="text-xl lg:text-2xl font-semibold">
                Billing & Payments
            </h1>

            <Tabs defaultValue={currentTab} className="w-full" onValueChange={handleTabChange}>
                <div className="w-full z-10">
                    <div className="w-full overflow-auto scrollbar-hide max-w-[calc(100vw-64px-2rem)] mx-auto">
                        <TabsList className="w-max min-w-full p-0 h-12 z-0 bg-white rounded-none relative justify-start">
                            <div className="absolute bottom-0 w-full h-px -z-10 bg-violet-200"></div>
                            <TabsTrigger
                                value="wallet-history"
                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-8"
                            >
                                Wallet History
                            </TabsTrigger>
                            <TabsTrigger
                                value="invoices"
                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-8"
                            >
                                Invoices
                            </TabsTrigger>
                            <TabsTrigger
                                value="remittance"
                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-8"
                            >
                                Remittance
                            </TabsTrigger>
                            <TabsTrigger
                                value="shipping-charges"
                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-8"
                            >
                                Shipping Charges
                            </TabsTrigger>
                            <TabsTrigger
                                value="rate-card"
                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-8"
                            >
                                Rate Card
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="wallet-history" className="mt-6">
                    <WalletHistory />
                </TabsContent>

                <TabsContent value="invoices" className="mt-6">
                    <Invoices />
                </TabsContent>

                <TabsContent value="remittance" className="mt-6">
                    <Remittance />
                </TabsContent>

                <TabsContent value="shipping-charges" className="mt-6">
                    <ShippingCharges />
                </TabsContent>

                <TabsContent value="rate-card" className="mt-6">
                    <RateCard />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminBillingPage; 