import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Package, Truck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { ServiceFactory } from "@/services/service-factory";

const rateCalculatorSchema = z.object({
    originPincode: z.string().length(6, "Pincode must be 6 digits"),
    destinationPincode: z.string().length(6, "Pincode must be 6 digits"),
    weight: z.number().min(0.1, "Weight must be at least 0.1 kg").max(50, "Weight cannot exceed 50 kg"),
    length: z.number().min(1, "Length must be at least 1 cm").max(150, "Length cannot exceed 150 cm"),
    width: z.number().min(1, "Width must be at least 1 cm").max(150, "Width cannot exceed 150 cm"),
    height: z.number().min(1, "Height must be at least 1 cm").max(150, "Height cannot exceed 150 cm"),
    value: z.number().min(0, "Value must be at least 0").max(100000, "Value cannot exceed ₹1,00,000"),
    serviceType: z.enum(["Standard", "Express"]),
});

type RateCalculatorForm = z.infer<typeof rateCalculatorSchema>;

interface RateResult {
    courier: string;
    serviceType: string;
    deliveryTime: string;
    baseRate: number;
    weightCharge: number;
    fuelSurcharge: number;
    codCharge: number;
    gst: number;
    totalCharge: number;
    isRecommended: boolean;
}

const SellerRateCalculatorPage = () => {
    const [rates, setRates] = useState<RateResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<RateCalculatorForm>({
        resolver: zodResolver(rateCalculatorSchema),
        defaultValues: {
            originPincode: "",
            destinationPincode: "",
            weight: 0.1,
            length: 1,
            width: 1,
            height: 1,
            value: 0,
            serviceType: "Standard",
        },
    });

    const onSubmit = async (data: RateCalculatorForm) => {
        try {
            setIsLoading(true);
            const response = await ServiceFactory.shipping.calculateRates({
                originPincode: data.originPincode,
                destinationPincode: data.destinationPincode,
                weight: data.weight,
                dimensions: {
                    length: data.length,
                    width: data.width,
                    height: data.height
                },
                declaredValue: data.value,
                serviceType: data.serviceType.toLowerCase()
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to calculate rates');
            }

            setRates(response.data.rates);
            toast.success("Shipping rates calculated successfully!");
        } catch (error) {
            console.error("Error calculating rates:", error);
            toast.error(error instanceof Error ? error.message : "Failed to calculate shipping rates. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Rate Calculator
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calculator className="size-4" />
                    <span>Calculate shipping rates instantly</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calculator Form */}
                <div className="space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="originPincode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Origin Pincode</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter 6-digit pincode" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="destinationPincode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Destination Pincode</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter 6-digit pincode" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Weight (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select service type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Standard">Standard</SelectItem>
                                                    <SelectItem value="Express">Express</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="length"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Length (cm)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Declared Value (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Calculating..." : "Calculate Rates"}
                            </Button>
                        </form>
                    </Form>
                </div>

                {/* Results */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Package className="size-4" />
                        <span>Available Shipping Rates</span>
                    </div>

                    {rates.length > 0 ? (
                        <div className="space-y-4">
                            {rates.map((rate, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border ${
                                        rate.isRecommended ? "border-purple-500 bg-purple-50" : "border-gray-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Truck className="size-4" />
                                            <h3 className="font-medium">{rate.courier}</h3>
                                        </div>
                                        {rate.isRecommended && (
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Service Type:</span>
                                            <span className="font-medium">{rate.serviceType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Delivery Time:</span>
                                            <span className="font-medium">{rate.deliveryTime}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Base Rate:</span>
                                            <span className="font-medium">₹{rate.baseRate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Weight Charge:</span>
                                            <span className="font-medium">₹{rate.weightCharge}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fuel Surcharge:</span>
                                            <span className="font-medium">₹{rate.fuelSurcharge}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">COD Charge:</span>
                                            <span className="font-medium">₹{rate.codCharge}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">GST (18%):</span>
                                            <span className="font-medium">₹{rate.gst}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t">
                                            <span className="font-medium">Total Charge:</span>
                                            <span className="font-semibold text-purple-600">₹{rate.totalCharge}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Enter shipping details to calculate rates
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerRateCalculatorPage; 