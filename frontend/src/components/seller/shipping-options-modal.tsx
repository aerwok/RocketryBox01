import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateShippingRate, determineZone } from "@/lib/shipping-calculator";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RateData } from "@/types/shipping";
import { ServiceFactory } from "@/services/service-factory";

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

    // Use proper shipping rates API instead of rate-cards
    const { data: rateData, isLoading } = useQuery<any>({
        queryKey: ['shippingRates', warehouse, destinationPincode, weight],
        queryFn: async () => {
            const response = await ServiceFactory.shipping.calculateRatesFromPincodes({
                fromPincode: warehouse,
                toPincode: destinationPincode,
                weight: weight,
                length: 10, // Default dimensions
                width: 10,
                height: 10,
                mode: 'Surface',
                orderType: isCOD ? 'cod' : 'prepaid',
                codCollectableAmount: isCOD ? 100 : 0,
                includeRTO: false
            });
            return response.data;
        }
    });

    useEffect(() => {
        const calculateRates = async () => {
            if (!rateData?.calculations) return;

            // The data is already calculated from the API
            const rates = rateData.calculations.map((calculation: any) => ({
                mode: `${calculation.courier} ${calculation.productName}`,
                courier: calculation.courier,
                baseCharge: calculation.shippingCost,
                additionalWeightCharge: 0, // Already included in shippingCost
                codCharge: calculation.codCharges,
                gst: calculation.gst,
                total: calculation.total,
                gstPercentage: 18 // Standard GST rate
            }));

            setCourierRates(rates);
            setCurrentZone(rateData.zone || 'Unknown');
        };

        calculateRates();
    }, [rateData]);

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