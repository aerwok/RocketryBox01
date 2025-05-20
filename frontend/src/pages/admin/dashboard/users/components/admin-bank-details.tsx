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
import { BankDetailsInput, bankDetailsSchema } from "@/lib/validations/admin-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { ServiceFactory } from "@/services/service-factory";
import { useEffect } from "react";

interface AdminBankDetailsProps {
    onSave: (message?: string) => void;
}

const AdminBankDetails = ({ onSave }: AdminBankDetailsProps) => {
    const { id } = useParams();
    
    const form = useForm<BankDetailsInput>({
        resolver: zodResolver(bankDetailsSchema),
        defaultValues: {
            bankName: "",
            accountName: "",
            accountNumber: "",
            branchName: "",
            ifscCode: "",
            cancelledChequeImage: undefined
        },
    });

    useEffect(() => {
        const fetchBankDetails = async () => {
            if (!id) return;
            try {
                const response = await ServiceFactory.admin.getTeamMember(id);
                const bankDetails = response.data.bankDetails;
                if (bankDetails) {
                    form.reset(bankDetails);
                }
            } catch (error) {
                console.error('Failed to fetch bank details:', error);
            }
        };
        fetchBankDetails();
    }, [id, form]);

    const onSubmit = async (data: BankDetailsInput) => {
        if (!id) return;
        try {
            await ServiceFactory.admin.updateTeamMember(id, { bankDetails: data });
            onSave("Bank details saved successfully");
        } catch (error) {
            console.error('Failed to save bank details:', error);
        }
    };

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Bank Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter bank name"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="accountName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Account Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter account name"
                                            className="bg-[#F8F7FF]"
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
                                    <FormLabel>
                                        Account Number *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter account number"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="branchName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Branch Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter branch name"
                                            className="bg-[#F8F7FF]"
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
                                    <FormLabel>
                                        IFSC Code *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter IFSC code"
                                            className="bg-[#F8F7FF]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cancelledChequeImage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Cancelled Cheque Image
                                    </FormLabel>
                                    <FormControl>
                                        <div className="flex items-center justify-center w-full">
                                            <label
                                                htmlFor="dropzone-file"
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-[#F8F7FF] hover:bg-gray-100"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                                    <p className="mb-2 text-sm text-gray-500">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        JPG, PNG or PDF (MAX. 2MB)
                                                    </p>
                                                </div>
                                                <input id="dropzone-file" type="file" className="hidden" onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        field.onChange(e.target.files[0]);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" variant="purple">
                            Save
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default AdminBankDetails; 