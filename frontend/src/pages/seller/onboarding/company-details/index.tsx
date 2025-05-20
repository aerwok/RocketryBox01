import UploadModal from "@/components/shared/upload-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { sellerCompanySchema, type SellerCompanyInput } from "@/lib/validations/seller";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const features = [
    "Branded Order Tracking Page",
    "Automated NDR Management",
    "Up To 45% Lesser RTOs",
];

const SellerCompanyDetailsPage = () => {

    const [uploadType, setUploadType] = useState<"gst" | "pan" | "aadhaar" | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const navigate = useNavigate();

    const form = useForm<SellerCompanyInput>({
        resolver: zodResolver(sellerCompanySchema),
        defaultValues: {
            category: "",
            gstNumber: "",
            panNumber: "",
            aadhaarNumber: "",
            monthlyShipments: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            pincode: "",
            acceptTerms: false,
        },
    });

    const onSubmit = (data: SellerCompanyInput) => {
        try {
            console.log(data);
            // TODO: Implement API call to save company details
            navigate("/seller/onboarding/bank");
        } catch (error) {
            console.error("Error submitting company details:", error);
            toast.error("Failed to save company details. Please try again.");
        }
    };

    const handleUpload = (file: File) => {
        console.log("Uploaded file:", file);
        // Handle file upload logic here
    };

    return (
        <div className="h-[calc(100dvh-4rem)] bg-white">
            <div className="container mx-auto p-4 h-full">
                <div className="grid lg:grid-cols-2 gap-12 place-items-center w-full h-full">
                    {/* Left Side */}
                    <div className="space-y-6 order-2 lg:order-1 flex flex-col justify-start w-full h-full">
                        <div className="space-y-4">
                            <h1 className="text-2xl lg:text-3xl font-semibold text-[#2B4EA8] italic">
                                Transforming Shipping with US!
                            </h1>
                            <div className="space-y-2">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="size-6 rounded-full bg-main flex items-center justify-center">
                                            <ArrowRight className="size-4 text-white" />
                                        </div>
                                        <p className="text-lg">{feature}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-gray-500">
                                Trusted by more than 1 lakh+ brands
                            </p>
                        </div>
                        <div className="relative h-[400px] mr-auto">
                            <img
                                src="/images/seller/details.png"
                                alt="Company Details"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="lg:px-6 w-full order-1 lg:order-2 h-full">
                        <div className="flex-1 mx-auto text-center">
                            <h2 className="text-2xl lg:text-3xl font-semibold mb-8">
                                Get Started With a Free Account
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Upload Documents
                            </p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Select Your Company Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-[#99BCDDB5]">
                                                        <SelectValue placeholder="Select Category From Filter" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ecommerce">
                                                        E-commerce
                                                    </SelectItem>
                                                    <SelectItem value="retail">
                                                        Retail
                                                    </SelectItem>
                                                    <SelectItem value="manufacturing">
                                                        Manufacturing
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="gstNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Enter your GST Number(if yes)</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="GST Number"
                                                            className="bg-[#99BCDDB5]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="bg-[#99BCDDB5] hover:bg-[#99BCDDB5]/50 border-0"
                                                        onClick={() => {
                                                            setUploadType("gst");
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="panNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Enter Pan Card Number</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Pan Card Number"
                                                            className="bg-[#99BCDDB5]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="bg-[#99BCDDB5] hover:bg-[#99BCDDB5]/50 border-0"
                                                        onClick={() => {
                                                            setUploadType("pan");
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="aadhaarNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Enter Aadhaar Card Number</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Aadhaar Card Number"
                                                            className="bg-[#99BCDDB5]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="bg-[#99BCDDB5] hover:bg-[#99BCDDB5]/50 border-0"
                                                        onClick={() => {
                                                            setUploadType("aadhaar");
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="monthlyShipments"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Your Monthly Shipments</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-[#99BCDDB5]">
                                                            <SelectValue placeholder="Choose in the Range Filter" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="0-100">0-100</SelectItem>
                                                        <SelectItem value="101-500">101-500</SelectItem>
                                                        <SelectItem value="501-1000">501-1000</SelectItem>
                                                        <SelectItem value="1001-5000">1001-5000</SelectItem>
                                                        <SelectItem value="5000+">5000+</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="address1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Address1"
                                                        className="bg-[#99BCDDB5]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="address2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>&nbsp;</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Address2"
                                                        className="bg-[#99BCDDB5]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="City"
                                                        className="bg-[#99BCDDB5]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="State"
                                                        className="bg-[#99BCDDB5]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="pincode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pincode</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Pincode"
                                                    className="bg-[#99BCDDB5]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="acceptTerms"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    I have read and accept the privacy policy & conditions of use
                                                </FormLabel>
                                                <FormMessage />
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-center pt-4">
                                    <Button
                                        type="submit"
                                        className="w-1/2 bg-[#2B4EA8] hover:bg-[#2B4EA8]/90 text-white"
                                        disabled={!form.watch("acceptTerms")}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>

            <UploadModal
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title={`Upload ${uploadType?.toUpperCase()} Document`}
                onUpload={handleUpload}
            />
        </div>
    );
};

export default SellerCompanyDetailsPage; 