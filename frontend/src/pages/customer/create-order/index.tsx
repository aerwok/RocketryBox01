import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { customerApiService } from "@/services/customer-api.service";

// Validation schema
const createOrderSchema = z.object({
    senderName: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters"),
    senderMobile: z.string()
        .regex(/^[6-9]\d{9}$/, "Please provide a valid Indian phone number"),
    senderAddress1: z.string()
        .min(5, "Address line 1 must be at least 5 characters long")
        .max(100, "Address line 1 cannot exceed 100 characters"),
    senderAddress2: z.string()
        .max(100, "Address line 2 cannot exceed 100 characters")
        .optional(),
    senderCity: z.string()
        .min(2, "City must be at least 2 characters long")
        .max(50, "City cannot exceed 50 characters"),
    senderState: z.string()
        .min(2, "State must be at least 2 characters long")
        .max(50, "State cannot exceed 50 characters"),
    senderPincode: z.string()
        .regex(/^\d{6}$/, "Please provide a valid 6-digit pincode"),
    savePickupAddress: z.boolean().optional(),
    
    receiverName: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters"),
    receiverMobile: z.string()
        .regex(/^[6-9]\d{9}$/, "Please provide a valid Indian phone number"),
    receiverAddress1: z.string()
        .min(5, "Address line 1 must be at least 5 characters long")
        .max(100, "Address line 1 cannot exceed 100 characters"),
    receiverAddress2: z.string()
        .max(100, "Address line 2 cannot exceed 100 characters")
        .optional(),
    receiverCity: z.string()
        .min(2, "City must be at least 2 characters long")
        .max(50, "City cannot exceed 50 characters"),
    receiverState: z.string()
        .min(2, "State must be at least 2 characters long")
        .max(50, "State cannot exceed 50 characters"),
    receiverPincode: z.string()
        .regex(/^\d{6}$/, "Please provide a valid 6-digit pincode"),
    saveDeliveryAddress: z.boolean().optional(),
    
    weight: z.number()
        .min(0.1, "Weight must be at least 0.1 kg"),
    length: z.number()
        .min(1, "Length must be at least 1 cm"),
    width: z.number()
        .min(1, "Width must be at least 1 cm"),
    height: z.number()
        .min(1, "Height must be at least 1 cm"),
    packageContent: z.string()
        .min(2, "Item name must be at least 2 characters long")
        .max(50, "Item name cannot exceed 50 characters"),
    packageValue: z.number()
        .min(0, "Value cannot be negative"),
    itemQuantity: z.number()
        .min(1, "Quantity must be at least 1")
        .default(1),
    securePackage: z.boolean().optional(),
    packagingType: z.enum(["pouch", "box", "tube", "other"]),
    pickupDate: z.date()
        .min(new Date(), "Pickup date must be in the future"),
    shippingRate: z.number().optional(),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Rate response interface from API
interface CourierRate {
    courier: string;
    mode: string;
    service: string;
    rate: number;
    estimatedDelivery: string;
    codCharge: number;
    available: boolean;
}

interface RatesSummary {
    totalCouriers: number;
    cheapestRate: number;
    fastestDelivery: string;
}

export default function CustomerCreateOrderPage() {
    const [showRatesDialog, setShowRatesDialog] = useState(false);
    const [calculatingRates, setCalculatingRates] = useState(false);
    const [selectedRate, setSelectedRate] = useState<CourierRate | null>(null);
    const [calculatedRates, setCalculatedRates] = useState<CourierRate[]>([]);
    const [ratesSummary, setRatesSummary] = useState<RatesSummary | null>(null);
    const navigate = useNavigate();

    const form = useForm<CreateOrderInput>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            senderName: "",
            senderMobile: "",
            senderAddress1: "",
            senderAddress2: "",
            senderCity: "",
            senderState: "",
            senderPincode: "",
            savePickupAddress: false,
            receiverName: "",
            receiverMobile: "",
            receiverAddress1: "",
            receiverAddress2: "",
            receiverCity: "",
            receiverState: "",
            receiverPincode: "",
            saveDeliveryAddress: false,
            weight: undefined,
            length: undefined,
            width: undefined,
            height: undefined,
            packageContent: "",
            packageValue: undefined,
            itemQuantity: 1,
            securePackage: false,
            packagingType: undefined,
            pickupDate: new Date(),
        },
    });

    const onSubmit = (data: CreateOrderInput) => {
        console.log(data);
    };

    const handleCalculateRates = async () => {
        const formData = form.getValues();
        
        // Validate required fields for rate calculation
        if (!formData.weight || !formData.senderPincode || !formData.receiverPincode) {
            toast.error("Please fill in weight and both pincodes to calculate rates");
            return;
        }

        setCalculatingRates(true);
        setCalculatedRates([]);

        try {
            console.log('Calculating rates with data:', {
                weight: formData.weight,
                pickupPincode: formData.senderPincode,
                deliveryPincode: formData.receiverPincode,
                serviceType: 'standard' // Default service type
            });

            const response = await customerApiService.calculateRates({
                weight: formData.weight,
                pickupPincode: formData.senderPincode,
                deliveryPincode: formData.receiverPincode,
                serviceType: 'standard'
            });

            console.log('Rate calculation response:', response);

            if (response.success && response.data.rates) {
                // Transform the API response to match our frontend format
                const transformedRates = response.data.rates.map((rate: {
                    courier: string;
                    mode?: string;
                    service?: string;
                    rate?: number;
                    total?: number;
                    estimatedDelivery?: string;
                    codCharge?: number;
                    available?: boolean;
                }) => ({
                    courier: rate.courier,
                    mode: rate.mode || 'standard',
                    service: rate.service || rate.mode || 'standard',
                    rate: rate.rate || rate.total || 0,
                    estimatedDelivery: rate.estimatedDelivery || '3-5 days',
                    codCharge: rate.codCharge || 0,
                    available: rate.available !== false
                }));

                setCalculatedRates(transformedRates);
                setRatesSummary(response.data.summary);
                setShowRatesDialog(true); // Show the rates dialog
                toast.success(`Found ${transformedRates.length} shipping options`);
            } else {
                toast.error("No rates found for this route");
            }
        } catch (error: unknown) {
            console.error('Rate calculation error:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to calculate rates. Please try again.";
            toast.error(errorMessage);
        } finally {
        setCalculatingRates(false);
        }
    };

    const handleRateSelect = (rate: CourierRate) => {
        setSelectedRate(rate);
        form.setValue('shippingRate', rate.rate);
        setShowRatesDialog(false);
        toast.success(`Selected ${rate.courier} - ₹${rate.rate}`);
    };

    const handleConfirmOrder = async () => {
        if (!selectedRate) {
            toast.error("Please select a courier partner first");
            return;
        }
        
        // Validate all form fields
        const isValid = await form.trigger();
        if (!isValid) {
            toast.error("Please fill all required fields");
            return;
        }
        
        try {
            const formData = form.getValues();
            
            // Create order using the real API
            const response = await customerApiService.createOrder({
                pickupAddress: {
                    name: formData.senderName,
                    phone: formData.senderMobile,
                    address1: formData.senderAddress1,
                    address2: formData.senderAddress2 || undefined,
                    city: formData.senderCity,
                    state: formData.senderState,
                    pincode: formData.senderPincode,
                    country: 'India'
                },
                deliveryAddress: {
                    name: formData.receiverName,
                    phone: formData.receiverMobile,
                    address1: formData.receiverAddress1,
                    address2: formData.receiverAddress2 || undefined,
                    city: formData.receiverCity,
                    state: formData.receiverState,
                    pincode: formData.receiverPincode,
                    country: 'India'
                },
                package: {
                    weight: formData.weight,
                    dimensions: {
                        length: formData.length,
                        width: formData.width,
                        height: formData.height,
                    },
                    items: [{
                        name: formData.packageContent,
                        quantity: formData.itemQuantity,
                        value: formData.packageValue,
                    }],
                },
                serviceType: selectedRate.service,
                paymentMethod: 'online',
                instructions: '',
                pickupDate: formData.pickupDate.toISOString(),
            });

            if (response.success) {
                toast.success("Order created successfully!");
            // Navigate to payment page with AWB
            navigate("/customer/payment", { 
                    state: { awbNumber: response.data.awb }
            });
            } else {
                throw new Error('Order creation failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Failed to create order. Please try again.";
            toast.error(errorMessage);
        }
    };

    return (
        <div className="container mx-auto py-6 max-w-7xl">
            <h1 className="text-2xl font-semibold mb-6">Create Order</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pickup Address */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Pickup Address</h2>
                            <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="senderName"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Sender's Name</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter sender's name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                    name="senderMobile"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Mobile Number</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter mobile number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                    name="senderAddress1"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Address 1</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter address line 1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                    name="senderAddress2"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Address 2 (Optional)</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter address line 2" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="senderCity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter city" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="senderState"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter state" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="senderPincode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pincode</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter pincode" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="savePickupAddress"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                            <FormLabel>Save this address for future use</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
                            <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="receiverName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Receiver's Name</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter receiver's name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                    name="receiverMobile"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mobile Number</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter mobile number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                    name="receiverAddress1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address 1</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter address line 1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                    name="receiverAddress2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address 2 (Optional)</FormLabel>
                                                <FormControl>
                                                <Input placeholder="Enter address line 2" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="receiverCity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter city" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="receiverState"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter state" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="receiverPincode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pincode</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter pincode" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="saveDeliveryAddress"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                            <FormLabel>Save this address for future use</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                {/* Package Details */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Package Details</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                            control={form.control}
                                name="weight"
                            render={({ field }) => (
                                <FormItem>
                                        <FormLabel>Weight (kg)</FormLabel>
                                    <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.1" 
                                                placeholder="0.5" 
                                                value={field.value || ''} 
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                    field.onChange(value);
                                                }}
                                                    />
                                                </FormControl>
                                        <FormMessage />
                                            </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="length"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Length (cm)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="10" 
                                                value={field.value || ''} 
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="width"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Width (cm)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="10" 
                                                value={field.value || ''} 
                                                onChange={(e) => {
                                                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                                        <FormField
                                            control={form.control}
                                name="height"
                                            render={({ field }) => (
                                                <FormItem>
                                        <FormLabel>Height (cm)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                placeholder="5" 
                                                            value={field.value || ''} 
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                    name="packageContent"
                                            render={({ field }) => (
                                                <FormItem>
                                            <FormLabel>Package Content</FormLabel>
                                                    <FormControl>
                                            <Input placeholder="e.g., Electronics, Clothing, Books" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                name="itemQuantity"
                                            render={({ field }) => (
                                                <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                placeholder="1" 
                                                            value={field.value || ''} 
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                name="packageValue"
                                            render={({ field }) => (
                                                <FormItem>
                                        <FormLabel>Declared Value (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                placeholder="1000" 
                                                            value={field.value || ''} 
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                name="packagingType"
                                            render={({ field }) => (
                                                <FormItem>
                                        <FormLabel>Packaging Type</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value}
                                        >
                                                    <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select packaging type" />
                                                </SelectTrigger>
                                                    </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pouch">Pouch</SelectItem>
                                                <SelectItem value="box">Box</SelectItem>
                                                <SelectItem value="tube">Tube</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                name="pickupDate"
                                            render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Pickup Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                    <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                    </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="securePackage"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        <div className="space-y-1 leading-none">
                                        <FormLabel>This is a secure package (additional charges may apply)</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                        </div>
                            </div>

                {/* Get Rates and Courier Selection */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Courier Selection</h2>
                        <Button type="button" onClick={handleCalculateRates} disabled={calculatingRates}>
                            {calculatingRates ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Calculating...
                                </>
                            ) : (
                                "Get Rates"
                            )}
                        </Button>
                    </div>

                    {selectedRate && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                    <h3 className="font-semibold text-blue-900">{selectedRate.courier}</h3>
                                    <p className="text-sm text-blue-700">Estimated Delivery: {selectedRate.estimatedDelivery}</p>
                                    <p className="text-xs text-blue-600">{selectedRate.mode} • {selectedRate.service}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-blue-700">Shipping Rate</p>
                                    <p className="text-xl font-bold text-blue-900">₹{selectedRate.rate}</p>
                                    {selectedRate.codCharge > 0 && (
                                        <p className="text-xs text-blue-600">COD: ₹{selectedRate.codCharge}</p>
                                    )}
                                        </div>
                                    </div>
                                </div>
                            )}

                    {!selectedRate && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Click "Get Rates" to see available courier options</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate("/customer/home")}>
                        Cancel
                                            </Button>
                    <Button type="button" onClick={handleConfirmOrder} disabled={!selectedRate}>
                                    Confirm Order
                                        </Button>
                    </div>
                </form>
            </Form>

            {/* Rates Dialog */}
            <Dialog open={showRatesDialog} onOpenChange={setShowRatesDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Select Courier Partner</DialogTitle>
                    </DialogHeader>
                    {calculatingRates ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-muted-foreground">Calculating rates...</span>
                        </div>
                    ) : (
                    <div className="space-y-3 overflow-y-auto pr-2">
                        {ratesSummary && (
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 sticky top-0 z-10">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Available Couriers</p>
                                        <p className="font-semibold">{ratesSummary.totalCouriers}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Cheapest Rate</p>
                                        <p className="font-semibold">₹{ratesSummary.cheapestRate}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Fastest Delivery</p>
                                        <p className="font-semibold">{ratesSummary.fastestDelivery}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {calculatedRates.map((rate, index) => {
                            const isSelected = selectedRate?.courier === rate.courier;
                            const isCheapest = rate.rate === ratesSummary?.cheapestRate;
                            
                                return (
                                    <div 
                                    key={index}
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                            isSelected 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleRateSelect(rate)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm">{rate.courier}</h3>
                                                {isCheapest && (
                                                    <Badge variant="secondary" className="text-xs">Cheapest</Badge>
                                                )}
                                                {rate.mode === 'express' && (
                                                    <Badge variant="default" className="text-xs">Express</Badge>
                                                    )}
                                                </div>
                                            <p className="text-xs text-gray-600">
                                                {rate.estimatedDelivery} • {rate.service}
                                                </p>
                                            {rate.codCharge > 0 && (
                                                <p className="text-xs text-gray-500">COD Charges: ₹{rate.codCharge}</p>
                                            )}
                                            </div>
                                                <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">₹{rate.rate}</p>
                                            <p className="text-xs text-gray-500">{rate.mode}</p>
                                                </div>
                                        </div>
                                    </div>
                                );
                            })}

                        {calculatedRates.length === 0 && !calculatingRates && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No rates available for the selected route</p>
                            </div>
                        )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 