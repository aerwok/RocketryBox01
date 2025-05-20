import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CourierRate {
    courier: string;
    displayName: string;
    deliveryTime: string;
    isExpress: boolean;
    price: number;
    // Additional fields for seller view
    mode?: string;
    cod?: string;
    shipping?: number;
    gst?: number;
    total?: number;
}

interface AdminShippingOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderNumber: string;
    weight: number;
    onShipSelected: (courier: string, warehouse: string, mode: string) => void;
    isSellerTab?: boolean; // New prop to determine which view to show
}

const AdminShippingOptionsModal = ({ 
    isOpen, 
    onClose, 
    orderNumber, 
    weight, 
    onShipSelected,
    isSellerTab = false 
}: AdminShippingOptionsModalProps) => {
    
    const [selectedCourier, setSelectedCourier] = useState<string>("");
    const [selectedMode, setSelectedMode] = useState<string>("");
    const [warehouse, setWarehouse] = useState<string>("400001");
    const [rtoWarehouse, setRtoWarehouse] = useState<string>("400001");
    const [showAddress, setShowAddress] = useState<boolean>(false);
    const [zone] = useState<string>("Metro To Metro");

    // Predefined courier options based on the image
    const courierOptions: CourierRate[] = isSellerTab 
        ? [
            {
                courier: "BLUE",
                displayName: "BLUE",
                deliveryTime: "1-2 days",
                isExpress: true,
                price: 97.94,
                mode: "air",
                cod: "₹35.00",
                shipping: 48.00,
                gst: 14.94,
                total: 97.94
            },
            {
                courier: "DELHIVERY",
                displayName: "DELHIVERY",
                deliveryTime: "2-3 days",
                isExpress: false,
                price: 95.58,
                mode: "",
                cod: "₹35.00",
                shipping: 46.00,
                gst: 14.58,
                total: 95.58
            },
            {
                courier: "EKART",
                displayName: "EKART",
                deliveryTime: "2-3 days",
                isExpress: false,
                price: 80.24,
                mode: "",
                cod: "₹30.00",
                shipping: 38.00,
                gst: 12.24,
                total: 80.24
            },
            {
                courier: "XPRESSBEES",
                displayName: "XPRESSBEES",
                deliveryTime: "2-3 days",
                isExpress: false,
                price: 71.98,
                mode: "",
                cod: "₹27.00",
                shipping: 34.00,
                gst: 10.98,
                total: 71.98
            }
        ]
        : [
            {
                courier: "BlueDart",
                displayName: "BlueDart",
                deliveryTime: "1-2 days",
                isExpress: true,
                price: 120
            },
            {
                courier: "Delhivery",
                displayName: "Delhivery",
                deliveryTime: "2-3 days",
                isExpress: true,
                price: 98
            },
            {
                courier: "DTDC",
                displayName: "DTDC",
                deliveryTime: "3-4 days",
                isExpress: false,
                price: 109
            },
            {
                courier: "FedEx",
                displayName: "FedEx",
                deliveryTime: "1-2 days",
                isExpress: true,
                price: 175
            },
            {
                courier: "DHL",
                displayName: "DHL",
                deliveryTime: "1-2 days",
                isExpress: true,
                price: 210
            },
            {
                courier: "Xpressbees",
                displayName: "Xpressbees",
                deliveryTime: "2-3 days",
                isExpress: true,
                price: 85
            }
        ];

    const handleCourierSelect = (courierId: string, mode: string = "") => {
        setSelectedCourier(courierId);
        if (isSellerTab && mode) {
            setSelectedMode(mode);
        }
    };

    const handleShipSelected = () => {
        if (selectedCourier) {
            const selectedOption = courierOptions.find(option => option.courier === selectedCourier);
            const mode = isSellerTab && selectedMode ? selectedMode : 
                selectedOption?.isExpress ? "Express" : "Standard";
            onShipSelected(selectedCourier, warehouse, mode);
            onClose();
        }
    };

    // Render customer tab view (card-based)
    if (!isSellerTab) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Courier Partner</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        {courierOptions.map((option) => (
                            <div 
                                key={option.courier}
                                className={cn(
                                    "p-4 border rounded-lg cursor-pointer transition-colors",
                                    selectedCourier === option.courier 
                                        ? "border-blue-500 bg-blue-50" 
                                        : "border-gray-200 hover:border-blue-200"
                                )}
                                onClick={() => handleCourierSelect(option.courier)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{option.displayName}</div>
                                        <div className="text-sm text-gray-500">{option.deliveryTime}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {option.isExpress && (
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Express</Badge>
                                        )}
                                        <div className="text-blue-600 font-semibold">₹{option.price}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleShipSelected} 
                            disabled={!selectedCourier}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Select & Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Render seller tab view (table-based)
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Select Shipping Options for Order #{orderNumber}</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 my-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Warehouse Pincode</label>
                        <Input 
                            type="text" 
                            value={warehouse} 
                            onChange={(e) => setWarehouse(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">RTO Warehouse Pincode</label>
                        <Input 
                            type="text" 
                            value={rtoWarehouse} 
                            onChange={(e) => setRtoWarehouse(e.target.value)} 
                        />
                    </div>
                </div>
                
                <div className="flex items-center mb-4">
                    <Checkbox 
                        id="show-address" 
                        checked={showAddress} 
                        onCheckedChange={() => setShowAddress(!showAddress)} 
                    />
                    <label htmlFor="show-address" className="ml-2 text-sm cursor-pointer">
                        Show Address
                    </label>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded">
                    <div>
                        <div className="text-sm text-gray-600">Zone</div>
                        <div className="font-medium">{zone}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Weight</div>
                        <div className="font-medium">{weight} kg</div>
                    </div>
                </div>
                
                <div className="border rounded overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-2 px-4 text-sm font-medium">Select</th>
                                <th className="text-left py-2 px-4 text-sm font-medium">Courier</th>
                                <th className="text-left py-2 px-4 text-sm font-medium">Mode</th>
                                <th className="text-left py-2 px-4 text-sm font-medium">COD</th>
                                <th className="text-left py-2 px-4 text-sm font-medium">Shipping</th>
                                <th className="text-left py-2 px-4 text-sm font-medium">GST (18%)</th>
                                <th className="text-left py-2 px-4 text-sm font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courierOptions.map((option) => (
                                <tr 
                                    key={option.courier}
                                    className={cn(
                                        "cursor-pointer hover:bg-gray-50",
                                        selectedCourier === option.courier ? "bg-gray-100" : ""
                                    )}
                                    onClick={() => handleCourierSelect(option.courier, option.mode)}
                                >
                                    <td className="py-2 px-4">
                                        <input 
                                            type="radio" 
                                            name="courier" 
                                            checked={selectedCourier === option.courier}
                                            onChange={() => handleCourierSelect(option.courier, option.mode)}
                                            className="rounded-full"
                                        />
                                    </td>
                                    <td className="py-2 px-4">{option.displayName}</td>
                                    <td className="py-2 px-4">{option.mode || ""}</td>
                                    <td className="py-2 px-4">{option.cod || ""}</td>
                                    <td className="py-2 px-4">₹{option.shipping?.toFixed(2) || ""}</td>
                                    <td className="py-2 px-4">₹{option.gst?.toFixed(2) || ""}</td>
                                    <td className="py-2 px-4">₹{option.total?.toFixed(2) || option.price?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex justify-end mt-4">
                    <Button 
                        onClick={handleShipSelected} 
                        disabled={!selectedCourier}
                        className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                        Confirm Selection
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AdminShippingOptionsModal; 