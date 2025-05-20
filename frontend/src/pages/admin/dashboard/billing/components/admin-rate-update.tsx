import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

const formSchema = z.object({
    sellerId: z.string().min(1, "Please select a seller"),
    courier: z.string().min(1, "Please select a courier"),
    withinCityRate: z.string().min(1, "Rate is required"),
    withinStateRate: z.string().min(1, "Rate is required"),
    metroToMetroRate: z.string().min(1, "Rate is required"),
    restOfIndiaRate: z.string().min(1, "Rate is required"),
    northEastJKRate: z.string().min(1, "Rate is required"),
    codCharge: z.string().min(1, "COD charge is required"),
    codPercent: z.string().min(1, "COD percent is required"),
});

type AdminRateUpdateInput = z.infer<typeof formSchema>;

// Mock seller data - in a real app, this would come from an API
const mockSellers = [
    { id: "1", name: "John Smith / Smith Enterprises" },
    { id: "2", name: "Sarah Johnson / Johnson Retail" },
    { id: "3", name: "Michael Brown / Brown Industries" },
    { id: "4", name: "Jessica Davis / Davis Fashion" },
    { id: "5", name: "William Wilson / Wilson Electronics" },
];

// Available couriers
const availableCouriers = [
    "Delhivery Surface",
    "DTDC Surface",
    "BlueDart Express", 
    "Ekart Surface",
    "Xpressbees Surface"
];

const AdminRateUpdate = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
    const [currentRates, setCurrentRates] = useState<any[] | null>(null);

    const form = useForm<AdminRateUpdateInput>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sellerId: "",
            courier: "",
            withinCityRate: "",
            withinStateRate: "",
            metroToMetroRate: "",
            restOfIndiaRate: "",
            northEastJKRate: "",
            codCharge: "",
            codPercent: "",
        },
    });

    // Handle seller selection to fetch their current rates
    const handleSellerChange = (sellerId: string) => {
        setSelectedSeller(sellerId);
        
        // In a real app, this would be an API call
        // For demo, we'll check localStorage or use default rates
        try {
            const storedRates = localStorage.getItem(`seller_rates_${sellerId}`);
            if (storedRates) {
                const rates = JSON.parse(storedRates);
                setCurrentRates(rates);
            } else {
                // Default rates as a fallback
                setCurrentRates([
                    {
                        name: "Delhivery Surface",
                        rates: {
                            withinCity: 32,
                            withinState: 34,
                            metroToMetro: 46,
                            restOfIndia: 49,
                            northEastJK: 68
                        },
                        codCharge: 35,
                        codPercent: 1.75
                    },
                    {
                        name: "DTDC Surface",
                        rates: {
                            withinCity: 30,
                            withinState: 30,
                            metroToMetro: 35,
                            restOfIndia: 39,
                            northEastJK: 52
                        },
                        codCharge: 27,
                        codPercent: 1.25
                    }
                ]);
            }
        } catch (error) {
            console.error("Error loading seller rates:", error);
            toast.error("Failed to load seller's current rates");
        }
    };

    // Handle courier selection to populate the form with existing values
    const handleCourierChange = (courierName: string) => {
        if (!currentRates) return;
        
        // Find the courier in current rates
        const selectedCourier = currentRates.find(c => c.name === courierName);
        
        if (selectedCourier) {
            // Populate form with existing values
            form.setValue("withinCityRate", selectedCourier.rates.withinCity.toString());
            form.setValue("withinStateRate", selectedCourier.rates.withinState.toString());
            form.setValue("metroToMetroRate", selectedCourier.rates.metroToMetro.toString());
            form.setValue("restOfIndiaRate", selectedCourier.rates.restOfIndia.toString());
            form.setValue("northEastJKRate", selectedCourier.rates.northEastJK.toString());
            form.setValue("codCharge", selectedCourier.codCharge.toString());
            form.setValue("codPercent", selectedCourier.codPercent.toString());
        } else {
            // Reset form if courier not found
            form.setValue("withinCityRate", "");
            form.setValue("withinStateRate", "");
            form.setValue("metroToMetroRate", "");
            form.setValue("restOfIndiaRate", "");
            form.setValue("northEastJKRate", "");
            form.setValue("codCharge", "");
            form.setValue("codPercent", "");
        }
    };

    const onSubmit = (data: AdminRateUpdateInput) => {
        setIsSubmitting(true);
        
        try {
            // Get current rates or initialize empty array
            const storedRates = localStorage.getItem(`seller_rates_${data.sellerId}`);
            let sellerRates = [];
            
            if (storedRates) {
                sellerRates = JSON.parse(storedRates);
            }
            
            // Find if the courier already exists
            const courierIndex = sellerRates.findIndex((c: any) => c.name === data.courier);
            
            // Create the updated courier object
            const updatedCourier = {
                name: data.courier,
                rates: {
                    withinCity: parseFloat(data.withinCityRate),
                    withinState: parseFloat(data.withinStateRate),
                    metroToMetro: parseFloat(data.metroToMetroRate),
                    restOfIndia: parseFloat(data.restOfIndiaRate),
                    northEastJK: parseFloat(data.northEastJKRate)
                },
                codCharge: parseFloat(data.codCharge),
                codPercent: parseFloat(data.codPercent)
            };
            
            // Update or add the courier
            if (courierIndex !== -1) {
                sellerRates[courierIndex] = updatedCourier;
            } else {
                sellerRates.push(updatedCourier);
            }
            
            // Save to localStorage (in a real app, this would be an API call)
            localStorage.setItem(`seller_rates_${data.sellerId}`, JSON.stringify(sellerRates));
            
            // Update timestamp
            localStorage.setItem(`seller_rates_${data.sellerId}_updated`, new Date().toISOString());
            
            toast.success(`Rate card updated for seller ID: ${data.sellerId}`);
            setCurrentRates(sellerRates);
        } catch (error) {
            console.error("Error updating rates:", error);
            toast.error("Failed to update rate card");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Update Seller Rate Card</h2>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        {/* Seller Selection */}
                        <FormField
                            control={form.control}
                            name="sellerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seller *</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            handleSellerChange(value);
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select seller" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mockSellers.map(seller => (
                                                <SelectItem key={seller.id} value={seller.id}>
                                                    {seller.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedSeller && (
                            <>
                                {/* Courier Selection */}
                                <FormField
                                    control={form.control}
                                    name="courier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Courier *</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleCourierChange(value);
                                                }}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select courier" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableCouriers.map(courier => (
                                                        <SelectItem key={courier} value={courier}>
                                                            {courier}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Within City Rate */}
                                    <FormField
                                        control={form.control}
                                        name="withinCityRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Within City Rate (₹) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Within State Rate */}
                                    <FormField
                                        control={form.control}
                                        name="withinStateRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Within State Rate (₹) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Metro to Metro Rate */}
                                    <FormField
                                        control={form.control}
                                        name="metroToMetroRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Metro to Metro Rate (₹) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Rest of India Rate */}
                                    <FormField
                                        control={form.control}
                                        name="restOfIndiaRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rest of India Rate (₹) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* North East & J&K Rate */}
                                    <FormField
                                        control={form.control}
                                        name="northEastJKRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>North East & J&K Rate (₹) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* COD Charge */}
                                    <FormField
                                        control={form.control}
                                        name="codCharge"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>COD Charge (₹) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* COD Percent */}
                                    <FormField
                                        control={form.control}
                                        name="codPercent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>COD Percent (%) *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button 
                                        type="submit" 
                                        variant="purple" 
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Updating..." : "Update Rate Card"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>
                </Form>
            </div>

            {currentRates && currentRates.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">Current Rate Card for Selected Seller</h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 text-left">Courier</th>
                                    <th className="p-2 text-right">Within City</th>
                                    <th className="p-2 text-right">Within State</th>
                                    <th className="p-2 text-right">Metro-Metro</th>
                                    <th className="p-2 text-right">Rest of India</th>
                                    <th className="p-2 text-right">NE & J&K</th>
                                    <th className="p-2 text-right">COD Charge</th>
                                    <th className="p-2 text-right">COD %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRates.map((courier, index) => (
                                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                                        <td className="p-2 border">{courier.name}</td>
                                        <td className="p-2 border text-right">₹{courier.rates.withinCity.toFixed(2)}</td>
                                        <td className="p-2 border text-right">₹{courier.rates.withinState.toFixed(2)}</td>
                                        <td className="p-2 border text-right">₹{courier.rates.metroToMetro.toFixed(2)}</td>
                                        <td className="p-2 border text-right">₹{courier.rates.restOfIndia.toFixed(2)}</td>
                                        <td className="p-2 border text-right">₹{courier.rates.northEastJK.toFixed(2)}</td>
                                        <td className="p-2 border text-right">₹{courier.codCharge.toFixed(2)}</td>
                                        <td className="p-2 border text-right">{courier.codPercent.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRateUpdate; 