import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const createOrderSchema = z.object({
    // Pickup Address
    senderName: z.string().min(1, "Sender's name is required"),
    senderMobile: z.string().min(10, "Valid mobile number required"),
    senderAddress1: z.string().min(1, "Address line 1 is required"),
    senderAddress2: z.string().optional(),
    senderCity: z.string().min(1, "City is required"),
    senderState: z.string().min(1, "State is required"),
    senderPincode: z.string().min(6, "Valid pincode required"),
    savePickupAddress: z.boolean().default(false),

    // Delivery Address
    receiverName: z.string().min(1, "Receiver's name is required"),
    receiverMobile: z.string().min(10, "Valid mobile number required"),
    receiverAddress1: z.string().min(1, "Address line 1 is required"),
    receiverAddress2: z.string().optional(),
    receiverCity: z.string().min(1, "City is required"),
    receiverState: z.string().min(1, "State is required"),
    receiverPincode: z.string().min(6, "Valid pincode required"),
    saveDeliveryAddress: z.boolean().default(false),

    // Package Details
    weight: z.number().min(0.1, "Weight must be greater than 0"),
    length: z.number().min(1, "Length must be greater than 0"),
    width: z.number().min(1, "Width must be greater than 0"),
    height: z.number().min(1, "Height must be greater than 0"),
    packageContent: z.string().min(1, "Package content is required"),
    packageValue: z.number().min(1, "Package value is required"),
    securePackage: z.boolean().default(false),
    packagingType: z.enum(["Pouch", "Box / Carton", "Suitcase / Luggage", "Backpack / Hand Bag", "Other"]),
    pickupDate: z.date({
        required_error: "Please select a pickup date",
    }),
    shippingRate: z.number().optional(),
});

type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Rate card interface
interface DeliveryPartner {
    id: string;
    name: string;
    baseRate: number;
    weightRate: number; // per kg
    dimensionalFactor: number; // for volumetric weight
    expressDelivery: boolean;
    estimatedDays: string;
}

// Sample delivery partners with rate cards
const deliveryPartners: DeliveryPartner[] = [
    {
        id: "bluedart",
        name: "BlueDart",
        baseRate: 100,
        weightRate: 20,
        dimensionalFactor: 5000, // (L*W*H)/5000
        expressDelivery: true,
        estimatedDays: "1-2 days"
    },
    {
        id: "delhivery",
        name: "Delhivery",
        baseRate: 80,
        weightRate: 18,
        dimensionalFactor: 4000,
        expressDelivery: true,
        estimatedDays: "2-3 days"
    },
    {
        id: "dtdc",
        name: "DTDC",
        baseRate: 90,
        weightRate: 19,
        dimensionalFactor: 4500,
        expressDelivery: false,
        estimatedDays: "3-4 days"
    },
    {
        id: "fedex",
        name: "FedEx",
        baseRate: 150,
        weightRate: 25,
        dimensionalFactor: 5000,
        expressDelivery: true,
        estimatedDays: "1-2 days"
    },
    {
        id: "dhl",
        name: "DHL",
        baseRate: 180,
        weightRate: 30,
        dimensionalFactor: 5000,
        expressDelivery: true,
        estimatedDays: "1-2 days"
    },
    {
        id: "xpressbees",
        name: "Xpressbees",
        baseRate: 70,
        weightRate: 15,
        dimensionalFactor: 4000,
        expressDelivery: true,
        estimatedDays: "2-3 days"
    }
];

export default function CustomerCreateOrderPage() {
    const [showRatesDialog, setShowRatesDialog] = useState(false);
    const [calculatingRates, setCalculatingRates] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
    const [calculatedRates, setCalculatedRates] = useState<Array<{
        partner: DeliveryPartner;
        totalRate: number;
        volumetricWeight: number;
    }>>([]);
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
            securePackage: false,
            packagingType: "Pouch",
            pickupDate: new Date(),
        },
    });

    const onSubmit = (data: CreateOrderInput) => {
        console.log(data);
    };

    const calculateVolumetricWeight = (length: number, width: number, height: number, factor: number) => {
        return (length * width * height) / factor;
    };

    const calculateShippingRate = (
        partner: DeliveryPartner,
        actualWeight: number,
        length: number,
        width: number,
        height: number
    ) => {
        const volumetricWeight = calculateVolumetricWeight(length, width, height, partner.dimensionalFactor);
        const chargeableWeight = Math.max(actualWeight, volumetricWeight);
        const totalRate = partner.baseRate + (chargeableWeight * partner.weightRate);
        
        return {
            partner,
            totalRate: Math.round(totalRate),
            volumetricWeight: Math.round(volumetricWeight * 100) / 100
        };
    };

    const handleGetRates = async () => {
        const formData = form.getValues();
        
        // Validate required fields for dimensions, weight, and package value
        let missingFields = [];

        if (!formData.weight || formData.weight <= 0) missingFields.push("weight");
        if (!formData.length || formData.length <= 0) missingFields.push("length");
        if (!formData.width || formData.width <= 0) missingFields.push("width");
        if (!formData.height || formData.height <= 0) missingFields.push("height");
        if (!formData.packageValue || formData.packageValue <= 0) missingFields.push("package value");
        
        if (missingFields.length > 0) {
            form.trigger(["weight", "length", "width", "height", "packageValue"]);
            toast.error(`Please enter valid ${missingFields.join(", ")}`);
            return;
        }

        // Validate address fields
        const addressFields = ["senderName", "senderMobile", "senderAddress1", "senderPincode", "senderCity", "senderState", 
                              "receiverName", "receiverMobile", "receiverAddress1", "receiverPincode", "receiverCity", "receiverState"] as const;
        
        const result = await form.trigger(addressFields);
        if (!result) {
            toast.error("Please fill all required address fields");
            return;
        }

        setCalculatingRates(true);
        setShowRatesDialog(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const rates = deliveryPartners.map(partner =>
            calculateShippingRate(
                partner,
                formData.weight,
                formData.length,
                formData.width,
                formData.height
            )
        );

        setCalculatedRates(rates);
        setCalculatingRates(false);
    };

    const handlePartnerSelect = (partner: DeliveryPartner) => {
        setSelectedPartner(partner);
        const rate = calculatedRates.find(r => r.partner.id === partner.id);
        if (rate) {
            form.setValue('shippingRate', rate.totalRate);
        }
        // Close dialog after selection
        setShowRatesDialog(false);
    };

    const handleConfirmOrder = async () => {
        if (!selectedPartner) {
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
            
            // Create order in backend - AWB will be generated by backend
            const response = await axios.post('/api/orders', {
                ...formData,
                shippingPartner: selectedPartner,
                shippingRate: calculatedRates.find(r => r.partner.id === selectedPartner?.id)?.totalRate
            });

            // Expect backend to return { awbNumber, ...orderDetails }
            const { awbNumber } = response.data;

            if (!awbNumber) {
                throw new Error('Order created but no AWB number received');
            }

            // Navigate to payment page with AWB
            navigate("/customer/payment", { 
                state: { awbNumber }
            });
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
                                            <FormLabel>Save Address</FormLabel>
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
                                                <FormLabel>Save Address</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Select Packaging */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Select Packaging</h2>
                        <FormField
                            control={form.control}
                            name="packagingType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-2 md:grid-cols-5 gap-4"
                                        >
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem
                                                        value="Pouch"
                                                        id="pouch"
                                                        className="peer sr-only"
                                                    />
                                                </FormControl>
                                                <FormLabel
                                                    htmlFor="pouch"
                                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-blue-600 text-white p-4 hover:bg-blue-500 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    Pouch
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem
                                                        value="Box / Carton"
                                                        id="box"
                                                        className="peer sr-only"
                                                    />
                                                </FormControl>
                                                <FormLabel
                                                    htmlFor="box"
                                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-blue-600 text-white p-4 hover:bg-blue-500 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    Box / Carton
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem
                                                        value="Suitcase / Luggage"
                                                        id="suitcase"
                                                        className="peer sr-only"
                                                    />
                                                </FormControl>
                                                <FormLabel
                                                    htmlFor="suitcase"
                                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-blue-600 text-white p-4 hover:bg-blue-500 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    Suitcase / Luggage
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem
                                                        value="Backpack / Hand Bag"
                                                        id="backpack"
                                                        className="peer sr-only"
                                                    />
                                                </FormControl>
                                                <FormLabel
                                                    htmlFor="backpack"
                                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-blue-600 text-white p-4 hover:bg-blue-500 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    Backpack / Hand Bag
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem
                                                        value="Other"
                                                        id="other"
                                                        className="peer sr-only"
                                                    />
                                                </FormControl>
                                                <FormLabel
                                                    htmlFor="other"
                                                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-blue-600 text-white p-4 hover:bg-blue-500 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                >
                                                    Other
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Schedule Pickup */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Schedule your Pickup</h2>
                        <FormField
                            control={form.control}
                            name="pickupDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div 
                                                className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-500"
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <CalendarIcon className="w-4 h-4" />
                                                <span>{field.value ? format(field.value, "EEE, dd MMM yyyy").toUpperCase() : "MON, 31 MAR 2025"}</span>
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    return date < today;
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                            {/* Parcel Weight & Dimensions */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Parcel Weight & Dimensions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="weight"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Weight (kg)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Enter weight"
                                                            {...field}
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-gray-500">
                                                        Enter the actual weight of your package
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                    name="packageContent"
                                            render={({ field }) => (
                                                <FormItem>
                                            <FormLabel>Package Content</FormLabel>
                                                    <FormControl>
                                                <Input placeholder="Enter package content" {...field} />
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
                                                    <FormLabel>Package Value (₹)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter package value"
                                                            {...field}
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-gray-500">
                                                        Declare the actual value of package contents
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                            <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="length"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Length (cm)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Enter length"
                                                            {...field}
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : Number(e.target.value);
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
                                                            step="0.1"
                                                            placeholder="Enter width"
                                                            {...field}
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : Number(e.target.value);
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
                                                            step="0.1"
                                                            placeholder="Enter height"
                                                            {...field}
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                        <div className="mt-4">
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
                                            <FormLabel>Secure your package for just ₹1499.97</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                                Claim up to ₹26999.5 in case of loss or damage.{" "}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger className="underline">
                                        See what is covered
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">
                                                                Coverage includes loss, damage, or theft during transit.
                                                                Terms and conditions apply.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                        </div>
                            </div>

                            {/* Courier Charges */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Courier Charges</h2>
                        <div className="space-y-4">
                            {selectedPartner && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-blue-900">{selectedPartner.name}</h3>
                                            <p className="text-sm text-blue-700">Estimated Delivery: {selectedPartner.estimatedDays}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-blue-700">Shipping Rate</p>
                                            <p className="text-xl font-bold text-blue-900">
                                                ₹{calculatedRates.find(r => r.partner.id === selectedPartner.id)?.totalRate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between gap-4">
                                            <Button
                                                type="button"
                                    variant="outline" 
                                    className="w-full"
                                    onClick={handleGetRates}
                                            >
                                    {selectedPartner ? 'Change Courier Partner' : 'Get Rates'}
                                            </Button>
                                        <Button
                                            type="button"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                                    disabled={!selectedPartner}
                                    onClick={handleConfirmOrder}
                                >
                                    Confirm Order
                                        </Button>
                                </div>
                        </div>
                    </div>
                </form>
            </Form>

            {/* Rates Dialog */}
            <Dialog open={showRatesDialog} onOpenChange={setShowRatesDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Courier Partner</DialogTitle>
                    </DialogHeader>
                    {calculatingRates ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-muted-foreground">Calculating rates...</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {deliveryPartners.map((partner) => {
                                const rate = calculatedRates.find(r => r.partner.id === partner.id);
                                const isSelected = selectedPartner?.id === partner.id;
                                return (
                                    <div 
                                        key={partner.id}
                                        className={cn(
                                            "border rounded-lg p-4 cursor-pointer transition-all",
                                            isSelected 
                                                ? "border-blue-500 bg-blue-50" 
                                                : "hover:border-blue-200"
                                        )}
                                        onClick={() => handlePartnerSelect(partner)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{partner.name}</h3>
                                                    {partner.expressDelivery && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                            Express
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {partner.estimatedDays}
                                                </p>
                                            </div>
                                            {rate && (
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-blue-600">
                                                        ₹{rate.totalRate}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 