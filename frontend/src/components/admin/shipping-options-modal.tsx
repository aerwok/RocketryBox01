import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ServiceFactory } from "@/services/service-factory";
import { useEffect, useState } from "react";

interface CourierRate {
  courier: string;
  productName: string;
  mode: string; // 'standard' or 'express'
  serviceType: string; // 'Surface' or 'Air'
  rate: number;
  codCharge: number;
  estimatedDelivery: string;
  breakdown: {
    baseRate: number;
    additionalCharges: number;
    shippingCost: number;
    gst: number;
    total: number;
  };
}

interface AdminShippingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  weight: number;
  onShipSelected: (courier: string, warehouse: string, mode: string) => void;
  isSellerTab?: boolean;
  // Additional props needed for API call
  fromPincode?: string;
  toPincode?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

const AdminShippingOptionsModal = ({
  isOpen,
  onClose,
  orderNumber,
  weight,
  onShipSelected,
  isSellerTab = false,
  fromPincode = "400001",
  toPincode = "110001",
  dimensions = { length: 10, width: 10, height: 10 }
}: AdminShippingOptionsModalProps) => {

  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [warehouse, setWarehouse] = useState<string>(fromPincode);
  const [rtoWarehouse, setRtoWarehouse] = useState<string>(fromPincode);
  const [showAddress, setShowAddress] = useState<boolean>(false);
  const [zone, setZone] = useState<string>("Metro To Metro");

  // New state for API data
  const [courierRates, setCourierRates] = useState<CourierRate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Fetch real shipping rates when modal opens
  useEffect(() => {
    if (isOpen && isSellerTab) {
      fetchShippingRates();
    }
  }, [isOpen, isSellerTab, warehouse, toPincode]);

  const fetchShippingRates = async () => {
    try {
      setLoading(true);
      setError("");

      console.log('🔍 Fetching rates with:', {
        fromPincode: warehouse,
        toPincode,
        weight,
        dimensions
      });

      const response = await ServiceFactory.shipping.calculateRatesFromPincodes({
        fromPincode: warehouse,
        toPincode: toPincode,
        weight: weight,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        orderType: 'cod', // Default to COD
        includeRTO: false
      });

      if (response.success && response.data) {
        const calculations = response.data.calculations || [];

        console.log('✅ Received calculations:', calculations);

        // Transform API response to our format
        const transformedRates: CourierRate[] = calculations.map(calc => ({
          courier: calc.courier,
          productName: calc.productName,
          mode: calc.mode || 'Surface', // Use actual mode field from database
          serviceType: calc.mode || 'Surface', // Keep for compatibility
          rate: calc.total || 0,
          codCharge: calc.codCharges || 0,
          estimatedDelivery: calc.mode === 'Air' ? '1-2 days' : '2-4 days',
          breakdown: {
            baseRate: calc.baseRate || 0,
            additionalCharges: calc.addlRate || 0,
            shippingCost: calc.shippingCost || calc.total || 0,
            gst: calc.gst || 0,
            total: calc.total || 0
          }
        }));

        setCourierRates(transformedRates);
        setZone(response.data.zone || 'Metro To Metro');

        console.log('✅ Transformed rates:', transformedRates);
      } else {
        throw new Error(response.message || 'Failed to fetch rates');
      }
    } catch (err: any) {
      console.error('❌ Error fetching rates:', err);
      setError(err.message || 'Failed to fetch shipping rates');

      // Fallback to hardcoded data if API fails
      setCourierRates([
        {
          courier: "BLUEDART",
          productName: "BlueDart Surface",
          mode: "surface",
          serviceType: "Surface",
          rate: 95.58,
          codCharge: 35,
          estimatedDelivery: "2-3 days",
          breakdown: {
            baseRate: 46,
            additionalCharges: 0,
            shippingCost: 46,
            gst: 14.58,
            total: 95.58
          }
        },
        {
          courier: "BLUEDART",
          productName: "BlueDart Air",
          mode: "air",
          serviceType: "Air",
          rate: 120.50,
          codCharge: 35,
          estimatedDelivery: "1-2 days",
          breakdown: {
            baseRate: 65,
            additionalCharges: 0,
            shippingCost: 65,
            gst: 20.50,
            total: 120.50
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourierSelect = (courier: string, mode: string) => {
    setSelectedCourier(courier);
    setSelectedMode(mode);
  };

  const handleShipSelected = () => {
    if (selectedCourier && selectedMode) {
      onShipSelected(selectedCourier, warehouse, selectedMode);
      onClose();
    }
  };

  // Render customer tab view (card-based) with hardcoded fallback
  if (!isSellerTab) {
    const fallbackOptions = [
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
      }
    ];

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Courier Partner</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {fallbackOptions.map((option) => (
              <div
                key={option.courier}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-colors",
                  selectedCourier === option.courier
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                )}
                onClick={() => handleCourierSelect(option.courier, option.isExpress ? "air" : "surface")}
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

  // Render seller tab view (table-based) with real API data
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
              onBlur={() => {
                if (warehouse !== fromPincode) {
                  fetchShippingRates();
                }
              }}
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

          {!loading && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={fetchShippingRates}
            >
              Refresh Rates
            </Button>
          )}
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}. Using fallback rates.
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading shipping rates...</p>
          </div>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-4 text-sm font-medium">Select</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">Courier</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">Product</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">Mode</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">Delivery</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">COD</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">Shipping</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">GST</th>
                  <th className="text-left py-2 px-4 text-sm font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {courierRates.map((rate, index) => (
                  <tr
                    key={`${rate.courier}-${rate.mode}-${index}`}
                    className={cn(
                      "cursor-pointer hover:bg-gray-50",
                      selectedCourier === rate.courier && selectedMode === rate.mode ? "bg-blue-50" : ""
                    )}
                    onClick={() => handleCourierSelect(rate.courier, rate.mode)}
                  >
                    <td className="py-2 px-4">
                      <input
                        type="radio"
                        name="courier-rate"
                        checked={selectedCourier === rate.courier && selectedMode === rate.mode}
                        onChange={() => handleCourierSelect(rate.courier, rate.mode)}
                        className="rounded-full"
                      />
                    </td>
                    <td className="py-2 px-4 font-medium">{rate.courier}</td>
                    <td className="py-2 px-4 text-sm">{rate.productName}</td>
                    <td className="py-2 px-4">
                      <Badge variant={rate.serviceType === 'Air' ? 'default' : 'secondary'}>
                        {rate.serviceType}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-sm">{rate.estimatedDelivery}</td>
                    <td className="py-2 px-4">₹{rate.codCharge.toFixed(2)}</td>
                    <td className="py-2 px-4">₹{rate.breakdown.shippingCost.toFixed(2)}</td>
                    <td className="py-2 px-4">₹{rate.breakdown.gst.toFixed(2)}</td>
                    <td className="py-2 px-4 font-semibold">₹{rate.rate.toFixed(2)}</td>
                  </tr>
                ))}
                {courierRates.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No shipping rates available. Please check your settings and try again.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-4 gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleShipSelected}
            disabled={!selectedCourier || !selectedMode || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Confirm Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminShippingOptionsModal;
