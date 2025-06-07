import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceFactory } from "@/services/service-factory";
import { warehouseService, type WarehouseData } from "@/services/warehouse.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

interface ShippingRate {
  courier: string;
  productName: string;
  mode: string;
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
  }) => Promise<void>;
  isCOD?: boolean;
  // Add order details to ensure consistent rate calculation
  orderDetails?: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    fromPincode?: string; // Optional since we now use warehouse selection
    toPincode: string;
    totalPrice: number;
  };
}

export function ShippingOptionsModal({
  open,
  onOpenChange,
  singleOrderId,
  onSubmit,
  isCOD = false,
  orderDetails
}: ShippingOptionsModalProps) {
  // Updated state management for warehouse selection
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null);
  const [selectedRtoWarehouse, setSelectedRtoWarehouse] = useState<WarehouseData | null>(null);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [courierRates, setCourierRates] = useState<any[]>([]);
  const [currentZone, setCurrentZone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch warehouses
  const { data: warehousesData, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseService.getWarehouses(),
    enabled: open, // Only fetch when modal is open
  });

  const warehouses = warehousesData?.data?.warehouses || [];

  // Use actual order data instead of hardcoded values
  const destinationPincode = orderDetails?.toPincode || "";
  const dimensions = orderDetails?.dimensions || { length: 10, width: 10, height: 10 };
  const totalPrice = orderDetails?.totalPrice || 100;

  // Calculate final weight: use higher of actual weight vs volumetric weight
  const weight = useMemo(() => {
    if (!orderDetails) return 0.5; // Default fallback

    const actualWeight = orderDetails.weight || 0.5;

    // Calculate volumetric weight: (L × W × H) / 5000
    const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;

    // Use higher of actual vs volumetric weight (industry standard)
    const finalWeight = Math.max(actualWeight, volumetricWeight);

    console.log('📏 Weight Calculation for Shipment (CORRECTED):', {
      actualWeight: `${actualWeight}kg`,
      dimensions: `${dimensions.length}×${dimensions.width}×${dimensions.height}cm`,
      volumetricWeight: `${volumetricWeight.toFixed(3)}kg`,
      comparison: `Max(${actualWeight}kg, ${volumetricWeight.toFixed(3)}kg) = ${finalWeight}kg`,
      finalWeight: `${finalWeight}kg`,
      weightUsed: finalWeight === actualWeight ? 'Actual Weight (heavier)' : 'Volumetric Weight (heavier)',
      formula: 'Volumetric = (L×W×H)/5000, Final = Max(Actual, Volumetric)',
      rateCalculationUsing: `${finalWeight}kg (this weight will be sent to API)`
    });

    return finalWeight;
  }, [orderDetails, dimensions]);

  // Get warehouse pincode for rate calculation
  const warehousePincode = selectedWarehouse?.pincode || "";

  // Check for missing warehouse configuration
  const isWarehouseMissing = !warehousePincode || !/^\d{6}$/.test(warehousePincode);
  const isDestinationMissing = !destinationPincode || !/^\d{6}$/.test(destinationPincode);

  // Auto-select first warehouse if available and none selected
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(warehouses[0]);
      setSelectedRtoWarehouse(warehouses[0]); // Same as pickup by default
    }
  }, [warehouses, selectedWarehouse]);

  // Reset submission state when modal closes
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setSelectedCourier("");
      setSelectedMode("");
    }
  }, [open]);

  // Use proper shipping rates API with actual order data
  const { data: rateData, isLoading, error: rateError } = useQuery<any>({
    queryKey: ['shippingRates', warehousePincode, destinationPincode, weight, dimensions, totalPrice],
    queryFn: async () => {
      // Validate pincodes before making API call
      if (isWarehouseMissing) {
        throw new Error('Please select a warehouse for pickup.');
      }

      if (isDestinationMissing) {
        throw new Error('Delivery pincode is missing or invalid. Please enter a valid 6-digit delivery pincode.');
      }

      // Debug logging to verify values
      console.log('🚚 ShippingOptionsModal Rate Calculation:', {
        orderDetails: orderDetails ? 'Provided' : 'Using defaults',
        selectedWarehouse: selectedWarehouse?.name,
        fromPincode: warehousePincode,
        toPincode: destinationPincode,
        weight: weight,
        weightSource: orderDetails?.weight !== undefined ? `Order (${orderDetails.weight})` : 'Default (0.5)',
        dimensions: dimensions,
        orderType: isCOD ? 'cod' : 'prepaid',
        codCollectableAmount: isCOD ? totalPrice : 0,
        totalPrice: totalPrice,
        zoneCalculationBetween: `${warehousePincode} → ${destinationPincode}`,
        validationStatus: 'All pincodes valid'
      });

      const response = await ServiceFactory.shipping.calculateRatesFromPincodes({
        fromPincode: warehousePincode,
        toPincode: destinationPincode,
        weight: weight,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        mode: 'Surface',
        orderType: isCOD ? 'cod' : 'prepaid',
        codCollectableAmount: isCOD ? totalPrice : 0,
        includeRTO: false
      });
      return response.data;
    },
    enabled: !isWarehouseMissing && !isDestinationMissing // Only run query if both pincodes are valid
  });

  useEffect(() => {
    const calculateRates = async () => {
      if (!rateData?.calculations) return;

      // Debug logging for zone calculation
      console.log('🗺️ Zone Calculation Result:', {
        zone: rateData.zone,
        calculations: rateData.calculations?.length || 0,
        fromAPI: !!rateData.zone,
        calculatedBetween: `${warehousePincode} → ${destinationPincode}`,
        warehouseUsed: selectedWarehouse?.name,
        destinationUsed: destinationPincode
      });

      // Transform calculations to display format
      const transformedRates: ShippingRate[] = rateData.calculations.map((calc: any) => {
        // Extract product name and mode from API response
        const productName = calc.productName || 'Standard Service';
        const mode = calc.mode || 'Surface'; // Use actual mode field from database

        return {
          courier: calc.courier,
          productName: productName,
          mode: mode,
          rate: calc.total || 0,
          codCharge: calc.codCharges || 0,
          estimatedDelivery: mode === 'Air' ? '1-2 days' : '2-4 days',
          breakdown: {
            baseRate: calc.baseRate || 0,
            additionalCharges: calc.addlRate || 0,
            shippingCost: calc.shippingCost || calc.total || 0,
            gst: calc.gst || 0,
            total: calc.total || 0
          }
        };
      });

      setCourierRates(transformedRates);
      setCurrentZone(rateData.zone || 'Unknown');
    };

    calculateRates();
  }, [rateData, warehousePincode, destinationPincode, selectedWarehouse]);

  const handleCourierSelect = (rate: any) => {
    console.log('🎯 User selected shipping rate:', {
      courier: rate.courier,
      mode: rate.mode,
      total: rate.rate,
      shippingCost: rate.breakdown.shippingCost,
      gst: rate.breakdown.gst,
      codCharge: rate.codCharge,
      fullRate: rate
    });

    setSelectedCourier(rate.courier);
    setSelectedMode(rate.mode);
  };

  const handleSubmit = async () => {
    if (selectedCourier && selectedMode && !isSubmitting) {
      const selectedRate = courierRates.find(
        rate => rate.courier === selectedCourier && rate.mode === selectedMode
      );

      console.log('🔍 Shipping Selection Debug:', {
        selectedCourier,
        selectedMode,
        selectedRate: selectedRate ? {
          courier: selectedRate.courier,
          mode: selectedRate.mode,
          total: selectedRate.rate,
          shippingCost: selectedRate.breakdown.shippingCost,
          gst: selectedRate.breakdown.gst,
          codCharge: selectedRate.codCharge
        } : 'NOT FOUND',
        availableRates: courierRates.map(r => ({
          courier: r.courier,
          mode: r.mode,
          total: r.rate
        })),
        selectionCriteria: `${selectedCourier} + ${selectedMode}`
      });

      if (selectedRate) {
        try {
          setIsSubmitting(true);

          const chargesToSubmit = {
            shippingCharge: selectedRate.breakdown.shippingCost,
            codCharge: selectedRate.codCharge,
            gst: selectedRate.breakdown.gst,
            total: selectedRate.rate
          };

          console.log('✅ Submitting selected charges:', {
            selectedCourier,
            selectedMode,
            charges: chargesToSubmit,
            breakdown: {
              shippingCharge: `₹${chargesToSubmit.shippingCharge}`,
              codCharge: `₹${chargesToSubmit.codCharge}`,
              gst: `₹${chargesToSubmit.gst}`,
              total: `₹${chargesToSubmit.total}`
            },
            originalSelectedRate: {
              courier: selectedRate.courier,
              mode: selectedRate.mode,
              rate: selectedRate.rate,
              breakdown: selectedRate.breakdown
            }
          });

          await onSubmit({
            courier: selectedCourier,
            mode: selectedMode,
            charges: chargesToSubmit
          });
          onOpenChange(false);
        } catch (error) {
          console.error('Submit error:', error);
          // Error handling is done in the parent component
        } finally {
          setIsSubmitting(false);
        }
      } else {
        console.error('❌ Selected rate not found in available rates!');
      }
    } else {
      console.warn('⚠️ Cannot submit - missing selection:', {
        selectedCourier,
        selectedMode,
        isSubmitting
      });
    }
  };

  if (isLoading || warehousesLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            Loading warehouses and rate cards...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show configuration errors
  if (warehouses.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>No Warehouses Found</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ No Warehouses Configured</h4>
              <p className="text-yellow-700 text-sm">
                You need to add at least one warehouse before creating orders.
                Please go to Warehouse Management and add a warehouse first.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isDestinationMissing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Delivery Address Missing</h4>
              <p className="text-yellow-700 text-sm">
                This order does not have a valid delivery pincode. Please ensure the order has a complete delivery address with a 6-digit pincode before calculating shipping rates.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show API errors
  if (rateError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate Calculation Error</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">❌ Error</h4>
              <p className="text-red-700 text-sm">
                {rateError instanceof Error ? rateError.message : 'Failed to calculate shipping rates'}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Shipping Options for Order #{singleOrderId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Debug Info Section (for development verification) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">🔍 Debug Info (Development Only)</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-yellow-700">
                <div>Order Details: {orderDetails ? '✅ Provided' : '❌ Using defaults'}</div>
                <div>Weight Used: {weight.toFixed(2)}kg ({(() => {
                  if (!orderDetails) return 'Default';
                  const actualWeight = orderDetails.weight || 0.5;
                  const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
                  return weight === actualWeight ? `Actual (${actualWeight}kg > ${volumetricWeight.toFixed(2)}kg)` : `Volumetric (${volumetricWeight.toFixed(2)}kg > ${actualWeight}kg)`;
                })()})</div>
                <div>Dimensions: {dimensions.length}×{dimensions.width}×{dimensions.height} ({orderDetails?.dimensions ? 'From Order' : 'Default'})</div>
                <div>Zone Route: {warehousePincode} → {destinationPincode}</div>
                <div>Current Zone: {currentZone || 'Calculating...'}</div>
                <div>Warehouse Source: {selectedWarehouse?.name || 'Not Selected'}</div>
                <div>Valid Pincodes: Warehouse({!isWarehouseMissing ? '✅' : '❌'}) Delivery({!isDestinationMissing ? '✅' : '❌'})</div>
                <div>Rate Calculation: Using {weight.toFixed(2)}kg for API call</div>
              </div>
            </div>
          )}

          {/* Warehouse Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Warehouse *</label>
              <Select
                value={selectedWarehouse?._id || ""}
                onValueChange={(value) => {
                  const warehouse = warehouses.find(w => w._id === value);
                  setSelectedWarehouse(warehouse || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">RTO Warehouse *</label>
              <Select
                value={selectedRtoWarehouse?._id || ""}
                onValueChange={(value) => {
                  const warehouse = warehouses.find(w => w._id === value);
                  setSelectedRtoWarehouse(warehouse || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select RTO warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show Warehouse Address */}
          {showAddress && selectedWarehouse && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Selected Warehouse Address</h4>
              <div className="text-sm text-blue-700">
                <div className="font-medium">{selectedWarehouse.name}</div>
                <div>{selectedWarehouse.address}</div>
                <div>{selectedWarehouse.city}, {selectedWarehouse.state} - {selectedWarehouse.pincode}</div>
                <div>{selectedWarehouse.country}</div>
                {selectedWarehouse.contactPerson && (
                  <div className="mt-2">
                    <span className="font-medium">Contact: </span>
                    {selectedWarehouse.contactPerson}
                    {selectedWarehouse.phone && ` - ${selectedWarehouse.phone}`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showAddress"
              checked={showAddress}
              onCheckedChange={(checked) => setShowAddress(checked as boolean)}
            />
            <label htmlFor="showAddress" className="text-sm font-medium">
              Show Warehouse Address
            </label>
          </div>

          {/* Zone and Weight Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Zone</p>
                <p className="text-sm text-gray-600 capitalize">
                  {currentZone ? currentZone.replace(/([A-Z])/g, ' $1').trim() : "Calculating..."}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Actual Weight</p>
                <p className="text-sm text-gray-600">{orderDetails?.weight || 0.5} kg</p>
                <p className="text-xs text-gray-500">From Order Data</p>
              </div>
              <div>
                <p className="text-sm font-medium">Volumetric Weight</p>
                <p className="text-sm text-gray-600">
                  {((dimensions.length * dimensions.width * dimensions.height) / 5000).toFixed(2)} kg
                </p>
                <p className="text-xs text-gray-500">
                  ({dimensions.length}×{dimensions.width}×{dimensions.height})/5000
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Chargeable Weight</p>
                <p className="text-sm text-purple-600 font-semibold">{weight.toFixed(2)} kg</p>
                <p className="text-xs text-gray-500">
                  {weight === (orderDetails?.weight || 0.5) ? 'Using Actual' : 'Using Volumetric'}
                </p>
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
                  <th className="px-4 py-2 text-left">Product</th>
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
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${selectedCourier === rate.courier && selectedMode === rate.mode
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
                    <td className="px-4 py-2 text-sm">{rate.productName}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${rate.mode === 'Air'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {rate.mode}
                      </span>
                    </td>
                    {isCOD && <td className="px-4 py-2 text-right">₹{rate.codCharge.toFixed(2)}</td>}
                    <td className="px-4 py-2 text-right">₹{rate.breakdown.shippingCost.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">₹{rate.breakdown.gst.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-medium">₹{rate.rate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="flex justify-end p-6 border-t bg-white flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!selectedCourier || !selectedMode || isSubmitting}
            className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSubmitting ? "Processing..." : "Confirm Selection"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
