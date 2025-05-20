import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ServiceFactory } from "@/services/service-factory";
import { toast } from "sonner";

interface RateData {
    mode: string;
    withinCity: {
        base: string;
        additional: string;
        rto: string;
    };
    withinState: {
        base: string;
        additional: string;
        rto: string;
    };
    metroToMetro: {
        base: string;
        additional: string;
        rto: string;
    };
    restOfIndia: {
        base: string;
        additional: string;
        rto: string;
    };
    northEastJK: {
        base: string;
        additional: string;
        rto: string;
    };
    cod: string;
    codPercent: string;
}

const RateTable = () => {
    const [rateData, setRateData] = useState<RateData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRateCard = async () => {
            try {
                const response = await ServiceFactory.seller.billing.getRateCard();
                if (response.success) {
                    setRateData(response.data.rates);
                } else {
                    throw new Error(response.message || 'Failed to load rate card');
                }
            } catch (error) {
                console.error("Failed to load rate card:", error);
                toast.error("Failed to load rate card. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRateCard();
    }, []);

    if (isLoading) {
        return (
            <div className="w-full py-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4 text-gray-600">Loading rate card...</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto pb-4">
            <table className="w-full border-collapse text-[10px]">
                {/* Main Headers */}
                <thead>
                    <tr>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white w-[150px]" rowSpan={2}>
                            Mode/Zone
                        </th>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                            WITHIN CITY
                        </th>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                            WITHIN STATE
                        </th>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                            METRO TO METRO
                        </th>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                            REST OF INDIA
                        </th>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                            NORTH EAST,J&K
                        </th>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center">
                            COD
                        </th>
                        <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center">
                            COD%
                        </th>
                    </tr>

                    {/* Sub Headers */}
                    <tr>
                        {/* WITHIN CITY */}
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Base</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Additional</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Rto</div>
                        </th>
                        {/* WITHIN STATE */}
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Base</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Additional</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Rto</div>
                        </th>
                        {/* METRO TO METRO */}
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Base</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Additional</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Rto</div>
                        </th>
                        {/* REST OF INDIA */}
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Base</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Additional</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Rto</div>
                        </th>
                        {/* NORTH EAST,J&K */}
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Base</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Additional</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">Rto</div>
                        </th>
                        {/* COD and COD% */}
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">COD</div>
                        </th>
                        <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                            <div className="text-center">COD%</div>
                        </th>
                    </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                    {rateData.map((row, index) => (
                        <tr key={index} className={cn(
                            "text-center",
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        )}>
                            <td className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[150px]">
                                {row.mode}
                            </td>
                            {/* WITHIN CITY */}
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.withinCity.base}
                            </td>
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.withinCity.additional}
                            </td>
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.withinCity.rto}
                            </td>
                            {/* WITHIN STATE */}
                            <td className="p-1.5 border border-gray-200">
                                {row.withinState.base}
                            </td>
                            <td className="p-1.5 border border-gray-200">
                                {row.withinState.additional}
                            </td>
                            <td className="p-1.5 border border-gray-200">
                                {row.withinState.rto}
                            </td>
                            {/* METRO TO METRO */}
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.metroToMetro.base}
                            </td>
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.metroToMetro.additional}
                            </td>
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.metroToMetro.rto}
                            </td>
                            {/* REST OF INDIA */}
                            <td className="p-1.5 border border-gray-200">
                                {row.restOfIndia.base}
                            </td>
                            <td className="p-1.5 border border-gray-200">
                                {row.restOfIndia.additional}
                            </td>
                            <td className="p-1.5 border border-gray-200">
                                {row.restOfIndia.rto}
                            </td>
                            {/* NORTH EAST,J&K */}
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.northEastJK.base}
                            </td>
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.northEastJK.additional}
                            </td>
                            <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                                {row.northEastJK.rto}
                            </td>
                            {/* COD and COD% */}
                            <td className="p-1.5 border border-gray-200">
                                {row.cod}
                            </td>
                            <td className="p-1.5 border border-gray-200">
                                {row.codPercent}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RateTable; 