import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateShippingRate, determineZone } from "@/lib/shipping-calculator";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RateData } from "@/types/shipping";

interface ShippingOptionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    singleOrderId: string;
    onSubmit: (data: {
        courier: string;
        mode: string;
        charges: {
            shippingCharge: number;
            codCharge: number;
            gst: number;
            total: number;
        };
    }) => void;
    isCOD?: boolean;
}

export function ShippingOptionsModal({
    open,
    onOpenChange,
    singleOrderId,
    onSubmit,
    isCOD = false
}: ShippingOptionsModalProps) {
    const [warehouse, setWarehouse] = useState("400001");
    const [rtoWarehouse, setRtoWarehouse] = useState("400001");
    const [showAddress, setShowAddress] = useState(false);
    const [selectedCourier, setSelectedCourier] = useState("");
    const [selectedMode, setSelectedMode] = useState("");
    const [courierRates, setCourierRates] = useState<any[]>([]);
    const [currentZone, setCurrentZone] = useState("");
    
    const destinationPincode = "110001";
    const weight = 0.5;

    const { data: rateData, isLoading } = useQuery<RateData[]>({
        queryKey: ['rateCards'],
        queryFn: async () => {
            const response = await fetch('/api/rate-cards');
            if (!response.ok) {
                throw new Error('Failed to fetch rate cards');
            }
            return response.json();
        }
    });

    useEffect(() => {
        const calculateRates = async () => {
            if (!rateData) return;

            const zone = determineZone(warehouse, destinationPincode);
            setCurrentZone(zone);

            const rates = await Promise.all(
                rateData.map(async rateCard => {
                    try {
                        const rates = await calculateShippingRate(
                            warehouse,
                            destinationPincode,
                            weight,
                            rateCard.mode,
                            isCOD,
                            rateData
                        );

                        return {
                            mode: rateCard.mode,
                            courier: rateCard.mode.split(" ")[0],
                            baseCharge: rates.baseCharge,
                            additionalWeightCharge: rates.additionalWeightCharge,
                            codCharge: isCOD ? rates.codCharge : 0,
                            gst: rates.gst,
                            total: rates.total,
                            gstPercentage: rates.gstPercentage
                        };
                    } catch (error) {
                        console.error(`Error calculating rates for ${rateCard.mode}:`, error);
                        return null;
                    }
                })
            );

            const validRates = rates.filter(rate => rate !== null);
            setCourierRates(validRates);
        };

        calculateRates();
    }, [warehouse, destinationPincode, weight, isCOD, rateData]);

    const handleCourierSelect = (rate: any) => {
        setSelectedCourier(rate.courier);
        setSelectedMode(rate.mode);
    };

    const handleSubmit = () => {
        if (selectedCourier && selectedMode) {
            const selectedRate = courierRates.find(
                rate => rate.courier === selectedCourier && rate.mode === selectedMode
            );

            if (selectedRate) {
                onSubmit({
                    courier: selectedCourier,
                    mode: selectedMode,
                    charges: {
                        shippingCharge: selectedRate.baseCharge + selectedRate.additionalWeightCharge,
                        codCharge: selectedRate.codCharge,
                        gst: selectedRate.gst,
                        total: selectedRate.total
                    }
                });
                onOpenChange(false);
            }
        }
    };

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl">
                    <div className="flex items-center justify-center p-8">
                        Loading rate cards...
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Select Shipping Options for Order #{singleOrderId}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Warehouse Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Warehouse Pincode</label>
                            <Input
                                value={warehouse}
                                onChange={(e) => setWarehouse(e.target.value)}
                                placeholder="Enter warehouse pincode"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">RTO Warehouse Pincode</label>
                            <Input
                                value={rtoWarehouse}
                                onChange={(e) => setRtoWarehouse(e.target.value)}
                                placeholder="Enter RTO warehouse pincode"
                            />
                        </div>
                    </div>

                    {/* Address Toggle */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="showAddress"
                            checked={showAddress}
                            onCheckedChange={(checked) => setShowAddress(checked as boolean)}
                        />
                        <label htmlFor="showAddress" className="text-sm font-medium">
                            Show Address
                        </label>
                    </div>

                    {/* Zone and Weight Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Zone</p>
                                <p className="text-sm text-gray-600 capitalize">
                                    {currentZone ? currentZone.replace(/([A-Z])/g, ' $1').trim() : "Calculating..."}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Weight</p>
                                <p className="text-sm text-gray-600">{weight} kg</p>
                            </div>
                        </div>
                    </div>

                    {/* Courier Rates Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Select</th>
                                    <th className="px-4 py-2 text-left">Courier</th>
                                    <th className="px-4 py-2 text-left">Mode</th>
                                    {isCOD && <th className="px-4 py-2 text-right">COD</th>}
                                    <th className="px-4 py-2 text-right">Shipping</th>
                                    <th className="px-4 py-2 text-right">GST ({courierRates[0]?.gstPercentage || 18}%)</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courierRates.map((rate, index) => (
                                    <tr
                                        key={index}
                                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                                            selectedCourier === rate.courier && selectedMode === rate.mode
                                                ? "bg-blue-50"
                                                : ""
                                        }`}
                                    >
                                        <td className="px-4 py-2">
                                            <input
                                                type="radio"
                                                name="courier"
                                                checked={selectedCourier === rate.courier && selectedMode === rate.mode}
                                                onChange={() => handleCourierSelect(rate)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">{rate.courier}</td>
                                        <td className="px-4 py-2">{rate.mode.split("-")[0].split(" ")[2]}</td>
                                        {isCOD && <td className="px-4 py-2 text-right">₹{rate.codCharge.toFixed(2)}</td>}
                                        <td className="px-4 py-2 text-right">₹{(rate.baseCharge + rate.additionalWeightCharge).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right">₹{rate.gst.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-medium">₹{rate.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedCourier || !selectedMode}
                            className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 