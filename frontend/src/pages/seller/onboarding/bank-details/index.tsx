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
import { sellerBankSchema, type SellerBankInput } from "@/lib/validations/seller";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, UploadIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

const features = [
    "Branded Order Tracking Page",
    "Automated NDR Management",
    "Up To 45% Lesser RTOs",
];

const SellerBankDetailsPage = () => {

    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const form = useForm<SellerBankInput>({
        resolver: zodResolver(sellerBankSchema),
        defaultValues: {
            accountType: "",
            bankName: "",
            accountNumber: "",
            accountHolderName: "",
            ifscCode: "",
            acceptTerms: false,
        },
    });

    const onSubmit = (data: SellerBankInput) => {
        console.log(data);
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
                                alt="Bank Details"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="lg:px-6 w-full order-1 lg:order-2 h-full">
                        <div className="flex-1 mx-auto text-center">
                            <h2 className="text-2xl lg:text-3xl font-semibold mb-2">
                                <span className="text-green-500">B</span>
                                <span>ank</span>
                                {" "}
                                <span className="text-green-500">A</span>
                                <span>ccount</span>
                                {" "}
                                <span className="text-green-500">D</span>
                                <span>etails</span>
                            </h2>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-8">
                                <FormField
                                    control={form.control}
                                    name="accountType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-[#99BCDDB5]">
                                                        <SelectValue placeholder="Savings/Current" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="savings">Savings</SelectItem>
                                                    <SelectItem value="current">Current</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Bank Name"
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
                                    name="accountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Account Number"
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
                                    name="accountHolderName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Holder Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Account Name"
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
                                    name="ifscCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IFSC Code</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="IFSC Code"
                                                    className="bg-[#99BCDDB5]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-2 items-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="bg-[#99BCDDB5] hover:bg-[#99BCDDB5]/50 border-0 w-full"
                                        onClick={() => setIsDialogOpen(true)}
                                    >
                                        <UploadIcon className="h-4 w-4 mr-2" />
                                        Upload Cheque/PassBook/Bank Statement
                                    </Button>
                                </div>

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
                                                    By Clicking Your Create Account, You Agree to RocketryBox's{" "}
                                                    <a href="#" className="text-[#2B4EA8]">Terms & Conditions</a>
                                                    {" "}And{" "}
                                                    <a href="#" className="text-[#2B4EA8]">Privacy Policy</a>
                                                </FormLabel>
                                                <FormMessage />
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-center pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full bg-[#2B4EA8] hover:bg-[#2B4EA8]/90 text-white"
                                        disabled={!form.watch("acceptTerms")}
                                    >
                                        Create Account
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
                title="Upload Bank Document"
                onUpload={handleUpload}
            />
        </div>
    );
};

export default SellerBankDetailsPage; 