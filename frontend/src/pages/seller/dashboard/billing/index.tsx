import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Invoices from "./components/invoices";
import LedgerHistory from "./components/ledger-history";
import RateCard from "./components/rate-card";
import WalletHistory from "./components/wallet-history";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

const SellerBillingPage = () => {
    
    const [searchParams, setSearchParams] = useSearchParams();

    const currentTab = searchParams.get("tab") || "rate-card";

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
                Billing
            </h1>

            <Tabs defaultValue={currentTab} className="w-full" onValueChange={handleTabChange}>
                <div className="w-full z-10">
                    <div className="w-full overflow-auto scrollbar-hide max-w-[calc(100vw-64px-2rem)] mx-auto">
                        <TabsList className="w-max min-w-full p-0 h-12 z-0 bg-white rounded-none relative justify-start">
                            <div className="absolute bottom-0 w-full h-px -z-10 bg-violet-200"></div>
                            <TabsTrigger
                                value="rate-card"
                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-8"
                            >
                                Rate Card
                            </TabsTrigger>
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
                                value="ledger-history"
                                className="h-full data-[state=active]:bg-white rounded-none border-b-2 border-transparent data-[state=active]:border-black px-8"
                            >
                                Ledger History
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <div className="mt-8">
                    <TabsContent value="rate-card" className="w-full">
                        <RateCard />
                    </TabsContent>

                    <TabsContent value="wallet-history">
                        <WalletHistory />
                    </TabsContent>

                    <TabsContent value="invoices">
                        <Invoices />
                    </TabsContent>

                    <TabsContent value="ledger-history">
                        <LedgerHistory />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default SellerBillingPage; 